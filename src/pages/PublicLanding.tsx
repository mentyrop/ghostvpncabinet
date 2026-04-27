import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { landingApi } from '../api/landings';
import type { AnimationConfig } from '@/components/ui/backgrounds/types';
import Sparkles from '@/components/ui/backgrounds/sparkles';
import { brandingApi, preloadLogo } from '@/api/branding';
import { cn } from '../lib/utils';

const YA_METRIKA_ID = 108783613;
const SPARKLES_BASE: AnimationConfig = {
  enabled: true,
  type: 'sparkles',
  settings: {
    particleDensity: 80,
    particleColor: '#ffffff',
    minSize: 0.4,
    maxSize: 1.4,
    speed: 0.6,
  },
  opacity: 1,
  blur: 0,
  reducedOnMobile: false,
};

function useTelegramLink() {
  const username = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '').replace('@', '');
  return username ? `https://t.me/${username}` : null;
}

function useSupportLink(telegramLink: string | null) {
  const supportUrl = 'https://app.ghostvpn.cc/support';
  if (supportUrl) return supportUrl;
  return telegramLink;
}

const WHY_US_ITEMS = [
  {
    emoji: '⚡',
    accent: 'Быстрое и стабильное соединение',
    text: '— работает там, где другие тормозят',
  },
  {
    emoji: '🔄',
    accent: 'Без ручных настроек',
    text: '— подключился и забыл, всё работает само',
  },
  {
    emoji: '🇷🇺',
    accent: 'Российские сайты работают с включённым VPN',
    text: '— банки, госуслуги, маркетплейсы',
  },
  {
    emoji: '🔒',
    accent: 'Шифрование трафика',
    text: '— никто не увидит, что вы смотрите и скачиваете',
  },
];

const HERO_BENEFITS = [
  '⚡ Быстрое подключение',
  '🔄 Без ручных настроек',
  '🇷🇺 Рунет работает',
  '💰 от 99 ₽/мес',
];

function formatRubPrice(kopeks: number) {
  const rub = Math.round(kopeks / 100);
  return `${rub.toLocaleString('ru-RU')} ₽`;
}

