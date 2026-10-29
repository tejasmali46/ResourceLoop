import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers,
  Bell,
  Sparkles,
  User as UserIcon,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Package,
  FileText,
  ShieldCheck,
  BarChart3,
  AlertTriangle,
  History,
  Repeat,
  PlusCircle,
  Users,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext.js';
import { UserRole } from '../../types/index.js';
import { api } from '../../api/client.js';

interface NavbarProps {
  onOpenAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAssistant }) => {
  const { user, logout, switchDemoRole, unreadCount, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifs = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleToggleNotifs = () => {
    if (!showNotifs) {
      fetchNotifs();
    }
    setShowNotifs(!showNotifs);
    setShowRoleMenu(false);
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    await refreshUser();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleRoleChange = async (role: UserRole) => {
    setShowRoleMenu(false);
    await switchDemoRole(role);
    if (role === 'STUDENT') navigate('/student/dashboard');
    else if (role === 'FACULTY' || role === 'HOD') navigate('/approvals');
    else if (role === 'RESOURCE_MANAGER') navigate('/manager/dashboard');
    else if (role === 'ADMIN') navigate('/admin/analytics');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="glass-header sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 group-hover:shadow-teal-500/30 transition-all duration-200">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-teal-950 transition-colors">
                    Resource<span className="text-teal-600">Loop</span>
                  </span>
                  <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-teal-200/80 tracking-wider">
                    CAMPUS OS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block leading-none mt-0.5">
                  Verified Institutional Resource Orchestration
                </p>
              </div>
            </Link>

            {/* Nav Links based on Role */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200/80">
                {user.role === 'STUDENT' && (
                  <>
                    <Link
                      to="/student/dashboard"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive('/student/dashboard')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/resources"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive('/resources')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      Catalog
                    </Link>
                    <Link
                      to="/student/new-request"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1 ${
                        isActive('/student/new-request')
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-teal-700 bg-teal-50/60 hover:bg-teal-100/70'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Book Event</span>
                    </Link>
                    <Link
                      to="/student/requests"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive('/student/requests')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      My Requests
                    </Link>
                    <Link
                      to="/student/handover"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive('/student/handover')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      Check-in / Returns
                    </Link>
                  </>
                )}

                {(user.role === 'FACULTY' || user.role === 'HOD') && (
                  <>
                    <Link
                      to="/approvals"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
                        isActive('/approvals')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span>Pending Approvals</span>
                    </Link>
                    <Link
                      to="/resources"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive('/resources')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      Department Resources
                    </Link>
                  </>
                )}

                {user.role === 'RESOURCE_MANAGER' && (
                  <>
                    <Link
                      to="/manager/dashboard"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive('/manager/dashboard')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      Operations Hub
                    </Link>
                    <Link
                      to="/manager/queue"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
                        isActive('/manager/queue')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <Repeat className="w-3.5 h-3.5 text-teal-600" />
                      <span>Handover Queue</span>
                    </Link>
                    <Link
                      to="/resources"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive('/resources')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      Inventory & Maintenance
                    </Link>
                  </>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin/analytics"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
                        isActive('/admin/analytics')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Analytics</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
                        isActive('/admin/users')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      <span>User Management</span>
                    </Link>
                    <Link
                      to="/approvals"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive('/approvals')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      Approvals
                    </Link>
                    <Link
                      to="/admin/audit"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
                        isActive('/admin/audit')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <History className="w-3.5 h-3.5 text-teal-600" />
                      <span>Audit Logs</span>
                    </Link>
                    <Link
                      to="/resources"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive('/resources')
                          ? 'bg-teal-50 text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      All Resources
                    </Link>
                  </>
                )}

                <Link
                  to="/incidents"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
                    isActive('/incidents')
                      ? 'bg-rose-50 text-rose-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Incidents</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            {/* ResourceLoop Intelligence Assistant trigger */}
            <button
              onClick={onOpenAssistant}
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 hover:shadow-teal-600/30 transition-all duration-150 cursor-pointer"
              title="Launch ResourceLoop Intelligence Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-teal-200" />
              <span className="hidden sm:inline">AI Intelligence</span>
            </button>

            {user ? (
              <>
                {/* 1-Click Role Switcher for Hackathon Judges / Evaluators */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowRoleMenu(!showRoleMenu);
                      setShowNotifs(false);
                    }}
                    className="flex items-center space-x-2 px-2.5 py-1.5 bg-slate-100/80 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-medium border border-slate-200/80 transition-all duration-150"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                    <span className="font-semibold text-slate-800">{user.role.replace('_', ' ')}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {showRoleMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-elevated border border-slate-200/90 py-2 z-50 animate-scale-in">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                          1-Click Demo Persona Switcher
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Evaluate permissions and workflows seamlessly:</p>
                      </div>

                      <div className="p-1 space-y-0.5">
                        {(Object.keys(DEMO_ACCOUNTS) as UserRole[]).map((r) => {
                          const acc = DEMO_ACCOUNTS[r];
                          const isCurrent = user.role === r;
                          return (
                            <button
                              key={r}
                              onClick={() => handleRoleChange(r)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all duration-150 ${
                                isCurrent
                                  ? 'bg-teal-50 text-teal-900 font-semibold'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div>
                                <p className="font-semibold">{acc.label}</p>
                                <p className="text-[11px] text-slate-500">{acc.name}</p>
                              </div>
                              {isCurrent && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={handleToggleNotifs}
                    className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100/80 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-200/90 py-2 z-50 max-h-96 overflow-y-auto animate-scale-in">
                      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">In-App Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {loadingNotifs ? (
                        <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">No notifications yet.</div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={async () => {
                                if (!n.read) {
                                  await api.markNotificationRead(n._id);
                                  await refreshUser();
                                }
                                setShowNotifs(false);
                                if (n.actionLink) {
                                  navigate(n.actionLink);
                                }
                              }}
                              className={`px-4 py-3 hover:bg-slate-50 text-xs transition-colors cursor-pointer ${
                                !n.read ? 'bg-teal-50/40' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-900">{n.title}</p>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1.5 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Click to view →
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User initials & Sign out */}
                <div className="flex items-center pl-2 border-l border-slate-200/80 space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-800 border border-slate-300/70 flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name.charAt(0)}
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm shadow-teal-600/20 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
