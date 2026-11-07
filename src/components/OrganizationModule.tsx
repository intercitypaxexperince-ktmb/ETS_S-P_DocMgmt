/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Department, Unit, UserProfile, UserRole, ClearanceLevel, DmsDocument, canManageUsers } from '../types/dms';
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
  Edit2,
  Trash2,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface OrganizationModuleProps {
  departments: Department[];
  users: UserProfile[];
  documents: DmsDocument[];
  currentUser: UserProfile | null;
  onCreateDepartment: (dept: Omit<Department, 'id' | 'createdAt'>) => void;
  onUpdateDepartment: (deptId: string, updates: Partial<Department>) => void;
  onDeleteDepartment: (deptId: string, fallbackDeptId: string, fallbackUnitId: string) => void;
  onCreateUnit: (deptId: string, unit: Omit<Unit, 'id' | 'departmentId'>) => void;
  onUpdateUnit: (deptId: string, unitId: string, updates: Partial<Unit>) => void;
  onDeleteUnit: (deptId: string, unitId: string, fallbackUnitId: string) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole, newClearance: ClearanceLevel) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const OrganizationModule: React.FC<OrganizationModuleProps> = ({
  departments,
  users,
  documents,
  currentUser,
  onCreateDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onCreateUnit,
  onUpdateUnit,
  onDeleteUnit,
  onUpdateUserRole,
  onShowToast,
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

  // Edit Dept form state
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editDeptHead, setEditDeptHead] = useState('');
  const [editDeptDesc, setEditDeptDesc] = useState('');

  // Delete Dept Modal & Reassignment
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [hasUnitsWarning, setHasUnitsWarning] = useState(false);
  const [reassignDeptChoice, setReassignDeptChoice] = useState<'other' | 'general'>('general');
  const [targetFallbackDeptId, setTargetFallbackDeptId] = useState<string>('');
  const [targetFallbackUnitId, setTargetFallbackUnitId] = useState<string>('');

  // Add Unit form state
  const [unitName, setUnitName] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [unitDesc, setUnitDesc] = useState('');

  // Edit Unit form state
  const [editingUnitDeptId, setEditingUnitDeptId] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editUnitName, setEditUnitName] = useState('');
  const [editUnitCode, setEditUnitCode] = useState('');
  const [editUnitDesc, setEditUnitDesc] = useState('');

  // Delete Unit Modal
  const [unitToDelete, setUnitToDelete] = useState<{ deptId: string; unit: Unit } | null>(null);
  const [unitFallbackChoice, setUnitFallbackChoice] = useState<'sibling' | 'general'>('general');
  const [unitTargetFallbackId, setUnitTargetFallbackId] = useState<string>('');

  const isAdmin = canManageUsers(currentUser);

  // Handlers for Add Department
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
    onShowToast('Jabatan Dicipta', `Jabatan "${deptName.trim()}" telah berjaya didaftarkan.`, 'success');
  };

  // Handlers for Edit Department
  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setEditDeptName(dept.name);
    setEditDeptCode(dept.code);
    setEditDeptHead(dept.headOfDepartment);
    setEditDeptDesc(dept.description);
  };

  const handleSaveEditDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editDeptName.trim() || !editDeptCode.trim()) return;
    onUpdateDepartment(editingDept.id, {
      name: editDeptName.trim(),
      code: editDeptCode.trim().toUpperCase(),
      headOfDepartment: editDeptHead.trim(),
      description: editDeptDesc.trim(),
    });
    setEditingDept(null);
    onShowToast('Jabatan Dikemaskini', `Maklumat jabatan [${editDeptCode.trim()}] telah dikemaskini.`, 'success');
  };

  // Handlers for Delete Department
  const handleInitiateDeleteDept = (dept: Department) => {
    if (dept.id === 'dept_general') {
      onShowToast('Tindakan Disekat', 'Jabatan Am (JAMK) adalah jabatan sistem lalai dan tidak boleh dipadam.', 'error');
      return;
    }
    setDeptToDelete(dept);
    if (dept.units && dept.units.length > 0) {
      setHasUnitsWarning(true);
    } else {
      setHasUnitsWarning(false);
      // default fallback
      const otherDepts = departments.filter((d) => d.id !== dept.id);
      const firstOther = otherDepts[0];
      setTargetFallbackDeptId(firstOther?.id || 'dept_general');
      setTargetFallbackUnitId(firstOther?.units[0]?.id || 'unit_general');
    }
  };

  const handleConfirmDeleteDept = () => {
    if (!deptToDelete) return;
    let fallbackDept = targetFallbackDeptId;
    let fallbackUnit = targetFallbackUnitId;
    if (reassignDeptChoice === 'general') {
      fallbackDept = 'dept_general';
      fallbackUnit = 'unit_general';
    }
    onDeleteDepartment(deptToDelete.id, fallbackDept, fallbackUnit);
    setDeptToDelete(null);
    onShowToast(
      'Jabatan Dipadam',
      `Jabatan "${deptToDelete.name}" telah dipadam. Fail dipindahkan kepada ${reassignDeptChoice === 'general' ? 'Jabatan Am (JAMK)' : 'jabatan sasaran'}.`,
      'info'
    );
  };

  // Handlers for Add Unit
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
    onShowToast('Unit Dicipta', `Unit "${unitName.trim()}" telah berjaya didaftarkan.`, 'success');
  };

  // Handlers for Edit Unit
  const handleOpenEditUnit = (deptId: string, unit: Unit) => {
    setEditingUnitDeptId(deptId);
    setEditingUnit(unit);
    setEditUnitName(unit.name);
    setEditUnitCode(unit.code);
    setEditUnitDesc(unit.description);
  };

  const handleSaveEditUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit || !editingUnitDeptId || !editUnitName.trim() || !editUnitCode.trim()) return;
    onUpdateUnit(editingUnitDeptId, editingUnit.id, {
      name: editUnitName.trim(),
      code: editUnitCode.trim().toUpperCase(),
      description: editUnitDesc.trim(),
    });
    setEditingUnit(null);
    setEditingUnitDeptId(null);
    onShowToast('Unit Dikemaskini', `Maklumat unit [${editUnitCode.trim()}] telah disimpan.`, 'success');
  };

  // Handlers for Delete Unit
  const handleInitiateDeleteUnit = (deptId: string, unit: Unit) => {
    if (unit.id === 'unit_general') {
      onShowToast('Tindakan Disekat', 'Unit Am sistem tidak boleh dipadam.', 'error');
      return;
    }
    const parentDept = departments.find((d) => d.id === deptId);
    const siblings = parentDept?.units.filter((u) => u.id !== unit.id) || [];
    setUnitToDelete({ deptId, unit });
    setUnitTargetFallbackId(siblings[0]?.id || 'unit_general');
  };

  const handleConfirmDeleteUnit = () => {
    if (!unitToDelete) return;
    const fallbackUnit = unitFallbackChoice === 'general' ? 'unit_general' : unitTargetFallbackId || 'unit_general';
    onDeleteUnit(unitToDelete.deptId, unitToDelete.unit.id, fallbackUnit);
    setUnitToDelete(null);
    onShowToast(
      'Unit Dipadam',
      `Unit "${unitToDelete.unit.name}" telah dipadam. Fail yang terlibat telah dialihkan.`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span>Modul Jabatan & Kawalan Keselamatan Akses</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penstrukturan jabatan, unit operasi, dan penugasan peranan berhierarki bagi mengelakkan fail tergantung tanpa unit.
          </p>
        </div>

        {/* Tab switchers & Admin CTAs */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('hierarki')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'hierarki'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Struktur Jabatan & Unit
            </button>
            <button
              onClick={() => setActiveTab('ahli')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'ahli'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Matriks Penugasan Pegawai ({users.length})
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:opacity-90 shadow-xs"
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
            {departments.map((dept) => {
              const deptDocsCount = documents.filter((d) => d.departmentId === dept.id).length;
              const deptUsersCount = users.filter((u) => u.departmentId === dept.id).length;
              const isGeneralDept = dept.id === 'dept_general';

              return (
                <div
                  key={dept.id}
                  className={`bg-white dark:bg-slate-900 border rounded-xl p-5 space-y-4 shadow-xs flex flex-col justify-between ${
                    isGeneralDept
                      ? 'border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                            {dept.code}
                          </span>
                          {isGeneralDept && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              LALAI / GENERAL
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {dept.name}
                        </h3>
                      </div>

                      {isAdmin && !isGeneralDept && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditDept(dept)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Kemaskini Maklumat Jabatan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleInitiateDeleteDept(dept)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Padam Jabatan (Pastikan Tiada Unit Tergantung)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {dept.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <div>
                        <span>Ketua: </span>
                        <strong className="text-slate-800 dark:text-slate-200">{dept.headOfDepartment}</strong>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {deptDocsCount} fail · {deptUsersCount} staf
                      </span>
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
                        {dept.units.length === 0 ? (
                          <div className="p-3 text-center text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                            Tiada unit aktif. Jabatan ini selamat untuk dipadam.
                          </div>
                        ) : (
                          dept.units.map((unit) => {
                            const isGeneralUnit = unit.id === 'unit_general';
                            const unitDocsCount = documents.filter((d) => d.unitId === unit.id).length;

                            return (
                              <div
                                key={unit.id}
                                className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs flex items-start justify-between gap-2"
                              >
                                <div className="space-y-0.5">
                                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{unit.name}</span>
                                    <span className="font-mono text-[10px] text-slate-400 font-normal">
                                      ({unit.code})
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-slate-500 line-clamp-1">{unit.description}</p>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {unitDocsCount} fail terikat
                                  </span>
                                </div>

                                {isAdmin && !isGeneralUnit && (
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      onClick={() => handleOpenEditUnit(dept.id, unit)}
                                      className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded"
                                      title="Kemaskini Unit"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleInitiateDeleteUnit(dept.id, unit)}
                                      className="p-1 text-rose-400 hover:text-rose-600 rounded"
                                      title="Padam Unit"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                          <option value="P&C">P&C (Private & Confidential / Tertinggi)</option>
                        </select>
                      ) : (
                        <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {user.clearanceLevel === 'RAHSIA_BESAR' ? 'P&C' : user.clearanceLevel}
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
                  placeholder="Contoh: Dato' Dr. Hishamuddin"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Penerangan Fungsi Jabatan
                </label>
                <textarea
                  rows={3}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Fokus operasi dan tanggungjawab jabatan..."
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
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

      {/* Modal: Kemaskini Jabatan */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Kemaskini Jabatan ({editingDept.code})
            </h3>
            <form onSubmit={handleSaveEditDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nama Jabatan *
                </label>
                <input
                  type="text"
                  required
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
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
                  value={editDeptCode}
                  onChange={(e) => setEditDeptCode(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Ketua Jabatan / Pengarah
                </label>
                <input
                  type="text"
                  value={editDeptHead}
                  onChange={(e) => setEditDeptHead(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Penerangan Fungsi Jabatan
                </label>
                <textarea
                  rows={3}
                  value={editDeptDesc}
                  onChange={(e) => setEditDeptDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg font-semibold"
                >
                  Simpan Kemaskini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Padam Jabatan - Block if units exist, or prompt reassignment */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            {hasUnitsWarning ? (
              /* Security Block: Units still exist */
              <div className="space-y-4 text-xs">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    JABATAN TIDAK BOLEH DIPADAM: MASIH MEMPUNYAI UNIT
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Jabatan <strong>"{deptToDelete.name}"</strong> masih mengandungi <strong>{deptToDelete.units.length} unit</strong> di bawahnya ({deptToDelete.units.map(u => u.name).join(', ')}).
                  </p>
                  <p className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900 text-left">
                    Syarat Keselamatan: Untuk mengelakkan fail tergantung tanpa unit dan jabatan, anda <strong>wajib memadam atau mengalihkan semua unit</strong> di bawah jabatan ini terlebih dahulu.
                  </p>
                </div>
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setDeptToDelete(null)}
                    className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg font-semibold"
                  >
                    Faham & Kembali
                  </button>
                </div>
              </div>
            ) : (
              /* Units === 0: Allow deletion with Reassignment Options */
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-sm font-bold">Pengesahan Pemadaman Jabatan & Pengalihan Fail</h3>
                </div>

                <p className="text-slate-600 dark:text-slate-400">
                  Semua unit di bawah <strong>"{deptToDelete.name}"</strong> telah dikosongkan. Sila pilih tindakan pengalihan bagi sebarang fail atau rekod pegawai yang masih terikat dengan jabatan ini:
                </p>

                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="reassignDept"
                      value="general"
                      checked={reassignDeptChoice === 'general'}
                      onChange={() => setReassignDeptChoice('general')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        Jadikan Status General (Jabatan Am / Belum Ditugaskan)
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Fail akan diletakkan di bawah Jabatan Am (JAMK - Unit Pengurusan Am) dan boleh diassign semula kepada jabatan baharu kemudian.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-700">
                    <input
                      type="radio"
                      name="reassignDept"
                      value="other"
                      checked={reassignDeptChoice === 'other'}
                      onChange={() => setReassignDeptChoice('other')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        Pindahkan Terus ke Jabatan Lain
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Pilih jabatan dan unit sasaran sedia ada.
                      </span>
                    </div>
                  </label>

                  {reassignDeptChoice === 'other' && (
                    <div className="pl-6 pt-2 space-y-2">
                      <select
                        value={targetFallbackDeptId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setTargetFallbackDeptId(id);
                          const d = departments.find((x) => x.id === id);
                          setTargetFallbackUnitId(d?.units[0]?.id || 'unit_general');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        {departments
                          .filter((d) => d.id !== deptToDelete.id)
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDeptToDelete(null)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteDept}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
                  >
                    Sahkan & Padam Jabatan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Tambah Unit */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cipta Unit Baharu
            </h3>
            <form onSubmit={handleSaveUnit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Jabatan Induk *
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
                  Nama Unit Operasi *
                </label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="Contoh: Unit Penilaian Teknikal & Tender"
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
                  placeholder="Contoh: UPTT"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Penerangan Fungsi Unit
                </label>
                <textarea
                  rows={2}
                  value={unitDesc}
                  onChange={(e) => setUnitDesc(e.target.value)}
                  placeholder="Skop tugas unit..."
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
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

      {/* Modal: Kemaskini Unit */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Kemaskini Unit ({editingUnit.code})
            </h3>
            <form onSubmit={handleSaveEditUnit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nama Unit *
                </label>
                <input
                  type="text"
                  required
                  value={editUnitName}
                  onChange={(e) => setEditUnitName(e.target.value)}
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
                  value={editUnitCode}
                  onChange={(e) => setEditUnitCode(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Penerangan Fungsi Unit
                </label>
                <textarea
                  rows={2}
                  value={editUnitDesc}
                  onChange={(e) => setEditUnitDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg font-semibold"
                >
                  Simpan Kemaskini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Padam Unit - Pengalihan Fail */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold">Padam Unit & Pengalihan Fail</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Adakah anda pasti mahu memadam unit <strong>"{unitToDelete.unit.name}"</strong>? Sila pilih tindakan pengalihan bagi dokumen di bawah unit ini:
            </p>

            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="unitReassign"
                  value="general"
                  checked={unitFallbackChoice === 'general'}
                  onChange={() => setUnitFallbackChoice('general')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Alih ke Status General (Unit Pengurusan Am)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Fail akan berstatus Am untuk diassign semula kemudian.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-700">
                <input
                  type="radio"
                  name="unitReassign"
                  value="sibling"
                  checked={unitFallbackChoice === 'sibling'}
                  onChange={() => setUnitFallbackChoice('sibling')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Alih ke Unit Sejabatan Lain
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Pilih unit pengganti dalam jabatan yang sama.
                  </span>
                </div>
              </label>

              {unitFallbackChoice === 'sibling' && (
                <div className="pl-6 pt-2">
                  <select
                    value={unitTargetFallbackId}
                    onChange={(e) => setUnitTargetFallbackId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    {departments
                      .find((d) => d.id === unitToDelete.deptId)
                      ?.units.filter((u) => u.id !== unitToDelete.unit.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.code})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUnitToDelete(null)}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUnit}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs"
              >
                Padam Unit & Alih Fail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
