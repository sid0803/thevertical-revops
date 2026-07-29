from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Customer, Company
from app.schemas.schemas import CustomerCreate, CustomerResponse

router = APIRouter()

@router.get("", response_model=List[CustomerResponse])
def get_customers(skip: int = 0, limit: int = 100, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Customer)
    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%"))
    customers = query.offset(skip).limit(limit).all()
    
    res = []
    for c in customers:
        c_dict = CustomerResponse.model_validate(c)
        if c.company_id:
            comp = db.query(Company).filter(Company.id == c.company_id).first()
            if comp:
                c_dict.company_name = comp.name
        res.append(c_dict)
    return res

@router.post("", response_model=CustomerResponse)
def create_customer(cust_in: CustomerCreate, db: Session = Depends(get_db)):
    new_c = Customer(**cust_in.model_dump())
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return CustomerResponse.model_validate(new_c)

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse.model_validate(c)
