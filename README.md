# Allo Innoware - Recurring Task Tracking & Escalation System

**Developer:** 4th Year B.Tech CSE (Artificial Intelligence & Machine Learning)  
**Role:** AI Operations / Founder's Office Assignment  
**Tech Stack:** Google Sheets, Google Apps Script (JavaScript), Gmail  

---

## 1. Overview & Problem Understanding

Allo Innoware requires a clean, functional system to manage recurring tasks across team members (Employees A, B, C, and D) repeating at different intervals:
- **Daily Operations Update** (Employee A - Daily)
- **Portal Task A** (Employee B - Every 7 days)
- **Portal Task B** (Employee C - Every 15 days)
- **Portal Task C** (Employee D - Every 30 days)

### Practical Design Goals:
- **Plain, basic, and functional layout:** Avoided visual bloat, huge colored banners, pastel rainbow dashboards, and unnecessary charts. The spreadsheet looks like a real, clean internal operations tool.
- **Single-point updating:** Team members view pending tasks and enter Ticket IDs or WhatsApp completion summaries in one place (`Employee_Report`).
- **No manual date math:** Completing a task automatically archives the cycle and schedules the next cycle (+1 working day for daily, +7d, +15d, +30d).
- **Practical daily WhatsApp tracking:** Uses a structured confirmation update and timestamp directly in the sheet rather than pretending to use unofficial WhatsApp scrapers.
- **Same-day manager alerts & leadership escalation:** 18:00 cutoff -> 18:30 manager batch alert -> 24h leadership escalation if unresolved.
- **Zero duplicates:** Every cycle has a deterministic ID, and `Notification_Log` prevents duplicate emails even if automated checks run repeatedly.

---

## 2. Spreadsheet Structure

The system uses 6 plain, organized sheets with standard light gray headers (`#F1F3F4`):

| Sheet Name | Role | What is on the Sheet |
| :--- | :--- | :--- |
| **`Task_Master`** | Task Configuration & State Engine | Task ID, Task Name, Assigned Employee, Frequency, Start Date, Due Date, Required Proof, Status, Cycle Number, Cycle ID, Alert Flags. |
| **`Employee_Report`** | Single-Point Operating View | Row 1: Employee filter dropdown. Row 3: Table headers. Rows 4+: Active/overdue tasks with editable Ticket ID / Proof (Col H) and Mark Complete checkbox (Col I). |
| **`Completion_Log`** | Immutable Audit Ledger | Completion ID, Cycle ID, Task ID, Task Name, Employee, Cycle Number, Due Date, Completed At, Completed By, Proof Submitted, Turnaround Status. |
| **`Manager_Dashboard`** | Operational Overview & Review Desk | Clean 2-column summary table (Total Active, Pending Today, Overdue, Escalated) and compact action form (Task ID, Action, Remarks, Submit Checkbox). |
| **`Notification_Log`** | Communication & Duplicate Audit | Notification ID, Timestamp, Cycle ID, Task Name, Recipient Email, Role, Alert Type, Reason, Delivery Status. |
| **`Settings`** | Configurable SLA Parameters | Cutoff hour (18), alert delay (30 mins), leadership escalation SLA (24 hrs), simulation mode flag, and recipient email addresses. |

---

## 3. How Core Requirements Were Solved

### A. Automatic Recurrence
When an employee checks "Mark Complete":
1. The script writes an immutable entry into `Completion_Log`.
2. It calculates the next due date based on the task frequency:
   - **Daily:** Next calendar day (automatically advances to Monday if it lands on Sunday).
   - **7 Days:** Adds 7 days to current due date.
   - **15 Days:** Adds 15 days.
   - **30 Days:** Adds 30 days.
3. It updates `Task_Master` with the new cycle ID (e.g. `CYC-TSK002-C2`), resets status to `Pending`, and clears the alert flags.
4. `Employee_Report` updates instantly.

### B. Single-Point Completion View
Employees only interact with `Employee_Report`:
- Column H: Enter Ticket ID / Proof.
- Column I: Tick `Mark Complete [✓]`.
- The `onEdit(e)` trigger detects the checkbox. If Column H is empty, it alerts the user and unchecks the box. If valid, it closes the cycle and archives the task.

