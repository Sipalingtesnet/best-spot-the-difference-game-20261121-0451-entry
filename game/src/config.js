// TWIN GLADE — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the window.

export const FIELD = { width: 1280, height: 720, hud: 84 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The two pictures sit side by side; each is half the play area below the HUD. */
export const PANE = {
  width: FIELD.width / 2,
  height: FIELD.height - FIELD.hud,
  top: FIELD.hud,
};

/** How many differences each level hides, and how many levels there are. */
export const DIFFS_PER_LEVEL = 7;
export const LEVEL_COUNT = 3;

/** Hints: how many per level, and how long a hint pulse lasts (seconds). */
export const HINTS_PER_LEVEL = 3;
export const HINT_PULSE = 2;

/** Wrong-click penalty, in seconds, added to the timer. */
export const WRONG_PENALTY = 5;

/** Crosshair movement speed, in logical pixels per second. */
export const CROSS_SPEED = 420;

/** Where the best total time is kept between visits (this browser only). */
export const BEST_KEY = 'twin-glade.best';

/** Storybook palette. */
export const PALETTE = {
  paper: '#f6efe2',
  paperDark: '#e9dfc9',
  ink: '#3a2f28',
  inkSoft: '#6b5d4f',
  cream: '#fff8ea',
  green: '#7ba05b',
  greenDeep: '#4f7a3f',
  sky: '#bfd9e8',
  skyDeep: '#9fc3da',
  gold: '#e8b64c',
  goldDeep: '#c98f2e',
  red: '#c65b4a',
  blue: '#5b8fb8',
  night: '#1c2740',
  nightDeep: '#131a2c',
  star: '#f4e9c8',
  panel: '#fbf4e6',
  panelLine: '#d9c9a8',
  white: '#ffffff',
};

export const FONT = '"Georgia", "Palatino Linotype", "Book Antiqua", serif';