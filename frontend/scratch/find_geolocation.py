import os

for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith((".ts", ".tsx")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            if "weather" in content.lower():
                print(f"File: {path}")
