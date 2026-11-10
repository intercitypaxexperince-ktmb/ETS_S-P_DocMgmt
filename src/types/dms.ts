/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'editor' | 'viewer';

export type ClearanceLevel = 'BIASA' | 'TERHAD' | 'SULIT' | 'P&C' | 'RAHSIA_BESAR';

export const CLEARANCE_HIERARCHY: Record<string, number> = {
  BIASA: 1,
  TERHAD: 2,
  SULIT: 3,
  'P&C': 4,
  RAHSIA_BESAR: 4, // Keserasian ke belakang
};

export const hasClearance = (
  userClearance: string,
  requiredClearance: string,
  userRole?: string
): boolean => {
  if (userRole === 'admin') return true;
  const userRank = CLEARANCE_HIERARCHY[userClearance] || 1;
  const reqRank = CLEARANCE_HIERARCHY[requiredClearance] || 1;
  return userRank >= reqRank;
};

export const PRIMARY_SUPER_ADMIN_EMAIL = 'intercity.pax.experince@gmail.com';
export const SUPER_ADMIN_EMAIL = PRIMARY_SUPER_ADMIN_EMAIL;
export const MAX_SUPER_ADMINS = 3;

export const isSuperAdmin = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  if ((user.email || '').trim().toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase()) return true;
  if (user.isSuperAdmin === true) return true;
  return false;
};

export const canManageUsers = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  return isSuperAdmin(user) || user.role === 'admin';
};

export type AccountStatus = 'active' | 'inactive' | 'expired' | 'suspended';

export interface UserProfile {
  uid: string;
  serviceNumber: string; // 6 aksara / nombor perkhidmatan rasmi (wajib)
  displayName: string;
  email: string;
  role: UserRole;
  isSuperAdmin?: boolean; // Tanda hak istimewa Super Admin (Maksimum 3 orang)
  departmentId: string;
  departmentName: string;
  unitId: string;
  unitName: string;
  clearanceLevel: ClearanceLevel;
  avatarUrl: string;
  expiryDate: string; // Tarikh luput akaun pengguna (wajib)
  status: AccountStatus;
  password?: string; // Kata laluan log masuk pengguna
}

export interface GoogleStorageConfig {
  isConfigured: boolean;
  bucketName: string;
  configuredAt?: string;
  configuredBy?: string;
}

export interface Unit {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headOfDepartment: string;
  units: Unit[];
  createdAt: string;
}

export interface CustomCategory {
  id: string;
  code: string; // e.g. SOP, DAL, TENDER, KONTRAK, MPC, INVOIS, SKK
  name: string;
  description: string;
  createdAt: string;
  isSystem?: boolean;
}

export type PaperStatus =
  | 'Disediakan'
  | 'Dalam Semakan Jabatan'
  | 'Pengesahan Kewangan'
  | 'Semakan Jawatankuasa MPC/Tender'
  | 'Diluluskan'
  | 'Pindaan Diperlukan'
  | 'Simpanan / Rujukan'
  | 'Selesai & Diarkibkan';

export interface DocumentWorkflowStep {
  id: string;
  stage: string;
  handledBy: string;
  departmentName: string;
  date: string;
  status: 'selesai' | 'sedang_diproses' | 'menunggu' | 'ditolak';
  notes: string;
  previousStatus?: PaperStatus;
  newStatus?: PaperStatus;
}

export type TaskCategory =
  | 'Tugasan Projek'
  | 'Kelulusan Pengurusan'
  | 'Audit & Pematuhan'
  | 'Operasi Harian'
  | 'Arkib Digital';

export interface DocumentRevision {
  id: string;
  version: string;
  changeSummary: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  contentSnapshot: string;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  revisionTag?: 'Cadangan Semakan' | 'Pembetulan Fakta' | 'Kelulusan Diperlukan' | 'Kemas Kini Klausa' | 'Umum';
  highlightText?: string;
  createdAt: string;
}

export type GroupPermission = 'view_only' | 'review_only' | 'edit_only' | 'all';

export interface UserGroup {
  id: string;
  name: string;
  code: string;
  description: string;
  permission: GroupPermission;
  memberIds: string[]; // List of UserProfile.uid
  departmentId?: string; // Optional department restriction
  color?: string;
  createdAt: string;
  createdBy: string;
}

