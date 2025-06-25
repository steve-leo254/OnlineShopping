from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    status,
    UploadFile,
    File,
    Query,
)
from pydantic_models import (
    ProductsBase,
    CartPayload,
    UpdateProduct,
    CategoryBase,
    CategoryResponse,
    ProductResponse,
    OrderResponse,
    Role,
    PaginatedProductResponse,
    ImageResponse,
    AddressCreate,
    AddressResponse,
    PaginatedOrderResponse,
    OrderStatus,
    PaginatedOrderWithUserResponse,
    UpdateOrderStatusRequest,
    CreateUserRequest,
    ProductImageCreate,
    ProductImageResponse,
    SpecificationCreate,
    SpecificationResponse,
    ProductSpecificationCreate,
    ProductSpecificationResponse,
    FavoriteCreate,
    FavoriteResponse,
    ReviewCreate,
    ReviewResponse,
    ProductCreateRequest,
    SubcategoryBase,
    SubcategoryResponse,
    SubcategoryCreate,
    SubcategoryUpdate,
    ReviewBase,
    BannerBase,
    BannerCreate,
    BannerResponse,
)
from typing import Annotated, List, Optional
import models
from database import engine, db_dependency
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
import auth
from auth import (
    get_active_user,
    bcrypt_context,
    create_user_model,
    require_superadmin,
    get_user_role,
    send_order_confirmation_email,
    send_admin_new_order_notification,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv
import os
from decimal import Decimal
from math import ceil
import uuid
from pathlib import Path
from fastapi.staticfiles import StaticFiles
import lnmo
from models import Users

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
app.include_router(auth.router)
app.include_router(lnmo.router)
models.Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


user_dependency = Annotated[dict, Depends(get_active_user)]


def require_customer_only(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure only customers can access"""
    if current_user["role"] != Role.CUSTOMER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can access this resource",
        )
    return current_user


def require_admin(user: user_dependency):
    """Check if user has admin or superadmin role"""
    role = user.get("role")
    print(f"DEBUG: User role from token: '{role}'")  # Add this line
    print(
        f"DEBUG: Role.ADMIN.value: '{Role.ADMIN.value}', Role.SUPERADMIN.value: '{Role.SUPERADMIN.value}'"
    )  # Add this line

    if role not in [Role.ADMIN.value, Role.SUPERADMIN.value]:
        print(f"Access denied for role: {role}")
        raise HTTPException(status_code=403, detail="Admin access required")

    print(f"Access granted for role: {role}")
    return user


# Ensure uploads directory exists
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.post(
    "/upload-image", response_model=ImageResponse, status_code=status.HTTP_201_CREATED
)
async def upload_image(user: user_dependency, file: UploadFile = File(...)):
    require_admin(user)
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed")

        # Validate file size (e.g., max 20MB)
        max_size = 20 * 1024 * 1024  # 20MB in bytes
        content = await file.read()
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail="File size exceeds 20MB limit")

        # Generate unique filename
        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in ["jpg", "jpeg", "png", "gif"]:
            raise HTTPException(status_code=400, detail="Unsupported image format")
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        with file_path.open("wb") as f:
            f.write(content)

        # Generate URL (assuming static file serving or CDN in production)
        img_url = f"/uploads/{unique_filename}"

        logger.info(f"Image uploaded: {unique_filename} by user {user.get('id')}")
        return {"message": "Image uploaded successfully", "img_url": img_url}
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail="Error uploading image")


# Updated endpoint to support category and subcategory filtering
@app.get(
    "/public/products",
    response_model=PaginatedProductResponse,
    status_code=status.HTTP_200_OK,
)
async def browse_products(
    db: db_dependency,
    search: str = None,
    page: int = 1,
    limit: int = 8,
    category_id: int = None,  # Add category_id parameter
    subcategory_id: int = None,  # Add subcategory_id parameter
    ids: str = None,  # Add ids parameter for batch fetch
):
    try:
        # Batch fetch by IDs
        if ids:
            id_list = [int(i) for i in ids.split(",") if i.isdigit()]
            query = db.query(models.Products).filter(models.Products.id.in_(id_list))
            total = query.count()
            products = query.all()
            return {
                "items": products,
                "total": total,
                "page": 1,
                "limit": len(products),
                "pages": 1,
            }
        skip = (page - 1) * limit
        query = db.query(models.Products)

        # Apply search filter
        if search:
            query = query.filter(models.Products.name.ilike(f"%{search}%"))
            logger.info(f"Product search query: {search}")

        # Apply category filter
        if category_id:
            query = query.filter(models.Products.category_id == category_id)
            logger.info(f"Product category filter: {category_id}")

        # Apply subcategory filter
        if subcategory_id:
            query = query.filter(models.Products.subcategory_id == subcategory_id)
            logger.info(f"Product subcategory filter: {subcategory_id}")

        total = query.count()
        products = (
            query.options(
                joinedload(models.Products.category),
                joinedload(models.Products.subcategory),
                joinedload(models.Products.images),
                joinedload(models.Products.product_specifications).joinedload(
                    models.ProductSpecification.specification
                ),
                joinedload(models.Products.favorites),
                joinedload(models.Products.reviews),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

        total_pages = ceil(total / limit)

        return {
            "items": products,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": total_pages,
        }
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching products")


@app.get(
    "/public/products/{product_id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
)
async def get_product_by_id(product_id: int, db: db_dependency):
    try:
        product = (
            db.query(models.Products)
            .options(
                joinedload(models.Products.category),
                joinedload(models.Products.subcategory),
                joinedload(models.Products.images),
                joinedload(models.Products.product_specifications).joinedload(
                    models.ProductSpecification.specification
                ),
                joinedload(models.Products.favorites),
                joinedload(models.Products.reviews).joinedload(models.Review.user),
            )
            .filter(models.Products.id == product_id)
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        return product
    except Exception as e:
        logger.error(f"Error fetching product: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching product")


@app.get(
    "/public/categories",
    response_model=List[CategoryResponse],
    status_code=status.HTTP_200_OK,
)
async def browse_categories(db: db_dependency):
    try:
        categories = db.query(models.Categories).all()
        return categories
    except SQLAlchemyError as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching categories")


@app.get(
    "/public/subcategories",
    response_model=List[SubcategoryResponse],
    status_code=status.HTTP_200_OK,
)
async def browse_subcategories(db: db_dependency, category_id: int = None):
    try:
        query = db.query(models.Subcategory)
        if category_id:
            query = query.filter(models.Subcategory.category_id == category_id)
        subcategories = query.all()
        return subcategories
    except SQLAlchemyError as e:
        logger.error(f"Error fetching subcategories: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching subcategories")


@app.post(
    "/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED
)
async def create_category(
    user: user_dependency, db: db_dependency, category: CategoryBase
):
    require_admin(user)
    try:
        db_category = models.Categories(**category.dict())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/products", status_code=status.HTTP_201_CREATED)
async def add_product(
    user: user_dependency, db: db_dependency, payload: ProductCreateRequest
):
    require_admin(user)
    try:
        # Only use fields that exist in the Products model
        product_fields = payload.dict(exclude={"images", "specifications"})
        add_product = models.Products(**product_fields, user_id=user.get("id"))
        db.add(add_product)
        db.commit()
        db.refresh(add_product)
        # Add images
        if payload.images:
            for img in payload.images:
                db_image = models.ProductImage(
                    product_id=add_product.id, img_url=img.img_url
                )
                db.add(db_image)
        # Add specifications
        if payload.specifications:
            for spec in payload.specifications:
                db_spec = models.ProductSpecification(
                    product_id=add_product.id,
                    specification_id=spec.specification_id,
                    value=spec.value,
                )
                db.add(db_spec)
        db.commit()
        return {"message": "Product added successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error adding product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/update-product/{product_id}", status_code=status.HTTP_200_OK)
async def update_product(
    product_id: int,
    updated_data: UpdateProduct,
    user: user_dependency,
    db: db_dependency,
):
    require_admin(user)
    try:
        product = (
            db.query(models.Products)
            .filter(
                models.Products.id == product_id,
                models.Products.user_id == user.get("id"),
            )
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        update_dict = updated_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(product, key, value)
        db.commit()
        db.refresh(product)
        return {"message": "Product updated successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete-product/{product_id}", status_code=status.HTTP_200_OK)
async def delete_product(product_id: int, db: db_dependency, user: user_dependency):
    require_admin(user)
    try:
        product = (
            db.query(models.Products)
            .filter(
                models.Products.id == product_id,
                models.Products.user_id == user.get("id"),
            )
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Check if product has existing orders
        order_details = (
            db.query(models.OrderDetails)
            .filter(models.OrderDetails.product_id == product_id)
            .first()
        )
        if order_details:
            raise HTTPException(
                status_code=400, detail="Cannot delete product with existing orders"
            )

        # Get all product images and delete them from disk
        product_images = (
            db.query(models.ProductImage)
            .filter(models.ProductImage.product_id == product_id)
            .all()
        )

        for image in product_images:
            # Delete image file from disk if it's a local upload
            if image.img_url and image.img_url.startswith("/uploads/"):
                file_path = UPLOAD_DIR / image.img_url.replace("/uploads/", "")
                try:
                    if file_path.exists():
                        file_path.unlink()
                        logger.info(f"Deleted image file: {file_path}")
                except Exception as e:
                    logger.warning(f"Failed to delete image file {file_path}: {e}")

        # Delete the product (this will cascade delete images, specs, etc.)
        db.delete(product)
        db.commit()

        logger.info(
            f"Product {product_id} and all associated files deleted successfully"
        )
        return {"message": "Product deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error deleting product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Update your create_order function to handle the new transaction relationship:
@app.post("/create_order", status_code=status.HTTP_201_CREATED)
async def create_order(
    db: db_dependency, user: user_dependency, order_payload: CartPayload
):
    try:
        # Validate address if provided
        address_id = order_payload.address_id
        if address_id:
            address = (
                db.query(models.Address)
                .filter(
                    models.Address.id == address_id,
                    models.Address.user_id == user.get("id"),
                )
                .first()
            )
            if not address:
                raise HTTPException(status_code=400, detail="Invalid address ID")

        # Convert delivery fee to Decimal for precise arithmetic
        delivery_fee = Decimal(str(order_payload.delivery_fee))

        # Create new order with default status PENDING
        new_order = models.Orders(
            user_id=user.get("id"),
            total=0,
            address_id=address_id,
            delivery_fee=delivery_fee,
            status=OrderStatus.PENDING,  # Initial status
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        # Process cart items and calculate total cost
        total_cost = Decimal("0")
        for item in order_payload.cart:
            product = db.query(models.Products).filter_by(id=item.id).first()
            if not product:
                db.rollback()
                raise HTTPException(
                    status_code=404, detail=f"Product ID {item.id} not found"
                )
            quantity = Decimal(str(item.quantity))
            if product.stock_quantity < quantity:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for product {product.name}",
                )

            # Create order detail entry
            order_detail = models.OrderDetails(
                order_id=new_order.order_id,
                product_id=product.id,
                quantity=quantity,
                total_price=product.price * quantity,
            )
            total_cost += order_detail.total_price
            product.stock_quantity -= quantity
            db.add(order_detail)

        # Update order total with cart total plus delivery fee
        new_order.total = total_cost + new_order.delivery_fee

        # Handle transaction linking if transaction_id is provided
        if order_payload.transaction_id:
            transaction = (
                db.query(models.Transaction)
                .filter(
                    models.Transaction.id == order_payload.transaction_id,
                    models.Transaction.user_id == user.get("id"),
                    models.Transaction.order_id.is_(
                        None
                    ),  # Ensure transaction isn't already linked
                    models.Transaction._status
                    == models.TransactionStatus.ACCEPTED,  # ACCEPTED status
                )
                .first()
            )
            if not transaction:
                db.rollback()
                raise HTTPException(
                    status_code=400, detail="Invalid or already used transaction"
                )
            if transaction.transaction_amount < new_order.total:
                db.rollback()
                raise HTTPException(
                    status_code=400, detail="Insufficient transaction amount"
                )
            # Link transaction to order and update status
            transaction.order_id = new_order.order_id
            new_order.status = (
                OrderStatus.PROCESSING
            )  # Payment confirmed, ready for processing

        # Commit all changes
        db.commit()

        # Fetch order details for email
        order_details = (
            db.query(models.OrderDetails)
            .filter(models.OrderDetails.order_id == new_order.order_id)
            .all()
        )
        product_list = []
        for detail in order_details:
            product = (
                db.query(models.Products)
                .filter(models.Products.id == detail.product_id)
                .first()
            )
            product_list.append(
                {
                    "name": product.name,
                    "quantity": float(detail.quantity),
                    "unit_price": float(product.price),
                    "total_price": float(detail.total_price),
                }
            )

        # Send order confirmation email
        try:
            user_obj = (
                db.query(models.Users).filter(models.Users.id == user.get("id")).first()
            )
            if user_obj:
                send_order_confirmation_email(
                    user_obj.email,
                    user_obj.username,
                    {
                        "order_id": new_order.order_id,
                        "total": float(new_order.total),
                        "delivery_fee": float(new_order.delivery_fee),
                        "products": product_list,
                        "subtotal": float(total_cost),
                    },
                )
                # Send admin notification
                send_admin_new_order_notification(
                    {
                        "order_id": new_order.order_id,
                        "total": float(new_order.total),
                        "customer_name": user_obj.username,
                    }
                )
        except Exception as e:
            logger.error(f"Failed to send order confirmation email: {str(e)}")

        logger.info(f"Order {new_order.order_id} created for user {user.get('id')}")
        return {
            "message": "Order created successfully",
            "order_id": new_order.order_id,
        }
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        db.rollback()
        logger.error(f"Invalid quantity value: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid quantity value")


# Add a new endpoint to get available transactions for linking to orders
@app.get("/available-transactions", status_code=status.HTTP_200_OK)
async def get_available_transactions(user: user_dependency, db: db_dependency):
    """Get user's accepted transactions that haven't been linked to orders yet"""
    try:
        transactions = (
            db.query(models.Transaction)
            .filter(
                models.Transaction.user_id == user.get("id"),
                models.Transaction._status == models.TransactionStatus.ACCEPTED,
                models.Transaction.order_id.is_(None),  # Not yet linked to any order
            )
            .all()
        )

        return {
            "transactions": [
                {
                    "id": t.id,
                    "amount": float(t.transaction_amount),
                    "transaction_code": t.transaction_code,
                    "transaction_timestamp": t.transaction_timestamp,
                    "account_reference": t.account_reference,
                }
                for t in transactions
            ]
        }
    except SQLAlchemyError as e:
        logger.error(f"Error fetching available transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching transactions")


@app.get(
    "/orders", response_model=PaginatedOrderResponse, status_code=status.HTTP_200_OK
)
async def fetch_orders(
    user: user_dependency,
    db: db_dependency,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[OrderStatus] = None,
):
    try:
        query = db.query(models.Orders).filter(models.Orders.user_id == user.get("id"))
        if status:
            query = query.filter(models.Orders.status == status)

        total = query.count()
        orders = (
            query.options(
                joinedload(models.Orders.order_details).joinedload(
                    models.OrderDetails.product
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
        page = (skip // limit) + 1
        pages = ceil(total / limit) if limit > 0 else 0
        return {
            "items": orders,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
        }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Error fetching orders")


@app.get(
    "/orders/{order_id}", response_model=OrderResponse, status_code=status.HTTP_200_OK
)
async def get_order_by_id(order_id: int, user: user_dependency, db: db_dependency):
    """
    Fetch a specific order by ID for the authenticated user
    """
    try:
        order = (
            db.query(models.Orders)
            .filter(
                models.Orders.order_id == order_id,
            )
            .options(
                joinedload(models.Orders.order_details).joinedload(
                    models.OrderDetails.product
                ),
                joinedload(models.Orders.address),
            )
            .first()
        )

        if not order:
            logger.info(f"Order not found: ID {order_id} for user {user.get('id')}")
            raise HTTPException(status_code=404, detail="Order not found")

        logger.info(f"Retrieved order {order_id} for user {user.get('id')}")
        return order

    except SQLAlchemyError as e:
        logger.error(f"Error fetching order {order_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching order")


# New endpoint to update order status


@app.put("/update-order-status/{order_id}", status_code=status.HTTP_200_OK)
async def update_order_status(
    order_id: int,
    request: UpdateOrderStatusRequest,  # Accept body with "status"
    user: user_dependency,
    db: db_dependency,
):
    """
    Update the status of an order and set completed_at if status is DELIVERED
    """
    try:
        # require_admin(user)  # Only admins can update order status
        order = (
            db.query(models.Orders).filter(models.Orders.order_id == order_id).first()
        )
        if not order:
            logger.info(f"Order not found: ID {order_id}")
            raise HTTPException(status_code=404, detail="Order not found")

        # Update status from the request body
        order.status = request.status

        # Set completed_at if status is DELIVERED
        if request.status == OrderStatus.DELIVERED:
            order.completed_at = func.now()
        elif order.completed_at and request.status != OrderStatus.DELIVERED:
            # Optionally clear completed_at if status changes away from DELIVERED
            order.completed_at = None

        db.commit()
        db.refresh(order)

        logger.info(
            f"Order {order_id} status updated to {request.status} by user {user.get('id')}"
        )
        return {"message": f"Order status updated to {request.status}"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating order status for order {order_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating order status")


# Create Address endpoint
@app.post(
    "/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED
)
async def create_address(
    user: user_dependency, db: db_dependency, address: AddressCreate
):
    try:
        # If setting as default, unset other default addresses for this user
        if address.is_default:
            db.query(models.Address).filter(
                models.Address.user_id == user.get("id"),
                models.Address.is_default == True,
            ).update({"is_default": False})

        db_address = models.Address(**address.dict(), user_id=user.get("id"))
        db.add(db_address)
        db.commit()
        db.refresh(db_address)
        logger.info(
            f"Address created for user {user.get('id')}: Address ID {db_address.id}"
        )
        return db_address
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating address: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating address")


# Get Addresses endpoint
@app.get(
    "/addresses", response_model=List[AddressResponse], status_code=status.HTTP_200_OK
)
async def get_addresses(user: user_dependency, db: db_dependency):
    try:
        addresses = (
            db.query(models.Address)
            .filter(models.Address.user_id == user.get("id"))
            .all()
        )
        if not addresses:
            logger.info(f"No addresses found for user {user.get('id')}")
            return []
        logger.info(f"Retrieved {len(addresses)} addresses for user {user.get('id')}")
        return addresses
    except SQLAlchemyError as e:
        logger.error(f"Error fetching addresses: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching addresses")


@app.delete("/addresses/{address_id}", status_code=status.HTTP_200_OK)
async def delete_address(address_id: int, user: user_dependency, db: db_dependency):
    try:
        address = (
            db.query(models.Address)
            .filter(
                models.Address.id == address_id,
                models.Address.user_id == user.get("id"),
            )
            .first()
        )
        if not address:
            logger.info(f"Address not found: ID {address_id} for user {user.get('id')}")
            raise HTTPException(status_code=404, detail="Address not found")

        # Check if address is used in any orders
        order = (
            db.query(models.Orders)
            .filter(models.Orders.address_id == address_id)
            .first()
        )
        if order:
            logger.info(
                f"Cannot delete address {address_id}: used in order {order.order_id}"
            )
            raise HTTPException(
                status_code=400, detail="Cannot delete address used in orders"
            )

        db.delete(address)
        db.commit()
        logger.info(f"Address {address_id} deleted by user {user.get('id')}")
        return {"message": "Address deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error deleting address {address_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting address")


@app.put(
    "/addresses/{address_id}",
    response_model=AddressResponse,
    status_code=status.HTTP_200_OK,
)
async def update_address(
    address_id: int, address: AddressCreate, user: user_dependency, db: db_dependency
):
    try:
        # Find the address
        db_address = (
            db.query(models.Address)
            .filter(
                models.Address.id == address_id,
                models.Address.user_id == user.get("id"),
            )
            .first()
        )

        if not db_address:
            logger.info(f"Address not found: ID {address_id} for user {user.get('id')}")
            raise HTTPException(status_code=404, detail="Address not found")

        # If setting as default, unset other default addresses for this user
        if address.is_default:
            db.query(models.Address).filter(
                models.Address.user_id == user.get("id"),
                models.Address.id != address_id,
                models.Address.is_default == True,
            ).update({"is_default": False})

        # Update address fields
        for key, value in address.dict().items():
            setattr(db_address, key, value)

        db.commit()
        db.refresh(db_address)
        logger.info(f"Address {address_id} updated by user {user.get('id')}")
        return db_address
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating address {address_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating address")


@app.get(
    "/admin/orders",
    response_model=PaginatedOrderWithUserResponse,
    status_code=status.HTTP_200_OK,
)
async def fetch_all_orders(
    user: user_dependency,
    db: db_dependency,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[OrderStatus] = None,
    search: Optional[str] = None,  # Added search parameter
):
    """
    Fetch all orders with associated user and address details (admin only).
    Supports pagination, optional status filtering, and search by customer name.
    Excludes order_details.
    """
    require_admin(user)
    try:
        # Join with Users and Address to enable filtering on related fields
        query = (
            db.query(models.Orders).join(models.Orders.user).join(models.Orders.address)
        )

        # Filter by status if provided
        if status:
            query = query.filter(models.Orders.status == status)

        # Filter by search term if provided
        if search:
            query = query.filter(
                or_(
                    models.Users.username.ilike(f"%{search}%"),
                    models.Address.first_name.ilike(f"%{search}%"),
                    models.Address.last_name.ilike(f"%{search}%"),
                )
            )

        # Count total matching orders
        total = query.count()

        # Fetch paginated orders with related data
        orders = (
            query.options(
                joinedload(models.Orders.address), joinedload(models.Orders.user)
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

        page = (skip // limit) + 1
        pages = ceil(total / limit) if limit > 0 else 0

        logger.info(
            f"Admin {user.get('id')} fetched {len(orders)} orders (page {page}, limit {limit})"
        )
        return {
            "items": orders,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
        }
    except SQLAlchemyError as e:
        logger.error(f"Error fetching all orders: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching orders")


# Superadmin-only endpoints 1
@app.get("/superadmin/users", status_code=status.HTTP_200_OK)
async def get_all_users(
    db: db_dependency,
    current_user: dict = Depends(require_superadmin),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    role_filter: Optional[str] = Query(
        "all", description="Filter by role: admin, customer, superadmin, all"
    ),
):
    """Get all users with pagination and search - accessible by superadmin only"""
    try:
        query = db.query(Users)

        # Apply role filter
        if role_filter == "admin":
            query = query.filter(Users.role == Role.ADMIN.value)
        elif role_filter == "customer":
            query = query.filter(Users.role == Role.CUSTOMER.value)
        elif role_filter == "superadmin":
            query = query.filter(Users.role == Role.SUPERADMIN.value)

        result = get_paginated_users(db, query, page, limit, search)
        logger.info(
            f"Superadmin {current_user['username']} retrieved {len(result['items'])} users (page {page}/{result['pages']})"
        )
        return result

    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users",
        )


# Helper function for user queries with pagination
def get_paginated_users(
    db: Session, query, page: int, limit: int, search: Optional[str] = None
):
    """Helper function to handle user pagination and search"""
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(Users.username).like(search_term))
            | (func.lower(Users.email).like(search_term))
        )

    total = query.count()
    offset = (page - 1) * limit
    users = query.offset(offset).limit(limit).all()

    user_list = []
    for user in users:
        user_role = get_user_role(user.role)
        user_dict = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user_role,
            "created_at": (
                user.created_at.isoformat()
                if hasattr(user, "created_at") and user.created_at
                else None
            ),
            "status": "active",
        }
        user_list.append(user_dict)

    pages = (total + limit - 1) // limit
    return {
        "items": user_list,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
    }


@app.get("/superadmin/users/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_by_id(
    user_id: int, db: db_dependency, current_user: dict = Depends(require_superadmin)
):
    """Get specific user by ID - accessible by superadmin only"""
    try:
        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        user_role = get_user_role(user.role)
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user_role,
            "created_at": (
                user.created_at.isoformat()
                if hasattr(user, "created_at") and user.created_at
                else None
            ),
            "status": "active",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user",
        )


@app.get("/superadmin/stats", status_code=status.HTTP_200_OK)
async def get_admin_stats(
    db: db_dependency, current_user: dict = Depends(require_superadmin)
):
    """Get user statistics for dashboard - accessible by superadmin only"""
    try:
        # Count users by role
        total_superadmins = (
            db.query(Users).filter(Users.role == Role.SUPERADMIN.value).count()
        )
        total_admins = db.query(Users).filter(Users.role == Role.ADMIN.value).count()
        total_customers = (
            db.query(Users).filter(Users.role == Role.CUSTOMER.value).count()
        )

        # Count users created this month (if created_at field exists)
        current_month_start = datetime.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        monthly_counts = {"admins": 0, "customers": 0, "superadmins": 0}

        if hasattr(Users, "created_at"):
            for role, key in [
                (Role.ADMIN.value, "admins"),
                (Role.CUSTOMER.value, "customers"),
                (Role.SUPERADMIN.value, "superadmins"),
            ]:
                monthly_counts[key] = (
                    db.query(Users)
                    .filter(Users.role == role, Users.created_at >= current_month_start)
                    .count()
                )

        logger.info(
            f"User statistics retrieved by superadmin {current_user['username']}"
        )
        return {
            "total_superadmins": total_superadmins,
            "total_admins": total_admins,
            "total_customers": total_customers,
            "superadmins_this_month": monthly_counts["superadmins"],
            "admins_this_month": monthly_counts["admins"],
            "customers_this_month": monthly_counts["customers"],
            "total_users": total_superadmins + total_admins + total_customers,
        }

    except Exception as e:
        logger.error(f"Error fetching user stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user statistics",
        )


@app.get("/me", status_code=status.HTTP_200_OK)
async def get_current_user(db: db_dependency, user: dict = Depends(get_active_user)):
    """Get current authenticated user information"""
    try:
        current_user = db.query(Users).filter(Users.id == user["id"]).first()
        if not current_user:
            logger.warning(f"User not found in database: {user['id']}")
            raise HTTPException(status_code=404, detail="User not found")

        user_role = get_user_role(current_user.role)
        logger.info(f"Retrieved user info for: {current_user.username}")
        return {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": user_role,
        }
    except Exception as e:
        logger.error(f"Error retrieving user info: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# --- Product Images ---
@app.post("/products/{product_id}/images", response_model=ProductImageResponse)
async def add_product_image(
    product_id: int, image: ProductImageCreate, db: db_dependency, user: user_dependency
):
    require_admin(user)
    db_image = models.ProductImage(product_id=product_id, img_url=image.img_url)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


@app.get("/products/{product_id}/images", response_model=List[ProductImageResponse])
async def get_product_images(product_id: int, db: db_dependency):
    images = (
        db.query(models.ProductImage)
        .filter(models.ProductImage.product_id == product_id)
        .all()
    )
    return images


@app.delete("/products/{product_id}/images/{image_id}", status_code=200)
async def delete_product_image(
    product_id: int, image_id: int, db: db_dependency, user: user_dependency
):
    require_admin(user)
    image = (
        db.query(models.ProductImage)
        .filter(
            models.ProductImage.id == image_id,
            models.ProductImage.product_id == product_id,
        )
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    # Delete the image file from disk if it exists
    img_url = image.img_url
    # Only handle local uploads (not external URLs)
    if img_url and img_url.startswith("/uploads/"):
        file_path = UPLOAD_DIR / img_url.replace("/uploads/", "")
        try:
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted image file: {file_path}")
            else:
                logger.warning(f"Image file not found for deletion: {file_path}")
        except Exception as e:
            logger.error(f"Error deleting image file: {file_path}: {str(e)}")
    db.delete(image)
    db.commit()
    return {"message": "Image deleted"}


# --- Category Specifications ---
@app.post(
    "/subcategories/{subcategory_id}/specifications",
    response_model=SpecificationResponse,
)
async def add_subcategory_specification(
    subcategory_id: int,
    spec: SpecificationCreate,
    db: db_dependency,
    user: user_dependency,
):
    require_admin(user)
    db_spec = models.Specification(
        subcategory_id=subcategory_id, name=spec.name, value_type=spec.value_type
    )
    db.add(db_spec)
    db.commit()
    db.refresh(db_spec)
    return db_spec


@app.get(
    "/subcategories/{subcategory_id}/specifications",
    response_model=List[SpecificationResponse],
)
async def get_subcategory_specifications(subcategory_id: int, db: db_dependency):
    specs = (
        db.query(models.Specification)
        .filter(models.Specification.subcategory_id == subcategory_id)
        .all()
    )
    return specs


@app.delete(
    "/subcategories/{subcategory_id}/specifications/{spec_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_subcategory_specification(
    subcategory_id: int,
    spec_id: int,
    db: db_dependency,
    user: user_dependency,
):
    """Delete a specification from a subcategory"""
    require_admin(user)
    try:
        spec = (
            db.query(models.Specification)
            .filter(
                models.Specification.id == spec_id,
                models.Specification.subcategory_id == subcategory_id,
            )
            .first()
        )
        if not spec:
            raise HTTPException(status_code=404, detail="Specification not found")

        # Check if any products are using this specification
        product_specs_count = (
            db.query(models.ProductSpecification)
            .filter(models.ProductSpecification.specification_id == spec_id)
            .count()
        )
        if product_specs_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete specification. {product_specs_count} products are using this specification.",
            )

        db.delete(spec)
        db.commit()
        return {"message": "Specification deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error deleting specification: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting specification")


@app.put(
    "/subcategories/{subcategory_id}/specifications/{spec_id}",
    response_model=SpecificationResponse,
    status_code=status.HTTP_200_OK,
)
async def update_subcategory_specification(
    subcategory_id: int,
    spec_id: int,
    spec_update: SpecificationCreate,
    db: db_dependency,
    user: user_dependency,
):
    """Update a specification"""
    require_admin(user)
    try:
        spec = (
            db.query(models.Specification)
            .filter(
                models.Specification.id == spec_id,
                models.Specification.subcategory_id == subcategory_id,
            )
            .first()
        )
        if not spec:
            raise HTTPException(status_code=404, detail="Specification not found")

        update_data = spec_update.dict()
        for field, value in update_data.items():
            setattr(spec, field, value)

        db.commit()
        db.refresh(spec)
        return spec
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating specification: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating specification")


# --- Category Management ---
@app.put(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    status_code=status.HTTP_200_OK,
)
async def update_category(
    category_id: int,
    category_update: CategoryBase,
    user: user_dependency,
    db: db_dependency,
):
    """Update a category"""
    require_admin(user)
    try:
        category = (
            db.query(models.Categories)
            .filter(models.Categories.id == category_id)
            .first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        update_data = category_update.dict()
        for field, value in update_data.items():
            setattr(category, field, value)

        db.commit()
        db.refresh(category)
        return category
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating category: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating category")


@app.delete(
    "/categories/{category_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_category(
    category_id: int,
    user: user_dependency,
    db: db_dependency,
):
    """Delete a category"""
    require_admin(user)
    try:
        category = (
            db.query(models.Categories)
            .filter(models.Categories.id == category_id)
            .first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        # Check if any products are using this category
        products_count = (
            db.query(models.Products)
            .filter(models.Products.category_id == category_id)
            .count()
        )
        if products_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete category. {products_count} products are using this category.",
            )

        # The cascade delete will handle subcategories and specifications automatically
        db.delete(category)
        db.commit()
        return {"message": "Category deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error deleting category: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting category")


# --- Product Specification Values ---
@app.post(
    "/products/{product_id}/specifications", response_model=ProductSpecificationResponse
)
async def add_product_specification(
    product_id: int,
    spec: ProductSpecificationCreate,
    db: db_dependency,
    user: user_dependency,
):
    require_admin(user)
    db_spec = models.ProductSpecification(
        product_id=product_id, specification_id=spec.specification_id, value=spec.value
    )
    db.add(db_spec)
    db.commit()
    db.refresh(db_spec)
    return db_spec


@app.get(
    "/products/{product_id}/specifications",
    response_model=List[ProductSpecificationResponse],
)
async def get_product_specifications(product_id: int, db: db_dependency):
    specs = (
        db.query(models.ProductSpecification)
        .filter(models.ProductSpecification.product_id == product_id)
        .all()
    )
    return specs


# --- Favorites (Wishlist) ---
@app.post("/favorites", response_model=FavoriteResponse)
async def add_favorite(
    favorite: FavoriteCreate, db: db_dependency, user: user_dependency
):
    db_fav = models.Favorite(user_id=user.get("id"), product_id=favorite.product_id)
    db.add(db_fav)
    db.commit()
    db.refresh(db_fav)
    return db_fav


@app.get("/favorites", response_model=List[FavoriteResponse])
async def get_favorites(db: db_dependency, user: user_dependency):
    favs = (
        db.query(models.Favorite)
        .filter(models.Favorite.user_id == user.get("id"))
        .all()
    )
    return favs


@app.delete("/favorites/{favorite_id}", status_code=status.HTTP_200_OK)
async def delete_favorite(favorite_id: int, db: db_dependency, user: user_dependency):
    fav = db.query(models.Favorite).filter(models.Favorite.id == favorite_id).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    if fav.user_id != user.get("id"):
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this favorite"
        )
    db.delete(fav)
    db.commit()
    return {"message": "Favorite removed successfully"}


# Utility function to calculate and update product rating from reviews
def update_product_rating(db: Session, product_id: int):
    """Calculate average rating from reviews and update product rating"""
    try:
        # Calculate average rating from all reviews for this product
        avg_rating = (
            db.query(func.avg(models.Review.rating))
            .filter(models.Review.product_id == product_id)
            .scalar()
        )

        # Update product rating
        product = (
            db.query(models.Products).filter(models.Products.id == product_id).first()
        )
        if product:
            product.rating = float(avg_rating) if avg_rating else 0.0
            db.commit()
            return product.rating
    except Exception as e:
        logger.error(f"Error updating product rating: {str(e)}")
        db.rollback()
        return 0.0


@app.post("/reviews", response_model=ReviewResponse)
async def add_review(review: ReviewCreate, db: db_dependency, user: user_dependency):
    try:
        # Check if user has already reviewed this product in this order
        existing_review = (
            db.query(models.Review)
            .filter(
                models.Review.user_id == user.get("id"),
                models.Review.product_id == review.product_id,
                models.Review.order_id == review.order_id,
            )
            .first()
        )

        if existing_review:
            raise HTTPException(
                status_code=400,
                detail="You have already reviewed this product for this order",
            )

        # Create new review
        db_review = models.Review(
            user_id=user.get("id"),
            product_id=review.product_id,
            order_id=review.order_id,
            rating=review.rating,
            comment=review.comment,
        )
        db.add(db_review)
        db.commit()
        db.refresh(db_review)

        # Update product rating
        update_product_rating(db, review.product_id)

        return db_review
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error adding review: {str(e)}")
        raise HTTPException(status_code=500, detail="Error adding review")


@app.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
async def get_product_reviews(product_id: int, db: db_dependency):
    reviews = (
        db.query(models.Review).filter(models.Review.product_id == product_id).all()
    )
    return reviews


@app.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int, review_update: ReviewBase, db: db_dependency, user: user_dependency
):
    """Update a review and recalculate product rating"""
    try:
        # Find the review and ensure it belongs to the user
        review = (
            db.query(models.Review)
            .filter(
                models.Review.id == review_id, models.Review.user_id == user.get("id")
            )
            .first()
        )

        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        # Update review fields
        review.rating = review_update.rating
        review.comment = review_update.comment

        db.commit()
        db.refresh(review)

        # Recalculate product rating
        update_product_rating(db, review.product_id)

        return review
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating review: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating review")


@app.delete("/reviews/{review_id}", status_code=status.HTTP_200_OK)
async def delete_review(review_id: int, db: db_dependency, user: user_dependency):
    """Delete a review and recalculate product rating"""
    try:
        # Find the review and ensure it belongs to the user
        review = (
            db.query(models.Review)
            .filter(
                models.Review.id == review_id, models.Review.user_id == user.get("id")
            )
            .first()
        )

        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        product_id = review.product_id

        # Delete the review
        db.delete(review)
        db.commit()

        # Recalculate product rating
        update_product_rating(db, product_id)

        return {"message": "Review deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error deleting review: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting review")


@app.post(
    "/subcategories",
    response_model=SubcategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_subcategory(
    user: user_dependency, db: db_dependency, subcategory: SubcategoryBase
):
    require_admin(user)
    try:
        db_subcategory = models.Subcategory(**subcategory.dict())
        db.add(db_subcategory)
        db.commit()
        db.refresh(db_subcategory)
        return db_subcategory
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating subcategory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/categories/{category_id}/subcategories",
    response_model=List[SubcategoryResponse],
    status_code=status.HTTP_200_OK,
)
async def get_category_subcategories(category_id: int, db: db_dependency):
    try:
        subcategories = (
            db.query(models.Subcategory)
            .filter(models.Subcategory.category_id == category_id)
            .all()
        )
        return subcategories
    except SQLAlchemyError as e:
        logger.error(f"Error fetching subcategories: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching subcategories")


def format_specifications_to_string(
    product_specifications: List[models.ProductSpecification],
) -> str:
    """
    Convert product specifications to a formatted string for UI display
    """
    if not product_specifications:
        return ""

    spec_parts = []
    for ps in product_specifications:
        if ps.specification and ps.value:
            spec_parts.append(f"{ps.specification.name}: {ps.value}")

    return ", ".join(spec_parts)


# Enhanced subcategory endpoints
@app.get(
    "/subcategories",
    response_model=List[SubcategoryResponse],
    status_code=status.HTTP_200_OK,
)
async def get_all_subcategories(db: db_dependency, category_id: int = None):
    """Get all subcategories, optionally filtered by category"""
    try:
        query = db.query(models.Subcategory)
        if category_id:
            query = query.filter(models.Subcategory.category_id == category_id)

        subcategories = query.all()
        return subcategories
    except SQLAlchemyError as e:
        logger.error(f"Error fetching subcategories: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching subcategories")


@app.get(
    "/subcategories/{subcategory_id}",
    response_model=SubcategoryResponse,
    status_code=status.HTTP_200_OK,
)
async def get_subcategory_by_id(subcategory_id: int, db: db_dependency):
    """Get a specific subcategory by ID"""
    try:
        subcategory = (
            db.query(models.Subcategory)
            .filter(models.Subcategory.id == subcategory_id)
            .first()
        )
        if not subcategory:
            raise HTTPException(status_code=404, detail="Subcategory not found")
        return subcategory
    except SQLAlchemyError as e:
        logger.error(f"Error fetching subcategory: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching subcategory")


@app.put(
    "/subcategories/{subcategory_id}",
    response_model=SubcategoryResponse,
    status_code=status.HTTP_200_OK,
)
async def update_subcategory(
    subcategory_id: int,
    subcategory_update: SubcategoryUpdate,
    user: user_dependency,
    db: db_dependency,
):
    """Update a subcategory"""
    require_admin(user)
    try:
        subcategory = (
            db.query(models.Subcategory)
            .filter(models.Subcategory.id == subcategory_id)
            .first()
        )
        if not subcategory:
            raise HTTPException(status_code=404, detail="Subcategory not found")

        update_data = subcategory_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(subcategory, field, value)

        db.commit()
        db.refresh(subcategory)
        return subcategory
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating subcategory: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating subcategory")


@app.delete(
    "/subcategories/{subcategory_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_subcategory(
    subcategory_id: int,
    user: user_dependency,
    db: db_dependency,
):
    """Delete a subcategory"""
    require_admin(user)
    try:
        subcategory = (
            db.query(models.Subcategory)
            .filter(models.Subcategory.id == subcategory_id)
            .first()
        )
        if not subcategory:
            raise HTTPException(status_code=404, detail="Subcategory not found")

        # Check if any products are using this subcategory
        products_count = (
            db.query(models.Products)
            .filter(models.Products.subcategory_id == subcategory_id)
            .count()
        )
        if products_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete subcategory. {products_count} products are using this subcategory.",
            )

        db.delete(subcategory)
        db.commit()
        return {"message": "Subcategory deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error deleting subcategory: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting subcategory")


@app.get(
    "/public/products/by-subcategory/{subcategory_id}",
    response_model=PaginatedProductResponse,
    status_code=status.HTTP_200_OK,
)
async def get_products_by_subcategory(
    subcategory_id: int,
    db: db_dependency,
    page: int = 1,
    limit: int = 8,
    search: str = None,
):
    """Get products filtered by subcategory"""
    try:
        skip = (page - 1) * limit
        query = db.query(models.Products).filter(
            models.Products.subcategory_id == subcategory_id
        )

        if search:
            query = query.filter(models.Products.name.ilike(f"%{search}%"))

        total = query.count()
        products = query.offset(skip).limit(limit).all()
        total_pages = ceil(total / limit)

        return {
            "items": products,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": total_pages,
        }
    except Exception as e:
        logger.error(f"Error fetching products by subcategory: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching products")


@app.post("/admin/recalculate-product-ratings", status_code=status.HTTP_200_OK)
async def recalculate_all_product_ratings(db: db_dependency, user: user_dependency):
    """Recalculate ratings for all products from their reviews"""
    require_admin(user)
    try:
        # Get all products
        products = db.query(models.Products).all()
        updated_count = 0

        for product in products:
            old_rating = product.rating
            new_rating = update_product_rating(db, product.id)
            if old_rating != new_rating:
                updated_count += 1

        return {
            "message": f"Product ratings recalculated successfully",
            "products_updated": updated_count,
            "total_products": len(products),
        }
    except Exception as e:
        logger.error(f"Error recalculating product ratings: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Error recalculating product ratings"
        )


# --- Banner Endpoints ---
@app.post(
    "/banners", response_model=BannerResponse, status_code=status.HTTP_201_CREATED
)
async def create_banner(banner: BannerCreate, user: user_dependency, db: db_dependency):
    require_admin(user)
    try:
        db_banner = models.Banner(**banner.dict())
        db.add(db_banner)
        db.commit()
        db.refresh(db_banner)
        return db_banner
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating banner: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating banner")


@app.get(
    "/public/banners",
    response_model=List[BannerResponse],
    status_code=status.HTTP_200_OK,
)
async def get_banners(
    db: db_dependency, type: Optional[str] = None, category_id: Optional[int] = None
):
    try:
        query = db.query(models.Banner).filter(models.Banner.active == True)
        if type:
            query = query.filter(models.Banner.type == type)
        if category_id:
            query = query.filter(models.Banner.category_id == category_id)
        banners = query.order_by(models.Banner.created_at.desc()).all()
        return banners
    except SQLAlchemyError as e:
        logger.error(f"Error fetching banners: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching banners")


@app.put("/banners/{banner_id}", response_model=BannerResponse)
async def update_banner(
    banner_id: int, banner: BannerCreate, user: user_dependency, db: db_dependency
):
    require_admin(user)
    try:
        db_banner = (
            db.query(models.Banner).filter(models.Banner.id == banner_id).first()
        )
        if not db_banner:
            raise HTTPException(status_code=404, detail="Banner not found")
        for field, value in banner.dict().items():
            setattr(db_banner, field, value)
        db.commit()
        db.refresh(db_banner)
        return db_banner
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating banner: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating banner")


@app.delete("/banners/{banner_id}", status_code=status.HTTP_200_OK)
async def delete_banner(banner_id: int, user: user_dependency, db: db_dependency):
    require_admin(user)
    try:
        db_banner = (
            db.query(models.Banner).filter(models.Banner.id == banner_id).first()
        )
        if not db_banner:
            raise HTTPException(status_code=404, detail="Banner not found")
        db.delete(db_banner)
        db.commit()
        return {"message": "Banner deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error deleting banner: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting banner")


@app.get(
    "/banners", response_model=List[BannerResponse], status_code=status.HTTP_200_OK
)
async def get_all_banners(user: user_dependency, db: db_dependency):
    require_admin(user)
    try:
        banners = (
            db.query(models.Banner).order_by(models.Banner.created_at.desc()).all()
        )
        return banners
    except SQLAlchemyError as e:
        logger.error(f"Error fetching banners: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching banners")


@app.get("/my-reviews", response_model=List[ReviewResponse])
async def get_my_reviews(db: db_dependency, user: user_dependency):
    """Get all reviews by the authenticated user"""
    reviews = (
        db.query(models.Review).filter(models.Review.user_id == user.get("id")).all()
    )
    return reviews


@app.post("/newsletter/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe_to_newsletter(
    db: db_dependency, email: str = Query(..., description="Email address to subscribe")
):
    """Subscribe an email to the newsletter"""
    try:
        # Check if email already exists
        existing_subscriber = (
            db.query(models.NewsletterSubscriber)
            .filter(models.NewsletterSubscriber.email == email)
            .first()
        )

        if existing_subscriber:
            raise HTTPException(
                status_code=400, detail="Email is already subscribed to the newsletter"
            )

        # Create new subscriber
        new_subscriber = models.NewsletterSubscriber(email=email)
        db.add(new_subscriber)
        db.commit()
        db.refresh(new_subscriber)

        logger.info(f"New newsletter subscription: {email}")
        return {"message": "Successfully subscribed to newsletter", "email": email}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error subscribing to newsletter: {str(e)}")
        raise HTTPException(status_code=500, detail="Error subscribing to newsletter")


@app.patch("/banners/{banner_id}/remove-image", status_code=200)
async def remove_banner_image(banner_id: int, user: user_dependency, db: db_dependency):
    require_admin(user)
    try:
        db_banner = (
            db.query(models.Banner).filter(models.Banner.id == banner_id).first()
        )
        if not db_banner:
            raise HTTPException(status_code=404, detail="Banner not found")
        img_url = db_banner.image_url
        if img_url and img_url.startswith("/uploads/"):
            file_path = UPLOAD_DIR / img_url.replace("/uploads/", "")
            try:
                if file_path.exists():
                    file_path.unlink()
                    logger.info(f"Deleted banner image file: {file_path}")
                else:
                    logger.warning(
                        f"Banner image file not found for deletion: {file_path}"
                    )
            except Exception as e:
                logger.error(f"Error deleting banner image file: {file_path}: {str(e)}")
        db_banner.image_url = ""
        db.commit()
        db.refresh(db_banner)
        return {"message": "Banner image removed", "banner": db_banner.id}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error removing banner image: {str(e)}")
        raise HTTPException(status_code=500, detail="Error removing banner image")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
