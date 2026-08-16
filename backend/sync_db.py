import os
from sqlalchemy import text
from app.database import engine

def add_column_if_missing(conn, table: str, column: str, col_type: str):
    try:
        conn.execute(text(f"SELECT {column} FROM {table} LIMIT 1;"))
        print(f"DONE: '{column}' column already exists in '{table}' table.")
    except Exception:
        conn.rollback()
        try:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type};"))
            conn.commit()
            print(f"DONE: Added '{column}' column to '{table}' table.")
        except Exception as e:
            conn.rollback()
            print(f"INFO: Could not add column '{column}' to '{table}': {e}")

def sync_db():
    print("Syncing Database Schema...")
    
    with engine.connect() as conn:
        add_column_if_missing(conn, "users", "username", "VARCHAR")
        add_column_if_missing(conn, "users", "experience", "VARCHAR")
        add_column_if_missing(conn, "users", "crop_specialization", "VARCHAR")
        add_column_if_missing(conn, "users", "website", "VARCHAR")
        add_column_if_missing(conn, "users", "cover_photo", "VARCHAR")
        add_column_if_missing(conn, "messages", "client_msg_id", "VARCHAR")
        add_column_if_missing(conn, "chat_messages", "conversation_id", "VARCHAR")
        add_column_if_missing(conn, "posts", "images", "TEXT")
        add_column_if_missing(conn, "crop_scans", "scientific_name", "VARCHAR")
        add_column_if_missing(conn, "crop_scans", "scan_mode", "VARCHAR")
        # Safely drop legacy phone column if it exists
        try:
            conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS phone;"))
            conn.commit()
            print("DONE: Dropped 'phone' column from 'users' table (IF EXISTS).")
        except Exception as drop_err:
            conn.rollback()
            try:
                conn.execute(text("ALTER TABLE users DROP COLUMN phone;"))
                conn.commit()
                print("DONE: Dropped 'phone' column from 'users' table (standard fallback).")
            except Exception as fallback_err:
                conn.rollback()
                print(f"INFO: Could not drop column 'phone' (already removed or unsupported): {fallback_err}")

        try:
            print("Cleaning duplicate follows before enforcing unique constraint...")
            conn.execute(text("""
                DELETE FROM follows
                WHERE id NOT IN (
                    SELECT MIN(id)
                    FROM follows
                    GROUP BY follower_id, following_id
                );
            """))
            conn.commit()
            print("DONE: Duplicate follows cleaned.")
        except Exception as e:
            conn.rollback()
            print(f"INFO: Skip duplicate follow cleanup: {e}")

        try:
            print("Creating unique index on follows (follower_id, following_id)...")
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS unique_follower_following ON follows (follower_id, following_id);"))
            conn.commit()
            print("DONE: Unique index on follows created.")
        except Exception as e:
            conn.rollback()
            print(f"INFO: Unique index creation: {e}")

    # Ensure all tables created via metadata
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    
    # Run data seeding if empty
    seed_data_if_empty()
    print("\nDatabase sync completed successfully!")

def seed_data_if_empty():
    try:
        from sqlalchemy.orm import sessionmaker
        from app.models import User, Post, Comment, Follow
        from app.auth_utils import get_password_hash
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check if users is empty
        if db.query(User).count() == 0:
            print("Seeding default users...")
            user1 = User(
                email="ramesh.patel@agrinex.io",
                password_hash=get_password_hash("password123"),
                full_name="Dr. Ramesh Patel",
                username="ramesh_patel",
                village="Nashik, Maharashtra",
                experience="15 Years",
                crop_specialization="Grapes, Tomatoes",
                bio="Agricultural extension officer and vine pathologist.",
                is_verified=True
            )
            user2 = User(
                email="swati.deshmukh@agrinex.io",
                password_hash=get_password_hash("password123"),
                full_name="Swati Deshmukh",
                username="swati_organic",
                village="Satara, Maharashtra",
                experience="8 Years",
                crop_specialization="Organic Vegetables",
                bio="Pioneering community-supported organic farming and natural pesticides.",
                is_verified=True
            )
            user3 = User(
                email="rajesh.kumar@agrinex.io",
                password_hash=get_password_hash("password123"),
                full_name="Rajesh Kumar",
                username="rajesh_grower",
                village="Karnal, Haryana",
                experience="12 Years",
                crop_specialization="Rice, Wheat",
                bio="Wheat breeder focusing on climate-resilient farming techniques.",
                is_verified=False
            )
            db.add_all([user1, user2, user3])
            db.commit()
            db.refresh(user1)
            db.refresh(user2)
            db.refresh(user3)
            print("DONE: Seeded default users.")
        
        # Get users to attach as authors
        users = db.query(User).all()
        if not users:
            return
            
        u1, u2 = users[0], users[1]
        u3 = users[2] if len(users) > 2 else u1

        # Check if posts is empty
        if db.query(Post).count() == 0:
            print("Seeding default posts...")
            post1 = Post(
                user_id=u1.id,
                content="🔴 ATTENTION GRAPE GROWERS! Standard Downy Mildew alerts in Nashik district. Warm days combined with early morning dew are triggering spore germination. Ensure you start preventative copper hydroxide sprays immediately. Let's safeguard our vineyard yields early!",
                location="Nashik, Maharashtra",
                crop_category="Grapes",
                image_url="https://images.unsplash.com/photo-1539589172039-96ecbba5d7e6?w=600&auto=format&fit=crop&q=60"
            )
            post2 = Post(
                user_id=u2.id,
                content="Sharing my organic leaf-extract bio-pesticide recipe! Mix 5kg Neem leaves, 2kg Pongamia leaves, and 2kg Custard Apple leaves. Boil in water, dilute 1:10, and spray. Outstanding results against aphids and whiteflies on leafy vegetables. 🌿🚜",
                location="Satara, Maharashtra",
                crop_category="Vegetables",
                image_url="https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=600&auto=format&fit=crop&q=60"
            )
            post3 = Post(
                user_id=u3.id,
                content="Can anyone recommend the best solar pump size for a 3-acre paddy field with a water table depth of 120ft? Deciding between a 5HP or 7.5HP submersible model. Any feedback on reliability is appreciated!",
                location="Karnal, Haryana",
                crop_category="Rice",
                image_url="https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=60"
            )
            db.add_all([post1, post2, post3])
            db.commit()
            db.refresh(post1)
            db.refresh(post2)
            db.refresh(post3)
            print("DONE: Seeded default posts.")
            
            # Seed comments
            print("Seeding comments...")
            comment1 = Comment(
                user_id=u2.id,
                post_id=post1.id,
                content="Thank you for the timely warning, Dr. Patel! We just noticed some yellow spots on our lower leaves this morning. Will apply the copper spray tomorrow."
            )
            comment2 = Comment(
                user_id=u1.id,
                post_id=post2.id,
                content="Outstanding formula, Swati! The limonoids in neem and custard apple extracts work synergistically to disrupt pest feeding behavior."
            )
            db.add_all([comment1, comment2])
            
            # Seed follows
            print("Seeding follows...")
            f1 = Follow(follower_id=u1.id, following_id=u2.id)
            f2 = Follow(follower_id=u2.id, following_id=u1.id)
            f3 = Follow(follower_id=u3.id, following_id=u1.id)
            db.add_all([f1, f2, f3])
            
            db.commit()
            print("DONE: Seeded comments and follows.")
            
    except Exception as seed_err:
        print(f"INFO: Skipped data seeding due to: {seed_err}")

if __name__ == "__main__":
    sync_db()
