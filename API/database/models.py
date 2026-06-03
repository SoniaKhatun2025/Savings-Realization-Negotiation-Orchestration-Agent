from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class UserStatusUpdate(BaseModel):
    status: str

class ChatRequest(BaseModel):
    message: Optional[str] = None
    query: Optional[str] = None

class NegotiationCreate(BaseModel):
    opportunity_id: str

class BudgetCreate(BaseModel):
    category: str
    fiscal_year: int
    allocated_amount: float

class BudgetUpdate(BaseModel):
    allocated_amount: float
    actual_spend: float

class AssignBuyerRequest(BaseModel):
    opportunity_id: str
    buyer_id: int
    priority: int = 1

class RecordOutcomeRequest(BaseModel):
    actual_price: float
    realised_savings: float
    comment: Optional[str] = ""

class ApproveNegotiationRequest(BaseModel):
    comment: Optional[str] = ""

class OpportunityDetectRequest(BaseModel):
    category: str
    supplier_id: int
    current_spend: float
    benchmark_spend: float

class DraftEmailRequest(BaseModel):
    opportunity_id: str
    supplier: Optional[str] = ""

class AssignTaskRequest(BaseModel):
    buyer_id: int
    opportunity_id: str
    sla_hours: Optional[int] = 48

class UpdateTaskStatusRequest(BaseModel):
    task_id: str
    status: str

class ValidateSavingsRequest(BaseModel):
    opportunity_id: str
    validated_amount: float




