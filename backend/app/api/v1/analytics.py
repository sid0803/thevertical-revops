from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db

router = APIRouter()

@router.get("")
def get_analytics_overview(db: Session = Depends(get_db)):
    return {
        "pipeline_velocity": {
            "avg_cycle_days": 18.4,
            "win_rate": 72.5,
            "stalled_deals_count": 3,
            "velocity_mrr": 48200
        },
        "revenue_attribution": [
            {"channel": "Inbound Organic", "conversions": 34, "arr": 420000},
            {"channel": "Outbound SDR", "conversions": 22, "arr": 310000},
            {"channel": "Partner Ecosystem", "conversions": 14, "arr": 240000},
            {"channel": "Executive Referral", "conversions": 8, "arr": 180000}
        ],
        "deal_health_distribution": [
            {"category": "Healthy (80-100%)", "count": 18, "percentage": 65},
            {"category": "Needs Review (50-79%)", "count": 7, "percentage": 25},
            {"category": "At Risk (<50%)", "count": 3, "percentage": 10}
        ]
    }
