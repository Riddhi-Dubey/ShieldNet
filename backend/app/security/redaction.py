import re
from typing import Dict, Any, List

# Regex patterns for sensitive data
PHONE_REGEX = re.compile(r'(?:\+?91[\s.-]?)?[6-9]\d{9}\b')
CARD_REGEX = re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b')
BANK_ACC_REGEX = re.compile(r'\b(?:account|acct|acc|a/c)(?:\s+is|\s*[:=]|\s*number|\s*no\.?)*\s*(\d{9,18})\b', re.IGNORECASE)
OTP_REGEX = re.compile(r'\b(?:otp|one[\s-]?time[\s-]?password|verification[\s-]?code|security[\s-]?code|pin)(?:\s+is|\s*[:=]|\s+number|\s+otp)*\s*([0-9]{4,8})\b', re.IGNORECASE)
UPI_REGEX = re.compile(r'\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b')
PASSWORD_REGEX = re.compile(r'\b(?:password|passwd|pwd)(?:\s+is|\s*[:=])*\s+([^\s,]{3,64})', re.IGNORECASE)
AADHAAR_REGEX = re.compile(r'\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b')


def redact_sensitive_text(text: str) -> str:
    """
    Redacts sensitive personally identifiable information (PII) including
    passwords, OTPs, PINs, full bank accounts, credit cards, Aadhaar,
    UPI addresses, and phone numbers.
    """
    if not text:
        return ""

    redacted = text

    # Redact explicit OTPs and PINs first (before password captures)
    redacted = OTP_REGEX.sub(r'otp: [REDACTED_OTP]', redacted)

    # Redact explicit passwords
    redacted = PASSWORD_REGEX.sub(r'password: [REDACTED_PASSWORD]', redacted)

    # Redact Aadhaar numbers
    redacted = AADHAAR_REGEX.sub('[REDACTED_AADHAAR]', redacted)

    # Redact Credit/Debit card numbers
    redacted = CARD_REGEX.sub('[REDACTED_CARD]', redacted)

    # Redact explicit bank account numbers
    redacted = BANK_ACC_REGEX.sub(r'account [REDACTED_ACCOUNT]', redacted)

    # Redact UPI addresses
    redacted = UPI_REGEX.sub('[REDACTED_UPI]', redacted)

    # Redact Phone numbers
    redacted = PHONE_REGEX.sub('[REDACTED_PHONE]', redacted)

    return redacted


def extract_redaction_summary(text: str) -> Dict[str, Any]:
    """
    Returns sanitized text alongside metadata of detected PII types without exposing values.
    """
    detected_types: List[str] = []

    if PASSWORD_REGEX.search(text):
        detected_types.append("PASSWORD")
    if OTP_REGEX.search(text):
        detected_types.append("OTP_OR_PIN")
    if AADHAAR_REGEX.search(text):
        detected_types.append("AADHAAR")
    if CARD_REGEX.search(text):
        detected_types.append("CARD_NUMBER")
    if BANK_ACC_REGEX.search(text):
        detected_types.append("BANK_ACCOUNT")
    if UPI_REGEX.search(text):
        detected_types.append("UPI_ID")
    if PHONE_REGEX.search(text):
        detected_types.append("PHONE_NUMBER")

    sanitized = redact_sensitive_text(text)

    return {
        "sanitized_text": sanitized,
        "redacted_elements": detected_types,
        "contains_sensitive_data": len(detected_types) > 0
    }
