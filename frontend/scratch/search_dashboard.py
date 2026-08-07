with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.read().splitlines()

for i, line in enumerate(lines):
    if any(keyword in line.lower() for keyword in ["geolocation", "weather", "location", "lat", "lon", "gps"]):
        print(f"Line {i+1}: {line}")
