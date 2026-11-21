// TWIN GLADE — boot and the one loop: input is read every frame, the game advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves between
// title, playing, paused, level-complete and game-complete screens.
//
// ?seed=N fixes the RNG. ?shot=start|play|found|end (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a
// screenshot.
import { BEST_KEY, FIELD, LEVEL_COUNT, PANE, STEP } from './config.js';
import { createRandom } from './random.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_HINT, ACTION_MUTE, ACTION_RESTART } from './input.js';
import { createAudio } from './audio.js';
import { createLevel, markAt, stepLevel, useHint, accuracy, starsFor } from './game.js';
import { LEVELS } from './levels.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_LEVEL_COMPLETE, SCREEN_GAME_COMPLETE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const audio = createAudio();
const random = createRandom(seed);

function readBest() {
  try {
    const v = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '', 10);
    return Number.isFinite(v) && v > 0 ? v : Infinity;
  } catch {
    return Infinity;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(Math.floor(value)));
  } catch {
    // Storage can be off: the best then lasts this visit only.
  }
}

/** Build a fresh session game object on the title screen. */
function newGame() {
  return {
    screen: SCREEN_TITLE,
    level: createLevel(0, LEVELS[0].diffs),
    levelIndex: 0,
    time: 0,
    cross: { x: 320, y: 400 },
    muted: false,
    best: readBest(),
    totalTime: 0,
    totalAccuracy: 0,
    levelStars: [],
  };
}

function startLevel(game, index) {
  game.levelIndex = index;
  game.level = createLevel(index, LEVELS[index].diffs);
  game.cross = { x: 320, y: 400 };
}

function runShot(name) {
  const game = stageShot(name);
  window.__game = game;
  let painted = 0;
  function paint() {
    renderer.draw(game);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const game = newGame();
  window.__game = game;
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function beginPlay() {
    startLevel(game, 0);
    game.screen = SCREEN_PLAY;
    audio.unlock();
    audio.startMusic();
    announce(`Level 1: ${LEVELS[0].name}. Find all 7 differences.`);
  }

  function completeLevel() {
    game.levelStars.push(starsFor(game.level));
    game.totalTime += game.level.time;
    const acc = accuracy(game.level);
    game.totalAccuracy = game.totalAccuracy === 0 ? acc : (game.totalAccuracy + acc) / 2;
    if (game.levelIndex + 1 >= LEVEL_COUNT) {
      game.screen = SCREEN_GAME_COMPLETE;
      if (game.totalTime < game.best) {
        game.best = game.totalTime;
        saveBest(game.best);
      }
      audio.stopMusic();
      audio.play('win');
      announce(`Game complete. Total time ${Math.floor(game.totalTime)}s.`);
    } else {
      game.screen = SCREEN_LEVEL_COMPLETE;
      audio.play('fanfare');
      announce(`Level complete. ${LEVELS[game.levelIndex].name} done.`);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    const click = input.takeClick();

    if (actions & ACTION_MUTE) {
      game.muted = !game.muted;
      audio.setMuted(game.muted);
    }

    if (game.screen === SCREEN_TITLE) {
      if ((actions & ACTION_CONFIRM) || click) beginPlay();
      return;
    }

    if (game.screen === SCREEN_PLAY) {
      if (actions & ACTION_PAUSE) {
        game.screen = SCREEN_PAUSED;
        audio.stopMusic();
        announce('Paused.');
        return;
      }
      if (actions & ACTION_HINT) {
        if (useHint(game.level)) audio.play('hint');
      }
      // Crosshair movement.
      const move = input.move();
      game.cross.x = Math.max(0, Math.min(FIELD.width, game.cross.x + move.x * 420 * STEP));
      game.cross.y = Math.max(PANE.top, Math.min(FIELD.height, game.cross.y + move.y * 420 * STEP));
      // Marking: a click, or Enter/Space with the crosshair.
      let markSpot = click;
      if ((actions & ACTION_CONFIRM) && !click) markSpot = { x: game.cross.x, y: game.cross.y };
      if (markSpot) {
        const pane = { x: 0, y: PANE.top, w: PANE.width, h: PANE.height };
        const result = markAt(game.level, pane, markSpot);
        if (result === 'found') {
          audio.play('found');
          announce(`Found ${game.level.foundCount} of ${game.level.diffs.length}.`);
          if (game.level.complete) completeLevel();
        } else if (result === 'wrong') {
          audio.play('wrong');
          announce('Not there. +5 seconds.');
        }
      }
      return;
    }

    if (game.screen === SCREEN_PAUSED) {
      if (actions & ACTION_RESTART) {
        startLevel(game, game.levelIndex);
        game.screen = SCREEN_PLAY;
        audio.startMusic();
        announce('Restarted.');
      } else if ((actions & ACTION_PAUSE) || (actions & ACTION_CONFIRM)) {
        game.screen = SCREEN_PLAY;
        audio.startMusic();
        announce('Playing.');
      }
      return;
    }

    if (game.screen === SCREEN_LEVEL_COMPLETE) {
      if ((actions & ACTION_CONFIRM) || click) {
        startLevel(game, game.levelIndex + 1);
        game.screen = SCREEN_PLAY;
        announce(`Level ${game.levelIndex + 1}: ${LEVELS[game.levelIndex].name}.`);
      }
      return;
    }

    if (game.screen === SCREEN_GAME_COMPLETE) {
      if ((actions & ACTION_RESTART) || (actions & ACTION_CONFIRM) || click) {
        const best = game.best;
        Object.assign(game, newGame());
        game.best = best;
        game.screen = SCREEN_TITLE;
        announce('TWIN GLADE. Click to start.');
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (game.screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        stepLevel(game.level, STEP);
        game.time += STEP;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      game.time += STEP;
    }
    renderer.draw(game);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.screen === SCREEN_PLAY) {
      game.screen = SCREEN_PAUSED;
      audio.stopMusic();
      announce('Paused.');
    }
  });

  announce('TWIN GLADE. Click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();