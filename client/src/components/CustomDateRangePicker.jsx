import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';

export default function CustomDateRangePicker({ startDate, endDate, setStartDate, setEndDate, minDate }) {
  const [currentMonth, setCurrentMonth] = useState(
    startDate ? new Date(startDate) : new Date()
  );
  const [hoverDate, setHoverDate] = useState(null);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = useMemo(() => {
    const arr = [];
    // Previous month padding
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      arr.push({
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
        isCurrentMonth: true
      });
    }
    // Next month padding
    const remaining = 42 - arr.length; // 6 rows of 7 days
    for (let i = 1; i <= remaining; i++) {
      arr.push({
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i),
        isCurrentMonth: false
      });
    }
    return arr;
  }, [currentMonth, daysInMonth, startOffset]);

  const formatDateStr = (dateObj) => {
    const d = dateObj.getDate().toString().padStart(2, '0');
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${y}-${m}-${d}`;
  };

  const handleDateClick = (dateObj) => {
    const dateStr = formatDateStr(dateObj);
    
    // Disable past dates if minDate is provided
    if (minDate && dateStr < minDate) return;

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate('');
    } else if (startDate && !endDate) {
      if (dateStr < startDate) {
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    }
  };

  const isSelected = (dateStr) => {
    return dateStr === startDate || dateStr === endDate;
  };

  const isHoverRange = (dateStr) => {
    if (startDate && !endDate && hoverDate) {
      if (hoverDate > startDate) {
        return dateStr > startDate && dateStr <= hoverDate;
      } else if (hoverDate < startDate) {
        return dateStr < startDate && dateStr >= hoverDate;
      }
    }
    return false;
  };

  const isBetween = (dateStr) => {
    if (startDate && endDate) {
      return dateStr > startDate && dateStr < endDate;
    }
    return false;
  };

  const startObj = startDate ? new Date(startDate) : null;
  const endObj = endDate ? new Date(endDate) : null;

  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return startDate ? 1 : 0;
    const diffTime = Math.abs(endObj - startObj);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate, startObj, endObj]);

  const includesWeekend = useMemo(() => {
    if (!startDate) return false;
    const current = new Date(startDate);
    const last = endDate ? new Date(endDate) : new Date(startDate);
    
    // Make sure current <= last
    let start = current <= last ? current : last;
    let end = current <= last ? last : current;

    while (start <= end) {
      const day = start.getDay();
      if (day === 0 || day === 6) return true;
      start.setDate(start.getDate() + 1);
    }
    return false;
  }, [startDate, endDate]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="flex flex-col sm:flex-row bg-bg-card rounded-[24px] border border-border-card overflow-hidden shadow-sm font-sans w-full max-w-[700px] mx-auto text-left">
      {/* Calendar Grid Section */}
      <div className="p-6 sm:p-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-extrabold text-text-main">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={prevMonth}
              className="text-brand-primary hover:text-brand-hover p-1 cursor-pointer transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              type="button" 
              onClick={nextMonth}
              className="text-brand-primary hover:text-brand-hover p-1 cursor-pointer transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center mb-4">
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
            <div key={day} className="text-[10px] font-extrabold text-text-mut uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 text-center gap-y-2 relative">
          {days.map((dayObj, i) => {
            const dateStr = formatDateStr(dayObj.date);
            const isMinDisabled = minDate && dateStr < minDate;
            const selected = isSelected(dateStr);
            const between = isBetween(dateStr) || isHoverRange(dateStr);
            const isStartNode = dateStr === startDate;
            const isEndNode = dateStr === endDate || (startDate && !endDate && dateStr === hoverDate && hoverDate > startDate);
            const isHoverStartNode = (startDate && !endDate && dateStr === hoverDate && hoverDate < startDate);

            return (
              <div 
                key={i} 
                className="relative py-1 flex items-center justify-center cursor-pointer"
                onMouseEnter={() => setHoverDate(dateStr)}
                onClick={() => handleDateClick(dayObj.date)}
              >
                {/* Connecting Trail Background */}
                {between && (
                  <div className="absolute inset-y-1 inset-x-0 bg-brand-primary/15" />
                )}
                {selected && endDate && isStartNode && startDate < endDate && (
                  <div className="absolute inset-y-1 right-0 left-1/2 bg-brand-primary/15" />
                )}
                {selected && endDate && isEndNode && endDate > startDate && (
                  <div className="absolute inset-y-1 left-0 right-1/2 bg-brand-primary/15" />
                )}

                {/* Hover state for trailing start (when hovering before start date) */}
                {!endDate && startDate && isStartNode && hoverDate && hoverDate < startDate && (
                  <div className="absolute inset-y-1 left-0 right-1/2 bg-brand-primary/15" />
                )}
                {!endDate && startDate && isHoverStartNode && (
                  <div className="absolute inset-y-1 right-0 left-1/2 bg-brand-primary/15" />
                )}
                {!endDate && startDate && hoverDate > startDate && isStartNode && (
                  <div className="absolute inset-y-1 right-0 left-1/2 bg-brand-primary/15" />
                )}

                {/* Node Circle */}
                <div 
                  className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                    selected
                      ? "bg-brand-primary text-white shadow-md shadow-brand-primary/30"
                      : (!endDate && startDate && dateStr === hoverDate)
                      ? "bg-brand-primary text-white shadow-md shadow-brand-primary/30 scale-95"
                      : between
                      ? "text-brand-primary"
                      : isMinDisabled
                      ? "text-text-mut/30 cursor-not-allowed"
                      : !dayObj.isCurrentMonth
                      ? "text-text-mut"
                      : "text-text-main hover:bg-bg-base"
                  }`}
                >
                  {dayObj.date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Panel */}
      <div className="bg-bg-base/50 p-6 sm:p-8 flex-1 border-t sm:border-t-0 sm:border-l border-border-card flex flex-col justify-center">
        
        <div className="mb-8">
          <span className="text-[11px] font-bold text-text-sec block mb-2">Selected Dates</span>
          {startDate ? (
            <div className="text-xl sm:text-2xl font-black text-text-main tracking-tight">
              {startObj.toLocaleDateString([], { day: 'numeric', month: 'short' })}
              {endDate && endDate !== startDate ? (
                <>
                  <span className="text-text-mut mx-2">—</span>
                  {endObj.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                </>
              ) : (
                <span className="text-text-main"> {startObj.getFullYear()}</span>
              )}
            </div>
          ) : (
            <div className="text-xl sm:text-2xl font-black text-text-mut tracking-tight">
              Select range...
            </div>
          )}
        </div>

        <div className="h-px bg-border-card w-full mb-8" />

        <div className="mb-8">
          <span className="text-[11px] font-bold text-text-sec block mb-3">Total Duration</span>
          <div className="flex items-center gap-3">
            <div className="text-brand-primary">
              <Calendar size={28} />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-brand-primary tracking-tight">
              {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm font-bold text-text-sec">
          Includes weekend
          {includesWeekend ? (
            <CheckCircle2 size={18} className="text-brand-success" />
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border border-border-card bg-bg-card flex items-center justify-center">
              <span className="block w-1.5 h-1.5 rounded-full bg-border-card" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

