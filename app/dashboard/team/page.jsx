'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Store,
  Clock,
  Key,
  Edit3,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Building,
  Coffee,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { REGISTERED_CAFES } from '@/services/seedData';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { deleteCafeAccountWithPassword } from '@/services/authService';
import PagePurposeBanner from '@/components/PagePurposeBanner';

export default function TeamPage() {
  const router = useRouter();
  const {
    staffMembers = [],
    openAddStaff,
    openEditStaff,
    deleteStaffMember,
    toggleStaffStatus,
    role: currentRole,
    currentUser,
  } = useDashboard();

  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [visiblePins, setVisiblePins] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isAdmin = currentUser?.role === 'admin' && !currentUser?.isStaff;

  const handleOpenDeleteModal = () => {
    setAdminPassword('');
    setShowAdminPassword(false);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteAccount = async (e) => {
    if (e) e.preventDefault();
    if (!adminPassword.trim()) {
      setDeleteError('Please enter your Admin account password to authorize deletion.');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError('');
      await deleteCafeAccountWithPassword(adminPassword, currentUser?.uid);
      toast.success('Café store account and records wiped successfully', 'Account Deleted');
      setIsDeleteModalOpen(false);
      router.push('/login');
    } catch (err) {
      console.error(err);
      const errMsg = err.message || 'Incorrect Admin password. Deletion cancelled.';
      setDeleteError(errMsg);
      toast.error(errMsg, 'Authentication Failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePinVisibility = (id) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredStaff = staffMembers.filter((staff) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      staff.name.toLowerCase().includes(q) ||
      staff.email.toLowerCase().includes(q) ||
      (staff.phone && staff.phone.includes(q)) ||
      staff.role.toLowerCase().includes(q);

    const matchesRole = selectedRoleFilter === 'ALL' || staff.role === selectedRoleFilter;
    const matchesBranch = selectedBranchFilter === 'ALL' || staff.branch === selectedBranchFilter;

    return matchesSearch && matchesRole && matchesBranch;
  });

  const activeStaffCount = staffMembers.filter((s) => s.status === 'ACTIVE').length;
  const baristaCount = staffMembers.filter((s) => s.role === 'barista' || s.role === 'head_barista').length;
  const adminCount = staffMembers.filter((s) => s.role === 'admin' || s.role === 'manager').length;
  const auditorCount = staffMembers.filter((s) => s.role === 'auditor').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight font-sans">
              Staff & PINs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-caramel-100 dark:bg-caramel-950/60 text-caramel-800 dark:text-caramel-300 border border-caramel-200 dark:border-caramel-800">
              {staffMembers.length} Staff Member{staffMembers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 mt-1">
            Manage barista and manager accounts, assign 4-digit POS access PINs, configure role permissions, and track shift schedules.
          </p>
        </div>

        {!currentUser?.isStaff ? (
          <button
            onClick={openAddStaff}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Staff Member</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-200">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Staff Directory (Managed by Admin)</span>
          </div>
        )}
      </div>

      {/* Prominent Page Purpose Banner */}
      <PagePurposeBanner
        purpose="Administrative team & floor access control. Only authorized Administrators can invite staff, grant managerial vs floor-only permissions, and distribute 4-digit quick-unlock PINs for café POS tablets."
        badgeText="Staff & Permissions Purpose"
        accentColor="caramel"
        primaryAction={
          !currentUser?.isStaff
            ? {
                label: "+ Add Staff Member",
                onClick: openAddStaff,
              }
            : null
        }
        actions={[
          {
            title: "Admin Role Allocation",
            desc: "Assign distinct roles: Store Admin, Assistant Manager, Head Barista, Floor Barista, or COGS Auditor.",
          },
          {
            title: "4-Digit Floor PINs",
            desc: "Issue secure PIN codes for staff to instantly authenticate on bar tablets without sharing master passwords.",
          },
          {
            title: "Branch & Shift Rostering",
            desc: "Assign team members to specific café branch locations and morning/evening operational shift rosters.",
          },
          {
            title: "Status & Access Revocation",
            desc: "Instantly toggle staff status (Active, On Leave, Suspended) to manage access rights immediately.",
          },
        ]}
      />

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-espresso-900/40 border border-cafe-200 dark:border-espresso-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-espresso-500 dark:text-cafe-400">
              Active On Floor
            </p>
            <p className="text-lg font-extrabold text-espresso-950 dark:text-cafe-50">
              {activeStaffCount} / {staffMembers.length} Staff
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-espresso-900/40 border border-cafe-200 dark:border-espresso-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center border border-caramel-200 dark:border-caramel-800/50">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-espresso-500 dark:text-cafe-400">
              Shift Baristas
            </p>
            <p className="text-lg font-extrabold text-espresso-950 dark:text-cafe-50">
              {baristaCount} Baristas
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-espresso-900/40 border border-cafe-200 dark:border-espresso-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-200 dark:border-blue-800/50">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-espresso-500 dark:text-cafe-400">
              Managers & Admins
            </p>
            <p className="text-lg font-extrabold text-espresso-950 dark:text-cafe-50">
              {adminCount} Admins
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-espresso-900/40 border border-cafe-200 dark:border-espresso-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-200 dark:border-purple-800/50">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-espresso-500 dark:text-cafe-400">
              Assigned Locations
            </p>
            <p className="text-lg font-extrabold text-espresso-950 dark:text-cafe-50">
              {REGISTERED_CAFES.length} Branches
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, email, phone, or role..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-white dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-2xl text-espresso-950 dark:text-cafe-50 outline-none focus:ring-2 focus:ring-caramel-500 shadow-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-white dark:bg-espresso-800 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-800 dark:text-cafe-100 outline-none shadow-sm"
          >
            <option value="ALL">All Roles</option>
            <option value="admin">Store Admin & General Manager</option>
            <option value="manager">Assistant Manager & Inventory Lead</option>
            <option value="head_barista">Head Barista & Shift Lead</option>
            <option value="barista">Shift Barista (Floor POS)</option>
            <option value="auditor">Inventory & COGS Auditor</option>
          </select>

          {/* Branch Filter */}
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-white dark:bg-espresso-800 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-800 dark:text-cafe-100 outline-none shadow-sm"
          >
            <option value="ALL">All Branches</option>
            <option value="All Branches (Network)">Network Wide</option>
            {REGISTERED_CAFES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name.split(' - ')[1] || c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Grid Cards */}
      {filteredStaff.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-espresso-900/30 rounded-3xl border border-cafe-200 dark:border-espresso-800 space-y-3">
          <Users className="w-12 h-12 text-espresso-300 mx-auto" />
          <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
            No team members found
          </h3>
          <p className="text-xs text-espresso-500 max-w-sm mx-auto">
            {searchQuery ? `No staff match "${searchQuery}".` : 'Invite your first café barista or manager.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredStaff.map((staff) => {
            const isPinVisible = visiblePins[staff.id];
            const isAdmin = staff.role === 'admin';
            const isManager = staff.role === 'manager';
            const isHead = staff.role === 'head_barista';
            const isBarista = staff.role === 'barista';
            const isAuditor = staff.role === 'auditor';

            return (
              <motion.div
                key={staff.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-espresso-900/50 rounded-3xl border border-cafe-200 dark:border-espresso-800 shadow-cafe-sm overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Top Row: Avatar, Name & Role Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-sm text-white shadow-sm shrink-0 ${
                        isAdmin
                          ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                          : isManager
                          ? 'bg-gradient-to-br from-blue-600 to-blue-800'
                          : isHead
                          ? 'bg-gradient-to-br from-caramel-600 to-caramel-800'
                          : isBarista
                          ? 'bg-gradient-to-br from-emerald-600 to-emerald-800'
                          : 'bg-gradient-to-br from-purple-600 to-purple-800'
                      }`}>
                        {staff.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50 truncate">
                            {staff.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isAdmin
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                              : isManager
                              ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
                              : isHead
                              ? 'bg-caramel-100 text-caramel-900 dark:bg-caramel-950 dark:text-caramel-300 border-caramel-300'
                              : isBarista
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                              : 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border-purple-300'
                          }`}>
                            {staff.roleLabel || staff.role}
                          </span>
                        </div>

                        <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-0.5 truncate">
                          {staff.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!currentUser?.isStaff && (
                        <>
                          <button
                            onClick={() => openEditStaff(staff)}
                            className="p-1.5 rounded-lg text-espresso-400 hover:text-caramel-600 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
                            title="Edit Staff Member & Reassign Role"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove staff account for ${staff.name}?`)) {
                                deleteStaffMember(staff.id, staff.name);
                              }
                            }}
                            className="p-1.5 rounded-lg text-espresso-400 hover:text-red-600 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
                            title="Delete Staff Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Branch & Shift Pills */}
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <div className="px-2.5 py-1 rounded-xl bg-cafe-100 dark:bg-espresso-800/80 text-espresso-800 dark:text-cafe-200 border border-cafe-200 dark:border-espresso-700 flex items-center gap-1.5 font-medium truncate max-w-full">
                      <Store className="w-3 h-3 text-caramel-600 shrink-0" />
                      <span className="truncate">{staff.branch || 'Main Flagship Branch'}</span>
                    </div>

                    <div className="px-2.5 py-1 rounded-xl bg-cafe-100 dark:bg-espresso-800/80 text-espresso-800 dark:text-cafe-200 border border-cafe-200 dark:border-espresso-700 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{staff.shift || 'Morning Shift'}</span>
                    </div>
                  </div>

                  {/* Contact Info & Access PIN */}
                  <div className="p-3 rounded-2xl bg-cafe-50/80 dark:bg-espresso-900/70 border border-cafe-200/70 dark:border-espresso-800 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      {staff.phone && (
                        <a href={`tel:${staff.phone}`} className="flex items-center gap-1 font-mono text-espresso-600 dark:text-cafe-400 hover:text-caramel-600">
                          <Phone className="w-3 h-3 text-caramel-600" />
                          <span>{staff.phone}</span>
                        </a>
                      )}
                      <p className="text-[10px] text-espresso-400">
                        Joined: {staff.joinedDate || '2025'}
                      </p>
                    </div>

                    {/* Access PIN Card */}
                    <div className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-white dark:bg-espresso-800 border border-cafe-200 dark:border-espresso-700 font-mono text-xs">
                      <Key className="w-3.5 h-3.5 text-caramel-600" />
                      <span className="font-bold text-espresso-950 dark:text-cafe-50">
                        {isPinVisible ? staff.pin || '1234' : '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePinVisibility(staff.id)}
                        className="text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200"
                        title={isPinVisible ? 'Hide PIN' : 'Show PIN'}
                      >
                        {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3.5 bg-cafe-50/90 dark:bg-espresso-950/60 border-t border-cafe-200 dark:border-espresso-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      staff.status === 'ACTIVE'
                        ? 'bg-emerald-500 animate-pulse'
                        : staff.status === 'ON_LEAVE'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`} />
                    <span className="text-[11px] font-bold text-espresso-700 dark:text-cafe-300">
                      {staff.status === 'ACTIVE' ? 'Active On Floor' : staff.status === 'ON_LEAVE' ? 'On Leave' : 'Suspended'}
                    </span>
                  </div>

                  {currentRole !== 'barista' && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextStatus = staff.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                        toggleStaffStatus(staff.id, nextStatus, staff.name);
                      }}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                        staff.status === 'ACTIVE'
                          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/60'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                      }`}
                    >
                      {staff.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Role Permissions Reference Section */}
      {isAdmin ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-espresso-900/40 border border-cafe-200 dark:border-espresso-800 shadow-sm space-y-4">
          <div className="border-b border-cafe-100 dark:border-espresso-800 pb-3">
            <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-caramel-600" />
              <span>Café Role & Permission Matrix Reference</span>
            </h3>
            <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-0.5">
              Overview of access privileges across floor operations, inventory, and procurement.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cafe-200 dark:border-espresso-800 text-espresso-500 dark:text-cafe-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 pr-4">Role Title</th>
                  <th className="py-2.5 px-3">Inventory Stock</th>
                  <th className="py-2.5 px-3">Suppliers & Price Books</th>
                  <th className="py-2.5 px-3">Purchase Orders</th>
                  <th className="py-2.5 px-3">Financials & COGS</th>
                  <th className="py-2.5 pl-3">Staff Mgmt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-100 dark:divide-espresso-800/60 font-medium">
                <tr>
                  <td className="py-3 pr-4 font-bold text-espresso-950 dark:text-cafe-50">
                    👑 Store Admin & General Manager
                  </td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Full CRUD</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Full Control</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Issue & Receive</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Full Access</td>
                  <td className="py-3 pl-3 text-emerald-600 font-bold">Full Access</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-espresso-950 dark:text-cafe-50">
                    👔 Assistant Manager & Inventory Lead
                  </td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Stock & Restock</td>
                  <td className="py-3 px-3 text-blue-600 font-bold">View Rate Cards</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Create & Receive</td>
                  <td className="py-3 px-3 text-blue-600 font-bold">Operational</td>
                  <td className="py-3 pl-3 text-blue-600 font-bold">Shift Schedules</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-espresso-950 dark:text-cafe-50">
                    ☕ Head Barista & Shift Lead
                  </td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Restock & Waste</td>
                  <td className="py-3 px-3 text-espresso-400">View Rate Cards</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Draft & Inspect</td>
                  <td className="py-3 px-3 text-espresso-400">Restricted</td>
                  <td className="py-3 pl-3 text-espresso-400">View Floor Staff</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-espresso-950 dark:text-cafe-50">
                    🧑‍🍳 Shift Barista (Floor POS)
                  </td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Quick Usage (-1)</td>
                  <td className="py-3 px-3 text-red-500 font-bold">Hidden</td>
                  <td className="py-3 px-3 text-red-500 font-bold">Hidden</td>
                  <td className="py-3 px-3 text-red-500 font-bold">Hidden</td>
                  <td className="py-3 pl-3 text-red-500 font-bold">No Access</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-espresso-950 dark:text-cafe-50">
                    📋 Inventory & COGS Auditor
                  </td>
                  <td className="py-3 px-3 text-blue-600 font-bold">Read-Only Logs</td>
                  <td className="py-3 px-3 text-blue-600 font-bold">Read-Only Matrix</td>
                  <td className="py-3 px-3 text-blue-600 font-bold">Audit Trails</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Full Valuation</td>
                  <td className="py-3 pl-3 text-red-500 font-bold">No Access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181310] border border-cafe-200 dark:border-espresso-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-cafe-100 dark:border-espresso-800">
            <Shield className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-espresso-950 dark:text-cafe-50">
                Your Assigned Role: <span className="text-caramel-600 dark:text-caramel-400">{currentUser?.displayName || 'Staff Member'}</span> &bull; {currentUser?.roleLabel || currentRole}
              </h3>
              <p className="text-[11px] text-espresso-500">
                You are currently viewing only the permissions and actions permitted for your assigned role.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
              <p className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Allowed For Your Role:</span>
              </p>
              <ul className="text-espresso-700 dark:text-cafe-300 space-y-1.5 list-disc list-inside">
                {currentRole === 'barista' ? (
                  <>
                    <li>Floor POS Stock Deductions (-1) during customer orders</li>
                    <li>Live ingredient on-hand stock visibility</li>
                    <li>Shift audit trail & timestamped activity logging</li>
                  </>
                ) : currentRole === 'auditor' ? (
                  <>
                    <li>Read-only financial audit trails & valuation analytics</li>
                    <li>Stock level verification & price variance logs</li>
                    <li>CSV inventory exports</li>
                  </>
                ) : (
                  <>
                    <li>Stock restock & Goods Receipt check-ins</li>
                    <li>Purchase order inspections & shift handover</li>
                  </>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-espresso-50 dark:bg-espresso-900/30 border border-espresso-200 dark:border-espresso-800 space-y-2">
              <p className="font-bold text-espresso-600 dark:text-espresso-400 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>Admin Managed (Restricted):</span>
              </p>
              <ul className="text-espresso-500 dark:text-espresso-400 space-y-1.5 list-disc list-inside">
                <li>Creating/deleting staff profiles and PIN management</li>
                <li>Vendor directory pricing & wholesale contracts</li>
                <li>Deleting store inventory catalogs or purging workspace data</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Linked Workflow Quick Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard"
          className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-caramel-500 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-caramel-600 transition-colors">
                Return to Store Overview
              </p>
              <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                View live metrics, shortages & deliveries &rarr;
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-espresso-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/dashboard/history"
          className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-blue-500 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-blue-600 transition-colors">
                Audit Staff Activity Logs
              </p>
              <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                See timestamped shift actions and user logs &rarr;
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-espresso-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* DANGER ZONE: ACCOUNT DELETION & COMPLETE DATA PURGE (STORE ADMIN ONLY) */}
      {isAdmin && (
        <div className="p-6 rounded-3xl bg-red-950/20 border border-red-800/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-red-400">
                  Danger Zone: Delete Café Account & Purge Store Data
                </h3>
              </div>
              <p className="text-xs text-espresso-400">
                Permanently removes <strong className="text-cafe-200">{currentUser?.cafeName || 'this café account'}</strong> from Cloud Firestore, deletes all inventory, purchase orders, vendor agreements, and unlists the store from the Public Supplier Directory.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenDeleteModal}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 shadow-sm flex items-center gap-2 shrink-0 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Store Account</span>
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION & ADMIN PASSWORD AUTHENTICATION MODAL */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#140F0D] border border-red-800 shadow-2xl space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 text-red-400 border border-red-800/80 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-cafe-50">
                  Permanently Delete Café Account?
                </h3>
                <p className="text-xs text-espresso-400 leading-relaxed">
                  This action is <strong className="text-red-400">irreversible</strong>. All stock catalog items, vendor price mappings, purchase orders, and staff PINs will be permanently erased from Cloud Firestore.
                </p>
              </div>

              {/* Password Verification Form */}
              <form onSubmit={handleConfirmDeleteAccount} className="space-y-4 pt-1">
                <div className="p-3 rounded-2xl bg-espresso-950/80 border border-espresso-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-espresso-400">
                    <span>Authorized Admin:</span>
                    <span className="font-bold text-cafe-200">{currentUser?.email || currentUser?.displayName || 'Store Admin'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-cafe-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-red-400" />
                      <span>Admin Account Password</span>
                    </span>
                    <span className="text-[10px] text-red-400 font-semibold">Required</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        setDeleteError('');
                      }}
                      placeholder="Enter Admin Password to confirm"
                      disabled={isDeleting}
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-espresso-900 border border-espresso-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-cafe-50 text-xs placeholder:text-espresso-500 outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-400 hover:text-cafe-200"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {deleteError && (
                    <p className="text-[11px] font-semibold text-red-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{deleteError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-espresso-800 hover:bg-espresso-700 text-cafe-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || !adminPassword.trim()}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Purging Store...' : 'Confirm & Wipe Store'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
