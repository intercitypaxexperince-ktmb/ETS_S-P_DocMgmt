/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  DmsFolder,
  DmsDocument,
  UserProfile,
  UserGroup,
  ClearanceLevel,
  canUserAccessFolder,
  getDocumentEffectiveAccess,
  hasClearance,
  isSuperAdmin,
} from '../types/dms';
import {
  Folder,
  FolderPlus,
  FolderOpen,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  FileText,
  FileSpreadsheet,
  FileCode,
  Shield,
  Users,
  User,
  Plus,
  ArrowRight,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  Move,
  Lock,
  Clock,
  Sparkles,
  X,
  Check,
  Building2,
  HardDriveDownload,
  CheckCircle,
} from 'lucide-react';

interface DriveFolderViewProps {
  folders: DmsFolder[];
  documents: DmsDocument[];
  groups: UserGroup[];
  users: UserProfile[];
  currentUser: UserProfile;
  onSelectDocument: (doc: DmsDocument) => void;
  onOpenCreateDocumentModal: (targetFolderId?: string) => void;
  onCreateFolder: (folder: Omit<DmsFolder, 'id' | 'createdAt'>) => void;
  onUpdateFolder: (folderId: string, updates: Partial<DmsFolder>) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveDocumentToFolder: (documentId: string, targetFolderId: string | null) => void;
  onToggleOfflineAvailable: (docId: string, available: boolean) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const FOLDER_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/60', icon: 'text-blue-600 dark:text-blue-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60', icon: 'text-amber-600 dark:text-amber-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/60', icon: 'text-emerald-600 dark:text-emerald-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/60', icon: 'text-purple-600 dark:text-purple-400' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800/60', icon: 'text-rose-600 dark:text-rose-400' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/60', icon: 'text-indigo-600 dark:text-indigo-400' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-800 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', icon: 'text-slate-600 dark:text-slate-400' },
};

