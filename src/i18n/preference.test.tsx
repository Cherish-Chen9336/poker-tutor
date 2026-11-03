import { renderToStaticMarkup } from "react-dom/server";
import { createIntl, IntlProvider } from "react-intl";
import { describe, expect, it, vi } from "vitest";
import { LocaleContext, PageContext } from "./hooks";
import { LanguageSwitch } from "./I18n";
import { ja } from "./messages/ja";
import { en } from "./messages/en";
import { browserLocale, browserStorage, openInLearnerLanguage, savedLocale, saveLocale, startHash, switchesThisTab } from "./preference";

/** A Map-backed stand-in for localStorage. `fail` makes every call throw. */
function memoryStorage(fail = false): Storage {
  const data = new Map<string, string>();
  const guard = () => {
    if (fail) throw new DOMException("Storage is blocked", "SecurityError");
  };
  return {
    get length() { return data.size; },
    clear: () => { guard(); data.clear(); },
    getItem: (key) => { guard(); return data.get(key) ?? null; },
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (key) => { guard(); data.delete(key); },
    setItem: (key, value) => { guard(); data.set(key, value); },
  };
}

describe("browser language", () => {
  it("takes the first language the app has", () => {
    expect(browserLocale(["ja-JP", "en-US"])).toBe("ja");
    expect(browserLocale(["zh-CN"])).toBe("zh-Hans");
    expect(browserLocale(["zh"])).toBe("zh-Hans");
    expect(browserLocale(["zh-Hans-SG"])).toBe("zh-Hans");
    expect(browserLocale(["fr-FR", "ja"])).toBe("ja");
    expect(browserLocale(["en-GB", "ja"])).toBe("en");
  });

  it("doesn't open Traditional Chinese browsers in Simplified Chinese", () => {
    for (const tag of ["zh-TW", "zh-HK", "zh-MO", "zh-Hant", "zh-Hant-TW"]) expect(browserLocale([tag]), tag).toBe("en");
    expect(browserLocale(["zh-TW", "ja"])).toBe("ja");
  });

  it("follows a named Simplified script wherever the region is", () => {
    for (const tag of ["zh-Hans-TW", "zh-Hans-HK", "zh-SG", "zh-Hans"]) expect(browserLocale([tag]), tag).toBe("zh-Hans");
  });

  it("falls back to English", () => {
    expect(browserLocale([])).toBe("en");
    expect(browserLocale(["fr", "de"])).toBe("en");
  });
});

describe("saved language", () => {
  it("saves and loads a choice", () => {
    const storage = memoryStorage();
    expect(savedLocale(storage)).toBeNull();
    expect(saveLocale(storage, "ja")).toBe(true);
    expect(savedLocale(storage)).toBe("ja");
  });

  it("ignores unknown values, and blocked or missing storage", () => {
    const storage = memoryStorage();
    storage.setItem("poker-tutor:language", "zh-TW");
    expect(savedLocale(storage)).toBeNull();
    expect(savedLocale(memoryStorage(true))).toBeNull();
    expect(savedLocale(null)).toBeNull();
    expect(saveLocale(memoryStorage(true), "ja")).toBe(false);
    expect(saveLocale(null, "ja")).toBe(false);
  });

  it("copes with a browser that refuses access to storage at all", () => {
    const win = Object.defineProperty({}, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } }) as Window;
    expect(browserStorage(win)).toBeNull();
  });
});

describe("opening the site", () => {
  it("follows a link that names a language, whatever was saved", () => {
    const storage = memoryStorage();
    saveLocale(storage, "ja");
    expect(startHash("#/zh-Hans/learn/3", storage, ["ja"])).toBeNull();
    expect(startHash("#/en/play", storage, ["ja"])).toBeNull();
  });

  it("opens a link without a language in the saved language, keeping the page", () => {
    const storage = memoryStorage();
    saveLocale(storage, "zh-Hans");
    expect(startHash("#/learn/3", storage, ["ja"])).toBe("#/zh-Hans/learn/3");
    expect(startHash("", storage, [])).toBe("#/zh-Hans/learn");
    expect(startHash("#/review", storage, [])).toBe("#/zh-Hans/review");
  });

  it("stays in English when English was picked, even in a Japanese browser", () => {
    const storage = memoryStorage();
    saveLocale(storage, "en");
    expect(startHash("#/play", storage, ["ja"])).toBeNull();
  });

  it("uses the browser's language on a first visit", () => {
    expect(startHash("", memoryStorage(), ["ja-JP"])).toBe("#/ja/learn");
    expect(startHash("#/learn/2", null, ["zh-CN"])).toBe("#/zh-Hans/learn/2");
    expect(startHash("#/learn/2", memoryStorage(), ["en-US", "ja"])).toBeNull();
  });
});

describe("starting the app", () => {
  /** A stand-in window: an address, a history that records replacements, storage, and browser languages. */
  function fakeWindow(hash: string, languages: string[], saved?: string) {
    const storage = memoryStorage();
    if (saved) storage.setItem("poker-tutor:language", saved);
    const replaceState = vi.fn();
    const pushState = vi.fn();
    const win = { location: { hash }, history: { replaceState, pushState }, localStorage: storage, navigator: { languages, language: languages[0] } };
    return { win: win as unknown as Window, replaceState, pushState, storage };
  }

  it("replaces the address, so Back doesn't return to the address without a language", () => {
    const w = fakeWindow("#/learn/4", ["ja-JP"]);
    openInLearnerLanguage(w.win);
    expect(w.replaceState).toHaveBeenCalledWith(null, "", "#/ja/learn/4");
    expect(w.pushState).not.toHaveBeenCalled();
  });

  it("leaves a link that names a language alone, and doesn't save it", () => {
    const w = fakeWindow("#/zh-Hans/play", ["ja"], "ja");
    openInLearnerLanguage(w.win);
    expect(w.replaceState).not.toHaveBeenCalled();
    expect(savedLocale(w.storage)).toBe("ja");
  });

  it("does nothing for an English reader", () => {
    const w = fakeWindow("", ["en-US"]);
    openInLearnerLanguage(w.win);
    expect(w.replaceState).not.toHaveBeenCalled();
  });
});

describe("the language switch", () => {
  function render(locale: "en" | "ja") {
    const messages = locale === "en" ? en : { ...en, ...ja };
    const intl = createIntl({ locale, messages });
    return renderToStaticMarkup(
      <LocaleContext value={locale}>
        <PageContext value={{ locale, intl }}>
          <IntlProvider locale={locale} messages={messages}>
            <LanguageSwitch route={{ area: "learn", lesson: 3 }} />
          </IntlProvider>
        </PageContext>
      </LocaleContext>,
    );
  }

  it("shows on English pages too, with links that name their language", () => {
    for (const html of [render("en"), render("ja")]) {
      expect(html).toContain('href="#/en/learn/3"');
      expect(html).toContain('href="#/zh-Hans/learn/3"');
      expect(html).toContain('href="#/ja/learn/3"');
    }
    expect(render("en")).toMatch(/aria-current="page"[^>]*>English</);
  });

  it("remembers only a plain click, not one that opens another tab or window", () => {
    const plain = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
    expect(switchesThisTab(plain)).toBe(true);
    for (const change of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      expect(switchesThisTab({ ...plain, ...change }), JSON.stringify(change)).toBe(false);
    }
  });
});
