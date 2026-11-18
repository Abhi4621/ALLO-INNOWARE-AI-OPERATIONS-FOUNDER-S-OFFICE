# ALLO INNOWARE — WORKING DEMONSTRATION & 8 TEST CASES

All 8 assignment scenarios can be executed directly inside Google Sheets in one click via:
**`Task Operations` → `Run 8 Assignment Tests`** (runs `runAllTests()` in [`Code.gs`](./Code.gs)).

---

## Test Verification Matrix

| # | Test Case | Function / Action Verified | Expected & Observed Outcome | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Recurring Cycle (+7 Days)** | `markTaskCompleted("TSK-002", "CYC-TSK002-C1", "TICKET-7788", ...)` | Logs completion in `Completion_Log`; advances `Task_Master` Due Date by exactly +7 days and increments Cycle ID to `CYC-TSK002-C2`. | **PASS** |
| **2** | **Single-Point Completion** | `Employee_Report` filter (`B1`), proof input (Col `H`), checkbox (Col `I`) via `onEdit(e)` | Employee completes task directly in `Employee_Report` without editing `Task_Master` or `Completion_Log` manually. Blank proof is blocked with an alert. | **PASS** |
| **3** | **Daily Task (WhatsApp Method)** | `markTaskCompleted("TSK-001", "CYC-TSK001-C1", "WA-1730-OPS-OK", ...)` | Accepts structured WhatsApp update summary without requiring a Ticket ID; schedules next working day (automatically skips Sunday). | **PASS** |
| **4** | **Same-Day Manager Alert** | `TSK-003` due date past cutoff → `checkOverdueAndSendAlerts()` | Marks status `Overdue`, sends consolidated manager alert (or logs simulated alert), sets `Manager Alerted = TRUE`, and records row in `Notification_Log`. | **PASS** |
| **5** | **Manager Action & 24h Waiver** | `Manager_Dashboard` (`B11:B14`) → `processManagerReview()` | Selecting `Waived / 24h Extension` shifts due date by +1 day, sets status back to `Pending`, logs `Manager Acknowledgement`, and pauses leadership escalation. | **PASS** |
| **6** | **Leadership Escalation (>24h)** | `TSK-004` with manager alert >24h old and `Manager Ack = None` → `checkOverdueAndSendAlerts()` | Fires Level 2 Leadership Escalation email to `LEADERSHIP_EMAIL` (CC Manager), marks status `Escalated`, sets `Leadership Escalated = TRUE`. | **PASS** |
| **7** | **Configurable SLA Timing** | `getSettings()` reading `Settings` tab | Reads `CUTOFF_HOUR = 18`, `MANAGER_ALERT_DELAY_MINS = 30`, `LEADERSHIP_ESCALATION_HOURS = 24` dynamically without editing code. | **PASS** |
| **8** | **Duplicate Prevention** | Back-to-back calls to `checkOverdueAndSendAlerts()` | Checks `hasNotification(cycleId, notifType)` and boolean state flags; produces **0 duplicate alerts** and **0 duplicate cycles**. | **PASS** |

---

## Live Walkthrough Script (For Interview / Demo)

1. **Show `Task_Master`**: Point out the 4 recurring tasks (`TSK-001` Daily, `TSK-002` 7 Days, `TSK-003` 15 Days, `TSK-004` 30 Days) and their active `Cycle ID`s.
2. **Demonstrate Single-Point Completion (`Employee_Report`)**:
   - Select `Employee B` in cell `B1`.
   - Try ticking Col `I` with Col `H` empty → script blocks completion and asks for Ticket ID.
   - Enter `TICKET-4029` in Col `H` and tick Col `I` → task completes, logs to `Completion_Log`, and `Task_Master` due date jumps +7 days automatically.
3. **Demonstrate Daily WhatsApp Tracking**:
   - Select `Employee A` in `B1`.
   - Enter `WA-1730-OPS-OK (184 sets dispatched, 0 exceptions)` in Col `H` and tick Col `I`.
   - Show that no Ticket ID is needed and next due date advances to the next working day (skipping Sunday).
4. **Demonstrate Overdue Detection, Manager Waiver & Escalation**:
   - Change `TSK-003` due date in `Task_Master` to yesterday and run **Task Operations → Check Overdue Tasks**.
   - Show `Notification_Log` entry and `Manager_Dashboard` overdue counter updating.
   - On `Manager_Dashboard`, select `TSK-003` in `B11`, pick `Waived / 24h Extension` in `B12`, add a note in `B13`, and tick `B14` → due date extends by 24h and escalation pauses.
5. **Run Full Automated Suite**:
   - Click **Task Operations → Run 8 Assignment Tests** to show all 8 checks passing live.
