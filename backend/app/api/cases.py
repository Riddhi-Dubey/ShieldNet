import uuid
import csv
import io
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.models.case import Case, CaseEntity, CaseNote
from backend.app.models.entity import Entity
from backend.app.models.audit import AuditLog
from backend.app.schemas.case import (
    CaseCreateRequest,
    CaseUpdateRequest,
    CaseEntityAddRequest,
    CaseNoteCreateRequest,
    CaseSummaryOut,
    CaseDetailOut,
    CaseEntityOut,
    CaseNoteOut
)
from backend.app.security.authentication import get_current_user_optional
from backend.app.models.user import User

router = APIRouter(prefix="/cases", tags=["Investigation Case Management"])


@router.get("", response_model=List[CaseSummaryOut])
def list_investigation_cases(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    db: Session = Depends(get_db)
):
    """Lists all investigative cases with attached entity and note counts."""
    query = db.query(Case)
    if status_filter:
        query = query.filter(Case.status == status_filter.upper())
    if priority_filter:
        query = query.filter(Case.priority == priority_filter.upper())

    cases = query.order_by(Case.updated_at.desc()).all()
    results = []
    for c in cases:
        entity_count = len(c.entities)
        note_count = len(c.notes)
        summary = CaseSummaryOut(
            case_id=c.case_id,
            title=c.title,
            description=c.description,
            priority=c.priority,
            status=c.status,
            assigned_to=c.assigned_to,
            created_by=c.created_by,
            created_at=c.created_at,
            updated_at=c.updated_at,
            entity_count=entity_count,
            note_count=note_count
        )
        results.append(summary)
    return results


