import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { landingApi } from '@/api/landings';
import { brandingApi, preloadLogo } from '@/api/branding';
import { cn } from '@/lib/utils';

type FaqItem = { q: string; a: string };

const TELEGRAM_URL = 'https://t.me/ghostvlessbot?start=mn';

const FEATURE_ITEMS = [
  {
    icon: '⚡',
    title: 'Без задержек',
    text: 'Максимальная скорость на серверах премиум-класса с портом до 10 Гбит/с.',
  },
  {
    icon: '🛡️',
    title: 'Безопасность',
    text: 'Шифрование трафика и строгая политика нулевого логирования.',
  },
  {
    icon: '🌍',
    title: '9 локаций',
    text: 'Серверы в Европе, Азии, США и России — все доступны внутри одной подписки.',
  },
  {
    icon: '📱',
    title: 'Все устройства',
    text: 'iOS, Android, Windows, macOS, Linux — до 10 устройств на одном тарифе.',
  },
  {
    icon: '🚀',
    title: 'Быстрый запуск',
    text: 'Подключение в пару шагов через приложение — без ручной настройки.',
  },
  {
    icon: '💬',
    title: 'Поддержка 24/7',
    text: 'Помощь по подключению, оплате и продлению в любое время.',
  },
];

const LOCATIONS = [
  { country: 'Польша', ms: 20 },
  { country: 'Норвегия', ms: 24 },
  { country: 'Латвия', ms: 18 },
  { country: 'Швеция', ms: 26 },
  { country: 'Германия', ms: 39 },
  { country: 'Казахстан', ms: 42 },
  { country: 'Япония', ms: 110 },
  { country: 'США', ms: 98 },
  { country: 'Россия', ms: 9 },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Как быстро запускается сервер?',
    a: 'Обычно после оплаты подключение готово в течение минуты.',
  },
  {
    q: 'Какие устройства поддерживаются?',
    a: 'iOS, Android, Windows, macOS и Linux.',
  },
  {
    q: 'Можно ли менять локацию?',
    a: 'Да, все локации доступны внутри подписки без доплат.',
  },
  {
    q: 'Какие способы оплаты?',
    a: 'СБП, российские карты, международные карты и криптовалюта.',
  },
  {
    q: 'Храните ли вы логи?',
    a: 'Нет. Мы придерживаемся строгой no-logs политики.',
  },
  {
    q: 'Что происходит при продлении?',
    a: 'Просто продлеваете срок через личный кабинет и продолжаете пользоваться.',
  },
];

function formatRub(kopeks: number) {
  return `${Math.round(kopeks / 100).toLocaleString('ru-RU')} ₽`;
}

function periodLabel(days: number) {
  if (days >= 360) return '1 год';
  if (days >= 180) return '6 месяцев';
  if (days >= 90) return '3 месяца';
  if (days >= 60) return '2 месяца';
  return '1 месяц';
}

