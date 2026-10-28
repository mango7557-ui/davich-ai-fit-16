import {
  AxisCode,
  AxisScore,
  PreferenceResult,
  AssessmentScores,
} from '../types/davich';
import {
  SAFETY_QUESTION_IDS,
  USAGE_QUESTIONS,
  QUIZ_QUESTIONS,
} from '../data/questionBank';

const AXIS_QUESTIONS: Record<AxisCode, { questions: string[]; left: string; right: string }> = {
  RE: { questions: ['T01', 'T05', 'T09', 'T13', 'T17', 'T21'], left: 'R', right: 'E' },
  AC: { questions: ['T02', 'T06', 'T10', 'T14', 'T18', 'T22'], left: 'A', right: 'C' },
  VI: { questions: ['T03', 'T07', 'T11', 'T15', 'T19', 'T23'], left: 'V', right: 'I' },
  PO: { questions: ['T04', 'T08', 'T12', 'T16', 'T20', 'T24'], left: 'P', right: 'O' },
};

export function normalizeLikert(score: number): number {
  if (score < 1) return 0;
  if (score > 5) return 100;
  return Math.round(((score - 1) / 4) * 100);
}

export function calculateCapabilityScore(answers: Record<string, number>): number {
  const ids = Array.from({ length: 20 }, (_, i) => `C${String(i + 1).padStart(2, '0')}`);
  let sum = 0;
  let count = 0;

  for (const id of ids) {
    if (typeof answers[id] === 'number') {
      sum += normalizeLikert(answers[id]);
      count++;
    }
  }

  return count > 0 ? Math.round(sum / count) : 0;
}

export function calculateSafetyScore(answers: Record<string, number>): number {
  let sum = 0;
  let count = 0;

  for (const id of SAFETY_QUESTION_IDS) {
    if (typeof answers[id] === 'number') {
      sum += normalizeLikert(answers[id]);
      count++;
    }
  }

  return count > 0 ? Math.round(sum / count) : 0;
}

export function calculateQuizScore(quizAnswers: Record<string, number> = {}): {
  quizScore: number;
  quizCorrectCount: number;
  quizTotalCount: number;
  quizBasicCorrect: number;
  quizIntermediateCorrect: number;
  quizAdvancedCorrect: number;
  quizLevelLabel: string;
  quizDetails: { questionId: string; selectedAnswer: number; isCorrect: boolean }[];
} {
  const totalCount = QUIZ_QUESTIONS.length; // 15
  let correctCount = 0;
  let basicCorrect = 0;
  let intermediateCorrect = 0;
  let advancedCorrect = 0;
  const details: { questionId: string; selectedAnswer: number; isCorrect: boolean }[] = [];

  QUIZ_QUESTIONS.forEach((q, idx) => {
    const userChoice = quizAnswers[q.id];
    const isCorrect = userChoice === q.correctAnswer;
    const diff = q.difficulty || (idx < 5 ? 'BASIC' : idx < 10 ? 'INTERMEDIATE' : 'ADVANCED');
    if (isCorrect) {
      correctCount++;
      if (diff === 'BASIC') basicCorrect++;
      else if (diff === 'INTERMEDIATE') intermediateCorrect++;
      else advancedCorrect++;
    }
    details.push({
      questionId: q.id,
      selectedAnswer: userChoice || 0,
      isCorrect,
    });
  });

  const quizScore = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const quizLevelLabel =
    correctCount >= 13
      ? '상급 마스터 (Advanced)'
      : correctCount >= 9
      ? '중급 실무자 (Intermediate)'
      : correctCount >= 5
      ? '초급 활용자 (Basic)'
      : '기초 입문자 (Starter)';

  return {
    quizScore,
    quizCorrectCount: correctCount,
    quizTotalCount: totalCount,
    quizBasicCorrect: basicCorrect,
    quizIntermediateCorrect: intermediateCorrect,
    quizAdvancedCorrect: advancedCorrect,
    quizLevelLabel,
    quizDetails: details,
  };
}

