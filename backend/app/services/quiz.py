import json
from typing import List, Dict, Any
from backend.app.schemas.quiz import (
    QuizQuestionOut,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuestionEvaluation
)

VERIFIED_QUIZ_BANK = [
    {
        "question_id": "q1",
        "topic": "UPI Security",
        "question": "A buyer on OLX sends you a QR code and asks you to scan it to receive the advance payment for your item. What will happen if you scan it and enter your UPI PIN?",
        "options": [
            "You will immediately receive the money into your bank account.",
            "Money will be debited (deducted) from your bank account.",
            "The QR code will fail because QR codes cannot be used for payments.",
            "Your bank will automatically hold the money in escrow."
        ],
        "correct_option_index": 1,
        "explanation": "UPI PIN is exclusively used for authorizing payments (debiting money). You NEVER enter your PIN to receive money.",
        "source": "NPCI / RBI Awareness Bulletin"
    },
    {
        "question_id": "q2",
        "topic": "OTP & Authentication",
        "question": "A caller claiming to be from your bank states your debit card is blocked and asks you to read the 6-digit SMS code to reactivate it. What should you do?",
        "options": [
            "Share the code immediately to avoid debit card cancellation.",
            "Disconnect the call, never share the code, and report the caller.",
            "Share only the first 3 digits of the code to verify your identity.",
            "Ask the caller to read their bank employee ID first, then share the code."
        ],
        "correct_option_index": 1,
        "explanation": "Banks explicitly warn that bank staff never ask for OTPs or PINs. Sharing this code allows scammers to complete fraudulent transactions.",
        "source": "RBI Kehta Hai Guidelines"
    },
    {
        "question_id": "q3",
        "topic": "Employment Scams",
        "question": "You receive a WhatsApp offer offering ₹4,000/day for liking YouTube videos and rating hotels, but you must first pay a 'security deposit' of ₹1,000. Is this legitimate?",
        "options": [
            "Yes, reputable companies routinely require security deposits for freelance work.",
            "Yes, if the recruiter sends an official-looking corporate letterhead on Telegram.",
            "No, genuine employers never require job seekers to pay upfront money or task deposits.",
            "Yes, as long as you pay using UPI rather than cash."
        ],
        "correct_option_index": 2,
        "explanation": "This is a classic 'prepaid task scam'. Once upfront money is paid, scammers manufacture fees and refuse to release your funds.",
        "source": "CERT-In Cyber Advisory"
    },
    {
        "question_id": "q4",
        "topic": "Phishing Detection",
        "question": "Which of the following URLs is a high-risk phishing indicator impersonating State Bank of India?",
        "options": [
            "https://www.onlinesbi.sbi/portal",
            "http://sbi-secure-update-kyc.netbanking-alert.invalid/login",
            "https://bank.sbi/",
            "https://retail.onlinesbi.sbi/retail/login.htm"
        ],
        "correct_option_index": 1,
        "explanation": "Option B uses insecure HTTP and deceptive subdomains pointing to an unverified domain ending, not official SBI domains (.sbi or onlinesbi.sbi).",
        "source": "CISA / Anti-Phishing Working Group"
    },
    {
        "question_id": "q5",
        "topic": "Digital Arrest & Impersonation",
        "question": "A person in a police uniform calls you on a Skype video call claiming an illegal parcel with drugs was seized in your name and demands you transfer funds to a 'court verification account' to avoid arrest. What is this?",
        "options": [
            "A standard judicial remote interrogation procedure.",
            "A 'Digital Arrest' scam; law enforcement never conducts arrests or settlement transfers over video calls.",
            "A routine customs clarification call; you must comply immediately.",
            "A police verification test that you can ignore for 7 days."
        ],
        "correct_option_index": 1,
        "explanation": "Law enforcement agencies (Police, CBI, ED) never arrest citizens via video calls or demand funds into private accounts for 'verification'.",
        "source": "Indian Cyber Crime Coordination Centre (I4C)"
    }
]


def get_quiz_questions() -> List[QuizQuestionOut]:
    """Returns curated quiz questions without the correct answers for client presentation."""
    return [
        QuizQuestionOut(
            question_id=q["question_id"],
            topic=q["topic"],
            question=q["question"],
            options=q["options"],
            source=q["source"]
        )
        for q in VERIFIED_QUIZ_BANK
    ]


def evaluate_quiz_submission(submission: QuizSubmitRequest) -> QuizSubmitResponse:
    """
    Evaluates submitted answers server-side against the verified question bank.
    Calculates correct count, score percentage, and provides full educational explanations.
    """
    lookup = {q["question_id"]: q for q in VERIFIED_QUIZ_BANK}
    evaluations: List[QuestionEvaluation] = []
    correct_count = 0

    for ans in submission.answers:
        q_data = lookup.get(ans.question_id)
        if not q_data:
            continue

        is_corr = (ans.selected_option_index == q_data["correct_option_index"])
        if is_corr:
            correct_count += 1

        evaluations.append(QuestionEvaluation(
            question_id=ans.question_id,
            topic=q_data["topic"],
            question=q_data["question"],
            selected_option_index=ans.selected_option_index,
            correct_option_index=q_data["correct_option_index"],
            is_correct=is_corr,
            explanation=q_data["explanation"]
        ))

    total = len(evaluations) if evaluations else len(VERIFIED_QUIZ_BANK)
    pct = round((correct_count / total * 100.0) if total > 0 else 0.0, 1)

    if pct >= 80.0:
        grade = "EXCELLENT"
        rec = "Outstanding cyber awareness! You have strong defenses against common social engineering tactics."
    elif pct >= 60.0:
        grade = "GOOD"
        rec = "Good foundational knowledge. Review the missed questions to tighten your scam detection habits."
    else:
        grade = "NEEDS_IMPROVEMENT"
        rec = "Caution advised. Scammers exploit these exact scenarios. Remember: Never share OTPs or enter PINs to receive money."

    return QuizSubmitResponse(
        total_questions=total,
        correct_count=correct_count,
        score_percentage=pct,
        grade=grade,
        evaluations=evaluations,
        safety_recommendation=rec
    )
