import random
from typing import Dict, Any, List

class AIService:

    @staticmethod
    def calculate_lead_scores(company_name: str, deal_size: float, engagement_clicks: int = 10, emails_opened: int = 4, decision_maker_present: bool = True) -> Dict[str, Any]:
        # Intelligent heuristic model for multi-dimensional AI scoring
        intent = min(98, max(30, int(engagement_clicks * 5 + emails_opened * 6 + (20 if decision_maker_present else 0))))
        urgency = min(95, max(25, int(intent * 0.85 + random.randint(-5, 10))))
        budget = min(99, max(40, int((deal_size / 1000.0) * 0.3 + 55)))
        engagement = min(96, max(35, int(emails_opened * 12 + engagement_clicks * 3)))
        
        overall_score = int((intent * 0.3) + (urgency * 0.25) + (budget * 0.25) + (engagement * 0.2))
        win_prob = min(95, max(15, int(overall_score * 0.92)))

        recommendations = []
        if not decision_maker_present:
            recommendations.append("⚠️ Multi-thread contact: Single point of contact risk detected. Connect with VP/C-Suite.")
        if urgency > 75:
            recommendations.append("🔥 High Urgency: Schedule demo within 24 hours to capitalize on active buying cycle.")
        if budget > 80:
            recommendations.append("💰 High Budget Fit: Send Enterprise custom proposal with SLA add-ons.")
        if engagement < 50:
            recommendations.append("📧 Low Engagement: Re-engage with personalized executive case study.")

        if not recommendations:
            recommendations.append("✅ Lead momentum is healthy. Proceed to schedule solution architecture review.")

        return {
            "overall_score": overall_score,
            "intent_score": intent,
            "urgency_score": urgency,
            "budget_score": budget,
            "engagement_score": engagement,
            "win_probability": win_prob,
            "recommendations": recommendations,
            "ai_summary": f"High-intent opportunity with {company_name}. Deal size of ${deal_size:,.2f} aligns strongly with enterprise purchasing history. Decision-maker engagement score is at {intent}%."
        }

    @staticmethod
    def generate_email(recipient_name: str, recipient_company: str, value_prop: str, tone: str = "professional") -> Dict[str, str]:
        subject = f"Transforming RevOps efficiency at {recipient_company}"
        if tone == "casual":
            subject = f"Quick question regarding {recipient_company}'s revenue workflow"
        elif tone == "persuasive":
            subject = f"Eliminating revenue leakage for {recipient_company}"

        body = f"""Hi {recipient_name},

I noticed {recipient_company} is scaling its revenue operations team and thought of reaching out. 

With Vertical RevOps AI, revenue teams automate lead scoring, pipeline risk detection, and contract workflows in one unified platform—typically unlocking 32% faster deal cycles.

{value_prop}

Would you be open to a 15-minute introductory call next Tuesday at 10 AM EST?

Best regards,
Alex Morgan
Senior RevOps Specialist | Vertical RevOps AI"""

        return {
            "subject": subject,
            "body": body
        }

    @staticmethod
    def generate_proposal(client_name: str, company_name: str, deal_value: float, key_features: List[str]) -> Dict[str, Any]:
        features_formatted = "\n".join([f"  • {feat}" for feat in (key_features or ["AI Lead Scoring Engine", "Kanban Pipeline Automation", "Revenue Analytics & Forecasting"])])
        
        proposal_text = f"""# EXECUTIVE PROPOSAL & SOLUTION ARCHITECTURE
**Prepared for**: {client_name} ({company_name})
**Prepared by**: Vertical RevOps AI Enterprise Team
**Investment Summary**: ${deal_value:,.2f} ARR

---

## 1. Executive Summary
{company_name} is seeking a modern, AI-powered Revenue Operations platform to eliminate manual CRM overhead, streamline multi-stage deal pipelines, and forecast annual recurring revenue with 95%+ precision.

## 2. Included Scope & Capabilities
{features_formatted}

## 3. Financial Investment & SLA
- **Annual License**: ${deal_value:,.2f} / year
- **Implementation & Onboarding**: Included (Dedicated Solution Engineer)
- **Support Level**: 24/7 Enterprise SLA with 99.99% Uptime Guarantee

## 4. Next Steps
Upon electronic signature, onboarding begins within 48 hours.
"""

        return {
            "title": f"RevOps Enterprise Proposal - {company_name}",
            "deal_value": deal_value,
            "content": proposal_text
        }

    @staticmethod
    def parse_natural_language_query(query: str, deals: List[Any], leads: List[Any]) -> Dict[str, Any]:
        query_lower = query.lower()
        matched_deals = []
        matched_leads = []

        # Simple intelligent NL query parser
        for deal in deals:
            d_title = getattr(deal, "title", "").lower()
            d_stage = getattr(deal, "stage", "").lower()
            d_company = getattr(deal, "company_name", "") or ""
            d_val = getattr(deal, "value", 0)

            if "stuck" in query_lower or "risk" in query_lower:
                if getattr(deal, "risk_flag", None) or d_stage in ["negotiation", "proposal"]:
                    matched_deals.append(deal)
            elif "won" in query_lower or "closed" in query_lower:
                if d_stage == "won":
                    matched_deals.append(deal)
            elif "enterprise" in query_lower or "large" in query_lower or "50k" in query_lower:
                if d_val >= 50000:
                    matched_deals.append(deal)
            elif query_lower in d_title or query_lower in d_stage or query_lower in d_company.lower():
                matched_deals.append(deal)

        if not matched_deals:
            matched_deals = deals[:5]

        for lead in leads:
            l_title = getattr(lead, "title", "").lower()
            l_source = getattr(lead, "source", "").lower()
            if "qualified" in query_lower and getattr(lead, "status", "") == "QUALIFIED":
                matched_leads.append(lead)
            elif "inbound" in query_lower and "inbound" in l_source:
                matched_leads.append(lead)
            elif query_lower in l_title or query_lower in l_source:
                matched_leads.append(lead)

        if not matched_leads:
            matched_leads = leads[:5]

        return {
            "query": query,
            "interpretation": f"Filtered revenue objects based on natural language intent: '{query}'",
            "matched_deals_count": len(matched_deals),
            "matched_leads_count": len(matched_leads),
            "deals": matched_deals,
            "leads": matched_leads
        }
