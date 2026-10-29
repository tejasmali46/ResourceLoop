import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowLeft,
  ShieldCheck,
  Repeat,
  XCircle,
  FileText,
  User as UserIcon,
  Sparkles,
  Edit3,
  Forward,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { EventRequest, Reservation, ApprovalDecision, HandoverRecord, ApprovalTask } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { useAuth } from '../../context/AuthContext.js';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventRequest | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [decisions, setDecisions] = useState<ApprovalDecision[]>([]);
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [tasks, setTasks] = useState<ApprovalTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Action Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'>('APPROVED');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Reassignment Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [targetFacultyId, setTargetFacultyId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  // Edit / Resubmit Modal State
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAttendance, setEditAttendance] = useState(100);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [resubmitSubmitting, setResubmitSubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState<string | null>(null);

  // Cancellation Modal State
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchEventDetails(id);
  }, [id]);

  const fetchEventDetails = async (eventId: string) => {
    setLoading(true);
    try {
      const res = await api.getEventById(eventId);
      if (res.success) {
        setEvent(res.event);
        setReservations(res.reservations || []);
        setDecisions(res.decisions || []);
        setHandovers(res.handovers || []);
        setTasks(res.tasks || []);

        // Prepopulate edit fields for resubmission
        setEditTitle(res.event.title);
        setEditDesc(res.event.description);
        setEditAttendance(res.event.expectedAttendance);
        if (res.event.startDate) {
          setEditStartDate(new Date(res.event.startDate).toISOString().slice(0, 16));
        }
        if (res.event.endDate) {
          setEditEndDate(new Date(res.event.endDate).toISOString().slice(0, 16));
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
    if (!event) return;
    if (!reviewReason.trim()) {
      setReviewError('Please enter an institutional reason or review explanation.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await api.submitApprovalDecision({
        eventId: event._id,
        decision: reviewDecision,
        reason: reviewReason.trim(),
      });
      if (res.success) {
        setReviewModalOpen(false);
        setReviewReason('');
        setFeedbackMessage(`Decision "${reviewDecision}" persisted successfully!`);
        await fetchEventDetails(event._id);
        await refreshUser();
      }
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit decision.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleOpenReassign = async () => {
    try {
      const fRes = await api.getFaculty();
      if (fRes.success) {
        setFacultyList(fRes.faculty.filter((f: any) => f._id !== user?.id));
        if (fRes.faculty.length > 0) {
          setTargetFacultyId(fRes.faculty[0]._id);
        }
      }
      setReassignModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !targetFacultyId || !reassignReason.trim()) return;

    const activeTask = tasks.find(
      (t) => t.stage === event.currentApprovalStage && t.status === 'ACTIONABLE'
    );
    if (!activeTask) {
      setReviewError('No active task found for reassignment');
      return;
    }

    setReassignSubmitting(true);
    try {
      const res = await api.forwardOrReassignTask({
        taskId: activeTask._id,
        toUserId: targetFacultyId,
        reason: reassignReason.trim(),
      });
      if (res.success) {
        setReassignModalOpen(false);
        setFeedbackMessage('Task successfully reassigned to next reviewer.');
        await fetchEventDetails(event._id);
      }
    } catch (err: any) {
      alert(err.message || 'Reassignment failed');
    } finally {
      setReassignSubmitting(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setResubmitSubmitting(true);
    setResubmitError(null);
    try {
      const res = await api.resubmitEvent(event._id, {
        title: editTitle,
        description: editDesc,
        expectedAttendance: Number(editAttendance),
        startDate: new Date(editStartDate).toISOString(),
        endDate: new Date(editEndDate).toISOString(),
      });
      if (res.success) {
        setResubmitModalOpen(false);
        setFeedbackMessage('Event proposal resubmitted for faculty review!');
        await fetchEventDetails(event._id);
      }
    } catch (err: any) {
      setResubmitError(err.message || 'Failed to resubmit request.');
    } finally {
      setResubmitSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!event) return;
    setCancelling(true);
    try {
      const res = await api.cancelEvent(event._id, cancelReason || 'Cancelled by organizer');
      if (res.success) {
        setCancelModalOpen(false);
        setFeedbackMessage('Event request cancelled and capacity released.');
        await fetchEventDetails(event._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading event details, approval tasks, and audit trail...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-sm font-bold text-slate-700">Event request not found.</p>
        <Link to="/student/requests" className="text-xs text-teal-600 font-bold">
          ← Return to requests list
        </Link>
      </div>
    );
  }

  const organizerId = typeof event.organizer === 'object' ? (event.organizer as any)?._id : event.organizer;
  const isOwner = Boolean(user?.id && organizerId && user.id === organizerId);
  const userRoles = (user as any)?.roles || (user?.role ? [user.role] : []);
  const isAdmin = userRoles.includes('ADMIN');

  // Role permissions to review current stage
  const canFacultyReview =
    (userRoles.includes('FACULTY') || isAdmin) &&
    event.currentApprovalStage === 'FACULTY_REVIEW' &&
    event.status === 'UNDER_REVIEW' &&
    !isOwner;

  const canHodReview =
    (userRoles.includes('HOD') || isAdmin) &&
    event.currentApprovalStage === 'HOD_REVIEW' &&
    event.status === 'UNDER_REVIEW' &&
    !isOwner;

  const canManagerReview =
    (userRoles.includes('RESOURCE_MANAGER') || isAdmin) &&
    (event.currentApprovalStage === 'RESOURCE_MANAGER_REVIEW') &&
    (event.status === 'UNDER_REVIEW' || event.status === 'APPROVED_PENDING_RESOURCE_CONFIRMATION' || event.status === 'APPROVED_PENDING_CONFIRMATION') &&
    !isOwner;

  const isReviewerActionable = canFacultyReview || canHodReview || canManagerReview;

  const canCancel =
    (isOwner || isAdmin) &&
    event.status !== 'CANCELLED' &&
    event.status !== 'COMPLETED' &&
    event.status !== 'REJECTED';

  const canResubmit =
    (isOwner || isAdmin) &&
    event.status === 'CHANGES_REQUESTED';

  // Find latest faculty note if at HOD stage
  const facultyDecisionNote = decisions.find(
    (d) => d.stage === 'FACULTY_REVIEW' && d.decision === 'APPROVED'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200/90 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-subtle animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top Bar Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 border border-slate-200/90 bg-white rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-subtle"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/70">{event.requestNumber}</span>
              <StatusBadge status={event.status} size="sm" />
              <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-700 uppercase">
                {event.eventType}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">{event.title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {canResubmit && (
            <button
              onClick={() => setResubmitModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit & Resubmit Proposal</span>
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel Request
            </button>
          )}
        </div>
      </div>

      {/* Alert Banner: Changes Requested */}
      {event.status === 'CHANGES_REQUESTED' && (
        <div className="p-5 bg-amber-50 border border-amber-200/90 rounded-3xl space-y-2.5 shadow-subtle">
          <div className="flex items-center space-x-2 text-amber-800 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Changes Requested by Reviewer</span>
          </div>
          <p className="text-xs text-amber-900 bg-white/90 p-3.5 rounded-2xl border border-amber-200/80 font-medium leading-relaxed">
            "{event.changeNotes || 'Please adjust the event details or schedule and resubmit.'}"
          </p>
          {canResubmit && (
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] text-amber-700 font-semibold">
                You can edit the dates, attendance, or details directly and resubmit for faculty endorsement.
              </span>
              <button
                onClick={() => setResubmitModalOpen(true)}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
              >
                Open Editor →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ACTIONABLE REVIEWER PANEL (Only shown to authorized reviewers at current stage) */}
      {isReviewerActionable && (
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 p-6 rounded-3xl text-white shadow-elevated space-y-4 border border-teal-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-800/80 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-400/30 uppercase">
                  Action Required
                </span>
                <span className="text-xs text-teal-300 font-medium">
                  {canFacultyReview
                    ? 'Faculty Coordinator Endorsement Stage'
                    : canHodReview
                    ? 'HOD Departmental Authorization Stage'
                    : 'Resource Manager Confirmation Stage'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1">
                Your Review Decision is Required
              </h2>
            </div>

            {canFacultyReview && (
              <button
                onClick={handleOpenReassign}
                className="px-3 py-1.5 bg-teal-800/60 hover:bg-teal-700/60 border border-teal-400/40 rounded-xl text-xs font-bold text-teal-200 transition-colors flex items-center space-x-1.5 self-start cursor-pointer"
              >
                <Forward className="w-3.5 h-3.5" />
                <span>Forward / Reassign</span>
              </button>
            )}
          </div>

          {canHodReview && facultyDecisionNote && (
            <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 text-xs space-y-1">
              <span className="text-teal-300 font-bold uppercase text-[10px] block">
                Prior Faculty Coordinator Endorsement:
              </span>
              <p className="text-slate-200 italic font-medium">"{facultyDecisionNote.reason}"</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => {
                setReviewDecision('APPROVED');
                setReviewReason(
                  canFacultyReview
                    ? 'Event proposal verified. Academic objectives, club standing, and safety requirements met.'
                    : canHodReview
                    ? 'Departmental hosting sanctioned for the requested scale and schedule.'
                    : 'Resource availability and pool capacity verified. Confirming reservation allocation.'
                );
                setReviewModalOpen(true);
              }}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {canManagerReview
                  ? 'Confirm Resource Allocation'
                  : canHodReview
                  ? 'Authorize Departmental Event'
                  : 'Approve Proposal'}
              </span>
            </button>

            <button
              onClick={() => {
                setReviewDecision('CHANGES_REQUESTED');
                setReviewReason('');
                setReviewModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Request Changes</span>
            </button>

            <button
              onClick={() => {
                setReviewDecision('REJECTED');
                setReviewReason('');
                setReviewModalOpen(true);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Request</span>
            </button>
          </div>
        </div>
      )}

      {/* Multi-Stage Visualizer Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Multi-Stage Institutional Governance State</span>
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            Current Stage: <strong className="text-teal-700">{event.currentApprovalStage}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Stage 1: Faculty */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
              event.currentApprovalStage === 'FACULTY_REVIEW' && event.status === 'UNDER_REVIEW'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-subtle'
                : decisions.some((d) => d.stage === 'FACULTY_REVIEW' && d.decision === 'APPROVED')
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-slate-50 border-slate-200/80 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[10px]">Stage 1 • Academic Review</span>
              {decisions.some((d) => d.stage === 'FACULTY_REVIEW' && d.decision === 'APPROVED') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="font-bold text-slate-900 text-sm">Faculty Mentor</p>
            <p className="text-[11px] text-slate-500">
              Coordinator: {event.facultyCoordinator?.name || 'Assigned Faculty'}
            </p>
            {decisions.find((d) => d.stage === 'FACULTY_REVIEW') && (
              <p className="text-[10px] text-slate-600 font-medium italic pt-1 border-t border-slate-200/60">
                "{decisions.find((d) => d.stage === 'FACULTY_REVIEW')?.reason}"
              </p>
            )}
          </div>

          {/* Stage 2: HOD */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
              !event.requiresHodApproval
                ? 'bg-slate-50 border-slate-200/80 text-slate-400 opacity-60'
                : event.currentApprovalStage === 'HOD_REVIEW' && event.status === 'UNDER_REVIEW'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-subtle'
                : decisions.some((d) => d.stage === 'HOD_REVIEW' && d.decision === 'APPROVED')
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-slate-50 border-slate-200/80 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[10px]">Stage 2 • Departmental</span>
              {!event.requiresHodApproval ? (
                <span className="text-[10px] text-slate-400 font-bold bg-slate-200/50 px-2 py-0.5 rounded">
                  BYPASSED (&lt;100 ATTENDEES)
                </span>
              ) : decisions.some((d) => d.stage === 'HOD_REVIEW' && d.decision === 'APPROVED') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="font-bold text-slate-900 text-sm">HOD Authorization</p>
            <p className="text-[11px] text-slate-500">
              {event.requiresHodApproval
                ? `${event.department?.name || 'Department Head'}`
                : 'Standard quota rule applied'}
            </p>
            {decisions.find((d) => d.stage === 'HOD_REVIEW') && (
              <p className="text-[10px] text-slate-600 font-medium italic pt-1 border-t border-slate-200/60">
                "{decisions.find((d) => d.stage === 'HOD_REVIEW')?.reason}"
              </p>
            )}
          </div>

          {/* Stage 3: Resource Manager */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
              (event.currentApprovalStage === 'RESOURCE_MANAGER_REVIEW') &&
              (event.status === 'UNDER_REVIEW' || event.status === 'APPROVED_PENDING_RESOURCE_CONFIRMATION')
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-subtle'
                : event.status === 'CONFIRMED' || event.status === 'IN_PROGRESS' || event.status === 'COMPLETED'
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-slate-50 border-slate-200/80 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[10px]">Stage 3 • Operations</span>
              {event.status === 'CONFIRMED' || event.status === 'IN_PROGRESS' || event.status === 'COMPLETED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="font-bold text-slate-900 text-sm">Manager Dispatch</p>
            <p className="text-[11px] text-slate-500">
              Operational check & equipment release confirmation
            </p>
            {decisions.find((d) => d.stage === 'RESOURCE_MANAGER_REVIEW') && (
              <p className="text-[10px] text-slate-600 font-medium italic pt-1 border-t border-slate-200/60">
                "{decisions.find((d) => d.stage === 'RESOURCE_MANAGER_REVIEW')?.reason}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Details & Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Reservations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Specs Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
              <span>Event Overview & Institutional Logistics</span>
              <span className="text-[11px] text-teal-700 font-mono font-bold bg-teal-50 px-2 py-0.5 rounded">{event.requestNumber}</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Organizing Club:</span>
                <span className="font-bold text-slate-800">{event.organizingClub?.name}</span>
                <span className="text-[10px] text-slate-400 block font-mono">Code: {event.organizingClub?.code}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Department Scope:</span>
                <span className="font-bold text-slate-800">{event.department?.name || 'Institution-wide'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Start Time:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(event.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">End Time:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(event.endDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Expected Attendance:</span>
                <span className="font-bold text-slate-800">{event.expectedAttendance} attendees</span>
                <span className="text-[10px] text-slate-400 block">
                  {event.expectedAttendance >= 100 ? 'HOD Authorization Required' : 'Standard Faculty Approval'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Setup / Cleanup Buffers:</span>
                <span className="font-semibold text-slate-800">
                  +{event.setupMinutes}m setup / +{event.cleanupMinutes}m teardown
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Description & Objective:</span>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                {event.description}
              </p>
            </div>

            {event.purpose && (
              <div>
                <span className="text-slate-400 block mb-1">Stated Purpose:</span>
                <p className="text-slate-700 font-medium">{event.purpose}</p>
              </div>
            )}
          </div>

          {/* Linked Reservations List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
              <span>Linked Resource Reservations ({reservations.length})</span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                Deterministic Capacity Verified
              </span>
            </h3>

            <div className="divide-y divide-slate-100">
              {reservations.map((resv) => (
                <div key={resv._id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{resv.resource?.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                        {resv.resource?.code}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      {resv.resource?.location || 'Central Campus'} • Requested: <strong>{resv.quantity} unit(s)</strong> • Category: {resv.resource?.category}
                    </p>
                  </div>
                  <StatusBadge status={resv.status} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Handover & Condition Records (if checked out or returned) */}
          {handovers.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                <Repeat className="w-4 h-4 text-teal-600" />
                <span>Physical Custody & Return Condition Receipts</span>
              </h3>

              <div className="space-y-3">
                {handovers.map((h) => (
                  <div key={h._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{h.resource?.name}</span>
                      <StatusBadge status={h.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span>Initial Condition: </span>
                        <StatusBadge status={h.initialCondition} size="sm" />
                      </div>
                      <div>
                        <span>Checkout Time: </span>
                        <strong>{new Date(h.checkoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                      </div>
                      {h.finalCondition && (
                        <div>
                          <span>Return Condition: </span>
                          <StatusBadge status={h.finalCondition} size="sm" />
                        </div>
                      )}
                      {h.returnTime && (
                        <div>
                          <span>Return Time: </span>
                          <strong>{new Date(h.returnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                        </div>
                      )}
                    </div>
                    {h.initialNotes && (
                      <p className="text-[11px] text-slate-500 italic">Checkout Notes: {h.initialNotes}</p>
                    )}
                    {h.finalNotes && (
                      <p className="text-[11px] text-slate-500 italic">Return Notes: {h.finalNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Timeline, Organizer Info & Next Steps */}
        <div className="space-y-6">
          {/* Organizer Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-3 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-teal-600" />
              <span>Student Organizer Details</span>
            </h3>

            <div className="space-y-2.5 text-slate-600 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Representative Name:</span>
                <span className="font-bold text-slate-900">{event.organizer?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Official Email:</span>
                <span className="font-medium text-slate-800">{event.organizer?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Student ID / PRN:</span>
                <span className="font-mono text-slate-800 font-semibold">{event.organizer?.studentOrEmpId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Sponsoring Faculty Mentor:</span>
                <span className="font-bold text-slate-800">{event.facultyCoordinator?.name}</span>
              </div>
            </div>
          </div>

          {/* Next Action Box */}
          <div className="bg-teal-50/70 p-5 rounded-3xl border border-teal-200/90 text-xs space-y-2 shadow-subtle">
            <h4 className="font-black text-teal-950 uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              <span>What Happens Next?</span>
            </h4>
            <p className="text-teal-900 font-medium leading-relaxed">
              {event.status === 'CONFIRMED'
                ? 'Your request has completed all institutional checks. Visit the AV/Lab Store on the event date to collect your equipment with your student ID.'
                : event.status === 'CHANGES_REQUESTED'
                ? 'The reviewer asked for adjustments. Please click "Edit & Resubmit Proposal" to update and send back.'
                : event.status === 'REJECTED'
                ? 'This event proposal was rejected. You may create a fresh request aligning with institutional guidelines.'
                : event.currentApprovalStage === 'FACULTY_REVIEW'
                ? `Currently waiting for Faculty Coordinator (${event.facultyCoordinator?.name || 'Mentor'}) to endorse academic alignment.`
                : event.currentApprovalStage === 'HOD_REVIEW'
                ? `Faculty endorsed! Now waiting for Department HOD (${event.department?.name}) to authorize departmental hosting.`
                : 'All academic reviews approved! Now awaiting Resource Manager operational inventory allocation.'}
            </p>
          </div>

          {/* Institutional Decision History Timeline */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Institutional Audit Trail ({decisions.length})</span>
            </h3>

            {decisions.length === 0 ? (
              <p className="text-slate-400 italic text-[11px]">
                No review decisions recorded yet. Request is currently at stage {event.currentApprovalStage}.
              </p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
                {decisions.map((dec, idx) => (
                  <div key={dec._id || idx} className="relative pl-8 space-y-1.5">
                    <span
                      className={`absolute left-2 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        dec.decision === 'APPROVED'
                          ? 'bg-emerald-500 ring-2 ring-emerald-200'
                          : dec.decision === 'CHANGES_REQUESTED'
                          ? 'bg-amber-500 ring-2 ring-amber-200'
                          : 'bg-rose-500 ring-2 ring-rose-200'
                      }`}
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{dec.stage.replace(/_/g, ' ')}</span>
                      <StatusBadge status={dec.decision} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Reviewed by: <strong>{dec.reviewer?.name || dec.reviewerRole}</strong> ({dec.reviewerRole})
                    </p>
                    <p className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-medium">
                      "{dec.reason}"
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(dec.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Decision Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-lg p-6 space-y-5 text-xs animate-scale-in">
            <div className="border-b border-slate-100 pb-3.5">
              <span className="font-mono text-[10px] text-teal-700 font-bold block mb-1">
                {event.requestNumber} • Stage: {event.currentApprovalStage}
              </span>
              <h2 className="text-lg font-black text-slate-900">Record Institutional Decision</h2>
              <p className="text-slate-500 text-xs mt-0.5">For "{event.title}" by {event.organizingClub?.name}</p>
            </div>

            {reviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200/90 text-rose-700 rounded-2xl font-medium shadow-subtle">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Decision *</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('APPROVED')}
                    className={`py-2.5 px-3 rounded-2xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-subtle ${
                      reviewDecision === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision('CHANGES_REQUESTED')}
                    className={`py-2.5 px-3 rounded-2xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-subtle ${
                      reviewDecision === 'CHANGES_REQUESTED'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision('REJECTED')}
                    className={`py-2.5 px-3 rounded-2xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-subtle ${
                      reviewDecision === 'REJECTED'
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
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Provide an auditable reason for this decision..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all shadow-subtle"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200/90 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {reviewSubmitting ? 'Recording Decision...' : 'Confirm Institutional Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit & Resubmit Modal */}
      {resubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-lg p-6 space-y-5 text-xs animate-scale-in">
            <div className="border-b border-slate-100 pb-3.5">
              <span className="font-mono text-[10px] text-amber-700 font-bold block mb-1">
                {event.requestNumber} • Editing Proposal
              </span>
              <h2 className="text-lg font-black text-slate-900">Update & Resubmit Event Request</h2>
              <p className="text-slate-500 text-xs mt-0.5">Make the requested adjustments to resume review.</p>
            </div>

            {resubmitError && (
              <div className="p-3 bg-rose-50 border border-rose-200/90 text-rose-700 rounded-2xl font-medium shadow-subtle">
                {resubmitError}
              </div>
            )}

            <form onSubmit={handleResubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Event Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Expected Attendance</label>
                <input
                  type="number"
                  min="1"
                  value={editAttendance}
                  onChange={(e) => setEditAttendance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Updated Description & Changes Made *</label>
                <textarea
                  rows={3}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Detail the changes made according to reviewer feedback..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all shadow-subtle"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setResubmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200/90 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resubmitSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {resubmitSubmitting ? 'Resubmitting...' : 'Resubmit Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forward / Reassign Modal */}
      {reassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-lg p-6 space-y-5 text-xs animate-scale-in">
            <div className="border-b border-slate-100 pb-3.5">
              <span className="font-mono text-[10px] text-teal-700 font-bold block mb-1">
                {event.requestNumber} • Reassignment
              </span>
              <h2 className="text-lg font-black text-slate-900">Forward or Reassign Review</h2>
              <p className="text-slate-500 text-xs mt-0.5">Transfer this approval stage to another authorized reviewer.</p>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Select New Reviewer *</label>
                <select
                  value={targetFacultyId}
                  onChange={(e) => setTargetFacultyId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all"
                >
                  {facultyList.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.department?.code || f.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Reason for Reassignment *</label>
                <textarea
                  rows={3}
                  required
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Specify reason for forwarding (e.g. subject matter expertise, on leave)..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all shadow-subtle"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200/90 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassignSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {reassignSubmitting ? 'Transferring...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-md p-6 space-y-4 text-xs animate-scale-in">
            <h3 className="text-base font-black text-rose-600">Cancel Event Request</h3>
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to cancel this event request? Any provisional reservations will be released.
            </p>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Reason for Cancellation</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Brief reason for cancellation..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-slate-200/90 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold cursor-pointer transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm shadow-rose-600/20 transition-all cursor-pointer active:scale-95"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
