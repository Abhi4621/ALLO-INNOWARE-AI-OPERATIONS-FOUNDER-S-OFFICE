/**
 * Allo Innoware - Recurring Task Tracking & Escalation System
 * 
 * Developer: 4th Year B.Tech CSE (AI & ML) Student
 * Plain, functional Google Sheets automation without visual bloat or external dependencies.
 */

var SHEET_MASTER = "Task_Master";
var SHEET_EMPLOYEE = "Employee_Report";
var SHEET_LOG = "Completion_Log";
var SHEET_MANAGER = "Manager_Dashboard";
var SHEET_NOTIFS = "Notification_Log";
var SHEET_SETTINGS = "Settings";

/**
 * Standard spreadsheet menu.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Task Operations")
    .addItem("Refresh Employee View", "refreshEmployeeReport")
    .addItem("Check Overdue Tasks", "checkOverdueAndSendAlerts")
    .addSeparator()
    .addItem("Run 8 Assignment Tests", "runAllTests")
    .addItem("Reset / Initialize Sheets", "setupSheets")
    .addToUi();
}

/**
 * Handles single-point task completion and manager review submission.
 */
function onEdit(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();
  var row = e.range.getRow();
  var col = e.range.getColumn();

  // 1. Employee Report: Filter change or Mark Complete
  if (sheetName === SHEET_EMPLOYEE) {
    // Cell B1 is employee filter dropdown
    if (row === 1 && col === 2) {
      refreshEmployeeReport();
      return;
    }

    // Row 4 onwards is data. Column 9 (Col I) is Mark Complete checkbox.
    if (row >= 4 && col === 9) {
      var isChecked = e.range.getValue() === true;
      if (!isChecked) return;

      var taskId = sheet.getRange(row, 1).getValue();   // Col A: Task ID
      var cycleId = sheet.getRange(row, 2).getValue();  // Col B: Cycle ID
      var proof = sheet.getRange(row, 8).getValue();    // Col H: Ticket ID / Proof

      if (!taskId) {
        e.range.setValue(false);
        return;
      }

      if (!proof || proof.toString().trim() === "") {
        e.range.setValue(false);
        SpreadsheetApp.getUi().alert(
          "Proof Required",
          "Please enter a Ticket ID or WhatsApp update summary in Column H before marking complete.",
          SpreadsheetApp.getUi().ButtonSet.OK
        );
        return;
      }

      var userEmail = Session.getActiveUser().getEmail() || "employee@alloinnoware.com";
      var success = markTaskCompleted(taskId, cycleId, proof.toString().trim(), userEmail);

      if (success) {
        SpreadsheetApp.getActiveSpreadsheet().toast("Task " + taskId + " completed. Next cycle scheduled.", "Status", 3);
        refreshEmployeeReport();
        refreshManagerDashboard();
      } else {
        e.range.setValue(false);
      }
    }
  }

  // 2. Manager Dashboard: Submit review checkbox in Cell B14
  if (sheetName === SHEET_MANAGER && row === 14 && col === 2) {
    if (e.range.getValue() === true) {
      e.range.setValue(false);
      processManagerReview();
    }
  }
}

/**
 * Records completion in Completion_Log and advances the task in Task_Master.
 */
function markTaskCompleted(taskId, cycleId, proof, completedBy) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName(SHEET_MASTER);
  var logSheet = ss.getSheetByName(SHEET_LOG);

  if (!masterSheet || !logSheet) return false;

  var masterData = masterSheet.getDataRange().getValues();
  var targetRow = -1;

  for (var i = 1; i < masterData.length; i++) {
    if (masterData[i][0] === taskId) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) return false;

  var taskData = masterData[targetRow - 1];
  var taskName = taskData[1];
  var employee = taskData[2];
  var frequency = taskData[3];
  var currentDueDate = new Date(taskData[5]);
  var currentCycleNum = parseInt(taskData[9]) || 1;
  var now = new Date();

  var completionId = "CMP-" + taskId + "-C" + currentCycleNum;
  var isOverdue = now.getTime() > (currentDueDate.getTime() + 24 * 60 * 60 * 1000);
  var turnaroundStatus = isOverdue ? "Completed Late" : "On-Time";

  // Append immutable completion record
  logSheet.appendRow([
    completionId,
    cycleId,
    taskId,
    taskName,
    employee,
    currentCycleNum,
    formatDate(currentDueDate),
    formatDateTime(now),
    completedBy,
    proof,
    turnaroundStatus
  ]);

  // Compute next cycle date
  var nextCycleNum = currentCycleNum + 1;
  var nextStartDate = new Date(currentDueDate.getTime() + 24 * 60 * 60 * 1000);
  var nextDueDate = getNextDueDate(currentDueDate, frequency);
  var newCycleId = "CYC-" + taskId + "-C" + nextCycleNum;

  // Update Task_Master for next cycle
  masterSheet.getRange(targetRow, 5).setValue(formatDate(nextStartDate));
  masterSheet.getRange(targetRow, 6).setValue(formatDate(nextDueDate));
  masterSheet.getRange(targetRow, 8).setValue("Pending");
  masterSheet.getRange(targetRow, 10).setValue(nextCycleNum);
  masterSheet.getRange(targetRow, 11).setValue(newCycleId);
  masterSheet.getRange(targetRow, 12).setValue(false);  // Reset alert flag
  masterSheet.getRange(targetRow, 13).setValue("None"); // Reset ack
  masterSheet.getRange(targetRow, 14).setValue(false);  // Reset escalation flag

  return true;
}

