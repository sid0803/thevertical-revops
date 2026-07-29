from datetime import datetime, timedelta
from app.db.database import SessionLocal, engine, Base
from app.db.models import User, Company, Contact, Customer, Lead, Deal, Activity, Task, Meeting, Notification
from app.core.security import get_password_hash

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).filter(User.email == "demo@verticalrevops.ai").first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding production SaaS data...")

    # 1. Admin User
    admin = User(
        email="demo@verticalrevops.ai",
        hashed_password=get_password_hash("password123"),
        full_name="Alex Morgan",
        role="ADMIN",
        company_name="Vertical RevOps AI",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    # 2. Companies
    c1 = Company(name="Stripe Financial", domain="stripe.com", industry="FinTech", size="500-2000", annual_revenue=15000000.0, location="San Francisco, CA")
    c2 = Company(name="Datadog Cloud", domain="datadoghq.com", industry="SaaS & Cloud", size="1000-5000", annual_revenue=25000000.0, location="New York, NY")
    c3 = Company(name="Figma Design", domain="figma.com", industry="Design Technology", size="200-500", annual_revenue=8000000.0, location="San Francisco, CA")
    c4 = Company(name="Snowflake Data", domain="snowflake.com", industry="Data & Analytics", size="2000+", annual_revenue=40000000.0, location="Bozeman, MT")
    c5 = Company(name="Vercel Hosting", domain="vercel.com", industry="Developer Tools", size="100-500", annual_revenue=12000000.0, location="San Francisco, CA")

    db.add_all([c1, c2, c3, c4, c5])
    db.commit()

    # 3. Contacts
    ct1 = Contact(first_name="Marcus", last_name="Vance", email="marcus.vance@stripe.com", phone="+1 (415) 890-1234", title="VP of Global Revenue", company_id=c1.id)
    ct2 = Contact(first_name="Sarah", last_name="Lin", email="sarah.lin@datadoghq.com", phone="+1 (212) 555-9012", title="Head of Revenue Operations", company_id=c2.id)
    ct3 = Contact(first_name="David", last_name="Kovacs", email="d.kovacs@figma.com", phone="+1 (415) 321-7890", title="Chief Commercial Officer", company_id=c3.id)
    ct4 = Contact(first_name="Rachel", last_name="Stern", email="rachel.s@snowflake.com", phone="+1 (303) 444-1122", title="Director of Enterprise Sales", company_id=c4.id)

    db.add_all([ct1, ct2, ct3, ct4])
    db.commit()

    # 4. Customers
    cust1 = Customer(name="Stripe Financial", company_id=c1.id, status="ACTIVE", mrr=45000.0, arr=540000.0, health_score=94)
    cust2 = Customer(name="Figma Design", company_id=c3.id, status="EXPANDING", mrr=28000.0, arr=336000.0, health_score=88)

    db.add_all([cust1, cust2])
    db.commit()

    # 5. Leads
    l1 = Lead(title="Enterprise RevOps Modernization", contact_name="Marcus Vance", email="marcus.vance@stripe.com", company_name="Stripe Financial", company_id=c1.id, owner_id=admin.id, status="QUALIFIED", source="Inbound Web", value=120000.0, score=92, intent_score=95, urgency_score=88, budget_score=94, engagement_score=90, ai_summary="High-intent opportunity. CTO & VP RevOps signed off on Q3 budget.")
    l2 = Lead(title="Automated Pipeline Scoring Engine", contact_name="Sarah Lin", email="sarah.lin@datadoghq.com", company_name="Datadog Cloud", company_id=c2.id, owner_id=admin.id, status="NEW", source="Partner Referral", value=85000.0, score=78, intent_score=80, urgency_score=70, budget_score=85, engagement_score=75, ai_summary="Warm referral from Partner Network. Evaluating AI scoring vs HubSpot.")
    l3 = Lead(title="Global Sales Funnel Optimization", contact_name="Rachel Stern", email="rachel.s@snowflake.com", company_name="Snowflake Data", company_id=c4.id, owner_id=admin.id, status="NEW", source="Outbound SDR", value=150000.0, score=85, intent_score=88, urgency_score=82, budget_score=90, engagement_score=80, ai_summary="Large enterprise expansion target. 500+ seat potential.")

    db.add_all([l1, l2, l3])
    db.commit()

    # 6. Deals
    d1 = Deal(title="Stripe - Enterprise Platform License", company_id=c1.id, contact_id=ct1.id, owner_id=admin.id, stage="NEGOTIATION", value=120000.0, win_probability=85, health_score=90, notes_summary="Legal review in progress. Final MSA expected this Friday.")
    d2 = Deal(title="Datadog - AI Sales Intelligence Module", company_id=c2.id, contact_id=ct2.id, owner_id=admin.id, stage="PROPOSAL", value=85000.0, win_probability=70, health_score=82, notes_summary="Proposal submitted to Head of RevOps. Tech review scheduled.")
    d3 = Deal(title="Figma - Commercial Expansion Seat Package", company_id=c3.id, contact_id=ct3.id, owner_id=admin.id, stage="WON", value=64000.0, win_probability=100, health_score=98, notes_summary="Contract signed! 12-month expansion commitment.")
    d4 = Deal(title="Vercel - Developer RevOps Integration", company_id=c5.id, owner_id=admin.id, stage="MEETING", value=45000.0, win_probability=55, health_score=75, notes_summary="Discovery call completed. Architecture review planned.")
    d5 = Deal(title="Snowflake - Global Revenue Operations OS", company_id=c4.id, contact_id=ct4.id, owner_id=admin.id, stage="QUALIFIED", value=180000.0, win_probability=60, health_score=88, notes_summary="Initial demo completed. High executive interest.")

    db.add_all([d1, d2, d3, d4, d5])
    db.commit()

    # 7. Activities
    a1 = Activity(deal_id=d1.id, user_name="Alex Morgan", activity_type="MEETING", title="Executive MSA Review", description="Reviewed custom SLA terms and payment schedule with Marcus Vance.")
    a2 = Activity(deal_id=d3.id, user_name="Alex Morgan", activity_type="STAGE_CHANGE", title="Deal Closed Won", description="Figma expanded contract by $64,000 ARR.")
    db.add_all([a1, a2])

    # 8. Tasks & Meetings
    t1 = Task(title="Send Revised MSA to Stripe Legal", description="Update Section 4.2 with custom uptime guarantee clause.", due_date=datetime.utcnow() + timedelta(days=1), priority="URGENT", deal_title="Stripe - Enterprise Platform License")
    t2 = Task(title="Prepare AI Lead Scoring Demo for Datadog", description="Configure live sandbox environment showing natural language query engine.", due_date=datetime.utcnow() + timedelta(days=2), priority="HIGH", deal_title="Datadog - AI Sales Intelligence Module")
    db.add_all([t1, t2])

    m1 = Meeting(title="Stripe Final Contract Review", start_time=datetime.utcnow() + timedelta(hours=3), end_time=datetime.utcnow() + timedelta(hours=4), deal_title="Stripe - Enterprise Platform License", summary="Final legal alignment before e-signature.")
    m2 = Meeting(title="Datadog Technical Architecture Review", start_time=datetime.utcnow() + timedelta(days=1, hours=2), end_time=datetime.utcnow() + timedelta(days=1, hours=3), deal_title="Datadog - AI Sales Intelligence Module", summary="Review API security and SSO integration.")
    db.add_all([m1, m2])

    # 9. Notifications
    n1 = Notification(user_id=admin.id, title="🎉 Deal Closed Won!", message="Figma expanded contract by $64,000 ARR.", category="DEAL_WON")
    n2 = Notification(user_id=admin.id, title="🔥 High Intent Lead Alert", message="Stripe Financial lead scored 92/100 by AI Engine.", category="LEAD_ASSIGNED")
    n3 = Notification(user_id=admin.id, title="⏰ Upcoming Meeting", message="Stripe Final Contract Review starts in 3 hours.", category="MEETING_REMINDER")
    db.add_all([n1, n2, n3])

    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_db()
