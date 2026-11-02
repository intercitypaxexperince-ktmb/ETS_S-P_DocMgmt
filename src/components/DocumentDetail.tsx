/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DmsDocument,
  DocumentComment,
  UserProfile,
  DocumentRevision,
} from '../types/dms';
import {
  ArrowLeft,
  Lock,
  Unlock,
  ShieldAlert,
  Send,
  MessageSquare,
  History,
  FileText,
  Calendar,
  Building2,
  Download,
  Edit3,
  CheckCircle2,
  KeyRound,
  FileCheck,
  Tag,
  ImageIcon,
  Columns2,
  BookOpen,
  Copy,
  Clock,
  Sparkles,
} from 'lucide-react';
import { decryptTextE2EE } from '../lib/crypto';
import { formatBytes } from '../lib/imageCompressor';

interface DocumentDetailProps {
  document: DmsDocument;
  currentUser: UserProfile;
  comments: DocumentComment[];
  onBack: () => void;
  onEdit: (doc: DmsDocument) => void;
  onAddComment: (
    text: string,
    revisionTag?: 'Cadangan Semakan' | 'Pembetulan Fakta' | 'Kelulusan Diperlukan' | 'Kemas Kini Klausa' | 'Umum',
    highlightText?: string
  ) => void;
  onAddNewRevision: (docId: string, version: string, summary: string, newContent: string) => void;
  onLogAccessAttempt: (doc: DmsDocument, granted: boolean) => void;
  onExportPDF: (doc: DmsDocument) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const DocumentDetail: React.FC<DocumentDetailProps> = ({
  document: doc,
  currentUser,
  comments,
  onBack,
  onEdit,
  onAddComment,
  onAddNewRevision,
  onLogAccessAttempt,
  onExportPDF,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'kandungan' | 'komen' | 'revisi'>('kandungan');
  const [passphrase, setPassphrase] = useState('ArkaDMS@2026!');
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Floating highlight toolbar
  const [highlightSelection, setHighlightSelection] = useState('');
  const [commentText, setCommentText] = useState('');
  const [revisionTag, setRevisionTag] = useState<
    'Cadangan Semakan' | 'Pembetulan Fakta' | 'Kelulusan Diperlukan' | 'Kemas Kini Klausa' | 'Umum'
  >('Cadangan Semakan');

  // Version Comparison Modal
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareRevId, setCompareRevId] = useState<string>(doc.revisions?.[0]?.id || '');

  // Publish Revision Modal
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [nextVersionInput, setNextVersionInput] = useState('');
  const [revisionSummaryInput, setRevisionSummaryInput] = useState('');
  const [revisedContentInput, setRevisedContentInput] = useState('');

  // Access check
  const isConfidential = doc.isConfidential;
  const hasSecurityClearance =
    currentUser.role === 'admin' ||
    !isConfidential ||
    (doc.allowedUsers && doc.allowedUsers.includes(currentUser.uid)) ||
    currentUser.clearanceLevel === 'RAHSIA_BESAR' ||
    (currentUser.clearanceLevel === 'SULIT' && doc.clearanceRequired !== 'RAHSIA_BESAR');

  // Reading Stats
  const activeContentText = decryptedContent || doc.content;
  const wordCount = useMemo(() => {
    return activeContentText.trim().split(/\s+/).filter(Boolean).length;
  }, [activeContentText]);
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  useEffect(() => {
    onLogAccessAttempt(doc, hasSecurityClearance);
  }, [doc.id]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const selected = selection.toString().trim();
      setHighlightSelection(selected);
      setActiveTab('komen');
    }
  };

  const handleDecrypt = async () => {
    if (!passphrase.trim()) {
      setDecryptError('Sila masukkan kata laluan / frasa kunci penyahsulitan.');
      return;
    }
    setIsDecrypting(true);
    setDecryptError(null);
    try {
      if (doc.encryptedContent && doc.iv && doc.salt) {
        const plain = await decryptTextE2EE(doc.encryptedContent, passphrase, doc.iv, doc.salt);
        setDecryptedContent(plain);
        onShowToast('Nyahkunci Berjaya', 'Kandungan E2EE telah dinyahsulitkan sepenuhnya.', 'success');
      } else {
        setDecryptedContent(doc.content);
        onShowToast('Nyahkunci Berjaya', 'Kandungan dipaparkan.', 'success');
      }
    } catch (e) {
      setDecryptError('Nyahkunci gagal. Kata laluan tidak sepadan dengan frasa enkripsi dokumen.');
      onShowToast('Gagal Menyahkunci', 'Kata laluan enkripsi salah.', 'error');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText, revisionTag, highlightSelection || undefined);
    onShowToast('Komen Direkodkan', `Ulasan bertagar [${revisionTag}] telah ditambah.`, 'success');
    setCommentText('');
    setHighlightSelection('');
  };

