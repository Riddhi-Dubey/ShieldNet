import os
import re
from typing import Dict, Any, List, Tuple
from backend.app.schemas.chat import ChatResponse
from backend.app.security.redaction import redact_sensitive_text

# Verified knowledge base for cyber safety FAQ with source attribution
FAQ_KNOWLEDGE_BASE = [
    {
        "topic": "UPI Fraud & Collect Requests",
        "keywords": ["upi", "gpay", "phonepe", "paytm", "vpa", "request money", "collect request", "reverse payment"],
        "source": "NPCI Security Advisory & RBI Consumer Guidance",
        "response": (
            "UPI Fraud typically operates via deceptive 'Collect Request' links, reverse payment claims, or fraudulent refund calls. "
            "Universal Rule of UPI: You ONLY enter your UPI PIN to SEND or DEBIT money from your account. "
            "You NEVER need to enter your UPI PIN, click 'Pay', or scan a QR code to RECEIVE money, cashback, or refunds."
        ),
        "actions": [
            "Decline unknown UPI collect requests immediately inside your banking or payment application.",
            "Never approve requests claiming to be 'lottery winnings', 'accidental transfers', or 'reimbursements'.",
            "Report fraudulent UPI VPAs to the National Cyber Crime Helpline (1930) and flag them inside your UPI app."
        ]
    },
    {
        "topic": "QR Code Fraud",
        "keywords": ["qr", "qr code", "scan qr", "barcode", "olx qr", "marketplace qr"],
        "source": "NPCI Awareness Circular & CyberDost (MHA)",
        "response": (
            "Scammers on marketplaces (OLX, Facebook Marketplace) claim they want to pay advance money for goods via a QR code and ask you to "
            "'Scan to receive funds'. Scanning a QR code and entering your PIN initiates an immediate debit from your account, never a credit."
        ),
        "actions": [
            "Never scan any QR code sent across WhatsApp, Telegram, or SMS under the pretext of receiving money.",
            "Remember QR codes are exclusively designed for sending payments, not receiving incoming deposits."
        ]
    },
    {
        "topic": "OTP & Remote Screen Sharing Scams",
        "keywords": ["otp", "one time password", "anydesk", "teamviewer", "rustdesk", "quicksupport", "screen share"],
        "source": "RBI Master Direction on Digital Payment Security",
        "response": (
            "Fraudsters impersonate bank customer care or utility executives and direct victims to install remote screen-sharing tools "
            "(AnyDesk, TeamViewer, RustDesk) or read out SMS OTPs. Once installed, they capture SMS verification codes in real-time "
            "and drain bank accounts within minutes."
        ),
        "actions": [
            "Never disclose or forward an OTP to anyone, including bank employees or police officers.",
            "Never download remote screen-sharing applications based on an incoming telephone instruction.",
            "If an app was installed, immediately toggle Airplane Mode, uninstall the app, and contact your bank to freeze netbanking."
        ]
    },
    {
        "topic": "Why Was My URL Flagged as Phishing?",
        "keywords": ["why url flagged", "why phishing", "url warning", "url signals", "phishing explain", "punycode", "shortener"],
        "source": "ShieldNet Machine Learning & Lexical Analysis Engine",
        "response": (
            "ShieldNet flags URLs using a multi-factor structural and ML classifier trained on verified threat feeds (PhishTank, OpenPhish). "
            "Key warning signals include: 1. Raw numeric IP addresses instead of registered domain names. "
            "2. Obfuscating URL shorteners (bit.ly, is.gd) masking true endpoints. "
            "3. Punycode lookalikes ('xn--') that spoof brand names. "
            "4. Excessive subdomain nesting (e.g. sbi.co.in.portal-services.xyz). "
            "5. High character randomness (Shannon entropy)."
        ),
        "actions": [
            "Never enter passwords, netbanking credentials, or OTPs on flagged URLs.",
            "Verify the destination domain directly by navigating from the organization's official homepage."
        ]
    },
    {
        "topic": "Does HTTPS Mean a Website Is Safe?",
        "keywords": ["https", "ssl", "tls", "padlock", "is https safe", "https legitimate", "green lock"],
        "source": "CISA & EFF Cyber Hygiene Guidelines",
        "response": (
            "NO. A common security misconception is that HTTPS (the padlock icon) proves a website is trustworthy or authentic. "
            "HTTPS ONLY encrypts communication in transit between your browser and the website server, preventing Wi-Fi eavesdropping. "
            "It does NOT verify the honesty of the website operator. Over 80% of modern phishing websites utilize free automated TLS certificates."
        ),
        "actions": [
            "Never rely on the padlock icon alone as proof of legitimacy.",
            "Always inspect the domain name spelling (FQDN) in the browser address bar to detect typosquatting."
        ]
    },
    {
        "topic": "Why Was My Message Flagged (Compound Risk)?",
        "keywords": ["why message flagged", "compound risk", "false positive", "message score", "urgency coercion", "kyc warning"],
        "source": "ShieldNet Behavioral Scam Detection Architecture",
        "response": (
            "ShieldNet does not trigger alerts based on isolated common words. Instead, it computes 'Compound Risk Multipliers': "
            "When institutional brand impersonation (e.g. SBI, HDFC, Police) coincides with urgency threats (account suspension, electricity disconnection, arrest) "
            "and an unverified external URL or phone contact, the combined threat score escalates to High or Critical."
        ),
        "actions": [
            "Verify notifications through official bank apps or statements, never through SMS contact numbers.",
            "Remember that banks give 30+ days written notice for KYC updates and never freeze accounts via immediate SMS links."
        ]
    },
    {
        "topic": "Digital Arrest & Police / CBI Impersonation",
        "keywords": ["digital arrest", "police call", "cbi", "customs parcel", "drugs in courier", "mha", "skype call", "video call arrest"],
        "source": "Indian Cyber Crime Coordination Centre (I4C) & MHA Advisory",
        "response": (
            "Scammers pose as Police, CBI, Customs, or Narcotics Control Bureau (NCB) officers, alleging that a courier parcel containing narcotics, "
            "fake passports, or illicit SIMs was intercepted in your name. They hold victims on prolonged WhatsApp/Skype video calls under a fake "
            "'Digital Arrest' and coerce them into transferring funds to 'government clearing accounts' (which are actually mule accounts)."
        ),
        "actions": [
            "Remember: Law enforcement agencies NEVER conduct arrests or legal interrogations over Skype, WhatsApp, or video calls.",
            "No government department requires citizens to transfer funds to 'verify clean money' or avoid arrest.",
            "Disconnect the call immediately and dial 1930 to report the phone numbers."
        ]
    },
    {
        "topic": "Fake Job & Merchant Task Scams",
        "keywords": ["fake job", "part time job", "telegram job", "work from home", "like videos", "youtube like", "daily income", "merchant task"],
        "source": "CERT-In Cyber Security Advisory on Online Part-Time Job Frauds",
        "response": (
            "Task scams promise 2,000–5,000 INR daily for simple tasks like rating hotels, liking YouTube videos, or reviewing products. "
            "To gain confidence, scammers pay small initial payouts (150–500 INR). Later, they add victims to Telegram VIP channels and demand "
            "large 'prepaid merchant deposits' to unlock accrued profits, which can never be withdrawn."
        ),
        "actions": [
            "Legitimate companies never ask candidates to pay security deposits or investment fees to work.",
            "Immediately cease communication and do not attempt to 'recover' money by depositing further funds."
        ]
    },
    {
        "topic": "Emergency Response & The Golden Hours (1930)",
        "keywords": ["report", "cybercrime", "helpline", "1930", "portal", "fir", "police complaint", "fraud happened", "golden hour"],
        "source": "National Cyber Crime Reporting Portal (cybercrime.gov.in) & RBI Guidelines",
        "response": (
            "If you have fallen victim to financial fraud, the first 2 to 4 hours (the 'Golden Hours') are critical. Rapid reporting triggers "
            "the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS) to freeze money in intermediary bank and wallet hops "
            "before cash is withdrawn at ATMs."
        ),
        "actions": [
            "Immediately dial 1930 (National Cyber Crime Helpline, 24x7 toll-free).",
            "Lodge an online complaint with transaction UTR numbers at https://cybercrime.gov.in.",
            "Notify your bank within 72 hours in writing to limit your liability under RBI zero-liability consumer circulars.",
            "Save transaction IDs, SMS timestamps, and call logs as formal forensic evidence."
        ]
    },
    {
        "topic": "How ScamTrace Identifies Scam Networks",
        "keywords": ["scamtrace", "network graph", "how network works", "mule accounts", "clusters", "centrality", "connections"],
        "source": "ShieldNet Graph Intelligence Engine Documentation",
        "response": (
            "ScamTrace maps threat relationships across Phone numbers, URLs, Bank accounts, and Crypto wallets using a directed graph. "
            "When multiple independent reports link the same phone number to different mule bank accounts or phishing domains, "
            "ScamTrace identifies the common hub (high network centrality) and flags the interconnected criminal syndicate cluster."
        ),
        "actions": [
            "Investigate suspect identifiers using universal search in ScamTrace.",
            "Inspect multi-hop connection pathways to understand how stolen funds are layered across accounts."
        ]
    },
    {
        "topic": "Privacy & Zero-Storage Guarantees",
        "keywords": ["privacy", "zero storage", "in memory", "is my data saved", "data retention", "gdpr", "consent"],
        "source": "ShieldNet Privacy by Design Architecture",
        "response": (
            "ShieldNet adheres strictly to Privacy-by-Design: 1. ScamShield message and URL scanning routes execute purely in volatile RAM (0 bytes written to database). "
            "2. No citizen text is sent to third-party commercial AI APIs (OpenAI, Anthropic). "
            "3. Sensitive PII (OTPs, PINs, passwords, Aadhaar numbers) is automatically stripped via server-side redaction before any report preview. "
            "4. No threat indicator is shared with ScamTrace without an explicit, server-verified cryptographic consent record."
        ),
        "actions": [
            "Review sanitized report previews before consenting to intelligence sharing.",
            "You can revoke your consent at any time to halt intelligence propagation."
        ]
    }
]


