/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CustomCategory, DmsDocument, UserProfile } from '../types/dms';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Tag,
  Search,
} from 'lucide-react';

interface CategoryManagerModuleProps {
  categories: CustomCategory[];
  documents: DmsDocument[];
  currentUser: UserProfile | null;
  onCreateCategory: (cat: Omit<CustomCategory, 'id' | 'createdAt'>) => void;
  onUpdateCategory: (id: string, updates: Partial<CustomCategory>) => void;
  onDeleteCategory: (id: string, name: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CategoryManagerModule: React.FC<CategoryManagerModuleProps> = ({
  categories,
  documents,
  currentUser,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCode('');
    setName('');
    setDescription('');
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: CustomCategory) => {
    setEditingCategory(cat);
    setCode(cat.code);
    setName(cat.name);
    setDescription(cat.description);
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setErrorMessage('Sila isi kod dan nama kategori.');
      return;
    }

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, {
        code: code.trim(),
        name: name.trim(),
        description: description.trim(),
      });
      onShowToast('Kategori Dikemaskini', `Kategori [${code.trim()}] telah disimpan.`, 'success');
    } else {
      onCreateCategory({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || 'Kategori dokumen tambahan.',
      });
      onShowToast('Kategori Baharu Dicipta', `Kategori [${code.trim()}] sedia digunakan.`, 'success');
    }

    setShowModal(false);
  };

  const handleDelete = (cat: CustomCategory) => {
    const docsCount = documents.filter((d) => d.category === cat.code).length;
    if (docsCount > 0) {
      alert(`Amaran: Kategori "${cat.name}" sedang digunakan oleh ${docsCount} fail dokumen aktif.`);
      return;
    }

    if (confirm(`Adakah anda pasti mahu memadam kategori "${cat.name}"?`)) {
      onDeleteCategory(cat.id, cat.name);
      onShowToast('Kategori Dipadam', `Kategori [${cat.code}] telah dikeluarkan.`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-600" />
            <span>Modul Pengurusan Kategori Dokumen & Paper</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kategori piawai dan tersuai organisasi seperti SOP, Paper DAL, Paper Tender, Paper Kontrak, Paper MPC, Invois, SKK dan lain-lain.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cipta Kategori Baharu</span>
          </button>
        )}
      </div>

      {/* Search and Summary */}
      <div className="flex items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kategori mengikut kod (e.g. DAL, Tender) atau nama..."
            className="w-full pl-10 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
        <span className="text-slate-500">
          Jumlah: <strong className="text-slate-800 dark:text-slate-200">{filteredCategories.length}</strong> Kategori
        </span>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const docsCount = documents.filter((d) => d.category === cat.code).length;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                    {cat.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {docsCount} Fail Menggunakan
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {cat.name}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Didaftarkan: {new Date(cat.createdAt).toLocaleDateString('ms-MY')}</span>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1 hover:text-slate-900 dark:hover:text-white rounded"
                      title="Sunting Kategori"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!cat.isSystem && (
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Padam Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Category */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingCategory ? 'Sunting Kategori Dokumen' : 'Daftar Kategori Boleh Disesuaikan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kod Singkatan Kategori *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Contoh: Paper DAL, Paper Tender, SKK, Invois"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Penuh Kategori *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Paper Discretionary Authority Limit (DAL)"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan & Skop Penggunaan
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penerangan jenis fail yang diarkibkan di bawah kategori ini..."
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-semibold"
                >
                  {editingCategory ? 'Simpan Perubahan' : 'Cipta Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
