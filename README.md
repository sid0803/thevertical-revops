# TheVertical.ai — RevOps OS

A cloud-based Revenue Operating System (RevOps OS) designed to automate the complete Lead → Client → Billing → Onboarding lifecycle with precision attribution mapping and AI revenue intelligence.

## Features Built & Fully Operational

1. **Authentication & Strict RBAC Middleware**:
   - Secure token-based session management (8h JWT).
   - Role permissions strictly verified in backend routers and conditionally rendered in frontend Sidebar:
     - **Super Admin**: Full platform configuration and GST slab controls.
     - **Manager**: Team pipeline visibility, revenue reports, and approvals.
     - **Team Leader**: Pipeline assignment and performance monitoring for their direct reps.
     - **Sales Executive**: Leads capturing, stage movement, call logging, and notes.
     - **Account Manager**: Client profiles, SLA handoff checklists, and commitment targets.
     - **Finance**: Invoice generation, slab payments, and tax receipts.
2. **Leads & Funnel Pipeline**:
   - Sequential, strict stage-progression rules (NEW → INTERESTED → PROPOSAL_SHARED → PAYMENT_COMPLETED).
   - Duplicate detection warnings during creation.
   - Activities timeline (logs of calls with durations, progress notes, stage movements).
3. **Automated Client Handoff Trigger**:
   - Updating a lead stage to `PAYMENT_COMPLETED` automatically converts the lead into an active Client account, generates a Handoff ticket assigned to the AM, and initializes a 60-day Commitment SLA window.
4. **Billing & GST Bookkeeping**:
   - Invoice auto-numbering in `INV-YYYY-MM-XXXX` format.
   - Live tax computation (CGST+SGST or IGST) based on configurable GST slabs.
   - Payment milestone tracking (DRAFT, PARTIALLY PAID, PAID statuses updated dynamically).
5. **Attribution Logic Engine (USP)**:
   - Initial sale -> 100% credited to Sales Exec.
   - Expansion sales inside the 60-day commitment window -> 100% credited to Sales Exec.
   - Expansion sales after the 60-day window -> 100% credited to AM.
   - Joint sales (noted in transaction details) -> split 70% Sales Exec / 30% AM.
6. **AI revenue Intelligence Panel**:
   - Automated conversion scoring, follow-up alerts, stuck deal risk warnings, and expansion predictions.

---

## Setup & Quick Start

The system is configured to run out of the box using a local SQLite instance, ensuring no external database dependencies are required for evaluation.

### 1. Start Backend Server
```bash
cd backend
npm install
# Database is already initialized and seeded with mock data.
# In case you want to reset/reseed:
# npx prisma migrate dev --name init
# npx prisma db seed

npm run dev
```
The backend server runs on `http://localhost:5000`.

### 2. Start Frontend Server
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server runs on `http://localhost:5173`.

---

## Demo Accounts Credentials

You can log in effortlessly using the **Quick Login Demo Profiles** grid on the Login page (1-click entry), or enter the credentials manually:

- **Super Admin**: `admin@thevertical.ai` / `Password123@`
- **Team Leader (Arun)**: `arun@thevertical.ai` / `Password123@`
- **Sales Rep (Ravi)**: `ravi@thevertical.ai` / `Password123@`
- **Account Manager**: `am@thevertical.ai` / `Password123@`
- **Finance User**: `finance@thevertical.ai` / `Password123@`

---

*Built for TheVertical.ai by Sandipan Chakraborty — AI/Data Science Intern*
*Internship start: 21 May 2026 | Target delivery: 13 June 2026*
