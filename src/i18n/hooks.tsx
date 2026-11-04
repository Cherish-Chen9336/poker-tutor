// The language hooks (kept apart from the components in I18n.tsx).
import { createContext, useContext, type ReactNode } from "react";
import { useIntl, type IntlShape } from "react-intl";
import { routeHref, type Route } from "../app/route";
import type { Locale } from "./locales";
import { en, type MessageId } from "./messages/en";

/** The language of the content being shown (English inside an untranslated part of a translated page). */
export const LocaleContext = createContext<Locale>("en");
/** The language the reader chose for the page (the URL's), and its text; links and translated islands use it. */
export const PageContext = createContext<{ locale: Locale; intl: IntlShape | null }>({ locale: "en", intl: null });

/** The content's language: what card names, quiz frames, and labels here should be in. */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** The reader's chosen language and its text, even inside English fallback content. */
export function usePage(): { locale: Locale; intl: IntlShape | null } {
  return useContext(PageContext);
}

type Values = Record<string, ReactNode | ((chunks: ReactNode[]) => ReactNode)>;

/** Looks up interface text by id. `<b>…</b>` and `<a>…</a>` in a message become elements. */
export function useT() {
  const intl = useIntl();
  return (id: MessageId, values?: Values): string => {
    const all: Values = { b: (chunks) => <b>{chunks}</b>, ...values };
    return intl.formatMessage({ id, defaultMessage: en[id] }, all as never) as unknown as string;
  };
}

/** Lists like "the SB and the BB" in the page's language. */
export function useList() {
  const intl = useIntl();
  return (items: string[]) => intl.formatList(items, { type: "conjunction" });
}

/** A short date and time like "Nov 4, 10:42 AM", in the page's language. */
export function useWhen() {
  const intl = useIntl();
  return (date: Date) => intl.formatDate(date, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Links that keep the page's language. */
export function useHref() {
  const { locale } = usePage();
  return (route: Route) => routeHref(route, locale);
}

