import pytest
from backend.app.security.redaction import redact_sensitive_text, extract_redaction_summary


def test_redact_passwords_and_pins():
    text = "Your password is SecretPassword123 and your pin: 4921."
    redacted = redact_sensitive_text(text)
    assert "SecretPassword123" not in redacted
    assert "[REDACTED_PASSWORD]" in redacted
    assert "[REDACTED_OTP]" in redacted or "4921" not in redacted


def test_redact_phone_numbers():
    text = "Call officer Sharma immediately on +91 9876543210 or 8765432109."
    redacted = redact_sensitive_text(text)
    assert "9876543210" not in redacted
    assert "8765432109" not in redacted
    assert "[REDACTED_PHONE]" in redacted


def test_redact_upi_ids():
    text = "Please send payment to scammer.mule@okhdfcbank or 9876543210@paytm."
    redacted = redact_sensitive_text(text)
    assert "scammer.mule@okhdfcbank" not in redacted
    assert "[REDACTED_UPI]" in redacted


def test_redact_cards_and_accounts():
    text = "Deposit to account 123456789012 or card 4111 2222 3333 4444."
    redacted = redact_sensitive_text(text)
    assert "4111 2222 3333 4444" not in redacted
    assert "123456789012" not in redacted


def test_extract_redaction_summary():
    text = "Your OTP is 482910 for account 9876543210123. Contact 9876543210."
    summary = extract_redaction_summary(text)
    assert summary["contains_sensitive_data"] is True
    assert "OTP_OR_PIN" in summary["redacted_elements"]
    assert "PHONE_NUMBER" in summary["redacted_elements"]
    assert "482910" not in summary["sanitized_text"]
