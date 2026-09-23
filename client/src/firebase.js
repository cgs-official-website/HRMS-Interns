
// ============================================================================
// HRMS POSTGRESQL DIRECT BACKEND CLIENT LAYER (ZERO FIRESTORE DEPENDENCY)
// ============================================================================

const PRODUCTION_API_URL = "https://attendance-cgs-production.up.railway.app/api";
const LOCAL_API_URL = "http://localhost:5000/api";

const getHeaders = () => {
  const token = localStorage.getItem("att_auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Resilient API Fetch with Local/Railway auto-fallback
export const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // Determine candidate URLs (prioritize direct production backend over static origins)
  const candidateUrls = [];
  if (isLocal) {
    candidateUrls.push(`http://localhost:5005/api${cleanEndpoint}`);
    candidateUrls.push(`${LOCAL_API_URL}${cleanEndpoint}`);
  }
  if (import.meta.env.VITE_API_URL) {
    const envBase = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
    candidateUrls.push(`${envBase}${cleanEndpoint}`);
  }
  candidateUrls.push(`${PRODUCTION_API_URL}${cleanEndpoint}`);
  if (!isLocal && typeof window !== "undefined" && window.location.origin) {
    candidateUrls.push(`${window.location.origin}/api${cleanEndpoint}`);
  }

  // Remove duplicates
  const uniqueUrls = [...new Set(candidateUrls)];

  let lastError = null;

  for (const url of uniqueUrls) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getHeaders(),
          ...(options.headers || {})
        }
      });

      const contentType = response.headers.get("content-type") || "";

      // If server returned HTML (e.g. SPA fallback index.html for unhandled /api route) or 405 Method Not Allowed,
      // this server doesn't host the real API; continue to the next candidate server.
      if (response.status === 405 || (!contentType.includes("application/json") && response.ok)) {
        continue;
      }

      if (response.ok) {
        return await response.json();
      }

      // If unauthorized (401) or forbidden (403), throw immediately - user needs login/permissions
      if (response.status === 401 || response.status === 403) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || err.message || `Access denied (${response.status})`);
      }

      // If 404 (route missing on this candidate server) or 5xx, capture error and try next candidate server
      const err = await response.json().catch(() => ({ error: response.statusText }));
      const errorMsg = err.error || err.message || `Request failed with status ${response.status}`;
      lastError = new Error(errorMsg);
    } catch (err) {
      if (err.message && (err.message.includes("Access denied") || err.message.includes("Invalid credentials") || err.message.includes("Invalid password"))) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error(`Failed to fetch ${endpoint}`);
};

// ----------------------------------------------------
// SERVICE INTERFACE
// ----------------------------------------------------
export const getDbType = () => "postgresql";

export const getLocalDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ----------------------------------------------------
// AUTHENTICATION & USER MANAGEMENT
// ----------------------------------------------------

export const loginUser = async (email, password) => {
  const cleanEmail = email.toLowerCase().trim();
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: cleanEmail, password })
  });

  if (res.token) {
    localStorage.setItem("att_auth_token", res.token);
  }

  const meta = res.user.metadata && typeof res.user.metadata === "object" ? res.user.metadata : {};
  const empId = res.user.employeeId || res.user.employee_id || meta.employeeId || meta.employee_id || "";

  // Determine default company only for non-admin users
  const defaultCompany = cleanEmail.endsWith("@teamcarrezza.com") && normalizedRole !== "admin" ? "carrezza-global-solutions" : "";
  const user = {
    ...res.user,
    ...meta,
    uid: res.user.id || res.user.uid,
    id: res.user.id || res.user.uid,
    employeeId: empId,
    employee_id: empId,
    companyId: res.user.company_id || res.user.companyId || defaultCompany
  };

  localStorage.setItem("att_current_user", JSON.stringify(user));
  window.dispatchEvent(new Event("local-auth-updated"));
  return user;
};

export const registerUser = async (name, department, programType, email, password, shiftStart = "10:00", shiftEnd = "19:00", annualLeaves = 25, sickLeaves = 10, casualLeaves = 6, dob = "", joiningDate = "", projects = [], tasks = [], jobType = "Full-time", designation = "", isProjectManager = false, employeeId = "", companySlug = "", role = "employee", companyId = "", additionalData = {}) => {
  let targetCompanyId = companyId;

  // If companySlug is given but companyId is not, resolve the slug to a real companyId
  if (!targetCompanyId && companySlug) {
    if (companySlug === "carrezza-global-solutions" || email.toLowerCase().endsWith("@teamcarrezza.com")) {
      targetCompanyId = "carrezza-global-solutions";
    } else {
      try {
        const company = await apiFetch(`/companies/slug/${companySlug}`);
        if (company && company.id) {
          targetCompanyId = company.id;
        } else {
          targetCompanyId = companySlug; // fallback: use slug as id
        }
      } catch (e) {
        targetCompanyId = companySlug; // fallback if company lookup fails
      }
    }
  }

  // Always enforce employee role when registering under a company via the org link
  const safeRole = (role === "admin" || role === "superadmin") ? role : "employee";

  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      department,
      programType,
      email: email.toLowerCase().trim(),
      password,
      shiftStart,
      shiftEnd,
      annualLeaves,
      sickLeaves,
      casualLeaves,
      dob,
      joiningDate,
      projects,
      tasks,
      jobType,
      designation,
      isProjectManager,
      employeeId,
      companyId: targetCompanyId,
      role: safeRole,
      ...additionalData
    })
  });

  if (res.token) {
    localStorage.setItem("att_auth_token", res.token);
  }

  const rawUser = res.user || res;
  const meta = rawUser.metadata && typeof rawUser.metadata === "object" ? rawUser.metadata : {};
  const empId = rawUser.employeeId || rawUser.employee_id || meta.employeeId || meta.employee_id || employeeId || "";

  const user = {
    ...rawUser,
    ...meta,
    uid: rawUser.id || rawUser.uid,
    id: rawUser.id || rawUser.uid,
    employeeId: empId,
    employee_id: empId,
    companyId: rawUser.company_id || rawUser.companyId || targetCompanyId,
    company_id: rawUser.company_id || rawUser.companyId || targetCompanyId
  };

  localStorage.setItem("att_current_user", JSON.stringify(user));
  window.dispatchEvent(new Event("local-auth-updated"));
  return user;
};

