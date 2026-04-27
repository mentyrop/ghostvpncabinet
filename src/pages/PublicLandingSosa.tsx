import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { landingApi } from '@/api/landings';
import { brandingApi, preloadLogo } from '@/api/branding';
import { cn } from '@/lib/utils';

type FaqItem = { q: string; a: string };
type FeatureItem = { icon: string; title: string; text: string };
type LocationItem = { country: string; ms: number; flag: string; signal: number };

const TELEGRAM_URL = 'https://t.me/ghostvlessbot?start=mn';

const FEATURE_ITEMS: FeatureItem[] = [
  {
    icon: '↯',
    title: 'Без задержек',
    text: 'Максимальная скорость на серверах премиум-класса с портом до 10 Гбит/с.',
  },
  {
    icon: '◈',
    title: 'Безопасность',
    text: 'Шифрование трафика и строгая политика нулевого логирования.',
  },
  {
    icon: '◎',
    title: '9 локаций',
    text: 'Серверы в Европе, Азии, США и России — все доступны внутри одной подписки.',
  },
  {
    icon: '▣',
    title: 'Все устройства',
    text: 'iOS, Android, Windows, macOS, Linux — до 10 устройств на одном тарифе.',
  },
  {
    icon: '➤',
    title: 'Быстрый запуск',
    text: 'Подключение в пару шагов через приложение — без ручной настройки.',
  },
  {
    icon: '◌',
    title: 'Поддержка 24/7',
    text: 'Помощь по подключению, оплате и продлению в любое время.',
  },
];