@router.post("", response_model=CaseDetailOut, status_code=status.HTTP_201_CREATED)
def create_investigation_case(
    payload: CaseCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Creates a new structured investigation case."""
    creator = current_user.username if current_user else "Investigator"
    new_case = Case(
        case_id=str(uuid.uuid4()),
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else "",
        priority=payload.priority.upper(),
        status=payload.status.upper(),
        assigned_to=payload.assigned_to or creator,
        created_by=creator,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Initial system note
    init_note = CaseNote(
        note_id=str(uuid.uuid4()),
        case_id=new_case.case_id,
        author="System",
        content=f"Investigation case created with priority {new_case.priority} by {creator}."
    )
    db.add(init_note)
    db.commit()
    db.refresh(new_case)

    return get_case_detail(new_case.case_id, db)


@router.get("/{case_id}", response_model=CaseDetailOut)
def get_case_detail(case_id: str, db: Session = Depends(get_db)):
    """Retrieves full case dossier with attached entities, metadata, and notes."""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    entities_out = []
    for ce in case.entities:
        ent = db.query(Entity).filter(Entity.entity_id == ce.entity_id).first()
        entities_out.append(CaseEntityOut(
            id=ce.id,
            case_id=ce.case_id,
            entity_id=ce.entity_id,
            notes=ce.notes,
            added_at=ce.added_at,
            entity_identifier=ent.identifier if ent else ce.entity_id,
            entity_type=ent.entity_type if ent else "UNKNOWN",
            risk_score=ent.risk_score if ent else 0.0,
            risk_level=ent.risk_level if ent else "UNVERIFIED"
        ))

    notes_out = [
        CaseNoteOut(
            note_id=n.note_id,
            case_id=n.case_id,
            author=n.author,
            content=n.content,
            created_at=n.created_at
        )
        for n in sorted(case.notes, key=lambda x: x.created_at, reverse=True)
    ]

    return CaseDetailOut(
        case_id=case.case_id,
        title=case.title,
        description=case.description,
        priority=case.priority,
        status=case.status,
        assigned_to=case.assigned_to,
        created_by=case.created_by,
        created_at=case.created_at,
        updated_at=case.updated_at,
        entities=entities_out,
        notes=notes_out
    )


@router.put("/{case_id}", response_model=CaseDetailOut)
def update_investigation_case(
    case_id: str,
    payload: CaseUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Updates case status, assignment, priority, or description."""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    changes = []
    if payload.title is not None and payload.title != case.title:
        case.title = payload.title.strip()
        changes.append("title")
    if payload.description is not None and payload.description != case.description:
        case.description = payload.description.strip()
        changes.append("description")
    if payload.priority is not None and payload.priority.upper() != case.priority:
        old_p = case.priority
        case.priority = payload.priority.upper()
        changes.append(f"priority ({old_p} -> {case.priority})")
    if payload.status is not None and payload.status.upper() != case.status:
        old_s = case.status
        case.status = payload.status.upper()
        changes.append(f"status ({old_s} -> {case.status})")
    if payload.assigned_to is not None and payload.assigned_to != case.assigned_to:
        case.assigned_to = payload.assigned_to.strip()
        changes.append(f"assigned_to ({case.assigned_to})")

    case.updated_at = datetime.now(timezone.utc)

    if changes:
        actor = current_user.username if current_user else "Investigator"
        note = CaseNote(
            note_id=str(uuid.uuid4()),
            case_id=case.case_id,
            author="System",
            content=f"Case updated by {actor}: changed {', '.join(changes)}."
        )
        db.add(note)

    db.commit()
    return get_case_detail(case_id, db)


@router.delete("/{case_id}", status_code=status.HTTP_200_OK)
def delete_investigation_case(case_id: str, db: Session = Depends(get_db)):
    """Deletes an investigation case and its association records."""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    db.delete(case)
    db.commit()
    return {"message": f"Case {case_id} successfully deleted", "case_id": case_id}


@router.post("/{case_id}/entities", response_model=CaseDetailOut)
def attach_entity_to_case(
    case_id: str,
    payload: CaseEntityAddRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Attaches a suspect entity to the investigation case."""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    # Find entity
    ent = db.query(Entity).filter(
        (Entity.entity_id == payload.entity_id) |
        (Entity.identifier == payload.entity_id) |
        (Entity.normalized_value == payload.entity_id)
    ).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Entity not found in threat database")

    # Check duplicate
    existing = db.query(CaseEntity).filter(
        CaseEntity.case_id == case_id,
        CaseEntity.entity_id == ent.entity_id
    ).first()
    if existing:
        return get_case_detail(case_id, db)

    case_ent = CaseEntity(
        id=str(uuid.uuid4()),
        case_id=case_id,
        entity_id=ent.entity_id,
        notes=payload.notes,
        added_at=datetime.now(timezone.utc)
    )
    db.add(case_ent)

    actor = current_user.username if current_user else "Investigator"
    note = CaseNote(
        note_id=str(uuid.uuid4()),
        case_id=case_id,
        author="System",
        content=f"Entity {ent.entity_type} '{ent.identifier}' attached by {actor}."
    )
    db.add(note)
    case.updated_at = datetime.now(timezone.utc)

    db.commit()
    return get_case_detail(case_id, db)


@router.delete("/{case_id}/entities/{entity_id}", response_model=CaseDetailOut)
def remove_entity_from_case(
    case_id: str,
    entity_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Removes an entity from the case."""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    ce = db.query(CaseEntity).filter(
        CaseEntity.case_id == case_id,
        (CaseEntity.entity_id == entity_id) | (CaseEntity.id == entity_id)
    ).first()
    if not ce:
        raise HTTPException(status_code=404, detail="Entity not associated with this case")

    db.delete(ce)
    actor = current_user.username if current_user else "Investigator"
    note = CaseNote(
        note_id=str(uuid.uuid4()),
        case_id=case_id,
        author="System",
        content=f"Entity {entity_id} removed from case by {actor}."
    )
    db.add(note)
    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    return get_case_detail(case_id, db)


@router.post("/{case_id}/notes", response_model=CaseDetailOut)
def add_case_note(
    case_id: str,
    payload: CaseNoteCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Appends an investigator forensic note or hypothesis to the case."""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    author = current_user.username if current_user else (payload.author or "Investigator")
    new_note = CaseNote(
        note_id=str(uuid.uuid4()),
        case_id=case_id,
        author=author,
        content=payload.content.strip(),
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_note)
    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    return get_case_detail(case_id, db)


@router.get("/{case_id}/export")
def export_case_dossier(
    case_id: str,
    format: str = "markdown",
    db: Session = Depends(get_db)
):
    """Exports comprehensive forensic case dossier in Markdown or CSV."""
    case_detail = get_case_detail(case_id, db)

    if format.lower() in ["csv"]:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["CASE FORENSIC DOSSIER", case_detail.title])
        writer.writerow(["Case ID", case_detail.case_id])
        writer.writerow(["Priority", case_detail.priority])
        writer.writerow(["Status", case_detail.status])
        writer.writerow(["Assigned To", case_detail.assigned_to])
        writer.writerow(["Created By", case_detail.created_by])
        writer.writerow(["Created At", case_detail.created_at])
        writer.writerow([])
        writer.writerow(["ATTACHED SUSPECT ENTITIES"])
        writer.writerow(["Entity ID", "Identifier", "Type", "Risk Score", "Risk Level", "Notes"])
        for e in case_detail.entities:
            writer.writerow([e.entity_id, e.entity_identifier, e.entity_type, e.risk_score, e.risk_level, e.notes or ""])
        writer.writerow([])
        writer.writerow(["INVESTIGATION NOTES"])
        writer.writerow(["Timestamp", "Author", "Content"])
        for n in case_detail.notes:
            writer.writerow([n.created_at, n.author, n.content])

        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=case_{case_id[:8]}.csv"}
        )

    # Markdown format
    md_lines = [
        f"# Investigation Case Dossier: {case_detail.title}",
        f"**Case Reference**: `{case_detail.case_id}`  ",
        f"**Priority**: `{case_detail.priority}` | **Status**: `{case_detail.status}` | **Lead Investigator**: `{case_detail.assigned_to}`  ",
        f"**Date Opened**: {case_detail.created_at}  \n",
        "## Case Summary",
        case_detail.description or "No overview description provided.",
        "\n## Associated Threat Entities",
    ]
    if not case_detail.entities:
        md_lines.append("*No entities attached to this case yet.*")
    else:
        md_lines.append("| Identifier | Type | Risk Level | Score | Status | Notes |")
        md_lines.append("|---|---|---|---|---|---|")
        for e in case_detail.entities:
            md_lines.append(f"| `{e.entity_identifier}` | {e.entity_type} | {e.risk_level} | {e.risk_score}/100 | Indexed | {e.notes or 'None'} |")

    md_lines.append("\n## Chronological Investigation Log")
    if not case_detail.notes:
        md_lines.append("*No investigation notes recorded.*")
    else:
        for n in case_detail.notes:
            md_lines.append(f"- **[{n.created_at}] {n.author}**: {n.content}")

    md_lines.append("\n---\n*Generated by ShieldNet ScamTrace Case Management Engine. Confidential & Privileged.*")
    return Response(
        content="\n".join(md_lines),
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=case_{case_id[:8]}.md"}
    )
