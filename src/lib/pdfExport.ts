/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { ActivityLog, DmsDocument } from '../types/dms';
import { formatBytes } from './imageCompressor';

export function exportDocumentsReportPDF(
  documents: DmsDocument[],
  generatedBy: string,
  departmentName = 'Semua Jabatan'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('ARKADMS - SISTEM PENGURUSAN DOKUMEN', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Laporan Inventori Arkib Digital & Kawalan Keselamatan Berperingkat', 14, 19);

  // Metadata block
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  const now = new Date().toLocaleString('ms-MY', { dateStyle: 'full', timeStyle: 'short' });
  doc.text(`Dijana Oleh: ${generatedBy}`, 14, 36);
  doc.text(`Jabatan / Skop: ${departmentName}`, 14, 42);
  doc.text(`Tarikh Cetakan: ${now}`, 14, 48);

  // Summary KPI box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(14, 53, pageWidth - 28, 20, 'FD');

  const totalDocs = documents.length;
  const confidentialCount = documents.filter((d) => d.isConfidential).length;
  const encryptedCount = documents.filter((d) => d.isEncrypted).length;
  const totalSavedBytes = documents.reduce((acc, d) => {
    if (d.attachmentSizeOriginal && d.attachmentSizeCompressed) {
      return acc + (d.attachmentSizeOriginal - d.attachmentSizeCompressed);
    }
    return acc;
  }, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  doc.text(`Jumlah Fail: ${totalDocs}`, 20, 64);
  doc.text(`Fail Sulit: ${confidentialCount}`, 65, 64);
  doc.text(`Terenkripsi E2EE: ${encryptedCount}`, 110, 64);
  doc.text(`Storan Dijimatkan: ${formatBytes(totalSavedBytes)}`, 155, 64);

  // Table header
  let y = 82;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  doc.text('BIL', 16, y + 5.5);
  doc.text('TAJUK DOKUMEN', 26, y + 5.5);
  doc.text('KATEGORI', 85, y + 5.5);
  doc.text('VERSI', 125, y + 5.5);
  doc.text('KLASIFIKASI', 145, y + 5.5);
  doc.text('TARIKH', 175, y + 5.5);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  documents.forEach((item, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // Row alternating background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, pageWidth - 28, 7.5, 'F');
    }

    const titleTruncated = item.title.length > 32 ? item.title.substring(0, 30) + '...' : item.title;
    const catTruncated = item.category.length > 20 ? item.category.substring(0, 18) + '..' : item.category;
    const dateFormatted = new Date(item.updatedAt || item.createdAt).toLocaleDateString('ms-MY');

    doc.text(String(index + 1), 16, y + 1);
    doc.text(titleTruncated, 26, y + 1);
    doc.text(catTruncated, 85, y + 1);
    doc.text(`v${item.currentVersion}`, 125, y + 1);

    if (item.isConfidential) {
      doc.setTextColor(185, 28, 28); // red-700
      doc.text(item.clearanceRequired || 'SULIT', 145, y + 1);
      doc.setTextColor(51, 65, 85);
    } else {
      doc.text('TERBUKA', 145, y + 1);
    }

    doc.text(dateFormatted, 175, y + 1);

    y += 8;
  });

  // Footer seal
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(203, 213, 225);
  doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen ini dijana secara automatik oleh ArkaDMS dengan integriti audit bersiri.', 14, pageHeight - 10);
  doc.text(`Halaman 1 / 1`, pageWidth - 30, pageHeight - 10);

  doc.save(`Laporan_Inventori_ArkaDMS_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportActivityLogsReportPDF(logs: ActivityLog[], generatedBy: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('ARKADMS - LOG AUDIT KESELAMATAN', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Rekod Jejak Audit Masa Nyata & Akses Dokumen Rasmi', 14, 19);

  // Metadata
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.text(`Pegawai Pengesah: ${generatedBy}`, 14, 36);
  doc.text(`Jumlah Rekod Aktiviti: ${logs.length}`, 14, 42);
  doc.text(`Tarikh: ${new Date().toLocaleString('ms-MY')}`, 14, 48);

  // Table Header
  let y = 56;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  doc.text('MASA', 16, y + 5.5);
  doc.text('PENGGUNA', 42, y + 5.5);
  doc.text('PERANAN', 80, y + 5.5);
  doc.text('TINDAKAN', 105, y + 5.5);
  doc.text('BUTIRAN KESELAMATAN', 145, y + 5.5);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  logs.slice(0, 45).forEach((log, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, pageWidth - 28, 7.5, 'F');
    }

    const timeStr = new Date(log.timestamp).toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const userTruncated = log.userName.length > 18 ? log.userName.substring(0, 16) + '..' : log.userName;
    const detailTruncated = log.details.length > 36 ? log.details.substring(0, 34) + '..' : log.details;

    doc.text(timeStr, 16, y + 1);
    doc.text(userTruncated, 42, y + 1);
    doc.text(log.userRole.toUpperCase(), 80, y + 1);

    if (log.action === 'CUBAAN_AKSES_DITOLAK') {
      doc.setTextColor(220, 38, 38);
      doc.text(log.action, 105, y + 1);
      doc.setTextColor(51, 65, 85);
    } else {
      doc.text(log.action, 105, y + 1);
    }

    doc.text(detailTruncated, 145, y + 1);

    y += 7.5;
  });

  doc.save(`Log_Audit_ArkaDMS_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportDocumentsToCSV(documents: DmsDocument[]): void {
  const headers = [
    'ID',
    'Tajuk Dokumen',
    'Kategori',
    'Kategori Tugasan',
    'Versi',
    'Status Sulit',
    'Tahap Keselamatan',
    'Terenkripsi E2EE',
    'Pengarang',
    'Pengubah Terakhir',
    'Saiz Asal (Bytes)',
    'Saiz Mampat (Bytes)',
    'Tarikh Dicipta',
    'Tarikh Dikemaskini',
  ];

  const rows = documents.map((doc) => [
    doc.id,
    `"${(doc.title || '').replace(/"/g, '""')}"`,
    `"${(doc.category || '').replace(/"/g, '""')}"`,
    `"${(doc.taskCategory || '').replace(/"/g, '""')}"`,
    doc.currentVersion,
    doc.isConfidential ? 'SULIT' : 'BIASA',
    doc.clearanceRequired,
    doc.isEncrypted ? 'YA' : 'TIDAK',
    `"${(doc.authorName || '').replace(/"/g, '""')}"`,
    `"${(doc.lastModifiedBy || '').replace(/"/g, '""')}"`,
    doc.attachmentSizeOriginal || 0,
    doc.attachmentSizeCompressed || 0,
    doc.createdAt,
    doc.updatedAt,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Dokumen_ArkaDMS_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportActivityLogsToCSV(logs: ActivityLog[]): void {
  const headers = ['ID', 'Masa & Tarikh', 'Pengguna', 'Peranan', 'Tindakan', 'Tajuk Dokumen', 'Butiran Audit'];

  const rows = logs.map((log) => [
    log.id,
    log.timestamp,
    `"${(log.userName || '').replace(/"/g, '""')}"`,
    log.userRole,
    log.action,
    `"${(log.documentTitle || '').replace(/"/g, '""')}"`,
    `"${(log.details || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Log_Audit_ArkaDMS_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
