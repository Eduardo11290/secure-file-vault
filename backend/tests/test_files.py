import pytest

@pytest.fixture
async def auth_header(client):
    email = "fileuser@example.com"
    password = "password"
    await client.post("/api/auth/register", json={"email": email, "password": password})
    resp = await client.post("/api/auth/login", data={"username": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def auth_header2(client):
    email = "other@example.com"
    password = "password"
    await client.post("/api/auth/register", json={"email": email, "password": password})
    resp = await client.post("/api/auth/login", data={"username": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

async def test_upload_and_download_file(client, auth_header):
    file_content = b"Super secret data bytes"
    files = {"file": ("secret.txt", file_content, "text/plain")}
    
    # Upload
    upload_resp = await client.post("/api/files/upload", headers=auth_header, files=files)
    assert upload_resp.status_code == 201
    file_id = upload_resp.json()["id"]
    
    # Download
    download_resp = await client.get(f"/api/files/download/{file_id}", headers=auth_header)
    assert download_resp.status_code == 200
    assert download_resp.content == file_content

async def test_access_denied_other_user(client, auth_header, auth_header2):
    files = {"file": ("secret.txt", b"user1 data", "text/plain")}
    upload_resp = await client.post("/api/files/upload", headers=auth_header, files=files)
    file_id = upload_resp.json()["id"]
    
    # User 2 tries to download User 1's file
    download_resp = await client.get(f"/api/files/download/{file_id}", headers=auth_header2)
    assert download_resp.status_code == 404
