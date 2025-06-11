from datetime import timedelta, datetime
from typing import Annotated ,Optional
from fastapi import APIRouter, Depends, HTTPException ,Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from starlette import status
from database import db_dependency
from models import Users
from starlette import status

from fastapi.security import  OAuth2PasswordBearer
import jwt
from pydantic_models import (
    CreateUserRequest,
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
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-default-secure-key")
ALGORITHM = "HS256"
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/login")

conf = ConnectionConfig(
    MAIL_USERNAME="ericoochieng456@gmail.com",
    MAIL_PASSWORD="dhqf lxgw zlaw bwdj",
    MAIL_FROM="ericoochieng456@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

@router.post("/register/customer", status_code=status.HTTP_201_CREATED)
async def register_customer(db: db_dependency, create_user_request: CreateUserRequest):
    logger.info(f"Customer registration payload: {create_user_request}")
    existing_user = db.query(Users).filter(
        (Users.email == create_user_request.email) | (Users.username == create_user_request.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    create_user_model = Users(
        username=create_user_request.username,
        email=create_user_request.email,
        hashed_password=bcrypt_context.hash(create_user_request.password),
        role="customer"
    )
    db.add(create_user_model)
    db.commit()
    db.refresh(create_user_model)
    logger.info(f"Customer {create_user_request.username} registered successfully")
    return {"message": "Customer created successfully"}

@router.post("/register/admin", status_code=status.HTTP_201_CREATED)
async def register_admin(db: db_dependency, create_user_request: CreateUserRequest):
    logger.info(f"Admin registration payload: {create_user_request}")
    existing_user = db.query(Users).filter(
        (Users.email == create_user_request.email) | (Users.username == create_user_request.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    create_user_model = Users(
        username=create_user_request.username,
        email=create_user_request.email,
        hashed_password=bcrypt_context.hash(create_user_request.password),
        role="admin"
    )
    db.add(create_user_model)
    db.commit()
    db.refresh(create_user_model)
    logger.info(f"Admin {create_user_request.username} registered successfully")
    return {"message": "Admin created successfully"}


def authenticate_user(email: str, password: str, db: Session):
    user = db.query(Users).filter(Users.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User does not exist")
    if not bcrypt_context.verify(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")
    return user

def create_access_token(username: str, user_id: int, role: str, expires_delta: timedelta):
    encode = {"sub": username, "id": user_id, "role": role}
    expires = datetime.utcnow() + expires_delta
    encode.update({"exp": expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login", response_model=Token)
async def login(form_data: LoginUserRequest, db: db_dependency):
    logger.info(f"Login attempt for email: {form_data.email}")
    user = authenticate_user(form_data.email, form_data.password, db)
    token = create_access_token(user.username, user.id, user.role.value, timedelta(hours=1))
    logger.info(f"User {user.username} logged in successfully")
    return {"access_token": token, "token_type": "bearer"}

async def get_active_user(token: Annotated[str, Depends(oauth2_bearer)]):
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

@router.post("/verify-token", response_model=TokenVerificationResponse, status_code=status.HTTP_200_OK)
async def verify_token(request_body: TokenVerifyRequest):
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

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(forgot_password_request: ForgotPasswordRequest, db: db_dependency):
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
             f"http://localhost:3000/reset-password?token={reset_token}",
        subtype="html",
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    logger.info(f"Password reset email sent to: {email}")
    return {"message": "Password reset email sent"}
    

@router.post("/reset-password/{token}", status_code=status.HTTP_200_OK)
async def reset_password(token: str, reset_password_request: ResetPasswordRequest, db: db_dependency):
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
    


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_user(db: db_dependency, user: dict = Depends(get_active_user)):
    """Get current authenticated user information"""
    try:
        # Get the user from database using the ID from the token
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
    



def require_super_admin(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure only super admins can access these endpoints"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can access this resource"
        )
    return current_user

@router.get("/users", status_code=status.HTTP_200_OK)
async def get_all_admins(
    db: db_dependency,
    current_user: dict = Depends(require_super_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None)
):
    """Get all admin users with pagination and search"""
    try:
        # Base query for admin users only
        query = db.query(Users).filter(Users.role == Role.ADMIN)
        
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
        admins = query.offset(offset).limit(limit).all()
        
        # Convert to response format
        admin_list = []
        for admin in admins:
            admin_dict = {
                "id": admin.id,
                "username": admin.username,
                "email": admin.email,
                "role": admin.role.value,
                "created_at": admin.created_at.isoformat() if admin.created_at else None,
                "last_login": admin.last_login.isoformat() if hasattr(admin, 'last_login') and admin.last_login else None,
                "status": "active"  # Add status logic if you have it in your model
            }
            admin_list.append(admin_dict)
        
        # Calculate pagination info
        pages = (total + limit - 1) // limit
        
        logger.info(f"Retrieved {len(admin_list)} admins (page {page}/{pages})")
        
        return {
            "items": admin_list,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages
        }
        
    except Exception as e:
        logger.error(f"Error fetching admins: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch admin users"
        )

@router.get("/users/{admin_id}", status_code=status.HTTP_200_OK)
async def get_admin_by_id(
    admin_id: int,
    db: db_dependency,
    current_user: dict = Depends(require_super_admin)
):
    """Get specific admin by ID"""
    try:
        admin = db.query(Users).filter(
            Users.id == admin_id,
            Users.role == Role.ADMIN
        ).first()
        
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found"
            )
        
        return {
            "id": admin.id,
            "username": admin.username,
            "email": admin.email,
            "role": admin.role.value,
            "created_at": admin.created_at.isoformat() if admin.created_at else None,
            "last_login": admin.last_login.isoformat() if hasattr(admin, 'last_login') and admin.last_login else None,
            "status": "active"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching admin {admin_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch admin"
        )

@router.delete("/users/{admin_id}", status_code=status.HTTP_200_OK)
async def delete_admin(
    admin_id: int,
    db: db_dependency,
    current_user: dict = Depends(require_super_admin)
):
    """Delete an admin user"""
    try:
        # Prevent self-deletion
        if current_user["id"] == admin_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        admin = db.query(Users).filter(
            Users.id == admin_id,
            Users.role == Role.ADMIN
        ).first()
        
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found"
            )
        
        # Store admin info for logging before deletion
        admin_username = admin.username
        
        db.delete(admin)
        db.commit()
        
        logger.info(f"Admin {admin_username} (ID: {admin_id}) deleted by {current_user['username']}")
        
        return {"message": f"Admin {admin_username} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting admin {admin_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete admin"
        )

@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_admin_stats(
    db: db_dependency,
    current_user: dict = Depends(require_super_admin)
):
    """Get admin statistics for dashboard"""
    try:
        # Count total admins
        total_admins = db.query(Users).filter(Users.role == Role.ADMIN).count()
        
        # Count active admins (assuming all are active for now)
        active_admins = total_admins
        
        # Count admins created this month
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        admins_this_month = db.query(Users).filter(
            Users.role == Role.ADMIN,
            Users.created_at >= current_month_start
        ).count()
        
        # Count total customers for additional context
        total_customers = db.query(Users).filter(Users.role == Role.CUSTOMER).count()
        
        logger.info(f"Admin statistics retrieved by {current_user['username']}")
        
        return {
            "total_admins": total_admins,
            "active_admins": active_admins,
            "admins_this_month": admins_this_month,
            "total_customers": total_customers
        }
        
    except Exception as e:
        logger.error(f"Error fetching admin stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch admin statistics"
        )

@router.put("/users/{admin_id}/status", status_code=status.HTTP_200_OK)
async def update_admin_status(
    admin_id: int,
    db: db_dependency,
    current_user: dict = Depends(require_super_admin)
):
    """Toggle admin status (if you implement status field in future)"""
    try:
        admin = db.query(Users).filter(
            Users.id == admin_id,
            Users.role == Role.ADMIN
        ).first()
        
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found"
            )
        
        # For now, just return success since status field doesn't exist yet
        # In future, you can add status field to Users model and toggle it here
        
        logger.info(f"Admin {admin.username} status updated by {current_user['username']}")
        
        return {"message": "Admin status updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating admin status {admin_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update admin status"
        )