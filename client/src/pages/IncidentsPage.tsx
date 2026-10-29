import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  PlusCircle,
  Search,
  Filter,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Incident } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';

export const IncidentsPage: React.FC = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // New Incident Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [category, setCategory] = useState('DAMAGED_EQUIPMENT');
  const [description, setDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Resolution Modal (Admin/Manager)
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [findings, setFindings] = useState('');
  const [resolution, setResolution] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, [selectedStatus]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      const res = await api.getIncidents(params);
      if (res.success) setIncidents(res.incidents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmittingReport(true);
    try {
      const res = await api.createIncident({
        category,
        description: description.trim(),
      });
      if (res.success) {
        setReportModalOpen(false);
        setDescription('');
        await fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident) return;
    setSubmittingResolution(true);
    try {
      const res = await api.updateIncident(activeIncident._id, {
        status: 'RESOLVED',
        findings: findings.trim(),
        resolution: resolution.trim(),
      });
      if (res.success) {
        setActiveIncident(null);
        setFindings('');
        setResolution('');
        await fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingResolution(false);
    }
  };

  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'RESOURCE_MANAGER' || user?.role === 'HOD';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-rose-200/80">
            Accountability & Safety
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Institutional Incident & Discrepancy Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track equipment condition discrepancies, missing components, venue wear, and verified institutional findings.
          </p>
        </div>

        <button
          onClick={() => setReportModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden text-xs">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">Incident Reports ({incidents.length})</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading incident records...</div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No active incidents</p>
            <p className="text-xs text-slate-400">All equipment and venue returns verified in good condition.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incidents.map((inc) => (
              <div
                key={inc._id}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/70">{inc.incidentNumber}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {inc.category.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={inc.status} size="sm" />
                  </div>

                  <p className="text-slate-700 text-xs leading-relaxed max-w-2xl font-medium">{inc.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>
                      Reported by: <strong className="text-slate-600">{inc.reporter?.name}</strong> ({inc.reporter?.role})
                    </span>
                    <span>•</span>
                    <span>{new Date(inc.createdAt).toLocaleString()}</span>
                    {inc.resolution && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                          Resolution: "{inc.resolution}"
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {isPrivileged && inc.status !== 'RESOLVED' && inc.status !== 'CLOSED' && (
                  <button
                    onClick={() => {
                      setActiveIncident(inc);
                      setFindings('Verified inspection on physical unit. Cable replacement initiated.');
                      setResolution('Component restocked from departmental maintenance buffer.');
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 self-start md:self-auto cursor-pointer shadow-sm transition-all active:scale-95"
                  >
                    Investigate & Resolve →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-md p-6 space-y-4 text-xs animate-scale-in">
            <h3 className="text-base font-extrabold text-slate-900">Report Equipment or Venue Incident</h3>
            <p className="text-slate-500 text-xs">
              Submit an honest condition observation. Reports are reviewed by institutional coordinators without automatic penalization.
            </p>

            <form onSubmit={handleCreateIncident} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Incident Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold"
                >
                  <option value="DAMAGED_EQUIPMENT">Damaged Equipment</option>
                  <option value="MISSING_COMPONENT">Missing Component / Accessory</option>
                  <option value="LATE_RETURN">Late Return</option>
                  <option value="VENUE_DAMAGE">Venue Damage / Cleanliness</option>
                  <option value="EQUIPMENT_MALFUNCTION">Equipment Malfunction During Event</option>
                  <option value="SCHEDULING_DISPUTE">Scheduling Dispute</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Incident Description & Facts *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe exact physical condition, missing cable, or malfunction..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200/90 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
                >
                  {submittingReport ? 'Submitting...' : 'Log Incident Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {activeIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-lg p-6 space-y-4 text-xs animate-scale-in">
            <div className="border-b border-slate-100 pb-3.5">
              <span className="text-[10px] font-mono text-rose-700 font-bold block mb-1">
                {activeIncident.incidentNumber}
              </span>
              <h2 className="text-base font-extrabold text-slate-900">Institutional Finding & Resolution</h2>
            </div>

            <form onSubmit={handleResolveIncident} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Investigation Findings *</label>
                <textarea
                  rows={2}
                  required
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Record technician inspection, borrower explanation, or wear analysis..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Final Resolution & Corrective Action *</label>
                <textarea
                  rows={2}
                  required
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Record repair outcome, replacement part ordered, or closed without penalty..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveIncident(null)}
                  className="px-4 py-2 border border-slate-200/90 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolution}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
                >
                  {submittingResolution ? 'Saving...' : 'Mark Incident Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
