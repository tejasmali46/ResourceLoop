import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building,
  Mail,
  Phone,
  Edit2,
  RefreshCw,
  AlertTriangle,
  Lock,
  UserCheck,
  UserX,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { User, UserRole } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Provision Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    role: 'STUDENT' as UserRole,
    department: '',
    phone: '',
    studentOrEmpId: '',
    isActive: true,
    isVerified: true,
  });
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'STUDENT' as UserRole,
    department: '',
    phone: '',
    studentOrEmpId: '',
    isActive: true,
    isVerified: true,
  });
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter === 'ACTIVE') params.isActive = 'true';
      if (statusFilter === 'DISABLED') params.isActive = 'false';
      if (deptFilter !== 'ALL') params.department = deptFilter;

      const res = await api.getUsers(params);
      if (res.success) {
        setUsers(res.users);
        setTotalCount(res.total);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getDepartments().then((res) => {
      if (res.success) setDepartments(res.departments);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter, deptFilter]);

  const handleOpenEdit = (target: User) => {
    setEditingUser(target);
    setEditForm({
      name: target.name,
      role: target.role,
      department: (target.department as any)?._id || (target.department as any) || '',
      phone: target.phone || '',
      studentOrEmpId: target.studentOrEmpId || '',
      isActive: target.isActive !== false,
      isVerified: target.isVerified !== false,
    });
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    setEditError(null);

    const userId = editingUser._id || editingUser.id;

    try {
      const res = await api.updateUser(userId, {
        name: editForm.name,
        role: editForm.role,
        department: editForm.department || undefined,
        phone: editForm.phone,
        studentOrEmpId: editForm.studentOrEmpId,
        isActive: editForm.isActive,
        isVerified: editForm.isVerified,
      });

      if (res.success) {
        setEditingUser(null);
        setNotificationMsg({ type: 'success', text: `Successfully updated account for ${editForm.name}` });
        await fetchUsers();
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user record');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleActive = async (target: User) => {
    const userId = target._id || target.id;
    const newStatus = !target.isActive;

    try {
      const res = await api.updateUser(userId, { isActive: newStatus });
      if (res.success) {
        setNotificationMsg({
          type: 'success',
          text: `Account for ${target.name} has been ${newStatus ? 'activated' : 'deactivated'}.`,
        });
        await fetchUsers();
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Failed to update account status' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const res = await api.createUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        department: createForm.department || undefined,
        phone: createForm.phone || undefined,
        studentOrEmpId: createForm.studentOrEmpId || undefined,
        isActive: createForm.isActive,
        isVerified: createForm.isVerified,
      });

      if (res.success) {
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          email: '',
          password: 'Password@123',
          role: 'STUDENT',
          department: '',
          phone: '',
          studentOrEmpId: '',
          isActive: true,
          isVerified: true,
        });
        setNotificationMsg({ type: 'success', text: `Provisioned account for ${res.user.name} (${res.user.role})` });
        await fetchUsers();
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user account');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            <span>Admin</span>
          </span>
        );
      case 'HOD':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            <span>HOD</span>
          </span>
        );
      case 'FACULTY':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Faculty</span>
          </span>
        );
      case 'RESOURCE_MANAGER':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            <span>Manager</span>
          </span>
        );
      case 'STUDENT':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>Student</span>
          </span>
        );
    }
  };

  // Metrics counts
  const studentCount = users.filter((u) => u.role === 'STUDENT').length;
  const facultyCount = users.filter((u) => u.role === 'FACULTY' || u.role === 'HOD').length;
  const managerAdminCount = users.filter((u) => u.role === 'RESOURCE_MANAGER' || u.role === 'ADMIN').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/80">
              Institutional Administration
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Users className="w-7 h-7 text-teal-600" />
            <span>User Management & Access Control</span>
          </h1>
          <p className="text-xs text-slate-500">
            Provision user accounts, configure role permissions, assign departments, and maintain institutional security.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setCreateError(null);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-teal-600/20 transition-all duration-150 cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Account</span>
        </button>
      </div>

      {notificationMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{notificationMsg.text}</span>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-xs underline hover:opacity-75 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total In Database</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Students & Clubs</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{studentCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faculty & HODs</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{facultyCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Managers & Admins</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{managerAdminCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, institutional email, or PRN / Employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty Coordinator</option>
            <option value="HOD">Department HOD</option>
            <option value="RESOURCE_MANAGER">Resource Manager</option>
            <option value="ADMIN">Administrator</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DISABLED">Deactivated Only</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchUsers()}
            title="Refresh"
            className="p-2 border border-slate-200/80 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">User Identity</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Institutional ID</th>
                <th className="px-6 py-3.5">Verification</th>
                <th className="px-6 py-3.5">Account State</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Loading institutional user records...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No user accounts match the current query filters.
                  </td>
                </tr>
              ) : (
                users.map((target) => {
                  const targetId = target._id || target.id;
                  const isCurrent = currentUser?.id === targetId || (currentUser as any)?._id === targetId;

                  return (
                    <tr key={targetId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                            {target.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{target.name}</span>
                              {isCurrent && (
                                <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-300" />
                              <span>{target.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">{getRoleBadge(target.role)}</td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {target.department?.name ? (
                          <div className="flex items-center space-x-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{target.department.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">General Campus</span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                        {target.studentOrEmpId || '—'}
                      </td>

                      <td className="px-6 py-4">
                        {target.isVerified !== false ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {target.isActive !== false ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>Deactivated</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(target)}
                            className="px-2.5 py-1 text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-lg font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleToggleActive(target)}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                              target.isActive !== false
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-teal-700 hover:bg-teal-50'
                            }`}
                          >
                            {target.isActive !== false ? (
                              <>
                                <UserX className="w-3 h-3" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Provision Institutional User</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institutional Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@resourceloop.edu"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temporary Password *</label>
                  <input
                    type="text"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="STUDENT">Student / Club Rep</option>
                    <option value="FACULTY">Faculty Coordinator</option>
                    <option value="HOD">Department HOD</option>
                    <option value="RESOURCE_MANAGER">Resource Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="">None / General</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student / Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-2026-042"
                    value={createForm.studentOrEmpId}
                    onChange={(e) => setCreateForm({ ...createForm, studentOrEmpId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={createForm.isActive}
                    onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Active Account</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={createForm.isVerified}
                    onChange={(e) => setCreateForm({ ...createForm, isVerified: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Verified Account</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 cursor-pointer flex items-center space-x-1.5"
                >
                  <span>{createSubmitting ? 'Provisioning...' : 'Provision Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Modify User Account</h3>
                  <p className="text-[11px] text-slate-400">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editingUser.role === 'ADMIN' && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-xl flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Admin Safety Rule:</strong> The final active administrator cannot be deactivated or demoted. System checks this safety rule automatically.
                </span>
              </div>
            )}

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="STUDENT">Student / Club Rep</option>
                    <option value="FACULTY">Faculty Coordinator</option>
                    <option value="HOD">Department HOD</option>
                    <option value="RESOURCE_MANAGER">Resource Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="">None / General</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student / Employee ID</label>
                  <input
                    type="text"
                    value={editForm.studentOrEmpId}
                    onChange={(e) => setEditForm({ ...editForm, studentOrEmpId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Active Account</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editForm.isVerified}
                    onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Verified Account</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 cursor-pointer flex items-center space-x-1.5"
                >
                  <span>{editSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
