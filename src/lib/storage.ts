import {
  Company,
  AssessmentSubmission,
  TrainingAssignment,
  AutomationTask,
  AutomationStatus,
  AdminUser,
  MASTER_ADMIN_ACCOUNT,
  PreRegisteredStaff,
} from '../types/davich';
import { evaluateAssessmentScores, calculateAutomationPriority } from './assessmentEngine';

const STORAGE_KEY = 'davich_ai_fit16_store_v1';

export interface StorageState {
  companies: Company[];
  submissions: AssessmentSubmission[];
  assignments: TrainingAssignment[];
  automationTasks: AutomationTask[];
  registeredStaff?: PreRegisteredStaff[];
}

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_store_gangnam',
    code: 'store-gangnam',
    name: '다비치안경 강남점',
    category: 'STORE',
    managerName: '박서현 원장',
    managerId: 'gangnam_admin',
    managerPassword: '1234',
    contactEmail: 'gangnam@davichstore.com',
    allowedDepartments: ['안경사 1팀 (시력검사)', '안경사 2팀 (콘택트/가공)', '고객서비스팀', '매장영업팀'],
    active: true,
    targetRespondentCount: 15,
    createdAt: '2026-10-15T09:00:00.000Z',
  },
  {
    id: 'comp_davich_hq',
    code: 'davich-hq',
    name: '다비치안경 본사',
    category: 'HQ',
    managerName: '한재환 총괄관리자',
    managerId: '한재환',
    managerPassword: '1234',
    contactEmail: 'hq@davich.com',
    allowedDepartments: ['경영지원팀', '마케팅전략팀', '가맹운영팀', '교육개발팀', 'IT혁신팀'],
    active: true,
    targetRespondentCount: 45,
    createdAt: '2026-10-10T09:00:00.000Z',
  },
  {
    id: 'comp_store_daechi',
    code: 'store-daechi',
    name: '다비치안경 대치본점',
    category: 'STORE',
    managerName: '김태윤 점장',
    managerId: 'daechi_admin',
    managerPassword: '1234',
    contactEmail: 'daechi@davichstore.com',
    allowedDepartments: ['전문검안팀', '콘택트렌즈팀', '조제가공실'],
    active: true,
    targetRespondentCount: 12,
    createdAt: '2026-10-11T10:00:00.000Z',
  },
  {
    id: 'comp_store_myeongdong',
    code: 'davich-sx7r',
    name: '다비치안경 명동점',
    category: 'STORE',
    managerName: '이진우 점장',
    managerId: '다비치명동점',
    managerPassword: '1234',
    contactEmail: 'myeongdong@davichstore.com',
    allowedDepartments: ['안경사팀 (시력검사)', '콘택트렌즈팀', '고객만족팀', '조제가공실'],
    active: true,
    targetRespondentCount: 18,
    createdAt: '2026-10-18T09:00:00.000Z',
  },
];

const DEFAULT_STATE: StorageState = {
  companies: INITIAL_COMPANIES,
  submissions: [],
  assignments: [],
  automationTasks: [],
  registeredStaff: [],
};

type Listener = (state: StorageState) => void;
const listeners = new Set<Listener>();

function notify(state: StorageState) {
  listeners.forEach((l) => {
    try {
      l(state);
    } catch (e) {
      console.error('Listener notification error:', e);
    }
  });
}

export function getStoredState(): StorageState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveState(DEFAULT_STATE);
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    const comps = Array.isArray(parsed.companies) && parsed.companies.length > 0
      ? parsed.companies
      : INITIAL_COMPANIES;

    return {
      companies: comps,
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
      automationTasks: Array.isArray(parsed.automationTasks) ? parsed.automationTasks : [],
      registeredStaff: Array.isArray(parsed.registeredStaff) ? parsed.registeredStaff : [],
    };
  } catch (err) {
    console.error('Failed to parse localStorage data:', err);
    return DEFAULT_STATE;
  }
}

