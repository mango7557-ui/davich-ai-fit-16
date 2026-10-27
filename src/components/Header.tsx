import React, { useState } from 'react';
import {
  Building2,
  Link2,
  BarChart3,
  UserCheck,
  RefreshCw,
  Sparkles,
  Trash2,
  Check,
  Shield,
  LogIn,
  LogOut,
} from 'lucide-react';
import { loadSampleDataset, clearAllData, getStoredState } from '../lib/storage';
import { AdminUser } from '../types/davich';

interface HeaderProps {
  activeTab: 'LINKS' | 'SURVEY' | 'RESULT' | 'ADMIN';
  setActiveTab: (tab: 'LINKS' | 'SURVEY' | 'RESULT' | 'ADMIN') => void;
  hasSubmission: boolean;
  isDedicatedSurveyMode?: boolean;
  dedicatedCompanyName?: string;
  onExitDedicatedMode?: () => void;
  adminUser?: AdminUser | null;
  onAdminLogout?: () => void;
  onOpenAdminLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasSubmission,
  isDedicatedSurveyMode = false,
  dedicatedCompanyName,
  onExitDedicatedMode,
  adminUser,
  onAdminLogout,
  onOpenAdminLogin,
}) => {
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLoadSample = () => {
    loadSampleDataset();
    setShowDataMenu(false);
    notify('다비치안경 4개 기업 샘플 데이터가 성공적으로 탑재되었습니다.');
  };

  const handleReset = () => {
    if (window.confirm('모든 기업 및 설문 데이터를 초기화하여 완전한 빈 상태로 시작하시겠습니까?')) {
      clearAllData();
      setShowDataMenu(false);
      notify('모든 데이터가 초기화되었습니다.');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (adminUser) {
                  setActiveTab('ADMIN');
                } else {
                  setActiveTab('SURVEY');
                }
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <img
                src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                alt="다비치안경 로고"
                className="w-8 h-8 rounded-lg object-contain shadow-sm shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                  DAVICH AI FIT 16
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider -mt-0.5">
                  {adminUser
                    ? '다비치안경 AI 역량 & 성향 진단 · 관리자 모드'
                    : dedicatedCompanyName
                    ? `${dedicatedCompanyName} 전용 설문 진단`
                    : '다비치안경 임직원 AI 역량 & 성향 진단'}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          {adminUser ? (
            /* Logged-in Admin View: Show full management navigation */
            <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
              <button
                onClick={() => setActiveTab('ADMIN')}
                className={`px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'ADMIN'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>분석 대시보드</span>
              </button>

              <button
                onClick={() => setActiveTab('LINKS')}
                className={`px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'LINKS'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>기업별 링크 관리</span>
              </button>

              <button
                onClick={() => setActiveTab('SURVEY')}
                className={`px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'SURVEY'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>설문 진단 (직원용)</span>
              </button>

              <button
                onClick={() => setActiveTab('RESULT')}
                className={`px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'RESULT'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                } ${!hasSubmission ? 'opacity-80' : ''}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>진단 결과 리포트</span>
              </button>
            </nav>
          ) : (
            /* General Public / Employee View: Admin tabs are COMPLETELY HIDDEN */
            <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
              <button
                onClick={() => setActiveTab('SURVEY')}
                className={`px-4 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  activeTab === 'SURVEY'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{dedicatedCompanyName ? `${dedicatedCompanyName} 설문지` : 'AI FIT 16 진단 참여'}</span>
              </button>

              <button
                onClick={() => setActiveTab('RESULT')}
                className={`px-4 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  activeTab === 'RESULT'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                } ${!hasSubmission ? 'opacity-80' : ''}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>내 진단 결과</span>
              </button>
            </nav>
          )}

          {/* Zone 3: Actions */}
          <div className="relative shrink-0 flex items-center gap-2">
            {adminUser ? (
              <>
                {/* Admin User Badge & Logout */}
                <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-white font-bold">{adminUser.name}</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1.5 py-0.2 rounded font-semibold">
                      {adminUser.role === 'MASTER' ? '최고관리자' : '기업관리자'}
                    </span>
                  </div>
                  {onAdminLogout && (
                    <button
                      onClick={onAdminLogout}
                      className="text-[11px] text-slate-400 hover:text-rose-300 underline cursor-pointer ml-1"
                      title="관리자 로그아웃"
                    >
                      로그아웃
                    </button>
                  )}
                </div>

                {/* Data tools button (ONLY for authenticated Master Admin) */}
                {adminUser.role === 'MASTER' && (
                  <>
                    <button
                      onClick={() => setShowDataMenu(!showDataMenu)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      title="전사 데이터 관리 및 시연 도구 (마스터 전용)"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                      <span>데이터 도구</span>
                    </button>

                    {showDataMenu && (
                      <div className="absolute right-0 top-11 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 text-xs text-slate-200 z-50">
                        <div className="px-3 py-2 text-[11px] text-slate-400 border-b border-slate-800 font-medium">
                          전사 데이터 제어 (마스터 관리자 전용)
                        </div>
                        <div className="p-1 space-y-1">
                          <button
                            onClick={handleLoadSample}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
                          >
                            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                              <div className="font-semibold text-white">4개 기업 샘플 로드</div>
                              <div className="text-[10px] text-slate-400">본사·직영점·가맹점·관계사</div>
                            </div>
                          </button>
                          <button
                            onClick={handleReset}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                            <div>
                              <div className="font-semibold text-rose-300">전체 데이터 초기화</div>
                              <div className="text-[10px] text-slate-400">빈 상태에서 신규 등록 시작</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* Non-Admin Employee View: Discreet, unobtrusive admin access button */
              <button
                onClick={onOpenAdminLogin}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="관리자 전용 로그인 (관리자만 접근 가능)"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-medium">관리자</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav strip */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 text-xs">
          {adminUser ? (
            <>
              <button
                onClick={() => setActiveTab('ADMIN')}
                className={`py-1 px-2 rounded ${activeTab === 'ADMIN' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
              >
                분석대시보드
              </button>
              <button
                onClick={() => setActiveTab('LINKS')}
                className={`py-1 px-2 rounded ${activeTab === 'LINKS' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
              >
                링크관리
              </button>
              <button
                onClick={() => setActiveTab('SURVEY')}
                className={`py-1 px-2 rounded ${activeTab === 'SURVEY' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
              >
                설문참여
              </button>
              <button
                onClick={() => setActiveTab('RESULT')}
                className={`py-1 px-2 rounded ${activeTab === 'RESULT' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
              >
                내결과
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('SURVEY')}
                className={`py-1 px-3 rounded font-medium ${activeTab === 'SURVEY' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
              >
                {dedicatedCompanyName ? `${dedicatedCompanyName} 설문지` : '설문 진단'}
              </button>
              <button
                onClick={() => setActiveTab('RESULT')}
                className={`py-1 px-3 rounded font-medium ${activeTab === 'RESULT' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
              >
                내 진단 결과
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}
    </header>
  );
};