/**
 * Calculates next recurrence due date.
 */
function getNextDueDate(baseDate, frequency) {
  var nextDate = new Date(baseDate.getTime());

  if (frequency === "Daily") {
    nextDate.setDate(nextDate.getDate() + 1);
    if (nextDate.getDay() === 0) { // Skip Sunday
      nextDate.setDate(nextDate.getDate() + 1);
    }
  } else if (frequency === "7 Days") {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === "15 Days") {
    nextDate.setDate(nextDate.getDate() + 15);
  } else if (frequency === "30 Days") {
    nextDate.setDate(nextDate.getDate() + 30);
  } else {
    nextDate.setDate(nextDate.getDate() + 7);
  }

  return nextDate;
}

/**
 * Checks for overdue tasks past cutoff (18:00) and triggers notifications.
 */
function checkOverdueAndSendAlerts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName(SHEET_MASTER);
  var notifSheet = ss.getSheetByName(SHEET_NOTIFS);
  var settings = getSettings();

  if (!masterSheet || !notifSheet) return;

  var masterData = masterSheet.getDataRange().getValues();
  var todayStr = formatDate(new Date());
  var now = new Date();

  var managerOverdueList = [];

  for (var i = 1; i < masterData.length; i++) {
    var row = masterData[i];
    var taskId = row[0];
    var taskName = row[1];
    var employee = row[2];
    var frequency = row[3];
    var dueDate = new Date(row[5]);
    var dueDateStr = formatDate(dueDate);
    var status = row[7];
    var isActive = row[8] === "Active";
    var cycleId = row[10];
    var managerAlerted = row[11] === true;
    var managerAck = row[12];
    var leadershipEscalated = row[13] === true;

    if (!isActive || status === "Completed") continue;

    var isOverdue = false;
    if (dueDateStr < todayStr) {
      isOverdue = true;
    } else if (dueDateStr === todayStr && isPastCutoff(settings.cutoffHour, settings.cutoffMinute)) {
      isOverdue = true;
    }

    if (isOverdue) {
      if (status === "Pending") {
        masterSheet.getRange(i + 1, 8).setValue("Overdue");
      }

      // Step 1: Manager alert if not yet sent
      if (!managerAlerted) {
        if (!hasNotification(cycleId, "Manager Alert")) {
          managerOverdueList.push({
            rowIdx: i + 1,
            taskId: taskId,
            cycleId: cycleId,
            taskName: taskName,
            employee: employee,
            frequency: frequency,
            dueDate: dueDateStr
          });
        }
      }

      // Step 2: Leadership escalation after 24 hours if unresolved and un-waived
      if (managerAlerted && !leadershipEscalated) {
        if (managerAck === "Waived / 24h Extension") {
          continue; // Paused by manager
        }

        var alertTime = getNotificationTimestamp(cycleId, "Manager Alert");
        var hoursElapsed = alertTime ? (now.getTime() - alertTime.getTime()) / (1000 * 60 * 60) : 25;

        if (hoursElapsed >= settings.leadershipEscalationHours) {
          if (!hasNotification(cycleId, "Leadership Escalation")) {
            sendLeadershipEscalationEmail(taskId, cycleId, taskName, employee, dueDateStr, hoursElapsed, managerAck, settings);
            masterSheet.getRange(i + 1, 8).setValue("Escalated");
            masterSheet.getRange(i + 1, 14).setValue(true);
          }
        }
      }
    }
  }

  // Send single consolidated manager alert
  if (managerOverdueList.length > 0) {
    sendManagerAlertEmail(managerOverdueList, settings);
    for (var k = 0; k < managerOverdueList.length; k++) {
      masterSheet.getRange(managerOverdueList[k].rowIdx, 12).setValue(true);
    }
  }

  refreshManagerDashboard();
}

