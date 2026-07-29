from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Company
from app.schemas.schemas import CompanyCreate, CompanyResponse

router = APIRouter()

@router.get("", response_model=List[CompanyResponse])
def get_companies(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Company)
    if search:
        query = query.filter(Company.name.ilike(f"%{search}%"))
    return query.all()

@router.post("", response_model=CompanyResponse)
def create_company(comp_in: CompanyCreate, db: Session = Depends(get_db)):
    new_comp = Company(**comp_in.model_dump())
    db.add(new_comp)
    db.commit()
    db.refresh(new_comp)
    return CompanyResponse.model_validate(new_comp)

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(comp)
