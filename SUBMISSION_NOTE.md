# SUBMISSION COVER EMAIL & BRIEF

**To**: hr.ops.allo@gmail.com  
**Subject**: Assignment Submission: AI Operations / Founder's Office – Recurring Task Tracking System  
**Candidate Name**: [Your Name]  
**Education**: 4th Year B.Tech, Computer Science Engineering (Artificial Intelligence & Machine Learning)  
**Contact**: [Your Phone Number] | [Your Email] | [LinkedIn / GitHub Profile]  
**Google Sheet Prototype Link**: `[PASTE_YOUR_GOOGLE_SHEET_URL_HERE]` *(Please ensure Editor access is granted to hr.ops.allo@gmail.com)*  

---

### Dear Allo Innoware Operations & Founder's Office Team,

Please find my submission for the **AI Operations / Founder's Office Assignment Test**.

As a final-year B.Tech CSE (AI & ML) student, I built a functional, low-maintenance recurring task tracking system using **Google Sheets and Google Apps Script**. I deliberately kept the interface basic, plain, and professional—avoiding decorative banners, neon dashboards, and visual bloat so that it operates smoothly as a real internal company tool.

---

### 1. Structure of the Prototype

The spreadsheet contains six clean sheets with standard light gray headers:
1. **`Task_Master`**: Master configuration of all four tasks (Daily, 7d, 15d, 30d), due dates, and cycle states.
2. **`Employee_Report`**: The single operating view for employees. Filter by name in Cell B1, view active and overdue tasks, enter Ticket IDs or WhatsApp confirmation notes in **Column H**, and tick **Column I** to complete.
3. **`Completion_Log`**: An append-only audit trail recording every completed cycle, timestamp, user, proof, and turnaround status.
4. **`Manager_Dashboard`**: A simple 2-column operational summary table and review desk where the manager can acknowledge issues, grant 24-hour waivers, or resolve items.
5. **`Notification_Log`**: A dedicated audit log tracking every alert and escalation with delivery statuses to prevent duplicate emails.
6. **`Settings`**: A configurable table controlling daily cutoff hours (18:00 IST), alert buffers (30m), leadership escalation SLA (24h), and recipient email addresses.

---

### 2. Key Operational Features & Design Decisions

1. **Automatic Recurrence:** When an employee marks a cycle complete, the script archives the record and automatically calculates the next due date (+1 day skipping Sunday for daily tasks; +7, +15, +30 days for periodic tasks) anchored to the scheduled cycle cadence.
2. **Daily WhatsApp Task Completion:** Rather than pretending to scrape private WhatsApp groups (which is brittle and violates Meta policies without paid enterprise APIs), the employee enters a short update summary and timestamp in Column H (e.g., `WA-1730-OPS-OK` or `Posted dispatch figures at 17:35 IST`). The system logs the user email and timestamp to `Completion_Log` and queues the next working day.
3. **Manager Monitoring & Acknowledgement:** The manager views overdue counts on `Manager_Dashboard` and can select a task to log acknowledgement or grant a 24-hour extension waiver (e.g., for external portal downtime), pausing leadership escalation.
4. **SLA Timing & Escalation Ladder:**
   - **18:00 IST:** Workday task deadline.
   - **18:30 IST (T+30m):** Same-day consolidated manager alert digest email.
   - **12 Hours:** Manager review window.
   - **24 Hours:** Level 2 Leadership Escalation dispatched to the Founder's Office if uncompleted and unacknowledged.
5. **Duplicate Prevention:** Every cycle has a deterministic ID (`CYC-TSK001-C1`). The system cross-references `Notification_Log` before sending any communication, ensuring that running the script multiple times produces zero duplicate rows and zero duplicate emails.

---

### 3. Quick Verification Instructions (Under 2 Minutes)

1. Open the shared Google Sheet: `[PASTE_YOUR_GOOGLE_SHEET_URL_HERE]` (Editor access provided).
2. Click the top custom menu: **`Task Operations`**.
3. Select **`Run 8 Assignment Tests`**.
4. A standard dialog box will display the live test execution results across all 8 scenarios:
   - PASS: Test 1: Recurring Cycle (+7 days)
   - PASS: Test 2: Single-Point Completion View
   - PASS: Test 3: Daily Task (WhatsApp Confirmation)
   - PASS: Test 4: Same-Day Manager Alert
   - PASS: Test 5: Manager Acknowledgement / Waiver
   - PASS: Test 6: Leadership Escalation (>24h SLA Breach)
   - PASS: Test 7: Configurable SLA Logic
   - PASS: Test 8: Duplicate Prevention (Idempotency)

The complete Google Apps Script code is in **Extensions > Apps Script** and is also archived in the attached [`Code.gs`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/Code.gs) and [`README.md`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/README.md).

I look forward to discussing how this lightweight operational system can support Allo Innoware's day-to-day operations.

Sincerely,  
**[Your Name]**  
4th Year B.Tech, CSE (AI & ML)  
Candidate for AI Operations / Founder's Office
