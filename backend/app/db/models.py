import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    REP = "REP"

class LeadStatusEnum(str, enum.Enum):
    NEW = "NEW"
    QUALIFIED = "QUALIFIED"
    UNQUALIFIED = "UNQUALIFIED"
    CONVERTED = "CONVERTED"

class DealStageEnum(str, enum.Enum):
    NEW = "NEW"
    QUALIFIED = "QUALIFIED"
    MEETING = "MEETING"
    PROPOSAL = "PROPOSAL"
    NEGOTIATION = "NEGOTIATION"
    WON = "WON"
    LOST = "LOST"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="REP")
    company_name = Column(String, default="Acme Corp")
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    leads = relationship("Lead", back_populates="owner")
    deals = relationship("Deal", back_populates="owner")
    notifications = relationship("Notification", back_populates="user")

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    domain = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    size = Column(String, nullable=True) # e.g. 50-200
    annual_revenue = Column(Float, default=0.0)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    contacts = relationship("Contact", back_populates="company")
    customers = relationship("Customer", back_populates="company")
    deals = relationship("Deal", back_populates="company")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, index=True, nullable=False)
    phone = Column(String, nullable=True)
    title = Column(String, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="contacts")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    status = Column(String, default="ACTIVE") # ACTIVE, CHURNED, EXPANDING
    mrr = Column(Float, default=0.0)
    arr = Column(Float, default=0.0)
    health_score = Column(Integer, default=85) # 0 to 100
    contract_start = Column(DateTime, nullable=True)
    contract_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="customers")

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    contact_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="NEW")
    source = Column(String, default="Inbound Web") # Inbound, Outbound, Referral, Event
    score = Column(Integer, default=50) # Overall AI score
    intent_score = Column(Integer, default=60)
    urgency_score = Column(Integer, default=50)
    budget_score = Column(Integer, default=70)
    engagement_score = Column(Integer, default=55)
    value = Column(Float, default=0.0)
    ai_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="leads")

class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    stage = Column(String, default="NEW") # NEW, QUALIFIED, MEETING, PROPOSAL, NEGOTIATION, WON, LOST
    value = Column(Float, default=0.0)
    win_probability = Column(Integer, default=50) # %
    expected_close = Column(DateTime, nullable=True)
    health_score = Column(Integer, default=80)
    risk_flag = Column(String, nullable=True) # Low Activity, Decision Maker Missing, Budget Freeze, etc.
    notes_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="deals")
    company = relationship("Company", back_populates="deals")
    activities = relationship("Activity", back_populates="deal")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    user_name = Column(String, default="Alex Morgan")
    activity_type = Column(String, default="NOTE") # CALL, EMAIL, MEETING, NOTE, STAGE_CHANGE
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    deal = relationship("Deal", back_populates="activities")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, default="DEAL") # DEAL, LEAD, CUSTOMER
    entity_id = Column(Integer, nullable=False)
    author_name = Column(String, default="Alex Morgan")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String, default="PENDING") # PENDING, IN_PROGRESS, COMPLETED
    priority = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, URGENT
    assignee_name = Column(String, default="Alex Morgan")
    deal_title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String, default="Google Meet")
    organizer_name = Column(String, default="Alex Morgan")
    deal_title = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, default="ACTIVITY") # DEAL_WON, MEETING_REMINDER, LEAD_ASSIGNED, ACTIVITY
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
