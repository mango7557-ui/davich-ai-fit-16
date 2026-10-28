import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Briefcase,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  Check,
  ChevronRight,
  ShieldAlert,
  UserPlus,
  UserCheck,
  Trash2,
  RotateCcw,
  Share2,
  Copy,
  Plus,
  X,
  Mail,
  Phone,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Company,
  AssessmentSubmission,
  TrainingAssignment,
  AutomationTask,
  AutomationStatus,
  PreRegisteredStaff,
  AdminUser,
} from '../types/davich';
import { PREFERENCE_TYPES_DICTIONARY, TRAINING_COURSES } from '../data/questionBank';
import {
  exportSubmissionsToCsv,
  updateAutomationTask,
  updateTrainingAssignment,
  deleteSubmission,
  addRegisteredStaff,
  deleteRegisteredStaff,
  getStoredState,
} from '../lib/storage';
import { KakaoShareModal } from './KakaoShareModal';

interface AdminDashboardProps {
  companies: Company[];
  submissions: AssessmentSubmission[];
  assignments: TrainingAssignment[];
  automationTasks: AutomationTask[];
  selectedCompanyId: string;
  onSelectCompanyId: (id: string) => void;
  onViewPersonalReport: (submission: AssessmentSubmission) => void;
  onNavigateToLinks: () => void;
  onNavigateToSurvey?: (companyCode: string) => void;
  adminUser?: AdminUser | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  companies,
  submissions,
  assignments,
  automationTasks,
  selectedCompanyId,
  onSelectCompanyId,
  onViewPersonalReport,
  onNavigateToLinks,
  onNavigateToSurvey,
  adminUser,
}) => {
  // If a specific company is selected, default to STAFF (Employee Management)
  const [activeTab, setActiveTab] = useState<'STAFF' | 'OVERVIEW' | 'TRAINING' | 'TASKS'>(() =>
    selectedCompanyId !== 'ALL' ? 'STAFF' : 'OVERVIEW'
  );
  const [staffSearch, setStaffSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [staffStatusFilter, setStaffStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');

  // Registered staff state (stored in localStorage)
  const [registeredStaffList, setRegisteredStaffList] = useState<PreRegisteredStaff[]>(() => {
    return getStoredState().registeredStaff || [];
  });

  // Modals & Feedback
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmpNo, setNewStaffEmpNo] = useState('');
  const [newStaffDept, setNewStaffDept] = useState('');
  const [newStaffPosition, setNewStaffPosition] = useState('안경사');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showKakaoModal, setShowKakaoModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Sync registered staff from storage
  const refreshRegisteredStaff = () => {
    setRegisteredStaffList(getStoredState().registeredStaff || []);
  };

  const isCompanyManager = adminUser?.role === 'COMPANY_MANAGER';
  const isMasterAdmin = adminUser?.role === 'MASTER';

  // If company manager, target is strictly locked to adminUser.companyId
  const targetCompanyId = isCompanyManager && adminUser?.companyId
    ? adminUser.companyId
    : selectedCompanyId;

  // Set active tab to STAFF whenever targetCompanyId changes to a specific company
  useEffect(() => {
    if (targetCompanyId !== 'ALL') {
      setActiveTab('STAFF');
    }
  }, [targetCompanyId]);

  // Current company object
  const currentCompany = companies.find((c) => c.id === targetCompanyId);

  // Filter datasets: Company manager can ONLY view their company; Master admin can view ALL or filter
  const isAllCompaniesView = isMasterAdmin && targetCompanyId === 'ALL';

  const filteredSubmissions = isAllCompaniesView
    ? submissions
    : submissions.filter((s) => s.companyId === targetCompanyId);

  const filteredTasks = isAllCompaniesView
    ? automationTasks
    : automationTasks.filter((t) => t.companyId === targetCompanyId);

  const filteredAssignments = isAllCompaniesView
    ? assignments
    : assignments.filter((a) => a.companyId === targetCompanyId);

  const filteredRegisteredStaff = isAllCompaniesView
    ? registeredStaffList
    : registeredStaffList.filter((s) => s.companyId === targetCompanyId);

  // Identify pre-registered staff who haven't completed submission yet
  const pendingStaff = filteredRegisteredStaff.filter(
    (reg) =>
      !filteredSubmissions.some(
        (sub) =>
          sub.respondent.name.trim().toLowerCase() === reg.name.trim().toLowerCase() ||
          sub.respondent.employeeNumber.trim().toLowerCase() === reg.employeeNumber.trim().toLowerCase()
      )
  );

  // Targets and Participation Calculation
  const targetTotal =
    selectedCompanyId === 'ALL'
      ? companies.reduce((acc, c) => acc + (c.targetRespondentCount || 20), 0)
      : currentCompany?.targetRespondentCount || 20;

  const totalSubmitted = filteredSubmissions.length;
  const participationRate = targetTotal > 0 ? Math.min(100, Math.round((totalSubmitted / targetTotal) * 100)) : 0;

  // Average Scores
  const avgCapability =
    totalSubmitted > 0
      ? Math.round(filteredSubmissions.reduce((acc, s) => acc + s.scores.capabilityScore, 0) / totalSubmitted)
      : 0;

  const avgSafety =
    totalSubmitted > 0
      ? Math.round(filteredSubmissions.reduce((acc, s) => acc + s.scores.safetyScore, 0) / totalSubmitted)
      : 0;

  const avgQuiz =
    totalSubmitted > 0
      ? Math.round(
          filteredSubmissions.reduce(
            (acc, s) => acc + (s.scores.quizScore ?? Math.round(s.scores.capabilityScore * 0.95)),
            0
          ) / totalSubmitted
        )
      : 0;

  // Total Expected Hours Saved
  const totalHoursSaved = filteredTasks.reduce((acc, t) => acc + (t.expectedWeeklyHoursSaved || 0), 0);

  // 16 Preference Types Distribution Map
  const typeCounts: Record<string, number> = {};
  let tiedCount = 0;

  filteredSubmissions.forEach((s) => {
    const code = s.scores.preference.typeCode;
    if (code) {
      typeCounts[code] = (typeCounts[code] || 0) + 1;
    } else {
      tiedCount++;
    }
  });

  // Department aggregation
  const deptMap: Record<string, { count: number; capSum: number; safeSum: number }> = {};
  filteredSubmissions.forEach((s) => {
    const d = s.respondent.department || '기타';
    if (!deptMap[d]) deptMap[d] = { count: 0, capSum: 0, safeSum: 0 };
    deptMap[d].count++;
    deptMap[d].capSum += s.scores.capabilityScore;
    deptMap[d].safeSum += s.scores.safetyScore;
  });

  const departmentStats = Object.entries(deptMap).map(([dept, data]) => ({
    dept,
    count: data.count,
    avgCap: Math.round(data.capSum / data.count),
    avgSafe: Math.round(data.safeSum / data.count),
  }));

  // CSV Export Trigger
  const handleExportCsv = () => {
    const csvContent = exportSubmissionsToCsv(selectedCompanyId);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const companyLabel = selectedCompanyId === 'ALL' ? '전사통합' : currentCompany?.name || '기업';
    link.download = `DAVICH_AI_FIT16_${companyLabel}_직원진단결과_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify(`${companyLabel} 직원 진단 데이터 CSV 다운로드가 완료되었습니다.`);
  };

  // Copy KakaoTalk / Workplace Invite Text
  const getCompanySurveyUrl = (compCode: string) => {
    const matched = companies.find((c) => c.code === compCode) || currentCompany;
    const nameParam = matched?.name ? `&name=${encodeURIComponent(matched.name)}` : '';
    if (typeof window === 'undefined') return `?company=${compCode}${nameParam}`;

    const PREBUILT_CODES = ['davich-hq', 'store-gangnam', 'store-daechi', 'davich-sx7r'];
    let basePath = window.location.pathname;
    for (const c of PREBUILT_CODES) {
      if (basePath.endsWith(`/${c}/`)) {
        basePath = basePath.slice(0, -(`${c}/`.length));
      } else if (basePath.endsWith(`/${c}`)) {
        basePath = basePath.slice(0, -(c.length));
      }
    }
    if (!basePath.endsWith('/')) basePath += '/';
    const base = window.location.origin + basePath;

    if (PREBUILT_CODES.includes(compCode)) {
      return `${base}${compCode}/?company=${compCode}${nameParam}`;
    }
    return `${base}?company=${compCode}${nameParam}`;
  };

  const handleCopyInviteMessage = () => {
    if (!currentCompany) return;
    const surveyUrl = getCompanySurveyUrl(currentCompany.code);
    const text = `[다비치안경 ${currentCompany.name} 직원 AI 역량 진단 참여 안내]\n\n안녕하십니까, ${currentCompany.name} 임직원 여러분.\n본사 및 지점의 AI 실무 활용 역량 강화와 업무 자동화 과제 발굴을 위해 사내 AI 진단 설문을 실시합니다.\n\n▶ 참여 링크: ${surveyUrl}\n▶ 소요 시간: 약 10~15분 (1주일 이내 완료)\n▶ 주요 진단: AI 실무 활용 역량 (0~100점), 16개 업무 성향 진단, 매장 업무 자동화 제안\n\n모든 임직원의 적극적인 참여를 부탁드립니다. 감사합니다.`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    notify('카카오톡 / 사내망 전달용 설문 참여 독려 안내문이 복사되었습니다.');
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  // Add Pre-Registered Staff
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmpNo.trim() || !currentCompany) return;

    addRegisteredStaff({
      companyId: currentCompany.id,
      name: newStaffName.trim(),
      employeeNumber: newStaffEmpNo.trim(),
      department: newStaffDept.trim() || (currentCompany.allowedDepartments[0] || '안경사팀'),
      position: newStaffPosition.trim() || '안경사',
    });

    refreshRegisteredStaff();
    setNewStaffName('');
    setNewStaffEmpNo('');
    setShowAddStaffModal(false);
    notify(`'${newStaffName.trim()}' 직원이 명단에 등록되었습니다. 설문 참여를 독려해 주세요.`);
  };

  // Delete / Reset Submission
  const handleDeleteSubmission = (sub: AssessmentSubmission) => {
    if (window.confirm(`'${sub.respondent.name}' 님의 진단 결과를 초기화(삭제)하시겠습니까?\n초기화 시 해당 직원은 설문을 다시 처음부터 응시할 수 있습니다.`)) {
      deleteSubmission(sub.id);
      notify(`'${sub.respondent.name}' 님의 설문 응답이 초기화되었습니다.`);
    }
  };

  // Delete Pre-registered Staff
  const handleDeleteRegisteredStaff = (reg: PreRegisteredStaff) => {
    if (window.confirm(`'${reg.name}' 직원을 사전 등록 명단에서 삭제하시겠습니까?`)) {
      deleteRegisteredStaff(reg.id);
      refreshRegisteredStaff();
      notify(`'${reg.name}' 직원이 명단에서 삭제되었습니다.`);
    }
  };

  // 16 Matrix code order
  const matrixCodes = [
    'RAVP', 'RAVO', 'RAIP', 'RAIO',
    'RCVP', 'RCVO', 'RCIP', 'RCIO',
    'EAVP', 'EAVO', 'EAIP', 'EAIO',
    'ECVP', 'ECVO', 'ECIP', 'ECIO',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* Company Dedicated Staff Management Banner */}
      {currentCompany ? (
        <div className="bg-white border-2 border-blue-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 relative overflow-hidden animate-in fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
                <img
                  src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                  alt="다비치 로고"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {currentCompany.category === 'STORE' ? '가맹/직영 안경원' : '본사/관계사'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/{currentCompany.code}</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {isCompanyManager ? '기업별 전용 링크 독립 관리 섹션' : '본사 관리자 · 기업별 상세 관리'}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>[{currentCompany.name}] 전용 링크 설문 참여자 관리 섹션</span>
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    담당 관리자: <strong className="text-slate-800">{currentCompany.managerName || '원장/점장'}</strong>
                  </span>
                  <span>
                    링크 관리자 ID: <strong className="text-blue-700 font-mono">{currentCompany.managerId || currentCompany.code}</strong>
                  </span>
                  <span>
                    부서 구성: <strong className="text-slate-700">{currentCompany.allowedDepartments.join(', ')}</strong>
                  </span>
                </div>
                {/* Dedicated Link Quick Copy Bar for this company section */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 select-all">
                    {getCompanySurveyUrl(currentCompany.code)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getCompanySurveyUrl(currentCompany.code));
                      notify(`${currentCompany.name} 전용 설문 참여 링크가 복사되었습니다.`);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>전용 링크 복사</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Manager Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewStaffDept(currentCompany.allowedDepartments[0] || '안경사팀');
                  setShowAddStaffModal(true);
                }}
                className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>설문 참여자 사전 등록</span>
              </button>

              <button
                type="button"
                onClick={() => setShowKakaoModal(true)}
                className="px-3.5 py-2.5 bg-[#FEE500] hover:bg-[#FDD835] active:bg-[#FBC02D] text-[#191919] text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="카카오톡 공유 카드 (썸네일, 주제, 부주제 자동 생성) 열기"
              >
                <span className="text-sm">💬</span>
                <span>카톡 카드 공유</span>
              </button>

              <button
                type="button"
                onClick={handleCopyInviteMessage}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="카카오톡 또는 사내망 전달용 설문 참여 독려 문구 복사"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedInvite ? '안내문 복사완료!' : '카톡 독려문구 복사'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={totalSubmitted === 0}
                className="px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>엑셀 다운로드</span>
              </button>

              {isMasterAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectCompanyId('ALL')}
                    className="px-3 py-2.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer font-medium"
                  >
                    전사 통합 보기
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateToLinks}
                    className="px-3 py-2.5 text-xs text-blue-700 hover:text-blue-900 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer font-bold"
                  >
                    ← 본사 링크 관리
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Master Overview Top Filter Bar */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
              <img
                src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                alt="다비치 심볼"
                className="w-5 h-5 rounded object-contain shrink-0"
              />
              <span>분석 대상 기업:</span>
            </div>

            {isMasterAdmin ? (
              <select
                value={selectedCompanyId}
                onChange={(e) => onSelectCompanyId(e.target.value)}
                className="px-3.5 py-1.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALL">전체 통합 분석 (총 {companies.length}개 기업)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-bold text-blue-700 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                {adminUser?.companyName || '소속 기업'} (소속 기업 전담 관리)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={totalSubmitted === 0}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV 엑셀 다운로드</span>
            </button>
            <button
              onClick={onNavigateToLinks}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              기업 링크 관리
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI 4-Card Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Participation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>설문 참여 진척도</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {participationRate}%
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              ({totalSubmitted} / {targetTotal}명)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${participationRate}%` }} />
          </div>
        </div>

        {/* Card 2: Capability Avg */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>평균 AI 실무 역량</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {avgCapability}
            </span>
            <span className="text-xs font-normal text-slate-500">/ 100점</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {avgCapability >= 70 ? '조직 내 적극 활용 그룹' : '기초 프롬프트 교육 집중 권장'}
          </div>
        </div>

        {/* Card 3: Safety Avg */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>평균 AI 안전 활용 지수</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
              {avgSafety}
            </span>
            <span className="text-xs font-normal text-slate-500">/ 100점</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {avgSafety >= 75 ? '보안 준수 양호' : '고객/검안 데이터 보안 가이드 강화 필요'}
          </div>
        </div>

        {/* Card 4: Automation pipeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>직원 제안 자동화 과제</span>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {filteredTasks.length}
            </span>
            <span className="text-xs text-slate-500">건 발굴</span>
          </div>
          <div className="text-[11px] text-purple-700 font-medium tabular-nums">
            주당 약 {totalHoursSaved.toFixed(1)}시간 절감 잠재력
          </div>
        </div>
      </div>

      {/* Nav Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-sm font-medium">
        <button
          onClick={() => setActiveTab('STAFF')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'STAFF'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>소속 직원 진단 및 관리</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-[11px] text-blue-800 font-mono font-bold">
            {filteredSubmissions.length}명
          </span>
        </button>

        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>16유형 매트릭스 & 부서 분석</span>
        </button>

        <button
          onClick={() => setActiveTab('TRAINING')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'TRAINING'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>교육 배정 및 30·60·90일 계획</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[11px] text-slate-700 font-mono">
            {filteredAssignments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('TASKS')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'TASKS'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>업무 자동화 과제</span>
          <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-[11px] text-purple-700 font-mono">
            {filteredTasks.length}
          </span>
        </button>
      </div>

      {/* TAB 1: STAFF MANAGEMENT (소속 직원 관리 전용 뷰) */}
      {activeTab === 'STAFF' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>소속 직원 AI 진단 명단 및 관리</span>
                <span className="text-xs font-normal text-slate-500 font-mono">
                  (완료 {filteredSubmissions.length}명 / 대기 {pendingStaff.length}명)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                실명 및 사번 기반의 직원 목록입니다. 개인별 16유형과 역량 점수를 확인하고 설문 재응시 또는 사전 등록을 관리할 수 있습니다.
              </p>
            </div>

            {/* Filter & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStaffStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    staffStatusFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  전체 ({filteredSubmissions.length + pendingStaff.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffStatusFilter('COMPLETED')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    staffStatusFilter === 'COMPLETED' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  진단 완료 ({filteredSubmissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffStatusFilter('PENDING')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    staffStatusFilter === 'PENDING' ? 'bg-white text-amber-700 font-bold shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  설문 대기 ({pendingStaff.length})
                </button>
              </div>

              {currentCompany && (
                <button
                  type="button"
                  onClick={() => {
                    setNewStaffDept(currentCompany.allowedDepartments[0] || '안경사팀');
                    setShowAddStaffModal(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>직원 등록</span>
                </button>
              )}

              {filterType && (
                <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
                  <span>유형: {filterType}</span>
                  <button onClick={() => setFilterType(null)} className="hover:text-blue-950 font-bold">✕</button>
                </div>
              )}

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="성명, 사번, 부서 검색..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Combined Staff Table */}
          {filteredSubmissions.length === 0 && pendingStaff.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 space-y-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-800">등록된 직원 또는 진단 참여 내역이 없습니다.</p>
                <p className="text-slate-400">
                  신규 직원을 사전 등록하거나, 설문 참여 링크를 공유하여 참여를 독려해 보세요.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {currentCompany && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToSurvey) {
                        onNavigateToSurvey(currentCompany.code);
                      } else {
                        setShowAddStaffModal(true);
                      }
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>설문 참여 시작</span>
                  </button>
                )}
                {currentCompany && (
                  <button
                    type="button"
                    onClick={handleCopyInviteMessage}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>카톡 설문 링크 복사</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold">
                    <th className="py-3.5 px-3">소속 매장/기업</th>
                    <th className="py-3.5 px-3">성명 (아이디) / 사번</th>
                    <th className="py-3.5 px-3">부서 / 직책</th>
                    <th className="py-3.5 px-3">참여 상태</th>
                    <th className="py-3.5 px-3">AI 실무 역량</th>
                    <th className="py-3.5 px-3">실전문항 (15)</th>
                    <th className="py-3.5 px-3">안전 지수</th>
                    <th className="py-3.5 px-3">16 성향</th>
                    <th className="py-3.5 px-3">사용 빈도</th>
                    <th className="py-3.5 px-3 text-right">직원 관리 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* 1. Completed Submissions */}
                  {staffStatusFilter !== 'PENDING' &&
                    filteredSubmissions
                      .filter((s) => {
                        if (filterType && s.scores.preference.typeCode !== filterType) return false;
                        const q = staffSearch.toLowerCase();
                        return (
                          s.respondent.name.toLowerCase().includes(q) ||
                          s.respondent.employeeNumber.toLowerCase().includes(q) ||
                          s.respondent.department.toLowerCase().includes(q) ||
                          s.respondent.position.toLowerCase().includes(q)
                        );
                      })
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            {s.respondent.companyName}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{s.respondent.name}</span>
                              {s.updatedAt && (
                                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-normal">
                                  재수정됨
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400 font-normal">
                              사번: {s.respondent.employeeNumber}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {s.respondent.department} · {s.respondent.position}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>진단 완료</span>
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {s.submittedAt.split('T')[0]}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-700 tabular-nums text-sm">
                            {s.scores.capabilityScore}점
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono font-bold text-indigo-700 tabular-nums text-sm">
                              {s.scores.quizScore !== undefined ? `${s.scores.quizScore}점` : `${Math.round(s.scores.capabilityScore * 0.95)}점`}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {s.scores.quizCorrectCount !== undefined ? `${s.scores.quizCorrectCount}/15 정답` : '-'}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700 tabular-nums text-sm">
                            {s.scores.safetyScore}점
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800">
                              {s.scores.preference.typeCode || s.scores.preference.partialCode}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {s.scores.usageFrequency}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onViewPersonalReport(s)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="개인 리포트 상세 확인"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>리포트</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubmission(s)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="설문 응답 초기화 (재응시 허용)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                  {/* 2. Pre-registered Pending Staff */}
                  {staffStatusFilter !== 'COMPLETED' &&
                    pendingStaff
                      .filter((reg) => {
                        const q = staffSearch.toLowerCase();
                        return (
                          reg.name.toLowerCase().includes(q) ||
                          reg.employeeNumber.toLowerCase().includes(q) ||
                          reg.department.toLowerCase().includes(q) ||
                          reg.position.toLowerCase().includes(q)
                        );
                      })
                      .map((reg) => (
                        <tr key={reg.id} className="bg-amber-50/20 hover:bg-amber-50/40 transition-colors">
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {companies.find((c) => c.id === reg.companyId)?.name || currentCompany?.name || '소속 매장'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            <div>{reg.name}</div>
                            <div className="font-mono text-[11px] text-slate-400 font-normal">
                              사번: {reg.employeeNumber}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {reg.department} · {reg.position}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>설문 대기중</span>
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">미참여</div>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono">-</td>
                          <td className="py-3 px-3 text-slate-400 font-mono">-</td>
                          <td className="py-3 px-3 text-slate-400 font-mono">-</td>
                          <td className="py-3 px-3 text-slate-400 font-mono">-</td>
                          <td className="py-3 px-3 text-slate-400 font-mono">-</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {currentCompany && (
                                <button
                                  type="button"
                                  onClick={handleCopyInviteMessage}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="설문 링크 카톡 전달"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>독려</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteRegisteredStaff(reg)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="사전 등록 명단 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OVERVIEW MATRIX & DEPARTMENT ANALYSIS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8 animate-in fade-in">
          {/* 16 Preference Types Matrix */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">16 AI 업무 성향 매트릭스 분포</h3>
                <p className="text-xs text-slate-500">
                  직원들이 응답한 4개 축(R/E, A/C, V/I, P/O)의 교차 분석 분포 현황입니다.
                </p>
              </div>

              {tiedCount > 0 && (
                <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl font-medium">
                  판정 보류(동점) 그룹: <strong className="tabular-nums">{tiedCount}</strong>명
                </div>
              )}
            </div>

            {/* 4x4 Grid Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {matrixCodes.map((code) => {
                const count = typeCounts[code] || 0;
                const percent = totalSubmitted > 0 ? Math.round((count / totalSubmitted) * 100) : 0;
                const detail = PREFERENCE_TYPES_DICTIONARY[code];
                const isSelected = filterType === code;

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setFilterType(isSelected ? null : code);
                      setActiveTab('STAFF');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                        : count > 0
                        ? 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
                        : 'border-slate-100 bg-slate-50/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-slate-900">{code}</span>
                      <span className="text-xs font-mono font-bold text-blue-700 tabular-nums">
                        {count}명 ({percent}%)
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-medium text-slate-700 truncate">
                      {detail?.name || '성향 유형'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {detail?.tagline || ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">부서별 AI 역량 및 안전 지수 비교</h3>
              <p className="text-xs text-slate-500">
                각 부서 및 매장 파트별 평균 점수(역량 / 안전) 비교 현황입니다.
              </p>
            </div>

            {departmentStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                부서별 응답 데이터가 아직 수집되지 않았습니다.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {departmentStats.map((d) => (
                  <div key={d.dept} className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">
                        {d.dept} <span className="font-normal text-slate-500 font-mono">({d.count}명 참여)</span>
                      </span>
                      <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                        <span className="text-blue-700">역량: <strong>{d.avgCap}점</strong></span>
                        <span className="text-emerald-700">안전: <strong>{d.avgSafe}점</strong></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${d.avgCap}%` }} />
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${d.avgSafe}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TRAINING ASSIGNMENT */}
      {activeTab === 'TRAINING' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">직원 맞춤형 AI 교육 배정 및 30·60·90일 로드맵</h3>
            <p className="text-xs text-slate-500">
              직원별 16 성향 진단 결과에 기반하여 자동으로 추천 및 배정된 사내 교육 과정입니다.
            </p>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              배정된 교육 과정이 없습니다. 직원이 설문을 완료하면 자동으로 맞춤 교육이 추천됩니다.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold">
                    <th className="py-3.5 px-3">직원 성명</th>
                    <th className="py-3.5 px-3">배정 교육 과정</th>
                    <th className="py-3.5 px-3">30일 (기초 실습)</th>
                    <th className="py-3.5 px-3">60일 (업무 적용)</th>
                    <th className="py-3.5 px-3">90일 (성과 확산)</th>
                    <th className="py-3.5 px-3">추천 사유</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map((a) => {
                    const course = TRAINING_COURSES.find((c) => c.id === a.courseId);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {a.respondentName}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-blue-700">{course?.title || a.courseId}</div>
                          <div className="text-[11px] text-slate-400">{course?.duration}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            a.stage30 === 'DONE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.stage30 === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {a.stage30 === 'DONE' ? '완료' : a.stage30 === 'IN_PROGRESS' ? '진행중' : '미시작'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            a.stage60 === 'DONE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.stage60 === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {a.stage60 === 'DONE' ? '완료' : a.stage60 === 'IN_PROGRESS' ? '진행중' : '미시작'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            a.stage90 === 'DONE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.stage90 === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {a.stage90 === 'DONE' ? '완료' : a.stage90 === 'IN_PROGRESS' ? '진행중' : '미시작'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {a.memo || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUTOMATION TASKS */}
      {activeTab === 'TASKS' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">직원 제안 매장 업무 자동화 과제 파이프라인</h3>
            <p className="text-xs text-slate-500">
              시력검사 안내, 해피콜, 재고 관리 등 직원들이 직접 발굴하여 제안한 자동화 과제입니다.
            </p>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              발굴된 업무 자동화 과제가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {task.department} · {task.respondentName}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">
                        {task.taskName}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 shrink-0">
                      우선순위: {task.priorityScore}점
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {task.desiredImprovement || '구체적인 개선 사항 미입력'}
                  </p>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                    <span>주당 약 <strong>{task.expectedWeeklyHoursSaved}시간</strong> 절감 기대</span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                      task.securityRisk === 'YES' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      보안 위험: {task.securityRisk === 'YES' ? '보안 검토 필요' : '안전'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Pre-Register Staff */}
      {showAddStaffModal && currentCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  [{currentCompany.name}] 신규 직원 등록
                </h3>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              직원의 성명과 사번을 등록해 두면 직원이 설문에 접속했을 때 자동으로 매칭되며, 진단 전까지 '설문 대기' 상태로 관리됩니다.
            </p>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  직원 성명 (아이디) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  사번 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: DVC-2026-01"
                  value={newStaffEmpNo}
                  onChange={(e) => setNewStaffEmpNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">소속 부서</label>
                <select
                  value={newStaffDept}
                  onChange={(e) => setNewStaffDept(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {currentCompany.allowedDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="기타 부서">기타 부서</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">직책</label>
                <input
                  type="text"
                  placeholder="예: 안경사, 점장, 주임"
                  value={newStaffPosition}
                  onChange={(e) => setNewStaffPosition(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  직원 명단 추가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notice Toast */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Modal: KakaoTalk Share Card */}
      <KakaoShareModal
        company={currentCompany || null}
        isOpen={showKakaoModal && currentCompany !== null}
        onClose={() => setShowKakaoModal(false)}
        surveyUrl={currentCompany ? getCompanySurveyUrl(currentCompany.code) : ''}
      />
    </div>
  );
};
