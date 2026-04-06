# Secure Document Vault

A full-stack document management web application designed to securely store, encrypt, and share files. Built with an asynchronous Python backend and a React frontend, fully containerized for deployment.

## Key Features

* **Encryption at Rest:** All uploaded files are encrypted using AES-256-GCM prior to storage.
* **Authentication:** JWT-based user sessions with brute-force protection implemented via Redis rate limiting.
* **Two-Factor Authentication (2FA):** TOTP integration compatible with standard authenticator applications (e.g., Google Authenticator, Authy).
* **Audit Logging:** System-wide tracking of user actions including logins, uploads, downloads, and deletions.
* **Secure File Sharing:** Generation of one-time-use shareable links that expire immediately upon first access.
* **File Management:** Search, filter, and pagination capabilities for user files.
* **Infrastructure:** Fully containerized setup using Docker and Docker Compose.

## Tech Stack

**Backend:**
* Python 3.13
* FastAPI
* SQLAlchemy 2.0 (Async ORM)
* PostgreSQL 15
* Redis 7
* Cryptography (`bcrypt`, `pyotp`, `cryptography`)

**Frontend:**
* React (Vite)
* Tailwind CSS
* Context API

