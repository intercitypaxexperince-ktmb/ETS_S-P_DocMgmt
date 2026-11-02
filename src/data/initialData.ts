/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Department, DmsDocument, ActivityLog, UserProfile, EmailNotification } from '../types/dms';

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
];

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'user_admin_01',
    displayName: 'Ir. Dr. Faridah Mansor',
    email: 'faridah.mansor@arkadms.gov.my',
    role: 'admin',
    departmentId: 'dept_it',
    departmentName: 'Jabatan Teknologi Maklumat & Keselamatan Siber',
    unitId: 'unit_cyber_sec',
    unitName: 'Unit Keselamatan Maklumat & Audit Siber',
    clearanceLevel: 'RAHSIA_BESAR',
    avatarUrl: '/src/assets/images/avatar_admin_lead_1793580726556.jpg',
  },
  {
    uid: 'user_editor_02',
    displayName: 'Ahmad Zulkifli bin Radzi',
    email: 'zulkifli.radzi@arkadms.gov.my',
    role: 'editor',
    departmentId: 'dept_it',
    departmentName: 'Jabatan Teknologi Maklumat & Keselamatan Siber',
    unitId: 'unit_app_dev',
    unitName: 'Unit Pembangunan Aplikasi & Arkib Digital',
    clearanceLevel: 'SULIT',
    avatarUrl: '/src/assets/images/avatar_editor_audit_1793580727309.jpg',
  },
  {
    uid: 'user_viewer_03',
    displayName: 'Siti Nurhaliza binti Kamal',
    email: 'siti.kamal@arkadms.gov.my',
    role: 'viewer',
    departmentId: 'dept_finance',
    departmentName: 'Jabatan Kewangan & Perolehan Strategik',
    unitId: 'unit_budget',
    unitName: 'Unit Belanjawan & Pengurusan Aset',
    clearanceLevel: 'TERHAD',
    avatarUrl: '/src/assets/images/avatar_viewer_analyst_1793580727967.jpg',
  },
];

