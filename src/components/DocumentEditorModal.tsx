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
} from 'lucide-react';
import { compressAndResizeImage, CompressionResult } from '../lib/imageCompressor';
import { encryptTextE2EE } from '../lib/crypto';

interface DocumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (docData: Partial<DmsDocument>, notifyStakeholders: boolean) => Promise<void>;
  initialDoc?: DmsDocument | null;
  currentUser: UserProfile;
  departments: Department[];
  categories: CustomCategory[];
  isOnline: boolean;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
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
  isOnline,
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

  // Department & Unit
  const [selectedDeptId, setSelectedDeptId] = useState(currentUser.departmentId || 'dept_it');
  const [selectedUnitId, setSelectedUnitId] = useState(currentUser.unitId || 'unit_cyber_sec');

  // Security & Clearance
  const [isConfidential, setIsConfidential] = useState(false);
  const [clearanceRequired, setClearanceRequired] = useState<ClearanceLevel>('BIASA');

  // E2EE Encryption
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [passphrase, setPassphrase] = useState('ArkaDMS@2026!');

  // Automated notification trigger
  const [notifyStakeholders, setNotifyStakeholders] = useState(true);

  // Image Upload and Automatic Compressor
  const [imageResult, setImageResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);
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
      setSelectedDeptId(initialDoc.departmentId || currentUser.departmentId || 'dept_it');
      setSelectedUnitId(initialDoc.unitId || currentUser.unitId || 'unit_cyber_sec');
      setIsConfidential(initialDoc.isConfidential);
      setClearanceRequired(initialDoc.clearanceRequired || 'BIASA');
      setIsEncrypted(initialDoc.isEncrypted);
    } else {
      setTitle('');
      setCategory(categories[0]?.code || 'SOP');
      setTaskCategory('Tugasan Projek');
      setDocumentDate(new Date().toISOString().split('T')[0]);
      setPaperStatus('Disediakan');
      setTagsInput('Paper, Rasmi, Arkib');
      setSummary('');
      setContent('');
      setSelectedDeptId(currentUser.departmentId || 'dept_it');
      setSelectedUnitId(currentUser.unitId || 'unit_cyber_sec');
      setIsConfidential(false);
      setClearanceRequired('BIASA');
      setIsEncrypted(false);
      setImageResult(null);
    }
  }, [initialDoc, isOpen, categories]);

  if (!isOpen) return null;

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setCompressError('Hanya fail imej disokong (PNG, JPG, WebP).');
      return;
    }

    setIsCompressing(true);
    setCompressError(null);
    try {
      const result = await compressAndResizeImage(file, 1280, 0.82);
      setImageResult(result);
      onShowToast('Imej Dimampatkan', `Penjimatan saiz ${result.savedPercentage}% berjaya dilakukan.`, 'success');
    } catch (err: any) {
      setCompressError(err.message || 'Gagal memproses imej.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !documentDate) {
      setErrorMessage('Sila lengkapkan tajuk, tarikh dokumen, dan kandungan dokumen.');
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

      if (isEncrypted) {
        const { ciphertext, iv, salt } = await encryptTextE2EE(content, passphrase);
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
        content: isEncrypted ? '[KANDUNGAN TERENKRIPSI DENGAN AES-256-GCM]' : content,
        isConfidential,
        clearanceRequired: isConfidential ? (clearanceRequired === 'BIASA' ? 'SULIT' : clearanceRequired) : 'BIASA',
        departmentId: selectedDeptId,
        unitId: selectedUnitId,
        isEncrypted,
        encryptionAlgo: isEncrypted ? 'AES-256-GCM' : undefined,
        encryptedContent: encryptedPayload.ciphertext,
        iv: encryptedPayload.iv,
        salt: encryptedPayload.salt,
        currentVersion: initialDoc?.currentVersion || '1.0',
        authorId: initialDoc?.authorId || currentUser.uid,
        authorName: initialDoc?.authorName || currentUser.displayName,
        authorEmail: initialDoc?.authorEmail || currentUser.email,
        creatorServiceNumber: initialDoc?.creatorServiceNumber || currentUser.serviceNumber,
        lastModifiedBy: currentUser.displayName,
      };

      if (!initialDoc) {
        // Create initial workflow step
        docPayload.workflowChronology = [
          {
            id: `wf_${Date.now()}`,
            stage: 'Disediakan',
            handledBy: `${currentUser.displayName} (No. ${currentUser.serviceNumber})`,
            departmentName: currentUser.departmentName,
            date: new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
            status: 'selesai',
            notes: 'Pendaftaran draf asal dokumen paper ke dalam sistem.',
          },
        ];
      }

      if (imageResult) {
        docPayload.attachmentUrl = imageResult.dataUrl;
        docPayload.attachmentName = imageResult.fileName;
        docPayload.attachmentType = imageResult.fileType;
        docPayload.attachmentSizeOriginal = imageResult.originalSize;
        docPayload.attachmentSizeCompressed = imageResult.compressedSize;
      }

      await onSave(docPayload, notifyStakeholders);
      onShowToast(
        isEditing ? 'Dokumen Dikemaskini' : 'Dokumen Berjaya Didaftarkan',
        `Fail "${title}" telah disimpan.`,
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
              Pencipta: <strong>{currentUser.displayName}</strong> (No. Perkhidmatan: {currentUser.serviceNumber})
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

          {/* Department & Unit Hierarchy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Full Text Content */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Kandungan Teks Dokumen *
            </label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis kandungan penuh dokumen..."
              className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-sans leading-relaxed"
            />
          </div>

          {/* Drag & Drop Image Uploader */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processImageFile(file);
            }}
            className={`p-4 rounded-xl border-2 border-dashed space-y-2.5 transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Mampatan Imej Automatik Klien</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Max 1280px WebP/JPEG</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium">
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih Fail</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processImageFile(file);
                  }}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">atau tarik dan lepas fail imej ke sini.</span>
              {isCompressing && <span className="text-blue-600 font-mono text-[11px]">Memampat imej...</span>}
            </div>

            {imageResult && (
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={imageResult.dataUrl}
                    alt="Pratonton"
                    className="w-10 h-10 rounded object-cover border"
                  />
                  <div>
                    <p className="font-medium truncate max-w-[200px]">{imageResult.fileName}</p>
                    <p className="text-[10px] text-emerald-600 font-mono font-semibold">
                      {imageResult.originalFormatted} → {imageResult.compressedFormatted} (Jimat {imageResult.savedPercentage}%)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImageResult(null)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Security & Confidentiality */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-600" />
                <span>Klasifikasi Keselamatan Fail Sulit</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfidential}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600"
                />
                <span className="font-semibold text-rose-700 dark:text-rose-400">Tandai Fail Sulit</span>
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
                  <option value="TERHAD">TERHAD (Akses Terhad Pegawai)</option>
                  <option value="SULIT">SULIT (Pegawai Kanan Sahaja)</option>
                  <option value="RAHSIA_BESAR">RAHSIA BESAR (Pengarah & Jawatankuasa Induk)</option>
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

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-900">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
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
