"""
Official Regional Cybercrime, Emergency, and Fraud Support Contacts.
Verified government, police, and consumer protection sources only.
"""

from typing import Dict, Any, List

HELP_CONTACTS_BY_COUNTRY: Dict[str, Dict[str, Any]] = {
    "IN": {
        "country_code": "IN",
        "country_name": "India",
        "emergency": [
            {
                "name": "National Emergency Helpline",
                "contact": "112",
                "type": "phone",
                "description": "Unified national emergency number for immediate police, fire, or medical assistance.",
                "badge": "Immediate Emergency"
            }
        ],
        "fraud_reporting": [
            {
                "name": "National Cyber Crime Reporting Portal",
                "contact": "https://cybercrime.gov.in",
                "type": "website",
                "description": "Official Ministry of Home Affairs portal for filing cybercrime and financial fraud reports.",
                "badge": "Official Cybercrime Portal"
            },
            {
                "name": "National Cyber Financial Fraud Helpline",
                "contact": "1930",
                "type": "phone",
                "description": "Toll-free national financial cyber fraud helpline (I4C, MHA). Call immediately if money was fraudulently deducted.",
                "badge": "Official Fraud Helpline"
            },
            {
                "name": "Chakshu (Sanchar Saathi)",
                "contact": "https://sanchar-saathi.gov.in",
                "type": "website",
                "description": "Department of Telecommunications portal for reporting suspected fraud SMS, calls, or WhatsApp messages.",
                "badge": "Telecom Fraud Portal"
            }
        ],
        "platform_support": [
            {
                "name": "TRAI Spam & Phishing SMS Reporting",
                "contact": "1909",
                "type": "sms",
                "description": "Send SMS to 1909 to register complaints against spam or fraudulent commercial messages.",
                "badge": "Carrier Spam Filter"
            },
            {
                "name": "Bank Card & UPI Freeze Action",
                "contact": "Call number on your bank card",
                "type": "instruction",
                "description": "Contact your bank's 24x7 customer helpline immediately to freeze your compromised accounts, cards, or UPI handles.",
                "badge": "Banking Safety"
            }
        ]
    },
    "US": {
        "country_code": "US",
        "country_name": "United States",
        "emergency": [
            {
                "name": "Emergency Services",
                "contact": "911",
                "type": "phone",
                "description": "Immediate police, fire, or medical life-safety response.",
                "badge": "Immediate Emergency"
            }
        ],
        "fraud_reporting": [
            {
                "name": "FBI Internet Crime Complaint Center (IC3)",
                "contact": "https://www.ic3.gov",
                "type": "website",
                "description": "Federal Bureau of Investigation central portal for reporting online scams and cybercrime.",
                "badge": "Official Federal Agency"
            },
            {
                "name": "Federal Trade Commission (FTC)",
                "contact": "https://reportfraud.ftc.gov",
                "type": "website",
                "description": "Official FTC reporting portal for fraud, unfair practices, and consumer scams.",
                "badge": "Official Fraud Portal"
            },
            {
                "name": "FTC Fraud Toll-Free Helpline",
                "contact": "1-877-382-4357",
                "type": "phone",
                "description": "Toll-free telephone line (1-877-FTC-HELP) for reporting consumer fraud.",
                "badge": "Toll-Free Helpline"
            },
            {
                "name": "IdentityTheft.gov",
                "contact": "https://www.identitytheft.gov",
                "type": "website",
                "description": "Official federal portal to report identity theft and get an official recovery plan.",
                "badge": "Identity Recovery"
            }
        ],
        "platform_support": [
            {
                "name": "Cellular Carrier SMS Spam Reporting",
                "contact": "Forward SMS to 7726",
                "type": "sms",
                "description": "Forward suspicious text messages to 7726 (SPAM) to notify cellular providers.",
                "badge": "Carrier Spam Filter"
            }
        ]
    },
    "UK": {
        "country_code": "UK",
        "country_name": "United Kingdom",
        "emergency": [
            {
                "name": "Emergency Services",
                "contact": "999",
                "type": "phone",
                "description": "Immediate emergency response for danger to life or crimes in progress.",
                "badge": "Immediate Emergency"
            },
            {
                "name": "Police Non-Emergency",
                "contact": "101",
                "type": "phone",
                "description": "National non-emergency police contact number.",
                "badge": "Non-Emergency"
            }
        ],
        "fraud_reporting": [
            {
                "name": "Action Fraud",
                "contact": "https://www.actionfraud.police.uk",
                "type": "website",
                "description": "National reporting centre for fraud and cybercrime in England, Wales, and Northern Ireland.",
                "badge": "Official Police Reporting"
            },
            {
                "name": "Action Fraud Helpline",
                "contact": "0300 123 2040",
                "type": "phone",
                "description": "National contact line for fraud and cybercrime victims.",
                "badge": "National Helpline"
            },
            {
                "name": "Suspicious Email Reporting Service (NCSC)",
                "contact": "report@phishing.gov.uk",
                "type": "email",
                "description": "Forward phishing and scam emails directly to the UK National Cyber Security Centre.",
                "badge": "NCSC Email Reporting"
            }
        ],
        "platform_support": [
            {
                "name": "Mobile Network Spam Reporting",
                "contact": "Forward SMS to 7726",
                "type": "sms",
                "description": "Forward suspicious text messages to 7726 (free of charge on all major UK networks).",
                "badge": "Carrier Spam Filter"
            }
        ]
    },
    "CA": {
        "country_code": "CA",
        "country_name": "Canada",
        "emergency": [
            {
                "name": "Emergency Services",
                "contact": "911",
                "type": "phone",
                "description": "Immediate police, fire, or medical emergency response.",
                "badge": "Immediate Emergency"
            }
        ],
        "fraud_reporting": [
            {
                "name": "Canadian Anti-Fraud Centre (CAFC)",
                "contact": "https://www.antifraudcentre-centreantifraude.ca",
                "type": "website",
                "description": "Central agency that collects intelligence on fraud and cyber scams in Canada.",
                "badge": "Official Federal Centre"
            },
            {
                "name": "CAFC Toll-Free Helpline",
                "contact": "1-888-495-8501",
                "type": "phone",
                "description": "Toll-free national fraud reporting helpline.",
                "badge": "Toll-Free Helpline"
            },
            {
                "name": "Canadian Centre for Cyber Security (CCCS)",
                "contact": "https://www.cyber.gc.ca",
                "type": "website",
                "description": "Federal authority for cyber security guidance and cyber incident reporting.",
                "badge": "Official Cyber Centre"
            }
        ],
        "platform_support": [
            {
                "name": "Carrier SMS Spam Reporting",
                "contact": "Forward SMS to 7726",
                "type": "sms",
                "description": "Forward spam texts to 7726 (SPAM) to alert Canadian mobile service providers.",
                "badge": "Carrier Spam Filter"
            }
        ]
    },
    "AU": {
        "country_code": "AU",
        "country_name": "Australia",
        "emergency": [
            {
                "name": "Triple Zero (000)",
                "contact": "000",
                "type": "phone",
                "description": "Immediate life-threatening emergency response across Australia.",
                "badge": "Immediate Emergency"
            }
        ],
        "fraud_reporting": [
            {
                "name": "Scamwatch (National Anti-Scam Centre)",
                "contact": "https://www.scamwatch.gov.au",
                "type": "website",
                "description": "Official Australian Competition and Consumer Commission (ACCC) scam reporting portal.",
                "badge": "Official Scam Portal"
            },
            {
                "name": "ReportCyber (Australian Cyber Security Centre)",
                "contact": "https://www.cyber.gov.au",
                "type": "website",
                "description": "Federal portal for reporting cybercrime, unauthorized access, and financial fraud.",
                "badge": "Official Cyber Portal"
            },
            {
                "name": "Australian Cyber Security Hotline",
                "contact": "1300 292 371",
                "type": "phone",
                "description": "1300 CYBER1 helpline for Australian individuals and small businesses.",
                "badge": "National Hotline"
            }
        ],
        "platform_support": [
            {
                "name": "ACMA SMS Spam Reporting",
                "contact": "Forward SMS to 0429 999 888",
                "type": "sms",
                "description": "Australian Communications and Media Authority mobile spam reporting service.",
                "badge": "Carrier Spam Filter"
            }
        ]
    },
    "OTHER": {
        "country_code": "OTHER",
        "country_name": "International",
        "emergency": [
            {
                "name": "Local Emergency Services",
                "contact": "Check local emergency numbers",
                "type": "instruction",
                "description": "Contact your country's national emergency services (e.g. 112 in Europe, 911 in North America) for immediate danger.",
                "badge": "Immediate Emergency"
            }
        ],
        "fraud_reporting": [
            {
                "name": "INTERPOL Financial Crime & Anti-Corruption Centre",
                "contact": "https://www.interpol.int",
                "type": "website",
                "description": "Information and resources on transnational fraud, cyber-enabled crimes, and national reporting points.",
                "badge": "International Agency"
            }
        ],
        "platform_support": [
            {
                "name": "Bank Card Cancellation Support",
                "contact": "Call number on reverse of your card",
                "type": "instruction",
                "description": "Contact your financial institution immediately through their official emergency card blocking number.",
                "badge": "Banking Safety"
            }
        ]
    }
}


def get_help_contacts(country_code: str = "IN") -> Dict[str, Any]:
    """
    Returns verified official reporting and emergency contacts for the specified country.
    Defaults safely to India (IN).
    """
    code = (country_code or "IN").upper().strip()
    return HELP_CONTACTS_BY_COUNTRY.get(code, HELP_CONTACTS_BY_COUNTRY["IN"])


def get_supported_countries() -> List[Dict[str, str]]:
    """Returns list of supported countries for UI dropdowns."""
    return [
        {"code": "IN", "name": "India (1930 / cybercrime.gov.in)"},
        {"code": "US", "name": "United States (IC3 / reportfraud.ftc.gov)"},
        {"code": "UK", "name": "United Kingdom (Action Fraud / 0300 123 2040)"},
        {"code": "CA", "name": "Canada (CAFC / 1-888-495-8501)"},
        {"code": "AU", "name": "Australia (Scamwatch / cyber.gov.au)"},
        {"code": "OTHER", "name": "Other / International"}
    ]
