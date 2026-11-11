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
  PaperStatus,
  DocumentWorkflowStep,
  hasClearance,
  canDeleteDocument,
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
  Clock,
  GitBranch,
  Plus,
  ArrowRight,
  AlertCircle,
  UserCheck,
  File,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { decryptTextE2EE } from '../lib/crypto';
import { formatBytes } from '../lib/imageCompressor';

interface DocumentDetailProps {
  document: DmsDocument;
  currentUser: UserProfile | null;
  comments: DocumentComment[];
  onBack: () => void;
  onEdit: (doc: DmsDocument) => void;
  onDeleteDocument?: (docId: string, title: string) => void;
  onAddComment: (
    text: string,
    revisionTag?: 'Cadangan Semakan' | 'Pembetulan Fakta' | 'Kelulusan Diperlukan' | 'Kemas Kini Klausa' | 'Umum',
    highlightText?: string
  ) => void;
  onAddNewRevision: (docId: string, version: string, summary: string, newContent: string) => void;
  onUpdatePaperStatus: (
    docId: string,
    newStatus: PaperStatus,
    newStep?: Omit<DocumentWorkflowStep, 'id'>
  ) => void;
  onLogAccessAttempt: (doc: DmsDocument, granted: boolean) => void;
  onExportPDF: (doc: DmsDocument) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onOpenLoginModal?: () => void;
}

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

