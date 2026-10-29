import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  ChevronRight,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Building,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { EventRequest, ApprovalDecision } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { useAuth } from '../../context/AuthContext.js';

export const ApprovalDashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRoles = (user as any)?.roles || (user?.role ? [user.role] : []);
  const isHodUser = user?.role === 'HOD' || userRoles.includes('HOD');

  // Toggle view mode for multi-role users (HOD vs Faculty)
  const [viewMode, setViewMode] = useState<'FACULTY' | 'HOD'>(
    location.pathname === '/hod/dashboard' || user?.role === 'HOD' ? 'HOD' : 'FACULTY'
  );

  useEffect(() => {
    if (location.pathname === '/hod/dashboard') {
      setViewMode('HOD');
    }
  }, [location.pathname]);

  // Faculty Workspace State
  const [facultyTab, setFacultyTab] = useState<
    'pending' | 'inReview' | 'changes' | 'completed' | 'upcoming'
  >('pending');
  const [facultyData, setFacultyData] = useState<{
    pendingApprovals: any[];
    inReview: any[];
    changesRequested: any[];
    recentDecisions: any[];
    upcomingEvents: any[];
  }>({
    pendingApprovals: [],
    inReview: [],
    changesRequested: [],
    recentDecisions: [],
    upcomingEvents: [],
  });

  // HOD Workspace State
  const [hodTab, setHodTab] = useState<
    'pending' | 'schedule' | 'waiting' | 'decisions' | 'conflicts'
  >('pending');
  const [hodData, setHodData] = useState<{
    pendingApprovals: any[];
    upcomingEvents: any[];
    stagedRequests: any[];
    recentDecisions: any[];
    activeReservations: any[];
  }>({
    pendingApprovals: [],
    upcomingEvents: [],
    stagedRequests: [],
    recentDecisions: [],
    activeReservations: [],
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Quick Review Modal State
  const [activeEvent, setActiveEvent] = useState<any | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'>('APPROVED');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [viewMode]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'HOD') {
        const res = await api.getHodDashboard();
        if (res.success) {
          setHodData({
            pendingApprovals: res.pendingApprovals || [],
            upcomingEvents: res.upcomingEvents || [],
            stagedRequests: res.stagedRequests || [],
            recentDecisions: res.recentDecisions || [],
            activeReservations: res.activeReservations || [],
          });
        }
      } else {
        const res = await api.getFacultyDashboard();
        if (res.success) {
          setFacultyData({
            pendingApprovals: res.pendingApprovals || [],
            inReview: res.inReview || [],
            changesRequested: res.changesRequested || [],
            recentDecisions: res.recentDecisions || [],
            upcomingEvents: res.upcomingEvents || [],
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;
    if (!reason.trim()) {
      setModalError('Please enter a review reason or explanation.');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      const res = await api.submitApprovalDecision({
        eventId: activeEvent._id,
        decision,
        reason: reason.trim(),
      });
      if (res.success) {
        setActiveEvent(null);
        setReason('');
        await loadDashboardData();
        await refreshUser();
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit decision.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter helper for requests
  const filterList = (list: any[]) => {
    return list.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.organizingClub?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Workspace Header & Role Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-teal-200/80">
              {viewMode === 'HOD' ? 'Department Head (HOD)' : 'Faculty Coordinator'} Portal
            </span>
            <span className="text-xs text-slate-400">• Institutional Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {viewMode === 'HOD' ? 'Departmental Authorization & Schedule Hub' : 'Faculty Review Workspace'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {viewMode === 'HOD'
              ? 'Sanction large-scale campus events (≥100 attendees), audit departmental room utilization, and review faculty endorsements.'
              : 'Endorse academic objectives, verify student club representation, and forward verified requests through institutional tiers.'}
          </p>
        </div>

        {/* Multi-role Toggle Pill if user has both roles or is admin */}
        {(userRoles.includes('HOD') || userRoles.includes('ADMIN')) && (
          <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center space-x-1 shrink-0 self-start md:self-center border border-slate-200/80 shadow-subtle">
            <button
              onClick={() => setViewMode('FACULTY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'FACULTY'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty Coordinator View
            </button>
            <button
              onClick={() => setViewMode('HOD')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'HOD'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HOD Department View
            </button>
          </div>
        )}
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, club, or REQ-2026..."
            className="w-full bg-slate-50 pl-10 pr-3 py-2 rounded-xl border border-slate-200/80 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-1.5 text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CHANGES_REQUESTED">Changes Requested</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: FACULTY WORKSPACE */}
      {viewMode === 'FACULTY' && (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200/80 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setFacultyTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                facultyTab === 'pending'
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Approvals ({facultyData.pendingApprovals.length})</span>
            </button>

            <button
              onClick={() => setFacultyTab('inReview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                facultyTab === 'inReview'
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              In Review ({facultyData.inReview.length})
            </button>

            <button
              onClick={() => setFacultyTab('changes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                facultyTab === 'changes'
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              Changes Requested ({facultyData.changesRequested.length})
            </button>

            <button
              onClick={() => setFacultyTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                facultyTab === 'completed'
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              Recently Completed ({facultyData.recentDecisions.length})
            </button>

            <button
              onClick={() => setFacultyTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                facultyTab === 'upcoming'
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              Upcoming Events ({facultyData.upcomingEvents.length})
            </button>
          </div>

          {/* Tab 1: Pending Approvals Table */}
          {facultyTab === 'pending' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Actionable Proposals Assigned to You ({filterList(facultyData.pendingApprovals).length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proposals requiring your academic verification and safety sign-off.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading pending requests...</div>
              ) : filterList(facultyData.pendingApprovals).length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">All caught up!</p>
                  <p className="text-xs text-slate-400">No proposals currently awaiting your faculty endorsement.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Event Title</th>
                        <th className="py-3 px-4">Club / Organizer</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Requested Date</th>
                        <th className="py-3 px-4">Venue</th>
                        <th className="py-3 px-4">Review Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filterList(facultyData.pendingApprovals).map((evt) => (
                        <tr key={evt._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                            {evt.requestNumber}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                            <Link to={`/approvals/${evt._id}`} className="hover:text-teal-600 transition-colors">
                              {evt.title}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">
                              {evt.organizingClub?.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {evt.organizer?.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                              {evt.department?.code || 'CSE'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {new Date(evt.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(evt.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {evt.venue?.name || 'On-campus'}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={evt.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                to={`/approvals/${evt._id}`}
                                className="px-3 py-1.5 border border-slate-200/90 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all shadow-subtle"
                              >
                                View Details
                              </Link>
                              <button
                                onClick={() => {
                                  setActiveEvent(evt);
                                  setDecision('APPROVED');
                                  setReason('Event proposal verified. Academic objectives and student safety requirements met.');
                                  setModalError(null);
                                }}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-sm shadow-teal-600/20 transition-all cursor-pointer active:scale-95"
                              >
                                Review & Decide →
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: In Review */}
          {facultyTab === 'inReview' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm">Proposals In Review ({facultyData.inReview.length})</h3>
              {facultyData.inReview.length === 0 ? (
                <p className="text-slate-400 italic">No events currently in review.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {facultyData.inReview.map((evt) => (
                    <div key={evt._id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-teal-700 font-bold block">{evt.requestNumber}</span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{evt.title}</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">{evt.organizingClub?.name} • {new Date(evt.startDate).toLocaleDateString()}</p>
                      </div>
                      <Link to={`/approvals/${evt._id}`} className="text-teal-600 font-bold hover:underline">
                        Open Review Page →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Changes Requested */}
          {facultyTab === 'changes' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm">Requests Awaiting Student Edits ({facultyData.changesRequested.length})</h3>
              {facultyData.changesRequested.length === 0 ? (
                <p className="text-slate-400 italic">No requests currently in changes-requested state.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {facultyData.changesRequested.map((evt) => (
                    <div key={evt._id} className="py-3.5 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-mono text-amber-600 font-bold block">{evt.requestNumber}</span>
                        <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                        <p className="text-slate-600 text-[11px] bg-amber-50 p-2.5 rounded-xl border border-amber-200 inline-block font-medium">
                          Notes given: "{evt.changeNotes || 'Adjustments requested'}"
                        </p>
                      </div>
                      <Link to={`/approvals/${evt._id}`} className="text-teal-600 font-bold hover:underline">
                        View Context →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Completed Decisions */}
          {facultyTab === 'completed' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm">Your Recent Decisions ({facultyData.recentDecisions.length})</h3>
              {facultyData.recentDecisions.length === 0 ? (
                <p className="text-slate-400 italic">No decisions recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {facultyData.recentDecisions.map((dec) => (
                    <div key={dec._id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={dec.decision} size="sm" />
                          <span className="font-bold text-slate-900 text-sm">{dec.event?.title}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">Audit Note: "{dec.reason}"</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(dec.createdAt).toLocaleString()}</span>
                      </div>
                      {dec.event?._id && (
                        <Link to={`/approvals/${dec.event._id}`} className="text-teal-600 font-bold hover:underline">
                          View Event →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Upcoming Events */}
          {facultyTab === 'upcoming' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm">Upcoming Mentored Events ({facultyData.upcomingEvents.length})</h3>
              {facultyData.upcomingEvents.length === 0 ? (
                <p className="text-slate-400 italic">No upcoming confirmed events scheduled.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facultyData.upcomingEvents.map((evt) => (
                    <div key={evt._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{evt.title}</span>
                        <StatusBadge status={evt.status} size="sm" />
                      </div>
                      <p className="text-slate-500 text-[11px]">{evt.organizingClub?.name} • Venue: {evt.venue?.name}</p>
                      <p className="text-teal-700 font-bold text-[11px]">
                        {new Date(evt.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <Link to={`/approvals/${evt._id}`} className="text-xs text-teal-600 font-bold block pt-1 hover:underline">
                        Inspect Event Details →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: HOD DEPARTMENTAL WORKSPACE */}
      {viewMode === 'HOD' && (
        <div className="space-y-6">
          {/* HOD Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200/80 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setHodTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                hodTab === 'pending'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pending Department Approvals ({hodData.pendingApprovals.length})</span>
            </button>

            <button
              onClick={() => setHodTab('schedule')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                hodTab === 'schedule'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              Department Schedule & Upcoming ({hodData.upcomingEvents.length})
            </button>

            <button
              onClick={() => setHodTab('waiting')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                hodTab === 'waiting'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              Waiting for Faculty ({hodData.stagedRequests.length})
            </button>

            <button
              onClick={() => setHodTab('decisions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                hodTab === 'decisions'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              Recent Department Decisions ({hodData.recentDecisions.length})
            </button>

            <button
              onClick={() => setHodTab('conflicts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                hodTab === 'conflicts'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              Relevant Conflicts & Room Contention
            </button>
          </div>

          {/* HOD Tab 1: Pending Department Approvals */}
          {hodTab === 'pending' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Actionable Department Authorizations ({filterList(hodData.pendingApprovals).length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-capacity proposals (≥100 participants) verified by faculty and awaiting your executive approval.
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading department approvals...</div>
              ) : filterList(hodData.pendingApprovals).length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Pending Department Authorizations</p>
                  <p className="text-xs text-slate-400">All high-capacity department events have been authorized.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filterList(hodData.pendingApprovals).map((evt) => (
                    <div key={evt._id} className="p-6 space-y-3.5 hover:bg-slate-50/60 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/70">{evt.requestNumber}</span>
                            <span className="text-slate-300">•</span>
                            <h4 className="font-extrabold text-slate-900 text-base">{evt.title}</h4>
                            <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                              {evt.expectedAttendance} Participants
                            </span>
                          </div>

                          <p className="text-slate-600 text-xs leading-relaxed">{evt.description}</p>

                          <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px] pt-1">
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
                            className="px-4 py-2 border border-slate-200/90 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-subtle"
                          >
                            Full Review →
                          </Link>
                          <button
                            onClick={() => {
                              setActiveEvent(evt);
                              setDecision('APPROVED');
                              setReason('Departmental authorization granted. Venue capacity and faculty endorsement verified.');
                              setModalError(null);
                            }}
                            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 transition-all cursor-pointer active:scale-95"
                          >
                            Authorize Event
                          </button>
                        </div>
                      </div>

                      {/* Display Faculty Recommendation Note */}
                      {evt.facultyDecision && (
                        <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200/80 text-xs space-y-1 shadow-subtle">
                          <div className="flex items-center space-x-2 text-teal-900 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                            <span>Faculty Mentor Endorsement ({evt.facultyDecision.reviewer?.name}):</span>
                          </div>
                          <p className="text-slate-700 italic">"{evt.facultyDecision.reason}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HOD Tab 2: Department Schedule & Upcoming */}
          {hodTab === 'schedule' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm">Department Schedule ({hodData.upcomingEvents.length})</h3>
              {hodData.upcomingEvents.length === 0 ? (
                <p className="text-slate-400 italic">No confirmed events currently on the department calendar.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hodData.upcomingEvents.map((evt) => (
                    <div key={evt._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{evt.title}</span>
                        <StatusBadge status={evt.status} size="sm" />
                      </div>
                      <p className="text-slate-500 text-[11px]">{evt.organizingClub?.name} • Venue: {evt.venue?.name}</p>
                      <p className="text-teal-800 font-bold text-[11px]">
                        {new Date(evt.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <Link to={`/approvals/${evt._id}`} className="text-xs text-teal-700 font-bold hover:underline block pt-1">
                        View Complete Specs →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HOD Tab 3: Waiting for Faculty (Staged) */}
          {hodTab === 'waiting' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Proposals Pending Faculty Sign-off ({hodData.stagedRequests.length})
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  These events will require your departmental authorization once the sponsoring faculty mentor signs off.
                </p>
              </div>

              {hodData.stagedRequests.length === 0 ? (
                <p className="text-slate-400 italic">No staged proposals waiting for faculty endorsement.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {hodData.stagedRequests.map((evt) => (
                    <div key={evt._id} className="py-3.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-mono text-slate-400 text-[10px] font-bold block">{evt.requestNumber}</span>
                        <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                        <p className="text-slate-500 text-[11px]">
                          Club: {evt.organizingClub?.name} • Assigned Faculty Mentor: <strong>{evt.facultyCoordinator?.name}</strong>
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                        Staged (Inactive until faculty approval)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HOD Tab 4: Recent Decisions */}
          {hodTab === 'decisions' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm">Recent Departmental Decisions ({hodData.recentDecisions.length})</h3>
              {hodData.recentDecisions.length === 0 ? (
                <p className="text-slate-400 italic">No recent decisions found.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {hodData.recentDecisions.map((dec) => (
                    <div key={dec._id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={dec.decision} size="sm" />
                          <span className="font-bold text-slate-900 text-sm">{dec.event?.title}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">Audit Explanation: "{dec.reason}"</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(dec.createdAt).toLocaleString()}</span>
                      </div>
                      {dec.event?._id && (
                        <Link to={`/approvals/${dec.event._id}`} className="text-teal-700 font-bold hover:underline">
                          View Details →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HOD Tab 5: Resource Conflicts & Room Contention */}
          {hodTab === 'conflicts' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm">Active Room & Resource Allocation Radar</h3>
              <p className="text-slate-500 text-xs">
                Real-time visibility into all upcoming confirmed reservations across department venues to prevent scheduling bottlenecks.
              </p>

              {hodData.activeReservations.length === 0 ? (
                <p className="text-slate-400 italic">No reservations currently active.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {hodData.activeReservations.map((resv) => (
                    <div key={resv._id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{resv.resource?.name}</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Event: {resv.event?.title} ({resv.event?.requestNumber})
                        </p>
                        <span className="text-[10px] text-teal-700 font-mono mt-0.5 block">
                          {new Date(resv.startDate).toLocaleString()} → {new Date(resv.endDate).toLocaleTimeString()}
                        </span>
                      </div>
                      <StatusBadge status={resv.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Review Modal */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-lg p-6 space-y-5 text-xs animate-scale-in">
            <div className="border-b border-slate-100 pb-3.5">
              <span className="font-mono text-[10px] text-teal-700 font-bold block mb-1">
                {activeEvent.requestNumber} • Stage: {activeEvent.currentApprovalStage}
              </span>
              <h2 className="text-lg font-black text-slate-900">{activeEvent.title}</h2>
              <p className="text-slate-500 text-xs mt-0.5">Organized by {activeEvent.organizingClub?.name}</p>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200/90 text-rose-700 rounded-2xl font-medium shadow-subtle">
                {modalError}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Review Decision *</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVED')}
                    className={`py-2.5 px-3 rounded-2xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-subtle ${
                      decision === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('CHANGES_REQUESTED')}
                    className={`py-2.5 px-3 rounded-2xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-subtle ${
                      decision === 'CHANGES_REQUESTED'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`py-2.5 px-3 rounded-2xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-subtle ${
                      decision === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/20'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Institutional Reason & Audit Explanation *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide an auditable reason for this decision..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all shadow-subtle"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setActiveEvent(null)}
                  className="px-4 py-2 border border-slate-200/90 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {submitting ? 'Recording...' : 'Submit Institutional Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
