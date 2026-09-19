import { useEffect, useState } from 'react';
import en from './en';
import nl from './nl';
import { LanguageContext } from './context';

const DICTIONARIES = { en, nl };

const LANG_KEY = 'dobbel-lang';

function detectLanguage() {
    try {
        const saved = localStorage.getItem(LANG_KEY);
        if (saved && DICTIONARIES[saved]) return saved;
    } catch {
        // storage unavailable — fall through to the device language
    }
    const device = (typeof navigator !== 'undefined' && navigator.language) || 'en';
    return device.toLowerCase().startsWith('nl') ? 'nl' : 'en';
}

function format(template, vars) {
    return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

export function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(detectLanguage);

    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    function setLang(next) {
        if (!DICTIONARIES[next]) return;
        setLangState(next);
        try {
            localStorage.setItem(LANG_KEY, next);
        } catch {
            // not worth surfacing
        }
    }

    // t('key', { name }) — pass `count` to pick the '.one' / '.other' variant of a key
    function t(key, vars = {}) {
        const dict = DICTIONARIES[lang];
        const resolved = vars.count !== undefined ? `${key}.${vars.count === 1 ? 'one' : 'other'}` : key;
        const template = dict[resolved] ?? en[resolved] ?? resolved;
        return format(template, vars);
    }

    return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}
