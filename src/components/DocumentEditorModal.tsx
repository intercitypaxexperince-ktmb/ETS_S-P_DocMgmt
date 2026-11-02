/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DmsDocument,
  DocumentCategory,
  TaskCategory,
  ClearanceLevel,
  UserProfile,
  Department,
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
  isOnline: boolean;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORIES: DocumentCategory[] = [
  'Dasar & Polisi',
  'Kontrak & Perjanjian',
  'Kewangan & Bajet',
  'Teknikal & IT',
  'Laporan Strategik',
  'Sumber Manusia',
  'Minit Mesyuarat',
];

const TASK_CATEGORIES: TaskCategory[] = [
  'Tugasan Projek',
  'Kelulusan Pengurusan',
  'Audit & Pematuhan',
  'Operasi Harian',
  'Arkib Digital',
];

const PRESET_TEMPLATES = [
  {
    name: 'Dasar & Polisi Organisasi',
    category: 'Dasar & Polisi' as DocumentCategory,
    taskCategory: 'Audit & Pematuhan' as TaskCategory,
    tags: 'Dasar, Integriti, Keselamatan, Tadbir Urus',
    summary: 'Rangka kerja dasar penetapan garis panduan dan tatacara operasi piawai (SOP).',
    content: `1.0 TUJUAN
Dokumen ini menetapkan dasar piawai bagi pengurusan keselamatan dan integriti arkib digital organisasi.

2.0 SKOP PEMATUHAN
Dasar ini terpakai kepada semua warga kerja, kontraktor dan pembekal perkhidmatan luar.

3.0 PRINSIP KAWALAN CAPAIAN
3.1 Akses berasaskan peranan (RBAC) diwajibkan bagi setiap sistem.
3.2 Semakan log audit dijalankan sekurang-kurangnya sekali sebulan.

4.0 PENALTI & KETIDAKPATUHAN
Sebarang pelanggaran keselamatan akan disiasat di bawah tatatertib perkhidmatan.`,
  },
  {
    name: 'Perjanjian Kontrak Vendor',
    category: 'Kontrak & Perjanjian' as DocumentCategory,
    taskCategory: 'Kelulusan Pengurusan' as TaskCategory,
    tags: 'Kontrak, Vendor, Liabiliti, SLA, Sulit',
    summary: 'Perjanjian perkhidmatan pembekalan teknikal dengan penetapan tahap perkhidmatan (SLA).',
    content: `PERJANJIAN PERKHIDMATAN & PEMBEKALAN
Tarikh Dimeterai: ${new Date().toLocaleDateString('ms-MY')}

KLAUSA 1: SKOP KERJA
Pembekal bersetuju menyediakan perkhidmatan sokongan teknikal 24/7 dengan masa tindak balas di bawah 30 minit.

KLAUSA 2: JAMINAN KERAHSIAAN (NDA)
Semua maklumat, data transaksi dan dokumen sulit organisasi adalah dilindungi di bawah klausa kerahsiaan mutlak.

KLAUSA 3: PEMBAYARAN & PENALTI
Bayaran akan dilepaskan mengikut pencapaian perbatuan (milestones) selepas pengesahan penerimaan (UAT).`,
  },
  {
    name: 'Laporan Belanjawan & Kewangan',
    category: 'Kewangan & Bajet' as DocumentCategory,
    taskCategory: 'Operasi Harian' as TaskCategory,
    tags: 'Belanjawan, Kewangan, Peruntukan, Audit',
    summary: 'Laporan perbelanjaan dan analisis varians belanjawan operasi tahunan.',
    content: `LAPORAN KEMAJUAN KEWANGAN & PERUNTUKAN

1.0 RINGKASAN PERBELANJAAN
Jumlah Peruntukan Diberikan: RM 1,500,000.00
Jumlah Perbelanjaan Sebenar: RM 1,180,000.00
Baki Peruntukan Bersih: RM 320,000.00 (Penjimatan 21.3%)

2.0 BUTIRAN PECAHAN ASET
- Pembaharuan Lesen Perisian Awan: RM 450,000.00
- Pelayan Sandaran Bencana: RM 520,000.00
- Program Latihan Keselamatan Staf: RM 210,000.00

3.0 SYOR PENJADUALAN SEMULA
Baki peruntukan dicadangkan untuk dialihkan ke fasa pengukuhan enkripsi data suku tahun hadapan.`,
  },
];

