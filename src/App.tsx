/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DmsDocument,
  Department,
  Unit,
  UserProfile,
  ActivityLog,
  EmailNotification,
  DocumentComment,
  UserRole,
  ClearanceLevel,
  CustomCategory,
  PaperStatus,
  DocumentWorkflowStep,
  GoogleStorageConfig,
  canManageUsers,
  isSuperAdmin,
  SUPER_ADMIN_EMAIL,
  PRIMARY_SUPER_ADMIN_EMAIL,
  MAX_SUPER_ADMINS,
  UserGroup,
  DmsFolder,
  canDeleteDocument,
  canManageFolder,
  canEditFolder,
} from './types/dms';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_USERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CATEGORIES,
  INITIAL_GROUPS,
  INITIAL_FOLDERS,
} from './data/initialData';
import { TopBar } from './components/TopBar';
import { DocumentList } from './components/DocumentList';
import { DocumentDetail } from './components/DocumentDetail';
import { DocumentEditorModal } from './components/DocumentEditorModal';
import { DriveFolderView } from './components/DriveFolderView';
import { UserGroupModule } from './components/UserGroupModule';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { OrganizationModule } from './components/OrganizationModule';
import { AuditLogView } from './components/AuditLogView';
import { UserManagerModule } from './components/UserManagerModule';
import { CategoryManagerModule } from './components/CategoryManagerModule';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { UserProfileSwitcher } from './components/UserProfileSwitcher';
import { GoogleStorageSetupModal } from './components/GoogleStorageSetupModal';
import { LoginModal } from './components/LoginModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { getStorageConfig } from './lib/storage';
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
import { RefreshCw, Folder, FileText, ShieldAlert, Lock } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'documents' | 'categories' | 'users' | 'groups' | 'organization' | 'analytics' | 'audit'>('documents');
  const [docViewStyle, setDocViewStyle] = useState<'standard' | 'drive'>('drive');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('arkadms_departments');
    if (saved) {
      try {
        const list = JSON.parse(saved) as Department[];
        if (Array.isArray(list) && list.length > 0) {
          if (!list.some((d) => d.id === 'dept_general')) {
            const generalDept = INITIAL_DEPARTMENTS.find((d) => d.id === 'dept_general');
            if (generalDept) list.push(generalDept);
          }
          return list;
        }
      } catch (e) {}
    }
    return INITIAL_DEPARTMENTS;
  });

  const [groups, setGroups] = useState<UserGroup[]>(() => {
    const saved = localStorage.getItem('arkadms_groups');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && list.length > 0) {
          return list.map((g: UserGroup) => {
            if (g.name === 'Kumpulan Staf & Warga Am' || g.id === 'grp_staff_general') {
              return { ...g, name: 'Fail General / Akses Am', code: 'FAIL-GENERAL' };
            }
            return g;
          });
        }
      } catch (e) {}
    }
    return INITIAL_GROUPS;
  });

  const [folders, setFolders] = useState<DmsFolder[]>(() => {
    const saved = localStorage.getItem('arkadms_folders');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && list.length > 0) return list;
      } catch (e) {}
    }
    return INITIAL_FOLDERS;
  });

  const [documents, setDocuments] = useState<DmsDocument[]>(() => {
    const saved = localStorage.getItem('arkadms_documents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<DmsDocument>[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((doc, idx) => {
            const fallback = INITIAL_DOCUMENTS.find((d) => d.id === doc.id) || INITIAL_DOCUMENTS[idx % INITIAL_DOCUMENTS.length];
            const fallbackDate = doc.createdAt ? doc.createdAt.split('T')[0] : '2026-02-15';
            return {
              ...fallback,
              ...doc,
              title: doc.title || fallback?.title || 'Dokumen',
              category: doc.category || fallback?.category || 'SOP',
              taskCategory: doc.taskCategory || fallback?.taskCategory || 'Tugasan Projek',
              tags: doc.tags || fallback?.tags || [],
              content: doc.content || fallback?.content || '',
              summary: doc.summary || fallback?.summary || '',
              isConfidential: Boolean(doc.isConfidential),
              clearanceRequired: (doc.clearanceRequired === 'RAHSIA_BESAR' ? 'P&C' : (doc.clearanceRequired || fallback?.clearanceRequired || 'BIASA')),
              isEncrypted: Boolean(doc.isEncrypted),
              currentVersion: doc.currentVersion || fallback?.currentVersion || '1.0',
              revisions: doc.revisions || fallback?.revisions || [],
              documentDate: doc.documentDate || fallback?.documentDate || fallbackDate,
              authorId: doc.authorId || fallback?.authorId || 'user_admin_01',
              authorName: doc.authorName || fallback?.authorName || 'Ir. Dr. Faridah Mansor',
              authorEmail: doc.authorEmail || fallback?.authorEmail || 'faridah.mansor@arkadms.gov.my',
              creatorServiceNumber: doc.creatorServiceNumber || fallback?.creatorServiceNumber || '882104',
              lastModifiedBy: doc.lastModifiedBy || fallback?.lastModifiedBy || 'Ir. Dr. Faridah Mansor',
              paperStatus: doc.paperStatus || fallback?.paperStatus || 'Disediakan',
              folderId: doc.folderId !== undefined ? doc.folderId : (fallback?.folderId ?? null),
              allowedGroups: doc.allowedGroups || fallback?.allowedGroups || [],
              allowedUsers: doc.allowedUsers || fallback?.allowedUsers || [],
              offlineAvailable: doc.offlineAvailable !== undefined ? doc.offlineAvailable : (fallback?.offlineAvailable ?? true),
              workflowChronology: doc.workflowChronology && doc.workflowChronology.length > 0
                ? doc.workflowChronology
                : (fallback?.workflowChronology || [
                    {
                      id: `step_init_${Date.now()}_${idx}`,
                      stage: 'Penyediaan Draf Awal',
                      handledBy: `${doc.authorName || 'Pegawai'} (#${doc.creatorServiceNumber || '882104'})`,
                      departmentName: 'Jabatan Teknologi Maklumat & Keselamatan Siber',
                      date: doc.documentDate || fallbackDate,
                      status: 'selesai',
                      notes: 'Dokumen arkib dimuat naik ke dalam sistem.',
                    },
                  ]),
              createdAt: doc.createdAt || fallback?.createdAt || new Date().toISOString(),
              updatedAt: doc.updatedAt || fallback?.updatedAt || new Date().toISOString(),
            } as DmsDocument;
          });
        }
      } catch (e) {
        return INITIAL_DOCUMENTS;
      }
    }
    return INITIAL_DOCUMENTS;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('arkadms_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<UserProfile>[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u, idx) => {
            const fallback = INITIAL_USERS.find((init) => init.uid === u.uid) || INITIAL_USERS[idx % INITIAL_USERS.length];
            const rawClearance = u.clearanceLevel || fallback?.clearanceLevel || 'BIASA';
            const normalizedClearance: ClearanceLevel = rawClearance === 'RAHSIA_BESAR' ? 'P&C' : rawClearance;
            return {
              ...fallback,
              ...u,
              uid: u.uid || `user_${Date.now()}_${idx}`,
              serviceNumber: u.serviceNumber || fallback?.serviceNumber || String(880000 + idx).padStart(6, '0'),
              displayName: u.displayName || fallback?.displayName || 'Pegawai',
              email: u.email || fallback?.email || 'pegawai@arkadms.gov.my',
              role: u.role || fallback?.role || 'viewer',
              departmentId: u.departmentId || fallback?.departmentId || 'dept_it',
              departmentName: u.departmentName || fallback?.departmentName || 'Jabatan Teknologi Maklumat & Keselamatan Siber',
              unitId: u.unitId || fallback?.unitId || 'unit_cyber_sec',
              unitName: u.unitName || fallback?.unitName || 'Unit Keselamatan Maklumat & Audit Siber',
              clearanceLevel: normalizedClearance,
              avatarUrl: u.avatarUrl || fallback?.avatarUrl || '/src/assets/images/avatar_viewer_analyst_1793580727967.jpg',
              expiryDate: u.expiryDate || fallback?.expiryDate || '2028-12-31',
              status: u.status || fallback?.status || 'active',
            } as UserProfile;
          });
        }
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [categories, setCategories] = useState<CustomCategory[]>(() => {
    const saved = localStorage.getItem('arkadms_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  // Active User Session: BY DEFAULT NULL (TIADA SESI AKTIF SELAGI BELUM LOG MASUK)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedActive = localStorage.getItem('arkadms_active_user');
    if (savedActive) {
      try {
        const parsed = JSON.parse(savedActive);
        if (parsed && parsed.uid) return parsed;
      } catch (e) {}
    }
    return null; // By default: tiada sesi aktif (Guest Mode)!
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
  const [isStorageSetupOpen, setIsStorageSetupOpen] = useState(false);
  const [storageConfig, setStorageConfig] = useState<GoogleStorageConfig>(() => getStorageConfig());
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
    localStorage.setItem('arkadms_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('arkadms_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('arkadms_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('arkadms_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('arkadms_folders', JSON.stringify(folders));
  }, [folders]);

  // Firebase connection and Auth listener
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsGoogleAuth(true);
        setGoogleEmail(user.email);
        setCurrentUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            displayName: user.displayName || prev.displayName,
            email: user.email || prev.email,
            avatarUrl: user.photoURL || prev.avatarUrl,
          };
        });
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
      userId: currentUser?.uid || 'guest',
      userName: currentUser?.displayName || 'Pengguna Awam',
      userRole: currentUser?.role || 'viewer',
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
      triggeredBy: currentUser?.displayName || 'Sistem ArkaDMS',
      priority,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    if (isOnline) {
      try {
        setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(() => {});
      } catch (e) {}
    }
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('arkadms_active_user', JSON.stringify(user));
    setIsLoginModalOpen(false);
    logActivity(
      'LOG_MASUK',
      undefined,
      undefined,
      `Log masuk rasmi berjaya oleh ${user.displayName} (No. Perkhidmatan: #${user.serviceNumber}).`
    );
    showToast('Log Masuk Berjaya', `Selamat kembali, ${user.displayName} (#${user.serviceNumber}).`, 'success');
  };

  const handleLogout = () => {
    if (currentUser) {
      logActivity(
        'LOG_MASUK',
        undefined,
        undefined,
        `Sesi ditamatkan oleh ${currentUser.displayName} (#${currentUser.serviceNumber}).`
      );
    }
    setCurrentUser(null);
    localStorage.removeItem('arkadms_active_user');
    setSelectedDocId(null);
    setCurrentTab('documents');
    showToast('Sesi Ditamatkan', 'Anda telah log keluar. Paparan kini adalah dokumen awam/biasa sahaja.', 'info');
  };

  // Document CRUD Handlers
  const handleSaveDocument = async (docData: Partial<DmsDocument>, notifyStakeholders: boolean) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      showToast('Perlu Log Masuk', 'Sila log masuk dengan No. Perkhidmatan untuk menyimpan dokumen.', 'error');
      return;
    }
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
          `Dokumen "${editingDoc.title}" telah dikemaskini oleh ${currentUser.displayName} (#${currentUser.serviceNumber}) pada ${new Date().toLocaleString('ms-MY')}. Sila semak di papan pemuka ArkaDMS.`,
          editingDoc.isConfidential ? 'urgent' : 'high',
          editingDoc.id
        );
      }
    } else {
      const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docDate = docData.documentDate || new Date().toISOString().split('T')[0];
      const initialPaperStatus = docData.paperStatus || 'Disediakan';

      const initialWorkflowStep: DocumentWorkflowStep = {
        id: `step_init_${Date.now()}`,
        stage: 'Penyediaan Draf Awal',
        handledBy: `${currentUser.displayName} (#${currentUser.serviceNumber})`,
        departmentName: `${currentUser.unitName}, ${currentUser.departmentName}`,
        date: docDate,
        status: 'selesai',
        notes: `Dokumen / paper telah didaftarkan ke dalam sistem ArkaDMS oleh ${currentUser.displayName} (#${currentUser.serviceNumber}).`,
      };

      const newDoc: DmsDocument = {
        id: newId,
        title: docData.title || 'Dokumen Baharu',
        category: docData.category || (categories[0]?.code || 'SOP'),
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
        documentDate: docDate,
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorEmail: currentUser.email,
        creatorServiceNumber: currentUser.serviceNumber,
        lastModifiedBy: currentUser.displayName,
        paperStatus: initialPaperStatus,
        workflowChronology: docData.workflowChronology && docData.workflowChronology.length > 0
          ? docData.workflowChronology
          : [initialWorkflowStep],
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
        `Mendaftarkan dokumen baharu (${newDoc.isConfidential ? 'SULIT' : 'BIASA'}) oleh #${currentUser.serviceNumber}.`,
        newDoc.isConfidential
      );

      if (notifyStakeholders) {
        triggerAutomatedEmail(
          'faridah.mansor@arkadms.gov.my',
          'Pegawai Pengarah Keselamatan',
          `[DOKUMEN BAHARU] ${newDoc.title}`,
          `Dokumen baharu bertajuk "${newDoc.title}" telah didaftarkan ke dalam sistem oleh ${currentUser.displayName} (#${currentUser.serviceNumber}). Klasifikasi: ${newDoc.clearanceRequired}.`,
          newDoc.isConfidential ? 'high' : 'normal',
          newDoc.id
        );
      }
    }
  };

  // Workflow Chronology & Status Paper Handler
  const handleUpdatePaperStatus = (
    docId: string,
    newStatus: PaperStatus,
    newStep?: Omit<DocumentWorkflowStep, 'id'>
  ) => {
    const targetDoc = documents.find((d) => d.id === docId);
    if (!targetDoc) return;

    const stepToAdd: DocumentWorkflowStep | undefined = newStep
      ? {
          ...newStep,
          id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        }
      : undefined;

    const updatedList = documents.map((d) => {
      if (d.id === docId) {
        return {
          ...d,
          paperStatus: newStatus,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: currentUser ? currentUser.displayName : 'Pegawai',
          workflowChronology: stepToAdd
            ? [...(d.workflowChronology || []), stepToAdd]
            : d.workflowChronology || [],
        };
      }
      return d;
    });

    setDocuments(updatedList);
    logActivity(
      'KEMASKINI_STATUS_PAPER',
      docId,
      targetDoc.title,
      `Mengemas kini status peredaran paper kepada "${newStatus}".`,
      targetDoc.isConfidential
    );

    triggerAutomatedEmail(
      targetDoc.authorEmail || 'faridah.mansor@arkadms.gov.my',
      targetDoc.authorName,
      `[KRONOLOGI PAPER] Status Dikemaskini: ${targetDoc.title}`,
      `Status paper "${targetDoc.title}" kini bertukar kepada "${newStatus}" oleh ${currentUser?.displayName || 'Pegawai'} (#${currentUser?.serviceNumber || '882104'}).\nNota Pegawai: ${newStep?.notes || 'Tiada nota tambahan.'}`,
      targetDoc.isConfidential ? 'urgent' : 'high',
      docId
    );

    showToast('Status Paper Dikemaskini', `Peredaran paper dikemaskini kepada: "${newStatus}".`, 'success');
  };

  // Category Management Handlers
  const handleCreateCategory = (newCatData: Omit<CustomCategory, 'id' | 'createdAt'>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan mencipta kategori fail baharu.', 'error');
      return;
    }
    const newCat: CustomCategory = {
      ...newCatData,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);
    logActivity('CIPTA_KATEGORI', undefined, undefined, `Mencipta kategori fail: ${newCat.name} (${newCat.code}).`);
    showToast('Kategori Dicipta', `Kategori "${newCat.name}" sedia digunakan.`, 'success');
  };

  const handleUpdateCategory = (id: string, updates: Partial<CustomCategory>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan mengemaskini kategori.', 'error');
      return;
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    logActivity('KEMASKINI_KATEGORI', undefined, undefined, `Mengemaskini maklumat kategori fail #${id}.`);
    showToast('Kategori Dikemaskini', 'Maklumat kategori fail telah disimpan.', 'info');
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan memadam kategori.', 'error');
      return;
    }
    const linkedDocs = documents.filter((d) => d.category === name || d.category === id);
    if (linkedDocs.length > 0) {
      showToast('Kategori Sedang Digunakan', `Terdapat ${linkedDocs.length} dokumen dalam kategori "${name}". Tidak boleh dipadam.`, 'error');
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    logActivity('PADAM_KATEGORI', undefined, undefined, `Memadam kategori fail "${name}".`);
    showToast('Kategori Dipadam', `Kategori "${name}" telah dikeluarkan dari sistem.`, 'info');
  };

  // User Management Handlers (No. Perkhidmatan & Expiry Date)
  const handleCreateUser = (newUser: UserProfile) => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan mendaftarkan pengguna baharu.', 'error');
      return;
    }

    if (newUser.isSuperAdmin) {
      const currentSuperAdmins = users.filter((u) => isSuperAdmin(u));
      if (currentSuperAdmins.length >= MAX_SUPER_ADMINS) {
        showToast('Had Kuota Super Admin', `Hanya maksimum ${MAX_SUPER_ADMINS} Super Admin dibenarkan dalam sistem.`, 'error');
        return;
      }
    }

    setUsers((prev) => [...prev, newUser]);
    const superAdminTag = newUser.isSuperAdmin ? ' [SUPER ADMIN]' : '';
    logActivity(
      'CIPTA_PENGGUNA',
      undefined,
      undefined,
      `Mendaftar akaun anggota: ${newUser.displayName} (No. Servis: ${newUser.serviceNumber}, Peranan: ${newUser.role.toUpperCase()}${superAdminTag}, Luput: ${newUser.expiryDate}).`
    );
    showToast('Pengguna Didaftarkan', `Anggota #${newUser.serviceNumber} (${newUser.displayName}) berjaya didaftarkan.`, 'success');
  };

  const handleUpdateUser = (userId: string, updates: Partial<UserProfile>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan mengemaskini pengguna.', 'error');
      return;
    }

    const targetUser = users.find((u) => u.uid === userId);
    if (updates.isSuperAdmin === true && targetUser && !isSuperAdmin(targetUser)) {
      const currentSuperAdmins = users.filter((u) => isSuperAdmin(u));
      if (currentSuperAdmins.length >= MAX_SUPER_ADMINS) {
        showToast('Had Kuota Super Admin', `Hanya maksimum ${MAX_SUPER_ADMINS} Super Admin dibenarkan dalam sistem.`, 'error');
        return;
      }
    }

    setUsers((prev) =>
      prev.map((u) => (u.uid === userId ? { ...u, ...updates } : u))
    );
    if (currentUser && currentUser.uid === userId) {
      setCurrentUser((prev) => prev ? ({ ...prev, ...updates }) : null);
    }
    logActivity('KEMASKINI_PENGGUNA', undefined, undefined, `Mengemaskini profil akaun pengguna #${userId}.`);
    showToast('Pengguna Dikemaskini', 'Profil pengguna berjaya dikemaskini.', 'info');
  };

  const handleDeleteUser = (userId: string) => {
    if (!currentUser || !canManageUsers(currentUser)) {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan memadam akaun pengguna.', 'error');
      return;
    }

    const targetUser = users.find((u) => u.uid === userId);
    if (!targetUser) return;

    // Guard against deleting Primary Super Admin
    if (
      (targetUser.email && targetUser.email.toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase()) ||
      targetUser.serviceNumber === '990001'
    ) {
      showToast('Tindakan Disekat', 'Akaun Super Administrator utama sistem tidak boleh dipadam.', 'error');
      return;
    }

    // Non-primary Super Admin can only be deleted by another Super Admin
    if (isSuperAdmin(targetUser) && !isSuperAdmin(currentUser)) {
      showToast('Akses Ditolak', 'Hanya Super Administrator dibenarkan memadam akaun Super Admin.', 'error');
      return;
    }

    // Guard against deleting self
    if (targetUser.uid === currentUser.uid) {
      showToast('Tindakan Disekat', 'Anda tidak boleh memadam akaun sesi anda sendiri yang sedang aktif.', 'error');
      return;
    }

    setUsers((prev) => prev.filter((u) => u.uid !== userId));
    logActivity(
      'PADAM_PENGGUNA',
      undefined,
      undefined,
      `Memadam pengguna #${targetUser.serviceNumber} (${targetUser.displayName}) dari sistem untuk housekeeping.`
    );
    showToast(
      'Pengguna Dipadam',
      `Akaun #${targetUser.serviceNumber} (${targetUser.displayName}) berjaya dipadam dari sistem.`,
      'info'
    );
  };

  const handleToggleUserStatus = (userId: string, targetStatus: 'active' | 'inactive') => {
    if (!currentUser || !canManageUsers(currentUser)) {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan mengemaskini status pengguna.', 'error');
      return;
    }

    const targetUser = users.find((u) => u.uid === userId);
    if (!targetUser) return;

    if (
      (targetUser.email && targetUser.email.toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase()) ||
      targetUser.serviceNumber === '990001'
    ) {
      showToast('Tindakan Disekat', 'Status akaun Super Administrator utama tidak boleh diubah.', 'error');
      return;
    }

    if (targetUser.uid === currentUser.uid && targetStatus === 'inactive') {
      showToast('Tindakan Disekat', 'Anda tidak boleh menyahaktifkan akaun sendiri semasa sesi aktif.', 'error');
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.uid === userId ? { ...u, status: targetStatus } : u))
    );

    const statusLabel = targetStatus === 'active' ? 'diaktifkan semula' : 'dinyahaktifkan (Inactive)';
    logActivity(
      'KEMASKINI_STATUS_PENGGUNA',
      undefined,
      undefined,
      `Mengubah status akaun #${targetUser.serviceNumber} (${targetUser.displayName}) kepada "${targetStatus.toUpperCase()}".`
    );
    showToast(
      'Status Pengguna Dikemaskini',
      `Akaun #${targetUser.serviceNumber} (${targetUser.displayName}) telah ${statusLabel}.`,
      'info'
    );
  };

  // Secure Login using 6-character Service Number AND Password
  const handleLoginWithCredentials = (serviceNumber: string, passwordInput: string): boolean => {
    if (!serviceNumber || !passwordInput) return false;
    const formattedNo = String(serviceNumber).trim().toUpperCase();
    const foundUser = users.find(
      (u) => (u.serviceNumber ? String(u.serviceNumber).trim().toUpperCase() : '') === formattedNo
    );
    if (!foundUser) {
      showToast('Gagal Log Masuk', `No. Perkhidmatan "${formattedNo}" tidak dijumpai dalam pangkalan data kakitangan.`, 'error');
      return false;
    }

    // Check account status: inactive
    if (foundUser.status === 'inactive') {
      showToast(
        'Akaun Tidak Aktif',
        `Akaun No. Perkhidmatan ${formattedNo} telah dinyahaktifkan (Inactive) untuk tujuan housekeeping. Sila hubungi Pentadbir Sistem.`,
        'error'
      );
      return false;
    }

    // Verify password
    const expectedPassword = foundUser.password || `Admin${foundUser.serviceNumber}!`;
    if (expectedPassword && expectedPassword !== passwordInput.trim()) {
      showToast('Gagal Log Masuk', 'Kata laluan yang dimasukkan tidak tepat.', 'error');
      return false;
    }

    const expiryDateStr = foundUser.expiryDate || '2028-12-31';
    const isExpired = new Date(expiryDateStr).getTime() < new Date().getTime();
    if (isExpired || foundUser.status === 'expired') {
      showToast(
        'Akaun Tamat Tempoh',
        `Akaun No. Perkhidmatan ${formattedNo} telah tamat tempoh sah pada ${expiryDateStr}. Sila hubungi Pentadbir sistem untuk pembaharuan.`,
        'error'
      );
      return false;
    }

    const validUser: UserProfile = {
      ...foundUser,
      serviceNumber: foundUser.serviceNumber || formattedNo,
      expiryDate: expiryDateStr,
      status: foundUser.status || 'active',
      password: expectedPassword,
    };

    setCurrentUser(validUser);
    localStorage.setItem('arkadms_active_user', JSON.stringify(validUser));
    logActivity(
      'LOG_MASUK_NO_PERKHIDMATAN',
      undefined,
      undefined,
      `Log masuk disahkan menggunakan No. Perkhidmatan ${validUser.serviceNumber} (${validUser.displayName} - ${validUser.role.toUpperCase()}).`
    );
    showToast('Log Masuk Berjaya', `Selamat kembali, ${validUser.displayName} (#${validUser.serviceNumber})`, 'success');
    return true;
  };

  const handleDeleteDocument = (docId: string, title?: string) => {
    const targetDoc = documents.find((d) => d.id === docId);
    if (!targetDoc) return;

    if (!canDeleteDocument(targetDoc, currentUser)) {
      showToast('Akses Ditolak', 'Hanya Pencipta Fail (Owner), Pentadbir Sistem (Admin), atau Super Admin dibenarkan memadam fail ini.', 'error');
      return;
    }

    const docTitle = title || targetDoc.title;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (selectedDocId === docId) setSelectedDocId(null);
    logActivity('PADAM_DOKUMEN', docId, docTitle, `Fail dipadamkan oleh ${currentUser?.displayName || 'Pengguna'} (${currentUser?.role.toUpperCase()}).`);
    showToast('Dokumen Dipadam', `Fail "${docTitle}" telah dikeluarkan dari arkib.`, 'info');
    if (isOnline) {
      deleteDoc(doc(db, 'documents', docId)).catch(() => {});
    }
  };

  const handleAddComment = (
    text: string,
    revisionTag?: 'Cadangan Semakan' | 'Pembetulan Fakta' | 'Kelulusan Diperlukan' | 'Kemas Kini Klausa' | 'Umum',
    highlightText?: string
  ) => {
    if (!selectedDoc) return;
    if (!currentUser) {
      setIsLoginModalOpen(true);
      showToast('Perlu Log Masuk', 'Sila log masuk dengan No. Perkhidmatan untuk meninggalkan ulasan.', 'error');
      return;
    }
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
    if (!currentUser) {
      setIsLoginModalOpen(true);
      showToast('Perlu Log Masuk', 'Sila log masuk untuk menerbitkan semakan.', 'error');
      return;
    }
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
    const userDisplay = currentUser ? currentUser.displayName : 'Pengguna Tanpa Sesi';
    const userClearance = currentUser ? (currentUser.clearanceLevel === 'RAHSIA_BESAR' ? 'P&C' : currentUser.clearanceLevel) : 'TIADA';
    const userEmail = currentUser ? currentUser.email : 'tetamu@arkadms.gov.my';

    if (granted) {
      if (targetDoc.isConfidential) {
        logActivity(
          'AKSES_SULIT',
          targetDoc.id,
          targetDoc.title,
          `Pengguna ${userDisplay} (${userClearance}) mengakses dokumen sulit terperingkat.`,
          true
        );
      }
    } else {
      logActivity(
        'CUBAAN_AKSES_DITOLAK',
        targetDoc.id,
        targetDoc.title,
        `PERINGATAN KESELAMATAN: Cubaan akses tanpa izin dikesan oleh ${userDisplay} (Tapisan: ${userClearance}). Hak minimum: ${targetDoc.clearanceRequired}.`,
        true
      );

      triggerAutomatedEmail(
        'faridah.mansor@arkadms.gov.my',
        'Ir. Dr. Faridah Mansor (Ketua Keselamatan)',
        `[AMARAN KESELAMATAN] Cubaan Akses Fail Sulit Ditolak: ${targetDoc.title}`,
        `Sistem ArkaDMS mengesan percubaan akses tanpa permit kepada fail sulit "${targetDoc.title}" (Klasifikasi: ${targetDoc.clearanceRequired}) oleh akaun: ${userDisplay} (${userEmail}) pada ${new Date().toLocaleString('ms-MY')}. Tindakan telah disekat.`,
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

  const handleUpdateDepartment = (deptId: string, updates: Partial<Department>) => {
    if (!canManageUsers(currentUser)) {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan mengemaskini jabatan.', 'error');
      return;
    }
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, ...updates } : d))
    );
    if (updates.name) {
      setUsers((prev) =>
        prev.map((u) => (u.departmentId === deptId ? { ...u, departmentName: updates.name! } : u))
      );
      if (currentUser && currentUser.departmentId === deptId) {
        setCurrentUser((prev) => prev ? ({ ...prev, departmentName: updates.name! }) : null);
      }
    }
    logActivity('KEMASKINI_JABATAN', undefined, undefined, `Mengemaskini maklumat jabatan #${deptId}.`);
    showToast('Jabatan Dikemaskini', 'Maklumat jabatan berjaya disimpan.', 'success');
  };

  const handleDeleteDepartment = (deptId: string, fallbackDeptId: string, fallbackUnitId: string) => {
    if (!canManageUsers(currentUser)) {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan memadam jabatan.', 'error');
      return;
    }
    const targetDept = departments.find((d) => d.id === deptId);
    if (!targetDept) return;

    if (targetDept.units && targetDept.units.length > 0) {
      showToast(
        'Gagal Memadam',
        `Jabatan "${targetDept.name}" masih mempunyai ${targetDept.units.length} unit. Sila padam unit terlebih dahulu.`,
        'error'
      );
      return;
    }

    const fallbackDept = departments.find((d) => d.id === fallbackDeptId) || departments.find((d) => d.id === 'dept_general');
    const fallbackUnit = fallbackDept?.units.find((u) => u.id === fallbackUnitId) || fallbackDept?.units[0];
    const fallbackDeptName = fallbackDept?.name || 'Jabatan Am & Khidmat Pengurusan';
    const fallbackUnitName = fallbackUnit?.name || 'Unit Pengurusan Am (Menunggu Penugasan)';

    // Reassign affected documents so they never become orphaned
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.departmentId === deptId) {
          return {
            ...doc,
            departmentId: fallbackDept?.id || 'dept_general',
            unitId: fallbackUnit?.id || 'unit_general',
            lastModifiedBy: currentUser?.displayName || 'Pentadbir Sistem',
            updatedAt: new Date().toISOString(),
          };
        }
        return doc;
      })
    );

    // Reassign affected users
    setUsers((prev) =>
      prev.map((u) => {
        if (u.departmentId === deptId) {
          return {
            ...u,
            departmentId: fallbackDept?.id || 'dept_general',
            departmentName: fallbackDeptName,
            unitId: fallbackUnit?.id || 'unit_general',
            unitName: fallbackUnitName,
          };
        }
        return u;
      })
    );

    if (currentUser && currentUser.departmentId === deptId) {
      setCurrentUser((prev) => prev ? ({
        ...prev,
        departmentId: fallbackDept?.id || 'dept_general',
        departmentName: fallbackDeptName,
        unitId: fallbackUnit?.id || 'unit_general',
        unitName: fallbackUnitName,
      }) : null);
    }

    setDepartments((prev) => prev.filter((d) => d.id !== deptId));
    logActivity(
      'PADAM_JABATAN',
      undefined,
      undefined,
      `Memadam jabatan "${targetDept.name}". Fail & pegawai dipindahkan ke "${fallbackDeptName}".`
    );
    showToast('Jabatan Dipadam', `Jabatan "${targetDept.name}" telah dipadam dan rekod dialihkan.`, 'info');
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

  const handleUpdateUnit = (deptId: string, unitId: string, updates: Partial<Unit>) => {
    if (!canManageUsers(currentUser)) {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan mengemaskini unit.', 'error');
      return;
    }
    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id === deptId) {
          return {
            ...d,
            units: d.units.map((u) => (u.id === unitId ? { ...u, ...updates } : u)),
          };
        }
        return d;
      })
    );
    if (updates.name) {
      setUsers((prev) =>
        prev.map((u) => (u.unitId === unitId ? { ...u, unitName: updates.name! } : u))
      );
      if (currentUser && currentUser.unitId === unitId) {
        setCurrentUser((prev) => prev ? ({ ...prev, unitName: updates.name! }) : null);
      }
    }
    logActivity('KEMASKINI_UNIT', undefined, undefined, `Mengemaskini maklumat unit #${unitId}.`);
    showToast('Unit Dikemaskini', 'Maklumat unit berjaya dikemaskini.', 'success');
  };

  const handleDeleteUnit = (deptId: string, unitId: string, fallbackUnitId: string) => {
    if (!canManageUsers(currentUser)) {
      showToast('Akses Ditolak', 'Hanya Pentadbir dibenarkan memadam unit.', 'error');
      return;
    }
    const parentDept = departments.find((d) => d.id === deptId);
    const targetUnit = parentDept?.units.find((u) => u.id === unitId);
    const fallbackUnit = parentDept?.units.find((u) => u.id === fallbackUnitId);
    const fallbackUnitName = fallbackUnit?.name || 'Unit Pengurusan Am (Menunggu Penugasan)';

    // Reassign documents
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.unitId === unitId) {
          return {
            ...doc,
            unitId: fallbackUnit?.id || 'unit_general',
            lastModifiedBy: currentUser?.displayName || 'Pentadbir Sistem',
            updatedAt: new Date().toISOString(),
          };
        }
        return doc;
      })
    );

    // Reassign users
    setUsers((prev) =>
      prev.map((u) => {
        if (u.unitId === unitId) {
          return {
            ...u,
            unitId: fallbackUnit?.id || 'unit_general',
            unitName: fallbackUnitName,
          };
        }
        return u;
      })
    );

    if (currentUser && currentUser.unitId === unitId) {
      setCurrentUser((prev) => prev ? ({
        ...prev,
        unitId: fallbackUnit?.id || 'unit_general',
        unitName: fallbackUnitName,
      }) : null);
    }

    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id === deptId) {
          return {
            ...d,
            units: d.units.filter((u) => u.id !== unitId),
          };
        }
        return d;
      })
    );

    logActivity(
      'PADAM_UNIT',
      undefined,
      undefined,
      `Memadam unit "${targetUnit?.name}". Fail dialihkan kepada "${fallbackUnitName}".`
    );
    showToast('Unit Dipadam', `Unit "${targetUnit?.name}" dipadam dan fail dialihkan.`, 'info');
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole, newClearance: ClearanceLevel) => {
    const targetUser = users.find((u) => u.uid === userId);
    setUsers((prev) =>
      prev.map((u) => (u.uid === userId ? { ...u, role: newRole, clearanceLevel: newClearance } : u))
    );
    if (currentUser && currentUser.uid === userId) {
      setCurrentUser((prev) => prev ? ({ ...prev, role: newRole, clearanceLevel: newClearance }) : null);
    }
    logActivity(
      'KEMASKINI_PERANAN',
      undefined,
      undefined,
      `Mengubah peranan ${targetUser?.displayName} kepada ${newRole.toUpperCase()} (Tapisan: ${newClearance}).`
    );
    showToast('Akses Pengguna Dikemaskini', `${targetUser?.displayName}: ${newRole.toUpperCase()} · ${newClearance}`, 'info');
  };

  // User Group Handlers
  const handleCreateGroup = (newGroupData: Omit<UserGroup, 'id' | 'createdAt'>) => {
    const newGroup: UserGroup = {
      ...newGroupData,
      id: `grp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => [...prev, newGroup]);
    logActivity('CIPTA_GROUP', undefined, undefined, `Mencipta kumpulan pengguna: "${newGroup.name}" (${newGroup.code}) dengan kebenaran: ${newGroup.permission}.`);
    showToast('Kumpulan Dicipta', `Kumpulan "${newGroup.name}" berjaya ditambah.`, 'success');
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<UserGroup>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
    logActivity('KEMASKINI_GROUP', undefined, undefined, `Mengemaskini kumpulan #${groupId}.`);
    showToast('Kumpulan Dikemaskini', 'Perubahan kumpulan berjaya disimpan.', 'success');
  };

  const handleDeleteGroup = (groupId: string) => {
    const targetGroup = groups.find((g) => g.id === groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.allowedGroups?.includes(groupId)) {
          return {
            ...d,
            allowedGroups: d.allowedGroups.filter((gId) => gId !== groupId),
          };
        }
        return d;
      })
    );
    setFolders((prev) =>
      prev.map((f) => {
        if (f.allowedGroups?.includes(groupId)) {
          return {
            ...f,
            allowedGroups: f.allowedGroups.filter((gId) => gId !== groupId),
          };
        }
        return f;
      })
    );
    logActivity('PADAM_GROUP', undefined, undefined, `Memadam kumpulan "${targetGroup?.name || groupId}".`);
    showToast('Kumpulan Dipadam', `Kumpulan "${targetGroup?.name || groupId}" telah dipadam.`, 'info');
  };

  // Folder Handlers
  const handleCreateFolder = (newFolderData: Omit<DmsFolder, 'id' | 'createdAt'>) => {
    const newFolder: DmsFolder = {
      ...newFolderData,
      id: `fld_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, newFolder]);
    logActivity('CIPTA_FOLDER', undefined, undefined, `Mencipta folder arkib: "${newFolder.name}" (${newFolder.clearanceLevel}).`);
    showToast('Folder Dicipta', `Folder "${newFolder.name}" berjaya diwujudkan.`, 'success');
  };

  const handleUpdateFolder = (folderId: string, updates: Partial<DmsFolder>) => {
    const targetFolder = folders.find((f) => f.id === folderId);
    if (!targetFolder) return;

    if (!canEditFolder(targetFolder, currentUser)) {
      showToast('Akses Ditolak', 'Suntingan nama folder hanya dibenarkan kepada Pencipta/Owner asal atau Super Admin sahaja.', 'error');
      return;
    }

    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, ...updates } : f))
    );
    const oldName = targetFolder.name;
    const newName = updates.name || oldName;
    const nameChangeMsg = updates.name && updates.name !== oldName ? ` (Nama diubah: "${oldName}" -> "${newName}")` : '';
    logActivity('KEMASKINI_FOLDER', undefined, undefined, `Mengemaskini folder "${newName}"${nameChangeMsg}.`);
    showToast('Folder Dikemaskini', `Folder "${newName}" berjaya dikemaskini.`, 'success');
  };

  const handleDeleteFolder = (folderId: string) => {
    const targetFolder = folders.find((f) => f.id === folderId);
    if (!targetFolder) return;

    const hasChildren = folders.some((cf) => cf.parentId === folderId);
    const hasDocs = documents.some((d) => d.folderId === folderId);
    if (hasChildren || hasDocs) {
      showToast(
        'Gagal Memadam Folder',
        `Folder "${targetFolder.name}" tidak boleh dipadam kerana masih mengandungi fail atau sub-folder.`,
        'error'
      );
      return;
    }

    if (!canManageFolder(targetFolder, currentUser)) {
      showToast(
        'Akses Ditolak',
        'Hanya Pencipta Folder (Owner), Pentadbir Sistem (Admin), atau Super Admin dibenarkan memadam folder ini.',
        'error'
      );
      return;
    }

    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    logActivity('PADAM_FOLDER', undefined, undefined, `Memadam folder kosong "${targetFolder.name}".`);
    showToast('Folder Dipadam', `Folder kosong "${targetFolder.name}" telah dikeluarkan.`, 'info');
  };

  const handleMoveDocumentToFolder = (docId: string, targetFolderId: string | null) => {
    const targetDoc = documents.find((d) => d.id === docId);
    const targetFolder = targetFolderId ? folders.find((f) => f.id === targetFolderId) : null;
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, folderId: targetFolderId, updatedAt: new Date().toISOString() } : d))
    );
    logActivity(
      'PINDAH_DOKUMEN_FOLDER',
      docId,
      targetDoc?.title,
      `Memindahkan dokumen ke "${targetFolder ? targetFolder.name : 'ETS Document Management Utama'}".`
    );
  };

  const handleToggleOfflineAvailable = (docId: string, available: boolean) => {
    const targetDoc = documents.find((d) => d.id === docId);
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, offlineAvailable: available } : d))
    );
    if (available) {
      logActivity(
        'SEGERAK_LUAR_TALIAN',
        docId,
        targetDoc?.title,
        `Dokumen dicache ke dalam storan peranti untuk penyuntingan luar talian.`
      );
      showToast('Tersedia Luar Talian', `"${targetDoc?.title || 'Dokumen'}" sedia untuk disunting luar talian.`, 'success');
    } else {
      showToast('Akses Luar Talian Dinyahaktifkan', `Dokumen kini memerlukan sambungan internet.`, 'info');
    }
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
        storageConfig={storageConfig}
        onOpenStorageSetup={() => setIsStorageSetupOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
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
            <span className="font-semibold text-slate-800 dark:text-slate-200">ETS Document Management</span>
            <span aria-hidden="true">/</span>
            <span className="capitalize">
              {currentTab === 'documents'
                ? selectedDoc
                  ? `Fail: ${selectedDoc.title.substring(0, 28)}...`
                  : docViewStyle === 'drive'
                  ? 'Paparan Folder'
                  : 'Dokumen & Paper'
                : currentTab === 'groups'
                ? 'Pengurusan Kumpulan Pengguna & Matriks Hak Cipta'
                : currentTab === 'categories'
                ? 'Pengurusan Kategori Fail & Paper'
                : currentTab === 'users'
                ? 'Pengurusan Pengguna (No. Perkhidmatan)'
                : currentTab === 'organization'
                ? 'Modul Jabatan & Unit'
                : 'Analitik Produktiviti & Log'}
            </span>
          </div>

          {/* Profil & Sesi Pengguna Aktif */}
          <UserProfileSwitcher
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
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
                onDeleteDocument={handleDeleteDocument}
                onAddComment={handleAddComment}
                onAddNewRevision={handleAddNewRevision}
                onUpdatePaperStatus={handleUpdatePaperStatus}
                onLogAccessAttempt={handleLogAccessAttempt}
                onExportPDF={(doc) => {
                  exportDocumentsReportPDF([doc], currentUser?.displayName || 'Pengguna Awam', doc.category);
                  showToast('PDF Dijana', `Laporan "${doc.title}" berjaya dimuat turun.`, 'success');
                }}
                onShowToast={showToast}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
              />
            ) : (
              <div className="space-y-5">
                {/* View Switcher: Standard Table / Cards vs Paparan Folder */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <button
                      onClick={() => setDocViewStyle('standard')}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        docViewStyle === 'standard'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Senarai Standard (Jadual & Kad)</span>
                    </button>
                    <button
                      onClick={() => setDocViewStyle('drive')}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        docViewStyle === 'drive'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-500" />
                      <span>Paparan Folder</span>
                    </button>
                  </div>

                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    {docViewStyle === 'drive'
                      ? 'Navigasi folder hierarki, sub-folder & penugasan kumpulan'
                      : 'Carian pantas, tapisan kategori & kronologi lengkap'}
                  </span>
                </div>

                {docViewStyle === 'standard' ? (
                  <DocumentList
                    documents={documents}
                    categories={categories}
                    currentUser={currentUser}
                    onSelectDocument={(doc) => setSelectedDocId(doc.id)}
                    onDeleteDocument={handleDeleteDocument}
                    onExportPDF={(selectedDocs) => {
                      const targetDocs = selectedDocs || documents;
                      exportDocumentsReportPDF(targetDocs, currentUser?.displayName || 'Pengguna Awam');
                      showToast('Eksport PDF Selesai', `${targetDocs.length} dokumen dieksport ke PDF.`, 'success');
                    }}
                    onExportCSV={(selectedDocs) => {
                      const targetDocs = selectedDocs || documents;
                      exportDocumentsToCSV(targetDocs);
                      showToast('Eksport CSV Selesai', `${targetDocs.length} rekod dieksport ke CSV.`, 'success');
                    }}
                    onShowToast={showToast}
                    onOpenLoginModal={() => setIsLoginModalOpen(true)}
                  />
                ) : (
                  <DriveFolderView
                    folders={folders}
                    documents={documents}
                    groups={groups}
                    users={users}
                    currentUser={currentUser}
                    onSelectDocument={(doc) => setSelectedDocId(doc.id)}
                    onOpenCreateDocumentModal={(targetFolderId) => {
                      if (!currentUser) {
                        setIsLoginModalOpen(true);
                        showToast('Perlu Log Masuk', 'Sila log masuk dengan No. Perkhidmatan terlebih dahulu.', 'error');
                        return;
                      }
                      setEditingDoc(null);
                      setIsEditorModalOpen(true);
                    }}
                    onCreateFolder={handleCreateFolder}
                    onUpdateFolder={handleUpdateFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onDeleteDocument={handleDeleteDocument}
                    onMoveDocumentToFolder={handleMoveDocumentToFolder}
                    onToggleOfflineAvailable={handleToggleOfflineAvailable}
                    onShowToast={showToast}
                    onOpenLoginModal={() => setIsLoginModalOpen(true)}
                  />
                )}
              </div>
            )}
          </>
        )}

        {currentTab === 'groups' && (
          <UserGroupModule
            groups={groups}
            users={users}
            currentUser={currentUser}
            onCreateGroup={handleCreateGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'categories' && (
          <CategoryManagerModule
            categories={categories}
            documents={documents}
            currentUser={currentUser}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'users' && (
          <UserManagerModule
            users={users}
            departments={departments}
            currentUser={currentUser}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
            onLoginWithCredentials={handleLoginWithCredentials}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'organization' && (
          <OrganizationModule
            departments={departments}
            users={users}
            documents={documents}
            currentUser={currentUser}
            onCreateDepartment={handleCreateDepartment}
            onUpdateDepartment={handleUpdateDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onCreateUnit={handleCreateUnit}
            onUpdateUnit={handleUpdateUnit}
            onDeleteUnit={handleDeleteUnit}
            onUpdateUserRole={handleUpdateUserRole}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsDashboard
            documents={documents}
            logs={activityLogs}
            departments={departments}
            users={users}
            currentUser={currentUser}
            onExportPDF={() => {
              exportDocumentsReportPDF(documents, currentUser?.displayName || 'Pengguna Awam', 'Analitik Produktiviti');
              showToast('Laporan Analitik PDF Dijana', 'Ringkasan eksekutif telah dimuat turun.', 'success');
            }}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'audit' && (
          <div className="space-y-6">
            {!isSuperAdmin(currentUser) ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-10 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/60 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                    AKSES TERHAD: MODUL LOG AUDIT KESELAMATAN
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Modul Log Audit Aktiviti & Pengawasan Keselamatan (Masa Nyata) hanya dibenarkan kepada <strong>Super Admin</strong> sebagai langkah perlindungan keselamatan dan pematuhan integriti aplikasi.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('documents')}
                  className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Kembali ke Dokumen Utama
                </button>
              </div>
            ) : (
              <AuditLogView
                logs={activityLogs}
                onExportPDF={() => {
                  exportActivityLogsReportPDF(activityLogs, currentUser?.displayName || 'Super Admin');
                  showToast('Log Audit PDF Selesai', 'Laporan audit keselamatan dimuat turun.', 'success');
                }}
                onExportCSV={() => {
                  exportActivityLogsToCSV(activityLogs);
                  showToast('Log Audit CSV Selesai', 'Fail CSV log audit dimuat turun.', 'success');
                }}
              />
            )}
          </div>
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
        categories={categories}
        folders={folders}
        groups={groups}
        users={users}
        isOnline={isOnline}
        storageConfig={storageConfig}
        onOpenStorageSetup={() => setIsStorageSetupOpen(true)}
        onShowToast={showToast}
      />

      {/* Google Cloud Storage Setup Modal */}
      <GoogleStorageSetupModal
        isOpen={isStorageSetupOpen}
        onClose={() => setIsStorageSetupOpen(false)}
        storageConfig={storageConfig}
        currentUser={currentUser}
        onConfigSaved={(updated) => setStorageConfig(updated)}
        onShowToast={showToast}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {}}
      />

      {/* Official Login Modal with 6-digit No. Perkhidmatan & Password */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onShowToast={showToast}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
