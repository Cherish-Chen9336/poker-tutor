// Language support: the URL picks the language ("#/zh-Hans/learn/1"), each
// language's text loads only when it's used, and English fills any gap.
import { Component, use, useLayoutEffect, type ReactNode } from "react";
import { IntlProvider, useIntl } from "react-intl";
import { routeHref, type Route } from "../app/route";
import { LocaleContext, PageContext, usePage, useT } from "./hooks";
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
  // English is built in; other languages load once and are cached.
  const messages = locale === "en" ? en : use(catalog(locale));
  // Before child effects run (such as moving focus to the new page's heading), so the page's language is already right.
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <LocaleContext value={locale}>
      <IntlProvider locale={locale} defaultLocale="en" messages={{ ...en, ...messages }}>
        <PageText locale={locale}>{children}</PageText>
      </IntlProvider>
    </LocaleContext>
  );
}

/** Keeps the page language's text reachable inside English fallback parts (for translated islands like the coach). */
function PageText({ locale, children }: { locale: Locale; children: ReactNode }) {
  const intl = useIntl();
  return <PageContext value={{ locale, intl }}>{children}</PageContext>;
}

/** Shown while a language's text loads, in every language since none is loaded yet. */
export function LoadingLanguage() {
  return <p className="loading">Loading… 加载中… 読み込み中…</p>;
}

/** If a language's text fails to load: try again, or continue in English. */
export class LanguageErrorBoundary extends Component<{ locale: Locale; englishHref: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="panel" role="alert">
        <p>This language couldn't load. 这个语言无法加载。この言語を読み込めませんでした。</p>
        <p>
          <button
            type="button"
            className="button"
            onClick={() => {
              loaded.delete(this.props.locale);
              this.setState({ failed: false });
            }}
          >
            Try again · 重试 · 再試行
          </button>{" "}
          <a className="button" href={this.props.englishHref} lang="en">
            Continue in English
          </a>
        </p>
      </section>
    );
  }
}

/** Switches language on the same page. Shown only on translated pages while translations are a pilot. */
export function LanguageSwitch({ route }: { route: Route }) {
  const { locale } = usePage();
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
  const { locale } = usePage();
  const t = useT();
  if (locale === "en") return null;
  return (
    <details className="machine">
      <summary>{t("lang.machine")}</summary>
      <p>{t("lang.machineDetail")}</p>
    </details>
  );
}

/**
 * English shown inside a translated page: a note in the reader's language, then the English, with English as its
 * language for screen readers, card names, and interface words. Links inside still keep the reader's language.
 */
export function EnglishFallback({ children }: { children: ReactNode }) {
  const { locale } = usePage();
  const t = useT();
  if (locale === "en") return <>{children}</>;
  return (
    <>
      <p className="note">{t("lang.notYet")}</p>
      <LocaleContext value="en">
        <IntlProvider locale="en" defaultLocale="en" messages={en}>
          <div lang="en">{children}</div>
        </IntlProvider>
      </LocaleContext>
    </>
  );
}
