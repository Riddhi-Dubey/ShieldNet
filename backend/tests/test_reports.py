import pytest
from fastapi.testclient import TestClient


def test_report_dossier_export(client: TestClient):
    # Find an entity from synthetic demo
    search_res = client.post("/api/search", json={
        "identifier": "+91 98765 00001",
        "entity_type": "PHONE"
    })
    entity_id = search_res.json()["entity"]["entity_id"]

    # 1. Fetch reports for entity
    reps_res = client.get(f"/api/reports/{entity_id}")
    assert reps_res.status_code == 200
    assert reps_res.json()["total_reports"] >= 1

    # 2. Export CSV dossier
    csv_res = client.get(f"/api/entities/{entity_id}/export?format=csv")
    assert csv_res.status_code == 200
    assert csv_res.headers["content-type"].startswith("text/csv")
    csv_content = csv_res.text
    assert "SCAMTRACE THREAT INTELLIGENCE DOSSIER" in csv_content
    assert entity_id in csv_content
    assert "LIMITATIONS" in csv_content

    # 3. Export Markdown dossier
    md_res = client.get(f"/api/entities/{entity_id}/export?format=markdown")
    assert md_res.status_code == 200
    assert md_res.headers["content-type"].startswith("text/markdown")
    md_content = md_res.text
    assert "# ScamTrace Threat Intelligence Dossier" in md_content
    assert entity_id in md_content
