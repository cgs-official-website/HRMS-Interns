import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useModal } from "../context/ModalContext";
import { 
  subscribeToAllUsers,
  subscribeToTaskReports,
  subscribeToDailyReports,
  updateDailyReport,
  subscribeToProjects,
  addTeamMemberToProject,
  updateUserTasks
} from "../firebase";
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  User, 
  Briefcase, 
  Clock, 
  FileText, 
  CheckCircle, 
  X, 
  MessageSquare,
  ClipboardList,
  AlertCircle,
  UserPlus,
  Plus
} from "lucide-react";

export default function ProjectCalendar() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { showConfirm } = useModal();

  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTeammateId, setSelectedTeammateId] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDuration, setNewTaskDuration] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dailyReports, setDailyReports] = useState([]);
  const [allTaskReports, setAllTaskReports] = useState({});

  // Calendar navigation states
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Filters
  const [filterProject, setFilterProject] = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");

  // Remarks Modal State
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [selectedReportForRemarks, setSelectedReportForRemarks] = useState(null);
  const [remarksText, setRemarksText] = useState("");
  const [remarksStatus, setRemarksStatus] = useState("Completed");

  // Project Details Modal State
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);

  // Task Logs section filters
  const [logsFilterProject, setLogsFilterProject] = useState("All");
  const [logsFilterUser, setLogsFilterUser] = useState("All");
  const [logsPage, setLogsPage] = useState(1);
  const LOGS_PER_PAGE = 15;

  const isAdmin = currentUser?.role === "admin";
  
  // Memoized managed projects list for the current user
  const managedProjects = React.useMemo(() => {
    if (isAdmin) return projects;
    const uId = currentUser?.uid || currentUser?.id;
    return projects.filter(p => p.managerId === uId || p.manager_id === uId);
  }, [projects, currentUser, isAdmin]);

  const isProjectManager = managedProjects.length > 0;

  // Memoized teamMembers calculation based on role and project involvement
  const teamMembers = React.useMemo(() => {
    if (!currentUser || allUsers.length === 0) return [];
    
    if (isAdmin) {
      return allUsers.filter(u => u.role !== "admin");
    }
    
    if (isProjectManager) {
      const uId = currentUser?.uid || currentUser?.id;
      const teammateIds = managedProjects.flatMap(p => p.teamMembers || p.team_members || []);
      return allUsers.filter(u => (teammateIds.includes(u.uid) || teammateIds.includes(u.id)) && u.uid !== uId && u.id !== uId && u.role !== "admin");
    }
    
    const me = allUsers.find(u => u.uid === currentUser.uid || u.id === currentUser.id);
    return me ? [me] : [currentUser];
  }, [allUsers, projects, currentUser, isAdmin, isProjectManager, managedProjects]);

  const pmProjects = React.useMemo(() => {
    if (isAdmin) {
      return [...new Set(projects.map(p => p.name).filter(Boolean))];
    }
    if (isProjectManager) {
      return [...new Set(managedProjects.map(p => p.name).filter(Boolean))];
    }
    return currentUser?.projects?.length ? currentUser.projects : (currentUser?.project ? [currentUser.project] : []);
  }, [projects, managedProjects, currentUser, isAdmin, isProjectManager]);

  const cleanDateStr = (d) => {
    if (!d) return "";
    if (typeof d === "string") return d.split("T")[0];
    if (d instanceof Date && !isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayNum = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dayNum}`;
    }
    return String(d);
  };

  const getProjectsForDate = (dateString) => {
    if (!dateString) return [];
    return projects.filter(proj => {
      if (!isAdmin) {
        const uId = currentUser?.uid || currentUser?.id;
        const isInvolved = proj.managerId === uId || proj.manager_id === uId || 
          (proj.teamMembers || []).includes(uId) || (proj.team_members || []).includes(uId) || 
          (currentUser?.projects || []).includes(proj.name) || 
          currentUser?.project === proj.name;
        if (!isInvolved) return false;
      }
      const start = cleanDateStr(proj.startDate || proj.start_date);
      const end = cleanDateStr(proj.endDate || proj.end_date || proj.startDate || proj.start_date);
      if (!start) return false;
      return dateString >= start && dateString <= end;
    });
  };

  const selectedDateProjects = React.useMemo(() => {
    return getProjectsForDate(selectedDate);
  }, [selectedDate, projects, isAdmin, currentUser]);

  // Fetch All Users in Company
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToAllUsers(currentUser.companyId, (users) => {
      setAllUsers(users || []);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser]);

  // Fetch projects in Company
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToProjects(currentUser.companyId, (data) => {
      setProjects(data || []);
    });
    return unsubscribe;
  }, [currentUser]);

  // Subscribe to task reports for all team members
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

  // Subscribe to daily work logs
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToDailyReports(currentUser.companyId, (data) => {
      setDailyReports(data || []);
    });
    return unsubscribe;
  }, [currentUser]);

  const handleAddTeammate = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedTeammateId) {
      return showToast("Please select a project and teammate", "warning");
    }

    try {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (!proj) return showToast("Project not found", "error");

      await addTeamMemberToProject(selectedProjectId, selectedTeammateId, proj.name);
      showToast("Teammate added successfully", "success");
      setShowAddTeamModal(false);
      setSelectedTeammateId("");
    } catch (err) {
      console.error(err);
      showToast("Failed to add teammate", "error");
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedTeammateId || !newTaskTitle || !newTaskDuration) {
      return showToast("Please fill in all fields", "warning");
    }

    try {
      const targetUser = allUsers.find(u => u.uid === selectedTeammateId);
      if (!targetUser) return showToast("Selected teammate not found", "error");

      const proj = projects.find(p => p.id === selectedProjectId);
      if (!proj) return showToast("Project not found", "error");

      const newTask = {
        id: "task_" + Date.now(),
        title: newTaskTitle,
        project: proj.name,
        duration: parseFloat(newTaskDuration) || 0,
        completed: false,
        createdAt: new Date().toISOString(),
        assignedBy: currentUser.uid,
        timerStartedAt: null
      };

      const currentTasks = targetUser.tasks || [];
      const updatedTasks = [...currentTasks, newTask];

      await updateUserTasks(selectedTeammateId, updatedTasks);
      // Optimistic update
      setAllUsers(prev => prev.map(u => u.uid === selectedTeammateId ? { ...u, tasks: updatedTasks } : u));

      showToast("Task assigned successfully", "success");
      setShowAssignTaskModal(false);
      setNewTaskTitle("");
      setNewTaskDuration(1);
      setSelectedTeammateId("");
    } catch (err) {
      console.error(err);
      showToast("Failed to assign task", "error");
    }
  };

  // Handle month toggle
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };


  // Filter daily reports and tasks
  const filteredDailyReports = dailyReports.filter(r => {
    // Filter by project
    if (filterProject !== "All") {
      if (r.projectName !== filterProject) return false;
    } else {
      // If PM, restrict to PM projects
      if (!isAdmin && !pmProjects.includes(r.projectName)) return false;
    }
    // Filter by employee
    if (filterEmployee !== "All" && r.userId !== filterEmployee) return false;

    return true;
  });

  // Get active tasks and their reports for all team members
  const activeTasksList = [];
  teamMembers.forEach(m => {
    if (filterEmployee !== "All" && m.uid !== filterEmployee) return;

    const uProjects = m.projects?.length ? m.projects : (m.project ? [m.project] : []);
    const matchingProjects = isAdmin ? uProjects : uProjects.filter(p => pmProjects.includes(p));
    
    if (filterProject !== "All" && !matchingProjects.includes(filterProject)) return;
    if (!isAdmin && matchingProjects.length === 0) return;

    (m.tasks || []).forEach(t => {
      if (filterProject !== "All" && t.project !== filterProject) return;
      if (!isAdmin && !pmProjects.includes(t.project)) return;

      const reports = allTaskReports[t.id] || [];
      activeTasksList.push({
        ...t,
        userId: m.uid,
        userName: m.name,
        reports
      });
    });
  });

  // Build Calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Day of week (0-6)
  
  const monthDays = [];
  // Padding cells for previous month days
  for (let i = 0; i < firstDayIndex; i++) {
    monthDays.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    monthDays.push(i);
  }
  // Padding cells to make weeks complete
  while (monthDays.length % 7 !== 0) {
    monthDays.push(null);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to get activity state for a date
  const getDateActivity = (day) => {
    if (!day) return null;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const logs = filteredDailyReports.filter(r => r.date === dateStr);
    const tasksAssigned = activeTasksList.filter(t => t.assignedAt?.startsWith(dateStr));
    const taskReports = activeTasksList.flatMap(t => t.reports.filter(rep => rep.createdAt?.startsWith(dateStr) && !rep.reportText.startsWith("Worked for") && !rep.reportText.startsWith("Auto-stopped") && !rep.reportText.startsWith("Auto-paused")));

    return {
      dateStr,
      hasLogs: logs.length > 0,
      hasTasks: tasksAssigned.length > 0 || taskReports.length > 0,
      logs,
      tasks: tasksAssigned,
      taskReports
    };
  };

  // Activity for currently selected date
  const selectedActivity = (() => {
    if (!selectedDate) return { logs: [], tasks: [], taskReports: [] };
    const logs = filteredDailyReports.filter(r => r.date === selectedDate);
    const tasksAssigned = activeTasksList.filter(t => t.assignedAt?.startsWith(selectedDate));
    const taskReports = activeTasksList.flatMap(t => t.reports.filter(rep => rep.createdAt?.startsWith(selectedDate) && !rep.reportText.startsWith("Worked for") && !rep.reportText.startsWith("Auto-stopped") && !rep.reportText.startsWith("Auto-paused")));

    return {
      logs,
      tasks: tasksAssigned,
      taskReports
    };
  })();

  const handleOpenRemarks = (report) => {
    setSelectedReportForRemarks(report);
    setRemarksText(report.supervisorRemarks || "");
    setRemarksStatus(report.status || "Completed");
    setShowRemarksModal(true);
  };

  const handleSaveRemarks = async (e) => {
    e.preventDefault();
    if (!selectedReportForRemarks) return;

    try {
      await updateDailyReport(selectedReportForRemarks.id, {
        supervisorRemarks: remarksText,
        status: remarksStatus
      });
      showToast("Supervisor remarks updated successfully!", "success");
      setShowRemarksModal(false);
      setSelectedReportForRemarks(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to update remarks: " + err.message, "error");
    }
  };

  return (
    <div className="animate-fade-in p-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-card pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-main flex items-center gap-3">
            <ClipboardList className="text-brand-primary shrink-0" size={32} />
            Project Calendar
          </h1>
          <p className="text-text-mut font-medium mt-1 text-sm">
            Track daily logs, tasks, and reports across your managed projects.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {/* Project Filter */}
          <div className="flex flex-col gap-1 w-[180px]">
            <label className="text-[10px] font-bold text-text-mut uppercase">Filter Project</label>
            <select
              className="w-full bg-bg-card border border-border-card rounded-[12px] px-3.5 py-2.5 text-xs font-bold text-text-main focus:border-brand-primary outline-none transition-all cursor-pointer"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="All">All Projects</option>
              {pmProjects.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div className="flex flex-col gap-1 w-[180px]">
            <label className="text-[10px] font-bold text-text-mut uppercase">Filter Team Member</label>
            <select
              className="w-full bg-bg-card border border-border-card rounded-[12px] px-3.5 py-2.5 text-xs font-bold text-text-main focus:border-brand-primary outline-none transition-all cursor-pointer"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
            >
              <option value="All">All Team Members</option>
              {teamMembers.map(m => (
                <option key={m.uid} value={m.uid}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-text-mut font-bold">Loading team reports...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column - Monthly Calendar Grid (Span 7) */}
          <div className="lg:col-span-7 bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-purple-500"></div>
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-text-main">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={prevMonth}
                  className="p-2 border border-border-card rounded-[10px] bg-bg-base hover:bg-border-card hover:text-brand-primary text-text-sec transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(today.getMonth());
                    setCurrentYear(today.getFullYear());
                    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                  }}
                  className="px-3.5 py-1.5 border border-border-card rounded-[10px] bg-bg-base hover:bg-border-card hover:text-brand-primary text-xs font-bold text-text-sec transition-all cursor-pointer"
                >
                  Today
                </button>
                <button 
                  onClick={nextMonth}
                  className="p-2 border border-border-card rounded-[10px] bg-bg-base hover:bg-border-card hover:text-brand-primary text-text-sec transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-extrabold text-text-mut uppercase tracking-wider">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-bg-base/20 rounded-[14px] border border-dashed border-border-card/30"></div>;
                }

                const activity = getDateActivity(day);
                const isSelected = selectedDate === activity?.dateStr;
                const isToday = (() => {
                  const today = new Date();
                  return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
                })();

                const cellProjects = activity?.dateStr ? getProjectsForDate(activity.dateStr) : [];
                const hasProjectHighlight = cellProjects.length > 0;

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDate(activity?.dateStr)}
                    className={`aspect-square rounded-[14px] p-2 flex flex-col justify-between items-center transition-all relative border outline-none cursor-pointer ${
                      isSelected
                        ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.03]"
                        : isToday
                        ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20"
                        : hasProjectHighlight
                        ? "bg-brand-primary/5 border-brand-primary/20 text-text-main hover:bg-brand-primary/10"
                        : "bg-bg-base/50 border-border-card text-text-main hover:bg-border-card hover:border-brand-primary/30"
                    }`}
                  >
                    {/* Day Number and Project Tag */}
                    <div className="w-full flex justify-between items-start">
                      <span className="text-xs font-bold">{day}</span>
                      {hasProjectHighlight && !isSelected && (
                        <div className="flex flex-col gap-0.5 items-end max-w-[70%]">
                          {cellProjects.slice(0, 2).map((cp, cIdx) => (
                            <span key={cIdx} className="text-[7px] font-black uppercase text-brand-primary px-1 rounded bg-brand-primary/10 truncate max-w-full" title={cp.name}>
                              {cp.name}
                            </span>
                          ))}
                          {cellProjects.length > 2 && (
                            <span className="text-[7px] font-bold text-text-mut">+{cellProjects.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Indicator dots */}
                    <div className="flex gap-1 justify-center mt-1">
                      {activity?.hasLogs && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} title="Submitted Logs"></span>
                      )}
                      {activity?.hasTasks && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} title="Tasks / Reports"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column - Work Details Side Panel (Span 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Selected Date Header Card */}
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl relative overflow-hidden">
              <h3 className="font-extrabold text-sm text-text-mut uppercase tracking-wider mb-1">Activity details</h3>
              <span className="text-xl font-black text-text-main">
                {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "No Date Selected"}
              </span>
            </div>

            {/* Active Projects section for selected date */}
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-border-card pb-3">
                <h4 className="font-extrabold text-base text-text-main flex items-center gap-2">
                  <Briefcase size={18} className="text-brand-primary" />
                  Active Projects ({selectedDateProjects.length})
                </h4>
                <span className="text-[10px] font-bold text-text-mut uppercase">Timeline Deliverables</span>
              </div>

              {selectedDateProjects.length === 0 ? (
                <div className="p-8 text-center text-text-mut border border-dashed border-border-card rounded-[16px] bg-bg-base/20">
                  <AlertCircle size={28} className="mx-auto mb-2 text-text-mut/50" />
                  <p className="text-xs font-bold">No active projects scheduled for this date.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar text-left">
                  {selectedDateProjects.map((proj) => {
                    const manager = allUsers.find(u => u.uid === proj.managerId || u.id === proj.managerId || (proj.managerName && u.name === proj.managerName));
                    const managerName = proj.managerName || manager?.name || (proj.name ? "Mohamed Asfaque A" : "Unassigned");
                    const pStatus = proj.status || "Ongoing";
                    const isCompleted = pStatus.toLowerCase() === "completed";

                    return (
                      <div 
                        key={proj.id} 
                        onClick={() => {
                          setSelectedProjectForDetails(proj);
                          setShowProjectDetailsModal(true);
                        }}
                        className="p-4 bg-bg-base/40 border border-border-card rounded-[16px] space-y-2.5 hover:border-brand-primary/40 transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="text-xs font-black text-text-main group-hover:text-brand-primary transition-colors flex items-center gap-1.5">
                            {proj.name}
                          </h5>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isCompleted ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                            "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                          }`}>
                            {pStatus}
                          </span>
                        </div>

                        <div className="text-[10px] text-text-mut font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {cleanDateStr(proj.startDate || proj.start_date)} — {cleanDateStr(proj.endDate || proj.end_date)}
                          </span>
                          <span className="text-brand-primary font-bold">
                            Manager: {managerName}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1 border-t border-border-card/40">
                          <div className="flex justify-between text-[9px] font-bold text-text-mut">
                            <span>{proj.taskCount ? `${proj.completedTaskCount || 0}/${proj.taskCount} tasks` : `${proj.teamMembers?.length || 0} members`}</span>
                            <span>{proj.progress ?? 0}% completed</span>
                          </div>
                          <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden border border-border-card/30">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                (proj.progress ?? 0) === 100 ? "bg-emerald-500" :
                                (proj.progress ?? 0) > 0 ? "bg-brand-primary" : "bg-transparent"
                              }`}
                              style={{ width: `${proj.progress ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily logs section — visible to Admin & Project Managers only */}
            {(isAdmin || isProjectManager) && (
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl space-y-4">
              <h4 className="font-extrabold text-base text-text-main flex items-center gap-2 border-b border-border-card pb-3">
                <FileText size={18} className="text-brand-primary" />
                Work logs ({selectedActivity.logs.length})
              </h4>

              {selectedActivity.logs.length === 0 ? (
                <div className="p-8 text-center text-text-mut border border-dashed border-border-card rounded-[16px] bg-bg-base/20">
                  <AlertCircle size={32} className="mx-auto mb-3 text-text-mut/50" />
                  <p className="text-xs font-bold">No daily work logs submitted for this date.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  {selectedActivity.logs.map((log) => (
                    <div key={log.id} className="p-4 bg-bg-base/40 border border-border-card rounded-[16px] space-y-3 relative group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary font-black flex items-center justify-center text-xs overflow-hidden">{(allUsers.find(u => u.uid === log.userId)?.avatar) ? <img src={allUsers.find(u => u.uid === log.userId).avatar} alt={log.userName} className="w-full h-full object-cover" /> : (log.userName ? log.userName.charAt(0).toUpperCase() : <User size={14} />)}</div>
                          <div>
                            <h5 className="text-xs font-black text-text-main">{log.userName}</h5>
                            <span className="text-[10px] text-text-mut font-bold">{log.projectName}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          log.status === "Completed" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {log.status}
                        </span>
                      </div>

                      <div className="space-y-2 border-t border-border-card/50 pt-2.5">
                        <div>
                          <span className="text-[9px] font-black text-text-mut uppercase block">Tasks Completed</span>
                          <p className="text-xs text-text-sec leading-normal mt-0.5 whitespace-pre-wrap">{log.tasksCompleted}</p>
                        </div>

                        {log.issuesFaced && (
                          <div>
                            <span className="text-[9px] font-black text-red-500 uppercase block">Issues Faced</span>
                            <p className="text-xs text-red-500/80 leading-normal mt-0.5 whitespace-pre-wrap">{log.issuesFaced}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] text-text-mut font-bold bg-bg-base/30 p-2 rounded-[8px] border border-border-card/30">
                          <span className="flex items-center gap-1"><Clock size={12} /> Logged: {log.hours}h</span>
                        </div>

                        {log.supervisorRemarks && (
                          <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-[10px] p-3 text-left">
                            <span className="text-[9px] font-black text-brand-primary uppercase block">PM Remarks</span>
                            <p className="text-xs text-text-sec mt-1 italic">"{log.supervisorRemarks}"</p>
                          </div>
                        )}

                        <button 
                          onClick={() => handleOpenRemarks(log)}
                          className="w-full py-2 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white text-[10px] font-bold rounded-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                        >
                          <MessageSquare size={12} />
                          {log.supervisorRemarks ? "Edit Remarks" : "Add Supervisor Remarks"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* Tasks and Task Reports Section */}
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl space-y-4">
              <h4 className="font-extrabold text-base text-text-main flex items-center gap-2 border-b border-border-card pb-3">
                <CheckCircle size={18} className="text-brand-primary" />
                Tasks & reports ({selectedActivity.tasks.length + selectedActivity.taskReports.length})
              </h4>

              {selectedActivity.tasks.length === 0 && selectedActivity.taskReports.length === 0 ? (
                <div className="p-8 text-center text-text-mut border border-dashed border-border-card rounded-[16px] bg-bg-base/20">
                  <AlertCircle size={32} className="mx-auto mb-3 text-text-mut/50" />
                  <p className="text-xs font-bold">No active task logs or assignments on this date.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  
                  {/* Tasks Assigned */}
                  {selectedActivity.tasks.map((task) => (
                    <div key={task.id} className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-[16px] space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-blue-500 px-2 py-0.5 rounded-full bg-blue-500/10 inline-block mb-1">New Assignment</span>
                          <h5 className="text-xs font-black text-text-main">{task.title}</h5>
                          <span className="text-[10px] text-text-mut font-bold">Assigned to: {task.userName} • Project: {task.project}</span>
                        </div>
                        <span className="text-xs font-bold text-blue-500 whitespace-nowrap">{task.duration}h</span>
                      </div>
                    </div>
                  ))}

                  {/* Task Reports submitted */}
                  {selectedActivity.taskReports.map((rep) => {
                    const task = activeTasksList.find(t => t.id === rep.taskId);
                    return (
                      <div key={rep.id} className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-[16px] space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-extrabold uppercase text-purple-500 px-2 py-0.5 rounded-full bg-purple-500/10 inline-block mb-1">Task Progress Report</span>
                            <h5 className="text-xs font-black text-text-main">{task?.title || "Unknown Task"}</h5>
                            <span className="text-[10px] text-text-mut font-bold">Logged by: {teamMembers.find(m => m.uid === rep.employeeId)?.name}</span>
                          </div>
                          <span className="text-[9px] text-text-mut font-bold">{new Date(rep.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-xs text-text-sec italic bg-bg-base/30 p-2.5 rounded-[10px] border border-border-card/30 mt-1">
                          "{rep.reportText}"
                        </p>
                      </div>
                    );
                  })}

                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Project Manager Team setup panel & Team progress table */}
      {(isAdmin || isProjectManager) && (
        <div className="mt-8 space-y-6 text-left">
          
          {/* Action buttons bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-purple-500"></div>
            <div>
              <h3 className="font-extrabold text-lg text-text-main">Project Team Setup</h3>
              <p className="text-xs text-text-mut font-semibold mt-1">Manage project teammates and delegate tasks for your active projects.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  if (managedProjects.length > 0) {
                    setSelectedProjectId(managedProjects[0].id);
                  }
                  setShowAddTeamModal(true);
                }}
                className="py-2.5 px-5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] flex items-center gap-1.5 transition-all shadow-md shadow-brand-primary/20 hover:shadow-brand-primary/40 cursor-pointer"
              >
                <UserPlus size={16} />
                <span>Add Teammates</span>
              </button>
              <button 
                onClick={() => {
                  if (managedProjects.length > 0) {
                    setSelectedProjectId(managedProjects[0].id);
                    const proj = managedProjects[0];
                    const mates = allUsers.filter(u => proj.teamMembers?.includes(u.uid) && u.uid !== currentUser.uid);
                    if (mates.length > 0) {
                      setSelectedTeammateId(mates[0].uid);
                    }
                  }
                  setShowAssignTaskModal(true);
                }}
                className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-[12px] flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 hover:shadow-purple-600/45 cursor-pointer"
              >
                <Plus size={16} />
                <span>Assign Task</span>
              </button>
            </div>
          </div>

          {/* Table: Team Tasks & Updates */}
          <div className="bg-bg-card border border-border-card rounded-[24px] shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <div className="p-6 border-b border-border-card bg-bg-base/30 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-text-main tracking-tight">Team Tasks & Updates</h3>
              <span className="text-[11px] font-bold bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full">{teamMembers.length} Teammates</span>
            </div>
            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-base/50 text-[10px] uppercase tracking-wider text-text-mut border-b border-border-card">
                    <th className="p-4 font-bold">Team Member</th>
                    <th className="p-4 font-bold">Project</th>
                    <th className="p-4 font-bold w-1/4">Assigned Tasks</th>
                    <th className="p-4 font-bold text-center">Status</th>
                    <th className="p-4 font-bold text-center">Hours Worked</th>
                    <th className="p-4 font-bold w-1/3">Latest Update</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-xs text-text-mut italic">No teammates added yet. Click "Add Teammates" to build your project team.</td>
                    </tr>
                  ) : (
                    teamMembers.map((member) => {
                      const memberProjects = managedProjects.filter(p => p.teamMembers?.includes(member.uid) || (member.projects || []).includes(p.name));
                      
                      return memberProjects.map((proj) => {
                        const projTasks = (member.tasks || []).filter(t => t.project === proj.name);
                        
                        const taskHoursSum = projTasks.reduce((sum, t) => {
                          const tReps = allTaskReports[t.id] || [];
                          let totalMinutes = 0;
                          tReps.forEach(r => {
                            const matchH = r.reportText.match(/(\d+)\s*h/i);
                            const matchM = r.reportText.match(/(\d+)\s*m/i);
                            if (matchH) totalMinutes += parseInt(matchH[1], 10) * 60;
                            if (matchM) totalMinutes += parseInt(matchM[1], 10);
                          });
                          return sum + (totalMinutes / 60);
                        }, 0);

                        let latestReport = null;
                        projTasks.forEach(t => {
                          const tReps = allTaskReports[t.id] || [];
                          const manualReps = tReps.filter(r => !r.reportText.startsWith("Worked for") && !r.reportText.startsWith("Auto-stopped") && !r.reportText.startsWith("Auto-paused"));
                          if (manualReps.length > 0) {
                            const sorted = [...manualReps].sort((a,b) => new Date(b.timestamp || b.createdAt || b.submittedAt) - new Date(a.timestamp || a.createdAt || a.submittedAt));
                            const candDate = sorted[0].timestamp || sorted[0].createdAt || sorted[0].submittedAt;
                            const prevDate = latestReport ? (latestReport.timestamp || latestReport.createdAt || latestReport.submittedAt) : null;
                            if (!latestReport || new Date(candDate) > new Date(prevDate)) {
                              latestReport = sorted[0];
                            }
                          }
                        });

                        return (
                          <tr key={`${member.uid}-${proj.id}`} className="border-b border-border-card/50 hover:bg-bg-base/30 transition-colors text-xs text-text-sec">
                            <td className="p-4 font-bold text-text-main flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary font-black flex items-center justify-center text-[10px] overflow-hidden">{member.avatar ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" /> : member.name.charAt(0).toUpperCase()}</div>
                              {member.name}
                            </td>
                            <td className="p-4 font-semibold text-brand-primary">{proj.name}</td>
                            <td className="p-4">
                              {projTasks.length === 0 ? (
                                <span className="text-text-mut italic">No tasks assigned</span>
                              ) : (
                                <div className="space-y-1">
                                  {projTasks.map(t => (
                                    <div key={t.id} className="flex justify-between items-center bg-bg-base/30 px-2 py-1 rounded-[6px] border border-border-card/30">
                                      <span className="font-bold text-[10px] pr-2">{t.title}</span>
                                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${t.completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-primary/10 text-brand-primary'}`}>
                                        {t.completed ? 'Done' : 'Active'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {projTasks.length > 0 ? (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  projTasks.every(t => t.completed) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-primary/10 text-brand-primary'
                                }`}>
                                  {projTasks.every(t => t.completed) ? 'All Done' : 'In Progress'}
                                </span>
                              ) : (
                                <span className="text-text-mut">-</span>
                              )}
                            </td>
                            <td className="p-4 text-center font-bold text-text-main">
                              {parseFloat(taskHoursSum.toFixed(1))} h
                            </td>
                            <td className="p-4">
                              {latestReport ? (
                                <div>
                                  <p className="font-semibold text-text-main line-clamp-2">"{latestReport.reportText}"</p>
                                  {(() => {
                                    const d = latestReport.timestamp || latestReport.createdAt || latestReport.submittedAt;
                                    return d ? (
                                      <span className="text-[8px] text-text-mut mt-0.5 block">{new Date(d).toLocaleDateString()} at {new Date(d).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                    ) : null;
                                  })()}
                                </div>
                              ) : (
                                <span className="text-text-mut italic">No progress reports yet</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Team Task Logs Section (PM + Admin) ─────────────────────────── */}
      {(isProjectManager || isAdmin) && (() => {
        // Build grouped structure: { projectName → { memberId → { memberName, tasks: [ { task, logs[] } ] } } }
        const grouped = {};

        teamMembers.forEach(member => {
          (member.tasks || []).forEach(task => {
            // Apply user filter early
            if (logsFilterUser !== "All" && member.uid !== logsFilterUser) return;
            // Apply project filter
            if (logsFilterProject !== "All" && task.project !== logsFilterProject) return;

            const reps = allTaskReports[task.id] || [];
            const manualReps = reps
              .filter(r =>
                !r.reportText.startsWith("Worked for") &&
                !r.reportText.startsWith("Auto-stopped") &&
                !r.reportText.startsWith("Auto-paused")
              )
              .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

            if (manualReps.length === 0) return; // skip tasks with no logs

            const proj = task.project || "Unassigned";
            if (!grouped[proj]) grouped[proj] = {};
            if (!grouped[proj][member.uid]) grouped[proj][member.uid] = { memberName: member.name, avatar: member.avatar, tasks: [] };
            grouped[proj][member.uid].tasks.push({ task, logs: manualReps });
          });
        });

        const projectKeys = Object.keys(grouped).sort();
        const totalEntries = projectKeys.reduce((sum, proj) =>
          sum + Object.values(grouped[proj]).reduce((s, m) =>
            s + m.tasks.reduce((t, tk) => t + tk.logs.length, 0), 0), 0);

        // Members available for filter dropdown
        const filterableMembers = logsFilterProject === "All"
          ? teamMembers
          : teamMembers.filter(m => (m.tasks || []).some(t => t.project === logsFilterProject));

        return (
          <div className="mt-8 space-y-4 text-left">
            <div className="bg-bg-card border border-border-card rounded-[24px] shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

              {/* Header + Filters */}
              <div className="p-6 border-b border-border-card bg-bg-base/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-base text-text-main tracking-tight flex items-center gap-2">
                      <FileText size={18} className="text-emerald-500" />
                      Team Task Logs
                    </h3>
                    <p className="text-[11px] text-text-mut font-semibold mt-0.5">Progress updates submitted by team members via Task Manager, grouped by project and member.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-text-mut uppercase tracking-wider">Project</label>
                      <select
                        className="bg-bg-base border border-border-card rounded-[10px] px-3 py-2 text-xs font-bold text-text-main focus:border-brand-primary outline-none cursor-pointer min-w-[150px]"
                        value={logsFilterProject}
                        onChange={e => { setLogsFilterProject(e.target.value); setLogsFilterUser("All"); setLogsPage(1); }}
                      >
                        <option value="All">All Projects</option>
                        {pmProjects.map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-text-mut uppercase tracking-wider">Member</label>
                      <select
                        className="bg-bg-base border border-border-card rounded-[10px] px-3 py-2 text-xs font-bold text-text-main focus:border-brand-primary outline-none cursor-pointer min-w-[150px]"
                        value={logsFilterUser}
                        onChange={e => { setLogsFilterUser(e.target.value); setLogsPage(1); }}
                      >
                        <option value="All">All Members</option>
                        {filterableMembers.map(m => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 justify-end">
                      <span className="text-[9px] font-black text-text-mut uppercase tracking-wider invisible">count</span>
                      <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-2 rounded-[10px]">{totalEntries} Log Entries</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grouped Content */}
              <div className="divide-y divide-border-card">
                {projectKeys.length === 0 ? (
                  <div className="p-10 text-center text-xs text-text-mut italic">
                    <AlertCircle size={28} className="mx-auto mb-2 text-text-mut/30" />
                    No task logs found for the selected filters.
                  </div>
                ) : projectKeys.map(projName => (
                  <div key={projName}>
                    {/* ── Project header ── */}
                    <div className="px-6 py-3 bg-brand-primary/5 border-b border-brand-primary/10 flex items-center gap-2">
                      <Briefcase size={14} className="text-brand-primary shrink-0" />
                      <span className="text-xs font-extrabold text-brand-primary uppercase tracking-wide">{projName}</span>
                    </div>

                    {/* Members in this project */}
                    {Object.entries(grouped[projName]).map(([memberId, memberData]) => (
                      <div key={memberId} className="border-b border-border-card/40 last:border-b-0">
                        {/* Member + their tasks */}
                        {memberData.tasks.map(({ task, logs }) => (
                          <div key={task.id} className="p-5 hover:bg-bg-base/20 transition-colors">
                            {/* Member + Task header row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 font-black flex items-center justify-center text-sm shrink-0 overflow-hidden">{memberData.avatar ? <img src={memberData.avatar} alt={memberData.memberName} className="w-full h-full object-cover" /> : memberData.memberName?.charAt(0).toUpperCase()}</div>
                                <div>
                                  <div className="text-sm font-black text-text-main">{memberData.memberName}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <ClipboardList size={11} className="text-text-mut" />
                                    <span className="text-[11px] font-bold text-text-sec">{task.title}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1 ${
                                      task.completed
                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                        : "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                                    }`}>
                                      {task.completed ? "Completed" : "In Progress"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] text-text-mut font-semibold bg-bg-base px-2 py-1 rounded-[6px] border border-border-card shrink-0">
                                {logs.length} update{logs.length !== 1 ? "s" : ""}
                              </span>
                            </div>

                            {/* Logs timeline */}
                            <div className="space-y-2 ml-11">
                              {logs.map((log, li) => (
                                <div key={log.id || li} className="flex gap-3 items-start group">
                                  {/* Timeline dot */}
                                  <div className="flex flex-col items-center shrink-0 mt-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500/60 group-hover:bg-emerald-500 transition-colors"></div>
                                    {li < logs.length - 1 && <div className="w-px flex-1 bg-border-card mt-1" style={{minHeight: '16px'}}></div>}
                                  </div>
                                  {/* Log content */}
                                  <div className="flex-1 bg-bg-base/40 border border-border-card/50 rounded-[10px] px-3 py-2.5 group-hover:border-emerald-500/20 transition-colors">
                                    <p className="text-xs text-text-sec leading-relaxed">"{log.reportText}"</p>
                                    <span className="text-[10px] text-text-mut font-semibold mt-1 block">
                                      {new Date(log.timestamp || log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      {" · "}
                                      {new Date(log.timestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Teammate Modal */}
      {showAddTeamModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in text-left">
          <div className="w-full max-w-[400px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <UserPlus size={18} className="text-brand-primary" />
                Add to Project Team
              </h3>
              <button onClick={() => setShowAddTeamModal(false)} className="text-text-mut hover:text-text-main font-bold cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddTeammate} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Select Managed Project</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all cursor-pointer font-bold"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  required
                >
                  {managedProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Select Employee</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all cursor-pointer font-bold"
                  value={selectedTeammateId}
                  onChange={(e) => setSelectedTeammateId(e.target.value)}
                  required
                >
                  <option value="">-- Choose an employee --</option>
                  {allUsers.filter(u => u.uid !== currentUser.uid && u.role !== "admin" && (!selectedProjectId || !projects.find(p => p.id === selectedProjectId)?.teamMembers?.includes(u.uid))).map(u => (
                    <option key={u.uid} value={u.uid}>{u.name} ({u.designation || u.department || 'No dept'})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-card mt-4">
                <button type="button" onClick={() => setShowAddTeamModal(false)} className="py-2 px-4 border border-border-card rounded-[10px] text-xs font-bold text-text-sec hover:bg-bg-base cursor-pointer">Cancel</button>
                <button type="submit" disabled={!selectedProjectId || !selectedTeammateId} className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-[10px] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50">
                  Add Teammate
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Assign Task Modal */}
      {showAssignTaskModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in text-left">
          <div className="w-full max-w-[420px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <Plus size={18} className="text-brand-primary" />
                Assign Task to Teammate
              </h3>
              <button onClick={() => setShowAssignTaskModal(false)} className="text-text-mut hover:text-text-main font-bold cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Select Project</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all cursor-pointer font-bold"
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setSelectedTeammateId("");
                  }}
                  required
                >
                  {managedProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Select Project Teammate</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all cursor-pointer font-bold"
                  value={selectedTeammateId}
                  onChange={(e) => setSelectedTeammateId(e.target.value)}
                  required
                >
                  <option value="">-- Choose teammate --</option>
                  {allUsers.filter(u => projects.find(p => p.id === selectedProjectId)?.teamMembers?.includes(u.uid) && u.uid !== currentUser.uid).map(u => (
                    <option key={u.uid} value={u.uid}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Task Title</label>
                <input 
                  type="text" 
                  placeholder="E.g., Design the layout database migrations..."
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all font-semibold"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Estimated Duration (Hours)</label>
                <input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all font-semibold"
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-card mt-4">
                <button type="button" onClick={() => setShowAssignTaskModal(false)} className="py-2 px-4 border border-border-card rounded-[10px] text-xs font-bold text-text-sec hover:bg-bg-base cursor-pointer">Cancel</button>
                <button type="submit" disabled={!selectedProjectId || !selectedTeammateId || !newTaskTitle || !newTaskDuration} className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-[10px] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Supervisor Remarks Modal */}
      {showRemarksModal && selectedReportForRemarks && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-card rounded-[24px] p-6 w-full max-w-md shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => { setShowRemarksModal(false); setSelectedReportForRemarks(null); }}
              className="absolute top-4 right-4 text-text-mut hover:text-text-main transition-colors bg-bg-base hover:bg-border-card p-1.5 rounded-full"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-black text-text-main mb-2">Supervisor Remarks</h3>
            <p className="text-xs text-text-mut font-semibold mb-4">
              Providing remarks for <strong className="text-brand-primary">{selectedReportForRemarks.userName}</strong> on {selectedReportForRemarks.date}.
            </p>

            <form onSubmit={handleSaveRemarks} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec">Status</label>
                <select
                  className="w-full bg-bg-base border border-border-card rounded-[12px] px-3.5 py-2.5 text-xs font-bold text-text-main focus:border-brand-primary outline-none transition-all cursor-pointer"
                  value={remarksStatus}
                  onChange={(e) => setRemarksStatus(e.target.value)}
                >
                  <option value="Completed">Completed / Approved</option>
                  <option value="Working">Working / Needs Revisions</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec">Remarks</label>
                <textarea
                  required
                  rows={4}
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  placeholder="Review feedback, standard comments, etc..."
                  className="w-full bg-bg-base border border-border-card rounded-[12px] px-3.5 py-2.5 text-xs text-text-main placeholder-text-mut focus:border-brand-primary outline-none transition-all resize-none font-bold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowRemarksModal(false); setSelectedReportForRemarks(null); }}
                  className="flex-1 py-2.5 font-bold text-text-sec bg-bg-base hover:bg-border-card rounded-full text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-full text-xs transition-colors shadow-md shadow-brand-primary/10"
                >
                  Save Remarks
                </button>
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
                    <Clock size={12} className="text-brand-primary" /> Timeline
                  </span>
                  <div className="text-xs font-bold text-text-main">
                    {selectedProjectForDetails.startDate || selectedProjectForDetails.start_date || "-"} 
                    <span className="text-text-mut font-normal mx-1.5">to</span>
                    {selectedProjectForDetails.endDate || selectedProjectForDetails.end_date || "-"}
                  </div>
                </div>

                <div className="p-3.5 bg-bg-base/40 border border-border-card/60 rounded-[14px] space-y-1">
                  <span className="text-[10px] font-bold text-text-mut uppercase flex items-center gap-1.5">
                    <User size={12} className="text-brand-primary" /> Assigned Manager
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

    </div>
  );
}
