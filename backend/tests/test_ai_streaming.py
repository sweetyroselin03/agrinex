import pytest
from unittest.mock import patch
from app.ai_service import ai_service


@pytest.mark.asyncio
async def test_stream_chat_response_generator():
    async def mock_stream(*args, **kwargs):
        tokens = ["Tomato ", "is ", "a ", "crop."]
        for t in tokens:
            yield t

    with patch.object(ai_service, "stream_chat_response", side_effect=mock_stream):
        collected = []
        async for token in ai_service.stream_chat_response("What is tomato?"):
            collected.append(token)
        assert "".join(collected) == "Tomato is a crop."
