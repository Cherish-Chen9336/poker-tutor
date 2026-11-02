// The language hooks (kept apart from the components in I18n.tsx).
import { createContext, useContext, type ReactNode } from "react";
import { useIntl } from "react-intl";
import { routeHref, type Route } from "../app/route";
import type { Locale } from "./locales";
import { en, type MessageId } from "./messages/en";

export const LocaleContext = createContext<Locale>("en");

/** The page's language. */
export function useLocale(): Locale {
  return useContext(LocaleContext);
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

/** Links that keep the page's language. */
export function useHref() {
  const locale = useLocale();
  return (route: Route) => routeHref(route, locale);
}

