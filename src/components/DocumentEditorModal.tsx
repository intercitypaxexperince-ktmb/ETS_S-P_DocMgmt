/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DmsDocument,
  TaskCategory,
  ClearanceLevel,
  UserProfile,
  Department,
  CustomCategory,
  PaperStatus,
  GoogleStorageConfig,
  DmsFolder,
  UserGroup,
} from '../types/dms';
import {
  X,
  Lock,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  Tag,
  ImageIcon,
  Sparkles,
  Trash2,
  Calendar,
  GitBranch,
  FileCode,
  FileCheck,
  Cloud,
} from 'lucide-react';
import { compressAndResizeImage, CompressionResult, formatBytes } from '../lib/imageCompressor';
import { encryptTextE2EE } from '../lib/crypto';
import { uploadFileToStorage } from '../lib/storage';

interface DocumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (docData: Partial<DmsDocument>, notifyStakeholders: boolean) => Promise<void>;
  initialDoc?: DmsDocument | null;
  currentUser: UserProfile | null;
  departments: Department[];
  categories: CustomCategory[];
  folders?: DmsFolder[];
  groups?: UserGroup[];
  users?: UserProfile[];
  initialFolderId?: string | null;
  isOnline: boolean;
  storageConfig?: GoogleStorageConfig;
  onOpenStorageSetup?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

interface UploadedAttachment {
  id?: string;
  dataUrl: string;
  fileName: string;
  fileType: string;
  originalSize: number;
  compressedSize?: number;
  isImage?: boolean;
  isPdf?: boolean;
}

const TASK_CATEGORIES: TaskCategory[] = [
  'Tugasan Projek',
  'Kelulusan Pengurusan',
  'Audit & Pematuhan',
  'Operasi Harian',
  'Arkib Digital',
];

const PAPER_STATUS_OPTIONS: PaperStatus[] = [
  'Disediakan',
  'Dalam Semakan Jabatan',
  'Pengesahan Kewangan',
  'Semakan Jawatankuasa MPC/Tender',
  'Diluluskan',
  'Pindaan Diperlukan',
  'Simpanan / Rujukan',
  'Selesai & Diarkibkan',
];

