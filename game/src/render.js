// TWIN GLADE — drawing only: scenes (via levels.js), markers, HUD and screens.
// The 1280x720 playfield is scaled to fit the window and centred. The two pictures
// sit side by side below the HUD bar.

import { FIELD, FONT, PALETTE, PANE } from './config.js';
import { accuracy, formatTime, starsFor } from './game.js';
import { LEVELS } from './levels.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_LEVEL_COMPLETE = 'level-complete';
export const SCREEN_GAME_COMPLETE = 'game-complete';

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, baseline) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.textBaseline = baseline || 'alphabetic';
    context.fillText(value, x, y);
  }

  // Paper-grain background: a few soft speckles over the whole field.
  function drawPaper(time) {
    context.fillStyle = PALETTE.paper;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = 'rgba(120,100,70,0.05)';
    for (let i = 0; i < 260; i += 1) {
      const gx = (i * 53 + 17) % FIELD.width;
      const gy = (i * 97 + 31) % FIELD.height;
      context.fillRect(gx, gy, 2, 2);
    }
  }

  // Draw one pane's scene. `altered` is the set of diff indices to apply on this side.
  function drawPane(drawFn, pane, side, time, altered) {
    context.save();
    context.beginPath();
    context.rect(pane.x, pane.y, pane.w, pane.h);
    context.clip();
    context.translate(pane.x, pane.y);
    drawFn(context, pane, side, time, altered);
    context.restore();
    context.strokeStyle = PALETTE.panelLine;
    context.lineWidth = 2;
    context.strokeRect(pane.x + 1, pane.y + 1, pane.w - 2, pane.h - 2);
  }

  // Green ring marker on a found difference, drawn on both panes.
  function drawMarker(pane, diff, time) {
    const x = pane.x + diff.x;
    const y = pane.y + diff.y;
    const pulse = 1 + Math.sin(time * 4) * 0.08;
    context.strokeStyle = '#3f9e4f';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(x, y, diff.radius * 0.72 * pulse, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = 'rgba(63,158,79,0.25)';
    context.beginPath();
    context.arc(x, y, diff.radius * 0.72 * pulse, 0, Math.PI * 2);
    context.fill();
  }

  // Hint pulse: a bright ring around an unfound difference on both panes.
  function drawHint(pane, diff, time) {
    const x = pane.x + diff.x;
    const y = pane.y + diff.y;
    const a = 0.5 + 0.5 * Math.sin(time * 8);
    context.strokeStyle = `rgba(232,182,76,${0.5 + a * 0.5})`;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(x, y, diff.radius * 1.1, 0, Math.PI * 2);
    context.stroke();
  }

  // Red X flash on a wrong click.
  function drawWrong(level) {
    if (level.wrongFlash <= 0 || !level.wrongSpot) return;
    const x = level.wrongSpot.x;
    const y = level.wrongSpot.y;
    const a = Math.min(1, level.wrongFlash / 0.3);
    context.strokeStyle = `rgba(198,91,74,${a})`;
    context.lineWidth = 4;
    const s = 14;
    context.beginPath();
    context.moveTo(x - s, y - s);
    context.lineTo(x + s, y + s);
    context.moveTo(x + s, y - s);
    context.lineTo(x - s, y + s);
    context.stroke();
  }

  // The crosshair.
  function drawCrosshair(cross) {
    const x = cross.x;
    const y = cross.y;
    context.strokeStyle = 'rgba(58,47,40,0.85)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x - 12, y);
    context.lineTo(x - 4, y);
    context.moveTo(x + 4, y);
    context.lineTo(x + 12, y);
    context.moveTo(x, y - 12);
    context.lineTo(x, y - 4);
    context.moveTo(x, y + 4);
    context.lineTo(x, y + 12);
    context.stroke();
    context.strokeStyle = 'rgba(255,255,255,0.7)';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x, y, 3, 0, Math.PI * 2);
    context.stroke();
  }

  // The HUD bar across the top.
  function drawHud(level, muted) {
    context.fillStyle = PALETTE.panel;
    context.fillRect(0, 0, FIELD.width, FIELD.hud);
    context.strokeStyle = PALETTE.panelLine;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, FIELD.hud);
    context.lineTo(FIELD.width, FIELD.hud);
    context.stroke();
    text(level.name, 24, 26, 26, PALETTE.ink, 'left', 'top');
    const remain = level.diffs.length - level.foundCount;
    text(`Found ${level.foundCount} / ${level.diffs.length} — ${remain} remain`, 24, 54, 20, PALETTE.inkSoft, 'left', 'top');
    text(`Time ${formatTime(level.time)}`, FIELD.width / 2, 26, 26, PALETTE.ink, 'center', 'top');
    text(`Hints ${level.hintsLeft}`, FIELD.width / 2, 54, 20, PALETTE.inkSoft, 'center', 'top');
    text(muted ? 'Muted' : 'M: mute', FIELD.width - 24, 26, 20, PALETTE.inkSoft, 'right', 'top');
    text('P: pause', FIELD.width - 24, 54, 20, PALETTE.inkSoft, 'right', 'top');
  }

  // A rounded panel with a title, lines and a prompt.
  function drawPanel(title, lines, prompt, accent) {
    const width = 560;
    const lineH = 30;
    const height = 120 + lines.length * lineH + 70;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.beginPath();
    context.roundRect(x, y, width, height, 18);
    context.fill();
    context.strokeStyle = PALETTE.panelLine;
    context.lineWidth = 3;
    context.stroke();
    text(title, FIELD.width / 2, y + 66, 40, accent || PALETTE.ink, 'center');
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + 120 + i * lineH, 20, PALETTE.inkSoft, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 40, 22, PALETTE.goldDeep, 'center');
  }

  function drawStars(n, cx, cy, size) {
    for (let i = 0; i < 3; i += 1) {
      const x = cx + (i - 1) * (size + 14);
      if (i < n) {
        context.fillStyle = PALETTE.gold;
        context.beginPath();
        context.arc(x, cy, size, 0, Math.PI * 2);
        context.fill();
      } else {
        context.strokeStyle = PALETTE.panelLine;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(x, cy, size, 0, Math.PI * 2);
        context.stroke();
      }
    }
  }

  /** Paint one frame. `game` carries the whole session state. */
  function draw(game) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.paperDark;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawPaper(game.time);

    const screen = game.screen;
    if (screen === SCREEN_TITLE) {
      drawTitle(game);
      return;
    }

    const level = game.level;
    const paneL = { x: 0, y: PANE.top, w: PANE.width, h: PANE.height };
    const paneR = { x: PANE.width, y: PANE.top, w: PANE.width, h: PANE.height };
    const alteredL = new Set();
    const alteredR = new Set();
    for (let i = 0; i < level.diffs.length; i += 1) {
      if (level.diffs[i].side === 'L') alteredL.add(i);
      else alteredR.add(i);
    }
    drawPane(LEVELS[game.levelIndex].draw, paneL, 'L', game.time, alteredL);
    drawPane(LEVELS[game.levelIndex].draw, paneR, 'R', game.time, alteredR);

    for (let i = 0; i < level.diffs.length; i += 1) {
      if (level.found[i]) {
        drawMarker(paneL, level.diffs[i], game.time);
        drawMarker(paneR, level.diffs[i], game.time);
      }
    }
    if (level.hintIndex >= 0 && level.hintTimer > 0) {
      drawHint(paneL, level.diffs[level.hintIndex], game.time);
      drawHint(paneR, level.diffs[level.hintIndex], game.time);
    }
    drawWrong(level);

    if (screen === SCREEN_PLAY) {
      drawHud(level, game.muted);
      drawCrosshair(game.cross);
    } else if (screen === SCREEN_PAUSED) {
      drawHud(level, game.muted);
      drawPanel('Paused', ['The glade waits for you.'], 'P or Esc to resume · R to restart', PALETTE.ink);
    } else if (screen === SCREEN_LEVEL_COMPLETE) {
      drawHud(level, game.muted);
      const stars = starsFor(level);
      const lines = [
        `Time ${formatTime(level.time)}`,
        `Accuracy ${Math.round(accuracy(level) * 100)}%`,
        '',
      ];
      drawPanel('Level complete!', lines, 'N or click for the next level', PALETTE.goldDeep);
      drawStars(stars, FIELD.width / 2, FIELD.height / 2 + 40, 22);
    } else if (screen === SCREEN_GAME_COMPLETE) {
      drawGameComplete(game);
    }
  }

  function drawTitle(game) {
    drawPaper(game.time);
    const pane = { x: 0, y: 0, w: FIELD.width, h: FIELD.height };
    const altered = new Set();
    LEVELS[0].draw(context, pane, 'L', game.time, altered);
    context.fillStyle = 'rgba(246,239,226,0.82)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    text('TWIN GLADE', FIELD.width / 2, 150, 72, PALETTE.ink, 'center');
    text('a cozy spot-the-difference game', FIELD.width / 2, 210, 24, PALETTE.inkSoft, 'center');
    const best = game.best === Infinity ? '—' : formatTime(game.best);
    text(`Best total time: ${best}`, FIELD.width / 2, 260, 22, PALETTE.inkSoft, 'center');
    const lines = [
      'Find all 7 differences in each of the 3 scenes.',
      'Click a spot, or move the crosshair with arrows / WASD and press Enter or Space.',
      'H for a hint (3 per level) · P to pause · M to mute.',
      'Wrong clicks add 5 seconds — no lives lost, stay cozy.',
    ];
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, 330 + i * 30, 20, PALETTE.inkSoft, 'center');
    }
    text('CLICK TO START', FIELD.width / 2, 500, 30, PALETTE.goldDeep, 'center');
  }

  function drawGameComplete(game) {
    drawPaper(game.time);
    text('TWIN GLADE', FIELD.width / 2, 120, 60, PALETTE.ink, 'center');
    text('All three glades explored!', FIELD.width / 2, 180, 26, PALETTE.inkSoft, 'center');
    const totalStars = game.levelStars.reduce((a, b) => a + b, 0);
    drawStars(totalStars, FIELD.width / 2, 260, 26);
    text(`Total time ${formatTime(game.totalTime)}`, FIELD.width / 2, 330, 30, PALETTE.ink, 'center');
    text(`Total accuracy ${Math.round(game.totalAccuracy * 100)}%`, FIELD.width / 2, 372, 30, PALETTE.ink, 'center');
    text('R or click to play again', FIELD.width / 2, 480, 26, PALETTE.goldDeep, 'center');
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}