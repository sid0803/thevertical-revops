import os
import random
from typing import Dict, Any, List

class LLMService:
    @staticmethod
    def query_sales_copilot(prompt: str, deals: List[Any] = None, leads: List[Any] = None) -> Dict[str, Any]:
        prompt_lower = prompt.lower()
        
        # 1. Lead Priority Query
        if "lead" in prompt_lower and ("call" in prompt_lower or "today" in prompt_lower or "priority" in prompt_lower):
            top_leads = [
                {
                    "title": "Enterprise RevOps Modernization",
                    "company": "Stripe Financial",
                    "contact": "Marcus Vance",
                    "score": 92,
                    "reason": "High Intent (95%) & Executive Sign-off. Urgent follow-up recommended."
                },
                {
                    "title": "Global Sales Funnel Optimization",
                    "company": "Snowflake Data",
                    "contact": "Rachel Stern",
                    "score": 85,
                    "reason": "High Budget Fit (90%) & 500+ seat potential. Demo follow-up due today."
                }
            ]
            return {
                "answer": "Here are the top 2 high-priority leads you should call today based on AI Intent Scores and engagement velocity:",
                "type": "LEAD_PRIORITY",
                "items": top_leads,
                "suggested_action": "Schedule 15-minute executive check-in with Marcus Vance at Stripe Financial."
            }

        # 2. Stuck / At Risk Deals Query
        elif "stuck" in prompt_lower or "risk" in prompt_lower or "30 days" in prompt_lower:
            stuck_deals = [
                {
                    "title": "Datadog - AI Sales Intelligence Module",
                    "company": "Datadog Cloud",
                    "value": 85000,
                    "stage": "PROPOSAL",
                    "stuck_days": 18,
                    "risk": "Technical evaluation pending approval from VP RevOps."
                },
                {
                    "title": "Snowflake - Global Revenue Operations OS",
                    "company": "Snowflake Data",
                    "value": 180000,
                    "stage": "QUALIFIED",
                    "stuck_days": 12,
                    "risk": "Decision maker missing in procurement loop."
                }
            ]
            return {
                "answer": "I identified 2 high-value enterprise deals currently stalled in stage progression:",
                "type": "STUCK_DEALS",
                "items": stuck_deals,
                "suggested_action": "Send AI-generated executive check-in email to Head of RevOps at Datadog."
            }

        # 3. Generate Proposal Query
        elif "proposal" in prompt_lower or "quote" in prompt_lower:
            return {
                "answer": "I have compiled a custom Enterprise Solution Proposal for Stripe Financial ($120,000 ARR).",
                "type": "PROPOSAL",
                "proposal_preview": {
                    "title": "Enterprise RevOps Platform Agreement - Stripe Financial",
                    "arr": 120000.0,
                    "features": ["AI Lead Scoring Engine", "7-Stage Kanban Automation", "99.99% Uptime SLA"],
                },
                "suggested_action": "Click 'Review & Send Proposal' to dispatch via DocuSign integration."
            }

        # 4. Meeting Summary Query
        elif "meeting" in prompt_lower or "summary" in prompt_lower:
            return {
                "answer": "Summary of Executive MSA Review with Stripe Financial:",
                "type": "MEETING_SUMMARY",
                "summary": "Marcus Vance confirmed legal approval for Section 4.2 custom SLA. Final contract signing planned for Friday morning. Next step: Dispatch final MSA.",
                "suggested_action": "Create task 'Send Revised MSA to Stripe Legal Team' due tomorrow."
            }

        # Default Copilot Response
        return {
            "answer": f"AI Copilot response for prompt: '{prompt}'. I scanned 5 active deals, 3 leads, and recent activities. Pipeline momentum is healthy with $1.78M ARR run-rate.",
            "type": "GENERAL",
            "items": [],
            "suggested_action": "Explore Dashboard analytics or run lead scoring."
        }

    @staticmethod
    def generate_customer_360_summary(customer_name: str, arr: float, health_score: int) -> Dict[str, Any]:
        return {
            "customer_name": customer_name,
            "executive_summary": f"{customer_name} is a high-value active customer with ${arr:,.2f} ARR and a strong health score of {health_score}%. Product adoption is expanding rapidly across RevOps teams.",
            "sentiment": "STRONG_EXPANSION",
            "risk_level": "LOW",
            "recommended_next_action": f"Propose multi-year contract renewal with 15% expansion discount for {customer_name}.",
            "key_milestones": [
                "Purchased 100 enterprise RevOps seats in Q1",
                "Achieved 94% platform adoption within 30 days",
                "Opened expansion review for Q4 contract renewal"
            ]
        }