export interface DmsFolder {
  id: string;
  name: string;
  parentId?: string | null; // null for root folders
  departmentId?: string;
  unitId?: string;
  clearanceLevel: ClearanceLevel;
  allowedUsers?: string[]; // array of UserProfile.uid
  allowedGroups?: string[]; // array of UserGroup.id
  color?: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  creatorId?: string;
  isProtected?: boolean;
}

export interface DmsDocument {
  id: string;
  title: string;
  category: string; // Dinamik dari CustomCategory (e.g. SOP, Paper DAL, Paper Tender, etc.)
  taskCategory: TaskCategory;
  tags: string[];
  content: string;
  summary: string;
  isConfidential: boolean;
  clearanceRequired: ClearanceLevel;
  allowedUsers?: string[];
  allowedGroups?: string[]; // ID kumpulan pengguna yang diberi akses
  folderId?: string | null; // ID folder (Google Drive style hierarchy)
  offlineAvailable?: boolean; // Tanda tersedia untuk suntingan luar talian
  departmentId?: string;
  unitId?: string;
  isEncrypted: boolean;
  encryptionAlgo?: string;
  encryptedContent?: string;
  salt?: string;
  iv?: string;
  currentVersion: string;
  revisions: DocumentRevision[];

  // Tarikh & Rekod Pengarang
  documentDate: string; // Tarikh Dokumen / Paper Rasmi dikeluarkan
  authorId: string; // Pencipta asal
  authorName: string;
  authorEmail: string;
  creatorServiceNumber?: string; // No. perkhidmatan pencipta
  lastModifiedBy: string;
  createdAt: string; // Tarikh dicipta
  updatedAt: string; // Tarikh terkini dikemaskini

  // Kronologi Status Paper / Workflow tracking
  paperStatus: PaperStatus;
  workflowChronology: DocumentWorkflowStep[];

  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSizeOriginal?: number;
  attachmentSizeCompressed?: number;
}

export type ActionType =
  | 'CIPTA_DOKUMEN'
  | 'KEMASKINI_DOKUMEN'
  | 'PADAM_DOKUMEN'
  | 'LIHAT_DOKUMEN'
  | 'AKSES_SULIT'
  | 'CUBAAN_AKSES_DITOLAK'
  | 'TAMBAH_KOMEN'
  | 'TANDAI_REVISI'
  | 'KEMASKINI_STATUS_PAPER'
  | 'TAMBAH_LANGKAH_ALIRAN'
  | 'EKSPORT_LAPORAN_PDF'
  | 'EKSPORT_LAPORAN_CSV'
  | 'ENKRIPSI_DOKUMEN'
  | 'NYAHENKRIPSI_DOKUMEN'
  | 'CIPTA_JABATAN'
  | 'KEMASKINI_JABATAN'
  | 'PADAM_JABATAN'
  | 'CIPTA_UNIT'
  | 'KEMASKINI_UNIT'
  | 'PADAM_UNIT'
  | 'SETUP_STORAGE'
  | 'CIPTA_PENGGUNA'
  | 'KEMASKINI_PENGGUNA'
  | 'PADAM_PENGGUNA'
  | 'KEMASKINI_STATUS_PENGGUNA'
  | 'CIPTA_KATEGORI'
  | 'PADAM_KATEGORI'
  | 'KEMASKINI_PERANAN'
  | 'LOG_MASUK_NO_PERKHIDMATAN'
  | 'SEGERAK_LUAR_TALIAN'
  | 'CIPTA_GROUP'
  | 'KEMASKINI_GROUP'
  | 'PADAM_GROUP'
  | 'CIPTA_FOLDER'
  | 'KEMASKINI_FOLDER'
  | 'PADAM_FOLDER'
  | 'PINDAH_DOKUMEN_FOLDER';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: ActionType;
  documentId?: string;
  documentTitle?: string;
  details: string;
  isConfidential?: boolean;
  timestamp: string;
}

export interface EmailNotification {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  documentId?: string;
  status: 'sent' | 'queued' | 'failed';
  timestamp: string;
  triggeredBy: string;
  priority: 'normal' | 'high' | 'urgent';
}

export interface OfflineSyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete' | 'comment';
  entity: 'document' | 'comment';
  payload: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
}

/**
 * Semak akses pengguna kepada folder berdasarkan klasifikasi keselamatan,
 * penugasan individu (allowedUsers), dan penugasan kumpulan (allowedGroups).
 */
