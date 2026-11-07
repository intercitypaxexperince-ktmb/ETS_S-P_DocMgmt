/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types/dms';
import {
  Shield,
  ChevronDown,
  LogIn,
  LogOut,
  Check,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  X,
  UserCheck,
} from 'lucide-react';

interface UserProfileSwitcherProps {
  currentUser: UserProfile | null;
  availableUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isGoogleAuthenticated: boolean;
  googleUserEmail?: string | null;
}

export const UserProfileSwitcher: React.FC<UserProfileSwitcherProps> = ({
  currentUser,
  availableUsers,
  onSwitchUser,
  onLogout,
  onOpenLoginModal,
  onGoogleSignIn,
  onGoogleSignOut,
  isGoogleAuthenticated,
  googleUserEmail,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Password verification modal state for unauthorized access prevention
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleInitiateSwitch = (user: UserProfile) => {
    if (currentUser && user.uid === currentUser.uid) {
      setIsOpen(false);
      return;
    }
    setTargetUser(user);
    setPasswordInput('');
    setShowPassword(false);
    setErrorMessage(null);
    setIsPasswordModalOpen(true);
    setIsOpen(false);
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    // Check valid password from user profile with fallback to service default
    const expectedPassword =
      targetUser.password ||
      (targetUser.role === 'admin'
        ? targetUser.serviceNumber === '990001'
          ? 'AdminSuper123!'
          : 'Admin882104!'
        : targetUser.role === 'editor'
        ? 'User551203!'
        : 'User339102!');

    if (!passwordInput.trim()) {
      setErrorMessage('Sila masukkan kata laluan.');
      return;
    }

    if (passwordInput.trim() !== expectedPassword.trim()) {
      setErrorMessage('Kata laluan tidak tepat. Capaian tidak sah disekat.');
      return;
    }

    onSwitchUser(targetUser);
    setIsPasswordModalOpen(false);
    setTargetUser(null);
    setPasswordInput('');
    setErrorMessage(null);
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
          <div className="absolute right-0 mt-2 w-84 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 p-3 space-y-3">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Profil & Sesi Aktif</p>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-900">
                  No. Servis: {currentUser.serviceNumber || '882104'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Akaun sah sehingga <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{currentUser.expiryDate || '2028-12-31'}</span> ({currentUser.unitName || 'Unit Pentadbiran'}).
              </p>
            </div>

            {/* Persona Switcher List (Strictly Protected with Password Verification) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                  Tukar Anggota Bertugas
                </p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Perlu Kata Laluan
                </span>
              </div>

              {availableUsers.map((user) => {
                const isSelected = user.uid === currentUser.uid;
                const isExpired = user.expiryDate ? new Date(user.expiryDate).getTime() < new Date().getTime() : false;
                const sNum = user.serviceNumber || '882104';
                const expDate = user.expiryDate || '2028-12-31';

                return (
                  <button
                    key={user.uid}
                    onClick={() => handleInitiateSwitch(user)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium ring-1 ring-slate-300 dark:ring-slate-700'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
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
                            #{sNum}
                          </span>
                          {user.email === 'intercity.pax.experince@gmail.com' && (
                            <span className="text-[9px] font-bold px-1 py-0.2 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {user.role.toUpperCase()} · <strong className="text-rose-600 dark:text-rose-400 font-mono font-semibold">{user.clearanceLevel === 'RAHSIA_BESAR' ? 'P&C' : user.clearanceLevel}</strong> · {user.unitName} · <span className={isExpired ? 'text-rose-500 font-semibold' : ''}>Luput: {expDate}</span>
                        </p>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0 ml-1" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tamatkan Sesi (Log Keluar) */}
            {onLogout && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Tamatkan Sesi (Log Keluar)</span>
                </button>
              </div>
            )}

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

      {/* Password Verification Modal for Switching Users */}
      {isPasswordModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-lg">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pengesahan Kata Laluan Sesi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kawalan capaian keselamatan untuk pertukaran akaun pengguna
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setTargetUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Account Summary */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl">
                <img
                  src={targetUser.avatarUrl}
                  alt={targetUser.displayName}
                  className="w-10 h-10 rounded-lg object-cover bg-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {targetUser.displayName}
                    </p>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      #{targetUser.serviceNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {targetUser.departmentName} · {targetUser.unitName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${getRoleBadgeStyle(targetUser.role)}`}>
                      {targetUser.role}
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {targetUser.clearanceLevel}
                    </span>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Password Form */}
              <form onSubmit={handleConfirmSwitch} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kata Laluan Akaun #{targetUser.serviceNumber} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Masukkan kata laluan akaun..."
                      className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordModalOpen(false);
                      setTargetUser(null);
                      setPasswordInput('');
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl shadow-xs transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Sahkan & Tukar Sesi</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
