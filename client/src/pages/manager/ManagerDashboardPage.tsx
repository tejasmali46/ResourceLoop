import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Repeat,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Package,
  Wrench,
  Layers,
  ChevronRight,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';

export const ManagerDashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [queue, setQueue] = useState<{ readyForCheckout: any[]; activeCheckedOut: any[] }>({
    readyForCheckout: [],
    activeCheckedOut: [],
  });
  const [pendingConfirmations, setPendingConfirmations] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal
  const [activeConfirmEvent, setActiveConfirmEvent] = useState<any | null>(null);
  const [confirmReason, setConfirmReason] = useState('Resource availability verified in pool. Operational confirmation approved.');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [queueRes, pendingRes, incRes] = await Promise.all([
        api.getHandoverQueue(),
        api.getPendingApprovals(),
        api.getIncidents({ limit: 5 }),
      ]);

      if (queueRes.success) {
        setQueue({
          readyForCheckout: queueRes.readyForCheckout || [],
          activeCheckedOut: queueRes.activeCheckedOut || [],
        });
      }

      if (pendingRes.success) {
        setPendingConfirmations(pendingRes.pendingRequests || []);
      }

      if (incRes.success) {
        setIncidents(incRes.incidents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!activeConfirmEvent) return;
    setSubmitting(true);
    try {
      const res = await api.submitApprovalDecision({
        eventId: activeConfirmEvent._id,
        decision,
        reason: confirmReason,
      });
      if (res.success) {
        setActiveConfirmEvent(null);
        await loadData();
        await refreshUser();
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-teal-200/80">
              Resource Operations Hub
            </span>
            <span className="text-xs text-slate-400">• AV & Maker Labs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Resource Manager Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Confirm operational equipment allocation, execute physical checkouts with initial condition grading, and process returns.
          </p>
        </div>

        <Link
          to="/manager/queue"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all active:scale-95 shrink-0"
        >
          <Repeat className="w-4 h-4" />
          <span>Open Handover & Return Queue</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Confirmation</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">{pendingConfirmations.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Events awaiting gear sign-off</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-teal-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ready for Pickup</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-600">{queue.readyForCheckout.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Reservations awaiting pickup</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Currently Checked Out</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600">{queue.activeCheckedOut.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Items in borrower custody</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Open Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600">{incidents.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Flagged condition degradation</p>
        </div>
      </div>

      {/* SECTION: PENDING RESOURCE CONFIRMATIONS */}
      <div className="bg-white rounded-3xl border border-teal-500/30 shadow-card overflow-hidden">
        <div className="p-5 sm:p-6 bg-teal-50/50 border-b border-teal-100/80 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-teal-950 text-sm flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Pending Operational Resource Confirmations ({pendingConfirmations.length})</span>
            </h3>
            <p className="text-xs text-teal-700 mt-0.5">
              Proposals approved by Faculty and HOD, now awaiting your inventory verification to finalize bookings.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading pending confirmations...</div>
        ) : pendingConfirmations.length === 0 ? (
          <div className="p-8 text-center space-y-1.5">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-slate-700">All resource requests confirmed!</p>
            <p className="text-[11px] text-slate-400">No events currently awaiting resource manager operational approval.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingConfirmations.map((evt) => (
              <div key={evt._id} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:bg-slate-50/80 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/70">{evt.requestNumber}</span>
                    <span className="text-slate-300">•</span>
                    <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                    <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-700">
                      {evt.expectedAttendance} Attendees
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                    <span>Club: <strong>{evt.organizingClub?.name}</strong></span>
                    <span>•</span>
                    <span>Organizer: <strong>{evt.organizer?.name}</strong></span>
                    <span>•</span>
                    <span>Venue: {evt.venue?.name || 'On-campus'}</span>
                    <span>•</span>
                    <span>Schedule: {new Date(evt.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                  <Link
                    to={`/approvals/${evt._id}`}
                    className="px-3.5 py-2 border border-slate-200/90 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-all shadow-subtle"
                  >
                    View Specs
                  </Link>
                  <button
                    onClick={() => {
                      setActiveConfirmEvent(evt);
                      setConfirmReason('Resource availability verified in pool. Operational confirmation approved.');
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm shadow-teal-600/20 transition-all cursor-pointer active:scale-95"
                  >
                    Confirm Allocation →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two-Column Grid: Collections & Checked-out Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checkout Queue */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Today's Collections / Ready for Handover</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Confirmed bookings awaiting physical gear dispatch</p>
            </div>
            <Link to="/manager/queue" className="text-teal-600 font-bold hover:text-teal-700 transition-colors">
              Manage All →
            </Link>
          </div>

          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : queue.readyForCheckout.length === 0 ? (
            <p className="text-slate-400 italic">No equipment currently waiting for pickup.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {queue.readyForCheckout.slice(0, 4).map((item) => (
                <div key={item._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.resource?.name}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Borrower: {item.event?.organizer?.name} • Quantity: {item.quantity} unit(s)
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      Event: {item.event?.title} ({item.event?.requestNumber})
                    </span>
                  </div>
                  <Link
                    to="/manager/queue"
                    className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100/80 text-teal-800 font-bold rounded-xl border border-teal-200/80 transition-colors"
                  >
                    Handover →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checked Out Active */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Equipment Currently in Use</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Active custody tracking with accessories checklist</p>
            </div>
            <Link to="/manager/queue" className="text-teal-600 font-bold hover:text-teal-700 transition-colors">
              Inspect Returns →
            </Link>
          </div>

          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : queue.activeCheckedOut.length === 0 ? (
            <p className="text-slate-400 italic">No equipment currently checked out.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {queue.activeCheckedOut.slice(0, 4).map((item) => (
                <div key={item._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.resource?.name}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Borrower: {item.borrower?.name} ({item.borrower?.phone || 'No phone'})
                    </p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Out Since: {new Date(item.checkoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Link
                    to="/manager/queue"
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold rounded-xl border border-slate-200 transition-colors"
                  >
                    Record Return →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {activeConfirmEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-md p-6 space-y-4 text-xs animate-scale-in">
            <div>
              <span className="font-mono text-[10px] text-teal-700 font-bold block mb-1">
                {activeConfirmEvent.requestNumber} • Operational Allocation
              </span>
              <h2 className="text-base font-black text-slate-900">Confirm Resource Allocation</h2>
              <p className="text-slate-500 text-xs mt-0.5">Finalize operational booking for "{activeConfirmEvent.title}".</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Operational Confirmation Note</label>
              <textarea
                rows={3}
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all shadow-subtle"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setActiveConfirmEvent(null)}
                className="px-4 py-2 border border-slate-200/90 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleConfirmSubmit('REJECTED')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Reject / Unavailable
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleConfirmSubmit('APPROVED')}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer active:scale-95"
              >
                {submitting ? 'Confirming...' : 'Confirm Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
