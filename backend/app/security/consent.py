from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.app.models.consent import Consent


class ConsentVerificationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def verify_consent_record(
    db: Session,
    consent_id: str,
    required_purpose: str,
    required_destination: str,
    required_scope: str,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None
) -> Consent:
    """
    Verifies that a valid, active, non-revoked consent record exists
    matching the explicit purpose, destination, and data scope.
    Rejects missing, revoked, or mismatched consent.
    """
    if not consent_id:
        raise ConsentVerificationError("Missing consent_id: Consent must be explicitly granted and recorded.")

    consent = db.query(Consent).filter(Consent.consent_id == consent_id).first()
    if not consent:
        raise ConsentVerificationError("Invalid consent_id: Record not found in consent registry.")

    if consent.status == "REVOKED" or consent.revoked_at is not None:
        raise ConsentVerificationError("Consent has been revoked: Information transfer is prohibited.")

    if consent.status != "ACTIVE":
        raise ConsentVerificationError(f"Consent is inactive (status: {consent.status}).")

    if consent.purpose != required_purpose:
        raise ConsentVerificationError(
            f"Consent purpose mismatch: granted for '{consent.purpose}', but required '{required_purpose}'."
        )

    if consent.destination != required_destination:
        raise ConsentVerificationError(
            f"Consent destination mismatch: granted for '{consent.destination}', but required '{required_destination}'."
        )

    if consent.data_scope != required_scope:
        raise ConsentVerificationError(
            f"Consent scope mismatch: granted for '{consent.data_scope}', but required '{required_scope}'."
        )

    # If user_id or session_id provided, verify ownership
    if user_id and consent.user_id and consent.user_id != user_id:
        raise ConsentVerificationError("Consent record does not belong to the authenticated user.")

    if session_id and consent.session_id and consent.session_id != session_id:
        raise ConsentVerificationError("Consent record does not match the active session.")

    return consent
