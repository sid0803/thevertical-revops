from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter()

class EmailReplyRequest(BaseModel):
    email_id: int
    custom_instruction: str = ""

@router.get("")
def get_emails():
    return [
        {
            "id": 1,
            "sender_name": "Marcus Vance",
            "sender_email": "marcus.vance@stripe.com",
            "company_name": "Stripe Financial",
            "subject": "Re: Section 4.2 Legal Review & MSA Approval",
            "snippet": "Our legal counsel approved the 99.99% uptime SLA language. Please send the final executable contract for signing...",
            "timestamp": "10:15 AM",
            "unread": True,
            "ai_summary": "Customer legal approved MSA terms. Ready for contract e-signature.",
            "ai_recommended_action": "Send final contract for electronic signature.",
            "ai_suggested_reply": "Hi Marcus,\n\nFantastic news! I'm sending the final executable MSA via DocuSign right now.\n\nBest,\nAlex Morgan"
        },
        {
            "id": 2,
            "sender_name": "Sarah Lin",
            "sender_email": "sarah.lin@datadoghq.com",
            "company_name": "Datadog Cloud",
            "subject": "Datadog AI Lead Scorer Technical Evaluation",
            "snippet": "We reviewed the AI scoring documentation. Can we schedule a 30-minute architecture deep-dive next Tuesday?",
            "timestamp": "Yesterday",
            "unread": False,
            "ai_summary": "Prospect requested technical architecture deep-dive call next Tuesday.",
            "ai_recommended_action": "Schedule 30-min Zoom call for Tuesday 2 PM.",
            "ai_suggested_reply": "Hi Sarah,\n\nWe would be delighted to host the architecture review. Does Tuesday at 2:00 PM EST work for your team?\n\nBest,\nAlex Morgan"
        },
        {
            "id": 3,
            "sender_name": "Rachel Stern",
            "sender_email": "rachel.s@snowflake.com",
            "company_name": "Snowflake Data",
            "subject": "Snowflake Q4 Enterprise Seat Expansion",
            "snippet": "Our VP of RevOps wants to include 500 enterprise seats in the Q4 budget. Please send a revised price quote...",
            "timestamp": "Jul 28",
            "unread": False,
            "ai_summary": "High expansion intent. Customer requested revised 500-seat enterprise quote.",
            "ai_recommended_action": "Generate custom $180,000 ARR proposal.",
            "ai_suggested_reply": "Hi Rachel,\n\nI have generated the updated 500-seat proposal with enterprise volume discounting ($180k ARR). Attached for review.\n\nBest,\nAlex Morgan"
        }
    ]

@router.post("/reply")
def generate_email_reply(req: EmailReplyRequest):
    return {
        "reply_body": "Hi,\n\nThank you for reaching out! I have updated our CRM records and prepared the requested documents.\n\nBest regards,\nAlex Morgan | Vertical RevOps AI",
        "action_created": "Logged CRM email activity & updated task status to COMPLETED"
    }
