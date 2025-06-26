from sqlalchemy import (
    Column,
    Integer,
    String,
    func,
    DateTime,
    Numeric,
    ForeignKey,
    Enum,
    Boolean,
    Text,
    Table,
)
from database import Base
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from sqlalchemy.dialects.mysql import JSON


class TransactionStatus(enum.Enum):
    PENDING = 0
    PROCESSING = 1
    PROCESSED = 2
    REJECTED = 3
    ACCEPTED = 4


class Role(enum.Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"
    SUPERADMIN = "SUPERADMIN"


class OrderStatus(enum.Enum):
    PENDING = "pending"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    PROCESSING = "processing"


class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(200), unique=True, index=True)
    hashed_password = Column(String(256))
    role = Column(Enum(Role), default=Role.CUSTOMER, nullable=False)
    created_at = Column(DateTime, default=func.now())
    # Email verification fields
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(255), nullable=True)
    verification_expires = Column(DateTime, nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    orders = relationship("Orders", back_populates="user")
    products = relationship("Products", back_populates="user")
    addresses = relationship("Address", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    favorites = relationship(
        "Favorite", back_populates="user", cascade="all, delete-orphan"
    )
    reviews = relationship(
        "Review", back_populates="user", cascade="all, delete-orphan"
    )


class Categories(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    title = Column(String(100), nullable=True)
    subtitle = Column(String(200), nullable=True)
    description = Column(Text)
    features = Column(JSON, nullable=True)
    products = relationship("Products", back_populates="category")
    subcategories = relationship(
        "Subcategory", back_populates="category", cascade="all, delete-orphan"
    )


class Subcategory(Base):
    __tablename__ = "subcategories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(200))
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    category = relationship("Categories", back_populates="subcategories")
    products = relationship("Products", back_populates="subcategory")
    specifications = relationship(
        "Specification", back_populates="subcategory", cascade="all, delete-orphan"
    )


class Products(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    cost = Column(Numeric(precision=14, scale=2), nullable=False)
    price = Column(Numeric(precision=14, scale=2), nullable=False)
    original_price = Column(Numeric(precision=14, scale=2), nullable=True)  # New field
    stock_quantity = Column(Numeric(precision=14, scale=2), nullable=False)
    description = Column(Text, nullable=False)
    rating = Column(
        Numeric(precision=3, scale=2), nullable=True, default=0.0
    )  # New field (0.00 to 5.00)
    discount = Column(
        Numeric(precision=5, scale=2), nullable=True, default=0.0
    )  # New field - discount percentage
    is_new = Column(Boolean, default=True, nullable=False)  # New field
    created_at = Column(DateTime, default=func.now())
    barcode = Column(Numeric(precision=12), unique=True)
    brand = Column(String(100), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    subcategory_id = Column(
        Integer, ForeignKey("subcategories.id"), nullable=True
    )  # New field
    user = relationship("Users", back_populates="products")
    category = relationship("Categories", back_populates="products")
    subcategory = relationship(
        "Subcategory", back_populates="products"
    )  # New relationship
    order_details = relationship("OrderDetails", back_populates="product")
    images = relationship(
        "ProductImage", back_populates="product", cascade="all, delete-orphan"
    )
    product_specifications = relationship(
        "ProductSpecification", back_populates="product", cascade="all, delete-orphan"
    )
    favorites = relationship(
        "Favorite", back_populates="product", cascade="all, delete-orphan"
    )
    reviews = relationship(
        "Review", back_populates="product", cascade="all, delete-orphan"
    )


class Orders(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    total = Column(Numeric(precision=14, scale=2))
    datetime = Column(DateTime, default=func.now(), index=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    address_id = Column(Integer, ForeignKey("addresses.id"), nullable=True)
    delivery_fee = Column(Numeric(precision=14, scale=2), nullable=False, default=0)
    completed_at = Column(DateTime, nullable=True)
    user = relationship("Users", back_populates="orders")
    order_details = relationship("OrderDetails", back_populates="order")
    address = relationship("Address")
    transactions = relationship("Transaction", back_populates="order")


class OrderDetails(Base):
    __tablename__ = "order_details"
    order_detail_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Numeric(precision=15, scale=2))
    total_price = Column(Numeric(precision=15, scale=2))
    product = relationship("Products", back_populates="order_details")
    order = relationship("Orders", back_populates="order_details")


class Address(Base):
    __tablename__ = "addresses"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    address = Column(String(100), nullable=False)
    additional_info = Column(String(255), nullable=True)
    region = Column(String(100), nullable=True)  # New field for Regions
    city = Column(String(100), nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())

    user = relationship("Users", back_populates="addresses")
    orders = relationship("Orders", back_populates="address")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    _pid = Column(Integer, ForeignKey("orders.order_id"), nullable=False, index=True)
    party_a = Column(String(100), nullable=False)
    party_b = Column(String(100), nullable=False)
    account_reference = Column(String(150), nullable=False)
    transaction_category = Column(Integer, nullable=False)
    transaction_type = Column(Integer, nullable=False)
    transaction_channel = Column(Integer, nullable=False)
    transaction_aggregator = Column(Integer, nullable=False)
    transaction_id = Column(String(100), unique=True, nullable=True, index=True)
    transaction_amount = Column(Numeric(10, 2), nullable=False)
    transaction_code = Column(String(100), unique=True, nullable=True)
    transaction_timestamp = Column(DateTime, default=datetime.utcnow)
    transaction_details = Column(Text, nullable=False)
    _feedback = Column(JSON, nullable=False)
    _status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("Users", back_populates="transactions")
    order = relationship("Orders", back_populates="transactions")


# New table for multiple product images
class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    img_url = Column(String(200), nullable=False)
    product = relationship("Products", back_populates="images")


# New table for specifications linked to categories
class Specification(Base):
    __tablename__ = "specifications"
    id = Column(Integer, primary_key=True, index=True)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=False)
    name = Column(String(100), nullable=False)
    value_type = Column(String(50), nullable=False)
    subcategory = relationship("Subcategory", back_populates="specifications")
    product_specifications = relationship(
        "ProductSpecification", back_populates="specification"
    )


# New table for product-specific specification values
class ProductSpecification(Base):
    __tablename__ = "product_specifications"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    specification_id = Column(Integer, ForeignKey("specifications.id"), nullable=False)
    value = Column(String(255), nullable=False)
    product = relationship("Products", back_populates="product_specifications")
    specification = relationship(
        "Specification", back_populates="product_specifications"
    )


# New table for favorites (wishlist)
class Favorite(Base):
    __tablename__ = "favorites"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user = relationship("Users", back_populates="favorites")
    product = relationship("Products", back_populates="favorites")


# New table for reviews
class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("Users", back_populates="reviews")
    product = relationship("Products", back_populates="reviews")


# New table for global banners
class Banner(Base):
    __tablename__ = "banners"
    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(255), nullable=False)
    title = Column(String(100), nullable=True)
    subtitle = Column(String(255), nullable=True)
    active = Column(Boolean, default=True)
    type = Column(String(50), nullable=True)  # e.g., "homepage", "category"
    created_at = Column(DateTime, default=func.now())
    category_id = Column(
        Integer, ForeignKey("categories.id"), nullable=True
    )  # New field
    category = relationship("Categories", backref="banners")
    button_text = Column(String(100), nullable=True)  # New field for homepage banners


# Newsletter Subscribers table
class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