export function saveState(state: StorageState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notify(state);
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function subscribeStorage(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addCompany(companyData: Omit<Company, 'id' | 'createdAt'>): Company {
  const state = getStoredState();
  const newCompany: Company = {
    ...companyData,
    id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  const updated: StorageState = {
    ...state,
    companies: [newCompany, ...state.companies],
  };
  saveState(updated);
  return newCompany;
}

export function updateCompany(id: string, updates: Partial<Company>): Company | null {
  const state = getStoredState();
  const index = state.companies.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const updatedCompany = { ...state.companies[index], ...updates };
  const updatedCompanies = [...state.companies];
  updatedCompanies[index] = updatedCompany;

  saveState({
    ...state,
    companies: updatedCompanies,
  });
  return updatedCompany;
}

export function deleteCompany(id: string): boolean {
  const state = getStoredState();
  const updatedCompanies = state.companies.filter((c) => c.id !== id);
  // Keep submissions or soft-filter
  saveState({
    ...state,
    companies: updatedCompanies,
  });
  return true;
}

export function findCompanyByCode(code: string): Company | undefined {
  const state = getStoredState();
  const cleanCode = code.trim().toLowerCase();
  return state.companies.find((c) => c.code.toLowerCase() === cleanCode && c.active);
}

export function findCompanyById(id: string): Company | undefined {
  const state = getStoredState();
  return state.companies.find((c) => c.id === id);
}

export function getOrCreateCompanyByCode(code: string): Company {
  const state = getStoredState();
  const cleanCode = code.trim().toLowerCase();
  const found = state.companies.find((c) => c.code.toLowerCase() === cleanCode);
  if (found) return found;

  // Auto-generate company so no user ever sees an empty error
  let compName = '다비치안경 ' + (cleanCode === 'store-gangnam' || cleanCode.includes('gangnam') ? '강남점' : cleanCode.toUpperCase());
  if (cleanCode.includes('daechi')) compName = '다비치안경 대치본점';
  if (cleanCode.includes('myeongdong') || cleanCode === 'davich-sx7r') compName = '다비치안경 명동점';
  if (cleanCode.includes('hq') || cleanCode.includes('main')) compName = '다비치안경 본사';

  const newComp: Company = {
    id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code: cleanCode,
    name: compName,
    category: cleanCode.includes('hq') ? 'HQ' : 'STORE',
    managerName: '지점 관리자',
    managerId: `admin_${cleanCode.replace(/[^a-z0-9]/g, '_')}`,
    managerPassword: '1234',
    contactEmail: `${cleanCode}@davichstore.com`,
    allowedDepartments: ['안경사 1팀 (시력검사)', '안경사 2팀 (콘택트/가공)', '고객서비스팀', '매장영업팀'],
    active: true,
    createdAt: new Date().toISOString(),
    targetRespondentCount: 15,
  };

  saveState({
    ...state,
    companies: [newComp, ...state.companies],
  });
  return newComp;
}

export interface AuthResult {
  success: boolean;
  submission?: AssessmentSubmission;
  message: string;
}

export function checkRespondentExists(companyId: string | null, name: string): boolean {
  if (!name.trim()) return false;
  const state = getStoredState();
  const cleanName = name.trim().toLowerCase();
  return state.submissions.some((s) => {
    const nameMatches = s.respondent.name.trim().toLowerCase() === cleanName;
    if (!nameMatches) return false;
    if (companyId && s.companyId !== companyId) return false;
    return true;
  });
}

export function authenticateRespondent(
  companyId: string | null,
  name: string,
  password: string
): AuthResult {
  const state = getStoredState();
  const cleanName = name.trim();
  const cleanPass = password.trim();

  if (!cleanName) {
    return { success: false, message: '성명(아이디)을 입력해 주세요.' };
  }
  if (!cleanPass) {
    return { success: false, message: '비밀번호를 입력해 주세요.' };
  }

  // Find candidate submission
  const match = state.submissions.find((s) => {
    const nameMatches = s.respondent.name.trim().toLowerCase() === cleanName.toLowerCase();
    if (!nameMatches) return false;
    if (companyId && s.companyId !== companyId) return false;
    return true;
  });

  if (!match) {
    return {
      success: false,
      message: `'${cleanName}' 님의 기존 설문 내역을 찾을 수 없습니다. 성명과 소속 기업을 확인해 주세요.`,
    };
  }

  // If previous submission has password set, verify match
  if (match.respondent.password && match.respondent.password !== cleanPass) {
    return {
      success: false,
      message: '비밀번호가 일치하지 않습니다. 다시 입력해 주세요.',
    };
  }

  return {
    success: true,
    submission: match,
    message: `'${cleanName}' 님의 이전 설문 응답을 성공적으로 불러왔습니다.`,
  };
}

const RESPONDENT_SESSION_KEY = 'davich_respondent_session_v1';

export interface RespondentSession {
  submissionId: string;
  companyId: string;
  name: string;
  employeeNumber: string;
}

export function getSavedRespondentSession(): RespondentSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RESPONDENT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveRespondentSession(session: RespondentSession | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      localStorage.removeItem(RESPONDENT_SESSION_KEY);
    } else {
      localStorage.setItem(RESPONDENT_SESSION_KEY, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Failed to save respondent session:', err);
  }
}

const ADMIN_SESSION_KEY = 'davich_admin_session_v1';

export function getSavedAdminSession(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAdminSession(user: AdminUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } else {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to save admin session:', err);
  }
}

export function authenticateAdmin(
  username: string,
  password: string,
  targetCompanyId?: string | null
): { success: boolean; user?: AdminUser; message: string } {
  const cleanUser = username.trim();
  const cleanPass = password.trim();

  if (!cleanUser) {
    return { success: false, message: '관리자 아이디를 입력해 주세요.' };
  }
  if (!cleanPass) {
    return { success: false, message: '비밀번호를 입력해 주세요.' };
  }

  // 1. Verify HQ Master Admin (본사 총괄 마스터 관리자: 한재환 / 1234)
  if (
    cleanUser.toLowerCase() === MASTER_ADMIN_ACCOUNT.username.toLowerCase() &&
    cleanPass === MASTER_ADMIN_ACCOUNT.password
  ) {
    const user: AdminUser = {
      id: 'master-admin',
      username: MASTER_ADMIN_ACCOUNT.username,
      name: MASTER_ADMIN_ACCOUNT.name,
      role: 'MASTER',
    };
    saveAdminSession(user);
    return {
      success: true,
      user,
      message: '본사 총괄 마스터 관리자(한재환)로 로그인되었습니다.',
    };
  }

  // 2. Verify Company Manager credentials
  const state = getStoredState();
  const normalizedUser = cleanUser.replace(/\s+/g, '').toLowerCase();

  // If logging into a specific company link section, strictly validate against that company
  if (targetCompanyId) {
    const targetComp = state.companies.find((c) => c.id === targetCompanyId);
    if (targetComp) {
      const isIdMatch =
        (targetComp.managerId && targetComp.managerId.toLowerCase() === cleanUser.toLowerCase()) ||
        (targetComp.managerId && targetComp.managerId.replace(/\s+/g, '').toLowerCase() === normalizedUser) ||
        (targetComp.code && targetComp.code.toLowerCase() === cleanUser.toLowerCase());

      if (!isIdMatch) {
        return {
          success: false,
          message: `[${targetComp.name}] 전용 링크의 관리자 아이디가 일치하지 않습니다. 해당 링크 생성 시 지정된 관리자 아이디를 입력해 주세요.`,
        };
      }

      const validPass = (targetComp.managerPassword || '1234').trim();
      if (cleanPass !== validPass) {
        return {
          success: false,
          message: `[${targetComp.name}] 관리자 비밀번호가 일치하지 않습니다.`,
        };
      }

      const user: AdminUser = {
        id: `admin_${targetComp.id}`,
        username: targetComp.managerId || targetComp.code,
        name: `${targetComp.name} 관리자`,
        role: 'COMPANY_MANAGER',
        companyId: targetComp.id,
        companyName: targetComp.name,
      };
      saveAdminSession(user);
      return {
        success: true,
        user,
        message: `${targetComp.name} 전용 링크 관리자로 로그인되었습니다.`,
      };
    }
  }

  const matchedComp = state.companies.find((c) => {
    if (c.managerId && c.managerId.toLowerCase() === cleanUser.toLowerCase()) return true;
    if (c.managerId && c.managerId.replace(/\s+/g, '').toLowerCase() === normalizedUser) return true;
    if (c.code && c.code.toLowerCase() === cleanUser.toLowerCase()) return true;
    if (c.name && c.name.replace(/\s+/g, '').toLowerCase() === normalizedUser) return true;
    if (c.managerName && c.managerName.toLowerCase() === cleanUser.toLowerCase()) return true;
    return false;
  });

  if (matchedComp) {
    const validPass = (matchedComp.managerPassword || '1234').trim();
    if (cleanPass === validPass) {
      const user: AdminUser = {
        id: `admin_${matchedComp.id}`,
        username: matchedComp.managerId || matchedComp.code,
        name: `${matchedComp.name} 관리자`,
        role: 'COMPANY_MANAGER',
        companyId: matchedComp.id,
        companyName: matchedComp.name,
      };
      saveAdminSession(user);
      return {
        success: true,
        user,
        message: `${matchedComp.name} 관리자로 로그인되었습니다.`,
      };
    } else {
      return {
        success: false,
        message: '비밀번호가 일치하지 않습니다.',
      };
    }
  }

  return {
    success: false,
    message: '등록된 관리자 계정을 찾을 수 없습니다. 본사 관리자 또는 기업별 지정 관리자 계정을 확인해 주세요.',
  };
}

export function saveSubmission(submission: AssessmentSubmission): AssessmentSubmission {
  const state = getStoredState();

  // Check if a submission already exists for this respondent (by id or by matching companyId + name)
  const existingIndex = state.submissions.findIndex(
    (s) => s.id === submission.id || (s.companyId === submission.companyId && s.respondent.name.trim().toLowerCase() === submission.respondent.name.trim().toLowerCase())
  );

  let updatedSubmissions = [...state.submissions];
  let finalSubmission = { ...submission };

  if (existingIndex !== -1) {
    // Preserve original ID and creation time if updating
    const existing = state.submissions[existingIndex];
    finalSubmission.id = existing.id;
    finalSubmission.submittedAt = existing.submittedAt;
    finalSubmission.updatedAt = new Date().toISOString();
    updatedSubmissions[existingIndex] = finalSubmission;
  } else {
    updatedSubmissions = [finalSubmission, ...updatedSubmissions];
  }

  // Handle AutomationTask (update existing task for this submission or prepend new)
  let updatedAutomationTasks = [...state.automationTasks];
  if (finalSubmission.answers.automation && !finalSubmission.answers.automation.hasNoTask && finalSubmission.answers.automation.taskName) {
    const auto = finalSubmission.answers.automation;
    const { priorityScore, expectedWeeklyHoursSaved } = calculateAutomationPriority(
      auto.weeklyCount || 1,
      auto.timePerTaskMinutes || 30,
      auto.headcount || 1,
      auto.securityRisk || 'NO',
    );

    const existingTaskIndex = updatedAutomationTasks.findIndex(
      (t) => t.respondentId === finalSubmission.id || (t.companyId === finalSubmission.companyId && t.respondentName.trim().toLowerCase() === finalSubmission.respondent.name.trim().toLowerCase())
    );

    const taskRecord: AutomationTask = {
      id: existingTaskIndex !== -1 ? updatedAutomationTasks[existingTaskIndex].id : `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: finalSubmission.companyId,
      companyName: finalSubmission.respondent.companyName,
      respondentId: finalSubmission.id,
      respondentName: finalSubmission.respondent.name,
      department: finalSubmission.respondent.department,
      taskName: auto.taskName || '신규 자동화 과제',
      weeklyCount: auto.weeklyCount || 1,
      timePerTaskMinutes: auto.timePerTaskMinutes || 30,
      headcount: auto.headcount || 1,
      expectedWeeklyHoursSaved,
      securityRisk: auto.securityRisk || 'NO',
      desiredImprovement: auto.desiredImprovement || '',
      supportNeeded: auto.supportNeeded || '',
      priorityScore,
      status: auto.securityRisk === 'YES' ? 'SECURITY_REVIEW' : 'NEW',
      createdAt: existingTaskIndex !== -1 ? updatedAutomationTasks[existingTaskIndex].createdAt : new Date().toISOString(),
    };

    if (existingTaskIndex !== -1) {
      updatedAutomationTasks[existingTaskIndex] = taskRecord;
    } else {
      updatedAutomationTasks = [taskRecord, ...updatedAutomationTasks];
    }
  }

  // Handle Training Assignment recommendation
  let updatedAssignments = [...state.assignments];
  const recommendedCourseId =
    finalSubmission.scores.safetyScore < 60
      ? 'COURSE_03'
      : finalSubmission.scores.capabilityScore < 50
      ? 'COURSE_01'
      : 'COURSE_04';

  const existingAssignIndex = updatedAssignments.findIndex(
    (a) => a.respondentId === finalSubmission.id || (a.companyId === finalSubmission.companyId && a.respondentName.trim().toLowerCase() === finalSubmission.respondent.name.trim().toLowerCase())
  );

  const defaultAssignment: TrainingAssignment = {
    id: existingAssignIndex !== -1 ? updatedAssignments[existingAssignIndex].id : `assign_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId: finalSubmission.companyId,
    respondentId: finalSubmission.id,
    respondentName: finalSubmission.respondent.name,
    courseId: recommendedCourseId,
    assignedDate: existingAssignIndex !== -1 ? updatedAssignments[existingAssignIndex].assignedDate : new Date().toISOString().split('T')[0],
    stage30: existingAssignIndex !== -1 ? updatedAssignments[existingAssignIndex].stage30 : 'IN_PROGRESS',
    stage60: existingAssignIndex !== -1 ? updatedAssignments[existingAssignIndex].stage60 : 'NOT_STARTED',
    stage90: existingAssignIndex !== -1 ? updatedAssignments[existingAssignIndex].stage90 : 'NOT_STARTED',
    memo: `역량 점수 ${finalSubmission.scores.capabilityScore}점, ${finalSubmission.scores.preference.typeCode || '성향 진단'} 맞춤 코스`,
  };

  if (existingAssignIndex !== -1) {
    updatedAssignments[existingAssignIndex] = defaultAssignment;
  } else {
    updatedAssignments = [defaultAssignment, ...updatedAssignments];
  }

  const updatedState: StorageState = {
    ...state,
    submissions: updatedSubmissions,
    automationTasks: updatedAutomationTasks,
    assignments: updatedAssignments,
  };

  saveState(updatedState);
  return finalSubmission;
}

export function deleteSubmission(id: string): boolean {
  const state = getStoredState();
  const updatedSubmissions = state.submissions.filter((s) => s.id !== id);
  const updatedTasks = state.automationTasks.filter((t) => t.respondentId !== id);
  const updatedAssignments = state.assignments.filter((a) => a.respondentId !== id);
  saveState({
    ...state,
    submissions: updatedSubmissions,
    automationTasks: updatedTasks,
    assignments: updatedAssignments,
  });
  return true;
}

export function addRegisteredStaff(
  staff: Omit<PreRegisteredStaff, 'id' | 'registeredAt'>
): PreRegisteredStaff {
  const state = getStoredState();
  const current = state.registeredStaff || [];
  const newStaff: PreRegisteredStaff = {
    ...staff,
    id: `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    registeredAt: new Date().toISOString(),
  };
  saveState({
    ...state,
    registeredStaff: [newStaff, ...current],
  });
  return newStaff;
}

export function deleteRegisteredStaff(id: string): boolean {
  const state = getStoredState();
  const current = state.registeredStaff || [];
  saveState({
    ...state,
    registeredStaff: current.filter((s) => s.id !== id),
  });
  return true;
}

export function updateAutomationTask(
  taskId: string,
  updates: Partial<AutomationTask>,
): AutomationTask | null {
  const state = getStoredState();
  const index = state.automationTasks.findIndex((t) => t.id === taskId);
  if (index === -1) return null;

  const updated = { ...state.automationTasks[index], ...updates };
  const list = [...state.automationTasks];
  list[index] = updated;

  saveState({
    ...state,
    automationTasks: list,
  });
  return updated;
}

export function updateTrainingAssignment(
  assignmentId: string,
  updates: Partial<TrainingAssignment>,
): TrainingAssignment | null {
  const state = getStoredState();
  const index = state.assignments.findIndex((a) => a.id === assignmentId);
  if (index === -1) return null;

  const updated = { ...state.assignments[index], ...updates };
  const list = [...state.assignments];
  list[index] = updated;

  saveState({
    ...state,
    assignments: list,
  });
  return updated;
}

export function clearAllData() {
  saveState({
    companies: [],
    submissions: [],
    assignments: [],
    automationTasks: [],
  });
}

export function loadSampleDataset() {
  // 4 realistic enterprise companies
  const sampleCompanies: Company[] = [
    {
      id: 'comp_sample_hq',
      code: 'davich-hq',
      name: '다비치안경 본사',
      category: 'HQ',
      managerName: '김태윤 실장 (경영지원실)',
      managerId: 'hq_admin',
      managerPassword: '1234',
      contactEmail: 'tykim@davich.com',
      allowedDepartments: ['경영지원팀', '마케팅전략팀', '가맹운영팀', '교육개발팀', 'IT혁신팀'],
      active: true,
      targetRespondentCount: 45,
      createdAt: '2026-10-10T09:00:00.000Z',
    },
    {
      id: 'comp_sample_gangnam',
      code: 'store-daechi',
      name: '다비치안경 대치본점 (직영점)',
      category: 'STORE',
      managerName: '박서현 원장',
      managerId: 'daechi_admin',
      managerPassword: '1234',
      contactEmail: 'daechi@davichstore.com',
      allowedDepartments: ['안경사 1팀 (시력검사)', '안경사 2팀 (콘택트/가공)', '고객서비스팀'],
      active: true,
      targetRespondentCount: 15,
      createdAt: '2026-10-11T10:00:00.000Z',
    },
    {
      id: 'comp_sample_busan',
      code: 'store-seomyeon',
      name: '다비치안경 부산서면점 (가맹점)',
      category: 'STORE',
      managerName: '이지훈 점장',
      managerId: 'seomyeon_admin',
      managerPassword: '1234',
      contactEmail: 'seomyeon@davichstore.com',
      allowedDepartments: ['매장영업팀', '전문검안팀', '조제가공실'],
      active: true,
      targetRespondentCount: 12,
      createdAt: '2026-10-12T11:30:00.000Z',
    },
    {
      id: 'comp_sample_tech',
      code: 'davich-tech',
      name: '다비치테크 (전산·관계사)',
      category: 'AFFILIATE',
      managerName: '최성민 수석연구원',
      managerId: 'tech_admin',
      managerPassword: '1234',
      contactEmail: 'smchoi@davichtech.kr',
      allowedDepartments: ['ERP개발팀', '데이터플랫폼팀', '인프라보안팀'],
      active: true,
      targetRespondentCount: 18,
      createdAt: '2026-10-13T14:00:00.000Z',
    },
  ];

  // Helper to generate simulated submissions
  const sampleSubmissions: AssessmentSubmission[] = [];
  const sampleTasks: AutomationTask[] = [];
  const sampleAssignments: TrainingAssignment[] = [];

  const rawStaffList = [
    { name: '이수연', compId: 'comp_sample_hq', compName: '다비치안경 본사', dept: '마케팅전략팀', pos: '과장', num: 'HQ-1024', pref: 'ECIP', cap: 78, safe: 85 },
    { name: '정동진', compId: 'comp_sample_hq', compName: '다비치안경 본사', dept: '경영지원팀', pos: '대리', num: 'HQ-1055', pref: 'RAVP', cap: 64, safe: 90 },
    { name: '윤지혜', compId: 'comp_sample_hq', compName: '다비치안경 본사', dept: 'IT혁신팀', pos: '팀장', num: 'HQ-1008', pref: 'EAVP', cap: 92, safe: 95 },
    { name: '한소라', compId: 'comp_sample_hq', compName: '다비치안경 본사', dept: '교육개발팀', pos: '주임', num: 'HQ-1072', pref: 'RCVP', cap: 58, safe: 75 },
    { name: '김민준', compId: 'comp_sample_gangnam', compName: '다비치안경 대치본점 (직영점)', dept: '안경사 1팀 (시력검사)', pos: '수석안경사', num: 'ST-2001', pref: 'RAVO', cap: 72, safe: 88 },
    { name: '오세린', compId: 'comp_sample_gangnam', compName: '다비치안경 대치본점 (직영점)', dept: '안경사 2팀 (콘택트/가공)', pos: '안경사', num: 'ST-2014', pref: 'RCVO', cap: 52, safe: 70 },
    { name: '배준우', compId: 'comp_sample_gangnam', compName: '다비치안경 대치본점 (직영점)', dept: '고객서비스팀', pos: '매니저', num: 'ST-2030', pref: 'ECVO', cap: 60, safe: 65 },
    { name: '조유나', compId: 'comp_sample_busan', compName: '다비치안경 부산서면점 (가맹점)', dept: '전문검안팀', pos: '책임안경사', num: 'BS-3005', pref: 'RAVP', cap: 68, safe: 92 },
    { name: '강태석', compId: 'comp_sample_busan', compName: '다비치안경 부산서면점 (가맹점)', dept: '매장영업팀', pos: '주임', num: 'BS-3011', pref: 'EAVO', cap: 56, safe: 60 },
    { name: '신다혜', compId: 'comp_sample_tech', compName: '다비치테크 (전산·관계사)', dept: '데이터플랫폼팀', pos: '선임연구원', num: 'TC-4009', pref: 'EAIP', cap: 88, safe: 85 },
    { name: '임도현', compId: 'comp_sample_tech', compName: '다비치테크 (전산·관계사)', dept: 'ERP개발팀', pos: '연구원', num: 'TC-4022', pref: 'RAIP', cap: 75, safe: 80 },
  ];

  rawStaffList.forEach((staff, index) => {
    const subId = `sub_sample_${index + 1}`;
    // Construct mock answers
    const capabilityAnswers: Record<string, number> = {};
    for (let c = 1; c <= 20; c++) {
      const qId = `C${String(c).padStart(2, '0')}`;
      capabilityAnswers[qId] = Math.max(1, Math.min(5, Math.round(staff.cap / 25 + (c % 2 === 0 ? 0.3 : -0.3))));
    }

    // 15 실전 문제 풀이 응답 생성
    const quizAnswers: Record<string, number> = {};
    const targetCorrect = Math.max(6, Math.min(15, Math.round((staff.cap / 100) * 15)));
    for (let q = 1; q <= 15; q++) {
      const qId = `Q${String(q).padStart(2, '0')}`;
      // Q01..Q15 correctAnswer is 2 for all except Q02 (1) and Q09 (1)
      const correctChoice = (q === 2 || q === 9) ? 1 : 2;
      if (q <= targetCorrect) {
        quizAnswers[qId] = correctChoice;
      } else {
        quizAnswers[qId] = correctChoice === 1 ? 2 : 1; // Wrong choice
      }
    }

    const preferenceAnswers: Record<string, 1 | 2> = {};
    const pCode = staff.pref;
    const isE = pCode[0] === 'E';
    const isC = pCode[1] === 'C';
    const isI = pCode[2] === 'I';
    const isO = pCode[3] === 'O';

    // 6 questions per axis (24 questions total)
    ['T01', 'T05', 'T09', 'T13', 'T17', 'T21'].forEach((id) => (preferenceAnswers[id] = isE ? 2 : 1));
    ['T02', 'T06', 'T10', 'T14', 'T18', 'T22'].forEach((id) => (preferenceAnswers[id] = isC ? 2 : 1));
    ['T03', 'T07', 'T11', 'T15', 'T19', 'T23'].forEach((id) => (preferenceAnswers[id] = isI ? 2 : 1));
    ['T04', 'T08', 'T12', 'T16', 'T20', 'T24'].forEach((id) => (preferenceAnswers[id] = isO ? 2 : 1));

    const usageAnswers = {
      U01: staff.cap > 70 ? 'DAILY' : 'WEEKLY_1_2',
      U02: ['CHATGPT', 'GEMINI'],
      U03: ['DOC_WRITING', 'DATA_ANALYSIS'],
      U04: staff.cap > 80 ? 'COMPANY_PAID' : 'FREE_ONLY',
      U05: 'PC_WEB',
      U06: 'LACK_SKILL',
      U07: staff.cap > 70 ? '31_60_MIN' : '16_30_MIN',
      U08: 'PROMPT_WORKSHOP',
    };

    const scores = evaluateAssessmentScores(usageAnswers, capabilityAnswers, preferenceAnswers, quizAnswers);
    // Override scores with calibrated numbers
    scores.capabilityScore = staff.cap;
    scores.safetyScore = staff.safe;

    const submission: AssessmentSubmission = {
      id: subId,
      companyId: staff.compId,
      respondent: {
        name: staff.name,
        password: '1234',
        employeeNumber: staff.num,
        companyId: staff.compId,
        companyName: staff.compName,
        department: staff.dept,
        position: staff.pos,
        jobFunction: staff.dept.includes('안경') ? '전문안경사' : '사무행정/기획',
      },
      submittedAt: new Date(Date.now() - (11 - index) * 3600000 * 8).toISOString(),
      answers: {
        usage: usageAnswers,
        quiz: quizAnswers,
        capability: capabilityAnswers,
        preference: preferenceAnswers,
        automation: index < 6 ? {
          taskName: index === 0 ? '매장별 프로모션 카드뉴스 및 블로그 초안 자동 생성' :
                    index === 1 ? '월말 가맹점 로열티 및 정산 대사 수작업 검증' :
                    index === 2 ? '사내 ERP 오류 로그 분석 및 일일 점검 리포트' :
                    index === 3 ? '신입 안경사 직무 교육 평가표 및 피드백 작성' :
                    index === 4 ? '안경/렌즈 처방전 규격 입력 및 누락 검사' : '고객 안경 수령 알림톡 템플릿 맞춤 발송',
          weeklyCount: index === 1 ? 4 : 5,
          timePerTaskMinutes: index === 1 ? 120 : 45,
          headcount: index === 0 ? 3 : 2,
          securityRisk: index === 1 ? 'YES' : 'NO',
          desiredImprovement: '반복 입력 오류 축소 및 주당 소요 시간 3~5시간 단축',
          supportNeeded: 'AI 프롬프트 템플릿 및 사내 가이드라인 지원',
        } : undefined,
      },
      scores,
    };

    sampleSubmissions.push(submission);

    // Automation task record
    if (submission.answers.automation && submission.answers.automation.taskName) {
      const auto = submission.answers.automation;
      const { priorityScore, expectedWeeklyHoursSaved } = calculateAutomationPriority(
        auto.weeklyCount || 1,
        auto.timePerTaskMinutes || 30,
        auto.headcount || 1,
        auto.securityRisk || 'NO',
      );

      sampleTasks.push({
        id: `task_sample_${index + 1}`,
        companyId: staff.compId,
        companyName: staff.compName,
        respondentId: subId,
        respondentName: staff.name,
        department: staff.dept,
        taskName: auto.taskName || '신규 자동화 과제',
        weeklyCount: auto.weeklyCount || 1,
        timePerTaskMinutes: auto.timePerTaskMinutes || 30,
        headcount: auto.headcount || 1,
        expectedWeeklyHoursSaved,
        securityRisk: auto.securityRisk || 'NO',
        desiredImprovement: auto.desiredImprovement || '',
        supportNeeded: auto.supportNeeded || '',
        priorityScore,
        status: auto.securityRisk === 'YES' ? 'SECURITY_REVIEW' : index === 2 ? 'PILOT_RUNNING' : 'REVIEWING',
        createdAt: submission.submittedAt,
      });
    }

    // Training assignment
    sampleAssignments.push({
      id: `assign_sample_${index + 1}`,
      companyId: staff.compId,
      respondentId: subId,
      respondentName: staff.name,
      courseId: staff.safe < 75 ? 'COURSE_03' : staff.cap < 65 ? 'COURSE_01' : 'COURSE_04',
      assignedDate: '2026-10-14',
      stage30: index % 2 === 0 ? 'DONE' : 'IN_PROGRESS',
      stage60: index === 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      stage90: 'NOT_STARTED',
      memo: `${staff.pref} 성향 추천 과정`,
    });
  });

  const fullSampleState: StorageState = {
    companies: sampleCompanies,
    submissions: sampleSubmissions,
    assignments: sampleAssignments,
    automationTasks: sampleTasks,
  };

  saveState(fullSampleState);
  return fullSampleState;
}

export function exportSubmissionsToCsv(companyIdFilter?: string): string {
  const state = getStoredState();
  const list = companyIdFilter && companyIdFilter !== 'ALL'
    ? state.submissions.filter((s) => s.companyId === companyIdFilter)
    : state.submissions;

  const headers = [
    '제출일시',
    '기업/사업장',
    '성명',
    '사번',
    '부서',
    '직책',
    'AI역량점수(0-100)',
    'AI안전점수(0-100)',
    '실전문제풀이점수(0-100)',
    '실전문항정답수(15문항)',
    '16유형코드',
    '사용빈도',
    '일체감절감시간',
    '자동화제안과제',
    '보안위험성',
  ];

  const rows = list.map((s) => {
    const auto = s.answers.automation;
    return [
      `"${s.submittedAt.replace('T', ' ').substring(0, 19)}"`,
      `"${s.respondent.companyName}"`,
      `"${s.respondent.name}"`,
      `"${s.respondent.employeeNumber}"`,
      `"${s.respondent.department}"`,
      `"${s.respondent.position}"`,
      s.scores.capabilityScore,
      s.scores.safetyScore,
      s.scores.quizScore ?? '-',
      s.scores.quizCorrectCount !== undefined ? `${s.scores.quizCorrectCount}/15` : '-',
      `"${s.scores.preference.typeCode || '판정보류'}"`,
      `"${s.scores.usageFrequency}"`,
      `"${s.scores.estimatedHoursSavedDaily}"`,
      `"${auto?.taskName ? auto.taskName.replace(/"/g, '""') : '없음'}"`,
      `"${auto?.securityRisk || '-'}"`,
    ].join(',');
  });

  // UTF-8 BOM
  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}
