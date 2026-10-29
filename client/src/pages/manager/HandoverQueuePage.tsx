import React, { useState, useEffect } from 'react';
import {
  Repeat,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { ConditionGrade } from '../../types/index.js';

export const HandoverQueuePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CHECKOUT' | 'RETURN'>('CHECKOUT');
  const [readyForCheckout, setReadyForCheckout] = useState<any[]>([]);
  const [activeCheckedOut, setActiveCheckedOut] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Checkout Modal State
  const [checkoutTarget, setCheckoutTarget] = useState<any | null>(null);
  const [initialCondition, setInitialCondition] = useState<ConditionGrade>('EXCELLENT');
  const [initialNotes, setInitialNotes] = useState('');
  const [initialAccessories, setInitialAccessories] = useState(true);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  // Return Modal State
  const [returnTarget, setReturnTarget] = useState<any | null>(null);
  const [finalCondition, setFinalCondition] = useState<ConditionGrade>('GOOD');
  const [finalNotes, setFinalNotes] = useState('');
  const [finalAccessories, setFinalAccessories] = useState(true);
  const [reportedDiscrepancy, setReportedDiscrepancy] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getHandoverQueue();
      if (res.success) {
        setReadyForCheckout(res.readyForCheckout);
        setActiveCheckedOut(res.activeCheckedOut);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTarget) return;
    setSubmittingCheckout(true);
    try {
      const res = await api.checkoutResource({
        eventId: checkoutTarget.event._id,
        reservationId: checkoutTarget._id,
        resourceId: checkoutTarget.resource._id,
        initialCondition,
        initialNotes: initialNotes.trim(),
        initialAccessoriesConfirmed: initialAccessories,
        quantityHandedOver: checkoutTarget.quantity,
      });
      if (res.success) {
        setCheckoutTarget(null);
        setInitialNotes('');
        await fetchQueue();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTarget) return;
    setSubmittingReturn(true);
    try {
      const res = await api.returnResource({
        handoverId: returnTarget._id,
        finalCondition,
        finalNotes: finalNotes.trim(),
        finalAccessoriesConfirmed: finalAccessories,
        reportedDiscrepancy: reportedDiscrepancy || !finalAccessories || finalCondition === 'DAMAGED',
      });
      if (res.success) {
        setReturnTarget(null);
        setFinalNotes('');
        await fetchQueue();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Handover & Return Inspection Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Perform formal physical handovers, record initial condition grades, verify accessories, and process returns.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/80 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('CHECKOUT')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'CHECKOUT'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Ready for Checkout Handover ({readyForCheckout.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RETURN')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'RETURN'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Currently Checked Out / Return Queue ({activeCheckedOut.length})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading operations queue...</div>
        ) : activeTab === 'CHECKOUT' ? (
          readyForCheckout.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No equipment currently awaiting collection.</p>
              <p className="text-xs text-slate-400">All confirmed reservations have been processed.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {readyForCheckout.map((item) => (
                <div
                  key={item._id}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-slate-900 text-sm">{item.resource?.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.resource?.code}</span>
                      <span className="bg-teal-50 text-teal-800 font-bold px-2.5 py-0.5 rounded-full text-[10px] border border-teal-200/70">
                        Qty: {item.quantity} unit(s)
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px]">
                      Borrower: <strong>{item.event?.organizer?.name}</strong> • Phone:{' '}
                      {item.event?.organizer?.phone || 'N/A'} • PRN:{' '}
                      {item.event?.organizer?.studentOrEmpId || 'N/A'}
                    </p>

                    <div className="flex items-center space-x-3 text-slate-500 text-[10px]">
                      <span>Event: {item.event?.title} ({item.event?.requestNumber})</span>
                      <span>•</span>
                      <span>Location: {item.resource?.location}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutTarget(item);
                      setInitialCondition('EXCELLENT');
                      setInitialNotes('Inspected clean, operational, and all included cables verified.');
                      setInitialAccessories(true);
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm shadow-teal-600/20 transition-all cursor-pointer self-start md:self-auto active:scale-95"
                  >
                    Execute Handover →
                  </button>
                </div>
              ))}
            </div>
          )
        ) : activeCheckedOut.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No active checked out equipment.</p>
            <p className="text-xs text-slate-400">All checked out items have been returned.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeCheckedOut.map((item) => (
              <div
                key={item._id}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:bg-slate-50/80 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-slate-900 text-sm">{item.resource?.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.resource?.code}</span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  <p className="text-slate-600 text-[11px]">
                    Borrower: <strong>{item.borrower?.name}</strong> ({item.borrower?.phone || 'No phone'})
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[10px]">
                    <span>Event: {item.event?.title}</span>
                    <span>•</span>
                    <span>Out since: {new Date(item.checkoutTime).toLocaleString()}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <span>Initial Condition:</span>
                      <StatusBadge status={item.initialCondition} size="sm" />
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setReturnTarget(item);
                    setFinalCondition('GOOD');
                    setFinalNotes('Returned in normal working condition.');
                    setFinalAccessories(true);
                    setReportedDiscrepancy(false);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer self-start md:self-auto active:scale-95"
                >
                  Record Return & Inspect →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Handover Modal */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-lg p-6 space-y-4 text-xs animate-scale-in">
            <div className="border-b border-slate-100 pb-3.5">
              <span className="text-teal-700 font-bold uppercase text-[10px] tracking-wider">Checkout Inspection Protocol</span>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{checkoutTarget.resource?.name}</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Borrower: {checkoutTarget.event?.organizer?.name} • Qty: {checkoutTarget.quantity}
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Initial Physical Condition Grade *</label>
                <select
                  value={initialCondition}
                  onChange={(e) => setInitialCondition(e.target.value as ConditionGrade)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs"
                >
                  <option value="EXCELLENT">EXCELLENT - Brand new / Pristine working order</option>
                  <option value="GOOD">GOOD - Fully functional with minor normal wear</option>
                  <option value="MINOR_ISSUES">MINOR_ISSUES - Cosmetic scratches / Minor quirks</option>
                  <option value="DAMAGED">DAMAGED - Pre-existing issue documented</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Handover Notes & Observations</label>
                <textarea
                  rows={2}
                  value={initialNotes}
                  onChange={(e) => setInitialNotes(e.target.value)}
                  placeholder="Record serial numbers, battery charge state, or pre-existing blemishes..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                />
              </div>

              <div className="flex items-center space-x-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <input
                  type="checkbox"
                  id="accChecked"
                  checked={initialAccessories}
                  onChange={(e) => setInitialAccessories(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <label htmlFor="accChecked" className="font-semibold text-slate-800 cursor-pointer">
                  All standard accessories & cables confirmed present during handover
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutTarget(null)}
                  className="px-4 py-2 border border-slate-200/90 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckout}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
                >
                  {submittingCheckout ? 'Confirming...' : 'Confirm Physical Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Inspection Modal */}
      {returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-lg p-6 space-y-4 text-xs animate-scale-in">
            <div className="border-b border-slate-100 pb-3.5">
              <span className="text-teal-700 font-bold uppercase text-[10px] tracking-wider">Return Inspection & Audit</span>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{returnTarget.resource?.name}</h2>
              <div className="text-slate-500 flex items-center space-x-2 mt-0.5">
                <span>Borrower: {returnTarget.borrower?.name}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <span>Initial Grade:</span>
                  <StatusBadge status={returnTarget.initialCondition} size="sm" />
                </span>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Final Return Condition Grade *</label>
                <select
                  value={finalCondition}
                  onChange={(e) => setFinalCondition(e.target.value as ConditionGrade)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs"
                >
                  <option value="EXCELLENT">EXCELLENT - Returned in pristine condition</option>
                  <option value="GOOD">GOOD - Fully working with acceptable normal wear</option>
                  <option value="MINOR_ISSUES">MINOR_ISSUES - Scratches / Cables untangled / Minor issues</option>
                  <option value="DAMAGED">DAMAGED - Broken component / Malfunctioning port</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Inspection Notes & Findings</label>
                <textarea
                  rows={2}
                  value={finalNotes}
                  onChange={(e) => setFinalNotes(e.target.value)}
                  placeholder="Record condition details, testing notes, or discrepancies..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                  <input
                    type="checkbox"
                    id="retAcc"
                    checked={finalAccessories}
                    onChange={(e) => setFinalAccessories(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="retAcc" className="font-semibold text-slate-800 cursor-pointer">
                    All cables, cases, remotes & adapters returned intact
                  </label>
                </div>

                {(!finalAccessories || finalCondition === 'DAMAGED') && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200/90 text-rose-800 rounded-2xl flex items-center space-x-2.5 font-medium shadow-subtle">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Condition degradation or missing parts detected. Submitting will automatically flag a
                      discrepancy and open an institutional Incident for review.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnTarget(null)}
                  className="px-4 py-2 border border-slate-200/90 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer active:scale-95"
                >
                  {submittingReturn ? 'Recording Return...' : 'Complete Return Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
