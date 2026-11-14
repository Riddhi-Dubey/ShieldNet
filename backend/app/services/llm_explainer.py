import os
from typing import Dict, Any, Optional
import httpx

ENABLE_EXTERNAL_LLM = os.getenv("ENABLE_EXTERNAL_LLM", "false").lower() in ("true", "1", "yes")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()


def generate_llm_explanation(
    analysis_type: str,
    findings: Dict[str, Any],
    user_consent: bool = False
) -> Optional[str]:
    """
    Optional plain-language LLM explanation generator.
    - Strict privacy rule: NEVER sends raw user text; sends only extracted indicators and redacted previews.
    - Requires explicit user opt-in/consent (user_consent=True).
    - If no API key is configured, disabled, or an external error occurs, gracefully returns None.
    - The LLM does NOT make classifications or override model/rule scores.
    """
    if not user_consent:
        return None

    if not ENABLE_EXTERNAL_LLM and not (GROQ_API_KEY or GEMINI_API_KEY or OPENAI_API_KEY):
        return None

    risk_level = findings.get("risk_level", "UNKNOWN")
    risk_score = findings.get("risk_score", 0.0)
    signals = findings.get("detected_signals") or findings.get("heuristic_findings") or []
    signals_str = ", ".join([str(s) for s in signals[:5]]) if signals else "No overt indicators"
    redacted_preview = findings.get("redacted_message_preview") or findings.get("redacted_url") or ""
    if len(redacted_preview) > 120:
        redacted_preview = redacted_preview[:117] + "..."

    prompt = (
        f"You are a calm, objective digital safety assistant. "
        f"A user's {analysis_type} received a risk assessment of {risk_level} ({risk_score}/100). "
        f"Detected behavioral/structural signals: {signals_str}. "
        f"Context snippet (PII-redacted): '{redacted_preview}'.\n\n"
        f"In 2 brief, simple sentences for a non-technical citizen: "
        f"1. Explain what warning signs were noticed without claiming guaranteed fraud. "
        f"2. Give one safe verification step. Do NOT say 'this is safe' or 'this is definitely a scam'."
    )

    try:
        if GROQ_API_KEY:
            res = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": "You are a concise cybersecurity educator explaining risk assessment signals."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 120,
                    "temperature": 0.3
                },
                timeout=4.0
            )
            if res.status_code == 200:
                data = res.json()
                return data["choices"][0]["message"]["content"].strip()

        elif OPENAI_API_KEY:
            res = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are a concise cybersecurity educator explaining risk assessment signals."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 120,
                    "temperature": 0.3
                },
                timeout=4.0
            )
            if res.status_code == 200:
                data = res.json()
                return data["choices"][0]["message"]["content"].strip()

        elif GEMINI_API_KEY:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            res = httpx.post(
                url,
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": 120, "temperature": 0.3}
                },
                timeout=4.0
            )
            if res.status_code == 200:
                data = res.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    except Exception:
        # Never break application flow if external API call fails
        pass

    return None
