from datetime import timedelta, datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Body, Path
from sqlalchemy.orm import Session
from sqlalchemy import func
from starlette import status
from database import db_dependency, get_db
from models import Users, Orders
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic_models import (
    Token,
    TokenVerifyRequest,
    LoginUserRequest,
    CreateUserRequest,
    CreateAdminRequest,
    TokenVerificationResponse,
    Role,
    EmailVerificationRequest,
    ResendVerificationRequest,
    EmailVerificationResponse,
)

# from main import create_user_model
from passlib.context import CryptContext
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import os
from dotenv import load_dotenv
import logging
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# Environment variables with secure defaults
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-default-secure-key")
ALGORITHM = "HS256"

# Frontend base URL for email links
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")

# Security contexts
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/login")

# Email configuration
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "your-email@gmail.com")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "your-app-password")
MAIL_FROM = os.getenv("MAIL_FROM", "your-email@gmail.com")

# Handle MAIL_PORT with better error handling
try:
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587").strip())
except (ValueError, AttributeError):
    MAIL_PORT = 587  # Default fallback

MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")

# Email configuration for FastAPI-Mail
conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=MAIL_PORT,
    MAIL_SERVER=MAIL_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


# Helper functions
def generate_verification_token():
    """Generate a secure verification token"""
    return secrets.token_urlsafe(32)


def send_verification_email(email: str, username: str, token: str):
    """Send verification email using SMTP"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg["From"] = MAIL_FROM
        msg["To"] = email
        msg["Subject"] = "Verify Your FlowTech Account"

        # Create HTML body
        verification_url = f"{FRONTEND_BASE_URL}/verify-email?token={token}"
        html_body = f"""
        <html>
        <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">FlowTech</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333;">Welcome to FlowTech, {username}!</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Thank you for registering with FlowTech. To complete your registration and activate your account, 
                        please click the verification button below:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_url}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 5px; 
                                  display: inline-block; 
                                  font-weight: bold;">
                            Verify My Account
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        If the button doesn't work, you can copy and paste this link into your browser:<br>
                        <a href="{verification_url}" style="color: #667eea;">{verification_url}</a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        This verification link will expire in 24 hours. If you didn't create an account with FlowTech, 
                        please ignore this email.
                    </p>
                </div>
                <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
                    <p>© 2024 FlowTech. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html"))

        # Send email
        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(MAIL_FROM, email, text)
        server.quit()

        logger.info(f"Verification email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        return False


def send_order_confirmation_email(email: str, username: str, order: dict):
    try:
        msg = MIMEMultipart()
        msg["From"] = MAIL_FROM
        msg["To"] = email
        msg["Subject"] = "Your FlowTech Order Confirmation"

        # Build product list HTML
        product_rows = ""
        for p in order.get("products", []):
            product_rows += f"""
                <tr>
                    <td style='padding: 8px; border: 1px solid #eee;'>{p['name']}</td>
                    <td style='padding: 8px; border: 1px solid #eee; text-align: center;'>{p['quantity']}</td>
                    <td style='padding: 8px; border: 1px solid #eee; text-align: right;'>KES {p['unit_price']:.2f}</td>
                    <td style='padding: 8px; border: 1px solid #eee; text-align: right;'>KES {p['total_price']:.2f}</td>
                </tr>
            """

        html_body = f"""
        <html>
        <body>
            <h2>Thank you for your order, {username}!</h2>
            <p>Your order has been placed successfully.</p>
            <p><strong>Order ID:</strong> {order['order_id']}</p>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 16px;'>
                <thead>
                    <tr>
                        <th style='padding: 8px; border: 1px solid #eee;'>Product</th>
                        <th style='padding: 8px; border: 1px solid #eee;'>Qty</th>
                        <th style='padding: 8px; border: 1px solid #eee;'>Unit Price</th>
                        <th style='padding: 8px; border: 1px solid #eee;'>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {product_rows}
                </tbody>
            </table>
            <p><strong>Subtotal:</strong> KES {order.get('subtotal', 0):.2f}</p>
            <p><strong>Delivery Fee:</strong> KES {order.get('delivery_fee', 0):.2f}</p>
            <p><strong>Grand Total:</strong> KES {order['total']:.2f}</p>
            <p>We will notify you when your order is shipped.</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_body, "html"))
        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, email, msg.as_string())
        server.quit()
        logger.info(f"Order confirmation email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send order confirmation email to {email}: {str(e)}")
        return False


def send_admin_new_order_notification(order: dict):
    try:
        msg = MIMEMultipart()
        msg["From"] = MAIL_FROM
        msg["To"] = MAIL_FROM  # Send to FlowTech business email
        msg["Subject"] = f"New Order #{order['order_id']} Received"

        html_body = f"""
        <html>
        <body>
            <h2>New Order Received</h2>
            <p>A new order has been placed on FlowTech.</p>
            <p><strong>Order ID:</strong> {order['order_id']}</p>
            <p><strong>Customer:</strong> {order.get('customer_name', 'N/A')}</p>
            <p><strong>Total:</strong> KES {order['total']:.2f}</p>
            <p>Check the admin dashboard for full details.</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_body, "html"))
        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, MAIL_FROM, msg.as_string())
        server.quit()
        logger.info(f"Admin notification email sent for order {order['order_id']}")
        return True
    except Exception as e:
        logger.error(f"Failed to send admin notification email: {str(e)}")
        return False


