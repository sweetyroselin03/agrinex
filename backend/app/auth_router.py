from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import random
import os
import logging
import time
from . import models, schemas, auth_utils
from .database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger("uvicorn.error")

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


@router.post("/send-otp")
def send_otp(request: schemas.OTPRequest, db: Session = Depends(get_db)):
    identifier = request.email.strip().replace(" ", "")
    if not identifier or "@" not in identifier or identifier.endswith("gmail.con") or identifier.endswith("gmail,com"):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Rate limiting cooldown (1 minute)
    db_otp = db.query(models.OTPCode).filter(models.OTPCode.email_or_phone == identifier).first()
    if db_otp and db_otp.last_sent_at:
        diff = (utcnow() - db_otp.last_sent_at).total_seconds()
        if diff < 60:
            wait_time = int(60 - diff)
            logger.error(f"[OTP Rate Limit] {identifier} requested OTP too fast. Wait {wait_time}s.")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {wait_time} seconds before requesting a new OTP."
            )

    otp = str(random.randint(100000, 999999))
    expiry = utcnow() + timedelta(minutes=5)
    
    if db_otp:
        db_otp.otp_code = otp
        db_otp.expires_at = expiry
        db_otp.verified = False
        db_otp.attempts = 0
        db_otp.last_sent_at = utcnow()
    else:
        db_otp = models.OTPCode(email_or_phone=identifier, otp_code=otp, expires_at=expiry, last_sent_at=utcnow())
        db.add(db_otp)
    db.commit()
    
    result = auth_utils.send_otp_email(identifier, otp)
    success, is_mock = result if isinstance(result, tuple) else (result, False)
    if not success:
        raise HTTPException(status_code=500, detail="OTP provider failed")
    
    response = {"message": "Verification code sent successfully", "identifier": identifier}
    if is_mock:
        response["dev_otp"] = otp
    return response


@router.post("/verify-otp")
def verify_otp(request: schemas.OTPVerify, db: Session = Depends(get_db)):
    identifier = request.email.strip().replace(" ", "")
    if not identifier or "@" not in identifier:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    db_otp = db.query(models.OTPCode).filter(models.OTPCode.email_or_phone == identifier).first()
    if not db_otp:
        logger.error(f"[OTP Verification Failed] No OTP record found in database for {identifier}")
        raise HTTPException(status_code=400, detail="No OTP requested for this email address.")
    
    if db_otp.attempts >= 5:
        logger.error(f"[OTP Verification Failed] {identifier} exceeded max verification attempts.")
        db.delete(db_otp)
        db.commit()
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new OTP.")
    
    if db_otp.otp_code != request.otp:
        db_otp.attempts += 1
        db.commit()
        remaining = 5 - db_otp.attempts
        logger.error(f"[OTP Verification Failed] Invalid OTP entered for {identifier}. Remaining attempts: {remaining}")
        raise HTTPException(status_code=400, detail=f"Invalid OTP code. You have {remaining} attempts remaining.")
    
    if utcnow() > db_otp.expires_at:
        logger.error(f"[OTP Verification Failed] OTP code expired for {identifier} (Expired at {db_otp.expires_at})")
        db.delete(db_otp)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new one.")
    
    db_otp.verified = True
    db.commit()
    logger.info(f"[OTP Verification Success] Email OTP verified successfully for {identifier}")
    
    # Check if user exists (only check email)
    user = db.query(models.User).filter(
        (models.User.email == identifier) | (models.User.email == f"{identifier}@agrinex.local")
    ).first()
        
    if user:
        access_token = auth_utils.create_access_token(data={"sub": user.email})
        # Cleanup verified OTP code
        db_otp = db.query(models.OTPCode).filter(models.OTPCode.email_or_phone == identifier).first()
        if db_otp:
            db.delete(db_otp)
            db.commit()
        logger.info(f"[OTP Verification Complete] User {identifier} logged in via OTP.")
        return {
            "message": "OTP verified successfully",
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    
    logger.info(f"[OTP Verification Complete] {identifier} verified, ready for registration/signup.")
    return {"message": "OTP verified successfully", "identifier": identifier}


@router.post("/check-account")
def check_account(request: schemas.CheckAccountRequest, db: Session = Depends(get_db)):
    target = request.identifier.strip().replace(" ", "")
    user = db.query(models.User).filter(
        (models.User.email == target) | (models.User.email == f"{target}@agrinex.local")
    ).first()
    if user:
        return {"exists": True, "message": "Account already exists. Please login."}
    return {"exists": False}


@router.post("/register")
def register(request: schemas.RegisterRequest, db: Session = Depends(get_db)):
    email = request.email.strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Account already exists. Please login.")
    
    db_otp = db.query(models.OTPCode).filter(
        models.OTPCode.email_or_phone == email,
        models.OTPCode.verified == True
    ).first()
    
    if not db_otp:
        raise HTTPException(status_code=400, detail="Please verify your identifier via OTP first")
    
    new_user = models.User(
        email=email,
        full_name=request.full_name,
        is_verified=True
    )
    
    db.add(new_user)
    db.delete(db_otp)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Information saved. Please set your password.",
        "user": new_user
    }


