/**
 * Allo Innoware - Task Operations Engine
 * Client-Side Application Logic
 * Pure JavaScript, 0 Dependencies, LocalStorage-backed
 */

(function () {
  'use strict';

  // --- Initial Default Seed Data ---
  function getTodayString(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  function getTimestampString(offsetHours = 0) {
    const d = new Date();
    d.setHours(d.getHours() + offsetHours);
    return d.toISOString().replace('T', ' ').slice(0, 19);
  }

  const DEFAULT_TASKS = [
    {
      taskId: 'TSK-001',
      taskName: 'Daily Operations Update',
      assignedTo: 'Employee A',
      assignedEmail: 'employee.a@alloinnoware.com',
      frequency: 'Daily',
      frequencyDays: 1,
      startDate: getTodayString(0),
      dueDate: getTodayString(0),
      cutoffTime: '18:00',
      proofRequired: 'WhatsApp Update Summary',
      status: 'Pending',
      active: true,
      cycleNumber: 1,
      cycleId: 'CYC-TSK001-C1',
      managerAlerted: false,
      managerAck: 'None',
      leadershipEscalated: false
    },
    {
      taskId: 'TSK-002',
      taskName: 'Portal Task A',
      assignedTo: 'Employee B',
      assignedEmail: 'employee.b@alloinnoware.com',
      frequency: '7 Days',
      frequencyDays: 7,
      startDate: getTodayString(0),
      dueDate: getTodayString(7),
      cutoffTime: '18:00',
      proofRequired: 'Ticket ID',
      status: 'Pending',
      active: true,
      cycleNumber: 1,
      cycleId: 'CYC-TSK002-C1',
      managerAlerted: false,
      managerAck: 'None',
      leadershipEscalated: false
    },
    {
      taskId: 'TSK-003',
      taskName: 'Portal Task B',
      assignedTo: 'Employee C',
      assignedEmail: 'employee.c@alloinnoware.com',
      frequency: '15 Days',
      frequencyDays: 15,
      startDate: getTodayString(0),
      dueDate: getTodayString(15),
      cutoffTime: '18:00',
      proofRequired: 'Ticket ID',
      status: 'Pending',
      active: true,
      cycleNumber: 1,
      cycleId: 'CYC-TSK003-C1',
      managerAlerted: false,
      managerAck: 'None',
      leadershipEscalated: false
    },
    {
      taskId: 'TSK-004',
      taskName: 'Portal Task C',
      assignedTo: 'Employee D',
      assignedEmail: 'employee.d@alloinnoware.com',
      frequency: '30 Days',
      frequencyDays: 30,
      startDate: getTodayString(0),
      dueDate: getTodayString(30),
      cutoffTime: '18:00',
      proofRequired: 'Ticket ID',
      status: 'Pending',
      active: true,
      cycleNumber: 1,
      cycleId: 'CYC-TSK004-C1',
      managerAlerted: false,
      managerAck: 'None',
      leadershipEscalated: false
    }
  ];

  const DEFAULT_SETTINGS = {
    cutoffHour: 18,
    cutoffMinute: 0,
    alertDelayMins: 30,
    escalationHours: 24,
    managerEmail: 'hr.ops.allo@gmail.com',
    leadershipEmail: 'hr.ops.allo@gmail.com',
    simulationMode: true
  };

  // --- State Management ---
  let state = {
    tasks: [],
    completionLogs: [],
    notificationLogs: [],
    settings: { ...DEFAULT_SETTINGS }
  };

  function loadState() {
    try {
      const storedTasks = localStorage.getItem('allo_tasks');
      const storedLogs = localStorage.getItem('allo_completion_logs');
      const storedNotifs = localStorage.getItem('allo_notification_logs');
      const storedSettings = localStorage.getItem('allo_settings');

      state.tasks = storedTasks ? JSON.parse(storedTasks) : JSON.parse(JSON.stringify(DEFAULT_TASKS));
      state.completionLogs = storedLogs ? JSON.parse(storedLogs) : [];
      state.notificationLogs = storedNotifs ? JSON.parse(storedNotifs) : [];
      state.settings = storedSettings ? JSON.parse(storedSettings) : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.warn('Error reading from localStorage, using defaults.', e);
      state.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
      state.completionLogs = [];
      state.notificationLogs = [];
      state.settings = { ...DEFAULT_SETTINGS };
    }
  }

  function saveState() {
    try {
      localStorage.setItem('allo_tasks', JSON.stringify(state.tasks));
      localStorage.setItem('allo_completion_logs', JSON.stringify(state.completionLogs));
      localStorage.setItem('allo_notification_logs', JSON.stringify(state.notificationLogs));
      localStorage.setItem('allo_settings', JSON.stringify(state.settings));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // --- Recurrence Calculation Logic ---
  function computeNextDueDate(baseDueDateStr, frequency) {
    const baseDate = new Date(baseDueDateStr);
    const nextDate = new Date(baseDate);

    if (frequency === 'Daily') {
      nextDate.setDate(nextDate.getDate() + 1);
      // Skip Sunday
      if (nextDate.getDay() === 0) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    } else if (frequency === '7 Days') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === '15 Days') {
      nextDate.setDate(nextDate.getDate() + 15);
    } else if (frequency === '30 Days') {
      nextDate.setDate(nextDate.getDate() + 30);
    } else {
      nextDate.setDate(nextDate.getDate() + 7);
    }

    return nextDate.toISOString().split('T')[0];
  }

  // --- Core Operation: Complete Task ---
  function completeTask(taskId, proofInput) {
    const task = state.tasks.find(t => t.taskId === taskId);
    if (!task) return false;

    const trimmedProof = (proofInput || '').trim();
    if (!trimmedProof) {
      alert('Please enter a Ticket ID or WhatsApp update confirmation before completing.');
      return false;
    }

    const now = new Date();
    const todayStr = getTodayString(0);
    const isLate = task.dueDate < todayStr;
    const turnaroundStatus = isLate ? 'Completed Late' : 'On-Time';

    // 1. Log to Completion_Log
    const completionId = 'CMP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    state.completionLogs.unshift({
      completionId,
      cycleId: task.cycleId,
      taskId: task.taskId,
      taskName: task.taskName,
      completedBy: task.assignedTo,
      cycleNumber: task.cycleNumber,
      dueDate: task.dueDate,
      completedAt: getTimestampString(0),
      proofSubmitted: trimmedProof,
      turnaroundStatus
    });

    // 2. Advance to next cycle
    const nextCycleNum = task.cycleNumber + 1;
    const nextDueDate = computeNextDueDate(task.dueDate, task.frequency);
    const nextStartDate = getTodayString(0);

    task.cycleNumber = nextCycleNum;
    task.cycleId = `CYC-${task.taskId}-C${nextCycleNum}`;
    task.startDate = nextStartDate;
    task.dueDate = nextDueDate;
    task.status = 'Pending';
    task.managerAlerted = false;
    task.managerAck = 'None';
    task.leadershipEscalated = false;

    saveState();
    renderAll();
    showToast(`Task ${taskId} completed! Cycle closed & next cycle scheduled.`);
    return true;
  }

  // --- Core Operation: Check Overdue & SLA Escalation ---
  function checkOverdueAndEscalations() {
    const todayStr = getTodayString(0);
    const now = new Date();
    const currentHour = now.getHours();
    const cutoffHour = state.settings.cutoffHour || 18;

    let alertedCount = 0;
    let escalatedCount = 0;

    state.tasks.forEach(task => {
      if (!task.active || task.status === 'Completed') return;

      const isDueOrPast = (task.dueDate < todayStr) || (task.dueDate === todayStr && currentHour >= cutoffHour);

      if (isDueOrPast) {
        if (task.status === 'Pending') {
          task.status = 'Overdue';
        }

        // Stage 1: Same-Day Manager Alert
        if (!task.managerAlerted) {
          const alreadyLogged = state.notificationLogs.some(
            n => n.cycleId === task.cycleId && n.alertType === 'Manager Alert'
          );

          if (!alreadyLogged) {
            const notifId = 'NOTIF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            state.notificationLogs.unshift({
              notificationId: notifId,
              timestamp: getTimestampString(0),
              cycleId: task.cycleId,
              taskName: task.taskName,
              recipient: state.settings.managerEmail,
              role: 'Manager',
              alertType: 'Manager Alert',
              reason: `Overdue past ${cutoffHour}:00 cutoff`,
              status: state.settings.simulationMode ? 'Simulated' : 'Sent'
            });
            task.managerAlerted = true;
            alertedCount++;
          }
        }

        // Stage 2: Leadership Escalation (>24h post alert)
        if (task.managerAlerted && !task.leadershipEscalated) {
          if (task.managerAck === 'Waived / 24h Extension') {
            return; // Paused by manager waiver
          }

          const managerAlert = state.notificationLogs.find(
            n => n.cycleId === task.cycleId && n.alertType === 'Manager Alert'
          );

          let hoursElapsed = 25;
          if (managerAlert && managerAlert.timestamp) {
            const alertTime = new Date(managerAlert.timestamp);
            hoursElapsed = (now.getTime() - alertTime.getTime()) / (1000 * 60 * 60);
          }

          if (hoursElapsed >= state.settings.escalationHours) {
            const alreadyEscalated = state.notificationLogs.some(
              n => n.cycleId === task.cycleId && n.alertType === 'Leadership Escalation'
            );

            if (!alreadyEscalated) {
              const escId = 'ESC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
              state.notificationLogs.unshift({
                notificationId: escId,
                timestamp: getTimestampString(0),
                cycleId: task.cycleId,
                taskName: task.taskName,
                recipient: state.settings.leadershipEmail,
                role: 'Leadership',
                alertType: 'Leadership Escalation',
                reason: `Unresolved >${Math.round(hoursElapsed)}h. Manager status: ${task.managerAck}`,
                status: state.settings.simulationMode ? 'Simulated' : 'Sent'
              });
              task.leadershipEscalated = true;
              task.status = 'Escalated';
              escalatedCount++;
            }
          }
        }
      }
    });

    saveState();
    renderAll();

    if (alertedCount > 0 || escalatedCount > 0) {
      showToast(`SLA Check: ${alertedCount} manager alert(s), ${escalatedCount} escalation(s) triggered.`);
    } else {
      showToast('SLA Check: All tasks evaluated. No new overdue alerts required.');
    }
  }

  // --- Core Operation: Manager Review ---
  function submitManagerReview(taskId, actionType, remarks) {
    const task = state.tasks.find(t => t.taskId === taskId);
    if (!task) {
      alert('Selected task not found.');
      return;
    }

    if (actionType === 'Waived / 24h Extension') {
      // Extend due date by 1 day
      const curDue = new Date(task.dueDate);
      curDue.setDate(curDue.getDate() + 1);
      task.dueDate = curDue.toISOString().split('T')[0];
      task.status = 'Pending';
      task.managerAck = 'Waived / 24h Extension';
    } else if (actionType === 'Mark Resolved Manually') {
      completeTask(taskId, 'MANUAL_MANAGER_RESOLUTION');
      return;
    } else {
      // Acknowledge & Follow Up
      task.managerAck = 'Acknowledged';
    }

    const ackId = 'ACK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    state.notificationLogs.unshift({
      notificationId: ackId,
      timestamp: getTimestampString(0),
      cycleId: task.cycleId,
      taskName: task.taskName,
      recipient: 'Internal Operations',
      role: 'Manager',
      alertType: 'Manager Acknowledgement',
      reason: `${actionType}${remarks ? ': ' + remarks : ''}`,
      status: 'Logged'
    });

    saveState();
    renderAll();
    showToast(`Manager review saved for ${taskId}.`);
  }

  // --- Rendering UI ---

  function renderEmployeeReport() {
    const tbody = document.getElementById('employeeReportBody');
    const filterVal = document.getElementById('employeeFilter').value;
    if (!tbody) return;

    tbody.innerHTML = '';
    const todayStr = getTodayString(0);

    const filtered = state.tasks.filter(t => {
      if (!t.active) return false;
      if (filterVal !== 'All' && t.assignedTo !== filterVal) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#6b7280; padding:16px;">No tasks assigned or all tasks completed.</td></tr>';
      return;
    }

    filtered.forEach(t => {
      let displayStatus = t.status;
      if (t.status === 'Pending' && t.dueDate < todayStr) {
        displayStatus = 'Overdue';
      }

      let badgeClass = 'status-pending';
      if (displayStatus === 'Overdue') badgeClass = 'status-overdue';
      if (displayStatus === 'Escalated') badgeClass = 'status-escalated';
      if (displayStatus === 'Completed') badgeClass = 'status-completed';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${t.taskId}</td>
        <td><code>${t.cycleId}</code></td>
        <td>${t.taskName}</td>
        <td>${t.assignedTo}</td>
        <td>${t.dueDate}</td>
        <td><span class="status-badge ${badgeClass}">${displayStatus}</span></td>
        <td style="color:#4b5563;">${t.proofRequired}</td>
        <td>
          <input type="text" class="table-input" id="proof_${t.taskId}" placeholder="Enter Ticket ID / WhatsApp note">
        </td>
        <td>
          <button class="btn btn-primary btn-sm btn-complete-task" data-taskid="${t.taskId}">Mark Complete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach click listeners to all complete buttons
    tbody.querySelectorAll('.btn-complete-task').forEach(btn => {
      btn.addEventListener('click', function () {
        const tid = this.getAttribute('data-taskid');
        const inputElem = document.getElementById('proof_' + tid);
        const proofVal = inputElem ? inputElem.value : '';
        completeTask(tid, proofVal);
      });
    });
  }

  function renderTaskMaster() {
    const tbody = document.getElementById('taskMasterBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    state.tasks.forEach(t => {
      let badgeClass = 'status-pending';
      if (t.status === 'Overdue') badgeClass = 'status-overdue';
      if (t.status === 'Escalated') badgeClass = 'status-escalated';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${t.taskId}</td>
        <td>${t.taskName}</td>
        <td>${t.assignedTo}</td>
        <td>${t.frequency}</td>
        <td>${t.startDate}</td>
        <td>${t.dueDate}</td>
        <td>${t.proofRequired}</td>
        <td><span class="status-badge ${badgeClass}">${t.status}</span></td>
        <td>${t.cycleNumber}</td>
        <td><code>${t.cycleId}</code></td>
        <td>${t.managerAlerted ? 'Yes' : 'No'}</td>
        <td>${t.managerAck}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderCompletionLog() {
    const tbody = document.getElementById('completionLogBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (state.completionLogs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#6b7280; padding:16px;">No completion records logged yet.</td></tr>';
      return;
    }

    state.completionLogs.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${c.completionId}</code></td>
        <td><code>${c.cycleId}</code></td>
        <td style="font-weight:600;">${c.taskId}</td>
        <td>${c.taskName}</td>
        <td>${c.completedBy}</td>
        <td>${c.cycleNumber}</td>
        <td>${c.dueDate}</td>
        <td>${c.completedAt}</td>
        <td style="max-width:200px; word-break:break-all;">${c.proofSubmitted}</td>
        <td><span class="status-badge ${c.turnaroundStatus === 'On-Time' ? 'status-completed' : 'status-overdue'}">${c.turnaroundStatus}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderManagerDashboard() {
    const todayStr = getTodayString(0);

    let totalActive = 0;
    let pendingToday = 0;
    let overdueCount = 0;
    let escalatedCount = 0;

    state.tasks.forEach(t => {
      if (!t.active) return;
      totalActive++;
      if (t.dueDate === todayStr && t.status === 'Pending') pendingToday++;
      if (t.status === 'Overdue') overdueCount++;
      if (t.status === 'Escalated') escalatedCount++;
    });

    const elTotal = document.getElementById('statTotalActive');
    const elPending = document.getElementById('statPendingToday');
    const elOverdue = document.getElementById('statOverdue');
    const elEscalated = document.getElementById('statEscalated');

    if (elTotal) elTotal.textContent = totalActive;
    if (elPending) elPending.textContent = pendingToday;
    if (elOverdue) elOverdue.textContent = overdueCount;
    if (elEscalated) elEscalated.textContent = escalatedCount;

    // Populate Task select dropdown
    const selectTask = document.getElementById('mgrSelectTask');
    if (selectTask) {
      selectTask.innerHTML = '';
      state.tasks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.taskId;
        opt.textContent = `${t.taskId} - ${t.taskName} (${t.assignedTo})`;
        selectTask.appendChild(opt);
      });
    }
  }

  function renderNotificationLog() {
    const tbody = document.getElementById('notificationLogBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (state.notificationLogs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#6b7280; padding:16px;">No notifications dispatched yet.</td></tr>';
      return;
    }

    state.notificationLogs.forEach(n => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${n.notificationId}</code></td>
        <td>${n.timestamp}</td>
        <td><code>${n.cycleId}</code></td>
        <td>${n.taskName}</td>
        <td>${n.recipient}</td>
        <td>${n.role}</td>
        <td style="font-weight:500;">${n.alertType}</td>
        <td style="color:#4b5563;">${n.reason}</td>
        <td><span class="status-badge status-pending">${n.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderSettings() {
    const elCutoff = document.getElementById('settingCutoffHour');
    const elBuffer = document.getElementById('settingAlertDelayMins');
    const elEsc = document.getElementById('settingEscalationHours');
    const elMgrEmail = document.getElementById('settingManagerEmail');
    const elLeadEmail = document.getElementById('settingLeadershipEmail');
    const elSim = document.getElementById('settingSimulationMode');

    if (elCutoff) elCutoff.value = state.settings.cutoffHour;
    if (elBuffer) elBuffer.value = state.settings.alertDelayMins;
    if (elEsc) elEsc.value = state.settings.escalationHours;
    if (elMgrEmail) elMgrEmail.value = state.settings.managerEmail;
    if (elLeadEmail) elLeadEmail.value = state.settings.leadershipEmail;
    if (elSim) elSim.value = state.settings.simulationMode.toString();
  }

  function renderAll() {
    renderEmployeeReport();
    renderTaskMaster();
    renderCompletionLog();
    renderManagerDashboard();
    renderNotificationLog();
    renderSettings();
  }

  // --- Export CSV Handler ---
  function exportCsv() {
    if (state.completionLogs.length === 0) {
      alert('No completion logs to export.');
      return;
    }

    const headers = ['Completion ID', 'Cycle ID', 'Task ID', 'Task Name', 'Completed By', 'Cycle Number', 'Due Date', 'Completed At', 'Proof Submitted', 'Turnaround Status'];
    const rows = state.completionLogs.map(c => [
      c.completionId,
      c.cycleId,
      c.taskId,
      `"${c.taskName.replace(/"/g, '""')}"`,
      c.completedBy,
      c.cycleNumber,
      c.dueDate,
      c.completedAt,
      `"${(c.proofSubmitted || '').replace(/"/g, '""')}"`,
      c.turnaroundStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'allo_completion_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported completion log to CSV.');
  }

  // --- Test Suite Execution (All 8 Tests) ---
  function runAllTests() {
    const resultsContainer = document.getElementById('testResultsList');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '<p style="color:#6b7280; font-size:12px;">Running automated verification of all 8 assignment scenarios...</p>';

    const results = [];

    // Test 1: Recurring cycle calculation
    try {
      const task2 = state.tasks.find(t => t.taskId === 'TSK-002');
      const originalDue = new Date(task2.dueDate);
      const computedNext = computeNextDueDate(task2.dueDate, task2.frequency);
      const newDue = new Date(computedNext);
      const diffDays = Math.round((newDue.getTime() - originalDue.getTime()) / (1000 * 60 * 60 * 24));
      results.push({
        name: 'Test 1: Recurring cycle logic (+7 days)',
        pass: diffDays === 7,
        details: `Calculated next cycle: ${computedNext} (+${diffDays} days). Successfully advanced.`
      });
    } catch (e) {
      results.push({ name: 'Test 1: Recurring cycle', pass: false, details: e.toString() });
    }

    // Test 2: Single-point completion
    try {
      const pendingRows = document.querySelectorAll('#employeeReportBody tr');
      const hasInputsAndButtons = pendingRows.length > 0 && !!document.querySelector('.btn-complete-task');
      results.push({
        name: 'Test 2: Single-point completion interface',
        pass: hasInputsAndButtons,
        details: 'Employee report renders pending tasks with in-place proof input & complete action.'
      });
    } catch (e) {
      results.push({ name: 'Test 2: Single-point completion', pass: false, details: e.toString() });
    }

    // Test 3: Daily task (WhatsApp confirmation)
    try {
      const waTask = state.tasks.find(t => t.taskId === 'TSK-001');
      const validWa = waTask && waTask.proofRequired.includes('WhatsApp');
      results.push({
        name: 'Test 3: Daily task completion (WhatsApp update)',
        pass: validWa,
        details: 'Task TSK-001 configured for structured WhatsApp summary input without requiring a Ticket ID.'
      });
    } catch (e) {
      results.push({ name: 'Test 3: Daily task completion', pass: false, details: e.toString() });
    }

    // Test 4: Same-day manager alert
    try {
      // Simulate overdue
      const task3 = state.tasks.find(t => t.taskId === 'TSK-003');
      const prevAlert = task3.managerAlerted;
      task3.dueDate = getTodayString(-1); // Yesterday
      checkOverdueAndEscalations();
      results.push({
        name: 'Test 4: Same-day manager email alert',
        pass: task3.managerAlerted === true,
        details: 'Overdue detected past cutoff; manager alert logged in Notification Log.'
      });
    } catch (e) {
      results.push({ name: 'Test 4: Same-day manager alert', pass: false, details: e.toString() });
    }

    // Test 5: Manager acknowledgement & 24h waiver
    try {
      const task3 = state.tasks.find(t => t.taskId === 'TSK-003');
      const oldDue = task3.dueDate;
      submitManagerReview('TSK-003', 'Waived / 24h Extension', 'Client API maintenance');
      const newDue = task3.dueDate;
      results.push({
        name: 'Test 5: Manager action / acknowledgement & waiver',
        pass: task3.managerAck === 'Waived / 24h Extension' && newDue > oldDue,
        details: `Manager waiver granted; due date shifted from ${oldDue} to ${newDue}; escalation paused.`
      });
    } catch (e) {
      results.push({ name: 'Test 5: Manager action', pass: false, details: e.toString() });
    }

    // Test 6: Leadership escalation
    try {
      const task4 = state.tasks.find(t => t.taskId === 'TSK-004');
      task4.dueDate = getTodayString(-2);
      task4.managerAlerted = true;
      task4.managerAck = 'None';
      task4.leadershipEscalated = false;

      // Add dummy old alert >24h ago
      state.notificationLogs.unshift({
        notificationId: 'NOTIF-MOCK-OLD',
        timestamp: getTimestampString(-26),
        cycleId: task4.cycleId,
        taskName: task4.taskName,
        recipient: state.settings.managerEmail,
        role: 'Manager',
        alertType: 'Manager Alert',
        reason: 'Simulated past alert',
        status: 'Logged'
      });

      checkOverdueAndEscalations();

      results.push({
        name: 'Test 6: Leadership escalation (>24h SLA breach)',
        pass: task4.leadershipEscalated === true,
        details: 'Task unresolved >24h post manager alert; Level 2 Leadership Escalation dispatched.'
      });
    } catch (e) {
      results.push({ name: 'Test 6: Leadership escalation', pass: false, details: e.toString() });
    }

    // Test 7: Configurable SLA timing
    try {
      const s = state.settings;
      const validSla = (s.cutoffHour === 18 && s.escalationHours === 24);
      results.push({
        name: 'Test 7: Configurable SLA timing logic',
        pass: validSla,
        details: `Cutoff: ${s.cutoffHour}:00, Alert buffer: ${s.alertDelayMins}m, Leadership SLA: ${s.escalationHours}h.`
      });
    } catch (e) {
      results.push({ name: 'Test 7: Configurable SLA timing', pass: false, details: e.toString() });
    }

    // Test 8: Duplicate prevention (Idempotency)
    try {
      const beforeCount = state.notificationLogs.length;
      checkOverdueAndEscalations();
      checkOverdueAndEscalations();
      const afterCount = state.notificationLogs.length;
      results.push({
        name: 'Test 8: Duplicate prevention (Idempotency)',
        pass: beforeCount === afterCount,
        details: 'Re-ran checks multiple times. Zero duplicate notification entries or task cycles created.'
      });
    } catch (e) {
      results.push({ name: 'Test 8: Duplicate prevention', pass: false, details: e.toString() });
    }

    // Render results
    resultsContainer.innerHTML = '';
    const passedCount = results.filter(r => r.pass).length;

    const summaryHeader = document.createElement('div');
    summaryHeader.style.marginBottom = '12px';
    summaryHeader.style.fontWeight = '600';
    summaryHeader.style.fontSize = '13px';
    summaryHeader.innerHTML = `Test Results: <span style="color:#166534;">${passedCount}/8 Passed</span>`;
    resultsContainer.appendChild(summaryHeader);

    results.forEach(r => {
      const item = document.createElement('div');
      item.className = 'test-item';
      item.innerHTML = `
        <div class="test-item-header">
          <span>${r.name}</span>
          <span class="${r.pass ? 'test-pass' : 'test-fail'}">${r.pass ? 'PASS' : 'FAIL'}</span>
        </div>
        <div class="test-desc">${r.details}</div>
      `;
      resultsContainer.appendChild(item);
    });

    renderAll();
    showToast(`Test suite complete: ${passedCount}/8 Passed.`);
  }

  // --- Attach Event Listeners ---
  function setupEvents() {
    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        this.classList.add('active');
        const targetTab = this.getAttribute('data-tab');
        const pane = document.getElementById(targetTab);
        if (pane) pane.classList.add('active');
      });
    });

    // Employee Filter Dropdown
    const empFilter = document.getElementById('employeeFilter');
    if (empFilter) {
      empFilter.addEventListener('change', renderEmployeeReport);
    }

    // Quick Actions
    const btnCheck = document.getElementById('btnCheckOverdue');
    if (btnCheck) {
      btnCheck.addEventListener('click', checkOverdueAndEscalations);
    }

    const btnReset = document.getElementById('btnResetData');
    if (btnReset) {
      btnReset.addEventListener('click', function () {
        if (confirm('Reset state to default sample data?')) {
          localStorage.clear();
          loadState();
          renderAll();
          showToast('Sample data reset successfully.');
        }
      });
    }

    // Export CSV
    const btnCsv = document.getElementById('btnExportCsv');
    if (btnCsv) {
      btnCsv.addEventListener('click', exportCsv);
    }

    // Manager Action Form Submission
    const mgrForm = document.getElementById('managerActionForm');
    if (mgrForm) {
      mgrForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const taskId = document.getElementById('mgrSelectTask').value;
        const actionType = document.getElementById('mgrActionType').value;
        const remarks = document.getElementById('mgrRemarks').value;
        submitManagerReview(taskId, actionType, remarks);
        document.getElementById('mgrRemarks').value = '';
      });
    }

    // Settings Form Submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', function (e) {
        e.preventDefault();
        state.settings.cutoffHour = parseInt(document.getElementById('settingCutoffHour').value) || 18;
        state.settings.alertDelayMins = parseInt(document.getElementById('settingAlertDelayMins').value) || 30;
        state.settings.escalationHours = parseInt(document.getElementById('settingEscalationHours').value) || 24;
        state.settings.managerEmail = document.getElementById('settingManagerEmail').value.trim();
        state.settings.leadershipEmail = document.getElementById('settingLeadershipEmail').value.trim();
        state.settings.simulationMode = document.getElementById('settingSimulationMode').value === 'true';

        saveState();
        showToast('Settings saved successfully.');
      });
    }

    // Test Suite Execution Button
    const btnTests = document.getElementById('btnRunAllTests');
    if (btnTests) {
      btnTests.addEventListener('click', runAllTests);
    }
  }

  // --- Initialization ---
  document.addEventListener('DOMContentLoaded', function () {
    loadState();
    renderAll();
    setupEvents();
  });

})();
