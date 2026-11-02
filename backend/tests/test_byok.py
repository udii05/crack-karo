from app.byok import decrypt_key, encrypt_key, mask_key


def test_key_encryption_round_trip():
    secret = "sk-test-1234567890"
    encrypted = encrypt_key(secret)
    assert encrypted != secret
    assert decrypt_key(encrypted) == secret
    assert mask_key(secret) == "****7890"
