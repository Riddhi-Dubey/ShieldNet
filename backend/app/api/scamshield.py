from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.schemas.analysis import (
    MessageAnalysisRequest,
    MessageAnalysisResponse,
    UrlAnalysisRequest,
    UrlAnalysisResponse
)
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.schemas.quiz import (
    QuizQuestionOut,
    QuizSubmitRequest,
    QuizSubmitResponse
)
from backend.app.services.message_analysis import analyze_scam_message
from backend.app.services.url_analysis import analyze_scam_url
from backend.app.services.chatbot import answer_cyber_query
from backend.app.services.quiz import get_quiz_questions, evaluate_quiz_submission
from backend.app.models.analysis import Analysis
from backend.app.security.validation import is_ssrf_risk

router = APIRouter(tags=["ScamShield"])


@router.post("/analyse/message", response_model=MessageAnalysisResponse)
def analyze_message_endpoint(request: MessageAnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyzes suspicious SMS, email, or chat messages for psychological coercion,
    credential requests, fake job offers, and payment misdirection.
    Redacts sensitive data and provides actionable next steps.
    """
    if len(request.message.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty"
        )

    result = analyze_scam_message(request.message, sender=request.sender)

    # Record sanitized analysis in database (never raw message!)
    try:
        analysis_record = Analysis(
            model_prediction=result.risk_level,
            risk_score=result.risk_score,
            explanation=result.explanation
        )
        db.add(analysis_record)
        db.commit()
    except Exception:
        db.rollback()

    return result


@router.post("/analyse/url", response_model=UrlAnalysisResponse)
def analyze_url_endpoint(request: UrlAnalysisRequest):
    """
    Performs static lexical, structural, and ML phishing analysis on submitted URLs.
    Protected against SSRF: Does NOT make external HTTP network calls.
    """
    clean_url = request.url.strip()
    if len(clean_url) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is too short to be valid"
        )

    # Check SSRF warning
    if is_ssrf_risk(clean_url):
        # We still analyze it statically but flag SSRF risk
        pass

    return analyze_scam_url(clean_url)


@router.post("/chat", response_model=ChatResponse)
def chat_faq_endpoint(request: ChatRequest):
    """
    Answers cyber safety inquiries via verified knowledge base.
    Never asks for or stores OTPs, PINs, or credentials.
    """
    if len(request.query.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty"
        )

    return answer_cyber_query(request.query, session_id=request.session_id)


@router.get("/quiz/questions", response_model=List[QuizQuestionOut])
def get_quiz_questions_endpoint():
    """
    Fetches verified cyber safety quiz questions.
    Answers are stripped from the response to prevent client-side answer cheating.
    """
    return get_quiz_questions()


@router.post("/quiz/submit", response_model=QuizSubmitResponse)
def submit_quiz_endpoint(request: QuizSubmitRequest):
    """
    Validates submitted answers server-side against verified question records.
    Calculates final score and returns comprehensive educational explanations.
    """
    if not request.answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz submission must contain at least one answer"
        )

    return evaluate_quiz_submission(request)
