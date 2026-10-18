/* =====================================================================
   Configuration: defaults, settings schema, persistence, theme
   application, and local result storage.
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});

  MT.VERSION = "1.0.0";

  const STORE_CONFIG = "mt_config";
  const STORE_RESULTS = "mt_results";
  const STORE_PBS = "mt_pbs";

  const defaults = {
    /* test */
    mode: "time",
    time: 30,
    words: 25,
    quoteLength: "medium",
    language: "english",
    punctuation: false,
    numbers: false,
    funbox: "none",

    /* behavior */
    difficulty: "normal",
    quickRestart: "tab",
    quickEnd: false,
    confidenceMode: "off",
    paceCaret: "off",
    paceCaretCustomSpeed: 100,
    repeatQuotes: "off",
    stopOnError: "off",
    freedomMode: false,
    alwaysShowWordsHistory: false,
    minWpm: "off",
    minWpmCustomSpeed: 100,
    minAcc: "off",
    minAccCustom: 90,
    minBurst: "off",
    minBurstCustomSpeed: 100,

    /* input */
    keymapLayout: "qwerty",
    keymapStyle: "staggered",
    showKeyTips: true,
    showKeymap: "off",

    /* sound */
    soundOnClick: "off",
    soundOnError: "off",
    soundVolume: 0.5,

    /* appearance */
    theme: "serika_dark",
    customTheme: JSON.parse(JSON.stringify(MT.defaultCustomTheme)),
    caretStyle: "line",
    smoothCaret: true,
    timerStyle: "off",
    timerColor: "main",
    timerOpacity: 0.5,
    liveStatsStyle: "speed",
    fontSize: 1,
    fontFamily: "Roboto Mono",
    pageWidth: "100",
    maxLineWidth: 0,
    highlightMode: "off",
    smoothLineScroll: true,
    hideExtraLetters: false,
    blindMode: false,
    colorfulMode: false,
    flipTestColors: false,
    startGraphsAtZero: true,
    showAllLines: false,
    focusMode: false,
  };

  MT.fontFamilies = [
    "Roboto Mono",
    "JetBrains Mono",
    "Cascadia Mono",
    "Consolas",
    "Courier New",
    "Lexend Deca",
    "Montserrat",
    "Nunito",
    "Poppins",
    "system-ui",
  ];

  MT.funboxes = [
    { name: "none" },
    { name: "long_words", description: "words of six letters or more" },
    { name: "numbers_only", description: "nothing but numbers" },
    { name: "punctuation_hell", description: "every word punctuated" },
    { name: "reverse", description: "words run backwards" },
    { name: "uppercase", description: "SHOUTING, ALL CAPS" },
  ];

  /* ---------------------------------------------------------------- */
  /* settings schema (rendered by js/ui.js onto the settings page)      */
  /* ---------------------------------------------------------------- */
  MT.settingsSchema = [
    {
      group: "behavior",
      name: "Difficulty",
      description: "expert removes backspace; master also forces punctuation and numbers on",
      configKey: "difficulty", type: "button", options: ["normal", "expert", "master"],
    },
    {
      group: "behavior",
      name: "Quick restart",
      description: "which key combination restarts the test",
      configKey: "quickRestart", type: "button", options: ["off", "esc", "tab", "enter"],
    },
    {
      group: "behavior",
      name: "Quick end",
      description: "end words mode as soon as the final word is complete, spaces or not",
      configKey: "quickEnd", type: "toggle",
    },
    {
      group: "behavior",
      name: "Confidence mode",
      description: "off: normal · on: no backspace · max: no backspace and no error highlighting",
      configKey: "confidenceMode", type: "button", options: ["off", "on", "max"],
    },
    {
      group: "behavior",
      name: "Pace caret",
      description: "a second caret that moves at a fixed speed, so you can race yourself",
      configKey: "paceCaret", type: "button", options: ["off", "pb", "avg", "last", "custom"],
    },
    {
      group: "behavior",
      name: "Pace caret custom speed",
      description: "wpm the pace caret moves at when pace caret is set to custom",
      configKey: "paceCaretCustomSpeed", type: "range", min: 10, max: 300, step: 5, unit: " wpm",
    },
    {
      group: "behavior",
      name: "Repeat quotes",
      description: "repeat the same quote until you hit the accuracy you want",
      configKey: "repeatQuotes", type: "button", options: ["off", "typer"],
    },
    {
      group: "behavior",
      name: "Stop on error",
      description: "fail the test when you make a mistake, at the letter or the word level",
      configKey: "stopOnError", type: "button", options: ["off", "letter", "word"],
    },
    {
      group: "behavior",
      name: "Freedom mode",
      description: "ignore word boundaries entirely and type the letters you want",
      configKey: "freedomMode", type: "toggle",
    },
    {
      group: "behavior",
      name: "Always show words history",
      description: "list every word you typed, mistakes highlighted, under the results chart",
      configKey: "alwaysShowWordsHistory", type: "toggle",
    },
    {
      group: "behavior",
      name: "Minimum wpm",
      description: "mark a result as failed when it falls below the threshold",
      configKey: "minWpm", type: "button", options: ["off", "custom"],
    },
    {
      group: "behavior",
      name: "Minimum wpm threshold",
      configKey: "minWpmCustomSpeed", type: "range", min: 10, max: 200, step: 5, unit: " wpm",
    },
    {
      group: "behavior",
      name: "Minimum accuracy",
      configKey: "minAcc", type: "button", options: ["off", "custom"],
    },
    {
      group: "behavior",
      name: "Minimum accuracy threshold",
      configKey: "minAccCustom", type: "range", min: 50, max: 100, step: 1, unit: " %",
    },
    {
      group: "behavior",
      name: "Minimum burst",
      configKey: "minBurst", type: "button", options: ["off", "custom"],
    },
    {
      group: "behavior",
      name: "Minimum burst threshold",
      configKey: "minBurstCustomSpeed", type: "range", min: 10, max: 250, step: 5, unit: " wpm",
    },

    {
      group: "input",
      name: "Show keymap",
      description: "off: hidden · map: a heatmap of your accuracy · script: the layout you are typing on",
      configKey: "showKeymap", type: "button", options: ["off", "map", "script"],
    },
    {
      group: "input",
      name: "Keymap layout",
      configKey: "keymapLayout", type: "button", options: ["qwerty", "dvorak", "colemak", "workman"],
    },
    {
      group: "input",
      name: "Keymap style",
      configKey: "keymapStyle", type: "button", options: ["staggered", "matrix", "split"],
    },
    {
      group: "input",
      name: "Show key tips",
      description: "print each character on the on-screen keys",
      configKey: "showKeyTips", type: "toggle",
    },

    {
      group: "sound",
      name: "Sound on click",
      description: "synthesised in your browser, so there is nothing to download",
      configKey: "soundOnClick", type: "button", options: ["off", "click", "beep", "pop", "typewriter"],
    },
    {
      group: "sound",
      name: "Sound on error",
      configKey: "soundOnError", type: "button", options: ["off", "low", "high"],
    },
    {
      group: "sound",
      name: "Sound volume",
      configKey: "soundVolume", type: "range", min: 0, max: 1, step: 0.05, unit: "",
    },

    {
      group: "appearance",
      name: "Theme",
      description: "colour scheme for the whole test",
      configKey: "theme", type: "theme",
    },
    {
      group: "appearance",
      name: "Custom theme",
      description: "your own colours, used when theme is set to custom",
      configKey: "customTheme", type: "custom-theme",
    },
    {
      group: "appearance",
      name: "Caret style",
      configKey: "caretStyle", type: "button", options: ["off", "line", "underline", "block", "outline"],
    },
    {
      group: "appearance",
      name: "Smooth caret",
      configKey: "smoothCaret", type: "toggle",
    },
    {
      group: "appearance",
      name: "Timer style",
      configKey: "timerStyle", type: "button", options: ["off", "bar", "text"],
    },
    {
      group: "appearance",
      name: "Timer colour",
      configKey: "timerColor", type: "button", options: ["main", "sub", "text"],
    },
    {
      group: "appearance",
      name: "Timer opacity",
      configKey: "timerOpacity", type: "range", min: 0.25, max: 1, step: 0.05, unit: "",
    },
    {
      group: "appearance",
      name: "Live stats",
      description: "which number appears above the words while you type",
      configKey: "liveStatsStyle", type: "button", options: ["off", "speed", "acc", "burst", "timer"],
    },
    {
      group: "appearance",
      name: "Font size",
      configKey: "fontSize", type: "range", min: 0.5, max: 3, step: 0.1, unit: "x",
    },
    {
      group: "appearance",
      name: "Font family",
      description: "uses a font already installed on your machine",
      configKey: "fontFamily", type: "text",
    },
    {
      group: "appearance",
      name: "Page width",
      description: "how wide the whole typing area is allowed to get",
      configKey: "pageWidth", type: "button", options: ["100", "125", "150", "200"],
    },
    {
      group: "appearance",
      name: "Max line width",
      description: "0 means unlimited; otherwise the words wrap after this many characters",
      configKey: "maxLineWidth", type: "range", min: 0, max: 150, step: 5, unit: "ch",
    },
    {
      group: "appearance",
      name: "Highlight mode",
      description: "brighten the current letter or word while you type",
      configKey: "highlightMode", type: "button", options: ["off", "letter", "word", "next_word", "next_two_words"],
    },
    {
      group: "appearance",
      name: "Smooth line scroll",
      configKey: "smoothLineScroll", type: "toggle",
    },
    {
      group: "appearance",
      name: "Hide extra letters",
      description: "do not show letters typed past the end of a word",
      configKey: "hideExtraLetters", type: "toggle",
    },
    {
      group: "appearance",
      name: "Blind mode",
      description: "no visual feedback at all. did you get it right? you will find out",
      configKey: "blindMode", type: "toggle",
    },
    {
      group: "appearance",
      name: "Colourful mode",
      description: "errors take on a wider palette",
      configKey: "colorfulMode", type: "toggle",
    },
    {
      group: "appearance",
      name: "Flip test colours",
      configKey: "flipTestColors", type: "toggle",
    },
    {
      group: "appearance",
      name: "Start graphs at zero",
      description: "chart y-axis always starts at 0",
      configKey: "startGraphsAtZero", type: "toggle",
    },
    {
      group: "appearance",
      name: "Show all lines",
      description: "stop scrolling the words and show the whole test at once",
      configKey: "showAllLines", type: "toggle",
    },
    {
      group: "appearance",
      name: "Focus mode",
      description: "dim the interface while you are typing",
      configKey: "focusMode", type: "toggle",
    },

    {
      group: "danger zone",
      name: "Reset settings",
      description: "restore every setting on this page to its default",
      configKey: "resetSettings", type: "action",
    },
    {
      group: "danger zone",
      name: "Reset all personal data",
      description: "delete every stored result, personal best and setting",
      configKey: "resetData", type: "action", danger: true,
    },
  ];

  MT.settingsGroups = ["behavior", "input", "sound", "appearance", "danger zone"];

  /* ---------------------------------------------------------------- */
  /* Config object                                                      */
  /* ---------------------------------------------------------------- */
  MT.Config = {
    data: {},

    load: function () {
      let stored = null;
      try {
        stored = JSON.parse(localStorage.getItem(STORE_CONFIG) || "null");
      } catch (e) {
        stored = null;
      }
      this.data = Object.assign({}, defaults, stored || {});
      /* nested objects need their own merge */
      this.data.customTheme = Object.assign(
        JSON.parse(JSON.stringify(MT.defaultCustomTheme)),
        (stored && stored.customTheme) || {}
      );
      return this.data;
    },

    save: function () {
      try {
        localStorage.setItem(STORE_CONFIG, JSON.stringify(this.data));
      } catch (e) {
        /* storage full or blocked — keep going, the test still works */
      }
    },

    get: function (key) {
      return this.data[key];
    },

    set: function (key, value) {
      this.data[key] = value;
      this.save();
      return value;
    },

    reset: function () {
      this.data = JSON.parse(JSON.stringify(defaults));
      this.data.customTheme = JSON.parse(JSON.stringify(MT.defaultCustomTheme));
      this.save();
    },

    /* ------------------------------------------------------------ */
    apply: function () {
      const c = this.data;
      const theme = MT.getTheme(c.theme, c.customTheme);
      const root = document.documentElement;
      const set = function (k, v) { root.style.setProperty(k, v); };

      set("--bg-color", theme.bg);
      set("--main-color", theme.main);
      set("--caret-color", theme.caret);
      set("--sub-color", theme.sub);
      set("--sub-alt-color", theme.subAlt);
      set("--text-color", theme.text);
      set("--error-color", theme.error);
      set("--error-extra-color", theme.errorExtra);
      set("--colorful-error-color", theme.colorfulError || theme.error);
      set("--colorful-error-extra-color", theme.colorfulErrorExtra || theme.errorExtra);

      const baseSize = (window.innerWidth <= 640) ? 1.15 : 1.5;
      const fontSize = Math.max(0.6, baseSize * Number(c.fontSize || 1));
      set("--font-size", fontSize.toFixed(3) + "rem");
      set("--line-height", (fontSize * 1.6).toFixed(3) + "rem");

      const widths = { "100": 1000, "125": 1250, "150": 1500, "200": 2000 };
      set("--page-width", (widths[String(c.pageWidth)] || 1000) + "px");

      set("--font-family", '"' + c.fontFamily + '", "Roboto Mono", ui-monospace, Consolas, monospace');

      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.setAttribute("content", theme.light ? "light dark" : "dark light");

      /* body classes */
      const body = document.body;
      body.classList.toggle("focus-mode", !!c.focusMode);
      body.classList.toggle("flip-colors", !!c.flipTestColors);
      body.classList.toggle("colorful", !!c.colorfulMode);

      const words = document.getElementById("words");
      if (words) {
        words.classList.toggle("hide-extra", !!c.hideExtraLetters);
        words.classList.toggle("smooth-scroll", !!c.smoothLineScroll);
        words.style.maxWidth = Number(c.maxLineWidth) > 0 ? c.maxLineWidth + "ch" : "";
        words.classList.remove("hl-letter", "hl-word", "hl-next", "hl-next2");
        if (c.highlightMode === "letter") words.classList.add("hl-letter");
        else if (c.highlightMode === "word") words.classList.add("hl-word");
        else if (c.highlightMode === "next_word") words.classList.add("hl-next");
        else if (c.highlightMode === "next_two_words") words.classList.add("hl-next2");
      }

      const caret = document.getElementById("caret");
      if (caret) {
        caret.className = "caret style-" + c.caretStyle + (c.smoothCaret ? "" : " smooth-off");
      }
      const pace = document.getElementById("paceCaret");
      if (pace) pace.className = "caret pace-caret style-" + c.caretStyle;

      const bar = document.getElementById("timerBar");
      if (bar) {
        bar.classList.toggle("shown", c.timerStyle === "bar");
        bar.classList.toggle("sub", c.timerColor === "sub");
        bar.style.opacity = c.timerOpacity;
      }
      const fill = document.getElementById("timerBarFill");
      if (fill) {
        fill.style.background =
          c.timerColor === "sub" ? "var(--sub-color)" : c.timerColor === "text" ? "var(--text-color)" : "var(--main-color)";
      }

      const keymap = document.getElementById("keymap");
      if (keymap && MT.Keymap) {
        const visible = c.showKeymap !== "off";
        keymap.hidden = !visible;
        MT.Keymap.visible = visible;
        if (visible) {
          MT.Keymap.showTips = c.showKeymap !== "map" && c.showKeyTips;
          MT.Keymap.setLayout(c.keymapLayout);
          MT.Keymap.setStyle(c.showKeymap === "map" ? "map" : c.keymapStyle);
        }
      }

      if (MT.Sound) MT.Sound.setVolume(c.soundVolume);
    },
  };

  /* ---------------------------------------------------------------- */
  /* Store: results, personal bests                                     */
  /* ---------------------------------------------------------------- */
  MT.Store = {
    results: [],
    pbs: {},

    loadResults: function () {
      try {
        this.results = JSON.parse(localStorage.getItem(STORE_RESULTS) || "[]") || [];
      } catch (e) {
        this.results = [];
      }
      try {
        this.pbs = JSON.parse(localStorage.getItem(STORE_PBS) || "{}") || {};
      } catch (e) {
        this.pbs = {};
      }
      return this.results;
    },

    saveResults: function () {
      try {
        localStorage.setItem(STORE_RESULTS, JSON.stringify(this.results.slice(-2000)));
        localStorage.setItem(STORE_PBS, JSON.stringify(this.pbs));
      } catch (e) { /* ignore */ }
    },

    addResult: function (result) {
      this.results.push(result);
      if (this.results.length > 2000) this.results.shift();
      this.saveResults();
      return result;
    },

    /* pb key covers everything that makes two tests comparable */
    pbKey: function (r) {
      return [r.mode, r.modeValue, r.language, r.punctuation ? "p" : "-", r.numbers ? "n" : "-", r.funbox || "none"].join("|");
    },

    checkPb: function (result) {
      const key = this.pbKey(result);
      const current = this.pbs[key];
      if (!current || result.wpm > current.wpm) {
        this.pbs[key] = {
          wpm: result.wpm,
          acc: result.acc,
          raw: result.raw,
          consistency: result.consistency,
          timestamp: result.timestamp,
          mode: result.mode,
          modeValue: result.modeValue,
        };
        this.saveResults();
        return true;
      }
      return false;
    },

    bestWpm: function () {
      let best = 0;
      this.results.forEach(function (r) { if (r.wpm > best) best = r.wpm; });
      return best;
    },

    clear: function () {
      try {
        localStorage.removeItem(STORE_RESULTS);
        localStorage.removeItem(STORE_PBS);
        localStorage.removeItem(STORE_CONFIG);
      } catch (e) { /* ignore */ }
      this.results = [];
      this.pbs = {};
    },
  };
})();
