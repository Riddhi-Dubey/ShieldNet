import io
import uuid
import pandas as pd
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.entity import Entity
from backend.app.models.relationship import Relationship
from backend.app.models.evidence import Evidence
from backend.app.models.dataset import DatasetImport
from backend.app.schemas.dataset import DatasetUploadSummary
from backend.app.security.validation import normalize_identifier, generate_stable_entity_id
from backend.app.services.risk_scoring import calculate_risk_level


def process_dataset_csv(
    db: Session,
    file_bytes: bytes,
    dataset_name: str,
    column_mapping: Optional[Dict[str, str]] = None,
    max_rows: int = 5000
) -> DatasetUploadSummary:
    """
    Reusable data processing pipeline for CSV dataset ingestion.
    Supports PaySim, PhishTank, Elliptic Bitcoin, LegitPhish, and generic custom schemas.
    Normalizes entities, detects duplicates, creates relationships, records provenance.
    """
    warnings: List[str] = []
    total_rows = 0
    processed_rows = 0
    imported_entities = 0
    imported_relationships = 0
    rejected_rows = 0
    duplicate_rows = 0

    try:
        df = pd.read_csv(io.BytesIO(file_bytes), nrows=max_rows)
        total_rows = len(df)
    except Exception as e:
        return DatasetUploadSummary(
            dataset_name=dataset_name,
            total_rows=0,
            processed_rows=0,
            imported_entities=0,
            imported_relationships=0,
            rejected_rows=0,
            duplicate_rows=0,
            warnings=[f"Failed to parse CSV file: {str(e)}"],
            import_status="FAILED"
        )

    # Normalize column names to lowercase for robust schema inspection
    df_cols = {col.lower().strip(): col for col in df.columns}
    name_upper = dataset_name.upper()

    # Dynamic schema recognition if column_mapping is not supplied
    if "PAYSIM" in name_upper or ("nameorig" in df_cols and "namedest" in df_cols):
        # PaySim simulated mobile money transactions
        orig_col = df_cols.get("nameorig", "nameOrig")
        dest_col = df_cols.get("namedest", "nameDest")
        fraud_col = df_cols.get("isfraud", "isFraud")
        amount_col = df_cols.get("amount", "amount")
        type_col = df_cols.get("type", "type")

        for _, row in df.iterrows():
            processed_rows += 1
            try:
                raw_orig = str(row[orig_col]).strip()
                raw_dest = str(row[dest_col]).strip()
                is_fraud = int(row.get(fraud_col, 0)) == 1
                amount = float(row.get(amount_col, 0.0))
                tx_type = str(row.get(type_col, "TRANSFER"))

                if not raw_orig or not raw_dest:
                    rejected_rows += 1
                    continue

                # Treat PaySim identifiers as simulated mobile money bank accounts
                _, norm_orig = normalize_identifier("BANK_ACCOUNT", raw_orig)
                _, norm_dest = normalize_identifier("BANK_ACCOUNT", raw_dest)

                id_orig = generate_stable_entity_id("BANK_ACCOUNT", norm_orig)
                id_dest = generate_stable_entity_id("BANK_ACCOUNT", norm_dest)

                # Originator
                e_orig = db.query(Entity).filter(Entity.entity_id == id_orig).first()
                if not e_orig:
                    e_orig = Entity(
                        entity_id=id_orig,
                        entity_type="BANK_ACCOUNT",
                        identifier=raw_orig,
                        normalized_value=norm_orig,
                        risk_score=75.0 if is_fraud else 10.0,
                        risk_level="HIGH" if is_fraud else "LOW",
                        source_dataset="PAYSIM_SIMULATED",
                        evidence_status="DATASET_DERIVED"
                    )
                    db.add(e_orig)
                    imported_entities += 1
                else:
                    duplicate_rows += 1
                    if is_fraud and e_orig.risk_score < 75.0:
                        e_orig.risk_score = 75.0
                        e_orig.risk_level = "HIGH"

                # Destination
                e_dest = db.query(Entity).filter(Entity.entity_id == id_dest).first()
                if not e_dest:
                    e_dest = Entity(
                        entity_id=id_dest,
                        entity_type="BANK_ACCOUNT",
                        identifier=raw_dest,
                        normalized_value=norm_dest,
                        risk_score=80.0 if is_fraud else 15.0,
                        risk_level="CRITICAL" if is_fraud else "LOW",
                        source_dataset="PAYSIM_SIMULATED",
                        evidence_status="DATASET_DERIVED"
                    )
                    db.add(e_dest)
                    imported_entities += 1
                else:
                    duplicate_rows += 1
                    if is_fraud and e_dest.risk_score < 80.0:
                        e_dest.risk_score = 80.0
                        e_dest.risk_level = "CRITICAL"

                db.flush()

                # Relationship
                rel_id = f"paysim_{id_orig[:8]}_{id_dest[:8]}_{processed_rows}"
                rel = Relationship(
                    relationship_id=rel_id,
                    source_entity_id=id_orig,
                    target_entity_id=id_dest,
                    relationship_type=f"TRANSACTED_{tx_type.upper()}",
                    confidence=1.0,
                    evidence_source="PAYSIM_SIMULATED",
                    relationship_metadata=f'{{"amount": {amount}, "isFraud": {is_fraud}}}',
                    evidence_status="DATASET_DERIVED"
                )
                db.add(rel)
                imported_relationships += 1

                # Evidence provenance
                ev = Evidence(
                    evidence_id=str(uuid.uuid4()),
                    relationship_id=rel_id,
                    source_dataset="PAYSIM_SIMULATED",
                    original_field="nameOrig->nameDest",
                    extraction_method="PAYSIM_IMPORT_PIPELINE",
                    evidence_status="DATASET_DERIVED"
                )
                db.add(ev)

            except Exception as row_err:
                rejected_rows += 1
                warnings.append(f"Row {processed_rows} rejected: {str(row_err)[:60]}")

    elif "PHISHTANK" in name_upper or ("url" in df_cols and ("verified" in df_cols or "phish_id" in df_cols)):
        # PhishTank verified phishing records
        url_col = df_cols.get("url", "url")
        verified_col = df_cols.get("verified", "verified")
        target_col = df_cols.get("target", "target")

        for _, row in df.iterrows():
            processed_rows += 1
            try:
                raw_url = str(row[url_col]).strip()
                if not raw_url or raw_url.lower() == "nan":
                    rejected_rows += 1
                    continue

                is_verified = str(row.get(verified_col, "yes")).lower() in ["yes", "true", "1", "y"]
                target = str(row.get(target_col, "Generic"))

                _, norm_url = normalize_identifier("URL", raw_url)
                entity_id = generate_stable_entity_id("URL", norm_url)

                existing = db.query(Entity).filter(Entity.entity_id == entity_id).first()
                if not existing:
                    entity = Entity(
                        entity_id=entity_id,
                        entity_type="URL",
                        identifier=raw_url,
                        normalized_value=norm_url,
                        risk_score=90.0 if is_verified else 65.0,
                        risk_level="CRITICAL" if is_verified else "HIGH",
                        source_dataset="PHISHTANK",
                        evidence_status="VERIFIED" if is_verified else "REPORTED"
                    )
                    db.add(entity)
                    imported_entities += 1
                else:
                    duplicate_rows += 1
                    if is_verified:
                        existing.evidence_status = "VERIFIED"
                        existing.risk_score = 90.0
                        existing.risk_level = "CRITICAL"

            except Exception as row_err:
                rejected_rows += 1
                warnings.append(f"Row {processed_rows} rejected: {str(row_err)[:60]}")

    elif "ELLIPTIC" in name_upper or ("txid" in df_cols or ("class" in df_cols and "timestep" in df_cols)):
        # Elliptic Bitcoin Dataset
        tx_col = df_cols.get("txid", df.columns[0])
        class_col = df_cols.get("class", df.columns[1] if len(df.columns) > 1 else None)

        for _, row in df.iterrows():
            processed_rows += 1
            try:
                raw_tx = str(row[tx_col]).strip()
                raw_class = str(row.get(class_col, "unknown")).lower().strip()

                # Elliptic labels: '1'=illicit, '2'=licit, 'unknown'=unknown
                if raw_class in ["1", "illicit"]:
                    risk = 85.0
                    lvl = "CRITICAL"
                    status = "VERIFIED"
                elif raw_class in ["2", "licit"]:
                    risk = 10.0
                    lvl = "LOW"
                    status = "DATASET_DERIVED"
                else:
                    risk = 30.0
                    lvl = "MEDIUM"
                    status = "UNVERIFIED"

                _, norm_val = normalize_identifier("CRYPTO_WALLET", raw_tx)
                ent_id = generate_stable_entity_id("CRYPTO_WALLET", norm_val)

                existing = db.query(Entity).filter(Entity.entity_id == ent_id).first()
                if not existing:
                    e = Entity(
                        entity_id=ent_id,
                        entity_type="CRYPTO_WALLET",
                        identifier=raw_tx,
                        normalized_value=norm_val,
                        risk_score=risk,
                        risk_level=lvl,
                        source_dataset="ELLIPTIC_BITCOIN",
                        evidence_status=status
                    )
                    db.add(e)
                    imported_entities += 1
                else:
                    duplicate_rows += 1

            except Exception as row_err:
                rejected_rows += 1
                warnings.append(f"Row {processed_rows} rejected: {str(row_err)[:60]}")

    else:
        # Generic CSV column mapping
        identifier_col = None
        type_col = None

        if column_mapping:
            identifier_col = column_mapping.get("identifier")
            type_col = column_mapping.get("entity_type")

        # Fallback automatic column inspection
        if not identifier_col:
            for c in df.columns:
                c_low = c.lower()
                if any(k in c_low for k in ["identifier", "url", "phone", "account", "wallet", "number", "dest", "orig"]):
                    identifier_col = c
                    break

        if not identifier_col and len(df.columns) > 0:
            identifier_col = df.columns[0]

        for _, row in df.iterrows():
            processed_rows += 1
            try:
                raw_id = str(row[identifier_col]).strip()
                if not raw_id or raw_id.lower() == "nan":
                    rejected_rows += 1
                    continue

                user_type = str(row[type_col]).strip() if type_col and type_col in row else "AUTO"
                detected_t, norm_id = normalize_identifier(user_type, raw_id)
                e_id = generate_stable_entity_id(detected_t, norm_id)

                existing = db.query(Entity).filter(Entity.entity_id == e_id).first()
                if not existing:
                    e = Entity(
                        entity_id=e_id,
                        entity_type=detected_t,
                        identifier=raw_id,
                        normalized_value=norm_id,
                        risk_score=35.0,
                        risk_level="MEDIUM",
                        source_dataset=dataset_name,
                        evidence_status="DATASET_DERIVED"
                    )
                    db.add(e)
                    imported_entities += 1
                else:
                    duplicate_rows += 1

            except Exception as row_err:
                rejected_rows += 1
                warnings.append(f"Row {processed_rows} rejected: {str(row_err)[:60]}")

    # Record DatasetImport log
    import_rec = DatasetImport(
        import_id=str(uuid.uuid4()),
        dataset_name=dataset_name,
        records_processed=processed_rows,
        records_imported=imported_entities,
        records_rejected=rejected_rows,
        records_duplicated=duplicate_rows,
        import_status="SUCCESS" if rejected_rows < processed_rows else "PARTIAL"
    )
    db.add(import_rec)
    db.commit()

    return DatasetUploadSummary(
        dataset_name=dataset_name,
        total_rows=total_rows,
        processed_rows=processed_rows,
        imported_entities=imported_entities,
        imported_relationships=imported_relationships,
        rejected_rows=rejected_rows,
        duplicate_rows=duplicate_rows,
        warnings=warnings[:10],
        import_status=import_rec.import_status
    )
