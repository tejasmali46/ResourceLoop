import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  PlusCircle,
  Repeat,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { EventRequest } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';

export const StudentDashboardPage: React.FC<{ onOpenAssistant: () => void }> = ({ onOpenAssistant }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getEvents({ limit: 5 })])
      .then(([statsRes, eventsRes]) => {
        if (statsRes.success) setStats(statsRes.stats);
        if (eventsRes.success) setEvents(eventsRes.events);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeClub = user?.clubMemberships?.[0] as any;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-elevated">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-teal-500/25 text-teal-200 text-xs font-bold px-3 py-1 rounded-full border border-teal-400/30">
              Student Club Representative Portal
            </span>
            {activeClub && (
              <span className="text-teal-200 text-xs font-medium">
                • {activeClub.name} ({activeClub.code})
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Student Representative'}
          </h1>
          <p className="text-teal-100/80 text-xs sm:text-sm max-w-xl leading-relaxed">
            Coordinate venues, reserve equipment pools, monitor faculty endorsements, and manage check-ins.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/student/new-request"
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-teal-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4 text-teal-600" />
            <span>Book Combined Event</span>
          </Link>
          <button
            onClick={onOpenAssistant}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl border border-teal-400/30 shadow-sm transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>Ask AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">My Requests</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats?.myEventsCount || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Total submitted requests</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Under Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats?.pendingCount || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Awaiting faculty/HOD review</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{stats?.confirmedCount || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Ready for resource handover</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-teal-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Fair-Use Quota</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats?.confirmedCount || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 8 monthly</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">Priority Score: High</p>
        </div>
      </div>

      {/* Main Grid: Upcoming Bookings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Active Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Recent Event Requests & Bookings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live multi-stage approval tracking</p>
              </div>
              <Link
                to="/student/requests"
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1 transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading requests...</div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No event requests submitted yet.</p>
                <Link
                  to="/student/new-request"
                  className="inline-block text-xs font-bold text-teal-600 hover:text-teal-700"
                >
                  Create your first booking →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <Link
                    key={evt._id}
                    to={`/student/requests/${evt._id}`}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between text-xs group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {evt.requestNumber}
                        </span>
                        <span className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-xs sm:text-sm">
                          {evt.title}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                        <span>Venue: {evt.venue?.name || 'Self-arranged'}</span>
                        <span>•</span>
                        <span>
                          {new Date(evt.startDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span>{evt.expectedAttendance} attendees</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-4">
                      <StatusBadge status={evt.status} size="sm" />
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Shortcuts & Actions */}
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Action Shortcuts</h3>
            <div className="space-y-2.5">
              <Link
                to="/student/new-request"
                className="w-full p-3.5 bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/80 rounded-2xl text-left transition-all duration-150 flex items-center justify-between group shadow-subtle"
              >
                <div>
                  <p className="font-bold text-xs text-teal-950">Book Combined Event</p>
                  <p className="text-[10px] text-teal-700 mt-0.5">Multi-step unified booking wizard</p>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/resources"
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-left transition-all duration-150 flex items-center justify-between group shadow-subtle"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900">Explore Catalog</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Check live venue & gear availability</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/student/handover"
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-left transition-all duration-150 flex items-center justify-between group shadow-subtle"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900">Check-in & Returns</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">View handover receipts & reports</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/incidents"
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-left transition-all duration-150 flex items-center justify-between group shadow-subtle"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900">Report an Incident</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Report damage or missing gear</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* AI Helper Tip Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl text-white space-y-3 shadow-card">
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Smart Planning Assistant</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Not sure which hall fits 150 people or which AV kit to request? ResourceLoop Intelligence will analyze
              your event details and recommend the perfect combination.
            </p>
            <button
              onClick={onOpenAssistant}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center space-x-1 transition-colors cursor-pointer pt-1"
            >
              <span>Launch Assistant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
