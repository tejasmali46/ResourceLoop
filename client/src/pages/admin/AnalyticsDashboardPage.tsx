import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Layers,
  Calendar,
  Repeat,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Building,
  ArrowRight,
  Clock,
  UserCheck,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';

export const AnalyticsDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInstitutionAnalytics()
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Calculating institutional analytics from live database records...
      </div>
    );
  }

  // Format data for Recharts
  const statusData = Object.entries(data?.eventsByStatus || {}).map(([key, val]) => ({
    name: key.replace(/_/g, ' '),
    value: val,
  }));

  const categoryData = (data?.categoryCounts || []).map((c: any) => ({
    name: c.category.replace(/_/g, ' '),
    totalUnits: c.totalUnits,
    typesCount: c.count,
  }));

  const deptData = (data?.departmentDemand || []).map((d: any) => ({
    name: d.code,
    fullName: d.name,
    events: d.count,
  }));

  const STATUS_COLORS: Record<string, string> = {
    CONFIRMED: '#10b981',
    UNDER_REVIEW: '#f59e0b',
    COMPLETED: '#0d9488',
    CHANGES_REQUESTED: '#f97316',
    REJECTED: '#ef4444',
    WAITLISTED: '#8b5cf6',
    IN_PROGRESS: '#3b82f6',
  };

  const PIE_COLORS = ['#0d9488', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-teal-200/80">
          Institutional Administration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Campus Resource Utilization & Governance Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Real-time institutional metrics calculated from MongoDB records, reservations, and workflow states.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Resources</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{data?.totalResources || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Active campus venues & gear</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{data?.totalEvents || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Event requests coordinated</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Custody</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600">{data?.activeHandoversCount || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Equipment currently in use</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1 hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Departments & Clubs</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600">
            {data?.departmentsCount || 0} / {data?.clubsCount || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Departments & registered clubs</p>
        </div>
      </div>

      {/* Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Inventory Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Resource Inventory by Category</h3>
            <span className="text-xs text-slate-400 font-medium">Total Pooled Units</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="totalUnits" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Event Requests by Workflow Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Requests by Workflow Status</h3>
            <span className="text-xs text-slate-400 font-medium">State Machine Distribution</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {statusData.length === 0 ? (
              <p className="text-xs text-slate-400">No events recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={(entry) => `${entry.name} (${entry.value})`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name.replace(/ /g, '_')] || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Departmental Demand */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Resource Demand by Department</h3>
            <span className="text-xs text-slate-400 font-medium">Event Volume</span>
          </div>

          <div className="h-64">
            {deptData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-24">No departmental demand data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="events" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top 5 Most Frequently Booked Resources */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">High-Demand Campus Assets</h3>
            <span className="text-xs text-slate-400 font-medium">Top Bookings</span>
          </div>

          {data?.topRequestedResources?.length === 0 ? (
            <p className="text-slate-400 italic">No bookings recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data?.topRequestedResources?.map((item: any, idx: number) => (
                <div key={idx} className="py-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-xs">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {item.code} • Category: {item.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 text-sm">{item.totalBookings}</span>
                    <span className="text-[10px] text-slate-400 block">times reserved</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Institutional Event Proposals & Governance Queue */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Campus Governance & Event Requests Stream</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Live multi-tier institutional requests across faculty, HOD, and operational stages.
            </p>
          </div>
          <Link
            to="/approvals"
            className="text-teal-700 font-bold hover:text-teal-800 flex items-center space-x-1 text-xs"
          >
            <span>Open Multi-Tier Approvals Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!data?.recentEvents || data.recentEvents.length === 0 ? (
          <p className="text-slate-400 italic py-6 text-center">No event requests submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Club / Department</th>
                  <th className="py-3 px-4">Faculty Coordinator</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentEvents.map((evt: any) => (
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
                        {evt.organizingClub?.name || 'Club'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {evt.department?.code || 'Department'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium block">
                        {evt.facultyCoordinator?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{evt.currentApprovalStage?.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={evt.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/approvals/${evt._id}`}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl text-xs transition-all inline-flex items-center space-x-1"
                      >
                        <span>Inspect & Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