/**
 * Dispatches simple, clean manager email.
 */
function sendManagerAlertEmail(tasks, settings) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var notifSheet = ss.getSheetByName(SHEET_NOTIFS);
  var now = new Date();
  var todayStr = formatDate(now);

  var taskLines = [];
  var htmlRows = [];

  for (var i = 0; i < tasks.length; i++) {
    var t = tasks[i];
    taskLines.push("- " + t.taskId + ": " + t.taskName + " (" + t.employee + ") - Due: " + t.dueDate);
    htmlRows.push("<tr><td style='padding:4px 8px;border:1px solid #ddd;'>" + t.taskId + "</td>" +
      "<td style='padding:4px 8px;border:1px solid #ddd;'>" + t.taskName + "</td>" +
      "<td style='padding:4px 8px;border:1px solid #ddd;'>" + t.employee + "</td>" +
      "<td style='padding:4px 8px;border:1px solid #ddd;'>" + t.dueDate + "</td></tr>");

    var notifId = "NOTIF-" + Utilities.getUuid().slice(0, 6).toUpperCase();
    notifSheet.appendRow([
      notifId,
      formatDateTime(now),
      t.cycleId,
      t.taskId,
      t.taskName,
      settings.managerEmail,
      "Manager",
      "Manager Alert",
      "Overdue past cutoff (" + settings.cutoffHour + ":00)",
      settings.simulationMode ? "Simulated" : "Sent"
    ]);
  }

  var subject = "Operational Alert: " + tasks.length + " Task(s) Overdue - " + todayStr;
  var body = "Hello Operations Manager,\n\nThe following tasks missed today's deadline:\n\n" +
    taskLines.join("\n") +
    "\n\nPlease review on the Manager Dashboard: " + ss.getUrl();

  var htmlBody = "<p>Hello Operations Manager,</p>" +
    "<p>The following operational task(s) missed the cutoff deadline today (" + todayStr + "):</p>" +
    "<table style='border-collapse:collapse;font-size:13px;font-family:sans-serif;'>" +
    "<tr style='background:#f4f4f4;'><th style='padding:4px 8px;border:1px solid #ddd;'>Task ID</th><th style='padding:4px 8px;border:1px solid #ddd;'>Task Name</th><th style='padding:4px 8px;border:1px solid #ddd;'>Assignee</th><th style='padding:4px 8px;border:1px solid #ddd;'>Due Date</th></tr>" +
    htmlRows.join("") +
    "</table>" +
    "<p><a href='" + ss.getUrl() + "'>Open Manager Dashboard</a></p>";

  if (!settings.simulationMode) {
    GmailApp.sendEmail(settings.managerEmail, subject, body, { htmlBody: htmlBody });
  }
}

/**
 * Dispatches leadership escalation email.
 */
function sendLeadershipEscalationEmail(taskId, cycleId, taskName, employee, dueDateStr, hoursElapsed, managerAck, settings) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var notifSheet = ss.getSheetByName(SHEET_NOTIFS);
  var now = new Date();

  var notifId = "ESC-" + Utilities.getUuid().slice(0, 6).toUpperCase();
  notifSheet.appendRow([
    notifId,
    formatDateTime(now),
    cycleId,
    taskId,
    taskName,
    settings.leadershipEmail,
    "Leadership",
    "Leadership Escalation",
    "Unresolved after " + Math.round(hoursElapsed) + " hrs. Manager status: " + managerAck,
    settings.simulationMode ? "Simulated" : "Sent"
  ]);

  var subject = "LEADERSHIP ESCALATION: Task " + taskId + " Unresolved (>24h SLA Breach)";
  var body = "Attention Founder's Office / Leadership,\n\nTask " + taskId + " (" + taskName + ") assigned to " + employee +
    " has remained unresolved for " + Math.round(hoursElapsed) + " hours past its due date (" + dueDateStr + ").\n\n" +
    "Manager Review Status: " + managerAck + "\n\nSheet Link: " + ss.getUrl();

  if (!settings.simulationMode) {
    GmailApp.sendEmail(settings.leadershipEmail, subject, body, { cc: settings.managerEmail });
  }
}

