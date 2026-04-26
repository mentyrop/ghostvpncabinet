import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { landingApi } from '../api/landings';
import type { AnimationConfig } from '@/components/ui/backgrounds/types';
import { StaticBackgroundRenderer } from '../components/backgrounds/BackgroundRenderer';
import { formatPrice } from '../utils/format';
import { cn } from '../lib/utils';

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

export default function PublicLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const telegramLink = useTelegramLink();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['public-landing-page', slug, i18n.language],
    queryFn: () => landingApi.getConfig(slug!, i18n.language),
    enabled: !!slug,
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

  const bgConfig = config?.background_config ?? SPOTLIGHT_DARK_FALLBACK;

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
        <header className="mb-6 flex items-center justify-between">
          <div className="text-sm font-semibold text-dark-100">{config.title}</div>
          <div className="flex items-center gap-2 text-xs">
            {telegramLink && (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-dark-700 bg-dark-800/70 px-3 py-1.5 text-dark-200 transition-colors hover:border-dark-600"
              >
                {t('landing.support', 'Поддержка')}
              </a>
            )}
            <Link
              to="/login"
              className="rounded-lg border border-dark-700 bg-dark-800/70 px-3 py-1.5 text-dark-200 transition-colors hover:border-dark-600"
            >
              {t('landing.cabinet', 'Кабинет')}
            </Link>
          </div>
        </header>

        <section className="mx-auto mb-8 max-w-xl rounded-3xl border border-dark-700/60 bg-dark-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
          <div className="mb-2 inline-flex rounded-full border border-accent-400/30 bg-accent-500/10 px-3 py-1 text-xs text-accent-300">
            {t('landing.tagline', 'Работает в России · Защита 24/7')}
          </div>
          <h1 className="mb-2 text-3xl font-bold leading-tight text-dark-50">
            {config.title || t('landing.defaultTitle', 'VPN который просто работает')}
          </h1>
          {config.subtitle && <p className="mb-4 text-sm text-dark-300">{config.subtitle}</p>}

          <div className="mb-4 flex flex-wrap gap-2 text-xs text-dark-200">
            <span className="rounded-full bg-dark-800 px-3 py-1">{t('landing.fast', 'Быстрое подключение')}</span>
            <span className="rounded-full bg-dark-800 px-3 py-1">{t('landing.noManual', 'Без ручных настроек')}</span>
            <span className="rounded-full bg-dark-800 px-3 py-1">{t('landing.runet', 'Рунет работает')}</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {telegramLink && (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-accent-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-400"
              >
                {t('landing.startTelegram', 'Начать через Telegram')}
              </a>
            )}
            <Link
              to="/login"
              className={cn(
                'rounded-xl border border-dark-700 bg-dark-800 px-4 py-2.5 text-center text-sm font-semibold text-dark-100 transition-colors hover:border-dark-600',
                !telegramLink && 'sm:col-span-2',
              )}
            >
              {t('landing.siteLogin', 'Личный кабинет')}
            </Link>
          </div>
        </section>

        {tariffs.length > 0 && (
          <section className="mx-auto mb-8 max-w-xl rounded-3xl border border-dark-700/60 bg-dark-900/70 p-5 backdrop-blur">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-dark-400">
              {t('landing.tariffs', 'Тарифы')}
            </h2>
            <div className="space-y-3">
              {tariffs.slice(0, 3).map(({ tariff, period }) => (
                <div key={tariff.id} className="rounded-2xl border border-dark-700 bg-dark-800/60 p-4">
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

        {config.features.length > 0 && (
          <section className="mx-auto max-w-xl rounded-3xl border border-dark-700/60 bg-dark-900/70 p-5 backdrop-blur">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-dark-400">
              {t('landing.whyUs', 'Почему мы')}
            </h2>
            <div className="space-y-3">
              {config.features.map((feature, idx) => (
                <div key={`${feature.title}-${idx}`} className="rounded-2xl border border-dark-700 bg-dark-800/60 p-3">
                  <p className="mb-1 text-sm font-semibold text-dark-100">{feature.title}</p>
                  <p className="text-xs text-dark-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
