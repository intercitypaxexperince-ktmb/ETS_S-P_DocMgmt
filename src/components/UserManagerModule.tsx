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
  canManageUsers,
  isSuperAdmin,
  SUPER_ADMIN_EMAIL,
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
  Eye,
  EyeOff,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface UserManagerModuleProps {
  users: UserProfile[];
  departments: Department[];
  currentUser: UserProfile | null;
  onCreateUser: (newUser: UserProfile) => void;
  onUpdateUser: (userId: string, updates: Partial<UserProfile>) => void;
  onLoginWithCredentials: (serviceNumber: string, password: string) => boolean;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const UserManagerModule: React.FC<UserManagerModuleProps> = ({
  users,
  departments,
  currentUser,
  onCreateUser,
  onUpdateUser,
  onLoginWithCredentials,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('semua');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Secure Login with Service Number & Password
  const [loginServiceNum, setLoginServiceNum] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // New / Edit User Form State
  const [serviceNumber, setServiceNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('editor');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept_it');
  const [unitId, setUnitId] = useState(departments[0]?.units[0]?.id || '');
  const [clearanceLevel, setClearanceLevel] = useState<ClearanceLevel>('TERHAD');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [formError, setFormError] = useState<string | null>(null);

  const isAuthorized = canManageUsers(currentUser);
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

  const handleSecureLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const num = loginServiceNum.trim().toUpperCase();
    if (!/^[a-zA-Z0-9]{6}$/.test(num)) {
      setLoginError('No. Perkhidmatan mestilah tepat 6 aksara/nombor.');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('Sila masukkan kata laluan untuk log masuk.');
      return;
    }

    const success = onLoginWithCredentials(num, loginPassword);
    if (success) {
      setLoginServiceNum('');
      setLoginPassword('');
    } else {
      setLoginError('No. Perkhidmatan atau kata laluan tidak tepat, atau akaun telah tamat tempoh.');
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserPassword(pwd);
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

    // When creating a new user, password is compulsory
    if (!editingUser && (!userPassword || userPassword.trim().length < 6)) {
      setFormError('Kata laluan wajib diisi (sekurang-kurangnya 6 aksara) bagi pengguna baharu.');
      return;
    }

    // Check uniqueness of service number if creating
    if (!editingUser && users.some((u) => (u.serviceNumber || '').toUpperCase() === cleanNum)) {
      setFormError(`No. Perkhidmatan [${cleanNum}] telah didaftarkan untuk pengguna lain.`);
      return;
    }

    const selectedDept = departments.find((d) => d.id === departmentId);
    const selectedUnit = selectedDept?.units.find((u) => u.id === unitId);

    if (editingUser) {
      const updates: Partial<UserProfile> = {
        displayName: displayName.trim(),
        email: email.trim(),
        role,
        departmentId,
        departmentName: selectedDept?.name || editingUser.departmentName,
        unitId,
        unitName: selectedUnit?.name || editingUser.unitName,
        clearanceLevel,
        expiryDate,
      };
      if (userPassword.trim()) {
        updates.password = userPassword.trim();
      }
      onUpdateUser(editingUser.uid, updates);
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
        password: userPassword.trim(),
      };
      onCreateUser(newUser);
      onShowToast('Pengguna Didaftarkan', `Akaun No. Perkhidmatan [${cleanNum}] sedia untuk digunakan dengan kata laluan.`, 'success');
    }

    setShowCreateModal(false);
    setEditingUser(null);
    setUserPassword('');
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
    setUserPassword(user.password || '');
    setShowCreateModal(true);
  };

  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() < new Date().getTime();
  };

  // If user is not admin or super admin, show security restriction
  if (!isAuthorized) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-8 max-w-xl mx-auto my-12 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-rose-900 dark:text-rose-200 tracking-tight">
            AKSES MODUL PENGURUSAN PENGGUNA DISEKAT
          </h3>
          <p className="text-xs text-rose-700 dark:text-rose-400 mt-2 max-w-md mx-auto leading-relaxed">
            Modul ini dihadkan secara ketat kepada <strong>Pentadbir Sistem (Admin)</strong> dan{' '}
            <strong>Super Admin ({SUPER_ADMIN_EMAIL})</strong> sahaja bagi memastikan integriti kawalan pengguna dan kata laluan.
          </p>
        </div>
        <div className="pt-2">
          <span className="text-[11px] font-mono text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            Sesi Aktif: {currentUser ? `${currentUser.displayName} (#${currentUser.serviceNumber}) · Peranan: ${currentUser.role.toUpperCase()}` : 'Tiada Sesi Aktif (Guest)'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Modul Pengurusan Pengguna & Kawalan Kata Laluan</span>
            </h2>
            {isSuperAdmin(currentUser) && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300">
                SUPER ADMIN
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kawalan akses akaun, pendaftaran No. Perkhidmatan (6 digit), kata laluan selamat, dan tarikh luput akaun.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setServiceNumber('');
            setDisplayName('');
            setEmail('');
            setUserPassword('');
            setRole('editor');
            setClearanceLevel('TERHAD');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity shadow-xs self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Cipta Pengguna Baharu</span>
        </button>
      </div>

      {/* Secure Authentication Login Bar (No Quick Login) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Log Masuk Selamat Pengguna Rasmi
                <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200">
                  Enkripsi Kredensial
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                Log masuk memerlukan padanan No. Perkhidmatan (6 aksara) serta kata laluan akaun pengguna.
              </p>
            </div>
          </div>

          <form onSubmit={handleSecureLogin} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="text"
              maxLength={6}
              value={loginServiceNum}
              onChange={(e) => setLoginServiceNum(e.target.value.toUpperCase())}
              placeholder="No. Servis (e.g. 882104)"
              className="w-full sm:w-36 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono tracking-wider uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <div className="relative w-full sm:w-44">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Kata Laluan"
                className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:opacity-90 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sahkan & Log Masuk</span>
            </button>
          </form>
        </div>

        {loginError && (
          <p className="text-xs text-rose-600 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
            {loginError}
          </p>
        )}
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
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">No. Perkhidmatan</th>
                <th className="px-4 py-3 font-semibold">Pegawai & Emel</th>
                <th className="px-4 py-3 font-semibold">Jabatan & Unit</th>
                <th className="px-3 py-3 font-semibold">Akses</th>
                <th className="px-3 py-3 font-semibold">Tapisan</th>
                <th className="px-3 py-3 font-semibold">Kata Laluan</th>
                <th className="px-4 py-3 font-semibold">Tempoh Sah</th>
                <th className="px-4 py-3 font-semibold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => {
                const expired = isExpired(user.expiryDate);
                const isSuper = user.email === SUPER_ADMIN_EMAIL;
                return (
                  <tr
                    key={user.uid}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                        {user.serviceNumber || '882104'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900 dark:text-white">{user.displayName}</p>
                            {isSuper && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                SUPER ADMIN
                              </span>
                            )}
                          </div>
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
                        {user.clearanceLevel === 'RAHSIA_BESAR' ? 'P&C' : user.clearanceLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Lock className="w-3 h-3" />
                        <span>Kunci Aktif</span>
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
                          <span className="text-[10px] text-emerald-600 font-medium">Aktif</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Sunting Maklumat, Kata Laluan & Tarikh Luput"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingUser ? 'Kemaskini Maklumat & Kata Laluan Pengguna' : 'Daftar Pengguna Baharu (No. Perkhidmatan & Password)'}
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

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              {/* Service Number (Wajib) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Perkhidmatan (Wajib - Tepat 6 Aksara / Nombor) *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  disabled={Boolean(editingUser)}
                  value={serviceNumber}
                  onChange={(e) => setServiceNumber(e.target.value.toUpperCase())}
                  placeholder="Contoh: 882104"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Pengenalan rasmi unik 6 digit anggota kerajaan untuk kawalan capaian.
                </p>
              </div>

              {/* Display Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emel Rasmi *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@arkadms.gov.my"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Password Field (User Request) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Kata Laluan Log Masuk {editingUser ? '(Kosongkan jika tidak tukar)' : '*'}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-blue-600 hover:underline font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Jana Kata Laluan Rawak
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder={editingUser ? 'Masukkan kata laluan baharu...' : 'Minimum 6 aksara (contoh: P@ssw0rd123)'}
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Digunakan untuk log masuk bersama No. Perkhidmatan.
                </p>
              </div>

              {/* Department & Unit (Hierarki Wajib) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan *
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => {
                      const newDeptId = e.target.value;
                      setDepartmentId(newDeptId);
                      const deptUnits = departments.find((d) => d.id === newDeptId)?.units || [];
                      setUnitId(deptUnits[0]?.id || '');
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
                    <option value="P&C">P&C (Private & Confidential / Tertinggi)</option>
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
