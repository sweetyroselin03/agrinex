import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.database import get_db, Base, engine
from app import models, auth_utils


def test_post_reporting_and_auto_hide():
    client = TestClient(app)

    # Clean / setup test user
    db = next(get_db())
    test_user = db.query(models.User).filter(models.User.email == "farmer_test@agrinex.ai").first()
    if not test_user:
        test_user = models.User(
            email="farmer_test@agrinex.ai",
            full_name="Test Farmer",
            hashed_password=auth_utils.get_password_hash("password123")
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

    test_post = models.Post(
        user_id=test_user.id,
        content="Test post for reporting",
        report_count=0,
        is_hidden=False
    )
    db.add(test_post)
    db.commit()
    db.refresh(test_post)

    token = auth_utils.create_access_token({"sub": test_user.email, "id": test_user.id})
    headers = {"Authorization": f"Bearer {token}"}

    # Report post
    res = client.post(
        f"/posts/{test_post.id}/report",
        json={"reason": "spam"},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["post_id"] == test_post.id
    assert data["reason"] == "spam"
    assert data["message"] == "Post reported successfully"
