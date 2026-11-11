/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Department,
  DmsDocument,
  ActivityLog,
  UserProfile,
  EmailNotification,
  CustomCategory,
  UserGroup,
  DmsFolder,
} from '../types/dms';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept_it',
    name: 'Jabatan Teknologi Maklumat & Keselamatan Siber',
    code: 'JTMK',
    description: 'Mengurus tadbir infrastruktur digital, keselamatan data, dan pematuhan arkib digital organisasi.',
    headOfDepartment: 'Ir. Dr. Faridah Mansor',
    createdAt: '2026-01-10T08:00:00Z',
    units: [
      {
        id: 'unit_cyber_sec',
        departmentId: 'dept_it',
        name: 'Unit Keselamatan Maklumat & Audit Siber',
        code: 'UKM',
        description: 'Pengauditan keselamatan maklumat, kawalan kriptografi, dan pematuhan ISO 27001.',
      },
      {
        id: 'unit_app_dev',
        departmentId: 'dept_it',
        name: 'Unit Pembangunan Aplikasi & Arkib Digital',
        code: 'UPA',
        description: 'Pembangunan sistem pengurusan dokumen, penyegerakan awan dan integriti pangkalan data.',
      },
      {
        id: 'unit_infra_cloud',
        departmentId: 'dept_it',
        name: 'Unit Infrastruktur & Pengkomputeran Awan',
        code: 'UIA',
        description: 'Pengendalian pelayan awan hibrid, kuota storan, dan rangkaian komunikasi selamat.',
      },
    ],
  },
  {
    id: 'dept_finance',
    name: 'Jabatan Kewangan & Perolehan Strategik',
    code: 'JKPS',
    description: 'Pengurusan belanjawan tahunan, audit perolehan awam, dan kelulusan dana operasi organisasi.',
    headOfDepartment: 'Dato’ Seri Azman Hashim',
    createdAt: '2026-01-12T09:30:00Z',
    units: [
      {
        id: 'unit_budget',
        departmentId: 'dept_finance',
        name: 'Unit Belanjawan & Pengurusan Aset',
        code: 'UBA',
        description: 'Peruntukan belanjawan pembangunan sistem dan kawalan kos operasi digital.',
      },
      {
        id: 'unit_forensic_audit',
        departmentId: 'dept_finance',
        name: 'Unit Audit Forensik & Pematuhan Fiskal',
        code: 'UAF',
        description: 'Pengauditan transaksi, invois elektronik, dan semakan kepatuhan tatacara kewangan.',
      },
    ],
  },
  {
    id: 'dept_legal',
    name: 'Jabatan Perundangan & Integriti Tadbir Urus',
    code: 'JPIT',
    description: 'Khidmat nasihat undang-undang kontrak, penggubalan dasar perlindungan data peribadi, dan kawalan rahsia rasmi.',
    headOfDepartment: 'Puan Sri Zainab binti Sulaiman',
    createdAt: '2026-01-15T11:00:00Z',
    units: [
      {
        id: 'unit_contract',
        departmentId: 'dept_legal',
        name: 'Unit Penggubalan Kontrak & Perjanjian',
        code: 'UPK',
        description: 'Semakan klausa liabiliti vendor, perjanjian pembekal perkhidmatan awan dan SLA.',
      },
      {
        id: 'unit_integrity',
        departmentId: 'dept_legal',
        name: 'Unit Integriti & Kawalan Rahsia Rasmi',
        code: 'UIR',
        description: 'Klasifikasi keselamatan dokumen sulit negara mengikut Akta Rahsia Rasmi.',
      },
    ],
  },
  {
    id: 'dept_general',
    name: 'Jabatan Am & Khidmat Pengurusan',
    code: 'JAMK',
    description: 'Jabatan rujukan am untuk fail, dokumen dan penugasan yang menunggu klasifikasi atau perpindahan hierarki.',
    headOfDepartment: 'Bahagian Sumber Manusia & Tadbir Urus',
    createdAt: '2026-01-01T08:00:00Z',
    units: [
      {
        id: 'unit_general',
        departmentId: 'dept_general',
        name: 'Unit Pengurusan Am (Menunggu Penugasan)',
        code: 'UAM',
        description: 'Pusat tampungan fail dan staf menunggu penugasan rasmi.',
      },
    ],
  },
];

