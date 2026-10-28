export type CompanyCategory = 'HQ' | 'STORE' | 'AFFILIATE' | 'OTHER';

export interface Company {
  id: string;
  code: string; // URL slug parameter (e.g. davich-hq, store-gangnam)
  name: string;
  category: CompanyCategory;
  managerName?: string;
  managerId?: string; // 기업별 관리자 아이디
  managerPassword?: string; // 기업별 관리자 비밀번호
  contactEmail?: string;
  allowedDepartments: string[];
  active: boolean;
  createdAt: string;
  targetRespondentCount?: number;
}

export interface AdminUser {
  id: string;
  username: string; // ID (e.g., '한재환' or store admin id)
  name: string;
  role: 'MASTER' | 'COMPANY_MANAGER';
  companyId?: string;
  companyName?: string;
}

export const MASTER_ADMIN_ACCOUNT = {
  username: '한재환',
  password: '1234',
  name: '한재환 마스터 관리자',
  role: 'MASTER' as const,
};

export const MASTER_ADMIN_ACCOUNTS = [
  {
    username: '한재환',
    password: '1234',
    name: '한재환 마스터 관리자',
    role: 'MASTER' as const,
  },
  {
    username: '다비치',
    password: '1234',
    name: '다비치 마스터 관리자',
    role: 'MASTER' as const,
  },
];

export interface RespondentProfile {
  name: string; // Acts as User ID
  password?: string; // Respondent password for resuming/editing
  employeeNumber: string;
  companyId: string;
  companyName: string;
  department: string;
  position: string;
  jobFunction: string;
}

export interface PreRegisteredStaff {
  id: string;
  companyId: string;
  name: string;
  employeeNumber: string;
  department: string;
  position: string;
  registeredAt: string;
}

export type AxisCode = 'RE' | 'AC' | 'VI' | 'PO';

export interface AxisScore {
  axis: AxisCode;
  left: string;
  right: string;
  leftCount: number;
  rightCount: number;
  status: 'RESOLVED' | 'TIED';
  letter: string | null; // e.g. 'R', 'E' or null if tied
}

export interface PreferenceResult {
  status: 'RESOLVED' | 'PENDING_TIE';
  typeCode: string | null; // e.g. "RAVP" or null if any axis is tied
  partialCode: string; // e.g. "R?VP"
  tiedAxes: AxisCode[];
  axes: AxisScore[];
}

export interface QuizQuestionOption {
  number: number;
  text: string;
}

export interface QuizQuestion {
  id: string; // Q01 ~ Q15
  category: 'PROMPT' | 'VERIFICATION' | 'SECURITY' | 'AUTOMATION' | 'ETHICS';
  categoryLabel: string;
  scenario: string; // 실무 상황 시나리오
  question: string;
  options: QuizQuestionOption[];
  correctAnswer: number; // 1, 2, 3, or 4
  explanation: string; // 정답 및 오답 상세 해설
  davichTip?: string; // 다비치 현장 적용 팁
}

export interface AssessmentScores {
  capabilityScore: number; // 0 ~ 100
  safetyScore: number;     // 0 ~ 100
  quizScore?: number;      // 0 ~ 100 (15문항 실전문항 정답 환산 점수)
  quizCorrectCount?: number; // 0 ~ 15
  quizTotalCount?: number;   // 15
  quizDetails?: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
  }[];
  usageFrequency: string;  // U01 value label
  estimatedHoursSavedDaily: string; // U07 value label
  preference: PreferenceResult;
}

export interface AssessmentSubmission {
  id: string;
  companyId: string;
  respondent: RespondentProfile;
  submittedAt: string;
  updatedAt?: string;
  answers: {
    usage: Record<string, string | string[]>; // U01~U08
    quiz?: Record<string, number>;            // Q01~Q15 (선택한 번호 1~4)
    capability: Record<string, number>;       // C01~C20 (1..5)
    preference: Record<string, 1 | 2>;         // T01~T24 (1 or 2)
    automation?: {
      hasNoTask?: boolean;
      taskName?: string;
      weeklyCount?: number;
      timePerTaskMinutes?: number;
      headcount?: number;
      desiredImprovement?: string;
      securityRisk?: 'YES' | 'NO' | 'UNSURE';
      supportNeeded?: string;
    };
  };
  scores: AssessmentScores;
}

export interface PreferenceTypeDetail {
  code: string;
  name: string;
  tagline: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendedPractices: string[];
  roadmap: {
    stage30: string;
    stage60: string;
    stage90: string;
  };
}

export interface TrainingCourse {
  id: string;
  title: string;
  badge: string;
  targetAudience: string;
  duration: string;
  description: string;
  coreObjectives: string[];
}

export interface TrainingAssignment {
  id: string;
  companyId: string;
  respondentId: string;
  respondentName: string;
  courseId: string;
  assignedDate: string;
  stage30: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  stage60: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  stage90: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  memo?: string;
}

export type AutomationStatus =
  | 'NEW'
  | 'REVIEWING'
  | 'SECURITY_REVIEW'
  | 'PILOT_READY'
  | 'PILOT_RUNNING'
  | 'VERIFIED'
  | 'EXPANDED'
  | 'ON_HOLD';

export interface AutomationTask {
  id: string;
  companyId: string;
  companyName: string;
  respondentId: string;
  respondentName: string;
  department: string;
  taskName: string;
  weeklyCount: number;
  timePerTaskMinutes: number;
  headcount: number;
  expectedWeeklyHoursSaved: number;
  verifiedWeeklyHoursSaved?: number;
  securityRisk: 'YES' | 'NO' | 'UNSURE';
  desiredImprovement: string;
  supportNeeded: string;
  priorityScore: number; // 0 ~ 100
  status: AutomationStatus;
  createdAt: string;
  reviewNotes?: string;
}
