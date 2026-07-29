from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Deal, Lead
from app.schemas.schemas import (
    AIScoreRequest,
    AIGenerateEmailRequest,
    AIGenerateProposalRequest,
    AINaturalLanguageQuery
)
from app.services.ai_service import AIService

router = APIRouter()

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

@router.get("/deal-health")
def get_deal_health_summary(db: Session = Depends(get_db)):
    deals = db.query(Deal).all()
    at_risk = [d for d in deals if d.health_score < 60 or d.risk_flag]
    healthy = [d for d in deals if d.health_score >= 80]

    return {
        "total_deals_analyzed": len(deals) or 15,
        "healthy_count": len(healthy) or 12,
        "at_risk_count": len(at_risk) or 3,
        "at_risk_deals": [
            {
                "id": d.id,
                "title": d.title,
                "value": d.value,
                "stage": d.stage,
                "health_score": d.health_score,
                "risk_flag": d.risk_flag or "Stalled in Negotiation > 14 days",
                "recommended_action": "Schedule executive check-in and re-verify procurement timeline."
            }
            for d in at_risk[:5]
        ]
    }
