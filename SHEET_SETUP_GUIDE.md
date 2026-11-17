# ALLO INNOWARE — GOOGLE SHEET SETUP & FORMULA GUIDE
## Step-by-Step Deployment Instructions for the Hiring & Operations Evaluation Team

---

## 1. Quick 60-Second Setup Guide

You can deploy and run the complete Allo Innoware automation prototype in **under 60 seconds** using the built-in system initialization engine:

### Step 1: Open a Blank Google Sheet
1. Go to [sheets.new](https://sheets.new) in your web browser.
2. Title the sheet: `Allo Innoware - Recurring Task & Escalation Engine`.

### Step 2: Open Google Apps Script
1. In the top menu, navigate to **Extensions** > **Apps Script**.
2. Erase any default code in the `Code.gs` editor.
3. Copy the entire contents of [`Code.gs`](file:///C:/Users/tanis/.gemini/antigravity/scratch/allo-innoware-task-automation/Code.gs) and paste it into the editor.
4. Click the **💾 Save** icon (or press `Ctrl + S`).

### Step 3: Run One-Click Initialization
1. In the Apps Script toolbar, ensure the function dropdown is set to **`initializeSystem`**.
2. Click **▶️ Run**.
3. Google will ask for standard OAuth permissions (*"Review permissions"* > choose your account > click *"Advanced"* > *"Go to Untitled project (unsafe)"* > click *"Allow"*).
4. Within 3 seconds, the script creates all 6 sheets with headers, color formatting, seed data, formulas, and data validations!

### Step 4: Reload the Google Sheet
1. Switch back to your Google Sheets tab and refresh the page (`F5`).
2. A custom menu named **`🚀 Allo Ops Engine`** will appear in the top menu bar.

---

## 2. Complete Sheet Architecture & Formula Reference

The system consists of 6 integrated sheets:

```
├── ⚙️ Task_Master            (Recurring configuration definitions)
├── 🔄 Active_Cycles           (Live operational state engine)
├── 📋 My_Pending_Tasks        (Frictionless single-point employee portal)
├── 📜 Completion_History_Log  (Immutable audit trail of all completed cycles)
├── 📊 Manager_Dashboard       (Control tower, KPI metrics, & review desk)
└── ⚙️ SLA_Settings            (Configurable SLA, cutoff, & recipient settings)
```

---

### Sheet 1: `⚙️ Task_Master`
Defines the recurring operational cadence for Allo Innoware team members.

#### Column Layout:
- **Col A (`Task_ID`)**: Unique identifier (e.g., `TSK-001`, `TSK-002`, `TSK-003`, `TSK-004`).
- **Col B (`Task_Name`)**: Name of operational task (`Daily Operations Update`, `Portal Task A`, `Portal Task B`, `Portal Task C`).
- **Col C (`Assigned_To_Name`)**: Employee name (`Employee A`, `Employee B`, `Employee C`, `Employee D`).
- **Col D (`Assigned_To_Email`)**: Employee email address.
- **Col E (`Frequency`)**: Cadence label (`Daily`, `7 Days`, `15 Days`, `30 Days`).
- **Col F (`Frequency_Days`)**: Integer cycle length (`1`, `7`, `15`, `30`).
- **Col G (`Proof_Type`)**: Expected verification (`WhatsApp Update Log`, `Ticket ID`).
- **Col H (`Cutoff_Time`)**: Daily deadline (`18:00`).
- **Col I (`Manager_Name`)**: Manager's name (`Operations Manager`).
- **Col J (`Manager_Email`)**: Manager's notification email.
- **Col K (`Leadership_Email`)**: Leadership escalation recipient (`founders.office@alloinnoware.com`).
- **Col L (`Active_Status`)**: `Active` or `Paused`.

---

### Sheet 2: `🔄 Active_Cycles`
The operational state machine maintaining active task instances.

#### Column Layout:
1. `Cycle_ID`: Unique cycle key (`CYC-TSK001-C1`).
2. `Task_ID`: Linked master task ID.
3. `Task_Name`: Task title.
4. `Assigned_To_Name`: Assignee name.
5. `Assigned_To_Email`: Assignee email.
6. `Frequency`: Cycle frequency.
7. `Cycle_Number`: Current iteration counter (`1`, `2`, `3`...).
8. `Cycle_Start_Date`: Date when cycle began (`YYYY-MM-DD`).
9. `Due_Date`: Scheduled completion deadline (`YYYY-MM-DD`).
10. `Cutoff_Time`: Cutoff hour (`18:00`).
11. `Status`: `PENDING`, `OVERDUE`, `ESCALATED`, or `COMPLETED`.
12. `Proof_Type`: Type of required proof.
13. `Completion_Proof`: Ticket ID or WhatsApp link recorded upon completion.
14. `Completion_Notes`: Employee remarks.
15. `Completed_At`: Timestamp of completion.
16. `Completed_By`: User email who completed the cycle.
17. `Manager_Alert_Sent`: Boolean (`TRUE` / `FALSE`).
18. `Manager_Alert_Timestamp`: Timestamp of Level 1 alert.
19. `Manager_Ack_Status`: `PENDING_REVIEW`, `ACKNOWLEDGED`, `WAIVED_EXTENSION`.
20. `Manager_Ack_Timestamp`: When manager reviewed.
21. `Manager_Ack_Notes`: Manager remarks.
22. `Leadership_Escalation_Sent`: Boolean (`TRUE` / `FALSE`).
23. `Leadership_Escalation_Timestamp`: Timestamp of Level 2 escalation.

#### Status Calculation Formula (Optional in Col K):
```excel
=IF(O2<>"", "COMPLETED", IF(V2=TRUE, "ESCALATED", IF(I2<TODAY(), "OVERDUE", "PENDING")))
```

---

### Sheet 3: `📋 My_Pending_Tasks` (Single Point of Updating)
The primary user interface for employees. Designed for zero duplicate work.

#### Layout:
- **Cell B2 (`Filter by Assignee:`)**: Dropdown containing `All Employees`, `Employee A`, `Employee B`, `Employee C`, `Employee D`.
- **Table Headers (Row 4)**:
  - **Col A (`Cycle ID`)**: System key.
  - **Col B (`Task Description`)**: Task name.
  - **Col C (`Assigned To`)**: Assignee.
  - **Col D (`Due Date`)**: Target completion date.
  - **Col E (`Status`)**: Current status (`PENDING`, `OVERDUE`, `ESCALATED`).
  - **Col F (`Required Proof Type`)**: `Ticket ID` or `WhatsApp Update Log`.
  - **Col G (`Enter Proof / Ticket ID (EDIT HERE)`)**: **Editable input cell.**
  - **Col H (`Employee Remarks (OPTIONAL)`)**: **Editable input cell.**
  - **Col I (`Mark Complete [✓]`)**: **Interactive Checkbox.**

#### How Single-Point Updating Operates:
1. The employee opens **`My_Pending_Tasks`**.
2. They select their name in **B2** to see only their pending duties.
3. In their task row, they enter the Ticket ID or WhatsApp log in **Col G**.
4. They tick the checkbox in **Col I**.
5. The Apps Script `onEdit` hook intercepts the tick:
   - Validates proof presence.
   - Archives the completed cycle to `Completion_History_Log`.
   - Advances `Active_Cycles` to the next cycle and recalculates the new due date.
   - Clears the row from the pending list.
   - **Zero navigation between multiple sheets required.**

---

### Sheet 4: `📜 Completion_History_Log`
The immutable historical ledger for all completed tasks across cycles.

#### Columns:
- `Log_ID`: Unique log ID (`LOG-XXXXXXXX`).
- `Cycle_ID`: Linked cycle.
- `Task_ID`: Linked master task.
- `Task_Name`: Task name.
- `Assigned_To`: Completed assignee.
- `Cycle_Number`: Cycle iteration.
- `Scheduled_Due_Date`: Target due date.
- `Completed_Timestamp`: Exact completion timestamp.
- `Completed_By`: Submitter email.
- `Proof_Submitted`: Ticket ID or WhatsApp digest.
- `Employee_Remarks`: Remarks.
- `Turnaround_Status`: `On-Time` or `Completed Overdue`.
- `Days_Late`: Numeric delay in days.

---

### Sheet 5: `📊 Manager_Dashboard`
Executive command desk for the Operations Manager and Founder's Office.

#### KPI Summary Metrics (Row 3-4):
- **Cell B4 (`Total Active Cycles`)**:
  ```excel
  =COUNTA(Active_Cycles!A2:A)
  ```
- **Cell C4 (`Pending Today`)**:
  ```excel
  =COUNTIFS(Active_Cycles!I2:I, TODAY(), Active_Cycles!K2:K, "PENDING")
  ```
- **Cell D4 (`Overdue (Alerted)`)**:
  ```excel
  =COUNTIFS(Active_Cycles!K2:K, "OVERDUE")
  ```
- **Cell E4 (`Escalated to Leadership`)**:
  ```excel
  =COUNTIFS(Active_Cycles!K2:K, "ESCALATED")
  ```
- **Cell F4 (`Awaiting Manager Review`)**:
  ```excel
  =COUNTIFS(Active_Cycles!Q2:Q, TRUE, Active_Cycles!S2:S, "PENDING_REVIEW")
  ```

#### Manager Interactive Action Desk:
- **Cell D12**: Dropdown to select flagged `Cycle ID`.
- **Cell D13**: Action dropdown (`Acknowledge & Follow Up`, `Grant 24h Waiver`, `Mark Resolved Manually`).
- **Cell D14**: Free-text notes / resolution plan.
- **Cell D15**: Interactive Checkbox (`Submit Review`). Ticking triggers `onEdit`, updating the backend, pausing escalation, and recording manager acknowledgement.

---

### Sheet 6: `⚙️ SLA_Settings`
Configurable operational governance rules.

| Parameter Key | Value | Description |
| :--- | :--- | :--- |
| `DEFAULT_CUTOFF_HOUR` | `18` | Daily deadline hour (18:00 IST). |
| `MANAGER_GRACE_HOURS` | `12` | Review window for manager before escalation timer continues. |
| `LEADERSHIP_SLA_HOURS` | `24` | Hours post manager alert before auto-escalating to Leadership. |
| `SEND_ACTUAL_EMAILS` | `FALSE` | Set to `TRUE` to send real emails via GmailApp. |
| `MANAGER_EMAIL` | `manager.ops@alloinnoware.com` | Primary Level 1 notification address. |
| `LEADERSHIP_EMAIL` | `founders.office@alloinnoware.com` | Primary Level 2 escalation address. |

---

## 3. Time-Driven Automated Triggers Setup

To run the alert and escalation engines on autopilot:
1. In the Apps Script editor, click the **⏰ Triggers** icon (left sidebar).
2. Click **+ Add Trigger** (bottom right).
3. **Trigger 1: Same-Day Manager Alert**
   - Function: `checkAndSendManagerAlerts`
   - Event Source: `Time-driven`
   - Type: `Day timer`
   - Time of Day: `6pm to 7pm` (runs at 18:30 IST cutoff).
4. **Trigger 2: Leadership Escalation Engine**
   - Function: `checkAndSendLeadershipEscalations`
   - Event Source: `Time-driven`
   - Type: `Hour timer`
   - Interval: `Every 2 hours` or `Every 4 hours`.
5. Click **Save**.
