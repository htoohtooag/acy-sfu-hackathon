# ⚖️ Business Rules & Logic
**Project:** Myanmar Freelance Marketplace

This document defines the strict business logic, state transitions, and access control rules. AI agents MUST enforce these rules in the backend validation, database constraints, and frontend UI.

---

## 1. User Roles & Access Control
- **Dual Roles:** A user can be both a Client and a Freelancer. 
- **Onboarding Gate:** A user is a `LEAD` until they complete at least one profile (Client or Freelancer). Leads cannot create packages, post jobs, or send messages.
- **Plan Limits:** Users are restricted by their active `subscription_plan`.
  - *Free Client:* Max 3 active Job Posts. Basic AI search only.
  - *Pro Client:* Unlimited Job Posts. Access to AI Agent (Function Calling) and Proactive AI Sourcing.
  - *Free Freelancer:* Max 3 active Packages, Max 3 concurrent Active Orders. 10% Platform Commission.
  - *Pro Freelancer:* Unlimited Packages/Orders. 5% Platform Commission. Requires Admin approval (must have `success_rate > 90%` and `completed_projects > 5`).
- **Moderation:** Admins can suspend users. A suspended user cannot log in or perform any actions.

## 2. Marketplace Catalog Rules
- **Packages (Fiverr Style):** Freelancers create fixed-price services. Must have a title, price (MMK), and delivery time. 
- **Job Posts (Upwork Style):** Clients post custom requirements with a budget range (Min/Max MMK).
- **AI Indexing:** All packages and freelancer profiles MUST generate a `pgvector` embedding upon creation/update for AI semantic search.
- **Deactivation vs. Deletion:** Users can "deactivate" a package (hidden from search) or "delete" it (soft-deleted in DB). Deleted packages cannot be purchased, but remain in the DB for historical order tracking.

## 3. Orders & Escrow Lifecycle (Strict State Machine)
An Order represents the contract between Client and Freelancer. It MUST follow this exact state flow:

1. `AWAITING_ESCROW`: Created when a Client buys a Package or accepts a Custom Offer. **Workroom chat is strictly READ-ONLY.**
2. `ACTIVE`: Reached only when Admin verifies the client's manual payment proof. **Workroom chat unlocks.**
3. `IN_REVIEW`: Reached when Freelancer submits the final Deliverable. **Funds are still locked.**
4. `COMPLETED`: Reached when Client clicks "Approve & Release Payment". **Clean file is unlocked, funds released to freelancer.**
5. `DISPUTED`: Reached if either party raises a dispute during `ACTIVE` or `IN_REVIEW`.
6. `CANCELED`: Order is voided (e.g., escrow never funded, or dispute resolved in client's favor).

**Financial Rules:**
- The `platform_fee_mmk` MUST be calculated and locked at the moment the Order is created, based on the Freelancer's subscription plan at that exact time.
- If an Order is upgraded to `COMPLETED`, the Freelancer's `total_earnings_mmk` and `completed_projects_count` must increment.

## 4. Workroom & Deliverable Rules
- **Workroom Access:** Only the `client_id` and `freelancer_id` attached to the specific `Order.id` can join the Socket.io room or fetch messages.
- **The Watermark Lock (Trust Engine):**
  - When a Freelancer uploads a Deliverable, the backend MUST use `sharp` to generate two files: a watermarked preview (low-res, "DRAFT" stamp) and a clean file (high-res).
  - While the Order is `IN_REVIEW`, the frontend MUST ONLY be served the watermarked URL.
  - The clean URL is ONLY exposed to the frontend when the Order status becomes `COMPLETED`.
- **Milestones:** For Custom Offers, an Order can have multiple Milestones. Each milestone follows its own mini-escrow flow (`PENDING_FUNDING` -> `FUNDED` -> `IN_REVIEW` -> `RELEASED`).

## 5. AI Search & Sourcing Rules
- **Intent Extraction:** The AI Agent MUST use Function Calling (Tools) to extract hard filters (Skill, Location, Max Budget) from the user's prompt.
- **Strict Filtering:** The backend MUST run SQL exact-match filters first. Vector similarity (pgvector) is ONLY used to sort the exact matches.
- **Proactive Sourcing (Pro Feature):** When a Pro Client creates a Job Post, the system MUST automatically generate an embedding for the job, run a similarity search against `freelancer_profiles`, and return the top 3 matches with an AI-generated justification.

## 6. Reputation & Resolution Rules
- **Review Window:** A review can only be submitted if the Order status is `COMPLETED`.
- **Double-Blind:** Both Client and Freelancer can leave a review. Reviews are hidden until both submit, or until a 14-day window expires.
- **Dispute Escalation:** If a dispute is raised, the Workroom chat becomes read-only. Only an Admin can resolve the dispute, which will flip the Order status to either `COMPLETED` (freelancer wins) or `CANCELED` (client wins/refund). All admin actions must be logged in `admin_audit_logs`.
