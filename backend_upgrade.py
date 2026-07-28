import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

backend_dir = r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\backend\app"

create_file(f"{backend_dir}/main.py", """
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import random
from datetime import datetime

from . import models, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AgriNex AI Enterprise Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AgriNex AI Backend is Live"}

# ─── Auth ───
@app.post("/api/auth/otp/generate")
def generate_otp(req: schemas.OTPRequest, db: Session = Depends(get_db)):
    otp = str(random.randint(1000, 9999))
    db_otp = models.OTPVerification(phone=req.phone, otp=otp)
    db.add(db_otp)
    db.commit()
    return {"message": "OTP sent", "otp": otp}

@app.post("/api/auth/otp/verify")
def verify_otp(req: schemas.OTPVerify, db: Session = Depends(get_db)):
    db_otp = db.query(models.OTPVerification).filter(models.OTPVerification.phone == req.phone, models.OTPVerification.otp == req.otp).first()
    if not db_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    user = db.query(models.User).filter(models.User.phone == req.phone).first()
    if not user:
        user = models.User(phone=req.phone, name="Farmer " + str(random.randint(10,99)))
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {"token": f"mock_jwt_token_{user.id}", "user_id": user.id}

# ─── User Profile ───
@app.get("/api/users/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    followers_count = db.query(models.Follow).filter(models.Follow.following_id == user_id).count()
    following_count = db.query(models.Follow).filter(models.Follow.follower_id == user_id).count()
    posts_count = db.query(models.Post).filter(models.Post.user_id == user_id).count()
    
    user_out = schemas.UserOut.from_orm(user)
    user_out.followers_count = followers_count
    user_out.following_count = following_count
    user_out.posts_count = posts_count
    return user_out

@app.put("/api/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return get_user(user_id, db)

# ─── Community Posts ───
@app.post("/api/posts", response_model=schemas.PostOut)
def create_post(post: schemas.PostCreate, user_id: int = 1, db: Session = Depends(get_db)):
    db_post = models.Post(**post.dict(), user_id=user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return prepare_post_out(db_post, user_id, db)

@app.get("/api/posts", response_model=List[schemas.PostOut])
def get_feed(skip: int = 0, limit: int = 20, user_id: int = 1, db: Session = Depends(get_db)):
    posts = db.query(models.Post).order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()
    return [prepare_post_out(p, user_id, db) for p in posts]

@app.get("/api/users/{user_id}/posts", response_model=List[schemas.PostOut])
def get_user_posts(user_id: int, skip: int = 0, limit: int = 20, req_user_id: int = 1, db: Session = Depends(get_db)):
    posts = db.query(models.Post).filter(models.Post.user_id == user_id).order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()
    return [prepare_post_out(p, req_user_id, db) for p in posts]

@app.delete("/api/posts/{post_id}")
def delete_post(post_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id, models.Post.user_id == user_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully"}

def prepare_post_out(post, current_user_id, db):
    likes_count = db.query(models.Like).filter(models.Like.post_id == post.id).count()
    comments_count = db.query(models.Comment).filter(models.Comment.post_id == post.id).count()
    is_liked = db.query(models.Like).filter(models.Like.post_id == post.id, models.Like.user_id == current_user_id).first() is not None
    is_saved = db.query(models.SavedPost).filter(models.SavedPost.post_id == post.id, models.SavedPost.user_id == current_user_id).first() is not None
    
    post_out = schemas.PostOut.from_orm(post)
    post_out.likes_count = likes_count
    post_out.comments_count = comments_count
    post_out.is_liked = is_liked
    post_out.is_saved = is_saved
    post_out.author_name = post.user.name or f"Farmer {post.user.id}"
    post_out.author_avatar = post.user.profile_picture
    post_out.author_verified = post.user.is_verified
    return post_out

# ─── Likes & Comments ───
@app.post("/api/posts/{post_id}/like")
def like_post(post_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    like = db.query(models.Like).filter(models.Like.post_id == post_id, models.Like.user_id == user_id).first()
    if like:
        db.delete(like)
        db.commit()
    else:
        new_like = models.Like(post_id=post_id, user_id=user_id)
        db.add(new_like)
        db.commit()
    likes_count = db.query(models.Like).filter(models.Like.post_id == post_id).count()
    return {"liked": not bool(like), "likes_count": likes_count}

@app.post("/api/posts/{post_id}/comments", response_model=schemas.CommentOut)
def comment_post(post_id: int, comment: schemas.CommentCreate, user_id: int = 1, db: Session = Depends(get_db)):
    db_comment = models.Comment(post_id=post_id, user_id=user_id, content=comment.content, parent_id=comment.parent_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    out = schemas.CommentOut.from_orm(db_comment)
    out.author_name = db_comment.user.name or f"Farmer {user_id}"
    out.author_avatar = db_comment.user.profile_picture
    return out

@app.get("/api/posts/{post_id}/comments", response_model=List[schemas.CommentOut])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(models.Comment).filter(models.Comment.post_id == post_id, models.Comment.parent_id == None).order_by(models.Comment.created_at.desc()).all()
    res = []
    for c in comments:
        out = schemas.CommentOut.from_orm(c)
        out.author_name = c.user.name or f"Farmer {c.user_id}"
        out.author_avatar = c.user.profile_picture
        res.append(out)
    return res

# ─── Chat AI ───
@app.post("/api/chat", response_model=schemas.ChatMessage)
def chat_with_ai(chat: schemas.ChatMessageCreate, user_id: int = 1, db: Session = Depends(get_db)):
    user_msg = models.ChatMessage(user_id=user_id, message=chat.message, is_ai=False)
    db.add(user_msg)
    
    ai_response = "I am AgriNex AI. To get specific advice, try uploading a crop image in the Scan section!"
    if "wheat" in chat.message.lower():
        ai_response = "For wheat, ensure optimal nitrogen application during the tillering stage. Consider using a broad-spectrum fungicide if rust symptoms appear."
    elif "tomato" in chat.message.lower():
        ai_response = "Tomato plants need consistent watering. Watch out for early blight and blossom end rot. Calcium supplements can help!"
    
    ai_msg = models.ChatMessage(user_id=user_id, message=ai_response, is_ai=True)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    return ai_msg

@app.get("/api/chat/history", response_model=List[schemas.ChatMessage])
def get_chat_history(user_id: int = 1, db: Session = Depends(get_db)):
    return db.query(models.ChatMessage).filter(models.ChatMessage.user_id == user_id).order_by(models.ChatMessage.created_at.asc()).all()

# ─── Save Post ───
@app.post("/api/posts/{post_id}/save")
def save_post(post_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    save = db.query(models.SavedPost).filter(models.SavedPost.post_id == post_id, models.SavedPost.user_id == user_id).first()
    if save:
        db.delete(save)
        db.commit()
        return {"saved": False}
    else:
        new_save = models.SavedPost(post_id=post_id, user_id=user_id)
        db.add(new_save)
        db.commit()
        return {"saved": True}
""")

print("Backend upgraded.")
