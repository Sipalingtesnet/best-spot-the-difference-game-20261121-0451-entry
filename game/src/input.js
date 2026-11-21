// Keyboard + mouse input for TWIN GLADE.
// The crosshair moves with arrow keys / WASD; Enter or Space marks the spot under it.
// A mouse click marks the spot clicked. One-shot presses are queued as bit flags and
// taken once by the loop, so a press between two frames is never lost or counted twice.

export const ACTION_CONFIRM = 1; // start / mark / advance
export const ACTION_PAUSE = 2;   // pause / resume
export const ACTION_HINT = 4;    // H
export const ACTION_MUTE = 8;    // M
export const ACTION_RESTART = 16; // R

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter', 'KeyN']);
const PAUSE = new Set(['KeyP', 'Escape']);
const HINT = new Set(['KeyH']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);

export function createInput(target) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let actions = 0;
  let click = null; // { x, y } in logical field coords, or null

  function toField(event) {
    const rect = target.getBoundingClientRect();
    // The canvas is scaled to fit; map the click back into the 1280x720 field.
    const scale = Math.min(rect.width / 1280, rect.height / 720);
    const x = (event.clientX - rect.left - (rect.width - 1280 * scale) / 2) / scale;
    const y = (event.clientY - rect.top - (rect.height - 720 * scale) / 2) / scale;
    return { x, y };
  }

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (HINT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HINT;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });
  window.addEventListener('blur', () => {
    up = down = left = right = false;
  });
  target.addEventListener('pointerdown', (event) => {
    click = toField(event);
    actions |= ACTION_CONFIRM;
  });

  return {
    /** -1, 0, 1 for each axis of the crosshair. */
    move() {
      return {
        x: (right ? 1 : 0) - (left ? 1 : 0),
        y: (down ? 1 : 0) - (up ? 1 : 0),
      };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The last click in field coords, cleared once read. */
    takeClick() {
      const c = click;
      click = null;
      return c;
    },
  };
}