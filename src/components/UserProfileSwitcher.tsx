/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, UserRole, isSuperAdmin } from '../types/dms';
import {
  Shield,
  ChevronDown,
  LogIn,
  LogOut,
  Lock,
  Building2,
  Calendar,
  CheckCircle2,
  Mail,
  User,
} from 'lucide-react';

interface UserProfileSwitcherProps {
  currentUser: UserProfile | null;
  availableUsers?: UserProfile[];
  onSwitchUser?: (user: UserProfile) => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isGoogleAuthenticated: boolean;
  googleUserEmail?: string | null;
}

export const UserProfileSwitcher: React.FC<UserProfileSwitcherProps> = ({
  currentUser,
  onLogout,
  onOpenLoginModal,
  onGoogleSignIn,
  onGoogleSignOut,
  isGoogleAuthenticated,
  googleUserEmail,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900';
      case 'editor':
        return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900';
      case 'viewer':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900';
    }
  };

  // Paparan apabila tiada sesi aktif (Guest Mode)
  if (!currentUser) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenLoginModal}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs text-xs font-semibold cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Tiada Sesi Aktif · Log Masuk Rasmi</span>
        </button>
      </div>
    );
  }

  const isSuperAdminUser = isSuperAdmin(currentUser);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs cursor-pointer"
      >
        <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.displayName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
              {currentUser.displayName}
            </span>
            <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              #{currentUser.serviceNumber || '882104'}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${getRoleBadgeStyle(currentUser.role)}`}>
              {currentUser.role.toUpperCase()}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              {currentUser.clearanceLevel === 'RAHSIA_BESAR' ? 'P&C' : currentUser.clearanceLevel}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
            {(currentUser.departmentName || 'Jabatan').split('&')[0]} · Luput: <span className="font-mono">{currentUser.expiryDate || '2028-12-31'}</span>
          </p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 p-4 space-y-3.5">
            {/* Header: Sesi ID Aktif */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Profil & Sesi Aktif</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Pengenalan anggota bertugas semasa</p>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-900">
                No. Servis: {currentUser.serviceNumber || '882104'}
              </span>
            </div>

            {/* Kad Maklumat ID Pengguna yang Login Sahaja */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {currentUser.displayName}
                    </p>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded">
                      #{currentUser.serviceNumber}
                    </span>
                    {isSuperAdminUser && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                        SUPER ADMIN
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${getRoleBadgeStyle(currentUser.role)}`}>
                      {currentUser.role}
                    </span>
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                      {currentUser.clearanceLevel === 'RAHSIA_BESAR' ? 'P&C' : currentUser.clearanceLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Department, Unit & Expiry */}
              <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{currentUser.departmentName} · {currentUser.unitName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Akaun Sah Sehingga: <strong className="font-mono text-slate-800 dark:text-slate-200">{currentUser.expiryDate || '2028-12-31'}</strong></span>
                </div>
              </div>
            </div>

            {/* Notis Keselamatan Capaian (Sesi Tunggal) */}
            <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                <p className="font-semibold">Keselamatan Capaian:</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Sesi ini dikunci khusus pada ID #{currentUser.serviceNumber}. Untuk menukar pengguna bertugas, sila tamatkan sesi aktif ini terlebih dahulu dan log masuk semula.
                </p>
              </div>
            </div>

            {/* Butang Log Keluar (Logout) */}
            {onLogout && (
              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Tamatkan Sesi (Log Keluar)</span>
                </button>
              </div>
            )}

            {/* Google Authentication Box */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 mb-1.5">
                Penyelarasan Google Workspace & Storage
              </p>
              {isGoogleAuthenticated ? (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs">
                  <div className="truncate pr-2">
                    <p className="font-medium text-slate-900 dark:text-white truncate">Google Auth Aktif</p>
                    <p className="text-[10px] text-slate-500 truncate">{googleUserEmail}</p>
                  </div>
                  <button
                    onClick={onGoogleSignOut}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded transition-colors"
                    title="Log Keluar Google"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-600" />
                  <span>Log Masuk Akaun Google</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
