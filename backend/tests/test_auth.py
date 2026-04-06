import pytest

async def test_register_success(client):
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "strongpassword"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

async def test_register_duplicate(client):
    await client.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "strongpassword"
    })
    response = await client.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "anotherpassword"
    })
    assert response.status_code == 400

async def test_login_invalid(client):
    response = await client.post("/api/auth/login", data={
        "username": "notfound@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

async def test_login_success(client):
    await client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "strongpassword"
    })
    response = await client.post("/api/auth/login", data={
        "username": "login@example.com",
        "password": "strongpassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
