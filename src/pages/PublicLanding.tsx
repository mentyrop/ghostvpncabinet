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

const SPOTLIGHT_DARK_FALLBACK: AnimationConfig = {
  enabled: true,
  type: 'spotlight',
  settings: {
    spotlightColor: '#8b5cf6',
    spotlightSize: 520,
  },
  opacity: 0.9,
  blur: 0,
  reducedOnMobile: false,
};

function useTelegramLink() {
  const username = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '').replace('@', '');
  return username ? `https://t.me/${username}` : null;
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
  const [isLight, setIsLight] = useState(false);

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
        ...SPOTLIGHT_DARK_FALLBACK,
        settings: {
          spotlightColor: '#a78bfa',
          spotlightSize: 460,
        },
        opacity: 0.2,
      }
    : SPOTLIGHT_DARK_FALLBACK;
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;
  const logoLetter = branding?.logo_letter || 'G';
  const appName = branding?.name || 'GhostVPN';

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
              {isLight ? '🌙' : '☀️'}
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-95"
              >
                <span aria-hidden="true">✈️</span>
                {t('landing.startTelegram', 'Начать через Telegram')}
              </a>
            )}
            <Link
              to="/login"
              className={cn(
                'rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition-colors',
                isLight
                  ? 'border-[#cfd4df] bg-[#eceef3] text-[#111827] hover:border-[#bca4ff]'
                  : 'border-dark-700 bg-dark-800 text-dark-100 hover:border-accent-400/70 hover:bg-dark-700',
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
      </div>
    </div>
  );
}
