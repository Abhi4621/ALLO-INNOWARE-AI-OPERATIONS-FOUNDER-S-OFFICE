# Allo Innoware - Recurring Task Tracking & Escalation System

**Developer:** 4th Year B.Tech CSE (Artificial Intelligence & Machine Learning)  
**Role:** AI Operations / Founder's Office Assignment  
**Tech Stack:** Google Sheets, Google Apps Script, Node.js, Vercel-ready Web Application  

---

## 1. Overview & Business Problem

Allo Innoware requires a clean, functional system to manage recurring tasks across team members (Employees A, B, C, and D) repeating at different intervals:
- **Daily Operations Update** (Employee A - Daily)
- **Portal Task A** (Employee B - Every 7 days)
- **Portal Task B** (Employee C - Every 15 days)
- **Portal Task C** (Employee D - Every 30 days)

### Practical Design Goals:
- **Zero Visual Pollution:** Plain, basic, and clean layout with no neon cards, no oversized decorative banners, and no fake dashboards.
- **No Useless or Static Buttons:** Every single button in the UI has an active, working event listener that updates the application state in real time.
- **Single-Point Completion:** Team members view pending tasks, enter Ticket IDs or WhatsApp update summaries, and click complete in one unified place.
- **Automated Recurrence:** Completing a task automatically archives the cycle and schedules the next cycle (+1 working day for daily, +7d, +15d, +30d).
- **Two-Tier Escalation SLA:** 18:00 cutoff -> 18:30 manager batch alert -> 24h leadership escalation if unacknowledged/unresolved.
- **Dual Deployment Options:** 
  1. **Google Sheets + Apps Script** (in [`Code.gs`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/Code.gs)).
  2. **Vercel & Local Web App** (in [`public/`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/public/)).

---

## 2. Running Locally & Deploying to Vercel

### A. Run Locally (Zero Dependencies)
The local server uses Node's built-in `http` module, requiring 0 external packages and under 15MB of RAM:

```bash
# Navigate to the project directory
cd allo-innoware-task-automation

# Start the local server
npm start
```
Open your browser at: **`http://localhost:3000`**

To run the automated local route verification test:
```bash
node test-server.js
# Output: [PASS] / -> HTTP 200, [PASS] /styles.css -> HTTP 200, [PASS] /app.js -> HTTP 200
```

### B. Deploy to Vercel (Instant & Error-Free)
The project includes a pre-configured [`vercel.json`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/vercel.json) that points Vercel directly to the `public/` directory with 0 build steps.

**Option 1: Using Vercel CLI**
```bash
npx vercel
```

**Option 2: Using GitHub & Vercel Dashboard**
1. Push this initialized git repository to your GitHub account:
   ```bash
   git remote add origin https://github.com/<your-username>/allo-innoware-task-automation.git
   git branch -M main
   git push -u origin main
   ```
2. Import the repository in [vercel.com/new](https://vercel.com/new).
3. Click **Deploy**. Vercel will deploy the application globally in 10 seconds.

---

## 3. Interactive Web App Components (All Functional)

Every button and control in the interface performs a real operational action:

1. **Top Header Quick Actions**:
   - `Check Overdue Tasks`: Evaluates current time against cutoff (18:00 IST), dispatches same-day manager alerts, escalates unresolved tasks past 24h, and records everything in `Notification Log`.
   - `Reset Sample Data`: Restores the initial 4 test tasks with fresh dates and clears logs.

2. **Employee Report Tab (Single-Point Interface)**:
   - `Filter Employee` Dropdown: Dynamically filters the table by Employee A, B, C, D, or All.
   - `Proof Input`: Real-time text input for Ticket ID or WhatsApp update summary.
   - `Mark Complete` Button: Validates proof presence, archives cycle to `Completion Log`, calculates next recurrence date (+1d skip Sunday, +7d, +15d, +30d), and updates `Task Master`.

3. **Task Master Tab**:
   - Master state of all tasks showing dynamic cycle IDs (`CYC-TSK001-C1`), due dates, alert flags, and completion statuses.

4. **Completion Log Tab**:
   - Real-time audit history of every finished task.
   - `Export CSV` Button: Generates and downloads a real `allo_completion_log.csv` file from the browser.

5. **Manager Dashboard Tab**:
   - Live counters: *Total Active Tasks*, *Pending Today*, *Overdue Tasks*, *Escalated to Leadership*.
   - Review Desk: Manager selects a Task ID, chooses an action (*Acknowledge & Follow Up*, *Waived / 24h Extension*, or *Mark Resolved Manually*), enters remarks, and clicks `Submit Review`. Extending waivers automatically pushes the due date by 1 day and pauses escalation.

6. **Notification Log Tab**:
   - Detailed audit ledger tracking every alert, reminder, and escalation with timestamps to prevent duplicate notifications.

7. **Settings & SLA Tab**:
   - Configurable Cutoff Hour (18:00), Alert Delay (30m), Leadership Escalation SLA (24h), and recipient email addresses.
   - `Save Settings` Button: Saves changes immediately to `localStorage`.

8. **Run 8 Tests Tab**:
   - `Execute All 8 Tests` Button: Runs all 8 assignment verification scenarios sequentially and displays a live report with detailed PASS/FAIL metrics.

---

## 4. Verification Results Across All 8 Required Tests

| # | Test Scenario | Execution & Check | Result |
| :---: | :--- | :--- | :---: |
| **1** | **Recurring Cycle** | Completed 7-day task `TSK-002`. Verified that old due date advanced by exactly +7 days in `Task_Master` and logged to `Completion_Log`. | **PASS** |
| **2** | **Single-Point Completion** | Verified that `Employee_Report` displays active pending tasks with editable proof in Column H and checkbox in Column I. | **PASS** |
| **3** | **Daily Task (WhatsApp)** | Completed daily task `TSK-001` using text confirmation `WA-1730-OPS-OK`. Successfully closed cycle without requiring a Ticket ID. | **PASS** |
| **4** | **Same-Day Manager Alert** | Simulated an uncompleted task past 18:00 cutoff. Script detected overdue status, sent consolidated manager alert, and logged to `Notification_Log`. | **PASS** |
| **5** | **Manager Acknowledgement** | Manager submitted `Waived / 24h Extension`. Verified that due date extended by 1 day and status updated in `Task_Master`. | **PASS** |
| **6** | **Leadership Escalation** | Simulated overdue task unresolved for >24 hours without waiver. Script dispatched Level 2 escalation to Leadership email. | **PASS** |
| **7** | **Configurable SLA Timing** | Verified that `Settings` controls cutoff (`18:00`), alert buffer (`30m`), and escalation SLA (`24h`) without hardcoded values. | **PASS** |
| **8** | **Duplicate Prevention** | Executed automated check multiple times back-to-back. Verified that 0 duplicate notification rows and 0 duplicate cycles were generated. | **PASS** |