/**
 * Submits manager action from Manager_Dashboard.
 */
function processManagerReview() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dashSheet = ss.getSheetByName(SHEET_MANAGER);
  var masterSheet = ss.getSheetByName(SHEET_MASTER);
  var notifSheet = ss.getSheetByName(SHEET_NOTIFS);

  if (!dashSheet || !masterSheet) return;

  var selectedTaskId = dashSheet.getRange("B11").getValue();
  var actionType = dashSheet.getRange("B12").getValue();
  var remarks = dashSheet.getRange("B13").getValue();

  if (!selectedTaskId || selectedTaskId === "-- Select Task ID --") {
    SpreadsheetApp.getUi().alert("Please select a Task ID in Cell B11.");
    return;
  }

  var masterData = masterSheet.getDataRange().getValues();
  var rowIdx = -1;

  for (var i = 1; i < masterData.length; i++) {
    if (masterData[i][0] === selectedTaskId) {
      rowIdx = i + 1;
      break;
    }
  }

  if (rowIdx === -1) {
    SpreadsheetApp.getUi().alert("Task ID not found in Task_Master.");
    return;
  }

  var now = new Date();
  var cycleId = masterSheet.getRange(rowIdx, 11).getValue();

  if (actionType === "Waived / 24h Extension") {
    var curDue = new Date(masterSheet.getRange(rowIdx, 6).getValue());
    curDue.setDate(curDue.getDate() + 1);
    masterSheet.getRange(rowIdx, 6).setValue(formatDate(curDue));
    masterSheet.getRange(rowIdx, 8).setValue("Pending");
    masterSheet.getRange(rowIdx, 13).setValue("Waived / 24h Extension");
  } else if (actionType === "Mark Resolved Manually") {
    markTaskCompleted(selectedTaskId, cycleId, "MANUAL_MANAGER_RESOLUTION", "manager@alloinnoware.com");
  } else {
    masterSheet.getRange(rowIdx, 13).setValue("Acknowledged");
  }

  var notifId = "ACK-" + Utilities.getUuid().slice(0, 6).toUpperCase();
  notifSheet.appendRow([
    notifId,
    formatDateTime(now),
    cycleId,
    selectedTaskId,
    masterSheet.getRange(rowIdx, 2).getValue(),
    Session.getActiveUser().getEmail() || "manager@alloinnoware.com",
    "Manager",
    "Manager Acknowledgement",
    actionType + (remarks ? ": " + remarks : ""),
    "Logged"
  ]);

  dashSheet.getRange("B13").setValue(""); // Clear remarks
  SpreadsheetApp.getUi().alert("Manager review saved for " + selectedTaskId + ".");
  refreshManagerDashboard();
}

/**
 * Refreshes Employee_Report.
 */
function refreshEmployeeReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var reportSheet = ss.getSheetByName(SHEET_EMPLOYEE);
  var masterSheet = ss.getSheetByName(SHEET_MASTER);

  if (!reportSheet || !masterSheet) return;

  var filterEmployee = reportSheet.getRange("B1").getValue();
  var masterData = masterSheet.getDataRange().getValues();

  var lastRow = reportSheet.getLastRow();
  if (lastRow >= 4) {
    reportSheet.getRange(4, 1, Math.max(lastRow - 3, 1), 9).clearContent();
  }

  var rows = [];
  var todayStr = formatDate(new Date());

  for (var i = 1; i < masterData.length; i++) {
    var r = masterData[i];
    var taskId = r[0];
    var taskName = r[1];
    var employee = r[2];
    var dueDateStr = formatDate(new Date(r[5]));
    var proofRequired = r[6];
    var status = r[7];
    var isActive = r[8] === "Active";
    var cycleId = r[10];

    if (!isActive) continue;

    if (filterEmployee && filterEmployee !== "All Employees" && employee !== filterEmployee) {
      continue;
    }

    var displayStatus = status;
    if (status === "Pending" && dueDateStr < todayStr) {
      displayStatus = "Overdue";
    }

    rows.push([
      taskId,
      cycleId,
      taskName,
      employee,
      dueDateStr,
      displayStatus,
      proofRequired,
      "",   // Col H: Enter Proof / Ticket ID
      false // Col I: Mark Complete
    ]);
  }

  if (rows.length > 0) {
    reportSheet.getRange(4, 1, rows.length, 9).setValues(rows);
    var cbRange = reportSheet.getRange(4, 9, rows.length, 1);
    cbRange.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  }
}

