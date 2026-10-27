"""Authentication endpoints: OTP login/signup, password login/register, token refresh, current user profile."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    OTPRequestIn,
    OTPVerifyIn,
    RefreshTokenIn,
    TokenPair,
    UserLoginIn,
    UserRegisterIn,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserRead)
async def get_current_user_profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/login", response_model=TokenPair)
@limiter.limit("10/minute")
async def login_password(
    request: Request, payload: UserLoginIn, db: AsyncSession = Depends(get_db)
) -> TokenPair:
    return await AuthService(db).authenticate_by_password(payload)


@router.post("/register", response_model=TokenPair)
@limiter.limit("5/minute")
async def register_user(
    request: Request, payload: UserRegisterIn, db: AsyncSession = Depends(get_db)
) -> TokenPair:
    return await AuthService(db).register_user(payload)


@router.post("/logout", response_model=MessageResponse)
async def logout() -> MessageResponse:
    return MessageResponse(message="Logged out successfully.")


@router.post("/otp/request", response_model=MessageResponse)
@limiter.limit("5/minute")
async def request_otp(
    request: Request, payload: OTPRequestIn, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    await AuthService(db).request_otp(payload.phone_number, payload.purpose)
    return MessageResponse(message="OTP sent.")


@router.post("/otp/verify", response_model=TokenPair)
@limiter.limit("10/minute")
async def verify_otp(
    request: Request, payload: OTPVerifyIn, db: AsyncSession = Depends(get_db)
) -> TokenPair:
    return await AuthService(db).verify_otp_and_authenticate(
        phone_number=payload.phone_number,
        code=payload.code,
        purpose=payload.purpose,
        full_name=payload.full_name,
        role=payload.role,
        referral_code=payload.referral_code,
    )


@router.post("/token/refresh", response_model=TokenPair)
async def refresh_token(payload: RefreshTokenIn, db: AsyncSession = Depends(get_db)) -> TokenPair:
    return await AuthService(db).refresh(payload.refresh_token)
