import json
from pathlib import Path

# EXACT BACKEND LOGIC REPLICATION
DATA_DIR = Path("data")
PROJECTS_DIR = DATA_DIR / "projects"
project_id = "1ed33670-fa4c-44ed-acf4-647a7a3eed8d"

project_file = PROJECTS_DIR / f"{project_id}.json"
print(f"Checking for file: {project_file.absolute()}")
print(f"File exists: {project_file.exists()}")

current_user = {"username": "attacker"} # Simulating unauthorized user to verify IDOR protection

if project_file.exists():
    with open(project_file, "r") as f:
        data = json.load(f)
    print(f"Owner in file: {data.get('owner')}")
    if data.get("owner") != current_user["username"]:
        print("RESULT: FORBIDDEN - Owner mismatch")
    else:
        print("RESULT: OK - Owner matches")
else:
    print("RESULT: 404 - Project file not found at path")
