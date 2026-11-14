import io
import pytest
from fastapi.testclient import TestClient


def test_paysim_csv_upload_and_mapping(client: TestClient):
    # Simulated PaySim CSV content
    csv_content = (
        "step,type,amount,nameOrig,nameDest,oldbalanceOrg,newbalanceOrig,oldbalanceDest,newbalanceDest,isFraud,isFlaggedFraud\n"
        "1,TRANSFER,181.0,C1231006815,M1979787155,181.0,0.0,0.0,0.0,1,0\n"
        "1,CASH_OUT,181.0,C1231006815,M1979787155,181.0,0.0,21182.0,0.0,1,0\n"
        "1,PAYMENT,9477.74,C1231006816,M1979787156,170136.0,160658.26,0.0,0.0,0,0\n"
    )

    files = {
        "file": ("paysim_sample.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    data = {
        "dataset_name": "PaySim_Test_Batch"
    }

    res = client.post("/api/datasets/upload", data=data, files=files)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["dataset_name"] == "PaySim_Test_Batch"
    assert res_data["total_rows"] == 3
    assert res_data["imported_entities"] >= 2
    assert res_data["imported_relationships"] >= 1
    assert res_data["import_status"] == "SUCCESS"

    # Verify status history
    status_res = client.get("/api/datasets/status")
    assert status_res.status_code == 200
    history = status_res.json()
    assert len(history) > 0
    assert any(h["dataset_name"] == "PaySim_Test_Batch" for h in history)


def test_missing_dataset_fallback(client: TestClient):
    # System should operate normally even when external Kaggle datasets are not present on disk
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "HEALTHY"

    stats_res = client.get("/api/dashboard/stats")
    assert stats_res.status_code == 200
    assert stats_res.json()["total_entities"] >= 30
