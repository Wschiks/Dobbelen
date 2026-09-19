// Privacy Policy, Terms of Service and support FAQ, in each supported language.
// Each document is { title, intro, sections: [{ heading, paragraphs?, bullets? }] }.
// Facts about the app (data handling, permissions) must stay in sync with the code:
// the app stores player names, loss targets and the language only on the device,
// makes no network requests, and only uses the vibration API.

export function getLegal(lang, info) {
    const doc = lang === 'nl' ? nl(info) : en(info);
    return doc;
}

function en({ appName, developerName, supportEmail, governingLaw, legalLastUpdated }) {
    const law = governingLaw.en;
    return {
        updatedLabel: 'Last updated',
        updated: formatDate(legalLastUpdated, 'en-GB'),
        privacy: {
            title: 'Privacy Policy',
            intro: `${appName} is a dice game you play with friends on one phone. It is built to work without collecting any information about you. This policy explains what that means in practice. ${appName} is published by ${developerName}.`,
            sections: [
                {
                    heading: 'The short version',
                    bullets: [
                        'No account, no sign-in.',
                        'We do not collect, store or receive any personal data.',
                        'No ads, no analytics, no tracking and no third-party services.',
                        'Nothing you type ever leaves your device.',
                    ],
                },
                {
                    heading: 'What is stored on your device',
                    paragraphs: [
                        'To save you retyping, the app remembers a few things in its local storage on your device: the player names you entered, the number of losses that ends a game, and the language you picked.',
                        'This information stays on your device. We cannot see it, and it is never sent anywhere. You can remove it at any time by clearing the app’s data or uninstalling the app.',
                    ],
                },
                {
                    heading: 'Information we collect',
                    paragraphs: [
                        `${appName} does not collect personal information. It does not use your location, contacts, photos, camera, microphone or advertising identifier, and it does not connect to any server. All fonts and images are included in the app.`,
                    ],
                },
                {
                    heading: 'Permissions',
                    paragraphs: [
                        'The app does not ask for any permissions. It uses your phone’s vibration feature for small haptic feedback while you play. This does not collect any data.',
                    ],
                },
                {
                    heading: 'Children',
                    paragraphs: [
                        `${appName} is not directed at children and shows beer glasses in its artwork. Because the app collects no data at all, we do not knowingly collect information from anyone, including children.`,
                    ],
                },
                {
                    heading: 'Your rights',
                    paragraphs: [
                        'Under privacy laws such as the GDPR you have the right to access, correct and delete your personal data. Because we hold no personal data about you, there is nothing for us to provide or delete. The names stored on your device are under your control and can be removed by clearing the app’s data.',
                    ],
                },
                {
                    heading: 'Changes to this policy',
                    paragraphs: [
                        'If the app ever changes in a way that affects your privacy, we will update this policy and the date above before the change goes live.',
                    ],
                },
                {
                    heading: 'Contact',
                    paragraphs: [`Questions about privacy? Email ${supportEmail}.`],
                },
            ],
        },
        terms: {
            title: 'Terms of Service',
            intro: `These terms apply to your use of ${appName}, published by ${developerName}. By using the app you agree to them. If you do not agree, please do not use the app.`,
            sections: [
                {
                    heading: 'Using the app',
                    paragraphs: [
                        `${appName} is a game for personal, non-commercial entertainment. You may install and use it on your own devices. You may not copy, modify, reverse engineer or redistribute the app, or use it in a way that is unlawful.`,
                    ],
                },
                {
                    heading: 'No gambling',
                    paragraphs: [
                        `${appName} is not a gambling app. It involves no real money, no prizes and no in-app purchases. Points and losses in the game have no monetary value.`,
                    ],
                },
                {
                    heading: 'Play responsibly',
                    paragraphs: [
                        `${appName} does not require or encourage drinking. If you choose to play with alcohol, do so responsibly, only if you are of legal drinking age, and never drive or do anything dangerous afterwards. What you and your friends do while playing is your own responsibility.`,
                    ],
                },
                {
                    heading: 'Ownership',
                    paragraphs: [
                        `The app, its name, logo and artwork belong to ${developerName}. Using the app does not give you any ownership rights in them.`,
                    ],
                },
                {
                    heading: 'No warranty',
                    paragraphs: [
                        'We work hard to make the app enjoyable and reliable, but it is provided “as is”, without promises that it will always be available or free of errors. Dice rolls are generated at random by your device.',
                    ],
                },
                {
                    heading: 'Limitation of liability',
                    paragraphs: [
                        `To the extent the law allows, ${developerName} is not liable for any indirect or consequential damage arising from your use of the app. Nothing in these terms limits any rights you have as a consumer that cannot be limited by law.`,
                    ],
                },
                {
                    heading: 'Changes',
                    paragraphs: [
                        'We may update these terms, for example when the app changes. The date above shows when they were last changed. If you keep using the app after an update, you accept the new terms.',
                    ],
                },
                {
                    heading: 'Governing law',
                    paragraphs: [`These terms are governed by the laws of ${law}.`],
                },
                {
                    heading: 'Contact',
                    paragraphs: [`Questions about these terms? Email ${supportEmail}.`],
                },
            ],
        },
        faq: [
            {
                q: 'How does a round work?',
                a: 'Roll your dice in secret, then claim a number that beats the previous claim. You may bluff. Pass the phone: the next player either believes the claim (and rolls the dice that are left) or checks it. If you check, the real dice are shown and whoever was wrong gets a loss.',
            },
            {
                q: 'What happens to sixes?',
                a: 'Real sixes are taken out of play, so the next player rolls fewer dice. If nothing is left to roll and you believe the claim, you are out.',
            },
            {
                q: 'What is Doorschuiven?',
                a: 'Instead of rolling, you raise the previous number by one and pass it on without rolling any dice.',
            },
            {
                q: 'What is Blind?',
                a: 'You raise the previous number by one, but new dice are rolled that you never get to look at.',
            },
            {
                q: 'Does the app need internet?',
                a: 'No. It works fully offline and never sends any data.',
            },
            {
                q: 'How do I delete my saved names?',
                a: 'They only exist on your device. Clear the app’s data in your phone settings, or uninstall the app.',
            },
        ],
    };
}

