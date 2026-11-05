/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserGroup,
  UserProfile,
  GroupPermission,
  canManageUsers,
  isSuperAdmin,
} from '../types/dms';
import {
  Users,
  Plus,
  Shield,
  Edit2,
  Trash2,
  CheckCircle2,
  UserCheck,
  Search,
  Lock,
  Eye,
  MessageSquare,
  FileEdit,
  Sparkles,
  X,
  Building2,
  User,
} from 'lucide-react';

interface UserGroupModuleProps {
  groups: UserGroup[];
  users: UserProfile[];
  currentUser: UserProfile;
  onCreateGroup: (group: Omit<UserGroup, 'id' | 'createdAt'>) => void;
  onUpdateGroup: (id: string, updates: Partial<UserGroup>) => void;
  onDeleteGroup: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const PERMISSION_CONFIG: Record<
  GroupPermission,
  {
    label: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  view_only: {
    label: 'Lihat Sahaja',
    description: 'Boleh membaca kandungan dokumen dan memuat turun fail rujukan.',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    icon: Eye,
  },
  review_only: {
    label: 'Semak & Komen Sahaja',
    description: 'Boleh membaca, menandai cadangan revisi, dan meninggalkan komen ulasan.',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    icon: MessageSquare,
  },
  edit_only: {
    label: 'Sunting Sahaja',
    description: 'Boleh menyunting kandungan teks, memuat naik dokumen gantian, dan kemaskini versi.',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    icon: FileEdit,
  },
  all: {
    label: 'Akses Penuh',
    description: 'Kawalan penuh termasuk kelulusan status aliran paper, tetapan sekatan dan muat naik.',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    icon: Sparkles,
  },
};

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Biru', ring: 'ring-blue-500', bg: 'bg-blue-500' },
  { value: 'emerald', label: 'Hijau Zamrud', ring: 'ring-emerald-500', bg: 'bg-emerald-500' },
  { value: 'purple', label: 'Ungu Diraja', ring: 'ring-purple-500', bg: 'bg-purple-500' },
  { value: 'amber', label: 'Emas / Jingga', ring: 'ring-amber-500', bg: 'bg-amber-500' },
  { value: 'rose', label: 'Merah Jambu', ring: 'ring-rose-500', bg: 'bg-rose-500' },
  { value: 'indigo', label: 'Indigo', ring: 'ring-indigo-500', bg: 'bg-indigo-500' },
  { value: 'slate', label: 'Kelabu Neutral', ring: 'ring-slate-500', bg: 'bg-slate-500' },
];

