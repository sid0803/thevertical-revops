import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_get_dashboard_metrics():
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "kpis text" not in data
    assert "kpis" in data
    assert "total_revenue" in data["kpis"]
    assert data["kpis"]["total_revenue"] > 0

def test_get_deals_list():
    response = client.get("/api/v1/deals")
    assert response.status_code == 200
    deals = response.json()
    assert isinstance(deals, list)
    assert len(deals) > 0

def test_ai_lead_score():
    payload = {
        "company_name": "Stripe Financial",
        "deal_size": 120000.0,
        "engagement_clicks": 15,
        "emails_opened": 6,
        "decision_maker_present": True
    }
    response = client.post("/api/v1/ai/score", json=payload)
    assert response.status_code == 200
    score_data = response.json()
    assert "overall_score" in score_data
    assert score_data["overall_score"] >= 80

def test_ai_sales_copilot():
    payload = {"prompt": "Which leads should I call today?"}
    response = client.post("/api/v1/ai/copilot", json=payload)
    assert response.status_code == 200
    copilot_data = response.json()
    assert "answer" in copilot_data
    assert "suggested_action" in copilot_data

def test_get_emails_inbox():
    response = client.get("/api/v1/emails")
    assert response.status_code == 200
    emails = response.json()
    assert len(emails) >= 1
    assert "ai_summary" in emails[0]