export function calculatePreference(answers: Record<string, 1 | 2>): PreferenceResult {
  const axesOrder: AxisCode[] = ['RE', 'AC', 'VI', 'PO'];
  const tiedAxes: AxisCode[] = [];
  const axisScores: AxisScore[] = [];

  for (const axis of axesOrder) {
    const config = AXIS_QUESTIONS[axis];
    let leftCount = 0;
    let rightCount = 0;

    for (const qId of config.questions) {
      const choice = answers[qId];
      if (choice === 1) leftCount++;
      else if (choice === 2) rightCount++;
    }

    const isTied = leftCount === rightCount;
    if (isTied) {
      tiedAxes.push(axis);
    }

    const letter = isTied ? null : leftCount > rightCount ? config.left : config.right;

    axisScores.push({
      axis,
      left: config.left,
      right: config.right,
      leftCount,
      rightCount,
      status: isTied ? 'TIED' : 'RESOLVED',
      letter,
    });
  }

  const isResolved = tiedAxes.length === 0;
  const partialCode = axisScores.map((a) => a.letter ?? '?').join('');
  const typeCode = isResolved ? partialCode : null;

  return {
    status: isResolved ? 'RESOLVED' : 'PENDING_TIE',
    typeCode,
    partialCode,
    tiedAxes,
    axes: axisScores,
  };
}

export function evaluateAssessmentScores(
  usageAnswers: Record<string, any>,
  capabilityAnswers: Record<string, number>,
  preferenceAnswers: Record<string, 1 | 2>,
  quizAnswers?: Record<string, number>,
): AssessmentScores {
  const capabilityScore = calculateCapabilityScore(capabilityAnswers);
  const safetyScore = calculateSafetyScore(capabilityAnswers);
  const preference = calculatePreference(preferenceAnswers);
  const quizResult = calculateQuizScore(quizAnswers || {});

  const u01Value = usageAnswers['U01'];
  const u01Option = USAGE_QUESTIONS.find((q) => q.id === 'U01')?.options.find((o) => o.value === u01Value);
  const usageFrequency = u01Option ? u01Option.label : '미응답';

  const uSavedValue = usageAnswers['U07'] || usageAnswers['U05'];
  const uSavedOption =
    USAGE_QUESTIONS.find((q) => q.id === 'U07')?.options.find((o) => o.value === uSavedValue) ||
    USAGE_QUESTIONS.find((q) => q.id === 'U05')?.options.find((o) => o.value === uSavedValue);
  const estimatedHoursSavedDaily = uSavedOption ? uSavedOption.label : '미응답';

  return {
    capabilityScore,
    safetyScore,
    quizScore: quizResult.quizScore,
    quizCorrectCount: quizResult.quizCorrectCount,
    quizTotalCount: quizResult.quizTotalCount,
    quizBasicCorrect: quizResult.quizBasicCorrect,
    quizIntermediateCorrect: quizResult.quizIntermediateCorrect,
    quizAdvancedCorrect: quizResult.quizAdvancedCorrect,
    quizLevelLabel: quizResult.quizLevelLabel,
    quizDetails: quizResult.quizDetails,
    usageFrequency,
    estimatedHoursSavedDaily,
    preference,
  };
}

export function calculateAutomationPriority(
  weeklyCount: number,
  timeMinutes: number,
  headcount: number,
  securityRisk: 'YES' | 'NO' | 'UNSURE',
): { priorityScore: number; expectedWeeklyHoursSaved: number } {
  // Weekly total minutes spent
  const totalWeeklyMinutes = Math.max(0, weeklyCount) * Math.max(0, timeMinutes) * Math.max(1, headcount);
  // Assume ~40% time savings with AI automation
  const expectedWeeklyMinutesSaved = totalWeeklyMinutes * 0.4;
  const expectedWeeklyHoursSaved = Math.round((expectedWeeklyMinutesSaved / 60) * 10) / 10;

  // Priority formula: frequency & time weight + headcount weight
  // Security risk penalizes automatic high priority until reviewed
  let rawScore = 30;
  if (weeklyCount >= 5) rawScore += 20;
  else if (weeklyCount >= 2) rawScore += 10;

  if (timeMinutes >= 60) rawScore += 25;
  else if (timeMinutes >= 30) rawScore += 15;

  if (headcount >= 5) rawScore += 25;
  else if (headcount >= 2) rawScore += 15;

  if (securityRisk === 'YES') {
    // Requires security clearance, score capped to indicate gate
    rawScore = Math.min(rawScore, 65);
  }

  const priorityScore = Math.min(100, Math.max(10, rawScore));

  return {
    priorityScore,
    expectedWeeklyHoursSaved,
  };
}
