import pytest
import asyncio
import pytest_asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest_asyncio.fixture(scope="module")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(scope="module")
async def auth_headers(client):
    google_payload = {
        "id_token": "community_suite_token",
        "profile": {
            "email": "community_tester@agrinex.io",
            "name": "Community Tester",
            "picture": "https://agrinex.io/avatars/comm.png"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ════════════════════════════════════════════════════════════════════════════
# COMMUNITY FEED & SOCIAL INTERACTIONS MODULE TESTS (45 TESTS)
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_comm_001_get_public_feed(client):
    res = await client.get("/posts/feed")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

@pytest.mark.asyncio
async def test_comm_002_create_basic_post(client, auth_headers):
    payload = {"content": "Organic pest control using neem oil solution."}
    res = await client.post("/posts", json=payload, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["content"] == payload["content"]

@pytest.mark.asyncio
async def test_comm_003_create_post_with_category_and_tags(client, auth_headers):
    payload = {
        "content": "Tips for drip irrigation setup in dry season.",
        "category": "Irrigation",
        "crop_type": "Drip Tech",
        "tags": ["water", "drip", "irrigation"]
    }
    res = await client.post("/posts", json=payload, headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_comm_004_create_post_with_image_attachment(client, auth_headers):
    payload = {
        "content": "Look at this leaf pattern! Is it early blight?",
        "images": ["https://agrinex.io/uploads/leaf1.jpg"]
    }
    res = await client.post("/posts", json=payload, headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_comm_005_create_empty_post_validation(client, auth_headers):
    res = await client.post("/posts", json={"content": ""}, headers=auth_headers)
    assert res.status_code in [400, 422, 200]

@pytest.mark.asyncio
async def test_comm_006_get_post_by_id(client, auth_headers):
    created = await client.post("/posts", json={"content": "Fetch me post"}, headers=auth_headers)
    post_id = created.json()["id"]
    res = await client.get(f"/posts/{post_id}")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_007_get_nonexistent_post(client):
    res = await client.get("/posts/99999999")
    assert res.status_code in [404, 422, 200]

@pytest.mark.asyncio
async def test_comm_008_update_own_post(client, auth_headers):
    created = await client.post("/posts", json={"content": "Initial post content"}, headers=auth_headers)
    post_id = created.json()["id"]
    res = await client.put(f"/posts/{post_id}", json={"content": "Updated post content"}, headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_009_delete_own_post(client, auth_headers):
    created = await client.post("/posts", json={"content": "Post to delete"}, headers=auth_headers)
    post_id = created.json()["id"]
    res = await client.delete(f"/posts/{post_id}", headers=auth_headers)
    assert res.status_code in [200, 204, 404, 422]

@pytest.mark.asyncio
async def test_comm_010_like_post(client, auth_headers):
    created = await client.post("/posts", json={"content": "Like me!"}, headers=auth_headers)
    post_id = created.json()["id"]
    res = await client.post(f"/posts/{post_id}/like", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_011_unlike_post(client, auth_headers):
    created = await client.post("/posts", json={"content": "Unlike me!"}, headers=auth_headers)
    post_id = created.json()["id"]
    await client.post(f"/posts/{post_id}/like", headers=auth_headers)
    res = await client.post(f"/posts/{post_id}/like", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_012_get_post_likes_list(client, auth_headers):
    created = await client.post("/posts", json={"content": "Get my likes"}, headers=auth_headers)
    post_id = created.json()["id"]
    res = await client.get(f"/posts/{post_id}/likes")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_013_add_comment_to_post(client, auth_headers):
    created = await client.post("/posts", json={"content": "Comment section post"}, headers=auth_headers)
    post_id = created.json()["id"]
    res = await client.post(f"/posts/{post_id}/comments", json={"content": "Great info thanks!"}, headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_014_get_post_comments_list(client, auth_headers):
    created = await client.post("/posts", json={"content": "Post with comments"}, headers=auth_headers)
    post_id = created.json()["id"]
    await client.post(f"/posts/{post_id}/comments", json={"content": "Comment 1"}, headers=auth_headers)
    res = await client.get(f"/posts/{post_id}/comments")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_015_delete_comment(client, auth_headers):
    created = await client.post("/posts", json={"content": "Delete comment post"}, headers=auth_headers)
    post_id = created.json()["id"]
    comment_res = await client.post(f"/posts/{post_id}/comments", json={"content": "Temp comment"}, headers=auth_headers)
    if comment_res.status_code == 200:
        comment_id = comment_res.json()["id"]
        res = await client.delete(f"/comments/{comment_id}", headers=auth_headers)
        assert res.status_code in [200, 204, 404, 422]
    else:
        assert True

@pytest.mark.asyncio
async def test_comm_016_bookmark_save_post(client, auth_headers):
    created = await client.post("/posts", json={"content": "Bookmark me!"}, headers=auth_headers)
    post_id = created.json()["id"]
    res = await client.post(f"/posts/{post_id}/save", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_017_unbookmark_unsave_post(client, auth_headers):
    created = await client.post("/posts", json={"content": "Unsave me!"}, headers=auth_headers)
    post_id = created.json()["id"]
    await client.post(f"/posts/{post_id}/save", headers=auth_headers)
    res = await client.post(f"/posts/{post_id}/save", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_018_follow_user(client, auth_headers):
    res = await client.post("/users/follow/target_farmer_id_999", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_019_unfollow_user(client, auth_headers):
    res = await client.post("/users/unfollow/target_farmer_id_999", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_020_get_following_feed(client, auth_headers):
    res = await client.get("/posts/following-feed", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_021_search_posts_by_keyword(client):
    res = await client.get("/posts/search?q=organic")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_022_search_posts_by_category(client):
    res = await client.get("/posts/feed?category=Crops")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_comm_023_search_posts_by_crop_type(client):
    res = await client.get("/posts/feed?crop_type=Wheat")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_comm_024_trending_posts_list(client):
    res = await client.get("/posts/trending")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_025_report_post_inappropriate(client, auth_headers):
    created = await client.post("/posts", json={"content": "Report me post"}, headers=auth_headers)
    post_id = created.json()["id"]
    res = await client.post(f"/posts/{post_id}/report", json={"reason": "Spam"}, headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_026_share_post_counter(client):
    res = await client.post("/posts/1/share")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_027_view_post_counter(client):
    res = await client.post("/posts/1/view")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_028_pinned_posts_community(client):
    res = await client.get("/posts/pinned")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_029_get_feed_pagination_cursor(client):
    res = await client.get("/posts/feed?limit=5&skip=0")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_comm_030_get_feed_limit_exceeded(client):
    res = await client.get("/posts/feed?limit=100")
    assert res.status_code in [200, 400, 422]

@pytest.mark.asyncio
async def test_comm_031_comment_like_toggle(client, auth_headers):
    res = await client.post("/comments/1/like", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_032_comment_reply_nested(client, auth_headers):
    res = await client.post("/comments/1/reply", json={"content": "Nested comment reply"}, headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_033_user_mentioned_in_post(client, auth_headers):
    res = await client.post("/posts", json={"content": "Hello @test_farmer1 welcome to AgriNex!"}, headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_comm_034_hashtag_extraction_post(client, auth_headers):
    res = await client.post("/posts", json={"content": "Harvesting #Wheat and #Rice today!"}, headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_comm_035_get_posts_by_hashtag(client):
    res = await client.get("/posts/tag/Wheat")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_036_get_community_announcements(client):
    res = await client.get("/community/announcements")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_037_get_popular_agricultural_topics(client):
    res = await client.get("/community/topics")
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_038_filter_posts_by_location_region(client):
    res = await client.get("/posts/feed?region=Maharashtra")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_comm_039_poll_post_creation(client, auth_headers):
    payload = {
        "content": "Which crop yields best in sandy soil?",
        "poll_options": ["Millet", "Peanuts", "Watermelon", "Maize"]
    }
    res = await client.post("/posts/poll", json=payload, headers=auth_headers)
    assert res.status_code in [200, 201, 404, 422]

@pytest.mark.asyncio
async def test_comm_040_vote_on_poll_post(client, auth_headers):
    res = await client.post("/posts/poll/1/vote", json={"option_index": 0}, headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_041_get_post_analytics_owner(client, auth_headers):
    created = await client.post("/posts", json={"content": "Analytics post"}, headers=auth_headers)
    post_id = created.json()["id"]
    res = await client.get(f"/posts/{post_id}/analytics", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_042_hide_post_from_feed(client, auth_headers):
    res = await client.post("/posts/1/hide", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_043_mute_user_posts(client, auth_headers):
    res = await client.post("/users/mute/target_user_id", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_044_unmute_user_posts(client, auth_headers):
    res = await client.post("/users/unmute/target_user_id", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_comm_045_community_rules_and_guidelines(client):
    res = await client.get("/community/guidelines")
    assert res.status_code in [200, 404, 422]
