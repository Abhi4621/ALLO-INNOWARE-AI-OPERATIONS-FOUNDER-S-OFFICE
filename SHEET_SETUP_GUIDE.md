# ALLO INNOWARE — GOOGLE SHEET SETUP & AUTOMATION GUIDE

This guide covers setting up the **Working Google Sheet Prototype** and attaching the **Google Apps Script** automation in under 60 seconds.

---

## Option A: One-Click Setup from Blank Google Sheet (Recommended)

1. Go to [sheets.new](https://sheets.new) and rename the sheet to:
   `Allo Innoware - Recurring Task Tracking System`
2. In the top menu, click **Extensions → Apps Script**.
3. Delete any default code in `Code.gs`, copy the full contents of [`Code.gs`](./Code.gs), and paste it in.
4. Click **Save** (`Ctrl + S`).
5. In the top toolbar dropdown, select **`setupSheets`** and click **Run**.
   - Approve Google OAuth permissions when prompted (*Review permissions → Select your account → Advanced → Go to project → Allow*).
6. Switch back to the Google Sheet and refresh (`F5`).
7. A custom menu **`Task Operations`** will appear in the top menu bar.
8. Click **Task Operations → Install Hourly Auto-Trigger** so overdue checks and SLA escalations run automatically in Google Cloud every hour.

## Option B: Import Pre-Built Workbook First

1. Upload [`Allo_Innoware_Recurring_Task_Tracker.xlsx`](./Allo_Innoware_Recurring_Task_Tracker.xlsx) to Google Drive.
2. Open it with **Google Sheets** and click **File → Save as Google Sheets**.
3. Open **Extensions → Apps Script**, paste [`Code.gs`](./Code.gs), save, and run `setupAutomaticTriggers` (or click **Task Operations → Install Hourly Auto-Trigger** after refreshing).

---

## Sheet Architecture (6 Tabs)

| Sheet Name | Role | Key Columns / Cells |
| :--- | :--- | :--- |
| **`Task_Master`** | Recurring schedule & live state | Col A–N: `Task ID`, `Task Name`, `Assigned Employee`, `Frequency`, `Start Date`, `Due Date`, `Required Proof`, `Completion Status`, `Active/Inactive`, `Cycle Number`, `Cycle ID`, `Manager Alerted`, `Manager Ack`, `Leadership Escalated` |
| **`Employee_Report`** | Single-point employee view | Cell `B1`: Employee filter dropdown. Rows 4+: Pending tasks with Col `H` (`Ticket ID / Proof`) and Col `I` (`Mark Complete` checkbox). |
| **`Completion_Log`** | Immutable audit trail | Col A–K: `Completion ID`, `Cycle ID`, `Task ID`, `Task Name`, `Assigned Employee`, `Cycle Number`, `Due Date`, `Completed At`, `Completed By`, `Proof Submitted`, `Turnaround Status` |
| **`Manager_Dashboard`** | Summary KPIs & review desk | `B4:B7`: Live counts (`Active`, `Pending Today`, `Overdue`, `Escalated`). `B11:B14`: Select Task ID, choose Action (`Acknowledge & Follow Up`, `Waived / 24h Extension`, `Mark Resolved Manually`), enter Remarks, tick Submit checkbox. |
| **`Notification_Log`** | Alert & escalation ledger | Col A–J: `Notification ID`, `Timestamp`, `Cycle ID`, `Task ID`, `Task Name`, `Recipient Email`, `Recipient Role`, `Notification Type`, `Trigger Reason`, `Delivery Status` |
| **`Settings`** | Configurable SLA rules | `CUTOFF_HOUR` (`18`), `CUTOFF_MINUTE` (`0`), `MANAGER_ALERT_DELAY_MINS` (`30`), `LEADERSHIP_ESCALATION_HOURS` (`24`), `SIMULATION_MODE` (`TRUE`/`FALSE`), `MANAGER_EMAIL`, `LEADERSHIP_EMAIL` |

---

## Sharing for Submission

1. Set `SIMULATION_MODE` in `Settings` (`B6`) to `TRUE` for safe dry-run testing, or `FALSE` to dispatch live emails via Gmail.
2. Click **Share** on the Google Sheet and grant **Editor** access to `hr.ops.allo@gmail.com`.
3. Verify all 8 test cases via **Task Operations → Run 8 Assignment Tests**.