  const handleOpenRevisionModal = () => {
    const currentNum = parseFloat(doc.currentVersion) || 1.0;
    setNextVersionInput((currentNum + 0.1).toFixed(1));
    setRevisedContentInput(decryptedContent || doc.content);
    setRevisionSummaryInput('');
    setShowRevisionModal(true);
  };

  const handlePublishRevision = () => {
    if (!revisionSummaryInput.trim() || !nextVersionInput.trim()) return;
    onAddNewRevision(doc.id, nextVersionInput, revisionSummaryInput, revisedContentInput);
    setShowRevisionModal(false);
    onShowToast('Semakan Diterbitkan', `Versi ${nextVersionInput} telah disahkan dan diarkibkan.`, 'success');
  };

  const selectedCompareRev = doc.revisions?.find((r) => r.id === compareRevId) || doc.revisions?.[0];

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Kembali ke Senarai Dokumen"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{doc.category}</span>
              <span aria-hidden="true">·</span>
              <span>{doc.taskCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">v{doc.currentVersion}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{readTimeMin} minit bacaan ({wordCount} perkataan)</span>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {doc.title}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Compare versions button (if more than 1 revision exists) */}
          {doc.revisions && doc.revisions.length > 1 && (
            <button
              onClick={() => setShowCompareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Columns2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Bandingkan Versi</span>
            </button>
          )}

          <button
            onClick={() => onExportPDF(doc)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Cetak PDF</span>
          </button>

          {/* Edit / New Revision (Editor or Admin only) */}
          {currentUser.role !== 'viewer' && hasSecurityClearance && (
            <>
              <button
                onClick={handleOpenRevisionModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
              >
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span>Terbit Semakan</span>
              </button>
              <button
                onClick={() => onEdit(doc)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sunting Fail</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Access Denied Shield for Unauthorized Personnel */}
      {!hasSecurityClearance ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-8 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/60 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
              AKSES DISEKAT: KLASIFIKASI {doc.clearanceRequired}
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 max-w-md mx-auto leading-relaxed">
              Anda tidak mempunyai kelulusan tapisan keselamatan untuk membuka fail ini. Tapisan semasa anda ialah{' '}
              <strong>{currentUser.clearanceLevel}</strong>, manakala fail ini dikunci kepada tahap{' '}
              <strong>{doc.clearanceRequired}</strong>.
            </p>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-lg border border-rose-200 dark:border-rose-900 text-left text-xs space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Jejak Log Audit Dilaksanakan:</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Percubaan akses tanpa izin ini telah direkodkan dalam log audit rasmi dan notifikasi kecemasan telah
              dihantar kepada Pengarah Keselamatan Maklumat.
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
          >
            Kembali ke Senarai Dokumen
          </button>
        </div>
      ) : (
        /* Authorized View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Document Content Pane (2 Columns) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Metadata Summary Banner */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pengarang: <strong className="text-slate-800 dark:text-slate-200">{doc.authorName}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kemaskini: <strong className="font-mono tabular-nums">{new Date(doc.updatedAt).toLocaleString('ms-MY')}</strong></span>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {doc.summary}
              </p>

              {/* Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {doc.tags.map((tag) => (
                    <span key={tag} className="text-slate-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Compressed Image Attachment Preview (If present) */}
            {doc.attachmentUrl && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Lampiran Imej Dimampatkan Automatik
                    </span>
                  </div>
                  {doc.attachmentSizeOriginal && doc.attachmentSizeCompressed && (
                    <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatBytes(doc.attachmentSizeOriginal)} → {formatBytes(doc.attachmentSizeCompressed)} (Jimat{' '}
                      {Math.round(
                        ((doc.attachmentSizeOriginal - doc.attachmentSizeCompressed) /
                          doc.attachmentSizeOriginal) *
                          100
                      )}
                      %)
                    </span>
                  )}
                </div>

                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96 flex items-center justify-center bg-slate-950">
                  <img
                    src={doc.attachmentUrl}
                    alt={doc.attachmentName || 'Lampiran Dokumen'}
                    className="max-h-96 w-auto object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {doc.attachmentName} · Resolusi dioptimumkan ke 1280px bagi mengurangkan beban pelayan dan menjimatkan kuota storan.
                </p>
              </div>
            )}

            {/* E2EE Lock / Unlock Gateway */}
            {doc.isEncrypted && !decryptedContent && (
              <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 space-y-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Kandungan Terenkripsi Klien (AES-256-GCM)</h4>
                    <p className="text-xs text-slate-300">
                      Kandungan disulitkan sepenuhnya sebelum dihantar ke pangkalan data awan. Sila masukkan kata laluan untuk membuka.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Masukkan kata laluan enkripsi..."
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    onClick={handleDecrypt}
                    disabled={isDecrypting}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isDecrypting ? 'Menyahkunci...' : 'Buka Enkripsi E2EE'}</span>
                  </button>
                </div>

                {decryptError && <p className="text-xs text-rose-400">{decryptError}</p>}

                <p className="text-[11px] text-slate-400">
                  Kata laluan lalai demonstrasi: <code className="text-emerald-400 font-mono">ArkaDMS@2026!</code>
                </p>
              </div>
            )}

            {/* Document Content Viewport */}
            {(!doc.isEncrypted || decryptedContent) && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Teks Dokumen Rasmi (Pilih & Sorot Teks untuk Semakan)
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    Sorot perkataan untuk tambah komen
                  </span>
                </div>

                {/* Floating highlight helper bar */}
                {highlightSelection && (
                  <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 p-2.5 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
                    <div className="truncate pr-3">
                      <span className="font-semibold text-blue-700 dark:text-blue-300">Teks Disorot: </span>
                      <span className="text-slate-700 dark:text-slate-300 italic">"{highlightSelection}"</span>
                    </div>
                    <button
                      onClick={() => setHighlightSelection('')}
                      className="text-slate-400 hover:text-slate-700 text-xs shrink-0"
                    >
                      Batal
                    </button>
                  </div>
                )}

                {/* Interactive selectable text */}
                <div
                  onMouseUp={handleTextSelection}
                  className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text p-2 rounded hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                >
                  {decryptedContent || doc.content}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Collaboration & Revision History (1 Column) */}
          <div className="space-y-4">
            {/* Tab switchers */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setActiveTab('kandungan')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'kandungan'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Info Fail</span>
              </button>
              <button
                onClick={() => setActiveTab('komen')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'komen'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Komen ({comments.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('revisi')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'revisi'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Versi ({doc.revisions?.length || 1})</span>
              </button>
            </div>

            {/* TAB: Info Fail */}
            {activeTab === 'kandungan' && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs shadow-xs">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Metadata & Integriti</h4>
                  <div className="space-y-2 text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>Klasifikasi:</span>
                      <strong className="text-slate-900 dark:text-white">{doc.clearanceRequired}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>Protokol Enkripsi:</span>
                      <strong className="text-slate-900 dark:text-white">{doc.isEncrypted ? 'AES-256-GCM' : 'Biasa'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>Versi Aktif:</span>
                      <strong className="font-mono tabular-nums text-slate-900 dark:text-white">v{doc.currentVersion}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>Pengubah Terakhir:</span>
                      <strong className="text-slate-900 dark:text-white">{doc.lastModifiedBy}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Tarikh Didigitalkan:</span>
                      <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                        {new Date(doc.createdAt).toLocaleDateString('ms-MY')}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Petunjuk Kolaborasi Pasukan
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sorot mana-mana ayat untuk menambah ulasan spesifik. Komen bertagar "[Kelulusan Diperlukan]" akan menghantar e-mel notifikasi automatik kepada pegawai pelulus.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: Komen & Penanda Semakan Langsung */}
            {activeTab === 'komen' && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Ulasan & Cadangan Semakan
                  </h4>
                  <span className="text-[11px] text-slate-400 tabular-nums font-mono">{comments.length} Komen</span>
                </div>

                <form onSubmit={handleSubmitComment} className="space-y-2.5">
                  {/* Revision Tag Selector */}
                  <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                    <span className="text-slate-400 shrink-0">Tag:</span>
                    {(['Cadangan Semakan', 'Pembetulan Fakta', 'Kelulusan Diperlukan', 'Kemas Kini Klausa'] as const).map(
                      (tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => setRevisionTag(tag)}
                          className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                            revisionTag === tag
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    )}
                  </div>

                  <div className="relative">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Tulis ulasan semakan..."
                      rows={3}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="absolute right-2 bottom-3 p-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
                      title="Hantar Komen"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3 pt-2 max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Belum ada ulasan untuk fail ini.
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="pt-3 first:pt-0 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">{c.userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                            {new Date(c.createdAt).toLocaleTimeString('ms-MY', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {c.revisionTag && (
                          <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                            [{c.revisionTag}]
                          </span>
                        )}
                        {c.highlightText && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 border-l-2 border-blue-400 px-2 py-1 text-[11px] text-slate-500 italic">
                            "{c.highlightText}"
                          </div>
                        )}
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: Kronologi Versi & Semakan */}
            {activeTab === 'revisi' && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Sejarah Kronologi Versi
                  </h4>
                  <span className="text-[11px] text-slate-400 tabular-nums font-mono">
                    {doc.revisions?.length || 1} Semakan
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {doc.revisions && doc.revisions.length > 0 ? (
                    doc.revisions.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            Versi {rev.version}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                            {new Date(rev.timestamp).toLocaleDateString('ms-MY')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{rev.changeSummary}</p>
                        <p className="text-[11px] text-slate-400">Pengarang: {rev.authorName}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">Tiada rekod semakan sebelumnya.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Compare Versions Side-by-Side */}
      {showCompareModal && selectedCompareRev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Columns2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Perbandingan Versi Terdahulu vs Versi Semasa (v{doc.currentVersion})
                </h3>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Tutup
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Bandingkan dengan:</span>
              <select
                value={compareRevId}
                onChange={(e) => setCompareRevId(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                {doc.revisions?.map((r) => (
                  <option key={r.id} value={r.id}>
                    Versi {r.version} ({new Date(r.timestamp).toLocaleDateString('ms-MY')}) - {r.changeSummary}
                  </option>
                ))}
              </select>
            </div>

            {/* Split comparison viewport */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
              {/* Previous version */}
              <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden">
                <div className="pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Versi {selectedCompareRev.version} (Rekod: {selectedCompareRev.changeSummary})
                </div>
                <div className="flex-1 overflow-y-auto pt-3 text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedCompareRev.contentSnapshot}
                </div>
              </div>

              {/* Current version */}
              <div className="flex flex-col border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="pb-2 border-b border-emerald-100 dark:border-emerald-900 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Versi Semasa v{doc.currentVersion} (Terkini)
                </div>
                <div className="flex-1 overflow-y-auto pt-3 text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                  {decryptedContent || doc.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Publish New Revision */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Terbitkan Semakan Versi Baharu
            </h3>
            <p className="text-xs text-slate-500">
              Sistem akan memelihara rekod versi sebelumnya dan mengemaskini versi dokumen aktif secara bersiri.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombor Versi Baharu
                </label>
                <input
                  type="text"
                  value={nextVersionInput}
                  onChange={(e) => setNextVersionInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ringkasan Pindaan & Semakan *
                </label>
                <input
                  type="text"
                  value={revisionSummaryInput}
                  onChange={(e) => setRevisionSummaryInput(e.target.value)}
                  placeholder="Contoh: Pindaan klausa 2.1 pengesahan keselamatan..."
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kandungan Dokumen Terpinda
                </label>
                <textarea
                  value={revisedContentInput}
                  onChange={(e) => setRevisedContentInput(e.target.value)}
                  rows={6}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Batal
              </button>
              <button
                onClick={handlePublishRevision}
                disabled={!revisionSummaryInput.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:opacity-90 disabled:opacity-40"
              >
                Sahkan & Terbitkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