export const DocumentDetail: React.FC<DocumentDetailProps> = ({
  document: doc,
  currentUser,
  comments,
  onBack,
  onEdit,
  onDeleteDocument,
  onAddComment,
  onAddNewRevision,
  onUpdatePaperStatus,
  onLogAccessAttempt,
  onExportPDF,
  onShowToast,
  onOpenLoginModal,
}) => {
  const [activeTab, setActiveTab] = useState<'kandungan' | 'kronologi' | 'komen' | 'revisi'>('kandungan');
  const [passphrase, setPassphrase] = useState('ArkaDMS@2026!');
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleConfirmDelete = () => {
    if (onDeleteDocument) {
      onDeleteDocument(doc.id, doc.title);
    }
    setShowDeleteModal(false);
    onBack();
  };

  // Multiple Attachments Support
  const allAttachments = useMemo(() => {
    if (doc.attachments && doc.attachments.length > 0) return doc.attachments;
    if (doc.attachmentUrl) {
      return [
        {
          id: 'legacy',
          name: doc.attachmentName || 'Lampiran Dokumen',
          url: doc.attachmentUrl,
          type: doc.attachmentType || 'application/octet-stream',
          sizeOriginal: doc.attachmentSizeOriginal,
          sizeCompressed: doc.attachmentSizeCompressed,
        },
      ];
    }
    return [];
  }, [doc]);

  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>('');
  const activeAttachment = allAttachments.find((a) => a.id === selectedAttachmentId) || allAttachments[0];

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

  // Workflow / Status Update Modal
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [targetPaperStatus, setTargetPaperStatus] = useState<PaperStatus>(doc.paperStatus || 'Disediakan');
  const [stepStage, setStepStage] = useState('');
  const [stepDepartment, setStepDepartment] = useState(currentUser?.departmentName || 'Jabatan');
  const [stepNotes, setStepNotes] = useState('');

  // Access check
  const isConfidential = Boolean(
    doc.isConfidential ||
    doc.clearanceRequired === 'SULIT' ||
    doc.clearanceRequired === 'P&C' ||
    doc.clearanceRequired === 'RAHSIA_BESAR'
  );
  const requiredClearance = doc.clearanceRequired || (isConfidential ? 'SULIT' : 'BIASA');
  const hasSecurityClearance = currentUser
    ? currentUser.role === 'admin' ||
      doc.authorId === currentUser.uid ||
      (doc.allowedUsers && doc.allowedUsers.includes(currentUser.uid)) ||
      (!isConfidential && (!doc.clearanceRequired || doc.clearanceRequired === 'BIASA')) ||
      hasClearance(currentUser.clearanceLevel, requiredClearance, currentUser.role)
    : !isConfidential &&
      (!doc.clearanceRequired || doc.clearanceRequired === 'BIASA') &&
      (!doc.allowedUsers || doc.allowedUsers.length === 0) &&
      (!doc.allowedGroups || doc.allowedGroups.length === 0);

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

  const handleSaveWorkflowUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepStage.trim()) return;
    if (!currentUser) {
      if (onOpenLoginModal) onOpenLoginModal();
      else onShowToast('Akses Terhad', 'Sila log masuk untuk mengemaskini aliran paper.', 'error');
      return;
    }

    const newStep = {
      stage: stepStage.trim(),
      handledBy: `${currentUser.displayName} (No. ${currentUser.serviceNumber || '882104'})`,
      departmentName: `${stepDepartment} (${currentUser.unitName || 'Unit Operasi'})`,
      date: new Date().toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) + ' ' + new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
      status: 'selesai' as const,
      notes: stepNotes.trim() || `Status dikemaskini daripada "${doc.paperStatus}" kepada "${targetPaperStatus}".`,
      previousStatus: doc.paperStatus,
      newStatus: targetPaperStatus,
    };

    onUpdatePaperStatus(doc.id, targetPaperStatus, newStep);
    setShowWorkflowModal(false);
    setStepStage('');
    setStepNotes('');
    onShowToast('Status Paper Dikemaskini', `Paper kini berstatus: ${targetPaperStatus}`, 'success');
  };

  const selectedCompareRev = doc.revisions?.find((r) => r.id === compareRevId) || doc.revisions?.[0];

  const getPaperStatusBadge = (status: PaperStatus) => {
    switch (status) {
      case 'Diluluskan':
      case 'Selesai & Diarkibkan':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
      case 'Pindaan Diperlukan':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900';
      case 'Simpanan / Rujukan':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900';
      case 'Pengesahan Kewangan':
      case 'Semakan Jawatankuasa MPC/Tender':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

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
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{doc.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">v{doc.currentVersion}</span>
              <span aria-hidden="true">·</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPaperStatusBadge(doc.paperStatus)}`}>
                {doc.paperStatus}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{readTimeMin} minit bacaan</span>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
              {doc.title}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Button: Kemaskini Status / Aliran Paper */}
          {currentUser && currentUser.role !== 'viewer' && hasSecurityClearance && (
            <button
              onClick={() => {
                setTargetPaperStatus(doc.paperStatus);
                setStepStage(`Semakan ${currentUser.departmentName}`);
                setShowWorkflowModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-100 transition-colors shadow-xs"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Kemas Kini Aliran Paper</span>
            </button>
          )}

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

          {currentUser && currentUser.role !== 'viewer' && hasSecurityClearance && (
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sunting Fail</span>
              </button>
            </>
          )}

          {canDeleteDocument(doc, currentUser) && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-100 transition-colors shadow-xs"
              title="Padam Fail (Owner/Admin)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Padam Fail</span>
            </button>
          )}
        </div>
      </div>

      {/* Access Denied Shield */}
      {!hasSecurityClearance ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-8 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/60 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
              AKSES DISEKAT: KLASIFIKASI {doc.clearanceRequired === 'RAHSIA_BESAR' ? 'P&C' : doc.clearanceRequired}
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 max-w-md mx-auto leading-relaxed">
              Anda tidak mempunyai tapisan keselamatan yang mencukupi untuk membuka fail ini.{' '}
              {currentUser ? (
                <>Tapisan anda: <strong>{currentUser.clearanceLevel === 'RAHSIA_BESAR' ? 'P&C' : currentUser.clearanceLevel}</strong>, dokumen memerlukan tahap{' '}</>
              ) : (
                <>Sila log masuk rasmi dengan No. Perkhidmatan anda untuk menyemak dokumen ini. Dokumen memerlukan tahap{' '}</>
              )}
              <strong>{doc.clearanceRequired === 'RAHSIA_BESAR' ? 'P&C' : doc.clearanceRequired}</strong>.
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
          >
            Kembali ke Senarai Dokumen
          </button>
        </div>
      ) : (
        /* Authorized Main View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Column Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Metadata Summary Banner with Official Document Date and Creator Details */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Tarikh Dokumen: <strong className="text-slate-900 dark:text-white font-mono">{doc.documentDate || '2026-02-15'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Pencipta: <strong className="text-slate-900 dark:text-white">{doc.authorName}</strong>{' '}
                    {doc.creatorServiceNumber && (
                      <span className="font-mono text-[10px] text-slate-400">({doc.creatorServiceNumber})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    Kemaskini: <strong className="font-mono tabular-nums">{new Date(doc.updatedAt).toLocaleDateString('ms-MY')}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Status Semasa Paper:</span>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${getPaperStatusBadge(doc.paperStatus)}`}>
                    {doc.paperStatus}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  Dicipta pada: {new Date(doc.createdAt).toLocaleDateString('ms-MY')}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium pt-1">
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

            {/* Attachment Preview (PDF, Office, Image) - Support Multi-File */}
            {allAttachments.length > 0 && activeAttachment && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                {/* Header & Multi-File Selector */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      {(activeAttachment.type?.includes('pdf') || activeAttachment.name.toLowerCase().endsWith('.pdf')) ? (
                        <span className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600">
                          <FileText className="w-4 h-4" />
                        </span>
                      ) : activeAttachment.type?.startsWith('image/') ? (
                        <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                          <ImageIcon className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                          <File className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                          {activeAttachment.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {activeAttachment.type || 'Fail Dokumen'}
                          {activeAttachment.sizeCompressed && ` · ${formatBytes(activeAttachment.sizeCompressed)}`}
                          {allAttachments.length > 1 && ` (Fail ${allAttachments.findIndex((a) => a.id === activeAttachment.id) + 1} dari ${allAttachments.length})`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {activeAttachment.sizeOriginal && activeAttachment.sizeCompressed && activeAttachment.sizeOriginal > activeAttachment.sizeCompressed && (
                        <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatBytes(activeAttachment.sizeOriginal)} → {formatBytes(activeAttachment.sizeCompressed)} (Jimat{' '}
                          {Math.round(
                            ((activeAttachment.sizeOriginal - activeAttachment.sizeCompressed) /
                              activeAttachment.sizeOriginal) *
                              100
                          )}%)
                        </span>
                      )}
                      <a
                        href={activeAttachment.url}
                        download={activeAttachment.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Muat Turun Fail Ini</span>
                      </a>
                    </div>
                  </div>

                  {/* Multi-file switcher tabs if more than 1 attachment */}
                  {allAttachments.length > 1 && (
                    <div className="pt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      <span className="text-slate-400 text-[11px] shrink-0 font-medium">Semua Lampiran ({allAttachments.length}):</span>
                      {allAttachments.map((att, i) => {
                        const isSelected = att.id === activeAttachment.id;
                        return (
                          <button
                            key={att.id || i}
                            type="button"
                            onClick={() => setSelectedAttachmentId(att.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span>#{i + 1}</span>
                            <span className="max-w-[130px] truncate">{att.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Preview active attachment */}
                {(activeAttachment.type?.includes('pdf') || activeAttachment.name.toLowerCase().endsWith('.pdf') || activeAttachment.url.startsWith('data:application/pdf')) ? (
                  <div className="space-y-3">
                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-inner">
                      <iframe
                        src={activeAttachment.url}
                        className="w-full h-[520px] rounded-lg bg-white"
                        title={activeAttachment.name}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                      <span>Paparan fail PDF rasmi. Sekiranya tidak muncul pada pelayar, klik butang muat turun fail.</span>
                      <a
                        href={activeAttachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-semibold flex items-center gap-1 shrink-0 ml-2"
                      >
                        <span>Buka Penuh</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : activeAttachment.type?.startsWith('image/') || activeAttachment.url.startsWith('data:image/') ? (
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96 flex items-center justify-center bg-slate-950">
                    <img
                      src={activeAttachment.url}
                      alt={activeAttachment.name}
                      className="max-h-96 w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Fail lampiran sedia untuk dimuat turun dan disemak pada peranti anda.
                    </div>
                    <a
                      href={activeAttachment.url}
                      download={activeAttachment.name}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-xs font-semibold"
                    >
                      <Download className="w-3 h-3" />
                      <span>Muat Turun</span>
                    </a>
                  </div>
                )}
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
                    <h4 className="text-sm font-bold">Kandungan Terenkripsi Penuh (AES-256-GCM)</h4>
                    <p className="text-xs text-slate-300">
                      Fail ini dilindungi dengan kunci kriptografi klien. Masukkan kata laluan untuk membaca.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Kata laluan enkripsi..."
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                  <button
                    onClick={handleDecrypt}
                    disabled={isDecrypting}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isDecrypting ? 'Menyahkunci...' : 'Buka Enkripsi E2EE'}</span>
                  </button>
                </div>
                {decryptError && <p className="text-xs text-rose-400">{decryptError}</p>}
              </div>
            )}

            {/* Document Content Viewport */}
            {(!doc.isEncrypted || decryptedContent) && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Teks Dokumen Rasmi (Sorot Perenggan untuk Menandai Semakan)
                    </span>
                  </div>
                </div>

                {/* Floating highlight helper */}
                {highlightSelection && (
                  <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 p-2.5 rounded-lg flex items-center justify-between text-xs">
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

                <div
                  onMouseUp={handleTextSelection}
                  className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text p-2 rounded hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                >
                  {(decryptedContent || doc.content)?.trim() ? (
                    decryptedContent || doc.content
                  ) : (
                    <div className="text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-center border border-dashed border-slate-300 dark:border-slate-700">
                      Tiada teks manual dimasukkan. Sila rujuk fail lampiran utama yang disertakan di bahagian atas untuk menyemak dokumen.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Tabs for Kronologi, Komen, Versi */}
          <div className="space-y-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setActiveTab('kronologi')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'kronologi'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Kronologi ({doc.workflowChronology?.length || 0})</span>
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

            {/* TAB: Kronologi Aliran Kerja Paper Status (Requirement user: track record status paper) */}
            {activeTab === 'kronologi' && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Kronologi & Jejak Aliran Kerja Paper
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Dari penyediaan awal, semakan kewangan, hingga kelulusan.
                    </p>
                  </div>
                  {currentUser && currentUser.role !== 'viewer' && (
                    <button
                      onClick={() => {
                        setTargetPaperStatus(doc.paperStatus);
                        setStepStage(`Peringkat Baharu`);
                        setShowWorkflowModal(true);
                      }}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      + Tambah Aliran
                    </button>
                  )}
                </div>

                <div className="space-y-4 pt-1 max-h-[480px] overflow-y-auto">
                  {doc.workflowChronology && doc.workflowChronology.length > 0 ? (
                    doc.workflowChronology.map((step, idx) => {
                      const isCompleted = step.status === 'selesai';
                      const isCurrent = step.status === 'sedang_diproses';

                      return (
                        <div key={step.id || idx} className="relative pl-6 pb-2 last:pb-0">
                          {/* Vertical timeline line */}
                          {idx !== doc.workflowChronology.length - 1 && (
                            <div className="absolute left-2.5 top-5 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                          )}

                          {/* Node dot icon */}
                          <div
                            className={`absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-blue-600 text-white animate-pulse'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                            }`}
                          >
                            {isCompleted ? '✓' : idx + 1}
                          </div>

                          <div className="space-y-1 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {step.stage}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isCurrent
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {step.status}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500">
                              {step.handledBy} · <strong className="text-slate-700 dark:text-slate-300">{step.departmentName}</strong>
                            </p>

                            {step.previousStatus && step.newStatus && step.previousStatus !== step.newStatus && (
                              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold py-1 px-2 rounded bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                <span>{step.previousStatus}</span>
                                <span>→</span>
                                <span>{step.newStatus}</span>
                              </div>
                            )}

                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans mt-1">
                              {step.notes}
                            </p>

                            <p className="text-[10px] text-slate-400 font-mono tabular-nums pt-1">
                              {step.date}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Tiada kronologi aliran kerja didaftarkan.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Komen */}
            {activeTab === 'komen' && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Ulasan & Cadangan Semakan
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">{comments.length} Komen</span>
                </div>

                <form onSubmit={handleSubmitComment} className="space-y-2.5">
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
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="absolute right-2 bottom-3 p-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-md hover:opacity-90 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                <div className="space-y-3 pt-2 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {comments.map((c) => (
                    <div key={c.id} className="pt-3 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">{c.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                          {new Date(c.createdAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {c.revisionTag && (
                        <span className="text-[10px] font-medium text-blue-600">[{c.revisionTag}]</span>
                      )}
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Revisi */}
            {activeTab === 'revisi' && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Sejarah Kronologi Versi
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">{doc.revisions?.length || 1} Semakan</span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {doc.revisions?.map((rev) => (
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Update Paper Status & Add Workflow Step */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Kemas Kini Status Paper & Tambah Kronologi Aliran
                </h3>
              </div>
              <button onClick={() => setShowWorkflowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWorkflowUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Terkini Paper *
                </label>
                <select
                  value={targetPaperStatus}
                  onChange={(e) => setTargetPaperStatus(e.target.value as PaperStatus)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {PAPER_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peringkat Tindakan / Aliran *
                </label>
                <input
                  type="text"
                  required
                  value={stepStage}
                  onChange={(e) => setStepStage(e.target.value)}
                  placeholder="Contoh: Dihantar ke Jabatan Kewangan untuk Pengesahan"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan Pengendali *
                </label>
                <input
                  type="text"
                  required
                  value={stepDepartment}
                  onChange={(e) => setStepDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Semakan / Ulasan Rasmi *
                </label>
                <textarea
                  required
                  rows={3}
                  value={stepNotes}
                  onChange={(e) => setStepNotes(e.target.value)}
                  placeholder="Contoh: Peruntukan siling projek sebanyak RM 8.5M telah disahkan ada dalam belanjawan..."
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWorkflowModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold"
                >
                  Simpan & Catatkan Aliran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Compare Versions */}
      {showCompareModal && selectedCompareRev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Columns2 className="w-4 h-4 text-purple-600" />
                <span>Perbandingan Versi Terdahulu vs Versi Semasa (v{doc.currentVersion})</span>
              </h3>
              <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-600">
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
              <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/40 overflow-hidden">
                <p className="font-semibold text-xs mb-2">Versi {selectedCompareRev.version}</p>
                <div className="flex-1 overflow-y-auto text-xs font-mono whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                  {selectedCompareRev.contentSnapshot}
                </div>
              </div>
              <div className="flex flex-col border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 bg-white dark:bg-slate-900 overflow-hidden">
                <p className="font-semibold text-xs mb-2 text-emerald-600">Versi Semasa v{doc.currentVersion}</p>
                <div className="flex-1 overflow-y-auto text-xs font-mono whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                  {decryptedContent || doc.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Publish Revision */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Terbitkan Semakan Versi Baharu</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombor Versi Baharu</label>
                <input
                  type="text"
                  value={nextVersionInput}
                  onChange={(e) => setNextVersionInput(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Ringkasan Pindaan *</label>
                <input
                  type="text"
                  value={revisionSummaryInput}
                  onChange={(e) => setRevisionSummaryInput(e.target.value)}
                  placeholder="Contoh: Pindaan klausa bajet CAPEX..."
                  className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Kandungan Terpinda</label>
                <textarea
                  rows={5}
                  value={revisedContentInput}
                  onChange={(e) => setRevisedContentInput(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowRevisionModal(false)} className="px-3 py-1.5 text-slate-500">
                Batal
              </button>
              <button
                onClick={handlePublishRevision}
                disabled={!revisionSummaryInput.trim()}
                className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg font-semibold disabled:opacity-50"
              >
                Sahkan & Terbitkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Delete Document */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sahkan Pemadaman Fail
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini memerlukan pengesahan rasmi.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-slate-700 dark:text-slate-300">
                Adakah anda pasti mahu memadam fail/paper ini dari sistem?
              </p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                📄 {doc.title}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-medium">
                  {doc.category}
                </span>
                <span>Tarikh Dokumen: <strong>{doc.documentDate}</strong></span>
                <span>·</span>
                <span>Pencipta: <strong>{doc.authorName}</strong></span>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
              Amaran: Fail ini akan dikeluarkan sepenuhnya dari pangkalan data arkib. Sebagai Owner atau Pentadbir, rekod pemadaman ini akan direkodkan ke Log Audit.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Teruskan & Padam Fail</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
