import os
import re
from typing import Dict, Any, List, Tuple
from backend.app.schemas.chat import ChatResponse
from backend.app.security.redaction import redact_sensitive_text

# Verified knowledge base for cyber safety FAQ
FAQ_KNOWLEDGE_BASE = [
    {
        "topic": "UPI Fraud",
        "keywords": ["upi", "gpay", "phonepe", "paytm", "vpa", "request money", "collect request"],
        "response": (
            "UPI Fraud typically occurs through malicious 'Collect Request' links, deceptive QR codes, or fraudulent refund calls. "
            "Golden Rule of UPI: You ONLY enter your UPI PIN to SEND or DEBIT money from your bank account. "
            "You NEVER need to enter your UPI PIN or scan a QR code to RECEIVE money or refunds."
        ),
        "actions": [
            "Decline unknown UPI collect requests immediately in your payment app.",
            "Never approve requests claiming to be 'lottery winnings' or 'reimbursements'.",
            "Report fraudulent UPI IDs directly inside the UPI app and to the National Cyber Crime Helpline (1930)."
        ]
    },
    {
        "topic": "QR Code Fraud",
        "keywords": ["qr", "qr code", "scan qr", "barcode", "olx qr", "marketplace qr"],
        "response": (
            "Scammers commonly claim on online marketplaces (like OLX or Facebook Marketplace) that they have sent you money "
            "via a QR code and ask you to 'Scan to verify/receive'. Scanning a QR code and entering your PIN initiates a debit "
            "from your account, not a deposit."
        ),
        "actions": [
            "Never scan a QR code received on WhatsApp, Telegram, or SMS to receive funds.",
            "Remember QR codes are exclusively for making payments, not receiving payments."
        ]
    },
    {
        "topic": "OTP & Remote Access Scams",
        "keywords": ["otp", "one time password", "anydesk", "teamviewer", "rustdesk", "quicksupport", "screen share"],
        "response": (
            "Scammers impersonate bank customer care or tech support asking you to install remote sharing tools (AnyDesk, TeamViewer) "
            "or read out the 6-digit SMS OTP. Once installed, they capture your screen and drain your account credentials in real time."
        ),
        "actions": [
            "Never read out or forward an OTP to anyone, including bank representatives.",
            "Never install remote screen-sharing applications upon anyone's phone instruction.",
            "If already installed, immediately turn on Airplane Mode, uninstall the app, and call your bank to freeze transactions."
        ]
    },
    {
        "topic": "Phishing & Smishing",
        "keywords": ["phishing", "smishing", "fake link", "sms link", "click link", "website", "pan link", "aadhaar link"],
        "response": (
            "Phishing involves deceptive emails or SMS messages (Smishing) containing links to cloned websites resembling banks, "
            "courier firms, or government bodies. These capture your user ID, password, and credit card details."
        ),
        "actions": [
            "Never click shortened or unfamiliar links sent via SMS.",
            "Verify the URL netloc matches the official domain exactly (look out for subtle typos).",
            "Bookmark legitimate banking sites and access them directly from your browser."
        ]
    },
    {
        "topic": "Fake Jobs & Task Scams",
        "keywords": ["fake job", "part time job", "telegram job", "work from home", "like videos", "youtube like", "daily income", "merchant task"],
        "response": (
            "Task scams promise 3,000–5,000 INR per day for liking YouTube videos, rating Google Maps locations, or completing hotel reviews. "
            "They pay a small initial incentive (e.g. 150 INR) to gain trust, then trick victims into paying large 'prepaid security deposits' to unlock frozen earnings."
        ),
        "actions": [
            "Real employers never charge candidates money or 'security deposits' to work.",
            "Leave the Telegram group immediately and do not transfer any 'investment' or 'prepaid' funds."
        ]
    },
    {
        "topic": "Bank & Authority Impersonation",
        "keywords": ["bank impersonation", "sbi", "hdfc", "icici", "rbi", "police", "customs", "cbi", "electricity", "power cut", "digital arrest"],
        "response": (
            "Scammers pose as Police, CBI, Customs, or Electricity department officers, threatening imminent arrest for 'drugs in parcel' "
            "or immediate power disconnection unless an urgent payment is made. This tactic is termed 'Digital Arrest' or Authority Coercion."
        ),
        "actions": [
            "Police, CBI, and RBI never place citizens under 'digital arrest' over video calls (Skype/WhatsApp).",
            "Official agencies do not demand settlement payments to personal UPI accounts or crypto wallets.",
            "Disconnect the call immediately and dial 1930."
        ]
    },
    {
        "topic": "Account Protection & Hygiene",
        "keywords": ["protect account", "security settings", "mfa", "two factor", "sim swap", "strong password", "freeze account"],
        "response": (
            "Core digital hygiene practices drastically reduce fraud vulnerability: 2-Factor Authentication (prefer authenticator apps over SMS), "
            "strict transaction limits on net banking and debit cards, and vigilant monitoring of mobile network connectivity (to detect SIM swap attacks)."
        ),
        "actions": [
            "Set daily transaction limits on your debit cards and UPI apps.",
            "Enable biometric login or app lock for all financial applications.",
            "If your mobile SIM suddenly loses signal unexpectedly, notify your mobile operator immediately to check for unauthorized SIM swaps."
        ]
    },
    {
        "topic": "Reporting Cybercrime",
        "keywords": ["report", "cybercrime", "helpline", "1930", "portal", "fir", "police complaint", "fraud happened"],
        "response": (
            "If you have fallen victim to financial cyber fraud, the first 2–4 hours (the 'Golden Hours') are critical. Rapid reporting allows "
            "banks and law enforcement to freeze the money in transit before fraudsters withdraw it at ATMs."
        ),
        "actions": [
            "Immediately dial 1930 (National Cyber Crime Reporting Helpline).",
            "File a complaint at https://cybercrime.gov.in.",
            "Take screenshots of payment transaction IDs, messages, and call logs as evidence.",
            "Notify your home bank branch within 72 hours for zero-liability protection under RBI guidelines."
        ]
    }
]


