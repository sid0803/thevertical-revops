from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Contact, Company
from app.schemas.schemas import ContactCreate, ContactResponse

router = APIRouter()

@router.get("", response_model=List[ContactResponse])
def get_contacts(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Contact)
    if search:
        query = query.filter((Contact.first_name.ilike(f"%{search}%")) | (Contact.email.ilike(f"%{search}%")))
    contacts = query.all()
    
    res = []
    for c in contacts:
        c_dict = ContactResponse.model_validate(c)
        if c.company_id:
            comp = db.query(Company).filter(Company.id == c.company_id).first()
            if comp:
                c_dict.company_name = comp.name
        res.append(c_dict)
    return res

@router.post("", response_model=ContactResponse)
def create_contact(contact_in: ContactCreate, db: Session = Depends(get_db)):
    new_c = Contact(**contact_in.model_dump())
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return ContactResponse.model_validate(new_c)
