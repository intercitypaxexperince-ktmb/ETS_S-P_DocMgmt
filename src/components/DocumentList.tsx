/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  DmsDocument,
  DocumentCategory,
  TaskCategory,
  UserProfile,
} from '../types/dms';
import {
  Search,
  Filter,
  FileText,
  Lock,
  ShieldAlert,
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
  Check,
  ArrowUpDown,
  X,
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import { formatBytes } from '../lib/imageCompressor';

interface DocumentListProps {
  documents: DmsDocument[];
  currentUser: UserProfile;
  onSelectDocument: (doc: DmsDocument) => void;
  onDeleteDocument: (docId: string, title: string) => void;
  onExportPDF: (selectedDocs?: DmsDocument[]) => void;
  onExportCSV: (selectedDocs?: DmsDocument[]) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORIES: ('Semua' | DocumentCategory)[] = [
  'Semua',
  'Dasar & Polisi',
  'Kontrak & Perjanjian',
  'Kewangan & Bajet',
  'Teknikal & IT',
  'Laporan Strategik',
  'Sumber Manusia',
  'Minit Mesyuarat',
];

const TASK_CATEGORIES: ('Semua' | TaskCategory)[] = [
  'Semua',
  'Tugasan Projek',
  'Kelulusan Pengurusan',
  'Audit & Pematuhan',
  'Operasi Harian',
  'Arkib Digital',
];

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  currentUser,
  onSelectDocument,
  onDeleteDocument,
  onExportPDF,
  onExportCSV,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | DocumentCategory>('Semua');
  const [selectedTaskCategory, setSelectedTaskCategory] = useState<'Semua' | TaskCategory>('Semua');
  const [securityFilter, setSecurityFilter] = useState<'semua' | 'biasa' | 'sulit' | 'e2ee'>('semua');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'tarikh' | 'tajuk' | 'versi'>('tarikh');

  // Quick Slide-over Preview State
  const [previewDoc, setPreviewDoc] = useState<DmsDocument | null>(null);

  // Bulk Selection State
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // Extract unique tags across all documents
  const allTags = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => d.tags?.forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 15);
  }, [documents]);

  // Filtered and sorted documents
  const filteredDocuments = useMemo(() => {
    let result = documents.filter((doc) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesSummary = doc.summary?.toLowerCase().includes(q);
        const matchesAuthor = doc.authorName.toLowerCase().includes(q);
        const matchesTags = doc.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesAuthor && !matchesTags) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'Semua' && doc.category !== selectedCategory) {
        return false;
      }

      // Task category
      if (selectedTaskCategory !== 'Semua' && doc.taskCategory !== selectedTaskCategory) {
        return false;
      }

      // Tag
      if (selectedTag && !doc.tags?.includes(selectedTag)) {
        return false;
      }

      // Security filter
      if (securityFilter === 'biasa' && doc.isConfidential) return false;
      if (securityFilter === 'sulit' && !doc.isConfidential) return false;
      if (securityFilter === 'e2ee' && !doc.isEncrypted) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'tarikh') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
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
  }, [documents, searchQuery, selectedCategory, selectedTaskCategory, selectedTag, securityFilter, sortBy]);

  // Bulk selection helpers
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

  return (
    <div className="space-y-5">
      {/* Search and Top Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Instant Search Bar with clear affordance */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Carian pantas mengikut tajuk dokumen, tagar, perenggan, atau pengarang..."
            className="w-full pl-10 pr-16 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors shadow-xs"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Kosongkan
            </button>
          ) : (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
              Cari
            </span>
          )}
        </div>

        {/* View Switcher, Sort and Export Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
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
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Paparan Kad Visual"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="tarikh">Terkini Dikemaskini</option>
              <option value="tajuk">Tajuk (A - Z)</option>
              <option value="versi">Versi Tertinggi</option>
            </select>
          </div>

          {/* Export Dropdown / Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onExportPDF(selectedDocIds.size > 0 ? getSelectedDocs() : undefined)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs"
              title="Eksport Fail ke Format PDF Rasmi"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => onExportCSV(selectedDocIds.size > 0 ? getSelectedDocs() : undefined)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs"
              title="Eksport Senarai Dokumen ke Format CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (Appears when items are selected) */}
      {selectedDocIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl text-xs shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="font-semibold">{selectedDocIds.size} fail dipilih</span>
            <span aria-hidden="true" className="text-slate-600">|</span>
            <button
              onClick={handleSelectAll}
              className="text-slate-300 hover:text-white underline text-[11px]"
            >
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
            <button
              onClick={() => setSelectedDocIds(new Set())}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Categorization Dashboard */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Kategori:
          </span>
          <div className="flex items-center gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg whitespace-nowrap font-medium text-xs transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Task Category & Security Clearance Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-slate-400 font-medium shrink-0">Tugasan:</span>
            <div className="flex items-center gap-1">
              {TASK_CATEGORIES.map((task) => (
                <button
                  key={task}
                  onClick={() => setSelectedTaskCategory(task)}
                  className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors ${
                    selectedTaskCategory === task
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {task}
                </button>
              ))}
            </div>
          </div>

          {/* Security Pill Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => setSecurityFilter('semua')}
              className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors ${
                securityFilter === 'semua'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semua ({documents.length})
            </button>
            <button
              onClick={() => setSecurityFilter('sulit')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors ${
                securityFilter === 'sulit'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-medium shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3 h-3 text-rose-500" />
              <span>Fail Sulit ({documents.filter((d) => d.isConfidential).length})</span>
            </button>
            <button
              onClick={() => setSecurityFilter('e2ee')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors ${
                securityFilter === 'e2ee'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-medium shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3 h-3 text-emerald-500" />
              <span>E2EE Kripto ({documents.filter((d) => d.isEncrypted).length})</span>
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <span className="text-slate-400 font-medium shrink-0">Tagar Pintar:</span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag('')}
                className="text-slate-600 dark:text-slate-300 underline font-medium mr-1.5"
              >
                Papar Semua Tagar
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Counter bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Menunjukkan <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{filteredDocuments.length}</strong> daripada{' '}
          <strong className="tabular-nums">{documents.length}</strong> fail arkib
        </span>
        <span className="font-mono text-[11px]">
          Hak Akses Anda: <strong className="uppercase text-slate-700 dark:text-slate-300">{currentUser.role}</strong> (Tapisan: {currentUser.clearanceLevel})
        </span>
      </div>

      {/* Main View: Table Mode */}
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
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                    />
                  </th>
                  <th className="px-4 py-3">Tajuk Dokumen</th>
                  <th className="px-4 py-3">Kategori & Tugasan</th>
                  <th className="px-3 py-3">Versi</th>
                  <th className="px-3 py-3">Klasifikasi</th>
                  <th className="px-4 py-3">Pengarang & Tarikh</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tiada fail padan dengan kriteria carian.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => {
                    const isSelected = selectedDocIds.has(doc.id);
                    const isConfidential = doc.isConfidential;
                    const hasUserAccess =
                      currentUser.role === 'admin' ||
                      !isConfidential ||
                      (doc.allowedUsers && doc.allowedUsers.includes(currentUser.uid)) ||
                      currentUser.clearanceLevel === 'RAHSIA_BESAR' ||
                      (currentUser.clearanceLevel === 'SULIT' && doc.clearanceRequired !== 'RAHSIA_BESAR');

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
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                          />
                        </td>
                        <td className="px-4 py-3.5 max-w-sm">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                              {doc.title}
                            </p>
                            {doc.isEncrypted && (
                              <span className="text-[10px] text-emerald-600 font-mono" title="Terenkripsi AES-256-GCM">
                                [E2EE]
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{doc.summary}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{doc.category}</p>
                          <p className="text-[11px] text-slate-400">{doc.taskCategory}</p>
                        </td>
                        <td className="px-3 py-3.5 font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                          v{doc.currentVersion}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          {isConfidential ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                              <Lock className="w-3 h-3" />
                              <span>{doc.clearanceRequired}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">TERBUKA</span>
                          )}
                          {!hasUserAccess && (
                            <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">
                              Capaian Terhad
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{doc.authorName}</p>
                          <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString('ms-MY')}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Pratinjau Pantas Sisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleCopyId(doc.id, e)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Salin Nombor Rujukan Fail"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {currentUser.role === 'admin' && (
                              <button
                                onClick={() => onDeleteDocument(doc.id, doc.title)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Padam Dokumen (Kuasa Admin)"
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
            const isSelected = selectedDocIds.has(doc.id);
            const isConfidential = doc.isConfidential;
            const hasUserAccess =
              currentUser.role === 'admin' ||
              !isConfidential ||
              (doc.allowedUsers && doc.allowedUsers.includes(currentUser.uid)) ||
              currentUser.clearanceLevel === 'RAHSIA_BESAR' ||
              (currentUser.clearanceLevel === 'SULIT' && doc.clearanceRequired !== 'RAHSIA_BESAR');

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-5 space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 dark:border-blue-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.category}</span>
                    <span className="font-mono tabular-nums">v{doc.currentVersion}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {doc.summary}
                  </p>

                  {/* Attachment indicator if present */}
                  {doc.attachmentUrl && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Lampiran Imej Dimampat ({formatBytes(doc.attachmentSizeCompressed || 200000)})</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{doc.authorName}</span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {isConfidential && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200">
                        {doc.clearanceRequired}
                      </span>
                    )}
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1 hover:text-slate-900 dark:hover:text-white"
                      title="Pratinjau Ringkas"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Slide-Over Preview Drawer */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 space-y-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-mono text-xs text-slate-400">Pratinjau Pantas</span>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">
                  {previewDoc.category} · v{previewDoc.currentVersion}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {previewDoc.title}
                </h3>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Ringkasan Eksekutif:</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{previewDoc.summary}</p>
              </div>

              {previewDoc.attachmentUrl && (
                <div className="space-y-2 text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Lampiran Imej Dimampatkan:</p>
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 max-h-48 flex items-center justify-center">
                    <img
                      src={previewDoc.attachmentUrl}
                      alt={previewDoc.attachmentName}
                      className="max-h-48 w-auto object-contain"
                    />
                  </div>
                  {previewDoc.attachmentSizeOriginal && previewDoc.attachmentSizeCompressed && (
                    <p className="text-[11px] font-mono text-emerald-600 font-medium">
                      Saiz: {formatBytes(previewDoc.attachmentSizeOriginal)} → {formatBytes(previewDoc.attachmentSizeCompressed)} (Jimat{' '}
                      {Math.round(
                        ((previewDoc.attachmentSizeOriginal - previewDoc.attachmentSizeCompressed) /
                          previewDoc.attachmentSizeOriginal) *
                          100
                      )}
                      %)
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>Klasifikasi Keselamatan:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {previewDoc.isConfidential ? previewDoc.clearanceRequired : 'TERBUKA'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Enkripsi Hujung-ke-Hujung:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {previewDoc.isEncrypted ? 'AES-256-GCM' : 'Tiada'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Pengarang Asal:</span>
                  <strong className="text-slate-900 dark:text-white">{previewDoc.authorName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tarikh Kemas Kini:</span>
                  <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                    {new Date(previewDoc.updatedAt || previewDoc.createdAt).toLocaleString('ms-MY')}
                  </strong>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => {
                  const target = previewDoc;
                  setPreviewDoc(null);
                  onSelectDocument(target);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Paparan Penuh & Semakan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
