/* =====================================================================
   Sound. Everything is synthesised with the Web Audio API — there are
   no audio files in this project, so there is nothing to download.
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});

  let ctx = null;
  let noiseBuffer = null;
  let master = null;
  let volume = 0.5;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);

      /* one second of white noise, reused for every click */
      const len = Math.floor(ctx.sampleRate * 0.4);
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function now() { return ctx.currentTime; }

  function noise(duration, gain, filterFreq, q, type) {
    if (!ensure()) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type || "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, now());
    g.gain.exponentialRampToValueAtTime(0.0001, now() + duration);
    src.connect(filter).connect(g).connect(master);
    src.start(now());
    src.stop(now() + duration + 0.02);
  }

  function tone(freq, duration, gain, type, sweepTo) {
    if (!ensure()) return;
    const osc = ctx.createOscillator();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, now());
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, now() + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, now());
    g.gain.exponentialRampToValueAtTime(0.0001, now() + duration);
    osc.connect(g).connect(master);
    osc.start(now());
    osc.stop(now() + duration + 0.02);
  }

  const clickSounds = {
    click: function () {
      noise(0.035, 0.35, 1800 + Math.random() * 600, 1.2);
    },
    beep: function () {
      tone(760 + Math.random() * 120, 0.045, 0.18, "sine");
    },
    pop: function () {
      tone(520 + Math.random() * 80, 0.05, 0.22, "sine", 220);
      noise(0.02, 0.15, 1200, 1);
    },
    typewriter: function () {
      noise(0.05, 0.4, 900 + Math.random() * 400, 0.8, "lowpass");
      tone(160, 0.05, 0.12, "triangle", 90);
    },
  };

  const errorSounds = {
    low: function () { tone(180, 0.09, 0.22, "sawtooth", 120); },
    high: function () { tone(520, 0.07, 0.18, "square", 380); },
  };

  MT.Sound = {
    setVolume: function (v) {
      volume = Number(v);
      if (master) master.gain.value = volume;
    },

    unlock: function () { ensure(); },

    playClick: function (type) {
      if (!type || type === "off" || volume <= 0) return;
      const fn = clickSounds[type];
      if (fn) fn();
    },

    playError: function (type) {
      if (!type || type === "off" || volume <= 0) return;
      const fn = errorSounds[type];
      if (fn) fn();
    },

    preview: function (type) {
      if (type === "off") return;
      const fn = clickSounds[type];
      if (fn) fn();
    },
  };
})();
