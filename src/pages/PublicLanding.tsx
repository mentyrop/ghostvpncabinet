import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { landingApi } from '../api/landings';
import type { AnimationConfig } from '@/components/ui/backgrounds/types';
import { StaticBackgroundRenderer } from '../components/backgrounds/BackgroundRenderer';
import { formatPrice } from '../utils/format';
import { cn } from '../lib/utils';
import { brandingApi, preloadLogo } from '@/api/branding';
import { useTheme } from '@/hooks/useTheme';

const SPOTLIGHT_DARK_FALLBACK: AnimationConfig = {
  enabled: true,
  type: 'spotlight',
  settings: {},
  opacity: 1,
  blur: 0,
  reducedOnMobile: true,
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
  const { isDark, toggleTheme, canToggle } = useTheme();

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

  // Keep this landing always on spotlight + dark style
  const bgConfig = SPOTLIGHT_DARK_FALLBACK;
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
    <div className="relative min-h-dvh overflow-x-hidden bg-dark-950">
      <StaticBackgroundRenderer config={bgConfig} />

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-dark-700/70 bg-dark-900/70 px-3 py-2 backdrop-blur">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-dark-800">
              {logoUrl ? (
                <img src={logoUrl} alt={appName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-dark-100">{logoLetter}</span>
              )}
            </div>
            <div className="text-2xl font-semibold text-dark-100">{appName}</div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            disabled={!canToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-dark-600 bg-dark-900/80 text-dark-100 transition-colors hover:border-accent-400/70 hover:bg-dark-800 disabled:cursor-not-allowed disabled:opacity-40"
            title={t('landing.toggleTheme', 'Переключить тему')}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </header>

        <section className="mx-auto mb-8 max-w-xl rounded-3xl border border-dark-700/60 bg-dark-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur transition-all hover:border-accent-400/60 hover:shadow-[0_0_26px_rgba(168,85,247,0.22)]">
          <div className="mb-2 inline-flex rounded-full border border-accent-400/30 bg-accent-500/10 px-3 py-1 text-xs text-accent-300">
            {t('landing.tagline', 'Работает в России · Защита 24/7')}
          </div>
          <h1 className="mb-2 text-4xl font-bold leading-tight text-dark-50">
            VPN который работает
          </h1>
          <p className="mb-4 text-sm text-dark-200">
            Работает быстро и стабильно — российские сайты не ломаются, зарубежные открываются в
            один клик.
          </p>

          <div className="mb-4 flex flex-wrap gap-2 text-xs text-dark-200">
            <span className="rounded-full border border-dark-600 bg-dark-800 px-3 py-1">
              ⚡ Быстрое подключение
            </span>
            <span className="rounded-full border border-dark-600 bg-dark-800 px-3 py-1">
              🔄 Без ручных настроек
            </span>
            <span className="rounded-full border border-dark-600 bg-dark-800 px-3 py-1">
              🇷🇺 Рунет работает
            </span>
            <span className="rounded-full border border-dark-600 bg-dark-800 px-3 py-1">
              💰 от 100 ₽/мес
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {telegramLink && (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-400"
              >
                <span aria-hidden="true">✈️</span>
                {t('landing.startTelegram', 'Начать через Telegram')}
              </a>
            )}
            <Link
              to="/login"
              className="rounded-xl border border-dark-700 bg-dark-800 px-4 py-2.5 text-center text-sm font-semibold text-dark-100 transition-colors hover:border-accent-400/70 hover:bg-dark-700"
            >
              {t('landing.siteLogin', 'Личный кабинет')}
            </Link>
          </div>
        </section>

        {tariffs.length > 0 && (
          <section className="mx-auto mb-8 max-w-xl rounded-3xl border border-dark-700/60 bg-dark-900/70 p-5 backdrop-blur transition-all hover:border-accent-400/60 hover:shadow-[0_0_26px_rgba(168,85,247,0.18)]">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-dark-400">
              {t('landing.tariffs', 'Тарифы')}
            </h2>
            <div className="space-y-3">
              {tariffs.slice(0, 3).map(({ tariff, period }) => (
                <div
                  key={tariff.id}
                  className="relative rounded-2xl border border-dark-700 bg-dark-800/60 p-4 transition-all hover:border-accent-400/70 hover:shadow-[0_0_20px_rgba(168,85,247,0.16)]"
                >
                  {tariff.name.toLowerCase().includes('pro') && (
                    <span className="absolute -top-2 left-4 rounded-full bg-accent-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Популярный
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-dark-100">{tariff.name}</p>
                      {tariff.description && (
                        <p className="mt-1 text-xs text-dark-400">{tariff.description}</p>
                      )}
                    </div>
                    {period && (
                      <p className="text-lg font-bold text-accent-300">
                        {formatPrice(period.price_kopeks)}
                        <span className="ml-1 text-xs font-normal text-dark-400">/мес</span>
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-dark-300">
                    <span>{tariff.traffic_limit_gb === 0 ? '∞' : tariff.traffic_limit_gb} GB</span>
                    <span>{tariff.device_limit} {t('landing.devices', 'устройства')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-xl rounded-3xl border border-dark-700/60 bg-dark-900/70 p-5 backdrop-blur transition-all hover:border-accent-400/60 hover:shadow-[0_0_26px_rgba(168,85,247,0.18)]">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-dark-400">
              Почему мы
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-success-500/30 bg-success-500/10 px-2 py-0.5 text-[10px] text-success-400">
              <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
              онлайн
            </span>
          </div>
          <div className="space-y-3">
            {WHY_US_ITEMS.map((item) => (
              <div
                key={item.text}
                className="rounded-2xl border border-dark-700 bg-dark-800/60 p-3 text-sm text-dark-200 transition-all hover:border-accent-400/70 hover:bg-dark-800"
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
