from datetime import timedelta, datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from starlette import status
from database import db_dependency
from models import Users
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic_models import (
    CreateUserRequest,
    CreateAdminRequest,
    Token,
    TokenVerifyRequest,
    LoginUserRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenVerificationResponse,
    Role
)
from passlib.context import CryptContext
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# Environment variables with secure defaults
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-default-secure-key")
ALGORITHM = "HS256"

# Security contexts
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/login")

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "your-email@gmail.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "your-app-password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "your-email@gmail.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

# Helper functions
def get_user_role(user_role):
    """Normalize role format - handle both enum and string values"""
    return user_role.value if hasattr(user_role, 'value') else user_role

def authenticate_user(email: str, password: str, db: Session):
    """Authenticate user by email and password"""
    user = db.query(Users).filter(Users.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User does not exist")
    if not bcrypt_context.verify(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")
    return user

def create_access_token(username: str, user_id: int, role: str, expires_delta: timedelta):
    """Create JWT access token"""
    encode = {"sub": username, "id": user_id, "role": role}
    expires = datetime.utcnow() + expires_delta
    encode.update({"exp": expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_active_user(token: Annotated[str, Depends(oauth2_bearer)]):
    """Get current active user from JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        role: str = payload.get("role")
        if username is None or user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Could not validate user")
        return {"username": username, "id": user_id, "role": role}
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.DecodeError:
        logger.warning("Invalid token")
        raise HTTPException(status_code=401, detail="Invalid token")

# Centralized role checking dependencies
def require_superadmin(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure only superadmins can access"""
    if current_user["role"] != Role.SUPERADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can access this resource"
        )
    return current_user

def require_admin_or_above(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure only admins or superadmins can access"""
    if current_user["role"] not in [Role.ADMIN.value, Role.SUPERADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to access this resource"
        )
    return current_user

def require_customer_only(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure only customers can access"""
    if current_user["role"] != Role.CUSTOMER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can access this resource"
        )
    return current_user

def require_any_authenticated(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure user is authenticated (any role)"""
    return current_user

# User creation helper
def create_user_model(user_request, role: Role, db: Session):
    """Helper function to create user with proper error handling"""
    existing_user = db.query(Users).filter(
        (Users.email == user_request.email) | (Users.username == user_request.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    try:
        user_model = Users(
            username=user_request.username,
            email=user_request.email,
            hashed_password=bcrypt_context.hash(user_request.password),
            role=role.value
        )
        db.add(user_model)
        db.commit()
        db.refresh(user_model)
        return user_model
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating {role.value}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create {role.value}")

# Registration endpoints
@router.post("/register/customer", status_code=status.HTTP_201_CREATED)
async def register_customer(db: db_dependency, create_user_request: CreateUserRequest):
    """Register a new customer - Public endpoint"""
    logger.info(f"Customer registration attempt for: {create_user_request.username}")
    user = create_user_model(create_user_request, Role.CUSTOMER, db)
    logger.info(f"Customer {create_user_request.username} registered successfully")
    return {"message": "Customer created successfully", "user_id": user.id}

@router.post("/register/superadmin", status_code=status.HTTP_201_CREATED)
async def register_superadmin(db: db_dependency, create_user_request: CreateUserRequest):
    """Register the first superadmin - Only use for initial setup"""
    logger.info(f"Superadmin registration attempt for: {create_user_request.username}")
    
    # Check if superadmin already exists
    existing_superadmin = db.query(Users).filter(Users.role == Role.SUPERADMIN.value).first()
    if existing_superadmin:
        raise HTTPException(status_code=400, detail="Superadmin already exists. Only one superadmin is allowed.")
    
    user = create_user_model(create_user_request, Role.SUPERADMIN, db)
    logger.info(f"Superadmin {create_user_request.username} registered successfully")
    return {"message": "Superadmin created successfully", "user_id": user.id}

@router.post("/superadmin/create-admin", status_code=status.HTTP_201_CREATED)
async def create_admin_by_superadmin(
    db: db_dependency, 
    create_admin_request: CreateAdminRequest,
    current_user: dict = Depends(require_superadmin)
):
    """Create an admin user - only accessible by superadmins"""
    logger.info(f"Superadmin {current_user['username']} creating admin: {create_admin_request.username}")
    user = create_user_model(create_admin_request, Role.ADMIN, db)
    logger.info(f"Admin {create_admin_request.username} created by superadmin {current_user['username']}")
    return {"message": "Admin created successfully", "user_id": user.id}

# Authentication endpoints
@router.post("/login", response_model=Token)
async def login(form_data: LoginUserRequest, db: db_dependency):
    """User login endpoint - Works for all roles"""
    logger.info(f"Login attempt for email: {form_data.email}")
    user = authenticate_user(form_data.email, form_data.password, db)
    
    user_role = get_user_role(user.role)
    token = create_access_token(user.username, user.id, user_role, timedelta(hours=1))
    logger.info(f"User {user.username} logged in successfully with role: {user_role}")
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user_role": user_role,
        "username": user.username
    }

@router.post("/verify-token", response_model=TokenVerificationResponse, status_code=status.HTTP_200_OK)
async def verify_token(request_body: TokenVerifyRequest):
    """Verify JWT token validity"""
    try:
        payload = jwt.decode(request_body.token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_role: str = payload.get("role")
        exp_timestamp = float(payload["exp"])
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        
        if exp_datetime < datetime.utcnow():
            logger.warning("Token expired during verification")
            raise HTTPException(status_code=401, detail="Token expired")
        
        logger.info(f"Token verified for user: {username} with role: {user_role}")
        return {
            "username": username, 
            "tokenverification": "success",
            "role": user_role
        }
    except jwt.DecodeError:
        logger.warning("Invalid token during verification")
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/me", status_code=status.HTTP_200_OK)
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
            "role": user_role
        }
    except Exception as e:
        logger.error(f"Error retrieving user info: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Password reset endpoints
@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(forgot_password_request: ForgotPasswordRequest, db: db_dependency):
    """Send password reset email"""
    email = forgot_password_request.email
    user = db.query(Users).filter(Users.email == email).first()
    if not user:
        logger.warning(f"Password reset requested for non-existent email: {email}")
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user_role = get_user_role(user.role)
    token_expires = timedelta(hours=1)
    reset_token = create_access_token(user.username, user.id, user_role, token_expires)
    
    message = MessageSchema(
        subject="Password Reset Request",
        recipients=[email],
        body=f"Please use the following link to reset your password: "
             f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}",
        subtype="html",
    )
    
    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"Password reset email sent to: {email}")
        return {"message": "Password reset email sent"}
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send password reset email")

@router.post("/reset-password/{token}", status_code=status.HTTP_200_OK)
async def reset_password(token: str, reset_password_request: ResetPasswordRequest, db: db_dependency):
    """Reset user password using token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if user_id is None:
            logger.warning("Invalid reset token")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            logger.warning(f"Password reset attempted for non-existent user ID: {user_id}")
            raise HTTPException(status_code=404, detail="User does not exist")
        
        user.hashed_password = bcrypt_context.hash(reset_password_request.new_password)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Password reset successfully for user: {user.username}")
        return {"message": "Password has been reset successfully"}
    except jwt.ExpiredSignatureError:
        logger.warning("Expired reset token")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.DecodeError:
        logger.warning("Invalid reset token")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        db.rollback()
        logger.error(f"Error resetting password: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

# Helper function for user queries with pagination
def get_paginated_users(db: Session, query, page: int, limit: int, search: Optional[str] = None):
    """Helper function to handle user pagination and search"""
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(Users.username).like(search_term)) |
            (func.lower(Users.email).like(search_term))
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
            "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
            "status": "active"
        }
        user_list.append(user_dict)
    
    pages = (total + limit - 1) // limit
    return {
        "items": user_list,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

# Superadmin-only endpoints
@router.get("/superadmin/users", status_code=status.HTTP_200_OK)
async def get_all_users(
    db: db_dependency,
    current_user: dict = Depends(require_superadmin),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    role_filter: Optional[str] = Query("all", description="Filter by role: admin, customer, superadmin, all")
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
        logger.info(f"Superadmin {current_user['username']} retrieved {len(result['items'])} users (page {page}/{result['pages']})")
        return result
        
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users"
        )

@router.get("/superadmin/users/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_by_id(
    user_id: int,
    db: db_dependency,
    current_user: dict = Depends(require_superadmin)
):
    """Get specific user by ID - accessible by superadmin only"""
    try:
        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        user_role = get_user_role(user.role)
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user_role,
            "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
            "status": "active"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user"
        )

@router.delete("/superadmin/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    db: db_dependency,
    current_user: dict = Depends(require_superadmin)
):
    """Delete a user - accessible by superadmin only"""
    try:
        if current_user["id"] == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        user_role = get_user_role(user.role)
        if user_role == Role.SUPERADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete superadmin accounts"
            )
        
        user_username = user.username
        db.delete(user)
        db.commit()
        
        logger.info(f"{user_role.title()} {user_username} (ID: {user_id}) deleted by superadmin {current_user['username']}")
        return {"message": f"{user_role.title()} {user_username} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )

@router.get("/superadmin/stats", status_code=status.HTTP_200_OK)
async def get_admin_stats(
    db: db_dependency,
    current_user: dict = Depends(require_superadmin)
):
    """Get user statistics for dashboard - accessible by superadmin only"""
    try:
        # Count users by role
        total_superadmins = db.query(Users).filter(Users.role == Role.SUPERADMIN.value).count()
        total_admins = db.query(Users).filter(Users.role == Role.ADMIN.value).count()
        total_customers = db.query(Users).filter(Users.role == Role.CUSTOMER.value).count()
        
        # Count users created this month (if created_at field exists)
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_counts = {"admins": 0, "customers": 0, "superadmins": 0}
        
        if hasattr(Users, 'created_at'):
            for role, key in [(Role.ADMIN.value, "admins"), (Role.CUSTOMER.value, "customers"), (Role.SUPERADMIN.value, "superadmins")]:
                monthly_counts[key] = db.query(Users).filter(
                    Users.role == role,
                    Users.created_at >= current_month_start
                ).count()
        
        logger.info(f"User statistics retrieved by superadmin {current_user['username']}")
        return {
            "total_superadmins": total_superadmins,
            "total_admins": total_admins,
            "total_customers": total_customers,
            "superadmins_this_month": monthly_counts["superadmins"],
            "admins_this_month": monthly_counts["admins"],
            "customers_this_month": monthly_counts["customers"],
            "total_users": total_superadmins + total_admins + total_customers
        }
        
    except Exception as e:
        logger.error(f"Error fetching user stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user statistics"
        )

# Admin-only endpoints
@router.get("/admin/customers", status_code=status.HTTP_200_OK)
async def get_customers_only(
    db: db_dependency,
    current_user: dict = Depends(require_admin_or_above),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None)
):
    """Get customers only - accessible by admins and superadmins"""
    try:
        query = db.query(Users).filter(Users.role == Role.CUSTOMER.value)
        result = get_paginated_users(db, query, page, limit, search)
        logger.info(f"User {current_user['username']} retrieved {len(result['items'])} customers (page {page}/{result['pages']})")
        return result
        
    except Exception as e:
        logger.error(f"Error fetching customers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch customers"
        )

# Customer-specific endpoints
@router.get("/customer/profile", status_code=status.HTTP_200_OK)
async def get_customer_profile(
    db: db_dependency,
    current_user: dict = Depends(require_customer_only)
):
    """Get customer profile - accessible by customers only"""
    try:
        customer = db.query(Users).filter(Users.id == current_user["id"]).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        return {
            "id": customer.id,
            "username": customer.username,
            "email": customer.email,
            "role": "customer",
            "created_at": customer.created_at.isoformat() if hasattr(customer, 'created_at') and customer.created_at else None
        }
    except Exception as e:
        logger.error(f"Error fetching customer profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch customer profile")

# Role checking endpoint
@router.get("/check-role", status_code=status.HTTP_200_OK)
async def check_user_role(current_user: dict = Depends(get_active_user)):
    """Check current user's role and permissions"""
    user_role = current_user["role"]
    return {
        "username": current_user["username"],
        "role": user_role,
        "permissions": {
            "is_superadmin": user_role == Role.SUPERADMIN.value,
            "is_admin": user_role == Role.ADMIN.value,
            "is_customer": user_role == Role.CUSTOMER.value,
            "can_manage_all_users": user_role == Role.SUPERADMIN.value,
            "can_manage_customers": user_role in [Role.ADMIN.value, Role.SUPERADMIN.value],
            "can_create_admins": user_role == Role.SUPERADMIN.value
        }
    }