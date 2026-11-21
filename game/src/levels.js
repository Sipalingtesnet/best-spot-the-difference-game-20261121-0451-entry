// TWIN GLADE — the three scenes. Each level is a hand-drawn vector scene drawn twice
// (left pane and right pane) by the SAME draw function; a per-side difference mask makes
// the two pictures near-identical except for the 7 hidden spots.
//
// A difference entry is { x, y, radius, kind, side } where (x, y) is the spot in the
// pane's local coordinates (0..640 wide, 0..636 tall), radius is the click tolerance,
// kind is one of 'missing' | 'extra' | 'colour' | 'moved' | 'shape', and side is 'L' or
// 'R' — the pane that shows the ALTERED version of that spot. The draw function receives
// `altered`, the set of difference indices to apply on the pane being drawn.

// A few shared drawing helpers, in pane-local coordinates.
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cloud(ctx, x, y, s, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 24 * s, y - 8 * s, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 48 * s, y, 20 * s, 0, Math.PI * 2);
  ctx.arc(x + 24 * s, y + 8 * s, 20 * s, 0, Math.PI * 2);
  ctx.fill();
}

function grassBlade(ctx, x, y, h, lean, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 4, y - h * 0.6, x + lean * 9, y - h);
  ctx.stroke();
}

export const LEVELS = [
  {
    name: 'Meadow Morning',
    subtitle: 'a cottage, a big oak, sun, clouds, flowers, a butterfly, a pond, a fence',
    diffs: [
      { x: 92, y: 470, radius: 26, kind: 'missing', side: 'R' },   // bird on the fence
      { x: 470, y: 250, radius: 30, kind: 'colour', side: 'L' },   // cottage roof colour
      { x: 210, y: 120, radius: 30, kind: 'moved', side: 'R' },    // a cloud drifted
      { x: 540, y: 500, radius: 24, kind: 'extra', side: 'L' },    // an extra flower
      { x: 300, y: 560, radius: 34, kind: 'shape', side: 'R' },    // pond shape
      { x: 150, y: 360, radius: 26, kind: 'colour', side: 'R' },   // butterfly colour
      { x: 380, y: 470, radius: 22, kind: 'missing', side: 'L' },  // a fence post
    ],
    draw(ctx, pane, side, time, altered) {
      const W = pane.w;
      const H = pane.h;
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#aed6ec');
      sky.addColorStop(1, '#dff0f7');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // Sun
      const sunX = W - 70;
      const sunY = 78;
      ctx.fillStyle = '#f6d878';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(246,216,120,0.35)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 48 + Math.sin(time * 1.4) * 3, 0, Math.PI * 2);
      ctx.fill();
      // Clouds (one drifts for the 'moved' difference)
      const drift = Math.sin(time * 0.5) * 6;
      cloud(ctx, 120 + drift, 70, 1, '#ffffff');
      cloud(ctx, 330, 46, 0.8, '#f4fbfe');
      const cloud3x = 500 + (altered.has(2) ? 34 : 0);
      cloud(ctx, cloud3x, 96, 0.9, '#ffffff');
      // Rolling hills
      ctx.fillStyle = '#b9d79a';
      ctx.beginPath();
      ctx.moveTo(0, 470);
      ctx.quadraticCurveTo(160, 430, 320, 470);
      ctx.quadraticCurveTo(480, 500, W, 460);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#a3cc82';
      ctx.beginPath();
      ctx.moveTo(0, 520);
      ctx.quadraticCurveTo(200, 490, 420, 525);
      ctx.quadraticCurveTo(540, 545, W, 520);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      // Pond (shape difference: round vs oval)
      ctx.fillStyle = '#8fc3d9';
      if (altered.has(4)) {
        ctx.beginPath();
        ctx.ellipse(300, 566, 52, 30, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(300, 566, 42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(288, 556, 14, 7, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Fence
      ctx.strokeStyle = '#8a6a4a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(60, 500);
      ctx.lineTo(60, 452);
      ctx.moveTo(140, 500);
      ctx.lineTo(140, 452);
      ctx.moveTo(220, 500);
      ctx.lineTo(220, 452);
      ctx.moveTo(300, 500);
      ctx.lineTo(300, 452);
      ctx.moveTo(380, 500);
      ctx.lineTo(380, 452);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(48, 470);
      ctx.lineTo(392, 470);
      ctx.moveTo(48, 484);
      ctx.lineTo(392, 484);
      ctx.stroke();
      // A fence post missing (difference 6)
      if (!altered.has(6)) {
        ctx.strokeStyle = '#8a6a4a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(460, 500);
        ctx.lineTo(460, 452);
        ctx.stroke();
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(448, 470);
        ctx.lineTo(472, 470);
        ctx.moveTo(448, 484);
        ctx.lineTo(472, 484);
        ctx.stroke();
      }
      // Big oak
      ctx.fillStyle = '#6b4a2f';
      ctx.fillRect(150, 300, 26, 120);
      ctx.fillStyle = '#4f7a3f';
      ctx.beginPath();
      ctx.arc(163, 268, 62, 0, Math.PI * 2);
      ctx.arc(120, 300, 44, 0, Math.PI * 2);
      ctx.arc(206, 300, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5f8f4c';
      ctx.beginPath();
      ctx.arc(150, 250, 34, 0, Math.PI * 2);
      ctx.fill();
      // Cottage
      const roofColour = altered.has(1) ? '#c96a4a' : '#a85a3a';
      ctx.fillStyle = '#e8d9b0';
      ctx.fillRect(430, 300, 130, 110);
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(482, 356, 28, 54);
      ctx.fillStyle = '#bfe0f0';
      ctx.fillRect(452, 330, 30, 30);
      ctx.fillStyle = roofColour;
      ctx.beginPath();
      ctx.moveTo(420, 300);
      ctx.lineTo(495, 252);
      ctx.lineTo(570, 300);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8a6a4a';
      ctx.fillRect(492, 246, 6, 14);
      // Flowers
      function flower(fx, fy, colour) {
        ctx.fillStyle = colour;
        for (let i = 0; i < 5; i += 1) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#f2c94c';
        ctx.beginPath();
        ctx.arc(fx, fy, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      flower(70, 540, '#e88aa0');
      flower(120, 556, '#f0b45a');
      flower(200, 548, '#c98ae0');
      flower(250, 536, '#e88aa0');
      flower(340, 552, '#f0b45a');
      flower(420, 540, '#c98ae0');
      flower(500, 556, '#e88aa0');
      flower(560, 542, '#f0b45a');
      // Extra flower (difference 3)
      if (altered.has(3)) flower(540, 500, '#e88aa0');
      // Grass blades
      for (let i = 0; i < 40; i += 1) {
        const gx = (i * 17 + 8) % W;
        grassBlade(ctx, gx, 560 + (i % 3) * 8, 12 + (i % 4) * 4, (i % 2 ? 1 : -1), '#5f8f4c');
      }
      // Butterfly (colour difference 5)
      const bfColour = altered.has(5) ? '#e88aa0' : '#f0b45a';
      const bx = 150 + Math.sin(time * 2) * 14;
      const by = 360 + Math.cos(time * 1.6) * 10;
      ctx.fillStyle = bfColour;
      ctx.beginPath();
      ctx.ellipse(bx - 7, by, 7, 5, -0.5, 0, Math.PI * 2);
      ctx.ellipse(bx + 7, by, 7, 5, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3a2f28';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, by - 9);
      ctx.stroke();
      // Bird on the fence (difference 0, missing on one side)
      if (!altered.has(0)) {
        ctx.fillStyle = '#3a2f28';
        ctx.beginPath();
        ctx.arc(92, 452, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(92, 452);
        ctx.lineTo(100, 446);
        ctx.lineTo(92, 448);
        ctx.closePath();
        ctx.fill();
      }
    },
  },
  {
    name: 'Harbour Dusk',
    subtitle: 'boats, a lighthouse, gulls, crates, lanterns, a cat on the dock, a flag',
    diffs: [
      { x: 150, y: 300, radius: 28, kind: 'missing', side: 'L' },  // a gull
      { x: 470, y: 150, radius: 30, kind: 'colour', side: 'R' },   // lighthouse stripe colour
      { x: 90, y: 420, radius: 30, kind: 'moved', side: 'L' },     // a boat drifted
      { x: 400, y: 470, radius: 26, kind: 'extra', side: 'R' },    // an extra crate
      { x: 560, y: 360, radius: 26, kind: 'colour', side: 'L' },   // lantern glow colour
      { x: 250, y: 500, radius: 24, kind: 'missing', side: 'R' },  // the cat
      { x: 350, y: 130, radius: 24, kind: 'shape', side: 'L' },    // flag shape
    ],
    draw(ctx, pane, side, time, altered) {
      const W = pane.w;
      const H = pane.h;
      // Dusk sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#3a4a6b');
      sky.addColorStop(0.55, '#c97a5a');
      sky.addColorStop(1, '#e8b06a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // Sun low on the horizon
      ctx.fillStyle = '#f6c878';
      ctx.beginPath();
      ctx.arc(W - 90, 300, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(246,200,120,0.3)';
      ctx.beginPath();
      ctx.arc(W - 90, 300, 60, 0, Math.PI * 2);
      ctx.fill();
      // Sea
      ctx.fillStyle = '#3a5a78';
      ctx.fillRect(0, 380, W, H - 380);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 14; i += 1) {
        const wx = (i * 48 + 12) % W;
        const wy = 400 + (i % 4) * 22;
        ctx.beginPath();
        ctx.ellipse(wx, wy, 18, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Dock
      ctx.fillStyle = '#6b4a2f';
      ctx.fillRect(0, 470, W, 26);
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(0, 496, W, 10);
      // Dock posts
      ctx.fillStyle = '#5a3a24';
      for (let i = 0; i < 9; i += 1) ctx.fillRect(30 + i * 74, 470, 10, 40);
      // Lighthouse
      const stripe = altered.has(1) ? '#c96a4a' : '#d8d0c0';
      ctx.fillStyle = '#e8d9b0';
      ctx.fillRect(430, 120, 60, 200);
      ctx.fillStyle = stripe;
      ctx.fillRect(430, 150, 60, 26);
      ctx.fillRect(430, 210, 60, 26);
      ctx.fillStyle = '#3a2f28';
      ctx.fillRect(452, 96, 16, 26);
      ctx.fillStyle = '#f6d878';
      ctx.beginPath();
      ctx.arc(460, 100, 9, 0, Math.PI * 2);
      ctx.fill();
      // Flag (shape difference 6)
      ctx.strokeStyle = '#3a2f28';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(350, 130);
      ctx.lineTo(350, 60);
      ctx.stroke();
      ctx.fillStyle = '#c96a4a';
      if (altered.has(6)) {
        ctx.beginPath();
        ctx.moveTo(350, 60);
        ctx.lineTo(410, 70);
        ctx.lineTo(350, 80);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(350, 60);
        ctx.lineTo(410, 60);
        ctx.lineTo(410, 80);
        ctx.lineTo(350, 80);
        ctx.closePath();
        ctx.fill();
      }
      // Boats (one drifts for difference 2)
      const boat1x = 90 + (altered.has(2) ? 30 : 0);
      ctx.fillStyle = '#7a5a3a';
      ctx.beginPath();
      ctx.moveTo(boat1x - 30, 420);
      ctx.lineTo(boat1x + 30, 420);
      ctx.lineTo(boat1x + 18, 440);
      ctx.lineTo(boat1x - 18, 440);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3a2f28';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boat1x, 420);
      ctx.lineTo(boat1x, 396);
      ctx.stroke();
      ctx.fillStyle = '#e8d9b0';
      ctx.beginPath();
      ctx.moveTo(boat1x, 396);
      ctx.lineTo(boat1x + 16, 406);
      ctx.lineTo(boat1x, 412);
      ctx.closePath();
      ctx.fill();
      // Second boat
      ctx.fillStyle = '#8a6a4a';
      ctx.beginPath();
      ctx.moveTo(200, 430);
      ctx.lineTo(252, 430);
      ctx.lineTo(244, 448);
      ctx.lineTo(208, 448);
      ctx.closePath();
      ctx.fill();
      // Crates (extra crate difference 3)
      ctx.fillStyle = '#a87a4a';
      ctx.fillRect(380, 440, 34, 30);
      ctx.strokeStyle = '#6b4a2f';
      ctx.lineWidth = 2;
      ctx.strokeRect(380, 440, 34, 30);
      ctx.beginPath();
      ctx.moveTo(380, 440);
      ctx.lineTo(414, 470);
      ctx.moveTo(414, 440);
      ctx.lineTo(380, 470);
      ctx.stroke();
      if (altered.has(3)) {
        ctx.fillStyle = '#a87a4a';
        ctx.fillRect(420, 448, 30, 26);
        ctx.strokeStyle = '#6b4a2f';
        ctx.strokeRect(420, 448, 30, 26);
      }
      // Lanterns (glow colour difference 4)
      const glowColour = altered.has(4) ? '#e88aa0' : '#f6d878';
      ctx.fillStyle = '#3a2f28';
      ctx.fillRect(560, 340, 8, 30);
      ctx.fillStyle = glowColour;
      ctx.beginPath();
      ctx.arc(564, 336, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(246,216,120,0.25)';
      ctx.beginPath();
      ctx.arc(564, 336, 20 + Math.sin(time * 2) * 3, 0, Math.PI * 2);
      ctx.fill();
      // Cat on the dock (missing difference 5)
      if (!altered.has(5)) {
        ctx.fillStyle = '#3a2f28';
        ctx.beginPath();
        ctx.arc(250, 462, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(242, 456);
        ctx.lineTo(238, 448);
        ctx.moveTo(258, 456);
        ctx.lineTo(262, 448);
        ctx.strokeStyle = '#3a2f28';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(250, 462);
        ctx.lineTo(250, 478);
        ctx.stroke();
      }
      // Gulls (missing difference 0)
      if (!altered.has(0)) {
        ctx.strokeStyle = '#3a2f28';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, 300);
        ctx.quadraticCurveTo(158, 292, 166, 300);
        ctx.moveTo(166, 300);
        ctx.quadraticCurveTo(174, 292, 182, 300);
        ctx.stroke();
      }
      ctx.strokeStyle = '#3a2f28';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(300, 260);
      ctx.quadraticCurveTo(308, 252, 316, 260);
      ctx.moveTo(316, 260);
      ctx.quadraticCurveTo(324, 252, 332, 260);
      ctx.stroke();
    },
  },
  {
    name: 'Starlit Camp',
    subtitle: 'a tent, campfire, pine trees, moon, an owl, a backpack, marshmallow sticks',
    diffs: [
      { x: 520, y: 300, radius: 30, kind: 'missing', side: 'R' },  // the owl
      { x: 90, y: 120, radius: 30, kind: 'colour', side: 'L' },    // moon colour
      { x: 200, y: 430, radius: 30, kind: 'moved', side: 'R' },    // a pine tree shifted
      { x: 420, y: 470, radius: 26, kind: 'extra', side: 'L' },    // an extra marshmallow stick
      { x: 320, y: 380, radius: 28, kind: 'shape', side: 'R' },    // campfire shape
      { x: 480, y: 500, radius: 26, kind: 'colour', side: 'L' },   // backpack colour
      { x: 120, y: 500, radius: 24, kind: 'missing', side: 'L' },  // a log
    ],
    draw(ctx, pane, side, time, altered) {
      const W = pane.w;
      const H = pane.h;
      // Night sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0e1626');
      sky.addColorStop(1, '#1c2740');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // Stars (twinkle)
      for (let i = 0; i < 60; i += 1) {
        const sx = (i * 37 + 11) % W;
        const sy = (i * 53 + 7) % 300;
        const tw = 0.5 + 0.5 * Math.sin(time * 2 + i);
        ctx.fillStyle = `rgba(244,233,200,${0.4 + tw * 0.5})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // Moon (colour difference 1)
      const moonColour = altered.has(1) ? '#e8c878' : '#f4e9c8';
      ctx.fillStyle = moonColour;
      ctx.beginPath();
      ctx.arc(90, 120, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(244,233,200,0.2)';
      ctx.beginPath();
      ctx.arc(90, 120, 52, 0, Math.PI * 2);
      ctx.fill();
      // Ground
      ctx.fillStyle = '#24331f';
      ctx.fillRect(0, 420, W, H - 420);
      ctx.fillStyle = '#2c3d26';
      ctx.beginPath();
      ctx.moveTo(0, 420);
      ctx.quadraticCurveTo(320, 400, W, 420);
      ctx.lineTo(W, 460);
      ctx.lineTo(0, 460);
      ctx.closePath();
      ctx.fill();
      // Pine trees (one shifted for difference 2)
      function pine(px, py, s) {
        ctx.fillStyle = '#1f3a22';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 26 * s, py + 40 * s);
        ctx.lineTo(px + 26 * s, py + 40 * s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2a4a2c';
        ctx.beginPath();
        ctx.moveTo(px, py - 16 * s);
        ctx.lineTo(px - 20 * s, py + 20 * s);
        ctx.lineTo(px + 20 * s, py + 20 * s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3a5a34';
        ctx.fillRect(px - 4 * s, py + 40 * s, 8 * s, 16 * s);
      }
      const pine2x = 200 + (altered.has(2) ? 26 : 0);
      pine(90, 330, 1.3);
      pine(pine2x, 360, 1.1);
      pine(300, 340, 1.2);
      pine(560, 320, 1.4);
      pine(610, 380, 1.0);
      // Tent
      ctx.fillStyle = '#c9a86a';
      ctx.beginPath();
      ctx.moveTo(60, 460);
      ctx.lineTo(150, 340);
      ctx.lineTo(240, 460);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#a8874f';
      ctx.beginPath();
      ctx.moveTo(150, 340);
      ctx.lineTo(240, 460);
      ctx.lineTo(150, 460);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a2f28';
      ctx.fillRect(140, 400, 20, 60);
      // Campfire (shape difference 4)
      ctx.fillStyle = '#5a3a24';
      ctx.fillRect(300, 430, 40, 12);
      const flameH = altered.has(4) ? 34 : 26;
      const flameW = altered.has(4) ? 22 : 30;
      ctx.fillStyle = '#e8b64c';
      ctx.beginPath();
      ctx.moveTo(320, 430);
      ctx.quadraticCurveTo(320 - flameW, 430 - flameH, 320, 430 - flameH - 10);
      ctx.quadraticCurveTo(320 + flameW, 430 - flameH, 320, 430);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f6d878';
      ctx.beginPath();
      ctx.moveTo(320, 430);
      ctx.quadraticCurveTo(320 - 10, 430 - 18, 320, 430 - 26);
      ctx.quadraticCurveTo(320 + 10, 430 - 18, 320, 430);
      ctx.closePath();
      ctx.fill();
      // Flicker glow
      ctx.fillStyle = 'rgba(232,182,76,0.18)';
      ctx.beginPath();
      ctx.arc(320, 420, 44 + Math.sin(time * 3) * 5, 0, Math.PI * 2);
      ctx.fill();
      // Logs (missing difference 6)
      if (!altered.has(6)) {
        ctx.fillStyle = '#6b4a2f';
        ctx.fillRect(120, 470, 60, 14);
        ctx.fillStyle = '#7a5a3a';
        ctx.beginPath();
        ctx.arc(150, 477, 30, 0, Math.PI);
        ctx.fill();
      }
      // Marshmallow sticks (extra difference 3)
      function stick(sx, sy, angle) {
        ctx.strokeStyle = '#8a6a4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle) * 40, sy + Math.sin(angle) * 40);
        ctx.stroke();
        ctx.fillStyle = '#f4e9c8';
        ctx.beginPath();
        ctx.arc(sx + Math.cos(angle) * 44, sy + Math.sin(angle) * 44, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      stick(360, 480, -0.5);
      stick(420, 490, -0.9);
      if (altered.has(3)) stick(470, 470, -0.3);
      // Backpack (colour difference 5)
      const packColour = altered.has(5) ? '#c96a4a' : '#5b8fb8';
      ctx.fillStyle = packColour;
      ctx.fillRect(470, 460, 44, 50);
      ctx.fillStyle = '#3a2f28';
      ctx.fillRect(480, 470, 24, 30);
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(470, 460, 44, 10);
      // Owl (missing difference 0)
      if (!altered.has(0)) {
        ctx.fillStyle = '#3a2f28';
        ctx.beginPath();
        ctx.arc(520, 300, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f6d878';
        ctx.beginPath();
        ctx.arc(514, 296, 6, 0, Math.PI * 2);
        ctx.arc(526, 296, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a2f28';
        ctx.beginPath();
        ctx.arc(514, 296, 2.5, 0, Math.PI * 2);
        ctx.arc(526, 296, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(514, 308);
        ctx.lineTo(526, 308);
        ctx.lineTo(520, 314);
        ctx.closePath();
        ctx.fill();
      }
    },
  },
];