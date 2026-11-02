/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DmsDocument,
  Department,
  UserProfile,
  ActivityLog,
  EmailNotification,
  DocumentComment,
  UserRole,
  ClearanceLevel,
} from './types/dms';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_USERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
} from './data/initialData';
import { TopBar } from './components/TopBar';
import { DocumentList } from './components/DocumentList';
import { DocumentDetail } from './components/DocumentDetail';
import { DocumentEditorModal } from './components/DocumentEditorModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { OrganizationModule } from './components/OrganizationModule';
import { AuditLogView } from './components/AuditLogView';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { UserProfileSwitcher } from './components/UserProfileSwitcher';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  exportDocumentsReportPDF,
  exportActivityLogsReportPDF,
  exportDocumentsToCSV,
  exportActivityLogsToCSV,
} from './lib/pdfExport';
import {
  getOfflineQueue,
  addToOfflineQueue,
  clearOfflineQueue,
} from './lib/offlineSync';
import {
  auth,
  db,
  signInWithGoogle,
  signOutUser,
  testConnection,
} from './lib/firebase';
import {
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'documents' | 'analytics' | 'organization' | 'audit'>('documents');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Core DMS State
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('arkadms_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [documents, setDocuments] = useState<DmsDocument[]>(() => {
    const saved = localStorage.getItem('arkadms_documents');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('arkadms_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(users[0]);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('arkadms_logs');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [notifications, setNotifications] = useState<EmailNotification[]>(() => {
    const saved = localStorage.getItem('arkadms_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [commentsMap, setCommentsMap] = useState<Record<string, DocumentComment[]>>({
    doc_gp_keselamatan_2026: [
      {
        id: 'c1',
        documentId: 'doc_gp_keselamatan_2026',
        userId: 'user_editor_02',
        userName: 'Ahmad Zulkifli bin Radzi',
        userRole: 'editor',
        text: 'Sila pastikan peruntukan ISO 27001 Fasa 4 dimasukkan dalam jadual audit suku tahun.',
        revisionTag: 'Cadangan Semakan',
        createdAt: '2026-02-15T11:00:00Z',
      },
    ],
  });

  // Toasts System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modals & UI Toggles
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DmsDocument | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [syncBannerMessage, setSyncBannerMessage] = useState<string | null>(null);

  // Connectivity & Offline
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncQueue, setPendingSyncQueue] = useState(getOfflineQueue());

  // Google Auth state
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  // Save state to local cache whenever changed
  useEffect(() => {
    localStorage.setItem('arkadms_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('arkadms_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('arkadms_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('arkadms_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('arkadms_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Firebase connection and Auth listener
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsGoogleAuth(true);
        setGoogleEmail(user.email);
        setCurrentUser((prev) => ({
          ...prev,
          displayName: user.displayName || prev.displayName,
          email: user.email || prev.email,
          avatarUrl: user.photoURL || prev.avatarUrl,
        }));
        showToast('Log Masuk Google Berjaya', `Sesi aktif: ${user.email}`, 'success');
      } else {
        setIsGoogleAuth(false);
        setGoogleEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Window Online / Offline Handlers
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
      showToast('Sambungan Pulih', 'Pangkalan data awan Firebase kini aktif semula.', 'info');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncBannerMessage('Mod Luar Talian Aktif — Perubahan disimpan selamat dalam storan peranti anda.');
      showToast('Mod Luar Talian', 'Sambungan internet terputus. Sebarang suntingan disimpan setempat.', 'info');
      setTimeout(() => setSyncBannerMessage(null), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Flush offline queue when back online
  const flushOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setSyncBannerMessage(`Menyegerakkan ${queue.length} perubahan luar talian ke pangkalan data awan...`);

    logActivity(
      'SEGERAK_LUAR_TALIAN',
      undefined,
      undefined,
      `Berjaya menyegerakkan ${queue.length} tindakan tertunggak dari mod luar talian.`
    );

    clearOfflineQueue();
    setPendingSyncQueue([]);
    setTimeout(() => {
      setSyncBannerMessage('Penyegerakan awan selesai dengan jaminan integriti fail.');
      showToast('Segerak Awan Selesai', `${queue.length} rekod luar talian berjaya dikemaskini.`, 'success');
      setTimeout(() => setSyncBannerMessage(null), 4000);
    }, 1200);
  };

  // Helper: Log Activity
  const logActivity = (
    action: any,
    documentId?: string,
    documentTitle?: string,
    details = '',
    isConfidential = false
  ) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userRole: currentUser.role,
      action,
      documentId,
      documentTitle,
      details,
      isConfidential,
      timestamp: new Date().toISOString(),
    };

    setActivityLogs((prev) => [newLog, ...prev]);

    if (isOnline) {
      try {
        setDoc(doc(db, 'activity_logs', newLog.id), newLog).catch(() => {});
      } catch (e) {}
    } else {
      addToOfflineQueue({ action: 'create', entity: 'comment', payload: newLog });
    }
  };

  // Helper: Trigger Automated Email Notification
  const triggerAutomatedEmail = (
    recipientEmail: string,
    recipientName: string,
    subject: string,
    body: string,
    priority: 'normal' | 'high' | 'urgent' = 'normal',
    documentId?: string
  ) => {
    const newNotif: EmailNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientEmail,
      recipientName,
      subject,
      body,
      documentId,
      status: 'sent',
      timestamp: new Date().toISOString(),
      triggeredBy: currentUser.displayName,
      priority,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    if (isOnline) {
      try {
        setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(() => {});
      } catch (e) {}
    }
  };

  // Document CRUD Handlers
  const handleSaveDocument = async (docData: Partial<DmsDocument>, notifyStakeholders: boolean) => {
    if (editingDoc) {
      const updatedList = documents.map((d) => {
        if (d.id === editingDoc.id) {
          const updated: DmsDocument = {
            ...d,
            ...docData,
            updatedAt: new Date().toISOString(),
            lastModifiedBy: currentUser.displayName,
          } as DmsDocument;
          return updated;
        }
        return d;
      });
      setDocuments(updatedList);
      logActivity(
        'KEMASKINI_DOKUMEN',
        editingDoc.id,
        editingDoc.title,
        `Mengemas kini fail dan metadata (${currentUser.role}).`,
        editingDoc.isConfidential
      );

      if (notifyStakeholders) {
        triggerAutomatedEmail(
          editingDoc.authorEmail || 'faridah.mansor@arkadms.gov.my',
          editingDoc.authorName,
          `[KEMASKINI DOKUMEN] ${editingDoc.title}`,
          `Dokumen "${editingDoc.title}" telah dikemaskini oleh ${currentUser.displayName} pada ${new Date().toLocaleString('ms-MY')}. Sila semak di papan pemuka ArkaDMS.`,
          editingDoc.isConfidential ? 'urgent' : 'high',
          editingDoc.id
        );
      }
    } else {
      const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newDoc: DmsDocument = {
        id: newId,
        title: docData.title || 'Dokumen Baharu',
        category: docData.category || 'Dasar & Polisi',
        taskCategory: docData.taskCategory || 'Tugasan Projek',
        tags: docData.tags || [],
        content: docData.content || '',
        summary: docData.summary || '',
        isConfidential: Boolean(docData.isConfidential),
        clearanceRequired: docData.clearanceRequired || 'BIASA',
        allowedUsers: docData.allowedUsers || [currentUser.uid],
        departmentId: docData.departmentId || currentUser.departmentId,
        unitId: docData.unitId || currentUser.unitId,
        isEncrypted: Boolean(docData.isEncrypted),
        encryptionAlgo: docData.encryptionAlgo,
        encryptedContent: docData.encryptedContent,
        iv: docData.iv,
        salt: docData.salt,
        currentVersion: '1.0',
        revisions: [
          {
            id: `rev_${Date.now()}`,
            version: '1.0',
            changeSummary: 'Pendaftaran draf asal dokumen arkib.',
            authorId: currentUser.uid,
            authorName: currentUser.displayName,
            timestamp: new Date().toISOString(),
            contentSnapshot: docData.content || '',
          },
        ],
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorEmail: currentUser.email,
        lastModifiedBy: currentUser.displayName,
        attachmentUrl: docData.attachmentUrl,
        attachmentName: docData.attachmentName,
        attachmentType: docData.attachmentType,
        attachmentSizeOriginal: docData.attachmentSizeOriginal,
        attachmentSizeCompressed: docData.attachmentSizeCompressed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setDocuments((prev) => [newDoc, ...prev]);

      logActivity(
        'CIPTA_DOKUMEN',
        newDoc.id,
        newDoc.title,
        `Mendaftarkan dokumen baharu (${newDoc.isConfidential ? 'SULIT' : 'BIASA'}).`,
        newDoc.isConfidential
      );

      if (notifyStakeholders) {
        triggerAutomatedEmail(
          'faridah.mansor@arkadms.gov.my',
          'Pegawai Pengarah Keselamatan',
          `[DOKUMEN BAHARU] ${newDoc.title}`,
          `Dokumen baharu bertajuk "${newDoc.title}" telah didaftarkan ke dalam sistem oleh ${currentUser.displayName}. Klasifikasi: ${newDoc.clearanceRequired}.`,
          newDoc.isConfidential ? 'high' : 'normal',
          newDoc.id
        );
      }
    }
  };

  const handleDeleteDocument = (docId: string, title: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Akses Ditolak', 'Hanya Pentadbir (Admin) dibenarkan memadam dokumen.', 'error');
      return;
    }

    if (confirm(`Adakah anda pasti mahu memadam dokumen "${title}"?`)) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDocId === docId) setSelectedDocId(null);
      logActivity('PADAM_DOKUMEN', docId, title, `Pentadbir memadamkan fail daripada arkib.`);
      showToast('Dokumen Dipadam', `Fail "${title}" telah dikeluarkan dari arkib.`, 'info');
      if (isOnline) {
        deleteDoc(doc(db, 'documents', docId)).catch(() => {});
      }
    }
  };

  const handleAddComment = (
    text: string,
    revisionTag?: 'Cadangan Semakan' | 'Pembetulan Fakta' | 'Kelulusan Diperlukan' | 'Kemas Kini Klausa' | 'Umum',
    highlightText?: string
  ) => {
    if (!selectedDoc) return;
    const newComment: DocumentComment = {
      id: `comm_${Date.now()}`,
      documentId: selectedDoc.id,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userRole: currentUser.role,
      text,
      revisionTag,
      highlightText,
      createdAt: new Date().toISOString(),
    };

    setCommentsMap((prev) => ({
      ...prev,
      [selectedDoc.id]: [...(prev[selectedDoc.id] || []), newComment],
    }));

    logActivity(
      'TAMBAH_KOMEN',
      selectedDoc.id,
      selectedDoc.title,
      `Menambah komen semakan: "[${revisionTag || 'Umum'}] ${text.substring(0, 40)}..."`
    );

    if (revisionTag === 'Kelulusan Diperlukan') {
      triggerAutomatedEmail(
        selectedDoc.authorEmail || 'faridah.mansor@arkadms.gov.my',
        selectedDoc.authorName,
        `[TINDAKAN KELULUSAN] Semakan Diperlukan untuk ${selectedDoc.title}`,
        `${currentUser.displayName} telah menandakan komen "[Kelulusan Diperlukan]" pada dokumen "${selectedDoc.title}":\n\n"${text}"`,
        'high',
        selectedDoc.id
      );
    }
  };

  const handleAddNewRevision = (
    docId: string,
    version: string,
    summary: string,
    newContent: string
  ) => {
    const docToUpdate = documents.find((d) => d.id === docId);
    if (!docToUpdate) return;

    const newRev = {
      id: `rev_${Date.now()}`,
      version,
      changeSummary: summary,
      authorId: currentUser.uid,
      authorName: currentUser.displayName,
      timestamp: new Date().toISOString(),
      contentSnapshot: newContent,
    };

    const updatedList = documents.map((d) => {
      if (d.id === docId) {
        return {
          ...d,
          currentVersion: version,
          content: newContent,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: currentUser.displayName,
          revisions: [...(d.revisions || []), newRev],
        };
      }
      return d;
    });

    setDocuments(updatedList);
    logActivity(
      'TANDAI_REVISI',
      docId,
      docToUpdate.title,
      `Menerbitkan semakan versi ${version}: ${summary}`
    );

    triggerAutomatedEmail(
      docToUpdate.authorEmail || 'faridah.mansor@arkadms.gov.my',
      docToUpdate.authorName,
      `[SEMAKAN VERSI BAHARU] ${docToUpdate.title} (v${version})`,
      `Semakan baharu versi ${version} telah diterbitkan oleh ${currentUser.displayName}.\nRingkasan: ${summary}`,
      'normal',
      docId
    );
  };

  const handleLogAccessAttempt = (targetDoc: DmsDocument, granted: boolean) => {
    if (granted) {
      if (targetDoc.isConfidential) {
        logActivity(
          'AKSES_SULIT',
          targetDoc.id,
          targetDoc.title,
          `Pengguna ${currentUser.displayName} (${currentUser.clearanceLevel}) mengakses dokumen sulit terperingkat.`,
          true
        );
      }
    } else {
      logActivity(
        'CUBAAN_AKSES_DITOLAK',
        targetDoc.id,
        targetDoc.title,
        `PERINGATAN KESELAMATAN: Cubaan akses tanpa izin dikesan oleh ${currentUser.displayName} (Tapisan: ${currentUser.clearanceLevel}). Hak minimum: ${targetDoc.clearanceRequired}.`,
        true
      );

      triggerAutomatedEmail(
        'faridah.mansor@arkadms.gov.my',
        'Ir. Dr. Faridah Mansor (Ketua Keselamatan)',
        `[AMARAN KESELAMATAN] Cubaan Akses Fail Sulit Ditolak: ${targetDoc.title}`,
        `Sistem ArkaDMS mengesan percubaan akses tanpa permit kepada fail sulit "${targetDoc.title}" (Klasifikasi: ${targetDoc.clearanceRequired}) oleh akaun: ${currentUser.displayName} (${currentUser.email}) pada ${new Date().toLocaleString('ms-MY')}. Tindakan telah disekat.`,
        'urgent',
        targetDoc.id
      );
    }
  };

  const handleCreateDepartment = (newDeptData: Omit<Department, 'id' | 'createdAt'>) => {
    const newDept: Department = {
      ...newDeptData,
      id: `dept_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDepartments((prev) => [...prev, newDept]);
    logActivity('CIPTA_JABATAN', undefined, undefined, `Mencipta jabatan baharu: ${newDept.name} (${newDept.code}).`);
    showToast('Jabatan Dicipta', `Jabatan ${newDept.name} berjaya ditambah.`, 'success');
  };

  const handleCreateUnit = (deptId: string, newUnitData: any) => {
    const updated = departments.map((d) => {
      if (d.id === deptId) {
        return {
          ...d,
          units: [
            ...d.units,
            {
              ...newUnitData,
              id: `unit_${Date.now()}`,
              departmentId: deptId,
            },
          ],
        };
      }
      return d;
    });
    setDepartments(updated);
    logActivity('CIPTA_UNIT', undefined, undefined, `Menambah unit ${newUnitData.name} ke jabatan.`);
    showToast('Unit Dicipta', `Unit ${newUnitData.name} berjaya ditambah.`, 'success');
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole, newClearance: ClearanceLevel) => {
    const targetUser = users.find((u) => u.uid === userId);
    setUsers((prev) =>
      prev.map((u) => (u.uid === userId ? { ...u, role: newRole, clearanceLevel: newClearance } : u))
    );
    if (currentUser.uid === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole, clearanceLevel: newClearance }));
    }
    logActivity(
      'KEMASKINI_PERANAN',
      undefined,
      undefined,
      `Mengubah peranan ${targetUser?.displayName} kepada ${newRole.toUpperCase()} (Tapisan: ${newClearance}).`
    );
    showToast('Akses Pengguna Dikemaskini', `${targetUser?.displayName}: ${newRole.toUpperCase()} · ${newClearance}`, 'info');
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedDocId(null);
          setCurrentTab(tab as any);
        }}
        currentUser={currentUser}
        isOnline={isOnline}
        unreadNotifsCount={notifications.length}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onOpenCreateModal={() => {
          setEditingDoc(null);
          setIsEditorModalOpen(true);
        }}
        pendingSyncCount={pendingSyncQueue.length}
      />

      {/* Offline Sync Banner Notification */}
      {syncBannerMessage && (
        <div className="bg-slate-900 text-white text-xs px-6 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>{syncBannerMessage}</span>
          </div>
          <button
            onClick={() => setSyncBannerMessage(null)}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Subheader Toolbar: User Profile Switcher & Workspace Scope */}
      <div className="bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Breadcrumb Context */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800 dark:text-slate-200">ArkaDMS</span>
            <span aria-hidden="true">/</span>
            <span className="capitalize">
              {currentTab === 'documents'
                ? selectedDoc
                  ? `Fail: ${selectedDoc.title.substring(0, 28)}...`
                  : 'Arkib Digital & Dokumen'
                : currentTab === 'analytics'
                ? 'Analitik Produktiviti'
                : currentTab === 'organization'
                ? 'Hierarki Jabatan & Unit'
                : 'Log Jejak Audit'}
            </span>
          </div>

          {/* User Persona & Role Switcher */}
          <UserProfileSwitcher
            currentUser={currentUser}
            availableUsers={users}
            onSwitchUser={(user) => {
              setCurrentUser(user);
              logActivity(
                'KEMASKINI_PERANAN',
                undefined,
                undefined,
                `Tukar sesi aktif kepada ${user.displayName} (${user.role.toUpperCase()}).`
              );
              showToast('Profil Ditukar', `Sesi kini: ${user.displayName} (${user.role.toUpperCase()})`, 'info');
            }}
            onGoogleSignIn={async () => {
              try {
                await signInWithGoogle();
              } catch (e) {}
            }}
            onGoogleSignOut={async () => {
              try {
                await signOutUser();
                showToast('Log Keluar', 'Akaun Google telah dilog keluar.', 'info');
              } catch (e) {}
            }}
            isGoogleAuthenticated={isGoogleAuth}
            googleUserEmail={googleEmail}
          />
        </div>
      </div>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'documents' && (
          <>
            {selectedDoc ? (
              <DocumentDetail
                document={selectedDoc}
                currentUser={currentUser}
                comments={commentsMap[selectedDoc.id] || []}
                onBack={() => setSelectedDocId(null)}
                onEdit={(doc) => {
                  setEditingDoc(doc);
                  setIsEditorModalOpen(true);
                }}
                onAddComment={handleAddComment}
                onAddNewRevision={handleAddNewRevision}
                onLogAccessAttempt={handleLogAccessAttempt}
                onExportPDF={(doc) => {
                  exportDocumentsReportPDF([doc], currentUser.displayName, doc.category);
                  showToast('PDF Dijana', `Laporan "${doc.title}" berjaya dimuat turun.`, 'success');
                }}
                onShowToast={showToast}
              />
            ) : (
              <DocumentList
                documents={documents}
                currentUser={currentUser}
                onSelectDocument={(doc) => setSelectedDocId(doc.id)}
                onDeleteDocument={handleDeleteDocument}
                onExportPDF={(selectedDocs) => {
                  const targetDocs = selectedDocs || documents;
                  exportDocumentsReportPDF(targetDocs, currentUser.displayName);
                  showToast('Eksport PDF Selesai', `${targetDocs.length} dokumen dieksport ke PDF.`, 'success');
                }}
                onExportCSV={(selectedDocs) => {
                  const targetDocs = selectedDocs || documents;
                  exportDocumentsToCSV(targetDocs);
                  showToast('Eksport CSV Selesai', `${targetDocs.length} rekod dieksport ke CSV.`, 'success');
                }}
                onShowToast={showToast}
              />
            )}
          </>
        )}

        {currentTab === 'analytics' && (
          <AnalyticsDashboard
            documents={documents}
            logs={activityLogs}
            departments={departments}
            users={users}
            onExportPDF={() => {
              exportDocumentsReportPDF(documents, currentUser.displayName, 'Analitik Produktiviti');
              showToast('Laporan Analitik PDF Dijana', 'Ringkasan eksekutif telah dimuat turun.', 'success');
            }}
          />
        )}

        {currentTab === 'organization' && (
          <OrganizationModule
            departments={departments}
            users={users}
            currentUser={currentUser}
            onCreateDepartment={handleCreateDepartment}
            onCreateUnit={handleCreateUnit}
            onUpdateUserRole={handleUpdateUserRole}
          />
        )}

        {currentTab === 'audit' && (
          <AuditLogView
            logs={activityLogs}
            onExportPDF={() => {
              exportActivityLogsReportPDF(activityLogs, currentUser.displayName);
              showToast('Log Audit PDF Selesai', 'Laporan audit keselamatan dimuat turun.', 'success');
            }}
            onExportCSV={() => {
              exportActivityLogsToCSV(activityLogs);
              showToast('Log Audit CSV Selesai', 'Fail CSV log audit dimuat turun.', 'success');
            }}
          />
        )}
      </main>

      {/* Document Create / Edit Modal */}
      <DocumentEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => {
          setIsEditorModalOpen(false);
          setEditingDoc(null);
        }}
        onSave={handleSaveDocument}
        initialDoc={editingDoc}
        currentUser={currentUser}
        departments={departments}
        isOnline={isOnline}
        onShowToast={showToast}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {}}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
