import React, { useState, useEffect } from 'react';
import {
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Company, AdminUser } from '../types/davich';
import { authenticateAdmin } from '../lib/storage';

interface CompanyAdminLoginModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AdminUser, company: Company) => void;
}

export const CompanyAdminLoginModal: React.FC<CompanyAdminLoginModalProps> = ({
  company,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset password and errors when opening
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg(null);
      setShowPassword(false);
    }
  }, [company, isOpen]);

  if (!isOpen || !company) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = authenticateAdmin(username, password);
    if (!result.success || !result.user) {
      setErrorMsg(result.message);
      return;
    }

    onSuccess(result.user, company);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center p-2 shrink-0 shadow-2xs">
            <img
              src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
              alt="다비치안경 로고"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-[11px] font-bold text-blue-700 tracking-wider uppercase">
              DAVICH AI FIT 16
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
              {company.name} 관리자 로그인
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              소속 직원 AI 진단 현황 및 업무 자동화 관리
            </p>
          </div>
        </div>

        {/* Informational Banner without exposing credentials */}
        <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5 shadow-2xs">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-bold text-blue-900 text-sm">
              [{company.name}] 관리자 권한 확인
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
              해당 기업 관리자 전용 대시보드에 접근하기 위해 아이디와 비밀번호를 입력해 주세요.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              관리자 아이디 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder={`${company.name} 관리자 ID 입력`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium font-mono"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              비밀번호 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium font-mono"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{company.name} 관리자 로그인</span>
          </button>
        </form>
      </div>
    </div>
  );
};
