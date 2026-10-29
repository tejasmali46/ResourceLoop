import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  ShieldCheck,
  Calendar,
  Repeat,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  Compass,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

export const LandingPage: React.FC<{ onOpenAssistant: () => void }> = ({ onOpenAssistant }) => {
  const { switchDemoRole, user } = useAuth();
  const navigate = useNavigate();

  const handleDemoSignIn = async (role: UserRole) => {
    await switchDemoRole(role);
    if (role === 'STUDENT') navigate('/student/dashboard');
    else if (role === 'FACULTY' || role === 'HOD') navigate('/approvals');
    else if (role === 'RESOURCE_MANAGER') navigate('/manager/dashboard');
    else if (role === 'ADMIN') navigate('/admin/analytics');
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-24 md:pb-28 bg-gradient-to-b from-teal-50/40 via-white to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200/90 text-teal-800 text-xs font-bold tracking-wide uppercase shadow-subtle animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>AI-Powered Institutional Resource Operating System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
            Share Smarter. Organize Better.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600">
              Keep Every Resource Accountable.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Eliminate scattered emails and WhatsApp permission chaos. A unified university platform connecting
            student clubs, faculty coordinators, HODs, and lab managers in one verified workflow.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              to={user ? '/student/new-request' : '/login'}
              className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-600/25 hover:shadow-teal-600/35 flex items-center space-x-2 transition-all duration-150 active:scale-95"
            >
              <span>{user ? 'Create Event Request' : 'Get Started Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={onOpenAssistant}
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-200/90 shadow-subtle hover:border-slate-300 flex items-center space-x-2 transition-all duration-150 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Try ResourceLoop Intelligence</span>
            </button>
          </div>

          {/* Interactive Role Demo Showcase for Hackathon Judges */}
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="p-6 bg-white rounded-3xl shadow-elevated border border-slate-200/80 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                    <Award className="w-4 h-4 text-teal-600" />
                    <span>Instant Evaluation Persona Selector (1-Click Test)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Test the complete platform end-to-end as any institutional stakeholder:
                  </p>
                </div>
                <span className="self-start sm:self-auto bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200/80">
                  Password-Free Quick Switch
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {(Object.keys(DEMO_ACCOUNTS) as UserRole[]).map((role) => {
                  const demo = DEMO_ACCOUNTS[role];
                  return (
                    <button
                      key={role}
                      onClick={() => handleDemoSignIn(role)}
                      className="p-3.5 bg-slate-50/70 hover:bg-teal-50/70 border border-slate-200/80 hover:border-teal-300/80 rounded-2xl text-left transition-all duration-150 group flex flex-col justify-between shadow-subtle hover:shadow-card cursor-pointer"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                          {role.replace('_', ' ')}
                        </span>
                        <p className="font-bold text-xs text-slate-900 group-hover:text-teal-950 leading-snug">
                          {demo.name}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 group-hover:text-teal-600 mt-3 font-semibold flex items-center space-x-1">
                        <span>Sign In</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Differentiator: Combined Event Request */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-2.5">
          <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest">
            Institutional Workflow Innovation
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900">
            One Event Request. Total Coordination.
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Unlike fragmented booking systems, ResourceLoop orchestrates venues, equipment pools, departmental
            signatures, and post-event condition audits into a single accountable lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-teal-300 hover:shadow-card-hover transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg">Multi-Resource Booking</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Book a seminar hall plus 2 projectors, 2 wireless microphones, and a camera kit in one atomic form.
              Real-time schedule overlap calculations prevent double-booking.
            </p>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-emerald-300 hover:shadow-card-hover transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg">Configurable Approval Routing</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Requests automatically route to Faculty Coordinators, Department HODs, and Lab In-charges. Reasons
              are recorded with auditable timestamps.
            </p>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-blue-300 hover:shadow-card-hover transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
              <Repeat className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg">Accountability & Return Audit</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Equipment handover inspects condition grade. Return records final condition. Any discrepancy or damage
              automatically triggers an institutional incident report.
            </p>
          </div>
        </div>
      </section>

      {/* Complete Sharing Lifecycle Steps */}
      <section className="bg-slate-900 text-white py-20 rounded-3xl mx-4 sm:mx-6 lg:mx-8 shadow-elevated">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <h3 className="text-teal-400 font-bold text-xs uppercase tracking-widest">
              End-to-End Governance
            </h3>
            <h2 className="text-3xl font-extrabold text-white">The 5-Stage Resource Lifecycle</h2>
            <p className="text-slate-400 text-sm">
              Verified by MongoDB persistent records, role authorization, and state machines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                title: 'Discovery & Plan',
                desc: 'Students search venues and equipment inventory with real operating hours and quota checks.',
              },
              {
                step: '02',
                title: 'Multi-Step Request',
                desc: 'Combines schedule, attendees, venue, multiple pooled resources, and faculty sponsor.',
              },
              {
                step: '03',
                title: 'Institutional Sign-off',
                desc: 'Faculty review, HOD departmental sign-off, and resource manager operational check.',
              },
              {
                step: '04',
                title: 'Handover & Condition',
                desc: 'Physical check-out records initial condition, accessories checklist, and timestamp.',
              },
              {
                step: '05',
                title: 'Return & Audit',
                desc: 'Post-event check-in records final condition; automated incident triggers if damaged.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 flex flex-col justify-between hover:border-teal-500/50 transition-colors"
              >
                <div>
                  <span className="text-teal-400 font-extrabold text-lg block">{item.step}</span>
                  <h4 className="font-bold text-white text-sm mt-1">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                </div>
                <div className="pt-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500 inline-block shadow-glow-teal" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-elevated">
          <div className="space-y-2.5 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ready to explore ResourceLoop?</h3>
            <p className="text-teal-100 text-sm leading-relaxed">
              Explore the live catalog, submit a test event request, experience multi-stage approvals, and test
              the condition reporting engine right now.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/resources"
              className="px-5 py-3 bg-white hover:bg-slate-50 text-teal-900 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              Browse Resource Catalog
            </Link>
            <Link
              to="/login"
              className="px-5 py-3 bg-teal-800/80 hover:bg-teal-800 text-white font-bold rounded-xl text-xs sm:text-sm border border-teal-400/40 transition-all active:scale-95"
            >
              Sign In Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
