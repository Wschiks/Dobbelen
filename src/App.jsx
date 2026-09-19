import { useState } from 'react';
import Die from './Dice';
import './App.css';
import logo from './assets/logodob.png';
import { useT } from './i18n/context';
import { InfoPage } from './InfoPages';
import { usePage } from './usePage';

// ---------- helpers ----------

function rollDice(count, unlucky = false) {
    return Array.from({ length: count }, () => {
        if (unlucky) {
            // heavily weighted toward 1s and 2s, occasional 4, never higher
            const r = Math.random();
            if (r < 0.55) return 1;
            if (r < 0.90) return 2;
            return 4;
        }
        return 1 + Math.floor(Math.random() * 6);
    });
}
const UNLUCKY_NAMES = ['jasper', 'japser', 'neus'];

function isUnlucky(name) {
    return UNLUCKY_NAMES.includes(name.trim().toLowerCase());
}

function claimNumber(diceArr) {
  return parseInt([...diceArr].sort((a, b) => b - a).join(''), 10);
}

const CLAIM_CHIPS = ['rolled.chip1', 'rolled.chip2', 'rolled.chip3', 'rolled.chip4'];

// all numbers representable by `n` dice: digits 1-6, non-increasing
// (i.e. always expressed the way you'd naturally read dice: highest digit first)
function validClaimsForDigits(n) {
  const out = [];
  function rec(arr, maxDigit) {
    if (arr.length === n) {
      out.push(parseInt(arr.join(''), 10));
      return;
    }
    for (let d = maxDigit; d >= 1; d--) rec([...arr, d], d);
  }
  rec([], 6);
  return out.sort((a, b) => a - b);
}

function isLegalClaimShape(numStr, digitCount) {
  if (!new RegExp(`^[1-6]{${digitCount}}$`).test(numStr)) return false;
  const digits = numStr.split('').map(Number);
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] > digits[i - 1]) return false;
  }
  return true;
}

// strip leading 6s off a claim's digits: what's left is what the next
// player has to beat, and how many digits are left is how many dice
// they roll. Digits are always high-to-low, so 6s are always leading.
function countTrueSixes(diceArr) {
    const sorted = [...diceArr].sort((a, b) => b - a);
    let i = 0;
    while (i < sorted.length && sorted[i] === 6) i++;
    return i;
}
// increments the rightmost digit that's still allowed to go up
// while staying a legal non-increasing dice number, e.g. 432 -> 433, 433 -> 443
// returns null if already maxed out (e.g. 666)
function nextPushValue(numStr) {
    const digits = numStr.split('').map(Number);
    for (let i = digits.length - 1; i >= 0; i--) {
        const leftBound = i === 0 ? 6 : digits[i - 1];
        if (digits[i] + 1 <= leftBound) {
            digits[i] += 1;
            return parseInt(digits.join(''), 10);
        }
    }
    return null;
}

const emptyPlayer = () => ({ name: '' });

// remember the table between visits so nobody retypes names every game
const SETUP_KEY = 'dobbel-setup';

function loadSetup() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETUP_KEY));
        const names = Array.isArray(saved?.names) ? saved.names.filter((n) => typeof n === 'string') : [];
        const losses = Number.isInteger(saved?.targetLosses) && saved.targetLosses >= 1 ? saved.targetLosses : 3;
        return {
            players: names.length >= 2 ? names.map((name) => ({ name })) : [emptyPlayer(), emptyPlayer()],
            targetLosses: losses,
        };
    } catch {
        return { players: [emptyPlayer(), emptyPlayer()], targetLosses: 3 };
    }
}

function saveSetup(players, targetLosses) {
    try {
        localStorage.setItem(SETUP_KEY, JSON.stringify({ names: players.map((p) => p.name), targetLosses }));
    } catch {
        // storage unavailable (private mode etc.) — not worth surfacing
    }
}

function buzz(ms = 25) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

