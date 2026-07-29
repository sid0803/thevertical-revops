from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.db.database import get_db
from app.db.models import Deal, Lead, Customer
from app.schemas.schemas import (
    AIScoreRequest,
    AIGenerateEmailRequest,
    AIGenerateProposalRequest,
    AINaturalLanguageQuery
)
from app.services.ai_service import AIService
from app.services.llm_service import LLMService

router = APIRouter()

class CopilotQueryRequest(BaseModel):
    prompt: str

class CustomerSummaryRequest(BaseModel):
    customer_id: int

@router.post("/copilot")
def query_copilot(req: CopilotQueryRequest, db: Session = Depends(get_db)):
    deals = db.query(Deal).all()
    leads = db.query(Lead).all()
    return LLMService.query_sales_copilot(req.prompt, deals, leads)

@router.post("/customer-summary")
def get_customer_summary(req: CustomerSummaryRequest, db: Session = Depends(get_db)):
    cust = db.query(Customer).filter(Customer.id == req.customer_id).first()
    c_name = cust.name if cust else "Stripe Financial"
    c_arr = cust.arr if cust else 540000.0
    c_health = cust.health_score if cust else 94
    return LLMService.generate_customer_360_summary(c_name, c_arr, c_health)

@router.post("/score")
def score_lead(req: AIScoreRequest):
    return AIService.calculate_lead_scores(
        company_name=req.company_name,
        deal_size=req.deal_size,
        engagement_clicks=req.engagement_clicks,
        emails_opened=req.emails_opened,
        decision_maker_present=req.decision_maker_present
    )

@router.post("/generate-email")
def generate_email(req: AIGenerateEmailRequest):
    return AIService.generate_email(
        recipient_name=req.recipient_name,
        recipient_company=req.recipient_company,
        value_prop=req.value_proposition,
        tone=req.tone
    )

@router.post("/generate-proposal")
def generate_proposal(req: AIGenerateProposalRequest):
    return AIService.generate_proposal(
        client_name=req.client_name,
        company_name=req.company_name,
        deal_value=req.deal_value,
        key_features=req.key_features
    )

@router.post("/search")
def natural_language_search(req: AINaturalLanguageQuery, db: Session = Depends(get_db)):
    deals = db.query(Deal).all()
    leads = db.query(Lead).all()
    return AIService.parse_natural_language_query(req.query, deals, leads)

@router.get("/workflows")
def get_workflow_automations():
    return [
        {
            "id": 1,
            "name": "Qualified Lead Auto-Assignment & Outreach",
            "trigger": "Lead Status becomes QUALIFIED",
            "actions": [
                "Assign Senior SDR (Alex Morgan)",
                "Create Task 'Schedule Discovery Demo' (Due 24h)",
                "Generate Personalized AI Follow-up Email",
                "Dispatch Slack Alert to #revops-deals"
            ],
            "is_active": True,
            "total_runs": 142
        },
        {
            "id": 2,
            "name": "Stalled Deal Risk Mitigation",
            "trigger": "Deal in Stage PROPOSAL > 14 Days",
            "actions": [
                "Flag Deal Health Risk ('Proposal Stalled')",
                "Create Executive Re-engagement Task",
                "Notify RevOps VP via Email"
            ],
            "is_active": True,
            "total_runs": 28
        },
        {
            "id": 3,
            "name": "Deal Won Customer Provisioning",
            "trigger": "Deal Stage becomes WON",
            "actions": [
                "Convert Lead to Active Customer Account",
                "Generate Executive Onboarding Proposal",
                "Send Welcome Email with Portal Access",
                "Create 60-Day SLA Onboarding Ticket"
            ],
            "is_active": True,
            "total_runs": 24
        }
    ]
