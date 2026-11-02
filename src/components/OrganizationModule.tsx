/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Department, Unit, UserProfile, UserRole, ClearanceLevel } from '../types/dms';
import {
  Building2,
  FolderTree,
  Plus,
  Users,
  Shield,
  CheckCircle2,
  Lock,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface OrganizationModuleProps {
  departments: Department[];
  users: UserProfile[];
  currentUser: UserProfile;
  onCreateDepartment: (dept: Omit<Department, 'id' | 'createdAt'>) => void;
  onCreateUnit: (deptId: string, unit: Omit<Unit, 'id' | 'departmentId'>) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole, newClearance: ClearanceLevel) => void;
}

export const OrganizationModule: React.FC<OrganizationModuleProps> = ({
  departments,
  users,
  currentUser,
  onCreateDepartment,
  onCreateUnit,
  onUpdateUserRole,
}) => {
  const [activeTab, setActiveTab] = useState<'hierarki' | 'ahli'>('hierarki');
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [selectedDeptForUnit, setSelectedDeptForUnit] = useState<string>(departments[0]?.id || '');

  // Add Dept form state
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // Add Unit form state
  const [unitName, setUnitName] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [unitDesc, setUnitDesc] = useState('');

  const isAdmin = currentUser.role === 'admin';

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;
    onCreateDepartment({
      name: deptName.trim(),
      code: deptCode.trim().toUpperCase(),
      headOfDepartment: deptHead.trim() || 'Pegawai Pelantikan Baharu',
      description: deptDesc.trim() || 'Jabatan baharu dalam pengurusan organisasi.',
      units: [],
    });
    setDeptName('');
    setDeptCode('');
    setDeptHead('');
    setDeptDesc('');
    setShowAddDeptModal(false);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !unitCode.trim() || !selectedDeptForUnit) return;
    onCreateUnit(selectedDeptForUnit, {
      name: unitName.trim(),
      code: unitCode.trim().toUpperCase(),
      description: unitDesc.trim() || 'Unit pengkhususan operasi.',
    });
    setUnitName('');
    setUnitCode('');
    setUnitDesc('');
    setShowAddUnitModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span>Hierarki Organisasi & Kawalan Keselamatan Akses</span>
          </h2>
          <p className="text-xs text-slate-500">
            Penstrukturan jabatan, unit operasi, dan penugasan peranan berhierarki untuk kawalan ketat.
          </p>
        </div>

        {/* Tab switchers & Admin CTAs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('hierarki')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'hierarki'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Jabatan & Unit
            </button>
            <button
              onClick={() => setActiveTab('ahli')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'ahli'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Matriks Penugasan Anggota ({users.length})
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cipta Jabatan</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Hierarki Jabatan & Unit */}
      {activeTab === 'hierarki' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                      {dept.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {dept.name}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {dept.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <span>Ketua Jabatan: </span>
                  <strong className="text-slate-800 dark:text-slate-200">{dept.headOfDepartment}</strong>
                </div>

                {/* Units List under this Department */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Unit Pengkhususan ({dept.units.length})</span>
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setSelectedDeptForUnit(dept.id);
                          setShowAddUnitModal(true);
                        }}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        + Tambah Unit
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {dept.units.map((unit) => (
                      <div
                        key={unit.id}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs flex items-start justify-between"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {unit.name} <span className="font-mono text-[10px] text-slate-400">({unit.code})</span>
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{unit.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Matriks Penugasan Anggota & Peranan Akses */}
      {activeTab === 'ahli' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Matriks Hak Akses & Tapisan Keselamatan Pengguna
              </h3>
              <p className="text-xs text-slate-500">
                Pemberian kuasa peranan (Admin, Editor, Viewer) dan klasifikasi keselamatan.
              </p>
            </div>
            {!isAdmin && (
              <span className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200 dark:border-amber-900">
                Hanya Pentadbir (Admin) dibenarkan menukar hak akses
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="px-5 py-3">Nama Pegawai</th>
                  <th className="px-4 py-3">Jabatan & Unit</th>
                  <th className="px-4 py-3">Peranan Sistem (RBAC)</th>
                  <th className="px-4 py-3">Tapisan Keselamatan</th>
                  <th className="px-4 py-3 text-right">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{user.displayName}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{user.departmentName}</p>
                      <p className="text-[11px] text-slate-400">{user.unitName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {isAdmin ? (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            onUpdateUserRole(user.uid, e.target.value as UserRole, user.clearanceLevel)
                          }
                          className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="admin">ADMIN (Kuasa Penuh CRUD)</option>
                          <option value="editor">EDITOR (Cipta & Sunting)</option>
                          <option value="viewer">VIEWER (Baca & Komen Sahaja)</option>
                        </select>
                      ) : (
                        <span className="font-semibold uppercase text-slate-800 dark:text-slate-200">
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {isAdmin ? (
                        <select
                          value={user.clearanceLevel}
                          onChange={(e) =>
                            onUpdateUserRole(user.uid, user.role, e.target.value as ClearanceLevel)
                          }
                          className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-rose-600 dark:text-rose-400"
                        >
                          <option value="BIASA">BIASA (Fail Awam)</option>
                          <option value="TERHAD">TERHAD (Akses Dalaman)</option>
                          <option value="SULIT">SULIT (Klasifikasi Sulit)</option>
                          <option value="RAHSIA_BESAR">RAHSIA BESAR (Tertinggi)</option>
                        </select>
                      ) : (
                        <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {user.clearanceLevel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-[11px] text-emerald-600 font-medium">Disahkan Aktif</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Cipta Jabatan */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cipta Jabatan Baharu</h3>
            <form onSubmit={handleSaveDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nama Jabatan *
                </label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="Contoh: Jabatan Audit & Pematuhan Integriti"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Kod Singkatan Jabatan *
                </label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="Contoh: JAPI"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Ketua Jabatan / Pengarah
                </label>
                <input
                  type="text"
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  placeholder="Contoh: Dato' Ahmad Razif"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Penerangan Skop
                </label>
                <textarea
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  rows={3}
                  placeholder="Penerangan bidang tanggungjawab jabatan..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg font-semibold"
                >
                  Simpan Jabatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Unit */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tambah Unit Pengkhususan</h3>
            <form onSubmit={handleSaveUnit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Jabatan Induk
                </label>
                <select
                  value={selectedDeptForUnit}
                  onChange={(e) => setSelectedDeptForUnit(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nama Unit *
                </label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="Contoh: Unit Integriti & Rahsia Rasmi"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Kod Unit *
                </label>
                <input
                  type="text"
                  required
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  placeholder="Contoh: UIR"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Penerangan Tugas
                </label>
                <textarea
                  value={unitDesc}
                  onChange={(e) => setUnitDesc(e.target.value)}
                  rows={3}
                  placeholder="Penerangan fungsi spesifik unit..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg font-semibold"
                >
                  Simpan Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