export const DriveFolderView: React.FC<DriveFolderViewProps> = ({
  folders,
  documents,
  groups,
  users,
  currentUser,
  onSelectDocument,
  onOpenCreateDocumentModal,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveDocumentToFolder,
  onToggleOfflineAvailable,
  onShowToast,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DmsFolder | null>(null);
  const [isMoveDocModalOpen, setIsMoveDocModalOpen] = useState(false);
  const [docToMove, setDocToMove] = useState<DmsDocument | null>(null);

  // Folder form state
  const [formFolderName, setFormFolderName] = useState('');
  const [formFolderDesc, setFormFolderDesc] = useState('');
  const [formFolderClearance, setFormFolderClearance] = useState<ClearanceLevel>('BIASA');
  const [formFolderColor, setFormFolderColor] = useState('blue');
  const [formAllowedGroups, setFormAllowedGroups] = useState<string[]>([]);
  const [formAllowedUsers, setFormAllowedUsers] = useState<string[]>([]);

  // Current folder object
  const currentFolder = useMemo(() => {
    return folders.find((f) => f.id === currentFolderId) || null;
  }, [folders, currentFolderId]);

  // Compute breadcrumb trail
  const breadcrumbs = useMemo(() => {
    const trail: { id: string | null; name: string }[] = [{ id: null, name: 'ArkaDrive Utama' }];
    if (!currentFolderId) return trail;

    const buildTrail = (folderId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return;
      if (folder.parentId) {
        buildTrail(folder.parentId);
      }
      trail.push({ id: folder.id, name: folder.name });
    };

    buildTrail(currentFolderId);
    return trail;
  }, [folders, currentFolderId]);

  // Visible child folders
  const childFolders = useMemo(() => {
    return folders.filter((f) => {
      const isParentMatch = currentFolderId ? f.parentId === currentFolderId : !f.parentId;
      if (!isParentMatch) return false;

      // Access filter: user must be able to access the folder
      return canUserAccessFolder(f, currentUser, groups);
    });
  }, [folders, currentFolderId, currentUser, groups]);

  // Documents in current folder
  const currentDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const isInFolder = currentFolderId
        ? doc.folderId === currentFolderId
        : !doc.folderId || doc.folderId === null;

      if (!isInFolder) return false;

      // Check document access
      const access = getDocumentEffectiveAccess(doc, currentUser, groups);
      if (!access.canAccess) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q) ||
          doc.authorName.toLowerCase().includes(q) ||
          doc.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [documents, currentFolderId, currentUser, groups, searchQuery]);

  const handleOpenCreateFolder = () => {
    setEditingFolder(null);
    setFormFolderName('');
    setFormFolderDesc('');
    setFormFolderClearance(currentFolder ? currentFolder.clearanceLevel : 'BIASA');
    setFormFolderColor(currentFolder ? currentFolder.color || 'blue' : 'blue');
    setFormAllowedGroups(currentFolder ? currentFolder.allowedGroups || [] : []);
    setFormAllowedUsers([]);
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolder = (f: DmsFolder) => {
    setEditingFolder(f);
    setFormFolderName(f.name);
    setFormFolderDesc(f.description || '');
    setFormFolderClearance(f.clearanceLevel);
    setFormFolderColor(f.color || 'blue');
    setFormAllowedGroups(f.allowedGroups || []);
    setFormAllowedUsers(f.allowedUsers || []);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFolderName.trim()) {
      onShowToast('Nama Diperlukan', 'Sila masukkan nama folder.', 'error');
      return;
    }

    if (editingFolder) {
      onUpdateFolder(editingFolder.id, {
        name: formFolderName.trim(),
        description: formFolderDesc.trim(),
        clearanceLevel: formFolderClearance,
        color: formFolderColor,
        allowedGroups: formAllowedGroups,
        allowedUsers: formAllowedUsers,
      });
      onShowToast('Folder Dikemaskini', `Folder "${formFolderName}" berjaya dikemaskini.`, 'success');
    } else {
      onCreateFolder({
        name: formFolderName.trim(),
        parentId: currentFolderId,
        description: formFolderDesc.trim(),
        clearanceLevel: formFolderClearance,
        color: formFolderColor,
        allowedGroups: formAllowedGroups,
        allowedUsers: formAllowedUsers,
        createdBy: currentUser.displayName,
      });
      onShowToast('Folder Dicipta', `Folder "${formFolderName}" berjaya diwujudkan.`, 'success');
    }
    setIsFolderModalOpen(false);
  };

  const handleDeleteFolderConfirm = (f: DmsFolder) => {
    // Check if subfolders exist
    const hasChildren = folders.some((cf) => cf.parentId === f.id);
    const hasDocs = documents.some((d) => d.folderId === f.id);

    if (hasChildren) {
      onShowToast(
        'Gagal Memadam Folder',
        `Folder "${f.name}" mengandungi sub-folder. Sila padam atau pindahkan sub-folder terlebih dahulu.`,
        'error'
      );
      return;
    }

    const docCount = documents.filter((d) => d.folderId === f.id).length;
    const confirmMsg = docCount > 0
      ? `Folder "${f.name}" mengandungi ${docCount} dokumen. Semua dokumen akan dialihkan ke Luar Folder (Utama). Adakah anda pasti ingin memadam?`
      : `Adakah anda pasti ingin memadam folder "${f.name}"?`;

    if (confirm(confirmMsg)) {
      onDeleteFolder(f.id);
      if (currentFolderId === f.id) {
        setCurrentFolderId(f.parentId || null);
      }
      onShowToast('Folder Dipadam', `Folder "${f.name}" telah dikeluarkan.`, 'info');
    }
  };

  const handleOpenMoveDoc = (doc: DmsDocument) => {
    setDocToMove(doc);
    setIsMoveDocModalOpen(true);
  };

  const handleExecuteMove = (targetFolderId: string | null) => {
    if (!docToMove) return;
    onMoveDocumentToFolder(docToMove.id, targetFolderId);
    const targetName = targetFolderId
      ? folders.find((f) => f.id === targetFolderId)?.name || 'Folder'
      : 'Utama (Root)';
    onShowToast('Dokumen Dialihkan', `"${docToMove.title}" dipindahkan ke ${targetName}.`, 'success');
    setIsMoveDocModalOpen(false);
    setDocToMove(null);
  };

  const getDocIcon = (doc: DmsDocument) => {
    if (doc.category.includes('Paper') || doc.category.includes('Tender') || doc.category.includes('DAL')) {
      return <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
    if (doc.category.includes('Invois') || doc.category.includes('Kewangan')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
    return <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  };

  return (
    <div className="space-y-5">
      {/* Google Drive Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Breadcrumb Path Trail */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-sm font-medium">
            {breadcrumbs.map((b, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={b.id ?? 'root'}>
                  <button
                    onClick={() => setCurrentFolderId(b.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                      isLast
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {idx === 0 ? (
                      <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Folder className="w-4 h-4 text-amber-500" />
                    )}
                    <span>{b.name}</span>
                  </button>
                  {!isLast && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenCreateFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-amber-500" />
              <span>Folder Baharu</span>
            </button>

            <button
              onClick={() => onOpenCreateDocumentModal(currentFolderId || undefined)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Cipta Dokumen / Paper</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Paparan Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Paparan Senarai"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search within Current Folder */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari fail di ${currentFolder ? currentFolder.name : 'ArkaDrive'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span>{childFolders.length} Folder</span>
            <span>·</span>
            <span>{currentDocuments.length} Dokumen / Paper</span>
          </div>
        </div>
      </div>

      {/* Folders Section */}
      {childFolders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Folder ({childFolders.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {childFolders.map((f) => {
              const colorCfg = FOLDER_COLORS[f.color || 'blue'] || FOLDER_COLORS.blue;
              const docCount = documents.filter((d) => d.folderId === f.id).length;
              const subCount = folders.filter((sf) => sf.parentId === f.id).length;
              const assignedGroupNames = groups
                .filter((g) => f.allowedGroups?.includes(g.id))
                .map((g) => g.name);

              return (
                <div
                  key={f.id}
                  className={`group bg-white dark:bg-slate-900 border ${colorCfg.border} rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
                >
                  <div
                    onClick={() => setCurrentFolderId(f.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-lg ${colorCfg.bg}`}>
                        <Folder className={`w-6 h-6 ${colorCfg.icon}`} />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {f.clearanceLevel}
                        </span>
                      </div>
                    </div>

                    <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {f.name}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                      {f.description || `${docCount} dokumen`}
                    </p>
                  </div>

                  {/* Folder Footer Meta & Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">
                      {docCount} fail {subCount > 0 && `· ${subCount} sub`}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditFolder(f)}
                        className="p-1 hover:text-slate-900 dark:hover:text-white rounded"
                        title="Tetapan Akses & Kumpulan"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFolderConfirm(f)}
                        className="p-1 hover:text-rose-600 rounded"
                        title="Padam Folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          Dokumen & Kertas Kerja ({currentDocuments.length})
        </h3>

        {currentDocuments.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Folder Ini Kosong
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tiada dokumen atau paper dalam folder ini. Cipta fail baharu atau pindahkan dokumen sedia ada ke sini.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => onOpenCreateDocumentModal(currentFolderId || undefined)}
                className="px-3.5 py-1.5 text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium"
              >
                Cipta Dokumen Baharu
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentDocuments.map((doc) => {
              const accessInfo = getDocumentEffectiveAccess(doc, currentUser, groups);

              return (
                <div
                  key={doc.id}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div
                    onClick={() => onSelectDocument(doc)}
                    className="cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {getDocIcon(doc)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          v{doc.currentVersion}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            doc.clearanceRequired === 'P&C'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : doc.clearanceRequired === 'SULIT'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {doc.clearanceRequired}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                        {doc.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                          {doc.category}
                        </span>
                        <span>{doc.documentDate}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{doc.authorName.split(' ')[0]}</span>
                      <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                        {doc.paperStatus}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Move & Offline Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleOpenMoveDoc(doc)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      title="Pindah ke Folder Lain"
                    >
                      <Move className="w-3 h-3" />
                      <span>Pindah</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onToggleOfflineAvailable(doc.id, !doc.offlineAvailable)}
                        className={`p-1 rounded transition-colors ${
                          doc.offlineAvailable
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={doc.offlineAvailable ? 'Tersedia Luar Talian (Offline)' : 'Muat turun untuk Luar Talian'}
                      >
                        <HardDriveDownload className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onSelectDocument(doc)}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                        title="Buka Dokumen"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View (Google Drive Table) */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700 font-medium">
                <tr>
                  <th className="px-4 py-3">Nama Dokumen</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Status Aliran</th>
                  <th className="px-4 py-3">Klasifikasi</th>
                  <th className="px-4 py-3">Pencipta</th>
                  <th className="px-4 py-3">Tarikh Dokumen</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div
                        onClick={() => onSelectDocument(doc)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        {getDocIcon(doc)}
                        <span className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {doc.title}
                        </span>
                        {doc.offlineAvailable && (
                          <span title="Tersedia Luar Talian">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {doc.category}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                        {doc.paperStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          doc.clearanceRequired === 'P&C'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : doc.clearanceRequired === 'SULIT'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {doc.clearanceRequired}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {doc.authorName}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {doc.documentDate}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenMoveDoc(doc)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
                          title="Pindah Folder"
                        >
                          <Move className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectDocument(doc)}
                          className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-medium"
                        >
                          Buka
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Folder Creation / Permission Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingFolder ? 'Tetapan & Akses Folder' : 'Cipta Folder Baharu'}
                </h3>
              </div>
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Folder <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth. 05. Pelan Mitigasi Risiko Siber"
                  value={formFolderName}
                  onChange={(e) => setFormFolderName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Penerangan Folder
                </label>
                <input
                  type="text"
                  placeholder="Ringkasan kandungan arkib dalam folder ini..."
                  value={formFolderDesc}
                  onChange={(e) => setFormFolderDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Klasifikasi Keselamatan
                  </label>
                  <select
                    value={formFolderClearance}
                    onChange={(e) => setFormFolderClearance(e.target.value as ClearanceLevel)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="BIASA">BIASA (Terbuka)</option>
                    <option value="TERHAD">TERHAD (Dalaman)</option>
                    <option value="SULIT">SULIT (Rahsia Jabatan)</option>
                    <option value="P&C">P&C (Private & Confidential)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Warna Folder
                  </label>
                  <select
                    value={formFolderColor}
                    onChange={(e) => setFormFolderColor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="blue">Biru (Dasar / Piawaian)</option>
                    <option value="amber">Emas / Jingga (Tender / Perolehan)</option>
                    <option value="emerald">Zamrud (SOP / Operasi)</option>
                    <option value="purple">Ungu (Pengurusan Tertinggi)</option>
                    <option value="rose">Merah (Had Kuasa / Darurat)</option>
                    <option value="indigo">Indigo (Perundangan)</option>
                  </select>
                </div>
              </div>

              {/* Assign to Groups */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Tugaskan Akses kepada Kumpulan</span>
                  <span className="text-[10px] text-slate-400">Pilihan</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {groups.map((g) => {
                    const isChecked = formAllowedGroups.includes(g.id);
                    return (
                      <label
                        key={g.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setFormAllowedGroups((prev) =>
                              isChecked ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                            );
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                          {g.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg shadow-xs"
                >
                  {editingFolder ? 'Simpan Folder' : 'Cipta Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Document Modal */}
      {isMoveDocModalOpen && docToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pindahkan Dokumen
                </h3>
              </div>
              <button
                onClick={() => setIsMoveDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                  {docToMove.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Folder Semasa:{' '}
                  {docToMove.folderId
                    ? folders.find((f) => f.id === docToMove.folderId)?.name
                    : 'Utama (Tiada Folder)'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Folder Destinasi
                </label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => handleExecuteMove(null)}
                    className="w-full p-2.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      📁 ArkaDrive Utama (Luar Folder)
                    </span>
                    {!docToMove.folderId && <Check className="w-4 h-4 text-emerald-500" />}
                  </button>

                  {folders.map((f) => {
                    const isSelected = docToMove.folderId === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleExecuteMove(f.id)}
                        className="w-full p-2.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                            {f.name}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsMoveDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
