import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  PlusCircle,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { EventRequest } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';

export const MyRequestsPage: React.FC = () => {
  const [events, setEvents] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [selectedStatus]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (search) params.search = search;

      const res = await api.getEvents(params);
      if (res.success) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const statuses = [
    { label: 'All Requests', value: 'ALL' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Waitlisted', value: 'WAITLISTED' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Event Requests</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track multi-stage institutional reviews, decision explanations, and handover schedules.
          </p>
        </div>

        <Link
          to="/student/new-request"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Event Request</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3.5">
        <form onSubmit={handleSearch} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, request ID (REQ-2026-XXXX), or keyword..."
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-subtle"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {statuses.map((st) => (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                selectedStatus === st.value
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading requests...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-700">No event requests found</h3>
            <p className="text-xs text-slate-400">Submit a combined booking request to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((evt) => (
              <Link
                key={evt._id}
                to={`/student/requests/${evt._id}`}
                className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs group"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70">
                      {evt.requestNumber}
                    </span>
                    <span className="text-slate-300">•</span>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
                      {evt.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {evt.eventType}
                    </span>
                    <span>•</span>
                    <span>Venue: {evt.venue?.name || 'External / Not specified'}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(evt.startDate).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span>{evt.expectedAttendance} Attendees</span>
                  </div>

                  {evt.currentApprovalStage && evt.status === 'UNDER_REVIEW' && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      Active Stage:{' '}
                      <span className="font-bold">
                        {evt.currentApprovalStage.replace(/_/g, ' ')}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                  <StatusBadge status={evt.status} />
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
