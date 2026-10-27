import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertTriangle,
  ArrowRight,
  Building2,
  Shield,
} from 'lucide-react';
import { AdminUser, Company } from '../types/davich';
import { authenticateAdmin } from '../lib/storage';

interface AdminLoginGateProps {
  onLoginSuccess: (user: AdminUser) => void;
  onCancelToSurvey?: () => void;
  targetCompany?: Company | null;
  isDedicatedLink?: boolean;
  companies?: Company[];
  onSelectCompany?: (company: Company) => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onLoginSuccess,
  onCancelToSurvey,
  targetCompany,
  isDedicatedLink = false,
  companies = [],
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clear password when targetCompany changes
  useEffect(() => {
    setPassword('');
    setErrorMsg(null);
  }, [targetCompany]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const isCompanyLinkMode = Boolean(isDedicatedLink && targetCompany);
    const result = authenticateAdmin(
      username,
      password,
      isCompanyLinkMode && targetCompany ? targetCompany.id : null,
      !isCompanyLinkMode // Require Master Admin ID when on the main root screen
    );
    if (!result.success || !result.user) {
      setErrorMsg(result.message);
      return;
    }

    onLoginSuccess(result.user);
  };

  const isCompanyLinkMode = Boolean(isDedicatedLink && targetCompany);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-10">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl space-y-6 relative animate-in fade-in zoom-in-95">
        {/* Header with Davich Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto p-2.5 shadow-2xs">
            <img
              src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
              alt="다비치안경 로고"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase">
              DAVICH AI FIT 16
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {isCompanyLinkMode && targetCompany
                ? `${targetCompany.name} 링크 관리자 로그인`
                : '본사 마스터 관리자 로그인'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isCompanyLinkMode && targetCompany
                ? '본사 관리자가 링크 생성 시 부여한 해당 기업 전용 관리자 ID/PW로 접속하세요'
                : '본사 마스터 아이디로 로그인하여 기업별 전용 링크를 생성하고 통합 관리하세요'}
            </p>
          </div>
        </div>

        {/* Corporate Scope Notice (Credentials NEVER exposed) */}
        {isCompanyLinkMode && targetCompany ? (
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5 shadow-2xs">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-bold text-blue-900 text-sm">
                [{targetCompany.name}] 전용 링크 독립 관리 섹션
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
                본 링크(/{targetCompany.code})는 독립된 기업 섹션입니다. 링크 생성 시 지정된 <strong>관리자 아이디와 비밀번호</strong>로 로그인하시면 이 링크의 설문 참여자만 전담 관리합니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm">
                본사 마스터 관리자 전용 게이트
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                • <strong>마스터 아이디</strong>로 로그인 후 기업별 설문 링크 생성 및 관리자(ID/PW) 부여가 가능합니다.<br />
                • <strong>설문 참여자 및 지점 관리자</strong>는 본사에서 발급된 기업별 전용 링크(<code>?company=...</code>)로 접속해 주세요.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isCompanyLinkMode ? '기업 링크 관리자 아이디' : '마스터 관리자 아이디'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder={isCompanyLinkMode && targetCompany ? `${targetCompany.name} 관리자 ID 입력` : '마스터 관리자 아이디 입력'}
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
            <span>
              {isCompanyLinkMode && targetCompany
                ? `${targetCompany.name} 관리자 로그인`
                : '마스터 관리자 로그인'}
            </span>
          </button>
        </form>

        {/* Footer / Switch back to Survey (ONLY on dedicated company links) */}
        {isCompanyLinkMode && onCancelToSurvey && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>직원 진단 참여를 원하시나요?</span>
            <button
              type="button"
              onClick={onCancelToSurvey}
              className="text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>← {targetCompany?.name} 설문으로 돌아가기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
