import pytest
from fastapi.testclient import TestClient


def test_case_lifecycle_and_investigation_workflow(client: TestClient):
    # 1. Create a new case
    case_payload = {
        "title": "Operation Ghost Mules — SBI KYC Phishing Ring",
        "description": "Multi-tier phishing syndicate utilizing SMS spoofing and intermediate UPI mule laundering.",
        "priority": "HIGH",
        "status": "OPEN",
        "assigned_to": "Officer Vikram"
    }
    create_res = client.post("/api/cases", json=case_payload)
    assert create_res.status_code == 201
    case_data = create_res.json()
    case_id = case_data["case_id"]
    assert case_data["title"] == case_payload["title"]
    assert case_data["priority"] == "HIGH"
    assert case_data["status"] == "OPEN"
    assert len(case_data["notes"]) >= 1

    # 2. List cases
    list_res = client.get("/api/cases")
    assert list_res.status_code == 200
    cases_list = list_res.json()
    assert len(cases_list) > 0
    assert any(c["case_id"] == case_id for c in cases_list)

    # 3. Attach a synthetic suspect entity to the case
    # First search or get an entity
    search_res = client.post("/api/search", json={"identifier": "+91 98765 00001", "entity_type": "PHONE"})
    assert search_res.status_code == 200
    found_entity = search_res.json()["entity"]
    assert found_entity is not None
    entity_id = found_entity["id"]

    attach_res = client.post(f"/api/cases/{case_id}/entities", json={
        "entity_id": entity_id,
        "notes": "Primary sender of malicious KYC suspension SMS lures."
    })
    assert attach_res.status_code == 200
    attached_data = attach_res.json()
    assert any(e["entity_id"] == entity_id for e in attached_data["entities"])

    # 4. Add an investigator forensic note
    note_res = client.post(f"/api/cases/{case_id}/notes", json={
        "content": "Forensic correlation links this phone to 3 secondary mule bank accounts in PaySim stream.",
        "author": "Officer Vikram"
    })
    assert note_res.status_code == 200
    updated_case = note_res.json()
    assert any("Forensic correlation" in n["content"] for n in updated_case["notes"])

    # 5. Update case status to ESCALATED
    put_res = client.put(f"/api/cases/{case_id}", json={
        "status": "ESCALATED",
        "priority": "CRITICAL"
    })
    assert put_res.status_code == 200
    assert put_res.json()["status"] == "ESCALATED"
    assert put_res.json()["priority"] == "CRITICAL"

    # 6. Check Threat Timeline of the attached entity
    timeline_res = client.get(f"/api/entities/{entity_id}/timeline")
    assert timeline_res.status_code == 200
    timeline_data = timeline_res.json()
    assert timeline_data["found"] is True
    assert timeline_data["total_events"] > 0
    assert any(ev["event_type"] == "CASE_ASSOCIATION" for ev in timeline_data["events"])

    # 7. Export case dossier in markdown
    md_res = client.get(f"/api/cases/{case_id}/export?format=markdown")
    assert md_res.status_code == 200
    assert "Operation Ghost Mules" in md_res.text
    assert "Officer Vikram" in md_res.text

    # 8. Export case dossier in CSV
    csv_res = client.get(f"/api/cases/{case_id}/export?format=csv")
    assert csv_res.status_code == 200
    assert "CASE FORENSIC DOSSIER" in csv_res.text

    # 9. Clean up / Delete case
    del_res = client.delete(f"/api/cases/{case_id}")
    assert del_res.status_code == 200
