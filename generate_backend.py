import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

backend_dir = r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\backend\app"

create_file(f"{backend_dir}/__init__.py", "")

create_file(f"{backend_dir}/database.py", """
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./agrinex.db"
# If you configure Postgres, use: 
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/agrinex"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
""")

create_file(f"{backend_dir}/models.py", """
from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    village = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    farm_size = Column(Float, nullable=True)
    crop_types = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class OTPVerification(Base):
    __tablename__ = "otp_verifications"
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, index=True)
    otp = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")

class CropScan(Base):
    __tablename__ = "crop_scans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String)
    disease_name = Column(String)
    confidence = Column(Float)
    treatment_organic = Column(String)
    treatment_chemical = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    is_ai = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
""")

create_file(f"{backend_dir}/schemas.py", """
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    phone: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    farm_size: Optional[float] = None
    crop_types: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    
    class Config:
        orm_mode = True

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None

class Post(BaseModel):
    id: int
    user_id: int
    content: str
    image_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class ChatMessageCreate(BaseModel):
    message: str

class ChatMessage(BaseModel):
    id: int
    user_id: int
    message: str
    is_ai: bool
    created_at: datetime

    class Config:
        orm_mode = True
""")

create_file(f"{backend_dir}/main.py", """
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import random

from . import models, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AgriNex AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to AgriNex AI API"}

@app.post("/api/auth/otp/generate")
def generate_otp(req: schemas.OTPRequest, db: Session = Depends(get_db)):
    otp = str(random.randint(1000, 9999))
    # mock SMS sending
    db_otp = models.OTPVerification(phone=req.phone, otp=otp)
    db.add(db_otp)
    db.commit()
    return {"message": "OTP sent", "otp": otp} # Returning OTP for testing

@app.post("/api/auth/otp/verify")
def verify_otp(req: schemas.OTPVerify, db: Session = Depends(get_db)):
    db_otp = db.query(models.OTPVerification).filter(models.OTPVerification.phone == req.phone, models.OTPVerification.otp == req.otp).first()
    if not db_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    user = db.query(models.User).filter(models.User.phone == req.phone).first()
    if not user:
        user = models.User(phone=req.phone)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {"token": f"mock_jwt_token_{user.id}", "user_id": user.id}

@app.get("/api/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in user_update.dict().items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/posts", response_model=schemas.Post)
def create_post(post: schemas.PostCreate, user_id: int = 1, db: Session = Depends(get_db)):
    db_post = models.Post(**post.dict(), user_id=user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.get("/api/posts", response_model=List[schemas.Post])
def get_posts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    posts = db.query(models.Post).order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts

@app.post("/api/chat", response_model=schemas.ChatMessage)
def chat_with_ai(chat: schemas.ChatMessageCreate, user_id: int = 1, db: Session = Depends(get_db)):
    # Save user message
    user_msg = models.ChatMessage(user_id=user_id, message=chat.message, is_ai=False)
    db.add(user_msg)
    
    # Mock AI response
    ai_response = "Here is some AI advice for your crops: Ensure proper irrigation and monitor for pests."
    if "weather" in chat.message.lower():
        ai_response = "The weather looks sunny for the next 3 days, good for harvesting."
    elif "disease" in chat.message.lower():
        ai_response = "Please upload an image of the crop to our Scan section for a precise diagnosis."
    
    ai_msg = models.ChatMessage(user_id=user_id, message=ai_response, is_ai=True)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    return ai_msg
""")

print("Backend files generated.")
