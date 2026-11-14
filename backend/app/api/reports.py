import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.schemas.report import (
    ReportPreviewRequest,
    ReportPreviewResponse,
    ReportCreateRequest,
    ReportResponse
)
from backend.app.schemas.consent import (
    ConsentCreate,
    ConsentResponse,
    ConsentRevokeRequest
)
from backend.app.models.consent import Consent
from backend.app.models.report import Report
from backend.app.models.entity import Entity
from backend.app.services.report_service import (
    generate_report_preview,
    submit_sanitized_report
)
from backend.app.services.report_generation import (
    generate_entity_investigation_data,
    export_entity_report_csv,
    export_entity_report_markdown
)
from backend.app.security.authentication import get_current_user_optional
from backend.app.models.user import User

router = APIRouter(tags=["Reports & Consent"])


@router.post("/consent", response_model=ConsentResponse)
def create_consent_record(
    payload: ConsentCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Creates an explicit, versioned server-side consent record before sharing data.
    Frontend checkbox alone is never sufficient; this record is checked during submission.
    """
    user_id = current_user.user_id if current_user else None
    consent = Consent(
        consent_id=str(uuid.uuid4()),
        user_id=user_id,
        session_id=payload.session_id,
        purpose=payload.purpose,
        destination=payload.destination,
        data_scope=payload.data_scope,
        consent_version=payload.consent_version,
        status="ACTIVE"
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent


@router.post("/consent/revoke")
def revoke_consent_record(
    payload: ConsentRevokeRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Revokes an active consent record with ownership validation.
    Verifies that the caller owns the consent before revocation.
    Subsequent API calls attempting to use this consent_id will be rejected.
    """
    consent = db.query(Consent).filter(Consent.consent_id == payload.consent_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent record not found")

    # Ownership validation
    if consent.user_id:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to revoke consent tied to a user account."
            )
        if current_user.user_id != consent.user_id and (current_user.role or "").lower() != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: You do not own this consent record."
            )
    elif consent.session_id and payload.session_id:
        if consent.session_id != payload.session_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Session mismatch: unable to verify consent ownership."
            )

    consent.revoke()
    db.commit()

    return {
        "consent_id": consent.consent_id,
        "status": consent.status,
        "revoked_at": consent.revoked_at.isoformat() if consent.revoked_at else None,
        "message": "Consent successfully revoked. Information transfer is prohibited."
    }


@router.post("/reports/preview", response_model=ReportPreviewResponse)
def preview_report_submission(request: ReportPreviewRequest):
    """
    Shows exact sanitized information proposed for sharing with ScamTrace,
    including detected PII elements that have been redacted.
    """
    if len(request.description.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description must contain at least 5 characters"
        )
    return generate_report_preview(request)


@router.post("/reports", response_model=ReportResponse)
def submit_scam_report(
    request: ReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Secure submission workflow:
    1. Authenticates user or validates session.
    2. Enforces valid, unrevoked server-side consent for SCAM_REPORTING -> SCAMTRACE_INTELLIGENCE.
    3. Rejects missing, revoked, or mismatched consent.
    4. Redacts private PII.
    5. Ingests sanitized indicators into ScamTrace threat database.
    """
    user_id = current_user.user_id if current_user else None
    return submit_sanitized_report(db, request, authenticated_user_id=user_id)


@router.get("/reports/{entity_id}")
def get_reports_for_entity(entity_id: str, db: Session = Depends(get_db)):
    """Retrieves all citizen and system reports filed against an entity."""
    reports = db.query(Report).filter(Report.entity_id == entity_id).all()
    return {
        "entity_id": entity_id,
        "total_reports": len(reports),
        "reports": [
            {
                "report_id": r.report_id,
                "scam_type": r.scam_type,
                "description": r.description,
                "source": r.source,
                "verification_status": r.verification_status,
                "reported_at": r.reported_at
            }
            for r in reports
        ]
    }


@router.get("/entities/{entity_id}/export")
def export_entity_investigation_dossier(
    entity_id: str,
    format: str = "csv",
    db: Session = Depends(get_db)
):
    """
    Exports a comprehensive investigation dossier for law enforcement or threat analysts.
    Supports 'csv' and 'markdown' formats. Contains only stored evidence with full provenance.
    """
    data = generate_entity_investigation_data(db, entity_id)

    if format.lower() == "markdown" or format.lower() == "md":
        md_text = export_entity_report_markdown(data)
        return Response(content=md_text, media_type="text/markdown")
    else:
        csv_text = export_entity_report_csv(data)
        return Response(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=investigation_{entity_id[:8]}.csv"}
        )
