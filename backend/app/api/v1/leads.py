from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Lead
from app.schemas.schemas import LeadCreate, LeadResponse

router = APIRouter()

@router.get("", response_model=List[LeadResponse])
def get_leads(status: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.status == status)
    if search:
        query = query.filter((Lead.title.ilike(f"%{search}%")) | (Lead.company_name.ilike(f"%{search}%")))
    return query.order_by(Lead.score.desc()).all()

@router.post("", response_model=LeadResponse)
def create_lead(lead_in: LeadCreate, db: Session = Depends(get_db)):
    new_lead = Lead(**lead_in.model_dump())
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return LeadResponse.model_validate(new_lead)

@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadResponse.model_validate(lead)