export default function App() {
  // ----- setup state -----
  const [saved] = useState(loadSetup);
  const [players, setPlayers] = useState(saved.players);
  const [targetLosses, setTargetLosses] = useState(saved.targetLosses);

  // ----- game state -----
  const [phase, setPhase] = useState('setup');
  // phase: setup | pass | roll | rolled | judge | reveal | auto-out | game-over

  const [gamePlayers, setGamePlayers] = useState([]); // [{ name }]
  const [currentIdx, setCurrentIdx] = useState(0);
  const [diceThisTurn, setDiceThisTurn] = useState(3); // how many dice to roll THIS turn

  const [currentRoll, setCurrentRoll] = useState([]); // this turn's rolled values
  const [claimDraft, setClaimDraft] = useState('');
  const [claimError, setClaimError] = useState('');

  // { value, ownerIdx, ownerRoll, beatValue, nextDiceCount, pushType, pushFrom }
  // pushType: 'doorschuiven' | 'blind' | undefined — set when the claim was pushed on without looking
  // value: the full number announced. beatValue/nextDiceCount: what's left
  // after stripping leading 6s — what the next roller must beat, and with how many dice.
  const [activeClaim, setActiveClaim] = useState(null);

  const [passTarget, setPassTarget] = useState(null); // { name, next }
  const [autoOutInfo, setAutoOutInfo] = useState(null); // { claimOwnerName, claimValue, outName, outIdx }
  const [gameOverInfo, setGameOverInfo] = useState(null); // { name, losses }

    const [page, goPage] = usePage();
    const { t } = useT();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scoreOpen, setScoreOpen] = useState(false);

  const current = gamePlayers[currentIdx];

  // ---------- setup screen ----------

  function updatePlayerName(i, name) {
    setPlayers((p) => p.map((pl, idx) => (idx === i ? { name } : pl)));
  }

  function addPlayer() {
    setPlayers((p) => [...p, emptyPlayer()]);
  }

  function removePlayer(i) {
    setPlayers((p) => p.filter((_, idx) => idx !== i));
  }

  function adjustTargetLosses(delta) {
    setTargetLosses((n) => Math.max(1, n + delta));
  }

  function startGame() {
    const names = players.map((p) => p.name.trim()).filter(Boolean);
    if (names.length < 2) return;
    saveSetup(players, targetLosses);
    const initial = names.map((name) => ({ name, losses: 0 }));
    setGamePlayers(initial);
    setActiveClaim(null);
    setDiceThisTurn(3);
    goToRoll(0, initial);
  }

  // ---------- transitions ----------

  function goToRoll(idx, playerList = gamePlayers) {
    setCurrentIdx(idx);
    setPassTarget({ name: playerList[idx].name, next: 'roll' });
    setPhase('pass');
  }

    function startNewRound(startIdx, playerList = gamePlayers) {
        setActiveClaim(null);
        setCurrentRoll([]);
        setDiceThisTurn(3);
        goToRoll(startIdx, playerList);
    }

    function handleRoll() {
        const roll = rollDice(diceThisTurn, isUnlucky(current.name));
        setCurrentRoll(roll);
        // prefill the claim with the true value
        setClaimDraft(String(claimNumber(roll)));
        setClaimError('');
        buzz();
        setPhase('rolled');
    }

    function confirmClaim() {
        const raw = claimDraft.trim();
        const digitCount = currentRoll.length;
        if (!isLegalClaimShape(raw, digitCount)) {
            setClaimError({ key: 'rolled.errorShape', vars: { n: digitCount } });
            return;
        }
        const val = parseInt(raw, 10);
        const trueSixCount = countTrueSixes(currentRoll);
        const allTrueSixes = trueSixCount === currentRoll.length; // every die this turn is a real six
        const trueValue = claimNumber(currentRoll);

        const minToBeat = activeClaim ? activeClaim.beatValue : null;
        // Normally you must strictly beat the previous claim. The one exception: if you
        // genuinely rolled all sixes, there's nothing higher — calling it exactly as-is
        // is allowed even if that ties whatever you needed to beat.
        const bypassBeat = allTrueSixes && val === trueValue;
        if (minToBeat !== null && val <= minToBeat && !bypassBeat) {
            setClaimError({ key: 'rolled.mustBeat', vars: { value: minToBeat } });
            return;
        }

        const restDigits = raw.split('').slice(trueSixCount).join('');
        const nextDiceCount = restDigits.length;
        const beatValue = restDigits.length ? parseInt(restDigits, 10) : null;

        setActiveClaim({
            value: val,
            ownerIdx: currentIdx,
            ownerRoll: currentRoll,
            beatValue,
            nextDiceCount,
        });
        const nextIdx = (currentIdx + 1) % gamePlayers.length;
        setCurrentIdx(nextIdx);
        setPassTarget({ name: gamePlayers[nextIdx].name, next: 'judge' });
        setPhase('pass');
    }

    function believe() {
        if (activeClaim.nextDiceCount === 0) {
            // nothing left to roll — believing this claim outright means you're out
            setAutoOutInfo({
                claimOwnerName: gamePlayers[activeClaim.ownerIdx].name,
                claimValue: activeClaim.value,
                outName: current.name,
                outIdx: currentIdx,
            });
            setPhase('auto-out');
            return;
        }
        setDiceThisTurn(activeClaim.nextDiceCount);
        setPhase('roll');
    }
    // Shared by Doorschuiven and Blind: previous count + 1, passed straight to the next player.
    function pushOn(pushType, ownerRoll) {
        const newVal = nextPushValue(String(activeClaim.beatValue));
        if (newVal === null) return; // shouldn't happen if the buttons are hidden correctly

        setActiveClaim({
            value: newVal,
            ownerIdx: currentIdx,
            ownerRoll,
            beatValue: newVal,
            nextDiceCount: diceThisTurn, // digit count carries over unchanged
            pushType,
            pushFrom: activeClaim.beatValue,
        });
        const nextIdx = (currentIdx + 1) % gamePlayers.length;
        setCurrentIdx(nextIdx);
        setPassTarget({ name: gamePlayers[nextIdx].name, next: 'judge' });
        setPhase('pass');
    }

    // Doorschuiven: +1 and pass it on without rolling. Nobody has new dice, so a check
    // reveals the dice already in play — after a normal claim that's the claimer's roll
    // minus its real sixes (those dice are out, so what's left matches the digit count).
    function doorschuiven() {
        const ownerRoll = activeClaim.pushType
            ? activeClaim.ownerRoll
            : activeClaim.ownerRoll.filter((v) => v !== 6);
        pushOn('doorschuiven', ownerRoll);
    }

    // Blind: +1, but fresh dice are rolled that the current player never looks at.
    function blind() {
        pushOn('blind', rollDice(diceThisTurn, isUnlucky(current.name)));
    }
  function check() {
    buzz(40);
    setPhase('reveal');
  }

  function continueFromAutoOut() {
    recordLoss(autoOutInfo.outIdx);
  }

  function continueFromReveal(loserIdx) {
    recordLoss(loserIdx);
  }

  function recordLoss(idx) {
    const newLosses = gamePlayers[idx].losses + 1;
    const updated = gamePlayers.map((p, i) => (i === idx ? { ...p, losses: newLosses } : p));
    setGamePlayers(updated);
    if (newLosses >= targetLosses) {
      setGameOverInfo({ name: gamePlayers[idx].name, losses: newLosses });
      setPhase('game-over');
    } else {
      startNewRound(idx, updated);
    }
  }

  function playAgain() {
    setGameOverInfo(null);
    setPhase('setup');
  }
    function backToMenu() {
        setMenuOpen(false);
        setScoreOpen(false);
        setGamePlayers([]);
        setCurrentIdx(0);
        setActiveClaim(null);
        setCurrentRoll([]);
        setAutoOutInfo(null);
        setGameOverInfo(null);
        setPhase('setup');
    }
  // ---------- render ----------

    if (page) {
        return (
            <div className="dbg-app">
                <InfoPage page={page} go={goPage} />
            </div>
        );
    }

    return (
        <div className="dbg-app">
            {['roll', 'rolled', 'judge', 'reveal', 'auto-out'].includes(phase) && (
                <BurgerMenu
                    open={menuOpen}
                    onToggle={() => setMenuOpen((o) => !o)}
                    onShowScore={() => { setScoreOpen(true); setMenuOpen(false); }}
                    onMainMenu={backToMenu}
                    onSettings={() => { setMenuOpen(false); goPage('settings'); }}
                />
            )}

            {scoreOpen && (
                <ScoreboardModal
                    players={gamePlayers}
                    targetLosses={targetLosses}
                    onClose={() => setScoreOpen(false)}
                />
            )}

            {phase === 'setup' && (
                <button
                    className="dbg-burger dbg-burger--icon"
                    aria-label={t('settings.open')}
                    onClick={() => goPage('settings')}
                >
                    ⚙
                </button>
            )}

            {phase === 'setup' && (
                <SetupScreen
                players={players}
                updatePlayerName={updatePlayerName}
                addPlayer={addPlayer}
                removePlayer={removePlayer}
                startGame={startGame}
                targetLosses={targetLosses}
                adjustTargetLosses={adjustTargetLosses}
            />
        )}

        {phase === 'pass' && passTarget && (
            <PassScreen
                name={passTarget.name}
                onReady={() => setPhase(passTarget.next)}
            />
        )}
        {phase === 'roll' && current && (
            <RollScreen
                player={current}
                diceCount={diceThisTurn}
                onRoll={handleRoll}
                canPush={!!activeClaim && activeClaim.beatValue !== null && nextPushValue(String(activeClaim.beatValue)) !== null}
                onDoorschuiven={doorschuiven}
                onBlind={blind}
            />
        )}

        {phase === 'rolled' && current && (
            <RolledScreen
                player={current}
                roll={currentRoll}
                claimDraft={claimDraft}
                setClaimDraft={setClaimDraft}
                claimError={claimError}
                setClaimError={setClaimError}
                activeClaim={activeClaim}
                onConfirm={confirmClaim}
                onOut={() => recordLoss(currentIdx)}
            />
        )}

        {phase === 'judge' && current && activeClaim && (
            <JudgeScreen
                judgeName={current.name}
                claimOwnerName={gamePlayers[activeClaim.ownerIdx].name}
                claimValue={activeClaim.value}
                nextDiceCount={activeClaim.nextDiceCount}
                pushType={activeClaim.pushType}
                pushFrom={activeClaim.pushFrom}
                onBelieve={believe}
                onCheck={check}
            />
        )}

        {phase === 'reveal' && activeClaim && (
            <RevealScreen
                claimOwnerName={gamePlayers[activeClaim.ownerIdx].name}
                claimValue={activeClaim.value}
                ownerRoll={activeClaim.ownerRoll}
                claimOwnerIdx={activeClaim.ownerIdx}
                judgeIdx={currentIdx}
                players={gamePlayers}
                targetLosses={targetLosses}
                onContinue={(loserIdx) => continueFromReveal(loserIdx)}
            />
        )}

        {phase === 'auto-out' && autoOutInfo && (
            <AutoOutScreen info={autoOutInfo} onContinue={continueFromAutoOut} />
        )}

        {phase === 'game-over' && gameOverInfo && (
            <GameOverScreen
                info={gameOverInfo}
                targetLosses={targetLosses}
                players={gamePlayers}
                onPlayAgain={playAgain}
            />
        )}
      </div>
  );
}

