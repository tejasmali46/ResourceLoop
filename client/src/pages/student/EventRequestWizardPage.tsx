import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Sparkles,
  Package,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Resource } from '../../types/index.js';

export const EventRequestWizardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [venues, setVenues] = useState<Resource[]>([]);
  const [equipmentList, setEquipmentList] = useState<Resource[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('HACKATHON');
  const [description, setDescription] = useState('');
  const [organizingClubId, setOrganizingClubId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [facultyCoordinatorId, setFacultyCoordinatorId] = useState('');
  const [purpose, setPurpose] = useState('');

  // Schedule
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [setupMinutes, setSetupMinutes] = useState(30);
  const [cleanupMinutes, setCleanupMinutes] = useState(30);
  const [expectedAttendance, setExpectedAttendance] = useState(100);

  // Venue
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');

  // Equipment requests: Array<{ resourceId: string, quantity: number }>
  const [selectedEquipment, setSelectedEquipment] = useState<Array<{ resourceId: string; quantity: number }>>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDepartments(),
      api.getClubs(),
      api.getFaculty(),
      api.getResources({ operationalStatus: 'AVAILABLE' }),
    ])
      .then(([dRes, cRes, fRes, rRes]) => {
        if (dRes.success) {
          setDepartments(dRes.departments);
          if (dRes.departments.length > 0) setDepartmentId(dRes.departments[0]._id);
        }
        if (cRes.success) {
          setClubs(cRes.clubs);
          if (cRes.clubs.length > 0) {
            setOrganizingClubId(cRes.clubs[0]._id);
            if (cRes.clubs[0].department) {
              setDepartmentId(cRes.clubs[0].department._id || cRes.clubs[0].department);
            }
            if (cRes.clubs[0].facultyCoordinator) {
              setFacultyCoordinatorId(cRes.clubs[0].facultyCoordinator._id || cRes.clubs[0].facultyCoordinator);
            }
          }
        }
        if (fRes.success) {
          setFacultyList(fRes.faculty);
          if (fRes.faculty.length > 0 && !facultyCoordinatorId) {
            setFacultyCoordinatorId(fRes.faculty[0]._id);
          }
        }
        if (rRes.success) {
          const v = rRes.resources.filter((r: Resource) =>
            ['SEMINAR_HALL', 'AUDITORIUM', 'CONFERENCE_ROOM', 'CLASSROOM', 'WORKSHOP'].includes(r.category)
          );
          const eq = rRes.resources.filter((r: Resource) =>
            ['AUDIO_VISUAL', 'COMPUTING', 'PHOTOGRAPHY', 'MAKER_FABRICATION', 'OTHER'].includes(r.category)
          );
          setVenues(v);
          setEquipmentList(eq);

          // If query param pre-selects a venue
          const preId = searchParams.get('resourceId');
          if (preId) {
            const isV = v.find((x: any) => x._id === preId);
            if (isV) setSelectedVenueId(preId);
            else {
              setSelectedEquipment([{ resourceId: preId, quantity: 1 }]);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Default dates (tomorrow 09:00 to 17:00)
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const startStr = `${tom.toISOString().split('T')[0]}T09:00`;
    const endStr = `${tom.toISOString().split('T')[0]}T17:00`;
    setStartDate(startStr);
    setEndDate(endStr);
  }, []);

  const handleClubChange = (clubId: string) => {
    setOrganizingClubId(clubId);
    const selectedClub = clubs.find((c) => c._id === clubId);
    if (selectedClub) {
      if (selectedClub.department) {
        setDepartmentId(selectedClub.department._id || selectedClub.department);
      }
      if (selectedClub.facultyCoordinator) {
        setFacultyCoordinatorId(selectedClub.facultyCoordinator._id || selectedClub.facultyCoordinator);
      }
    }
  };

  const handleAddEquipment = (resourceId: string) => {
    if (selectedEquipment.some((item) => item.resourceId === resourceId)) return;
    setSelectedEquipment([...selectedEquipment, { resourceId, quantity: 1 }]);
  };

  const handleRemoveEquipment = (resourceId: string) => {
    setSelectedEquipment(selectedEquipment.filter((item) => item.resourceId !== resourceId));
  };

  const handleQuantityChange = (resourceId: string, qty: number) => {
    setSelectedEquipment(
      selectedEquipment.map((item) =>
        item.resourceId === resourceId ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  const selectedVenue = venues.find((v) => v._id === selectedVenueId);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title,
        description: description || `${eventType} organized by student club.`,
        eventType,
        organizingClubId,
        departmentId: departmentId || departments[0]?._id,
        facultyCoordinatorId,
        venueId: selectedVenueId || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        setupMinutes: Number(setupMinutes),
        cleanupMinutes: Number(cleanupMinutes),
        expectedAttendance: Number(expectedAttendance),
        purpose: purpose || 'Educational / Club activity',
        equipmentRequests: selectedEquipment,
        clientTimezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata',
      };

      const res = await api.createEvent(payload);
      if (res.success) {
        navigate(`/student/requests/${res.event._id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!title) {
        setError('Please provide an event title');
        return;
      }
      if (!organizingClubId) {
        setError('Please select an organizing club');
        return;
      }
    }
    if (currentStep === 2) {
      if (!startDate || !endDate) {
        setError('Please specify valid event timings');
        return;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        setError('End time must be after start time');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const steps = [
    '1. Event Info',
    '2. Schedule',
    '3. Venue',
    '4. Equipment',
    '5. Permissions',
    '6. Review & Submit',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Wizard Header */}
      <div className="text-center space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80">
          Combined Booking System
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
          Multi-Resource Event Request Wizard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          One single application coordinates venue booking, equipment pools, and multi-tier approval routing.
        </p>
      </div>

      {/* Step Indicator Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between overflow-x-auto gap-2 scrollbar-none">
        {steps.map((st, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;
          return (
            <div
              key={idx}
              className={`flex items-center space-x-1.5 text-xs font-bold whitespace-nowrap px-2.5 py-1 rounded-xl transition-all ${
                isCurrent
                  ? 'bg-teal-50 text-teal-800'
                  : isDone
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {stepNum}
              </span>
              <span>{st}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200/90 text-rose-700 text-xs rounded-2xl font-medium flex items-center space-x-2 shadow-subtle animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-card space-y-6">
        {/* Step 1: Event Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Step 1: Event Information & Organization</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Event Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Apex Annual Innovation Hackathon 2026"
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Event Type *</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                >
                  <option value="HACKATHON">Hackathon</option>
                  <option value="WORKSHOP">Technical Workshop</option>
                  <option value="ORIENTATION">Club Orientation</option>
                  <option value="GUEST_LECTURE">Guest Lecture</option>
                  <option value="COMPETITION">Technical Competition</option>
                  <option value="CULTURAL">Cultural Event</option>
                  <option value="CLUB_MEETING">Internal Club Meeting</option>
                  <option value="PROJECT_DEMO">Project Demonstration</option>
                  <option value="OTHER">Other Activity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Organizing Club *</label>
                <select
                  value={organizingClubId}
                  onChange={(e) => handleClubChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                >
                  {clubs.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Department *</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Sponsoring Faculty Coordinator *</label>
                <select
                  value={facultyCoordinatorId}
                  onChange={(e) => setFacultyCoordinatorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                >
                  {facultyList.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.department?.code || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Event Description & Objective</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the scope, objectives, schedule, and safety guidelines..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Step 2: Schedule & Attendance */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Step 2: Event Timing & Attendance Scale</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Event Start Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Event End Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Setup Buffer (Minutes)</label>
                <input
                  type="number"
                  min={0}
                  step={15}
                  value={setupMinutes}
                  onChange={(e) => setSetupMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Cleanup Buffer (Minutes)</label>
                <input
                  type="number"
                  min={0}
                  step={15}
                  value={cleanupMinutes}
                  onChange={(e) => setCleanupMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Expected Attendance *</label>
                <input
                  type="number"
                  min={1}
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                />
              </div>
            </div>

            {expectedAttendance >= 100 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-900 text-xs flex items-center space-x-2.5 shadow-subtle">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Note:</strong> Expected attendance of {expectedAttendance} participants triggers mandatory
                  HOD Departmental authorization under institutional safety policies.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Venue Selection */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Step 3: Campus Venue Selection</h3>
            <p className="text-xs text-slate-500">
              Select an available lecture hall, seminar hall, or auditorium capable of accommodating {expectedAttendance} attendees.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {venues.map((venue) => {
                const isSelected = selectedVenueId === venue._id;
                const fitsAttendance = (venue.capacity || 0) >= expectedAttendance;
                return (
                  <div
                    key={venue._id}
                    onClick={() => setSelectedVenueId(venue._id)}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all space-y-2 shadow-subtle ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 shadow-md ring-2 ring-teal-500/20'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-card'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                          {venue.category.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{venue.name}</h4>
                        <span className="text-slate-400 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{venue.code}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-[11px] pt-1">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cap: {venue.capacity}</span>
                      </span>
                      <span>•</span>
                      <span>{venue.location}</span>
                      {venue.operatingHours && (
                        <>
                          <span>•</span>
                          <span className="text-teal-700 font-medium">Hours: {venue.operatingHours.start || '08:00'} – {venue.operatingHours.end || '21:00'}</span>
                        </>
                      )}
                    </div>

                    {!fitsAttendance && (
                      <p className="text-[10px] text-rose-600 font-semibold pt-1">
                        Warning: Capacity ({venue.capacity}) is less than expected attendance ({expectedAttendance}).
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Equipment Selection */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Step 4: Equipment Pools & Technical Gear</h3>
                <p className="text-xs text-slate-500">
                  Select AV projectors, wireless microphones, speaker setups, and photography kits.
                </p>
              </div>
            </div>

            {/* Selected equipment list */}
            {selectedEquipment.length > 0 && (
              <div className="p-4 bg-teal-50/70 border border-teal-200/90 rounded-2xl space-y-2.5 shadow-subtle">
                <h4 className="font-bold text-teal-950 text-xs uppercase tracking-wider">
                  Reserved Equipment Basket ({selectedEquipment.length} items):
                </h4>
                <div className="divide-y divide-teal-100">
                  {selectedEquipment.map((item) => {
                    const res = equipmentList.find((e) => e._id === item.resourceId);
                    if (!res) return null;
                    return (
                      <div key={item.resourceId} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{res.name}</p>
                          <p className="text-[10px] text-slate-500">Pool Inventory: {res.totalQuantity} total</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] text-slate-500 font-bold">Qty:</span>
                            <input
                              type="number"
                              min={1}
                              max={res.totalQuantity}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.resourceId, Number(e.target.value))}
                              className="w-16 bg-white border border-teal-200 rounded-xl px-2 py-1 text-center font-bold text-xs shadow-xs"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveEquipment(item.resourceId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Catalog of available equipment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {equipmentList.map((eq) => {
                const isAdded = selectedEquipment.some((item) => item.resourceId === eq._id);
                return (
                  <div
                    key={eq._id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between text-xs hover:border-slate-300 shadow-subtle transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                        {eq.category.replace('_', ' ')}
                      </span>
                      <h5 className="font-bold text-slate-900 mt-0.5">{eq.name}</h5>
                      <span className="text-[10px] text-slate-400">{eq.totalQuantity} units pool available</span>
                    </div>

                    <button
                      onClick={() => handleAddEquipment(eq._id)}
                      disabled={isAdded}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 shadow-xs'
                      }`}
                    >
                      {isAdded ? 'Added' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Institutional Permissions */}
        {currentStep === 5 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-base">Step 5: Permissions & Institutional Routing</h3>

            <div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3 shadow-subtle">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Configured Approval Path for this Request:
              </h4>

              <div className="space-y-2.5">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Faculty Coordinator Review</p>
                    <p className="text-slate-500">
                      Assigned to selected coordinator for academic endorsement and safety review.
                    </p>
                  </div>
                </div>

                {expectedAttendance >= 100 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">HOD Departmental Sanction (Mandatory)</p>
                      <p className="text-slate-500">
                        Triggered because expected attendance ({expectedAttendance}) meets or exceeds 100 participants.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs">
                    {expectedAttendance >= 100 ? '3' : '2'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Resource Manager Operational Check</p>
                    <p className="text-slate-500">
                      Dispatches final confirmation and coordinates physical checkout handover window.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Event Rationale & Permission Justification
              </label>
              <textarea
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="State the institutional benefit, target learning outcomes, or competition structure..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
              />
            </div>
          </div>
        )}

        {/* Step 6: Review & Submit */}
        {currentStep === 6 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-base">Step 6: Review & Final Submission</h3>

            <div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3.5 shadow-subtle">
              <div className="grid grid-cols-2 gap-3.5 pb-3.5 border-b border-slate-200/80">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-bold uppercase text-[10px]">Event Title:</span>
                  <span className="font-extrabold text-sm text-slate-900">{title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-bold uppercase text-[10px]">Event Type:</span>
                  <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/70">{eventType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-bold uppercase text-[10px]">Schedule:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(startDate).toLocaleString()} — {new Date(endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-bold uppercase text-[10px]">Attendance:</span>
                  <span className="font-bold text-slate-800">{expectedAttendance} attendees</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-bold uppercase text-[10px]">Selected Venue:</span>
                <p className="font-bold text-slate-900">
                  {selectedVenue ? `${selectedVenue.name} (${selectedVenue.location})` : 'No venue requested'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5 font-bold uppercase text-[10px]">
                  Selected Equipment ({selectedEquipment.length}):
                </span>
                {selectedEquipment.length === 0 ? (
                  <p className="text-slate-500 italic">No additional equipment requested.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedEquipment.map((item) => {
                      const eq = equipmentList.find((e) => e._id === item.resourceId);
                      return (
                        <li key={item.resourceId} className="flex items-center space-x-2 text-slate-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>
                            {eq?.name || 'Equipment'} — Qty: {item.quantity}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl text-emerald-900 text-xs flex items-center space-x-2.5 shadow-subtle">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Fair-Use Quota Verified:</strong> Your club has active allowance for this event. Submitting
                will record linked reservations and notify your Faculty Coordinator immediately.
              </span>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Submitting Request...' : 'Confirm & Submit Event Request'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
