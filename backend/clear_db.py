import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agrinex.db")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Connecting to database: {DATABASE_URL}")
engine = create_engine(DATABASE_URL)

def clear_tables():
    # Ordered dependencies first to avoid constraint issues during standard deletes
    tables = [
        "message_reads",
        "message_reactions",
        "message_attachments",
        "message_deleted_for_users",
        "messages",
        "participants",
        "conversations",
        "blocked_users",
        "user_online_status",
        "chat_messages",
        "crop_scans",
        "notifications",
        "saved_posts",
        "likes",
        "comments",
        "follows",
        "posts",
        "users",
        "otp_codes"
    ]
    with engine.connect() as conn:
        # Disable foreign keys temporarily if sqlite
        if "sqlite" in str(engine.url):
            try:
                conn.execute(text("PRAGMA foreign_keys = OFF;"))
            except Exception:
                pass

        for table in tables:
            try:
                print(f"Clearing table: {table}")
                # Try TRUNCATE with CASCADE for PostgreSQL
                conn.execute(text(f"TRUNCATE TABLE {table} CASCADE;"))
                conn.commit()
            except Exception:
                try:
                    conn.rollback()
                    conn.execute(text(f"DELETE FROM {table};"))
                    conn.commit()
                except Exception as ex:
                    print(f"Could not clear table {table}: {ex}")

        # Re-enable foreign keys if sqlite
        if "sqlite" in str(engine.url):
            try:
                conn.execute(text("PRAGMA foreign_keys = ON;"))
            except Exception:
                pass

        # Attempt to reset primary key sequence for users
        try:
            conn.execute(text("SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);"))
            conn.commit()
            print("Reset 'users' table sequence.")
        except Exception:
            pass

    print("\n--- DATABASE VERIFICATION COUNT ---")
    all_zero = True
    with engine.connect() as conn:
        for table in tables:
            try:
                res = conn.execute(text(f"SELECT COUNT(*) FROM {table};")).scalar()
                print(f"Table '{table}': {res} records")
                if res != 0:
                    all_zero = False
            except Exception as e:
                print(f"Table '{table}': Could not query count ({e})")
    
    if all_zero:
        print("\n[SUCCESS] All database tables are 100% empty (User count = 0, Posts = 0, Messages = 0, Notifications = 0)!")
    else:
        print("\nWARNING: Some tables still contain records.")

if __name__ == "__main__":
    clear_tables()
