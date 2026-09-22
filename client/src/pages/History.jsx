import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { 
  subscribeToUserLogs, 
  requestRegularization, 
  subscribeToRegularizationRequests,
  subscribeToLeaveRequests
} from "../firebase";
import { Calendar, Search, MapPin, Coffee, Clock, BarChart2, X, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import logoImg from '../assets/zuna-logo.png';
import { addStandardPDFHeader } from "../utils/pdfHeader";
export default function History() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Regularization States
  const [showRegModal, setShowRegModal] = useState(false);
  const [regDate, setRegDate] = useState("");
  const [regCheckIn, setRegCheckIn] = useState("10:00");
  const [regCheckOut, setRegCheckOut] = useState("19:00");
  const [regReason, setRegReason] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [myRegularizations, setMyRegularizations] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState("logs");

  // Pagination States
  const [logsPage, setLogsPage] = useState(1);
  const [leavesPage, setLeavesPage] = useState(1);
  const [regsPage, setRegsPage] = useState(1);

  useEffect(() => {
    const unsubscribe = subscribeToUserLogs(currentUser.uid, (data) => {
      setLogs(data);
      setLoading(false);
    });

    const unsubscribeReg = subscribeToRegularizationRequests(currentUser.companyId, (data) => {
      setMyRegularizations((data || []).filter(r => (r.userId || r.user_id) === currentUser.uid));
    });

    const unsubscribeLeaves = subscribeToLeaveRequests(currentUser.companyId, (data) => {
      setMyLeaves((data || []).filter(r => (r.userId || r.user_id) === currentUser.uid));
    });

    return () => {
      unsubscribe();
      unsubscribeReg();
      unsubscribeLeaves();
    };
  }, [currentUser.uid]);

  // Reactive filtering
  useEffect(() => {
    let result = [...logs];
    if (startDate) {
      result = result.filter(log => log.date >= startDate);
    }
    if (endDate) {
      result = result.filter(log => log.date <= endDate);
    }
    if (searchQuery) {
      result = result.filter(log => 
        log.date.includes(searchQuery) || 
        (log.status || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredLogs(result);
  }, [logs, startDate, endDate, searchQuery]);

  // Apply filters
  const handleFilter = () => {
    // Reactive effect handles this automatically
  };

  // Reset pagination on search or filters
  useEffect(() => {
    setLogsPage(1);
  }, [startDate, endDate]);

  useEffect(() => {
    setLogsPage(1);
    setLeavesPage(1);
    setRegsPage(1);
  }, [activeHistoryTab]);

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    if (!regDate || !regCheckIn || !regCheckOut || !regReason) {
      return showToast("Please fill in all regularization fields.", "warning");
    }

    setRegLoading(true);
    try {
      const newReg = await requestRegularization(
        currentUser.uid,
        currentUser.name,
        currentUser.department || "Engineering",
        regDate,
        regCheckIn,
        regCheckOut,
        regReason,
        currentUser.companyId || ""
      );
      if (newReg) {
        setMyRegularizations(prev => [newReg, ...prev.filter(r => r.id !== newReg.id)]);
      }
      showToast("Regularization request raised successfully.", "success");
      setRegDate("");
      setRegCheckIn("10:00");
      setRegCheckOut("19:00");
      setRegReason("");
      setShowRegModal(false);
    } catch (err) {
      showToast(err.message || "Failed to raise regularization request.", "error");
    } finally {
      setRegLoading(false);
    }
  };

  // Compute summary stats
  const totalDays = filteredLogs.length;
  const totalHours = filteredLogs.reduce((acc, log) => acc + (log.totalWorkingMinutes || 0), 0) / 60;
  const avgHours = totalDays > 0 ? totalHours / totalDays : 0;
  const shortBreaks = filteredLogs.reduce((acc, log) => {
    const count = log.breaks?.filter(b => b.type === "short").length || 0;
    return acc + count;
  }, 0);
  const longBreaks = filteredLogs.reduce((acc, log) => {
    const count = log.breaks?.filter(b => b.type === "long").length || 0;
    return acc + count;
  }, 0);

  // Hourly stats for last 7 logged days
  const chartData = [...filteredLogs].reverse().slice(-7).map(log => {
    const hrs = parseFloat(((log.totalWorkingMinutes || 0) / 60).toFixed(1));
    const formattedDate = new Date(log.date).toLocaleDateString([], { month: "short", day: "numeric" });
    return { dateLabel: formattedDate, hours: hrs };
  });

  const maxChartHours = Math.max(8, ...chartData.map(c => c.hours));

  const handleDownloadPDF = async () => {
    if (filteredLogs.length === 0) return showToast("No records to export.", "warning");

    const doc = new jsPDF();
    const titleText = "EMPLOYEE ATTENDANCE REPORT";
    const subtitleText = `Employee: ${currentUser.name} | Total Records: ${filteredLogs.length}`;
    const startY = await addStandardPDFHeader(doc, titleText, subtitleText);

    const tableData = filteredLogs.map((log) => {
      const workingHours = log.totalWorkingMinutes ? (log.totalWorkingMinutes / 60).toFixed(1) + " hrs" : "—";
      return [
        log.date,
        log.checkInTime || "—",
        log.checkOutTime || "—",
        workingHours,
        log.status || "Present"
      ];
    });

    autoTable(doc, {
      head: [["Date", "Check In", "Check Out", "Working Hours", "Status"]],
      body: tableData,
      startY: startY + 2,
      styles: { fontSize: 8.5, font: "helvetica", cellPadding: 4, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", halign: 'center', fontSize: 9 },
      columnStyles: { 
        0: { halign: 'left', cellWidth: 35 }, 
        1: { halign: 'center', cellWidth: 35 }, 
        2: { halign: 'center', cellWidth: 35 }, 
        3: { halign: 'center', cellWidth: 40 }, 
        4: { halign: 'center', cellWidth: 35 }
      },
      theme: 'grid',
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.row.index >= 0 && data.column.index === 4) {
          const val = data.cell.text[0];
          if (val === "Present") {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "Late") {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "Absent") {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [153, 27, 27];
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    });
    
    addPDFFooter(doc);
    doc.save(`Attendance_Report_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("Attendance report PDF exported successfully.", "success");
  };

  const handleDownloadExcel = () => {
    if (filteredLogs.length === 0) return showToast("No logs available to download.", "warning");
    
    const excelData = filteredLogs.map((log) => ({
      "Date": log.date,
      "Check In": log.checkInTime || "-",
      "Check Out": log.checkOutTime || "-",
      "Working Hours": log.totalWorkingMinutes ? (log.totalWorkingMinutes / 60).toFixed(1) + " hrs" : "-",
      "Status": log.status || "Present",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
    XLSX.writeFile(workbook, `Attendance_Report_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Excel spreadsheet generated successfully.", "success");
  };

  if (loading) {
    return (
      <div className="space-y-8 w-full max-w-[1400px] mx-auto text-left animate-fade-in">
        {/* Title block Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="space-y-2 w-full max-w-[280px]">
            <div className="h-8 rounded skeleton" />
            <div className="h-4 rounded skeleton" />
          </div>
          <div className="h-12 w-40 rounded-[12px] skeleton" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-24 rounded-[20px] skeleton" />
          <div className="h-24 rounded-[20px] skeleton" />
          <div className="h-24 rounded-[20px] skeleton" />
          <div className="h-24 rounded-[20px] skeleton" />
        </div>

        {/* Chart Skeleton */}
        <div className="h-[260px] rounded-[24px] skeleton" />

        {/* Filter Panel Skeleton */}
        <div className="h-[100px] rounded-[24px] skeleton" />

        {/* Log Queue Skeleton */}
        <div className="h-[340px] rounded-[24px] skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-[1400px] mx-auto text-left animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">My Attendance History</h1>
          <p className="text-sm text-text-sec mt-1">Review your historical logs and break details.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="py-3 px-4 bg-bg-card hover:bg-bg-base border border-border-card text-text-main text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
            title="Download PDF Report"
          >
            <FileText size={15} className="text-brand-danger" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={handleDownloadExcel}
            className="py-3 px-4 bg-bg-card hover:bg-bg-base border border-border-card text-text-main text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
            title="Download Excel Report"
          >
            <Download size={15} className="text-brand-success" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={() => setShowRegModal(true)}
            className="py-3 px-5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-md shadow-brand-primary/10 cursor-pointer"
          >
            <Clock size={15} />
            <span>Raise Regularization</span>
          </button>
        </div>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-[14px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <Calendar size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Days Worked</span>
            <span className="text-2xl font-extrabold text-text-main block mt-0.5">{totalDays}</span>
          </div>
        </div>

        <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-[14px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Total Hours</span>
            <span className="text-2xl font-extrabold text-text-main block mt-0.5">{totalHours.toFixed(1)} hrs</span>
          </div>
        </div>

        <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-[14px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Avg. Daily Hours</span>
            <span className="text-2xl font-extrabold text-text-main block mt-0.5">{avgHours.toFixed(1)} hrs</span>
          </div>
        </div>

        <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-[14px] bg-brand-warning/10 text-brand-warning flex items-center justify-center">
            <Coffee size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Total Breaks</span>
            <span className="text-2xl font-extrabold text-text-main block mt-0.5">{shortBreaks + longBreaks}</span>
          </div>
        </div>
      </div>

      {/* Interactive Hours Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
          <h3 className="font-extrabold text-base text-text-main mb-1.5 flex items-center gap-2">
            <BarChart2 size={18} className="text-brand-primary" /> 
            <span>Daily Working Hours Chart (Last 7 Shifts)</span>
          </h3>
          <p className="text-[10px] text-text-mut font-semibold mb-6">Visual tracking of completed shift hours per logged day</p>
          
          <div className="flex items-end justify-around h-[180px] border-b border-border-card pb-2 pt-6 px-4">
            {chartData.map((c, idx) => {
              const barHeight = Math.max(10, Math.round((c.hours / maxChartHours) * 100));
              return (
                <div key={idx} className="flex flex-col items-center justify-end gap-2 group w-12 h-full">
                  <div className="opacity-0 group-hover:opacity-100 absolute transform -translate-y-12 z-10 bg-slate-900 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity duration-150">
                    {c.hours} hours
                  </div>
                  
                  <div 
                    className="w-5 rounded-t-sm bg-brand-primary hover:bg-brand-hover transition-all duration-300 relative overflow-hidden"
                    style={{ height: `${barHeight}%` }}
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-white/10" />
                  </div>
                  
                  <span className="text-[10px] font-bold text-text-sec tracking-tight text-center">{c.dateLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-tab segmented control for History page */}
      <div className="flex border-b border-border-card mb-6">
        <button
          onClick={() => setActiveHistoryTab("logs")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeHistoryTab === "logs"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-sec hover:text-text-main"
          }`}
        >
          Attendance Shift Logs ({filteredLogs.length})
        </button>
        <button
          onClick={() => setActiveHistoryTab("leaves")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeHistoryTab === "leaves"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-sec hover:text-text-main"
          }`}
        >
          Leave History ({myLeaves.length})
        </button>
        <button
          onClick={() => setActiveHistoryTab("regularization")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeHistoryTab === "regularization"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-sec hover:text-text-main"
          }`}
        >
          Regularization Requests ({myRegularizations.length})
        </button>
      </div>

      {/* Tab content panels */}
      {(() => {
        const logsStartIndex = (logsPage - 1) * 10;
        const paginatedLogs = filteredLogs.slice(logsStartIndex, logsStartIndex + 10);
        const logsTotalPages = Math.ceil(filteredLogs.length / 10) || 1;

        const leavesStartIndex = (leavesPage - 1) * 10;
        const paginatedLeaves = myLeaves.slice(leavesStartIndex, leavesStartIndex + 10);
        const leavesTotalPages = Math.ceil(myLeaves.length / 10) || 1;

        const regsStartIndex = (regsPage - 1) * 10;
        const paginatedRegs = myRegularizations.slice(regsStartIndex, regsStartIndex + 10);
        const regsTotalPages = Math.ceil(myRegularizations.length / 10) || 1;

        return (
          <>
            {activeHistoryTab === "logs" && (
              <div className="space-y-6">
                {/* Filter panel */}
                <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
                  <h3 className="font-extrabold text-base text-text-main tracking-tight mb-4">Filter Records by Date</h3>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                    <div className="flex flex-col gap-1.5 flex-grow">
                      <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider" htmlFor="start-date">Start Date</label>
                      <input
                        id="start-date"
                        type="date"
                        className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 flex-grow">
                      <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider" htmlFor="end-date">End Date</label>
                      <input
                        id="end-date"
                        type="date"
                        className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={handleFilter} 
                        className="py-2.5 px-6 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Search size={14} /> Filter
                      </button>
                      <button 
                        onClick={handleReset} 
                        className="py-2.5 px-5 border border-border-card rounded-[12px] hover:bg-bg-base text-xs font-bold text-text-sec transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Records table */}
                <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
                  <h3 className="font-extrabold text-base text-text-main tracking-tight mb-5">Log History</h3>
                  
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-16 text-text-mut text-sm">No historical attendance records found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                            <th className="pb-3 pr-4">Date</th>
                            <th className="pb-3 px-4">Check In</th>
                            <th className="pb-3 px-4">Check Out</th>
                            <th className="pb-3 px-4">Breaks Summary</th>
                            <th className="pb-3 px-4">Working Hours</th>
                            <th className="pb-3 pl-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-card text-xs text-text-main font-semibold">
                          {paginatedLogs.map((log) => {
                            const checkInTime = new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const checkOutTime = log.checkOutTime 
                              ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "—";
                            
                            const shorts = log.breaks?.filter(b => b.type === "short").length || 0;
                            const longs = log.breaks?.filter(b => b.type === "long").length || 0;
                            
                            return (
                              <tr key={log.id} className="hover:bg-bg-base/30">
                                <td className="py-3.5 pr-4 font-bold text-text-main">{log.date}</td>
                                <td className="py-3.5 px-4 text-text-sec">
                                  <div>{checkInTime}</div>
                                  <div className="text-[10px] text-text-mut mt-0.5">
                                    {log.checkInLocation && (
                                      <a 
                                        href={`https://www.google.com/maps?q=${log.checkInLocation.latitude},${log.checkInLocation.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-brand-primary hover:text-brand-hover hover:underline"
                                      >
                                        In GPS Map
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-text-sec">
                                  <div>{checkOutTime}</div>
                                  <div className="text-[10px] text-text-mut mt-0.5">
                                    {log.checkOutLocation && (
                                      <a 
                                        href={`https://www.google.com/maps?q=${log.checkOutLocation.latitude},${log.checkOutLocation.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-brand-primary hover:text-brand-hover hover:underline"
                                      >
                                        Out GPS Map
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {shorts > 0 || longs > 0 ? (
                                    <div className="flex gap-1 flex-wrap">
                                      {shorts > 0 && <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[10px] font-bold">{shorts} Break 1</span>}
                                      {longs > 0 && <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[10px] font-bold">{longs} Break 2</span>}
                                    </div>
                                  ) : (
                                    <span className="text-text-mut text-[10px]">No breaks</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-brand-primary">{(log.totalWorkingMinutes / 60).toFixed(2)} hrs</div>
                                  <span className="text-[10px] text-text-mut">{log.totalWorkingMinutes} mins</span>
                                </td>
                                <td className="py-3.5 pl-4 text-right">
                                  {log.status === "checked-in" && <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">Working</span>}
                                  {log.status === "on-break" && <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">On Break</span>}
                                  {log.status === "checked-out" && <span className="bg-slate-500/10 text-text-sec border border-border-card text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">Shift Ended</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {filteredLogs.length > 10 && (
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-card text-xs flex-wrap gap-4">
                      <span className="text-text-mut font-semibold">
                        Showing {logsStartIndex + 1} to {Math.min(filteredLogs.length, logsStartIndex + 10)} of {filteredLogs.length} entries
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setLogsPage(prev => Math.max(1, prev - 1))}
                          disabled={logsPage === 1}
                          className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                        >
                          Prev
                        </button>
                        {Array.from({ length: logsTotalPages }, (_, i) => i + 1).map((p) => {
                          if (logsTotalPages > 5 && p !== 1 && p !== logsTotalPages && Math.abs(p - logsPage) > 1) {
                            if (p === 2 || p === logsTotalPages - 1) {
                              return <span key={p} className="px-1 text-text-mut font-bold">...</span>;
                            }
                            return null;
                          }
                          return (
                            <button
                              key={p}
                              onClick={() => setLogsPage(p)}
                              className={`w-8 h-8 rounded-[8px] border transition-all cursor-pointer font-bold ${
                                logsPage === p
                                  ? "bg-brand-primary border-brand-primary text-white"
                                  : "border-border-card bg-bg-card text-text-sec hover:bg-bg-base"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setLogsPage(prev => Math.min(logsTotalPages, prev + 1))}
                          disabled={logsPage === logsTotalPages}
                          className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeHistoryTab === "leaves" && (
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-text-main tracking-tight mb-5">My Leave Request History</h3>
                {myLeaves.length === 0 ? (
                  <p className="text-xs text-text-mut py-8 text-center font-semibold">No leave requests raised yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                          <th className="pb-3 pr-4">Leave Type</th>
                          <th className="pb-3 px-4">Dates</th>
                          <th className="pb-3 px-4">Duration</th>
                          <th className="pb-3 px-4">Reason</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 pl-4 text-right">Manager Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-card text-xs text-text-main font-semibold">
                        {paginatedLeaves.map((req) => {
                          let statusColor = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20";
                          if (req.status === "approved") {
                            statusColor = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
                          } else if (req.status === "rejected") {
                            statusColor = "bg-red-500/10 text-red-500 border border-red-500/20";
                          }

                          const startF = req.startDate ? new Date(req.startDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "";
                          const endF = req.endDate ? new Date(req.endDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "";

                          return (
                            <tr key={req.id} className="hover:bg-bg-base/30">
                              <td className="py-3.5 pr-4 text-text-main font-bold">{req.type}</td>
                              <td className="py-3.5 px-4 text-text-sec">{startF && endF ? `${startF} - ${endF}` : "—"}</td>
                              <td className="py-3.5 px-4 text-text-sec">{req.duration}</td>
                              <td className="py-3.5 px-4 text-text-sec truncate max-w-[200px]" title={req.reason}>{req.reason}</td>
                              <td className="py-3.5 px-4">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${statusColor}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="py-3.5 pl-4 text-right text-[11px] text-text-mut font-semibold truncate max-w-[150px]" title={req.managerComment || ""}>
                                {req.managerComment || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {myLeaves.length > 10 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-card text-xs flex-wrap gap-4">
                    <span className="text-text-mut font-semibold">
                      Showing {leavesStartIndex + 1} to {Math.min(myLeaves.length, leavesStartIndex + 10)} of {myLeaves.length} entries
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLeavesPage(prev => Math.max(1, prev - 1))}
                        disabled={leavesPage === 1}
                        className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                      >
                        Prev
                      </button>
                      {Array.from({ length: leavesTotalPages }, (_, i) => i + 1).map((p) => {
                        if (leavesTotalPages > 5 && p !== 1 && p !== leavesTotalPages && Math.abs(p - leavesPage) > 1) {
                          if (p === 2 || p === leavesTotalPages - 1) {
                            return <span key={p} className="px-1 text-text-mut font-bold">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setLeavesPage(p)}
                            className={`w-8 h-8 rounded-[8px] border transition-all cursor-pointer font-bold ${
                              leavesPage === p
                                ? "bg-brand-primary border-brand-primary text-white"
                                : "border-border-card bg-bg-card text-text-sec hover:bg-bg-base"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setLeavesPage(prev => Math.min(leavesTotalPages, prev + 1))}
                        disabled={leavesPage === leavesTotalPages}
                        className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeHistoryTab === "regularization" && (
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-text-main tracking-tight mb-4">My Regularization Requests</h3>
                {myRegularizations.length === 0 ? (
                  <p className="text-xs text-text-mut py-8 text-center font-semibold">No regularization requests raised yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                          <th className="pb-3 pr-4">Date</th>
                          <th className="pb-3 px-4">Requested Shift</th>
                          <th className="pb-3 px-4">Reason</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 pl-4 text-right">Manager Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-card text-xs text-text-main font-semibold">
                        {paginatedRegs.map((req) => {
                          let statusColor = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20";
                          if (req.status === "approved") {
                            statusColor = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
                          } else if (req.status === "rejected") {
                            statusColor = "bg-red-500/10 text-red-500 border border-red-500/20";
                          }

                          return (
                            <tr key={req.id} className="hover:bg-bg-base/30">
                              <td className="py-3.5 pr-4 font-bold text-text-main">{req.date}</td>
                              <td className="py-3.5 px-4 text-text-sec">{req.checkInTime} - {req.checkOutTime}</td>
                              <td className="py-3.5 px-4 text-text-sec truncate max-w-[200px]" title={req.reason}>{req.reason}</td>
                              <td className="py-3.5 px-4">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${statusColor}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="py-3.5 pl-4 text-right text-[11px] text-text-mut font-semibold truncate max-w-[150px]">{req.managerComment || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {myRegularizations.length > 10 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-card text-xs flex-wrap gap-4">
                    <span className="text-text-mut font-semibold">
                      Showing {regsStartIndex + 1} to {Math.min(myRegularizations.length, regsStartIndex + 10)} of {myRegularizations.length} entries
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setRegsPage(prev => Math.max(1, prev - 1))}
                        disabled={regsPage === 1}
                        className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                      >
                        Prev
                      </button>
                      {Array.from({ length: regsTotalPages }, (_, i) => i + 1).map((p) => {
                        if (regsTotalPages > 5 && p !== 1 && p !== regsTotalPages && Math.abs(p - regsPage) > 1) {
                          if (p === 2 || p === regsTotalPages - 1) {
                            return <span key={p} className="px-1 text-text-mut font-bold">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setRegsPage(p)}
                            className={`w-8 h-8 rounded-[8px] border transition-all cursor-pointer font-bold ${
                              regsPage === p
                                ? "bg-brand-primary border-brand-primary text-white"
                                : "border-border-card bg-bg-card text-text-sec hover:bg-bg-base"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setRegsPage(prev => Math.min(regsTotalPages, prev + 1))}
                        disabled={regsPage === regsTotalPages}
                        className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* Regularization Modal */}
      {showRegModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[460px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up text-left relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <Clock size={20} className="text-brand-primary" />
                <span>Request Time Regularization</span>
              </h3>
              <button onClick={() => setShowRegModal(false)} className="text-text-mut hover:text-text-main font-bold cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleRegSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Forgot Date</label>
                <input 
                  type="date"
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-sec">Check-In Time</label>
                  <input 
                    type="time"
                    className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-card text-text-main text-xs outline-none focus:border-brand-primary transition-all"
                    value={regCheckIn}
                    onChange={(e) => setRegCheckIn(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-sec">Check-Out Time</label>
                  <input 
                    type="time"
                    className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-card text-text-main text-xs outline-none focus:border-brand-primary transition-all"
                    value={regCheckOut}
                    onChange={(e) => setRegCheckOut(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-sec">Reason / Explanation</label>
                <textarea 
                  placeholder="Explain why you missed your check-in/out..."
                  className="w-full h-24 p-3 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all resize-none"
                  value={regReason}
                  onChange={(e) => setRegReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border-card pt-4">
                <button 
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="py-2 px-4 border border-border-card rounded-[12px] bg-bg-card hover:bg-bg-base text-text-sec text-xs font-bold cursor-pointer"
                  disabled={regLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-2 px-5 bg-brand-primary text-white text-xs font-bold rounded-[12px] hover:bg-brand-hover transition-colors cursor-pointer"
                  disabled={regLoading}
                >
                  {regLoading ? "Submitting..." : "Submit Request"}
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