export const INITIAL_CATEGORIES: CustomCategory[] = [
  {
    id: 'cat_sop',
    code: 'SOP',
    name: 'Standard Operating Procedure (SOP)',
    description: 'Prosedur operasi standard dan arahan kerja tetap jabatan.',
    createdAt: '2026-01-01T08:00:00Z',
    isSystem: true,
  },
  {
    id: 'cat_dal',
    code: 'Paper DAL',
    name: 'Paper Discretionary Authority Limit (DAL)',
    description: 'Kertas perakuan had kuasa budi bicara kewangan dan pengurusan.',
    createdAt: '2026-01-01T08:00:00Z',
    isSystem: true,
  },
  {
    id: 'cat_tender',
    code: 'Paper Tender',
    name: 'Paper Cadangan Tender & Perolehan',
    description: 'Kertas pertimbangan tender terbuka, pra-kelayakan, dan penilaian teknikal vendor.',
    createdAt: '2026-01-01T08:00:00Z',
    isSystem: true,
  },
  {
    id: 'cat_kontrak',
    code: 'Paper Kontrak',
    name: 'Paper Perjanjian & Kontrak Rasmi',
    description: 'Draf dan naskhah perjanjian perkhidmatan perundangan berkontrak.',
    createdAt: '2026-01-01T08:00:00Z',
    isSystem: true,
  },
  {
    id: 'cat_mpc',
    code: 'Paper MPC',
    name: 'Paper Management Procurement Committee (MPC)',
    description: 'Kertas kerja kelulusan Jawatankuasa Perolehan Pengurusan Tertinggi.',
    createdAt: '2026-01-01T08:00:00Z',
    isSystem: true,
  },
  {
    id: 'cat_invois',
    code: 'Invois',
    name: 'Invois & Tuntutan Bayaran',
    description: 'Rekod pesanan penghantaran, perakuan penerimaan dan invois cukai.',
    createdAt: '2026-01-01T08:00:00Z',
    isSystem: true,
  },
  {
    id: 'cat_skk',
    code: 'SKK',
    name: 'Surat Kuasa & Kelulusan Khas (SKK)',
    description: 'Surat kuasa wakil, pelantikan jawatankuasa dan kelulusan pelepasan khas.',
    createdAt: '2026-01-01T08:00:00Z',
    isSystem: true,
  },
  {
    id: 'cat_dasar',
    code: 'Dasar & Polisi',
    name: 'Dasar & Polisi Organisasi',
    description: 'Garis panduan arahan keselamatan maklumat dan polisi digital.',
    createdAt: '2026-01-01T08:00:00Z',
    isSystem: true,
  },
  {
    id: 'cat_minit',
    code: 'Minit Mesyuarat',
    name: 'Minit Mesyuarat Rasmi',
    description: 'Catatan keputusan mesyuarat jawatankuasa dan lembaga pengarah.',
    createdAt: '2026-01-01T08:00:00Z',
    isSystem: true,
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'user_super_admin_00',
    serviceNumber: '990001', // No. Perkhidmatan Super Admin
    displayName: 'Super Administrator',
    email: 'intercity.pax.experince@gmail.com',
    role: 'admin',
    departmentId: 'dept_it',
    departmentName: 'Jabatan Teknologi Maklumat & Keselamatan Siber',
    unitId: 'unit_cyber_sec',
    unitName: 'Unit Keselamatan Maklumat & Audit Siber',
    clearanceLevel: 'P&C',
    avatarUrl: '/src/assets/images/avatar_admin_lead_1793580726556.jpg',
    expiryDate: '2030-12-31',
    status: 'active',
    password: 'AdminSuper123!',
  },
  {
    uid: 'user_admin_01',
    serviceNumber: '882104', // 6 digit no perkhidmatan wajib
    displayName: 'Ir. Dr. Faridah Mansor',
    email: 'faridah.mansor@arkadms.gov.my',
    role: 'admin',
    departmentId: 'dept_it',
    departmentName: 'Jabatan Teknologi Maklumat & Keselamatan Siber',
    unitId: 'unit_cyber_sec',
    unitName: 'Unit Keselamatan Maklumat & Audit Siber',
    clearanceLevel: 'P&C',
    avatarUrl: '/src/assets/images/avatar_admin_lead_1793580726556.jpg',
    expiryDate: '2028-12-31',
    status: 'active',
    password: 'Admin882104!',
  },
  {
    uid: 'user_editor_02',
    serviceNumber: '551203', // 6 digit no perkhidmatan wajib
    displayName: 'Ahmad Zulkifli bin Radzi',
    email: 'zulkifli.radzi@arkadms.gov.my',
    role: 'editor',
    departmentId: 'dept_it',
    departmentName: 'Jabatan Teknologi Maklumat & Keselamatan Siber',
    unitId: 'unit_app_dev',
    unitName: 'Unit Pembangunan Aplikasi & Arkib Digital',
    clearanceLevel: 'SULIT',
    avatarUrl: '/src/assets/images/avatar_editor_audit_1793580727309.jpg',
    expiryDate: '2027-10-15',
    status: 'active',
    password: 'User551203!',
  },
  {
    uid: 'user_viewer_03',
    serviceNumber: '339102', // 6 digit no perkhidmatan wajib
    displayName: 'Siti Nurhaliza binti Kamal',
    email: 'siti.kamal@arkadms.gov.my',
    role: 'viewer',
    departmentId: 'dept_finance',
    departmentName: 'Jabatan Kewangan & Perolehan Strategik',
    unitId: 'unit_budget',
    unitName: 'Unit Belanjawan & Pengurusan Aset',
    clearanceLevel: 'TERHAD',
    avatarUrl: '/src/assets/images/avatar_viewer_analyst_1793580727967.jpg',
    expiryDate: '2027-04-30',
    status: 'active',
    password: 'User339102!',
  },
];

