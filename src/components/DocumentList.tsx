/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  DmsDocument,
  TaskCategory,
  UserProfile,
  CustomCategory,
  PaperStatus,
  hasClearance,
  canDeleteDocument,
} from '../types/dms';
import {
  Search,
  Filter,
  FileText,
  Lock,
  Download,
  Calendar,
  Building2,
  Trash2,
  Eye,
  FileSpreadsheet,
  FileCode,
  LayoutGrid,
  List,
  Copy,
  ArrowUpDown,
  X,
  ExternalLink,
  ImageIcon,
  User,
  Clock,
  GitBranch,
  Shield,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { formatBytes } from '../lib/imageCompressor';

interface DocumentListProps {
  documents: DmsDocument[];
  categories: CustomCategory[];
  currentUser: UserProfile | null;
  onSelectDocument: (doc: DmsDocument) => void;
  onDeleteDocument: (docId: string, title: string) => void;
  onExportPDF: (selectedDocs?: DmsDocument[]) => void;
  onExportCSV: (selectedDocs?: DmsDocument[]) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onOpenLoginModal?: () => void;
}

const TASK_CATEGORIES: ('Semua' | TaskCategory)[] = [
  'Semua',
  'Tugasan Projek',
  'Kelulusan Pengurusan',
  'Audit & Pematuhan',
  'Operasi Harian',
  'Arkib Digital',
];

const PAPER_STATUS_OPTIONS: ('Semua' | PaperStatus)[] = [
  'Semua',
  'Disediakan',
  'Dalam Semakan Jabatan',
  'Pengesahan Kewangan',
  'Semakan Jawatankuasa MPC/Tender',
  'Diluluskan',
  'Pindaan Diperlukan',
  'Simpanan / Rujukan',
  'Selesai & Diarkibkan',
];

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  categories,
  currentUser,
  onSelectDocument,
  onDeleteDocument,
  onExportPDF,
  onExportCSV,
  onShowToast,
  onOpenLoginModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedTaskCategory, setSelectedTaskCategory] = useState<'Semua' | TaskCategory>('Semua');
  const [selectedPaperStatus, setSelectedPaperStatus] = useState<'Semua' | PaperStatus>('Semua');
  const [securityFilter, setSecurityFilter] = useState<'semua' | 'biasa' | 'sulit' | 'e2ee'>('semua');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'kemaskini' | 'tarikh_dokumen' | 'tajuk' | 'versi'>('kemaskini');

  // Quick Slide-over Preview State
  const [previewDoc, setPreviewDoc] = useState<DmsDocument | null>(null);

  // In-App Document Deletion Confirmation State
  const [docToDelete, setDocToDelete] = useState<DmsDocument | null>(null);

  const handleExecuteDeleteDoc = () => {
    if (!docToDelete) return;
    onDeleteDocument(docToDelete.id, docToDelete.title);
    if (previewDoc && previewDoc.id === docToDelete.id) {
      setPreviewDoc(null);
    }
    setDocToDelete(null);
  };

  // Bulk Selection State
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // Extract unique tags across all documents
  const allTags = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => d.tags?.forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 15);
  }, [documents]);

  // Filtered and sorted documents with strict clearance-based visibility
  const filteredDocuments = useMemo(() => {
    let result = documents.filter((doc) => {
      // 1. KAWALAN SESI KOSONG / TIADA SESI AKTIF (GUEST):
      // By default selagi user tak log masuk:
      // Hanya fail atau paper biasa atau yang general atau yang tidak diassign kepada mana2 group atau individu
      if (!currentUser) {
        const isOrdinary =
          !doc.isConfidential &&
          (!doc.clearanceRequired || doc.clearanceRequired === 'BIASA');
        const hasIndividualAssignment = Array.isArray(doc.allowedUsers) && doc.allowedUsers.length > 0;
        const hasGroupAssignment = Array.isArray(doc.allowedGroups) && doc.allowedGroups.length > 0;

        if (!isOrdinary || hasIndividualAssignment || hasGroupAssignment) {
          return false;
        }
      } else {
        // 2. KAWALAN KESELAMATAN BERPENGGUNA (LOGGED IN):
        // Fail sulit dan P&C HANYA akan dipaparkan dalam senarai berdasarkan akses level pengguna
        const isRestrictedDoc =
          doc.isConfidential ||
          doc.clearanceRequired === 'SULIT' ||
          doc.clearanceRequired === 'P&C' ||
          (doc.clearanceRequired as string) === 'RAHSIA_BESAR';

        if (isRestrictedDoc) {
          const requiredLevel = doc.clearanceRequired || (doc.isConfidential ? 'SULIT' : 'BIASA');
          const userHasClearance =
            hasClearance(currentUser.clearanceLevel, requiredLevel, currentUser.role) ||
            doc.authorId === currentUser.uid ||
            (doc.allowedUsers && doc.allowedUsers.includes(currentUser.uid));

          if (!userHasClearance) {
            // Dokumen terperingkat disembunyikan sepenuhnya dari senarai untuk pengguna tanpa permit
            return false;
          }
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (doc.title || '').toLowerCase().includes(q);
        const matchesSummary = (doc.summary || '').toLowerCase().includes(q);
        const matchesAuthor = (doc.authorName || '').toLowerCase().includes(q);
        const matchesCreatorNum = (doc.creatorServiceNumber || '').toLowerCase().includes(q);
        const matchesTags = doc.tags?.some((t) => (t || '').toLowerCase().includes(q));
        const matchesCategory = (doc.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary && !matchesAuthor && !matchesCreatorNum && !matchesTags && !matchesCategory) {
          return false;
        }
      }

      if (selectedCategory !== 'Semua' && doc.category !== selectedCategory) {
        return false;
      }

      if (selectedTaskCategory !== 'Semua' && doc.taskCategory !== selectedTaskCategory) {
        return false;
      }

      if (selectedPaperStatus !== 'Semua' && doc.paperStatus !== selectedPaperStatus) {
        return false;
      }

      if (selectedTag && !doc.tags?.includes(selectedTag)) {
        return false;
      }

      if (securityFilter === 'biasa' && (doc.isConfidential || doc.clearanceRequired === 'SULIT' || doc.clearanceRequired === 'P&C')) {
        return false;
      }
      if (securityFilter === 'sulit' && !doc.isConfidential && doc.clearanceRequired !== 'SULIT' && doc.clearanceRequired !== 'P&C') {
        return false;
      }
      if (securityFilter === 'e2ee' && !doc.isEncrypted) return false;

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'kemaskini') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      if (sortBy === 'tarikh_dokumen') {
        return new Date(b.documentDate || b.createdAt).getTime() - new Date(a.documentDate || a.createdAt).getTime();
      }
      if (sortBy === 'tajuk') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'versi') {
        return parseFloat(b.currentVersion) - parseFloat(a.currentVersion);
      }
      return 0;
    });

    return result;
  }, [
    documents,
    searchQuery,
    selectedCategory,
    selectedTaskCategory,
    selectedPaperStatus,
    selectedTag,
    securityFilter,
    sortBy,
    currentUser?.clearanceLevel,
    currentUser?.role,
    currentUser?.uid,
  ]);

  const handleToggleSelectDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedDocIds.size === filteredDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  const getSelectedDocs = () => {
    return documents.filter((d) => selectedDocIds.has(d.id));
  };

  const handleCopyId = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(docId);
    onShowToast('Nombor Rujukan Disalin', `ID [${docId}] sedia untuk dipautkan.`, 'info');
  };

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
    <div className="space-y-5">
      {/* Guest Mode Notice Banner */}
      {!currentUser && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-blue-900 dark:text-blue-200">
                Mod Akses Awam (Tiada Sesi Aktif)
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-[11px] mt-0.5">
                Memaparkan fail & paper biasa (general) yang tidak dikhaskan kepada mana-mana individu atau kumpulan. Sila log masuk rasmi untuk capaian dokumen sulit dan modul khas.
              </p>
            </div>
          </div>
          {onOpenLoginModal && (
            <button
              onClick={onOpenLoginModal}
              className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              Log Masuk Rasmi
            </button>
          )}
        </div>
      )}

      {/* Search and Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mengikut tajuk paper, pencipta, no. perkhidmatan, atau tagar..."
            className="w-full pl-10 pr-16 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Kosongkan
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-0.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Paparan Jadual Padat"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'cards'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Paparan Kad Visual"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="kemaskini">Terkini Dikemaskini</option>
              <option value="tarikh_dokumen">Tarikh Dokumen</option>
              <option value="tajuk">Tajuk (A - Z)</option>
              <option value="versi">Versi Tertinggi</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onExportPDF(selectedDocIds.size > 0 ? getSelectedDocs() : undefined)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => onExportCSV(selectedDocIds.size > 0 ? getSelectedDocs() : undefined)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedDocIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl text-xs shadow-md">
          <div className="flex items-center gap-3">
            <span className="font-semibold">{selectedDocIds.size} fail dipilih</span>
            <button onClick={handleSelectAll} className="text-slate-300 hover:text-white underline text-[11px]">
              {selectedDocIds.size === filteredDocuments.length ? 'Nyahpilih Semua' : 'Pilih Semua'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportPDF(getSelectedDocs())}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-white font-medium"
            >
              Eksport PDF Terpilih
            </button>
            <button
              onClick={() => onExportCSV(getSelectedDocs())}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium"
            >
              Eksport CSV Terpilih
            </button>
            <button onClick={() => setSelectedDocIds(new Set())} className="p-1.5 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Categorization Dashboard */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        {/* Dynamic Categories (SOP, Paper DAL, Paper Tender, Paper MPC, etc.) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Kategori:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedCategory('Semua')}
              className={`px-3 py-1 rounded-lg whitespace-nowrap font-medium text-xs transition-colors ${
                selectedCategory === 'Semua'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Semua ({documents.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.code)}
                className={`px-3 py-1 rounded-lg whitespace-nowrap font-medium text-xs transition-colors ${
                  selectedCategory === cat.code
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.code}
              </button>
            ))}
          </div>
        </div>

        {/* Paper Status & Security Classification Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Status Paper Filter */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> Status Paper:
            </span>
            <div className="flex items-center gap-1">
              {PAPER_STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedPaperStatus(st)}
                  className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors ${
                    selectedPaperStatus === st
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Security Pill Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => setSecurityFilter('semua')}
              className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap ${
                securityFilter === 'semua' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium shadow-xs' : 'text-slate-500'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSecurityFilter('sulit')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap ${
                securityFilter === 'sulit' ? 'bg-white dark:bg-slate-900 text-rose-600 font-medium shadow-xs' : 'text-slate-500'
              }`}
            >
              <Lock className="w-3 h-3 text-rose-500" />
              <span>Sulit & P&C</span>
            </button>
            <button
              onClick={() => setSecurityFilter('e2ee')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap ${
                securityFilter === 'e2ee' ? 'bg-white dark:bg-slate-900 text-emerald-600 font-medium shadow-xs' : 'text-slate-500'
              }`}
            >
              <FileCode className="w-3 h-3 text-emerald-500" />
              <span>E2EE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View: Table Mode with Creator & Full Dates */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedDocIds.size > 0 && selectedDocIds.size === filteredDocuments.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-4 py-3">Tajuk Dokumen / Paper</th>
                  <th className="px-3 py-3">Kategori</th>
                  <th className="px-3 py-3">Tarikh Dokumen</th>
                  <th className="px-3 py-3">Pencipta</th>
                  <th className="px-3 py-3">Status Aliran</th>
                  <th className="px-3 py-3">Dicipta / Terkini</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tiada dokumen padan dengan kriteria carian.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => {
                    const isSelected = selectedDocIds.has(doc.id);
                    const isConfidential = doc.isConfidential;

                    return (
                      <tr
                        key={doc.id}
                        onClick={() => onSelectDocument(doc)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => handleToggleSelectDoc(doc.id, e)}
                            onChange={() => {}}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3.5 max-w-sm">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 transition-colors line-clamp-1">
                              {doc.title}
                            </span>
                            {isConfidential && (
                              <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 shrink-0">
                                {doc.clearanceRequired === 'RAHSIA_BESAR' ? 'P&C' : doc.clearanceRequired}
                              </span>
                            )}
                            {doc.attachmentUrl && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1 ${
                                (doc.attachmentType?.includes('pdf') || doc.attachmentName?.toLowerCase().endsWith('.pdf'))
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300'
                                  : doc.attachmentType?.startsWith('image/')
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                              }`}>
                                {(doc.attachmentType?.includes('pdf') || doc.attachmentName?.toLowerCase().endsWith('.pdf')) ? 'PDF' : doc.attachmentType?.startsWith('image/') ? 'Imej' : 'Fail'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{doc.summary}</p>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                            {doc.category}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap font-mono tabular-nums text-slate-800 dark:text-slate-200 font-semibold">
                          {doc.documentDate || '—'}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{doc.authorName}</p>
                          {doc.creatorServiceNumber && (
                            <p className="font-mono text-[10px] text-slate-400">No. {doc.creatorServiceNumber}</p>
                          )}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPaperStatusBadge(doc.paperStatus)}`}>
                            {doc.paperStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap text-[11px] font-mono tabular-nums text-slate-500">
                          <div>Cipta: {new Date(doc.createdAt).toLocaleDateString('ms-MY')}</div>
                          <div className="text-slate-400 text-[10px]">
                            Kemas kini: {new Date(doc.updatedAt).toLocaleDateString('ms-MY')}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                              title="Pratinjau Pantas Sisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleCopyId(doc.id, e)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                              title="Salin Nombor Rujukan"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {canDeleteDocument(doc, currentUser) && (
                              <button
                                onClick={() => setDocToDelete(doc)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                title="Padam Dokumen (Owner/Admin)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main View: Visual Cards Mode */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const isConfidential = doc.isConfidential;

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{doc.category}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPaperStatusBadge(doc.paperStatus)}`}>
                      {doc.paperStatus}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {doc.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>Tarikh Dokumen: <strong>{doc.documentDate}</strong></span>
                    <span>v{doc.currentVersion}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {doc.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{doc.authorName}</p>
                    <p className="text-[10px]">Cipta: {new Date(doc.createdAt).toLocaleDateString('ms-MY')}</p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {isConfidential && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">
                        {doc.clearanceRequired === 'RAHSIA_BESAR' ? 'P&C' : doc.clearanceRequired}
                      </span>
                    )}
                    {doc.attachmentUrl && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-300">
                        {(doc.attachmentType?.includes('pdf') || doc.attachmentName?.toLowerCase().endsWith('.pdf')) ? 'PDF' : 'Fail'}
                      </span>
                    )}
                    <button onClick={() => setPreviewDoc(doc)} className="p-1 hover:text-slate-900" title="Pratinjau">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canDeleteDocument(doc, currentUser) && (
                      <button
                        onClick={() => setDocToDelete(doc)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Padam Dokumen (Owner/Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Preview */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 space-y-4 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-mono text-xs text-slate-400">Pratinjau Pantas</span>
                <button onClick={() => setPreviewDoc(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-xs text-blue-600 font-semibold">{previewDoc.category}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{previewDoc.title}</h3>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Tarikh & Status Paper:</p>
                <p>Tarikh Dokumen: <strong className="font-mono">{previewDoc.documentDate}</strong></p>
                <p>Status: <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPaperStatusBadge(previewDoc.paperStatus)}`}>{previewDoc.paperStatus}</span></p>
                <p>Pencipta: <strong>{previewDoc.authorName}</strong> (No. {previewDoc.creatorServiceNumber})</p>
                <p>Dicipta: {new Date(previewDoc.createdAt).toLocaleDateString('ms-MY')}</p>
                <p>Terkini Dikemaskini: {new Date(previewDoc.updatedAt).toLocaleDateString('ms-MY')}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Ringkasan:</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{previewDoc.summary}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  const target = previewDoc;
                  setPreviewDoc(null);
                  onSelectDocument(target);
                }}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Paparan Penuh & Kronologi</span>
              </button>

              {canDeleteDocument(previewDoc, currentUser) && (
                <button
                  onClick={() => setDocToDelete(previewDoc)}
                  className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Padam Fail Ini</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Delete Document */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sahkan Pemadaman Fail
                </h3>
                <p className="text-xs text-slate-500">
                  Pengesahan diperlukan untuk meneruskan.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-slate-700 dark:text-slate-300">
                Adakah anda pasti mahu memadam fail ini dari arkib?
              </p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                📄 {docToDelete.title}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-medium">
                  {docToDelete.category}
                </span>
                <span>Tarikh: <strong>{docToDelete.documentDate}</strong></span>
                <span>·</span>
                <span>Pencipta: <strong>{docToDelete.authorName}</strong></span>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
              Amaran: Fail ini akan dikeluarkan sepenuhnya dari simpanan sistem dan rekod pemadaman akan disimpan dalam Log Audit.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteDoc}
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
