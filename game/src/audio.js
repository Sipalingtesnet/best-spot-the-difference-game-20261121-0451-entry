// TWIN GLADE — WebAudio synthesized sound: SFX (found chime, wrong buzz, hint sparkle,
// level fanfare, win arpeggio) plus a quiet music-box loop. No audio files, no network.
// M toggles mute. The AudioContext is created lazily on the first user gesture.

export function createAudio() {
  let context = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;
  let musicNext = 0;

  function ensure() {
    if (context) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    context = new AC();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(context.destination);
    musicGain = context.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
  }

  function resume() {
    if (context && context.state === 'suspended') context.resume();
  }

  function tone(freq, start, dur, type, gain, dest) {
    if (!context) return;
    const osc = context.createOscillator();
    const g = context.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(dest || master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  function noise(start, dur, gain, freq) {
    if (!context) return;
    const len = Math.floor(context.sampleRate * dur);
    const buf = context.createBuffer(1, len, context.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = context.createBufferSource();
    src.buffer = buf;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq || 220;
    const g = context.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(start);
  }

  const sfx = {
    found() {
      if (!context) return;
      const t = context.currentTime;
      tone(660, t, 0.16, 'sine', 0.22);
      tone(880, t + 0.09, 0.2, 'sine', 0.2);
      tone(1320, t + 0.18, 0.28, 'sine', 0.16);
    },
    wrong() {
      if (!context) return;
      const t = context.currentTime;
      noise(t, 0.22, 0.3, 180);
      tone(150, t, 0.22, 'sawtooth', 0.12);
    },
    hint() {
      if (!context) return;
      const t = context.currentTime;
      for (let i = 0; i < 5; i += 1) tone(1200 + i * 180, t + i * 0.05, 0.12, 'triangle', 0.12);
    },
    fanfare() {
      if (!context) return;
      const t = context.currentTime;
      const notes = [523, 659, 784, 1047];
      notes.forEach((n, i) => tone(n, t + i * 0.14, 0.3, 'triangle', 0.2));
      tone(1319, t + 0.56, 0.5, 'triangle', 0.18);
    },
    win() {
      if (!context) return;
      const t = context.currentTime;
      const notes = [523, 587, 659, 784, 880, 1047, 1319];
      notes.forEach((n, i) => tone(n, t + i * 0.12, 0.34, 'triangle', 0.2));
      tone(1568, t + 0.84, 0.7, 'sine', 0.18);
    },
  };

  // A gentle music-box loop: a short pentatonic phrase over and over.
  const MELODY = [523, 587, 659, 784, 659, 587, 523, 440, 523, 587, 659, 784, 880, 784, 659, 587];
  const STEP_MS = 0.34;

  function scheduleMusic() {
    if (!context || muted) return;
    while (musicNext < context.currentTime + 0.5) {
      const note = MELODY[musicStep % MELODY.length];
      tone(note, musicNext, 0.3, 'sine', 0.1, musicGain);
      tone(note / 2, musicNext, 0.3, 'triangle', 0.05, musicGain);
      musicStep += 1;
      musicNext += STEP_MS;
    }
  }

  function startMusic() {
    if (!context) return;
    if (musicTimer) return;
    musicStep = 0;
    musicNext = context.currentTime + 0.05;
    scheduleMusic();
    musicTimer = window.setInterval(scheduleMusic, 120);
  }

  function stopMusic() {
    if (musicTimer) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  return {
    /** Call on any user gesture so the browser allows sound. */
    unlock() {
      ensure();
      resume();
    },
    play(name) {
      ensure();
      resume();
      if (sfx[name]) sfx[name]();
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : 0.9;
    },
    isMuted() {
      return muted;
    },
    startMusic() {
      ensure();
      resume();
      startMusic();
    },
    stopMusic() {
      stopMusic();
    },
  };
}