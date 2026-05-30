# Project Blueprint: Vicharanashala FAQ Crowd-Sourced Portal

## 1. Project Context & Constraints
This is a prototype for an enterprise-grade, crowd-sourced FAQ dashboard.
- **Frontend:** React with Tanstack (Query, Router).
- **Backend:** NestJS (Express adapter).
- **Database:** MongoDB (via Mongoose).
- **LLM Integration:** Abstracted AI Service (Primary: Minimax m2.7 via proxy, Fallback: Gemini API).

## 2. Core Architecture (The 3 Pages)
1. **Main FAQ Dashboard:** Displays existing FAQs. Must include category filters (NOC, Timing, etc.) and a "Most Asked" section sorted by a `view_count` integer in the database.
2. **User Input / Chat Widget:** A chat interface (Yaksha-mini) where students ask raw questions. This routes to the NestJS backend, which uses RAG to fetch context and calls the LLM.
3. **Query Resolved (Admin Panel):** A maker-checker workflow. Unresolved questions or student-drafted answers go to a `Pending_Approvals` queue. An ADMIN must review and approve them before they are pushed to the live FAQs collection.

## 3. Database Schema Requirements (Mongoose)
- **FAQs Collection:** `question` (string), `answer` (string), `category` (string), `view_count` (number, default: 0), `actionUrl` (string, optional).
- **Pending_Approvals Collection:** `question` (string), `draft_answer` (string), `status` (enum: PENDING, APPROVED, REJECTED), `studentId` (string).
- **Users Collection:** `role` (enum: STUDENT, ADMIN), `reward_points` (number, default: 0), `bookmarks` (array of FAQ ObjectIds).

## 4. Crucial Backend Logic: The LLM Fallback Service
The NestJS backend must contain an `AiService`. This service must NEVER hardcode the API logic directly into route controllers. It must use a try/catch loop:
- **Try:** Call the primary LLM endpoint (Minimax).
- **Catch:** If the primary gateway fails or times out, seamlessly fallback to calling the Gemini API. 

## 5. Agent Instructions (CRITICAL)
As the AI assistant building this, you are strictly forbidden from generating the entire application at once. You must wait for the human lead to request specific, granular tasks (e.g., "Generate the Mongoose schemas"). Output ONLY the requested code for that specific task to avoid compute timeouts.