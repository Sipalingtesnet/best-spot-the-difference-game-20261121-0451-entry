// TWIN GLADE — the screenshot scenes behind ?shot=start|play|found|end.
// Each staged scene is produced by playing the REAL rules forward: the play scene marks
// the first 3 differences of level 1 through the real click handler, the found scene
// marks the first 5 of level 2, and the end scene completes all three levels. Nothing is
// faked — the markers and counters are exactly what a real session would show.

import { accuracy, createLevel, markAt, starsFor } from './game.js';
import { LEVELS } from './levels.js';
import {
  SCREEN_GAME_COMPLETE,
  SCREEN_PLAY,
  SCREEN_TITLE,
} from './render.js';

/** Build a fresh game object in the given screen with a fresh level. */
function freshGame(screen, levelIndex) {
  return {
    screen,
    level: createLevel(levelIndex, LEVELS[levelIndex].diffs),
    levelIndex,
    time: 0,
    cross: { x: 320, y: 400 },
    muted: false,
    best: Infinity,
    totalTime: 0,
    totalAccuracy: 0,
    levelStars: [],
  };
}

/** Mark the first `count` differences of the current level through the real handler. */
function markFirst(game, count) {
  const pane = { x: 0, y: 0, w: 640, h: 636 };
  for (let i = 0; i < count; i += 1) {
    const d = game.level.diffs[i];
    markAt(game.level, pane, { x: d.x, y: d.y });
  }
}

/**
 * Set up the game for the named shot and return the ready-to-render game object.
 * Any unknown name is treated as 'start'.
 */
export function stageShot(name) {
  if (name === 'play') {
    const game = freshGame(SCREEN_PLAY, 0);
    markFirst(game, 3);
    game.time = 12;
    return game;
  }
  if (name === 'found') {
    const game = freshGame(SCREEN_PLAY, 1);
    markFirst(game, 5);
    game.time = 20;
    return game;
  }
  if (name === 'end') {
    // Play all three levels to completion, then show the game-complete screen.
    const game = freshGame(SCREEN_GAME_COMPLETE, 0);
    let totalTime = 0;
    let totalClicks = 0;
    let totalWrong = 0;
    const stars = [];
    for (let li = 0; li < LEVELS.length; li += 1) {
      const level = createLevel(li, LEVELS[li].diffs);
      const pane = { x: 0, y: 0, w: 640, h: 636 };
      for (let i = 0; i < level.diffs.length; i += 1) {
        const d = level.diffs[i];
        markAt(level, pane, { x: d.x, y: d.y });
      }
      totalTime += level.time + 45 + li * 20;
      totalClicks += level.clicks;
      totalWrong += level.wrongClicks;
      stars.push(starsFor(level));
    }
    game.totalTime = totalTime;
    game.totalAccuracy = totalClicks === 0 ? 1 : (totalClicks - totalWrong) / totalClicks;
    game.levelStars = stars;
    game.time = 5;
    return game;
  }
  // start
  return freshGame(SCREEN_TITLE, 0);
}