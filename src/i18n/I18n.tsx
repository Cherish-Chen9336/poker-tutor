// Language support: the URL picks the language ("#/zh-Hans/learn/1"), each
// language's text loads only when it's used, and English fills any gap.
import { use, useEffect, type ReactNode } from "react";
import { IntlProvider } from "react-intl";
import { routeHref, type Route } from "../app/route";
import { LocaleContext, useLocale, useT } from "./hooks";
import { LOCALE_NAMES, LOCALES, type Locale } from "./locales";
import { en, type MessageId } from "./messages/en";

type Catalog = Partial<Record<MessageId, string>>;

const loaders: Record<Locale, () => Promise<Catalog>> = {
  en: async () => en,
  "zh-Hans": () => import("./messages/zh-Hans").then((m) => m.zhHans),
  ja: () => import("./messages/ja").then((m) => m.ja),
};
const loaded = new Map<Locale, Promise<Catalog>>();
function catalog(locale: Locale): Promise<Catalog> {
  if (!loaded.has(locale)) loaded.set(locale, loaders[locale]());
  return loaded.get(locale)!;
}

/** Provides one language's text to everything inside. Suspends while a language loads. */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const messages = use(catalog(locale));
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <LocaleContext value={locale}>
      <IntlProvider locale={locale} defaultLocale="en" messages={{ ...en, ...messages }}>
        {children}
      </IntlProvider>
    </LocaleContext>
  );
}

/** Switches language on the same page. Shown only on translated pages while translations are a pilot. */
export function LanguageSwitch({ route }: { route: Route }) {
  const locale = useLocale();
  const t = useT();
  if (locale === "en") return null;
  return (
    <nav className="lang" aria-label={t("lang.label")}>
      {LOCALES.map((l) => (
        <a key={l} href={routeHref(route, l)} lang={l} hrefLang={l} aria-current={l === locale ? "page" : undefined}>
          {LOCALE_NAMES[l]}
        </a>
      ))}
    </nav>
  );
}

/** States that the text is a machine-assisted translation, wherever a translation is shown. */
export function MachineLabel() {
  const locale = useLocale();
  const t = useT();
  if (locale === "en") return null;
  return (
    <details className="machine">
      <summary>{t("lang.machine")}</summary>
      <p>{t("lang.machineDetail")}</p>
    </details>
  );
}

/** English shown inside a translated page, marked so readers and screen readers know. */
export function EnglishFallback({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useT();
  if (locale === "en") return <>{children}</>;
  return (
    <div lang="en">
      <p className="note" lang={locale}>
        {t("lang.notYet")}
      </p>
      {children}
    </div>
  );
}