function nl({ appName, developerName, supportEmail, governingLaw, legalLastUpdated }) {
    const law = governingLaw.nl;
    return {
        updatedLabel: 'Laatst bijgewerkt',
        updated: formatDate(legalLastUpdated, 'nl-NL'),
        privacy: {
            title: 'Privacybeleid',
            intro: `${appName} is een dobbelspel dat je met vrienden speelt op één telefoon. De app is gemaakt om te werken zonder informatie over jou te verzamelen. Dit beleid legt uit wat dat in de praktijk betekent. ${appName} wordt uitgegeven door ${developerName}.`,
            sections: [
                {
                    heading: 'Kort samengevat',
                    bullets: [
                        'Geen account, geen inloggen.',
                        'Wij verzamelen, bewaren of ontvangen geen persoonsgegevens.',
                        'Geen advertenties, geen analyse, geen tracking en geen diensten van derden.',
                        'Niets wat je invoert verlaat ooit je apparaat.',
                    ],
                },
                {
                    heading: 'Wat op je apparaat wordt opgeslagen',
                    paragraphs: [
                        'Zodat je niet steeds opnieuw hoeft te typen, onthoudt de app een paar dingen in de lokale opslag van je apparaat: de spelersnamen die je invoerde, het aantal verliespunten waarmee een spel eindigt en de taal die je koos.',
                        'Deze informatie blijft op je apparaat. Wij kunnen haar niet zien en ze wordt nergens naartoe gestuurd. Je kunt haar altijd verwijderen door de gegevens van de app te wissen of de app te verwijderen.',
                    ],
                },
                {
                    heading: 'Gegevens die wij verzamelen',
                    paragraphs: [
                        `${appName} verzamelt geen persoonsgegevens. De app gebruikt je locatie, contacten, foto’s, camera, microfoon of advertentie-ID niet en maakt geen verbinding met een server. Alle lettertypen en afbeeldingen zitten in de app zelf.`,
                    ],
                },
                {
                    heading: 'Toestemmingen',
                    paragraphs: [
                        'De app vraagt om geen enkele toestemming. Ze gebruikt de trilfunctie van je telefoon voor lichte trillingen tijdens het spelen. Hierbij worden geen gegevens verzameld.',
                    ],
                },
                {
                    heading: 'Kinderen',
                    paragraphs: [
                        `${appName} is niet gericht op kinderen en toont bierglazen in de afbeeldingen. Omdat de app helemaal geen gegevens verzamelt, verzamelen wij niet bewust informatie van wie dan ook, ook niet van kinderen.`,
                    ],
                },
                {
                    heading: 'Jouw rechten',
                    paragraphs: [
                        'Op grond van privacywetgeving zoals de AVG heb je recht op inzage, correctie en verwijdering van je persoonsgegevens. Omdat wij geen persoonsgegevens van je bewaren, valt er niets te verstrekken of te verwijderen. De namen op je apparaat staan onder jouw controle en kun je verwijderen door de gegevens van de app te wissen.',
                    ],
                },
                {
                    heading: 'Wijzigingen in dit beleid',
                    paragraphs: [
                        'Als de app ooit verandert op een manier die je privacy raakt, passen we dit beleid en de datum hierboven aan voordat de wijziging ingaat.',
                    ],
                },
                {
                    heading: 'Contact',
                    paragraphs: [`Vragen over privacy? Mail naar ${supportEmail}.`],
                },
            ],
        },
        terms: {
            title: 'Gebruiksvoorwaarden',
            intro: `Deze voorwaarden gelden voor je gebruik van ${appName}, uitgegeven door ${developerName}. Door de app te gebruiken ga je hiermee akkoord. Ga je er niet mee akkoord, gebruik de app dan niet.`,
            sections: [
                {
                    heading: 'Gebruik van de app',
                    paragraphs: [
                        `${appName} is een spel voor persoonlijk, niet-commercieel vermaak. Je mag het installeren en gebruiken op je eigen apparaten. Je mag de app niet kopiëren, aanpassen, decompileren of verspreiden, en niet gebruiken op een manier die in strijd is met de wet.`,
                    ],
                },
                {
                    heading: 'Geen gokken',
                    paragraphs: [
                        `${appName} is geen gokapp. Er is geen echt geld, er zijn geen prijzen en er zijn geen aankopen in de app. Punten en verliezen in het spel hebben geen geldwaarde.`,
                    ],
                },
                {
                    heading: 'Speel verantwoord',
                    paragraphs: [
                        `${appName} vereist of stimuleert geen alcoholgebruik. Kies je ervoor om met alcohol te spelen, doe dat dan verantwoord, alleen als je de wettelijke leeftijd hebt en rijd of doe daarna nooit iets gevaarlijks. Wat jij en je vrienden tijdens het spelen doen, is je eigen verantwoordelijkheid.`,
                    ],
                },
                {
                    heading: 'Eigendom',
                    paragraphs: [
                        `De app, de naam, het logo en de afbeeldingen zijn eigendom van ${developerName}. Door de app te gebruiken krijg je daar geen eigendomsrechten op.`,
                    ],
                },
                {
                    heading: 'Geen garantie',
                    paragraphs: [
                        'Wij doen ons best om de app leuk en betrouwbaar te maken, maar ze wordt geleverd “zoals ze is”, zonder belofte dat ze altijd beschikbaar of foutloos is. De worpen worden willekeurig gegenereerd door je apparaat.',
                    ],
                },
                {
                    heading: 'Beperking van aansprakelijkheid',
                    paragraphs: [
                        `Voor zover de wet dat toestaat, is ${developerName} niet aansprakelijk voor indirecte schade of gevolgschade door het gebruik van de app. Niets in deze voorwaarden beperkt rechten die je als consument hebt en die volgens de wet niet beperkt kunnen worden.`,
                    ],
                },
                {
                    heading: 'Wijzigingen',
                    paragraphs: [
                        'Wij kunnen deze voorwaarden aanpassen, bijvoorbeeld als de app verandert. De datum hierboven laat zien wanneer ze voor het laatst zijn gewijzigd. Als je de app blijft gebruiken na een wijziging, accepteer je de nieuwe voorwaarden.',
                    ],
                },
                {
                    heading: 'Toepasselijk recht',
                    paragraphs: [`Op deze voorwaarden is het recht van ${law} van toepassing.`],
                },
                {
                    heading: 'Contact',
                    paragraphs: [`Vragen over deze voorwaarden? Mail naar ${supportEmail}.`],
                },
            ],
        },
        faq: [
            {
                q: 'Hoe werkt een ronde?',
                a: 'Gooi je dobbelstenen in het geheim en zeg dan een getal dat hoger is dan de vorige claim. Bluffen mag. Geef de telefoon door: de volgende speler gelooft de claim (en gooit de overgebleven dobbelstenen) of checkt hem. Bij een check zie je de echte dobbelstenen en krijgt wie ongelijk had een verliespunt.',
            },
            {
                q: 'Wat gebeurt er met zessen?',
                a: 'Echte zessen gaan uit het spel, waardoor de volgende speler met minder dobbelstenen gooit. Als er niets meer te gooien is en je gelooft de claim, ben je af.',
            },
            {
                q: 'Wat is Doorschuiven?',
                a: 'In plaats van te gooien verhoog je het vorige getal met één en geef je het door zonder te gooien.',
            },
            {
                q: 'Wat is Blind?',
                a: 'Je verhoogt het vorige getal met één, maar er worden nieuwe dobbelstenen gegooid die je nooit te zien krijgt.',
            },
            {
                q: 'Heeft de app internet nodig?',
                a: 'Nee. De app werkt volledig offline en verstuurt nooit gegevens.',
            },
            {
                q: 'Hoe verwijder ik mijn opgeslagen namen?',
                a: 'Ze bestaan alleen op je apparaat. Wis de gegevens van de app in de instellingen van je telefoon, of verwijder de app.',
            },
        ],
    };
}

function formatDate(iso, locale) {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}
