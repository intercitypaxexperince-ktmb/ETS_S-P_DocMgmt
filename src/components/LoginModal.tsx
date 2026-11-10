/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../types/dms';
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  onLoginSuccess,
  onShowToast,
}) => {
  const [serviceNumber, setServiceNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpCredentials, setShowHelpCredentials] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const sNum = serviceNumber.trim();
    if (!sNum) {
      setErrorMessage('Sila masukkan No. Perkhidmatan rasmi anda.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Sila masukkan kata laluan.');
      return;
    }

    // Find user by 6-digit service number or email
    const matchedUser = users.find(
      (u) =>
        (u.serviceNumber || '').trim().toLowerCase() === sNum.toLowerCase() ||
        (u.email || '').trim().toLowerCase() === sNum.toLowerCase()
    );

    if (!matchedUser) {
      setErrorMessage('No. Perkhidmatan tidak ditemui dalam sistem ETS Document Management.');
      return;
    }

    // Check account status: inactive
    if (matchedUser.status === 'inactive') {
      setErrorMessage(
        `Akaun No. #${matchedUser.serviceNumber} telah dinyahaktifkan (Inactive) untuk tujuan housekeeping. Sila hubungi Pentadbir Sistem.`
      );
      return;
    }

    // Check account expiry
    if (matchedUser.expiryDate) {
      const isExpired = new Date(matchedUser.expiryDate).getTime() < new Date().getTime();
      if (isExpired) {
        setErrorMessage(
          `Akaun No. #${matchedUser.serviceNumber} telah luput pada ${matchedUser.expiryDate}. Sila hubungi Pentadbir Sistem.`
        );
        return;
      }
    }

    // Expected password fallback
    const expectedPassword =
      matchedUser.password ||
      (matchedUser.role === 'admin'
        ? matchedUser.serviceNumber === '990001'
          ? 'AdminSuper123!'
          : 'Admin882104!'
        : matchedUser.role === 'editor'
        ? 'User551203!'
        : 'User339102!');

    if (password.trim() !== expectedPassword.trim()) {
      setErrorMessage('Kata laluan tidak sah. Capaian tidak dibenarkan.');
      return;
    }

    onLoginSuccess(matchedUser);
    onShowToast('Log Masuk Berjaya', `Selamat datang, ${matchedUser.displayName} (#${matchedUser.serviceNumber})!`, 'success');
    onClose();
  };

  const handleQuickFill = (sNum: string, pass: string) => {
    setServiceNumber(sNum);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="h-10 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src="/assets/aistudio/image_f706b2dd.png"
                alt="ETS Logo"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Log Masuk Sesi Rasmi
              </h3>
              <p className="text-xs text-slate-500">
                ETS Document Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Perkhidmatan (6 Aksara / Nombor) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={10}
                  value={serviceNumber}
                  onChange={(e) => {
                    setServiceNumber(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="cth. 882104 atau 990001"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kata Laluan Rasmi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Masukkan kata laluan..."
                  className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Log Masuk Sesi</span>
              </button>
            </div>
          </form>

          {/* Test Credentials Helper Accordion */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowHelpCredentials(!showHelpCredentials)}
              className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 py-1"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Panduan Kredensial Akaun Ujian Rasmi</span>
              </span>
              {showHelpCredentials ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showHelpCredentials && (
              <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5">
                <p className="text-slate-500 text-[10px]">Klik mana-mana akaun di bawah untuk mengisi borang secara automatik:</p>
                <div
                  onClick={() => handleQuickFill('990001', 'AdminSuper123!')}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between text-slate-700 dark:text-slate-200"
                >
                  <div>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">Super Admin</span> (intercity.pax.experince@gmail.com)
                  </div>
                  <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded">#990001</span>
                </div>
                <div
                  onClick={() => handleQuickFill('882104', 'Admin882104!')}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between text-slate-700 dark:text-slate-200"
                >
                  <div>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">Admin IT & Keselamatan</span> (Ir. Dr. Faridah Mansor)
                  </div>
                  <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded">#882104</span>
                </div>
                <div
                  onClick={() => handleQuickFill('551203', 'User551203!')}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between text-slate-700 dark:text-slate-200"
                >
                  <div>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Editor Dokumen</span> (Ahmad Zulkifli bin Radzi)
                  </div>
                  <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded">#551203</span>
                </div>
                <div
                  onClick={() => handleQuickFill('339102', 'User339102!')}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between text-slate-700 dark:text-slate-200"
                >
                  <div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Viewer Kewangan</span> (Siti Nurhaliza binti Kamal)
                  </div>
                  <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded">#339102</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