export const canUserAccessFolder = (
  folder: DmsFolder,
  user?: UserProfile | null,
  groups: UserGroup[] = []
): boolean => {
  // Jika tiada sesi aktif (guest), hanya folder biasa tanpa sebarang penugasan dibenarkan
  if (!user) {
    const isRestricted =
      folder.clearanceLevel !== 'BIASA' ||
      (folder.allowedUsers && folder.allowedUsers.length > 0) ||
      (folder.allowedGroups && folder.allowedGroups.length > 0);
    return !isRestricted;
  }

  if (isSuperAdmin(user) || user.role === 'admin') return true;

  // 1. Semak kelayakan tapisan keselamatan (Clearance Level)
  const clearanceOk = hasClearance(user.clearanceLevel, folder.clearanceLevel, user.role);
  if (!clearanceOk) return false;

  // 2. Semak jika folder mempunyai sekatan khusus
  const hasUserRestrictions = folder.allowedUsers && folder.allowedUsers.length > 0;
  const hasGroupRestrictions = folder.allowedGroups && folder.allowedGroups.length > 0;

  // Jika tiada sekatan individu atau kumpulan khusus, tapisan am mencukupi
  if (!hasUserRestrictions && !hasGroupRestrictions) {
    return true;
  }

  // Semak jika pengguna dalam senarai individu
  if (hasUserRestrictions && folder.allowedUsers!.includes(user.uid)) {
    return true;
  }

  // Semak jika pengguna adalah ahli salah satu kumpulan yang dibenarkan
  if (hasGroupRestrictions) {
    const userGroupIds = groups
      .filter((g) => g.memberIds.includes(user.uid))
      .map((g) => g.id);
    const inAllowedGroup = folder.allowedGroups!.some((gId) => userGroupIds.includes(gId));
    if (inAllowedGroup) return true;
  }

  return false;
};

/**
 * Tentukan tahap kebenaran efektif pengguna terhadap sesuatu dokumen
 * Mengambil kira peranan sistem, pengarang asal, penugasan individu, dan kebenaran kumpulan pengguna.
 */
export const getDocumentEffectiveAccess = (
  doc: DmsDocument,
  user?: UserProfile | null,
  groups: UserGroup[] = []
): { canAccess: boolean; permission: 'all' | 'edit' | 'review' | 'view'; via: string } => {
  // Jika tiada sesi aktif (tiada pengguna log masuk), hanya dokumen terbuka/biasa dipaparkan
  if (!user) {
    const isPublic =
      doc.clearanceRequired === 'BIASA' &&
      !doc.isConfidential &&
      (!doc.allowedUsers || doc.allowedUsers.length === 0) &&
      (!doc.allowedGroups || doc.allowedGroups.length === 0);

    if (isPublic) {
      return { canAccess: true, permission: 'view', via: 'Fail Terbuka / Akses Awam' };
    }
    return { canAccess: false, permission: 'view', via: 'Tiada Sesi Aktif (Perlu Log Masuk)' };
  }

  // Super Admin & Admin sentiasa mempunyai akses penuh
  if (isSuperAdmin(user) || user.role === 'admin') {
    return { canAccess: true, permission: 'all', via: 'Pentadbir Sistem' };
  }

  // Pengarang dokumen mempunyai akses penuh
  if (doc.authorId === user.uid) {
    return { canAccess: true, permission: 'all', via: 'Pencipta Asal Dokumen' };
  }

  // Semak tapisan keselamatan dokumen
  const requiredLevel = doc.clearanceRequired || (doc.isConfidential ? 'SULIT' : 'BIASA');
  const clearanceOk = hasClearance(user.clearanceLevel, requiredLevel, user.role);

  // Semak jika pengguna dalam senarai allowedUsers individu
  const isDirectlyAllowed = doc.allowedUsers && doc.allowedUsers.includes(user.uid);

  // Semak kumpulan pengguna yang dianggotai dan kumpul permissions tertinggi
  const userMatchingGroups = groups.filter(
    (g) => g.memberIds.includes(user.uid) && doc.allowedGroups?.includes(g.id)
  );

  let highestGroupPermission: 'all' | 'edit' | 'review' | 'view' | null = null;
  let matchingGroupName = '';

  for (const group of userMatchingGroups) {
    matchingGroupName = group.name;
    if (group.permission === 'all') {
      highestGroupPermission = 'all';
      break;
    } else if (group.permission === 'edit_only' && !highestGroupPermission) {
      highestGroupPermission = 'edit';
    } else if (group.permission === 'review_only' && !highestGroupPermission) {
      highestGroupPermission = 'review';
    } else if (group.permission === 'view_only' && !highestGroupPermission) {
      highestGroupPermission = 'view';
    }
  }

  // Jika dokumen ada sekatan ketat (allowedUsers atau allowedGroups wujud)
  const hasSpecificAssignments = (doc.allowedUsers && doc.allowedUsers.length > 0) || (doc.allowedGroups && doc.allowedGroups.length > 0);

  if (hasSpecificAssignments) {
    if (!isDirectlyAllowed && userMatchingGroups.length === 0) {
      return { canAccess: false, permission: 'view', via: 'Tiada Penugasan Individu/Kumpulan' };
    }
    if (!clearanceOk) {
      return { canAccess: false, permission: 'view', via: 'Tapisan Keselamatan Tidak Mencukupi' };
    }

    if (highestGroupPermission) {
      return {
        canAccess: true,
        permission: highestGroupPermission,
        via: `Kumpulan: ${matchingGroupName}`,
      };
    }

    // Default jika allowedUsers individu
    const defaultPerm = user.role === 'editor' ? 'edit' : 'view';
    return { canAccess: true, permission: defaultPerm, via: 'Penugasan Individu' };
  }

  // Jika tiada sekatan individu/kumpulan, ikut peranan asas dan clearance
  if (!clearanceOk) {
    return { canAccess: false, permission: 'view', via: 'Tapisan Keselamatan Tidak Mencukupi' };
  }

  const basePerm = user.role === 'editor' ? 'edit' : 'view';
  return { canAccess: true, permission: basePerm, via: `Peranan Pengguna (${user.role.toUpperCase()})` };
};

