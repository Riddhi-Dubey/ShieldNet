from pydantic import BaseModel, ConfigDict, model_validator
from typing import List, Optional, Any
from datetime import datetime


class DatasetUploadSummary(BaseModel):
    dataset_name: str
    total_rows: int
    processed_rows: int
    imported_entities: int
    imported_relationships: int
    rejected_rows: int
    duplicate_rows: int
    warnings: List[str]
    import_status: str


class DatasetImportHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    import_id: str
    dataset_name: str
    name: Optional[str] = None
    source: Optional[str] = None
    records_processed: int
    records_imported: int
    recordCount: Optional[int] = None
    record_count: Optional[int] = None
    records_rejected: int
    records_duplicated: int
    import_status: str
    status: Optional[str] = None
    classification: Optional[str] = None
    limitations: Optional[str] = None
    isSynthetic: Optional[bool] = None
    imported_at: datetime

    @model_validator(mode="before")
    @classmethod
    def populate_display_fields(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            dname = getattr(data, "dataset_name", "")
            rec = getattr(data, "records_imported", 0)
            st = getattr(data, "import_status", "COMPLETED")
            is_syn = "synthetic" in str(dname).lower() or "paysim" in str(dname).lower()
            return {
                "import_id": getattr(data, "import_id", ""),
                "dataset_name": dname,
                "name": dname,
                "source": "National Threat Repository" if not is_syn else "Synthetic Pattern Generator",
                "records_processed": getattr(data, "records_processed", 0),
                "records_imported": rec,
                "recordCount": rec,
                "record_count": rec,
                "records_rejected": getattr(data, "records_rejected", 0),
                "records_duplicated": getattr(data, "records_duplicated", 0),
                "import_status": st,
                "status": st,
                "classification": "Synthetic Data" if is_syn else "Verified Intelligence",
                "limitations": "Simulated honeypot patterns" if is_syn else "Consented and cross-verified reports",
                "isSynthetic": is_syn,
                "imported_at": getattr(data, "imported_at", datetime.now()),
            }
        return data
