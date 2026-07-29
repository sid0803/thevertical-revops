from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import engine, Base
from app.seed import seed_db

from app.api.v1 import (
    auth,
    customers,
    companies,
    contacts,
    leads,
    deals,
    dashboard,
    analytics,
    notifications,
    ai
)

# Initialize database schema and seed data
Base.metadata.create_all(bind=engine)
try:
    seed_db()
except Exception as e:
    print(f"Seed info: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration for Vercel/Local dev
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(customers.router, prefix=f"{settings.API_V1_STR}/customers", tags=["Customers"])
app.include_router(companies.router, prefix=f"{settings.API_V1_STR}/companies", tags=["Companies"])
app.include_router(contacts.router, prefix=f"{settings.API_V1_STR}/contacts", tags=["Contacts"])
app.include_router(leads.router, prefix=f"{settings.API_V1_STR}/leads", tags=["Leads"])
app.include_router(deals.router, prefix=f"{settings.API_V1_STR}/deals", tags=["Deals"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["Notifications"])
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI"])

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
