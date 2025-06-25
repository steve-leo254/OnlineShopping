from pydantic import BaseModel, EmailStr, computed_field
from datetime import datetime
from enum import Enum
from decimal import Decimal
from typing import Dict, Any, List, Optional
from pydantic import Field


class Role(str, Enum):
    SUPERADMIN = "SUPERADMIN"
    ADMIN = "admin"
    CUSTOMER = "customer"


class OrderStatus(str, Enum):
    PENDING = "pending"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    PROCESSING = "processing"


# Pydantic model for the request body
class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus  # Expect "status" in the body, matching frontend


class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class CreateAdminRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Role = Role.ADMIN  # Default to admin, but can be overridden


class LoginUserRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class CategoryBase(BaseModel):
    name: str
    title: Optional[str] = None  # New field
    subtitle: Optional[str] = None  # New field
    description: Optional[str]
    features: Optional[List[str]] = None  # New field


class CategoryResponse(CategoryBase):
    id: int


class SubcategoryBase(BaseModel):
    name: str
    description: Optional[str]
    category_id: int


class SubcategoryResponse(SubcategoryBase):
    id: int

    class Config:
        from_attributes = True


class SubcategoryCreate(SubcategoryBase):
    pass


class SubcategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None


class ProductsBase(BaseModel):
    name: str
    cost: float
    price: float
    original_price: Optional[float] = None  # New field
    stock_quantity: float
    barcode: int
    category_id: Optional[int]
    subcategory_id: Optional[int] = None  # New field
    brand: Optional[str]
    description: Optional[str]
    discount: Optional[float] = 0.0  # New field
    is_new: bool = False  # New field


class ProductImageBase(BaseModel):
    img_url: str


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageResponse(ProductImageBase):
    id: int

    class Config:
        from_attributes = True


class SpecificationBase(BaseModel):
    name: str
    value_type: str
    subcategory_id: int


class SpecificationCreate(SpecificationBase):
    pass


class SpecificationResponse(SpecificationBase):
    id: int
    subcategory_id: int

    class Config:
        from_attributes = True


class ProductSpecificationBase(BaseModel):
    value: str


class ProductSpecificationCreate(ProductSpecificationBase):
    specification_id: int


class ProductSpecificationResponse(ProductSpecificationBase):
    id: int
    product_id: int
    specification_id: int
    specification: Optional[SpecificationResponse]

    class Config:
        from_attributes = True


class FavoriteBase(BaseModel):
    product_id: int


class FavoriteCreate(FavoriteBase):
    user_id: Optional[int] = None