def answer_cyber_query(query: str, session_id: str = None) -> ChatResponse:
    """
    Answers user cybersecurity inquiries using curated verified knowledge with source attribution.
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
        confidence = round(min(1.0, max(0.65, max_score / 6.0)), 2)
        return ChatResponse(
            query_topic=best_match["topic"],
            response=best_match["response"],
            reply=best_match["response"],
            confidence=confidence,
            source_attribution=best_match.get("source", "Verified Cyber Defense Standard"),
            recommended_actions=best_match["actions"],
            emergency_contacts=[
                "National Cyber Crime Helpline: Dial 1930 (Toll-Free, 24x7)",
                "Official Complaint Portal: https://cybercrime.gov.in",
                "RBI Sachet Consumer Portal: https://sachet.rbi.org.in"
            ],
            disclaimer="Verified defensive advisory. ShieldNet will never ask for your passwords, OTPs, or financial PINs."
        )

    # General Fallback response
    fallback_text = (
        "I could not match your exact query to a specific known scam pattern in our indexed knowledge base, "
        "but here are universal cybersecurity principles: "
        "1. Never share OTPs, PINs, or banking passwords with anyone under any circumstances. "
        "2. Entering a UPI PIN only sends money; you never enter a PIN to receive refunds or funds. "
        "3. Police, CBI, and RBI never place citizens under 'digital arrest' or demand payments over WhatsApp/Skype."
    )
    return ChatResponse(
        query_topic="Universal Cyber Defense Principles",
        response=fallback_text,
        reply=fallback_text,
        confidence=0.55,
        source_attribution="CERT-In & RBI Consumer Awareness Standards",
        recommended_actions=[
            "If you suspect fraudulent activity or unauthorized debit, call the 24x7 Helpline at 1930 immediately.",
            "Freeze compromised cards or netbanking credentials through your official mobile banking app.",
            "Ask me about: UPI Fraud, QR Code Scams, Digital Arrests, URL Phishing Signals, or Emergency Reporting."
        ],
        emergency_contacts=[
            "National Cyber Crime Helpline: 1930",
            "Portal: https://cybercrime.gov.in"
        ],
        disclaimer="Advisory information only. Always corroborate directly with your verified financial institution."
    )
