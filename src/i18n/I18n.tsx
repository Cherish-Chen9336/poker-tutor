// Language support: the URL picks the language ("#/zh-Hans/learn/1"), each
// language's text loads only when it's used, and English fills any gap.
import { Component, use, useLayoutEffect, type ReactNode } from "react";
import { IntlProvider, useIntl } from "react-intl";
import { routeHref, type Route } from "../app/route";
import { Loading } from "../ui/Loading";
import { LocaleContext, PageContext, usePage, useT } from "./hooks";
import { LOCALE_NAMES, LOCALES, type Locale } from "./locales";
import { en, type MessageId } from "./messages/en";
import { browserStorage, saveLocale, switchesThisTab } from "./preference";

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

/** The loading screen, worded in every language since the next language may not be loaded yet. */
export function LoadingLanguage({ later = false }: { later?: boolean }) {
  return (
    <Loading later={later}>
      <span lang="en">Loading…</span> <span lang="zh-Hans">加载中…</span> <span lang="ja">読み込み中…</span>
    </Loading>
  );
}

/** If a language's text fails to load: reload to try again, or continue in English. */
export class LanguageErrorBoundary extends Component<
  { locale: Locale; englishHref: string; children: ReactNode },
  { failed: boolean; locale: Locale }
> {
  state = { failed: false, locale: this.props.locale };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  // A new language gets a fresh try, without remounting a page that's working.
  static getDerivedStateFromProps(props: { locale: Locale }, state: { locale: Locale }) {
    return props.locale === state.locale ? null : { failed: false, locale: props.locale };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="panel" role="alert">
        <p>
          <span lang="en">This language couldn't load.</span> <span lang="zh-Hans">无法加载此语言的内容。</span>{" "}
          <span lang="ja">この言語を読み込めませんでした。</span>
        </p>
        <p>
          <button type="button" className="button" onClick={() => window.location.reload()}>
            <span lang="en">Try again</span> · <span lang="zh-Hans">重试</span> · <span lang="ja">再試行</span>
          </button>{" "}
          <a className="button" href={this.props.englishHref} lang="en">
            Continue in English
          </a>
        </p>
      </section>
    );
  }
}

/**
 * Switches language on the same page, and remembers the choice for links that name no language. Each link names its
 * language, so one opened in a new tab shows that language; only a switch in this tab (a plain click) is remembered.
 */
export function LanguageSwitch({ route }: { route: Route }) {
  const { locale } = usePage();
  const t = useT();
  return (
    <nav className="lang" aria-label={t("lang.label")}>
      {LOCALES.map((l) => (
        <a
          key={l}
          href={routeHref(route, l, true)}
          lang={l}
          hrefLang={l}
          aria-current={l === locale ? "page" : undefined}
          onClick={(e) => {
            if (switchesThisTab(e)) saveLocale(browserStorage(), l);
          }}
        >
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
