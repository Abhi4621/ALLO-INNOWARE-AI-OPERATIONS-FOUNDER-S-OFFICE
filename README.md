# Allo Innoware - Operations Management Portal & Task Engine

**Company:** Allo Innoware (https://alloinnoware.com/)  
**Role:** AI Operations / Founder's Office Assignment  
**Brand Identity:** Official Allo Innoware Cookware & D2C Kitchenware Design  
**Tech Stack:** Google Sheets, Google Apps Script, Node.js (Zero Dependencies), Vercel-ready  

---

## 1. Official Brand Identity (Matching alloinnoware.com)

The web prototype has been designed to match the official **Allo Innoware** brand identity:
- **Brand Logo:** `allo.` in vibrant olive/lime green with leaf sprout mark and `INNOWARE` subscript.
- **Color Palette:** 
  - Primary Brand Green: `#7cb342` / `#8bc34a` (matching "SHOP NOW" & "ADD TO CART" store buttons).
  - Background: Clean, fresh ivory & off-white `#fdfbf7`, identical to Allo's Borosilicate Glass & Cookware store.
  - Alert Red: `#e53935` / `#ffebee` (matching Allo's store sale tags).
- **Top Announcement Strip:** Phone support `+91 70281 80799`, live 18:00 cutoff countdown widget, and dispatch tracking.
- **Operational Context:** Real Indian D2C kitchenware operations (Triply pressure cookers, Borosilicate glass storage containers, stainless steel lunchboxes).
- **Floating WhatsApp Quick Logger:** Bottom right WhatsApp button (matching the store) allowing 1-click pre-filling of daily dispatch logs for Employee A!

---

## 2. Quick Start & Execution

### A. Run Locally (Zero Dependencies)
The server is currently running live on:
👉 **`http://localhost:3000`**

To start it manually at any time:
```bash
cd C:\Users\tanis\.gemini\antigravity\scratch\allo-innoware-task-automation
npm start
```

### B. Deploy to Vercel (Instant)
The project is configured via [`vercel.json`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/vercel.json) pointing directly to `public/`:
```bash
npx vercel
```
Or push this Git repository to GitHub and import it on Vercel.

---

## 3. Operational Features & Verification

- **Single-Point Employee Portal:** Team members filter by assignee, view pending/overdue duties, input Ticket IDs or WhatsApp update summaries, and click **Complete**.
- **Automated Recurrence Engine:** Completing a task archives the cycle to `Completion Log` and automatically advances `Task Master` (+1 day skipping Sunday for daily, +7d, +15d, +30d).
- **Manager Dashboard & Action Desk:** Displays live overdue counts, and allows the manager to grant a 24-hour waiver (extending the due date by 1 day and pausing escalation) or resolve tasks.
- **Email Notification Preview:** Each alert in `Notification Log` features a **Preview Email** button that renders the branded executive HTML alert format.
- **Dual Export:** Export audit records to real **CSV** and **JSON** files.
- **Automated 8-Test Suite:** All 8 test cases pass with full verification cards.

---

## 4. Verification Across All 8 Required Tests

| # | Test Scenario | Execution & Check | Result |
| :---: | :--- | :--- | :---: |
| **1** | **Recurring Cycle** | Complete 7-day task `TSK-002`. Verified that old due date advanced by exactly +7 days in `Task_Master` and logged to `Completion_Log`. | **PASS ✓** |
| **2** | **Single-Point Completion** | Verified that `Employee Portal` displays active pending tasks with editable proof and complete action in one unified place. | **PASS ✓** |
| **3** | **Daily Task Completion** | Submit structured WhatsApp update proof (`WA-1730-OPS-OK`). Verified cycle closed without Ticket ID. | **PASS ✓** |
| **4** | **Same-Day Manager Alert** | Click `Test Overdue Alert`. Script detects overdue status, fires Level 1 alert, and logs to `Notification_Log`. | **PASS ✓** |
| **5** | **Manager Action / Ack** | Manager grants `Waived / 24h Extension`. Due date extends by 1 day and pauses leadership escalation. | **PASS ✓** |
| **6** | **Leadership Escalation** | Task unresolved >24h post alert without waiver. Dispatched Level 2 escalation to Leadership email. | **PASS ✓** |
| **7** | **Configurable SLA Timing** | Verified that `Settings` controls cutoff (`18:00`), alert buffer (`30m`), and escalation SLA (`24h`) dynamically. | **PASS ✓** |
| **8** | **Duplicate Prevention** | Executed automated check multiple times back-to-back. Verified that 0 duplicate notification rows and 0 duplicate cycles were generated. | **PASS ✓** |

---

## 5. Deliverables in Project Workspace

- **Web Prototype**: [`public/index.html`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/public/index.html), [`public/styles.css`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/public/styles.css), [`public/app.js`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/public/app.js)
- **Local Server**: [`server.js`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/server.js) & [`package.json`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/package.json)
- **Vercel Config**: [`vercel.json`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/vercel.json)
- **Google Sheets Code**: [`Code.gs`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/Code.gs)
- **Submission Note**: [`SUBMISSION_NOTE.md`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/SUBMISSION_NOTE.md)
