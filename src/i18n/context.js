import { createContext, useContext } from 'react';

export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'nl', label: 'Nederlands' },
];

export const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (key) => key });

export function useT() {
    return useContext(LanguageContext);
}
