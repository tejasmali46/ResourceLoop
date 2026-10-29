import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { api } from '../../api/client.js';

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
    </div>
  );
};