export const UserGroupModule: React.FC<UserGroupModuleProps> = ({
  groups,
  users,
  currentUser,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onShowToast,
}) => {
  const isAdmin = canManageUsers(currentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [permissionFilter, setPermissionFilter] = useState<'semua' | GroupPermission>('semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermission, setFormPermission] = useState<GroupPermission>('view_only');
  const [formColor, setFormColor] = useState('blue');
  const [formMemberIds, setFormMemberIds] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPerm = permissionFilter === 'semua' || g.permission === permissionFilter;
    return matchesSearch && matchesPerm;
  });

  const handleOpenCreateModal = () => {
    setEditingGroup(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormPermission('review_only');
    setFormColor('blue');
    setFormMemberIds([currentUser.uid]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (group: UserGroup) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormCode(group.code);
    setFormDescription(group.description);
    setFormPermission(group.permission);
    setFormColor(group.color || 'blue');
    setFormMemberIds(group.memberIds || []);
    setIsModalOpen(true);
  };

  const handleToggleMember = (uid: string) => {
    setFormMemberIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onShowToast('Nama Diperlukan', 'Sila masukkan nama kumpulan.', 'error');
      return;
    }
    if (!formCode.trim()) {
      onShowToast('Kod Diperlukan', 'Sila masukkan kod singkatan kumpulan.', 'error');
      return;
    }

    if (editingGroup) {
      onUpdateGroup(editingGroup.id, {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim(),
        permission: formPermission,
        color: formColor,
        memberIds: formMemberIds,
      });
      onShowToast('Kumpulan Dikemaskini', `Kumpulan "${formName}" berjaya disimpan.`, 'success');
    } else {
      onCreateGroup({
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim(),
        permission: formPermission,
        color: formColor,
        memberIds: formMemberIds,
        createdBy: currentUser.displayName,
      });
      onShowToast('Kumpulan Dicipta', `Kumpulan baharu "${formName}" berjaya diwujudkan.`, 'success');
    }
    setIsModalOpen(false);
  };

  const filteredUsersForMembers = users.filter((u) => {
    const q = memberSearchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.serviceNumber.toLowerCase().includes(q) ||
      u.departmentName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Pengurusan Kumpulan Pengguna & Matriks Kebenaran
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Cipta kumpulan kerja kolaboratif dan tetapkan tahap capaian (Lihat, Semak/Komen, Sunting, atau Akses Penuh). Fail dan folder boleh ditugaskan terus kepada kumpulan ini.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin ? (
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Cipta Kumpulan Baharu</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 rounded-md text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Mod Paparan (Pentadbir Sahaja Boleh Sunting)</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama kumpulan, kod atau skop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setPermissionFilter('semua')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                permissionFilter === 'semua'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Semua ({groups.length})
            </button>
            {(Object.keys(PERMISSION_CONFIG) as GroupPermission[]).map((pKey) => {
              const count = groups.filter((g) => g.permission === pKey).length;
              return (
                <button
                  key={pKey}
                  onClick={() => setPermissionFilter(pKey)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                    permissionFilter === pKey
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {PERMISSION_CONFIG[pKey].label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Groups Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGroups.map((group) => {
          const permMeta = PERMISSION_CONFIG[group.permission] || PERMISSION_CONFIG.view_only;
          const PermIcon = permMeta.icon;
          const isUserMember = group.memberIds?.includes(currentUser.uid);
          const membersList = users.filter((u) => group.memberIds?.includes(u.uid));

          return (
            <div
              key={group.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                isUserMember
                  ? 'border-indigo-300 dark:border-indigo-800/80 ring-1 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Card Top: Code badge & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {group.code}
                    </span>
                    {isUserMember && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                        <UserCheck className="w-3 h-3" />
                        Anda Ahli
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(group)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Kemaskini Kumpulan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Adakah anda pasti ingin memadam kumpulan "${group.name}"? Dokumen yang ditugaskan kepada kumpulan ini akan dialihkan.`
                            )
                          ) {
                            onDeleteGroup(group.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Padam Kumpulan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Group Title & Description */}
                <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white leading-snug">
                  {group.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {group.description || 'Tiada penerangan khusus.'}
                </p>

                {/* Permission Badge */}
                <div className="mt-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <PermIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {permMeta.label}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${permMeta.badgeBg} ${permMeta.badgeText}`}
                        >
                          {group.permission}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {permMeta.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members Preview Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {membersList.slice(0, 4).map((member) => (
                      <div
                        key={member.uid}
                        className="w-6 h-6 rounded-full border border-white dark:border-slate-900 overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0"
                        title={`${member.displayName} (#${member.serviceNumber})`}
                      >
                        <img
                          src={member.avatarUrl}
                          alt={member.displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {membersList.length} Anggota Berdaftar
                  </span>
                </div>

                <span className="text-[10px] text-slate-400">
                  Dicipta: {group.createdAt?.split('T')[0] || '2026-01-15'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Tiada Kumpulan Ditemui
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Tiada kumpulan sepadan dengan carian atau penapis kebenaran.
          </p>
        </div>
      )}

      {/* Create / Edit Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Users className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingGroup ? 'Kemaskini Kumpulan Pengguna' : 'Cipta Kumpulan Pengguna Baharu'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Konfigurasikan keahlian dan tahap kebenaran capaian dokumen & folder.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nama Kumpulan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth. Jawatankuasa Penilaian Tender (JPT)"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kod Kumpulan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth. JPT-2026"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs uppercase font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Penerangan & Matlamat Kumpulan
                </label>
                <textarea
                  rows={2}
                  placeholder="Huraikan fungsi atau tugas rasmi kumpulan ini..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Permission Matrix Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tahap Kebenaran Akses (Matriks Hak Cipta & Suntingan)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(PERMISSION_CONFIG) as GroupPermission[]).map((pKey) => {
                    const cfg = PERMISSION_CONFIG[pKey];
                    const Icon = cfg.icon;
                    const isSelected = formPermission === pKey;

                    return (
                      <div
                        key={pKey}
                        onClick={() => setFormPermission(pKey)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {cfg.label}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${cfg.badgeBg} ${cfg.badgeText}`}
                          >
                            {pKey}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {cfg.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Members Selection Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Anggota Kumpulan ({formMemberIds.length} dipilih)
                  </label>
                  <div className="relative w-44">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tapis pengguna..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsersForMembers.map((user) => {
                    const isSelected = formMemberIds.includes(user.uid);
                    return (
                      <div
                        key={user.uid}
                        onClick={() => handleToggleMember(user.uid)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 shrink-0">
                            <img
                              src={user.avatarUrl}
                              alt={user.displayName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-slate-900 dark:text-white">
                                {user.displayName}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                #{user.serviceNumber}
                              </span>
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                                {user.clearanceLevel}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {user.departmentName} · {user.unitName}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg shadow-xs transition-colors"
                >
                  {editingGroup ? 'Simpan Perubahan' : 'Cipta Kumpulan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
