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

# Email configuration - using environment variables
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

# Authentication helper functions
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

# Role-based dependency functions
def require_superadmin(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure only superadmins can access these endpoints"""
    if current_user["role"] != Role.SUPERADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can access this resource"
        )
    return current_user

def require_admin_or_above(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure only admins or superadmins can access these endpoints"""
    if current_user["role"] not in [Role.ADMIN.value, Role.SUPERADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to access this resource"
        )
    return current_user

def require_any_authenticated(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure user is authenticated (any role)"""
    return current_user

# Registration endpoints
@router.post("/register/customer", status_code=status.HTTP_201_CREATED)
async def register_customer(db: db_dependency, create_user_request: CreateUserRequest):
    """Register a new customer"""
    logger.info(f"Customer registration attempt for: {create_user_request.username}")
    
    existing_user = db.query(Users).filter(
        (Users.email == create_user_request.email) | (Users.username == create_user_request.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    try:
        create_user_model = Users(
            username=create_user_request.username,
            email=create_user_request.email,
            hashed_password=bcrypt_context.hash(create_user_request.password),
            role=Role.CUSTOMER.value  # Consistent use of .value
        )
        db.add(create_user_model)
        db.commit()
        db.refresh(create_user_model)
        logger.info(f"Customer {create_user_request.username} registered successfully")
        return {"message": "Customer created successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating customer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create customer")

@router.post("/register/superadmin", status_code=status.HTTP_201_CREATED)
async def register_superadmin(db: db_dependency, create_user_request: CreateUserRequest):
    """Register a superadmin - typically only used for initial setup"""
    logger.info(f"Superadmin registration attempt for: {create_user_request.username}")
    
    # Check if superadmin already exists
    existing_superadmin = db.query(Users).filter(Users.role == Role.SUPERADMIN.value).first()
    if existing_superadmin:
        raise HTTPException(status_code=400, detail="Superadmin already exists")
    
    existing_user = db.query(Users).filter(
        (Users.email == create_user_request.email) | (Users.username == create_user_request.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    try:
        create_user_model = Users(
            username=create_user_request.username,
            email=create_user_request.email,
            hashed_password=bcrypt_context.hash(create_user_request.password),
            role=Role.SUPERADMIN.value
        )
        db.add(create_user_model)
        db.commit()
        db.refresh(create_user_model)
        logger.info(f"Superadmin {create_user_request.username} registered successfully")
        return {"message": "Superadmin created successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating superadmin: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create superadmin")

@router.post("/admin/create-admin", status_code=status.HTTP_201_CREATED)
async def create_admin_by_superadmin(
    db: db_dependency, 
    create_admin_request: CreateAdminRequest,
    current_user: dict = Depends(require_superadmin)
):
    """Create an admin user - only accessible by superadmins"""
    logger.info(f"Superadmin {current_user['username']} creating admin: {create_admin_request.username}")
    
    existing_user = db.query(Users).filter(
        (Users.email == create_admin_request.email) | (Users.username == create_admin_request.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    try:
        create_user_model = Users(
            username=create_admin_request.username,
            email=create_admin_request.email,
            hashed_password=bcrypt_context.hash(create_admin_request.password),
            role=Role.ADMIN.value
        )
        db.add(create_user_model)
        db.commit()
        db.refresh(create_user_model)
        logger.info(f"Admin {create_admin_request.username} created by superadmin {current_user['username']}")
        return {"message": "Admin created successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating admin: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create admin")

# Authentication endpoints
@router.post("/login", response_model=Token)
async def login(form_data: LoginUserRequest, db: db_dependency):
    """User login endpoint"""
    logger.info(f"Login attempt for email: {form_data.email}")
    user = authenticate_user(form_data.email, form_data.password, db)
    token = create_access_token(user.username, user.id, user.role.value, timedelta(hours=1))
    logger.info(f"User {user.username} logged in successfully with role: {user.role.value}")
    return {"access_token": token, "token_type": "bearer"}

@router.post("/verify-token", response_model=TokenVerificationResponse, status_code=status.HTTP_200_OK)
async def verify_token(request_body: TokenVerifyRequest):
    """Verify JWT token validity"""
    try:
        payload = jwt.decode(request_body.token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        exp_timestamp = float(payload["exp"])
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        if exp_datetime < datetime.utcnow():
            logger.warning("Token expired during verification")
            raise HTTPException(status_code=401, detail="Token expired")
        logger.info(f"Token verified for user: {username}")
        return {"username": username, "tokenverification": "success"}
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
        
        logger.info(f"Retrieved user info for: {current_user.username}")
        return {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role.value
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
    
    token_expires = timedelta(hours=1)
    reset_token = create_access_token(user.username, user.id, user.role.value, token_expires)
    
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

# Admin management endpoints (accessible by superadmin only)
@router.get("/admin/users", status_code=status.HTTP_200_OK)
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
        # Base query
        query = db.query(Users)
        
        # Apply role filter
        if role_filter == "admin":
            query = query.filter(Users.role == Role.ADMIN.value)
        elif role_filter == "customer":
            query = query.filter(Users.role == Role.CUSTOMER.value)
        elif role_filter == "superadmin":
            query = query.filter(Users.role == Role.SUPERADMIN.value)
        # "all" shows all users
        
        # Add search filter if provided
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                (func.lower(Users.username).like(search_term)) |
                (func.lower(Users.email).like(search_term))
            )
        
        # Get total count for pagination
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        users = query.offset(offset).limit(limit).all()
        
        # Convert to response format
        user_list = []
        for user in users:
            user_dict = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role.value,
                "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
                "status": "active"
            }
            user_list.append(user_dict)
        
        # Calculate pagination info
        pages = (total + limit - 1) // limit
        
        logger.info(f"Superadmin {current_user['username']} retrieved {len(user_list)} users (page {page}/{pages})")
        
        return {
            "items": user_list,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages
        }
        
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users"
        )

@router.get("/admin/users/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_by_id(
    user_id: int,
    db: db_dependency,
    current_user: dict = Depends(require_superadmin)
):
    """Get specific user by ID - accessible by superadmin only"""
    try:
        user = db.query(Users).filter(Users.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
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

@router.delete("/admin/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    db: db_dependency,
    current_user: dict = Depends(require_superadmin)
):
    """Delete a user - accessible by superadmin only"""
    try:
        # Prevent self-deletion
        if current_user["id"] == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        user = db.query(Users).filter(Users.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent deletion of other superadmins
        if user.role.value == Role.SUPERADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete superadmin accounts"
            )
        
        # Store user info for logging before deletion
        user_username = user.username
        user_role = user.role.value
        
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

@router.get("/admin/stats", status_code=status.HTTP_200_OK)
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
        
        # Count users created this month
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        admins_this_month = db.query(Users).filter(
            Users.role == Role.ADMIN.value,
            Users.created_at >= current_month_start
        ).count() if hasattr(Users, 'created_at') else 0
        
        customers_this_month = db.query(Users).filter(
            Users.role == Role.CUSTOMER.value,
            Users.created_at >= current_month_start
        ).count() if hasattr(Users, 'created_at') else 0
        
        logger.info(f"User statistics retrieved by superadmin {current_user['username']}")
        
        return {
            "total_superadmins": total_superadmins,
            "total_admins": total_admins,
            "total_customers": total_customers,
            "admins_this_month": admins_this_month,
            "customers_this_month": customers_this_month,
            "total_users": total_superadmins + total_admins + total_customers
        }
        
    except Exception as e:
        logger.error(f"Error fetching user stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user statistics"
        )