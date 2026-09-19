# Dice Bluff — Project Brief

## Concept

A simple mobile web game based on a real-life dice bluffing game.

The game is designed to be played on **one phone**, which is passed between players. No accounts, database, or login system are needed.

The goal is to keep everything **very simple and fast**, because the game will mainly be used on a small phone screen during a game night.

---

## Starting the Game

When the app starts, immediately show the player setup screen.

The only information the users need to enter is their **names**.

Example:

**Players**

* Player 1: `[ Wout ]`
* Player 2: `[ Jasper ]`
* Player 3: `[ Daan ]`

There should be an:

**`+ Add player`**

button so any number of players can be added.

There should also be a clear:

**`START GAME`**

button.

No other setup should be required.

---

## Game

Each player starts with **3 dice** and a cup.

The digital version should simulate the same game.

The current player presses:

**`ROLL DICE`**

The app generates the dice.

For example:

`4  5  2`

The highest possible number made from those dice is:

**542**

The player then announces their number to the other players.

The app should **not reveal the dice to the other players**.

The phone is then passed to the next player.

---

## Trust or Challenge

The next player sees only the previous player's claimed number.

Example:

> **Wout claims: 542**

The next player has two options:

### Believe

Press:

**`I BELIEVE`**

The player then rolls their own dice.

Their result must be higher than the previous claim.

For example:

Previous:

**542**

New roll:

**554**

The player can claim 554 and pass the phone to the next player.

---

### Challenge

The player can instead press:

**`CHECK`**

This reveals the previous player's actual dice.

This is where bluffing becomes important.

For example:

Actual dice:

`3  3  2`

The highest possible number is:

**332**

But the player claimed:

**632**

The player was bluffing.

The game then continues according to the agreed rules.

---

## Bluffing

Players are allowed to lie about their dice.

For example:

Actual:

`3 3 2`

Player can claim:

**632**

The next player has to decide whether they believe the claim or want to check it.

This is the main mechanic of the game.

---

## Sixes

A **6 has a special rule**.

Every die showing a 6 is removed from the game for the next round.

Examples:

### One six

Roll:

`6 4 2`

The 6 is removed.

Next round:

**2 dice**

### Two sixes

Roll:

`6 6 3`

Both 6s are removed.

Next round:

**1 die**

### Three sixes

Roll:

`6 6 6`

All dice are gone.

The next player is immediately out.

### One die remaining

If only one die remains and a player rolls:

`6`

That die is removed.

The next player is immediately out.

---

## Losing

There is no manual **`LOST`** button. Losses are recorded automatically from the
check / believe outcomes described above.

---

## Doorschuiven and Blind

On the roll screen (when there is a previous claim that can still be raised) the
player can push the claim on instead of rolling:

**`DOORSCHUIVEN`**: previous count + 1. Nobody rolls; the claim just goes to the next player.

**`BLIND`**: previous count + 1, but the dice are rolled again. The player never looks at them.

---

## Mobile-first

The application should be designed specifically for **phone screens**.

Keep the interface extremely simple:

* Large buttons
* Very little text
* Large dice
* One main action at a time
* No unnecessary menus
* No complicated settings
* No desktop-focused UI

The phone should be easy to pass around between players.

---

## Technical Requirements

### Frontend

Use **React**.

No database is required.

No user accounts are required.

No backend is required for the first version.

The entire game state can be stored in React state.

For example:

* Players
* Current player
* Number of dice
* Current dice
* Current claim
* Game round
* Players who are out

### Important

The first version should focus entirely on getting the **actual game working**.

Do not add unnecessary features such as:

* Accounts
* Online multiplayer
* Chat
* Leaderboards
* Profiles
* Database
* AI
* Complex animations

Those can be considered later if the basic game works well.

---

## Secret / Rigged Mode

The game may eventually contain a hidden mechanic that allows a specific player to have worse luck.

For example, the developer could secretly configure:

`Jasper`

as the target player.

However, this should **not be visible to normal players** and should not affect the basic game implementation.

The normal game should work correctly first.

---

## Main Goal

Build a **fast, simple and fun digital version of the real-life dice bluffing game**.

The first milestone is simply:

**Add players → Start → Roll → Claim → Believe/Check → Continue → Repeat.**

Everything else comes later.