export const INITIAL_GROUPS: UserGroup[] = [
  {
    id: 'grp_mpc_top',
    name: 'Jawatankuasa Perolehan Pengurusan (MPC)',
    code: 'MPC-TERTINGGI',
    description: 'Jawatankuasa penilai dan pelulus tender peringkat tertinggi organisasi (Akses Penuh).',
    permission: 'all',
    memberIds: ['user_super_admin_00', 'user_admin_01'],
    departmentId: 'dept_it',
    color: 'purple',
    createdAt: '2026-01-15T08:00:00Z',
    createdBy: 'Ir. Dr. Faridah Mansor',
  },
  {
    id: 'grp_finance_procurement',
    name: 'Pasukan Penilai Kewangan & Kontrak',
    code: 'KEW-TENDER',
    description: 'Kumpulan penilai integriti kewangan, bajet dan penggubalan klausa kontrak (Sunting Sahaja).',
    permission: 'edit_only',
    memberIds: ['user_super_admin_00', 'user_admin_01', 'user_viewer_03'],
    departmentId: 'dept_finance',
    color: 'emerald',
    createdAt: '2026-01-16T09:00:00Z',
    createdBy: 'Dato’ Seri Azman Hashim',
  },
  {
    id: 'grp_audit_compliance',
    name: 'Pasukan Audit & Pematuhan Integriti',
    code: 'AUDIT-INT',
    description: 'Kumpulan semakan pematuhan SOP, audit keselamatan dan integriti tadbir urus (Semak Sahaja).',
    permission: 'review_only',
    memberIds: ['user_editor_02', 'user_admin_01'],
    departmentId: 'dept_legal',
    color: 'blue',
    createdAt: '2026-01-20T10:00:00Z',
    createdBy: 'Ir. Dr. Faridah Mansor',
  },
  {
    id: 'grp_staff_general',
    name: 'Fail General / Akses Am',
    code: 'FAIL-GENERAL',
    description: 'Kumpulan capaian rujukan bagi pekeliling rasmi, SOP umum dan warta organisasi (Lihat Sahaja).',
    permission: 'view_only',
    memberIds: ['user_viewer_03', 'user_editor_02'],
    color: 'slate',
    createdAt: '2026-01-01T08:00:00Z',
    createdBy: 'Sistem Pengurusan ArkaDMS',
  },
];

export const INITIAL_FOLDERS: DmsFolder[] = [
  {
    id: 'fld_cyber_security',
    name: '01. Keselamatan Siber & Dasar IT',
    parentId: null,
    departmentId: 'dept_it',
    unitId: 'unit_cyber_sec',
    clearanceLevel: 'SULIT',
    allowedGroups: ['grp_mpc_top', 'grp_audit_compliance'],
    allowedUsers: ['user_admin_01', 'user_editor_02'],
    color: 'blue',
    description: 'Dokumen dasar ISO 27001, pelan mitigasi insiden siber, dan audit kriptografi.',
    createdAt: '2026-01-15T08:00:00Z',
    createdBy: 'Ir. Dr. Faridah Mansor',
  },
  {
    id: 'fld_tenders_procurement',
    name: '02. Kertas Cadangan & Tender 2026',
    parentId: null,
    departmentId: 'dept_finance',
    clearanceLevel: 'P&C',
    allowedGroups: ['grp_mpc_top', 'grp_finance_procurement'],
    allowedUsers: ['user_admin_01'],
    color: 'amber',
    description: 'Kertas perakuan tender, cadangan pembekalan berimpak tinggi, dan perolehan strategik.',
    createdAt: '2026-01-18T09:00:00Z',
    createdBy: 'Ir. Dr. Faridah Mansor',
  },
  {
    id: 'fld_sub_dal',
    name: 'Kertas DAL & Kelulusan Kuasa',
    parentId: 'fld_tenders_procurement',
    departmentId: 'dept_finance',
    clearanceLevel: 'P&C',
    allowedGroups: ['grp_mpc_top'],
    color: 'rose',
    description: 'Kertas perakuan kuasa perbelanjaan budi bicara dan siling had kewangan.',
    createdAt: '2026-01-20T10:00:00Z',
    createdBy: 'Ir. Dr. Faridah Mansor',
  },
  {
    id: 'fld_sop_guidelines',
    name: '03. Standard Operating Procedures (SOP)',
    parentId: null,
    departmentId: 'dept_general',
    clearanceLevel: 'BIASA',
    allowedGroups: ['grp_staff_general', 'grp_audit_compliance'],
    color: 'emerald',
    description: 'Koleksi tatacara operasi standard, arahan pentadbiran dan panduan kakitangan.',
    createdAt: '2026-01-10T08:00:00Z',
    createdBy: 'Bahagian Sumber Manusia & Tadbir Urus',
  },
  {
    id: 'fld_contracts_legal',
    name: '04. Kontrak & Perjanjian Perundangan',
    parentId: null,
    departmentId: 'dept_legal',
    clearanceLevel: 'TERHAD',
    allowedGroups: ['grp_finance_procurement', 'grp_audit_compliance'],
    color: 'indigo',
    description: 'Draf perjanjian vendor, surat setuju terima (SST) dan jaminan SLA.',
    createdAt: '2026-01-22T11:00:00Z',
    createdBy: 'Puan Sri Zainab binti Sulaiman',
  },
];

