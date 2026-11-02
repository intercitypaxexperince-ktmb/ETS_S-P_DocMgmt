/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserProfile,
  UserRole,
  ClearanceLevel,
  Department,
  AccountStatus,
} from '../types/dms';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Lock,
  Edit2,
  Trash2,
  LogIn,
} from 'lucide-react';

interface UserManagerModuleProps {
  users: UserProfile[];
  departments: Department[];
  currentUser: UserProfile;
  onCreateUser: (newUser: UserProfile) => void;
  onUpdateUser: (userId: string, updates: Partial<UserProfile>) => void;
  onLoginWithServiceNumber: (serviceNumber: string) => boolean;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const UserManagerModule: React.FC<UserManagerModuleProps> = ({
  users,
  departments,
  currentUser,
  onCreateUser,
  onUpdateUser,
  onLoginWithServiceNumber,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('semua');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Quick Login with Service Number state
  const [quickServiceNum, setQuickServiceNum] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // New User Form State
  const [serviceNumber, setServiceNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept_it');
  const [unitId, setUnitId] = useState(departments[0]?.units[0]?.id || '');
  const [clearanceLevel, setClearanceLevel] = useState<ClearanceLevel>('TERHAD');
  const [expiryDate, setExpiryDate] = useState(() => {
    // Default 1 year from now
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const currentUnits = departments.find((d) => d.id === departmentId)?.units || [];

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesNum = u.serviceNumber?.toLowerCase().includes(q);
      const matchesName = u.displayName.toLowerCase().includes(q);
      const matchesDept = u.departmentName.toLowerCase().includes(q);
      if (!matchesNum && !matchesName && !matchesDept) return false;
    }
    if (roleFilter !== 'semua' && u.role !== roleFilter) return false;
    return true;
  });

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const num = quickServiceNum.trim();
    if (!/^[a-zA-Z0-9]{6}$/.test(num)) {
      setLoginError('No. Perkhidmatan mestilah tepat 6 aksara/nombor.');
      return;
    }

    const success = onLoginWithServiceNumber(num);
    if (success) {
      setQuickServiceNum('');
      onShowToast('Log Masuk Berjaya', `Sesi diaktifkan untuk No. Perkhidmatan [${num}].`, 'success');
    } else {
      setLoginError('No. Perkhidmatan tidak ditemui atau akaun telah luput.');
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNum = serviceNumber.trim().toUpperCase();
    if (!/^[a-zA-Z0-9]{6}$/.test(cleanNum)) {
      setFormError('No. Perkhidmatan wajib diisi dengan tepat 6 aksara / nombor (contoh: 882104).');
      return;
    }

    if (!displayName.trim() || !email.trim() || !expiryDate) {
      setFormError('Sila lengkapkan semua medan wajib.');
      return;
    }

    // Check uniqueness of service number if creating
    if (!editingUser && users.some((u) => u.serviceNumber === cleanNum)) {
      setFormError(`No. Perkhidmatan [${cleanNum}] telah didaftarkan untuk pengguna lain.`);
      return;
    }

    const selectedDept = departments.find((d) => d.id === departmentId);
    const selectedUnit = selectedDept?.units.find((u) => u.id === unitId);

    if (editingUser) {
      onUpdateUser(editingUser.uid, {
        displayName: displayName.trim(),
        email: email.trim(),
        role,
        departmentId,
        departmentName: selectedDept?.name || editingUser.departmentName,
        unitId,
        unitName: selectedUnit?.name || editingUser.unitName,
        clearanceLevel,
        expiryDate,
      });
      onShowToast('Pengguna Dikemaskini', `Maklumat akaun ${cleanNum} berjaya dikemaskini.`, 'success');
    } else {
      const newUser: UserProfile = {
        uid: `user_${Date.now()}`,
        serviceNumber: cleanNum,
        displayName: displayName.trim(),
        email: email.trim(),
        role,
        departmentId,
        departmentName: selectedDept?.name || 'Jabatan Pentadbiran',
        unitId,
        unitName: selectedUnit?.name || 'Unit Khidmat',
        clearanceLevel,
        avatarUrl: '/src/assets/images/avatar_viewer_analyst_1793580727967.jpg',
        expiryDate,
        status: 'active',
      };
      onCreateUser(newUser);
      onShowToast('Pengguna Didaftarkan', `Akaun No. Perkhidmatan [${cleanNum}] sedia untuk digunakan.`, 'success');
    }

    setShowCreateModal(false);
    setEditingUser(null);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setServiceNumber(user.serviceNumber);
    setDisplayName(user.displayName);
    setEmail(user.email);
    setRole(user.role);
    setDepartmentId(user.departmentId);
    setUnitId(user.unitId);
    setClearanceLevel(user.clearanceLevel);
    setExpiryDate(user.expiryDate);
    setShowCreateModal(true);
  };

  const isExpired = (dateStr: string) => {
    return new Date(dateStr).getTime() < new Date().getTime();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Modul Pengurusan Pengguna & No. Perkhidmatan</span>
          </h2>
          <p className="text-xs text-slate-500">
            Daftar, semak dan urus hak akses kakitangan menggunakan 6-aksara No. Perkhidmatan dan tarikh luput akaun.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingUser(null);
              setServiceNumber('');
              setDisplayName('');
              setEmail('');
              setRole('editor');
              setClearanceLevel('TERHAD');
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity shadow-xs self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Cipta Pengguna Baharu</span>
          </button>
        )}
      </div>

      {/* Quick Login Bar with No. Perkhidmatan (User preference) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Log Masuk Pantas Menggunakan No. Perkhidmatan (6 Aksara/Nombor)
              </p>
              <p className="text-[11px] text-slate-500">
                Akses sistem tanpa kata laluan rumit dengan memasukkan 6 digit rasmi perkhidmatan anda.
              </p>
            </div>
          </div>

          <form onSubmit={handleQuickLogin} className="flex items-center gap-2">
            <input
              type="text"
              maxLength={6}
              value={quickServiceNum}
              onChange={(e) => setQuickServiceNum(e.target.value.toUpperCase())}
              placeholder="Contoh: 882104"
              className="w-32 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:opacity-90"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log Masuk</span>
            </button>
          </form>
        </div>

        {loginError && (
          <p className="text-xs text-rose-600 font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
            {loginError}
          </p>
        )}

        {/* Quick Click Badges for Testing */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] overflow-x-auto">
          <span className="text-slate-400 shrink-0">Pilihan Cepat untuk Ujian:</span>
          {users.map((u) => (
            <button
              key={u.uid}
              type="button"
              onClick={() => {
                setQuickServiceNum(u.serviceNumber);
                onLoginWithServiceNumber(u.serviceNumber);
                onShowToast('Sesi Ditukar', `Log masuk sebagai ${u.displayName} (${u.role.toUpperCase()})`, 'info');
              }}
              className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors ${
                currentUser.serviceNumber === u.serviceNumber
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {u.serviceNumber} ({u.displayName.split(' ')[0]} - {u.role})
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. perkhidmatan (e.g. 882104), nama, atau unit..."
            className="w-full pl-10 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Peranan:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-medium"
          >
            <option value="semua">Semua Peranan</option>
            <option value="admin">Admin Sahaja</option>
            <option value="editor">Editor Sahaja</option>
            <option value="viewer">Viewer Sahaja</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">No. Perkhidmatan</th>
                <th className="px-4 py-3">Nama Pegawai & Emel</th>
                <th className="px-4 py-3">Jabatan & Unit</th>
                <th className="px-3 py-3">Peranan (RBAC)</th>
                <th className="px-3 py-3">Tapisan Keselamatan</th>
                <th className="px-4 py-3">Tarikh Luput Akaun</th>
                <th className="px-4 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => {
                const expired = isExpired(user.expiryDate);
                const isCurrentActive = currentUser.uid === user.uid;

                return (
                  <tr
                    key={user.uid}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                      isCurrentActive ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tracking-wider">
                          {user.serviceNumber || 'TIADA'}
                        </span>
                        {isCurrentActive && (
                          <span className="text-[10px] text-blue-600 font-semibold">(Sesi Anda)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="w-7 h-7 rounded-md object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{user.displayName}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{user.departmentName}</p>
                      <p className="text-[11px] text-slate-400">{user.unitName}</p>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="font-bold uppercase text-[11px] text-slate-800 dark:text-slate-200">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        {user.clearanceLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono tabular-nums ${
                            expired ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {new Date(user.expiryDate).toLocaleDateString('ms-MY')}
                        </span>
                        {expired ? (
                          <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Luput
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600">Aktif</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Sunting Maklumat & Lanjut Tarikh Luput"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingUser ? 'Kemaskini Maklumat Pengguna' : 'Daftar Pengguna Baharu (No. Perkhidmatan)'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              {/* No. Perkhidmatan (Wajib, 6 aksara) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Perkhidmatan (Wajib - Tepat 6 Aksara / Nombor) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  disabled={Boolean(editingUser)}
                  value={serviceNumber}
                  onChange={(e) => setServiceNumber(e.target.value.toUpperCase())}
                  placeholder="Contoh: 882104"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Digunakan untuk pengesahan log masuk rasmi agensi.
                </p>
              </div>

              {/* Nama Penuh */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Penuh Pegawai *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Ir. Dr. Faridah Mansor"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Emel Rasmi */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Emel Rasmi Jabatan *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama.pegawai@arkadms.gov.my"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Jabatan & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan *
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      const dept = departments.find((d) => d.id === e.target.value);
                      if (dept && dept.units.length > 0) setUnitId(dept.units[0].id);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit *
                  </label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {currentUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role & Clearance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tahap Akses / Peranan (RBAC) *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="admin">ADMIN (Kuasa Penuh CRUD)</option>
                    <option value="editor">EDITOR (Cipta & Sunting Fail)</option>
                    <option value="viewer">VIEWER (Baca Sahaja & Komen)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tapisan Keselamatan *
                  </label>
                  <select
                    value={clearanceLevel}
                    onChange={(e) => setClearanceLevel(e.target.value as ClearanceLevel)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="BIASA">BIASA (Akses Dokumen Terbuka)</option>
                    <option value="TERHAD">TERHAD (Akses Dalaman Agensi)</option>
                    <option value="SULIT">SULIT (Klasifikasi Pegawai Kanan)</option>
                    <option value="RAHSIA_BESAR">RAHSIA BESAR (Pengarah / Tertinggi)</option>
                  </select>
                </div>
              </div>

              {/* Expiry Date (Wajib) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tarikh Luput Akaun (Wajib) *
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Akaun akan disekat daripada log masuk secara automatik selepas tarikh ini melainkan dilanjutkan oleh Admin.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-semibold"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Daftar Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