export const logoutUser = async () => {
  localStorage.removeItem("att_auth_token");
  localStorage.removeItem("att_current_user");
  window.dispatchEvent(new Event("local-auth-updated"));
};

export const sendPasswordReset = async (email) => {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email: email.toLowerCase().trim() })
  });
};

export const confirmPasswordReset = async (token, newPassword) => {
  return apiFetch("/auth/confirm-reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword })
  });
};

export const changeUserPassword = async (newPassword) => {
  const cur = JSON.parse(localStorage.getItem("att_current_user") || "null");
  if (!cur) throw new Error("No user is currently signed in.");
  return apiFetch(`/users/${cur.uid}`, {
    method: "PUT",
    body: JSON.stringify({ password: newPassword })
  });
};

export const onAuthUserChanged = (callback) => {
  let isSubscribed = true;

  const handler = async () => {
    const raw = localStorage.getItem("att_current_user");
    if (raw) {
      try {
        let user = JSON.parse(raw);
        // Only set default global company if companyId truly missing
        if (!user.companyId && (!user.company_id || user.company_id === "")) {
          if (user.email?.toLowerCase().endsWith("@teamcarrezza.com")) {
            user.companyId = "carrezza-global-solutions";
            user.company_id = "carrezza-global-solutions";
          }
        }
        callback(user);

        // Transparently re-sync latest live user profile from PostgreSQL
        const token = localStorage.getItem("att_auth_token");
        const userId = user.id || user.uid;
        if (token && userId) {
          try {
            const fresh = await apiFetch(`/users/${userId}`);
            if (fresh && fresh.id && isSubscribed) {
              const freshEmpId = fresh.employeeId || fresh.employee_id || "";
              const merged = {
                ...user,
                ...fresh,
                uid: fresh.id,
                id: fresh.id,
                employeeId: freshEmpId || user.employeeId || "",
                employee_id: freshEmpId || user.employee_id || ""
              };
              localStorage.setItem("att_current_user", JSON.stringify(merged));
              callback(merged);
            }
          } catch (fetchErr) {
            // Ignore background sync errors
          }
        }
      } catch (e) {
        callback(null);
      }
    } else {
      callback(null);
    }
  };

  handler();
  window.addEventListener("local-auth-updated", handler);
  return () => {
    isSubscribed = false;
    window.removeEventListener("local-auth-updated", handler);
  };
};

export const getAllRegisteredUsers = async (companyId = "") => {
  try {
    const res = await apiFetch(`/users?companyId=${companyId || ""}`);
    return Array.isArray(res) ? res.map(u => ({
      ...u,
      uid: u.id || u.uid,
      companyId: u.company_id || u.companyId
    })) : [];
  } catch (e) {
    return [];
  }
};

export const updateUserRecord = async (uid, name, department, programType, shiftStart, shiftEnd, annualLeaves, sickLeaves, casualLeaves, avatar, dob, joiningDate, projects, tasks, jobType, designation, isProjectManager, employeeId, additionalData = {}) => {
  if (typeof name === "object" && name !== null) {
    return apiFetch(`/users/${uid}`, {
      method: "PUT",
      body: JSON.stringify(name)
    });
  }
  return apiFetch(`/users/${uid}`, {
    method: "PUT",
    body: JSON.stringify({
      name,
      department,
      programType,
      shiftStart,
      shiftEnd,
      annualLeaves,
      sickLeaves,
      casualLeaves,
      avatar,
      dob,
      joiningDate,
      projects,
      tasks,
      jobType,
      designation,
      isProjectManager,
      employeeId,
      ...additionalData
    })
  });
};

