import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv()

from app.agri_gpt import agri_gpt_engine

async def main():
    print("GROQ_API_KEY present:", bool(os.getenv("GROQ_API_KEY")))
    print("Client type:", agri_gpt_engine.client_type)
    print("Sending message 'Hello'...")
    try:
        res = await agri_gpt_engine.get_response("Hello")
        print("Response:", res)
    except Exception as e:
        print("Error during get_response:", e)

if __name__ == "__main__":
    asyncio.run(main())
