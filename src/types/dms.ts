/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'editor' | 'viewer';

export type ClearanceLevel = 'BIASA' | 'TERHAD' | 'SULIT' | 'RAHSIA_BESAR';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  unitId: string;
  unitName: string;
  clearanceLevel: ClearanceLevel;
  avatarUrl: string;
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

export type DocumentCategory =
  | 'Dasar & Polisi'
  | 'Kontrak & Perjanjian'
  | 'Kewangan & Bajet'
  | 'Teknikal & IT'
  | 'Laporan Strategik'
  | 'Sumber Manusia'
  | 'Minit Mesyuarat';

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
  category: DocumentCategory;
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
  authorId: string;
  authorName: string;
  authorEmail: string;
  lastModifiedBy: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSizeOriginal?: number;
  attachmentSizeCompressed?: number;
  createdAt: string;
  updatedAt: string;
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
  | 'EKSPORT_LAPORAN_PDF'
  | 'EKSPORT_LAPORAN_CSV'
  | 'ENKRIPSI_DOKUMEN'
  | 'NYAHENKRIPSI_DOKUMEN'
  | 'CIPTA_JABATAN'
  | 'CIPTA_UNIT'
  | 'KEMASKINI_PERANAN'
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
