import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { landingApi } from '../api/landings';
import type { AnimationConfig } from '@/components/ui/backgrounds/types';
import { StaticBackgroundRenderer } from '../components/backgrounds/BackgroundRenderer';
import { formatPrice } from '../utils/format';
import { brandingApi, preloadLogo } from '@/api/branding';
import { cn } from '../lib/utils';

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
  reducedOnMobile: true,
};

function useTelegramLink() {
  const username = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '').replace('@', '');
  return username ? `https://t.me/${username}` : null;
}

function useSupportLink(telegramLink: string | null) {
  const supportUrl = (import.meta.env.VITE_SUPPORT_URL || '').trim();
  if (supportUrl) return supportUrl;
  return telegramLink;
}

const WHY_US_ITEMS = [
  {
    emoji: '⚡',
    text: 'Быстрое и стабильное соединение — работает там, где другие тормозят',
  },
  {
    emoji: '🔄',
    text: 'Без ручных настроек — подключился и забыл, всё работает само',
  },
  {
    emoji: '🇷🇺',
    text: 'Российские сайты работают с включённым VPN — банки, госуслуги, маркетплейсы',
  },
  {
    emoji: '🔒',
    text: 'Шифрование трафика — никто не увидит, что вы смотрите и скачиваете',
  },
];