export const updateUserAccountStatus = async (uid, status) => {
  return apiFetch(`/users/${uid}`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
};

export const deleteUserRecord = async (uid) => {
  return apiFetch(`/users/${uid}`, { method: "DELETE" });
};

// ----------------------------------------------------
// ATTENDANCE & TRACKING
// ----------------------------------------------------

export const checkIn = async (userId, location = {}) => {
  const uid = typeof userId === "object" && userId !== null ? (userId.uid || userId.id) : userId;
  const companyId = typeof userId === "object" && userId !== null ? userId.companyId : undefined;
  const date = getLocalDateString();
  return apiFetch("/attendance/check-in", {
    method: "POST",
    body: JSON.stringify({ userId: uid, companyId, date, location })
  });
};

export const checkOut = async (userId, location = {}) => {
  const uid = typeof userId === "object" && userId !== null ? (userId.uid || userId.id) : userId;
  const companyId = typeof userId === "object" && userId !== null ? userId.companyId : undefined;
  const date = getLocalDateString();
  return apiFetch("/attendance/check-out", {
    method: "POST",
    body: JSON.stringify({ userId: uid, companyId, date, location })
  });
};

export const startBreak = async (userId, location = {}) => checkOut(userId, location);
export const resumeWork = async (userId, location = {}) => checkIn(userId, location);

export const getTodayAttendanceLog = async (userId) => {
  const today = getLocalDateString();
  try {
    const logs = await apiFetch(`/attendance?userId=${userId}&date=${today}`);
    return Array.isArray(logs) ? (logs[0] || null) : null;
  } catch (e) {
    return null;
  }
};

export const getUserAttendanceLogs = async (userId) => {
  try {
    const res = await apiFetch(`/attendance?userId=${userId}`);
    return Array.isArray(res) ? res : [];
  } catch (e) {
    return [];
  }
};

export const getAllAttendanceLogs = async () => {
  try {
    const res = await apiFetch("/attendance");
    return Array.isArray(res) ? res : [];
  } catch (e) {
    return [];
  }
};

export const subscribeToUserLogs = (userId, callback) => {
  let isMounted = true;
  const fetchLogs = () => {
    getUserAttendanceLogs(userId).then(logs => {
      if (isMounted) callback(logs);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchLogs();
  const interval = setInterval(fetchLogs, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const subscribeToAdminDashboard = (companyId, callback) => {
  let isMounted = true;
  const fetchLogs = () => {
    apiFetch(`/attendance?companyId=${companyId || ""}`).then(logs => {
      if (isMounted) callback(Array.isArray(logs) ? logs : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchLogs();
  const interval = setInterval(fetchLogs, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const updateAttendanceRules = async (rules, companyId = "") => {
  return apiFetch("/attendance/rules", {
    method: "POST",
    body: JSON.stringify({ rules, companyId })
  });
};

export const subscribeToAttendanceRules = (callback, companyId = "") => {
  let isMounted = true;
  const fetchRules = () => {
    apiFetch(`/attendance/rules?companyId=${encodeURIComponent(companyId || "")}`).then(res => {
      if (isMounted) callback(res?.rules || "");
    }).catch(() => {
      if (isMounted) callback("");
    });
  };
  fetchRules();
  const interval = setInterval(fetchRules, 5000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

// ----------------------------------------------------
// LEAVES & REGULARIZATION
// ----------------------------------------------------

export const requestLeave = async (
  userId,
  userName,
  userDept,
  a4,
  a5,
  a6,
  a7,
  a8,
  a9,
  a10,
  a11
) => {
  let leaveType = "Casual Leave";
  let startDate = "";
  let endDate = "";
  let totalDays = 1;
  let reason = "";
  let companyId = "";

  if (typeof a4 === "string" && a4.match(/^\d{4}-\d{2}-\d{2}/)) {
    startDate = a4;
    endDate = a5;
    totalDays = parseInt(a6) || 1;
    leaveType = a7 || "Casual Leave";
    reason = a8 || "";
    companyId = a9 || "";
  } else {
    leaveType = a4 || "Casual Leave";
    totalDays = parseInt(a5) || 1;
    startDate = a6;
    endDate = a7;
    reason = a8 || "";
    companyId = a11 || a9 || "";
  }

  return apiFetch("/leaves", {
    method: "POST",
    body: JSON.stringify({
      userId,
      userName,
      userDept,
      startDate,
      endDate,
      totalDays,
      leaveType,
      reason,
      companyId
    })
  });
};

export const updateLeaveRequest = async (requestId, status, comment = "") => {
  return apiFetch(`/leaves/${requestId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, rejectionReason: comment, managerComment: comment })
  });
};

export const subscribeToLeaveRequests = (companyId, callback) => {
  let isMounted = true;
  const fetchLeaves = () => {
    apiFetch(`/leaves?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchLeaves();
  const interval = setInterval(fetchLeaves, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const uploadPaidLeave = async (title, startDate, endDate, description = "", status = "active", companyId = "") => {
  return apiFetch("/leaves/paid", {
    method: "POST",
    body: JSON.stringify({ title, startDate, endDate, description, status, companyId })
  });
};

export const updatePaidLeaveStatus = async (id, status) => {
  return apiFetch(`/leaves/paid/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
};

export const deletePaidLeave = async (id) => {
  return apiFetch(`/leaves/paid/${id}`, { method: "DELETE" });
};

export const subscribeToPaidLeaves = (companyId, callback) => {
  let isMounted = true;
  const fetchPaid = () => {
    apiFetch(`/leaves/paid?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchPaid();
  const interval = setInterval(fetchPaid, 5000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const requestRegularization = async (userId, userName, userDept, date, checkIn, checkOut, reason, companyId = "") => {
  return apiFetch("/regularization", {
    method: "POST",
    body: JSON.stringify({ userId, userName, userDept, date, checkIn, checkOut, reason, companyId })
  });
};

export const updateRegularizationRequest = async (requestId, status, managerComment = "") => {
  return apiFetch(`/regularization/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, managerComment, rejectionReason: managerComment })
  });
};

export const subscribeToRegularizationRequests = (companyId, callback) => {
  let isMounted = true;
  const fetchRegs = () => {
    apiFetch(`/regularization?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchRegs();
  const interval = setInterval(fetchRegs, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

// ----------------------------------------------------
// PROJECTS & TASKS
// ----------------------------------------------------

export const createProject = async (...args) => {
  let name, description, teamMembers, deadline, companyId, startDate, managerId, status;
  if (typeof args[0] === "object") {
    ({ name, description, teamMembers, deadline, companyId, startDate, managerId, status } = args[0]);
  } else {
    [name, description, teamMembers = [], deadline = "", companyId = "", startDate = "", managerId = "", status = "Ongoing"] = args;
  }
  return apiFetch("/projects", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      teamMembers,
      deadline,
      companyId,
      startDate: startDate || deadline,
      endDate: deadline,
      managerId,
      status
    })
  });
};

export const updateProject = async (projectId, updates) => {
  return apiFetch(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
};

export const deleteProject = async (projectId) => {
  return apiFetch(`/projects/${projectId}`, { method: "DELETE" });
};

export const updateProjectTeam = async (projectId, teamMembers) => updateProject(projectId, { teamMembers });
export const addTeamMemberToProject = async (projectId, userId) => {
  return apiFetch(`/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId })
  }).catch(() => true);
};

export const subscribeToProjects = (companyId, callback) => {
  let isMounted = true;
  const fetchProjects = () => {
    apiFetch(`/projects?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : [], null);
    }).catch((err) => {
      if (isMounted) callback([], err);
    });
  };
  fetchProjects();
  const interval = setInterval(fetchProjects, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const createTask = async (taskData) => {
  return apiFetch("/tasks", {
    method: "POST",
    body: JSON.stringify(taskData)
  });
};

export const updateTask = async (taskId, updates) => {
  return apiFetch(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
};

export const deleteTask = async (taskId) => {
  return apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
};

export const subscribeToTasks = (companyId, callback) => {
  let isMounted = true;
  const fetchTasks = () => {
    apiFetch(`/tasks?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchTasks();
  const interval = setInterval(fetchTasks, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const startTaskTimer = async (userId, taskId) => {
  try {
    let cur = null;
    try {
      cur = JSON.parse(localStorage.getItem("att_current_user") || "null");
    } catch {}

    let tasks = Array.isArray(cur?.tasks) && cur.tasks.length > 0 ? [...cur.tasks] : [];
    if (!tasks.length) {
      try {
        const user = await apiFetch(`/users/${userId}`);
        tasks = user?.tasks || [];
      } catch {}
    }

    const updatedTasks = tasks.map(t => ({
      ...t,
      timerStartedAt: t.id === taskId ? new Date().toISOString() : null
    }));

    if (cur) {
      cur.tasks = updatedTasks;
      localStorage.setItem("att_current_user", JSON.stringify(cur));
    }

    await updateUserTasks(userId, updatedTasks).catch(() => {});
    return true;
  } catch (err) {
    console.error("startTaskTimer error:", err);
    return false;
  }
};

export const stopTaskTimer = async (userId, taskId, pmId) => {
  try {
    let cur = null;
    try {
      cur = JSON.parse(localStorage.getItem("att_current_user") || "null");
    } catch {}

    let tasks = Array.isArray(cur?.tasks) && cur.tasks.length > 0 ? [...cur.tasks] : [];
    if (!tasks.length) {
      try {
        const user = await apiFetch(`/users/${userId}`);
        tasks = user?.tasks || [];
      } catch {}
    }

    const targetTask = tasks.find(t => t.id === taskId);

    if (targetTask?.timerStartedAt) {
      const startedMs = new Date(targetTask.timerStartedAt).getTime();
      const elapsedMs = Math.max(0, Date.now() - startedMs);
      const elapsedMinutes = Math.round(elapsedMs / 60000);

      if (elapsedMinutes > 0) {
        const h = Math.floor(elapsedMinutes / 60);
        const m = elapsedMinutes % 60;
        const durationText = `${h > 0 ? h + "h " : ""}${m}m`;

        await addTaskReport({
          taskId,
          userId,
          pmId: pmId || targetTask.assignedBy,
          content: `Worked for ${durationText}`
        }).catch(() => {});
      }
    }

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, timerStartedAt: null };
      }
      return t;
    });

    if (cur) {
      cur.tasks = updatedTasks;
      localStorage.setItem("att_current_user", JSON.stringify(cur));
    }

    await updateUserTasks(userId, updatedTasks).catch(() => {});
    return true;
  } catch (err) {
    console.error("stopTaskTimer error:", err);
    return false;
  }
};

export const stopAllTaskTimers = async (userId) => {
  try {
    let cur = null;
    try {
      cur = JSON.parse(localStorage.getItem("att_current_user") || "null");
    } catch {}

    const targetId = userId || cur?.uid || cur?.id;
    if (!targetId) return true;

    let tasks = Array.isArray(cur?.tasks) && cur.tasks.length > 0 ? [...cur.tasks] : [];
    const updatedTasks = tasks.map(t => ({ ...t, timerStartedAt: null }));

    if (cur) {
      cur.tasks = updatedTasks;
      localStorage.setItem("att_current_user", JSON.stringify(cur));
    }

    await updateUserTasks(targetId, updatedTasks).catch(() => {});
    return true;
  } catch {
    return true;
  }
};

export const addTaskReport = async (arg1, arg2, arg3, arg4) => {
  let reportData;
  if (typeof arg1 === "object" && arg1 !== null) {
    reportData = arg1;
  } else {
    reportData = {
      taskId: arg1,
      userId: arg2,
      pmId: arg3,
      content: arg4
    };
  }
  return apiFetch("/reports/tasks", {
    method: "POST",
    body: JSON.stringify(reportData)
  }).catch(() => ({ success: true }));
};

export const updateTaskWarningSent = async (userId, taskId) => {
  try {
    const user = await apiFetch(`/users/${userId}`);
    const tasks = user?.tasks || [];
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, warningSentAt: new Date().toISOString() };
      }
      return t;
    });
    await updateUserTasks(userId, updatedTasks);
    return true;
  } catch {
    return false;
  }
};

export const subscribeToUserTasks = (userId, callback) => {
  let isMounted = true;
  let lastValidTasks = null;

  // Immediate initialize from cached current user if matching
  try {
    const cached = JSON.parse(localStorage.getItem("att_current_user") || "null");
    if (cached && (cached.uid === userId || cached.id === userId) && Array.isArray(cached.tasks) && cached.tasks.length > 0) {
      lastValidTasks = cached.tasks;
      callback(lastValidTasks);
    }
  } catch {}

  const fetchUserTasks = async () => {
    if (!userId) return;
    try {
      let tasks = null;
      // 1. Direct user fetch
      try {
        const user = await apiFetch(`/users/${userId}`);
        if (user && Array.isArray(user.tasks)) {
          tasks = user.tasks;
        }
      } catch (err) {
        // Direct route may 404 during rollouts
      }

      // 2. Direct tasks endpoint
      if (tasks === null) {
        try {
          const directTasks = await apiFetch(`/tasks?assignedTo=${userId}`);
          if (Array.isArray(directTasks) && directTasks.length > 0) {
            tasks = directTasks.map(dbt => ({
              id: String(dbt.id),
              title: dbt.title,
              description: dbt.description || "",
              project: dbt.project_id || "",
              completed: dbt.status === "completed" || dbt.status === "Completed",
              status: dbt.status || "pending",
              assignedAt: dbt.created_at,
              assignedBy: dbt.created_by
            }));
          }
        } catch {}
      }

      // 3. Cached current user fallback
      if (tasks === null) {
        const cached = JSON.parse(localStorage.getItem("att_current_user") || "null");
        if (cached && (cached.uid === userId || cached.id === userId) && Array.isArray(cached.tasks) && cached.tasks.length > 0) {
          tasks = cached.tasks;
        }
      }

      if (tasks !== null) {
        lastValidTasks = tasks;
        if (isMounted) callback(tasks);
      } else if (lastValidTasks !== null) {
        if (isMounted) callback(lastValidTasks);
      } else {
        if (isMounted) callback([]);
      }
    } catch {
      if (lastValidTasks !== null) {
        if (isMounted) callback(lastValidTasks);
      } else if (isMounted) {
        callback([]);
      }
    }
  };
  fetchUserTasks();
  const interval = setInterval(fetchUserTasks, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const subscribeToTaskReports = (arg, callback) => {
  let isMounted = true;
  let queryParam = "";
  if (typeof arg === "object" && arg !== null) {
    const parts = [];
    if (arg.companyId) parts.push(`companyId=${encodeURIComponent(arg.companyId)}`);
    if (arg.taskId) parts.push(`taskId=${encodeURIComponent(arg.taskId)}`);
    if (arg.userId) parts.push(`userId=${encodeURIComponent(arg.userId)}`);
    queryParam = parts.join("&");
  } else if (typeof arg === "string") {
    if (arg.includes("carrezza") || arg.startsWith("comp_")) {
      queryParam = `companyId=${encodeURIComponent(arg)}`;
    } else {
      queryParam = `taskId=${encodeURIComponent(arg)}`;
    }
  }

  let lastReports = null;
  const fetchReports = () => {
    apiFetch(`/reports/tasks?${queryParam}`).then(data => {
      if (Array.isArray(data)) {
        lastReports = data;
        if (isMounted) callback(data);
      } else if (lastReports !== null) {
        if (isMounted) callback(lastReports);
      } else if (isMounted) {
        callback([]);
      }
    }).catch(() => {
      if (lastReports !== null) {
        if (isMounted) callback(lastReports);
      } else if (isMounted) {
        callback([]);
      }
    });
  };
  fetchReports();
  const interval = setInterval(fetchReports, 4000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const updateUserTasks = async (userId, tasks) => {
  return apiFetch(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ tasks })
  });
};

export const updateUserProjects = async (userId, projects) => {
  return apiFetch(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ projects })
  });
};

export const subscribeToAllUsers = (companyId, callback) => {
  let isMounted = true;
  const fetchUsers = () => {
    getAllRegisteredUsers(companyId).then(users => {
      if (isMounted) callback(Array.isArray(users) ? users : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchUsers();
  const interval = setInterval(fetchUsers, 4000);
  window.addEventListener("local-auth-updated", fetchUsers);
  return () => {
    isMounted = false;
    clearInterval(interval);
    window.removeEventListener("local-auth-updated", fetchUsers);
  };
};

// ----------------------------------------------------
// CHAT & TEAM HUB
// ----------------------------------------------------

export const createChannel = async (name, description, creatorId, creatorName, companyId = "") => {
  return apiFetch("/chat/channels", {
    method: "POST",
    body: JSON.stringify({ name, displayName: name, description, createdBy: creatorId, companyId })
  });
};

export const subscribeToChannels = (companyId, callback) => {
  let isMounted = true;
  const fetchChannels = () => {
    apiFetch(`/chat/channels?companyId=${companyId || ""}`).then(data => {
      if (isMounted) {
        callback(Array.isArray(data) && data.length > 0 ? data : [
          { id: "general", name: "general", displayName: "General", description: "General company discussions", is_private: false }
        ]);
      }
    }).catch(() => {
      if (isMounted) {
        callback([
          { id: "general", name: "general", displayName: "General", description: "General company discussions", is_private: false }
        ]);
      }
    });
  };
  fetchChannels();
  const interval = setInterval(fetchChannels, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const joinChannel = async () => true;
export const leaveChannel = async () => true;
export const deleteChannel = async (channelId) => apiFetch(`/chat/channels/${channelId}`, { method: "DELETE" }).catch(() => {});

export const sendChatMessage = async (...args) => {
  let channelId, content, senderId, senderName, senderAvatar, attachments, companyId;
  if (typeof args[1] === "string" && (args[1] === "channel" || args[1] === "dm" || typeof args[5] === "string")) {
    // Called with: (threadId, threadType, senderId, senderName, senderAvatar, text, fileData, companyId)
    channelId = args[0];
    senderId = args[2];
    senderName = args[3];
    senderAvatar = args[4];
    content = args[5];
    const fileData = args[6];
    companyId = args[7];
    attachments = fileData ? [fileData] : [];
  } else {
    // Called with: (channelId, text, senderId, senderName, senderAvatar, replyTo, attachments, companyId)
    channelId = args[0];
    content = args[1];
    senderId = args[2];
    senderName = args[3];
    senderAvatar = args[4];
    attachments = args[6] || [];
    companyId = args[7];
  }

  const res = await apiFetch("/chat/messages", {
    method: "POST",
    body: JSON.stringify({
      channelId,
      content,
      senderId,
      senderName,
      userAvatar: senderAvatar,
      attachments,
      companyId
    })
  });

  return res ? {
    ...res,
    text: res.content || res.text || content || "",
    senderAvatar: res.user_avatar || res.senderAvatar || senderAvatar || "",
    fileData: (res.file_url || res.fileUrl) ? {
      url: res.file_url || res.fileUrl,
      name: res.file_name || res.fileName || "Attachment",
      type: res.file_type || res.fileType || ""
    } : (attachments?.[0] || null),
    isPinned: Boolean(res.reactions?.pinned?.isPinned || res.isPinned),
    pinExpiresAt: res.reactions?.pinned?.pinExpiresAt || res.reactions?.pinned?.pinnedUntil || res.pinExpiresAt || null,
    pinDurationDays: res.reactions?.pinned?.pinDurationDays || res.pinDurationDays || null,
    pinnedAt: res.reactions?.pinned?.pinnedAt || res.pinnedAt || null,
    pinnedBy: res.reactions?.pinned?.pinnedBy || res.pinnedBy || null
  } : res;
};

const mapMessageData = (m) => {
  if (!m) return m;
  const pinned = m.reactions?.pinned || {};
  const isPinned = m.isPinned !== undefined ? Boolean(m.isPinned) : Boolean(pinned.isPinned);
  const pinExpiresAt = m.pinExpiresAt || pinned.pinExpiresAt || pinned.pinnedUntil || null;
  const pinDurationDays = m.pinDurationDays || pinned.pinDurationDays || null;
  const pinnedAt = m.pinnedAt || pinned.pinnedAt || null;
  const pinnedBy = m.pinnedBy || pinned.pinnedBy || null;

  const isDeleted = m.isDeleted !== undefined ? Boolean(m.isDeleted) : Boolean(m.is_deleted || m.reactions?.isDeleted);
  const deletedBy = m.deletedBy || m.deleted_by || m.reactions?.deletedBy || null;
  const deletedAt = m.deletedAt || m.deleted_at || m.reactions?.deletedAt || null;
  const deletedFor = m.deletedFor || m.deleted_for || m.reactions?.deletedFor || [];

  return {
    ...m,
    text: m.text ?? m.content ?? "",
    senderAvatar: m.senderAvatar ?? m.user_avatar ?? "",
    fileData: m.fileData || ((m.file_url || m.fileUrl) ? {
      url: m.file_url || m.fileUrl,
      name: m.file_name || m.fileName || "Attachment",
      type: m.file_type || m.fileType || ""
    } : null),
    isPinned,
    pinExpiresAt,
    pinDurationDays,
    pinnedAt,
    pinnedBy,
    isDeleted,
    deletedBy,
    deletedAt,
    deletedFor
  };
};

export const subscribeToMessages = (channelId, companyIdOrCallback, maybeCallback) => {
  let companyId = "";
  let callback = null;
  if (typeof companyIdOrCallback === "function") {
    callback = companyIdOrCallback;
    companyId = "";
  } else {
    companyId = companyIdOrCallback || "";
    callback = maybeCallback;
  }

  let isMounted = true;
  const fetchMsgs = () => {
    if (!channelId) return;
    apiFetch(`/chat/messages?channelId=${channelId}&companyId=${companyId || ""}`).then(data => {
      if (isMounted && typeof callback === "function") {
        const msgs = Array.isArray(data) ? data.map(mapMessageData) : [];
        callback(msgs);
      }
    }).catch(() => {
      if (isMounted && typeof callback === "function") callback([]);
    });
  };
  fetchMsgs();
  const interval = setInterval(fetchMsgs, 2000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const subscribeToAllMessages = (companyId, callback) => {
  let isMounted = true;
  const fetchAll = () => {
    apiFetch(`/chat/messages?companyId=${companyId || ""}`).then(data => {
      if (isMounted && typeof callback === "function") {
        const msgs = Array.isArray(data) ? data.map(mapMessageData) : [];
        callback(msgs);
      }
    }).catch(() => {
      if (isMounted && typeof callback === "function") callback([]);
    });
  };
  fetchAll();
  const interval = setInterval(fetchAll, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const pinChatMessage = async (messageId, durationDays = 1, pinnedBy = "", threadId = "") => {
  const days = typeof durationDays === "number" ? durationDays : 1;
  const pinExpiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
  return apiFetch(`/chat/messages/${messageId}/pin`, {
    method: "PATCH",
    body: JSON.stringify({
      isPinned: true,
      pinDurationDays: days,
      pinExpiresAt,
      pinnedUntil: pinExpiresAt,
      pinnedBy: pinnedBy || "User",
      pinnedAt: new Date().toISOString()
    })
  });
};

export const unpinChatMessage = async (messageId) => {
  return apiFetch(`/chat/messages/${messageId}/pin`, {
    method: "PATCH",
    body: JSON.stringify({
      isPinned: false,
      pinDurationDays: null,
      pinExpiresAt: null,
      pinnedUntil: null,
      pinnedBy: null,
      pinnedAt: null
    })
  });
};

export const pinChatThread = async () => true;
export const unpinChatThread = async () => true;
export const markThreadAsRead = async (userId, threadId) => {
  if (!userId || !threadId) return true;
  const now = new Date().toISOString();

  // 1. Update local storage immediately for instant UI badge disappearance
  try {
    const raw = localStorage.getItem("att_current_user");
    if (raw) {
      const u = JSON.parse(raw);
      if (!u.teamHubReadReceipts) u.teamHubReadReceipts = {};
      u.teamHubReadReceipts[threadId] = now;
      localStorage.setItem("att_current_user", JSON.stringify(u));
    }

    const dedicatedKey = `teamhub_read_receipts_${userId}`;
    const dedicatedMap = JSON.parse(localStorage.getItem(dedicatedKey) || "{}");
    dedicatedMap[threadId] = now;
    localStorage.setItem(dedicatedKey, JSON.stringify(dedicatedMap));

    // Notify listeners (DashboardLayout, TeamHub) to recalculate unread counts
    window.dispatchEvent(new Event("local-auth-updated"));
  } catch (e) {
    console.error("Local read receipt update error:", e);
  }

  // 2. Persist to server
  try {
    await apiFetch("/chat/read-receipt", {
      method: "POST",
      body: JSON.stringify({ userId, threadId, readAt: now })
    }).catch(() => {});
  } catch (err) {
    // Non-blocking
  }

  return true;
};
export const deleteChatMessageForMe = async (messageId, userId) => {
  return apiFetch(`/chat/messages/${messageId}`, {
    method: "DELETE",
    body: JSON.stringify({ deleteType: "me", userId })
  }).catch(() => ({ success: true }));
};

export const deleteChatMessage = async (messageId) => {
  return apiFetch(`/chat/messages/${messageId}`, {
    method: "DELETE",
    body: JSON.stringify({ deleteType: "everyone" })
  }).catch(() => ({ success: true }));
};

export const getAllMessagesAdmin = async (companyId = "") => {
  try {
    const res = await apiFetch(`/chat/messages?companyId=${companyId || ""}`);
    return Array.isArray(res) ? res : [];
  } catch (e) {
    return [];
  }
};

export const getOrCreateDmThread = async (currentUserId, targetUserId, companyId = "") => {
  const res = await apiFetch("/chat/dm-threads", {
    method: "POST",
    body: JSON.stringify({ participants: [currentUserId, targetUserId], companyId })
  }).catch(() => ({ id: `dm_${[currentUserId, targetUserId].sort().join("_")}` }));
  return res;
};

export const subscribeToDmThreads = (userId, companyId, callback) => {
  let isMounted = true;
  const fetchDms = () => {
    apiFetch(`/chat/dm-threads?userId=${userId}&companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchDms();
  const interval = setInterval(fetchDms, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const getAllDmThreadsAdmin = async (companyId = "") => {
  try {
    const res = await apiFetch(`/chat/dm-threads?companyId=${companyId || ""}`);
    return Array.isArray(res) ? res : [];
  } catch (e) {
    return [];
  }
};

export const uploadFileToFirebase = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
};

export const uploadFileToCloudinary = async (file) => uploadFileToFirebase(file);

// ----------------------------------------------------
// ASSETS MANAGEMENT
// ----------------------------------------------------

export const getAssets = async (companyId = "") => {
  try {
    const res = await apiFetch(`/assets?companyId=${companyId || ""}`);
    return Array.isArray(res) ? res : [];
  } catch (e) {
    return [];
  }
};

export const addAsset = async (assetData) => {
  return apiFetch("/assets", {
    method: "POST",
    body: JSON.stringify(assetData)
  });
};

export const updateAsset = async (assetId, updates) => {
  return apiFetch(`/assets/${assetId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
};

export const deleteAsset = async (assetId) => {
  return apiFetch(`/assets/${assetId}`, { method: "DELETE" });
};

export const subscribeToAssets = (companyId, callback) => {
  let isMounted = true;
  const fetchAssets = () => {
    apiFetch(`/assets?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchAssets();
  const interval = setInterval(fetchAssets, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

// ----------------------------------------------------
// PAYROLL MANAGEMENT
// ----------------------------------------------------

export const subscribeToCompanyPayroll = (companyId, month, year, callback) => {
  let isMounted = true;
  const fetchPayroll = () => {
    let url = `/payroll?companyId=${encodeURIComponent(companyId || "")}`;
    if (month) url += `&month=${encodeURIComponent(month)}`;
    if (year) url += `&year=${encodeURIComponent(year)}`;
    apiFetch(url).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchPayroll();
  const interval = setInterval(fetchPayroll, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const saveEmployeePayroll = async (...args) => {
  let payload = {};
  if (args.length >= 3) {
    const [companyId, userId, data] = args;
    payload = {
      ...data,
      companyId,
      userId,
      employeeId: userId
    };
  } else if (typeof args[0] === "object" && args[0] !== null) {
    payload = args[0];
  }
  return apiFetch("/payroll", {
    method: "POST",
    body: JSON.stringify(payload)
  });
};

export const deleteEmployeePayroll = async (...args) => {
  if (args.length >= 4) {
    const [companyId, userId, month, year] = args;
    const url = `/payroll?companyId=${encodeURIComponent(companyId || "")}&employeeId=${encodeURIComponent(userId || "")}&month=${encodeURIComponent(month || "")}&year=${encodeURIComponent(year || "")}`;
    return apiFetch(url, { method: "DELETE" });
  }
  const payrollId = args[0];
  return apiFetch(`/payroll/${payrollId}`, { method: "DELETE" });
};

export const wipeAllEmployeePayrolls = async (companyId, month, year) => {
  let url = `/payroll/all?companyId=${encodeURIComponent(companyId || "")}`;
  if (month) url += `&month=${encodeURIComponent(month)}`;
  if (year) url += `&year=${encodeURIComponent(year)}`;
  return apiFetch(url, { method: "DELETE" });
};

export const updateEmployeeGrossSalary = async (userId, grossSalary) => {
  return apiFetch(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ grossSalary: Number(grossSalary) })
  });
};

// ----------------------------------------------------
// COMPANIES & WORKSPACES
// ----------------------------------------------------

export const getCompanies = async () => {
  try {
    const res = await apiFetch("/companies");
    return Array.isArray(res) ? res : [];
  } catch (e) {
    return [];
  }
};

export const getCompanyBySlug = async (slug) => {
  try {
    return await apiFetch(`/companies/slug/${slug}`);
  } catch (e) {
    return null;
  }
};

export const listenToCompany = (companyId, callback) => {
  let actualId = typeof companyId === "object" && companyId !== null ? companyId.id : companyId;
  if (!actualId) return () => {};

  let isMounted = true;
  const fetchCompany = () => {
    apiFetch(`/companies/slug/${actualId}`).then(comp => {
      if (isMounted && comp) callback(comp);
    }).catch(() => {
      if (isMounted && actualId === "carrezza-global-solutions") {
        callback({
          id: "carrezza-global-solutions",
          name: "Carrezza Global Solutions",
          slug: "carrezza-global-solutions",
          status: "active",
          modules: ["attendance", "team-hub", "projects", "tasks", "assets", "payroll", "external-links", "roles"]
        });
      }
    });
  };

  fetchCompany();
  const interval = setInterval(fetchCompany, 5000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const createCompany = async (companyData) => {
  return apiFetch("/companies", {
    method: "POST",
    body: JSON.stringify(companyData)
  });
};

export const updateCompanyDetails = async (companyId, updates) => {
  return apiFetch(`/companies/${companyId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
};

export const deleteCompany = async (companyId) => apiFetch(`/companies/${companyId}`, { method: "DELETE" });
export const updateCompanyStatus = async (companyId, status) => updateCompanyDetails(companyId, { status });

export const getCompanyStats = async () => ({});
export const approveCompany = async (companyId) => updateCompanyStatus(companyId, "active");
export const autoMigrateFirebase = async () => true;
export const assignCompanyToUser = async () => true;
export const recoverLostData = async () => true;
export const recoverChatData = async () => true;
export const getCompanyNameById = async () => "Carrezza Global Solutions";
export const checkDomainAuthorization = async (email, companySlug) => {
  // If no company slug is given, allow registration globally
  if (!companySlug) return { allowed: true };

  try {
    // Validate the company exists for this slug
    const company = await apiFetch(`/companies/slug/${companySlug}`);
    if (!company || !company.id) {
      return { allowed: false, reason: "Organization not found. Please check your registration link." };
    }
    if (company.status && company.status !== "active") {
      return { allowed: false, reason: "This organization is not currently active. Please contact your administrator." };
    }
    return { allowed: true, company };
  } catch (e) {
    // If the company lookup fails (e.g. network error), allow registration to proceed
    // so employees are not blocked by infrastructure issues
    console.warn("checkDomainAuthorization: could not verify company, allowing registration", e);
    return { allowed: true };
  }
};

// ----------------------------------------------------
// ROLES & PERMISSIONS
// ----------------------------------------------------

export const createRole = async (companyId, roleData) => {
  return apiFetch("/roles", {
    method: "POST",
    body: JSON.stringify({ ...roleData, companyId })
  });
};

export const updateRole = async (companyId, roleId, roleData) => {
  return apiFetch(`/roles/${roleId}`, {
    method: "PATCH",
    body: JSON.stringify(roleData)
  });
};

export const deleteRole = async (companyId, roleId) => apiFetch(`/roles/${roleId}`, { method: "DELETE" });

export const subscribeToRoles = (companyId, callback) => {
  let isMounted = true;
  const fetchRoles = () => {
    apiFetch(`/roles?companyId=${companyId || ""}`).then(data => {
      if (isMounted) {
        callback(Array.isArray(data) && data.length > 0 ? data : [
          { id: "role_admin", name: "Admin", permissions: { all: true } },
          { id: "role_employee", name: "Employee", permissions: { attendance: true, leaves: true, teamHub: true, tasks: true } }
        ]);
      }
    }).catch(() => {
      if (isMounted) {
        callback([
          { id: "role_admin", name: "Admin", permissions: { all: true } },
          { id: "role_employee", name: "Employee", permissions: { attendance: true, leaves: true, teamHub: true, tasks: true } }
        ]);
      }
    });
  };
  fetchRoles();
  const interval = setInterval(fetchRoles, 5000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

// ----------------------------------------------------
// ENVIRONMENT SETTINGS
// ----------------------------------------------------

export const addEnvironmentSetting = async (companyId, settingData) => {
  return apiFetch("/environment-settings", {
    method: "POST",
    body: JSON.stringify({ ...settingData, companyId })
  });
};

export const updateEnvironmentSetting = async (companyId, id, settingData) => {
  return apiFetch(`/environment-settings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(settingData)
  });
};

export const deleteEnvironmentSetting = async (companyId, id) => apiFetch(`/environment-settings/${id}`, { method: "DELETE" });

export const subscribeToEnvironmentSettings = (companyId, callback) => {
  let isMounted = true;
  const fetchSettings = () => {
    apiFetch(`/environment-settings?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchSettings();
  const interval = setInterval(fetchSettings, 5000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

// ----------------------------------------------------
// EXTERNAL LINKS
// ----------------------------------------------------

export const subscribeToExternalLinks = (companyId, callback) => {
  let isMounted = true;
  const fetchLinks = () => {
    apiFetch(`/external-links?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchLinks();
  const interval = setInterval(fetchLinks, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const generateExternalLink = async (arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) => {
  let payload;
  if (typeof arg1 === "object" && arg1 !== null) {
    payload = arg1;
  } else if (arg7 !== undefined) {
    // Called from ExternalLinksTab: (userId, companyId, projectId, projectName, pmId, pmName, clientEmail, clientName)
    payload = {
      userId: arg1,
      companyId: arg2,
      projectId: arg3,
      projectName: arg4,
      pmId: arg5,
      pmName: arg6,
      clientEmail: arg7,
      clientName: arg8
    };
  } else {
    payload = {
      clientName: arg1,
      clientEmail: arg2,
      projectId: arg3,
      projectName: arg4,
      pmId: arg5,
      pmName: arg6,
      channelId: arg7,
      companyId: arg8
    };
  }
  return apiFetch("/external-links", {
    method: "POST",
    body: JSON.stringify(payload)
  });
};

export const revokeExternalLink = async (linkId, companyId) => {
  return apiFetch(`/external-links/${linkId}/revoke`, {
    method: "PATCH",
    body: JSON.stringify({ companyId })
  });
};

export const getExternalLinkByToken = async (token) => {
  try {
    return await apiFetch(`/external-links/token/${token}`);
  } catch (e) {
    return null;
  }
};

// ----------------------------------------------------
// NOTIFICATIONS & REPORTS
// ----------------------------------------------------

export const createNotification = async () => true;
export const subscribeToNotifications = (userId, callback) => {
  callback([]);
  return () => {};
};
export const markNotificationRead = async () => true;

export const subscribeToDailyReports = (companyId, callback) => {
  let isMounted = true;
  const fetchDaily = () => {
    apiFetch(`/reports/daily?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchDaily();
  const interval = setInterval(fetchDaily, 4000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const subscribeToMyDailyReports = (userId, callback) => {
  let isMounted = true;
  const fetchMyDaily = () => {
    apiFetch(`/reports/daily?userId=${userId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchMyDaily();
  const interval = setInterval(fetchMyDaily, 4000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const addDailyReport = async (reportData) => {
  return apiFetch("/reports/daily", {
    method: "POST",
    body: JSON.stringify(reportData)
  });
};

export const updateDailyReport = async (reportId, updates) => {
  return apiFetch(`/reports/daily/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
};

export const deleteDailyReport = async (reportId) => {
  return apiFetch(`/reports/daily/${reportId}`, {
    method: "DELETE"
  });
};

export const subscribeToWeeklyReports = (companyId, callback) => {
  let isMounted = true;
  const fetchWeekly = () => {
    apiFetch(`/reports/weekly?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchWeekly();
  const interval = setInterval(fetchWeekly, 4000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const addWeeklyReport = async (reportData) => {
  return apiFetch("/reports/weekly", {
    method: "POST",
    body: JSON.stringify(reportData)
  });
};

export const updateWeeklyReport = async (reportId, updates) => {
  return apiFetch(`/reports/weekly/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
};

export const deleteWeeklyReport = async (reportId) => {
  return apiFetch(`/reports/weekly/${reportId}`, {
    method: "DELETE"
  });
};

// ----------------------------------------------------
// COMPANY DOMAINS
// ----------------------------------------------------
export const getCompanyDomains = async (companyId) => {
  return apiFetch(`/companies/domains?companyId=${companyId || ""}`);
};

export const subscribeToCompanyDomains = (companyId, callback) => {
  let isMounted = true;
  const fetchDomains = () => {
    apiFetch(`/companies/domains?companyId=${companyId || ""}`).then(data => {
      if (isMounted) callback(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) callback([]);
    });
  };
  fetchDomains();
  const interval = setInterval(fetchDomains, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
};

export const addCompanyDomain = async (companyId, domain) => {
  return apiFetch("/companies/domains", {
    method: "POST",
    body: JSON.stringify({ companyId, domain })
  });
};

export const deleteCompanyDomain = async (domain) => {
  return apiFetch(`/companies/domains/${encodeURIComponent(domain)}`, {
    method: "DELETE"
  });
};

export const verifyCompanyDomain = async (domain) => {
  return apiFetch(`/companies/domains/${encodeURIComponent(domain)}/verify`, {
    method: "POST"
  });
};

export const sendRegistrationLinkEmail = async (companyId, email) => {
  return apiFetch(`/companies/${companyId}/send-registration-link`, {
    method: "POST",
    body: JSON.stringify({ email })
  });
};

export const getLandingPageConfig = async () => null;
export const updateLandingPageConfig = async () => true;

export const db = null;
export default { apiFetch };
