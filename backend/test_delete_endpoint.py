import sys
from fastapi.testclient import TestClient
from api import app, PROJECTS_DIR

client = TestClient(app)

# Use the project ID that exists
project_id = "1ed33670-fa4c-44ed-acf4-647a7a3eed8d"

print(f"Testing delete for: {project_id}")
response = client.delete(f"/api/projects/{project_id}")
print(f"Status: {response.status_code}")
print(f"Body: {response.text}")
