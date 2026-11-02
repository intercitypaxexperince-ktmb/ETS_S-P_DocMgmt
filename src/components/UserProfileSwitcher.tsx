/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types/dms';
import { Shield, ChevronDown, LogIn, LogOut, Check } from 'lucide-react';

interface UserProfileSwitcherProps {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isGoogleAuthenticated: boolean;
  googleUserEmail?: string | null;
}

export const UserProfileSwitcher: React.FC<UserProfileSwitcherProps> = ({
  currentUser,
  availableUsers,
  onSwitchUser,
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

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
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
              #{currentUser.serviceNumber}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${getRoleBadgeStyle(currentUser.role)}`}>
              {currentUser.role.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
            {currentUser.departmentName.split('&')[0]} · Luput: <span className="font-mono">{currentUser.expiryDate}</span>
          </p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-84 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 p-3 space-y-3">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Profil & Sesi Aktif</p>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-900">
                  No. Servis: {currentUser.serviceNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Akaun sah sehingga <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{currentUser.expiryDate}</span> ({currentUser.unitName}).
              </p>
            </div>

            {/* Persona Switcher List */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                Tukar Anggota Bertugas
              </p>
              {availableUsers.map((user) => {
                const isSelected = user.uid === currentUser.uid;
                const isExpired = new Date(user.expiryDate) < new Date();
                return (
                  <button
                    key={user.uid}
                    onClick={() => {
                      onSwitchUser(user);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-md object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium leading-none truncate">{user.displayName}</p>
                          <span className="text-[9px] font-mono font-semibold px-1 py-0.2 bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded">
                            {user.serviceNumber}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {user.role.toUpperCase()} · {user.unitName} · <span className={isExpired ? 'text-rose-500 font-semibold' : ''}>Luput: {user.expiryDate}</span>
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {/* Google Authentication Box */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 mb-1.5">
                Pengesahan Firebase Awan
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
