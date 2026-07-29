from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.schemas.schemas import UserCreate, UserResponse, LoginRequest, Token, PasswordResetRequest
from app.core.security import verify_password, get_password_hash, create_access_token

router = APIRouter()

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role or "REP",
        company_name=user_in.company_name or "Acme Corp",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(subject=new_user.id)
    return Token(access_token=token, user=UserResponse.model_validate(new_user))

@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(subject=user.id)
    return Token(access_token=token, user=UserResponse.model_validate(user))

@router.post("/forgot-password")
def forgot_password(req: PasswordResetRequest):
    return {"message": f"Password reset instructions sent to {req.email}"}

@router.get("/me", response_model=UserResponse)
def get_me(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        # Create default demo user if empty
        user = User(
            email="demo@verticalrevops.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Alex Morgan",
            role="ADMIN",
            company_name="Vertical AI Corp",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return UserResponse.model_validate(user)
