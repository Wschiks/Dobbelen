import { useEffect, useState } from 'react';

// ---------- routing ----------
// Settings and the legal pages live at "#settings", "#privacy", "#terms" and "#support",
// so the hosted web build can serve them as public URLs for the store listings.

const PAGES = ['settings', 'privacy', 'terms', 'support'];

function readPage() {
    const page = window.location.hash.replace('#', '');
    return PAGES.includes(page) ? page : null;
}

export function usePage() {
    const [page, setPage] = useState(readPage);

    useEffect(() => {
        const sync = () => setPage(readPage());
        window.addEventListener('hashchange', sync);
        window.addEventListener('popstate', sync);
        return () => {
            window.removeEventListener('hashchange', sync);
            window.removeEventListener('popstate', sync);
        };
    }, []);

    function go(next) {
        const url = next ? `#${next}` : window.location.pathname + window.location.search;
        window.history.pushState(null, '', url);
        setPage(next);
    }

    return [page, go];
}