export default function PublicLanding({ forcedSlug }: { forcedSlug?: string } = {}) {
  const { slug: slugFromRoute } = useParams<{ slug: string }>();
  const slug = forcedSlug ?? slugFromRoute ?? 'main';
  const telegramLink = useTelegramLink();
  const supportLink = useSupportLink(telegramLink);
  const telegramBotUsername = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '').replace('@', '');
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['public-landing-page', slug, 'ru'],
    queryFn: () => landingApi.getConfig(slug, 'ru'),
    enabled: true,
    staleTime: 60_000,
  });

  const { data: branding } = useQuery({
    queryKey: ['public-branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      await preloadLogo(data);
      return data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    document.title = 'GhostVPN — Надёжный VPN';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    type YmFn = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number };
    const w = window as Window & {
      ym?: YmFn;
      __ghostYmInited?: boolean;
    };
    const scriptSrc = `https://mc.yandex.ru/metrika/tag.js?id=${YA_METRIKA_ID}`;
    const hasScript = Array.from(document.scripts).some((s) => s.src === scriptSrc);

    if (!w.ym) {
      const queuedYm: YmFn = (...args: unknown[]) => {
        queuedYm.a = queuedYm.a || [];
        queuedYm.a.push(args);
      };
      queuedYm.l = Date.now();
      w.ym = queuedYm;
    }

    if (!hasScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = scriptSrc;
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    }

    if (!w.__ghostYmInited) {
      w.ym?.(YA_METRIKA_ID, 'init', {
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: 'dataLayer',
        referrer: document.referrer,
        url: window.location.href,
        accurateTrackBounce: true,
        trackLinks: true,
      });
      w.__ghostYmInited = true;
    }

    // Explicit SPA page hit for landing route.
    w.ym?.(YA_METRIKA_ID, 'hit', window.location.href, {
      title: document.title,
      referer: document.referrer,
    });
  }, []);

  const tariffs = useMemo(() => {
    if (!config) return [];
    return config.tariffs.map((tariff) => {
      const sorted = [...tariff.periods].sort((a, b) => a.days - b.days);
      return { tariff, period: sorted[0] };
    });
  }, [config]);

  const bgConfig: AnimationConfig = isLight
    ? {
        ...SPARKLES_BASE,
        settings: {
          ...SPARKLES_BASE.settings,
          particleColor: '#a78bfa',
        },
        opacity: 0.95,
      }
    : {
        ...SPARKLES_BASE,
        settings: {
          ...SPARKLES_BASE.settings,
          particleColor: '#ffffff',
        },
      };
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;
  const logoLetter = branding?.logo_letter || 'G';
  const appName = branding?.name || 'GhostVPN';
  const cabinetLoginUrl =
    typeof window !== 'undefined' && (window.location.hostname === 'ghostvpn.cc' || window.location.hostname === 'www.ghostvpn.cc')
      ? 'https://app.ghostvpn.cc/login'
      : '/login';
  const trackGoal = (goal: 'start_telegram_click' | 'cabinet_click') => {
    if (typeof window === 'undefined') return;
    const w = window as Window & { ym?: (...args: unknown[]) => void };
    w.ym?.(YA_METRIKA_ID, 'reachGoal', goal);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (event: MediaQueryListEvent) => {
      setIsLight(event.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const logo = branding ? brandingApi.getLogoUrl(branding) : null;
    if (!logo || typeof document === 'undefined') return;

    const applyFavicon = (rel: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = logo;
    };

    applyFavicon('icon');
    applyFavicon('shortcut icon');
    applyFavicon('apple-touch-icon');
  }, [branding]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-dark-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-700 border-t-accent-500" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-dark-950 p-4 text-center">
        <p className="text-sm text-dark-300">
          Лендинг не найден или отключен
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative min-h-dvh overflow-x-hidden transition-colors',
        isLight ? 'bg-[#eef2fa]' : 'bg-[#020817]',
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <Sparkles settings={bgConfig.settings} />
      </div>
      <div
        className={cn(
          'pointer-events-none absolute inset-0',
          isLight ? 'bg-[#eef2fa]/82' : 'bg-[#020817]/58',
        )}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <header
          className={cn(
            'mb-5 flex items-center justify-between border-b pb-3',
            isLight ? 'border-[#d6dae5]' : 'border-dark-700/70',
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border shadow-[0_8px_24px_rgba(15,23,42,0.18)]',
                isLight
                  ? 'border-[#d6d9e4] bg-[#f8f9fe] shadow-[0_12px_32px_rgba(139,92,246,0.16)]'
                  : 'border-dark-700 bg-dark-900/90',
              )}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={appName} className="h-full w-full object-cover" />
              ) : (
                <span className={cn('text-base font-bold', isLight ? 'text-[#121826]' : 'text-dark-100')}>
                  {logoLetter}
                </span>
              )}
            </div>
            <div
              className={cn(
                'text-[1.55rem] font-bold leading-none tracking-[-0.03em] sm:text-[1.8rem]',
                isLight ? 'text-[#111827]' : 'text-dark-50',
              )}
            >
              {appName}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={cabinetLoginUrl}
              className={cn(
                'text-sm font-medium transition-colors',
                isLight ? 'text-[#4b5563] hover:text-[#111827]' : 'text-dark-300 hover:text-dark-100',
              )}
            >
              Кабинет
            </a>
            <button
              type="button"
              onClick={() => setIsLight((v) => !v)}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors',
                isLight
                  ? 'border-[#bfa7ff] bg-[#f3eefc] hover:bg-[#ede6fb]'
                  : 'border-dark-600 bg-dark-900/80 hover:border-accent-400/70 hover:bg-dark-800',
              )}
              title="Переключить тему"
            >
              <span className="relative inline-flex h-5 w-5 items-center justify-center">
                <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-yellow-400/70" />
                <span className="relative text-sm">{isLight ? '🌙' : '☀️'}</span>
              </span>
            </button>
          </div>
        </header>

        <section
          className={cn(
            'mx-auto mb-8 max-w-xl rounded-3xl border p-6 shadow-xl backdrop-blur transition-all',
            isLight
              ? 'border-[#d4d8e3] bg-[#f8f9fc]/95 shadow-[0_6px_28px_rgba(15,23,42,0.08)] hover:border-[#bca4ff]'
              : 'border-dark-700/60 bg-dark-900/70 shadow-black/20 hover:border-accent-400/60 hover:shadow-[0_0_26px_rgba(168,85,247,0.22)]',
          )}
        >
          <div className="mb-3 flex flex-col items-start gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-success-500/30 bg-success-500/10 px-3.5 py-1.5 text-[12px] font-medium text-success-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-400" />
              Онлайн
            </div>
            <div
              className={cn(
                'inline-flex rounded-full px-3.5 py-1.5 text-xs',
                isLight
                  ? 'border border-[#d7c9fb] bg-[#f2edff] text-[#8b5cf6]'
                  : 'border border-accent-400/30 bg-accent-500/10 text-accent-300',
              )}
            >
              Работает в России · Защита 24/7
            </div>
          </div>
          <h1 className={cn('mb-3 text-[2.35rem] font-black leading-[0.96] tracking-[-0.02em] sm:text-[3.35rem]', isLight ? 'text-[#111827]' : 'text-dark-50')}>
            VPN который{' '}
            <span className={isLight ? 'text-[#8b5cf6]' : 'text-[#a78bfa]'}>работает</span>
          </h1>
          <p className={cn('mb-5 text-base leading-relaxed', isLight ? 'text-[#4b5563]' : 'text-dark-200')}>
            Работает быстро и стабильно — российские сайты не ломаются, зарубежные открываются в
            один клик.
          </p>

          <div className={cn('mb-6 grid grid-cols-2 gap-x-2 gap-y-3 text-[14px] leading-tight sm:text-[15px]', isLight ? 'text-[#334155]' : 'text-dark-200')}>
            {HERO_BENEFITS.map((item) => (
              <span
                key={item}
                className={cn(
                  'inline-flex min-h-[44px] w-full items-center justify-center rounded-full px-3 py-2 text-center',
                  isLight ? 'border border-[#d1d5de] bg-[#eef0f5]' : 'border border-dark-600 bg-dark-800',
                )}
              >
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {telegramLink && (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackGoal('start_telegram_click')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-3 text-center text-base font-semibold text-white transition-all hover:-translate-y-0.5',
                  isLight
                    ? 'from-[#a78bfa] via-[#8b5cf6] to-[#7c3aed] shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_12px_30px_rgba(139,92,246,0.34)] hover:shadow-[0_0_0_1px_rgba(139,92,246,0.52),0_16px_34px_rgba(139,92,246,0.44)]'
                    : 'from-[#8b5cf6] to-[#7c3aed] shadow-[0_10px_28px_rgba(139,92,246,0.34)] hover:shadow-[0_14px_30px_rgba(139,92,246,0.45)]',
                )}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0Zm5.894 8.216-1.97 9.292c-.149.658-.54.82-1.092.51l-3.022-2.228-1.458 1.403c-.161.161-.296.296-.607.296l.217-3.064 5.58-5.042c.243-.217-.053-.338-.376-.121l-6.896 4.34-2.968-.928c-.645-.202-.658-.645.135-.954l11.605-4.473c.538-.196 1.007.128.852.969Z" />
                </svg>
                Начать через Telegram
              </a>
            )}
            <a
              href={cabinetLoginUrl}
              onClick={() => trackGoal('cabinet_click')}
              className={cn(
                'rounded-xl border px-4 py-3 text-center text-base font-semibold transition-all hover:-translate-y-0.5',
                isLight
                  ? 'border-[#cfd4df] bg-[#eceef3] text-[#111827] hover:border-[#bca4ff] hover:shadow-[0_8px_22px_rgba(167,139,250,0.20)]'
                  : 'border-dark-700 bg-dark-800 text-dark-100 hover:border-accent-400/70 hover:bg-dark-700 hover:shadow-[0_8px_22px_rgba(56,189,248,0.18)]',
              )}
            >
              Личный кабинет
            </a>
          </div>
        </section>

        {tariffs.length > 0 && (
          <section
            className={cn(
              'mx-auto mb-8 max-w-xl rounded-3xl border p-5 backdrop-blur transition-all',
              isLight
                ? 'border-[#d4d8e3] bg-[#f8f9fc]/95 hover:border-[#bca4ff]'
                : 'border-dark-700/60 bg-dark-900/70 hover:border-accent-400/60 hover:shadow-[0_0_26px_rgba(168,85,247,0.18)]',
            )}
          >
            <h2 className={cn('mb-4 text-xs font-semibold uppercase tracking-wide', isLight ? 'text-[#6b7280]' : 'text-dark-400')}>
              ТАРИФЫ
            </h2>
            <div className="space-y-3">
              {tariffs.slice(0, 3).map(({ tariff, period }) => {
                const isPopular = tariff.name.toLowerCase().includes('pro');
                const isStart = tariff.name.toLowerCase().includes('start');
                return (
                  <div
                    key={tariff.id}
                    className={cn(
                      'relative rounded-2xl border p-4 transition-all',
                      isPopular && isLight && 'border-[#c8b1ff] bg-[#f3eefc] shadow-[0_10px_26px_rgba(139,92,246,0.16)]',
                      isPopular && !isLight && 'border-[#3ba9db] bg-dark-800/80 shadow-[0_0_24px_rgba(56,189,248,0.18)]',
                      isStart &&
                        (isLight
                          ? 'border-[#d0d5de] bg-[#eef0f5]'
                          : 'border-dark-700 bg-dark-800/60'),
                      !isPopular &&
                        !isStart &&
                        (isLight
                          ? 'border-[#d0d5de] bg-[#eef0f5] hover:border-[#bca4ff]'
                          : 'border-dark-700 bg-dark-800/60 hover:border-accent-400/70 hover:shadow-[0_0_20px_rgba(168,85,247,0.16)]'),
                    )}
                  >
                    {isPopular && (
                      <span
                        className={cn(
                          'absolute -top-3 left-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white',
                          isLight
                            ? 'bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] shadow-[0_6px_14px_rgba(139,92,246,0.35)]'
                            : 'bg-gradient-to-r from-[#22d3ee] to-[#0ea5e9] shadow-[0_6px_14px_rgba(56,189,248,0.35)]',
                        )}
                      >
                        Популярный
                      </span>
                    )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={cn('text-[2.1rem] font-black leading-none sm:text-[2.35rem]', isLight ? 'text-[#111827]' : 'text-dark-50')}>
                        {tariff.name}
                      </p>
                      {tariff.description && (
                        <p className={cn('mt-2 text-[13px] leading-snug sm:text-[14px]', isLight ? 'text-[#6b7280]' : 'text-dark-400')}>
                          {tariff.description}
                        </p>
                      )}
                    </div>
                    {period && (
                      <p
                        className={cn(
                          'shrink-0 text-right text-[2.75rem] font-black leading-[0.9] tracking-[-0.03em] sm:text-[3rem]',
                          isLight ? 'text-[#8b5cf6]' : 'text-accent-300',
                        )}
                      >
                        {formatRubPrice(period.price_kopeks)}
                        <span
                          className={cn(
                            'ml-1 text-[0.52em] font-medium whitespace-nowrap',
                            isLight ? 'text-[#6b7280]' : 'text-dark-400',
                          )}
                        >
                          /мес
                        </span>
                      </p>
                    )}
                  </div>
                  <div
                    className={cn(
                      'mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] sm:text-[14px]',
                      isLight ? 'text-[#6b7280]' : 'text-dark-300',
                    )}
                  >
                    <span>{tariff.traffic_limit_gb === 0 ? '∞' : tariff.traffic_limit_gb} GB</span>
                    <span>{tariff.device_limit} устройств</span>
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        )}

        <section
          className={cn(
            'mx-auto max-w-xl rounded-3xl border p-5 backdrop-blur transition-all',
            isLight
              ? 'border-[#d4d8e3] bg-[#f8f9fc]/95 hover:border-[#bca4ff]'
              : 'border-dark-700/60 bg-dark-900/70 hover:border-accent-400/60 hover:shadow-[0_0_26px_rgba(168,85,247,0.18)]',
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <h2 className={cn('text-xs font-semibold uppercase tracking-wide', isLight ? 'text-[#6b7280]' : 'text-dark-400')}>
              ПОЧЕМУ GHOSTVPN
            </h2>
          </div>
          <div className="space-y-3">
            {WHY_US_ITEMS.map((item) => (
              <div
                key={item.text}
                className={cn(
                  'rounded-2xl border p-4 text-sm leading-relaxed',
                  isLight
                    ? 'border-[#cfd4df] bg-[#e8ebf3] text-[#111827]'
                    : 'border-dark-700 bg-dark-800/65 text-dark-200',
                )}
              >
                <span className="mr-2">{item.emoji}</span>
                <span className={cn('font-semibold', isLight ? 'text-[#8b5cf6]' : 'text-[#93c5fd]')}>{item.accent}</span>{' '}
                {item.text}
              </div>
            ))}
          </div>
        </section>

        <footer className="mx-auto mt-7 max-w-xl pb-2">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
            {telegramLink && (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
                  isLight
                    ? 'border-[#cfd4df] bg-[#f3f4f8] text-[#4b5563] hover:border-[#bca4ff]'
                    : 'border-dark-600 bg-dark-800/70 text-dark-300 hover:border-accent-400/70',
                )}
              >
                <span>👻</span>
                <span>{telegramBotUsername ? `@${telegramBotUsername}` : 'Telegram'}</span>
              </a>
            )}
            <a
              href={cabinetLoginUrl}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
                isLight
                  ? 'border-[#cfd4df] bg-[#f3f4f8] text-[#4b5563] hover:border-[#bca4ff]'
                  : 'border-dark-600 bg-dark-800/70 text-dark-300 hover:border-accent-400/70',
              )}
            >
              <span>💻</span>
              <span>Личный кабинет</span>
            </a>
            {supportLink && (
              <a
                href={supportLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
                  isLight
                    ? 'border-[#cfd4df] bg-[#f3f4f8] text-[#4b5563] hover:border-[#bca4ff]'
                    : 'border-dark-600 bg-dark-800/70 text-dark-300 hover:border-accent-400/70',
                )}
              >
                <span>💬</span>
                <span>Поддержка</span>
              </a>
            )}
          </div>
          <p className={cn('text-center text-xs', isLight ? 'text-[#6b7280]' : 'text-dark-500')}>
            © {new Date().getFullYear()} {appName.toLowerCase().includes('ghost') ? 'GhostVPN' : appName}
          </p>
        </footer>
      </div>
    </div>
  );
}
