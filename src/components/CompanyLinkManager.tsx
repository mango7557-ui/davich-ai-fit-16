import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Users,
  QrCode,
  Search,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Clock,
} from 'lucide-react';
import { Company, CompanyCategory, AdminUser } from '../types/davich';
import {
  addCompany,
  deleteCompany,
  updateCompany,
  getStoredState,
  updateGlobalOrgConfig,
  DEFAULT_STORE_POSITIONS,
  DEFAULT_HQ_POSITIONS,
  DEFAULT_GLOBAL_DEPARTMENTS,
  DEFAULT_GLOBAL_POSITIONS,
} from '../lib/storage';
import { generateCompanyThumbnailDataUrl } from '../lib/thumbnailGenerator';
import { CompanyAdminLoginModal } from './CompanyAdminLoginModal';
import { KakaoShareModal } from './KakaoShareModal';

interface CompanyLinkManagerProps {
  companies: Company[];
  submissionCounts: Record<string, number>;
  onSelectCompanyForSurvey: (companyCode: string) => void;
  onFilterAdminByCompany: (companyId: string) => void;
  onAdminLogin?: (user: AdminUser) => void;
  adminUser?: AdminUser | null;
}

export const CompanyLinkManager: React.FC<CompanyLinkManagerProps> = ({
  companies,
  submissionCounts,
  onSelectCompanyForSurvey,
  onFilterAdminByCompany,
  onAdminLogin,
  adminUser,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [qrModalCompany, setQrModalCompany] = useState<Company | null>(null);
  const [loginModalCompany, setLoginModalCompany] = useState<Company | null>(null);
  const [kakaoModalCompany, setKakaoModalCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Edit Form state
  const [editName, setEditName] = useState('');
  const [editManagerName, setEditManagerName] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  const [editManagerPassword, setEditManagerPassword] = useState('');
  const [editTargetCount, setEditTargetCount] = useState<number>(20);
  const [editDeptInput, setEditDeptInput] = useState('');
  const [editPosInput, setEditPosInput] = useState('');

  // Department / Team & Position / Rank Management Modal state (Master Admin)
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgTargetCompanyId, setOrgTargetCompanyId] = useState<string>('GLOBAL');
  const [orgDepartments, setOrgDepartments] = useState<string[]>([]);
  const [orgPositions, setOrgPositions] = useState<string[]>([]);
  const [newDeptItem, setNewDeptItem] = useState('');
  const [newPosItem, setNewPosItem] = useState('');
  const [applyGlobalToAll, setApplyGlobalToAll] = useState(true);
  const [orgSavedNotice, setOrgSavedNotice] = useState<string | null>(null);

  const openOrgManager = (targetId: string = 'GLOBAL') => {
    const state = getStoredState();
    setOrgTargetCompanyId(targetId);
    if (targetId === 'GLOBAL') {
      setOrgDepartments(state.globalDepartments || DEFAULT_GLOBAL_DEPARTMENTS);
      setOrgPositions(state.globalPositions || DEFAULT_GLOBAL_POSITIONS);
    } else {
      const comp = companies.find((c) => c.id === targetId);
      if (comp) {
        setOrgDepartments(comp.allowedDepartments || []);
        setOrgPositions(comp.allowedPositions || DEFAULT_STORE_POSITIONS);
      }
    }
    setNewDeptItem('');
    setNewPosItem('');
    setOrgSavedNotice(null);
    setShowOrgModal(true);
  };

  const handleOrgTargetChange = (targetId: string) => {
    const state = getStoredState();
    setOrgTargetCompanyId(targetId);
    if (targetId === 'GLOBAL') {
      setOrgDepartments(state.globalDepartments || DEFAULT_GLOBAL_DEPARTMENTS);
      setOrgPositions(state.globalPositions || DEFAULT_GLOBAL_POSITIONS);
    } else {
      const comp = companies.find((c) => c.id === targetId);
      if (comp) {
        setOrgDepartments(comp.allowedDepartments || []);
        setOrgPositions(comp.allowedPositions || DEFAULT_STORE_POSITIONS);
      }
    }
  };

  const handleAddOrgDept = () => {
    const val = newDeptItem.trim();
    if (!val) return;
    if (!orgDepartments.includes(val)) {
      setOrgDepartments([...orgDepartments, val]);
    }
    setNewDeptItem('');
  };

  const handleRemoveOrgDept = (dept: string) => {
    setOrgDepartments(orgDepartments.filter((d) => d !== dept));
  };

  const handleAddOrgPos = () => {
    const val = newPosItem.trim();
    if (!val) return;
    if (!orgPositions.includes(val)) {
      setOrgPositions([...orgPositions, val]);
    }
    setNewPosItem('');
  };

  const handleRemoveOrgPos = (pos: string) => {
    setOrgPositions(orgPositions.filter((p) => p !== pos));
  };

  const handleSaveOrgModal = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDepts = orgDepartments.length > 0 ? orgDepartments : ['기본 부서'];
    const finalPositions = orgPositions.length > 0 ? orgPositions : ['사원'];

    if (orgTargetCompanyId === 'GLOBAL') {
      updateGlobalOrgConfig(finalDepts, finalPositions, applyGlobalToAll);
      setDeptInput(finalDepts.join(', '));
      setPosInput(finalPositions.join(', '));
      setOrgSavedNotice(
        applyGlobalToAll
          ? '전사 표준 부서/팀 및 직책/직급이 저장되고 모든 기업에 반영되었습니다.'
          : '전사 표준 부서/팀 및 직책/직급 기본값이 저장되었습니다.'
      );
    } else {
      updateCompany(orgTargetCompanyId, {
        allowedDepartments: finalDepts,
        allowedPositions: finalPositions,
      });
      const comp = companies.find((c) => c.id === orgTargetCompanyId);
      setOrgSavedNotice(`[${comp?.name || '기업'}]의 소속 부서/팀 및 직책/직급 구성이 저장되었습니다.`);
    }
    setTimeout(() => {
      setOrgSavedNotice(null);
      setShowOrgModal(false);
    }, 1200);
  };

  const handleOpenEditModal = (comp: Company) => {
    setEditingCompany(comp);
    setEditName(comp.name);
    setEditManagerName(comp.managerName || '');
    setEditManagerId(comp.managerId || comp.code);
    setEditManagerPassword(comp.managerPassword || '1234');
    setEditTargetCount(comp.targetRespondentCount || 20);
    setEditDeptInput(comp.allowedDepartments.join(', '));
    setEditPosInput((comp.allowedPositions || DEFAULT_STORE_POSITIONS).join(', '));
  };

  const handleSaveEditCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || !editName.trim() || !editManagerId.trim() || !editManagerPassword.trim()) return;

    const depts = editDeptInput
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    const positions = editPosInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    updateCompany(editingCompany.id, {
      name: editName.trim(),
      managerName: editManagerName.trim() || undefined,
      managerId: editManagerId.trim(),
      managerPassword: editManagerPassword.trim(),
      targetRespondentCount: editTargetCount > 0 ? editTargetCount : 20,
      allowedDepartments: depts.length > 0 ? depts : ['기본 부서'],
      allowedPositions: positions.length > 0 ? positions : DEFAULT_STORE_POSITIONS,
    });
    setEditingCompany(null);
  };

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<CompanyCategory>('STORE');
  const [managerName, setManagerName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [managerPassword, setManagerPassword] = useState('1234');
  const [contactEmail, setContactEmail] = useState('');
  const [targetCount, setTargetCount] = useState<number>(20);
  const [deptInput, setDeptInput] = useState('안경사 1팀 (시력검사), 안경사 2팀 (콘택트/가공), 고객서비스팀, 조제가공실');
  const [posInput, setPosInput] = useState(DEFAULT_STORE_POSITIONS.join(', '));

  // Auto-generate code from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    if (!code || code === 'davich-' || code.startsWith('comp-')) {
      const slug = val
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9가-힣]/g, '-')
        .replace(/--+/g, '-');
      setCode(slug ? `davich-${randomSuffix}` : `davich-${randomSuffix}`);
    }
    if (!managerId) {
      setManagerId(`admin_${randomSuffix}`);
    }
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanCode = (code.trim() || `davich-${Date.now().toString(36)}`).toLowerCase();
    const depts = deptInput
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    const positions = posInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    addCompany({
      name: name.trim(),
      code: cleanCode,
      category,
      managerName: managerName.trim() || undefined,
      managerId: managerId.trim() || `admin_${cleanCode}`,
      managerPassword: managerPassword.trim() || '1234',
      contactEmail: contactEmail.trim() || undefined,
      allowedDepartments: depts.length > 0 ? depts : ['기본 부서'],
      allowedPositions: positions.length > 0 ? positions : DEFAULT_STORE_POSITIONS,
      targetRespondentCount: targetCount > 0 ? targetCount : 20,
      active: true,
    });

    // Reset & close
    setName('');
    setCode('');
    setManagerName('');
    setManagerId('');
    setManagerPassword('1234');
    setContactEmail('');
    setShowModal(false);
  };

  const getFullSurveyUrl = (companyCode: string) => {
    const matched = companies.find((c) => c.code === companyCode);
    const nameParam = matched?.name ? `&name=${encodeURIComponent(matched.name)}` : '';
    if (typeof window === 'undefined') return `?company=${companyCode}${nameParam}`;

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

    if (PREBUILT_CODES.includes(companyCode)) {
      return `${base}${companyCode}/?company=${companyCode}${nameParam}`;
    }
    return `${base}?company=${companyCode}${nameParam}`;
  };

  const handleCopyLink = (companyCode: string) => {
    const url = getFullSurveyUrl(companyCode);
    navigator.clipboard.writeText(url);
    setCopiedCode(companyCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const isCompanyManager = adminUser?.role === 'COMPANY_MANAGER';
  const isMasterAdmin = adminUser?.role === 'MASTER';

  // If company manager, strictly isolate to their own company
  const visibleCompanies = isCompanyManager && adminUser?.companyId
    ? companies.filter((c) => c.id === adminUser.companyId)
    : companies;

  const filteredCompanies = visibleCompanies.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.managerName && c.managerName.toLowerCase().includes(q));
  });

  const getCategoryLabel = (cat: CompanyCategory) => {
    switch (cat) {
      case 'HQ':
        return '본사';
      case 'STORE':
        return '가맹/직영 안경원';
      case 'AFFILIATE':
        return '관계사/IT';
      default:
        return '협력/일반 기업';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Intro Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 tracking-wide uppercase">
              <img
                src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                alt="다비치안경 심볼"
                className="w-5 h-5 rounded object-contain shrink-0"
              />
              <span>{isCompanyManager ? '소속 기업 전용 링크 관리' : '기업별 전용 링크 발급'}</span>
              <span aria-hidden="true">·</span>
              <span>독립 진단 환경</span>
              <span aria-hidden="true">·</span>
              <span>{isCompanyManager ? '소속사 배포 모드' : '전사 통합 관리 지원'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              {isCompanyManager
                ? `${adminUser?.companyName || '소속 기업'} 직원 전용 설문 링크 및 카카오톡 배포`
                : '기업명 입력으로 직원 전용 설문 링크를 개별 생성하세요'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isCompanyManager
                ? `현재 관리 중인 [${adminUser?.companyName || '소속사'}] 임직원에게 배포할 설문 참여 링크, QR 코드, 카카오톡 공유 카드를 손쉽게 전송하실 수 있습니다.`
                : '본사 각 부서, 전국 가맹 안경원, 관계사별로 고유 링크를 즉시 발급할 수 있습니다. 직원은 별도의 복잡한 로그인 없이 전용 링크로 접속하여 소속 기업이 자동 지정된 상태에서 52문항 역량 및 16유형 진단에 참여하게 됩니다.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isMasterAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => openOrgManager('GLOBAL')}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>소속 부서/팀 · 직책/직급 관리</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>새 기업 등록 & 링크 생성</span>
                </button>
              </>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>{adminUser?.companyName || '소속 기업'} 전담 관리자</span>
              </div>
            )}
          </div>
        </div>

        {/* Workflow 3-Step Highlights */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <div className="font-semibold text-slate-900">기업/안경원명 입력</div>
              <div className="text-slate-500 mt-0.5">매장명이나 기업명을 입력하면 고유 참여 링크가 즉각 생성됩니다.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <div className="font-semibold text-slate-900">직원에게 링크 공유</div>
              <div className="text-slate-500 mt-0.5">원클릭 링크 복사 또는 QR코드로 사내 메신저나 문자로 배포합니다.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <div className="font-semibold text-slate-900">통합 관리자 분석</div>
              <div className="text-slate-500 mt-0.5">기업별 참여율, 16유형 분포, 역량 점수, 자동화 과제를 실시간 집계합니다.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="기업명, 링크 코드, 담당자 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>총 등록 기업 <strong className="text-slate-900 tabular-nums">{companies.length}</strong>개</span>
          <span aria-hidden="true">·</span>
          <span>진단 완료 응답 <strong className="text-slate-900 tabular-nums">{Object.values(submissionCounts).reduce((a, b) => a + b, 0)}</strong>건</span>
        </div>
      </div>

      {/* Company Cards Grid / List */}
      {filteredCompanies.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto p-2.5 shadow-2xs">
            <img
              src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
              alt="다비치안경 로고"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">
              {companies.length === 0 ? '등록된 기업이 없습니다' : '일치하는 기업을 찾을 수 없습니다'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {companies.length === 0
                ? '새로운 기업을 등록하여 직원 전용 설문 링크를 발급해 보세요. 상단의 [데이터 도구]를 통해 4개 기업 샘플 데이터를 즉시 불러올 수도 있습니다.'
                : '검색어를 변경하거나 필터를 초기화해 보세요.'}
            </p>
          </div>
          {companies.length === 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>첫 번째 기업 등록하기</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCompanies.map((company) => {
            const count = submissionCounts[company.id] || 0;
            const target = company.targetRespondentCount || 20;
            const rate = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;
            const surveyUrl = getFullSurveyUrl(company.code);

            return (
              <div
                key={company.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 shadow-sm transition-all flex flex-col justify-between gap-5 group"
              >
                {/* Header row */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-blue-700">{getCategoryLabel(company.category)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-400">/{company.code}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <img
                          src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                          alt="다비치 심볼"
                          className="w-5 h-5 rounded object-contain shrink-0"
                        />
                        <span>{company.name}</span>
                        {!company.active && (
                          <span className="text-[11px] font-normal text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">
                            비활성
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setKakaoModalCompany(company)}
                        className="p-1.5 text-slate-800 hover:text-black bg-[#FEE500] hover:bg-[#FDD835] rounded-lg transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
                        title="카카오톡 공유 카드 (썸네일, 주제, 부주제 자동 생성) 열기"
                      >
                        <span className="text-xs">💬</span>
                      </button>
                      <button
                        onClick={() => setQrModalCompany(company)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="QR 코드 보기"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      {isMasterAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`'${company.name}' 기업 정보를 삭제하시겠습니까?`)) {
                              deleteCompany(company.id);
                            }
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="기업 삭제 (마스터 전용)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Manager and department info */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {company.managerName && (
                      <span>담당: <span className="text-slate-800">{company.managerName}</span></span>
                    )}
                    {company.contactEmail && (
                      <span>연락처: <span className="text-slate-800 font-mono">{company.contactEmail}</span></span>
                    )}
                  </div>

                  {/* Allowed departments & positions */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-slate-600 truncate">
                        <span className="font-semibold text-slate-700">부서/팀 ({company.allowedDepartments.length}):</span>{' '}
                        {company.allowedDepartments.join(', ')}
                      </div>
                      {isMasterAdmin && (
                        <button
                          type="button"
                          onClick={() => openOrgManager(company.id)}
                          className="text-[11px] px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold shrink-0 cursor-pointer transition-colors"
                        >
                          부서·직급 관리
                        </button>
                      )}
                    </div>
                    <div className="text-slate-500 truncate text-[11px]">
                      <span className="font-semibold text-slate-700">
                        직책/직급 ({(company.allowedPositions || DEFAULT_STORE_POSITIONS).length}):
                      </span>{' '}
                      {(company.allowedPositions || DEFAULT_STORE_POSITIONS).join(', ')}
                    </div>
                  </div>

                  {/* Manager Login Credentials Badge (ONLY visible to Master Admin) */}
                  {isMasterAdmin && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-amber-900 font-mono text-[11px] truncate">
                          <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="font-bold text-amber-950 font-sans">링크 전용 관리자 계정:</span>
                          <span>ID: <strong className="text-blue-800">{company.managerId || company.code}</strong></span>
                          <span>/</span>
                          <span>PW: <strong className="text-slate-900">{company.managerPassword || '1234'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(company)}
                            className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold cursor-pointer transition-colors"
                          >
                            ID/PW 변경
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const credText = `[${company.name} 전용 설문 링크 & 관리자 계정 안내]\n▶ 전용 링크: ${getFullSurveyUrl(company.code)}\n▶ 관리자 아이디: ${company.managerId || company.code}\n▶ 관리자 비밀번호: ${company.managerPassword || '1234'}\n※ 위 링크 접속 후 우측 상단 [${company.name} 관리자] 버튼에서 로그인하시면 해당 링크의 설문 참여자만 독립 관리하실 수 있습니다.`;
                              navigator.clipboard.writeText(credText);
                              setCopiedCode(`cred_${company.id}`);
                              setTimeout(() => setCopiedCode(null), 2500);
                            }}
                            className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold underline shrink-0 cursor-pointer"
                          >
                            {copiedCode === `cred_${company.id}` ? '복사완료!' : '계정+링크 복사'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar and metrics */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">설문 참여 진척도</span>
                    <span className="font-mono text-slate-900 font-semibold tabular-nums">
                      {count} / {target}명 ({rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>

                {/* Dedicated Survey Participation Link Container */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <input
                      type="text"
                      readOnly
                      value={surveyUrl}
                      onClick={() => handleCopyLink(company.code)}
                      className="flex-1 text-xs bg-transparent text-slate-700 font-mono truncate focus:outline-none select-all cursor-pointer"
                      title="클릭하여 링크 복사"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyLink(company.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                        copiedCode === company.code
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs'
                      }`}
                    >
                      {copiedCode === company.code ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>복사완료!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>링크 복사</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* KakaoTalk Share Button (썸네일, 주제, 부주제 자동 생성) */}
                  <button
                    type="button"
                    onClick={() => setKakaoModalCompany(company)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] active:bg-[#FBC02D] text-[#191919] font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer group"
                    title={`${company.name} 카카오톡 공유 (썸네일, 주제, 부주제 자동 생성)`}
                  >
                    <span className="text-sm">💬</span>
                    <span>카카오톡 공유 (썸네일·주제·부주제 자동 생성)</span>
                  </button>

                  {/* Direct Action Link Buttons */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a
                      href={surveyUrl}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectCompanyForSurvey(company.code);
                      }}
                      className="py-2.5 px-3 rounded-xl text-white bg-blue-600 hover:bg-blue-500 font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap truncate shadow-sm cursor-pointer group"
                      title={`${company.name} 전용 설문 참여 섹션 열기`}
                    >
                      <span className="truncate">{company.name} 설문 섹션</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (isMasterAdmin) {
                          onFilterAdminByCompany(company.id);
                        } else {
                          setLoginModalCompany(company);
                        }
                      }}
                      className="py-2.5 px-3 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                      title={`${company.name} 설문 참여자 관리 대시보드 열기`}
                    >
                      <span>참여자 관리 섹션 ({count}명)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Company */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                  alt="다비치안경 로고"
                  className="w-9 h-9 rounded-xl object-contain shadow-2xs shrink-0"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">새 기업 등록 및 전용 설문 링크 발급</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    기업 정보를 입력하면 즉시 직원이 접속할 수 있는 독립 진단 링크가 생성됩니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  기업/안경원명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 다비치안경 강남역삼점, 다비치 본사 마케팅본부"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    소속 구분
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CompanyCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="STORE">가맹/직영 안경원</option>
                    <option value="HQ">다비치안경 본사</option>
                    <option value="AFFILIATE">관계사 / IT계열사</option>
                    <option value="OTHER">협력사 / 외부 기업</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    전용 링크 URL 슬러그
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50">
                    <span className="text-slate-400 font-mono text-xs">?company=</span>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none pl-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    담당 관리자 성명
                  </label>
                  <input
                    type="text"
                    placeholder="예: 홍길동 점장"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    연락처 또는 이메일
                  </label>
                  <input
                    type="text"
                    placeholder="manager@store.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  소속 부서/팀 목록 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  placeholder="예: 안경사 1팀, 검안팀, 고객관리팀"
                  value={deptInput}
                  onChange={(e) => setDeptInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  직원이 설문 작성 시 소속 부서/팀을 선택할 수 있는 드롭다운 목록입니다.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  직책/직급 목록 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  placeholder="예: 원장, 점장, 부점장, 수석안경사, 안경사, 팀장, 매니저, 사원"
                  value={posInput}
                  onChange={(e) => setPosInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  직원이 설문 작성 시 직책/직급을 선택할 수 있는 드롭다운 목록입니다.
                </p>
              </div>

              {/* 기업 전용 관리자 접속 계정 설정 */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>기업 전용 관리자 로그인 계정 (아이디 / 비밀번호)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      관리자 아이디 (ID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: gangnam_admin"
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      관리자 비밀번호 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 1234"
                      value={managerPassword}
                      onChange={(e) => setManagerPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  ※ 해당 매장 관리자가 접속하여 자체 설문 결과를 열람할 수 있는 계정입니다. (최고 관리자는 마스터 계정: <strong>한재환 / 1234</strong>로 전체 기업 관리 가능)
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  예상 진단 대상 인원 수 (참여율 기준)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={targetCount}
                  onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-sm transition-colors"
                >
                  기업 등록 및 링크 발급
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code & KakaoTalk Share Modal */}
      {qrModalCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-center gap-2">
              <img
                src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                alt="다비치 로고"
                className="w-6 h-6 rounded object-contain shrink-0"
              />
              <h3 className="text-base font-bold text-slate-900">
                {qrModalCompany.name} 전용 공유 & QR
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              스마트폰 카메라로 QR을 스캔하거나 카카오톡·사내 메신저로 전송하세요.
            </p>

            {/* KakaoTalk Share Card Preview */}
            <div className="text-left rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs space-y-0">
              <div className="text-[10px] font-bold text-slate-500 bg-slate-100/80 px-3 py-1.5 flex items-center justify-between border-b border-slate-200">
                <span>카카오톡 / 사내 메신저 공유 카드 미리보기</span>
                <span className="text-[#3A1D1D] bg-[#FEE500] px-1.5 py-0.2 rounded font-semibold text-[9px]">카카오톡</span>
              </div>
              <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900">
                <img
                  src={generateCompanyThumbnailDataUrl(qrModalCompany.name)}
                  alt={`${qrModalCompany.name} 카카오톡 공유 썸네일`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 bg-white space-y-0.5">
                <div className="text-xs font-bold text-slate-900 line-clamp-1">
                  {qrModalCompany.name} AI 역량 & 16 성향 진단
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {qrModalCompany.name} 임직원 전용 AI 역량 & 성향 진단 (DAVICH AI FIT 16)
                </div>
                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  {typeof window !== 'undefined' ? window.location.host : 'davich-aifit16.com'}
                </div>
              </div>
            </div>

            {/* 1주일 시간 동안 완성 하셔야 합니다 안내 뱃지 */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs text-left space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>직원 전달 시 필수 안내 메시지</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-normal">
                "설문 링크 수신 후 <strong className="font-extrabold text-amber-950 underline decoration-amber-400">1주일 시간 동안 완성 하셔야 합니다.</strong> (기한 경과 시 분석 제한)"
              </p>
            </div>

            {/* QR code container */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-flex flex-col items-center">
              <div className="w-36 h-36 bg-white border border-slate-200 p-2 flex flex-col items-center justify-center rounded-lg">
                <QrCode className="w-28 h-28 text-slate-900" />
              </div>
              <span className="text-[10px] text-slate-500 mt-1.5">모바일 전용 간편 스캔</span>
            </div>

            <div className="text-xs font-mono text-slate-600 truncate px-2 select-all bg-slate-50 p-2 rounded-lg border border-slate-200">
              {getFullSurveyUrl(qrModalCompany.code)}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleCopyLink(qrModalCompany.code)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {copiedCode === qrModalCompany.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>링크 복사완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>전용 참여 링크 복사</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setQrModalCompany(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Company Link & Admin Credentials */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                  alt="다비치안경 로고"
                  className="w-9 h-9 rounded-xl object-contain shadow-2xs shrink-0"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    [{editingCompany.name}] 관리자 계정 및 링크 설정 변경
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    해당 기업 링크(`?company={editingCompany.code}`)를 전담 관리할 관리자 아이디와 비밀번호를 설정합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCompany(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditCompany} className="space-y-4 text-xs">
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>해당 링크 전용 관리자 아이디 / 비밀번호</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      관리자 아이디 (ID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editManagerId}
                      onChange={(e) => setEditManagerId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      관리자 비밀번호 (PW) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editManagerPassword}
                      onChange={(e) => setEditManagerPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    기업/안경원명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    담당 관리자 성명
                  </label>
                  <input
                    type="text"
                    value={editManagerName}
                    onChange={(e) => setEditManagerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  소속 부서/팀 목록 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={editDeptInput}
                  onChange={(e) => setEditDeptInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  직책/직급 목록 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={editPosInput}
                  onChange={(e) => setEditPosInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  예상 진단 대상 인원 수
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={editTargetCount}
                  onChange={(e) => setEditTargetCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Master Admin Department / Team & Position / Rank Management */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                  alt="다비치안경 로고"
                  className="w-9 h-9 rounded-xl object-contain shadow-2xs shrink-0"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    소속 부서/팀 & 직책/직급 추가 · 통합 관리
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    마스터 관리자 전용 · 전사 기본값 또는 기업별 부서/팀과 직책/직급 항목을 자유롭게 추가·삭제합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOrgModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {orgSavedNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{orgSavedNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveOrgModal} className="space-y-5 text-xs">
              {/* Target Selector: Global vs Specific Company */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-slate-800 font-bold">
                  관리 대상 선택 (전사 표준 또는 개별 기업/매장)
                </label>
                <select
                  value={orgTargetCompanyId}
                  onChange={(e) => handleOrgTargetChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="GLOBAL">🌐 전사 표준 기본값 설정 (신규 기업 기본값 & 전체 일괄 적용)</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏢 {c.name} (/{c.code}) — 부서 {c.allowedDepartments.length}개 / 직급 {(c.allowedPositions || DEFAULT_STORE_POSITIONS).length}개
                    </option>
                  ))}
                </select>
                {orgTargetCompanyId === 'GLOBAL' && (
                  <label className="flex items-center gap-2 pt-1 text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyGlobalToAll}
                      onChange={(e) => setApplyGlobalToAll(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>저장 시 현재 등록된 모든 기업({companies.length}개)에도 추가된 부서/팀 및 직책/직급 반영</span>
                  </label>
                )}
              </div>

              {/* Section 1: 소속 부서 / 팀 추가 및 관리 */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-blue-950 text-sm flex items-center gap-2">
                    <span>1. 소속 부서 / 팀 관리</span>
                    <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono">
                      총 {orgDepartments.length}개
                    </span>
                  </div>
                </div>

                {/* Add new department input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="추가할 부서명 또는 팀명 입력 (예: 전문검안팀, 온라인마케팅팀)"
                    value={newDeptItem}
                    onChange={(e) => setNewDeptItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOrgDept();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddOrgDept}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>부서/팀 추가</span>
                  </button>
                </div>

                {/* Quick preset chips for departments */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-slate-500 mr-1">빠른 추가:</span>
                  {['안경사 1팀 (시력검사)', '안경사 2팀 (콘택트/가공)', '전문검안팀', '콘택트렌즈팀', '조제가공실', '고객서비스(CS)팀', '매장영업팀', '경영지원팀', '마케팅전략팀', '가맹운영팀', '교육개발팀', 'IT혁신팀'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        if (!orgDepartments.includes(preset)) {
                          setOrgDepartments([...orgDepartments, preset]);
                        }
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white hover:bg-blue-100 text-slate-600 hover:text-blue-800 border border-slate-200 transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Current department tags */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-100">
                  {orgDepartments.map((dept) => (
                    <span
                      key={dept}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-slate-800 font-semibold text-xs shadow-2xs"
                    >
                      <span>{dept}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOrgDept(dept)}
                        className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                        title="부서/팀 삭제"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {orgDepartments.length === 0 && (
                    <span className="text-slate-400 text-xs py-1">등록된 부서/팀이 없습니다. 위 입력창에서 추가해 주세요.</span>
                  )}
                </div>
              </div>

              {/* Section 2: 직책 / 직급 추가 및 관리 */}
              <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                    <span>2. 직책 / 직급 관리</span>
                    <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-mono">
                      총 {orgPositions.length}개
                    </span>
                  </div>
                </div>

                {/* Add new position input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="추가할 직책 또는 직급 입력 (예: 원장, 점장, 수석안경사, 팀장, 매니저)"
                    value={newPosItem}
                    onChange={(e) => setNewPosItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOrgPos();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddOrgPos}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>직책/직급 추가</span>
                  </button>
                </div>

                {/* Quick preset chips for positions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-slate-500 mr-1">빠른 추가:</span>
                  {['원장', '점장', '부점장', '수석안경사', '책임안경사', '안경사', '팀장', '파트장', '매니저', '본부장', '부장', '차장', '과장', '대리', '주임', '사원'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        if (!orgPositions.includes(preset)) {
                          setOrgPositions([...orgPositions, preset]);
                        }
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white hover:bg-indigo-100 text-slate-600 hover:text-indigo-800 border border-slate-200 transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Current position tags */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-indigo-100">
                  {orgPositions.map((pos) => (
                    <span
                      key={pos}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-slate-800 font-semibold text-xs shadow-2xs"
                    >
                      <span>{pos}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOrgPos(pos)}
                        className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                        title="직책/직급 삭제"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {orgPositions.length === 0 && (
                    <span className="text-slate-400 text-xs py-1">등록된 직책/직급이 없습니다. 위 입력창에서 추가해 주세요.</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  부서/팀 및 직책/직급 설정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Company Admin Login Gate for Dashboard */}
      <CompanyAdminLoginModal
        company={loginModalCompany}
        isOpen={loginModalCompany !== null}
        onClose={() => setLoginModalCompany(null)}
        onSuccess={(user, comp) => {
          if (onAdminLogin) onAdminLogin(user);
          onFilterAdminByCompany(comp.id);
          setLoginModalCompany(null);
        }}
      />

      {/* Modal: KakaoTalk Share & Auto-Generated Preview */}
      <KakaoShareModal
        company={kakaoModalCompany}
        isOpen={kakaoModalCompany !== null}
        onClose={() => setKakaoModalCompany(null)}
        surveyUrl={kakaoModalCompany ? getFullSurveyUrl(kakaoModalCompany.code) : ''}
      />
    </div>
  );
};
