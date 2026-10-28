/**
 * Generates a customized 1200x630 KakaoTalk / OpenGraph thumbnail image (Data URL)
 * where the Topic (주제) and Subtitle (부주제) dynamically display the created company link name.
 */
export function generateCompanyThumbnailDataUrl(
  companyName: string,
  customTopic?: string,
  customSubtitle?: string
): string {
  if (typeof document === 'undefined') return 'og-image.png';

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'og-image.png';

  const cleanName = (companyName || '다비치안경').trim();
  const mainTitle = customTopic || `${cleanName} AI 역량 & 성향 진단`;
  const subTitle = customSubtitle || `${cleanName} 임직원 전용 16 성향 & 실무 역량 진단`;

  // 1. Deep Navy Tech Gradient Background (matching Davich brand identity)
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGrad.addColorStop(0, '#04142c');
  bgGrad.addColorStop(0.5, '#082552');
  bgGrad.addColorStop(1, '#051938');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // Subtle radial glow in center-right and top-left
  const radial1 = ctx.createRadialGradient(900, 160, 20, 900, 160, 420);
  radial1.addColorStop(0, 'rgba(37, 99, 235, 0.32)');
  radial1.addColorStop(1, 'rgba(37, 99, 235, 0)');
  ctx.fillStyle = radial1;
  ctx.fillRect(0, 0, 1200, 630);

  const radial2 = ctx.createRadialGradient(220, 480, 20, 220, 480, 380);
  radial2.addColorStop(0, 'rgba(56, 189, 248, 0.20)');
  radial2.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = radial2;
  ctx.fillRect(0, 0, 1200, 630);

  // Tech border frame
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, 1112, 542);

  // Corner accents
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(44, 84);
  ctx.lineTo(44, 44);
  ctx.lineTo(84, 44);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(1156, 546);
  ctx.lineTo(1156, 586);
  ctx.lineTo(1116, 586);
  ctx.stroke();

  // 2. Top Brand Pill ("DAVICH" + Company Badge)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 28px "Pretendard", "Malgun Gothic", sans-serif';
  ctx.fillText(`DAVICH · ${cleanName}`, 600, 145);

  // 3. Main Brand Header: DAVICH AI FIT 16
  ctx.font = '900 84px "Pretendard", "Malgun Gothic", sans-serif';
  const brandPart1 = 'DAVICH ';
  const brandPart2 = 'AI FIT 16';
  const w1 = ctx.measureText(brandPart1).width;
  const w2 = ctx.measureText(brandPart2).width;
  const totalW = w1 + w2;
  const startX = (1200 - totalW) / 2;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(brandPart1, startX, 255);
  ctx.fillStyle = '#2997ff';
  ctx.fillText(brandPart2, startX + w1, 255);

  // 4. Dynamic Topic (주제: 각각의 링크 생성 이름)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  const topicFontSize = mainTitle.length > 22 ? 48 : mainTitle.length > 16 ? 54 : 60;
  ctx.font = `bold ${topicFontSize}px "Pretendard", "Malgun Gothic", sans-serif`;
  ctx.fillText(mainTitle, 600, 355);

  // Divider line
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(320, 405);
  ctx.lineTo(880, 405);
  ctx.stroke();

  // 5. Dynamic Subtitle (부주제: 각각의 링크 생성 이름 기반 부주제)
  ctx.fillStyle = '#bae6fd';
  const subFontSize = subTitle.length > 30 ? 30 : 36;
  ctx.font = `600 ${subFontSize}px "Pretendard", "Malgun Gothic", sans-serif`;
  ctx.fillText(subTitle, 600, 465);

  // 6. Bottom Participation Badge
  ctx.fillStyle = 'rgba(37, 99, 235, 0.35)';
  ctx.beginPath();
  ctx.roundRect(380, 505, 440, 46, 23);
  ctx.fill();
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#e0f2fe';
  ctx.font = 'bold 22px "Pretendard", "Malgun Gothic", sans-serif';
  ctx.fillText(`${cleanName} 전용 설문 링크 · 수신 후 1주일 내 참여`, 600, 535);

  return canvas.toDataURL('image/png');
}
