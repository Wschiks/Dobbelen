import { APP_INFO } from './config/appInfo';
import { LANGUAGES, useT } from './i18n/context';
import { getLegal } from './i18n/legal';

// ---------- screens ----------

function PageShell({ title, onBack, children }) {
    const { t } = useT();
    return (
        <div className="dbg-screen dbg-info">
            <button className="dbg-back" onClick={onBack}>
                <span aria-hidden="true">‹</span> {t('common.back')}
            </button>
            <h1 className="dbg-title">{title}</h1>
            {children}
        </div>
    );
}

export function InfoPage({ page, go }) {
    if (page === 'settings') return <SettingsScreen go={go} />;
    if (page === 'support') return <SupportScreen go={go} />;
    return <LegalScreen kind={page} go={go} />;
}

function SettingsScreen({ go }) {
    const { t, lang, setLang } = useT();
    const rows = [
        ['privacy', t('settings.privacy')],
        ['terms', t('settings.terms')],
        ['support', t('settings.support')],
    ];
    return (
        <PageShell title={t('settings.title')} onBack={() => go(null)}>
            <p className="dbg-eyebrow">{t('settings.language')}</p>
            <div className="dbg-segment" role="radiogroup" aria-label={t('settings.language')}>
                {LANGUAGES.map(({ code, label }) => (
                    <button
                        key={code}
                        role="radio"
                        aria-checked={lang === code}
                        className={`dbg-segment-btn${lang === code ? ' dbg-segment-btn--on' : ''}`}
                        onClick={() => setLang(code)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <p className="dbg-eyebrow" style={{ marginTop: 28 }}>{t('settings.about')}</p>
            <div className="dbg-link-list">
                {rows.map(([page, label]) => (
                    <button key={page} className="dbg-link-row" onClick={() => go(page)}>
                        <span>{label}</span>
                        <span aria-hidden="true">›</span>
                    </button>
                ))}
            </div>

            <p className="dbg-info-foot">
                {APP_INFO.appName} · {t('settings.version', { version: APP_INFO.version })}
            </p>
        </PageShell>
    );
}

function LegalScreen({ kind, go }) {
    const { lang } = useT();
    const legal = getLegal(lang, APP_INFO);
    const doc = legal[kind];
    return (
        <PageShell title={doc.title} onBack={() => go('settings')}>
            <p className="dbg-info-date">{legal.updatedLabel}: {legal.updated}</p>
            <p className="dbg-info-p">{doc.intro}</p>
            {doc.sections.map((s) => (
                <section key={s.heading} className="dbg-info-section">
                    <h2 className="dbg-info-h">{s.heading}</h2>
                    {s.paragraphs?.map((p, i) => <p className="dbg-info-p" key={i}>{p}</p>)}
                    {s.bullets && (
                        <ul className="dbg-info-list">
                            {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                    )}
                </section>
            ))}
        </PageShell>
    );
}

function SupportScreen({ go }) {
    const { t, lang } = useT();
    const legal = getLegal(lang, APP_INFO);
    const subject = t('support.emailSubject', { appName: APP_INFO.appName, version: APP_INFO.version });
    const mailto = `mailto:${APP_INFO.supportEmail}?subject=${encodeURIComponent(subject)}`;
    return (
        <PageShell title={t('support.title')} onBack={() => go('settings')}>
            <p className="dbg-info-p">{t('support.intro', { appName: APP_INFO.appName })}</p>
            <a className="dbg-btn dbg-btn--link" href={mailto}>{t('support.email')}</a>
            <p className="dbg-info-date" style={{ textAlign: 'center' }}>{APP_INFO.supportEmail}</p>

            <h2 className="dbg-info-h" style={{ marginTop: 28 }}>{t('support.faq')}</h2>
            {legal.faq.map((item) => (
                <details key={item.q} className="dbg-faq">
                    <summary>{item.q}</summary>
                    <p className="dbg-info-p">{item.a}</p>
                </details>
            ))}
        </PageShell>
    );
}