export default function PublicLandingSosa() {
  const { slug: slugFromRoute } = useParams<{ slug: string }>();
  const slug = slugFromRoute ?? 'main';

  const cabinetLoginUrl =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'ghostvpn.cc' || window.location.hostname === 'www.ghostvpn.cc')
      ? 'https://app.ghostvpn.cc/login'
      : '/login';

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['public-landing-sosa', slug],
    queryFn: () => landingApi.getConfig(slug, 'ru'),
    staleTime: 60_000,
  });

  const { data: branding } = useQuery({
    queryKey: ['public-branding-sosa'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      await preloadLogo(data);
      return data;
    },
    staleTime: 60_000,
  });

  const plans = useMemo(() => {
    if (!config?.tariffs?.length) return [];
    return config.tariffs.slice(0, 4).map((tariff, idx) => {
      const period = [...tariff.periods].sort((a, b) => a.days - b.days)[0];
      return {
        id: tariff.id,
        title: tariff.name || periodLabel(period?.days ?? 30),
        periodLabel: periodLabel(period?.days ?? 30),
        price: period ? formatRub(period.price_kopeks) : '—',
        monthlyApprox:
          period && period.days > 0
            ? `~${Math.round((period.price_kopeks / 100) * (30 / period.days)).toLocaleString('ru-RU')}₽/мес`
            : null,
        isPopular: idx === 1,
        isBest: idx === 3,
        traffic: tariff.traffic_limit_gb === 0 ? 'Безлимитный трафик' : `${tariff.traffic_limit_gb} GB`,
        devices: `${tariff.device_limit} устройств`,
      };
    });
  }, [config]);

  useEffect(() => {
    document.title = `${branding?.name || 'GhostVPN'} — Личный VPS-сервер`;
  }, [branding?.name]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#eef5ff]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9bb8ea] border-t-[#1d74f5]" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#eef5ff] p-6 text-center">
        <p className="text-[#1f2937]">Лендинг не найден или отключен</p>
      </div>
    );
  }

  const appName = branding?.name || 'GhostVPN';
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#eaf3ff] to-[#f5f8ff] text-[#0f172a]">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-3 z-20 mb-8 rounded-2xl border border-[#d8e4f6] bg-white/85 px-4 py-3 shadow-[0_8px_30px_rgba(59,130,246,0.12)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-xl border border-[#dbe2ef] bg-white">
                {logoUrl ? (
                  <img src={logoUrl} alt={appName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold">G</div>
                )}
              </div>
              <span className="text-2xl font-black tracking-[-0.02em]">{appName}</span>
            </div>
            <div className="hidden items-center gap-6 text-sm text-[#334155] md:flex">
              <a href="#features" className="hover:text-[#1d74f5]">Возможности</a>
              <a href="#locations" className="hover:text-[#1d74f5]">Локации</a>
              <a href="#tariffs" className="hover:text-[#1d74f5]">Тарифы</a>
              <a href="#faq" className="hover:text-[#1d74f5]">FAQ</a>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={cabinetLoginUrl}
                className="rounded-full border border-[#d5e1f5] bg-white px-3 py-1.5 text-sm font-medium text-[#334155]"
              >
                Кабинет
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#1d74f5] px-4 py-1.5 text-sm font-semibold text-white"
              >
                Подключить
              </a>
            </div>
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-[#d5e3f6] bg-white/85 p-6 shadow-[0_10px_40px_rgba(59,130,246,0.10)]">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-[#d5e3f6] bg-[#f7fbff] px-3 py-1 text-xs font-semibold text-[#1d74f5]">
                Пробный доступ 5 бесплатных дней
              </div>
              <h1 className="mb-4 text-[2.15rem] font-black leading-[1.02] tracking-[-0.02em] sm:text-6xl">
                <span className="text-[#1d74f5]">быстрый VPS</span>
                <br />
                для любых устройств
              </h1>
              <p className="mb-5 max-w-2xl text-[17px] text-[#475569]">
                Подключайтесь через приложение на телефоне или компьютере. Без ручной
                настройки серверов и лишних шагов.
              </p>
              <div className="mb-5 flex flex-wrap gap-2">
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#1d74f5] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Подключить VPS
                </a>
                <a
                  href="#features"
                  className="rounded-full border border-[#d5e3f6] bg-white px-5 py-2.5 text-sm font-semibold text-[#0f172a]"
                >
                  Возможности
                </a>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#d8e4f6] bg-white p-4">
                  <div className="text-3xl font-black text-[#0f172a]">5 дней</div>
                  <div className="mt-1 text-sm text-[#64748b]">Бесплатный пробный доступ</div>
                </div>
                <div className="rounded-2xl border border-[#d8e4f6] bg-white p-4">
                  <div className="text-3xl font-black text-[#0f172a]">9 локаций</div>
                  <div className="mt-1 text-sm text-[#64748b]">Европа, Азия, США и Россия</div>
                </div>
                <div className="rounded-2xl border border-[#d8e4f6] bg-white p-4">
                  <div className="text-3xl font-black text-[#0f172a]">10 устройств</div>
                  <div className="mt-1 text-sm text-[#64748b]">Один сервис для всей техники</div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-[#d8e4f6] bg-white p-5 shadow-[0_12px_36px_rgba(29,116,245,0.18)]">
              <div className="mb-2 text-xs font-semibold uppercase text-[#64748b]">Sosa App</div>
              <h3 className="mb-3 text-3xl font-black leading-tight">
                Личный VPS без ручной
                <br />
                настройки и с быстрым
                <br />
                стартом
              </h3>
              <div className="mb-3 text-xs font-semibold uppercase text-[#64748b]">Платформы</div>
              <div className="mb-5 flex flex-wrap gap-2 text-sm">
                {['Android', 'iOS', 'Windows', 'macOS', 'TV', 'Linux'].map((platform) => (
                  <span key={platform} className="rounded-full border border-[#d5e3f6] bg-[#f7fbff] px-2.5 py-1">
                    {platform}
                  </span>
                ))}
              </div>
              <p className="mb-4 text-sm text-[#475569]">
                5 бесплатных дней, no-logs, безлимитный трафик и до 10 устройств.
              </p>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-full bg-[#1d74f5] px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Подключить VPS
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="mb-8 rounded-3xl border border-[#d5e3f6] bg-white/85 p-6">
          <div className="mb-5">
            <div className="mb-2 inline-flex rounded-full border border-[#d5e3f6] bg-[#f7fbff] px-3 py-1 text-xs font-semibold text-[#1d74f5]">
              Возможности
            </div>
            <h2 className="text-[2.4rem] font-black leading-[1.02] tracking-[-0.02em]">
              Всё для комфортного
              <br />
              подключения
            </h2>
            <p className="mt-3 max-w-3xl text-[#64748b]">
              Шифрование, высокая скорость и быстрый запуск без ручной настройки сервера.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {FEATURE_ITEMS.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-[#d8e4f6] bg-white p-4">
                <div className="mb-3 text-2xl">{feature.icon}</div>
                <h3 className="mb-2 text-2xl font-black tracking-[-0.01em]">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-[#64748b]">{feature.text}</p>
              </div>
            ))}
          </div>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block rounded-full bg-[#1d74f5] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Попробовать бесплатно
          </a>
        </section>

        <section id="locations" className="mb-8 rounded-3xl border border-[#d5e3f6] bg-white/85 p-6">
          <div className="mb-5">
            <div className="mb-2 inline-flex rounded-full border border-[#d5e3f6] bg-[#f7fbff] px-3 py-1 text-xs font-semibold text-[#1d74f5]">
              Локации
            </div>
            <h2 className="text-[2.4rem] font-black leading-[1.02] tracking-[-0.02em]">
              Серверы по всему миру
            </h2>
            <p className="mt-3 max-w-3xl text-[#64748b]">
              Все 9 локаций доступны в одной подписке, переключение занимает секунды.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {LOCATIONS.map((item) => (
              <div key={item.country} className="flex items-center justify-between rounded-2xl border border-[#d8e4f6] bg-white px-4 py-3">
                <div>
                  <div className="font-semibold">{item.country}</div>
                  <div className="text-sm text-[#64748b]">{item.ms} ms</div>
                </div>
                <span className="text-[#1d74f5]">📶</span>
              </div>
            ))}
          </div>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block rounded-full bg-[#1d74f5] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Попробовать бесплатно
          </a>
        </section>

        <section id="tariffs" className="mb-8 rounded-3xl border border-[#d5e3f6] bg-white/85 p-6">
          <div className="mb-5">
            <div className="mb-2 inline-flex rounded-full border border-[#d5e3f6] bg-[#f7fbff] px-3 py-1 text-xs font-semibold text-[#1d74f5]">
              Личный доступ
            </div>
            <h2 className="text-[2.4rem] font-black leading-[1.02] tracking-[-0.02em]">
              Один тарифный блок
              <br />
              для быстрого выбора срока
              <br />
              подписки
            </h2>
            <p className="mt-3 max-w-3xl text-[#64748b]">
              Все планы включают безлимитный трафик, локации и поддержку 24/7.
            </p>
          </div>
          <div className={cn('grid gap-3', plans.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2')}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border border-[#d8e4f6] bg-white p-4',
                  plan.isPopular && 'ring-2 ring-[#5ea6ff]/35',
                )}
              >
                {plan.isPopular && (
                  <span className="mb-2 inline-flex rounded-full bg-[#1d74f5] px-2.5 py-1 text-[11px] font-semibold text-white">
                    Популярный
                  </span>
                )}
                {plan.isBest && (
                  <span className="mb-2 inline-flex rounded-full bg-[#1d74f5] px-2.5 py-1 text-[11px] font-semibold text-white">
                    Лучшая цена
                  </span>
                )}
                <p className="text-lg font-semibold">{plan.periodLabel}</p>
                <p className="mt-1 text-5xl font-black tracking-[-0.03em]">{plan.price}</p>
                {plan.monthlyApprox && <p className="mt-1 text-sm font-semibold text-[#1d74f5]">{plan.monthlyApprox}</p>}
                <ul className="mt-4 space-y-1.5 text-sm text-[#475569]">
                  <li>• {plan.traffic}</li>
                  <li>• Все 9 локаций</li>
                  <li>• {plan.devices}</li>
                  <li>• Поддержка 24/7</li>
                </ul>
              </div>
            ))}
          </div>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block rounded-full bg-[#1d74f5] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Попробовать бесплатно
          </a>
        </section>

        <section id="faq" className="mb-8 rounded-3xl border border-[#d5e3f6] bg-white/85 p-6">
          <h2 className="mb-3 text-[2.4rem] font-black leading-[1.02] tracking-[-0.02em]">Частые вопросы</h2>
          <p className="mb-5 text-[#64748b]">
            Ответы на основные вопросы перед подключением: запуск, устройства, локации, оплата и продление.
          </p>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-[#d8e4f6] bg-white p-4">
                <summary className="cursor-pointer list-none font-semibold">
                  <div className="flex items-center justify-between gap-3">
                    <span>{item.q}</span>
                    <span className="text-[#94a3b8] transition group-open:rotate-180">▾</span>
                  </div>
                </summary>
                <p className="mt-2 text-sm text-[#64748b]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-[#214b9d] to-[#1eb6e9] p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold">
                Готовы к запуску
              </div>
              <h3 className="text-[2.2rem] font-black leading-[1.02] tracking-[-0.02em]">
                Личный VPS-сервер за
                <br />
                минуту
              </h3>
              <p className="mt-3 max-w-2xl text-white/90">
                5 бесплатных дней, 9 локаций, до 10 устройств и безлимитный трафик.
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
              >
                Подключить
              </a>
              <a
                href="#tariffs"
                className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                Смотреть тарифы
              </a>
            </div>
          </div>
        </section>
        <p className="mt-5 text-center text-sm text-[#64748b]">© 2025 {appName}</p>
      </div>
    </div>
  );
}
