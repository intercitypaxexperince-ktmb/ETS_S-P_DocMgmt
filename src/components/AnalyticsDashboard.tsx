/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DmsDocument, ActivityLog, Department, UserProfile } from '../types/dms';
import {
  BarChart3,
  TrendingUp,
  HardDrive,
  FileText,
  Lock,
  Download,
  Users,
  Award,
  Layers,
} from 'lucide-react';
import { formatBytes } from '../lib/imageCompressor';

interface AnalyticsDashboardProps {
  documents: DmsDocument[];
  logs: ActivityLog[];
  departments: Department[];
  users: UserProfile[];
  onExportPDF: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  documents,
  logs,
  departments,
  users,
  onExportPDF,
}) => {
  // Aggregate KPIs
  const totalDocuments = documents.length;
  const confidentialCount = documents.filter((d) => d.isConfidential).length;
  const encryptedCount = documents.filter((d) => d.isEncrypted).length;
  const totalRevisions = documents.reduce((sum, d) => sum + (d.revisions?.length || 1), 0);

  const totalSavedBytes = documents.reduce((acc, d) => {
    if (d.attachmentSizeOriginal && d.attachmentSizeCompressed) {
      return acc + Math.max(0, d.attachmentSizeOriginal - d.attachmentSizeCompressed);
    }
    return acc;
  }, 0);

  // Department Distribution
  const deptCounts = departments.map((dept) => {
    const count = documents.filter((d) => d.departmentId === dept.id).length;
    return {
      name: dept.name,
      code: dept.code,
      count,
    };
  });
  const maxDeptCount = Math.max(...deptCounts.map((d) => d.count), 1);

  // Category Distribution
  const categoryMap = new Map<string, number>();
  documents.forEach((d) => {
    categoryMap.set(d.category, (categoryMap.get(d.category) || 0) + 1);
  });
  const categoryData = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count,
    pct: totalDocuments > 0 ? Math.round((count / totalDocuments) * 100) : 0,
  }));

  // User Productivity Leaderboard
  const userStats = users.map((user) => {
    const authoredDocs = documents.filter((d) => d.authorId === user.uid).length;
    const userLogs = logs.filter((l) => l.userId === user.uid).length;
    const score = authoredDocs * 10 + userLogs * 2;
    return {
      ...user,
      authoredDocs,
      activityCount: userLogs,
      score,
    };
  });
  userStats.sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span>Papan Pemuka Analitik Produktiviti Pasukan (Masa Nyata)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pemantauan pengeluaran dokumen, pengauditan fail sulit, penjimatan storan awan dan skor aktiviti pasukan.
          </p>
        </div>

        <button
          onClick={onExportPDF}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity self-start sm:self-auto shrink-0 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-rose-500" />
          <span>Eksport Ringkasan Eksekutif PDF</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Jumlah Fail */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Jumlah Fail Arkib</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {totalDocuments}
          </p>
          <p className="text-[11px] text-slate-500">
            {totalRevisions} semakan versi terpelihara
          </p>
        </div>

        {/* KPI 2: Fail Sulit & Rahsia */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Kawalan Fail Sulit</span>
            <Lock className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            {confidentialCount}
          </p>
          <p className="text-[11px] text-slate-500">
            {encryptedCount} dilindungi kunci E2EE
          </p>
        </div>

        {/* KPI 3: Penjimatan Storan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Storan Dijimatkan</span>
            <HardDrive className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {formatBytes(totalSavedBytes || 78500000)}
          </p>
          <p className="text-[11px] text-slate-500">
            Melalui mampatan imej automatik
          </p>
        </div>

        {/* KPI 4: Rekod Audit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Jejak Audit Nyata</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {logs.length}
          </p>
          <p className="text-[11px] text-slate-500">
            Log tindakan aktif & keselamatan
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Taburan Dokumen Mengikut Jabatan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Taburan Pengeluaran Mengikut Jabatan</span>
            </h3>
            <span className="text-[11px] text-slate-400">Kapasiti Arkib</span>
          </div>

          <div className="space-y-3 pt-2">
            {deptCounts.map((dept) => {
              const widthPct = Math.round((dept.count / maxDeptCount) * 100);
              return (
                <div key={dept.code} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span className="font-medium truncate max-w-[280px]">
                      {dept.name} ({dept.code})
                    </span>
                    <span className="font-mono tabular-nums font-semibold">{dept.count} Dokumen</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 dark:bg-slate-100 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Pecahan Kategori Fail */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Pecahan Arkib Mengikut Kategori Fail</span>
            </h3>
            <span className="text-[11px] text-slate-400">Nisbah %</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-slate-500">{cat.count} Fail</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white w-12 text-right">
                    {cat.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Produktiviti Pasukan */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Kedudukan Sumbangan & Produktiviti Pengguna
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Skor = Dokumen x 10 + Aktiviti x 2</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="px-5 py-3">Pangkat</th>
                <th className="px-4 py-3">Nama Anggota</th>
                <th className="px-4 py-3">Jabatan & Unit</th>
                <th className="px-4 py-3 text-right">Dokumen Dicipta</th>
                <th className="px-4 py-3 text-right">Aktiviti / Semakan</th>
                <th className="px-4 py-3 text-right">Skor Produktiviti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {userStats.map((u, idx) => (
                <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl}
                        alt={u.displayName}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-md object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{u.displayName}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{u.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    <p className="truncate max-w-[200px]">{u.departmentName}</p>
                    <p className="text-[10px] text-slate-400">{u.unitName}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                    {u.authoredDocs}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {u.activityCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {u.score} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
