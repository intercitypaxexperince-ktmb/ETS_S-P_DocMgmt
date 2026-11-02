/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'editor' | 'viewer';

export type ClearanceLevel = 'BIASA' | 'TERHAD' | 'SULIT' | 'RAHSIA_BESAR';

export type AccountStatus = 'active' | 'expired' | 'suspended';

export interface UserProfile {
  uid: string;
  serviceNumber: string; // 6 aksara / nombor perkhidmatan rasmi (wajib)
  displayName: string;
  email: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  unitId: string;
  unitName: string;
  clearanceLevel: ClearanceLevel;
  avatarUrl: string;
  expiryDate: string; // Tarikh luput akaun pengguna (wajib)
  status: AccountStatus;
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
  | 'Selesai & Diarkibkan';

export interface DocumentWorkflowStep {
  id: string;
  stage: string;
  handledBy: string;
  departmentName: string;
  date: string;
  status: 'selesai' | 'sedang_diproses' | 'menunggu' | 'ditolak';
  notes: string;
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
  | 'CIPTA_UNIT'
  | 'CIPTA_PENGGUNA'
  | 'KEMASKINI_PENGGUNA'
  | 'CIPTA_KATEGORI'
  | 'PADAM_KATEGORI'
  | 'KEMASKINI_PERANAN'
  | 'LOG_MASUK_NO_PERKHIDMATAN'
  | 'SEGERAK_LUAR_TALIAN';

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
