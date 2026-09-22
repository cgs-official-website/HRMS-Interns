import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { 
  createNotification, 
  addTaskReport, 
  subscribeToTaskReports, 
  startTaskTimer, 
  stopTaskTimer,
  subscribeToMyDailyReports,
  addDailyReport,
  deleteDailyReport,
  subscribeToProjects,
  subscribeToUserTasks,
  updateUserTasks
} from "../firebase";
import { CheckCircle, Clock, Send, MessageSquare, Play, X, FileText, Download, Square, Activity, Plus, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import logoImg from '../assets/zuna-logo.png';
import { addStandardPDFHeader, addPDFFooter } from "../utils/pdfHeader";
import { uploadFileToFirebase } from "../firebase";
import FileCard from "../components/FileCard";
export default function TaskManagement() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAllReportsModal, setShowAllReportsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reportText, setReportText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedDownloadProject, setSelectedDownloadProject] = useState("All");

  // Daily log states
  const [activeSubTab, setActiveSubTab] = useState("tasks"); // "tasks" | "daily-logs"
  const [dailyReports, setDailyReports] = useState([]);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [dailyLogPage, setDailyLogPage] = useState(1);
  const logsPerPage = 10;
  
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logHours, setLogHours] = useState(8);
  const [logTasksCompleted, setLogTasksCompleted] = useState("");
  const [logIssuesFaced, setLogIssuesFaced] = useState("");
  const [logStatus, setLogStatus] = useState("Completed");
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [logProjectIds, setLogProjectIds] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (!currentUser?.companyId) return;
    const unsub = subscribeToProjects(currentUser.companyId, (data) => {
      setProjects(data || []);
    });
    return unsub;
  }, [currentUser]);

  // For storing fetched reports per task ID
  const [taskReports, setTaskReports] = useState({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const unsubscribe = subscribeToUserTasks(currentUser.uid, (rawTasks) => {
      // Auto-settle stale timers older than 12 hours
      rawTasks.forEach(t => {
        if (t.timerStartedAt) {
          const start = new Date(t.timerStartedAt).getTime();
          if (Date.now() - start > 12 * 3600 * 1000) {
            stopTaskTimer(currentUser.uid, t.id, t.assignedBy).catch(() => {});
          }
        }
      });
      const sorted = [...rawTasks].reverse().sort((a, b) => {
        const dateA = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
        const dateB = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
        if (dateA && dateB) return dateB - dateA;
        return 0;
      });
      setTasks(sorted);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Subscribe to reports for all tasks
  useEffect(() => {
    if (!tasks.length) return;
    
    const unsubs = [];
    tasks.forEach(t => {
      const unsub = subscribeToTaskReports(t.id, (reports) => {
        setTaskReports(prev => ({ ...prev, [t.id]: reports }));
      });
      unsubs.push(unsub);
    });
    
    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [tasks.length]);

  // Subscribe to my daily reports
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = subscribeToMyDailyReports(currentUser.uid, (data) => {
      setDailyReports(data || []);
    });
    return unsubscribe;
  }, [currentUser?.uid]);

  const getDayOfWeek = (dateString) => {
    if (!dateString) return "";
    const dateParts = dateString.split("-");
    const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[date.getUTCDay()];
  };

  const handleSaveDailyLog = async (e) => {
    e.preventDefault();
    if (!logTasksCompleted.trim()) {
      return showToast("Tasks Completed is required.", "warning");
    }
    if (logProjectIds.length === 0) {
      return showToast("Please select at least one project.", "warning");
    }

    setSubmitting(true);
    let fileData = null;
    try {
      if (pendingFile) {
        setUploadingFile(true);
        fileData = await uploadFileToFirebase(pendingFile, currentUser?.companyId || "", "Daily reports Attachments");
        setUploadingFile(false);
      }

      const selectedProjs = projects.filter(p => logProjectIds.includes(p.id));
      const projectName = selectedProjs.map(p => p.name).join(", ");

      const pmIdsToNotify = [...new Set(selectedProjs.map(p => p.managerId).filter(Boolean))];
      const pocIdsToNotify = [...new Set(selectedProjs.map(p => p.pocId).filter(Boolean))];

      await addDailyReport({
        userId: currentUser.uid,
        userName: currentUser.name,
        companyId: currentUser.companyId,
        projectId: logProjectIds.join(","),
        projectName,
        pmId: pmIdsToNotify.join(","),
        pocId: pocIdsToNotify.join(","),
        date: logDate,
        day: getDayOfWeek(logDate),
        hours: Number(logHours),
        tasksCompleted: logTasksCompleted,
        issuesFaced: logIssuesFaced,
        fileData: fileData || null,
        status: logStatus
      });

      const notifyMsg = `${currentUser.name} submitted a daily activity log for ${projectName} on ${logDate}.`;
      
      for (const pmId of pmIdsToNotify) {
        await createNotification(pmId, "New Daily Activity Log", notifyMsg, "info", "/project-management");
      }
      
      for (const pocId of pocIdsToNotify) {
        if (!pmIdsToNotify.includes(pocId)) {
          await createNotification(pocId, "New Daily Activity Log", notifyMsg, "info", "/project-management");
        }
      }

      showToast("Daily log submitted successfully!", "success");
      setShowAddLogModal(false);
      setLogDate(new Date().toISOString().split("T")[0]);
      setLogHours(8);
      setLogProjectIds([]);
      setLogTasksCompleted("");
      setLogIssuesFaced("");
      setLogStatus("Completed");
      setPendingFile(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to save daily log.", "error");
      setUploadingFile(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDailyLog = async (id) => {
    try {
      await deleteDailyReport(id);
      showToast("Daily log deleted.", "success");
    } catch (err) {
      showToast("Failed to delete log.", "error");
    }
  };

  const handleMarkComplete = async (taskIdx, isComplete) => {
    let updatedTasks = [...tasks];
    updatedTasks[taskIdx].completed = isComplete;
    setTasks(updatedTasks);

    try {
      await updateUserTasks(currentUser.uid, updatedTasks);
      showToast(isComplete ? "Task marked as completed!" : "Task marked as incomplete.", "success");
      
      // Notify PM if marked complete
      if (isComplete && updatedTasks[taskIdx].assignedBy) {
        await createNotification(
          updatedTasks[taskIdx].assignedBy,
          "Task Completed",
          `${currentUser.name} completed the task: "${updatedTasks[taskIdx].title}".`,
          "success",
          "/project-management"
        );
      }
    } catch (err) {
      showToast("Failed to update task", "error");
    }
  };

  const handleOpenReportModal = (task) => {
    setSelectedTask(task);
    setReportText("");
    setShowReportModal(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportText.trim()) return showToast("Report text is empty", "warning");

    setSubmitting(true);
    try {
      await addTaskReport(selectedTask.id, currentUser.uid, selectedTask.assignedBy, reportText);
      
      const newReport = {
        id: "rep_" + Date.now(),
        taskId: selectedTask.id,
        userId: currentUser.uid,
        userName: currentUser.name || "You",
        reportText: reportText,
        content: reportText,
        timeSpentMinutes: 0,
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
      setTaskReports(prev => ({
        ...prev,
        [selectedTask.id]: [newReport, ...(prev[selectedTask.id] || [])]
      }));

      if (selectedTask.assignedBy) {
        await createNotification(
          selectedTask.assignedBy,
          "New Task Update",
          `${currentUser.name} submitted an hourly update for "${selectedTask.title}".`,
          "info",
          "/project-management"
        );
      }
      
      showToast("Hourly report submitted successfully!", "success");
      setShowReportModal(false);
      setSelectedTask(null);
      setReportText("");
    } catch (err) {
      showToast("Failed to submit report", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

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
    const titleText = selectedDownloadProject === "All" ? "My Task Reports" : `Task Report: ${selectedDownloadProject}`;
    const subtitleText = `Employee: ${currentUser.name} | Downloaded: ${new Date().toLocaleString()}`;
    const startY = await addStandardPDFHeader(doc, titleText, subtitleText);
    
    const tableData = [];
    const tasksToExport = selectedDownloadProject === "All" ? tasks : tasks.filter(t => t.project === selectedDownloadProject);
    
    tasksToExport.forEach(t => {
      const status = t.completed ? "Done" : "Active";
      tableData.push([{ content: t.title, styles: { fontStyle: 'bold', fillColor: [243, 244, 246] } }, { content: status, styles: { fillColor: [243, 244, 246] } }, { content: `${t.duration || 0}h`, styles: { fillColor: [243, 244, 246] } }]);
      
      const reports = [...(taskReports[t.id] || [])].sort((a, b) => new Date(a.timestamp || a.createdAt || a.submittedAt) - new Date(b.timestamp || b.createdAt || b.submittedAt));
      if (reports.length > 0) {
        reports.forEach(r => {
          const reportDate = r.timestamp || r.createdAt || r.submittedAt;
          tableData.push([
            { content: `Update: ${r.reportText}`, colSpan: 2, styles: { textColor: [60, 60, 60], cellPadding: { left: 14, top: 6, bottom: 6, right: 8 } } },
            { content: reportDate ? new Date(reportDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—", styles: { fontSize: 8, textColor: [120, 120, 120], cellPadding: { left: 8, top: 6, bottom: 6, right: 8 }, halign: 'right' } }
          ]);
        });
      } else {
        tableData.push([
          { content: "No updates reported yet", colSpan: 3, styles: { fontStyle: 'italic', textColor: [150, 150, 150], cellPadding: { left: 14, top: 6, bottom: 6, right: 8 } } }
        ]);
      }
    });

    if (tableData.length === 0) {
      showToast("No data to export", "warning");
      return;
    }

    autoTable(doc, {
      head: [["Task Details", "Status", "Duration"]],
      body: tableData,
      startY: startY,
      styles: { fontSize: 9, font: "helvetica", cellPadding: { top: 6, bottom: 6, left: 4, right: 4 }, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10, cellPadding: { top: 8, bottom: 8, left: 4, right: 4 } },
      columnStyles: { 0: { cellWidth: 105, halign: 'left' }, 1: { halign: 'center', cellWidth: 25 }, 2: { halign: 'right', cellWidth: 52 } },
      theme: 'grid',
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    
    addPDFFooter(doc);
    const fileNameSuffix = selectedDownloadProject === "All" ? "My_Reports" : `Project_${selectedDownloadProject.replace(/\s+/g, '_')}`;
    doc.save(`${fileNameSuffix}_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("Task reports PDF exported!", "success");
  };

  const handleDownloadExcel = () => {
    const tableData = [];
    const tasksToExport = selectedDownloadProject === "All" ? tasks : tasks.filter(t => t.project === selectedDownloadProject);
    tasksToExport.forEach(t => {
      const status = t.completed ? "Done" : "Active";
      tableData.push({
        "Employee": currentUser.name,
        "Task Title": t.title,
        "Status": status,
        "Est. Hours": t.duration || 0,
        "Update Detail": "--- Task Summary ---",
        "Update Timestamp": ""
      });
      
      const reports = [...(taskReports[t.id] || [])].sort((a, b) => new Date(a.timestamp || a.createdAt || a.submittedAt) - new Date(b.timestamp || b.createdAt || b.submittedAt));
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

    if (tableData.length === 0) {
      showToast("No data to export", "warning");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    const sheetName = selectedDownloadProject === "All" ? "My Reports" : selectedDownloadProject.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileNameSuffix = selectedDownloadProject === "All" ? "My_Reports" : `Project_${selectedDownloadProject.replace(/\s+/g, '_')}`;
    XLSX.writeFile(wb, `${fileNameSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadSingleTaskPDF = async (task) => {
    const doc = new jsPDF();
    const titleText = `Task Report: ${task.title}`;
    const subtitleText = `Employee: ${currentUser.name} | Downloaded: ${new Date().toLocaleString()}`;
    let startY = await addStandardPDFHeader(doc, titleText, subtitleText);
    
    const tableData = [];
    const status = task.completed ? "Done" : "Active";
    tableData.push([{ content: task.title, styles: { fontStyle: 'bold', fillColor: [243, 244, 246] } }, { content: status, styles: { fillColor: [243, 244, 246] } }, { content: `${task.duration || 0}h`, styles: { fillColor: [243, 244, 246] } }]);
    
    const reports = [...(taskReports[task.id] || [])].sort((a, b) => new Date(a.timestamp || a.createdAt || a.submittedAt) - new Date(b.timestamp || b.createdAt || b.submittedAt));
    if (reports.length > 0) {
      reports.forEach(r => {
        const reportDate = r.timestamp || r.createdAt || r.submittedAt;
        tableData.push([
          { content: `Update: ${r.reportText}`, colSpan: 2, styles: { textColor: [60, 60, 60], cellPadding: { left: 14, top: 6, bottom: 6, right: 8 } } },
          { content: reportDate ? new Date(reportDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—", styles: { fontSize: 8, textColor: [120, 120, 120], cellPadding: { left: 8, top: 6, bottom: 6, right: 8 }, halign: 'right' } }
        ]);
      });
    } else {
      tableData.push([
        { content: "No updates reported yet", colSpan: 3, styles: { fontStyle: 'italic', textColor: [150, 150, 150], cellPadding: { left: 14, top: 6, bottom: 6, right: 8 } } }
      ]);
    }

    autoTable(doc, {
      head: [["Task Details", "Status", "Duration"]],
      body: tableData,
      startY: startY,
      styles: { fontSize: 9, font: "helvetica", cellPadding: { top: 6, bottom: 6, left: 4, right: 4 }, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10, cellPadding: { top: 8, bottom: 8, left: 4, right: 4 } },
      columnStyles: { 0: { cellWidth: 105, halign: 'left' }, 1: { halign: 'center', cellWidth: 25 }, 2: { halign: 'right', cellWidth: 52 } },
      theme: 'grid',
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    
    addPDFFooter(doc);
    doc.save(`Task_Report_${task.title.replace(/\s+/g, '_').substring(0,10)}_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("Task report PDF exported!", "success");
  };

  const handleDownloadDailyLogPDF = async () => {
    if (dailyReports.length === 0) return showToast("No daily logs to download.", "warning");
    
    const doc = new jsPDF();
    const titleText = "Daily Activity Log Report";
    const subtitleText = `Employee: ${currentUser.name} | Generated: ${new Date().toLocaleDateString()}`;
    const startY = await addStandardPDFHeader(doc, titleText, subtitleText);

    const tableData = dailyReports.map((report) => [
      report.date,
      report.hours + "h",
      report.tasksCompleted || "-",
      report.issuesFaced || "-",
      report.status || "Completed"
    ]);

    autoTable(doc, {
      head: [["Date", "Hours", "Tasks Completed", "Issues Faced", "Status"]],
      body: tableData,
      startY: startY + 5,
      styles: { fontSize: 9, font: "helvetica", cellPadding: 6, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 4: { halign: 'center' } },
      theme: 'grid',
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    addPDFFooter(doc);
    doc.save(`Daily_Activity_Log_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("Daily activity log PDF exported successfully.", "success");
  };

  const handleDownloadDailyLogExcel = () => {
    if (dailyReports.length === 0) return showToast("No daily logs to download.", "warning");
    
    const excelData = dailyReports.map((report) => ({
      "Date": report.date,
      "Hours": report.hours,
      "Tasks Completed": report.tasksCompleted || "-",
      "Issues Faced": report.issuesFaced || "-",
      "Supervisor Remarks": report.supervisorRemarks || "-",
      "Status": report.status || "Completed"
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Log");
    XLSX.writeFile(workbook, `Daily_Activity_Log_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Excel spreadsheet generated successfully.", "success");
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Task & Activity Management</h1>
          <p className="text-sm text-text-mut font-medium mt-1">
            Your current projects: <span className="font-bold text-brand-primary">{(currentUser.projects && currentUser.projects.length > 0) ? currentUser.projects.join(', ') : (currentUser.project || "Unassigned")}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-card mb-6">
        <button
          onClick={() => setActiveSubTab("tasks")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === "tasks"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-mut hover:text-text-main"
          }`}
        >
          My Tasks
        </button>
        <button
          onClick={() => setActiveSubTab("daily-logs")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === "daily-logs"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-mut hover:text-text-main"
          }`}
        >
          Daily Activity Log
        </button>
      </div>

      {activeSubTab === "tasks" ? (
        <>
          {loading ? (
            <div className="flex justify-center p-10"><span className="text-text-mut">Loading tasks...</span></div>
          ) : tasks.length === 0 ? (
            <div className="bg-bg-card border border-border-card rounded-[20px] p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-brand-primary" />
              </div>
              <h3 className="text-lg font-bold text-text-main">No Tasks Assigned</h3>
              <p className="text-xs text-text-sec max-w-sm mt-2">
                You currently have no tasks assigned to you for this project. Check back later or contact your Project Manager.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Tasks Column */}
              <div className="space-y-4">
                <h2 className="font-extrabold text-sm text-text-main uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-warning animate-pulse"></span>
                  Active Tasks ({activeTasks.length})
                </h2>
                
                {activeTasks.length === 0 ? (
                  <div className="p-6 border border-dashed border-border-card rounded-[16px] text-center text-text-mut text-xs">
                    No active tasks.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                    {activeTasks.map((task) => {
                      const taskIdx = tasks.findIndex(t => t.id === task.id);
                    return (
                      <div key={task.id} className="bg-bg-card border border-border-card rounded-[16px] p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group text-left">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary/60 group-hover:bg-brand-primary transition-colors"></div>
                        
                        <div className="flex justify-between items-start mb-1 text-left">
                          <h3 className="font-bold text-text-main pr-4">{task.title}</h3>
                          <button 
                            onClick={() => handleMarkComplete(taskIdx, true)}
                            className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-border-card flex items-center justify-center text-transparent hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all cursor-pointer"
                            title="Mark as completed"
                          >
                            <CheckCircle size={14} />
                          </button>
                        </div>
                        {task.project && (
                          <div className="mb-3 text-left">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-[4px] bg-brand-primary/10 text-brand-primary uppercase tracking-wider">{task.project}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-[10px] font-semibold text-text-sec mb-4">
                          <div className="flex items-center gap-1 bg-bg-base px-2 py-1 rounded-[6px]">
                            <Clock size={12} className="text-brand-primary" />
                            <span>Est: {task.duration || 0}h | Rem: {parseFloat(Math.max(0, (task.duration || 0) - calculateTimeSpent(taskReports[task.id] || [])).toFixed(1))}h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            <span>{(taskReports[task.id] || []).filter(r => !r.reportText.startsWith("Worked for") && !r.reportText.startsWith("Auto-stopped") && !r.reportText.startsWith("Auto-paused")).length} Updates</span>
                          </div>
                          {task.timerStartedAt && (
                            <div className="flex items-center gap-1 bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-[6px] animate-pulse">
                              <Activity size={12} />
                              <span>
                                {(() => {
                                  const startedTime = new Date(task.timerStartedAt).getTime();
                                  const rawElapsed = Math.max(0, Math.floor((now - startedTime) / 1000));
                                  // Cap session to maximum 8 hours (28800s) to prevent multiday runaway counts
                                  const elapsedThisSession = Math.min(rawElapsed, 8 * 3600);
                                  const previousSeconds = Math.floor(calculateTimeSpent(taskReports[task.id] || []) * 3600);
                                  const totalElapsed = elapsedThisSession + previousSeconds;
                                  const h = Math.floor(totalElapsed / 3600);
                                  const m = Math.floor((totalElapsed % 3600) / 60);
                                  const s = totalElapsed % 60;
                                  return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-4 border-t border-border-card/50 flex justify-between items-center">
                          <div className="flex gap-2">
                            {!task.timerStartedAt ? (
                              <button 
                                onClick={async () => {
                                  const updated = tasks.map(t => ({
                                    ...t,
                                    timerStartedAt: t.id === task.id ? new Date().toISOString() : null
                                  }));
                                  setTasks(updated);
                                  await startTaskTimer(currentUser.uid, task.id);
                                }}
                                className="py-1.5 px-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-[8px] text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Play size={12} />
                                <span>Start</span>
                              </button>
                            ) : (
                              <button 
                                onClick={async () => {
                                  const updated = tasks.map(t => {
                                    if (t.id === task.id) return { ...t, timerStartedAt: null };
                                    return t;
                                  });
                                  setTasks(updated);
                                  await stopTaskTimer(currentUser.uid, task.id, task.assignedBy);
                                }}
                                className="py-1.5 px-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-[8px] text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Square size={12} fill="currentColor" />
                                <span>Stop Timer</span>
                              </button>
                            )}
                          </div>
                          <button 
                            onClick={() => handleOpenReportModal(task)}
                            className="py-1.5 px-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-[8px] text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Send size={12} />
                            <span>Manual Update</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>

              {/* Completed Tasks Column */}
              <div className="space-y-4">
                <h2 className="font-extrabold text-sm text-text-main uppercase tracking-wider flex items-center gap-2 opacity-80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Completed Tasks ({completedTasks.length})
                </h2>
                
                {completedTasks.length === 0 ? (
                  <div className="p-6 border border-dashed border-border-card rounded-[16px] text-center text-text-mut text-xs">
                    No completed tasks yet.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                    {completedTasks.map((task) => {
                      const taskIdx = tasks.findIndex(t => t.id === task.id);
                      return (
                        <div key={task.id} className="bg-bg-base/30 border border-border-card rounded-[16px] p-4 relative overflow-hidden opacity-70 hover:opacity-100 transition-opacity text-left">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                              <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <h3 className="font-bold text-text-sec line-through">{task.title}</h3>
                                {task.project && <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] bg-bg-card border border-border-card text-text-mut uppercase">{task.project}</span>}
                                <p className="text-[10px] text-text-mut mt-1">
                                  Est: {task.duration || 0}h | <span className="text-brand-primary font-bold">Rem: {parseFloat(Math.max(0, (task.duration || 0) - calculateTimeSpent(taskReports[task.id] || [])).toFixed(1))}h</span>
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleMarkComplete(taskIdx, false)}
                              className="text-[10px] font-bold text-brand-primary hover:underline cursor-pointer flex-shrink-0 ml-2"
                            >
                              Re-open
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabular History directly on page */}
          <div className="mt-12 bg-bg-card border border-border-card rounded-[24px] p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-5 border-b border-border-card pb-5 gap-3 flex-shrink-0 relative mt-2 text-left">
              <h3 className="font-bold text-xl text-text-main flex items-center gap-2 whitespace-nowrap">
                <FileText size={20} className="text-brand-primary" />
                My Task History
              </h3>
              <div className="flex items-center justify-end gap-3 w-full sm:w-auto flex-wrap">
                {(() => {
                  const uniqueProjects = [...new Set(tasks.map(t => t.project).filter(Boolean))];
                  if (uniqueProjects.length > 0) {
                    return (
                      <select
                        value={selectedDownloadProject}
                        onChange={(e) => setSelectedDownloadProject(e.target.value)}
                        className="py-2 px-3 bg-bg-base border border-border-card rounded-[10px] text-xs font-bold text-text-main outline-none focus:border-brand-primary/50 transition-colors cursor-pointer"
                      >
                        <option value="All">All Projects</option>
                        {uniqueProjects.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    );
                  }
                  return null;
                })()}
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
            
            <div className="overflow-x-auto w-full custom-scrollbar text-left">
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
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-xs text-text-mut">No tasks found.</td>
                    </tr>
                  ) : (
                    (() => {
                      const tasksToExport = selectedDownloadProject === "All" ? tasks : tasks.filter(t => t.project === selectedDownloadProject);
                      if (tasksToExport.length === 0) {
                        return (
                          <tr>
                            <td colSpan="4" className="p-6 text-center text-xs text-text-mut">No tasks found for selected project.</td>
                          </tr>
                        );
                      }
                      return tasksToExport.map((task, idx) => (
                      <React.Fragment key={task.id || idx}>
                        <tr className="border-b border-border-card/50">
                          <td className="p-3 text-xs font-bold text-text-main">{currentUser.name}</td>
                          <td className="p-3 text-xs text-text-main">
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
                              {parseFloat(Math.max(0, (task.duration || 0) - calculateTimeSpent(taskReports[task.id] || [])).toFixed(1))}h rem
                            </div>
                          </td>
                        </tr>
                        {(!taskReports[task.id] || taskReports[task.id].filter(r => !r.reportText.startsWith("Worked for") && !r.reportText.startsWith("Auto-stopped") && !r.reportText.startsWith("Auto-paused")).length === 0) ? (
                          <tr className="border-b border-border-card">
                            <td colSpan="4" className="p-3 bg-bg-base/30 text-center text-[10px] text-text-mut italic">
                              No updates reported yet
                            </td>
                          </tr>
                        ) : (
                          <tr className="border-b border-border-card">
                            <td colSpan="4" className="p-3 bg-bg-base/30">
                              <div className="pl-4 border-l-2 border-brand-primary/30 space-y-2">
                                {taskReports[task.id].filter(r => !r.reportText.startsWith("Worked for") && !r.reportText.startsWith("Auto-stopped") && !r.reportText.startsWith("Auto-paused")).map(r => {
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
                    ));
                  })()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 text-left">
          {/* Header block for Daily Log */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-text-main">Daily Activity Log</h2>
              <p className="text-xs text-text-sec mt-1">Submit your daily updates and view supervisor feedback.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadDailyLogPDF}
                className="py-2.5 px-4 bg-bg-card hover:bg-bg-base border border-border-card text-text-main text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                title="Download PDF Report"
              >
                <FileText size={15} className="text-brand-danger" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleDownloadDailyLogExcel}
                className="py-2.5 px-4 bg-bg-card hover:bg-bg-base border border-border-card text-text-main text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                title="Download Excel Report"
              >
                <Download size={15} className="text-brand-success" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={() => {
                  setLogDate(new Date().toISOString().split("T")[0]);
                  setShowAddLogModal(true);
                }}
                className="py-2.5 px-4 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] shadow-md shadow-brand-primary/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Daily Log</span>
              </button>
            </div>
          </div>

          {/* Daily Logs Table */}
          <div className="bg-bg-card border border-border-card rounded-[24px] overflow-hidden shadow-sm text-left">
            {dailyReports.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
                  <FileText size={22} />
                </div>
                <p className="text-sm font-bold text-text-main">No daily logs submitted</p>
                <p className="text-xs text-text-mut mt-1">You haven't logged any daily activities yet. Click "Add Daily Log" above.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto w-full custom-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-card bg-bg-base/30 text-[10px] uppercase font-bold tracking-wider text-text-mut">
                      <th className="px-6 py-4 w-12 text-center">#</th>
                      <th className="px-6 py-4 w-28 text-left">Date</th>
                      <th className="px-6 py-4 w-28 text-left">Day</th>
                      <th className="px-6 py-4 w-20 text-center">Hours</th>
                      <th className="px-6 py-4 text-left">Tasks Completed</th>
                      <th className="px-6 py-4 text-left">Issues Faced</th>
                      <th className="px-6 py-4 text-left">Supervisor Remarks</th>
                      <th className="px-6 py-4 text-left">Attachment</th>
                      <th className="px-6 py-4 w-28 text-center">Status</th>
                      <th className="px-6 py-4 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const indexOfLastLog = dailyLogPage * logsPerPage;
                      const indexOfFirstLog = indexOfLastLog - logsPerPage;
                      const currentLogs = dailyReports.slice(indexOfFirstLog, indexOfLastLog);

                      return currentLogs.map((report, idx) => {
                        const actualIdx = indexOfFirstLog + idx;
                        let statusBadge = "bg-brand-primary/10 text-brand-primary border border-brand-primary/20";
                      if (report.status === "Completed") statusBadge = "bg-green-500/10 text-green-500 border border-green-500/20";
                      if (report.status === "On Hold") statusBadge = "bg-red-500/10 text-red-500 border border-red-500/20";

                      return (
                        <tr key={report.id || actualIdx} className="border-b border-border-card hover:bg-bg-base/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-center text-text-sec">{actualIdx + 1}</td>
                          <td className="px-6 py-4 font-bold text-text-main whitespace-nowrap">{report.date}</td>
                          <td className="px-6 py-4 text-text-sec whitespace-nowrap">{report.day || getDayOfWeek(report.date)}</td>
                          <td className="px-6 py-4 font-extrabold text-center text-text-main">{report.hours} h</td>
                          <td className="px-6 py-4">
                            <div className="max-h-[120px] overflow-y-auto custom-scrollbar text-text-sec max-w-xs break-words whitespace-pre-wrap pr-2">
                              {report.tasksCompleted}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-h-[120px] overflow-y-auto custom-scrollbar text-text-mut max-w-xs break-words whitespace-pre-wrap pr-2">
                              {report.issuesFaced || <span className="italic text-text-mut/40">—</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-h-[120px] overflow-y-auto custom-scrollbar max-w-xs break-words pr-2">
                              {report.supervisorRemarks ? (
                                <span className="text-brand-primary font-bold">{report.supervisorRemarks}</span>
                              ) : (
                                <span className="text-text-mut/40 italic">No remarks yet</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {report.fileData ? (
                              <FileCard file={report.fileData} />
                            ) : (
                              <span className="text-text-mut/40 italic">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusBadge}`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteDailyLog(report.id)}
                              className="p-1.5 text-text-mut hover:text-red-500 hover:bg-red-500/10 rounded-[6px] transition-colors cursor-pointer"
                              title="Delete log"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {Math.ceil(dailyReports.length / logsPerPage) > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border-card bg-bg-base/10">
                  <span className="text-xs font-bold text-text-mut">
                    Showing {(dailyLogPage - 1) * logsPerPage + 1} to {Math.min(dailyLogPage * logsPerPage, dailyReports.length)} of {dailyReports.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDailyLogPage(p => Math.max(1, p - 1))}
                      disabled={dailyLogPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-border-card text-xs font-bold text-text-sec hover:bg-bg-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.ceil(dailyReports.length / logsPerPage) }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setDailyLogPage(i + 1)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                            dailyLogPage === i + 1
                              ? "bg-brand-primary text-white"
                              : "text-text-sec hover:bg-bg-base"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setDailyLogPage(p => Math.min(Math.ceil(dailyReports.length / logsPerPage), p + 1))}
                      disabled={dailyLogPage === Math.ceil(dailyReports.length / logsPerPage)}
                      className="px-3 py-1.5 rounded-lg border border-border-card text-xs font-bold text-text-sec hover:bg-bg-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODALS RENDERED IN PORTALS */}

      {/* Hourly Report Modal */}
      {showReportModal && selectedTask && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in text-left">
          <div className="w-full max-w-[500px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4 flex-shrink-0">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <Play size={18} className="text-brand-primary" fill="currentColor" />
                Hourly Update
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownloadSingleTaskPDF(selectedTask)}
                  className="py-1.5 px-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-[8px] text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Download Task Report"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button onClick={() => setShowReportModal(false)} className="text-text-mut hover:text-text-main font-bold cursor-pointer"><X size={18} /></button>
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-4">
              <div className="bg-bg-base/50 p-3 rounded-[12px] border border-border-card">
                <p className="text-[10px] text-text-sec uppercase font-extrabold tracking-wider mb-1">Task</p>
                <p className="text-sm font-bold text-text-main">{selectedTask.title}</p>
              </div>

              {/* Previous Reports History */}
              {taskReports[selectedTask.id] && taskReports[selectedTask.id].length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-text-sec uppercase font-extrabold tracking-wider">Previous Updates</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar border border-border-card rounded-[12px] p-2 bg-bg-base/20">
                    {taskReports[selectedTask.id].filter(r => !r.reportText.startsWith("Worked for") && !r.reportText.startsWith("Auto-stopped") && !r.reportText.startsWith("Auto-paused")).map(r => (
                      <div key={r.id} className="bg-bg-card p-2 rounded-[8px] border border-border-card/50">
                        <p className="text-xs text-text-main">{r.reportText}</p>
                        <p className="text-[9px] text-text-mut mt-1 text-right">
                          {(() => {
                            const d = r.timestamp || r.createdAt || r.submittedAt;
                            return d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";
                          })()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitReport} className="pt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-sec uppercase tracking-wider">New Update</label>
                  <textarea 
                    className="w-full px-3 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all min-h-[100px] resize-none"
                    placeholder="E.g., Designed the hero section and started on the footer..."
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4 mt-2">
                  <button type="button" onClick={() => setShowReportModal(false)} className="py-2.5 px-4 border border-border-card rounded-[10px] text-xs font-bold text-text-sec hover:bg-bg-base cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submitting || !reportText.trim()} className="py-2.5 px-5 bg-brand-primary hover:bg-brand-hover text-white rounded-[10px] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    <Send size={14} />
                    <span>{submitting ? "Sending..." : "Submit Report"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Daily Activity Log Modal */}
      {showAddLogModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in text-left">
          <div className="w-full max-w-[480px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4 flex-shrink-0">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <FileText size={20} className="text-brand-primary" />
                <span>Add Daily Activity Log</span>
              </h3>
              <button onClick={() => setShowAddLogModal(false)} className="text-text-mut hover:text-text-main font-bold cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveDailyLog} className="flex-grow overflow-y-auto pr-1 space-y-4 pb-2 custom-scrollbar">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec">Projects (Select one or more)</label>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto bg-bg-base/30 p-3 rounded-[12px] border border-border-card custom-scrollbar">
                    {projects
                      .filter(p => (p.teamMembers || []).includes(currentUser?.uid) || p.managerId === currentUser?.uid || (currentUser?.projects || []).includes(p.name))
                      .map(p => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="accent-brand-primary"
                            checked={logProjectIds.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLogProjectIds(prev => [...prev, p.id]);
                              } else {
                                setLogProjectIds(prev => prev.filter(id => id !== p.id));
                              }
                            }}
                          />
                          <span className="text-xs text-text-main">{p.name}</span>
                        </label>
                    ))}
                    {projects.filter(p => (p.teamMembers || []).includes(currentUser?.uid) || p.managerId === currentUser?.uid || (currentUser?.projects || []).includes(p.name)).length === 0 && (
                      <span className="text-xs text-text-mut italic">No projects assigned</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec">Date</label>
                  <input 
                    type="date"
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec">Day (Auto)</label>
                  <input 
                    type="text"
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-xs text-text-mut outline-none font-bold select-none"
                    value={getDayOfWeek(logDate)}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec">Hours Worked</label>
                  <input 
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec">Status</label>
                  <select 
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all cursor-pointer"
                    value={logStatus}
                    onChange={(e) => setLogStatus(e.target.value)}
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec">Tasks Completed *</label>
                <textarea 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all min-h-[100px] resize-none"
                  placeholder="Summarize the tasks you completed today..."
                  value={logTasksCompleted}
                  onChange={(e) => setLogTasksCompleted(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec">Issues Faced (Optional)</label>
                <textarea 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all min-h-[80px] resize-none"
                  placeholder="Describe any blockers or issues faced today..."
                  value={logIssuesFaced}
                  onChange={(e) => setLogIssuesFaced(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec">Attachment (Optional)</label>
                <div className="relative">
                  <input 
                    type="file"
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all file:mr-4 file:py-1 file:px-3 file:rounded-[8px] file:border-0 file:text-xs file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"
                    onChange={(e) => setPendingFile(e.target.files[0] || null)}
                  />
                  {pendingFile && (
                    <button
                      type="button"
                      onClick={() => setPendingFile(null)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-mut hover:text-red-500 rounded-full hover:bg-bg-card transition-colors"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {uploadingFile && (
                  <p className="text-[10px] text-brand-primary font-bold mt-1 animate-pulse">
                    File will be securely uploaded when saving...
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border-card flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="py-2.5 px-4 bg-bg-base hover:bg-border-card text-text-sec text-xs font-bold rounded-[12px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] shadow-md shadow-brand-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (uploadingFile ? "Uploading..." : "Submitting...") : "Save Log"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

