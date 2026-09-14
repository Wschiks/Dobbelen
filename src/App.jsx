import { useState, useEffect } from 'react';
import Die from './Dice';
import './App.css';
import logo from './assets/logodob.png';

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

const CLAIM_CHIPS = ['1 higher', '2 higher', 'A lot higher', 'Even more higher'];

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
function nextDoorschuivenValue(numStr) {
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

export default function App() {
  // ----- setup state -----
  const [players, setPlayers] = useState([emptyPlayer(), emptyPlayer()]);
  const [targetLosses, setTargetLosses] = useState(3);

  // ----- game state -----
  const [phase, setPhase] = useState('setup');
  // phase: setup | pass | roll | rolled | judge | reveal | lost-select | auto-out | game-over

  const [gamePlayers, setGamePlayers] = useState([]); // [{ name }]
  const [currentIdx, setCurrentIdx] = useState(0);
  const [diceThisTurn, setDiceThisTurn] = useState(3); // how many dice to roll THIS turn

  const [currentRoll, setCurrentRoll] = useState([]); // this turn's rolled values
  const [claimDraft, setClaimDraft] = useState('');
  const [claimError, setClaimError] = useState('');

  // { value, ownerIdx, ownerRoll, beatValue, nextDiceCount }
  // value: the full number announced. beatValue/nextDiceCount: what's left
  // after stripping leading 6s — what the next roller must beat, and with how many dice.
  const [activeClaim, setActiveClaim] = useState(null);

  const [passTarget, setPassTarget] = useState(null); // { name, next }
  const [autoOutInfo, setAutoOutInfo] = useState(null); // { claimOwnerName, claimValue, outName, outIdx }
  const [gameOverInfo, setGameOverInfo] = useState(null); // { name, losses }

    const [menuOpen, setMenuOpen] = useState(false);
    const [scoreOpen, setScoreOpen] = useState(false);

  const current = gamePlayers[currentIdx];

  // prefill claim draft with the true value whenever a fresh roll lands
  useEffect(() => {
    if (phase === 'rolled' && currentRoll.length) {
      setClaimDraft(String(claimNumber(currentRoll)));
      setClaimError('');
    }
  }, [phase, currentRoll]);

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
        setCurrentRoll(rollDice(diceThisTurn, isUnlucky(current.name)));
        setPhase('rolled');
    }

    function confirmClaim() {
        const raw = claimDraft.trim();
        const digitCount = currentRoll.length;
        if (!isLegalClaimShape(raw, digitCount)) {
            setClaimError(`Enter a ${digitCount}-digit dice number (digits 1-6, high to low)`);
            return;
        }
        const val = parseInt(raw, 10);
        const minToBeat = activeClaim ? activeClaim.beatValue : null;
        if (minToBeat !== null && val <= minToBeat) {
            setClaimError(`Must beat ${minToBeat}`);
            return;
        }

        const trueSixCount = countTrueSixes(currentRoll);
        const restDigits = raw.split('').slice(trueSixCount).join('');
        const nextDiceCount = restDigits.length;
        const beatValue = restDigits.length ? parseInt(restDigits, 10) : null;

        // Even if this claim is all sixes (nextDiceCount === 0), we still let the
        // next player judge it — CHECK can catch a bluff before anyone is auto-out.
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
    function doorschuiven() {
        const beatStr = String(activeClaim.beatValue);
        const newVal = nextDoorschuivenValue(beatStr);
        if (newVal === null) return; // shouldn't happen if button is disabled correctly

        // If the claim we're building on was itself a blind push-through, nobody
        // has looked at dice since that hidden roll — carry it forward untouched.
        // Otherwise this is the FIRST schuifdoor in the chain: roll fresh dice now,
        // but the current player never looks at the result.
        const hiddenRoll = activeClaim.viaDoorschuiven
            ? activeClaim.ownerRoll
            : rollDice(diceThisTurn, isUnlucky(current.name));

        setActiveClaim({
            value: newVal,
            ownerIdx: currentIdx,
            ownerRoll: hiddenRoll,
            beatValue: newVal,
            nextDiceCount: diceThisTurn, // unseen dice, so digit count carries over unchanged
            viaDoorschuiven: true,
            doorschuivenFrom: activeClaim.beatValue,
        });
        const nextIdx = (currentIdx + 1) % gamePlayers.length;
        setCurrentIdx(nextIdx);
        setPassTarget({ name: gamePlayers[nextIdx].name, next: 'judge' });
        setPhase('pass');
    }
  function check() {
    setPhase('reveal');
  }

  function continueFromAutoOut() {
    recordLoss(autoOutInfo.outIdx);
  }

  function continueFromReveal(loserIdx) {
    recordLoss(loserIdx);
  }

  function openLostSelect() {
    setPhase('lost-select');
  }

  function selectLoser(idx) {
    recordLoss(idx);
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

    return (
        <div className="dbg-app">
            {['roll', 'rolled', 'judge', 'reveal', 'auto-out', 'lost-select'].includes(phase) && (
                <BurgerMenu
                    open={menuOpen}
                    onToggle={() => setMenuOpen((o) => !o)}
                    onShowScore={() => { setScoreOpen(true); setMenuOpen(false); }}
                    onMainMenu={backToMenu}
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
                onLost={openLostSelect}
                canDoorschuiven={!!activeClaim && nextDoorschuivenValue(String(activeClaim.beatValue)) !== null}
                onDoorschuiven={doorschuiven}
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
                onLost={openLostSelect}
            />
        )}

        {phase === 'judge' && current && activeClaim && (
            <JudgeScreen
                judgeName={current.name}
                claimOwnerName={gamePlayers[activeClaim.ownerIdx].name}
                claimValue={activeClaim.value}
                nextDiceCount={activeClaim.nextDiceCount}
                beatValue={activeClaim.beatValue}
                viaDoorschuiven={activeClaim.viaDoorschuiven}
                doorschuivenFrom={activeClaim.doorschuivenFrom}
                onBelieve={believe}
                onCheck={check}
                onLost={openLostSelect}
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

        {phase === 'lost-select' && (
            <LostSelectScreen players={gamePlayers} targetLosses={targetLosses} onSelect={selectLoser} />
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
    const validCount = players.map((p) => p.name.trim()).filter(Boolean).length;
    return (
        <div className="dbg-screen dbg-screen--center">
            <div className="dbg-setup-card">
                <img src={logo} alt="Dobbelen" className="dbg-logo" />
                <h1 className="dbg-title dbg-title--center">Dobbelen</h1>
                <p className="dbg-sub dbg-sub--center">Add everyone at the table, then start.</p>

                <div className="dbg-players-list">
                    {players.map((p, i) => (
                        <div className="dbg-player-row" key={i}>
                            <span className="dbg-player-num">{i + 1}</span>
                            <input
                                className="dbg-input"
                                type="text"
                                placeholder={`Player ${i + 1}`}
                                value={p.name}
                                onChange={(e) => updatePlayerName(i, e.target.value)}
                            />
                            {players.length > 2 && (
                                <button
                                    className="dbg-remove"
                                    aria-label="Remove player"
                                    onClick={() => removePlayer(i)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button className="dbg-btn dbg-btn--ghost" onClick={addPlayer}>
                    + Add player
                </button>

                <div className="dbg-stepper-row">
                    <span className="dbg-stepper-label">Losses to end the game</span>
                    <div className="dbg-stepper">
                        <button
                            className="dbg-stepper-btn"
                            aria-label="Fewer losses"
                            onClick={() => adjustTargetLosses(-1)}
                        >
                            −
                        </button>
                        <span className="dbg-stepper-value">{targetLosses}</span>
                        <button
                            className="dbg-stepper-btn"
                            aria-label="More losses"
                            onClick={() => adjustTargetLosses(1)}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            <div className="dbg-actions dbg-actions--static">
                <button className="dbg-btn" disabled={validCount < 2} onClick={startGame}>
                    START GAME
                </button>
                {validCount < 2 && (
                    <p className="dbg-claim-hint">Need at least 2 named players</p>
                )}
            </div>
        </div>
    );
}

function RollScreen({ player, diceCount, onRoll, onLost, canDoorschuiven, onDoorschuiven }) {
return (
    <div className="dbg-screen">
        <div className="dbg-felt">
            <p className="dbg-player-name">{player.name}</p>
            <p className="dbg-dice-count">
                {diceCount} {diceCount === 1 ? 'die' : 'dice'} in the cup
            </p>
        </div>
        <div className="dbg-spacer" />
        <div className="dbg-actions">
            <button className="dbg-btn" onClick={onRoll}>
                ROLL DICE
            </button>
            {canDoorschuiven && (
                <button className="dbg-btn dbg-btn--ghost" onClick={onDoorschuiven}>
                    DOORSCHUIVEN
                </button>
            )}
            <button className="dbg-btn dbg-btn--ghost" onClick={onLost}>
                Someone lost
            </button>
        </div>
    </div>
);
}
function PassScreen({ name, onReady }) {
    return (
        <div className="dbg-pass">
            <img src={logo} alt="Dobbelen" className="dbg-logo dbg-logo--pass" />
            <p className="dbg-eyebrow">Pass the phone to</p>
            <h1 className="dbg-title">{name}</h1>
            <div style={{ width: '100%', marginTop: 24 }}>
                <button className="dbg-btn" onClick={onReady}>
                    I'M READY
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
                        onLost,
                      }) {
  const sortedDesc = [...roll].sort((a, b) => b - a);
  const digitCount = roll.length;
  const trueValue = claimNumber(roll);
  const base = activeClaim ? activeClaim.beatValue : trueValue;

    const prevActual = activeClaim ? claimNumber(activeClaim.ownerRoll) : null;
    const prevWasBluff = activeClaim ? prevActual !== activeClaim.value : false;

    const claims = validClaimsForDigits(digitCount); // ascending, legal dice numbers only
    const firstIdx = claims.findIndex((v) => v > base);
    const noValidRaise = firstIdx === -1;
    const last = claims.length - 1;

    let chipValues = [];
    if (!noValidRaise) {
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
            <p className="dbg-eyebrow">Only {player.name} should look</p>
            {activeClaim && (
                <p className="dbg-claim-hint" style={{ marginTop: -2, marginBottom: 10 }}>
                    Vorige worp was {prevActual}
                    {prevWasBluff && (
                        <span style={{ color: 'var(--red)' }}> (claimed {activeClaim.value} — bluff!)</span>
                    )}
                </p>
            )}
            <div className="dbg-dice-row">
                {sortedDesc.map((v, i) => (
                    <Die key={i} value={v} removed={v === 6} />
                ))}
            </div>

            <p className="dbg-claim-hint" style={{ marginTop: 4 }}>
                {activeClaim ? `Beat ${activeClaim.beatValue} by:` : 'Bluff up from your roll:'}
            </p>

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
                  <span className="dbg-chip-label">{label}</span>
                  <span className="dbg-chip-value">{val !== undefined ? val : '—'}</span>
                </button>
            );
          })}
        </div>

        {noValidRaise && (
            <p className="dbg-claim-hint dbg-claim-hint--error">
              No legal claim with {digitCount} {digitCount === 1 ? 'die' : 'dice'} beats {base} — try "Someone lost".
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
            {claimError || (activeClaim ? `Must beat ${activeClaim.beatValue}` : 'Or type your own claim')}
          </p>
        </div>

        <div className="dbg-spacer" />
        <div className="dbg-actions">
          <button className="dbg-btn" disabled={noValidRaise} onClick={onConfirm}>
            CLAIM & PASS
          </button>
          <button className="dbg-btn dbg-btn--ghost" onClick={onLost}>
            Someone lost
          </button>
        </div>
      </div>
  );
}

function JudgeScreen({
                         judgeName, claimOwnerName, claimValue, nextDiceCount, beatValue,
                         viaDoorschuiven, doorschuivenFrom,
                         onBelieve, onCheck, onLost,
                     }) {
    return (
        <div className="dbg-screen">
            <p className="dbg-eyebrow">{judgeName}, {claimOwnerName} claims</p>
            <div className="dbg-felt">
                <p className="dbg-claim-hero">{claimValue}</p>
                <p className="dbg-claim-label">believe it, or check it</p>
                {viaDoorschuiven && (
                    <p className="dbg-claim-hint" style={{ marginTop: 8 }}>
                        Doorgeschoven: {doorschuivenFrom} + 1 — dice weren't rolled
                    </p>
                )}
            </div>
            <p className="dbg-claim-hint">
                {nextDiceCount === 0
                    ? "If you believe: nothing left to roll — you're out."
                    : `If you believe: dan is dat zo 🤙`}
            </p>
            <div className="dbg-spacer" />
            <div className="dbg-actions">
                <button className="dbg-btn dbg-btn--green" onClick={onBelieve}>
                    I BELIEVE
                </button>
                <button className="dbg-btn dbg-btn--red" onClick={onCheck}>
                    CHECK
                </button>
                <button className="dbg-btn dbg-btn--ghost" onClick={onLost}>
                    Someone lost
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

function BurgerMenu({ open, onToggle, onShowScore, onMainMenu }) {
    return (
        <>
            <button className="dbg-burger" aria-label="Menu" onClick={onToggle}>
                <span />
                <span />
                <span />
            </button>
            {open && (
                <div className="dbg-menu-overlay" onClick={onToggle}>
                    <div className="dbg-menu-panel" onClick={(e) => e.stopPropagation()}>
                        <button className="dbg-menu-item" onClick={onShowScore}>
                            Scoreboard
                        </button>
                        <button className="dbg-menu-item dbg-menu-item--danger" onClick={onMainMenu}>
                            Main menu
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function ScoreboardModal({ players, targetLosses, onClose }) {
    return (
        <div className="dbg-menu-overlay" onClick={onClose}>
            <div className="dbg-menu-panel" onClick={(e) => e.stopPropagation()}>
                <p className="dbg-eyebrow" style={{ marginBottom: 10 }}>Scoreboard</p>
                <Scoreboard players={players} targetLosses={targetLosses} />
                <button className="dbg-btn dbg-btn--ghost" style={{ marginTop: 16 }} onClick={onClose}>
                    Close
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
    const actual = claimNumber(ownerRoll);
    const wasBluff = actual < claimValue;
    const sortedDesc = [...ownerRoll].sort((a, b) => b - a);
    const loserIdx = wasBluff ? claimOwnerIdx : judgeIdx;

    const displayPlayers = players.map((p, i) =>
        i === loserIdx ? { ...p, losses: p.losses + 1 } : p
    );

    return (
        <div className="dbg-screen">
            <p className="dbg-eyebrow">{claimOwnerName}'s actual dice</p>
            <div className="dbg-dice-row">
                {sortedDesc.map((v, i) => (
                    <Die key={i} value={v} />
                ))}
            </div>
            <div className="dbg-felt" style={{ marginTop: 18 }}>
                <p className={`dbg-verdict ${wasBluff ? 'dbg-verdict--bluff' : 'dbg-verdict--true'}`}>
                    {wasBluff ? 'Bluffing' : 'Telling the truth'}
                </p>
                <div className="dbg-reveal-row">
                    <span>Claimed</span>
                    <span>{claimValue}</span>
                </div>
                <div className="dbg-reveal-row">
                    <span>Actual</span>
                    <span>{actual}</span>
                </div>
            </div>

            <Scoreboard players={displayPlayers} targetLosses={targetLosses} />

            <div className="dbg-spacer" />
            <div className="dbg-actions">
                <button className="dbg-btn" onClick={() => onContinue(loserIdx)}>
                    CONTINUE
                </button>
            </div>
        </div>
    );
}

function AutoOutScreen({ info, onContinue }) {
  return (
      <div className="dbg-screen">
        <div className="dbg-out-banner">All sixes, no mercy</div>
        <div className="dbg-felt">
          <p className="dbg-sub" style={{ marginBottom: 6 }}>
            {info.claimOwnerName} claimed {info.claimValue} — nothing left after the sixes.
          </p>
          <p className="dbg-title" style={{ fontSize: 26 }}>{info.outName} is out</p>
          <p className="dbg-sub" style={{ marginBottom: 0 }}>Play resumes after them.</p>
        </div>
        <div className="dbg-spacer" />
        <div className="dbg-actions">
          <button className="dbg-btn" onClick={onContinue}>
            CONTINUE
          </button>
        </div>
      </div>
  );
}

function LostSelectScreen({ players, targetLosses, onSelect }) {
  return (
      <div className="dbg-screen">
        <p className="dbg-eyebrow">Round over</p>
        <h1 className="dbg-title">Who lost?</h1>
        <p className="dbg-sub">{targetLosses} losses and you're out of the game.</p>
        <div className="dbg-lost-list">
          {players.map((p, i) => (
              <button key={i} onClick={() => onSelect(i)}>
                <span>{p.name}</span>
                <span className="dbg-lost-count">
              {p.losses}/{targetLosses}
            </span>
              </button>
          ))}
        </div>
      </div>
  );
}

function GameOverScreen({ info, targetLosses, players, onPlayAgain }) {
    return (
        <div className="dbg-screen dbg-screen--center">
            <div className="dbg-setup-card dbg-center">
                <img src={logo} alt="Dobbelen" className="dbg-logo" />
                <p className="dbg-eyebrow">{targetLosses} strikes — game over</p>
                <h1 className="dbg-title">{info.name} Lost</h1>

                <Scoreboard players={players} targetLosses={targetLosses} />
            </div>

            <div className="dbg-actions dbg-actions--static">
                <button className="dbg-btn" onClick={onPlayAgain}>
                    PLAY AGAIN
                </button>
            </div>
        </div>
    );
}