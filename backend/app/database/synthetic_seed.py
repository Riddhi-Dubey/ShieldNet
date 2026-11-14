import json
import os
import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.entity import Entity
from backend.app.models.relationship import Relationship
from backend.app.models.report import Report
from backend.app.models.evidence import Evidence
from backend.app.security.validation import normalize_identifier, generate_stable_entity_id
from backend.app.services.risk_scoring import calculate_risk_level

SYNTHETIC_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "synthetic", "synthetic_demo.json"
)

# 1. 8+ Fictional Phone Identifiers
SYNTHETIC_PHONES = [
    {"raw": "+91 98765 00001", "risk": 85.0, "level": "CRITICAL", "note": "Impersonates SBI KYC SMS sender"},
    {"raw": "+91 98765 00002", "risk": 75.0, "level": "HIGH", "note": "Telegram part-time job recruiter"},
    {"raw": "+91 98765 00003", "risk": 70.0, "level": "HIGH", "note": "Electricity bill disconnection caller"},
    {"raw": "+91 98765 00004", "risk": 65.0, "level": "HIGH", "note": "FedEx customs officer impersonator"},
    {"raw": "+91 98765 00005", "risk": 60.0, "level": "HIGH", "note": "KBC Lottery winner SMS sender"},
    {"raw": "+91 98765 00006", "risk": 50.0, "level": "MEDIUM", "note": "Suspicious loan app telemarketer"},
    {"raw": "+91 98765 00007", "risk": 20.0, "level": "LOW", "note": "Disconnected unverified phone"},
    {"raw": "+91 98765 00008", "risk": 15.0, "level": "LOW", "note": "Innocent recipient flagged in error"},
    {"raw": "+91 98765 00009", "risk": 80.0, "level": "CRITICAL", "note": "Digital arrest scam operator"}
]

# 2. 10+ Fictional URLs ending in .invalid
SYNTHETIC_URLS = [
    {"raw": "http://sbi-secure-update-kyc.portal-services.invalid/login", "risk": 90.0, "level": "CRITICAL"},
    {"raw": "http://hdfc-netbanking-alert.security-auth.invalid/verify", "risk": 85.0, "level": "CRITICAL"},
    {"raw": "http://free-lottery-gift-claim.kbc-reward.invalid/register", "risk": 80.0, "level": "CRITICAL"},
    {"raw": "http://telegram-work-daily-payout.merchant-task.invalid/earn", "risk": 75.0, "level": "HIGH"},
    {"raw": "http://electricity-bill-power-cutoff.payment-alert.invalid/bill", "risk": 80.0, "level": "CRITICAL"},
    {"raw": "http://fedex-parcel-clearance-customs.delivery-hold.invalid/pay", "risk": 75.0, "level": "HIGH"},
    {"raw": "http://crypto-doubler-investment.yield-multiplier.invalid/deposit", "risk": 85.0, "level": "CRITICAL"},
    {"raw": "http://axis-bank-pan-card-link.customer-support.invalid/auth", "risk": 70.0, "level": "HIGH"},
    {"raw": "http://instant-personal-loan-no-cibil.fast-credit.invalid/apply", "risk": 60.0, "level": "HIGH"},
    {"raw": "http://airtel-sim-5g-upgrade.esim-verification.invalid/kyc", "risk": 75.0, "level": "HIGH"},
    {"raw": "http://safe-community-educational-demo.invalid/guide", "risk": 10.0, "level": "LOW"},  # Disconnected
    {"raw": "http://unverified-local-blog.invalid/article", "risk": 15.0, "level": "LOW"}           # Disconnected
]

# 3. 8+ Simulated Bank Accounts
SYNTHETIC_BANKS = [
    {"raw": "SIMBANK9001001", "risk": 90.0, "level": "CRITICAL", "note": "Primary mule deposit account (Scenario 1)"},
    {"raw": "SIMBANK9001002", "risk": 85.0, "level": "CRITICAL", "note": "Layering mule account #1 (Scenario 2)"},
    {"raw": "SIMBANK9001003", "risk": 80.0, "level": "CRITICAL", "note": "Layering mule account #2 (Scenario 2)"},
    {"raw": "SIMBANK9001004", "risk": 75.0, "level": "HIGH", "note": "ATM cash-out account #1"},
    {"raw": "SIMBANK9001005", "risk": 75.0, "level": "HIGH", "note": "ATM cash-out account #2"},
    {"raw": "SIMBANK9001006", "risk": 60.0, "level": "HIGH", "note": "Task scam receiving VPA account"},
    {"raw": "SIMBANK9001007", "risk": 50.0, "level": "MEDIUM", "note": "Merchant gateway shell account"},
    {"raw": "SIMBANK9001008", "risk": 15.0, "level": "LOW", "note": "Legitimate peer account with zero complaints"},
    {"raw": "SIMBANK9001009", "risk": 10.0, "level": "LOW", "note": "Dormant test account"}
]

