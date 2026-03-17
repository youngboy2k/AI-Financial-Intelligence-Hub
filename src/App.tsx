import { useState, useEffect, useCallback, useMemo, memo, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Globe, Activity, Droplets, AlertCircle, Info } from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchFinanceData, DashboardData } from './services/geminiService';
import { FinanceCard } from './components/FinanceCard';
import { getLanguage, translations, Language } from './constants';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

const SortableItem = memo(({ id, children }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full cursor-grab active:cursor-grabbing">
      {children}
    </div>
  );
});

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Main Application Component
 * Manages the global state, data fetching, caching, and drag-and-drop functionality.
 */
export default function App() {
  // Language state and translations
  const [lang, setLang] = useState<Language>(getLanguage());
  const t = translations[lang];
  
  // Dashboard data and UI states
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [loadingStep, setLoadingStep] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  // Card order state for drag-and-drop persistence
  const [cardOrder, setCardOrder] = useState<string[]>(['wti', 'brent', 'dubai', 'kospi', 'kosdaq', 'nasdaq', 'exchangeRate', 'goldPrice']);

  const CACHE_KEY = 'finance_dashboard_cache';
  const ORDER_KEY = 'finance_dashboard_order';
  const CACHE_DURATION = 1 * 60 * 1000; // 1 minute cache duration

  // Configure sensors for dnd-kit (Pointer, Touch, Keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handles the end of a drag operation to update card order.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Persist the new order to local storage
        localStorage.setItem(ORDER_KEY, JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  // Load saved card order on initial mount
  useEffect(() => {
    const savedOrder = localStorage.getItem(ORDER_KEY);
    if (savedOrder) {
      try {
        setCardOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error("Failed to parse saved order");
      }
    }
  }, []);

  // Update loading step message periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < t.loadingSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading, t.loadingSteps.length]);

  /**
   * Core data loading function with caching and pre-fetching logic.
   * Uses a Stale-While-Revalidate pattern.
   * 
   * @param force - If true, ignores fresh cache and forces a network request.
   */
  const loadData = useCallback(async (force = false) => {
    const now = Date.now();
    
    // 1. Refresh Throttle (prevent spamming the API)
    if (force && now - lastClickTime < 5000) {
      console.log("Refresh throttled");
      return;
    }
    if (force) setLastClickTime(now);

    // 2. Cache Logic (Stale-While-Revalidate)
    const cached = localStorage.getItem(CACHE_KEY);
    
    if (cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const age = now - timestamp;
        
        // If not forced, show cached data immediately for zero-latency UI
        if (!force) {
          setData(cachedData);
          setLastRefreshed(new Date(timestamp));
          
          // If cache is still fresh, we don't need to fetch from network
          if (age < CACHE_DURATION) {
            setLoading(false);
            return;
          }
        }
        // If forced but we have cache, we can still show it while loading in background
        else {
          setData(cachedData);
        }
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    // If we don't have data at all, show full loading screen with steps
    if (!data && !cached) {
      setLoading(true);
      setLoadingStep(0);
    }
    
    setError(null);
    try {
      // Fetch fresh data from Gemini service
      const result = await fetchFinanceData(lang);
      setData(result);
      const refreshDate = new Date();
      setLastRefreshed(refreshDate);
      
      // Save to cache for future visits
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: result,
        timestamp: refreshDate.getTime()
      }));

      // Background pre-fetch for the other language to make switching instant
      const otherLang = lang === 'ko' ? 'en' : 'ko';
      const otherCacheKey = `finance_data_${otherLang}`;
      const otherCached = localStorage.getItem(otherCacheKey);
      if (!otherCached || (now - JSON.parse(otherCached).timestamp > CACHE_DURATION)) {
        fetchFinanceData(otherLang).then(otherResult => {
          localStorage.setItem(otherCacheKey, JSON.stringify({
            data: otherResult,
            timestamp: Date.now()
          }));
        }).catch(() => {}); // Silent fail for pre-fetch
      }
    } catch (err) {
      setError(lang === 'ko' ? '최신 금융 데이터를 가져오지 못했습니다. 나중에 다시 시도해 주세요.' : 'Failed to retrieve the latest financial data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [lang, lastClickTime, data, CACHE_DURATION]);

  // Load data whenever language changes
  useEffect(() => {
    loadData();
  }, [lang]);

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg text-ink p-8">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 text-rose-500" size={48} />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="opacity-70 mb-6">The application encountered an unexpected error. Please refresh the page.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-ink text-white rounded-lg uppercase text-xs font-bold tracking-widest">
            Refresh Page
          </button>
        </div>
      </div>
    }>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-ink focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-xl focus:font-bold focus:uppercase focus:text-xs focus:tracking-widest">
        Skip to Content
      </a>
      <div className="min-h-screen flex flex-col relative">
      {/* Background Effects */}
      <div className="bg-animate" />
      <div className="bg-noise" />
      
      {/* Header */}
      <header className="border-b border-ink/5 p-4 md:p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-50">
        <div className="flex-grow">
          <h1 className={`text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase mb-2 whitespace-pre-line modern-title animate-float ${lang === 'ko' ? 'leading-[1.1] py-1' : 'leading-[0.9]'}`}>
            {t.title}
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="col-header opacity-60 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.subtitle}
            </div>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setLang('ko')}
                aria-label="Switch to Korean"
                className={`text-[9px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded-lg transition-all border ${lang === 'ko' ? 'bg-ink text-white border-ink shadow-lg' : 'bg-white/30 text-ink/60 border-white/20 hover:bg-white/60 hover:text-ink'}`}
              >
                KO
              </button>
              <button 
                onClick={() => setLang('en')}
                aria-label="Switch to English"
                className={`text-[9px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded-lg transition-all border ${lang === 'en' ? 'bg-ink text-white border-ink shadow-lg' : 'bg-white/30 text-ink/60 border-white/20 hover:bg-white/60 hover:text-ink'}`}
              >
                EN
              </button>
              <button 
                onClick={() => loadData(true)}
                disabled={loading}
                aria-label="Refresh financial data"
                className="ml-4 flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] uppercase bg-white/30 text-ink/80 border border-white/20 px-5 py-2 rounded-lg hover:bg-white/60 hover:text-ink transition-all disabled:opacity-30 shadow-sm"
              >
                <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                {t.refresh}
              </button>
            </div>
          </div>
        </div>
        <div className="text-left md:text-right w-full md:w-auto shrink-0">
          <div className="text-[9px] uppercase tracking-[0.3em] opacity-40 mb-2 font-bold flex items-center md:justify-end gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t.systemStatus}
          </div>
          <div className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-bold">
            {t.lastSync}: {lastRefreshed.toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-grow p-4 md:p-6 lg:p-8 relative z-10">
        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="relative z-10 p-8 border border-ink/10 rounded-full bg-white/10 backdrop-blur-sm"
              >
                <RefreshCw className="text-emerald-500" size={48} />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg z-20"
              >
                <Activity size={16} />
              </motion.div>
            </div>
            
            <div className="flex flex-col items-center gap-3 text-center max-w-sm">
              <div className="h-12 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={loadingStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="text-xl font-bold tracking-tight text-ink uppercase"
                  >
                    {t.loadingSteps[loadingStep]}
                    {loadingStep === t.loadingSteps.length - 1 && (
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-1"
                      >
                        ...
                      </motion.span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="w-48 h-1 bg-ink/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500"
                  animate={loadingStep === t.loadingSteps.length - 1 
                    ? { 
                        width: ["90%", "100%", "90%"],
                        opacity: [0.8, 1, 0.8]
                      } 
                    : { 
                        width: `${((loadingStep + 1) / t.loadingSteps.length) * 100}%` 
                      }
                  }
                  transition={loadingStep === t.loadingSteps.length - 1 
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.5 }
                  }
                />
              </div>
              <div className="col-header text-[10px] opacity-40 animate-pulse">
                {t.fetchingData}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 text-rose-600">
            <AlertCircle size={48} />
            <p className="max-w-md text-center font-medium">{error}</p>
            <button 
              onClick={() => loadData(true)}
              className="mt-4 px-6 py-2 border border-rose-600 hover:bg-rose-600 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
            >
              {t.retry}
            </button>
          </div>
        ) : data ? (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={cardOrder}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cardOrder.map((id, index) => {
                  const commonProps = {
                    updatedLabel: t.updated,
                    delay: index * 0.1,
                  };

                  let cardContent = null;
                  switch (id) {
                    case 'exchangeRate':
                      cardContent = (
                        <FinanceCard 
                          title={lang === 'ko' ? "원/달러 환율" : "USD / KRW Exchange Rate"}
                          value={data.exchangeRate.value}
                          change={data.exchangeRate.change}
                          unit={data.exchangeRate.unit}
                          description={data.exchangeRate.description}
                          lastUpdated={data.exchangeRate.lastUpdated}
                          {...commonProps}
                        />
                      );
                      break;
                    case 'kospi':
                      cardContent = (
                        <FinanceCard 
                          title={lang === 'ko' ? "코스피 지수" : "KOSPI Index"}
                          value={data.kospi.value}
                          change={data.kospi.change}
                          unit={data.kospi.unit}
                          description={data.kospi.description}
                          lastUpdated={data.kospi.lastUpdated}
                          {...commonProps}
                        />
                      );
                      break;
                    case 'kosdaq':
                      cardContent = (
                        <FinanceCard 
                          title={lang === 'ko' ? "코스닥 지수" : "KOSDAQ Index"}
                          value={data.kosdaq.value}
                          change={data.kosdaq.change}
                          unit={data.kosdaq.unit}
                          description={data.kosdaq.description}
                          lastUpdated={data.kosdaq.lastUpdated}
                          {...commonProps}
                        />
                      );
                      break;
                    case 'nasdaq':
                      cardContent = (
                        <FinanceCard 
                          title={lang === 'ko' ? "나스닥 종합지수" : "NASDAQ Composite"}
                          value={data.nasdaq.value}
                          change={data.nasdaq.change}
                          unit={data.nasdaq.unit}
                          description={data.nasdaq.description}
                          lastUpdated={data.nasdaq.lastUpdated}
                          {...commonProps}
                        />
                      );
                      break;
                    case 'wti':
                      cardContent = (
                        <FinanceCard 
                          title={lang === 'ko' ? "WTI 원유" : "WTI Crude Oil"}
                          value={data.oilPrices.wti.value}
                          change={data.oilPrices.wti.change}
                          unit={data.oilPrices.wti.unit}
                          description={data.oilPrices.wti.description}
                          lastUpdated={data.oilPrices.wti.lastUpdated}
                          {...commonProps}
                        />
                      );
                      break;
                    case 'brent':
                      cardContent = (
                        <FinanceCard 
                          title={lang === 'ko' ? "브렌트유" : "Brent Crude Oil"}
                          value={data.oilPrices.brent.value}
                          change={data.oilPrices.brent.change}
                          unit={data.oilPrices.brent.unit}
                          description={data.oilPrices.brent.description}
                          lastUpdated={data.oilPrices.brent.lastUpdated}
                          {...commonProps}
                        />
                      );
                      break;
                    case 'dubai':
                      cardContent = (
                        <FinanceCard 
                          title={lang === 'ko' ? "두바이유" : "Dubai Crude Oil"}
                          value={data.oilPrices.dubai.value}
                          change={data.oilPrices.dubai.change}
                          unit={data.oilPrices.dubai.unit}
                          description={data.oilPrices.dubai.description}
                          lastUpdated={data.oilPrices.dubai.lastUpdated}
                          {...commonProps}
                        />
                      );
                      break;
                    case 'goldPrice':
                      cardContent = (
                        <FinanceCard 
                          title={lang === 'ko' ? "국제 금 시세" : "International Gold Price"}
                          value={data.goldPrice.value}
                          change={data.goldPrice.change}
                          unit={data.goldPrice.unit}
                          description={data.goldPrice.description}
                          lastUpdated={data.goldPrice.lastUpdated}
                          {...commonProps}
                        />
                      );
                      break;
                  }

                  return cardContent ? (
                    <SortableItem key={id} id={id}>
                      {cardContent}
                    </SortableItem>
                  ) : null;
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : null}

        {/* About Section for SEO & Disclaimer */}
        <section className="mt-10 border-t border-ink pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <Info size={18} />
                <h2 className="text-xl font-bold uppercase tracking-tight">{t.aboutTitle}</h2>
              </div>
              <p className="text-sm leading-relaxed opacity-70 italic serif">
                {t.aboutContent}
              </p>
            </div>
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4 opacity-40">
                <AlertCircle size={18} />
                <h2 className="text-sm font-bold uppercase tracking-widest">{t.marketIntelligence}</h2>
              </div>
              <p className="text-xs leading-relaxed opacity-50 mb-4">
                {t.disclaimer}
              </p>
              <div className="text-[10px] uppercase tracking-widest opacity-30 font-mono">
                {t.source}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap justify-center md:justify-start gap-8">
          <div className="flex items-center gap-2 opacity-60">
            <Globe size={14} />
            <span className="text-[10px] uppercase tracking-widest">{t.globalMarkets}</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <Activity size={14} />
            <span className="text-[10px] uppercase tracking-widest">{t.liveIndices}</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <Droplets size={14} />
            <span className="text-[10px] uppercase tracking-widest">{t.commodities}</span>
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-widest opacity-40 text-center md:text-right">
          © 2026 AI Financial Intelligence Hub • {t.source}
        </div>
      </footer>
      </div>
    </ErrorBoundary>
  );
}
