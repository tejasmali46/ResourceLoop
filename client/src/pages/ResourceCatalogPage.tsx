import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Resource, ResourceCategory } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Link } from 'react-router-dom';

export const ResourceCatalogPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // Selected Resource Modal
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [testStart, setTestStart] = useState('');
  const [testEnd, setTestEnd] = useState('');
  const [testQuantity, setTestQuantity] = useState(1);
  const [availabilityResult, setAvailabilityResult] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedDepartment]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedDepartment) params.department = selectedDepartment;
      if (search) params.search = search;

      const [resData, deptData] = await Promise.all([
        api.getResources(params),
        api.getDepartments(),
      ]);

      if (resData.success) setResources(resData.resources);
      if (deptData.success) setDepartments(deptData.departments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const categories = [
    { label: 'All Resources', value: 'ALL' },
    { label: 'Seminar Halls & Venues', value: 'SEMINAR_HALL' },
    { label: 'Auditoriums', value: 'AUDITORIUM' },
    { label: 'Audio & Visual', value: 'AUDIO_VISUAL' },
    { label: 'Computing & Labs', value: 'COMPUTING' },
    { label: 'Photography & Media', value: 'PHOTOGRAPHY' },
    { label: 'Maker & Fabrication', value: 'MAKER_FABRICATION' },
    { label: 'Conference Rooms', value: 'CONFERENCE_ROOM' },
  ];

  const handleTestAvailability = async () => {
    if (!activeResource || !testStart || !testEnd) return;
    setCheckingAvailability(true);
    setAvailabilityResult(null);
    try {
      const res = await api.checkAvailability({
        resourceId: activeResource._id,
        startDate: new Date(testStart).toISOString(),
        endDate: new Date(testEnd).toISOString(),
        quantity: Number(testQuantity),
      });
      if (res.success) {
        setAvailabilityResult(res.data);
      }
    } catch (err: any) {
      setAvailabilityResult({ isAvailable: false, conflictReason: err.message || 'Check failed' });
    } finally {
      setCheckingAvailability(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Institutional Resource Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse verified venues, pooled AV gear, fabrication tools, and computing infrastructure.
          </p>
        </div>
        <Link
          to="/student/new-request"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all active:scale-95 shrink-0"
        >
          <span>Book Combined Event</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by resource name, model, code, or location..."
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-subtle transition-all"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-subtle transition-all"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCategory(c.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                selectedCategory === c.value
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading university catalog...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No resources matched your criteria</h3>
          <p className="text-xs text-slate-400">Try adjusting your category or department filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <div
              key={res._id}
              onClick={() => {
                setActiveResource(res);
                setAvailabilityResult(null);
              }}
              className="bg-white rounded-3xl border border-slate-200/80 hover:border-teal-300/80 shadow-card hover:shadow-card-hover transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block mb-1">
                      {res.category.replace('_', ' ')}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                      {res.name}
                    </h3>
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{res.code}</span>
                  </div>
                  <StatusBadge status={res.operationalStatus} size="sm" />
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {res.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{res.location}</span>
                  </div>

                  {res.capacity ? (
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Capacity: {res.capacity} attendees</span>
                    </div>
                  ) : null}

                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Operating Hours: {res.operatingHours.start} - {res.operatingHours.end}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-400">Inventory: </span>
                  <span className="font-bold text-slate-800">
                    {res.resourceType === 'POOLED'
                      ? `${res.totalQuantity} units pool`
                      : 'Individually Tracked'}
                  </span>
                </div>
                <span className="text-xs font-bold text-teal-700 group-hover:translate-x-0.5 transition-transform flex items-center">
                  Details & Check →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource Detail & Live Availability Checker Modal */}
      {activeResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevated border border-slate-200/90 w-full max-w-xl max-h-[88vh] overflow-y-auto p-6 space-y-6 animate-scale-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  {activeResource.category.replace('_', ' ')}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeResource.name}</h2>
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{activeResource.code}</span>
              </div>
              <button
                onClick={() => setActiveResource(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">{activeResource.description}</p>

              <div className="grid grid-cols-2 gap-3.5 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 shadow-subtle">
                <div>
                  <span className="text-slate-400 block mb-0.5">Location:</span>
                  <span className="font-semibold text-slate-800">{activeResource.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Managing Dept:</span>
                  <span className="font-semibold text-slate-800">{activeResource.department?.name || 'Central SAC'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Operating Hours:</span>
                  <span className="font-semibold text-slate-800">
                    {activeResource.operatingHours.start} - {activeResource.operatingHours.end}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Max Booking:</span>
                  <span className="font-semibold text-slate-800">{activeResource.maxBookingHours} hours</span>
                </div>
              </div>

              {/* Requirements & Badges */}
              <div className="flex flex-wrap gap-2">
                {activeResource.requiresHodApproval && (
                  <span className="bg-amber-50 text-amber-800 border border-amber-200/90 px-3 py-1 rounded-xl font-semibold flex items-center space-x-1.5 shadow-subtle">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Requires HOD Authorization</span>
                  </span>
                )}
                {activeResource.requiresTraining && (
                  <span className="bg-blue-50 text-blue-800 border border-blue-200/90 px-3 py-1 rounded-xl font-semibold flex items-center space-x-1.5 shadow-subtle">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Requires Certified Training</span>
                  </span>
                )}
                {activeResource.requiresSupervision && (
                  <span className="bg-purple-50 text-purple-800 border border-purple-200/90 px-3 py-1 rounded-xl font-semibold flex items-center space-x-1.5 shadow-subtle">
                    <Wrench className="w-3.5 h-3.5 text-purple-600" />
                    <span>Requires Lab In-charge Supervision</span>
                  </span>
                )}
              </div>

              {/* Accessories Checklist */}
              {activeResource.accessories?.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Included Handover Accessories:
                  </h4>
                  <ul className="grid grid-cols-2 gap-2">
                    {activeResource.accessories.map((acc, i) => (
                      <li key={i} className="flex items-center space-x-2 text-slate-600 bg-slate-50/70 p-2 rounded-xl border border-slate-200/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-medium">{acc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instant Slot Availability Checker */}
              <div className="p-4 bg-teal-50/60 border border-teal-200/90 rounded-2xl space-y-3 mt-4 shadow-subtle">
                <h4 className="font-bold text-teal-950 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  <span>Real-time Capacity & Overlap Checker</span>
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-teal-900 block mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={testStart}
                      onChange={(e) => setTestStart(e.target.value)}
                      className="w-full bg-white border border-teal-200/90 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-teal-900 block mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={testEnd}
                      onChange={(e) => setTestEnd(e.target.value)}
                      className="w-full bg-white border border-teal-200/90 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                {activeResource.resourceType === 'POOLED' && (
                  <div>
                    <label className="text-[10px] font-bold text-teal-900 block mb-1">Requested Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={activeResource.totalQuantity}
                      value={testQuantity}
                      onChange={(e) => setTestQuantity(Number(e.target.value))}
                      className="w-24 bg-white border border-teal-200/90 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                )}

                <button
                  onClick={handleTestAvailability}
                  disabled={checkingAvailability || !testStart || !testEnd}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-sm shadow-teal-600/20 cursor-pointer active:scale-95"
                >
                  {checkingAvailability ? 'Checking Live Database...' : 'Verify Slot Availability'}
                </button>

                {availabilityResult && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs shadow-subtle ${
                      availabilityResult.isAvailable
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                        : 'bg-rose-50 text-rose-950 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold mb-1">
                      {availabilityResult.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Slot Available for Booking! ({availabilityResult.availableQuantity} in stock)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Conflict: {availabilityResult.conflictReason}</span>
                        </>
                      )}
                    </div>

                    {availabilityResult.suggestedAlternativeSlots?.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-rose-200/80">
                        <span className="font-semibold block mb-1">Recommended Alternative Slots:</span>
                        {availabilityResult.suggestedAlternativeSlots.map((slot: any, idx: number) => (
                          <p key={idx} className="text-[11px] text-slate-700">
                            • {new Date(slot.startDate).toLocaleString()} ({slot.availableQuantity} available)
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => setActiveResource(null)}
                className="px-4 py-2 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <Link
                to={`/student/new-request?resourceId=${activeResource._id}`}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all active:scale-95"
              >
                Book in Event Wizard →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
