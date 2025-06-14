from datetime import timedelta, datetime
from typing import Annotated 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from starlette import status
from database import db_dependency
from models import Users
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic_models import (
    Token,
    TokenVerifyRequest,
    LoginUserRequest,
    CreateUserRequest,
    CreateAdminRequest,
    TokenVerificationResponse,
    Role
)
# from main import create_user_model
from passlib.context import CryptContext
from fastapi_mail import   ConnectionConfig
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




def require_any_authenticated(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure user is authenticated (any role)"""
    return current_user


def get_user_role(user_role):
    """Normalize role format - handle both enum and string values"""
    return user_role.value if hasattr(user_role, 'value') else user_role



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
