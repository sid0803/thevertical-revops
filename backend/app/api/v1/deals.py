from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Deal, Company, Contact, Activity
from app.schemas.schemas import DealCreate, DealResponse, DealUpdateStage

router = APIRouter()

@router.get("", response_model=List[DealResponse])
def get_deals(stage: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Deal)
    if stage:
        query = query.filter(Deal.stage == stage)
    if search:
        query = query.filter(Deal.title.ilike(f"%{search}%"))
    deals = query.order_by(Deal.value.desc()).all()

    res = []
    for d in deals:
        d_dict = DealResponse.model_validate(d)
        if d.company_id:
            comp = db.query(Company).filter(Company.id == d.company_id).first()
            if comp:
                d_dict.company_name = comp.name
        if d.contact_id:
            cont = db.query(Contact).filter(Contact.id == d.contact_id).first()
            if cont:
                d_dict.contact_name = f"{cont.first_name} {cont.last_name}"
        res.append(d_dict)
    return res

@router.post("", response_model=DealResponse)
def create_deal(deal_in: DealCreate, db: Session = Depends(get_db)):
    new_deal = Deal(**deal_in.model_dump())
    db.add(new_deal)
    db.commit()
    db.refresh(new_deal)

    # Log initial stage activity
    act = Activity(
        deal_id=new_deal.id,
        user_name="Alex Morgan",
        activity_type="STAGE_CHANGE",
        title="Deal Created",
        description=f"Deal '{new_deal.title}' added to pipeline at stage {new_deal.stage} with value ${new_deal.value:,.2f}"
    )
    db.add(act)
    db.commit()

    return DealResponse.model_validate(new_deal)

@router.put("/{deal_id}/stage", response_model=DealResponse)
def update_deal_stage(deal_id: int, payload: DealUpdateStage, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    old_stage = deal.stage
    deal.stage = payload.stage
    if payload.stage == "WON":
        deal.win_probability = 100
    elif payload.stage == "LOST":
        deal.win_probability = 0
    db.commit()
    db.refresh(deal)

    # Log activity timeline entry
    act = Activity(
        deal_id=deal.id,
        user_name="Alex Morgan",
        activity_type="STAGE_CHANGE",
        title="Stage Updated",
        description=f"Moved deal from stage '{old_stage}' to '{payload.stage}'"
    )
    db.add(act)
    db.commit()

    return DealResponse.model_validate(deal)