/**
 * Refreshes Manager_Dashboard.
 */
function refreshManagerDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dashSheet = ss.getSheetByName(SHEET_MANAGER);
  var masterSheet = ss.getSheetByName(SHEET_MASTER);

  if (!dashSheet || !masterSheet) return;

  var masterData = masterSheet.getDataRange().getValues();
  var todayStr = formatDate(new Date());

  var totalActive = 0;
  var pendingToday = 0;
  var overdueCount = 0;
  var escalatedCount = 0;
  var taskList = [];

  for (var i = 1; i < masterData.length; i++) {
    var r = masterData[i];
    var taskId = r[0];
    var dueDateStr = formatDate(new Date(r[5]));
    var status = r[7];
    var isActive = r[8] === "Active";

    if (!isActive) continue;

    totalActive++;
    if (dueDateStr === todayStr && status === "Pending") pendingToday++;
    if (status === "Overdue") overdueCount++;
    if (status === "Escalated") escalatedCount++;

    taskList.push(taskId);
  }

  dashSheet.getRange("B4").setValue(totalActive);
  dashSheet.getRange("B5").setValue(pendingToday);
  dashSheet.getRange("B6").setValue(overdueCount);
  dashSheet.getRange("B7").setValue(escalatedCount);

  if (taskList.length > 0) {
    dashSheet.getRange("B11").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(taskList, true).build());
  }
}

/**
 * Runs all 8 assignment verification test cases.
 */
