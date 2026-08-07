import re

with open("app/main.py", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()
for i, line in enumerate(lines):
    if "@app." in line or "router" in line or "def " in line:
        if any(keyword in line for keyword in ["post", "get", "scan", "disease", "upload", "predict"]):
            print(f"Line {i+1}: {line}")
