import React, { useState } from 'react';
import {
  Printer,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  HelpCircle,
  Briefcase,
  Layers,
  Info,
  Lock,
  User,
  Building2,
  LogIn,
  LogOut,
  Shield,
  GraduationCap,
  Check,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import { AssessmentSubmission, Company } from '../types/davich';
import { PREFERENCE_TYPES_DICTIONARY, TRAINING_COURSES, QUIZ_QUESTIONS } from '../data/questionBank';
import { authenticateRespondent, saveRespondentSession } from '../lib/storage';

interface PersonalResultViewProps {
  submission: AssessmentSubmission | null;
  onRetake: () => void;
  onGoToAdmin?: () => void;
  onLookupSuccess?: (submission: AssessmentSubmission) => void;
  onClearSession?: () => void;
  companies?: Company[];
  initialCompanyId?: string;
  lockedCompany?: Company | null;
}

export const PersonalResultView: React.FC<PersonalResultViewProps> = ({
  submission,
  onRetake,
  onGoToAdmin,
  onLookupSuccess,
  onClearSession,
  companies = [],
  initialCompanyId,
  lockedCompany = null,
}) => {
  const [lookupName, setLookupName] = useState('');
  const [lookupPass, setLookupPass] = useState('');
  const [lookupCompanyId, setLookupCompanyId] = useState(lockedCompany?.id || initialCompanyId || '');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [quizFilter, setQuizFilter] = useState<'ALL' | 'WRONG' | 'CORRECT'>('ALL');
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(true);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);

    const cleanName = lookupName.trim();
    const cleanPass = lookupPass.trim();

    if (!cleanName) {
      setLookupError('성명(아이디)을 입력해 주세요.');
      return;
    }
    if (!cleanPass) {
      setLookupError('비밀번호를 입력해 주세요.');
      return;
    }

    const targetCompId = lockedCompany ? lockedCompany.id : lookupCompanyId || null;
    const authRes = authenticateRespondent(
      targetCompId,
      cleanName,
      cleanPass
    );

    if (!authRes.success || !authRes.submission) {
      setLookupError(authRes.message);
      return;
    }

    saveRespondentSession({
      submissionId: authRes.submission.id,
      companyId: authRes.submission.companyId,
      name: authRes.submission.respondent.name,
      employeeNumber: authRes.submission.respondent.employeeNumber,
    });

    if (onLookupSuccess) {
      onLookupSuccess(authRes.submission);
    }
  };

  if (!submission) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto p-2.5 shadow-2xs">
            <img
              src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
              alt="다비치 로고"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {lockedCompany ? `[${lockedCompany.name}] 내 진단 결과 조회` : '내 진단 결과 조회 (본인 확인)'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            {lockedCompany ? (
              <>
                <strong>{lockedCompany.name}</strong> 전용 링크에서 참여하신 설문 결과입니다. 설문 작성 시 등록한 <strong>본인의 성명과 비밀번호</strong>를 입력해 주세요.
              </>
            ) : (
              <>
                개인정보 및 성향 분석 보호를 위해 <strong>설문 참여자 본인의 성명과 비밀번호</strong>를 입력하시면 작성하신 리포트를 열람하실 수 있습니다.
              </>
            )}
          </p>
        </div>

        {/* Respondent Lookup Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-xs font-semibold text-slate-700">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>{lockedCompany ? `${lockedCompany.name} 설문 참여자 본인 인증` : '설문 참여자 본인 인증'}</span>
            <span className="ml-auto text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              독립 섹션 보호
            </span>
          </div>

          {lookupError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{lookupError}</span>
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-4 text-xs">
            {lockedCompany ? (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  소속 기업/매장 (전용 링크 고정)
                </label>
                <div className="px-3.5 py-2.5 text-xs bg-blue-50/70 border border-blue-200 rounded-xl font-bold text-blue-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{lockedCompany.name}</span>
                  <span className="text-[10px] font-mono text-blue-600 ml-auto">/{lockedCompany.code}</span>
                </div>
              </div>
            ) : (
              companies.length > 0 && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    소속 기업 (선택)
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={lookupCompanyId}
                      onChange={(e) => setLookupCompanyId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">전체 기업에서 검색</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                성명 (설문 작성 시 입력한 이름/아이디) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="예: 김민수"
                  value={lookupName}
                  onChange={(e) => setLookupName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
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
                  type="password"
                  required
                  placeholder="설문 제출 시 설정한 비밀번호"
                  value={lookupPass}
                  onChange={(e) => setLookupPass(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>내 진단 결과 불러오기</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-slate-400 mr-2">아직 진단에 참여하지 않으셨나요?</span>
            <button
              type="button"
              onClick={onRetake}
              className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
            >
              새로운 진단 설문 시작하기 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { respondent, scores, answers, submittedAt } = submission;
  const pref = scores.preference;
  const typeDetail = pref.typeCode ? PREFERENCE_TYPES_DICTIONARY[pref.typeCode] : null;

  // Determine recommended course
  const recommendedCourse =
    scores.safetyScore < 60
      ? TRAINING_COURSES.find((c) => c.id === 'COURSE_03')
      : scores.capabilityScore < 50
      ? TRAINING_COURSES.find((c) => c.id === 'COURSE_01')
      : TRAINING_COURSES.find((c) => c.id === 'COURSE_04') || TRAINING_COURSES[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-3">
          <img
            src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
            alt="다비치안경 로고"
            className="w-10 h-10 rounded-xl object-contain shadow-2xs shrink-0"
          />
          <div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-700">{respondent.companyName}</span>
              <span>·</span>
              <span>{respondent.department}</span>
              <span>·</span>
              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">아이디: {respondent.name}</span>
              <span>·</span>
              <span>제출일: {new Date(submittedAt).toLocaleDateString('ko-KR')}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
              {respondent.name} 님의 AI FIT 16 진단 리포트
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>리포트 인쇄 / PDF 저장</span>
          </button>
          <button
            onClick={onRetake}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
          >
            설문 다시 작성 / 수정
          </button>
          {onClearSession && (
            <button
              onClick={onClearSession}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
              title="현재 열람 중인 결과 닫기"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>결과 닫기</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero 16-Type Result Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
              <img
                src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                alt="다비치 심볼"
                className="w-4 h-4 rounded object-contain shrink-0"
              />
              <span>다비치 AI FIT 16 업무 활용 성향 분석</span>
              <span aria-hidden="true">·</span>
              <span>교육용 프레임워크</span>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              사번: {respondent.employeeNumber}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-2">
            <div className="space-y-3 max-w-xl">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                {pref.status === 'RESOLVED' ? '성향 유형 확정' : '균형 상태 (판정 보류)'}
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <span className="font-mono text-blue-400">
                  {pref.status === 'RESOLVED' ? pref.typeCode : pref.partialCode}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-100">
                  {typeDetail ? typeDetail.name : '다방면 균형 조율형'}
                </span>
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {typeDetail
                  ? typeDetail.tagline
                  : '축별 선택 비율이 균형(3:3 동점)을 이루어 특정 한쪽 성향에 치우치지 않고 상황에 따라 유연하게 대처하는 성향입니다.'}
              </p>
            </div>

            {/* Quick KPI badges: 3 indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1 backdrop-blur-xs min-w-[110px]">
                <div className="text-[11px] text-slate-400">AI 실무 역량</div>
                <div className="text-3xl font-extrabold font-mono tabular-nums text-white">
                  {scores.capabilityScore}
                  <span className="text-xs font-normal text-slate-400 ml-0.5">점</span>
                </div>
                <div className="text-[10px] text-blue-300">
                  {scores.capabilityScore >= 75 ? '상위 역량' : scores.capabilityScore >= 50 ? '보통 수준' : '기초 집중'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1 backdrop-blur-xs min-w-[110px]">
                <div className="text-[11px] text-slate-400">AI 안전 점수</div>
                <div className="text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
                  {scores.safetyScore}
                  <span className="text-xs font-normal text-slate-400 ml-0.5">점</span>
                </div>
                <div className="text-[10px] text-emerald-300">
                  {scores.safetyScore >= 80 ? '철저한 보안' : '보안 주의'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1 backdrop-blur-xs min-w-[110px]">
                <div className="text-[11px] text-slate-400">실전 문제 풀이</div>
                <div className="text-3xl font-extrabold font-mono tabular-nums text-amber-300">
                  {scores.quizScore ?? Math.round(((scores.quizCorrectCount ?? 13) / 15) * 100)}
                  <span className="text-xs font-normal text-slate-400 ml-0.5">점</span>
                </div>
                <div className="text-[10px] text-amber-300">
                  {scores.quizCorrectCount !== undefined
                    ? `${scores.quizCorrectCount} / 15문항 정답`
                    : '15문항 검증완료'}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Tie Explanations if any */}
          {pref.status === 'PENDING_TIE' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>동점 판정 안내: </strong>
                {pref.tiedAxes.join(', ')} 축에서 양쪽 선택 수가 3:3 동점으로 나타났습니다. 이는 우열이 아닌 두 성향 간의 자연스러운 균형을 의미하며, 교육 및 실무 계획은 종합 역량 점수를 바탕으로 동일하게 제공됩니다.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Axis Balance Gauges */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">4대 업무 성향 축 밸런스 지표</h3>
          <p className="text-xs text-slate-500">
            총 24문항(축별 6문항) 양자택일 결과를 바탕으로 산출된 선호도 분포입니다.
          </p>
        </div>

        <div className="space-y-5 pt-2">
          {pref.axes.map((axis) => {
            const leftPercent = Math.round((axis.leftCount / 6) * 100);
            const rightPercent = 100 - leftPercent;

            return (
              <div key={axis.axis} className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-700">[{axis.left}]</span>
                    <span className="font-semibold text-slate-800">
                      {axis.axis === 'RE' && '근거 확인 중심'}
                      {axis.axis === 'AC' && '독립 정리 중심'}
                      {axis.axis === 'VI' && '현업 개선 중심'}
                      {axis.axis === 'PO' && '계획·구조 중심'}
                    </span>
                    <span className="text-slate-400 text-[11px] tabular-nums">({axis.leftCount}표)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px] tabular-nums">({axis.rightCount}표)</span>
                    <span className="font-semibold text-slate-800">
                      {axis.axis === 'RE' && '가능성 탐색 중심'}
                      {axis.axis === 'AC' && '협업 발전 중심'}
                      {axis.axis === 'VI' && '새로운 가능성 중심'}
                      {axis.axis === 'PO' && '피드백·조정 중심'}
                    </span>
                    <span className="font-mono font-bold text-blue-700">[{axis.right}]</span>
                  </div>
                </div>

                {/* Progress Dual Bar */}
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      axis.status === 'RESOLVED' && axis.letter === axis.left
                        ? 'bg-blue-600'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${leftPercent}%` }}
                  />
                  <div
                    className={`h-full transition-all duration-500 ${
                      axis.status === 'RESOLVED' && axis.letter === axis.right
                        ? 'bg-blue-600'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${rightPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths and Improvement Roadmap */}
      {typeDetail && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>주요 강점 및 업무 스타일</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {typeDetail.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>보완 역량 및 권장 실무 활동</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {typeDetail.improvements.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 30·60·90 Day Execution Roadmap */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Calendar className="w-4 h-4" />
            <span>단계별 성장 로드맵</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">30일 · 60일 · 90일 실행 계획</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">30일 실행 목표</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">1단계: 탐색·측정</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {typeDetail?.roadmap.stage30 || '반복 업무 1개를 선정하여 현재 소요 시간과 오류 발생 원인을 객관적으로 측정합니다.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">60일 실행 목표</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">2단계: 표준화·실습</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {typeDetail?.roadmap.stage60 || '직무별 검증된 프롬프트를 표준 매뉴얼로 정리하고 팀 내 소규모 실습을 수행합니다.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">90일 실행 목표</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">3단계: 성과 검증</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {typeDetail?.roadmap.stage90 || '절감 시간과 업무 품질 변화를 검증하고 부서 및 안경원 전반으로 확대 적용 여부를 결정합니다.'}
            </p>
          </div>
        </div>
      </div>

      {/* 응답자 직접 입력 AI 사용 현황 및 의견 (작성 시 표시) */}
      {(answers.usage?.['U_CUSTOM_USAGE'] ||
        answers.usage?.['U_CUSTOM_OPINION'] ||
        Object.keys(answers.usage || {}).some((k) => k.endsWith('_CUSTOM') && answers.usage[k])) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              AI 사용 현황 및 활용 의견 (직접 입력 내역)
            </h3>
            <p className="text-xs text-slate-500">
              응답자가 사용 현황 섹션에서 직접 작성한 AI 활용 사례 및 지원 희망 의견입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            {answers.usage?.['U_CUSTOM_USAGE'] && (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-1">
                <div className="font-bold text-blue-950">현재 주로 사용하는 AI 도구 및 활용 방식</div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {String(answers.usage['U_CUSTOM_USAGE'])}
                </p>
              </div>
            )}
            {answers.usage?.['U_CUSTOM_OPINION'] && (
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-1">
                <div className="font-bold text-indigo-950">AI 활용 애로사항 및 지원 희망 의견</div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {String(answers.usage['U_CUSTOM_OPINION'])}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 실전 AI 문제 풀이 15문항 정답 & 상세 오답노트 (해설) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  개인 AI 활용 능력 최종 평가 (초급 5 · 중급 5 · 상급 5) 결과 및 오답노트
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                초급(기초 활용 5문항) · 중급(실무 응용 5문항) · 상급(심화 거버넌스 5문항) 총 15문항에 대한 단계별 평가 결과 및 해설입니다.
              </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setQuizFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  quizFilter === 'ALL'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                전체 (15)
              </button>
              <button
                type="button"
                onClick={() => setQuizFilter('WRONG')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  quizFilter === 'WRONG'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                오답만 보기
              </button>
              <button
                type="button"
                onClick={() => setQuizFilter('CORRECT')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  quizFilter === 'CORRECT'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                정답만 보기
              </button>
            </div>

            {/* Toggle show/hide */}
            <button
              type="button"
              onClick={() => setIsQuizOpen(!isQuizOpen)}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title={isQuizOpen ? '해설 접기' : '해설 펼치기'}
            >
              {isQuizOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 3-Tier Evaluation Score Breakdown (초급 5 / 중급 5 / 상급 5) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <div className="text-[11px] font-bold text-emerald-700">초급 문제 (기초 활용)</div>
            <div className="text-xl font-extrabold font-mono text-emerald-950">
              {QUIZ_QUESTIONS.slice(0, 5).filter((q) => answers.quiz?.[q.id] === q.correctAnswer).length} / 5 정답
            </div>
            <div className="text-[11px] text-emerald-700">프롬프트 기초·보안·팩트체크</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
            <div className="text-[11px] font-bold text-blue-700">중급 문제 (실무 응용)</div>
            <div className="text-xl font-extrabold font-mono text-blue-950">
              {QUIZ_QUESTIONS.slice(5, 10).filter((q) => answers.quiz?.[q.id] === q.correctAnswer).length} / 5 정답
            </div>
            <div className="text-[11px] text-blue-700">Few-Shot·단계별추론·멀티모달</div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
            <div className="text-[11px] font-bold text-purple-700">상급 문제 (심화 거버넌스)</div>
            <div className="text-xl font-extrabold font-mono text-purple-950">
              {QUIZ_QUESTIONS.slice(10, 15).filter((q) => answers.quiz?.[q.id] === q.correctAnswer).length} / 5 정답
            </div>
            <div className="text-[11px] text-purple-700">데이터정제·기밀보안·인간개입</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
            <div className="text-[11px] font-bold text-blue-300">종합 AI 활용 능력 등급</div>
            <div className="text-base font-extrabold text-amber-300">
              {scores.quizLevelLabel ||
                ((scores.quizCorrectCount ?? 0) >= 13
                  ? '상급 마스터 (Advanced)'
                  : (scores.quizCorrectCount ?? 0) >= 9
                  ? '중급 실무자 (Intermediate)'
                  : '초급 활용자 (Basic)')}
            </div>
            <div className="text-[11px] text-slate-300">
              총 {scores.quizCorrectCount ?? 0} / 15문항 ({scores.quizScore ?? 0}점)
            </div>
          </div>
        </div>

        {/* Quiz Items List */}
        {isQuizOpen && (
          <div className="space-y-5 pt-1">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const userChoice = answers.quiz ? answers.quiz[q.id] : undefined;
              const hasAnswered = typeof userChoice === 'number';
              const isCorrect = hasAnswered && userChoice === q.correctAnswer;

              if (quizFilter === 'WRONG' && isCorrect) return null;
              if (quizFilter === 'CORRECT' && !isCorrect) return null;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    isCorrect
                      ? 'bg-slate-50/60 border-slate-200'
                      : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-bold font-mono">
                        문항 {idx + 1}
                      </span>
                      <span
                        className={`text-[11px] font-bold border px-2 py-0.5 rounded-md ${
                          q.difficulty === 'BASIC'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : q.difficulty === 'INTERMEDIATE'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}
                      >
                        {q.difficultyLabel || (idx < 5 ? '초급' : idx < 10 ? '중급' : '상급')}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                        {q.categoryLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>정답 (선택: {userChoice}번)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>
                            오답 {hasAnswered ? `(내 선택: ${userChoice}번)` : '(미응답)'} → 정답: {q.correctAnswer}번
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scenario */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block mb-0.5 font-semibold">
                        [실무 상황 시나리오]
                      </strong>
                      <span className="text-slate-600">{q.scenario}</span>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="text-sm font-bold text-slate-900">
                    {q.question}
                  </div>

                  {/* Options with Indicators */}
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {q.options.map((opt) => {
                      const isCorrectOpt = opt.number === q.correctAnswer;
                      const isUserOpt = userChoice === opt.number;

                      return (
                        <div
                          key={opt.number}
                          className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                            isCorrectOpt
                              ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400/30'
                              : isUserOpt && !isCorrectOpt
                              ? 'bg-rose-50 border-rose-300 text-rose-900 line-through opacity-85'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                              isCorrectOpt
                                ? 'bg-emerald-600 text-white'
                                : isUserOpt
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.number}
                          </span>
                          <span className="flex-1 leading-relaxed">{opt.text}</span>
                          {isCorrectOpt && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold self-start shrink-0">
                              정답
                            </span>
                          )}
                          {isUserOpt && !isCorrectOpt && (
                            <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold self-start shrink-0">
                              내 선택
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation & Davich Tip */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
                    <div className="text-blue-950 leading-relaxed">
                      <strong className="text-blue-900 block mb-1 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>정답 및 상세 해설</span>
                      </strong>
                      <span>{q.explanation}</span>
                    </div>

                    {q.davichTip && (
                      <div className="pt-2 border-t border-blue-200/60 text-blue-900 leading-relaxed flex items-start gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0 mt-0.5">
                          다비치 현장 TIP
                        </span>
                        <span>{q.davichTip}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommended Training Course */}
      {recommendedCourse && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>진단 결과 맞춤 추천 교육</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{recommendedCourse.title}</h3>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold shrink-0">
              {recommendedCourse.badge}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {recommendedCourse.description}
          </p>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400">권장 대상:</span>
              <span className="text-slate-700 font-medium ml-1.5">{recommendedCourse.targetAudience}</span>
            </div>
            <div>
              <span className="text-slate-400">예상 소요 시간:</span>
              <span className="text-slate-700 font-medium ml-1.5">{recommendedCourse.duration}</span>
            </div>
          </div>
        </div>
      )}

      {/* Proposed Automation Task Summary */}
      {answers.automation && !answers.automation.hasNoTask && answers.automation.taskName && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>제출하신 업무 자동화 과제</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              관리자 검토 접수완료
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="font-bold text-slate-900 text-sm">{answers.automation.taskName}</div>
            <div className="text-slate-600">
              <span>주당 {answers.automation.weeklyCount}회 반복</span>
              <span className="mx-2">·</span>
              <span>회당 {answers.automation.timePerTaskMinutes}분 소요</span>
              <span className="mx-2">·</span>
              <span>담당 인원 {answers.automation.headcount}명</span>
            </div>
            {answers.automation.desiredImprovement && (
              <div className="text-slate-500 pt-1">
                기대 효과: {answers.automation.desiredImprovement}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs space-y-1">
        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
          <Info className="w-4 h-4" />
          <span>결과 활용 안내</span>
        </div>
        <p className="leading-relaxed">
          본 결과는 공식 MBTI 검사가 아닌 다비치안경 사내 AI 역량 육성을 위한 참고 진단입니다. 본 진단 결과는 직원의 채용, 인사 평가, 징계에 단독으로 사용되지 않으며, 안전하고 스마트한 업무 지원을 위해서만 활용됩니다.
        </p>
      </div>
    </div>
  );
};