### C. Daily Task Completion Method (WhatsApp Update)
Private WhatsApp group chats do not offer public, reliable APIs without enterprise-level WhatsApp Business Cloud API access. Rather than pretending to scrape WhatsApp, the system uses a **structured confirmation log**:
- Employee A posts their update in the team WhatsApp group at their normal time (e.g., 17:30 IST).
- In `Employee_Report` Column H, Employee A enters the message summary/timestamp (e.g., `WA-1730-OPS-OK` or `Posted dispatch figures at 17:35 IST`).
- Employee A checks the box.
- The script logs Employee A's email, exact completion timestamp, and update note into `Completion_Log`, then queues the next working day's cycle.

### D. SLA Timing & Two-Tier Escalation Ladder
- **18:00 IST:** Workday cutoff deadline.
- **18:30 IST (T+30 mins):** Automated script runs. If a task is still pending, it is marked `Overdue`. The script batches all overdue tasks into **one clean consolidated email** to the manager, rather than spamming separate emails.
- **12 Hours:** Manager review window. The manager can review the task on `Manager_Dashboard` and grant a 24-hour waiver if there is a valid blocker (e.g., external portal was down).
- **24 Hours:** If a task remains unresolved after 24 hours and the manager has not granted a waiver, the script triggers a **Leadership Escalation** email to `hr.ops.allo@gmail.com` (Founder's Office) and marks the task `Escalated`.

### E. Duplicate Prevention
- Unique Cycle IDs (`CYC-[TaskID]-C[CycleNumber]`).
- Every notification is recorded in `Notification_Log`.
- Before sending an alert or escalation, the function checks `hasNotification(cycleId, notifType)`. If an alert was already sent for that cycle, it is skipped. Running the script multiple times will never send duplicate emails or create duplicate tasks.

---

## 4. Setup in Google Sheets (Under 60 Seconds)

1. Open a new Google Sheet at [sheets.new](https://sheets.new).
2. Go to **Extensions > Apps Script**.
3. Replace the code in `Code.gs` with the code from [`Code.gs`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/Code.gs).
4. Save the project (`Ctrl + S`).
5. Select **`setupSheets`** from the function dropdown and click **Run**.
6. Grant standard authorization (*Advanced > Go to project (unsafe) > Allow*).
7. Return to the sheet and refresh. All 6 sheets are created with clean, basic formatting and sample tasks.
8. A menu named **`Task Operations`** appears in the top bar.

---

## 5. Verification of All 8 Required Test Cases

To verify all test cases, click:  
**`Task Operations` > `Run 8 Assignment Tests`**.

| Test | Objective | Test Procedure & Result | Status |
| :---: | :--- | :--- | :---: |
| **1** | **Recurring Cycle** | Completed 7-day task `TSK-002`. Verified that old due date advanced by exactly +7 days in `Task_Master` and logged to `Completion_Log`. | **PASS** |
| **2** | **Single-Point Completion** | Verified that `Employee_Report` displays active pending tasks with editable proof in Column H and checkbox in Column I. | **PASS** |
| **3** | **Daily Task (WhatsApp)** | Completed daily task `TSK-001` using text confirmation `WA-1730-OPS-OK`. Successfully closed cycle without requiring a Ticket ID. | **PASS** |
| **4** | **Same-Day Manager Alert** | Simulated an uncompleted task past 18:00 cutoff. Script detected overdue status, sent consolidated manager alert, and logged to `Notification_Log`. | **PASS** |
| **5** | **Manager Acknowledgement** | Manager submitted `Waived / 24h Extension`. Verified that due date extended by 1 day and status updated in `Task_Master`. | **PASS** |
| **6** | **Leadership Escalation** | Simulated overdue task unresolved for >24 hours without waiver. Script dispatched Level 2 escalation to Leadership email. | **PASS** |
| **7** | **Configurable SLA Timing** | Verified that `Settings` controls cutoff (`18:00`), alert buffer (`30m`), and escalation SLA (`24h`) without hardcoded values. | **PASS** |
| **8** | **Duplicate Prevention** | Executed automated check multiple times back-to-back. Verified that 0 duplicate notification rows and 0 duplicate cycles were generated. | **PASS** |
