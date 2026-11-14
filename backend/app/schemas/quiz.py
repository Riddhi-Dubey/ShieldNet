from pydantic import BaseModel, Field, model_validator
from typing import List, Dict, Any, Optional, Union


class QuizQuestionOut(BaseModel):
    id: str
    question_id: str
    topic: str
    question: str
    options: List[str]
    source: str

    @model_validator(mode="before")
    @classmethod
    def populate_id(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            qid = getattr(data, "question_id", None)
            return {
                "id": qid,
                "question_id": qid,
                "topic": getattr(data, "topic", ""),
                "question": getattr(data, "question", ""),
                "options": getattr(data, "options", []),
                "source": getattr(data, "source", "ShieldNet Intelligence")
            }
        elif isinstance(data, dict):
            qid = data.get("question_id") or data.get("id")
            data["id"] = qid
            data["question_id"] = qid
        return data


class QuizAnswerSubmission(BaseModel):
    question_id: str
    selected_option_index: int = Field(..., ge=0, le=5)


class QuizSubmitRequest(BaseModel):
    topic: Optional[str] = "general"
    answers: Union[List[QuizAnswerSubmission], Dict[str, int]]

    @model_validator(mode="before")
    @classmethod
    def normalize_answers(cls, values: Any) -> Any:
        if isinstance(values, dict):
            ans = values.get("answers")
            if isinstance(ans, dict):
                normalized = [
                    {"question_id": q_id, "selected_option_index": int(opt_idx)}
                    for q_id, opt_idx in ans.items()
                ]
                values["answers"] = normalized
        return values


class QuestionEvaluation(BaseModel):
    question_id: str
    topic: str
    question: str
    selected_option_index: int
    correct_option_index: int
    is_correct: bool
    explanation: str


class QuizSubmitResponse(BaseModel):
    total_questions: int
    correct_count: int
    score: int = 0
    total: int = 0
    score_percentage: float
    grade: str
    evaluations: List[QuestionEvaluation]
    details: Dict[str, Any] = Field(default_factory=dict)
    feedback: Optional[str] = None
    safety_recommendation: str

    @model_validator(mode="before")
    @classmethod
    def populate_details(cls, values: Any) -> Any:
        if isinstance(values, dict):
            cc = values.get("correct_count", 0)
            tq = values.get("total_questions", 0)
            values["score"] = values.get("score") or cc
            values["total"] = values.get("total") or tq
            if "details" not in values or not values["details"]:
                evals = values.get("evaluations", [])
                det = {}
                for ev in evals:
                    if isinstance(ev, dict):
                        qid = ev.get("question_id")
                        det[qid] = {
                            "correct": ev.get("is_correct", False),
                            "correct_option": ev.get("correct_option_index", 0),
                            "explanation": ev.get("explanation", "")
                        }
                    elif hasattr(ev, "question_id"):
                        det[ev.question_id] = {
                            "correct": ev.is_correct,
                            "correct_option": ev.correct_option_index,
                            "explanation": ev.explanation
                        }
                values["details"] = det
            if "feedback" not in values or not values["feedback"]:
                values["feedback"] = values.get("safety_recommendation", "")
        return values