@router.post("/signup")
def signup(request: schemas.RegisterRequest, db: Session = Depends(get_db)):
    return register(request, db)


@router.post("/google", response_model=schemas.Token)
def google_login(request: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    email = request.profile.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google profile missing email")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    is_new = False
    if not user:
        is_new = True
        full_name = request.profile.get("name", "Google User")
        picture = request.profile.get("picture")
        user = models.User(
            email=email,
            full_name=full_name,
            profile_picture=picture,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    access_token = auth_utils.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "is_new": is_new
    }


def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not any(c.islower() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter.")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")
    special_chars = r"""!@#$%^&*()_+-=[]{};':"\|,.<>/?`~"""
    if not any(c in special_chars for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")


@router.post("/set-password", response_model=schemas.Token)
def set_password(request: schemas.PasswordSetRequest, db: Session = Depends(get_db)):
    validate_password_strength(request.password)
    
    target = (request.email or "").strip()
    if not target:
        raise HTTPException(status_code=400, detail="Email is required to set password")

    user = db.query(models.User).filter(
        (models.User.email == target) | (models.User.email == f"{target}@agrinex.local")
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = auth_utils.get_password_hash(request.password)
    db.commit()
    db.refresh(user)
    
    access_token = auth_utils.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "is_new": False
    }



@router.post("/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    t_start = time.time()
    logger.info("[LOGIN START] Login request received")
    
    target = request.email.strip()
    
    logger.info(f"[USER LOOKUP START] Querying database for email: {target}")
    t0 = time.time()
    user = db.query(models.User).filter(
        (models.User.email == target) | (models.User.email == f"{target}@agrinex.local")
    ).first()
    logger.info(f"[USER LOOKUP COMPLETE] User found: {bool(user)} ({round((time.time() - t0) * 1000, 2)}ms)")
        
    if not user:
        logger.info(f"[LOGIN COMPLETE] Email not registered (401) ({round((time.time() - t_start) * 1000, 2)}ms)")
        raise HTTPException(status_code=401, detail="Email not registered")
    
    logger.info("[PASSWORD VERIFY START] Verifying bcrypt password hash")
    t1 = time.time()
    is_valid = auth_utils.verify_password(request.password, user.hashed_password)
    logger.info(f"[PASSWORD VERIFY COMPLETE] Hash valid: {is_valid} ({round((time.time() - t1) * 1000, 2)}ms)")
    
    if not is_valid:
        logger.info(f"[LOGIN COMPLETE] Invalid password (401) ({round((time.time() - t_start) * 1000, 2)}ms)")
        raise HTTPException(status_code=401, detail="Invalid password")
    
    logger.info("[TOKEN CREATION START] Generating JWT access token")
    t2 = time.time()
    access_token = auth_utils.create_access_token(data={"sub": user.email})
    logger.info(f"[TOKEN CREATION COMPLETE] Token generated ({round((time.time() - t2) * 1000, 2)}ms)")
    
    logger.info(f"[LOGIN COMPLETE] Login successful for {user.email} (200 OK) ({round((time.time() - t_start) * 1000, 2)}ms)")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    target = request.email.strip().replace(" ", "")
    if not target or "@" not in target or target.endswith("gmail.con") or target.endswith("gmail,com"):
        raise HTTPException(status_code=400, detail="Invalid email format")

    user = db.query(models.User).filter(
        (models.User.email == target) | (models.User.email == f"{target}@agrinex.local")
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered")
    
    otp = str(random.randint(100000, 999999))
    expiry = utcnow() + timedelta(minutes=5)
    
    db_otp = db.query(models.OTPCode).filter(models.OTPCode.email_or_phone == target).first()
    if db_otp:
        db_otp.otp_code = otp
        db_otp.expires_at = expiry
        db_otp.verified = False
        db_otp.attempts = 0
        db_otp.last_sent_at = utcnow()
    else:
        db_otp = models.OTPCode(email_or_phone=target, otp_code=otp, expires_at=expiry, last_sent_at=utcnow())
        db.add(db_otp)
    db.commit()
    
    result = auth_utils.send_otp_email(target, otp)
    success, is_mock = result if isinstance(result, tuple) else (result, False)
    if not success:
        raise HTTPException(status_code=500, detail="OTP provider failed")
    response = {"message": "Verification code sent successfully", "identifier": target}
    if is_mock:
        response["dev_otp"] = otp
    return response


@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    target = request.email.strip()
    db_otp = db.query(models.OTPCode).filter(
        models.OTPCode.email_or_phone == target,
        models.OTPCode.otp_code == request.otp,
        models.OTPCode.expires_at > utcnow()
    ).first()
    
    if not db_otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    user = db.query(models.User).filter(
        (models.User.email == target) | (models.User.email == f"{target}@agrinex.local")
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = auth_utils.get_password_hash(request.new_password)
    db.delete(db_otp)
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/refresh")
def refresh_token(request: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    payload = auth_utils.verify_token(request.refresh_token, expected_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    new_access_token = auth_utils.create_access_token(data={"sub": user.email})
    new_refresh_token = auth_utils.create_refresh_token(data={"sub": user.email})
    
    logger.info(f"[Token Refresh] Tokens refreshed for {user.email}")
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/change-password/request-otp")
def request_change_password_otp(
    current_user: models.User = Depends(auth_utils.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Step 1 of Change Password:
    Generates and emails a 6-digit OTP to the authenticated user's email address.
    """
    identifier = current_user.email.strip().lower()
    
    # Rate limit check (60 seconds)
    db_otp = db.query(models.OTPCode).filter(models.OTPCode.email_or_phone == identifier).first()
    if db_otp and db_otp.last_sent_at:
        diff = (utcnow() - db_otp.last_sent_at).total_seconds()
        if diff < 60:
            wait_time = int(60 - diff)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {wait_time} seconds before requesting a new verification code."
            )

    otp = str(random.randint(100000, 999999))
    expiry = utcnow() + timedelta(minutes=5)

    if db_otp:
        db_otp.otp_code = otp
        db_otp.expires_at = expiry
        db_otp.verified = False
        db_otp.attempts = 0
        db_otp.last_sent_at = utcnow()
    else:
        db_otp = models.OTPCode(
            email_or_phone=identifier,
            otp_code=otp,
            expires_at=expiry,
            last_sent_at=utcnow()
        )
        db.add(db_otp)
    db.commit()

    result = auth_utils.send_otp_email(identifier, otp)
    success, is_mock = result if isinstance(result, tuple) else (result, False)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send verification code email.")

    response = {
        "success": True,
        "message": "Verification code sent to your email",
        "email_masked": auth_utils.mask_email(identifier),
    }
    if is_mock:
        response["dev_otp"] = otp
    return response


@router.post("/change-password/verify-and-update")
def verify_and_update_password(
    request: schemas.PasswordChangeUpdateRequest,
    current_user: models.User = Depends(auth_utils.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Step 2 of Change Password:
    Verifies the OTP code and updates the authenticated user's password.
    """
    identifier = current_user.email.strip().lower()
    new_password = request.new_password

    # Validate password criteria
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not any(c.isupper() for c in new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not any(c.islower() for c in new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter.")
    if not any(c.isdigit() for c in new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")
    special_chars = "!@#$%^&*(),.?\":{}|<>"
    if not any(c in special_chars for c in new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")

    db_otp = db.query(models.OTPCode).filter(models.OTPCode.email_or_phone == identifier).first()
    if not db_otp:
        raise HTTPException(status_code=400, detail="No verification OTP requested for this email.")

    if db_otp.attempts >= 5:
        db.delete(db_otp)
        db.commit()
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new verification code.")

    if db_otp.otp_code != request.otp.strip():
        db_otp.attempts += 1
        db.commit()
        remaining = 5 - db_otp.attempts
        raise HTTPException(status_code=400, detail=f"Invalid verification code. {remaining} attempt(s) remaining.")

    if utcnow() > db_otp.expires_at:
        db.delete(db_otp)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    # OTP is valid! Update user password
    current_user.hashed_password = auth_utils.get_password_hash(new_password)
    db.delete(db_otp)
    db.commit()

    logger.info(f"[Password Change Success] Password successfully changed for user {identifier}")
    return {
        "success": True,
        "message": "Your account password has been updated successfully."
    }

