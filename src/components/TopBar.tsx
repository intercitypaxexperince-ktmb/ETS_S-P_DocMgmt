/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile, GoogleStorageConfig, canManageUsers } from '../types/dms';
import { Plus, Bell, Wifi, WifiOff, Cloud, LogIn } from 'lucide-react';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile | null;
  isOnline: boolean;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenCreateModal: () => void;
  onOpenLoginModal?: () => void;
  pendingSyncCount: number;
  storageConfig?: GoogleStorageConfig;
  onOpenStorageSetup?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  isOnline,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenCreateModal,
  onOpenLoginModal,
  pendingSyncCount,
  storageConfig,
  onOpenStorageSetup,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: ETS Logo & Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('documents')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity text-left cursor-pointer"
          >
            <div className="h-9 px-2 py-1 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center shadow-2xs">
              <img
                src="/assets/aistudio/image_f706b2dd.png"
                alt="ETS Logo"
                className="h-6 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap leading-none">
                ETS Document Management
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-1">
                Sistem Pengurusan & Arkib Fail
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectTab('documents')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'documents'
                ? 'text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white pb-1 -mb-1'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Dokumen & Paper
          </button>

          {canManageUsers(currentUser) && (
            <button
              onClick={() => onSelectTab('categories')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'categories'
                  ? 'text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white pb-1 -mb-1'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Kategori Fail
            </button>
          )}

          {canManageUsers(currentUser) && (
            <button
              onClick={() => onSelectTab('groups')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'groups'
                  ? 'text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white pb-1 -mb-1'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Kumpulan Pengguna
            </button>
          )}

          {canManageUsers(currentUser) && (
            <button
              onClick={() => onSelectTab('users')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'users'
                  ? 'text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white pb-1 -mb-1'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Pengurusan Pengguna
            </button>
          )}

          {currentUser && currentUser.role !== 'viewer' && (
            <button
              onClick={() => onSelectTab('organization')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'organization'
                  ? 'text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white pb-1 -mb-1'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Modul Jabatan
            </button>
          )}

          <button
            onClick={() => onSelectTab('analytics')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'analytics'
                ? 'text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white pb-1 -mb-1'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Analitik & Log
          </button>
        </nav>

        {/* Zone 3: 1 primary action area */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md ${
              isOnline
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
            }`}
            title={isOnline ? 'Awan Firebase Aktif' : 'Mod Luar Talian'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            <span className="font-mono text-[11px] whitespace-nowrap">
              {isOnline ? (pendingSyncCount > 0 ? `Segerak (${pendingSyncCount})` : 'Awan Aktif') : 'Luar Talian'}
            </span>
          </div>

          {canManageUsers(currentUser) && onOpenStorageSetup && (
            <button
              onClick={onOpenStorageSetup}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Tetapan Storan Fail & Arkib Google Cloud"
            >
              <Cloud className={`w-3.5 h-3.5 ${storageConfig?.isConfigured ? 'text-blue-600 dark:text-blue-400' : 'text-amber-500'}`} />
              <span className="font-mono text-[11px] whitespace-nowrap">
                {storageConfig?.isConfigured ? 'G-Storage' : 'Setup Storan'}
              </span>
            </button>
          )}

          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Pusat Notifikasi Emel Automatik"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          {!currentUser ? (
            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log Masuk Rasmi</span>
            </button>
          ) : currentUser.role !== 'viewer' ? (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Daftar Paper Baharu</span>
            </button>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 font-medium">
              Mod Baca Sahaja
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
