// TWIN GLADE — level state, marking logic, scoring, timer, hints and stars.
// A level holds the 7 differences, which are found, the running timer, the click
// accuracy, and the hint budget. Marking goes through the real click handler so the
// screenshot scenes can play the rules forward honestly.

import { HINTS_PER_LEVEL, WRONG_PENALTY } from './config.js';

export function createLevel(levelIndex, diffs) {
  return {
    index: levelIndex,
    diffs,
    found: new Array(diffs.length).fill(false),
    foundCount: 0,
    time: 0,
    clicks: 0,
    wrongClicks: 0,
    hintsLeft: HINTS_PER_LEVEL,
    hintIndex: -1,      // which diff is currently pulsed, -1 for none
    hintTimer: 0,       // seconds remaining in the pulse
    wrongFlash: 0,      // seconds remaining in the red-X flash
    wrongSpot: null,    // { x, y } of the last wrong click, in field coords
    complete: false,
  };
}

/** Distance from a click (field coords) to a difference's spot (pane-local coords). */
function distanceToDiff(click, pane, diff) {
  const dx = click.x - (pane.x + diff.x);
  const dy = click.y - (pane.y + diff.y);
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Try to mark the difference nearest the click. Returns 'found' | 'wrong'.
 * A click counts as a hit if it lands within a difference's radius on EITHER pane
 * (the spot is the same on both pictures, so clicking either side works).
 */
export function markAt(level, pane, click) {
  level.clicks += 1;
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < level.diffs.length; i += 1) {
    if (level.found[i]) continue;
    const d = distanceToDiff(click, pane, level.diffs[i]);
    if (d < level.diffs[i].radius && d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  if (best === null) {
    level.wrongClicks += 1;
    level.time += WRONG_PENALTY;
    level.wrongFlash = 0.6;
    level.wrongSpot = { x: click.x, y: click.y };
    return 'wrong';
  }
  level.found[best] = true;
  level.foundCount += 1;
  if (level.foundCount === level.diffs.length) level.complete = true;
  return 'found';
}

/** Advance the level by one fixed step. */
export function stepLevel(level, dt) {
  if (level.complete) return;
  level.time += dt;
  if (level.hintTimer > 0) {
    level.hintTimer -= dt;
    if (level.hintTimer <= 0) level.hintIndex = -1;
  }
  if (level.wrongFlash > 0) level.wrongFlash -= dt;
}

/** Use a hint: pulse the first unfound difference for a couple of seconds. */
export function useHint(level) {
  if (level.hintsLeft <= 0 || level.complete) return false;
  for (let i = 0; i < level.diffs.length; i += 1) {
    if (!level.found[i]) {
      level.hintsLeft -= 1;
      level.hintIndex = i;
      level.hintTimer = 2;
      return true;
    }
  }
  return false;
}

/** Accuracy as a 0..1 fraction of correct clicks. */
export function accuracy(level) {
  if (level.clicks === 0) return 1;
  return (level.clicks - level.wrongClicks) / level.clicks;
}

/** Stars: 3 if no wrong clicks, 2 if 1-2, else 1. */
export function starsFor(level) {
  if (level.wrongClicks === 0) return 3;
  if (level.wrongClicks <= 2) return 2;
  return 1;
}

/** Format seconds as m:ss. */
export function formatTime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}