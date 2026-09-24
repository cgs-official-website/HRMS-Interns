import { BellRing, CheckCircle2, Clock3, FileText, UserRound, X } from "lucide-react";

const formatDuration = (durationMs) => {
  const totalMinutes = Math.max(1, Math.floor(durationMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export default function EmployeeReminderBar({ reminder, onDismiss }) {
  if (!reminder) return null;

  return (
    <aside className="employee-reminder-bar" role="alert" aria-live="assertive">
      <div className="employee-reminder-bar__accent" aria-hidden="true" />
      <div className="employee-reminder-bar__icon" aria-hidden="true">
        <BellRing size={20} strokeWidth={2.4} />
      </div>
      <div className="employee-reminder-bar__content">
        <div className="employee-reminder-bar__eyebrow">HRMS report reminder</div>
        <div className="employee-reminder-bar__title">Complete the report</div>
        <div className="employee-reminder-bar__details">
          <span><UserRound size={14} /> {reminder.employeeName}</span>
          <span><FileText size={14} /> {reminder.taskName}</span>
          <span><Clock3 size={14} /> Running {formatDuration(reminder.runningDuration)}</span>
        </div>
        <p>{reminder.message}</p>
      </div>
      <button className="employee-reminder-bar__ok" type="button" onClick={onDismiss}>
        <CheckCircle2 size={16} /> OK
      </button>
      <button className="employee-reminder-bar__close" type="button" onClick={onDismiss} aria-label="Dismiss reminder">
        <X size={17} />
      </button>
    </aside>
  );
}
