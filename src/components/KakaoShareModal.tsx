import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Download,
  Clock,
  Sparkles,
  Eye,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Key,
} from 'lucide-react';
import { Company } from '../types/davich';

interface KakaoShareModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  surveyUrl: string;
}

declare global {
  interface Window {
    Kakao?: any;
  }
}

// Default public Kakao demo/javascript key or user key
const KAKAO_STORAGE_KEY = 'davich_kakao_js_key';

export const KakaoShareModal: React.FC<KakaoShareModalProps> = ({
  company,
  isOpen,
  onClose,
  surveyUrl,
}) => {
  const companyName = company?.name || '기업';
  const defaultTopic = `[${companyName}] 임직원 AI 역량 & 16 성향 진단 (DAVICH AI FIT 16)`;
  const defaultSubtitle = `16개 업무 성향 진단 및 현장 업무 자동화 설문 참여 (소요시간: 약 10~15분 · 수신 후 1주일 이내 완료)`;

  const [topic, setTopic] = useState(defaultTopic);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [copiedType, setCopiedType] = useState<'ALL' | 'LINK' | 'IMAGE' | null>(null);
  const [kakaoKey, setKakaoKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(KAKAO_STORAGE_KEY) || '';
    }
    return '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [kakaoStatus, setKakaoStatus] = useState<string>('');

  useEffect(() => {
    if (company) {
      setTopic(`[${company.name}] 임직원 AI 역량 & 16 성향 진단 (DAVICH AI FIT 16)`);
      setSubtitle(`16개 업무 성향 진단 및 현장 업무 자동화 설문 참여 (소요시간: 약 10~15분 · 수신 후 1주일 이내 완료)`);
    }
  }, [company]);

  if (!isOpen || !company) return null;

  // Absolute thumbnail URL
  const absoluteThumbnailUrl =
    typeof window !== 'undefined'
      ? new URL('og-image.png', window.location.href).href
      : 'og-image.png';

  const fullDisplayUrl =
    typeof window !== 'undefined'
      ? `${window.location.host}${window.location.pathname}?company=${company.code}`
      : surveyUrl;

  // Complete formatted KakaoTalk message text
  const fullMessageText = `[${company.name} 임직원 AI 역량 & 16 성향 진단 안내]

📌 주제: ${topic}
📝 부주제: ${subtitle}

⏱️ 소요 시간: 약 10~15분 (모바일/PC 지원)
⏰ 참여 기한: 설문 링크 수신 후 1주일 이내 완료 필수 (기한 경과 시 분석 제한)

🔗 ${company.name} 전용 설문 참여 링크:
${surveyUrl}

※ 별도의 회원가입 없이 위 링크로 접속하시면 [${company.name}] 소속으로 자동 연결되어 진단이 시작됩니다.`;

  // Handle KakaoTalk JS SDK Share
  const handleKakaoShare = async () => {
    try {
      if (typeof window === 'undefined') return;

      // 1. Try Kakao JS SDK if loaded and initialized
      if (window.Kakao) {
        if (!window.Kakao.isInitialized() && kakaoKey.trim()) {
          try {
            window.Kakao.init(kakaoKey.trim());
          } catch (e) {
            console.error('Kakao init error:', e);
          }
        }

        if (window.Kakao.isInitialized() && window.Kakao.Share) {
          window.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title: topic,
              description: subtitle,
              imageUrl: absoluteThumbnailUrl,
              link: {
                mobileWebUrl: surveyUrl,
                webUrl: surveyUrl,
              },
            },
            buttons: [
              {
                title: '설문 참여하기',
                link: {
                  mobileWebUrl: surveyUrl,
                  webUrl: surveyUrl,
                },
              },
            ],
          });
          setKakaoStatus('카카오톡 공유창이 열렸습니다.');
          setTimeout(() => setKakaoStatus(''), 3000);
          return;
        }
      }

      // 2. Try native navigator.share (works on mobile browsers and supported desktops)
      if (navigator.share) {
        try {
          await navigator.share({
            title: topic,
            text: `${topic}\n${subtitle}\n(수신 후 1주일 이내 완료)`,
            url: surveyUrl,
          });
          setKakaoStatus('공유가 완료되었습니다.');
          setTimeout(() => setKakaoStatus(''), 3000);
          return;
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.log('Share error:', err);
          }
        }
      }

      // 3. Fallback: Copy to clipboard and notify
      await navigator.clipboard.writeText(fullMessageText);
      setCopiedType('ALL');
      setKakaoStatus('카카오톡 공유용 메시지가 클립보드에 복사되었습니다! 카톡 대화방에 붙여넣기(Ctrl+V)하세요.');
      setTimeout(() => {
        setCopiedType(null);
        setKakaoStatus('');
      }, 4000);
    } catch (e) {
      console.error(e);
      navigator.clipboard.writeText(fullMessageText);
      setCopiedType('ALL');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(fullMessageText);
    setCopiedType('ALL');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyLinkOnly = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopiedType('LINK');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleSaveKakaoKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(KAKAO_STORAGE_KEY, kakaoKey.trim());
      if (window.Kakao && kakaoKey.trim()) {
        try {
          window.Kakao.cleanup();
          window.Kakao.init(kakaoKey.trim());
        } catch (e) {
          console.error(e);
        }
      }
      setShowKeyInput(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEE500] text-[#191919] flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              💬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  카카오톡 공유 카드 자동 생성
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE500] text-[#3A1D1D]">
                  자동 완성
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong>{company.name}</strong> 전용 썸네일, 주제, 부주제가 결합된 카카오톡 카드입니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Status notification toast if triggered */}
        {kakaoStatus && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{kakaoStatus}</span>
          </div>
        )}

        {/* Live KakaoTalk Chat Screen Simulation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>카카오톡 전송 시 실제 표시 화면 (실시간 미리보기)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">16:9 썸네일 자동 연동</span>
          </div>

          {/* Kakao Mockup Container */}
          <div className="bg-[#BACEE0] p-4 sm:p-5 rounded-2xl border border-slate-300/80 shadow-inner">
            <div className="flex items-start gap-2.5 max-w-sm sm:max-w-md">
              {/* Profile icon */}
              <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center p-1 shrink-0 shadow-2xs">
                <img
                  src="assets/aistudio/___-_ceodavich_final_clean_da550648.png"
                  alt="다비치"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Chat Message & Rich Link Card */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-slate-700 block">
                  다비치안경 관리자
                </span>

                {/* White Card Bubble */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/90 text-left hover:shadow-md transition-shadow">
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-blue-900 to-indigo-950 overflow-hidden">
                    <img
                      src="og-image.png"
                      alt="다비치안경 AI FIT 16 썸네일"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-blue-600/90 text-white font-bold text-[10px] tracking-wide shadow-xs backdrop-blur-xs">
                      {company.name} 전용
                    </div>
                  </div>

                  {/* Card Content Area */}
                  <div className="p-3.5 space-y-1.5">
                    {/* Topic (주제) */}
                    <div className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {topic}
                    </div>

                    {/* Subtitle (부주제) */}
                    <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {subtitle}
                    </div>

                    {/* Domain & Action */}
                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono truncate max-w-[200px]">
                        {fullDisplayUrl}
                      </span>
                      <span className="text-blue-600 font-bold flex items-center gap-1 shrink-0">
                        <span>설문 참여</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 pl-1 block">
                  방금 전 · 카카오톡 링크 카드
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1주일 완성 안내 뱃지 */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-950 text-xs flex items-start gap-2.5 shadow-2xs">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-amber-900">
              카카오톡 배포 시 필수 안내사항
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              직원에게 전달 시 <strong className="font-extrabold text-amber-950 underline decoration-amber-400">"설문 링크 수신 후 1주일 시간 동안 완성하셔야 합니다"</strong> 문구가 자동으로 함께 복사됩니다.
            </p>
          </div>
        </div>

        {/* Topic & Subtitle customization fields (folded / editable) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>주제 & 부주제 문구 확인/수정</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setTopic(defaultTopic);
                setSubtitle(defaultSubtitle);
              }}
              className="text-[11px] text-slate-400 hover:text-blue-600 font-medium underline"
            >
              기본값으로 초기화
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] mb-1 block font-semibold">
                주제 (메인 타이틀)
              </span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
              />
            </div>
            <div>
              <span className="text-slate-500 text-[11px] mb-1 block font-semibold">
                부주제 (설명 문구)
              </span>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          {/* Main Kakao Yellow Share Button */}
          <button
            type="button"
            onClick={handleKakaoShare}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FEE500] hover:bg-[#FDD835] active:bg-[#FBC02D] text-[#191919] font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span className="text-lg">💬</span>
            <span>카카오톡으로 바로 공유하기</span>
            <ExternalLink className="w-4 h-4 text-[#3A1D1D] group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Copy Message and Copy Link row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={handleCopyAll}
              className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                copiedType === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
              }`}
            >
              {copiedType === 'ALL' ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>메시지 전체 복사완료!</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Copy className="w-4 h-4" />
                  <span>카톡 메시지 전문 복사</span>
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLinkOnly}
              className={`py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                copiedType === 'LINK'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {copiedType === 'LINK' ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>링크 복사완료!</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>전용 참여 링크만 복사</span>
                </span>
              )}
            </button>
          </div>

          {/* Download / Copy Thumbnail Asset */}
          <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
            <a
              href="og-image.png"
              download={`${company.code}-kakao-thumbnail.png`}
              className="text-slate-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>1200x630 썸네일 이미지 직접 다운로드</span>
            </a>

            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 underline"
            >
              <Key className="w-3 h-3" />
              <span>카카오 JS 키 설정</span>
            </button>
          </div>

          {/* Optional Kakao JavaScript Key Form */}
          {showKeyInput && (
            <form onSubmit={handleSaveKakaoKey} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>카카오 Developers JavaScript 키 (선택사항)</span>
                <span className="text-[10px] text-slate-400">developers.kakao.com</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="예: 32자리 Javascript 키"
                  value={kakaoKey}
                  onChange={(e) => setKakaoKey(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs"
                >
                  저장
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                키가 없어도 [카톡 메시지 전문 복사] 및 모바일 Web Share로 카카오톡 공유가 완벽히 작동합니다.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
