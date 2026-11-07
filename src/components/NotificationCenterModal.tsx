/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EmailNotification } from '../types/dms';
import { X, Mail, CheckCircle2, Clock, AlertTriangle, Send } from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EmailNotification[];
  onMarkAllAsRead: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}) => {
  const [selectedNotif, setSelectedNotif] = useState<EmailNotification | null>(
    notifications[0] || null
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pusat Notifikasi Emel Automatik ETS Document Management
              </h3>
              <p className="text-xs text-slate-500">
                Penghantaran emel automatik untuk insiden keselamatan, kelulusan semakan dan penugasan fail.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Pane Split: List of Emails on Left, Preview on Right */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 overflow-hidden">
          {/* Notification List (2 cols) */}
          <div className="md:col-span-2 border-r border-slate-200 dark:border-slate-800 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-slate-400">Tiada notifikasi emel dalam peti keluar.</p>
            ) : (
              notifications.map((notif) => {
                const isSelected = selectedNotif?.id === notif.id;
                return (
                  <button
                    key={notif.id}
                    onClick={() => setSelectedNotif(notif)}
                    className={`w-full text-left p-3.5 transition-colors ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800/80'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {notif.recipientName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(notif.timestamp).toLocaleTimeString('ms-MY', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white truncate mb-0.5">
                      {notif.subject}
                    </p>
                    <p className="text-slate-500 line-clamp-1 text-[11px]">{notif.body}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Berjaya Dihantar
                      </span>
                      {notif.priority === 'urgent' && (
                        <span className="text-[10px] text-rose-600 font-bold uppercase ml-auto">Kecemasan</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Email Preview Pane (3 cols) */}
          <div className="md:col-span-3 p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/30 space-y-4 text-xs">
            {selectedNotif ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
                {/* Email Header */}
                <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Penerima:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {selectedNotif.recipientName} &lt;{selectedNotif.recipientEmail}&gt;
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Pengirim Sistem:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      notifikasi-automatik@arkadms.gov.my
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cap Waktu:</span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {new Date(selectedNotif.timestamp).toLocaleString('ms-MY')}
                    </span>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedNotif.subject}
                    </p>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 font-sans text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedNotif.body}
                </div>

                {/* Governmental Footer Signoff */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                  <p className="font-medium text-slate-600 dark:text-slate-300">
                    Sistem Pengurusan Dokumen & Kolaborasi Selamat ETS Document Management
                  </p>
                  <p>E-mel ini dijana secara automatik oleh pangkalan data Firebase Cloud Functions.</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Pilih mana-mana notifikasi emel di sebelah kiri untuk melihat pratonton penuh.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {notifications.length} e-mel automatik telah didaftarkan dalam sistem
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
