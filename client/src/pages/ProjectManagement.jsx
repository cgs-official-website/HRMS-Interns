import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext"; // Vite cache bust
import { useToast } from "../context/ToastContext";
import { 
  createNotification, 
  subscribeToAllUsers,
  subscribeToTaskReports,
  subscribeToDailyReports,
  updateDailyReport,
  subscribeToProjects,
  createProject,
  deleteProject,
  updateProject,
  subscribeToWeeklyReports,
  addWeeklyReport,
  updateWeeklyReport,
  deleteWeeklyReport,
  updateUserTasks,
  updateUserProjects,
  updateUserRecord
} from "../firebase";
import { useModal } from "../context/ModalContext";
import { Search, Plus, Calendar, Clock, Edit2, Trash2, CheckCircle, XCircle, ChevronRight, UserPlus, Users, X, FileText, Download, MessageSquare, Briefcase, Sparkles, Zap, Eye, AlertCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from '../assets/zuna-logo.png';
import { addStandardPDFHeader, addPDFFooter } from "../utils/pdfHeader";
import * as XLSX from "xlsx";
import ClientChatsPMTab from "../components/ClientChatsPMTab";
import FileCard from "../components/FileCard";

export default function ProjectManagement() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);

  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [projectManagerId, setProjectManagerId] = useState("");
  const [projectStatus, setProjectStatus] = useState("Ongoing");
  const [customProjectStatus, setCustomProjectStatus] = useState("");

  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjectData, setEditProjectData] = useState(null);
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [selectedUserForTeam, setSelectedUserForTeam] = useState("");
  const [adminProjectInput, setAdminProjectInput] = useState("");
  const [filterProject, setFilterProject] = useState("All");
  const [filterDesignation, setFilterDesignation] = useState("All");
  
  const [selectedPmProjects, setSelectedPmProjects] = useState([]);
  const [adminEditProjectsInput, setAdminEditProjectsInput] = useState("");
  const [editProjects, setEditProjects] = useState([]);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTargetUser, setTaskTargetUser] = useState(null);
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDuration, setNewTaskDuration] = useState(1);
  const [newTaskProject, setNewTaskProject] = useState("");
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);

  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  const [editDesignation, setEditDesignation] = useState("");

  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showMemberReportsModal, setShowMemberReportsModal] = useState(false);
  const [selectedMemberForReports, setSelectedMemberForReports] = useState(null);
  const [allTaskReports, setAllTaskReports] = useState({});

  const [memberFilterDate, setMemberFilterDate] = useState("");
  const [memberFilterMonth, setMemberFilterMonth] = useState("");
  const [memberFilterProject, setMemberFilterProject] = useState("All");

  // Daily Activity Log States
  const [activeSubTab, setActiveSubTab] = useState("projects"); // "projects" | "team" | "daily-logs"
  const [dailyReports, setDailyReports] = useState([]);
  const [logFilterEmployee, setLogFilterEmployee] = useState("All");
  const [logFilterFromDate, setLogFilterFromDate] = useState("");
  const [logFilterToDate, setLogFilterToDate] = useState("");
  const [logFilterStatus, setLogFilterStatus] = useState("All");
  const [projectFilterStatus, setProjectFilterStatus] = useState("All");
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [selectedReportForRemarks, setSelectedReportForRemarks] = useState(null);
  const [remarksText, setRemarksText] = useState("");
  const [remarksStatus, setRemarksStatus] = useState("Completed");
  const [logCurrentPage, setLogCurrentPage] = useState(1);

  // Weekly Reports States
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [showAddWeeklyReportModal, setShowAddWeeklyReportModal] = useState(false);
  const [showViewWeeklyReportModal, setShowViewWeeklyReportModal] = useState(false);
  const [selectedWeeklyReport, setSelectedWeeklyReport] = useState(null);
  
  const [weeklyReportEmployee, setWeeklyReportEmployee] = useState("");
  const [weeklyReportStartDate, setWeeklyReportStartDate] = useState("");
  const [weeklyReportEndDate, setWeeklyReportEndDate] = useState("");
  const [weeklyReportRating, setWeeklyReportRating] = useState("Good");
  const [weeklyReportTasks, setWeeklyReportTasks] = useState("");
  const [weeklyReportRemarks, setWeeklyReportRemarks] = useState("");

  const [weeklyFilterEmployee, setWeeklyFilterEmployee] = useState("All");
  const [weeklyFilterFromDate, setWeeklyFilterFromDate] = useState("");
  const [weeklyFilterToDate, setWeeklyFilterToDate] = useState("");
  const [weeklyFilterRating, setWeeklyFilterRating] = useState("All");
  const [weeklyCurrentPage, setWeeklyCurrentPage] = useState(1);

  const pmProjects = currentUser?.projects?.length ? currentUser.projects : (currentUser?.project ? [currentUser.project] : []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToAllUsers(currentUser.companyId, (users) => {
      const userList = Array.isArray(users) ? users : [];
      setAllUsers(userList);

      if (currentUser.role === "admin") {
        setTeamMembers(userList.filter(u => u.role !== "admin"));
      } else {
        const currentUserProjects = currentUser.projects?.length ? currentUser.projects : (currentUser.project ? [currentUser.project] : []);
        setTeamMembers(userList.filter(u => {
          const uProjects = u.projects?.length ? u.projects : (u.project ? [u.project] : []);
          return uProjects.some(p => currentUserProjects.includes(p));
        }));
      }

      if (taskTargetUser) {
        const updatedTarget = userList.find(u => u.uid === taskTargetUser.uid);
        if (updatedTarget) setTaskTargetUser(updatedTarget);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, taskTargetUser?.uid]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToProjects(currentUser.companyId, (data, err) => {
      if (err) {
        setProjectsError("Unable to load projects.");
      } else {
        setProjects(data || []);
        setProjectsError(null);
      }
      setProjectsLoading(false);
    });
    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (teamMembers.length > 0) {
      const allTaskIds = teamMembers.flatMap(m => (m.tasks || []).map(t => t.id));
      const unsubs = [];
      
      allTaskIds.forEach(taskId => {
        const unsub = subscribeToTaskReports(taskId, (reports) => {
          setAllTaskReports(prev => ({ ...prev, [taskId]: reports }));
        });
        unsubs.push(unsub);
      });
      
      return () => {
        unsubs.forEach(fn => fn());
      };
    }
  }, [teamMembers]);

  // Subscribe to all daily reports
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToDailyReports(currentUser.companyId, (data) => {
      setDailyReports(data || []);
    });
    return unsubscribe;
  }, [currentUser]);

  // Subscribe to weekly reports
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToWeeklyReports(currentUser.companyId, (data) => {
      setWeeklyReports(data || []);
    });
    return unsubscribe;
  }, [currentUser]);

  // Helper to calculate Monday to Friday of a given date (default current week)
  const getWeekRange = (targetDate = new Date()) => {
    let d;
    if (typeof targetDate === "string") {
      const cleanDate = targetDate.includes("T") ? targetDate.split("T")[0] : targetDate;
      const parts = cleanDate.split("-");
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
      } else {
        d = new Date(targetDate);
      }
    } else {
      d = new Date(targetDate);
    }
    
    const day = d.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diffToMonday);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    const formatYMD = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dayNum = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${dayNum}`;
    };

    return {
      start: formatYMD(monday),
      end: formatYMD(friday)
    };
  };

  // Helper to get all distinct week ranges with daily logs for an employee (or all team members)
  const getAvailableWeeksForEmployee = (empId) => {
    const logs = empId ? dailyReports.filter(r => r.userId === empId) : dailyReports;
    const weekMap = new Map();
    
    logs.forEach(log => {
      if (!log.date) return;
      const range = getWeekRange(log.date);
      const key = `${range.start}_${range.end}`;
      if (!weekMap.has(key)) {
        weekMap.set(key, {
          start: range.start,
          end: range.end,
          logCount: 1
        });
      } else {
        const item = weekMap.get(key);
        item.logCount += 1;
      }
    });

    return Array.from(weekMap.values()).sort((a, b) => b.start.localeCompare(a.start));
  };

  // Helper to aggregate Daily Reports into Weekly Report structure
  const generateWeeklyReportDataForEmployee = (empId, startDate, endDate) => {
    const employee = allUsers.find(u => u.uid === empId);
    if (!employee) return null;

    const employeeLogs = dailyReports.filter(report => {
      if (report.userId !== empId || !report.date) return false;
      const reportDate = report.date.includes("T") ? report.date.split("T")[0] : report.date;
      return reportDate >= startDate && reportDate <= endDate;
    });

    // Sort logs chronologically
    employeeLogs.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    let tasksStr = "";
    let totalHours = 0;
    let completedCount = 0;

    employeeLogs.forEach(log => {
      const hours = parseFloat(log.hours || 0);
      totalHours += hours;
      if (log.status === "Completed") completedCount++;
      tasksStr += `• [${log.date}] ${log.tasksCompleted || "Worked on tasks"} (${hours}h)${log.issuesFaced && log.issuesFaced !== "None" ? ` [Issue: ${log.issuesFaced}]` : ""}\n`;
    });

    const rating = totalHours >= 35 ? "Excellent" : totalHours >= 20 ? "Good" : totalHours > 0 ? "Average" : "Needs Improvement";
    const remarks = employeeLogs.length > 0
      ? `Total Hours Logged: ${totalHours}h across ${employeeLogs.length} active day(s). Completed ${completedCount}/${employeeLogs.length} logged tasks.`
      : "No daily logs found for this period.";

    return {
      employeeId: empId,
      employeeName: employee.name || "Unknown",
      weekStartDate: startDate,
      weekEndDate: endDate,
      tasksCompleted: tasksStr.trim() || "No daily tasks logged for this week.",
      supervisorRemarks: remarks,
      rating,
      totalHours,
      logCount: employeeLogs.length
    };
  };

  // Auto-generate weekly report fields based on selected employee and date range
  useEffect(() => {
    if (showAddWeeklyReportModal && weeklyReportEmployee && weeklyReportStartDate && weeklyReportEndDate) {
      const genData = generateWeeklyReportDataForEmployee(weeklyReportEmployee, weeklyReportStartDate, weeklyReportEndDate);
      if (genData) {
        setWeeklyReportTasks(genData.tasksCompleted);
        setWeeklyReportRemarks(genData.supervisorRemarks);
        setWeeklyReportRating(genData.rating);
      }
    }
  }, [weeklyReportEmployee, weeklyReportStartDate, weeklyReportEndDate, dailyReports, showAddWeeklyReportModal]);

  const calculateTimeSpent = (reports) => {
    if (!reports || reports.length === 0) return 0;
    let totalMinutes = 0;
    reports.forEach(r => {
      const matchH = r.reportText.match(/(\d+)\s*h/i);
      const matchM = r.reportText.match(/(\d+)\s*m/i);
      if (matchH) totalMinutes += parseInt(matchH[1], 10) * 60;
      if (matchM) totalMinutes += parseInt(matchM[1], 10);
    });
    return totalMinutes / 60; // returns hours
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    const titleText = "PROJECT TASK PERFORMANCE REPORTS";
    const subtitleText = `Project Manager: ${currentUser.name} | Consolidated Task Progress & Employee Updates`;
    const startY = await addStandardPDFHeader(doc, titleText, subtitleText);
    
    const tableData = [];
    teamMembers.forEach(m => {
      (m.tasks || []).forEach(t => {
        const status = t.completed ? "Done" : "Active";
        tableData.push([
          { content: m.name, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: t.title, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: status, styles: { fillColor: status === "Done" ? [220, 252, 231] : [254, 243, 199], textColor: status === "Done" ? [21, 128, 61] : [161, 98, 7], fontStyle: 'bold', halign: 'center' } },
          { content: `${t.duration || 0}h`, styles: { fillColor: [241, 245, 249], halign: 'right', fontStyle: 'bold' } }
        ]);
        
        const reports = allTaskReports[t.id] || [];
        if (reports.length > 0) {
          reports.forEach(r => {
            const reportDate = r.timestamp || r.createdAt || r.submittedAt;
            tableData.push([
              "",
              { content: `• Update: ${r.reportText}`, colSpan: 2, styles: { textColor: [51, 65, 85], cellPadding: { left: 8, top: 2.5, bottom: 2.5 } } },
              { content: reportDate ? new Date(reportDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—", styles: { fontSize: 7.5, textColor: [100, 116, 139], cellPadding: { top: 2.5, bottom: 2.5 }, halign: 'right' } }
            ]);
          });
        } else {
          tableData.push([
            "",
            { content: "No updates reported yet", colSpan: 3, styles: { fontStyle: 'italic', textColor: [148, 163, 184], cellPadding: { left: 8, top: 2.5, bottom: 2.5 } } }
          ]);
        }
      });
    });

    if (tableData.length === 0) {
      showToast("No data to export", "warning");
      return;
    }

    autoTable(doc, {
      head: [["Employee", "Task Details", "Status", "Duration"]],
      body: tableData,
      startY: startY,
      styles: { fontSize: 8.5, font: "helvetica", cellPadding: 3.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "left" },
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 85 }, 2: { cellWidth: 25, halign: 'center' }, 3: { cellWidth: 30, halign: 'right' } },
      theme: 'grid',
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    
    addPDFFooter(doc);
    doc.save(`Project_Reports_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("Project task reports PDF exported!", "success");
  };

  const handleDownloadExcel = () => {
    const tableData = [];
    teamMembers.forEach(m => {
      (m.tasks || []).forEach(t => {
        const status = t.completed ? "Done" : "Active";
        tableData.push({
          "Employee": m.name,
          "Task Title": t.title,
          "Status": status,
          "Est. Hours": t.duration || 0,
          "Update Detail": "--- Task Summary ---",
          "Update Timestamp": ""
        });
        
        const reports = allTaskReports[t.id] || [];
        if (reports.length > 0) {
          reports.forEach(r => {
            const reportDate = r.timestamp || r.createdAt || r.submittedAt;
            tableData.push({
              "Employee": "",
              "Task Title": "",
              "Status": "",
              "Est. Hours": "",
              "Update Detail": r.reportText,
              "Update Timestamp": reportDate ? new Date(reportDate).toLocaleString() : ""
            });
          });
        } else {
          tableData.push({
            "Employee": "",
            "Task Title": "",
            "Status": "",
            "Est. Hours": "",
            "Update Detail": "No updates reported yet",
            "Update Timestamp": ""
          });
        }
      });
    });

    if (tableData.length === 0) {
      showToast("No data to export", "warning");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Project Reports");
    XLSX.writeFile(wb, `Project_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadDailyLogsPDF = async () => {
    const filteredReports = dailyReports.filter(r => {
      const isManaged = currentUser.role === "admin" || teamMembers.some(member => member.uid === r.userId);
      if (!isManaged) return false;

      const matchEmployee = logFilterEmployee === "All" || r.userId === logFilterEmployee;
      
      let matchDate = true;
      if (logFilterFromDate) {
        matchDate = matchDate && new Date(r.date) >= new Date(logFilterFromDate);
      }
      if (logFilterToDate) {
        matchDate = matchDate && new Date(r.date) <= new Date(logFilterToDate);
      }
      
      const matchStatus = logFilterStatus === "All" || r.status === logFilterStatus;

      return matchEmployee && matchDate && matchStatus;
    });

    if (filteredReports.length === 0) {
      return showToast("No daily logs to export.", "warning");
    }

    const doc = new jsPDF("l", "mm", "a4");
    const titleText = "DAILY ACTIVITY LOGS REPORT";
    const subtitleText = "Detailed daily progress, hours worked, completed tasks, and supervisor evaluations across team members.";
    const startY = await addStandardPDFHeader(doc, titleText, subtitleText, true);

    const bodyData = filteredReports.map((report, idx) => [
      idx + 1,
      report.userName || "—",
      report.date || "—",
      report.day || "—",
      `${report.hours || 0} h`,
      report.tasksCompleted || "—",
      report.issuesFaced || "—",
      report.supervisorRemarks || "—",
      report.status || "—"
    ]);

    autoTable(doc, {
      startY: startY + 2,
      head: [["#", "Candidate Name", "Date", "Day", "Hours", "Tasks Completed", "Issues Faced", "Supervisor Remarks", "Status"]],
      body: bodyData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, font: "helvetica", overflow: "linebreak", lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 35 },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 15, halign: "center" },
        5: { cellWidth: 55 },
        6: { cellWidth: 42 },
        7: { cellWidth: 42 },
        8: { cellWidth: 32, halign: "center" }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      didParseCell: (data) => {
        if (data.row.index >= 0 && data.column.index === 8) {
          const statusVal = data.cell.text[0];
          if (statusVal === "Completed") {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = "bold";
          } else if (statusVal === "On Hold") {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [153, 27, 27];
            data.cell.styles.fontStyle = "bold";
          } else if (statusVal === "In Progress") {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    });

    addPDFFooter(doc);
    const fileName = `Daily_Report_Log_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    showToast("Daily activity log PDF exported successfully.", "success");
  };

  const handleDownloadDailyLogsExcel = () => {
    const filteredReports = dailyReports.filter(r => {
      const isManaged = currentUser.role === "admin" || teamMembers.some(member => member.uid === r.userId);
      if (!isManaged) return false;

      const matchEmployee = logFilterEmployee === "All" || r.userId === logFilterEmployee;
      
      let matchDate = true;
      if (logFilterFromDate) {
        matchDate = matchDate && new Date(r.date) >= new Date(logFilterFromDate);
      }
      if (logFilterToDate) {
        matchDate = matchDate && new Date(r.date) <= new Date(logFilterToDate);
      }
      
      const matchStatus = logFilterStatus === "All" || r.status === logFilterStatus;

      return matchEmployee && matchDate && matchStatus;
    });

    if (filteredReports.length === 0) {
      return showToast("No daily logs to export.", "warning");
    }

    const titleRow = ["DAILY REPORT LOG"];
    const subtitleRow = ["Log each intern's daily activity below | All fields required | Rows auto-highlight based on status"];
    const emptyRow = [];
    const headerRow = ["#", "Candidate Name", "Date", "Day (Auto)", "Hours", "Tasks Completed", "Issues Faced", "Supervisor Remarks", "Status"];

    const aoaData = [
      titleRow,
      subtitleRow,
      emptyRow,
      headerRow,
      ...filteredReports.map((report, idx) => [
        idx + 1,
        report.userName || "",
        report.date || "",
        report.day || "",
        report.hours || 0,
        report.tasksCompleted || "",
        report.issuesFaced || "",
        report.supervisorRemarks || "",
        report.status || ""
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Report Log");

    ws["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 40 },
      { wch: 30 },
      { wch: 30 },
      { wch: 15 }
    ];

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
    ];

    const fileName = `Daily_Report_Log_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast("Excel spreadsheet generated successfully.", "success");
  };

  const handleDownloadWeeklyReportsPDF = async () => {
    if (filteredWeeklyReports.length === 0) {
      return showToast("No weekly reports to export.", "warning");
    }

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const selectedEmp = weeklyFilterEmployee !== "All" 
      ? allUsers.find(u => u.uid === weeklyFilterEmployee)?.name 
      : null;
    const titleText = selectedEmp 
      ? `WEEKLY APPRAISAL REPORT — ${selectedEmp.toUpperCase()}` 
      : "TEAM WEEKLY PERFORMANCE & ACTIVITY REPORTS";
    const subtitleText = "Consolidated weekly task activities, performance ratings, and supervisor evaluations across team members.";
    const startY = await addStandardPDFHeader(doc, titleText, subtitleText, true);

    let currentY = startY;

    // ── Metric KPI Summary Ribbon at top ──────────────────────────
    const totalCount = filteredWeeklyReports.length;
    const excellentCount = filteredWeeklyReports.filter(r => r.rating === "Excellent").length;
    const goodCount = filteredWeeklyReports.filter(r => r.rating === "Good").length;
    const averageCount = filteredWeeklyReports.filter(r => r.rating === "Average").length;
    const needsImpCount = filteredWeeklyReports.filter(r => r.rating === "Needs Improvement").length;

    const kpiBoxWidth = (pageWidth - 28) / 5;
    const kpiBoxHeight = 11;
    const kpis = [
      { label: "TOTAL REPORTS", val: `${totalCount}`, color: [79, 70, 229], bg: [238, 242, 255] },
      { label: "EXCELLENT", val: `${excellentCount}`, color: [21, 128, 61], bg: [220, 252, 231] },
      { label: "GOOD", val: `${goodCount}`, color: [30, 64, 175], bg: [219, 234, 254] },
      { label: "AVERAGE", val: `${averageCount}`, color: [146, 64, 14], bg: [254, 243, 199] },
      { label: "NEEDS IMP.", val: `${needsImpCount}`, color: [153, 27, 27], bg: [254, 226, 226] }
    ];

    kpis.forEach((kpi, idx) => {
      const x = 14 + idx * kpiBoxWidth;
      doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
      doc.setDrawColor(kpi.bg[0] * 0.9, kpi.bg[1] * 0.9, kpi.bg[2] * 0.9);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, currentY, kpiBoxWidth - 2, kpiBoxHeight, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, x + 3.5, currentY + 4);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.text(kpi.val, x + 3.5, currentY + 9);
    });

    currentY += kpiBoxHeight + 4;

    const bodyData = filteredWeeklyReports.map((report, idx) => [
      idx + 1,
      report.employeeName || "—",
      `${report.weekStartDate || "—"} to ${report.weekEndDate || "—"}`,
      report.rating || "Good",
      report.tasksCompleted || "—",
      report.supervisorRemarks || "—"
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Employee Name", "Week Range", "Rating", "Tasks & Activities Completed", "Supervisor Remarks"]],
      body: bodyData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3.5, font: "helvetica", overflow: "linebreak", lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 35, fontStyle: "bold" },
        2: { cellWidth: 38, halign: "center" },
        3: { cellWidth: 26, halign: "center" },
        4: { cellWidth: 93 },
        5: { cellWidth: 67 }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      didParseCell: (data) => {
        if (data.row.index >= 0 && data.column.index === 3) {
          const rating = data.cell.text[0];
          data.cell.styles.fontStyle = "bold";
          if (rating === "Excellent") {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [21, 128, 61];
          } else if (rating === "Good") {
            data.cell.styles.fillColor = [219, 234, 254];
            data.cell.styles.textColor = [30, 64, 175];
          } else if (rating === "Average") {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
          } else if (rating === "Needs Improvement") {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [153, 27, 27];
          }
        }
      }
    });

    addPDFFooter(doc);
    const fileName = `Weekly_Reports_${weeklyFilterEmployee !== 'All' ? selectedEmp?.replace(/\s+/g, '_') + '_' : ''}${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    showToast("Weekly reports PDF exported successfully.", "success");
  };

  const handleDownloadSingleWeeklyReportPDF = async (report) => {
    if (!report) return;

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleText = "WEEKLY PERFORMANCE REPORT";
    const subtitleText = `Employee: ${report.employeeName} | Reporting Period: ${report.weekStartDate} to ${report.weekEndDate}`;
    const startY = await addStandardPDFHeader(doc, titleText, subtitleText, false);

    let currentY = startY;

    // 1. Employee & Appraisal Summary Card (2-column key info block)
    const cardX = 14;
    const cardWidth = pageWidth - 28;
    const cardHeight = 28;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 3, 3, "FD");

    // Left Col: Employee Name & Manager
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("EMPLOYEE NAME", cardX + 6, currentY + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(report.employeeName || "Unknown", cardX + 6, currentY + 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("SUPERVISOR / MANAGER", cardX + 6, currentY + 19);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(currentUser.name || "Project Manager", cardX + 6, currentY + 24);

    // Mid Col: Week Range & Status
    const midColX = cardX + (cardWidth / 2) - 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("REPORTING PERIOD", midColX, currentY + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${report.weekStartDate} to ${report.weekEndDate}`, midColX, currentY + 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("SUBMISSION STATUS", midColX, currentY + 19);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(21, 128, 61);
    doc.text("Verified & Approved", midColX, currentY + 24);

    // Right Col: Performance Rating Badge
    const rightColX = cardX + cardWidth - 44;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("PERFORMANCE RATING", rightColX - 6, currentY + 7);

    // Rating Badge Pill
    const rating = report.rating || "Good";
    let badgeBg = [219, 234, 254];
    let badgeText = [30, 64, 175];
    if (rating === "Excellent") {
      badgeBg = [220, 252, 231];
      badgeText = [21, 128, 61];
    } else if (rating === "Average") {
      badgeBg = [254, 243, 199];
      badgeText = [146, 64, 14];
    } else if (rating === "Needs Improvement") {
      badgeBg = [254, 226, 226];
      badgeText = [153, 27, 27];
    }

    doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
    doc.setDrawColor(badgeBg[0] * 0.9, badgeBg[1] * 0.9, badgeBg[2] * 0.9);
    doc.roundedRect(rightColX - 6, currentY + 10, 44, 12, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
    doc.text(rating.toUpperCase(), rightColX + 16, currentY + 17.5, { align: "center" });

    currentY += cardHeight + 6;

    // 2. Section Heading: Daily Tasks & Activities
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("1. WEEKLY DELIVERABLES & DAILY ACTIVITY BREAKDOWN", 14, currentY);
    currentY += 3;

    // Parse the tasks
    const rawLines = (report.tasksCompleted || "").split("\n").map(l => l.trim()).filter(Boolean);
    const parsedRows = [];

    rawLines.forEach((line, idx) => {
      const match = line.match(/^(?:•\s*)?\[(\d{4}-\d{2}-\d{2})\]\s*(.*)$/);
      if (match) {
        const date = match[1];
        let content = match[2];
        let hours = "—";
        const hoursMatch = content.match(/\((\d+(?:\.\d+)?h)\)/i);
        if (hoursMatch) {
          hours = hoursMatch[1];
          content = content.replace(/\((\d+(?:\.\d+)?h)\)/i, "").trim();
        }
        let issue = "None";
        const issueMatch = content.match(/\[Issue:\s*(.*?)\]/i);
        if (issueMatch) {
          issue = issueMatch[1];
          content = content.replace(/\[Issue:\s*(.*?)\]/i, "").trim();
        }
        parsedRows.push([idx + 1, date, hours, content, issue]);
      } else {
        parsedRows.push([idx + 1, "—", "—", line, "None"]);
      }
    });

    if (parsedRows.length === 0) {
      parsedRows.push([1, "—", "—", "No specific task entries recorded for this week.", "None"]);
    }

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Date", "Hours", "Deliverables & Tasks Accomplished", "Issues Reported"]],
      body: parsedRows,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3.5, font: "helvetica", overflow: "linebreak", lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 24, halign: "center" },
        2: { cellWidth: 16, halign: "center" },
        3: { cellWidth: 90 },
        4: { cellWidth: 44 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.row.index >= 0 && data.column.index === 4) {
          const val = data.cell.text[0];
          if (val && val !== "None" && val !== "—") {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    });

    let nextY = doc.lastAutoTable.finalY + 7;

    // Check if we need a new page for remarks & signature
    if (nextY > 230) {
      doc.addPage();
      nextY = 20;
    }

    // 3. Section Heading: Supervisor Evaluation & Remarks
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("2. SUPERVISOR APPRAISAL & REMARKS", 14, nextY);
    nextY += 3;

    const remarksBoxHeight = 22;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, nextY, pageWidth - 28, remarksBoxHeight, 2, 2, "FD");

    // Purple left accent on remarks box
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(14, nextY, 2.5, remarksBoxHeight, 1, 1, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitRemarks = doc.splitTextToSize(report.supervisorRemarks || "No additional supervisor remarks recorded for this evaluation period.", pageWidth - 38);
    doc.text(splitRemarks, 20, nextY + 7);

    nextY += remarksBoxHeight + 10;

    // Check space for signature
    if (nextY > 250) {
      doc.addPage();
      nextY = 20;
    }

    // 4. Sign-off Authorization Blocks
    const sigBoxWidth = (pageWidth - 36) / 2;
    const sigBoxHeight = 22;

    // Supervisor Signature Block
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, nextY, sigBoxWidth, sigBoxHeight, 2, 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("SUPERVISOR SIGNATURE & VERIFICATION", 18, nextY + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Name: ${currentUser.name}`, 18, nextY + 12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 18, nextY + 17.5);

    // Employee Acknowledgement Block
    const empSigX = 14 + sigBoxWidth + 8;
    doc.roundedRect(empSigX, nextY, sigBoxWidth, sigBoxHeight, 2, 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("EMPLOYEE ACKNOWLEDGEMENT", empSigX + 4, nextY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Name: ${report.employeeName}`, empSigX + 4, nextY + 12);
    doc.text("Status: Verified & Electronically Recorded", empSigX + 4, nextY + 17.5);

    // Add universal page footer
    addPDFFooter(doc);

    const safeName = (report.employeeName || "Employee").replace(/\s+/g, "_");
    doc.save(`Weekly_Report_${safeName}_${report.weekStartDate}.pdf`);
    showToast("Individual weekly report PDF exported successfully!", "success");
  };

  const handleDownloadWeeklyReportsExcel = () => {
    if (filteredWeeklyReports.length === 0) {
      return showToast("No weekly reports to export.", "warning");
    }

    const selectedEmp = weeklyFilterEmployee !== "All" 
      ? allUsers.find(u => u.uid === weeklyFilterEmployee)?.name 
      : null;

    const tableData = filteredWeeklyReports.map((report, idx) => ({
      "S.No": idx + 1,
      "Employee Name": report.employeeName || "—",
      "Week Start Date": report.weekStartDate || "—",
      "Week End Date": report.weekEndDate || "—",
      "Performance Rating": report.rating || "Good",
      "Tasks Completed / Daily Activities": report.tasksCompleted || "—",
      "Supervisor Remarks": report.supervisorRemarks || "—"
    }));

    const ws = XLSX.utils.json_to_sheet(tableData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 60 },
      { wch: 45 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Reports");
    const fileName = `Weekly_Reports_${weeklyFilterEmployee !== 'All' ? selectedEmp?.replace(/\s+/g, '_') + '_' : ''}${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast("Weekly reports Excel exported successfully.", "success");
  };

  const handleDeleteWeeklyReport = (report) => {
    showConfirm(
      "Delete Weekly Report",
      `Are you sure you want to delete the weekly report for ${report.employeeName} (${report.weekStartDate} to ${report.weekEndDate})?`,
      async () => {
        try {
          await deleteWeeklyReport(report.id);
          showToast("Weekly report deleted successfully.", "success");
        } catch (err) {
          console.error(err);
          showToast("Failed to delete weekly report.", "error");
        }
      },
      { confirmText: "Delete", cancelText: "Cancel", isDanger: true }
    );
  };

  const handleSaveRemarks = async (e) => {
    e.preventDefault();
    if (!selectedReportForRemarks) return;

    try {
      await updateDailyReport(selectedReportForRemarks.id, {
        supervisorRemarks: remarksText,
        status: remarksStatus
      });
      
      await createNotification(
        selectedReportForRemarks.userId,
        "Daily Log Reviewed",
        `Your daily activity log for ${selectedReportForRemarks.date} was reviewed. Remarks: "${remarksText}".`,
        remarksStatus === "Completed" ? "success" : "info",
        "/task-management"
      );

      showToast("Supervisor remarks updated successfully!", "success");
      setShowRemarksModal(false);
      setSelectedReportForRemarks(null);
      setRemarksText("");
    } catch (err) {
      showToast("Failed to save remarks.", "error");
    }
  };

  const getFilteredMemberTasks = () => {
    if (!selectedMemberForReports || !selectedMemberForReports.tasks) return [];
    
    return selectedMemberForReports.tasks.map(task => {
      const reports = allTaskReports[task.id] || [];
      const filteredReports = reports.filter(r => {
        if (r.reportText.startsWith("Worked for") || r.reportText.startsWith("Auto-stopped") || r.reportText.startsWith("Auto-paused")) return false;
        
        const reportDateVal = r.timestamp || r.createdAt || r.submittedAt;
        const reportDateObj = reportDateVal ? new Date(reportDateVal) : new Date();
        
        if (memberFilterDate) {
          if (reportDateObj.toISOString().split('T')[0] !== memberFilterDate) return false;
        }
        
        if (memberFilterMonth) {
          const reportMonth = reportDateObj.toISOString().substring(0, 7);
          if (reportMonth !== memberFilterMonth) return false;
        }
        
        return true;
      });

      return {
        ...task,
        filteredReports
      };
    }).filter(task => {
      if (memberFilterProject !== "All" && task.project !== memberFilterProject) return false;
      if ((memberFilterDate || memberFilterMonth) && task.filteredReports.length === 0) return false;
      return true;
    });
  };

  const handleMemberDownloadPDF = async () => {
    if (!selectedMemberForReports) return;
    
    const filteredTasks = getFilteredMemberTasks();
    if (filteredTasks.length === 0) {
      showToast("No data to export with current filters", "warning");
      return;
    }

    const doc = new jsPDF();
    const titleText = `Reports: ${selectedMemberForReports.name}`;
    const subtitleText = `Project Manager: ${currentUser.name} | Downloaded: ${new Date().toLocaleString()}`;
    let startY = await addStandardPDFHeader(doc, titleText, subtitleText);

    let filtersApplied = [];
    if (memberFilterDate) filtersApplied.push(`Date: ${memberFilterDate}`);
    if (memberFilterMonth) filtersApplied.push(`Month: ${memberFilterMonth}`);
    if (memberFilterProject !== "All") filtersApplied.push(`Project: ${memberFilterProject}`);
    if (filtersApplied.length > 0) {
       doc.setFontSize(9);
       doc.setTextColor(80, 80, 80);
       doc.text(`Filters: ${filtersApplied.join(' | ')}`, 14, startY);
       startY += 6;
    }
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, startY - 2, 196, startY - 2);

    const tableData = [];
    filteredTasks.forEach(t => {
      const status = t.completed ? "Done" : "Active";
      tableData.push([
        { content: t.title + (t.project ? ` (${t.project})` : ""), styles: { fontStyle: 'bold', fillColor: [243, 244, 246] } },
        { content: status, styles: { fillColor: [243, 244, 246], halign: 'center' } },
        { content: `${t.duration || 0}h`, styles: { fillColor: [243, 244, 246], halign: 'right' } }
      ]);
      
      if (t.filteredReports.length > 0) {
        t.filteredReports.forEach(r => {
          const reportDate = r.timestamp || r.createdAt || r.submittedAt;
          tableData.push([
            { content: `Update: ${r.reportText}`, colSpan: 2, styles: { textColor: [60, 60, 60], cellPadding: { left: 10, top: 3, bottom: 3 } } },
            { content: reportDate ? new Date(reportDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—", styles: { fontSize: 8, textColor: [120, 120, 120], cellPadding: { top: 3, bottom: 3 }, halign: 'right' } }
          ]);
        });
      } else {
        tableData.push([
          { content: "No updates reported yet", colSpan: 3, styles: { fontStyle: 'italic', textColor: [150, 150, 150], cellPadding: { left: 10, top: 3, bottom: 3 } } }
        ]);
      }
    });

    autoTable(doc, {
      head: [["Task Details", "Status", "Duration"]],
      body: tableData,
      startY: startY,
      styles: { fontSize: 8.5, font: "helvetica", cellPadding: 3.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "left" },
      columnStyles: { 0: { cellWidth: 115 }, 1: { halign: 'center', cellWidth: 25 }, 2: { halign: 'right', cellWidth: 42 } },
      theme: 'grid',
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    
    addPDFFooter(doc);
    doc.save(`Reports_${selectedMemberForReports.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("Member task reports PDF exported!", "success");
  };

  const handleMemberDownloadExcel = () => {
    if (!selectedMemberForReports) return;
    
    const filteredTasks = getFilteredMemberTasks();
    if (filteredTasks.length === 0) {
      showToast("No data to export with current filters", "warning");
      return;
    }

    const tableData = [];
    filteredTasks.forEach(t => {
      const status = t.completed ? "Done" : "Active";
      tableData.push({
        "Task Title": t.title,
        "Project": t.project || "",
        "Status": status,
        "Est. Hours": t.duration || 0,
        "Update Detail": "--- Task Summary ---",
        "Update Timestamp": ""
      });
      
      if (t.filteredReports.length > 0) {
        t.filteredReports.forEach(r => {
          const reportDate = r.timestamp || r.createdAt || r.submittedAt;
          tableData.push({
            "Task Title": "",
            "Project": "",
            "Status": "",
            "Est. Hours": "",
            "Update Detail": r.reportText,
            "Update Timestamp": reportDate ? new Date(reportDate).toLocaleString() : ""
          });
        });
      } else {
        tableData.push({
          "Task Title": "",
          "Project": "",
          "Status": "",
          "Est. Hours": "",
          "Update Detail": "No updates reported yet",
          "Update Timestamp": ""
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Member Reports");
    XLSX.writeFile(wb, `Reports_${selectedMemberForReports.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectNameInput || !projectStartDate || !projectEndDate || !projectManagerId) {
      return showToast("Please fill in all fields", "warning");
    }

    try {
      const selectedManager = allUsers.find(u => u.uid === projectManagerId);
      if (!selectedManager) return showToast("Selected manager not found", "error");

      const finalStatus = projectStatus === "Other" ? (customProjectStatus || "Ongoing") : projectStatus;
      const newProj = {
        name: projectNameInput,
        startDate: projectStartDate,
        endDate: projectEndDate,
        managerId: projectManagerId,
        teamMembers: [projectManagerId], // Manager is automatically a team member
        companyId: currentUser.companyId,
        status: finalStatus
      };

      await createProject(newProj);

      // Assign the project to the manager's profile, making them project manager
      const currentProjects = selectedManager.projects?.length ? selectedManager.projects : (selectedManager.project ? [selectedManager.project] : []);
      const newProjects = [...new Set([...currentProjects, projectNameInput])];
      await updateUserRecord(projectManagerId, { 
        projects: newProjects, 
        project: newProjects[0] || "",
        isProjectManager: true 
      });
      setShowCreateProjectModal(false);
      setProjectNameInput("");
      setProjectStartDate("");
      setProjectEndDate("");
      setProjectManagerId("");
      setProjectStatus("Ongoing");
      setCustomProjectStatus("");
      showToast("Project created successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to create project", "error");
    }
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!selectedUserForTeam) return showToast("Please select a user", "warning");
    
    const targetProjects = currentUser.role === "admin" 
      ? adminProjectInput.split(',').map(s=>s.trim()).filter(Boolean)
      : selectedPmProjects;
      
    if (!targetProjects.length) return showToast("Please specify a project", "warning");

    try {
      const u = allUsers.find(user => user.uid === selectedUserForTeam);
      const currentProjects = u?.projects?.length ? u.projects : (u?.project ? [u.project] : []);
      const newProjects = [...new Set([...currentProjects, ...targetProjects])];
      
      const updates = { projects: newProjects, project: newProjects[0] || "" };
      if (currentUser.role === "admin") updates.isProjectManager = true;
      await updateUserRecord(selectedUserForTeam, updates);
      showToast(currentUser.role === "admin" ? "Project assigned successfully" : "Team member added successfully", "success");
      setShowAddTeamModal(false);
      setSelectedUserForTeam("");
      setAdminProjectInput("");
      setSelectedPmProjects([]);
    } catch (err) {
      showToast("Failed to add member", "error");
    }
  };

  const handleRemoveMember = async (member) => {
    showConfirm("Remove Team Member", `Are you sure you want to remove ${member.name} from the project?`, async () => {
      try {
        await updateUserRecord(member.uid, { projects: [], project: "", tasks: [], isProjectManager: false });
        showToast(`${member.name} removed from the project`, "success");
      } catch (err) {
        showToast("Failed to remove member", "error");
      }
    }, { confirmText: "Remove", cancelText: "Cancel" });
  };

  const openEditMemberModal = (member) => {
    setMemberToEdit(member);
    setEditDesignation(member.designation || member.jobType || "");
    const currentMemberProjects = member.projects?.length ? member.projects : (member.project ? [member.project] : []);
    if (currentUser?.role === "admin") {
      setAdminEditProjectsInput(currentMemberProjects.join(", "));
    } else {
      const sharedProjects = currentMemberProjects.filter(p => pmProjects.includes(p));
      setEditProjects(sharedProjects);
    }
    setShowEditMemberModal(true);
  };

  const handleSaveMemberEdit = async (e) => {
    e.preventDefault();
    try {
      let updatedProjects = [];
      const currentProjects = memberToEdit.projects?.length ? memberToEdit.projects : (memberToEdit.project ? [memberToEdit.project] : []);
      
      if (currentUser.role === "admin") {
        updatedProjects = adminEditProjectsInput.split(',').map(s=>s.trim()).filter(Boolean);
      } else {
        const nonPmProjects = currentProjects.filter(p => !pmProjects.includes(p));
        updatedProjects = [...new Set([...nonPmProjects, ...editProjects])];
      }

      const updates = { 
        designation: editDesignation,
        projects: updatedProjects,
        project: updatedProjects[0] || ""
      };
      
      if (updatedProjects.length === 0) {
        updates.isProjectManager = false;
      }

      await updateUserRecord(memberToEdit.uid, updates);
      showToast("Member updated successfully", "success");
      setShowEditMemberModal(false);
    } catch (err) {
      showToast("Failed to update member", "error");
    }
  };

  const openTaskModal = (user) => {
    setTaskTargetUser(user);
    setNewTaskTitle("");
    setNewTaskDuration(1);
    const uProjects = user.projects?.length ? user.projects : (user.project ? [user.project] : []);
    setNewTaskProject(uProjects.length > 0 ? uProjects[0] : "General Task");
    setEditingTaskIndex(null);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return showToast("Task title is required", "warning");

    let currentTasks = [...(taskTargetUser.tasks || [])];
    
    if (editingTaskIndex !== null) {
      currentTasks[editingTaskIndex] = {
        ...currentTasks[editingTaskIndex],
        title: newTaskTitle,
        duration: newTaskDuration,
        project: newTaskProject
      };
    } else {
      currentTasks.push({
        id: "task_" + Date.now(),
        title: newTaskTitle,
        duration: newTaskDuration,
        project: newTaskProject,
        completed: false,
        assignedBy: currentUser.uid,
        assignedAt: new Date().toISOString()
      });
    }

    try {
      await updateUserTasks(taskTargetUser.uid, currentTasks);
      
      if (editingTaskIndex === null) {
        await createNotification(
          taskTargetUser.uid,
          "New Task Assigned",
          `You have been assigned a new task: "${newTaskTitle}" (${newTaskDuration}h) by ${currentUser.name}.`,
          "task",
          "/dashboard?tab=tasks"
        );
        showToast("Task assigned & user notified", "success");
      } else {
        showToast("Task updated successfully", "success");
      }

      setNewTaskTitle("");
      setNewTaskDuration(1);
      setNewTaskProject("");
      setEditingTaskIndex(null);
    } catch (err) {
      showToast("Failed to save task", "error");
    }
  };

  const handleEditProjectClick = (proj) => {
    if (currentUser?.role !== "admin") return; // Optional: Only admin edits projects, or PM can too? Let's allow admins and maybe PMs. Actually let's allow anyone who can see it, they can view it.
    const isStandardStatus = ["Ongoing", "Completed"].includes(proj.status || "Ongoing");
    setEditProjectData({
      id: proj.id,
      name: proj.name || "",
      startDate: proj.startDate !== "-" ? proj.startDate : "",
      endDate: proj.endDate !== "-" ? proj.endDate : "",
      managerId: proj.managerId || "",
      status: isStandardStatus ? (proj.status || "Ongoing") : "Other",
      customStatus: isStandardStatus ? "" : proj.status
    });
    setShowEditProjectModal(true);
  };

  const handleSaveProjectEdits = async (e) => {
    e.preventDefault();
    try {
      const finalStatus = editProjectData.status === "Other" ? (editProjectData.customStatus || "Ongoing") : editProjectData.status;
      const updates = {
        name: editProjectData.name,
        startDate: editProjectData.startDate,
        endDate: editProjectData.endDate,
        managerId: editProjectData.managerId,
        status: finalStatus
      };
      
      if (editProjectData.id?.startsWith("synth-")) {
        await createProject({
          ...updates,
          companyId: currentUser.companyId,
          teamMembers: [editProjectData.managerId]
        });
      } else {
        await updateProject(editProjectData.id, updates);
      }
      setShowEditProjectModal(false);
      showToast("Project updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update project", "error");
    }
  };

  const handleDeleteProject = async (project) => {
    showConfirm("Delete Project", `Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`, async () => {
      try {
        if (project.id?.startsWith('synth-')) {
          const usersToUpdate = allUsers.filter(u => 
            (u.projects && u.projects.includes(project.name)) || 
            u.project === project.name
          );
          for (const u of usersToUpdate) {
            const updatedProjects = (u.projects || []).filter(p => p !== project.name);
            const updatedProject = u.project === project.name ? "" : u.project;
            await updateUserRecord(u.uid, {
              projects: updatedProjects,
              project: updatedProject
            });
          }
        } else {
          await deleteProject(project.id);
        }
        showToast("Project deleted successfully", "success");
      } catch (error) {
        console.error(error);
        showToast("Failed to delete project", "error");
      }
    }, { confirmText: "Delete", cancelText: "Cancel" });
  };

  const handleDeleteTask = async (taskIdx) => {
    showConfirm("Delete Task", "Are you sure you want to delete this task?", async () => {
      let currentTasks = taskTargetUser.tasks || [];
      currentTasks.splice(taskIdx, 1);
      
      try {
        await updateUserTasks(taskTargetUser.uid, currentTasks);
        showToast("Task deleted", "success");
      } catch (err) {
        showToast("Failed to delete task", "error");
      }
    }, { confirmText: "Delete", cancelText: "Cancel" });
  };

  const uniqueProjects = Array.from(new Set(teamMembers.flatMap(m => m.projects?.length ? m.projects : (m.project ? [m.project] : [])))).filter(Boolean);
  const uniqueDesignations = Array.from(new Set(teamMembers.map(m => m.designation || m.jobType || "Unassigned"))).filter(Boolean).sort();

  const filteredTeam = teamMembers.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.designation || m.jobType || "Unassigned").toLowerCase().includes(searchQuery.toLowerCase());
    const mProjects = m.projects?.length ? m.projects : (m.project ? [m.project] : []);
    const matchesProject = filterProject === "All" || mProjects.includes(filterProject);
    const mDesignation = m.designation || m.jobType || "Unassigned";
    const matchesDesignation = filterDesignation === "All" || mDesignation === filterDesignation;
    return matchesSearch && matchesProject && matchesDesignation;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterProject, filterDesignation]);

  useEffect(() => {
    setLogCurrentPage(1);
  }, [logFilterEmployee, logFilterStatus, logFilterFromDate, logFilterToDate]);

  const totalPages = Math.ceil(filteredTeam.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeam = filteredTeam.slice(startIndex, startIndex + itemsPerPage);

  const syntheticProjects = uniqueProjects
    .filter(name => !projects.some(p => p.name?.toLowerCase() === name?.toLowerCase()))
    .map((name, idx) => {
      const team = allUsers.filter(u => (u.projects || []).some(p => p?.toLowerCase() === name?.toLowerCase()) || u.project?.toLowerCase() === name?.toLowerCase());
      const pm = team.find(u => u.isProjectManager || u.role?.toLowerCase()?.includes("manager"))
        || allUsers.find(u => u.name === "Mohamed Asfaque A")
        || allUsers.find(u => u.isProjectManager);
      return {
        id: `synth-${idx}`,
        name: name,
        startDate: "-",
        endDate: "-",
        managerId: pm?.uid || pm?.id || "h3MgS48nNlbN5GfPxsxkMLut6gc2",
        managerName: pm?.name || "Mohamed Asfaque A",
        status: "Ongoing",
        teamMembers: team.map(u => u.uid || u.id)
      };
    });

  const allCombinedProjects = [...projects, ...syntheticProjects];

  const visibleProjects = (currentUser?.role === "admin"
    ? allCombinedProjects
    : allCombinedProjects.filter(p => p.managerId === currentUser?.uid || p.manager_id === currentUser?.id || p.managerId === currentUser?.id || pmProjects.includes(p.name))
  ).filter(p => {
    const query = projectSearchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.managerName && p.managerName.toLowerCase().includes(query)) ||
      (p.status && p.status.toLowerCase().includes(query));
    const matchesStatus = projectStatusFilter === "All" || 
      (p.status || "Ongoing").toLowerCase() === projectStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const filteredReports = dailyReports.filter(r => {
    const isManaged = currentUser?.role === "admin" || teamMembers.some(member => member.uid === r.userId);
    if (!isManaged) return false;

    const matchEmployee = logFilterEmployee === "All" || r.userId === logFilterEmployee;
    const matchStatus = logFilterStatus === "All" || r.status === logFilterStatus;
    const matchFromDate = !logFilterFromDate || r.date >= logFilterFromDate;
    const matchToDate = !logFilterToDate || r.date <= logFilterToDate;

    return matchEmployee && matchStatus && matchFromDate && matchToDate;
  });

  const logsPerPage = 10;
  const logTotalPages = Math.ceil(filteredReports.length / logsPerPage) || 1;
  const logStartIndex = (logCurrentPage - 1) * logsPerPage;
  const paginatedLogs = filteredReports.slice(logStartIndex, logStartIndex + logsPerPage);

  const availableUsersToAdd = allUsers.filter(u => u.uid !== currentUser?.uid && u.role !== "admin");

  const hasAccess = currentUser?.role === "admin" || currentUser?.isProjectManager || currentUser?.role === "Project Manager" || currentUser?.name === "Mohamed Asfaque A";
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <h2 className="text-xl font-bold text-text-main mb-2">Access Denied</h2>
        <p className="text-text-sec text-sm">You do not have Project Manager privileges.</p>
      </div>
    );
  }

  const handleAddWeeklyReport = async (e) => {
    e.preventDefault();
    if (!weeklyReportEmployee || !weeklyReportStartDate || !weeklyReportEndDate) return;
    try {
      const employee = allUsers.find(u => u.uid === weeklyReportEmployee);
      await addWeeklyReport({
        companyId: currentUser.companyId,
        managerId: currentUser.uid,
        employeeId: weeklyReportEmployee,
        employeeName: employee?.name || "Unknown",
        weekStartDate: weeklyReportStartDate,
        weekEndDate: weeklyReportEndDate,
        rating: weeklyReportRating,
        tasksCompleted: weeklyReportTasks,
        supervisorRemarks: weeklyReportRemarks,
      });
      showToast("Weekly report created successfully!", "success");
      setShowAddWeeklyReportModal(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to create weekly report", "error");
    }
  };

  const handleAutoGenerateAllWeeklyReports = async () => {
    showConfirm(
      "Auto-Generate All Weekly Reports",
      "This will scan all team members' daily activity logs across ALL past and current weeks, automatically creating missing weekly reports. Proceed?",
      async () => {
        try {
          let createdCount = 0;

          for (const member of teamMembers) {
            const memberLogs = dailyReports.filter(r => r.userId === member.uid);
            if (memberLogs.length === 0) continue;

            // Collect all unique week ranges for this team member from their daily logs
            const uniqueWeeks = new Map();
            memberLogs.forEach(log => {
              if (!log.date) return;
              const range = getWeekRange(log.date);
              const key = `${range.start}_${range.end}`;
              if (!uniqueWeeks.has(key)) {
                uniqueWeeks.set(key, range);
              }
            });

            // Also check current week
            const currentWeek = getWeekRange(new Date());
            const currentKey = `${currentWeek.start}_${currentWeek.end}`;
            if (!uniqueWeeks.has(currentKey)) {
              uniqueWeeks.set(currentKey, currentWeek);
            }

            for (const range of uniqueWeeks.values()) {
              // Check if report already exists for this week & employee
              const alreadyExists = weeklyReports.some(
                r => r.employeeId === member.uid && r.weekStartDate === range.start && r.weekEndDate === range.end
              );
              if (alreadyExists) continue;

              const reportData = generateWeeklyReportDataForEmployee(member.uid, range.start, range.end);
              if (reportData && reportData.logCount > 0) {
                await addWeeklyReport({
                  companyId: currentUser.companyId,
                  managerId: currentUser.uid,
                  employeeId: member.uid,
                  employeeName: member.name,
                  weekStartDate: range.start,
                  weekEndDate: range.end,
                  rating: reportData.rating,
                  tasksCompleted: reportData.tasksCompleted,
                  supervisorRemarks: reportData.supervisorRemarks
                });
                createdCount++;
              }
            }
          }

          if (createdCount > 0) {
            showToast(`Successfully auto-generated ${createdCount} weekly report(s) across all weeks!`, "success");
          } else {
            showToast("All weekly reports are already generated and up to date.", "info");
          }
        } catch (err) {
          console.error(err);
          showToast("Failed to auto-generate weekly reports.", "error");
        }
      },
      { confirmText: "Generate All Weeks", cancelText: "Cancel" }
    );
  };

  const filteredWeeklyReports = weeklyReports.filter(r => {
    const isManaged = currentUser?.role === "admin" || teamMembers.some(m => m.uid === r.employeeId);
    if (!isManaged) return false;

    const matchEmployee = weeklyFilterEmployee === "All" || r.employeeId === weeklyFilterEmployee;
    const matchRating = weeklyFilterRating === "All" || r.rating === weeklyFilterRating;
    
    let matchDate = true;
    if (weeklyFilterFromDate) {
      matchDate = matchDate && r.weekStartDate >= weeklyFilterFromDate;
    }
    if (weeklyFilterToDate) {
      matchDate = matchDate && r.weekEndDate <= weeklyFilterToDate;
    }

    return matchEmployee && matchRating && matchDate;
  });

  const weeklyReportsPerPage = 10;
  const weeklyTotalPages = Math.ceil(filteredWeeklyReports.length / weeklyReportsPerPage) || 1;
  const weeklyStartIndex = (weeklyCurrentPage - 1) * weeklyReportsPerPage;
  const paginatedWeeklyReports = filteredWeeklyReports.slice(weeklyStartIndex, weeklyStartIndex + weeklyReportsPerPage);

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Project Management</h1>
          <p className="text-sm text-text-mut font-medium mt-1">
            {currentUser?.role === "admin" ? "Managing All Projects & Tasks" : (
              <>Managing Team for: <span className="font-bold text-brand-primary">{(currentUser.projects && currentUser.projects.length > 0) ? currentUser.projects.join(', ') : (currentUser.project || "Unassigned")}</span></>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowReportsModal(true)}
            className="bg-bg-base hover:bg-bg-card border border-border-card text-text-main text-xs font-bold py-2.5 px-4 rounded-[12px] flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <FileText size={16} className="text-brand-primary" />
            <span>Project Reports</span>
          </button>
          {currentUser?.role === "admin" ? (
            <button 
              onClick={() => setShowCreateProjectModal(true)}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-5 rounded-[12px] flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-primary/20 hover:shadow-brand-primary/40 cursor-pointer"
            >
              <Plus size={16} />
              <span>Create Project</span>
            </button>
          ) : (
            <button 
              onClick={() => {
                setSelectedPmProjects(pmProjects.length > 0 ? [pmProjects[0]] : []);
                setShowAddTeamModal(true);
              }}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-5 rounded-[12px] flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-primary/20 hover:shadow-brand-primary/40 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border-card mb-6">
        <button
          onClick={() => setActiveSubTab("projects")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === "projects"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-mut hover:text-text-main"
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveSubTab("team")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === "team"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-mut hover:text-text-main"
          }`}
        >
          My Team
        </button>
        <button
          onClick={() => setActiveSubTab("daily-logs")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === "daily-logs"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-mut hover:text-text-main"
          }`}
        >
          Daily Activity Logs
        </button>
        <button
          onClick={() => setActiveSubTab("weekly-reports")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === "weekly-reports"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-mut hover:text-text-main"
          }`}
        >
          Weekly Reports
        </button>
        <button
          onClick={() => setActiveSubTab("client-chats")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === "client-chats"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-mut hover:text-text-main"
          }`}
        >
          Client Chats
        </button>
      </div>

      {activeSubTab === "client-chats" ? (
        <ClientChatsPMTab currentUser={currentUser} />
      ) : activeSubTab === "projects" ? (
        <div className="bg-bg-card border border-border-card rounded-[24px] shadow-sm overflow-hidden text-left mb-6">
          <div className="p-6 border-b border-border-card bg-bg-base/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-base text-text-main tracking-tight">Active Projects</h3>
                <span className="text-[11px] font-bold bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full">{visibleProjects.length} Total</span>
              </div>
              <p className="text-xs text-text-mut mt-0.5">Database-driven project milestones, manager assignments, and deliverables.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Project Search Input */}
              <div className="relative w-full sm:w-52">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mut" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border-card rounded-[12px] text-xs text-text-main outline-none focus:border-brand-primary transition-all shadow-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-36">
                <select
                  value={projectStatusFilter}
                  onChange={(e) => setProjectStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-card border border-border-card rounded-[12px] text-xs font-semibold text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Testing">Testing</option>
                </select>
              </div>

              {/* Create Project Button */}
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => setShowCreateProjectModal(true)}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white rounded-[12px] text-xs font-bold transition-all shadow-md shadow-brand-primary/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Project</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-base/50 text-[10px] uppercase tracking-wider text-text-mut border-b border-border-card">
                  <th className="p-4 font-bold text-center w-12">#</th>
                  <th className="p-4 font-bold">Project Name</th>
                  <th className="p-4 font-bold text-center">Start Date</th>
                  <th className="p-4 font-bold text-center">End Date</th>
                  <th className="p-4 font-bold">Assigned Manager</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-center">Progress</th>
                  <th className="p-4 font-bold text-center">Teammates</th>
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projectsLoading ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-xs text-text-mut">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="animate-spin text-brand-primary" size={16} />
                        <span className="font-semibold">Loading projects...</span>
                      </div>
                    </td>
                  </tr>
                ) : projectsError ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-xs text-red-500">
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle size={16} />
                        <span className="font-bold">Unable to load projects.</span>
                      </div>
                    </td>
                  </tr>
                ) : visibleProjects.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-xs text-text-mut italic">
                      No projects found. {currentUser?.role === "admin" && 'Click "Create Project" to start.'}
                    </td>
                  </tr>
                ) : (
                  visibleProjects.map((proj, idx) => {
                    const manager = allUsers.find(u => u.uid === proj.managerId || u.id === proj.managerId || (proj.managerName && u.name === proj.managerName));
                    const managerName = proj.managerName || manager?.name || (proj.name ? "Mohamed Asfaque A" : "Unassigned");
                    const pStatus = proj.status || "Ongoing";
                    const isCompleted = pStatus.toLowerCase() === "completed";
                    const isInProgress = pStatus.toLowerCase().includes("progress") || pStatus.toLowerCase() === "ongoing";

                    return (
                      <tr 
                        key={proj.id || idx} 
                        onClick={() => {
                          setSelectedProjectForDetails(proj);
                          setShowProjectDetailsModal(true);
                        }}
                        className="border-b border-border-card/50 hover:bg-bg-base/40 transition-colors text-xs text-text-sec cursor-pointer group"
                      >
                        <td className="p-4 text-center font-bold text-text-mut">{idx + 1}</td>
                        <td className="p-4 font-bold text-text-main">
                          <div className="flex items-center gap-2">
                            <span>{proj.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono text-[11px]">{proj.startDate || proj.start_date || "-"}</td>
                        <td className="p-4 text-center font-mono text-[11px]">{proj.endDate || proj.end_date || "-"}</td>
                        <td className="p-4 font-semibold text-brand-primary">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold flex items-center justify-center">
                              {managerName.charAt(0).toUpperCase()}
                            </div>
                            <span>{managerName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                            isInProgress ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                            "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}>
                            {pStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-center max-w-[120px] mx-auto">
                            <div className="flex justify-between w-full text-[10px] font-bold text-text-mut">
                              <span>{proj.taskCount ? `${proj.completedTaskCount || 0}/${proj.taskCount}` : "0 tasks"}</span>
                              <span>{proj.progress ?? 0}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden border border-border-card/40">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  (proj.progress ?? 0) === 100 ? "bg-emerald-500" :
                                  (proj.progress ?? 0) > 0 ? "bg-brand-primary" : "bg-transparent"
                                }`}
                                style={{ width: `${proj.progress ?? 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-brand-primary/10 text-brand-primary font-bold px-2.5 py-1 rounded-full text-[10px]">
                            {proj.teamMembers?.length || 0} Members
                          </span>
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedProjectForDetails(proj);
                                setShowProjectDetailsModal(true);
                              }}
                              className="text-text-mut hover:text-brand-primary hover:bg-brand-primary/10 p-1.5 rounded-full transition-colors cursor-pointer"
                              title="View Project Details"
                            >
                              <Eye size={14} />
                            </button>
                            {currentUser?.role === "admin" && (
                              <>
                                <button
                                  onClick={() => handleEditProjectClick(proj)}
                                  className="text-text-mut hover:text-blue-500 hover:bg-blue-500/10 p-1.5 rounded-full transition-colors cursor-pointer"
                                  title="Edit Project"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(proj)}
                                  className="text-text-mut hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-full transition-colors cursor-pointer"
                                  title="Delete Project"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubTab === "team" ? (
        <div className="bg-bg-card border border-border-card rounded-[20px] shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-border-card bg-bg-base/30 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut" />
            <input 
              type="text" 
              placeholder="Search team members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border-card rounded-[12px] text-xs text-text-main outline-none focus:border-brand-primary transition-all shadow-sm inset-shadow-sm"
            />
          </div>
          <div className="relative w-full sm:max-w-[200px] mt-2 sm:mt-0">
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-card border border-border-card rounded-[12px] text-xs text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
            >
              <option value="All">All Projects</option>
              {uniqueProjects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:max-w-[200px] mt-2 sm:mt-0">
            <select
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-card border border-border-card rounded-[12px] text-xs text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
            >
              <option value="All">All Designations</option>
              {uniqueDesignations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-base/50 text-[10px] uppercase tracking-wider text-text-mut border-b border-border-card">
                <th className="p-4 font-bold">Employee</th>
                {currentUser?.role === "admin" && <th className="p-4 font-bold">Project</th>}
                <th className="p-4 font-bold">Designation</th>
                <th className="p-4 font-bold text-center">Tasks</th>
                <th className="p-4 font-bold text-center">Completion</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-text-mut text-sm">Loading team...</td>
                </tr>
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-3 bg-brand-primary/10 p-3 rounded-full">
                        <Users size={36} className="text-brand-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-text-main">No Team Members Found</h3>
                      <p className="text-xs text-text-mut">Add members to your project to start assigning tasks.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTeam.map((member) => {
                  const tasks = member.tasks || [];
                  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (Number(t.duration) || 0), 0);
                  const totalTrackedHours = tasks.reduce((sum, t) => sum + calculateTimeSpent(allTaskReports[t.id] || []), 0);
                  
                  let progress = 0;
                  if (totalEstimatedHours > 0) {
                    progress = Math.min(100, Math.round((totalTrackedHours / totalEstimatedHours) * 100));
                  } else {
                    const completed = tasks.filter(t => t.completed).length;
                    progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                  }

                  return (
                    <tr key={member.uid} className="border-b border-border-card/50 hover:bg-bg-base/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                            ) : member.name ? member.name.substring(0,2) : "?"}
                          </div>
                          <div>
                            <div 
                              className="font-bold text-sm text-text-main cursor-pointer hover:text-brand-primary hover:underline transition-colors"
                              onClick={() => { setSelectedMemberForReports(member); setShowMemberReportsModal(true); }}
                              title="View Member Reports"
                            >
                              {member.name}
                            </div>
                            <div className="text-[10px] text-text-sec">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      {currentUser?.role === "admin" && (
                        <td className="p-4 text-xs font-medium text-text-main">
                          {member.projects && member.projects.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {member.projects.map(p => <span key={p} className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-[10px] rounded-[6px]">{p}</span>)}
                            </div>
                          ) : member.project ? (
                            <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-[10px] rounded-[6px]">{member.project}</span>
                          ) : (
                            <span className="text-text-mut">Unassigned</span>
                          )}
                        </td>
                      )}
                      <td className="p-4 text-xs font-medium text-text-sec">
                        {member.designation || member.jobType || "Unassigned"}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold">
                          {tasks.length}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-[10px] font-bold text-text-sec">{progress}%</span>
                          <div className="w-full max-w-[100px] h-1.5 bg-bg-base rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-brand-primary' : 'bg-transparent'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openTaskModal(member)}
                            className="py-1.5 px-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-[8px] text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            title="Manage Tasks"
                          >
                            <span>Tasks</span>
                            <ChevronRight size={14} />
                          </button>
                          <button
                            onClick={() => openEditMemberModal(member)}
                            className="p-1.5 bg-bg-base border border-border-card text-text-sec hover:text-brand-primary hover:border-brand-primary rounded-[8px] transition-colors cursor-pointer"
                            title="Edit Member Designation"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="p-1.5 bg-bg-base border border-border-card text-text-sec hover:text-red-500 hover:border-red-500 hover:bg-red-500/5 rounded-[8px] transition-colors cursor-pointer"
                            title="Remove from Project"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-border-card text-xs flex-wrap gap-4 px-4 pb-4">
            <span className="text-text-mut font-semibold">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTeam.length)} of {filteredTeam.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-bg-card border border-border-card rounded-[8px] hover:bg-bg-base hover:text-brand-primary font-bold disabled:opacity-50 transition-colors cursor-pointer"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-[8px] font-bold transition-colors cursor-pointer ${
                    currentPage === i + 1 
                      ? "bg-brand-primary text-white" 
                      : "bg-bg-card border border-border-card text-text-sec hover:bg-bg-base hover:text-brand-primary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-bg-card border border-border-card rounded-[8px] hover:bg-bg-base hover:text-brand-primary font-bold disabled:opacity-50 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      ) : activeSubTab === "weekly-reports" ? (
        <div className="bg-bg-card border border-border-card rounded-[20px] shadow-sm overflow-hidden mb-6">
          {/* Header & Filter Controls */}
          <div className="p-4 border-b border-border-card bg-bg-base/30 space-y-4">
            
            {/* Top Row: Title & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-base text-text-main tracking-tight flex items-center gap-2">
                  <FileText size={18} className="text-brand-primary" /> Weekly Reports
                  <span className="text-xs font-semibold text-text-mut bg-bg-base px-2 py-0.5 rounded-full border border-border-card">
                    {filteredWeeklyReports.length} {filteredWeeklyReports.length === 1 ? "report" : "reports"}
                  </span>
                </h3>
                <p className="text-xs text-text-mut mt-0.5">Filter by employee and download consolidated reports in Excel or PDF</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownloadWeeklyReportsExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-[10px] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  title="Download Filtered Weekly Reports as Excel (.xlsx)"
                >
                  <Download size={13} /> Export Excel
                </button>
                <button
                  onClick={handleDownloadWeeklyReportsPDF}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-3 rounded-[10px] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  title="Download Filtered Weekly Reports as PDF (.pdf)"
                >
                  <Download size={13} /> Export PDF
                </button>
                <button
                  onClick={handleAutoGenerateAllWeeklyReports}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-3 rounded-[10px] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  title="Automatically generate weekly reports for all team members based on daily logs"
                >
                  <Sparkles size={13} /> Auto-Generate All
                </button>
                <button
                  onClick={() => {
                    const range = getWeekRange(new Date());
                    setWeeklyReportStartDate(range.start);
                    setWeeklyReportEndDate(range.end);
                    setWeeklyReportEmployee(weeklyFilterEmployee !== "All" ? weeklyFilterEmployee : "");
                    setWeeklyReportRating("Good");
                    setWeeklyReportTasks("");
                    setWeeklyReportRemarks("");
                    setShowAddWeeklyReportModal(true);
                  }}
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold py-2 px-3.5 rounded-[10px] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Plus size={13} /> Add Report
                </button>
              </div>
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 overflow-x-auto custom-scrollbar pt-2 border-t border-border-card/50">
              
              {/* Employee Filter */}
              <div className="relative w-full md:w-auto md:min-w-[200px] flex-shrink-0">
                <select
                  value={weeklyFilterEmployee}
                  onChange={(e) => {
                    setWeeklyFilterEmployee(e.target.value);
                    setWeeklyCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2 bg-bg-card border border-border-card rounded-[12px] text-xs font-medium text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
                >
                  <option value="All">👥 All Employees ({teamMembers.length})</option>
                  {teamMembers.map(m => (
                    <option key={m.uid} value={m.uid}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type="date"
                  value={weeklyFilterFromDate}
                  onChange={(e) => {
                    setWeeklyFilterFromDate(e.target.value);
                    setWeeklyCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-bg-card border border-border-card rounded-[12px] text-xs font-medium text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
                  title="From Week Start Date"
                />
                <span className="text-xs text-text-mut font-medium">to</span>
                <input
                  type="date"
                  value={weeklyFilterToDate}
                  onChange={(e) => {
                    setWeeklyFilterToDate(e.target.value);
                    setWeeklyCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-bg-card border border-border-card rounded-[12px] text-xs font-medium text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
                  title="To Week End Date"
                />
              </div>

              {/* Rating Filter */}
              <div className="relative w-full md:w-auto md:min-w-[140px] flex-shrink-0">
                <select
                  value={weeklyFilterRating}
                  onChange={(e) => {
                    setWeeklyFilterRating(e.target.value);
                    setWeeklyCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2 bg-bg-card border border-border-card rounded-[12px] text-xs font-medium text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
                >
                  <option value="All">All Ratings</option>
                  <option value="Excellent">⭐ Excellent</option>
                  <option value="Good">👍 Good</option>
                  <option value="Average">⚖️ Average</option>
                  <option value="Needs Improvement">⚠️ Needs Improvement</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(weeklyFilterEmployee !== "All" || weeklyFilterFromDate || weeklyFilterToDate || weeklyFilterRating !== "All") && (
                <button
                  onClick={() => {
                    setWeeklyFilterEmployee("All");
                    setWeeklyFilterFromDate("");
                    setWeeklyFilterToDate("");
                    setWeeklyFilterRating("All");
                    setWeeklyCurrentPage(1);
                  }}
                  className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <X size={12} /> Clear Filters
                </button>
              )}

            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-base/50 text-[10px] uppercase tracking-wider text-text-mut border-b border-border-card">
                  <th className="p-4 font-bold">Week Range</th>
                  <th className="p-4 font-bold">Employee</th>
                  <th className="p-4 font-bold text-center">Rating</th>
                  <th className="p-4 font-bold">Tasks / Activities</th>
                  <th className="p-4 font-bold">Supervisor Remarks</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-border-card">
                {filteredWeeklyReports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-text-mut text-xs">
                      No weekly reports found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedWeeklyReports.map((report) => (
                    <tr key={report.id} className="hover:bg-bg-base/30 transition-colors">
                      <td className="p-4 text-text-main whitespace-nowrap">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <Calendar size={12} className="text-brand-primary" />
                          {report.weekStartDate} — {report.weekEndDate}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-semibold text-text-main text-xs">{report.employeeName}</div>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          report.rating === "Excellent" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" :
                          report.rating === "Good" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                          report.rating === "Average" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        }`}>
                          {report.rating}
                        </span>
                      </td>
                      <td className="p-4 text-text-sec text-xs max-w-[240px] truncate">
                        {report.tasksCompleted}
                      </td>
                      <td className="p-4 text-text-sec text-xs max-w-[180px] truncate">
                        {report.supervisorRemarks || "—"}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedWeeklyReport(report);
                              setShowViewWeeklyReportModal(true);
                            }}
                            className="py-1 px-2.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-[6px] text-[10px] font-bold transition-all cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteWeeklyReport(report)}
                            className="p-1 text-text-mut hover:text-rose-500 hover:bg-rose-500/10 rounded-[6px] transition-all cursor-pointer"
                            title="Delete Report"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {weeklyTotalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t border-border-card text-xs flex-wrap gap-4 px-4 pb-4">
              <span className="text-text-mut font-semibold">
                Showing {weeklyStartIndex + 1} to {Math.min(weeklyStartIndex + weeklyReportsPerPage, filteredWeeklyReports.length)} of {filteredWeeklyReports.length} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setWeeklyCurrentPage(p => Math.max(1, p - 1))}
                  disabled={weeklyCurrentPage === 1}
                  className="px-3 py-1.5 bg-bg-card border border-border-card rounded-[8px] hover:bg-bg-base hover:text-brand-primary font-bold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Prev
                </button>
                {Array.from({ length: weeklyTotalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setWeeklyCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-[8px] font-bold transition-colors cursor-pointer ${
                      weeklyCurrentPage === i + 1 
                        ? "bg-brand-primary text-white" 
                        : "bg-bg-card border border-border-card text-text-sec hover:bg-bg-base hover:text-brand-primary"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setWeeklyCurrentPage(p => Math.min(weeklyTotalPages, p + 1))}
                  disabled={weeklyCurrentPage === weeklyTotalPages}
                  className="px-3 py-1.5 bg-bg-card border border-border-card rounded-[8px] hover:bg-bg-base hover:text-brand-primary font-bold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-bg-card border border-border-card rounded-[20px] shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-border-card bg-bg-base/30 flex flex-col md:flex-row md:items-center gap-4 overflow-x-auto custom-scrollbar">
            <div className="relative w-full md:w-auto md:min-w-[180px] flex-shrink-0">
              <select
                value={logFilterEmployee}
                onChange={(e) => setLogFilterEmployee(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-card border border-border-card rounded-[12px] text-xs text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
              >
                <option value="All">All Employees</option>
                {teamMembers.map(m => (
                  <option key={m.uid} value={m.uid}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="relative w-full md:w-auto mt-2 md:mt-0 flex items-center gap-2 flex-shrink-0">
              <input
                type="date"
                value={logFilterFromDate}
                onChange={(e) => setLogFilterFromDate(e.target.value)}
                className="w-full md:w-auto px-4 py-2.5 bg-bg-card border border-border-card rounded-[12px] text-xs text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
                title="From Date"
              />
              <span className="text-xs text-text-mut font-medium">to</span>
              <input
                type="date"
                value={logFilterToDate}
                onChange={(e) => setLogFilterToDate(e.target.value)}
                className="w-full md:w-auto px-4 py-2.5 bg-bg-card border border-border-card rounded-[12px] text-xs text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
                title="To Date"
              />
            </div>
            <div className="relative w-full md:w-auto md:min-w-[140px] mt-2 md:mt-0 flex-shrink-0">
              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-card border border-border-card rounded-[12px] text-xs text-text-main outline-none focus:border-brand-primary transition-all shadow-sm cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div className="flex gap-3 w-full md:w-auto md:ml-auto mt-2 md:mt-0 justify-end flex-shrink-0">
              <button
                onClick={handleDownloadDailyLogsExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-[10px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer w-full sm:w-auto"
              >
                <Download size={14} />
                <span>Export Excel</span>
              </button>
              <button
                onClick={handleDownloadDailyLogsPDF}
                className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold py-2 px-3.5 rounded-[10px] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-primary/10 cursor-pointer w-full sm:w-auto"
              >
                <Download size={14} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-base/50 text-[10px] uppercase tracking-wider text-text-mut border-b border-border-card">
                  <th className="p-4 font-bold text-center">#</th>
                  <th className="p-4 font-bold">Candidate Name</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Day</th>
                  <th className="p-4 font-bold text-center">Hours</th>
                  <th className="p-4 font-bold">Tasks Completed</th>
                  <th className="p-4 font-bold">Issues Faced</th>
                  <th className="p-4 font-bold">Supervisor Remarks</th>
                  <th className="p-4 font-bold">Attachment</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-10 text-center text-text-mut text-sm">
                      No daily logs found matching selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((report, idx) => {
                    let statusBadge = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
                    if (report.status === "On Hold") {
                      statusBadge = "bg-red-500/10 text-red-500 border border-red-500/20";
                    } else if (report.status === "In Progress") {
                      statusBadge = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                    }
                    return (
                      <tr key={report.id} className="border-b border-border-card/50 hover:bg-bg-base/30 transition-colors text-xs text-text-sec">
                        <td className="p-4 text-center font-bold text-text-mut">{logStartIndex + idx + 1}</td>
                        <td className="p-4 font-bold text-text-main">{report.userName}</td>
                        <td className="p-4 whitespace-nowrap">{report.date}</td>
                        <td className="p-4 whitespace-nowrap">{report.day}</td>
                        <td className="p-4 text-center whitespace-nowrap font-semibold text-text-main">{report.hours} h</td>
                        <td className="p-4 max-w-[200px] truncate" title={report.tasksCompleted}>{report.tasksCompleted}</td>
                        <td className="p-4 max-w-[150px] truncate" title={report.issuesFaced}>
                          {report.issuesFaced ? report.issuesFaced : <span className="text-text-mut/40 italic">None</span>}
                        </td>
                        <td className="p-4 max-w-[150px] truncate" title={report.supervisorRemarks}>
                          {report.supervisorRemarks ? report.supervisorRemarks : <span className="text-text-mut/40 italic">No remarks yet</span>}
                        </td>
                        <td className="p-4">
                          {report.fileData ? (
                            <FileCard file={report.fileData} />
                          ) : (
                            <span className="text-text-mut/40 italic">None</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusBadge}`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedReportForRemarks(report);
                              setRemarksText(report.supervisorRemarks || "");
                              setRemarksStatus(report.status || "Completed");
                              setShowRemarksModal(true);
                            }}
                            className="py-1 px-2.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-[6px] text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {logTotalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t border-border-card text-xs flex-wrap gap-4 px-4 pb-4">
              <span className="text-text-mut font-semibold">
                Showing {logStartIndex + 1} to {Math.min(logStartIndex + logsPerPage, filteredReports.length)} of {filteredReports.length} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLogCurrentPage(p => Math.max(1, p - 1))}
                  disabled={logCurrentPage === 1}
                  className="px-3 py-1.5 bg-bg-card border border-border-card rounded-[8px] hover:bg-bg-base hover:text-brand-primary font-bold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Prev
                </button>
                {Array.from({ length: logTotalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLogCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-[8px] font-bold transition-colors cursor-pointer ${
                      logCurrentPage === i + 1 
                        ? "bg-brand-primary text-white" 
                        : "bg-bg-card border border-border-card text-text-sec hover:bg-bg-base hover:text-brand-primary"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setLogCurrentPage(p => Math.min(logTotalPages, p + 1))}
                  disabled={logCurrentPage === logTotalPages}
                  className="px-3 py-1.5 bg-bg-card border border-border-card rounded-[8px] hover:bg-bg-base hover:text-brand-primary font-bold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Team Member Modal */}
      {showAddTeamModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[400px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <UserPlus size={18} className="text-brand-primary" />
                Add to Team
              </h3>
              <button onClick={() => setShowAddTeamModal(false)} className="text-text-mut hover:text-text-main font-bold cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddTeamMember} className="space-y-4">
              {currentUser?.role === "admin" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-sec">Project Name (comma-separated for multiple)</label>
                  <input 
                    type="text" 
                    placeholder="Enter project name..."
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={adminProjectInput}
                    onChange={(e) => setAdminProjectInput(e.target.value)}
                    required
                  />
                </div>
              )}
              {currentUser?.role !== "admin" && pmProjects.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-sec">Assign to Projects</label>
                  <div className="flex flex-wrap gap-3 mt-1 p-2 bg-bg-base/30 border border-border-card rounded-[12px]">
                    {pmProjects.map(p => (
                      <label key={p} className="flex items-center gap-1.5 text-xs text-text-main cursor-pointer hover:text-brand-primary transition-colors">
                        <input 
                          type="checkbox"
                          checked={selectedPmProjects.includes(p)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPmProjects([...selectedPmProjects, p]);
                            } else {
                              setSelectedPmProjects(selectedPmProjects.filter(proj => proj !== p));
                            }
                          }}
                          className="accent-brand-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                  {selectedPmProjects.length === 0 && (
                    <p className="text-[10px] text-brand-warning mt-1">Please select at least one project.</p>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Select Employee</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                  value={selectedUserForTeam}
                  onChange={(e) => setSelectedUserForTeam(e.target.value)}
                  required
                >
                  <option value="">-- Choose an employee --</option>
                  {availableUsersToAdd.map(u => (
                    <option key={u.uid} value={u.uid}>{u.name} ({u.designation || u.department || 'No dept'})</option>
                  ))}
                </select>
                {availableUsersToAdd.length === 0 && (
                  <p className="text-[10px] text-brand-warning mt-1">No available employees found.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border-card mt-4">
                <button type="button" onClick={() => setShowAddTeamModal(false)} className="py-2 px-4 border border-border-card rounded-[10px] text-xs font-bold text-text-sec hover:bg-bg-base cursor-pointer">Cancel</button>
                <button type="submit" disabled={!selectedUserForTeam || (currentUser?.role === "admin" && !adminProjectInput) || (currentUser?.role !== "admin" && selectedPmProjects.length === 0)} className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-[10px] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50">
                  {currentUser?.role === "admin" ? "Assign Project" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Manage Tasks Modal */}
      {showTaskModal && taskTargetUser && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[600px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4 flex-shrink-0">
              <h3 className="font-bold text-lg text-text-main">
                Tasks for <span className="text-brand-primary">{taskTargetUser.name}</span>
              </h3>
              <button onClick={() => setShowTaskModal(false)} className="text-text-mut hover:text-text-main font-bold cursor-pointer"><X size={18} /></button>
            </div>
            
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-grow space-y-6">
              
              <div className="bg-bg-base/50 p-4 rounded-[16px] border border-border-card">
                <h4 className="text-xs font-extrabold text-text-main uppercase tracking-wider mb-3">
                  {editingTaskIndex !== null ? "Edit Task" : "Assign New Task"}
                </h4>
                <form onSubmit={handleSaveTask} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-3 flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-text-sec">Task Title</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-border-card rounded-[10px] bg-bg-card text-xs text-text-main outline-none focus:border-brand-primary transition-all"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="e.g. Develop landing page UI"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-text-sec">Project</label>
                      <select 
                        className="w-full px-3 py-2 border border-border-card rounded-[10px] bg-bg-card text-xs text-text-main outline-none focus:border-brand-primary transition-all"
                        value={newTaskProject}
                        onChange={(e) => setNewTaskProject(e.target.value)}
                        required
                      >
                        <option value="General Task">General Task</option>
                        {(taskTargetUser?.projects?.length ? taskTargetUser.projects : (taskTargetUser?.project ? [taskTargetUser.project] : [])).map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1 flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-text-sec">Hours</label>
                      <input 
                        type="number" 
                        min="0.5" step="0.5"
                        className="w-full px-3 py-2 border border-border-card rounded-[10px] bg-bg-card text-xs text-text-main outline-none focus:border-brand-primary transition-all"
                        value={newTaskDuration}
                        onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    {editingTaskIndex !== null && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingTaskIndex(null); setNewTaskTitle(""); setNewTaskDuration(1); setNewTaskProject(""); }}
                        className="py-1.5 px-3 border border-border-card rounded-[8px] text-[10px] font-bold text-text-sec hover:bg-bg-card cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="py-1.5 px-4 bg-brand-primary text-white rounded-[8px] text-[10px] font-bold hover:bg-brand-hover transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {editingTaskIndex !== null ? <Edit2 size={12} /> : <Plus size={12} />}
                      <span>{editingTaskIndex !== null ? "Update Task" : "Assign Task"}</span>
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-text-main uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Current Tasks</span>
                  <span className="bg-bg-base px-2 py-0.5 rounded-full text-[10px]">
                    {taskTargetUser.tasks?.length || 0} Total
                  </span>
                </h4>
                
                {(!taskTargetUser.tasks || taskTargetUser.tasks.length === 0) ? (
                  <p className="text-xs text-text-mut text-center py-6 border border-dashed border-border-card rounded-[12px]">
                    No tasks assigned to this employee yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {taskTargetUser.tasks.map((task, idx) => (
                      <div key={task.id || idx} className={`p-3 rounded-[12px] border ${task.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-bg-card border-border-card'} flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-sm`}>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {task.completed ? (
                              <CheckCircle size={16} className="text-emerald-500" />
                            ) : (
                              <Clock size={16} className="text-brand-primary" />
                            )}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${task.completed ? 'text-text-sec line-through' : 'text-text-main'}`}>
                              {task.title}
                            </p>
                            {task.project && (
                              <p className="text-[9px] font-bold text-brand-primary mt-0.5 uppercase tracking-wider">{task.project}</p>
                            )}
                            <p className="text-[10px] text-text-mut mt-0.5">
                              Est. Duration: {task.duration || 0} hours
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 self-end sm:self-auto">
                          <button
                            onClick={() => {
                              setEditingTaskIndex(idx);
                              setNewTaskTitle(task.title);
                              setNewTaskDuration(task.duration || 1);
                              setNewTaskProject(task.project || "");
                            }}
                            className="p-1.5 text-text-sec hover:text-brand-primary hover:bg-brand-primary/10 rounded-[6px] transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(idx)}
                            className="p-1.5 text-text-sec hover:text-red-500 hover:bg-red-500/10 rounded-[6px] transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Team Member Modal */}
      {showEditMemberModal && memberToEdit && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[400px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <Edit2 size={18} className="text-brand-primary" />
                Edit Team Member
              </h3>
              <button onClick={() => setShowEditMemberModal(false)} className="text-text-mut hover:text-text-main font-bold cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveMemberEdit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Member Name</label>
                <input 
                  type="text" 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-mut outline-none cursor-not-allowed"
                  value={memberToEdit.name}
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Designation / Role</label>
                <input 
                  type="text" 
                  placeholder="e.g. Frontend Developer"
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  required
                />
              </div>
              
              {currentUser?.role === "admin" ? (
                <div className="flex flex-col gap-1 mt-3">
                  <label className="text-xs font-bold text-text-sec">Assigned Projects (comma-separated)</label>
                  <input 
                    type="text" 
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={adminEditProjectsInput}
                    onChange={(e) => setAdminEditProjectsInput(e.target.value)}
                  />
                </div>
              ) : pmProjects.length > 0 ? (
                <div className="flex flex-col gap-1 mt-3">
                  <label className="text-xs font-bold text-text-sec">Manage Assigned Projects</label>
                  <div className="flex flex-wrap gap-3 mt-1 p-2 bg-bg-base/30 border border-border-card rounded-[12px]">
                    {pmProjects.map(p => (
                      <label key={p} className="flex items-center gap-1.5 text-xs text-text-main cursor-pointer hover:text-brand-primary transition-colors">
                        <input 
                          type="checkbox"
                          checked={editProjects.includes(p)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditProjects([...editProjects, p]);
                            } else {
                              setEditProjects(editProjects.filter(proj => proj !== p));
                            }
                          }}
                          className="accent-brand-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-4 border-t border-border-card mt-4">
                <button type="button" onClick={() => setShowEditMemberModal(false)} className="py-2 px-4 border border-border-card rounded-[10px] text-xs font-bold text-text-sec hover:bg-bg-base cursor-pointer">Cancel</button>
                <button type="submit" className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-[10px] text-xs font-bold transition-colors cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Project Reports Modal */}
      {showReportsModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-4 sm:p-6 animate-fade-in">
          <div className="w-full max-w-[800px] bg-bg-card border border-border-card rounded-[24px] p-5 sm:p-6 shadow-xl animate-scale-up relative overflow-hidden flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowReportsModal(false)} 
              className="absolute top-4 right-4 p-1.5 text-text-mut hover:text-text-main font-bold cursor-pointer bg-bg-base hover:bg-bg-card rounded-[8px] transition-colors z-10"
            >
              <X size={16} />
            </button>
            
            <div className="flex flex-col items-center justify-center mb-5 border-b border-border-card pb-5 gap-3 flex-shrink-0 relative mt-2">
              <h3 className="font-bold text-xl text-text-main flex items-center justify-center gap-2 text-center w-full">
                <FileText size={20} className="text-brand-primary" />
                Project Reports
              </h3>
              <div className="flex items-center justify-center gap-3 w-full flex-wrap">
                <button 
                  onClick={handleDownloadPDF}
                  className="py-2 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-[10px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
                <button 
                  onClick={handleDownloadExcel}
                  className="py-2 px-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-[10px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download size={14} />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-auto pr-2 custom-scrollbar flex-grow">
              <div className="min-w-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-base/50 text-[10px] uppercase tracking-wider text-text-mut border-b border-border-card">
                      <th className="p-3 font-bold w-1/4">Employee</th>
                      <th className="p-3 font-bold w-1/2">Task Title</th>
                      <th className="p-3 font-bold text-center w-auto">Status</th>
                      <th className="p-3 font-bold text-right whitespace-nowrap">Est. / Rem.</th>
                    </tr>
                  </thead>
                  <tbody>
                  {teamMembers.flatMap(m => (m.tasks || []).map(t => ({...t, employeeName: m.name}))).length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-xs text-text-mut">No tasks found in this project.</td>
                    </tr>
                  ) : (
                    teamMembers.flatMap(m => (m.tasks || []).map(t => ({...t, employeeName: m.name}))).map((task, idx) => (
                      <React.Fragment key={task.id || idx}>
                        <tr className="border-b border-border-card/50">
                          <td className="p-3 text-xs font-bold text-text-main">{task.employeeName}</td>
                          <td className="p-3 text-xs text-text-main text-center">
                            <div>{task.title}</div>
                            {task.project && <div className="text-[9px] text-brand-primary font-bold mt-0.5">{task.project}</div>}
                          </td>
                          <td className="p-3 text-xs text-center">
                            {task.completed ? (
                              <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-[6px]">Done</span>
                            ) : (
                              <span className="text-brand-primary font-bold bg-brand-primary/10 px-2 py-0.5 rounded-[6px]">Active</span>
                            )}
                          </td>
                          <td className="p-3 text-xs text-right">
                            <div className="font-bold text-text-main">{task.duration || 0}h</div>
                            <div className="text-[10px] text-brand-primary font-bold">
                              {parseFloat(Math.max(0, (task.duration || 0) - calculateTimeSpent(allTaskReports[task.id] || [])).toFixed(1))}h rem
                            </div>
                          </td>
                        </tr>
                        {(!allTaskReports[task.id] || allTaskReports[task.id].filter(r => !r.reportText.startsWith("Worked for") && !r.reportText.startsWith("Auto-stopped") && !r.reportText.startsWith("Auto-paused")).length === 0) ? (
                          <tr className="border-b border-border-card">
                            <td colSpan="4" className="p-3 bg-bg-base/30 text-center text-[10px] text-text-mut italic">
                              No updates reported yet
                            </td>
                          </tr>
                        ) : (
                          <tr className="border-b border-border-card">
                            <td colSpan="4" className="p-3 bg-bg-base/30">
                              <div className="pl-4 border-l-2 border-brand-primary/30 space-y-2">
                                {allTaskReports[task.id].filter(r => !r.reportText.startsWith("Worked for") && !r.reportText.startsWith("Auto-stopped") && !r.reportText.startsWith("Auto-paused")).map(r => {
                                  const reportDate = r.timestamp || r.createdAt || r.submittedAt;
                                  return (
                                    <div key={r.id} className="text-[10px]">
                                      <span className="font-bold text-text-sec">[{reportDate ? new Date(reportDate).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : "Recent"}]</span>
                                      <span className="text-text-main ml-2">{r.reportText}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

      {showMemberReportsModal && selectedMemberForReports && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-4 sm:p-6 animate-fade-in">
          <div className="w-full max-w-[700px] bg-bg-card border border-border-card rounded-[24px] p-5 sm:p-6 shadow-xl animate-scale-up relative overflow-hidden flex flex-col max-h-[90vh]">
            <button 
              onClick={() => { 
                setShowMemberReportsModal(false); 
                setSelectedMemberForReports(null); 
                setMemberFilterDate(""); 
                setMemberFilterMonth(""); 
                setMemberFilterProject("All"); 
              }} 
              className="absolute top-4 right-4 p-1.5 text-text-mut hover:text-text-main font-bold cursor-pointer bg-bg-base hover:bg-bg-card rounded-[8px] transition-colors z-10"
            >
              <X size={16} />
            </button>
            
            <div className="flex flex-col items-center justify-center mb-5 border-b border-border-card pb-5 gap-3 flex-shrink-0 relative mt-2">
              <h3 className="font-bold text-xl text-text-main flex items-center justify-center gap-2 text-center w-full">
                <FileText size={20} className="text-brand-primary" />
                Reports: {selectedMemberForReports.name}
              </h3>
              
              <div className="w-full mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-mut uppercase">Date Filter</label>
                  <input 
                    type="date" 
                    value={memberFilterDate} 
                    onChange={(e) => { setMemberFilterDate(e.target.value); setMemberFilterMonth(""); }}
                    className="w-full px-3 py-2 bg-bg-base border border-border-card rounded-[10px] text-xs text-text-main outline-none focus:border-brand-primary transition-all cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-mut uppercase">Month Filter</label>
                  <input 
                    type="month" 
                    value={memberFilterMonth} 
                    onChange={(e) => { setMemberFilterMonth(e.target.value); setMemberFilterDate(""); }}
                    className="w-full px-3 py-2 bg-bg-base border border-border-card rounded-[10px] text-xs text-text-main outline-none focus:border-brand-primary transition-all cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-mut uppercase">Project Filter</label>
                  <select 
                    value={memberFilterProject} 
                    onChange={(e) => setMemberFilterProject(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-base border border-border-card rounded-[10px] text-xs text-text-main outline-none focus:border-brand-primary transition-all cursor-pointer"
                  >
                    <option value="All">All Projects</option>
                    {Array.from(new Set(selectedMemberForReports.tasks?.map(t => t.project).filter(Boolean))).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 w-full flex-wrap mt-2">
                <button 
                  onClick={handleMemberDownloadPDF}
                  className="py-2 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-[10px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
                <button 
                  onClick={handleMemberDownloadExcel}
                  className="py-2 px-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-[10px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download size={14} />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-auto pr-2 custom-scrollbar flex-grow">
              <div className="min-w-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-base/50 text-[10px] uppercase tracking-wider text-text-mut border-b border-border-card">
                      <th className="p-3 font-bold w-1/2">Task Title</th>
                      <th className="p-3 font-bold text-center w-auto">Status</th>
                      <th className="p-3 font-bold text-right whitespace-nowrap">Est. / Rem.</th>
                    </tr>
                  </thead>
                  <tbody>
                  {getFilteredMemberTasks().length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-6 text-center text-xs text-text-mut">No tasks match the selected filters.</td>
                    </tr>
                  ) : (
                    getFilteredMemberTasks().map((task, idx) => (
                      <React.Fragment key={task.id || idx}>
                        <tr className="border-b border-border-card/50">
                          <td className="p-3 text-xs text-text-main">
                            <div className="font-bold">{task.title}</div>
                            {task.project && <div className="text-[9px] text-brand-primary font-bold mt-0.5">{task.project}</div>}
                          </td>
                          <td className="p-3 text-xs text-center">
                            {task.completed ? (
                              <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-[6px]">Done</span>
                            ) : (
                              <span className="text-brand-primary font-bold bg-brand-primary/10 px-2 py-0.5 rounded-[6px]">Active</span>
                            )}
                          </td>
                          <td className="p-3 text-xs text-right">
                            <div className="font-bold text-text-main">{task.duration || 0}h</div>
                            <div className="text-[10px] text-brand-primary font-bold">
                              {parseFloat(Math.max(0, (task.duration || 0) - calculateTimeSpent(allTaskReports[task.id] || [])).toFixed(1))}h rem
                            </div>
                          </td>
                        </tr>
                        {task.filteredReports.length === 0 ? (
                          <tr className="border-b border-border-card">
                            <td colSpan="3" className="p-3 bg-bg-base/30 text-center text-[10px] text-text-mut italic">
                              No updates reported yet for selected filters
                            </td>
                          </tr>
                        ) : (
                          <tr className="border-b border-border-card">
                            <td colSpan="3" className="p-3 bg-bg-base/30">
                              <div className="pl-4 border-l-2 border-brand-primary/30 space-y-2">
                                {task.filteredReports.map(r => {
                                  const reportDate = r.timestamp || r.createdAt || r.submittedAt;
                                  return (
                                    <div key={r.id} className="text-[10px]">
                                      <span className="font-bold text-text-sec">[{reportDate ? new Date(reportDate).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : "Recent"}]</span>
                                      <span className="text-text-main ml-2">{r.reportText}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

      {/* Supervisor Remarks Modal */}
      {showRemarksModal && selectedReportForRemarks && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in text-left">
          <div className="w-full max-w-[480px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4 flex-shrink-0">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <FileText size={20} className="text-brand-primary" />
                <span>Review Daily Activity Log</span>
              </h3>
              <button onClick={() => { setShowRemarksModal(false); setSelectedReportForRemarks(null); }} className="text-text-mut hover:text-text-main font-bold cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveRemarks} className="flex-grow overflow-y-auto pr-1 space-y-4 pb-2 custom-scrollbar">
              <div className="bg-bg-base/50 p-4 rounded-[16px] border border-border-card space-y-2 text-xs">
                <div>
                  <span className="font-bold text-text-sec uppercase block">Employee Name:</span>
                  <span className="text-text-main font-semibold">{selectedReportForRemarks.userName}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-text-sec uppercase block">Date:</span>
                    <span className="text-text-main font-semibold">{selectedReportForRemarks.date} ({selectedReportForRemarks.day})</span>
                  </div>
                  <div>
                    <span className="font-bold text-text-sec uppercase block">Hours Worked:</span>
                    <span className="text-text-main font-semibold">{selectedReportForRemarks.hours} h</span>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-text-sec uppercase block">Tasks Completed:</span>
                  <p className="text-text-main font-semibold mt-1 p-2 bg-bg-card border border-border-card/50 rounded-[8px] whitespace-pre-line">{selectedReportForRemarks.tasksCompleted}</p>
                </div>
                {selectedReportForRemarks.issuesFaced && (
                  <div>
                    <span className="font-bold text-brand-danger uppercase block">Issues Faced:</span>
                    <p className="text-text-main font-semibold mt-1 p-2 bg-bg-card border border-border-card/50 rounded-[8px] whitespace-pre-line">{selectedReportForRemarks.issuesFaced}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec">Status</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all cursor-pointer"
                  value={remarksStatus}
                  onChange={(e) => setRemarksStatus(e.target.value)}
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec">Supervisor Remarks *</label>
                <textarea 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all min-h-[100px] resize-none"
                  placeholder="Provide supervisor remarks or feedback..."
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border-card flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowRemarksModal(false); setSelectedReportForRemarks(null); }}
                  className="py-2.5 px-4 bg-bg-base hover:bg-border-card text-text-sec text-xs font-bold rounded-[12px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] shadow-md shadow-brand-primary/10 transition-colors cursor-pointer"
                >
                  Save Remarks
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Create Project Modal */}
      {showCreateProjectModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[420px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <Briefcase size={18} className="text-brand-primary" />
                Create New Project
              </h3>
              <button onClick={() => setShowCreateProjectModal(false)} className="text-text-mut hover:text-text-main font-bold cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Project Name</label>
                <input 
                  type="text" 
                  placeholder="Enter project name..."
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-sec">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={projectStartDate}
                    onChange={(e) => setProjectStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-sec">End Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={projectEndDate}
                    onChange={(e) => setProjectEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Assign Manager</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                  value={projectManagerId}
                  onChange={(e) => setProjectManagerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose an employee --</option>
                  {allUsers.filter(u => u.role !== "admin").map(u => (
                    <option key={u.uid} value={u.uid}>{u.name} ({u.designation || u.department || 'No dept'})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-card mt-4">
                <button type="button" onClick={() => setShowCreateProjectModal(false)} className="py-2 px-4 border border-border-card rounded-[10px] text-xs font-bold text-text-sec hover:bg-bg-base cursor-pointer">Cancel</button>
                <button type="submit" disabled={!projectNameInput || !projectStartDate || !projectEndDate || !projectManagerId} className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-[10px] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[420px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <Briefcase size={18} className="text-brand-primary" />
                View / Edit Project
              </h3>
              <button onClick={() => setShowEditProjectModal(false)} className="text-text-mut hover:text-text-main font-bold cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveProjectEdits} className="space-y-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Project Name</label>
                <input 
                  type="text" 
                  placeholder="Enter project name..."
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                  value={editProjectData.name}
                  onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-sec">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={editProjectData.startDate}
                    onChange={(e) => setEditProjectData({ ...editProjectData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-sec">End Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={editProjectData.endDate}
                    onChange={(e) => setEditProjectData({ ...editProjectData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Assign Manager</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                  value={editProjectData.managerId}
                  onChange={(e) => setEditProjectData({ ...editProjectData, managerId: e.target.value })}
                  required
                >
                  <option value="">-- Choose an employee --</option>
                  {allUsers.filter(u => u.role !== "admin").map(u => (
                    <option key={u.uid} value={u.uid}>{u.name} ({u.designation || u.department || 'No dept'})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-sec">Status</label>
                  <select 
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={editProjectData.status}
                    onChange={(e) => setEditProjectData({ ...editProjectData, status: e.target.value })}
                    required
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                </div>
  
                {editProjectData.status === "Other" && (
                  <div className="flex flex-col gap-1 animate-fade-in">
                    <label className="text-xs font-bold text-text-sec">Custom Status</label>
                    <input 
                      type="text" 
                      placeholder="E.g. On Hold, Delayed..."
                      className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                      value={editProjectData.customStatus || ""}
                      onChange={(e) => setEditProjectData({ ...editProjectData, customStatus: e.target.value })}
                      required
                    />
                  </div>
                )}

              <div className="pt-4 flex justify-end gap-2 border-t border-border-card">
                <button type="button" onClick={() => setShowEditProjectModal(false)} className="py-2 px-4 border border-border-card rounded-[10px] text-xs font-bold text-text-sec hover:bg-bg-base cursor-pointer">Cancel</button>
                <button type="submit" className="py-2 px-6 bg-brand-primary hover:bg-brand-hover text-white rounded-[10px] text-xs font-bold shadow-md shadow-brand-primary/20 transition-all cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Project Details Modal */}
      {showProjectDetailsModal && selectedProjectForDetails && createPortal(
        <div className="fixed inset-0 bg-slate-950/50 dark:bg-black/75 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-4 sm:p-6 animate-fade-in">
          <div className="w-full max-w-xl bg-bg-card border border-border-card rounded-[24px] shadow-2xl animate-scale-up flex flex-col overflow-hidden relative max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-card bg-bg-base/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-sm">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-text-main tracking-tight">
                      {selectedProjectForDetails.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (selectedProjectForDetails.status || "Ongoing").toLowerCase() === "completed" 
                        ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                        : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    }`}>
                      {selectedProjectForDetails.status || "Ongoing"}
                    </span>
                  </div>
                  <p className="text-xs text-text-mut mt-0.5">PostgreSQL Database-Driven Project Record</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProjectDetailsModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-mut hover:text-text-main hover:bg-bg-base transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-left">
              
              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-bg-base/40 border border-border-card/60 rounded-[14px] space-y-1">
                  <span className="text-[10px] font-bold text-text-mut uppercase flex items-center gap-1.5">
                    <Calendar size={12} className="text-brand-primary" /> Timeline
                  </span>
                  <div className="text-xs font-bold text-text-main">
                    {selectedProjectForDetails.startDate || selectedProjectForDetails.start_date || "-"} 
                    <span className="text-text-mut font-normal mx-1.5">to</span>
                    {selectedProjectForDetails.endDate || selectedProjectForDetails.end_date || "-"}
                  </div>
                </div>

                <div className="p-3.5 bg-bg-base/40 border border-border-card/60 rounded-[14px] space-y-1">
                  <span className="text-[10px] font-bold text-text-mut uppercase flex items-center gap-1.5">
                    <Users size={12} className="text-brand-primary" /> Assigned Manager
                  </span>
                  <div className="text-xs font-bold text-brand-primary flex items-center gap-2">
                    {(() => {
                      const dMgr = allUsers.find(u => u.uid === selectedProjectForDetails.managerId || u.id === selectedProjectForDetails.managerId || (selectedProjectForDetails.managerName && u.name === selectedProjectForDetails.managerName));
                      const dMgrName = selectedProjectForDetails.managerName || dMgr?.name || "Mohamed Asfaque A";
                      return (
                        <>
                          <div className="w-5 h-5 rounded-full bg-brand-primary/15 text-brand-primary text-[10px] font-bold flex items-center justify-center">
                            {dMgrName.charAt(0).toUpperCase()}
                          </div>
                          <span>{dMgrName}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Progress & Task Metrics */}
              <div className="p-4 bg-bg-base/30 border border-border-card/60 rounded-[16px] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-text-main">Deliverables & Tasks</span>
                  <span className="font-bold text-brand-primary">
                    {selectedProjectForDetails.completedTaskCount || 0} / {selectedProjectForDetails.taskCount || 0} Completed ({selectedProjectForDetails.progress ?? 0}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden border border-border-card/50">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (selectedProjectForDetails.progress ?? 0) === 100 ? "bg-emerald-500" :
                      (selectedProjectForDetails.progress ?? 0) > 0 ? "bg-brand-primary" : "bg-transparent"
                    }`}
                    style={{ width: `${selectedProjectForDetails.progress ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Description if present */}
              {selectedProjectForDetails.description && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-mut uppercase">Description</label>
                  <p className="text-xs text-text-sec bg-bg-base/30 p-3 rounded-[12px] border border-border-card/50 leading-relaxed whitespace-pre-wrap">
                    {selectedProjectForDetails.description}
                  </p>
                </div>
              )}

              {/* Team Members List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-text-mut uppercase flex items-center gap-1.5">
                    <UserPlus size={12} className="text-brand-primary" />
                    Team Members ({selectedProjectForDetails.teamMembers?.length || 0})
                  </label>
                </div>

                {(!selectedProjectForDetails.teamMembers || selectedProjectForDetails.teamMembers.length === 0) ? (
                  <p className="text-xs text-text-mut italic p-3 bg-bg-base/20 rounded-[12px] border border-dashed border-border-card">
                    No team members assigned yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {selectedProjectForDetails.teamMembers.map((memberId) => {
                      const member = allUsers.find(u => u.uid === memberId || u.id === memberId);
                      return (
                        <div key={memberId} className="flex items-center gap-2.5 p-2 bg-bg-base/40 border border-border-card/50 rounded-[12px]">
                          <div className="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {member?.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (member?.name || "?").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-main truncate">{member?.name || "Unknown Member"}</p>
                            <p className="text-[10px] text-text-mut truncate">{member?.designation || member?.department || member?.email || "Team Member"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border-card bg-bg-base/40 flex justify-end gap-2">
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => {
                    setShowProjectDetailsModal(false);
                    handleEditProjectClick(selectedProjectForDetails);
                  }}
                  className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-[10px] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 size={12} />
                  <span>Edit Project</span>
                </button>
              )}
              <button
                onClick={() => setShowProjectDetailsModal(false)}
                className="px-4 py-2 border border-border-card rounded-[10px] text-xs font-bold text-text-sec hover:bg-bg-base transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Weekly Report Modal */}
      {showAddWeeklyReportModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/50 dark:bg-black/75 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-4 sm:p-6 animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] bg-bg-card border border-border-card rounded-[24px] shadow-2xl animate-scale-up flex flex-col overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-card bg-bg-base/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-sm">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-text-main tracking-tight flex items-center gap-2">
                    Create Weekly Report
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Auto-Sync
                    </span>
                  </h3>
                  <p className="text-xs text-text-mut">Connected directly with candidate daily activity logs</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddWeeklyReportModal(false)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-mut hover:text-text-main hover:bg-bg-base transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Scrollable Body */}
            <form onSubmit={handleAddWeeklyReport} id="weeklyReportForm" className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 text-left">
              
              {/* Employee Selection */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-sec flex items-center gap-1.5">
                    <Users size={13} className="text-brand-primary" /> Select Employee
                  </label>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                    <Sparkles size={11} /> Auto-detects dates & daily logs
                  </span>
                </div>
                <select 
                  className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs font-medium text-text-main outline-none focus:bg-bg-card focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all cursor-pointer"
                  value={weeklyReportEmployee}
                  onChange={(e) => {
                    const empId = e.target.value;
                    setWeeklyReportEmployee(empId);
                    if (empId) {
                      const weeks = getAvailableWeeksForEmployee(empId);
                      let range;
                      if (weeks.length > 0) {
                        range = { start: weeks[0].start, end: weeks[0].end };
                      } else {
                        range = getWeekRange(new Date());
                      }
                      setWeeklyReportStartDate(range.start);
                      setWeeklyReportEndDate(range.end);

                      const genData = generateWeeklyReportDataForEmployee(empId, range.start, range.end);
                      if (genData) {
                        setWeeklyReportTasks(genData.tasksCompleted);
                        setWeeklyReportRemarks(genData.supervisorRemarks);
                        setWeeklyReportRating(genData.rating);
                      }
                    } else {
                      setWeeklyReportTasks("");
                      setWeeklyReportRemarks("");
                    }
                  }}
                  required
                >
                  <option value="">-- Choose an employee --</option>
                  {teamMembers.map(u => (
                    <option key={u.uid} value={u.uid}>{u.name} ({u.designation || u.department || 'Employee'})</option>
                  ))}
                </select>
              </div>

              {/* Quick Week Selector if Employee has logs in multiple weeks */}
              {weeklyReportEmployee && (
                <div className="flex flex-col gap-1.5 p-3.5 rounded-[14px] bg-purple-500/5 border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles size={13} /> Select Week to Auto-Populate ({getAvailableWeeksForEmployee(weeklyReportEmployee).length} weeks found)
                    </label>
                    <span className="text-[10px] text-text-mut">Pick any week</span>
                  </div>
                  <select
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-[10px] bg-bg-card text-xs font-semibold text-text-main outline-none focus:border-purple-500 cursor-pointer shadow-sm"
                    value={`${weeklyReportStartDate}_${weeklyReportEndDate}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const [s, end] = val.split("_");
                        setWeeklyReportStartDate(s);
                        setWeeklyReportEndDate(end);
                        const genData = generateWeeklyReportDataForEmployee(weeklyReportEmployee, s, end);
                        if (genData) {
                          setWeeklyReportTasks(genData.tasksCompleted);
                          setWeeklyReportRemarks(genData.supervisorRemarks);
                          setWeeklyReportRating(genData.rating);
                        }
                      }
                    }}
                  >
                    {getAvailableWeeksForEmployee(weeklyReportEmployee).length === 0 ? (
                      <option value="">No daily logs found for this employee</option>
                    ) : (
                      getAvailableWeeksForEmployee(weeklyReportEmployee).map((w) => (
                        <option key={`${w.start}_${w.end}`} value={`${w.start}_${w.end}`}>
                          📅 Week: {w.start} to {w.end} ({w.logCount} daily activities logged)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {/* Date Range Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec flex items-center gap-1.5">
                    <Calendar size={13} className="text-brand-primary" /> Week Start Date (Monday)
                  </label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs font-medium text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all cursor-pointer"
                    value={weeklyReportStartDate}
                    onChange={(e) => setWeeklyReportStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec flex items-center gap-1.5">
                    <Calendar size={13} className="text-brand-primary" /> Week End Date (Friday)
                  </label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs font-medium text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all cursor-pointer"
                    value={weeklyReportEndDate}
                    onChange={(e) => setWeeklyReportEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Performance Rating Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-sec">Performance Rating</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Excellent", color: "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400" },
                    { label: "Good", color: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                    { label: "Average", color: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                    { label: "Needs Improvement", color: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400" }
                  ].map(r => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setWeeklyReportRating(r.label)}
                      className={`px-3 py-2 rounded-[12px] text-xs font-bold border transition-all cursor-pointer text-center ${
                        weeklyReportRating === r.label 
                          ? `${r.color} ring-2 ring-brand-primary/20 shadow-sm scale-[1.02]` 
                          : "border-border-card bg-bg-base/30 text-text-sec hover:bg-bg-base"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tasks Completed / Notes */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-sec flex items-center gap-1.5">
                    <FileText size={13} className="text-brand-primary" /> Tasks Completed / Daily Activities
                  </label>
                  <span className="text-[10px] text-text-mut">Editable formatted breakdown</span>
                </div>
                <textarea 
                  placeholder="Employee's weekly tasks will auto-fill when employee is selected..."
                  className="w-full px-4 py-3 border border-border-card rounded-[14px] bg-bg-base/40 text-xs leading-relaxed text-text-main outline-none focus:bg-bg-card focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all min-h-[140px] custom-scrollbar resize-y font-sans"
                  value={weeklyReportTasks}
                  onChange={(e) => setWeeklyReportTasks(e.target.value)}
                  required
                />
              </div>

              {/* Supervisor Remarks */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-brand-primary" /> Supervisor Remarks & Total Hours
                </label>
                <textarea 
                  placeholder="Remarks, total logged hours, feedback..."
                  className="w-full px-4 py-3 border border-border-card rounded-[14px] bg-bg-base/40 text-xs leading-relaxed text-text-main outline-none focus:bg-bg-card focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all min-h-[85px] custom-scrollbar resize-y"
                  value={weeklyReportRemarks}
                  onChange={(e) => setWeeklyReportRemarks(e.target.value)}
                />
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border-card bg-bg-base/40 flex items-center justify-between gap-3">
              <span className="text-xs text-text-mut">
                {weeklyReportEmployee ? "Ready to save report" : "Select an employee to continue"}
              </span>
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddWeeklyReportModal(false)} 
                  className="py-2.5 px-5 border border-border-card rounded-[12px] text-xs font-bold text-text-sec hover:bg-bg-base transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="weeklyReportForm"
                  disabled={!weeklyReportEmployee || !weeklyReportStartDate || !weeklyReportEndDate} 
                  className="py-2.5 px-6 bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-brand-hover hover:to-indigo-700 text-white rounded-[12px] text-xs font-bold shadow-md shadow-brand-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Submit Report
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* View Weekly Report Modal */}
      {showViewWeeklyReportModal && selectedWeeklyReport && createPortal(
        <div className="fixed inset-0 bg-slate-950/50 dark:bg-black/75 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-4 sm:p-6 animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] bg-bg-card border border-border-card rounded-[24px] shadow-2xl animate-scale-up flex flex-col overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-card bg-bg-base/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-sm">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-text-main tracking-tight">
                    Weekly Report Overview
                  </h3>
                  <p className="text-xs text-text-mut">
                    Week of {selectedWeeklyReport.weekStartDate} to {selectedWeeklyReport.weekEndDate}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowViewWeeklyReportModal(false)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-mut hover:text-text-main hover:bg-bg-base transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 text-left">
              
              {/* Summary Profile Banner */}
              <div className="p-4 rounded-[16px] bg-gradient-to-r from-bg-base/60 to-bg-base/30 border border-border-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center text-base shadow-sm">
                    {selectedWeeklyReport.employeeName ? selectedWeeklyReport.employeeName.charAt(0) : "E"}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-text-main">{selectedWeeklyReport.employeeName}</h4>
                    <span className="text-xs text-text-mut flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> {selectedWeeklyReport.weekStartDate} — {selectedWeeklyReport.weekEndDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${
                    selectedWeeklyReport.rating === "Excellent" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" :
                    selectedWeeklyReport.rating === "Good" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                    selectedWeeklyReport.rating === "Average" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  }`}>
                    Rating: {selectedWeeklyReport.rating}
                  </span>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-text-sec flex items-center gap-1.5">
                    <FileText size={13} className="text-brand-primary" /> Tasks & Activities Completed
                  </h5>
                  <span className="text-[10px] text-text-mut font-semibold">Daily Breakdown</span>
                </div>

                <div className="space-y-2.5">
                  {(() => {
                    const text = selectedWeeklyReport.tasksCompleted || "";
                    if (!text.trim()) {
                      return (
                        <div className="bg-bg-base/40 p-4 rounded-[16px] text-xs text-text-mut border border-border-card text-center">
                          No tasks recorded for this week.
                        </div>
                      );
                    }

                    const rawLines = text.split("\n").map(l => l.trim()).filter(Boolean);
                    
                    const parsedItems = rawLines.map(line => {
                      const match = line.match(/^(?:•\s*)?\[(\d{4}-\d{2}-\d{2})\]\s*(.*)$/);
                      if (match) {
                        const date = match[1];
                        let content = match[2];
                        
                        let hours = "";
                        const hoursMatch = content.match(/\((\d+(?:\.\d+)?h)\)/i);
                        if (hoursMatch) {
                          hours = hoursMatch[1];
                          content = content.replace(/\((\d+(?:\.\d+)?h)\)/i, "").trim();
                        }

                        let issue = "";
                        const issueMatch = content.match(/\[Issue:\s*(.*?)\]/i);
                        if (issueMatch) {
                          issue = issueMatch[1];
                          content = content.replace(/\[Issue:\s*(.*?)\]/i, "").trim();
                        }

                        return { date, content, hours, issue };
                      }
                      return { date: null, content: line, hours: "", issue: "" };
                    });

                    return parsedItems.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex flex-col sm:flex-row sm:items-start gap-3.5 p-3.5 rounded-[14px] bg-bg-base/40 border border-border-card hover:border-brand-primary/30 transition-all shadow-sm"
                      >
                        {item.date ? (
                          <div className="sm:w-36 flex-shrink-0 flex sm:flex-col items-center sm:items-start justify-between gap-1.5 pt-0.5 border-b sm:border-b-0 sm:border-r border-border-card pb-2 sm:pb-0 sm:pr-3">
                            <span className="text-xs font-bold text-text-main flex items-center gap-1.5 whitespace-nowrap">
                              <Calendar size={12} className="text-brand-primary flex-shrink-0" />
                              {item.date}
                            </span>
                            {item.hours && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 whitespace-nowrap">
                                {item.hours}
                              </span>
                            )}
                          </div>
                        ) : null}
                        
                        <div className="flex-1 space-y-1.5">
                          <p className="text-xs leading-relaxed text-text-main font-medium">
                            {item.content}
                          </p>
                          {item.issue && item.issue.toLowerCase() !== "none" && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-[6px] border border-amber-500/20">
                              <span className="font-bold">Issue:</span> {item.issue}
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Remarks Section */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-text-sec flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-brand-primary" /> Supervisor Remarks & Hours
                </h5>
                <div className="bg-bg-base/40 p-4 rounded-[16px] text-xs leading-relaxed text-text-main border border-border-card whitespace-pre-wrap">
                  {selectedWeeklyReport.supervisorRemarks || "No supervisor remarks recorded."}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border-card bg-bg-base/40 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDownloadSingleWeeklyReportPDF(selectedWeeklyReport)}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-[12px] text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                title="Download this individual weekly report as an executive PDF document"
              >
                <Download size={14} />
                <span>Export Report PDF</span>
              </button>
              
              <button 
                onClick={() => setShowViewWeeklyReportModal(false)} 
                className="py-2.5 px-6 bg-brand-primary hover:bg-brand-hover text-white rounded-[12px] text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}







