import React from 'react';
import { EventStatus, ConditionGrade } from '../../types/index.js';

interface StatusBadgeProps {
  status: EventStatus | ConditionGrade | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = (status || '').toUpperCase();
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  // Default neutral
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200/80';
  let dotColor = 'bg-slate-400';
  let pulse = false;

  if (s === 'CONFIRMED' || s === 'APPROVED' || s === 'RESOLVED' || s === 'EXCELLENT') {
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-semibold shadow-xs';
    dotColor = 'bg-emerald-500';
  } else if (s === 'UNDER_REVIEW' || s === 'SUBMITTED' || s === 'PENDING' || s === 'GOOD' || s === 'RESUBMITTED' || s === 'ACTIONABLE') {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200/80 font-medium shadow-xs';
    dotColor = 'bg-amber-500';
    pulse = true;
  } else if (s === 'APPROVED_PENDING_CONFIRMATION' || s === 'APPROVED_PENDING_RESOURCE_CONFIRMATION') {
    badgeStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200/80 font-semibold shadow-xs';
    dotColor = 'bg-indigo-500';
    pulse = true;
  } else if (s === 'STAGED') {
    badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200/80 font-medium';
    dotColor = 'bg-slate-400';
  } else if (s === 'CHANGES_REQUESTED' || s === 'MINOR_ISSUES' || s === 'WAITLISTED') {
    badgeStyle = 'bg-orange-50 text-orange-800 border-orange-200/80 font-semibold shadow-xs';
    dotColor = 'bg-orange-500';
  } else if (s === 'REJECTED' || s === 'DAMAGED' || s === 'CANCELLED' || s === 'DISCREPANCY_FLAGGED') {
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200/80 font-semibold shadow-xs';
    dotColor = 'bg-rose-500';
  } else if (s === 'IN_PROGRESS' || s === 'CHECKED_OUT') {
    badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200/80 font-semibold shadow-xs';
    dotColor = 'bg-blue-500';
    pulse = true;
  } else if (s === 'COMPLETED' || s === 'RETURNED' || s === 'CLOSED') {
    badgeStyle = 'bg-teal-50 text-teal-800 border-teal-200/80 font-semibold shadow-xs';
    dotColor = 'bg-teal-500';
  }

  const formatted = s.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${padding} ${badgeStyle} tracking-wide uppercase transition-all select-none`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
      </span>
      <span>{formatted}</span>
    </span>
  );
};