export const INITIAL_DOCUMENTS: DmsDocument[] = [
  {
    id: 'doc_mpc_perolehan_pnc',
    title: 'Paper MPC (P&C): Cadangan Pelantikan Kontraktor Khas Pertahanan Siber & Forensik Digital Agensi',
    category: 'Paper MPC',
    taskCategory: 'Kelulusan Pengurusan',
    tags: ['Paper MPC', 'P&C', 'SULIT', 'Pertahanan', 'Khas'],
    summary: 'Kertas kerja kelulusan Jawatankuasa Perolehan Pengurusan Tertinggi (MPC) terperingkat P&C bagi pelantikan kontraktor keselamatan kritikal.',
    documentDate: '2026-03-01',
    content: `DOKUMEN TERPERINGKAT P&C (PRIVATE & CONFIDENTIAL)
HANYA UNTUK EDARAN AHLI JAWATANKUASA PEROLEHAN PENGURUSAN (MPC) & PENGARAH

1.0 TUJUAN
Kertas ini bertujuan mendapatkan perakuan MPC bagi pelantikan terus kontraktor pertahanan siber strategik.

2.0 PENILAIAN KESELAMATAN & INTEGRITI
Syarikat yang dicalonkan telah melepasi tapisan keselamatan khas agensi risikan pusat dan memenuhi piawaian Akta Rahsia Rasmi.

3.0 SYOR
Dipohon agar Jawatankuasa MPC meluluskan syor pelantikan bagi fasa pembangunan kubu pertahanan siber selama 24 bulan.`,
    isConfidential: true,
    clearanceRequired: 'P&C',
    allowedUsers: ['user_admin_01'],
    allowedGroups: ['grp_mpc_top'],
    folderId: 'fld_sub_dal',
    offlineAvailable: true,
    departmentId: 'dept_it',
    unitId: 'unit_cyber_sec',
    isEncrypted: false,
    currentVersion: '1.0',
    revisions: [
      {
        id: 'rev_pnc_1',
        version: '1.0',
        changeSummary: 'Draf asal kertas pertimbangan P&C dikemukakan ke MPC.',
        authorId: 'user_admin_01',
        authorName: 'Ir. Dr. Faridah Mansor',
        timestamp: '2026-03-01T08:00:00Z',
        contentSnapshot: 'Draf asal kertas P&C...',
      },
    ],
    authorId: 'user_admin_01',
    authorName: 'Ir. Dr. Faridah Mansor',
    authorEmail: 'faridah.mansor@arkadms.gov.my',
    creatorServiceNumber: '882104',
    lastModifiedBy: 'Ir. Dr. Faridah Mansor',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
    paperStatus: 'Semakan Jawatankuasa MPC/Tender',
    workflowChronology: [
      {
        id: 'wf_pnc_1',
        stage: 'Penyediaan Draf P&C',
        handledBy: 'Ir. Dr. Faridah Mansor (No. 882104)',
        departmentName: 'Jabatan IT & Keselamatan Siber',
        date: '2026-03-01 08:00',
        status: 'selesai',
        notes: 'Penyediaan draf kertas terperingkat P&C dengan tandatangan keselamatan.',
      },
      {
        id: 'wf_pnc_2',
        stage: 'Semakan Jawatankuasa MPC',
        handledBy: 'Setiausaha Jawatankuasa MPC',
        departmentName: 'Pejabat Ketua Pegawai Eksekutif',
        date: '2026-03-02 10:00',
        status: 'sedang_diproses',
        notes: 'Sedang disemak oleh ahli MPC dalam bilik mesyuarat tertutup.',
      },
    ],
  },
  {
    id: 'doc_tender_pelayan_cloud',
    title: 'Paper Tender: Pembekalan & Pemasangan Infrastruktur Awan Hibrid Sektor Awam 2026/2027',
    category: 'Paper Tender',
    taskCategory: 'Tugasan Projek',
    tags: ['Paper Tender', 'Perolehan', 'Awan Hibrid', 'Kewangan', 'SULIT'],
    summary: 'Kertas tender cadangan pembekalan kluster pelayan awan hibrid berkapasiti 10 Petabyte dengan spesifikasi ketat pengekalan kedaulatan data tempatan.',
    documentDate: '2026-02-10', // Tarikh rasmi dokumen
    content: `1.0 TUJUAN KERTAS TENDER
Kertas tender ini dikemukakan kepada Jawatankuasa Perolehan Pengurusan (MPC) bagi memohon kelulusan spesifikasi tender pembekalan pelayan awan hibrid berdaya tahan tinggi.

2.0 ANGGARAN IMPLIKASI KEWANGAN
Nilai siling peruntukan projek di bawah Belanjawan CAPEX adalah berjumlah RM 8,500,000.00 merangkumi jaminan perkakasan selama 3 tahun.

3.0 KRITERIA PENILAIAN TEKNIKAL
3.1 Pusat data pembekal wajib bertaraf sekurang-kurangnya Tier IV dan beroperasi dalam sempadan geografi Malaysia.
3.2 Pematuhan mandatori enkripsi E2EE AES-256 dan ISO/IEC 27017.

4.0 SYOR
Dipohon agar Jawatankuasa Tender meluluskan iklan tender terbuka antarabangsa dengan tempoh pembidaan 21 hari bekerja.`,
    isConfidential: true,
    clearanceRequired: 'SULIT',
    allowedUsers: ['user_admin_01', 'user_editor_02'],
    allowedGroups: ['grp_mpc_top', 'grp_finance_procurement'],
    folderId: 'fld_tenders_procurement',
    offlineAvailable: true,
    departmentId: 'dept_it',
    unitId: 'unit_infra_cloud',
    isEncrypted: false,
    currentVersion: '1.2',
    revisions: [
      {
        id: 'rev_td_1',
        version: '1.0',
        changeSummary: 'Draf pertama kertas tender disediakan oleh Unit Infrastruktur.',
        authorId: 'user_editor_02',
        authorName: 'Ahmad Zulkifli bin Radzi',
        timestamp: '2026-02-10T09:00:00Z',
        contentSnapshot: 'Draf permulaan spesifikasi tender awan hibrid...',
      },
      {
        id: 'rev_td_2',
        version: '1.2',
        changeSummary: 'Penambahan perenggan pematuhan kedaulatan data dan semakan kewangan.',
        authorId: 'user_editor_02',
        authorName: 'Ahmad Zulkifli bin Radzi',
        timestamp: '2026-02-18T14:30:00Z',
        contentSnapshot: 'Spesifikasi disemak dengan klausa tier IV...',
      },
    ],
    authorId: 'user_editor_02',
    authorName: 'Ahmad Zulkifli bin Radzi',
    authorEmail: 'zulkifli.radzi@arkadms.gov.my',
    creatorServiceNumber: '551203',
    lastModifiedBy: 'Ir. Dr. Faridah Mansor',
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-02-25T16:20:00Z',

    // Workflow chronology & status
    paperStatus: 'Semakan Jawatankuasa MPC/Tender',
    workflowChronology: [
      {
        id: 'wf_td_1',
        stage: 'Disediakan',
        handledBy: 'Ahmad Zulkifli bin Radzi (No. 551203)',
        departmentName: 'Jabatan IT (Unit Infra)',
        date: '2026-02-10 09:30',
        status: 'selesai',
        notes: 'Draf spesifikasi teknikal siap disusun dan disahkan oleh Ketua Penolong Pengarah.',
      },
      {
        id: 'wf_td_2',
        stage: 'Dihantar ke Jabatan Kewangan untuk Pengesahan',
        handledBy: 'Siti Nurhaliza binti Kamal (No. 339102)',
        departmentName: 'Jabatan Kewangan (Unit Belanjawan)',
        date: '2026-02-16 11:15',
        status: 'selesai',
        notes: 'Pengesahan siling peruntukan CAPEX RM 8.5M telah disahkan ada dalam bajet persekutuan.',
      },
      {
        id: 'wf_td_3',
        stage: 'Semakan Jawatankuasa Tender / MPC',
        handledBy: 'Ir. Dr. Faridah Mansor (No. 882104)',
        departmentName: 'Jawatankuasa Perolehan Pengurusan (MPC)',
        date: '2026-02-22 14:00',
        status: 'sedang_diproses',
        notes: 'Sedang dibentangkan dalam Mesyuarat Jawatankuasa Tender Bil. 2/2026 untuk kelulusan iklan tender.',
      },
      {
        id: 'wf_td_4',
        stage: 'Kelulusan Pengurusan & Iklan Tender',
        handledBy: 'Pegawai Pengawal / Lembaga Tender',
        departmentName: 'Pejabat Ketua Pegawai Eksekutif',
        date: 'Dijadualkan 05/03/2026',
        status: 'menunggu',
        notes: 'Menunggu perakuan rasmi keputusan mesyuarat tender.',
      },
    ],
  },
  {
    id: 'doc_dal_kelulusan_khas',
    title: 'Paper DAL: Perakuan Had Kuasa Budi Bicara Pelepasan Dana Sandaran Siber Darurat',
    category: 'Paper DAL',
    taskCategory: 'Kelulusan Pengurusan',
    tags: ['Paper DAL', 'Had Kuasa', 'Kewangan', 'Kecemasan', 'SULIT'],
    summary: 'Kertas kuasa budi bicara (DAL) untuk membenarkan Pengarah Keselamatan Maklumat meluluskan perolehan peralatan penangkis serangan siber darurat sehingga RM 500,000.',
    documentDate: '2026-01-28',
    content: `KERTAS DISCRETIONARY AUTHORITY LIMIT (DAL) BIL. 04/2026
RUJUKAN: DAL/SEC/2026/04

1.0 LATAR BELAKANG
Bagi menjamin tindak balas pantas terhadap insiden serangan ransomware kritikal, prosedur perolehan darurat memerlukan garis kuasa khas (emergency delegation).

2.0 CADANGAN HAD KUASA
Memberikan kuasa budi bicara kepada Pengarah JTMK untuk membuat pembelian perkhidmatan pemulihan sandaran forensik sehingga RM 500,000 tanpa perlu menunggu mesyuarat bulanan lembaga.

3.0 MEKANISME KAWALAN & IMBANGAN
Semua perbelanjaan wajib dilaporkan secara bertulis kepada Jawatankuasa Audit Forensik dalam tempoh 7 hari selepas pengaktifan.`,
    isConfidential: true,
    clearanceRequired: 'SULIT',
    allowedUsers: ['user_admin_01'],
    allowedGroups: ['grp_mpc_top', 'grp_finance_procurement'],
    folderId: 'fld_sub_dal',
    offlineAvailable: true,
    departmentId: 'dept_finance',
    unitId: 'unit_budget',
    isEncrypted: true,
    encryptionAlgo: 'AES-256-GCM',
    currentVersion: '2.0',
    revisions: [
      {
        id: 'rev_dal_1',
        version: '1.0',
        changeSummary: 'Draf kertas had kuasa dikemukakan ke Unit Belanjawan.',
        authorId: 'user_admin_01',
        authorName: 'Ir. Dr. Faridah Mansor',
        timestamp: '2026-01-28T10:00:00Z',
        contentSnapshot: 'Draf had kuasa budi bicara kecemasan siber...',
      },
      {
        id: 'rev_dal_2',
        version: '2.0',
        changeSummary: 'Penyelarasan had siling RM 500,000 dan klausa pelaporan 7 hari.',
        authorId: 'user_admin_01',
        authorName: 'Ir. Dr. Faridah Mansor',
        timestamp: '2026-02-05T15:00:00Z',
        contentSnapshot: 'Versi muktamad had kuasa diluluskan...',
      },
    ],
    authorId: 'user_admin_01',
    authorName: 'Ir. Dr. Faridah Mansor',
    authorEmail: 'faridah.mansor@arkadms.gov.my',
    creatorServiceNumber: '882104',
    lastModifiedBy: 'Ir. Dr. Faridah Mansor',
    createdAt: '2026-01-28T10:00:00Z',
    updatedAt: '2026-02-05T15:00:00Z',

    paperStatus: 'Diluluskan',
    workflowChronology: [
      {
        id: 'wf_dal_1',
        stage: 'Disediakan',
        handledBy: 'Ir. Dr. Faridah Mansor (No. 882104)',
        departmentName: 'Jabatan IT & Keselamatan Siber',
        date: '2026-01-28 10:00',
        status: 'selesai',
        notes: 'Penyediaan draf kertas had kuasa berasaskan analisis risiko siber terkini.',
      },
      {
        id: 'wf_dal_2',
        stage: 'Pengesahan Bahagian Kewangan & Tadbir Urus',
        handledBy: 'Dato’ Seri Azman Hashim',
        departmentName: 'Jabatan Kewangan & Perolehan',
        date: '2026-02-02 16:30',
        status: 'selesai',
        notes: 'Semakan integriti fiskal lulus dengan had siling ditetapkan maksimum RM 500,000.',
      },
      {
        id: 'wf_dal_3',
        stage: 'Kelulusan Lembaga Pengarah / MPC',
        handledBy: 'Pengerusi Lembaga Pengarah',
        departmentName: 'Lembaga Pengarah Induk',
        date: '2026-02-05 14:00',
        status: 'selesai',
        notes: 'Lembaga meluluskan kertas perakuan DAL Bil. 04/2026 sebulat suara.',
      },
      {
        id: 'wf_dal_4',
        stage: 'Selesai & Diarkibkan',
        handledBy: 'Pegawai Pendaftar Arkib Rasmi',
        departmentName: 'Unit Arkib Digital',
        date: '2026-02-06 09:00',
        status: 'selesai',
        notes: 'Dokumen diarkibkan dalam peti terenkripsi E2EE dengan salinan rujukan audit.',
      },
    ],
  },
  {
    id: 'doc_sop_enkripsi_awan',
    title: 'SOP: Tatacara Operasi Piawai Pengendalian Kunci Kriptografi & Storan Selamat 2026',
    category: 'SOP',
    taskCategory: 'Operasi Harian',
    tags: ['SOP', 'Kriptografi', 'AES-256', 'Operasi', 'Keselamatan'],
    summary: 'Prosedur operasi standard (SOP) harian bagi pegawai pengendali kunci kriptografi awan, pengesahan sijil SSL/TLS dan pengurusan kata laluan.',
    documentDate: '2026-01-15',
    content: `TATACARA OPERASI PIAWAI (SOP) JABATAN TEKNOLOGI MAKLUMAT
KOD DOKUMEN: SOP-JTMK-SEC-012

1.0 KAWALAN KUNCI ENKRIPSI
1.1 Penjanaan kunci induk AES-256 wajib dilaksanakan dalam persekitaran HSM (Hardware Security Module) terpencil.
1.2 Putaran kunci (key rotation) wajib dibuat setiap 90 hari kalendar.

2.0 PENYIMPANAN SALINAN SANDARAN
Salinan sandaran kunci disulitkan dengan dua lapis penyulitan dan disimpan di dua lokasi fizikal berasingan.`,
    isConfidential: false,
    clearanceRequired: 'BIASA',
    allowedGroups: ['grp_staff_general', 'grp_audit_compliance'],
    folderId: 'fld_sop_guidelines',
    offlineAvailable: true,
    departmentId: 'dept_it',
    unitId: 'unit_cyber_sec',
    isEncrypted: false,
    currentVersion: '1.0',
    revisions: [
      {
        id: 'rev_sop_1',
        version: '1.0',
        changeSummary: 'Penerbitan rasmi SOP keselamatan kunci kriptografi.',
        authorId: 'user_editor_02',
        authorName: 'Ahmad Zulkifli bin Radzi',
        timestamp: '2026-01-15T09:00:00Z',
        contentSnapshot: 'Teks asal SOP tatacara kriptografi...',
      },
    ],
    authorId: 'user_editor_02',
    authorName: 'Ahmad Zulkifli bin Radzi',
    authorEmail: 'zulkifli.radzi@arkadms.gov.my',
    creatorServiceNumber: '551203',
    lastModifiedBy: 'Ahmad Zulkifli bin Radzi',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',

    paperStatus: 'Selesai & Diarkibkan',
    workflowChronology: [
      {
        id: 'wf_sop_1',
        stage: 'Disediakan',
        handledBy: 'Ahmad Zulkifli bin Radzi (No. 551203)',
        departmentName: 'Unit Keselamatan Maklumat',
        date: '2026-01-10 10:00',
        status: 'selesai',
        notes: 'Draf SOP dirangka mengikut garis panduan ISO 27001.',
      },
      {
        id: 'wf_sop_2',
        stage: 'Semakan Teknikal & Pengesahan Ketua Jabatan',
        handledBy: 'Ir. Dr. Faridah Mansor (No. 882104)',
        departmentName: 'Jabatan IT & Keselamatan Siber',
        date: '2026-01-14 15:30',
        status: 'selesai',
        notes: 'SOP diluluskan untuk pemakaian rasmi seluruh warga jabatan.',
      },
      {
        id: 'wf_sop_3',
        stage: 'Selesai & Diarkibkan',
        handledBy: 'Ahmad Zulkifli bin Radzi',
        departmentName: 'Arkib Digital',
        date: '2026-01-15 09:00',
        status: 'selesai',
        notes: 'Diedarkan kepada semua unit operasi dan dimuat naik ke portal rasmi.',
      },
    ],
  },
  {
    id: 'doc_invois_pelayan_q1',
    title: 'Invois: Tuntutan Bayaran Langganan Pelayan Awan & Bandwidth Suku Tahun 1/2026',
    category: 'Invois',
    taskCategory: 'Operasi Harian',
    tags: ['Invois', 'Tuntutan Bayaran', 'Kewangan', 'Vendor', 'Awan'],
    summary: 'Invois tuntutan bayaran rasmi daripada pembekal infrastruktur awan bagi tempoh Januari hingga Mac 2026 berjumlah RM 345,600.00.',
    documentDate: '2026-02-28',
    content: `INVOIS RASMI PEMBEKAL: GERBANG AWAN TEKNOLOGI SDN BHD
NO. INVOIS: INV-GAT-2026-0881
TARIKH INVOIS: 28 Februari 2026

PERIHAL PERKHIDMATAN:
1. Pengehosan Kluster Pelayan Storan Disulitkan (Jan - Mac 2026): RM 240,000.00
2. Bandwidth Rangkaian Terus Dedikasi 10Gbps: RM 80,000.00
3. Sokongan Teknikal Mampan 24/7 Level 3: RM 25,600.00

JUMLAH BESAR KESELURUHAN: RM 345,600.00
STATUS KELULUSAN: Menunggu Pengesahan Sijil Penerimaan Kerja (PAC).`,
    isConfidential: false,
    clearanceRequired: 'TERHAD',
    departmentId: 'dept_finance',
    unitId: 'unit_forensic_audit',
    isEncrypted: false,
    currentVersion: '1.0',
    revisions: [
      {
        id: 'rev_inv_1',
        version: '1.0',
        changeSummary: 'Pendaftaran invois vendor ke dalam modul kewangan.',
        authorId: 'user_viewer_03',
        authorName: 'Siti Nurhaliza binti Kamal',
        timestamp: '2026-02-28T10:00:00Z',
        contentSnapshot: 'Kandungan invois tuntutan bayaran Q1...',
      },
    ],
    authorId: 'user_viewer_03',
    authorName: 'Siti Nurhaliza binti Kamal',
    authorEmail: 'siti.kamal@arkadms.gov.my',
    creatorServiceNumber: '339102',
    lastModifiedBy: 'Siti Nurhaliza binti Kamal',
    createdAt: '2026-02-28T10:00:00Z',
    updatedAt: '2026-02-28T10:00:00Z',

    paperStatus: 'Pengesahan Kewangan',
    workflowChronology: [
      {
        id: 'wf_inv_1',
        stage: 'Disediakan / Diterima',
        handledBy: 'Siti Nurhaliza binti Kamal (No. 339102)',
        departmentName: 'Jabatan Kewangan (Unit Belanjawan)',
        date: '2026-02-28 10:00',
        status: 'selesai',
        notes: 'Invois vendor diterima berserta perakuan pesanan kerajaan (LO).',
      },
      {
        id: 'wf_inv_2',
        stage: 'Pengesahan Kewangan & Semakan Audit',
        handledBy: 'Pegawai Audit Forensik',
        departmentName: 'Jabatan Kewangan (Unit Audit)',
        date: '2026-03-01 11:30',
        status: 'sedang_diproses',
        notes: 'Sedang membuat semakan silang laporan SLA ketersediaan pelayan vendor.',
      },
      {
        id: 'wf_inv_3',
        stage: 'Pelepasan Bayaran / Kelulusan',
        handledBy: 'Akauntan Kanan',
        departmentName: 'Bahagian Pembayaran',
        date: 'Menunggu',
        status: 'menunggu',
        notes: 'Pengeluaran baucar bayaran elektronik selepas semakan PAC selesai.',
      },
    ],
  },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log_01',
    userId: 'user_admin_01',
    userName: 'Ir. Dr. Faridah Mansor',
    userRole: 'admin',
    action: 'LOG_MASUK_NO_PERKHIDMATAN',
    details: 'Log masuk berjaya menggunakan No. Perkhidmatan 882104.',
    isConfidential: false,
    timestamp: '2026-02-28T08:15:00Z',
  },
  {
    id: 'log_02',
    userId: 'user_editor_02',
    userName: 'Ahmad Zulkifli bin Radzi',
    userRole: 'editor',
    action: 'CIPTA_DOKUMEN',
    documentId: 'doc_tender_pelayan_cloud',
    documentTitle: 'Paper Tender: Pembekalan & Pemasangan Infrastruktur Awan Hibrid',
    details: 'Mendaftar Paper Tender baharu berkategori "Paper Tender" (Klasifikasi: SULIT).',
    isConfidential: true,
    timestamp: '2026-02-10T09:00:00Z',
  },
  {
    id: 'log_03',
    userId: 'user_editor_02',
    userName: 'Ahmad Zulkifli bin Radzi',
    userRole: 'editor',
    action: 'KEMASKINI_STATUS_PAPER',
    documentId: 'doc_tender_pelayan_cloud',
    documentTitle: 'Paper Tender: Pembekalan & Pemasangan Infrastruktur Awan Hibrid',
    details: 'Status paper dikemaskini dari "Pengesahan Kewangan" kepada "Semakan Jawatankuasa MPC/Tender".',
    isConfidential: true,
    timestamp: '2026-02-22T14:00:00Z',
  },
  {
    id: 'log_04',
    userId: 'user_admin_01',
    userName: 'Ir. Dr. Faridah Mansor',
    userRole: 'admin',
    action: 'CIPTA_PENGGUNA',
    details: 'Mendaftarkan pengguna baharu: No. Perkhidmatan 339102 (Siti Nurhaliza binti Kamal, Unit Belanjawan, Luput: 2027-04-30).',
    isConfidential: false,
    timestamp: '2026-01-20T10:00:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: EmailNotification[] = [
  {
    id: 'notif_01',
    recipientEmail: 'faridah.mansor@arkadms.gov.my',
    recipientName: 'Ir. Dr. Faridah Mansor',
    subject: '[PERAKUAN KERTAS TENDER] Paper Tender Awan Hibrid Sedia untuk Semakan MPC',
    body: 'Dimaklumkan bahawa Paper Tender "Pembekalan & Pemasangan Infrastruktur Awan Hibrid Sektor Awam 2026/2027" telah selesai pengesahan belanjawan oleh Jabatan Kewangan dan kini sedia untuk semakan Jawatankuasa MPC Bil. 2/2026.',
    documentId: 'doc_tender_pelayan_cloud',
    status: 'sent',
    timestamp: '2026-02-22T14:05:00Z',
    triggeredBy: 'Ahmad Zulkifli bin Radzi (No. 551203)',
    priority: 'high',
  },
];