/**
 * Semak sama ada pengguna dibenarkan memadam dokumen.
 * Dibenarkan untuk: Pencipta / Owner asal fail, Pentadbir Sistem (Admin), atau Super Admin.
 */
export const canDeleteDocument = (doc: DmsDocument, user?: UserProfile | null): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user) || user.role === 'admin') return true;
  if (
    doc.authorId === user.uid ||
    (doc.creatorServiceNumber && doc.creatorServiceNumber === user.serviceNumber) ||
    (doc.authorEmail && user.email && doc.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
    (doc.authorName && doc.authorName.toLowerCase() === user.displayName.toLowerCase())
  ) {
    return true;
  }
  return false;
};

/**
 * Semak sama ada pengguna dibenarkan mengurus dan memadam folder.
 * Dibenarkan untuk: Pencipta / Owner asal folder, Pentadbir Sistem (Admin), atau Super Admin.
 */
export const canManageFolder = (folder: DmsFolder, user?: UserProfile | null): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user) || user.role === 'admin') return true;
  if (
    folder.creatorId === user.uid ||
    (folder.createdBy && (
      folder.createdBy === user.displayName ||
      folder.createdBy === user.serviceNumber ||
      folder.createdBy.includes(user.serviceNumber || '____') ||
      folder.createdBy.toLowerCase() === user.displayName.toLowerCase()
    ))
  ) {
    return true;
  }
  return false;
};

/**
 * Semak sama ada pengguna adalah pencipta/pemilik (owner) asal folder.
 */
export const isFolderOwner = (folder: DmsFolder, user?: UserProfile | null): boolean => {
  if (!user) return false;
  if (folder.creatorId && folder.creatorId === user.uid) return true;
  if (folder.createdBy) {
    const creator = folder.createdBy.trim().toLowerCase();
    const userDisplay = (user.displayName || '').trim().toLowerCase();
    const userSvc = (user.serviceNumber || '').trim().toLowerCase();
    if (creator === userDisplay) return true;
    if (userSvc && (creator.includes(userSvc) || creator === userSvc)) return true;
    if (creator.includes(userDisplay)) return true;
  }
  return false;
};

/**
 * Semak sama ada pengguna dibenarkan menyunting nama folder.
 * SYARAT: HANYA DIBENARKAN KEPADA OWNER (PENCIPTA ASAL) ATAU SUPER ADMIN.
 */
export const canEditFolder = (folder: DmsFolder, user?: UserProfile | null): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return isFolderOwner(folder, user);
};


