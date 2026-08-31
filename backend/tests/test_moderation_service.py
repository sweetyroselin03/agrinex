import pytest
from app.moderation_service import moderation_service


def test_safe_agricultural_posts():
    safe_texts = [
        "Which fertilizer is best for tomato crops in clay soil?",
        "I disagree with this organic farming method, synthetic NPK worked better for my field.",
        "Had a bad experience with seed quality this season.",
        "Can someone help me identify this leaf spot disease?",
        "Heavy rains caused severe crop failure and dead leaves in my paddy field.",
        "Pest attack alert in Northern District: armyworms detected.",
    ]
    for text in safe_texts:
        res = moderation_service.moderate_text(text)
        assert res["allowed"] is True, f"Failed safe check for: '{text}', category: {res['category']}"


def test_offensive_hate_speech_and_threats():
    offensive_texts = [
        "I am going to kill you and burn your field",
        "You are a fucking idiot bitch",
        "Nigger go away",
        "Free money click link to get rich quick telegram admin",
        "f.u.c.k this trash",
        "b1tch user",
        "h@te those people",
    ]
    for text in offensive_texts:
        res = moderation_service.moderate_text(text)
        assert res["allowed"] is False, f"Failed to block offensive text: '{text}'"
        assert res["reason"] == "This post contains offensive or inappropriate content and cannot be published."


def test_leetspeak_normalization():
    norm = moderation_service.normalize_text("f@u$$$$ck!ng b1111tch")
    assert "fuck" in norm or "bitch" in norm
