/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ActivityLog, ActionType } from '../types/dms';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Clock,
  User,
  FileText,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface AuditLogViewProps {
  logs: ActivityLog[];
  onExportPDF: () => void;
  onExportCSV: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onExportPDF, onExportCSV }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('Semua');
  const [filterConfidentialOnly, setFilterConfidentialOnly] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = log.userName.toLowerCase().includes(q);
        const matchesDoc = log.documentTitle?.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q);
        if (!matchesUser && !matchesDoc && !matchesDetails && !matchesAction) return false;
      }

      if (selectedAction !== 'Semua' && log.action !== selectedAction) {
        return false;
      }

      if (filterConfidentialOnly && !log.isConfidential && log.action !== 'CUBAAN_AKSES_DITOLAK') {
        return false;
      }

      return true;
    });
  }, [logs, searchQuery, selectedAction, filterConfidentialOnly]);

  const getActionBadge = (action: ActionType) => {
    switch (action) {
      case 'CUBAAN_AKSES_DITOLAK':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900';
      case 'AKSES_SULIT':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900';
      case 'CIPTA_DOKUMEN':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900';
      case 'KEMASKINI_DOKUMEN':
      case 'TANDAI_REVISI':
        return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900';
      case 'PADAM_DOKUMEN':
        return 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900';
      default:
        return 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span>Log Audit Aktiviti & Pengawasan Keselamatan (Masa Nyata)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Jejak rekod lengkap setiap pembukaan fail sulit, suntingan versi, komen, dan percubaan capaian tidak sah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Eksport Log PDF</span>
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Eksport CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari log mengikut nama pegawai, tajuk dokumen, atau butiran..."
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 shrink-0 font-medium">Tindakan:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
          >
            <option value="Semua">Semua Tindakan</option>
            <option value="AKSES_SULIT">Akses Sulit Sah</option>
            <option value="CUBAAN_AKSES_DITOLAK">Cubaan Akses Ditolak</option>
            <option value="CIPTA_DOKUMEN">Cipta Dokumen</option>
            <option value="KEMASKINI_DOKUMEN">Kemaskini Dokumen</option>
            <option value="TANDAI_REVISI">Tandai Revisi</option>
            <option value="TAMBAH_KOMEN">Tambah Komen</option>
            <option value="PADAM_DOKUMEN">Padam Dokumen</option>
            <option value="SEGERAK_LUAR_TALIAN">Segerak Luar Talian</option>
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={filterConfidentialOnly}
              onChange={(e) => setFilterConfidentialOnly(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Insiden Sulit Sahaja</span>
          </label>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Masa & Tarikh</th>
                <th className="px-4 py-3">Pegawai Terlibat</th>
                <th className="px-4 py-3">Peranan</th>
                <th className="px-4 py-3">Klasifikasi Tindakan</th>
                <th className="px-5 py-3">Dokumen & Butiran Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tiada rekod log sepadan dengan penapis yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono tabular-nums text-slate-500">
                      <div>{new Date(log.timestamp).toLocaleDateString('ms-MY')}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString('ms-MY', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="px-4 py-3.5 uppercase font-medium text-[11px] text-slate-500 whitespace-nowrap">
                      {log.userRole}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {log.documentTitle && (
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                          {log.documentTitle}
                        </p>
                      )}
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">{log.details}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
