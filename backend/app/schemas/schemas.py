from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr

# Auth Schemas
class UserBase(BaseModel):
    email: str
    full_name: str
    role: Optional[str] = "REP"
    company_name: Optional[str] = "Acme Corp"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: str
    password: str

class PasswordResetRequest(BaseModel):
    email: str

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    annual_revenue: Optional[float] = 0.0
    location: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Contact Schemas
class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    title: Optional[str] = None
    company_id: Optional[int] = None

class ContactCreate(ContactBase):
    pass

class ContactResponse(ContactBase):
    id: int
    created_at: datetime
    company_name: Optional[str] = None

    class Config:
        from_attributes = True

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    company_id: Optional[int] = None
    status: Optional[str] = "ACTIVE"
    mrr: Optional[float] = 0.0
    arr: Optional[float] = 0.0
    health_score: Optional[int] = 85
    contract_start: Optional[datetime] = None
    contract_end: Optional[datetime] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    company_name: Optional[str] = None

    class Config:
        from_attributes = True

# Lead Schemas
class LeadBase(BaseModel):
    title: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    status: Optional[str] = "NEW"
    source: Optional[str] = "Inbound Web"
    value: Optional[float] = 0.0
    score: Optional[int] = 50
    intent_score: Optional[int] = 60
    urgency_score: Optional[int] = 50
    budget_score: Optional[int] = 70
    engagement_score: Optional[int] = 55
    ai_summary: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Deal Schemas
class DealBase(BaseModel):
    title: str
    lead_id: Optional[int] = None
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    stage: Optional[str] = "NEW"
    value: Optional[float] = 0.0
    win_probability: Optional[int] = 50
    expected_close: Optional[datetime] = None
    health_score: Optional[int] = 80
    risk_flag: Optional[str] = None
    notes_summary: Optional[str] = None

class DealCreate(DealBase):
    pass

class DealUpdateStage(BaseModel):
    stage: str

class DealResponse(DealBase):
    id: int
    created_at: datetime
    company_name: Optional[str] = None
    contact_name: Optional[str] = None

    class Config:
        from_attributes = True

# Task & Meeting Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = "PENDING"
    priority: Optional[str] = "MEDIUM"
    assignee_name: Optional[str] = "Alex Morgan"
    deal_title: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MeetingBase(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = "Google Meet"
    organizer_name: Optional[str] = "Alex Morgan"
    deal_title: Optional[str] = None
    summary: Optional[str] = None

class MeetingResponse(MeetingBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    category: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# AI Service Schemas
class AIScoreRequest(BaseModel):
    lead_id: Optional[int] = None
    company_name: str
    deal_size: float
    engagement_clicks: int = 12
    emails_opened: int = 5
    decision_maker_present: bool = True

class AIGenerateEmailRequest(BaseModel):
    recipient_name: str
    recipient_company: str
    value_proposition: str
    tone: str = "professional" # professional, casual, persuasive

class AIGenerateProposalRequest(BaseModel):
    client_name: str
    company_name: str
    deal_value: float
    key_features: List[str]

class AINaturalLanguageQuery(BaseModel):
    query: str
