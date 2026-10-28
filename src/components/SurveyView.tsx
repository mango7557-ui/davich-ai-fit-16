import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  Info,
  Clock,
  HelpCircle,
  Briefcase,
  ChevronRight,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  UserCheck,
  UserPlus,
  RefreshCw,
  GraduationCap,
  Lightbulb,
  Check,
  BookOpen,
} from 'lucide-react';
import { Company, AssessmentSubmission, RespondentProfile } from '../types/davich';
import {
  USAGE_QUESTIONS,
  CAPABILITY_QUESTIONS,
  PREFERENCE_QUESTIONS,
  QUIZ_QUESTIONS,
} from '../data/questionBank';
import { evaluateAssessmentScores } from '../lib/assessmentEngine';
import {
  saveSubmission,
  authenticateRespondent,
  checkRespondentExists,
  getOrCreateCompanyByCode,
  INITIAL_COMPANIES,
} from '../lib/storage';

interface SurveyViewProps {
  companies: Company[];
  selectedCompanyCode: string | null;
  onSubmissionComplete: (submission: AssessmentSubmission) => void;
  onNavigateToLinks: () => void;
  isDedicatedMode?: boolean;
}

export const SurveyView: React.FC<SurveyViewProps> = ({
  companies,
  selectedCompanyCode,
  onSubmissionComplete,
  onNavigateToLinks,
  isDedicatedMode = false,
}) => {
  // Matched company
  const [currentCompany, setCurrentCompany] = useState<Company | null>(() => {
    if (selectedCompanyCode) {
      return getOrCreateCompanyByCode(selectedCompanyCode);
    }
    return companies.length > 0 ? companies[0] : INITIAL_COMPANIES[0];
  });

  // Survey stepper (0: Profile, 1: Usage, 2: Capability, 3: Preference, 4: Automation, 5: Review)
  const [currentStep, setCurrentStep] = useState<number>(0);
  // In dedicated mode, start directly on survey questions/profile
  const [isStarted, setIsStarted] = useState<boolean>(isDedicatedMode || Boolean(selectedCompanyCode));

  // Profile & Auth fields
  const [authMode, setAuthMode] = useState<'NEW' | 'RESUME'>('NEW');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [isCustomPos, setIsCustomPos] = useState(false);
  const [jobFunction, setJobFunction] = useState('');
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentNoSensitive, setConsentNoSensitive] = useState(false);

  // Resume / Edit state
  const [loadedSubmissionId, setLoadedSubmissionId] = useState<string | null>(null);
  const [isLoadedFromPrevious, setIsLoadedFromPrevious] = useState(false);
  const [loginNameInput, setLoginNameInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Answers state
  const [usageAnswers, setUsageAnswers] = useState<Record<string, any>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [capabilityAnswers, setCapabilityAnswers] = useState<Record<string, number>>({});
  const [preferenceAnswers, setPreferenceAnswers] = useState<Record<string, 1 | 2>>({});

  // Automation state
  const [hasNoTask, setHasNoTask] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [weeklyCount, setWeeklyCount] = useState<number>(3);
  const [timePerTaskMinutes, setTimePerTaskMinutes] = useState<number>(45);
  const [headcount, setHeadcount] = useState<number>(2);
  const [desiredImprovement, setDesiredImprovement] = useState('');
  const [securityRisk, setSecurityRisk] = useState<'YES' | 'NO' | 'UNSURE'>('NO');
  const [supportNeeded, setSupportNeeded] = useState('');

  // Validation errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-bind company when prop or URL changes
  useEffect(() => {
    if (selectedCompanyCode) {
      let found = companies.find((c) => c.code.toLowerCase() === selectedCompanyCode.toLowerCase());
      if (!found) {
        found = getOrCreateCompanyByCode(selectedCompanyCode);
      }
      if (found) {
        setCurrentCompany(found);
        if (found.allowedDepartments && found.allowedDepartments.length > 0) {
          setDepartment((prev) =>
            prev && found!.allowedDepartments.includes(prev) ? prev : found!.allowedDepartments[0]
          );
        }
        if (found.allowedPositions && found.allowedPositions.length > 0) {
          setPosition((prev) =>
            prev && found!.allowedPositions!.includes(prev) ? prev : found!.allowedPositions![0]
          );
        }
        setIsStarted(true); // Open survey questions directly
      }
    } else if (companies.length > 0 && !currentCompany) {
      setCurrentCompany(companies[0]);
      if (companies[0].allowedDepartments && companies[0].allowedDepartments.length > 0) {
        setDepartment((prev) => prev || companies[0].allowedDepartments[0]);
      }
      if (companies[0].allowedPositions && companies[0].allowedPositions.length > 0) {
        setPosition((prev) => prev || companies[0].allowedPositions![0]);
      }
    } else if (!currentCompany) {
      const fallback = INITIAL_COMPANIES[0];
      setCurrentCompany(fallback);
      if (fallback.allowedDepartments && fallback.allowedDepartments.length > 0) {
        setDepartment((prev) => prev || fallback.allowedDepartments[0]);
      }
      if (fallback.allowedPositions && fallback.allowedPositions.length > 0) {
        setPosition((prev) => prev || fallback.allowedPositions![0]);
      }
    }
  }, [selectedCompanyCode, companies]);

  // Handle single and multiple usage answers
  const handleUsageSingle = (qId: string, val: string) => {
    setUsageAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleUsageMultiple = (qId: string, val: string) => {
    setUsageAnswers((prev) => {
      const currentList: string[] = Array.isArray(prev[qId]) ? prev[qId] : [];
      if (val === 'NONE') {
        return { ...prev, [qId]: ['NONE'] };
      }
      const filtered = currentList.filter((item) => item !== 'NONE');
      if (filtered.includes(val)) {
        return { ...prev, [qId]: filtered.filter((item) => item !== val) };
      } else {
        return { ...prev, [qId]: [...filtered, val] };
      }
    });
  };

  // Handle 15 practical quiz choices
  const handleQuizChoice = (qId: string, optionNumber: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qId]: optionNumber }));
  };

  // Login / Resume handler for returning employees
  const handleLoginResume = () => {
    setLoginError(null);
    setLoginSuccess(null);
    setErrorMsg(null);

    const cleanName = loginNameInput.trim();
    const cleanPass = loginPasswordInput.trim();

    if (!cleanName) {
      setLoginError('성명(아이디)을 입력해 주세요.');
      return;
    }
    if (!cleanPass) {
      setLoginError('비밀번호를 입력해 주세요.');
      return;
    }

    const authRes = authenticateRespondent(
      currentCompany?.id || null,
      cleanName,
      cleanPass
    );

    if (!authRes.success || !authRes.submission) {
      setLoginError(authRes.message);
      return;
    }

    const sub = authRes.submission;
    // Restore profile
    setName(sub.respondent.name);
    setPassword(sub.respondent.password || cleanPass);
    setPasswordConfirm(sub.respondent.password || cleanPass);
    setEmployeeNumber(sub.respondent.employeeNumber);
    setDepartment(sub.respondent.department);
    setPosition(sub.respondent.position);
    setJobFunction(sub.respondent.jobFunction || '');
    setConsentPrivacy(true);
    setConsentNoSensitive(true);

    // Restore all answers
    if (sub.answers.usage) setUsageAnswers(sub.answers.usage);
    if (sub.answers.quiz) setQuizAnswers(sub.answers.quiz);
    if (sub.answers.capability) setCapabilityAnswers(sub.answers.capability);
    if (sub.answers.preference) setPreferenceAnswers(sub.answers.preference);

    if (sub.answers.automation) {
      const auto = sub.answers.automation;
      setHasNoTask(Boolean(auto.hasNoTask));
      setTaskName(auto.taskName || '');
      setWeeklyCount(auto.weeklyCount || 3);
      setTimePerTaskMinutes(auto.timePerTaskMinutes || 45);
      setHeadcount(auto.headcount || 2);
      setDesiredImprovement(auto.desiredImprovement || '');
      setSecurityRisk(auto.securityRisk || 'NO');
      setSupportNeeded(auto.supportNeeded || '');
    }

    setLoadedSubmissionId(sub.id);
    setIsLoadedFromPrevious(true);
    setLoginSuccess(
      `'${sub.respondent.name}' 님의 기존 응답이 성공적으로 복원되었습니다. 이제 수정 및 다음 단계 작성을 진행하실 수 있습니다.`
    );
  };

  const handleResetToNew = () => {
    setIsLoadedFromPrevious(false);
    setLoadedSubmissionId(null);
    setLoginSuccess(null);
    setLoginError(null);
    setName('');
    setPassword('');
    setPasswordConfirm('');
    setEmployeeNumber('');
    setPosition('');
    setJobFunction('');
    setUsageAnswers({});
    setQuizAnswers({});
    setCapabilityAnswers({});
    setPreferenceAnswers({});
    setHasNoTask(false);
    setTaskName('');
    setAuthMode('NEW');
  };

  // Step 0 validation
  const validateStep0 = () => {
    if (!currentCompany) {
      setErrorMsg('소속 기업을 선택해 주세요.');
      return false;
    }
    if (!name.trim()) {
      setErrorMsg('성명(아이디)을 입력해 주세요.');
      return false;
    }
    if (!password.trim()) {
      setErrorMsg('재접속 시 본인 확인용 비밀번호를 입력해 주세요.');
      return false;
    }
    if (password.trim().length < 2) {
      setErrorMsg('비밀번호는 최소 2자리 이상 입력해 주세요.');
      return false;
    }
    if (authMode === 'NEW' && !isLoadedFromPrevious && password !== passwordConfirm) {
      setErrorMsg('설정하신 비밀번호와 비밀번호 확인 값이 일치하지 않습니다.');
      return false;
    }
    if (!employeeNumber.trim()) {
      setErrorMsg('사번 또는 고유 식별 번호를 입력해 주세요.');
      return false;
    }
    if (!department.trim()) {
      setErrorMsg('소속 부서/팀을 선택하거나 입력해 주세요.');
      return false;
    }
    if (!position.trim()) {
      setErrorMsg('직책/직급을 입력해 주세요.');
      return false;
    }
    if (!consentPrivacy || !consentNoSensitive) {
      setErrorMsg('개인정보 처리 및 고객 정보 보호 동의 항목을 모두 체크해 주세요.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  // Step 1 validation (Usage: 10 questions)
  const validateStep1 = () => {
    if (!usageAnswers['U01']) {
      setErrorMsg('U01: AI 도구 사용 빈도를 선택해 주세요.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  // Step 2 validation (Capability: 20 questions)
  const validateStep2 = () => {
    const answeredCount = Object.keys(capabilityAnswers).length;
    if (answeredCount < CAPABILITY_QUESTIONS.length) {
      setErrorMsg(`AI 실무 역량 20문항 중 ${answeredCount}개만 응답되었습니다. 모든 문항에 응답해 주세요.`);
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  // Step 3 validation (Preference: 24 questions)
  const validateStep3 = () => {
    const answeredCount = Object.keys(preferenceAnswers).length;
    if (answeredCount < PREFERENCE_QUESTIONS.length) {
      setErrorMsg(`업무 성향 24문항 중 ${answeredCount}개만 선택되었습니다. 모든 비교 문항에 응답해 주세요.`);
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  // Step 4 validation (Automation)
  const validateStep4 = () => {
    if (!hasNoTask && !taskName.trim()) {
      setErrorMsg('개선하고 싶은 반복 업무명을 입력하거나, [현재 제안할 업무가 없음]을 체크해 주세요.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  // Step 5 validation (Final Practical AI Ability Evaluation Quiz: 15 questions - Basic 5, Intermediate 5, Advanced 5)
  const validateStep5 = () => {
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < QUIZ_QUESTIONS.length) {
      setErrorMsg(`개인 AI 활용 능력 평가 15문항(초급 5·중급 5·상급 5) 중 ${answeredCount}문항만 응답되었습니다. 모든 문제의 보기를 선택해 주세요.`);
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const nextStep = () => {
    if (currentStep === 0 && !validateStep0()) return;
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    if (currentStep === 5 && !validateStep5()) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const prevStep = () => {
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  // Quick fill all remaining answers for testing convenience
  const handleQuickFill = () => {
    // 8 Usage answers
    setUsageAnswers({
      U01: 'WEEKLY_3_4',
      U02: ['CHATGPT', 'GEMINI', 'COPILOT'],
      U03: ['DOC_WRITING', 'DATA_ANALYSIS', 'CUSTOMER_SERVICE', 'CONTENT_CREATION'],
      U04: 'COMPANY_PAID',
      U05: 'PC_WEB',
      U06: 'LACK_SKILL',
      U07: '31_60_MIN',
      U08: 'PROMPT_WORKSHOP',
      U09: 'CONTEXT_ROLE',
      U10: 'THOROUGH_EDIT',
    });

    // 15 Practical Quiz answers (Q01~Q15, 14 correct and 1 realistic mistake)
    const quizzes: Record<string, number> = {};
    QUIZ_QUESTIONS.forEach((q, idx) => {
      // Q13 is wrong choice for realism
      quizzes[q.id] = idx === 12 ? (q.correctAnswer === 1 ? 2 : 1) : q.correctAnswer;
    });
    setQuizAnswers(quizzes);

    // 20 Capability Likert answers (C01~C20)
    const caps: Record<string, number> = {};
    CAPABILITY_QUESTIONS.forEach((q, idx) => {
      caps[q.id] = (idx % 3) + 3; // 3..5
    });
    setCapabilityAnswers(caps);

    // 24 Preference answers (T01~T24)
    const prefs: Record<string, 1 | 2> = {};
    PREFERENCE_QUESTIONS.forEach((q, idx) => {
      prefs[q.id] = (idx % 2 === 0 ? 1 : 2) as 1 | 2;
    });
    setPreferenceAnswers(prefs);

    if (!taskName) {
      setTaskName('고객 맞춤 누진다초점 안경 수령 안내 및 피팅 피드백 자동 취합');
      setWeeklyCount(4);
      setTimePerTaskMinutes(60);
      setHeadcount(3);
      setDesiredImprovement('수작업 작성 시간 80% 단축 및 고객 재방문 만족도 제고');
      setSecurityRisk('NO');
      setSupportNeeded('카카오 알림톡 연계 및 사내 표준 프롬프트 템플릿 지원');
    }

    if (!name) setName('김다비치');
    if (!password) {
      setPassword('1234');
      setPasswordConfirm('1234');
    }
    if (!employeeNumber) setEmployeeNumber('DV-2026-01');
    if (!position) setPosition('책임안경사');
    if (!jobFunction) setJobFunction('전문 시력 검안 및 고객 맞춤 처방');
    setConsentPrivacy(true);
    setConsentNoSensitive(true);
    setErrorMsg(null);
  };

  // Final Submit
  const handleSubmit = () => {
    const targetCompany =
      (selectedCompanyCode &&
        companies.find((c) => c.code.toLowerCase() === selectedCompanyCode.toLowerCase())) ||
      currentCompany;

    if (!targetCompany) return;

    const scores = evaluateAssessmentScores(
      usageAnswers,
      capabilityAnswers,
      preferenceAnswers,
      quizAnswers
    );

    const respondent: RespondentProfile = {
      name: name.trim(),
      password: password.trim(),
      employeeNumber: employeeNumber.trim(),
      companyId: targetCompany.id,
      companyName: targetCompany.name,
      department: department.trim(),
      position: position.trim(),
      jobFunction: jobFunction.trim() || '일반 실무',
    };

    const submission: AssessmentSubmission = {
      id: loadedSubmissionId || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: targetCompany.id,
      respondent,
      submittedAt: new Date().toISOString(),
      answers: {
        usage: usageAnswers,
        quiz: quizAnswers,
        capability: capabilityAnswers,
        preference: preferenceAnswers,
        automation: hasNoTask
          ? { hasNoTask: true }
          : {
              taskName,
              weeklyCount,
              timePerTaskMinutes,
              headcount,
              desiredImprovement,
              securityRisk,
              supportNeeded,
            },
      },
      scores,
    };

    const saved = saveSubmission(submission);
    onSubmissionComplete(saved);
  };

  // If no company resolved yet, auto-fallback to initial company
  const activeCompany = currentCompany || INITIAL_COMPANIES[0];

  // Welcome Screen before user starts the survey
  if (!isStarted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Main Welcome Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-center sm:text-left">
          {/* Logo & Category */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3.5">
              <img
                src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                alt="다비치안경 로고"
                className="w-12 h-12 rounded-2xl object-contain shadow-2xs shrink-0"
              />
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  DAVICH AI FIT 16
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  다비치안경 AI 역량 & 업무 성향 진단
                </h1>
              </div>
            </div>

            <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium text-slate-600">
              소속: <strong className="text-slate-900">{currentCompany?.name}</strong>
            </div>
          </div>

          {/* CRITICAL NOTICE: 1주일 시간 동안 완성 하셔야 합니다 */}
          <div className="p-5 sm:p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 text-sm sm:text-base font-extrabold text-amber-950">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <span>[중요 안내] 설문 참여 완료 기한</span>
              <span className="text-[11px] bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                기한 엄수 (D-7)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-semibold">
              본 진단은 링크를 수신하신 시점부터 <span className="underline decoration-amber-500 font-extrabold text-amber-950 text-sm sm:text-base">1주일 시간 동안 반드시 완성을 마치셔야 합니다.</span>
            </p>
            <p className="text-[11px] text-amber-800 leading-normal">
              ※ 전사 AI 활용 현황 파악 및 개인 맞춤형 교육 과정 배정을 위해 정해진 1주일 기간 내에 74문항 진단을 완료해 주시기 바랍니다. (기한 초과 시 결과 분석 및 교육 배정에 불이익이 발생할 수 있습니다)
            </p>
          </div>

          {/* Survey Overview Infobox */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">예상 소요 시간</div>
              <div className="text-base font-bold text-slate-900">약 10 ~ 15분</div>
              <div className="text-[11px] text-slate-500">부담 없이 직관적으로 선택</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">총 진단 문항</div>
              <div className="text-base font-bold text-slate-900">74문항</div>
              <div className="text-[11px] text-slate-500">사용현황 10 + 실전 15 + 역량 20 + 성향 24 + 과제 5</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">진단 즉시 제공</div>
              <div className="text-base font-bold text-blue-700">16유형 리포트</div>
              <div className="text-[11px] text-slate-500">30·60·90일 성장 로드맵</div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-blue-900 flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>응답 시 유의사항</span>
            </div>
            <ul className="space-y-1 text-slate-600 list-disc list-inside">
              <li>업무 성향 문항에는 정답이나 우열이 없으므로 평소 본인의 스타일에 맞게 선택해 주세요.</li>
              <li>서술형 문항 작성 시 실제 고객의 성명, 검안 정보 등 개인정보는 입력하지 않습니다.</li>
            </ul>
          </div>

          {/* Primary Action Button: 설문 참여 시작 */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsStarted(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 mx-auto group cursor-pointer"
            >
              <span>설문 참여 시작</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[11px] text-slate-400 mt-2.5">
              버튼을 누르시면 기본 정보 입력 후 바로 설문이 시작됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Persistent Deadline Notice: 1주일 시간 동안 완성 하셔야 합니다 */}
      <div className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-medium text-amber-900">
            <strong>[기한 안내]</strong> 본 설문은 링크 수신 후 <strong className="font-bold underline decoration-amber-400 text-amber-950">1주일 시간 동안 완성 하셔야 합니다.</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsStarted(false)}
          className="text-[11px] text-amber-800 hover:text-amber-950 hover:underline font-semibold shrink-0 self-end sm:self-auto"
        >
          시작 안내문 다시보기
        </button>
      </div>

      {/* Top Banner with Company Lock */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 p-1.5 shadow-2xs">
            <img
              src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
              alt="다비치 로고"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">현재 진단 대상 기업 / 매장</div>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{currentCompany?.name}</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-normal">
                {currentCompany?.code}
              </span>
            </div>
          </div>
        </div>

        {/* Show company switcher only in general admin mode; in dedicated mode, lock to the specific company */}
        {(!isDedicatedMode && !selectedCompanyCode) ? (
          <div className="flex items-center gap-2 self-end sm:self-center">
            <label className="text-xs text-slate-500">기업 전환:</label>
            <select
              value={currentCompany?.id || ''}
              onChange={(e) => {
                const comp = companies.find((c) => c.id === e.target.value);
                if (comp) {
                  setCurrentCompany(comp);
                  if (comp.allowedDepartments?.length > 0) setDepartment(comp.allowedDepartments[0]);
                }
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>{currentCompany?.name} 전용 진단 설문지</span>
            </span>
          </div>
        )}
      </div>

      {/* Stepper Progress Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-blue-700 uppercase tracking-wider">
            STEP {currentStep + 1} OF 7
          </span>
          <span className="font-medium text-slate-700">
            {currentStep === 0 && '응답자 정보 & 보안 서약'}
            {currentStep === 1 && '1. AI 사용 현황 및 환경 (10문항)'}
            {currentStep === 2 && '2. AI 실무 역량 자가진단 (20문항)'}
            {currentStep === 3 && '3. AI 업무 성향 진단 (24문항)'}
            {currentStep === 4 && '4. 업무 자동화 기회 발굴 (5문항)'}
            {currentStep === 5 && '5. 개인 AI 활용 능력 평가 (초급5·중급5·상급5)'}
            {currentStep === 6 && '6. 최종 종합 검토 및 결과 리포트 발행'}
          </span>
        </div>

        {/* Segmented Step Bar (7 Steps) */}
        <div className="grid grid-cols-7 gap-1.5">
          {['기본정보', '사용현황', '역량진단', '업무성향', '자동화과제', '실전평가', '최종제출'].map((label, idx) => (
            <div key={label} className="space-y-1">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'bg-blue-600'
                    : idx < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-slate-100'
                }`}
              />
              <div
                className={`text-[10px] text-center truncate ${
                  idx === currentStep ? 'font-bold text-slate-900' : 'text-slate-400'
                }`}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 0: Profile, ID & Password Setup, Consent */}
      {currentStep === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>진단 응답자 기본 정보</span>
                {isLoadedFromPrevious && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                    이전 응답 불러옴
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                본 진단은 맞춤형 AI 교육 배정 및 업무 개선을 위한 실명 기반 진단입니다. 성명이 아이디(ID) 역할을 합니다.
              </p>
            </div>

            {/* Mode Switch Tabs: 신규 작성 vs 기존 설문 이어하기(로그인) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('NEW');
                  setLoginError(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  authMode === 'NEW'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>신규 진단 참여</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('RESUME');
                  setLoginNameInput(name);
                  setLoginPasswordInput(password);
                  setLoginError(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  authMode === 'RESUME'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>기존 설문 다시 작성 / 이어하기</span>
              </button>
            </div>
          </div>

          {/* Banner when loaded from existing */}
          {isLoadedFromPrevious && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs sm:text-sm">
                  <span className="font-bold">'{name}'</span> 님의 기존 설문지를 불러왔습니다.
                  <span className="block text-[11px] text-emerald-800">
                    답변을 수정한 후 마지막 단계에서 제출하시면 이전 기록이 최신 상태로 갱신됩니다.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetToNew}
                className="text-xs bg-white text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer transition-colors"
              >
                다른 계정으로 새로 작성
              </button>
            </div>
          )}

          {/* RESUME / LOGIN MODE CARD */}
          {authMode === 'RESUME' && (
            <div className="p-6 rounded-2xl bg-slate-50 border border-blue-200 shadow-xs space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900">기존 작성자 로그인 (설문지 불러오기)</h3>
                  <p className="text-xs text-slate-500">
                    이전에 설문을 작성하셨던 분은 등록하셨던 <strong>성명(아이디)</strong>과 <strong>비밀번호</strong>를 입력하시면 기존 설문 응답을 불러와 수정하거나 이어 작성하실 수 있습니다.
                  </p>
                </div>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    성명 (아이디) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="설문 작성 시 등록한 성명"
                      value={loginNameInput}
                      onChange={(e) => setLoginNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLoginResume()}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
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
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="설정했던 비밀번호"
                      value={loginPasswordInput}
                      onChange={(e) => setLoginPasswordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLoginResume()}
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-slate-500">
                  ※ 소속 기업: <strong className="text-slate-800">{currentCompany?.name}</strong> 기준으로 조회됩니다.
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleLoginResume}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>기존 설문지 불러오기</span>
                  </button>

                  {isLoadedFromPrevious && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('NEW')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>설문지 수정 계속하기</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MAIN PROFILE FORM (NEW or EDITING MODE) */}
          <div className="space-y-6">
            {/* Identity & Password Information Notice */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs flex items-center gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="leading-relaxed">
                <strong>[본인 확인 및 재접속 안내]</strong> 입력하시는 <strong>성명(이름)</strong>은 다시 접속할 때의 <span className="underline font-bold">아이디(ID)</span>가 되며, 함께 설정하는 <strong>비밀번호</strong>를 통해 언제든 설문지를 다시 열어 수정하실 수 있습니다.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* 성명 (아이디) */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  성명 (아이디) <span className="text-rose-500">*</span>
                  <span className="text-[11px] text-blue-600 font-normal ml-1.5">
                    (재접속 시 아이디로 사용)
                  </span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="예: 홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
                {/* Warning if name already exists */}
                {name.trim().length >= 2 && !isLoadedFromPrevious && checkRespondentExists(currentCompany?.id || null, name) && (
                  <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center justify-between gap-2">
                    <span>💡 해당 이름으로 이미 작성된 설문이 존재합니다.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('RESUME');
                        setLoginNameInput(name);
                      }}
                      className="text-blue-700 font-bold underline hover:text-blue-900 cursor-pointer shrink-0"
                    >
                      기존 설문 불러오기
                    </button>
                  </div>
                )}
              </div>

              {/* 사번 / 직원 고유번호 */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  사번 / 직원 고유번호 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: DV-1024"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              {/* 비밀번호 설정 */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  비밀번호 설정 <span className="text-rose-500">*</span>
                  <span className="text-[11px] text-slate-500 font-normal ml-1.5">
                    (재접속 시 본인 확인용)
                  </span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="재접속 시 사용할 비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  비밀번호 확인 <span className="text-rose-500">*</span>
                  {password && passwordConfirm && (
                    <span
                      className={`text-[11px] font-semibold ml-1.5 ${
                        password === passwordConfirm ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {password === passwordConfirm ? '✓ 비밀번호 일치' : '✕ 일치하지 않음'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호 다시 입력"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* 소속 부서 / 팀 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">
                    소속 부서 / 팀 <span className="text-rose-500">*</span>
                  </label>
                  {currentCompany?.allowedDepartments && currentCompany.allowedDepartments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDept(!isCustomDept);
                        if (isCustomDept && currentCompany.allowedDepartments.length > 0) {
                          setDepartment(currentCompany.allowedDepartments[0]);
                        }
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      {isCustomDept ? '목록에서 선택' : '직접 입력'}
                    </button>
                  )}
                </div>
                {!isCustomDept && currentCompany?.allowedDepartments && currentCompany.allowedDepartments.length > 0 ? (
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {currentCompany.allowedDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="예: 안경사 1팀"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                )}
              </div>

              {/* 직책 / 직급 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">
                    직책 / 직급 <span className="text-rose-500">*</span>
                  </label>
                  {currentCompany?.allowedPositions && currentCompany.allowedPositions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPos(!isCustomPos);
                        if (isCustomPos && currentCompany.allowedPositions && currentCompany.allowedPositions.length > 0) {
                          setPosition(currentCompany.allowedPositions[0]);
                        }
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      {isCustomPos ? '목록에서 선택' : '직접 입력'}
                    </button>
                  )}
                </div>
                {!isCustomPos && currentCompany?.allowedPositions && currentCompany.allowedPositions.length > 0 ? (
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {currentCompany.allowedPositions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="예: 원장, 점장, 수석안경사, 팀장, 매니저"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                )}
              </div>

              {/* 담당 주요 직무 */}
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  담당 주요 직무
                </label>
                <input
                  type="text"
                  placeholder="예: 전문 시력 검안 및 콘택트렌즈 상담, 조제가공 및 재고관리, 매장 총괄"
                  value={jobFunction}
                  onChange={(e) => setJobFunction(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Privacy & Security Agreements */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>개인정보 보호 및 기밀 유지 서약</span>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentPrivacy}
                  onChange={(e) => setConsentPrivacy(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">[필수]</strong> 본 진단에 제출하는 성명, 사번, 부서 정보가 다비치안경 사내 AI 역량 분석, 교육 과정 배정 및 자동화 과제 관리를 위해 수집·이용됨을 확인하고 동의합니다.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentNoSensitive}
                  onChange={(e) => setConsentNoSensitive(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">[필수]</strong> 서술형 답변 및 자동화 과제 작성 시 실제 고객의 성명, 주민번호, 시력 검안정보, 비밀번호, 사내 영업기밀을 직접 입력하지 않을 것을 서약합니다.
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: AI 사용 현황 (U01~U10) */}
      {currentStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">1. AI 도구 사용 현황 조사 (U01 ~ U10)</h2>
              <p className="text-xs text-slate-500">
                현재 일상 업무에서 사용하고 계신 생성형 AI 도구, 프롬프트 방식 및 활용 환경을 파악합니다.
              </p>
            </div>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200/80 self-start sm:self-auto tabular-nums">
              총 {USAGE_QUESTIONS.length}문항 + 직접입력
            </div>
          </div>

          <div className="space-y-6">
            {USAGE_QUESTIONS.map((q) => {
              const currentVal = usageAnswers[q.id];
              const customKey = `${q.id}_CUSTOM`;
              const customTextVal = (usageAnswers[customKey] as string) || '';
              const isCustomSelected =
                q.type === 'single'
                  ? currentVal === 'OTHER_CUSTOM'
                  : Array.isArray(currentVal) && currentVal.includes('OTHER_CUSTOM');

              return (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{q.id}</span>
                      <h4 className="text-sm font-semibold text-slate-900">{q.title}</h4>
                    </div>
                    {q.description && (
                      <p className="text-[11px] text-slate-500 pl-8">{q.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-8">
                    {q.options.map((opt) => {
                      const isSelected =
                        q.type === 'single'
                          ? currentVal === opt.value
                          : Array.isArray(currentVal) && currentVal.includes(opt.value);

                      return (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => {
                            if (q.type === 'single') handleUsageSingle(q.id, opt.value);
                            else handleUsageMultiple(q.id, opt.value);
                          }}
                          className={`text-left p-3 rounded-xl text-xs font-medium border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </button>
                      );
                    })}

                    {/* 기타 (직접 입력) 옵션 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (q.type === 'single') handleUsageSingle(q.id, 'OTHER_CUSTOM');
                        else handleUsageMultiple(q.id, 'OTHER_CUSTOM');
                      }}
                      className={`text-left p-3 rounded-xl text-xs font-medium border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isCustomSelected
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-2xs font-semibold'
                          : 'bg-white border-dashed border-slate-300 text-slate-600 hover:bg-slate-100/60'
                      }`}
                    >
                      <span>기타 (직접 입력)</span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isCustomSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isCustomSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  </div>

                  {/* 문항별 직접 입력 필드 */}
                  {isCustomSelected && (
                    <div className="pl-8 pt-1 animate-in fade-in">
                      <input
                        type="text"
                        placeholder={`${q.id} 문항에 대한 기타 내용을 직접 입력해 주세요...`}
                        value={customTextVal}
                        onChange={(e) =>
                          setUsageAnswers((prev) => ({
                            ...prev,
                            [customKey]: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI 사용 현황 직접 입력 전용 섹션 */}
            <div className="p-5 rounded-2xl border-2 border-blue-200/80 bg-blue-50/40 space-y-4">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✎
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    AI 사용 현황 및 활용 사례 직접 입력 섹션 (자유 기술)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    위 객관식 문항 외에 본인이 실제로 활용 중인 AI 도구, 업무 적용 방식, 또는 현업 도입 시 건의사항을 자유롭게 입력해 주세요.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    1) 현재 주로 사용하는 AI 도구 및 나만의 실무 활용 방식 (직접 입력)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="예: Perplexity로 안경학 최신 트렌드 검색, ChatGPT로 고객 클레임 안내 문자 초안 작성, 엑셀 수식 자동 생성 등"
                    value={(usageAnswers['U_CUSTOM_USAGE'] as string) || ''}
                    onChange={(e) =>
                      setUsageAnswers((prev) => ({
                        ...prev,
                        U_CUSTOM_USAGE: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    2) AI 활용 시 겪는 애로사항 또는 회사에 바라는 지원 의견 (직접 입력)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="예: 매장 실무에 바로 쓸 수 있는 다비치 전용 프롬프트 예시집이 있으면 좋겠습니다 / 유료 계정 지원 희망 등"
                    value={(usageAnswers['U_CUSTOM_OPINION'] as string) || ''}
                    onChange={(e) =>
                      setUsageAnswers((prev) => ({
                        ...prev,
                        U_CUSTOM_OPINION: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: AI 실무 역량 자가진단 (C01~C20, 5점 리커트 척도) */}
      {currentStep === 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                2. AI 실무 역량 자가진단 (20문항)
              </h2>
              <p className="text-xs text-slate-500">
                프롬프트 설계(5문항), 팩트체크·검증(5문항), 보안·윤리 준수(5문항), 혁신·자동화(5문항) 총 20개 지표를 5점 척도로 측정합니다.
              </p>
            </div>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 self-start sm:self-auto tabular-nums">
              진행: {Object.keys(capabilityAnswers).length} / {CAPABILITY_QUESTIONS.length} 완료
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {CAPABILITY_QUESTIONS.map((q) => {
              const currentScore = capabilityAnswers[q.id];

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    currentScore
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">
                      {q.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded mr-2">
                        {q.categoryLabel}
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed inline">
                        {q.question}
                      </p>
                    </div>
                  </div>

                  {/* 1..5 Likert Row */}
                  <div className="pl-10 grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[
                      { val: 1, label: '전혀 아니다' },
                      { val: 2, label: '아니다' },
                      { val: 3, label: '보통이다' },
                      { val: 4, label: '그렇다' },
                      { val: 5, label: '매우 그렇다' },
                    ].map((btn) => {
                      const isCurrent = currentScore === btn.val;

                      return (
                        <button
                          key={btn.val}
                          type="button"
                          onClick={() => setCapabilityAnswers((prev) => ({ ...prev, [q.id]: btn.val }))}
                          className={`py-2 px-1 rounded-lg text-xs font-medium border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-mono text-sm leading-none">{btn.val}</span>
                          <span className="text-[10px] hidden sm:inline leading-none opacity-90 truncate max-w-full">
                            {btn.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: AI 업무 성향 진단 (T01~T24, 24개 양자택일) */}
      {currentStep === 3 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">3. AI 업무 활용 성향 진단 (24문항)</h2>
              <p className="text-xs text-slate-500">
                두 가지 보기 중 평소 자신의 업무 스타일과 더 가까운 설명을 선택해 주세요. (정답이나 우열은 없습니다)
              </p>
            </div>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 self-start sm:self-auto tabular-nums">
              진행: {Object.keys(preferenceAnswers).length} / {PREFERENCE_QUESTIONS.length} 완료
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {PREFERENCE_QUESTIONS.map((q) => {
              const currentChoice = preferenceAnswers[q.id];

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    currentChoice
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-600">{q.id}</span>
                    <span className="text-[11px] text-slate-500 font-mono font-medium">
                      {q.axis === 'RE' && '근거 확인(R) vs 가능성 탐색(E)'}
                      {q.axis === 'AC' && '독립 정리(A) vs 협업 발전(C)'}
                      {q.axis === 'VI' && '현업 개선(V) vs 새로운 가능성(I)'}
                      {q.axis === 'PO' && '계획·구조(P) vs 피드백·조정(O)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Left choice */}
                    <button
                      type="button"
                      onClick={() => setPreferenceAnswers((prev) => ({ ...prev, [q.id]: 1 }))}
                      className={`text-left p-3.5 rounded-xl text-xs border transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                        currentChoice === 1
                          ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold shadow-xs ring-1 ring-blue-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                      }`}
                    >
                      <span className="leading-relaxed">{q.leftText}</span>
                      <span className="text-[10px] text-blue-700 font-mono font-bold self-end">
                        [1] {q.leftCode} 성향 선택
                      </span>
                    </button>

                    {/* Right choice */}
                    <button
                      type="button"
                      onClick={() => setPreferenceAnswers((prev) => ({ ...prev, [q.id]: 2 }))}
                      className={`text-left p-3.5 rounded-xl text-xs border transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                        currentChoice === 2
                          ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold shadow-xs ring-1 ring-blue-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                      }`}
                    >
                      <span className="leading-relaxed">{q.rightText}</span>
                      <span className="text-[10px] text-blue-700 font-mono font-bold self-end">
                        [2] {q.rightCode} 성향 선택
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: 업무 자동화 기회 발굴 (A01~A05) */}
      {currentStep === 4 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">4. 현장 업무 자동화 기회 발굴 (5문항)</h2>
            <p className="text-xs text-slate-500">
              현재 업무 중 매주 반복되어 시간이 많이 소요되는 수작업을 제안해 주시면 관리자 대시보드에서 우선순위 분석 후 자동화 파일럿을 지원합니다.
            </p>
          </div>

          {/* Skip Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-700 font-medium">현재 특별히 제안할 반복 업무가 없으신가요?</span>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={hasNoTask}
                onChange={(e) => setHasNoTask(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>제안할 업무 없음 (건너뛰기)</span>
            </label>
          </div>

          {!hasNoTask && (
            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  A01. 매주 반복되는 가장 시간이 많이 드는 수작업 업무명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 고객 맞춤 알림톡 발송 스크립트 작성, 일일 정산 엑셀 대조 및 취합"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    A02. 주당 처리 횟수 (회)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={weeklyCount}
                    onChange={(e) => setWeeklyCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    A03. 1회당 소요 시간 (분)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    step="5"
                    value={timePerTaskMinutes}
                    onChange={(e) => setTimePerTaskMinutes(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    A04. 동일 업무를 처리하는 인원 수 (명)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={headcount}
                    onChange={(e) => setHeadcount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  A05. AI 또는 자동화로 기대하는 구체적 개선점
                </label>
                <textarea
                  rows={2}
                  placeholder="예: 수작업 타이핑 시간 80% 절감, 규격 입력 실수 제로화, 고객 대기시간 단축"
                  value={desiredImprovement}
                  onChange={(e) => setDesiredImprovement(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  A06. 자동화 과정에서 고객 개인정보나 민감 기밀을 다룰 가능성이 있습니까?
                </label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { val: 'NO', label: '아니오 (비식별/일반 업무)' },
                    { val: 'YES', label: '예 (고객/검안/기밀 취급)' },
                    { val: 'UNSURE', label: '모르겠음 (보안 확인 필요)' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.val}
                      onClick={() => setSecurityRisk(item.val as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        securityRisk === item.val
                          ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  A07. 업무 개선을 위해 본사나 IT팀에 요청하고 싶은 지원
                </label>
                <input
                  type="text"
                  placeholder="예: 실무 전용 프롬프트 템플릿 배포, 사내 ERP 자동 연계, 사전 실무 교육"
                  value={supportNeeded}
                  onChange={(e) => setSupportNeeded(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 5: 개인 AI 활용 능력 최종 평가 (초급 5문항 · 중급 5문항 · 상급 5문항, 총 15문항) */}
      {currentStep === 5 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  5. 개인 AI 활용 능력 최종 평가 (초급 5 · 중급 5 · 상급 5)
                </h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                마지막 단계로 개인의 실질적인 AI 활용 능력을 평가합니다. <strong className="text-emerald-700">초급(기초 활용 5문항)</strong>, <strong className="text-blue-700">중급(실무 응용 5문항)</strong>, <strong className="text-purple-700">상급(심화 거버넌스 5문항)</strong> 총 15개 5지선다형 실전 문제로 구성됩니다.
              </p>
            </div>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200/80 self-start sm:self-auto tabular-nums flex items-center gap-1.5 shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>진행: {Object.keys(quizAnswers).length} / {QUIZ_QUESTIONS.length}문항 완료</span>
            </div>
          </div>

          {/* 3-Tier Evaluation Level Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-emerald-900">STEP 1 · 초급 문제 (5문항)</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">기초 프롬프트 · 개인정보 보안 · 팩트체크</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 font-mono font-bold text-emerald-800">
                {QUIZ_QUESTIONS.slice(0, 5).filter((q) => quizAnswers[q.id]).length} / 5
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-blue-900">STEP 2 · 중급 문제 (5문항)</div>
                <div className="text-[11px] text-blue-700 mt-0.5">Few-Shot · 단계별 추론 · 멀티모달 · 윤리</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 font-mono font-bold text-blue-800">
                {QUIZ_QUESTIONS.slice(5, 10).filter((q) => quizAnswers[q.id]).length} / 5
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-purple-900">STEP 3 · 상급 문제 (5문항)</div>
                <div className="text-[11px] text-purple-700 mt-0.5">대량 데이터 정제 · 기밀 거버넌스 · 위기 대응</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 font-mono font-bold text-purple-800">
                {QUIZ_QUESTIONS.slice(10, 15).filter((q) => quizAnswers[q.id]).length} / 5
              </span>
            </div>
          </div>

          <div className="space-y-8 pt-1">
            {[
              {
                tier: 'BASIC',
                title: 'PART 1. 초급 AI 활용 능력 평가 (문항 1 ~ 5)',
                subtitle: '기초 프롬프트 구조화, 페르소나 부여, 개인정보 비식별화 및 환각 팩트체크 능력을 평가합니다.',
                headerClass: 'bg-emerald-900 text-white border-emerald-800',
                badgeClass: 'bg-emerald-600 text-white',
                tagClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                questions: QUIZ_QUESTIONS.slice(0, 5),
                offset: 0,
              },
              {
                tier: 'INTERMEDIATE',
                title: 'PART 2. 중급 AI 활용 능력 평가 (문항 6 ~ 10)',
                subtitle: 'Few-Shot 예시 학습, 단계별 수리 추론(CoT), 멀티모달 비전 판별 및 채용·홍보 윤리 검수 능력을 평가합니다.',
                headerClass: 'bg-blue-950 text-white border-blue-900',
                badgeClass: 'bg-blue-600 text-white',
                tagClass: 'bg-blue-50 text-blue-800 border-blue-200',
                questions: QUIZ_QUESTIONS.slice(5, 10),
                offset: 5,
              },
              {
                tier: 'ADVANCED',
                title: 'PART 3. 상급 AI 활용 능력 평가 (문항 11 ~ 15)',
                subtitle: '대량 비정형 데이터 구조화, 엔터프라이즈 영업기밀 보호, 지식재산권 거버넌스 및 Human-in-the-loop 설계를 평가합니다.',
                headerClass: 'bg-purple-950 text-white border-purple-900',
                badgeClass: 'bg-purple-600 text-white',
                tagClass: 'bg-purple-50 text-purple-800 border-purple-200',
                questions: QUIZ_QUESTIONS.slice(10, 15),
                offset: 10,
              },
            ].map((section) => (
              <div key={section.tier} className="space-y-4">
                <div className={`p-4 rounded-2xl border ${section.headerClass} flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs`}>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold tracking-tight">{section.title}</h3>
                    <p className="text-[11px] opacity-85 mt-0.5">{section.subtitle}</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/15 self-start sm:self-auto shrink-0">
                    5문항 · 5지선다형
                  </span>
                </div>

                {section.questions.map((q, localIdx) => {
                  const idx = section.offset + localIdx;
                  const currentChoice = quizAnswers[q.id];

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                        currentChoice
                          ? 'bg-white border-blue-200 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      {/* Category & Question Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono shadow-2xs ${section.badgeClass}`}>
                            문항 {idx + 1}
                          </span>
                          <span className={`text-[11px] font-bold border px-2 py-0.5 rounded-md ${section.tagClass}`}>
                            {q.difficultyLabel || section.title.split('.')[1]}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            {q.categoryLabel}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: {q.id} (5지선다형)
                        </span>
                      </div>

                      {/* Real-world Scenario Box */}
                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 block mb-0.5 font-semibold">
                            [실무 상황 시나리오]
                          </strong>
                          <span className="text-slate-600">{q.scenario}</span>
                        </div>
                      </div>

                      {/* Question Title */}
                      <p className="text-sm font-bold text-slate-900 leading-snug pt-1">
                        {q.question}
                      </p>

                      {/* 5 Multiple Choice Options */}
                      <div className="grid grid-cols-1 gap-2.5 pt-1">
                        {q.options.map((opt) => {
                          const isSelected = currentChoice === opt.number;

                          return (
                            <button
                              key={opt.number}
                              type="button"
                              onClick={() => handleQuizChoice(q.id, opt.number)}
                              className={`text-left p-3.5 rounded-xl text-xs font-medium border transition-all flex items-start justify-between gap-3 cursor-pointer group ${
                                isSelected
                                  ? 'bg-blue-50/90 border-blue-600 text-blue-950 font-semibold shadow-xs ring-1 ring-blue-500/20'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                  }`}
                                >
                                  {opt.number}
                                </span>
                                <span className="leading-relaxed flex-1">{opt.text}</span>
                              </div>

                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 6: Final Review & Confirmation */}
      {currentStep === 6 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">최종 확인 및 결과 리포트 생성</h2>
            <p className="text-xs text-slate-500">
              응답하신 총 72개 진단 항목이 모두 완료되었습니다. [진단 제출 및 결과 확인] 버튼을 누르시면 개인 맞춤 리포트가 즉각 생성됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>응답자 정보 & 인증 설정</span>
                {isLoadedFromPrevious ? (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                    기존 응답 수정
                  </span>
                ) : (
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                    신규 등록
                  </span>
                )}
              </div>
              <div className="space-y-1.5 text-slate-600">
                <div>소속 기업: <strong className="text-slate-800">{currentCompany?.name}</strong></div>
                <div>성명 (아이디): <strong className="text-blue-900 font-bold">{name}</strong> (사번: {employeeNumber})</div>
                <div>재접속 비밀번호: <span className="font-mono text-emerald-700 font-bold">●●●● (설정 완료 - 재접속 가능)</span></div>
                <div>부서 / 직책: {department} / {position}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900">문항 응답 완료 현황 (총 74문항)</div>
              <div className="space-y-1 text-slate-600">
                <div>1. AI 사용 현황: <span className="text-emerald-700 font-semibold">10문항 (U01~U10) 완료</span></div>
                <div>2. AI 실무 역량: <span className="text-emerald-700 font-semibold">20문항 전원 완료</span></div>
                <div>3. AI 업무 성향: <span className="text-emerald-700 font-semibold">24문항 전원 완료</span></div>
                <div>4. 자동화 제안: {hasNoTask ? '제안 없음' : <span className="text-blue-700 font-semibold">과제 1건 등록</span>}</div>
                <div>5. 개인 AI 활용 능력 평가: <span className="text-blue-700 font-semibold">초급 5 · 중급 5 · 상급 5 (총 15문항 완료)</span></div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>진단 결과 리포트 제공 혜택</span>
            </div>
            <p className="leading-relaxed text-blue-800">
              제출 즉시 16개 업무 성향 유형 분석 결과, 15개 실전 문제 풀이 정답 및 오답노트 상세 해설, 0~100점 역량 및 안전 점수, 본인 직무에 최적화된 추천 교육 과정 및 30·60·90일 성장 로드맵을 확인하실 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons Row */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>이전 단계</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick-fill helper for test reviewers */}
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-[11px] text-slate-400 hover:text-blue-600 underline px-2 py-1 cursor-pointer"
          >
            테스트용 빠른 채우기
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>다음 단계</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>진단 제출 및 결과 확인</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