export const INITIAL_DOCUMENTS: DmsDocument[] = [
  {
    id: 'doc_gp_keselamatan_2026',
    title: 'Garis Panduan Keselamatan Maklumat & Kawalan Akses Awan Sektor Awam 2026',
    category: 'Dasar & Polisi',
    taskCategory: 'Audit & Pematuhan',
    tags: ['Dasar', 'Keselamatan Awan', 'ISO27001', 'Pematuhan', 'Kawalan Akses'],
    summary: 'Dokumen dasar induk menetapkan piawaian wajib bagi pengurusan akses pengguna, pengesahan dua faktor (MFA), enkripsi data semasa rehat dan penyegerakan luar talian.',
    content: `1.0 TUJUAN & SKOP
Garis panduan ini dirangka khusus untuk menetapkan tadbir urus keselamatan arkib digital di seluruh cawangan dan jabatan organisasi. Pematuhan dasar ini adalah mandatori di bawah Arahan Keselamatan Kerajaan.

2.0 PRINSIP KAWALAN CAPAIAN (RBAC)
2.1 Setiap pengguna diberikan peranan eksplisit: Pentadbir Sistem (Admin), Penyunting Dokumen Berkuasa (Editor), atau Pemerhati Awam (Viewer).
2.2 Tiada hak capaian boleh dipindahkan kepada pihak ketiga tanpa kelulusan bertulis Pegawai Keselamatan Jabatan.
2.3 Akses kepada dokumen berkategori "Sulit" memerlukan tapisan keselamatan minimum Tahap 2 (SULIT) atau Tahap 3 (RAHSIA BESAR).

3.0 ENKRIPSI HUJUNG-KE-HUJUNG (E2EE)
3.1 Semua dokumen sensitif wajib dienkripsi pada peringkat klien sebelum dimuat naik ke pelayan pangkalan data menggunakan algoritma AES-256-GCM.
3.2 Kunci penyahsulitan tidak disimpan dalam bentuk teks nyata dan hanya dipegang oleh pemegang taruh sah.

4.0 MOD LUAR TALIAN & PENYEGERAKAN AUTOMATIK
4.1 Kakitangan di lapangan dibenarkan menyunting fail dalam storan tempatan disulitkan semasa ketiadaan internet.
4.2 Sistem akan mengesan pemulihan sambungan dan melaksanakan penyegerakan automatik bersiri tanpa kehilangan data versi sebelumnya.`,
    isConfidential: false,
    clearanceRequired: 'BIASA',
    departmentId: 'dept_it',
    unitId: 'unit_cyber_sec',
    isEncrypted: false,
    currentVersion: '2.1',
    revisions: [
      {
        id: 'rev_gp_1',
        version: '1.0',
        changeSummary: 'Draf permulaan dasar keselamatan dokumen digital.',
        authorId: 'user_admin_01',
        authorName: 'Ir. Dr. Faridah Mansor',
        timestamp: '2026-01-05T09:00:00Z',
        contentSnapshot: 'Draf permulaan garis panduan keselamatan maklumat...',
      },
      {
        id: 'rev_gp_2',
        version: '2.0',
        changeSummary: 'Penambahan perenggan mandatori penyegerakan luar talian dan enkripsi AES-GCM.',
        authorId: 'user_editor_02',
        authorName: 'Ahmad Zulkifli bin Radzi',
        timestamp: '2026-02-14T14:30:00Z',
        contentSnapshot: 'Garis panduan dikemaskini mengikut spesifikasi keselamatan awan 2026...',
      },
      {
        id: 'rev_gp_3',
        version: '2.1',
        changeSummary: 'Penyelarasan definisi peranan pengguna dan kawalan hierarki jabatan.',
        authorId: 'user_admin_01',
        authorName: 'Ir. Dr. Faridah Mansor',
        timestamp: '2026-03-01T10:15:00Z',
        contentSnapshot: 'Pindaan akhir disahkan oleh jawatankuasa teknikal...',
      },
    ],
    authorId: 'user_admin_01',
    authorName: 'Ir. Dr. Faridah Mansor',
    authorEmail: 'faridah.mansor@arkadms.gov.my',
    lastModifiedBy: 'Ir. Dr. Faridah Mansor',
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-03-01T10:15:00Z',
  },
  {
    id: 'doc_kontrak_pelayan_sulit',
    title: 'Perjanjian Perolehan & Penyelenggaraan Pelayan Pusat Data Kebangsaan (Fasa III)',
    category: 'Kontrak & Perjanjian',
    taskCategory: 'Kelulusan Pengurusan',
    tags: ['Kontrak', 'SULIT', 'Pusat Data', 'Perolehan', 'SLA', 'Kewangan'],
    summary: 'Perjanjian kontrak sulit membabitkan pembekalan kluster pelayan storan selamat bernilai RM 14.8 juta dengan klausa penalti ketersediaan 99.999%.',
    content: `DOKUMEN INI DIKLASIFIKASIKAN SEBAGAI "SULIT" DI BAWAH AKTA RAHSIA RASMI.

KLAUSA 1: PIHAK-PIHAK TERLIBAT
Perjanjian ini dimeterai antara Kerajaan dan Konsortium Gerbang Awan Sdn Bhd bagi tempoh operasi 36 bulan bermula 1 April 2026 sehingga 31 Mac 2029.

KLAUSA 2: SKOP PERKHIDMATAN & SLA
2.1 Pembekal wajib menjamin ketersediaan pelayan sekurang-kurangnya 99.999% setahun.
2.2 Kegagalan sistem melebihi 15 minit sebulan akan dikenakan penalti sebanyak RM 50,000 bagi setiap jam seterusnya.

KLAUSA 3: NILAI KONTRAK & JADUAL PEMBAYARAN
Jumlah keseluruhan kontrak adalah bernilai RM 14,800,000.00 (Empat Belas Juta Lapan Ratus Ribu Ringgit Malaysia) dibayar mengikut 4 peringkat pencapaian audit perbatuan (milestones).

KLAUSA 4: KERAHSIAAN & PEMINDAHAN HARTA INTELEK
Semua kod sumber, pangkalan data sandaran, dan fail log akses kekal sebagai hak milik mutlak Kerajaan Malaysia.`,
    isConfidential: true,
    clearanceRequired: 'SULIT',
    allowedUsers: ['user_admin_01', 'user_editor_02'],
    departmentId: 'dept_legal',
    unitId: 'unit_contract',
    isEncrypted: true,
    encryptionAlgo: 'AES-256-GCM',
    currentVersion: '1.4',
    revisions: [
      {
        id: 'rev_kt_1',
        version: '1.0',
        changeSummary: 'Draf pertama klausa perundangan dan liabiliti.',
        authorId: 'user_admin_01',
        authorName: 'Ir. Dr. Faridah Mansor',
        timestamp: '2026-02-01T11:00:00Z',
        contentSnapshot: 'Draf perjanjian perolehan pusat data fasa 3...',
      },
      {
        id: 'rev_kt_2',
        version: '1.4',
        changeSummary: 'Penyelarasan kadar denda SLA dan pengesahan bajet kewangan.',
        authorId: 'user_editor_02',
        authorName: 'Ahmad Zulkifli bin Radzi',
        timestamp: '2026-02-28T16:20:00Z',
        contentSnapshot: 'Versi disemak dengan klausa muktamad penalti...',
      },
    ],
    authorId: 'user_admin_01',
    authorName: 'Ir. Dr. Faridah Mansor',
    authorEmail: 'faridah.mansor@arkadms.gov.my',
    lastModifiedBy: 'Ahmad Zulkifli bin Radzi',
    createdAt: '2026-02-01T11:00:00Z',
    updatedAt: '2026-02-28T16:20:00Z',
  },
  {
    id: 'doc_pelan_bencana_e2ee',
    title: 'Pelan Tindakan Pemulihan Bencana Siber & Kunci Sandaran Strategik Organisasi',
    category: 'Teknikal & IT',
    taskCategory: 'Tugasan Projek',
    tags: ['E2EE', 'Rahsia Besar', 'Pemulihan Bencana', 'Sandaran', 'Kriptografi'],
    summary: 'Pelan strategik terenkripsi tahap tertinggi mengandungi prosedur tindak balas ancaman siber kritikal, nod sandaran luar zon, dan protokol pengaktifan bilik perang.',
    content: `KLASIFIKASI KESELAMATAN: RAHSIA BESAR (TOP SECRET).
Akses terhad hanya kepada Pegawai Bertaraf 'RAHSIA_BESAR'. Dokumen ini dienkripsi dengan algoritma Web Crypto AES-256-GCM.

BAHAGIAN A: PROTOKOL TINDAK BALAS SERANGAN ZERO-DAY
1. Pemutusan serta-merta pintu gerbang sempadan (edge gateway) dalam tempoh 120 saat selepas pengesanan pencerobohan berniat jahat.
2. Pengalihan trafik rangkaian ke Pusat Sandaran Bencana (DRC) di zon geografi terasing.

BAHAGIAN B: KUNCI PEMULIHAN KRIPTOGRAFI
Sandaran kunci simetri disimpan secara teragih menggunakan skema Shamir's Secret Sharing (3 daripada 5 pemegang kunci diperlukan untuk memulihkan induk pangkalan data).

BAHAGIAN C: SENARAI PEGAWAI KECEMASAN
Semua arahan pertukaran nod wajib disahkan melalui saluran audio berkod dengan pengesahan suara biometrik.`,
    isConfidential: true,
    clearanceRequired: 'RAHSIA_BESAR',
    allowedUsers: ['user_admin_01'],
    departmentId: 'dept_it',
    unitId: 'unit_cyber_sec',
    isEncrypted: true,
    encryptionAlgo: 'AES-256-GCM',
    currentVersion: '1.0',
    revisions: [
      {
        id: 'rev_dr_1',
        version: '1.0',
        changeSummary: 'Penggubalan pelan tindakan pemulihan bencana siber berenkripsi penuh.',
        authorId: 'user_admin_01',
        authorName: 'Ir. Dr. Faridah Mansor',
        timestamp: '2026-02-18T10:00:00Z',
        contentSnapshot: 'Pelan pemulihan bencana siber induk...',
      },
    ],
    authorId: 'user_admin_01',
    authorName: 'Ir. Dr. Faridah Mansor',
    authorEmail: 'faridah.mansor@arkadms.gov.my',
    lastModifiedBy: 'Ir. Dr. Faridah Mansor',
    createdAt: '2026-02-18T10:00:00Z',
    updatedAt: '2026-02-18T10:00:00Z',
  },
  {
    id: 'doc_bajet_transformasi_q4',
    title: 'Laporan Penyata Penyelarasan Belanjawan Transformasi Digital Suku Tahun 4',
    category: 'Kewangan & Bajet',
    taskCategory: 'Operasi Harian',
    tags: ['Bajet', 'Kewangan', 'Laporan Suku Tahun', 'Perbelanjaan', 'Audit'],
    summary: 'Ringkasan perbelanjaan modal (CAPEX) dan operasi (OPEX) inisiatif pemodenan arkib digital dengan penjimatan kos perolehan sebanyak 18.4%.',
    content: `1.0 RINGKASAN EKSEKUTIF
Bagi suku tahun keempat tahun kewangan berakhir, perbelanjaan keseluruhan bagi program transformasi digital mencatatkan jumlah RM 3,420,000 daripada peruntukan siling RM 4,200,000.

2.0 ANALISIS PENJIMATAN STORAN
Penggunaan modul mampatan imej automatik ArkaDMS telah mengurangkan penggunaan kapasiti storan sebanyak 78.5 GB, menghasilkan penjimatan kos pelesenan awan tahunan sebanyak RM 42,000.

3.0 TABURAN AGIHAN JABATAN
- Jabatan IT & Keselamatan Siber: RM 1,850,000 (Infrastruktur & Enkripsi)
- Jabatan Kewangan: RM 620,000 (Sistem e-Invois & Audit)
- Jabatan Perundangan: RM 450,000 (Arkib Kontrak & Hak Cipta)
- Pengurusan Sumber Manusia: RM 500,000 (Latihan & Akreditasi)`,
    isConfidential: false,
    clearanceRequired: 'TERHAD',
    departmentId: 'dept_finance',
    unitId: 'unit_budget',
    isEncrypted: false,
    currentVersion: '3.0',
    revisions: [
      {
        id: 'rev_bj_1',
        version: '1.0',
        changeSummary: 'Draf anggaran belanjawan suku tahun 4.',
        authorId: 'user_viewer_03',
        authorName: 'Siti Nurhaliza binti Kamal',
        timestamp: '2026-01-20T14:00:00Z',
        contentSnapshot: 'Draf peruntukan suku tahun 4...',
      },
      {
        id: 'rev_bj_2',
        version: '2.0',
        changeSummary: 'Semakan semula angka kos storan awan.',
        authorId: 'user_editor_02',
        authorName: 'Ahmad Zulkifli bin Radzi',
        timestamp: '2026-02-10T11:45:00Z',
        contentSnapshot: 'Semakan angka penjimatan storan awan...',
      },
      {
        id: 'rev_bj_3',
        version: '3.0',
        changeSummary: 'Pengesahan penyata akhir belanjawan oleh Ketua Jabatan.',
        authorId: 'user_admin_01',
        authorName: 'Ir. Dr. Faridah Mansor',
        timestamp: '2026-02-25T15:30:00Z',
        contentSnapshot: 'Penyata akhir belanjawan muktamad...',
      },
    ],
    authorId: 'user_viewer_03',
    authorName: 'Siti Nurhaliza binti Kamal',
    authorEmail: 'siti.kamal@arkadms.gov.my',
    lastModifiedBy: 'Ir. Dr. Faridah Mansor',
    createdAt: '2026-01-20T14:00:00Z',
    updatedAt: '2026-02-25T15:30:00Z',
  },
  {
    id: 'doc_minit_mesyuarat_arkib',
    title: 'Minit Mesyuarat Khas Jawatankuasa Integriti & Pematuhan Akta Arkib Negara Bil. 2/2026',
    category: 'Minit Mesyuarat',
    taskCategory: 'Arkib Digital',
    tags: ['Minit Mesyuarat', 'Integriti', 'Arkib Negara', 'Tadbir Urus'],
    summary: 'Catatan keputusan mesyuarat bersetuju mempercepatkan pendigitalan dokumen bersejarah dan penguatkuasaan log jejak audit tanpa boleh dipadam.',
    content: `TARIKH: 18 Februari 2026
TEMPAT: Bilik Mesyuarat Perdana & Sidang Maya Selamat
PENGERUSI: Ir. Dr. Faridah Mansor

KEHADIRAN:
1. Ir. Dr. Faridah Mansor (Ketua Pengarah IT / Pengerusi)
2. Ahmad Zulkifli bin Radzi (Ketua Penolong Pengarah Aplikasi)
3. Siti Nurhaliza binti Kamal (Pegawai Belanjawan)
4. Wakil Jabatan Perundangan & Integriti

PERKARA BERBANGKIT:
1. Pematuhan Akta Arkib: Semua dokumen rasmi yang dimuat naik ke ArkaDMS mesti mempunyai metadata lengkap termasuk tagar, kategori tugasan, dan pengenalpastian pengarang.
2. Peneguhan Log Audit: Sebarang tindakan mencurigakan seperti percubaan akses fail sulit tanpa permit akan dihantar notifikasi automatik ke emel Pentadbir dalam tempoh serta-merta.
3. Mesyuarat bersetuju melaksanakan latihan tatacara keselamatan siber pada bulan Mei 2026.`,
    isConfidential: false,
    clearanceRequired: 'BIASA',
    departmentId: 'dept_it',
    unitId: 'unit_app_dev',
    isEncrypted: false,
    currentVersion: '1.2',
    revisions: [
      {
        id: 'rev_mm_1',
        version: '1.0',
        changeSummary: 'Catatan minit mesyuarat pertama diedarkan.',
        authorId: 'user_editor_02',
        authorName: 'Ahmad Zulkifli bin Radzi',
        timestamp: '2026-02-19T09:00:00Z',
        contentSnapshot: 'Draf minit mesyuarat jawatankuasa...',
      },
      {
        id: 'rev_mm_2',
        version: '1.2',
        changeSummary: 'Pengesahan kehadiran dan butiran keputusan audit.',
        authorId: 'user_editor_02',
        authorName: 'Ahmad Zulkifli bin Radzi',
        timestamp: '2026-02-22T11:20:00Z',
        contentSnapshot: 'Minit mesyuarat rasmi disahkan...',
      },
    ],
    authorId: 'user_editor_02',
    authorName: 'Ahmad Zulkifli bin Radzi',
    authorEmail: 'zulkifli.radzi@arkadms.gov.my',
    lastModifiedBy: 'Ahmad Zulkifli bin Radzi',
    createdAt: '2026-02-19T09:00:00Z',
    updatedAt: '2026-02-22T11:20:00Z',
  },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log_01',
    userId: 'user_admin_01',
    userName: 'Ir. Dr. Faridah Mansor',
    userRole: 'admin',
    action: 'CIPTA_DOKUMEN',
    documentId: 'doc_gp_keselamatan_2026',
    documentTitle: 'Garis Panduan Keselamatan Maklumat 2026',
    details: 'Mencipta dokumen dasar baharu bagi pematuhan awan dan kawalan akses.',
    isConfidential: false,
    timestamp: '2026-01-05T09:00:00Z',
  },
  {
    id: 'log_02',
    userId: 'user_editor_02',
    userName: 'Ahmad Zulkifli bin Radzi',
    userRole: 'editor',
    action: 'TANDAI_REVISI',
    documentId: 'doc_gp_keselamatan_2026',
    documentTitle: 'Garis Panduan Keselamatan Maklumat 2026',
    details: 'Menerbitkan semakan versi 2.0 dengan penambahan modul mod luar talian.',
    isConfidential: false,
    timestamp: '2026-02-14T14:30:00Z',
  },
  {
    id: 'log_03',
    userId: 'user_admin_01',
    userName: 'Ir. Dr. Faridah Mansor',
    userRole: 'admin',
    action: 'ENKRIPSI_DOKUMEN',
    documentId: 'doc_kontrak_pelayan_sulit',
    documentTitle: 'Perjanjian Perolehan & Penyelenggaraan Pelayan Pusat Data',
    details: 'Mengunci dokumen dengan enkripsi AES-256-GCM dan klasifikasi SULIT.',
    isConfidential: true,
    timestamp: '2026-02-01T11:05:00Z',
  },
  {
    id: 'log_04',
    userId: 'user_viewer_03',
    userName: 'Siti Nurhaliza binti Kamal',
    userRole: 'viewer',
    action: 'CUBAAN_AKSES_DITOLAK',
    documentId: 'doc_pelan_bencana_e2ee',
    documentTitle: 'Pelan Tindakan Pemulihan Bencana Siber',
    details: 'Capaian ditolak: Pengguna tidak mempunyai tapisan keselamatan RAHSIA_BESAR.',
    isConfidential: true,
    timestamp: '2026-02-26T16:12:00Z',
  },
  {
    id: 'log_05',
    userId: 'user_admin_01',
    userName: 'Ir. Dr. Faridah Mansor',
    userRole: 'admin',
    action: 'AKSES_SULIT',
    documentId: 'doc_pelan_bencana_e2ee',
    documentTitle: 'Pelan Tindakan Pemulihan Bencana Siber',
    details: 'Mengesahkan kelayakan keselamatan dan membuka dokumen sulit terenkripsi.',
    isConfidential: true,
    timestamp: '2026-02-27T08:45:00Z',
  },
  {
    id: 'log_06',
    userId: 'user_viewer_03',
    userName: 'Siti Nurhaliza binti Kamal',
    userRole: 'viewer',
    action: 'TAMBAH_KOMEN',
    documentId: 'doc_bajet_transformasi_q4',
    documentTitle: 'Laporan Penyata Penyelarasan Belanjawan Transformasi Digital',
    details: 'Menambah komen semakan belanjawan: "Penyelarasan kos lesen telah disahkan."',
    isConfidential: false,
    timestamp: '2026-02-28T09:20:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: EmailNotification[] = [
  {
    id: 'notif_01',
    recipientEmail: 'faridah.mansor@arkadms.gov.my',
    recipientName: 'Ir. Dr. Faridah Mansor',
    subject: '[PERHATIAN] Cubaan Akses Dokumen Sulit Dikesan',
    body: 'Sistem ArkaDMS mengesan percubaan akses ke fail sulit "Pelan Tindakan Pemulihan Bencana Siber" oleh pengguna bertaraf capaian Terhad pada 26/02/2026 16:12. Tindakan telah disekat secara automatik dan direkodkan dalam log audit.',
    documentId: 'doc_pelan_bencana_e2ee',
    status: 'sent',
    timestamp: '2026-02-26T16:12:05Z',
    triggeredBy: 'Sistem Keselamatan Automatik',
    priority: 'urgent',
  },
  {
    id: 'notif_02',
    recipientEmail: 'zulkifli.radzi@arkadms.gov.my',
    recipientName: 'Ahmad Zulkifli bin Radzi',
    subject: '[SEMAKAN DOKUMEN] Semakan Baharu Versi 2.1 Telah Diluluskan',
    body: 'Dimaklumkan bahawa dokumen "Garis Panduan Keselamatan Maklumat & Kawalan Akses Awan Sektor Awam 2026" telah diluluskan untuk penerbitan versi 2.1 oleh Pentadbir Sistem.',
    documentId: 'doc_gp_keselamatan_2026',
    status: 'sent',
    timestamp: '2026-03-01T10:16:00Z',
    triggeredBy: 'Ir. Dr. Faridah Mansor',
    priority: 'high',
  },
  {
    id: 'notif_03',
    recipientEmail: 'siti.kamal@arkadms.gov.my',
    recipientName: 'Siti Nurhaliza binti Kamal',
    subject: '[PENUGASAN] Dokumen Baru Diberikan Akses: Penyata Belanjawan Q4',
    body: 'Anda telah diberikan hak akses Viewer bagi dokumen "Laporan Penyata Penyelarasan Belanjawan Transformasi Digital Suku Tahun 4". Sila semak lampiran dan berikan maklum balas sekiranya perlu.',
    documentId: 'doc_bajet_transformasi_q4',
    status: 'sent',
    timestamp: '2026-01-20T14:05:00Z',
    triggeredBy: 'Ahmad Zulkifli bin Radzi',
    priority: 'normal',
  },
];
