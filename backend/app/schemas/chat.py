from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any


class ChatRequest(BaseModel):
    query: Optional[str] = Field(None, min_length=1, max_length=1000, description="User question about cyber fraud or safety")
    message: Optional[str] = Field(None, min_length=1, max_length=1000, description="Alias for query")
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Conversation history")
    session_id: Optional[str] = Field(None, description="Optional session tracking identifier")

    @model_validator(mode="before")
    @classmethod
    def unify_query(cls, values: Any) -> Any:
        if isinstance(values, dict):
            q = values.get("query") or values.get("message")
            if q:
                values["query"] = str(q).strip()
        return values


class ChatResponse(BaseModel):
    query_topic: str
    response: str
    reply: Optional[str] = None
    confidence: float
    source_attribution: Optional[str] = None
    recommended_actions: List[str]
    emergency_contacts: List[str]
    disclaimer: str

    @model_validator(mode="before")
    @classmethod
    def unify_reply(cls, values: Any) -> Any:
        if isinstance(values, dict):
            resp = values.get("response") or values.get("reply")
            if resp:
                values["response"] = resp
                values["reply"] = resp
        return values