const LOCATIONS: LocationItem[] = [
  { country: 'Польша', ms: 20, flag: '🇵🇱', signal: 4 },
  { country: 'Норвегия', ms: 24, flag: '🇳🇴', signal: 4 },
  { country: 'Латвия', ms: 18, flag: '🇱🇻', signal: 4 },
  { country: 'Швеция', ms: 26, flag: '🇸🇪', signal: 4 },
  { country: 'Германия', ms: 39, flag: '🇩🇪', signal: 3 },
  { country: 'Казахстан', ms: 42, flag: '🇰🇿', signal: 3 },
  { country: 'Япония', ms: 110, flag: '🇯🇵', signal: 2 },
  { country: 'США', ms: 98, flag: '🇺🇸', signal: 2 },
  { country: 'Россия', ms: 9, flag: '🇷🇺', signal: 4 },
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

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

function SignalBars({ strength }: { strength: number }) {
  return (
    <div className="flex items-end gap-1">
      {[0, 1, 2, 3].map((idx) => (
        <span
          key={idx}
          className={cn(
            'w-[5px] rounded-full bg-gradient-to-b from-[#05b5f7] to-[#1d74f5] transition-opacity duration-300',
            idx === 0 && 'h-[9px]',
            idx === 1 && 'h-[13px]',
            idx === 2 && 'h-[17px]',
            idx === 3 && 'h-[21px]',
            idx + 1 <= strength ? 'opacity-100' : 'opacity-25',
          )}
        />
      ))}
    </div>
  );
}

export default function PublicLandingSosa() {
  const { slug: slugFromRoute } = useParams<{ slug: string }>();
  const slug = slugFromRoute ?? 'main';
  const [openedFaq, setOpenedFaq] = useState<number | null>(2);

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
    <div className="min-h-dvh overflow-x-hidden bg-gradient-to-b from-[#e8f2ff] via-[#edf5ff] to-[#f4f8ff] text-[#0f172a]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-10%] top-[-6%] h-[360px] w-[360px] rounded-full bg-[#8ec8ff]/35 blur-[75px]" />
        <div className="absolute right-[-8%] top-[16%] h-[300px] w-[300px] rounded-full bg-[#4fc3ff]/25 blur-[70px]" />
        <div className="absolute bottom-[-8%] left-[20%] h-[280px] w-[280px] rounded-full bg-[#83a9ff]/25 blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1220px] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="sticky top-3 z-30 mb-8 rounded-[24px] border border-[#d9e5f6] bg-white/85 px-4 py-3 shadow-[0_10px_32px_rgba(77,132,218,0.18)] backdrop-blur-lg"
        >
          <div className="flex items-center justify-between gap-3">
            <a href="#" className="group flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-xl border border-[#dbe5f4] bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                {logoUrl ? (
                  <img src={logoUrl} alt={appName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold">G</div>
                )}
              </div>
              <span className="text-[2rem] font-black leading-none tracking-[-0.03em]">{appName}</span>
            </a>

            <nav className="hidden items-center gap-7 text-[15px] font-medium text-[#334155] md:flex">
              {[
                { href: '#features', label: 'Возможности' },
                { href: '#locations', label: 'Локации' },
                { href: '#tariffs', label: 'Тарифы' },
                { href: '#faq', label: 'FAQ' },
              ].map((item) => (
                <a key={item.href} href={item.href} className="transition-colors hover:text-[#1d74f5]">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href={cabinetLoginUrl}
                className="rounded-full border border-[#d8e3f4] bg-white px-4 py-2 text-sm font-semibold text-[#334155] shadow-sm transition-all duration-300 hover:border-[#bfd4f4] hover:shadow-[0_8px_20px_rgba(59,130,246,0.15)]"
              >
                Кабинет
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-gradient-to-r from-[#1d74f5] to-[#2386ff] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(29,116,245,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(29,116,245,0.45)]"
              >
                Подключить
              </a>
            </div>
          </div>
        </motion.header>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mb-8 rounded-[34px] border border-[#d6e4f7] bg-white/88 p-5 shadow-[0_18px_44px_rgba(89,139,218,0.16)] sm:p-7"
        >
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="mb-4 inline-flex rounded-full border border-[#d5e4f7] bg-[#f8fbff] px-3.5 py-1.5 text-xs font-semibold text-[#3f78d8] shadow-sm">
                Пробный доступ&nbsp; 5 бесплатных дней
              </span>

              <h1 className="mb-4 text-[2.45rem] font-black leading-[0.98] tracking-[-0.03em] text-[#0f1b3d] sm:text-[4rem]">
                <span className="text-[#1d74f5]">быстрый VPS</span>
                <br />
                для любых
                <br />
                устройств
              </h1>

              <p className="mb-6 max-w-[620px] text-[18px] leading-relaxed text-[#5a6b84]">
                Подключайтесь через приложение на телефоне или компьютере. Без ручной
                настройки серверов и лишних шагов.
              </p>

              <div className="mb-6 flex flex-wrap gap-3">
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-gradient-to-r from-[#1d74f5] to-[#2a86fb] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(29,116,245,0.36)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_28px_rgba(29,116,245,0.46)]"
                >
                  Подключить VPS
                </a>
                <a
                  href="#features"
                  className="rounded-full border border-[#d6e2f5] bg-white px-6 py-3 text-sm font-semibold text-[#1d2b4a] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#bfd5f7] hover:shadow-[0_10px_20px_rgba(92,132,193,0.16)]"
                >
                  Возможности
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['5 дней', 'Бесплатный пробный доступ без ручной настройки.'],
                  ['9 локаций', 'Европа, Азия, США и Россия внутри одной подписки.'],
                  ['10 устройств', 'Один сервис для телефона, компьютера и всей техники.'],
                ].map(([title, text], idx) => (
                  <motion.div
                    key={title}
                    whileHover={{ y: -6, boxShadow: '0 16px 28px rgba(124, 153, 202, 0.2)' }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="rounded-[20px] border border-[#d8e3f4] bg-white px-4 py-4"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ transitionDelay: `${idx * 60}ms` }}
                  >
                    <p className="text-[38px] font-black leading-[0.95] tracking-[-0.03em] text-[#0f1b3d]">{title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute -left-8 top-1/2 hidden h-[220px] w-[220px] -translate-y-1/2 rounded-[30px] border border-[#d8e3f4] bg-gradient-to-b from-[#eaf5ff] to-[#cfe9ff] p-4 shadow-[0_20px_45px_rgba(59,130,246,0.2)] lg:block"
              >
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#2d6fd1]">Sosa Client</div>
                <motion.div
                  className="mt-4 h-[155px] w-[155px] rounded-full bg-gradient-to-br from-[#7094ff] via-[#9cc0ff] to-[#52d4ff] shadow-[inset_0_12px_20px_rgba(255,255,255,0.5)]"
                  animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: 0.15 }}
                className="relative ml-auto rounded-[30px] border border-[#d8e3f4] bg-white p-6 shadow-[0_24px_42px_rgba(89,132,211,0.22)]"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#64748b]">Sosa App</span>
                  <span className="rounded-full bg-[#d6fff1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1a8f70]">
                    Ready in a minute
                  </span>
                </div>

                <h3 className="mb-4 text-[2.15rem] font-black leading-[1.02] tracking-[-0.02em] text-[#0f1b3d] sm:text-[2.6rem]">
                  Личный VPS без ручной настройки и с быстрым стартом
                </h3>

                <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a97ad]">Платформы</div>
                <div className="mb-4 flex flex-wrap gap-2 text-sm">
                  {['Android', 'iOS', 'macOS', 'Windows', 'TV', 'Linux'].map((platform) => (
                    <span
                      key={platform}
                      className="rounded-full border border-[#d6e2f4] bg-[#f8fbff] px-3 py-1 font-medium text-[#3e4b63]"
                    >
                      {platform}
                    </span>
                  ))}
                </div>

                <p className="mb-5 text-[17px] leading-relaxed text-[#54647d]">
                  5 бесплатных дней, no-logs, безлимитный трафик и до 10 устройств.
                </p>

                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-full bg-gradient-to-r from-[#1d74f5] to-[#2386ff] px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_24px_rgba(29,116,245,0.34)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(29,116,245,0.45)]"
                >
                  Подключить VPS
                </a>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="features"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8 rounded-[34px] border border-[#d6e4f7] bg-white/88 p-6 shadow-[0_16px_36px_rgba(89,139,218,0.12)] sm:p-7"
        >
          <div className="mb-6">
            <span className="mb-2 inline-flex rounded-full border border-[#d6e3f6] bg-[#f8fbff] px-3.5 py-1.5 text-xs font-semibold text-[#3f78d8]">
              Возможности
            </span>
            <h2 className="text-[2.25rem] font-black leading-[0.98] tracking-[-0.03em] text-[#0f1b3d] sm:text-[3.35rem]">
              Всё для комфортного
              <br />
              подключения
            </h2>
            <p className="mt-3 max-w-[720px] text-[17px] leading-relaxed text-[#64748b]">
              Шифрование, высокая скорость, работа на любых устройствах и быстрый запуск через
              приложение без ручной настройки сервера.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {FEATURE_ITEMS.map((feature, idx) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.33, delay: idx * 0.04 }}
                whileHover={{
                  y: -6,
                  boxShadow: '0 20px 34px rgba(125, 155, 204, 0.2)',
                }}
                className="rounded-[20px] border border-[#d8e3f4] bg-white px-4 py-5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9f6ff] text-xl">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-[2rem] font-black leading-[0.98] tracking-[-0.02em] text-[#0f1b3d] sm:text-[2.2rem]">
                  {feature.title}
                </h3>
                <p className="text-base leading-relaxed text-[#64748b]">{feature.text}</p>
              </motion.article>
            ))}
          </div>

          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block rounded-full bg-gradient-to-r from-[#1d74f5] to-[#2385ff] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_24px_rgba(29,116,245,0.34)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(29,116,245,0.42)]"
          >
            Попробовать бесплатно
          </a>
        </motion.section>

        <motion.section
          id="locations"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8 rounded-[34px] border border-[#d6e4f7] bg-white/88 p-6 shadow-[0_16px_36px_rgba(89,139,218,0.12)] sm:p-7"
        >
          <div className="mb-6">
            <span className="mb-2 inline-flex rounded-full border border-[#d6e3f6] bg-[#f8fbff] px-3.5 py-1.5 text-xs font-semibold text-[#3f78d8]">
              Локации
            </span>
            <h2 className="text-[2.25rem] font-black leading-[0.98] tracking-[-0.03em] text-[#0f1b3d] sm:text-[3.35rem]">
              Серверы по всему миру
            </h2>
            <p className="mt-3 max-w-[720px] text-[17px] leading-relaxed text-[#64748b]">
              Все 9 локаций доступны в одной подписке, а переключение между ними занимает
              считанные секунды.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {LOCATIONS.map((item, idx) => (
              <motion.article
                key={item.country}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.32, delay: idx * 0.035 }}
                whileHover={{
                  y: -5,
                  boxShadow: '0 18px 30px rgba(112, 147, 202, 0.18)',
                }}
                className="flex items-center justify-between rounded-[20px] border border-[#d8e3f4] bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[28px] leading-none">{item.flag}</span>
                  <div>
                    <p className="text-[1.65rem] font-black leading-[0.95] tracking-[-0.02em] text-[#0f1b3d]">
                      {item.country}
                    </p>
                    <p className="text-sm text-[#6b7d98]">{item.ms} ms</p>
                  </div>
                </div>
                <SignalBars strength={item.signal} />
              </motion.article>
            ))}
          </div>

          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block rounded-full bg-gradient-to-r from-[#1d74f5] to-[#2385ff] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_24px_rgba(29,116,245,0.34)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(29,116,245,0.42)]"
          >
            Попробовать бесплатно
          </a>
        </motion.section>

        <motion.section
          id="tariffs"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8 rounded-[34px] border border-[#d6e4f7] bg-white/88 p-6 shadow-[0_16px_36px_rgba(89,139,218,0.12)] sm:p-7"
        >
          <div className="mb-6">
            <span className="mb-2 inline-flex rounded-full border border-[#d6e3f6] bg-[#f8fbff] px-3.5 py-1.5 text-xs font-semibold text-[#3f78d8]">
              Личный доступ
            </span>
            <h2 className="text-[2.25rem] font-black leading-[0.98] tracking-[-0.03em] text-[#0f1b3d] sm:text-[3.35rem]">
              Один тарифный блок
              <br />
              для быстрого выбора срока
              <br />
              подписки
            </h2>
            <p className="mt-3 max-w-[720px] text-[17px] leading-relaxed text-[#64748b]">
              Все планы включают безлимитный трафик, 9 локаций и поддержку 24/7.
            </p>
          </div>

          <div className={cn('grid gap-3', plans.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2')}>
            {plans.map((plan, idx) => (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.32, delay: idx * 0.04 }}
                whileHover={{
                  y: -6,
                  boxShadow: '0 20px 34px rgba(125, 155, 204, 0.2)',
                }}
                className={cn(
                  'relative rounded-[20px] border border-[#d8e3f4] bg-white p-5',
                  plan.isPopular && 'border-[#b8d6ff] shadow-[0_0_0_2px_rgba(65,154,255,0.18)]',
                )}
              >
                {plan.isPopular && (
                  <span className="mb-2 inline-flex rounded-full bg-[#1d74f5] px-3 py-1 text-[11px] font-semibold text-white">
                    Популярный
                  </span>
                )}
                {plan.isBest && (
                  <span className="mb-2 inline-flex rounded-full bg-[#1d74f5] px-3 py-1 text-[11px] font-semibold text-white">
                    Лучшая цена
                  </span>
                )}

                <p className="text-[1.5rem] font-black leading-none tracking-[-0.02em] text-[#1f304f]">{plan.periodLabel}</p>
                <p className="mt-1 text-[3rem] font-black leading-[0.9] tracking-[-0.04em] text-[#0f1b3d]">{plan.price}</p>
                {plan.monthlyApprox && <p className="mt-1 text-sm font-semibold text-[#1d74f5]">{plan.monthlyApprox}</p>}

                <ul className="mt-5 space-y-1.5 text-base text-[#5d6d84]">
                  <li>• {plan.traffic}</li>
                  <li>• Все 9 локаций</li>
                  <li>• {plan.devices}</li>
                  <li>• Поддержка 24/7</li>
                </ul>
              </motion.article>
            ))}
          </div>

          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block rounded-full bg-gradient-to-r from-[#1d74f5] to-[#2385ff] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_24px_rgba(29,116,245,0.34)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(29,116,245,0.42)]"
          >
            Попробовать бесплатно
          </a>
        </motion.section>

        <motion.section
          id="faq"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8 rounded-[34px] border border-[#d6e4f7] bg-white/88 p-6 shadow-[0_16px_36px_rgba(89,139,218,0.12)] sm:p-7"
        >
          <span className="mb-2 inline-flex rounded-full border border-[#d6e3f6] bg-[#f8fbff] px-3.5 py-1.5 text-xs font-semibold text-[#3f78d8]">
            FAQ
          </span>
          <h2 className="mb-3 text-[2.25rem] font-black leading-[0.98] tracking-[-0.03em] text-[#0f1b3d] sm:text-[3.35rem]">
            Частые вопросы
          </h2>
          <p className="mb-5 text-[17px] leading-relaxed text-[#64748b]">
            Ответы на основные вопросы перед подключением: запуск, устройства, локации, оплата,
            no-logs и продление подписки.
          </p>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openedFaq === idx;
              return (
                <div
                  key={item.q}
                  className={cn(
                    'rounded-[18px] border border-[#d8e3f4] bg-white px-4 py-4 transition-all duration-300',
                    isOpen && 'shadow-[0_14px_26px_rgba(110,152,212,0.2)]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenedFaq((prev) => (prev === idx ? null : idx))}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span className="text-[1.25rem] font-black leading-[1.1] tracking-[-0.02em] text-[#1a2846] sm:text-[1.35rem]">{item.q}</span>
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border border-[#d8e3f4] text-[#7a8ba6] transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    >
                      ▾
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                        className="overflow-hidden pt-3 text-[17px] leading-relaxed text-[#64748b]"
                      >
                        {item.a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[34px] bg-gradient-to-r from-[#1f4fa8] via-[#1f6fe0] to-[#22b7e8] p-6 text-white shadow-[0_20px_44px_rgba(42,94,186,0.36)] sm:p-8"
        >
          <motion.div
            className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full bg-white/20 blur-2xl"
            animate={{ scale: [1, 1.14, 1], rotate: [0, 16, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
          />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="mb-2 inline-flex rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-semibold">
                • Готовы к запуску
              </span>
              <h3 className="text-[2.25rem] font-black leading-[0.98] tracking-[-0.03em] sm:text-[3.2rem]">
                Личный VPS-сервер за
                <br />
                минуту
              </h3>
              <p className="mt-3 max-w-[680px] text-[17px] leading-relaxed text-white/90">
                5 бесплатных дней, 9 локаций, до 10 устройств, no-logs и безлимитный трафик в
                одном приложении без ручной настройки.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1e5ddd] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f4f8ff]"
              >
                Подключить
              </a>
              <a
                href="#tariffs"
                className="rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
              >
                Смотреть тарифы
              </a>
            </div>
          </div>
        </motion.section>

        <footer className="mt-4 rounded-[30px] border border-[#d6e3f5] bg-white/90 p-5 shadow-[0_12px_28px_rgba(100,144,213,0.14)] sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-xl border border-[#dbe5f4] bg-white">
                  {logoUrl ? (
                    <img src={logoUrl} alt={appName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold">G</div>
                  )}
                </div>
                <p className="text-[28px] font-black leading-none tracking-[-0.03em]">{appName}</p>
              </div>
              <p className="max-w-[420px] text-[17px] leading-relaxed text-[#64748b]">
                Личный VPS-сервер через приложение: 5 бесплатных дней, 9 локаций и до 10
                устройств без сложной настройки.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                <span className="rounded-full border border-[#d8e4f4] bg-[#f8fbff] px-3 py-1.5 text-[#4d5f79]">webapp.ghostvpn.cc</span>
                <span className="rounded-full border border-[#d8e4f4] bg-[#f8fbff] px-3 py-1.5 text-[#4d5f79]">support@ghostvpn.cc</span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[17px] font-black text-[#1b2845]">Навигация</p>
              <div className="space-y-2 text-[15px] text-[#586983]">
                <a href="#features" className="block transition-colors hover:text-[#1d74f5]">Возможности</a>
                <a href="#locations" className="block transition-colors hover:text-[#1d74f5]">Локации</a>
                <a href="#tariffs" className="block transition-colors hover:text-[#1d74f5]">Тарифы</a>
                <a href="#faq" className="block transition-colors hover:text-[#1d74f5]">FAQ</a>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[17px] font-black text-[#1b2845]">Контакты</p>
              <div className="space-y-2 text-[15px] text-[#586983]">
                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="block transition-colors hover:text-[#1d74f5]">
                  Открыть приложение
                </a>
                <a href="mailto:support@ghostvpn.cc" className="block transition-colors hover:text-[#1d74f5]">
                  support@ghostvpn.cc
                </a>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[17px] font-black text-[#1b2845]">Оплата</p>
              <div className="flex flex-wrap gap-2">
                {['СБП', 'Карта РФ', 'Visa / MC', 'Крипто'].map((payment) => (
                  <span key={payment} className="rounded-full border border-[#d8e4f4] bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-[#4d5f79]">
                    {payment}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#e3ebf7] pt-4 text-sm text-[#7a89a1]">© 2025 {appName}. Личный VPS-сервер без сложной настройки.</div>
        </footer>
      </div>
    </div>
  );
}