export const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDoc,
  currentUser,
  departments,
  categories,
  folders = [],
  groups = [],
  users = [],
  initialFolderId = null,
  isOnline,
  storageConfig,
  onOpenStorageSetup,
  onShowToast,
}) => {
  const isEditing = Boolean(initialDoc);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(categories[0]?.code || 'SOP');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('Tugasan Projek');
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paperStatus, setPaperStatus] = useState<PaperStatus>('Disediakan');
  const [tagsInput, setTagsInput] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  // Folder & Access Assignment State
  const [folderId, setFolderId] = useState<string | null>(initialFolderId || null);
  const [allowedGroups, setAllowedGroups] = useState<string[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [offlineAvailable, setOfflineAvailable] = useState<boolean>(true);

  // Department & Unit
  const [selectedDeptId, setSelectedDeptId] = useState(currentUser?.departmentId || 'dept_it');
  const [selectedUnitId, setSelectedUnitId] = useState(currentUser?.unitId || 'unit_cyber_sec');

  // Security & Clearance
  const [isConfidential, setIsConfidential] = useState(false);
  const [clearanceRequired, setClearanceRequired] = useState<ClearanceLevel>('BIASA');

  // E2EE Encryption
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [passphrase, setPassphrase] = useState('ArkaDMS@2026!');

  // Automated notification trigger
  const [notifyStakeholders, setNotifyStakeholders] = useState(true);

  // File & PDF Attachments State (Multi-file upload support)
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUnits = departments.find((d) => d.id === selectedDeptId)?.units || [];

  useEffect(() => {
    if (initialDoc) {
      setTitle(initialDoc.title);
      setCategory(initialDoc.category);
      setTaskCategory(initialDoc.taskCategory);
      setDocumentDate(initialDoc.documentDate || new Date().toISOString().split('T')[0]);
      setPaperStatus(initialDoc.paperStatus || 'Disediakan');
      setTagsInput(initialDoc.tags?.join(', ') || '');
      setSummary(initialDoc.summary || '');
      setContent(initialDoc.content || '');
      setSelectedDeptId(initialDoc.departmentId || currentUser?.departmentId || 'dept_it');
      setSelectedUnitId(initialDoc.unitId || currentUser?.unitId || 'unit_cyber_sec');
      setIsConfidential(initialDoc.isConfidential);
      const rawClearance = initialDoc.clearanceRequired || 'BIASA';
      setClearanceRequired(rawClearance === 'RAHSIA_BESAR' ? 'P&C' : rawClearance);
      setIsEncrypted(initialDoc.isEncrypted);
      setFolderId(initialDoc.folderId ?? null);
      setAllowedGroups(initialDoc.allowedGroups || []);
      setAllowedUsers(initialDoc.allowedUsers || []);
      setOfflineAvailable(initialDoc.offlineAvailable ?? true);

      // Muatkan pelbagai lampiran fail
      if (initialDoc.attachments && initialDoc.attachments.length > 0) {
        setAttachments(
          initialDoc.attachments.map((att) => {
            const isPdf = att.type === 'application/pdf' || att.name.toLowerCase().endsWith('.pdf');
            const isImage = att.type.startsWith('image/');
            return {
              id: att.id,
              dataUrl: att.url,
              fileName: att.name,
              fileType: att.type,
              originalSize: att.sizeOriginal || 0,
              compressedSize: att.sizeCompressed,
              isImage,
              isPdf,
            };
          })
        );
      } else if (initialDoc.attachmentUrl) {
        const isPdf = initialDoc.attachmentType === 'application/pdf' || initialDoc.attachmentName?.toLowerCase().endsWith('.pdf');
        const isImage = initialDoc.attachmentType?.startsWith('image/');
        setAttachments([
          {
            dataUrl: initialDoc.attachmentUrl,
            fileName: initialDoc.attachmentName || (isPdf ? 'Dokumen_Paper.pdf' : 'Lampiran_Fail'),
            fileType: initialDoc.attachmentType || (isPdf ? 'application/pdf' : 'application/octet-stream'),
            originalSize: initialDoc.attachmentSizeOriginal || 0,
            compressedSize: initialDoc.attachmentSizeCompressed,
            isImage,
            isPdf,
          },
        ]);
      } else {
        setAttachments([]);
      }
    } else {
      setTitle('');
      setCategory(categories[0]?.code || 'SOP');
      setTaskCategory('Tugasan Projek');
      setDocumentDate(new Date().toISOString().split('T')[0]);
      setPaperStatus('Disediakan');
      setTagsInput('Paper, Rasmi, Arkib');
      setSummary('');
      setContent('');
      setSelectedDeptId(currentUser?.departmentId || 'dept_it');
      setSelectedUnitId(currentUser?.unitId || 'unit_cyber_sec');
      setIsConfidential(false);
      setClearanceRequired('BIASA');
      setIsEncrypted(false);
      setFolderId(initialFolderId || null);
      setAllowedGroups([]);
      setAllowedUsers([]);
      setOfflineAvailable(true);
      setAttachments([]);
    }
  }, [initialDoc, isOpen, categories, initialFolderId]);

  if (!isOpen) return null;

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessingFile(true);
    setUploadError(null);

    const newUploadedList: UploadedAttachment[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const result = await compressAndResizeImage(file, 1280, 0.82);
          let finalUrl = result.dataUrl;

          if (storageConfig?.isConfigured && isOnline) {
            try {
              const uploaded = await uploadFileToStorage(result.dataUrl, result.fileName, 'image/jpeg');
              finalUrl = uploaded.url;
            } catch (e) {
              console.warn('Google Storage upload fallback to local cache:', e);
            }
          }

          newUploadedList.push({
            id: `att_${Date.now()}_${i}`,
            dataUrl: finalUrl,
            fileName: result.fileName,
            fileType: result.fileType,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            isImage: true,
            isPdf: false,
          });
        } else {
          // PDF or General Document (Word, Excel, Text, etc.)
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

          if (storageConfig?.isConfigured && isOnline) {
            try {
              const uploaded = await uploadFileToStorage(file, file.name, file.type || 'application/pdf');
              newUploadedList.push({
                id: `att_${Date.now()}_${i}`,
                dataUrl: uploaded.url,
                fileName: file.name,
                fileType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
                originalSize: file.size,
                isImage: false,
                isPdf,
              });
              continue;
            } catch (e) {
              console.warn('Direct upload error, falling back to local file reader:', e);
            }
          }

          // Local base64 read
          await new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              newUploadedList.push({
                id: `att_${Date.now()}_${i}`,
                dataUrl,
                fileName: file.name,
                fileType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
                originalSize: file.size,
                isImage: false,
                isPdf,
              });
              resolve();
            };
            reader.onerror = () => reject(new Error(`Gagal membaca fail: ${file.name}`));
            reader.readAsDataURL(file);
          });
        }
      }

      setAttachments((prev) => [...prev, ...newUploadedList]);
      onShowToast(
        'Fail Berjaya Dimuat Naik',
        `${newUploadedList.length} fail telah ditambah ke senarai lampiran dokumen.`,
        'success'
      );
    } catch (err: any) {
      setUploadError(err.message || 'Gagal memproses fail yang dimuat naik.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Kandungan teks dokumen kini adalah opsional / tidak wajib!
    if (!title.trim() || !documentDate) {
      setErrorMessage('Sila lengkapkan sekurang-kurangnya tajuk dokumen dan tarikh dokumen.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      let encryptedPayload: { ciphertext?: string; iv?: string; salt?: string } = {};

      const textToSave = content.trim();

      if (isEncrypted && textToSave) {
        const { ciphertext, iv, salt } = await encryptTextE2EE(textToSave, passphrase);
        encryptedPayload = {
          ciphertext,
          iv,
          salt,
        };
      }

      const docPayload: Partial<DmsDocument> = {
        title: title.trim(),
        category,
        taskCategory,
        documentDate,
        paperStatus,
        tags,
        summary: summary.trim() || title.trim(),
        content: isEncrypted
          ? (textToSave ? '[KANDUNGAN TERENKRIPSI DENGAN AES-256-GCM]' : '')
          : (textToSave || (attachments.length > 0 ? `[Lampiran Fail Rasmi: ${attachments.map((a) => a.fileName).join(', ')}]` : '')),
        isConfidential,
        clearanceRequired: isConfidential ? (clearanceRequired === 'BIASA' ? 'SULIT' : clearanceRequired) : 'BIASA',
        folderId: folderId || null,
        allowedGroups,
        allowedUsers,
        offlineAvailable,
        departmentId: selectedDeptId,
        unitId: selectedUnitId,
        isEncrypted,
        encryptionAlgo: isEncrypted ? 'AES-256-GCM' : undefined,
        encryptedContent: encryptedPayload.ciphertext,
        iv: encryptedPayload.iv,
        salt: encryptedPayload.salt,
        currentVersion: initialDoc?.currentVersion || '1.0',
        authorId: initialDoc?.authorId || currentUser?.uid || 'guest',
        authorName: initialDoc?.authorName || currentUser?.displayName || 'Pengguna Tetamu',
        authorEmail: initialDoc?.authorEmail || currentUser?.email || 'pegawai@arkadms.gov.my',
        creatorServiceNumber: initialDoc?.creatorServiceNumber || currentUser?.serviceNumber || '000000',
        lastModifiedBy: currentUser?.displayName || 'Pengguna Tetamu',
      };

      if (!initialDoc) {
        // Create initial workflow step
        docPayload.workflowChronology = [
          {
            id: `wf_${Date.now()}`,
            stage: 'Disediakan',
            handledBy: `${currentUser?.displayName || 'Pegawai'} (No. ${currentUser?.serviceNumber || '000000'})`,
            departmentName: currentUser?.departmentName || 'Jabatan Am',
            date: new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
            status: 'selesai',
            notes: 'Pendaftaran draf asal dokumen paper ke dalam sistem.',
          },
        ];
      }

      // Simpan semua senarai lampiran fail
      docPayload.attachments = attachments.map((att, idx) => ({
        id: att.id || `att_${Date.now()}_${idx}`,
        name: att.fileName,
        url: att.dataUrl,
        type: att.fileType,
        sizeOriginal: att.originalSize,
        sizeCompressed: att.compressedSize,
        uploadedAt: new Date().toISOString(),
      }));

      // Keserasian ke belakang bagi fail tunggal
      if (attachments.length > 0) {
        docPayload.attachmentUrl = attachments[0].dataUrl;
        docPayload.attachmentName = attachments[0].fileName;
        docPayload.attachmentType = attachments[0].fileType;
        docPayload.attachmentSizeOriginal = attachments[0].originalSize;
        docPayload.attachmentSizeCompressed = attachments[0].compressedSize;
      } else {
        docPayload.attachmentUrl = undefined;
        docPayload.attachmentName = undefined;
        docPayload.attachmentType = undefined;
        docPayload.attachmentSizeOriginal = undefined;
        docPayload.attachmentSizeCompressed = undefined;
      }

      await onSave(docPayload, notifyStakeholders);
      onShowToast(
        isEditing ? 'Dokumen Dikemaskini' : 'Dokumen Berjaya Didaftarkan',
        `Fail "${title}" (${attachments.length} lampiran) telah disimpan.`,
        'success'
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan dokumen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl my-6 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Sunting Dokumen & Metadata' : 'Daftar Dokumen / Paper Baharu'}
            </h3>
            <p className="text-xs text-slate-500">
              Pencipta: <strong>{currentUser?.displayName || 'Pengguna Tetamu'}</strong> (No. Perkhidmatan: #{currentUser?.serviceNumber || '000000'})
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Tajuk Dokumen / Paper *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Paper Tender: Perolehan Pelayan Awan Kebangsaan 2026..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Tarikh Dokumen & Kategori Dinamik Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Tarikh Dokumen (Wajib) *
              </label>
              <input
                type="date"
                required
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Kategori Fail (Dinamik) *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold text-blue-600"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.code}>
                    {cat.code} - {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Status Aliran Paper *
              </label>
              <select
                value={paperStatus}
                onChange={(e) => setPaperStatus(e.target.value as PaperStatus)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
              >
                {PAPER_STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department, Unit & Folder Hierarchy */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Jabatan Pemilik *
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  const dept = departments.find((d) => d.id === e.target.value);
                  if (dept && dept.units.length > 0) setSelectedUnitId(dept.units[0].id);
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Unit Pengurusan *
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                {currentUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Folder Dokumen
              </label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                <option value="">📁 ETS Document Management Utama (Luar Folder)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name} ({f.clearanceLevel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags & Executive Summary */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Tagar Carian (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Contoh: Paper DAL, Tender, Kewangan, SULIT"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Ringkasan Eksekutif
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ringkasan skop dan tujuan dokumen..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Full Text Content (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Kandungan Teks Dokumen <span className="text-slate-400 font-normal">(Pilihan / Tidak Wajib)</span>
              </label>
              <span className="text-[11px] text-slate-400">Boleh dikosongkan jika memuat naik fail PDF / lampiran</span>
            </div>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis ringkasan perakuan, minit keputusan atau kandungan dokumen (atau kosongkan sekiranya memuat naik fail dokumen PDF penuh)..."
              className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-sans leading-relaxed"
            />
          </div>

          {/* Drag & Drop Multi-file Uploader */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const droppedFiles = e.dataTransfer.files;
              if (droppedFiles && droppedFiles.length > 0) processFiles(droppedFiles);
            }}
            className={`p-4 rounded-xl border-2 border-dashed space-y-3 transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Muat Naik Pelbagai Fail / Dokumen PDF / Kertas Kerja</span>
              </span>
              <div className="flex items-center gap-2">
                {storageConfig?.isConfigured ? (
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-blue-600" />
                    <span>Google Storage Aktif</span>
                  </span>
                ) : onOpenStorageSetup ? (
                  <button
                    type="button"
                    onClick={onOpenStorageSetup}
                    className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 hover:bg-amber-100 flex items-center gap-1"
                  >
                    <Cloud className="w-3 h-3 text-amber-600" />
                    <span>Setup Google Storage (Kali Pertama) →</span>
                  </button>
                ) : null}
                <span className="text-[10px] text-slate-400 font-mono">Boleh Lebih Dari 1 Fail</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Sokongan memuat naik <strong>lebih dari 1 fail serentak</strong> (PDF, Word, Excel, Imej). Imej dimampatkan secara automatik untuk penjimatan storan awan.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Fail dari Peranti (Boleh Pelbagai Fail)</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf, .doc, .docx, .xls, .xlsx, .csv, .txt, image/*"
                  onChange={(e) => {
                    if (e.target.files) processFiles(e.target.files);
                  }}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">atau tarik dan lepas berbilang fail ke sini.</span>
              {isProcessingFile && <span className="text-blue-600 font-mono text-[11px] animate-pulse">Memproses & memampatkan fail...</span>}
            </div>

            {uploadError && <p className="text-xs text-rose-500">{uploadError}</p>}

            {/* List of Multiple Uploaded Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>Lampiran Sedia Disimpan ({attachments.length} Fail)</span>
                  <button
                    type="button"
                    onClick={() => setAttachments([])}
                    className="text-rose-500 hover:text-rose-700 font-normal hover:underline"
                  >
                    Kosongkan Semua
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {attachments.map((att, idx) => (
                    <div
                      key={att.id || idx}
                      className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {att.isPdf ? (
                          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                            <FileText className="w-4 h-4" />
                          </div>
                        ) : att.isImage ? (
                          <img
                            src={att.dataUrl}
                            alt="Pratonton"
                            className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900">
                            <FileCheck className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">{att.fileName}</p>
                            {att.isPdf && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded shrink-0">
                                PDF
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {formatBytes(att.originalSize)}
                            {att.compressedSize && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1.5">
                                → {formatBytes(att.compressedSize)} (Dimampatkan)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                        title="Buang fail ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Security & Confidentiality */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-600" />
                <span>Klasifikasi Keselamatan Fail Sulit & P&C</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfidential}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600"
                />
                <span className="font-semibold text-rose-700 dark:text-rose-400">Tandai Fail Sulit / P&C</span>
              </label>
            </div>

            {isConfidential && (
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tahap Tapisan Keselamatan Minimum
                </label>
                <select
                  value={clearanceRequired}
                  onChange={(e) => setClearanceRequired(e.target.value as ClearanceLevel)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="TERHAD">TERHAD (Akses Terhad Pegawai Dalaman)</option>
                  <option value="SULIT">SULIT (Klasifikasi Pegawai Kanan Sahaja)</option>
                  <option value="P&C">P&C (Private & Confidential / Pengarah & Pengurusan Tertinggi)</option>
                </select>
              </div>
            )}

            {/* E2EE Toggle */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Enkripsi Hujung-ke-Hujung Klien (E2EE)</span>
                </span>
                <input
                  type="checkbox"
                  checked={isEncrypted}
                  onChange={(e) => setIsEncrypted(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600"
                />
              </div>

              {isEncrypted && (
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Kata laluan enkripsi..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-lg font-mono"
                />
              )}
            </div>
          </div>

          {/* User Groups & Individual Assignment Matrix */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Penugasan Akses Kumpulan (Groups) & Individu</span>
            </span>

            {/* Groups */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                Tugaskan kepada Kumpulan Pengguna:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                {groups.map((g) => {
                  const isChecked = allowedGroups.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setAllowedGroups((prev) =>
                            isChecked ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                          );
                        }}
                        className="rounded text-indigo-600"
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-slate-900 dark:text-white truncate block">
                          {g.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {g.code} · {g.permission}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Offline Availability Toggle */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-xs block">
                  Simpan untuk Suntingan Luar Talian (Offline Mode)
                </span>
                <span className="text-[11px] text-slate-500">
                  Dokumen akan dimuat turun dan disimpan dalam storan cache peranti untuk akses tanpa sambungan internet.
                </span>
              </div>
              <input
                type="checkbox"
                checked={offlineAvailable}
                onChange={(e) => setOfflineAvailable(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 w-4 h-4"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-900">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingFile}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : isEditing ? 'Kemas Kini Dokumen' : 'Simpan & Arkibkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