# User creation helper
def create_user_model(user_request, role: Role, db: Session):
    """Helper function to create user with proper error handling"""
    existing_user = (
        db.query(Users)
        .filter(
            (Users.email == user_request.email)
            | (Users.username == user_request.username)
        )
        .first()
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    try:
        # Generate verification token for customers
        verification_token = None
        is_verified = True  # Default to True for admins/superadmins

        if role == Role.CUSTOMER:
            verification_token = generate_verification_token()
            is_verified = False  # Customers need email verification

        user_model = Users(
            username=user_request.username,
            email=user_request.email,
            hashed_password=bcrypt_context.hash(user_request.password),
            role=role.value,
            is_verified=is_verified,
            verification_token=verification_token,
            verification_expires=(
                datetime.utcnow() + timedelta(hours=24) if verification_token else None
            ),
        )
        db.add(user_model)
        db.commit()
        db.refresh(user_model)

        # Send verification email for customers
        if role == Role.CUSTOMER and verification_token:
            email_sent = send_verification_email(
                user_request.email, user_request.username, verification_token
            )
            if not email_sent:
                logger.warning(
                    f"Failed to send verification email to {user_request.email}"
                )

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


def create_access_token(
    username: str, user_id: int, role: str, expires_delta: timedelta
):
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
    return user_role.value if hasattr(user_role, "value") else user_role


# Centralized role checking dependencies
def require_superadmin(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure only superadmins can access"""
    if current_user["role"] != Role.SUPERADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can access this resource",
        )
    return current_user


def require_admin_or_above(current_user: dict = Depends(get_active_user)):
    """Dependency to ensure only admins or superadmins can access"""
    if current_user["role"] not in [Role.ADMIN.value, Role.SUPERADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to access this resource",
        )
    return current_user


# Authentication endpoints
@router.post("/login", response_model=Token)
async def login(form_data: LoginUserRequest, db: db_dependency):
    """User login endpoint - Works for all roles"""
    logger.info(f"Login attempt for email: {form_data.email}")
    user = authenticate_user(form_data.email, form_data.password, db)

    # Check if customer account is verified
    if user.role == Role.CUSTOMER.value and not user.is_verified:
        raise HTTPException(
            status_code=401,
            detail="Please verify your email address before logging in. Check your inbox for a verification link.",
        )

    user_role = get_user_role(user.role)
    token = create_access_token(user.username, user.id, user_role, timedelta(hours=6))
    logger.info(f"User {user.username} logged in successfully with role: {user_role}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_role": user_role,
        "username": user.username,
    }


@router.post(
    "/verify-token",
    response_model=TokenVerificationResponse,
    status_code=status.HTTP_200_OK,
)
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
        return {"username": username, "tokenverification": "success", "role": user_role}
    except jwt.DecodeError:
        logger.warning("Invalid token during verification")
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/superadmin/create-admin", status_code=status.HTTP_201_CREATED)
async def create_admin_by_superadmin(
    db: db_dependency,
    create_admin_request: CreateAdminRequest,
    current_user: dict = Depends(require_superadmin),
):
    """Create an admin user - only accessible by superadmins"""
    logger.info(
        f"Superadmin {current_user['username']} creating admin: {create_admin_request.username}"
    )
    user = create_user_model(create_admin_request, Role.ADMIN, db)
    logger.info(
        f"Admin {create_admin_request.username} created by superadmin {current_user['username']}"
    )
    return {"message": "Admin created successfully", "user_id": user.id}


@router.post("/register/superadmin", status_code=status.HTTP_201_CREATED)
async def register_superadmin(
    db: db_dependency, create_user_request: CreateUserRequest
):
    """Register the first superadmin - Only use for initial setup"""
    logger.info(f"Superadmin registration attempt for: {create_user_request.username}")

    # Check if superadmin already exists
    existing_superadmin = (
        db.query(Users).filter(Users.role == Role.SUPERADMIN.value).first()
    )
    if existing_superadmin:
        raise HTTPException(
            status_code=400,
            detail="Superadmin already exists. Only one superadmin is allowed.",
        )

    user = create_user_model(create_user_request, Role.SUPERADMIN, db)
    logger.info(f"Superadmin {create_user_request.username} registered successfully")
    return {"message": "Superadmin created successfully", "user_id": user.id}


@router.delete("/superadmin/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int, db: db_dependency, current_user: dict = Depends(require_superadmin)
):
    """Delete a user - accessible by superadmin only"""
    try:
        if current_user["id"] == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account",
            )

        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        user_role = get_user_role(user.role)
        if user_role == Role.SUPERADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete superadmin accounts",
            )

        user_username = user.username
        db.delete(user)
        db.commit()

        logger.info(
            f"{user_role.title()} {user_username} (ID: {user_id}) deleted by superadmin {current_user['username']}"
        )
        return {"message": f"{user_role.title()} {user_username} deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user",
        )


# Registration endpoints
@router.post("/register/customer", status_code=status.HTTP_201_CREATED)
async def register_customer(db: db_dependency, create_user_request: CreateUserRequest):
    """Register a new customer - Public endpoint"""
    logger.info(f"Customer registration attempt for: {create_user_request.username}")
    user = create_user_model(create_user_request, Role.CUSTOMER, db)
    logger.info(f"Customer {create_user_request.username} registered successfully")
    return {"message": "Customer created successfully", "user_id": user.id}


# Email verification endpoints
@router.post(
    "/verify-email",
    response_model=EmailVerificationResponse,
    status_code=status.HTTP_200_OK,
)
async def verify_email(request: EmailVerificationRequest, db: db_dependency):
    """Verify email address using verification token"""
    try:
        # Find user with the verification token
        user = (
            db.query(Users)
            .filter(
                Users.verification_token == request.token, Users.is_verified == False
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=400, detail="Invalid or expired verification token"
            )

        # Check if token has expired
        if user.verification_expires and user.verification_expires < datetime.utcnow():
            raise HTTPException(
                status_code=400, detail="Verification token has expired"
            )

        # Mark user as verified
        user.is_verified = True
        user.verification_token = None
        user.verification_expires = None
        db.commit()

        # Create access token for automatic login
        user_role = get_user_role(user.role)
        access_token = create_access_token(
            user.username, user.id, user_role, timedelta(hours=6)
        )

        logger.info(f"Email verified for user: {user.username}")
        return {
            "message": "Email verified successfully",
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user_role,
            "username": user.username,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying email: {str(e)}")
        raise HTTPException(status_code=500, detail="Error verifying email")


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification_email(
    request: ResendVerificationRequest, db: db_dependency
):
    """Resend verification email for unverified users"""
    try:
        user = (
            db.query(Users)
            .filter(Users.id == request.user_id, Users.is_verified == False)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=404, detail="User not found or already verified"
            )

        # Generate new verification token
        new_token = generate_verification_token()
        user.verification_token = new_token
        user.verification_expires = datetime.utcnow() + timedelta(hours=24)
        db.commit()

        # Send new verification email
        email_sent = send_verification_email(user.email, user.username, new_token)

        if email_sent:
            logger.info(f"Verification email resent to {user.email}")
            return {"message": "Verification email sent successfully"}
        else:
            raise HTTPException(
                status_code=500, detail="Failed to send verification email"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending verification email: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Error resending verification email"
        )


@router.post("/request-password-reset", status_code=200)
async def request_password_reset(
    email: str = Body(..., embed=True), db: Session = Depends(get_db)
):
    """Request a password reset: send email with reset link if user exists."""
    user = db.query(Users).filter(Users.email == email).first()
    if not user:
        # Don't reveal if user exists
        return {"message": "If the email exists, a reset link has been sent."}
    token = generate_verification_token()
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(minutes=30)
    db.commit()
    # Send reset email
    reset_url = f"{FRONTEND_BASE_URL}/reset-password?token={token}"
    try:
        msg = MIMEMultipart()
        msg["From"] = MAIL_FROM
        msg["To"] = user.email
        msg["Subject"] = "Reset Your FlowTech Password"
        html_body = f"""
        <html><body>
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link will expire in 30 minutes.</p>
        <a href='{reset_url}' style='background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;'>Reset Password</a>
        <p>If you did not request this, you can ignore this email.</p>
        </body></html>
        """
        msg.attach(MIMEText(html_body, "html"))
        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, user.email, msg.as_string())
        server.quit()
        logger.info(f"Password reset email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password", status_code=200)
async def reset_password(
    token: str = Body(...), new_password: str = Body(...), db: Session = Depends(get_db)
):
    """Reset password using token and new password."""
    user = db.query(Users).filter(Users.reset_token == token).first()
    if (
        not user
        or not user.reset_token_expires
        or user.reset_token_expires < datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    user.hashed_password = bcrypt_context.hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    logger.info(f"Password reset for user {user.email}")
    return {"message": "Password has been reset successfully."}


@router.post("/cancel-order/{order_id}", status_code=200)
async def cancel_order(
    order_id: int = Path(...),
    reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_active_user),
):
    """Send a cancellation request email to admin with order ID, customer username, and reason. Does NOT update order status."""

    try:
        msg = MIMEMultipart()
        msg["From"] = MAIL_FROM
        msg["To"] = MAIL_FROM
        msg["Subject"] = f"Order Cancellation Request: Order #{order_id}"
        html_body = f"""
        <html><body>
        <h2>Order Cancellation Request</h2>
        <p>Customer <b>{current_user['username']}</b> has requested to cancel order <b>#{order_id}</b>.</p>
        <p><b>Reason:</b> {reason}</p>
        <p>Please review this request in the admin dashboard.</p>
        </body></html>
        """
        msg.attach(MIMEText(html_body, "html"))
        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, MAIL_FROM, msg.as_string())
        server.quit()
        logger.info(f"Admin notified of cancellation request for order {order_id}")
    except Exception as e:
        logger.error(f"Failed to send admin cancellation email: {str(e)}")
    return {"message": "Cancellation request sent to admin."}