def answer_cyber_query(query: str, session_id: str = None) -> ChatResponse:
    """
    Answers user cybersecurity inquiries using curated verified knowledge.
    Redacts sensitive text and ensures safe, non-hallucinated guidance.
    """
    redacted_query = redact_sensitive_text(query).lower()

    best_match = None
    max_score = 0

    for item in FAQ_KNOWLEDGE_BASE:
        score = 0
        for kw in item["keywords"]:
            if re.search(r'\b' + re.escape(kw) + r'\b', redacted_query):
                score += 3
            elif kw in redacted_query:
                score += 1
        if score > max_score:
            max_score = score
            best_match = item

    if best_match and max_score > 0:
        return ChatResponse(
            query_topic=best_match["topic"],
            response=best_match["response"],
            confidence=round(min(1.0, max_score / 6.0), 2),
            recommended_actions=best_match["actions"],
            emergency_contacts=[
                "National Cyber Crime Helpline: Dial 1930 (Toll-Free, 24x7)",
                "Official Portal: https://cybercrime.gov.in",
                "RBI Sachet Portal: https://sachet.rbi.org.in"
            ],
            disclaimer="Verified advisory. ShieldNet will never ask for your passwords, OTPs, or financial pins."
        )

    # Fallback response
    return ChatResponse(
        query_topic="General Cyber Safety Guidance",
        response=(
            "I could not match your exact question to a specific fraud category, but here are universal safety principles: "
            "1. Never share OTPs, PINs, or banking passwords with anyone. "
            "2. Scanning a QR code or entering a UPI PIN only sends money, never receives money. "
            "3. Official authorities (Police, CBI, Banks) never conduct 'digital arrests' over WhatsApp or Skype calls."
        ),
        confidence=0.5,
        recommended_actions=[
            "If you suspect fraudulent activity, immediately call the Cyber Crime Helpline at 1930.",
            "Freeze compromised cards/accounts via your bank's official emergency numbers.",
            "Check out our scam categories: UPI Fraud, OTP Scams, Phishing Links, Fake Jobs, or Digital Arrests."
        ],
        emergency_contacts=[
            "National Cyber Crime Helpline: 1930",
            "Portal: https://cybercrime.gov.in"
        ],
        disclaimer="Advisory information only. Always corroborate with your financial institution."
    )
