import React, { useState, useEffect } from 'react';
import {
  Repeat,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { HandoverRecord } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { Link } from 'react-router-dom';

export const CheckinReturnPage: React.FC = () => {
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    setLoading(true);
    try {
      const res = await api.getHandoverHistory();
      if (res.success) {
        setHandovers(res.handovers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeCheckedOut = handovers.filter((h) => h.status === 'CHECKED_OUT');
  const pastReturns = handovers.filter(
    (h) => h.status === 'RETURNED' || h.status === 'COMPLETED' || h.status === 'DISCREPANCY_FLAGGED'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Equipment Handover & Return Receipts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Verify physical collection timestamps, documented condition grades, accessories checklists, and return receipts.
        </p>
      </div>

      {/* Active checked-out items banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Currently Checked Out Equipment ({activeCheckedOut.length})</span>
        </h3>

        {loading ? (
          <p className="text-xs text-slate-400">Loading handover queue...</p>
        ) : activeCheckedOut.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No equipment currently in your possession.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCheckedOut.map((h) => (
              <div key={h._id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2.5 text-xs shadow-subtle hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{h.resource?.name}</h4>
                    <span className="font-mono text-slate-400 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{h.resource?.code}</span>
                  </div>
                  <StatusBadge status={h.status} size="sm" />
                </div>

                <div className="space-y-1.5 text-slate-600 text-[11px] pt-1">
                  <p>
                    <strong className="text-slate-800">Event:</strong> {h.event?.title} ({h.event?.requestNumber})
                  </p>
                  <p>
                    <strong className="text-slate-800">Checked Out At:</strong> {new Date(h.checkoutTime).toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-1.5 pt-0.5">
                    <span className="text-slate-700 font-medium">Initial Inspection Grade:</span>
                    <StatusBadge status={h.initialCondition} size="sm" />
                  </div>
                  {h.initialNotes && (
                    <p className="text-slate-500 italic mt-0.5">Notes: "{h.initialNotes}"</p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Handover verified by: {h.manager?.name}
                  </span>
                  <Link
                    to="/incidents"
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-800 transition-colors"
                  >
                    Report Issue →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Return History */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>Past Return Receipts & Condition Audits</span>
        </h3>

        {pastReturns.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No past returns recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {pastReturns.map((h) => (
              <div key={h._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{h.resource?.name}</span>
                    <StatusBadge status={h.status} size="sm" />
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Event: {h.event?.title} • Returned At: {h.returnTime ? new Date(h.returnTime).toLocaleString() : 'N/A'}
                  </p>
                  <div className="flex items-center space-x-2.5 text-[11px] text-slate-600">
                    <span>Initial: <StatusBadge status={h.initialCondition} size="sm" /></span>
                    <span className="text-slate-400 font-bold">→</span>
                    <span>Final: <StatusBadge status={h.finalCondition || 'GOOD'} size="sm" /></span>
                  </div>
                </div>

                {h.discrepancyFlagged && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] font-bold flex items-center space-x-1 shrink-0 shadow-subtle">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Discrepancy Logged for Review</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
