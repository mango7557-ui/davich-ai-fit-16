import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CompanyLinkManager } from './components/CompanyLinkManager';
import { SurveyView } from './components/SurveyView';
import { PersonalResultView } from './components/PersonalResultView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginGate } from './components/AdminLoginGate';
import { CompanyAdminLoginModal } from './components/CompanyAdminLoginModal';
import {
  getStoredState,
  subscribeStorage,
  StorageState,
  getSavedAdminSession,
  saveAdminSession,
  getOrCreateCompanyByCode,
  getSavedRespondentSession,
  saveRespondentSession,
} from './lib/storage';
import { AssessmentSubmission, AdminUser, Company } from './types/davich';
import { X, Lock } from 'lucide-react';

export default function App() {
  const [store, setStore] = useState<StorageState>(getStoredState());
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => getSavedAdminSession());
  const [activeTab, setActiveTab] = useState<'LINKS' | 'SURVEY' | 'RESULT' | 'ADMIN'>(() => {
    // Authenticated admins land on ADMIN dashboard; employees land strictly on SURVEY
    const saved = getSavedAdminSession();
    return saved ? 'ADMIN' : 'SURVEY';
  });
  const [selectedCompanyCode, setSelectedCompanyCode] = useState<string | null>(null);
  const [selectedAdminCompanyId, setSelectedAdminCompanyId] = useState<string>('ALL');
  const [isDedicatedSurveyMode, setIsDedicatedSurveyMode] = useState<boolean>(false);
  const [headerLoginCompany, setHeaderLoginCompany] = useState<Company | null>(null);

  // Currently viewed submission in Result tab: initialized strictly from respondent session if verified
  const [latestSubmission, setLatestSubmission] = useState<AssessmentSubmission | null>(() => {
    const respSession = getSavedRespondentSession();
    if (respSession && respSession.submissionId) {
      const state = getStoredState();
      return state.submissions.find((s) => s.id === respSession.submissionId) || null;
    }
    return null;
  });
  const [modalSubmission, setModalSubmission] = useState<AssessmentSubmission | null>(null);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = subscribeStorage((newState) => {
      setStore({ ...newState });
    });
    return () => unsubscribe();
  }, []);

  // Parse URL query parameter (?company=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const companyParam = params.get('company');
      if (companyParam) {
        getOrCreateCompanyByCode(companyParam);
        setSelectedCompanyCode(companyParam);
        setIsDedicatedSurveyMode(true);
        setActiveTab('SURVEY');
      }
    }
  }, []);

  // Count submissions per company
  const submissionCounts: Record<string, number> = {};
  store.submissions.forEach((s) => {
    submissionCounts[s.companyId] = (submissionCounts[s.companyId] || 0) + 1;
  });

  // Find currently selected company
  const dedicatedCompany = store.companies.find(
    (c) => c.code.toLowerCase() === selectedCompanyCode?.toLowerCase()
  );

  const activeTargetCompany =
    store.companies.find((c) => c.code.toLowerCase() === selectedCompanyCode?.toLowerCase()) ||
    dedicatedCompany ||
    (store.companies.length > 0 ? store.companies[0] : null);

  // Action handlers
  const handleSelectCompanyForSurvey = (companyCode: string) => {
    setSelectedCompanyCode(companyCode);
    setIsDedicatedSurveyMode(true);
    setActiveTab('SURVEY');
  };

  const handleFilterAdminByCompany = (companyId: string) => {
    setSelectedAdminCompanyId(companyId);
    setActiveTab('ADMIN');
  };

  const handleSubmissionComplete = (submission: AssessmentSubmission) => {
    setLatestSubmission(submission);
    saveRespondentSession({
      submissionId: submission.id,
      companyId: submission.companyId,
      name: submission.respondent.name,
      employeeNumber: submission.respondent.employeeNumber,
    });
    setActiveTab('RESULT');
  };

  const handleExitDedicatedMode = () => {
    setIsDedicatedSurveyMode(false);
    if (adminUser) {
      setActiveTab('ADMIN');
    } else {
      setActiveTab('SURVEY');
    }
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    saveAdminSession(user);
    if (user.role === 'COMPANY_MANAGER' && user.companyId) {
      setSelectedAdminCompanyId(user.companyId);
    }
    setActiveTab('ADMIN');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasSubmission={latestSubmission !== null || store.submissions.length > 0}
        isDedicatedSurveyMode={isDedicatedSurveyMode}
        dedicatedCompanyName={dedicatedCompany?.name}
        onExitDedicatedMode={() => {
          if (adminUser) {
            setActiveTab('ADMIN');
          } else {
            setActiveTab('SURVEY');
          }
        }}
        adminUser={adminUser}
        onAdminLogout={() => {
          saveAdminSession(null);
          setAdminUser(null);
          setIsDedicatedSurveyMode(false);
          setActiveTab('SURVEY');
        }}
        onOpenAdminLogin={() => {
          setActiveTab('ADMIN');
        }}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'LINKS' && (
          !adminUser ? (
            <AdminLoginGate
              targetCompany={activeTargetCompany}
              companies={store.companies}
              onSelectCompany={(comp) => setSelectedCompanyCode(comp.code)}
              onLoginSuccess={handleLoginSuccess}
              onCancelToSurvey={() => {
                setIsDedicatedSurveyMode(true);
                setActiveTab('SURVEY');
              }}
            />
          ) : (
            <CompanyLinkManager
              companies={store.companies}
              submissionCounts={submissionCounts}
              onSelectCompanyForSurvey={handleSelectCompanyForSurvey}
              onFilterAdminByCompany={handleFilterAdminByCompany}
              onAdminLogin={handleLoginSuccess}
              adminUser={adminUser}
            />
          )
        )}

        {activeTab === 'SURVEY' && (
          <SurveyView
            companies={store.companies}
            selectedCompanyCode={selectedCompanyCode}
            onSubmissionComplete={handleSubmissionComplete}
            onNavigateToLinks={() => {
              setIsDedicatedSurveyMode(false);
              setActiveTab('LINKS');
            }}
            isDedicatedMode={isDedicatedSurveyMode}
          />
        )}

        {activeTab === 'RESULT' && (
          <PersonalResultView
            submission={latestSubmission}
            onRetake={() => setActiveTab('SURVEY')}
            onGoToAdmin={() => {
              if (adminUser) {
                setActiveTab('ADMIN');
              } else {
                setActiveTab('SURVEY');
              }
            }}
            onLookupSuccess={(sub) => {
              setLatestSubmission(sub);
            }}
            onClearSession={() => {
              saveRespondentSession(null);
              setLatestSubmission(null);
            }}
            companies={store.companies}
            initialCompanyId={dedicatedCompany?.id}
          />
        )}

        {activeTab === 'ADMIN' && (
          !adminUser ? (
            <AdminLoginGate
              targetCompany={activeTargetCompany}
              companies={store.companies}
              onSelectCompany={(comp) => setSelectedCompanyCode(comp.code)}
              onLoginSuccess={handleLoginSuccess}
              onCancelToSurvey={() => {
                setIsDedicatedSurveyMode(true);
                setActiveTab('SURVEY');
              }}
            />
          ) : (
            <AdminDashboard
              companies={store.companies}
              submissions={store.submissions}
              assignments={store.assignments}
              automationTasks={store.automationTasks}
              selectedCompanyId={selectedAdminCompanyId}
              onSelectCompanyId={setSelectedAdminCompanyId}
              onViewPersonalReport={(sub) => setModalSubmission(sub)}
              onNavigateToLinks={() => setActiveTab('LINKS')}
              onNavigateToSurvey={handleSelectCompanyForSurvey}
              adminUser={adminUser}
            />
          )
        )}
      </main>

      {/* Modal: Company Admin Login from Header Button */}
      <CompanyAdminLoginModal
        company={headerLoginCompany}
        isOpen={headerLoginCompany !== null}
        onClose={() => setHeaderLoginCompany(null)}
        onSuccess={(user, comp) => {
          setAdminUser(user);
          saveAdminSession(user);
          setSelectedAdminCompanyId(comp.id);
          setIsDedicatedSurveyMode(false);
          setActiveTab('ADMIN');
          setHeaderLoginCompany(null);
        }}
      />

      {/* Staff Personal Report Modal for Admin */}
      {modalSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalSubmission(null)}
              className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <PersonalResultView
              submission={modalSubmission}
              onRetake={() => setModalSubmission(null)}
              onGoToAdmin={() => setModalSubmission(null)}
            />
          </div>
        </div>
      )}

      {/* Quiet Corporate Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
              alt="다비치안경 로고"
              className="w-5 h-5 rounded object-contain shrink-0"
            />
            <span className="font-bold text-slate-800">DAVICH AI FIT 16</span>
            <span aria-hidden="true">·</span>
            <span>다비치안경 사내 AI 역량 진단 및 업무 자동화 관리 시스템</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>본 시스템의 16유형 진단은 공식 MBTI 검사가 아닌 사내 AI 교육용 프레임워크입니다.</span>
            {!adminUser ? (
              <button
                onClick={() => setActiveTab('ADMIN')}
                className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="관리자 전용 로그인"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>관리자 로그인</span>
              </button>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>관리자 모드 활성 ({adminUser.name})</span>
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