export default function PublicLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const telegramLink = useTelegramLink();
  const supportLink = useSupportLink(telegramLink);
  const telegramBotUsername = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '').replace('@', '');
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['public-landing-page', slug, i18n.language],
    queryFn: () => landingApi.getConfig(slug!, i18n.language),
    enabled: !!slug,
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
    if (!config) return;
    if (config.meta_title) document.title = config.meta_title;
  }, [config]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (event: MediaQueryListEvent) => {
      setIsLight(event.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

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
          {t('landing.notFound', 'Лендинг не найден или отключен')}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative min-h-dvh overflow-x-hidden transition-colors',
        isLight ? 'bg-[#eceef3]' : 'bg-dark-950',
      )}
    >
      <StaticBackgroundRenderer config={bgConfig} />

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
        <header
          className={cn(
            'mb-6 flex items-center justify-between border-b pb-4',
            isLight ? 'border-[#d6dae5]' : 'border-dark-700/70',
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border',
                isLight ? 'border-[#cfd4df] bg-[#f8f9fb]' : 'border-dark-700 bg-dark-900/80',
              )}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={appName} className="h-full w-full object-cover" />
              ) : (
                <span className={cn('text-sm font-bold', isLight ? 'text-[#121826]' : 'text-dark-100')}>
                  {logoLetter}
                </span>
              )}
            </div>
            <div className={cn('text-2xl font-semibold', isLight ? 'text-[#111827]' : 'text-dark-100')}>
              {appName}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={cn(
                'text-sm font-medium transition-colors',
                isLight ? 'text-[#4b5563] hover:text-[#111827]' : 'text-dark-300 hover:text-dark-100',
              )}
            >
              Кабинет
            </Link>
            <button
              type="button"
              onClick={() => setIsLight((v) => !v)}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors',
                isLight
                  ? 'border-[#bfa7ff] bg-[#f3eefc] hover:bg-[#ede6fb]'
                  : 'border-dark-600 bg-dark-900/80 hover:border-accent-400/70 hover:bg-dark-800',
              )}
              title={t('landing.toggleTheme', 'Переключить тему')}
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
            'mx-auto mb-8 max-w-xl rounded-3xl border p-5 shadow-xl backdrop-blur transition-all',
            isLight
              ? 'border-[#d4d8e3] bg-[#f8f9fc]/95 shadow-[0_6px_28px_rgba(15,23,42,0.08)] hover:border-[#bca4ff]'
              : 'border-dark-700/60 bg-dark-900/70 shadow-black/20 hover:border-accent-400/60 hover:shadow-[0_0_26px_rgba(168,85,247,0.22)]',
          )}
        >
          <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-success-500/30 bg-success-500/10 px-3 py-1 text-[11px] font-medium text-success-400">
            <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
            онлайн
          </div>
          <div
            className={cn(
              'mb-2 inline-flex rounded-full px-3 py-1 text-xs',
              isLight
                ? 'border border-[#d7c9fb] bg-[#f2edff] text-[#8b5cf6]'
                : 'border border-accent-400/30 bg-accent-500/10 text-accent-300',
            )}
          >
            {t('landing.tagline', 'Работает в России · Защита 24/7')}
          </div>
          <h1 className={cn('mb-2 text-4xl font-bold leading-tight', isLight ? 'text-[#111827]' : 'text-dark-50')}>
            VPN который работает
          </h1>
          <p className={cn('mb-4 text-sm', isLight ? 'text-[#4b5563]' : 'text-dark-200')}>
            Работает быстро и стабильно — российские сайты не ломаются, зарубежные открываются в
            один клик.
          </p>

          <div className={cn('mb-4 flex flex-wrap gap-2 text-xs', isLight ? 'text-[#334155]' : 'text-dark-200')}>
            <span
              className={cn(
                'rounded-full px-3 py-1',
                isLight ? 'border border-[#d1d5de] bg-[#eef0f5]' : 'border border-dark-600 bg-dark-800',
              )}
            >
              ⚡ Быстрое подключение
            </span>
            <span
              className={cn(
                'rounded-full px-3 py-1',
                isLight ? 'border border-[#d1d5de] bg-[#eef0f5]' : 'border border-dark-600 bg-dark-800',
              )}
            >
              🔄 Без ручных настроек
            </span>
            <span
              className={cn(
                'rounded-full px-3 py-1',
                isLight ? 'border border-[#d1d5de] bg-[#eef0f5]' : 'border border-dark-600 bg-dark-800',
              )}
            >
              🇷🇺 Рунет работает
            </span>
            <span
              className={cn(
                'rounded-full px-3 py-1',
                isLight ? 'border border-[#d1d5de] bg-[#eef0f5]' : 'border border-dark-600 bg-dark-800',
              )}
            >
              💰 от 100 ₽/мес
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {telegramLink && (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-2.5 text-center text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.35)]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0Zm5.894 8.216-1.97 9.292c-.149.658-.54.82-1.092.51l-3.022-2.228-1.458 1.403c-.161.161-.296.296-.607.296l.217-3.064 5.58-5.042c.243-.217-.053-.338-.376-.121l-6.896 4.34-2.968-.928c-.645-.202-.658-.645.135-.954l11.605-4.473c.538-.196 1.007.128.852.969Z" />
                </svg>
                {t('landing.startTelegram', 'Начать через Telegram')}
              </a>
            )}
            <Link
              to="/login"
              className={cn(
                'rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition-all hover:-translate-y-0.5',
                isLight
                  ? 'border-[#cfd4df] bg-[#eceef3] text-[#111827] hover:border-[#bca4ff] hover:shadow-[0_8px_22px_rgba(167,139,250,0.20)]'
                  : 'border-dark-700 bg-dark-800 text-dark-100 hover:border-accent-400/70 hover:bg-dark-700 hover:shadow-[0_8px_22px_rgba(56,189,248,0.18)]',
              )}
            >
              {t('landing.siteLogin', 'Личный кабинет')}
            </Link>
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
              {t('landing.tariffs', 'Тарифы')}
            </h2>
            <div className="space-y-3">
              {tariffs.slice(0, 3).map(({ tariff, period }) => (
                <div
                  key={tariff.id}
                  className={cn(
                    'relative rounded-2xl border p-4 transition-all',
                    isLight
                      ? 'border-[#d0d5de] bg-[#eef0f5] hover:border-[#bca4ff]'
                      : 'border-dark-700 bg-dark-800/60 hover:border-accent-400/70 hover:shadow-[0_0_20px_rgba(168,85,247,0.16)]',
                  )}
                >
                  {tariff.name.toLowerCase().includes('pro') && (
                    <span className="absolute -top-2 left-4 rounded-full bg-accent-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Популярный
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={cn('text-sm font-semibold', isLight ? 'text-[#111827]' : 'text-dark-100')}>
                        {tariff.name}
                      </p>
                      {tariff.description && (
                        <p className={cn('mt-1 text-xs', isLight ? 'text-[#6b7280]' : 'text-dark-400')}>
                          {tariff.description}
                        </p>
                      )}
                    </div>
                    {period && (
                      <p className={cn('text-lg font-bold', isLight ? 'text-[#8b5cf6]' : 'text-accent-300')}>
                        {formatPrice(period.price_kopeks)}
                        <span className={cn('ml-1 text-xs font-normal', isLight ? 'text-[#6b7280]' : 'text-dark-400')}>
                          /мес
                        </span>
                      </p>
                    )}
                  </div>
                  <div className={cn('mt-3 flex flex-wrap gap-3 text-xs', isLight ? 'text-[#6b7280]' : 'text-dark-300')}>
                    <span>{tariff.traffic_limit_gb === 0 ? '∞' : tariff.traffic_limit_gb} GB</span>
                    <span>{tariff.device_limit} {t('landing.devices', 'устройства')}</span>
                  </div>
                </div>
              ))}
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
                  'rounded-2xl border p-3 text-sm transition-all',
                  isLight
                    ? 'border-[#d0d5de] bg-[#eef0f5] text-[#111827] hover:border-[#bca4ff]'
                    : 'border-dark-700 bg-dark-800/60 text-dark-200 hover:border-accent-400/70 hover:bg-dark-800',
                )}
              >
                <span className="mr-2">{item.emoji}</span>
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
                <span>🤖</span>
                <span>{telegramBotUsername ? `@${telegramBotUsername}` : 'Telegram'}</span>
              </a>
            )}
            <Link
              to="/login"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
                isLight
                  ? 'border-[#cfd4df] bg-[#f3f4f8] text-[#4b5563] hover:border-[#bca4ff]'
                  : 'border-dark-600 bg-dark-800/70 text-dark-300 hover:border-accent-400/70',
              )}
            >
              <span>💻</span>
              <span>Личный кабинет</span>
            </Link>
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
