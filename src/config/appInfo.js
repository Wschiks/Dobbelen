// Everything the stores and the Settings screen need to know about the app.
// Edit the values here — nothing else in the code needs to change.
//
// Before submitting to the App Store / Play Store, replace every value
// marked CHANGE ME. The legal texts and Support screen read from this file.

export const APP_INFO = {
    appName: 'Dobbelen',

    // Reverse-domain ID used by the native projects (iOS bundle ID / Android applicationId).
    // Permanent once published. CHANGE ME if you want a different one.
    appId: 'com.dobbelen.app',

    version: '1.0.0',

    // Shown as the publisher in the Privacy Policy and Terms. CHANGE ME.
    developerName: 'Wschiks',

    // Public contact address, shown in Settings, Support, Privacy Policy and Terms. CHANGE ME.
    supportEmail: 'your-email@example.com',

    // Country whose law governs the Terms of Service. CHANGE ME if needed.
    governingLaw: { en: 'the Netherlands', nl: 'Nederland' },

    // Date the Privacy Policy and Terms were last changed (YYYY-MM-DD).
    legalLastUpdated: '2026-09-19',

    // Public web addresses the store listings ask for. The app serves these pages itself
    // at "<your site>/#privacy", "#terms" and "#support", so once the web build is hosted,
    // fill in your real address. CHANGE ME.
    websiteUrl: 'https://your-site.example',
    get privacyPolicyUrl() { return `${this.websiteUrl}/#privacy`; },
    get termsUrl() { return `${this.websiteUrl}/#terms`; },
    get supportUrl() { return `${this.websiteUrl}/#support`; },
};