class FavoriteResponse(FavoriteBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    user_id: int
    product_id: int
    order_id: int


class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    product_id: int
    order_id: int
    created_at: datetime
    username: Optional[str] = None

    class Config:
        from_attributes = True


class ProductResponse(ProductsBase):
    id: int
    created_at: datetime
    user_id: int
    category: Optional[CategoryResponse]
    subcategory: Optional[SubcategoryResponse]  # New field
    images: Optional[List[ProductImageResponse]] = []
    product_specifications: Optional[List[ProductSpecificationResponse]] = []
    favorites: Optional[List[FavoriteResponse]] = []
    reviews: Optional[List[ReviewResponse]] = []

    class Config:
        from_attributes = True


class CartItem(BaseModel):
    id: int
    quantity: float


class CartPayload(BaseModel):
    cart: List[CartItem]
    address_id: Optional[int] = None
    delivery_fee: float = 0.0
    transaction_id: Optional[int] = None


class OrderDetailResponse(BaseModel):
    order_detail_id: int
    product_id: Optional[int]
    quantity: float
    total_price: float
    product: Optional[ProductResponse]

    class Config:
        from_attributes = True


class TokenVerifyRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    new_password: str


class TokenVerificationResponse(BaseModel):
    username: str
    tokenverification: str


class EmailVerificationRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    user_id: int


class EmailVerificationResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    user_role: str
    username: str


class UpdateProduct(BaseModel):
    name: Optional[str]
    price: Optional[float]
    cost: Optional[float]
    original_price: Optional[float] = None  # New field
    stock_quantity: Optional[float]
    barcode: Optional[int]
    category_id: Optional[int]
    brand: Optional[str]
    description: Optional[str]
    discount: Optional[float] = None  # New field
    is_new: Optional[bool] = None  # New field


class PaginatedProductResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    limit: int
    pages: int


class ImageResponse(BaseModel):
    message: str
    img_url: str


class AddressBase(BaseModel):
    first_name: str
    last_name: str
    phone_number: str
    address: str
    additional_info: Optional[str]
    region: str
    city: str
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressResponse(AddressBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True  # Enables ORM compatibility for SQLAlchemy models


class OrderResponse(BaseModel):
    order_id: int
    total: float
    datetime: datetime
    status: OrderStatus
    user_id: int
    delivery_fee: float
    completed_at: Optional[datetime]
    order_details: List[OrderDetailResponse]
    address: Optional[AddressResponse]

    class Config:
        from_attributes = True


class PaginatedOrderResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    limit: int
    pages: int


# Pydantic model for user details in the response
class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True


# Extend OrderResponse to exclude order_details and include user
class OrderWithUserResponse(BaseModel):
    order_id: int
    total: float
    datetime: datetime
    status: OrderStatus
    user_id: int
    delivery_fee: float
    completed_at: Optional[datetime]
    address: Optional[AddressResponse]
    user: UserResponse

    class Config:
        from_attributes = True


# Pydantic model for paginated response
class PaginatedOrderWithUserResponse(BaseModel):
    items: List[OrderWithUserResponse]
    total: int
    page: int
    limit: int
    pages: int


# Add these models to your existing pydantic_models.py file


class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    REJECTED = "REJECTED"
    ACCEPTED = "ACCEPTED"


class TransactionRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Transaction amount")
    phone_number: str = Field(
        ...,
        min_length=10,
        max_length=15,
        description="Phone number in format 254XXXXXXXXX",
    )
    order_id: int = Field(..., description="Order ID to link the payment to")


class QueryRequest(BaseModel):
    checkout_request_id: str = Field(..., description="M-Pesa CheckoutRequestID")


class APIResponse(BaseModel):
    status: str
    message: str
    data: Dict[Any, Any] = {}


class TransactionResponse(BaseModel):
    id: int
    _pid: int
    party_a: str
    party_b: str
    account_reference: str
    transaction_category: int
    transaction_type: int
    transaction_channel: int
    transaction_aggregator: int
    transaction_id: Optional[str]
    transaction_amount: Decimal
    transaction_code: Optional[str]
    transaction_timestamp: datetime
    transaction_details: str
    _status: str
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True


# M-Pesa Callback Models
class CallbackMetadataItem(BaseModel):
    name: str
    value: Optional[str] = None


class CallbackMetadata(BaseModel):
    item: List[CallbackMetadataItem]


class StkCallback(BaseModel):
    merchantRequestID: str
    checkoutRequestID: str
    resultCode: int
    resultDesc: str
    callbackMetadata: Optional[CallbackMetadata] = None


class CallbackBody(BaseModel):
    stkCallback: StkCallback


class CallbackRequest(BaseModel):
    body: CallbackBody


class CheckTransactionStatus(BaseModel):
    order_id: str  # Assuming order_id is a string; adjust type if needed


# User management models
class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: Optional[datetime]
    last_login: Optional[datetime]
    status: str

    class Config:
        from_attributes = True


class PaginatedUserResponse(BaseModel):
    items: List[AdminUserResponse]
    total: int
    page: int
    limit: int
    pages: int


# For flat product creation request
class ProductCreateRequest(BaseModel):
    # All product fields (except id, user_id, created_at, etc.)
    name: str
    cost: float
    price: float
    original_price: Optional[float] = None
    stock_quantity: float
    barcode: int
    category_id: Optional[int]
    subcategory_id: Optional[int] = None  # New field
    brand: Optional[str]
    description: Optional[str]
    discount: Optional[float] = 0.0
    is_new: bool = False
    images: Optional[List[ProductImageCreate]] = None
    specifications: Optional[List[ProductSpecificationCreate]] = None


# Banner Pydantic models
class BannerBase(BaseModel):
    image_url: str
    title: Optional[str] = None
    subtitle: Optional[str] = None
    active: bool = True
    type: Optional[str] = None
    category_id: Optional[int] = None  # New field
    button_text: Optional[str] = None  # New field for homepage banners


class BannerCreate(BannerBase):
    pass


class BannerResponse(BannerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
