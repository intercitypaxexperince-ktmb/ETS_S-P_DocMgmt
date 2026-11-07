/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleStorageConfig, UserProfile, canManageUsers } from '../types/dms';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  ArrowRight,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { testStorageConnection, saveStorageConfig } from '../lib/storage';

interface GoogleStorageSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageConfig: GoogleStorageConfig;
  currentUser: UserProfile | null;
  onConfigSaved: (config: GoogleStorageConfig) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const GoogleStorageSetupModal: React.FC<GoogleStorageSetupModalProps> = ({
  isOpen,
  onClose,
  storageConfig,
  currentUser,
  onConfigSaved,
  onShowToast,
}) => {
  const [bucketName, setBucketName] = useState(storageConfig.bucketName);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const isAuthorized = canManageUsers(currentUser);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testStorageConnection();
      setTestResult(res);
      if (res.success) {
        onShowToast('Penyambungan Disahkan', res.message, 'success');
      } else {
        onShowToast('Ujian Gagal', res.message, 'error');
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Ralat berlaku semasa menyemak sambungan Google Storage.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSetup = () => {
    if (!isAuthorized) {
      onShowToast('Akses Ditolak', 'Hanya Pentadbir & Super Admin dibenarkan mengkonfigurasi storan.', 'error');
      return;
    }
    setIsSaving(true);
    const updated: GoogleStorageConfig = {
      isConfigured: true,
      bucketName: bucketName.trim(),
      configuredAt: new Date().toISOString(),
      configuredBy: `${currentUser?.displayName || 'Pentadbir'} (#${currentUser?.serviceNumber || '990001'})`,
    };
    saveStorageConfig(updated);
    onConfigSaved(updated);
    setIsSaving(false);
    onShowToast('Google Storage Diaktifkan', 'Storan fail rasmi kini beroperasi pada Google Cloud Storage.', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfigurasi Google Cloud Storage
              </h3>
              <p className="text-xs text-slate-500">
                Akses persediaan kali pertama bagi arkib fail, PDF & imej dokumen
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg">
            ✕
          </button>
        </div>

        {!isAuthorized ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-5 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">Akses Dihadkan</h4>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                Hanya Pentadbir (Admin) dan Super Admin (intercity.pax.experince@gmail.com) dibenarkan membuat tetapan Google Storage kali pertama.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
            >
              Tutup
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Status card */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              storageConfig.isConfigured
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                {storageConfig.isConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <p className="font-bold text-xs">
                    Status: {storageConfig.isConfigured ? 'Telah Dikonfigurasi & Aktif' : 'Memerlukan Persediaan Kali Pertama'}
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {storageConfig.isConfigured && storageConfig.configuredBy
                      ? `Diaktifkan oleh ${storageConfig.configuredBy} pada ${new Date(storageConfig.configuredAt || '').toLocaleDateString('ms-MY')}`
                      : 'Fail yang dimuat naik akan disimpan terus ke Google Storage setelah diaktifkan.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Input Bucket Details */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Nama Baldi Google Storage (Storage Bucket) *
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Server className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bucketName}
                    onChange={(e) => setBucketName(e.target.value)}
                    placeholder="gen-lang-client-xxxx.firebasestorage.app"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menguji...' : 'Uji Sambungan'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Dipautkan ke projek Google Cloud AI Studio rasmi.
              </p>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg border text-xs ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
              }`}>
                {testResult.message}
              </div>
            )}

            {/* Capabilities Info */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Ciri-ciri Storan Google Cloud Diaktifkan:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                <li>Storan fail PDF dokumen, kertas tender, kontrak & invois berkualiti tinggi.</li>
                <li>Mampatan automatik bagi fail imej sebelum dimuat naik ke storan awan.</li>
                <li>Penyulitan end-to-end (E2EE) bagi dokumen berkod AES-256 sebelum penghantaran.</li>
                <li>Kawalan akses dokumen Sulit & P&C berasaskan tapisan keselamatan pegawai.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveSetup}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-sm"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{storageConfig.isConfigured ? 'Kemaskini & Sahkan Storan' : 'Aktifkan Google Storage Kali Pertama'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