# 4. 5+ Fictional Cryptocurrency Wallets
SYNTHETIC_WALLETS = [
    {"raw": "0x71c6bf5e5c7066914b3014a4cf794270b21a0001", "risk": 90.0, "level": "CRITICAL", "note": "Primary ransomware/scam aggregator wallet"},
    {"raw": "0x71c6bf5e5c7066914b3014a4cf794270b21a0002", "risk": 85.0, "level": "CRITICAL", "note": "Tumbler / mixer entry wallet"},
    {"raw": "0x71c6bf5e5c7066914b3014a4cf794270b21a0003", "risk": 80.0, "level": "CRITICAL", "note": "Overseas cash-out exchange deposit"},
    {"raw": "1A1zP1eP5QGefi2DMPTfTL5SLmv7Div0001", "risk": 75.0, "level": "HIGH", "note": "Bitcoin investment scam wallet"},
    {"raw": "1A1zP1eP5QGefi2DMPTfTL5SLmv7Div0002", "risk": 70.0, "level": "HIGH", "note": "Bitcoin forwarder wallet"},
    {"raw": "0x71c6bf5e5c7066914b3014a4cf794270b21a0009", "risk": 10.0, "level": "LOW", "note": "Clean unverified cold wallet"}
]


def seed_synthetic_data(db: Session):
    """
    Seeds the SQLite database with 30+ synthetic entities, 25+ relationships,
    multiple scam reports, and connected scenarios.
    All records carry evidence_status='SYNTHETIC' and source_dataset='SYNTHETIC_DEMO'.
    """
    created_entities: Dict[str, str] = {}  # key -> entity_id

    # 1. Insert Phones
    for p in SYNTHETIC_PHONES:
        t, norm = normalize_identifier("PHONE", p["raw"])
        eid = generate_stable_entity_id(t, norm)
        created_entities[p["raw"]] = eid
        if not db.query(Entity).filter(Entity.entity_id == eid).first():
            db.add(Entity(
                entity_id=eid,
                entity_type=t,
                identifier=p["raw"],
                normalized_value=norm,
                risk_score=p["risk"],
                risk_level=p["level"],
                source_dataset="SYNTHETIC_DEMO",
                evidence_status="SYNTHETIC"
            ))

    # 2. Insert URLs
    for u in SYNTHETIC_URLS:
        t, norm = normalize_identifier("URL", u["raw"])
        eid = generate_stable_entity_id(t, norm)
        created_entities[u["raw"]] = eid
        if not db.query(Entity).filter(Entity.entity_id == eid).first():
            db.add(Entity(
                entity_id=eid,
                entity_type=t,
                identifier=u["raw"],
                normalized_value=norm,
                risk_score=u["risk"],
                risk_level=u["level"],
                source_dataset="SYNTHETIC_DEMO",
                evidence_status="SYNTHETIC"
            ))

    # 3. Insert Bank Accounts
    for b in SYNTHETIC_BANKS:
        t, norm = normalize_identifier("BANK_ACCOUNT", b["raw"])
        eid = generate_stable_entity_id(t, norm)
        created_entities[b["raw"]] = eid
        if not db.query(Entity).filter(Entity.entity_id == eid).first():
            db.add(Entity(
                entity_id=eid,
                entity_type=t,
                identifier=b["raw"],
                normalized_value=norm,
                risk_score=b["risk"],
                risk_level=b["level"],
                source_dataset="SYNTHETIC_DEMO",
                evidence_status="SYNTHETIC"
            ))

    # 4. Insert Crypto Wallets
    for w in SYNTHETIC_WALLETS:
        t, norm = normalize_identifier("CRYPTO_WALLET", w["raw"])
        eid = generate_stable_entity_id(t, norm)
        created_entities[w["raw"]] = eid
        if not db.query(Entity).filter(Entity.entity_id == eid).first():
            db.add(Entity(
                entity_id=eid,
                entity_type=t,
                identifier=w["raw"],
                normalized_value=norm,
                risk_score=w["risk"],
                risk_level=w["level"],
                source_dataset="SYNTHETIC_DEMO",
                evidence_status="SYNTHETIC"
            ))

    db.flush()

    # 5. Insert Prepared Relationships (>= 25 relationships across 3 scenarios)
    # Helper to create relationship
    def add_rel(src_raw, tgt_raw, rel_type, conf=1.0, meta=None):
        sid = created_entities.get(src_raw)
        tid = created_entities.get(tgt_raw)
        if sid and tid:
            rid = f"syn_rel_{sid[:6]}_{tid[:6]}_{rel_type[:6]}"
            if not db.query(Relationship).filter(Relationship.relationship_id == rid).first():
                db.add(Relationship(
                    relationship_id=rid,
                    source_entity_id=sid,
                    target_entity_id=tid,
                    relationship_type=rel_type,
                    confidence=conf,
                    evidence_source="SYNTHETIC_DEMO",
                    relationship_metadata=meta or '{"scenario": "demonstration"}',
                    evidence_status="SYNTHETIC"
                ))

    # Scenario 1: Phone -> Suspicious URL -> Simulated Bank Account (Mule Account)
    add_rel("+91 98765 00001", "http://sbi-secure-update-kyc.portal-services.invalid/login", "SENDS_SMS_LINK", 0.95)
    add_rel("http://sbi-secure-update-kyc.portal-services.invalid/login", "SIMBANK9001001", "REDIRECTS_PAYMENT_TO", 0.90)
    add_rel("+91 98765 00003", "http://electricity-bill-power-cutoff.payment-alert.invalid/bill", "SENDS_SMS_LINK", 0.95)
    add_rel("http://electricity-bill-power-cutoff.payment-alert.invalid/bill", "SIMBANK9001001", "REDIRECTS_PAYMENT_TO", 0.90)
    add_rel("+91 98765 00004", "http://fedex-parcel-clearance-customs.delivery-hold.invalid/pay", "SENDS_SMS_LINK", 0.92)
    add_rel("http://fedex-parcel-clearance-customs.delivery-hold.invalid/pay", "SIMBANK9001006", "COLLECTS_FEE_INTO", 0.88)
    add_rel("+91 98765 00005", "http://free-lottery-gift-claim.kbc-reward.invalid/register", "SENDS_SMS_LINK", 0.95)
    add_rel("http://free-lottery-gift-claim.kbc-reward.invalid/register", "SIMBANK9001007", "PROMISES_TRANSFER_FROM", 0.80)
    add_rel("+91 98765 00002", "http://telegram-work-daily-payout.merchant-task.invalid/earn", "RECRUITS_VIA", 0.90)
    add_rel("http://telegram-work-daily-payout.merchant-task.invalid/earn", "SIMBANK9001006", "REQUIRES_DEPOSIT_TO", 0.95)

    # Scenario 2: Simulated Bank Account -> Transaction Pathway -> Layering Mule Accounts -> Cash-outs
    add_rel("SIMBANK9001001", "SIMBANK9001002", "TRANSFERRED_FUNDS", 0.98, '{"amount": 150000, "step": 1}')
    add_rel("SIMBANK9001001", "SIMBANK9001003", "TRANSFERRED_FUNDS", 0.98, '{"amount": 250000, "step": 1}')
    add_rel("SIMBANK9001002", "SIMBANK9001004", "TRANSFERRED_FUNDS", 0.95, '{"amount": 75000, "step": 2}')
    add_rel("SIMBANK9001002", "SIMBANK9001005", "TRANSFERRED_FUNDS", 0.95, '{"amount": 70000, "step": 2}')
    add_rel("SIMBANK9001003", "SIMBANK9001004", "TRANSFERRED_FUNDS", 0.95, '{"amount": 120000, "step": 2}')
    add_rel("SIMBANK9001003", "SIMBANK9001005", "TRANSFERRED_FUNDS", 0.95, '{"amount": 125000, "step": 2}')
    add_rel("SIMBANK9001006", "SIMBANK9001002", "SPLIT_FORWARDED", 0.90, '{"amount": 50000}')
    add_rel("SIMBANK9001007", "SIMBANK9001003", "SPLIT_FORWARDED", 0.85, '{"amount": 40000}')

    # Scenario 3: Crypto Wallet -> Connected Transaction Network (Laundering Cluster)
    add_rel("0x71c6bf5e5c7066914b3014a4cf794270b21a0001", "0x71c6bf5e5c7066914b3014a4cf794270b21a0002", "FORWARDED_CRYPTO", 0.99, '{"asset": "ETH", "tx_volume": 42.5}')
    add_rel("0x71c6bf5e5c7066914b3014a4cf794270b21a0002", "0x71c6bf5e5c7066914b3014a4cf794270b21a0003", "DEPOSITED_TO_EXCHANGE", 0.95, '{"asset": "ETH", "tx_volume": 40.0}')
    add_rel("1A1zP1eP5QGefi2DMPTfTL5SLmv7Div0001", "1A1zP1eP5QGefi2DMPTfTL5SLmv7Div0002", "FORWARDED_CRYPTO", 0.98, '{"asset": "BTC", "tx_volume": 1.85}')
    add_rel("http://crypto-doubler-investment.yield-multiplier.invalid/deposit", "0x71c6bf5e5c7066914b3014a4cf794270b21a0001", "COLLECTS_CRYPTO_TO", 0.95)
    add_rel("+91 98765 00009", "0x71c6bf5e5c7066914b3014a4cf794270b21a0001", "EXTORTION_PAYOUT_TO", 0.92)

    # Inter-cluster bridging relationships (Cross-scenario investigative lead)
    add_rel("SIMBANK9001005", "0x71c6bf5e5c7066914b3014a4cf794270b21a0001", "P2P_CRYPTO_PURCHASE", 0.85, '{"onramp": "P2P_DESK"}')
    add_rel("http://axis-bank-pan-card-link.customer-support.invalid/auth", "SIMBANK9001001", "REDIRECTS_PAYMENT_TO", 0.88)
    add_rel("+91 98765 00006", "http://instant-personal-loan-no-cibil.fast-credit.invalid/apply", "SMS_ADVERTISEMENT", 0.80)
    add_rel("http://instant-personal-loan-no-cibil.fast-credit.invalid/apply", "SIMBANK9001007", "ADVANCE_FEE_COLLECTION", 0.85)
    add_rel("+91 98765 00001", "http://hdfc-netbanking-alert.security-auth.invalid/verify", "SENDS_SMS_LINK", 0.94)

    # 6. Insert Reports
    reports_data = [
        ("+91 98765 00001", "OTP_THEFT", "Caller impersonated SBI fraud desk, requested urgent KYC verification via link."),
        ("http://sbi-secure-update-kyc.portal-services.invalid/login", "PHISHING", "Cloned SBI YONO login page attempting to capture net banking credentials."),
        ("SIMBANK9001001", "UPI_FRAUD", "Victim lost ₹45,000 sent to this recipient account during fake electricity bill threat."),
        ("+91 98765 00002", "FAKE_JOB", "Recruiter in Telegram promised ₹5,000 daily for rating hotel locations, then demanded ₹10,000 security deposit."),
        ("0x71c6bf5e5c7066914b3014a4cf794270b21a0001", "CRYPTO_FRAUD", "Victim sent 2.5 ETH to doubler investment website that refused withdrawals."),
        ("+91 98765 00009", "IMPERSONATION", "Scammer impersonated CBI police officer in video call claiming digital arrest for courier parcel.")
    ]

    for raw_id, stype, desc in reports_data:
        eid = created_entities.get(raw_id)
        if eid:
            rep_id = f"syn_rep_{eid[:8]}_{stype[:4]}"
            if not db.query(Report).filter(Report.report_id == rep_id).first():
                db.add(Report(
                    report_id=rep_id,
                    entity_id=eid,
                    scam_type=stype,
                    description=desc,
                    source="SYNTHETIC_DEMO",
                    verification_status="VERIFIED"
                ))

    db.commit()
    print("Synthetic demonstration dataset successfully seeded into database.")

    # Export to JSON file for archival
    os.makedirs(os.path.dirname(SYNTHETIC_DATA_PATH), exist_ok=True)
    summary_data = {
        "metadata": {
            "dataset_name": "SYNTHETIC_DEMO",
            "evidence_status": "SYNTHETIC",
            "description": "Fictional demonstration threat dataset. Not real intelligence.",
            "domains_suffix": ".invalid"
        },
        "phones_count": len(SYNTHETIC_PHONES),
        "urls_count": len(SYNTHETIC_URLS),
        "banks_count": len(SYNTHETIC_BANKS),
        "wallets_count": len(SYNTHETIC_WALLETS),
        "scenarios": [
            "Scenario 1: Phone -> Suspicious URL -> Simulated Bank Account",
            "Scenario 2: Simulated Bank Account -> Transaction Pathway -> Layering Mules",
            "Scenario 3: Cryptocurrency Wallet -> Laundering Network"
        ]
    }
    with open(SYNTHETIC_DATA_PATH, "w") as f:
        json.dump(summary_data, f, indent=2)