// ---------- screens ----------

function SetupScreen({
                         players,
                         updatePlayerName,
                         addPlayer,
                         removePlayer,
                         startGame,
                         targetLosses,
                         adjustTargetLosses,
                     }) {
    const { t } = useT();
    const validCount = players.map((p) => p.name.trim()).filter(Boolean).length;
    return (
        <div className="dbg-screen dbg-screen--center">
            <div className="dbg-setup-card">
                <img src={logo} alt="Dobbelen" className="dbg-logo" />
                <h1 className="dbg-title dbg-title--center">Dobbelen</h1>
                <p className="dbg-sub dbg-sub--center">{t('setup.subtitle')}</p>

                <div className="dbg-players-list">
                    {players.map((p, i) => (
                        <div className="dbg-player-row" key={i}>
                            <span className="dbg-player-num">{i + 1}</span>
                            <input
                                className="dbg-input"
                                type="text"
                                placeholder={t('setup.playerPlaceholder', { n: i + 1 })}
                                value={p.name}
                                onChange={(e) => updatePlayerName(i, e.target.value)}
                            />
                            {players.length > 2 && (
                                <button
                                    className="dbg-remove"
                                    aria-label={t('setup.removePlayer')}
                                    onClick={() => removePlayer(i)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button className="dbg-btn dbg-btn--ghost" onClick={addPlayer}>
                    {t('setup.addPlayer')}
                </button>

                <div className="dbg-stepper-row">
                    <span className="dbg-stepper-label">{t('setup.targetLosses')}</span>
                    <div className="dbg-stepper">
                        <button
                            className="dbg-stepper-btn"
                            aria-label={t('setup.fewerLosses')}
                            onClick={() => adjustTargetLosses(-1)}
                        >
                            −
                        </button>
                        <span className="dbg-stepper-value">{targetLosses}</span>
                        <button
                            className="dbg-stepper-btn"
                            aria-label={t('setup.moreLosses')}
                            onClick={() => adjustTargetLosses(1)}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            <div className="dbg-actions dbg-actions--static">
                <button className="dbg-btn" disabled={validCount < 2} onClick={startGame}>
                    {t('setup.start')}
                </button>
                {validCount < 2 && (
                    <p className="dbg-claim-hint">{t('setup.needTwo')}</p>
                )}
            </div>
        </div>
    );
}

function RollScreen({ player, diceCount, onRoll, canPush, onDoorschuiven, onBlind }) {
const { t } = useT();
return (
    <div className="dbg-screen">
        <div className="dbg-felt">
            <p className="dbg-player-name">{player.name}</p>
            <p className="dbg-dice-count">
                {t('roll.diceInCup', { count: diceCount, n: diceCount })}
            </p>
        </div>
        <div className="dbg-spacer" />
        <div className="dbg-actions">
            <button className="dbg-btn" onClick={onRoll}>
                {t('roll.rollDice')}
            </button>
            {canPush && (
                <>
                    <button className="dbg-btn dbg-btn--ghost" onClick={onDoorschuiven}>
                        {t('roll.doorschuiven')}
                    </button>
                    <button className="dbg-btn dbg-btn--ghost" onClick={onBlind}>
                        {t('roll.blind')}
                    </button>
                </>
            )}
        </div>
    </div>
);
}
function PassScreen({ name, onReady }) {
    const { t } = useT();
    return (
        <div className="dbg-pass">
            <img src={logo} alt="Dobbelen" className="dbg-logo dbg-logo--pass" />
            <p className="dbg-eyebrow">{t('pass.eyebrow')}</p>
            <h1 className="dbg-title">{name}</h1>
            <div style={{ width: '100%', marginTop: 24 }}>
                <button className="dbg-btn" onClick={onReady}>
                    {t('pass.ready')}
                </button>
            </div>
        </div>
    );
}

function RolledScreen({
                          player,
                          roll,
                          claimDraft,
                          setClaimDraft,
                          claimError,
                          setClaimError,
                          activeClaim,
                          onConfirm,
                          onOut,
                      }) {
    const { t } = useT();
    const sortedDesc = [...roll].sort((a, b) => b - a);
    const digitCount = roll.length;
    const trueValue = claimNumber(roll);
    const base = activeClaim ? activeClaim.beatValue : trueValue;
    const trueSixCount = countTrueSixes(roll);
    const allTrueSixes = trueSixCount === digitCount; // every die this turn is really a six

    const prevActual = activeClaim ? claimNumber(activeClaim.ownerRoll) : null;
    const prevWasBluff = activeClaim ? prevActual !== activeClaim.value : false;

    const claims = validClaimsForDigits(digitCount);
    const firstIdx = claims.findIndex((v) => v > base);
    const noStrictRaise = firstIdx === -1;
    // Rolling all sixes IS the legal claim when nothing can beat it — don't block it.
    const noValidRaise = noStrictRaise && !allTrueSixes;
    const last = claims.length - 1;

    let chipValues = [];
    if (!noStrictRaise) {
        const remaining = last - firstIdx + 1;
        const i1 = firstIdx;
        const i2 = Math.min(firstIdx + 1, last);
        const i3 = Math.min(Math.max(i2 + 1, firstIdx + Math.ceil(remaining * 0.4)), last);
        const i4 = Math.min(Math.max(i3 + 1, firstIdx + Math.ceil(remaining * 0.75)), last);
        chipValues = [i1, i2, i3, i4].map((idx) => claims[idx]);
    }

    function tapChip(val) {
        setClaimDraft(String(val));
        setClaimError('');
    }

    return (
        <div className="dbg-screen">
            <p className="dbg-eyebrow">{t('rolled.onlyLook', { name: player.name })}</p>
            {activeClaim && (
                <p className="dbg-claim-hint" style={{ marginTop: -2, marginBottom: 10 }}>
                    {t('rolled.previousRoll', { n: prevActual })}
                    {prevWasBluff && (
                        <span style={{ color: 'var(--red)' }}> ({t('rolled.bluff', { value: activeClaim.value })})</span>
                    )}
                </p>
            )}
            <div className="dbg-dice-row">
                {sortedDesc.map((v, i) => (
                    <Die key={i} value={v} removed={v === 6} tumble />
                ))}
            </div>

            <p className="dbg-claim-hint" style={{ marginTop: 4 }}>
                {allTrueSixes
                    ? t('rolled.nothingBeats')
                    : activeClaim
                        ? t('rolled.beatBy', { value: activeClaim.beatValue })
                        : t('rolled.bluffUp')}
            </p>

            {!allTrueSixes && (
                <div className="dbg-chip-grid">
                    {CLAIM_CHIPS.map((label, i) => {
                        const val = chipValues[i];
                        const disabled = noValidRaise || val === undefined || (i > 0 && val === chipValues[i - 1]);
                        const selected = !disabled && String(val) === claimDraft;
                        return (
                            <button
                                key={label}
                                className={`dbg-chip${selected ? ' dbg-chip--selected' : ''}`}
                                disabled={disabled}
                                onClick={() => val !== undefined && tapChip(val)}
                            >
                                <span className="dbg-chip-label">{t(label)}</span>
                                <span className="dbg-chip-value">{val !== undefined ? val : '—'}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {allTrueSixes && (
                <p className="dbg-claim-hint" style={{ color: 'var(--gold)' }}>
                    {t('rolled.allSixes', { count: digitCount, value: trueValue })}
                </p>
            )}

            {noValidRaise && (
                <p className="dbg-claim-hint dbg-claim-hint--error">
                    {t('rolled.noLegal', { count: digitCount, n: digitCount, base })}
                </p>
            )}

            <div className="dbg-claim-input-wrap">
                <input
                    className="dbg-claim-input"
                    type="number"
                    inputMode="numeric"
                    value={claimDraft}
                    onChange={(e) => {
                        setClaimDraft(e.target.value);
                        setClaimError('');
                    }}
                />
                <p className={`dbg-claim-hint${claimError ? ' dbg-claim-hint--error' : ''}`}>
                    {claimError
                        ? t(claimError.key, claimError.vars)
                        : activeClaim
                            ? t('rolled.mustBeat', { value: activeClaim.beatValue })
                            : t('rolled.ownClaim')}
                </p>
            </div>

            <div className="dbg-spacer" />
            <div className="dbg-actions">
                {noValidRaise ? (
                    <button className="dbg-btn dbg-btn--red" onClick={onOut}>
                        {t('rolled.imOut')}
                    </button>
                ) : (
                    <button className="dbg-btn" onClick={onConfirm}>
                        {t('rolled.claimPass')}
                    </button>
                )}
            </div>
        </div>
    );
}

function JudgeScreen({
                         judgeName, claimOwnerName, claimValue, nextDiceCount,
                         pushType, pushFrom,
                         onBelieve, onCheck,
                     }) {
    const { t } = useT();
    return (
        <div className="dbg-screen">
            <p className="dbg-eyebrow">{t('judge.claims', { judge: judgeName, owner: claimOwnerName })}</p>
            <div className="dbg-felt">
                <p className="dbg-claim-hero">{claimValue}</p>
                <p className="dbg-claim-label">{t('judge.believeOrCheck')}</p>
                {pushType === 'doorschuiven' && (
                    <p className="dbg-claim-hint" style={{ marginTop: 8 }}>
                        {t('judge.doorschuiven', { from: pushFrom })}
                    </p>
                )}
                {pushType === 'blind' && (
                    <p className="dbg-claim-hint" style={{ marginTop: 8 }}>
                        {t('judge.blind', { from: pushFrom })}
                    </p>
                )}
            </div>
            <p className="dbg-claim-hint">
                {nextDiceCount === 0 ? t('judge.ifBelieveOut') : t('judge.ifBelieve')}
            </p>
            <div className="dbg-spacer" />
            <div className="dbg-actions">
                <button className="dbg-btn dbg-btn--green" onClick={onBelieve}>
                    {t('judge.believe')}
                </button>
                <button className="dbg-btn dbg-btn--red" onClick={onCheck}>
                    {t('judge.check')}
                </button>
            </div>
        </div>
    );
}

function Scoreboard({ players, targetLosses }) {
    return (
        <div className="dbg-scoreboard">
            {players.map((p, i) => (
                <div className="dbg-score-row" key={i}>
                    <span>{p.name}</span>
                    <span>
            {p.losses}
                        {targetLosses ? ` / ${targetLosses}` : ''}
          </span>
                </div>
            ))}
        </div>
    );
}

function BurgerMenu({ open, onToggle, onShowScore, onMainMenu, onSettings }) {
    const { t } = useT();
    const [confirming, setConfirming] = useState(false);
    const toggle = () => {
        setConfirming(false);
        onToggle();
    };
    return (
        <>
            <button className="dbg-burger" aria-label={t('menu.label')} onClick={toggle}>
                <span />
                <span />
                <span />
            </button>
            {open && (
                <div className="dbg-menu-overlay" onClick={toggle}>
                    <div className="dbg-menu-panel" onClick={(e) => e.stopPropagation()}>
                        <button className="dbg-menu-item" onClick={onShowScore}>
                            {t('menu.scoreboard')}
                        </button>
                        <button className="dbg-menu-item" onClick={onSettings}>
                            {t('menu.settings')}
                        </button>
                        <button
                            className="dbg-menu-item dbg-menu-item--danger"
                            onClick={() => (confirming ? onMainMenu() : setConfirming(true))}
                        >
                            {confirming ? t('menu.confirmEnd') : t('menu.mainMenu')}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function ScoreboardModal({ players, targetLosses, onClose }) {
    const { t } = useT();
    return (
        <div className="dbg-menu-overlay" onClick={onClose}>
            <div className="dbg-menu-panel" onClick={(e) => e.stopPropagation()}>
                <p className="dbg-eyebrow" style={{ marginBottom: 10 }}>{t('menu.scoreboard')}</p>
                <Scoreboard players={players} targetLosses={targetLosses} />
                <button className="dbg-btn dbg-btn--ghost" style={{ marginTop: 16 }} onClick={onClose}>
                    {t('common.close')}
                </button>
            </div>
        </div>
    );
}

function RevealScreen({
                          claimOwnerName,
                          claimValue,
                          ownerRoll,
                          claimOwnerIdx,
                          judgeIdx,
                          players,
                          targetLosses,
                          onContinue,
                      }) {
    const { t } = useT();
    const actual = claimNumber(ownerRoll);
    const wasBluff = actual < claimValue;
    const sortedDesc = [...ownerRoll].sort((a, b) => b - a);
    const loserIdx = wasBluff ? claimOwnerIdx : judgeIdx;
    const allSixes = ownerRoll.every((v) => v === 6);

    const displayPlayers = players.map((p, i) =>
        i === loserIdx ? { ...p, losses: p.losses + 1 } : p
    );

    return (
        <div className="dbg-screen">
            {allSixes && <div className="dbg-out-banner">{t('reveal.allSixes')}</div>}
            <p className="dbg-eyebrow">{t('reveal.actualDice', { name: claimOwnerName })}</p>
            <div className="dbg-dice-row">
                {sortedDesc.map((v, i) => (
                    <Die key={i} value={v} />
                ))}
            </div>
            <div className="dbg-felt" style={{ marginTop: 18 }}>
                <p className={`dbg-verdict ${wasBluff ? 'dbg-verdict--bluff' : 'dbg-verdict--true'}`}>
                    {wasBluff ? t('reveal.bluffing') : t('reveal.truth')}
                </p>
                <div className="dbg-reveal-row">
                    <span>{t('reveal.claimed')}</span>
                    <span>{claimValue}</span>
                </div>
                <div className="dbg-reveal-row">
                    <span>{t('reveal.actual')}</span>
                    <span>{actual}</span>
                </div>
            </div>

            <Scoreboard players={displayPlayers} targetLosses={targetLosses} />

            <div className="dbg-spacer" />
            <div className="dbg-actions">
                <button className="dbg-btn" onClick={() => onContinue(loserIdx)}>
                    {t('common.continue')}
                </button>
            </div>
        </div>
    );
}

function AutoOutScreen({ info, onContinue }) {
    const { t } = useT();
    return (
        <div className="dbg-screen">
            <div className="dbg-out-banner">{t('autoOut.banner')}</div>
            <div className="dbg-felt">
                <p className="dbg-sub" style={{ marginBottom: 6 }}>
                    {t('autoOut.claimed', { owner: info.claimOwnerName, value: info.claimValue })}
                </p>
                <p className="dbg-title" style={{ fontSize: 26 }}>{t('autoOut.isOut', { name: info.outName })}</p>
                <p className="dbg-sub" style={{ marginBottom: 0 }}>{t('autoOut.resumes')}</p>
            </div>
            <div className="dbg-spacer" />
            <div className="dbg-actions">
                <button className="dbg-btn" onClick={onContinue}>
                    {t('common.continue')}
                </button>
            </div>
        </div>
    );
}

function GameOverScreen({ info, targetLosses, players, onPlayAgain }) {
    const { t } = useT();
    return (
        <div className="dbg-screen dbg-screen--center">
            <div className="dbg-setup-card dbg-center">
                <img src={logo} alt="Dobbelen" className="dbg-logo" />
                <p className="dbg-eyebrow">{t('gameOver.strikes', { n: targetLosses })}</p>
                <h1 className="dbg-title">{t('gameOver.lost', { name: info.name })}</h1>

                <Scoreboard players={players} targetLosses={targetLosses} />
            </div>

            <div className="dbg-actions dbg-actions--static">
                <button className="dbg-btn" onClick={onPlayAgain}>
                    {t('gameOver.playAgain')}
                </button>
            </div>
        </div>
    );
}