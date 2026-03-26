import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

def get_cipher() -> AESGCM:
    """Initializes the AES-GCM cipher using the configured 256-bit secret key."""
    key = base64.b64decode(settings.ENCRYPTION_KEY)
    return AESGCM(key)

def encrypt_data(data: bytes) -> bytes:
    """Encrypts raw bytes using AES-256-GCM and prepends the 12-byte nonce."""
    aesgcm = get_cipher()
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data, associated_data=None)
    return nonce + ciphertext

def decrypt_data(encrypted_data: bytes) -> bytes:
    """Decrypts AES-256-GCM bytes back to the original data."""
    aesgcm = get_cipher()
    nonce = encrypted_data[:12]
    ciphertext = encrypted_data[12:]
    return aesgcm.decrypt(nonce, ciphertext, associated_data=None)