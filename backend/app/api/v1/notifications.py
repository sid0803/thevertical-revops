from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Notification
from app.schemas.schemas import NotificationResponse

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    notes = db.query(Notification).order_by(Notification.created_at.desc()).all()
    if not notes:
        # Default seed notifications
        n1 = Notification(title="🎉 Deal Closed Won!", message="Enterprise license closed with Acme Financial for $120,000 ARR.", category="DEAL_WON")
        n2 = Notification(title="⏰ Upcoming Executive Demo", message="Demo scheduled with VP of Sales at TechScale Corp in 30 mins.", category="MEETING_REMINDER")
        n3 = Notification(title="🚀 High-Intent Lead Assigned", message="New inbound lead 'Stripe Enterprise' scored 94 by AI Lead Engine.", category="LEAD_ASSIGNED")
        db.add_all([n1, n2, n3])
        db.commit()
        notes = db.query(Notification).order_by(Notification.created_at.desc()).all()
    return notes

@router.put("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"status": "success"}
