/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile } from '../types/dms';
import { Plus, Bell, Wifi, WifiOff } from 'lucide-react';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile;
  isOnline: boolean;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenCreateModal: () => void;
  pendingSyncCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  isOnline,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenCreateModal,
  pendingSyncCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
            <img
              src="/src/assets/images/logo_arkadms_seal_1793580726055.jpg"
              alt="ArkaDMS Emblem"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={() => onSelectTab('documents')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
          >
            ArkaDMS
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
          <button
            onClick={() => onSelectTab('organization')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'organization'
                ? 'text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white pb-1 -mb-1'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Hierarki Jabatan
          </button>
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

          {currentUser.role !== 'viewer' ? (
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