export const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDoc,
  currentUser,
  departments,
  isOnline,
  onShowToast,
}) => {
  const isEditing = Boolean(initialDoc);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Dasar & Polisi');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('Tugasan Projek');
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
      setCategory('Dasar & Polisi');
      setTaskCategory('Tugasan Projek');
      setTagsInput('Dasar, Keselamatan, Arkib');
      setSummary('');
      setContent('');
      setSelectedDeptId(currentUser.departmentId || 'dept_it');
      setSelectedUnitId(currentUser.unitId || 'unit_cyber_sec');
      setIsConfidential(false);
      setClearanceRequired('BIASA');
      setIsEncrypted(false);
      setImageResult(null);
    }
  }, [initialDoc, isOpen]);

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

  const handleApplyTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    setTitle(tpl.name);
    setCategory(tpl.category);
    setTaskCategory(tpl.taskCategory);
    setTagsInput(tpl.tags);
    setSummary(tpl.summary);
    setContent(tpl.content);
    onShowToast('Templat Digunakan', `Format "${tpl.name}" telah diserap ke dalam borang.`, 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMessage('Sila lengkapkan tajuk dan kandungan dokumen.');
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
        lastModifiedBy: currentUser.displayName,
      };

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
        `Fail "${title}" telah disimpan ke pangkalan data.`,
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Sunting Dokumen & Metadata' : 'Cipta & Arkibkan Dokumen Baharu'}
            </h3>
            <p className="text-xs text-slate-500">
              {isOnline ? 'Penyegerakan awan masa nyata aktif' : 'Mod Luar Talian: Disimpan ke storan selamat peranti'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preset Templates Picker (for fast user onboarding) */}
          {!isEditing && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pilih Templat Cepat (Pilihan Pintar):</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto text-[11px]">
                {PRESET_TEMPLATES.map((tpl) => (
                  <button
                    type="button"
                    key={tpl.name}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:border-slate-400 whitespace-nowrap transition-colors"
                  >
                    + {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Tajuk Dokumen Rasmi *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Perjanjian Pelayan Awan Kebangsaan 2026..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
            />
          </div>

          {/* Category & Task Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Kategori Arkib *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Kategori Tugasan *
              </label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {TASK_CATEGORIES.map((task) => (
                  <option key={task} value={task}>
                    {task}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department and Unit Hierarchy Assignment */}
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
                  if (dept && dept.units.length > 0) {
                    setSelectedUnitId(dept.units[0].id);
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {currentUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Tagar Pintar (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Contoh: Keselamatan, Kewangan, Pelayan, Audit"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Executive Summary */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Ringkasan Eksekutif
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ringkasan ringkas objektif fail..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Full Text Content with word count */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Kandungan Penuh Dokumen *
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {content.trim() ? content.trim().split(/\s+/).length : 0} patah perkataan
              </span>
            </div>
            <textarea
              required
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis atau tampal kandungan teks penuh..."
              className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Interactive Drag & Drop Image Compressor Dropzone */}
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
            className={`p-4 rounded-xl border-2 border-dashed transition-all space-y-3 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  Mampatan Imej Automatik Klien (Tarik & Lepas)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Resolusi max 1280px</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih Fail Imej</span>
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

              <span className="text-[11px] text-slate-400">
                atau tarik fail imej ke dalam kotak ini untuk mampatan segera.
              </span>

              {isCompressing && (
                <span className="text-blue-600 font-mono text-[11px]">Memampat imej...</span>
              )}
            </div>

            {compressError && <p className="text-rose-600 text-[11px]">{compressError}</p>}

            {/* Compressed Stats Banner */}
            {imageResult && (
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                    <img
                      src={imageResult.dataUrl}
                      alt="Pratonton"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
                      {imageResult.fileName}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      {imageResult.originalFormatted} → {imageResult.compressedFormatted} (Jimat {imageResult.savedPercentage}%)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setImageResult(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Buang Lampiran"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Security & Confidentiality Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-600" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  Klasifikasi Keselamatan Fail Sulit
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfidential}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-rose-700 dark:text-rose-400">Tandai Fail Sulit</span>
              </label>
            </div>

            {isConfidential && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Tahap Tapisan Keselamatan Minimum
                </label>
                <select
                  value={clearanceRequired}
                  onChange={(e) => setClearanceRequired(e.target.value as ClearanceLevel)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="TERHAD">TERHAD (Pegawai Sahaja)</option>
                  <option value="SULIT">SULIT (Klasifikasi Pegawai Kanan)</option>
                  <option value="RAHSIA_BESAR">RAHSIA BESAR (Pengarah & Jawatankuasa Induk)</option>
                </select>
              </div>
            )}

            {/* E2EE Toggle */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Enkripsi Hujung-ke-Hujung Klien (E2EE)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isEncrypted}
                  onChange={(e) => setIsEncrypted(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {isEncrypted && (
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">
                    Kata Laluan Frasa Kripto Klien
                  </label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              )}
            </div>

            {/* Automated Notification Trigger */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyStakeholders}
                  onChange={(e) => setNotifyStakeholders(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                />
                <span className="text-slate-600 dark:text-slate-400">
                  Hantar notifikasi e-mel automatik kepada pemegang taruh dokumen
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
            >
              {isSubmitting ? 'Menyimpan...' : isEditing ? 'Kemas Kini Dokumen' : 'Simpan & Arkibkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