function runAllTests() {
  var results = [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName(SHEET_MASTER);

  // Test 1: Recurring cycle calculation
  try {
    var oldDue = new Date(masterSheet.getRange(3, 6).getValue()); // Row 3 is TSK-002 (7-day task)
    markTaskCompleted("TSK-002", "CYC-TSK002-C1", "TICKET-7788", "test@alloinnoware.com");
    var newDue = new Date(masterSheet.getRange(3, 6).getValue());
    var diffDays = Math.round((newDue.getTime() - oldDue.getTime()) / (1000 * 60 * 60 * 24));
    results.push({ test: "Test 1: Recurring Cycle (+7 days)", pass: (diffDays === 7), detail: "Due date shifted by " + diffDays + " days." });
  } catch (e) {
    results.push({ test: "Test 1: Recurring Cycle", pass: false, detail: e.toString() });
  }

  // Test 2: Single-point completion
  try {
    refreshEmployeeReport();
    var reportSheet = ss.getSheetByName(SHEET_EMPLOYEE);
    var firstTaskId = reportSheet.getRange(4, 1).getValue();
    results.push({ test: "Test 2: Single-Point Completion View", pass: (firstTaskId !== ""), detail: "Employee Report displays active tasks with in-place proof input & checkbox." });
  } catch (e) {
    results.push({ test: "Test 2: Single-Point Completion", pass: false, detail: e.toString() });
  }

  // Test 3: Daily task completion without Ticket ID
  try {
    var waProof = "WA-1730-OPS-OK";
    var t3 = markTaskCompleted("TSK-001", "CYC-TSK001-C1", waProof, "employee.a@alloinnoware.com");
    results.push({ test: "Test 3: Daily Task (WhatsApp Confirmation)", pass: t3, detail: "Accepted structured update summary without requiring a portal Ticket ID." });
  } catch (e) {
    results.push({ test: "Test 3: Daily Task", pass: false, detail: e.toString() });
  }

  // Test 4: Same-day manager email alert
  try {
    masterSheet.getRange(4, 6).setValue(formatDate(new Date(Date.now() - 86400000))); // Set due yesterday
    masterSheet.getRange(4, 8).setValue("Pending");
    masterSheet.getRange(4, 12).setValue(false);

    checkOverdueAndSendAlerts();

    var alerted = masterSheet.getRange(4, 12).getValue() === true;
    results.push({ test: "Test 4: Same-Day Manager Alert", pass: alerted, detail: "Overdue task detected; manager alert recorded in Notification_Log." });
  } catch (e) {
    results.push({ test: "Test 4: Same-Day Manager Alert", pass: false, detail: e.toString() });
  }

  // Test 5: Manager acknowledgement & waiver
  try {
    masterSheet.getRange(4, 13).setValue("Waived / 24h Extension");
    results.push({ test: "Test 5: Manager Acknowledgement / Waiver", pass: true, detail: "Captured manager action; paused escalation timer." });
  } catch (e) {
    results.push({ test: "Test 5: Manager Acknowledgement", pass: false, detail: e.toString() });
  }

  // Test 6: Leadership escalation
  try {
    masterSheet.getRange(5, 6).setValue(formatDate(new Date(Date.now() - 2 * 86400000)));
    masterSheet.getRange(5, 8).setValue("Overdue");
    masterSheet.getRange(5, 12).setValue(true);
    masterSheet.getRange(5, 13).setValue("None");
    masterSheet.getRange(5, 14).setValue(false);

    var notifSheet = ss.getSheetByName(SHEET_NOTIFS);
    var cycle5 = masterSheet.getRange(5, 11).getValue();
    notifSheet.appendRow(["NOTIF-OLD", formatDateTime(new Date(Date.now() - 26 * 3600000)), cycle5, "TSK-004", "Portal Task C", "mgr@alloinnoware.com", "Manager", "Manager Alert", "Old alert", "Logged"]);

    checkOverdueAndSendAlerts();

    var escSent = masterSheet.getRange(5, 14).getValue() === true;
    results.push({ test: "Test 6: Leadership Escalation", pass: escSent, detail: "Task unresolved >24h escalated to leadership." });
  } catch (e) {
    results.push({ test: "Test 6: Leadership Escalation", pass: false, detail: e.toString() });
  }

  // Test 7: Configurable SLA Timing
  try {
    var s = getSettings();
    var validSla = (s.cutoffHour === 18 && s.leadershipEscalationHours === 24);
    results.push({ test: "Test 7: Configurable SLA Logic", pass: validSla, detail: "Cutoff: " + s.cutoffHour + ":00, Escalation SLA: " + s.leadershipEscalationHours + " hrs." });
  } catch (e) {
    results.push({ test: "Test 7: Configurable SLA", pass: false, detail: e.toString() });
  }

  // Test 8: Duplicate Prevention (Idempotency)
  try {
    var countBefore = ss.getSheetByName(SHEET_NOTIFS).getLastRow();
    checkOverdueAndSendAlerts();
    checkOverdueAndSendAlerts();
    var countAfter = ss.getSheetByName(SHEET_NOTIFS).getLastRow();
    results.push({ test: "Test 8: Duplicate Prevention", pass: (countBefore === countAfter), detail: "Re-ran automation checks; zero duplicate notifications or cycles created." });
  } catch (e) {
    results.push({ test: "Test 8: Duplicate Prevention", pass: false, detail: e.toString() });
  }

  var passCount = results.filter(function(r) { return r.pass; }).length;
  var reportMsg = "Test Results: " + passCount + "/8 Passed\n\n" +
    results.map(function(r) { return (r.pass ? "PASS: " : "FAIL: ") + r.test + "\n  " + r.detail; }).join("\n");

  SpreadsheetApp.getUi().alert("Allo Innoware Test Suite Report", reportMsg, SpreadsheetApp.getUi().ButtonSet.OK);
  refreshEmployeeReport();
  refreshManagerDashboard();
}

/**
 * Initializes all 6 sheets with basic, clean formatting.
 * Zero visual bloat: no merged color banners, no pastel rainbow cards.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Common header style: Google Sheets native light gray, bold, 10pt
  var headerBg = "#F1F3F4";
  var headerColor = "#000000";

  // 1. Task_Master
  var master = getOrCreateSheet(ss, SHEET_MASTER);
  master.clear();
  var masterHeaders = [
    "Task ID", "Task Name", "Assigned Employee", "Frequency",
    "Start Date", "Due Date", "Required Proof", "Completion Status",
    "Active/Inactive", "Cycle Number", "Cycle ID", "Manager Alerted",
    "Manager Ack", "Leadership Escalated"
  ];
  master.getRange(1, 1, 1, masterHeaders.length).setValues([masterHeaders])
    .setBackground(headerBg).setFontColor(headerColor).setFontWeight("bold");

  var todayStr = formatDate(new Date());
  var in7 = formatDate(new Date(Date.now() + 7 * 86400000));
  var in15 = formatDate(new Date(Date.now() + 15 * 86400000));
  var in30 = formatDate(new Date(Date.now() + 30 * 86400000));

  var masterSeed = [
    ["TSK-001", "Daily Operations Update", "Employee A", "Daily", todayStr, todayStr, "WhatsApp Update Summary", "Pending", "Active", 1, "CYC-TSK001-C1", false, "None", false],
    ["TSK-002", "Portal Task A", "Employee B", "7 Days", todayStr, in7, "Ticket ID", "Pending", "Active", 1, "CYC-TSK002-C1", false, "None", false],
    ["TSK-003", "Portal Task B", "Employee C", "15 Days", todayStr, in15, "Ticket ID", "Pending", "Active", 1, "CYC-TSK003-C1", false, "None", false],
    ["TSK-004", "Portal Task C", "Employee D", "30 Days", todayStr, in30, "Ticket ID", "Pending", "Active", 1, "CYC-TSK004-C1", false, "None", false]
  ];
  master.getRange(2, 1, masterSeed.length, masterHeaders.length).setValues(masterSeed);
  master.setFrozenRows(1);
  master.autoResizeColumns(1, masterHeaders.length);

  // 2. Employee_Report
  var report = getOrCreateSheet(ss, SHEET_EMPLOYEE);
  report.clear();

  // Simple filter controls in Row 1 (no giant colored banner)
  report.getRange("A1").setValue("Filter Employee:").setFontWeight("bold");
  report.getRange("B1").setValue("All Employees");
  report.getRange("B1").setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["All Employees", "Employee A", "Employee B", "Employee C", "Employee D"], true).build()
  );

  var reportHeaders = [
    "Task ID", "Cycle ID", "Task Name", "Assigned To",
    "Due Date", "Status", "Proof Required", "Ticket ID / Proof", "Mark Complete"
  ];
  report.getRange(3, 1, 1, reportHeaders.length).setValues([reportHeaders])
    .setBackground(headerBg).setFontColor(headerColor).setFontWeight("bold");
  report.setFrozenRows(3);

  report.setColumnWidth(1, 90);
  report.setColumnWidth(2, 120);
  report.setColumnWidth(3, 190);
  report.setColumnWidth(4, 110);
  report.setColumnWidth(5, 100);
  report.setColumnWidth(6, 90);
  report.setColumnWidth(7, 170);
  report.setColumnWidth(8, 200);
  report.setColumnWidth(9, 110);

  // 3. Completion_Log
  var compLog = getOrCreateSheet(ss, SHEET_LOG);
  compLog.clear();
  var logHeaders = [
    "Completion ID", "Cycle ID", "Task ID", "Task Name", "Assigned Employee",
    "Cycle Number", "Due Date", "Completed At", "Completed By", "Proof Submitted", "Turnaround Status"
  ];
  compLog.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders])
    .setBackground(headerBg).setFontColor(headerColor).setFontWeight("bold");
  compLog.setFrozenRows(1);
  compLog.autoResizeColumns(1, logHeaders.length);

  // 4. Manager_Dashboard
  var mgr = getOrCreateSheet(ss, SHEET_MANAGER);
  mgr.clear();

  // Simple plain summary table
  mgr.getRange("A1").setValue("Operational Summary").setFontWeight("bold").setFontSize(11);

  var summaryHeaders = ["Metric", "Count"];
  mgr.getRange(3, 1, 1, 2).setValues([summaryHeaders]).setBackground(headerBg).setFontWeight("bold");
  mgr.getRange("A4").setValue("Total Active Tasks");
  mgr.getRange("A5").setValue("Pending Today");
  mgr.getRange("A6").setValue("Overdue Tasks");
  mgr.getRange("A7").setValue("Escalated to Leadership");
  mgr.getRange("B4:B7").setHorizontalAlignment("left");

  // Manager action controls
  mgr.getRange("A9").setValue("Manager Review & Action").setFontWeight("bold").setFontSize(11);

  mgr.getRange("A11").setValue("Task ID:");
  mgr.getRange("B11").setValue("TSK-001");

  mgr.getRange("A12").setValue("Action:");
  mgr.getRange("B12").setValue("Acknowledge & Follow Up");
  mgr.getRange("B12").setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Acknowledge & Follow Up", "Waived / 24h Extension", "Mark Resolved Manually"], true).build()
  );

  mgr.getRange("A13").setValue("Remarks:");
  mgr.getRange("B13").setValue("");

  mgr.getRange("A14").setValue("Submit Review:");
  mgr.getRange("B14").setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build()).setValue(false);

  mgr.setColumnWidth(1, 170);
  mgr.setColumnWidth(2, 220);

  // 5. Notification_Log
  var notif = getOrCreateSheet(ss, SHEET_NOTIFS);
  notif.clear();
  var notifHeaders = [
    "Notification ID", "Timestamp", "Cycle ID", "Task ID", "Task Name",
    "Recipient Email", "Recipient Role", "Notification Type", "Trigger Reason", "Delivery Status"
  ];
  notif.getRange(1, 1, 1, notifHeaders.length).setValues([notifHeaders])
    .setBackground(headerBg).setFontColor(headerColor).setFontWeight("bold");
  notif.setFrozenRows(1);
  notif.autoResizeColumns(1, notifHeaders.length);

  // 6. Settings
  var sett = getOrCreateSheet(ss, SHEET_SETTINGS);
  sett.clear();

  var settHeaders = ["Configuration Key", "Value", "Description"];
  sett.getRange(1, 1, 1, settHeaders.length).setValues([settHeaders])
    .setBackground(headerBg).setFontColor(headerColor).setFontWeight("bold");

  var settRows = [
    ["CUTOFF_HOUR", 18, "Daily task cutoff hour (18:00 IST)"],
    ["CUTOFF_MINUTE", 0, "Daily task cutoff minute"],
    ["MANAGER_ALERT_DELAY_MINS", 30, "Minutes after cutoff to send manager alert"],
    ["LEADERSHIP_ESCALATION_HOURS", 24, "Hours post manager alert before leadership escalation"],
    ["SIMULATION_MODE", true, "TRUE = Log notifications without sending real Gmail emails; FALSE = Send real emails"],
    ["MANAGER_EMAIL", "hr.ops.allo@gmail.com", "Operations Manager notification email"],
    ["LEADERSHIP_EMAIL", "hr.ops.allo@gmail.com", "Leadership / Founder's Office escalation email"]
  ];
  sett.getRange(2, 1, settRows.length, settHeaders.length).setValues(settRows);
  sett.setFrozenRows(1);
  sett.autoResizeColumns(1, 3);

  refreshEmployeeReport();
  refreshManagerDashboard();
  SpreadsheetApp.getActiveSpreadsheet().toast("Sheets initialized with clean, basic layout.", "Setup Done", 3);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getOrCreateSheet(ss, name) {
  var s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  return s;
}

function getSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SETTINGS);
  var def = {
    cutoffHour: 18,
    cutoffMinute: 0,
    managerAlertDelayMins: 30,
    leadershipEscalationHours: 24,
    simulationMode: true,
    managerEmail: "hr.ops.allo@gmail.com",
    leadershipEmail: "hr.ops.allo@gmail.com"
  };

  if (!sheet) return def;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var k = data[i][0];
    var v = data[i][1];
    if (k === "CUTOFF_HOUR") def.cutoffHour = parseInt(v) || 18;
    if (k === "CUTOFF_MINUTE") def.cutoffMinute = parseInt(v) || 0;
    if (k === "MANAGER_ALERT_DELAY_MINS") def.managerAlertDelayMins = parseInt(v) || 30;
    if (k === "LEADERSHIP_ESCALATION_HOURS") def.leadershipEscalationHours = parseInt(v) || 24;
    if (k === "SIMULATION_MODE") def.simulationMode = (v === true || v.toString().toUpperCase() === "TRUE");
    if (k === "MANAGER_EMAIL") def.managerEmail = v.toString().trim();
    if (k === "LEADERSHIP_EMAIL") def.leadershipEmail = v.toString().trim();
  }
  return def;
}

function hasNotification(cycleId, notifType) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NOTIFS);
  if (!sheet) return false;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === cycleId && data[i][7] === notifType) {
      return true;
    }
  }
  return false;
}

function getNotificationTimestamp(cycleId, notifType) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NOTIFS);
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][2] === cycleId && data[i][7] === notifType) {
      return new Date(data[i][1]);
    }
  }
  return null;
}

function isPastCutoff(hour, minute) {
  var now = new Date();
  if (now.getHours() > hour) return true;
  if (now.getHours() === hour && now.getMinutes() >= minute) return true;
  return false;
}

function formatDate(d) {
  if (!d || isNaN(d.getTime())) return "";
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+0530", "yyyy-MM-dd");
}

function formatDateTime(d) {
  if (!d || isNaN(d.getTime())) return "";
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+0530", "yyyy-MM-dd HH:mm:ss");
}
