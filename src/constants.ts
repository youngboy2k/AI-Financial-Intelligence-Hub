/**
 * Supported languages for the application.
 */
export type Language = 'ko' | 'en';

/**
 * Interface for all translatable strings in the UI.
 */
export interface Translations {
  title: string;
  subtitle: string;
  systemStatus: string;
  lastSync: string;
  fetchingData: string;
  loadingSteps: string[];
  retry: string;
  marketIntelligence: string;
  disclaimer: string;
  refresh: string;
  globalMarkets: string;
  liveIndices: string;
  commodities: string;
  aboutTitle: string;
  aboutContent: string;
  source: string;
  updated: string;
}

/**
 * Translation dictionary for Korean and English.
 */
export const translations: Record<Language, Translations> = {
  ko: {
    title: "AI 금융 인텔리전스\n커맨드 센터",
    subtitle: "실시간 주요 경제 지표 분석",
    systemStatus: "시스템 상태: 정상",
    lastSync: "마지막 동기화",
    fetchingData: "AI가 글로벌 시장 데이터를 분석하는 중...",
    loadingSteps: [
      "전 세계 금융 네트워크 접속 중...",
      "실시간 시장 지표 수집 중...",
      "Gemini AI가 트렌드 분석 및 검증 중...",
      "고정밀 경제 데이터 구조화 중...",
      "최종 인텔리전스 리포트 생성 중..."
    ],
    retry: "다시 시도",
    marketIntelligence: "시장 인텔리전스",
    disclaimer: "데이터는 Gemini 3 Flash와 Google 검색을 통해 실시간으로 수집됩니다. 표시된 수치는 가장 최신의 공개 정보이며 소스 업데이트에 따라 약간의 지연이 있을 수 있습니다.",
    refresh: "데이터 새로고침",
    globalMarkets: "글로벌 시장",
    liveIndices: "실시간 지수",
    commodities: "원자재",
    aboutTitle: "글로벌 금융 모니터란?",
    aboutContent: "본 서비스는 전 세계 투자자와 경제 관심층을 위해 원/달러 환율, 국제 유가(WTI, 브렌트, 두바이), 코스피/코스닥 및 나스닥 지수 등 핵심 경제 지표를 한눈에 파악할 수 있도록 설계된 실시간 대시보드입니다. 최신 AI 기술을 활용하여 복잡한 검색 없이도 가장 정확한 시장 흐름을 전달합니다.",
    source: "출처: Google 검색 (Gemini AI 제공)",
    updated: "업데이트"
  },
  en: {
    title: "AI Financial\nIntelligence Hub",
    subtitle: "Real-time Economic Insight Engine",
    systemStatus: "System Status: Online",
    lastSync: "Last Sync",
    fetchingData: "AI is analyzing global market data...",
    loadingSteps: [
      "Connecting to global financial networks...",
      "Gathering real-time market indicators...",
      "Gemini AI analyzing trends and verifying data...",
      "Structuring high-precision economic data...",
      "Generating final intelligence report..."
    ],
    retry: "Retry Connection",
    marketIntelligence: "Market Intelligence",
    disclaimer: "Data is retrieved via Google Search Grounding using Gemini 3 Flash. Values represent the most recent publicly available information and may have a slight delay depending on source updates.",
    refresh: "Refresh Data",
    globalMarkets: "Global Markets",
    liveIndices: "Live Indices",
    commodities: "Commodities",
    aboutTitle: "What is Global Finance Monitor?",
    aboutContent: "This service is a real-time dashboard designed for global investors and economic enthusiasts to track key indicators such as USD/KRW exchange rates, international oil prices (WTI, Brent, Dubai), and major indices like KOSPI, KOSDAQ, and NASDAQ. Leveraging cutting-edge AI, it delivers accurate market trends without the need for complex searching.",
    source: "Source: Google Search via Gemini AI",
    updated: "Updated"
  }
};

/**
 * Detects the user's browser language and returns the best match.
 * Defaults to 'en' if 'ko' is not detected.
 */
export function getLanguage(): Language {
  const lang = navigator.language || (navigator as any).userLanguage;
  return lang.startsWith('ko') ? 'ko' : 'en';
}
