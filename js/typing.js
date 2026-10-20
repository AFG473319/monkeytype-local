/* =====================================================================
   The typing engine: word generation, input handling, rendering,
   scoring, history sampling and finish logic.
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});

  function cfg() { return MT.Config.data; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function capitalize(w) {
    if (!w) return w;
    return w[0].toUpperCase() + w.slice(1);
  }

  MT.Typing = {
    els: {},
    words: [],
    input: [],
    wordEls: [],
    letterEls: [],

    activeIndex: 0,
    started: false,
    finished: false,
    zen: false,
    zenEmpty: true,

    startTime: 0,
    endTime: 0,
    lastKeyTime: 0,

    keypressTotal: 0,
    keypressCorrect: 0,
    keypressIncorrect: 0,
    allCharsTyped: 0,
    correctChars: 0,
    errorsThisSecond: 0,
    charsThisSecond: 0,
    history: [],
    bestBurst: 0,

    scrollOffset: 0,
    lineHeight: 24,
    lineCount: 0,

    pendingRestart: false,
    pendingRestartTimer: null,
    timerInterval: null,
    paceInterval: null,
    pacePosition: 0,
    paceSpeed: 0,

    result: null,
    lastResult: null,
    quote: null,
    restartSameWords: false,

    /* -------------------------------------------------------------- */
    init: function () {
      this.els = {
        words: document.getElementById("words"),
        wrapper: document.getElementById("wordsWrapper"),
        caret: document.getElementById("caret"),
        paceCaret: document.getElementById("paceCaret"),
        liveStats: document.getElementById("liveStats"),
        liveWpm: document.querySelector("#liveWpm .live-stat-value"),
        liveAcc: document.querySelector("#liveAcc .live-stat-value"),
        liveBurst: document.querySelector("#liveBurst .live-stat-value"),
        liveTimer: document.querySelector("#liveTimer .live-stat-value"),
        timerBar: document.getElementById("timerBar"),
        timerBarFill: document.getElementById("timerBarFill"),
        result: document.getElementById("result"),
        testArea: document.getElementById("testArea"),
        mobileInput: document.getElementById("mobileInput"),
        restartHint: document.getElementById("restartHint"),
      };

      const self = this;

      document.addEventListener("keydown", function (e) { self.onKeyDown(e); }, false);
      document.addEventListener("keyup", function (e) {
        if (e.key.length === 1 || e.key === " ") MT.Keymap.unhighlight(e.key);
      }, false);

      this.els.wrapper.addEventListener("click", function () {
        self.focusInput();
      });
      this.els.wrapper.addEventListener("touchstart", function () {
        self.focusInput();
      }, { passive: true });

      /* mobile: hidden input keeps the on-screen keyboard alive */
      const mi = this.els.mobileInput;
      if (mi) {
        mi.addEventListener("input", function (e) {
          const value = mi.value;
          mi.value = "";
          for (const ch of value) {
            if (ch === "\n" || ch === "\r") {
              if (self._enterGuard) continue;
              if (self.finished) self.nextTest();
              else if (self.zen && self.input[0] && self.input[0].length) self.finish("zen");
              else if (cfg().quickRestart === "enter") self.restart();
              continue;
            }
            self.typeChar(ch === " " ? " " : ch);
          }
        });
        mi.addEventListener("keydown", function (e) {
          /* Only special keys are handled here. Normal characters arrive
             through the input event, so we never type a letter twice. */
          const special = e.key === "Backspace" || e.key === "Enter" ||
            e.key === "Tab" || e.key === "Escape";
          if (!special) {
            e.stopPropagation();
            return;
          }
          e.stopPropagation();
          self.onKeyDown(e);
        });
      }

      let resizeTimer = null;
      function scheduleLayout() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          if (!self.finished && self.words.length) {
            self.measureLayout();
            self.scrollToActive();
            self.updateCaret();
          }
        }, 120);
      }
      window.addEventListener("resize", scheduleLayout);
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", function () {
          scheduleLayout();
          self.ensureVisible();
        });
        window.visualViewport.addEventListener("scroll", function () {
          self.ensureVisible();
        });
      }

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          if (self.started && !self.finished) self.pauseTimer();
        } else {
          /* the tab came back: the clock has to run again, otherwise the test
             never ends and the countdown stays frozen */
          self.resumeTimer();
        }
      });
    },

    isTouchDevice: function () {
      try {
        return window.matchMedia("(pointer: coarse)").matches ||
          (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024);
      } catch (e) {
        return navigator.maxTouchPoints > 0;
      }
    },

    blurInput: function () {
      const mi = this.els.mobileInput;
      if (mi) { try { mi.blur(); } catch (e) {} }
    },

    focusInput: function () {
      const mi = this.els.mobileInput;
      if (!mi) return;
      if (!this.isTouchDevice()) return;
      mi.value = "";
      try { mi.focus({ preventScroll: true }); } catch (e) { mi.focus(); }
      const oof = document.getElementById("outOfFocus");
      if (oof) oof.hidden = true;
      const self = this;
      /* keep the words visible above the on-screen keyboard */
      setTimeout(function () {
        const wrapper = self.els.wrapper;
        if (wrapper && wrapper.scrollIntoView) {
          try { wrapper.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { wrapper.scrollIntoView(); }
        }
      }, 250);
    },

    ensureVisible: function () {
      if (!this.isTouchDevice()) return;
      const wrapper = this.els.wrapper;
      if (!wrapper) return;
      const vv = window.visualViewport;
      const bottom = vv ? (vv.height + vv.offsetTop) : window.innerHeight;
      const rect = wrapper.getBoundingClientRect();
      if (rect.bottom > bottom - 16 || rect.top < (vv ? vv.offsetTop : 0) + 8) {
        try {
          wrapper.scrollIntoView({ block: "center", behavior: "auto" });
        } catch (e) {
          wrapper.scrollIntoView();
        }
      }
    },

    /* -------------------------------------------------------------- */
    /* word generation                                                */
    /* -------------------------------------------------------------- */

    generate: function () {
      const c = cfg();
      const lang = MT.getLanguage(c.language);
      const pool = lang.words && lang.words.length ? lang.words : ["the"];

      let count;
      if (c.mode === "time") {
        count = Math.max(60, Math.round(Number(c.time) * 4));
      } else if (c.mode === "words") {
        count = Number(c.words) >= 1000 ? 250 : Number(c.words);
      } else {
        count = 60;
      }

      return this.transformWords(this.pickWords(pool, count), pool);
    },

    /* The funbox, punctuation and number rules have to be the same for the
       words that are appended in the middle of a long test as for the ones a
       test starts with. They used to differ: the appended words skipped the
       funbox entirely, so an uppercase test suddenly switched to lower case
       half way through and everything typed from there on was wrong. */
    transformWords: function (words, pool) {
      const c = cfg();
      const lang = MT.getLanguage(c.language);
      const source = pool && pool.length ? pool : lang.words;

      /* funboxes that act on the pool ------------------------------- */
      if (c.funbox === "long_words") {
        const long = source.filter(function (w) { return w.length >= 6; });
        words = this.pickWords(long.length ? long : source, words.length);
      } else if (c.funbox === "numbers_only") {
        words = words.map(function () { return String(randInt(1, 9999)); });
      } else if (c.funbox === "reverse") {
        words = words.map(function (w) { return w.split("").reverse().join(""); });
      } else if (c.funbox === "uppercase") {
        words = words.map(function (w) { return w.toUpperCase(); });
      }

      /* punctuation / numbers, but never for code languages -------- */
      const isCode = !!lang.code;
      const master = c.difficulty === "master";
      const wantPunctuation = (c.punctuation || master || c.funbox === "punctuation_hell") && !isCode;
      const wantNumbers = (c.numbers || master) && !isCode && c.funbox !== "numbers_only";

      if (wantPunctuation) words = this.applyPunctuation(words, c.funbox === "punctuation_hell");
      if (wantNumbers) words = this.applyNumbers(words);

      return words;
    },

    pickWords: function (pool, count) {
      const out = [];
      let bag = [];
      let last = null;
      for (let i = 0; i < count; i++) {
        if (bag.length === 0) bag = shuffle(pool);
        let w = bag.pop();
        if (w === last && bag.length > 1) {
          const other = bag.pop();
          bag.push(w);
          w = other;
        }
        out.push(w);
        last = w;
      }
      return out;
    },

    applyNumbers: function (words) {
      return words.map(function (w) {
        /* only swap a word that is nothing but lowercase letters, so a
           sentence-opening capital or a word carrying punctuation is safe */
        if (Math.random() < 0.13 && /^[a-z]+$/.test(w)) {
          const len = randInt(1, 4);
          let s = String(randInt(1, 9));
          for (let i = 1; i < len; i++) s += String(randInt(0, 9));
          return s;
        }
        return w;
      });
    },

    applyPunctuation: function (words, heavy) {
      const out = [];
      let sentencePos = 0;
      let sentenceLen = randInt(6, 14);

      for (let i = 0; i < words.length; i++) {
        let w = words[i];
        const start = sentencePos === 0;

        if (!start) {
          const r = Math.random();
          const chance = heavy ? 0.95 : 0.42;
          if (r < chance) {
            const kind = Math.random();
            if (kind < 0.4) {
              w = w + ",";
            } else if (kind < 0.55) {
              w = "-" + w;
            } else if (kind < 0.7) {
              w = w + "'s";
            } else if (kind < 0.85) {
              w = '"' + w + '"';
            } else {
              w = "(" + w + ")";
            }
          }
        }

        sentencePos++;

        /* the end of every "sentence" gets a full stop of some kind — and
           nothing else in this transform may produce . ! or ? */
        if (sentencePos >= sentenceLen || i === words.length - 1) {
          w = w.replace(/,+$/, "") + this.enders();
          sentencePos = 0;
          sentenceLen = randInt(6, 14);
        }

        if (start) w = capitalize(w);
        out.push(w);
      }
      return out;
    },

    enders: function () {
      /* only true sentence enders — never a semicolon or a colon */
      const pool = [".", ".", ".", "!", "?"];
      return pool[Math.floor(Math.random() * pool.length)];
    },

    /* -------------------------------------------------------------- */
    /* test lifecycle                                                 */
    /* -------------------------------------------------------------- */

    load: function (keepWords) {
      try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
      try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
      const c = cfg();
      this.stopTimers();
      this.zen = c.mode === "zen";
      this.quote = null;

      if (this.zen) {
        this.words = [""];
        this.input = [[]];
      } else if (c.mode === "quote") {
        const quote = MT.getQuote(c.quoteLength);
        this.quote = quote;
        this.words = quote.text.split(" ").filter(function (w) { return w.length; });
      } else if (keepWords && this.words.length) {
        /* repeating the same test: keep the word list as is */
      } else {
        this.words = this.generate();
      }

      this.input = this.words.map(function () { return []; });
      this.activeIndex = 0;
      this.started = false;
      this.finished = false;
      this.startTime = 0;
      this.endTime = 0;
      this.keypressTotal = 0;
      this.keypressCorrect = 0;
      this.keypressIncorrect = 0;
      this.allCharsTyped = 0;
      this.correctChars = 0;
      this.errorsThisSecond = 0;
      this.charsThisSecond = 0;
      this.history = [];
      this.bestBurst = 0;
      this.scrollOffset = 0;
      /* the words area must start at the top again: without this the old
         transform survived a restart, the text stayed scrolled to the middle
         of the new list and the caret was drawn where the first word would
         have been, far away from the words */
      this.els.words.style.transform = "translateY(0px)";
      this.pendingRestart = false;
      this.result = null;

      this.els.result.hidden = true;
      this.els.result.innerHTML = "";
      this.els.wrapper.hidden = false;
      this.els.wrapper.style.display = "";
      const configBar = document.getElementById("configBar");
      if (configBar) configBar.style.display = "";
      if (this.els.liveStats) this.els.liveStats.style.visibility = "hidden";
      this.els.restartHint.hidden = true;
      document.body.classList.remove("typing");

      const allLines = c.showAllLines && c.mode !== "time";
      this.els.wrapper.style.height = allLines ? "auto" : "";
      this.els.wrapper.style.overflow = allLines ? "visible" : "";

      this.buildWords();
      this.measureLayout();
      this.applyCaretStyles();
      this.updateLiveStats();
      this.updatePaceCaret(true);

      if (MT.Keymap) MT.Keymap.resetHeat();
      if (this.els.timerBarFill) this.els.timerBarFill.style.width = "100%";
      if (this.els.liveTimer) {
        this.els.liveTimer.textContent = c.mode === "time" ? c.time : "0";
      }

      this.els.words.querySelectorAll(".word").forEach(function (el) { el.classList.remove("active"); });
      if (this.wordEls[0]) this.wordEls[0].classList.add("active");
      this.updateCaret();

      if (this.isTouchDevice()) {
        const self = this;
        setTimeout(function () { self.focusInput(); }, 60);
      }
    },

    buildWords: function () {
      const container = this.els.words;
      container.innerHTML = "";
      this.wordEls = [];
      this.letterEls = [];
      const frag = document.createDocumentFragment();

      this.words.forEach(function (word) {
        const wordEl = document.createElement("div");
        wordEl.className = "word";
        const letters = [];
        const chars = word.split("");
        chars.forEach(function (ch) {
          const span = document.createElement("span");
          span.className = "letter";
          span.textContent = ch === " " ? "\u00a0" : ch;
          wordEl.appendChild(span);
          letters.push(span);
        });
        this.wordEls.push(wordEl);
        this.letterEls.push(letters);
        frag.appendChild(wordEl);
      }, this);

      container.appendChild(frag);
      this.updateAllWords();
    },

    appendWords: function (extraCount) {
      const lang = MT.getLanguage(cfg().language);
      /* the appended words go through exactly the same rules as the ones the
         test started with, so a long test never changes shape half way */
      const extra = this.transformWords(this.pickWords(lang.words, extraCount), lang.words);

      const frag = document.createDocumentFragment();
      extra.forEach(function (word) {
        this.words.push(word);
        this.input.push([]);
        const wordEl = document.createElement("div");
        wordEl.className = "word";
        const letters = [];
        word.split("").forEach(function (ch) {
          const span = document.createElement("span");
          span.className = "letter";
          span.textContent = ch;
          wordEl.appendChild(span);
          letters.push(span);
        });
        this.wordEls.push(wordEl);
        this.letterEls.push(letters);
        frag.appendChild(wordEl);
      }, this);

      this.els.words.appendChild(frag);
      this.measureLayout();
    },

    measureLayout: function () {
      const cs = window.getComputedStyle(this.els.words);
      this.lineHeight = parseFloat(cs.lineHeight) || 24;

      /* The row pitch is NOT the line height. Every word box sits in a flex
         line and adds a 2px letter border, 0.05em of padding and its own 2px
         error border on top of the line box, so the rows are about 5px taller
         than the line height. Scrolling by the line height therefore
         under-scrolled by 5px per row, the row above bled into the text area
         and `offsetTop / lineHeight` drifted away from the real row index
         after the fourth row. Measure the pitch from the words themselves. */
      const tops = [];
      const seen = {};
      for (let i = 0; i < this.wordEls.length; i++) {
        const top = this.wordEls[i].offsetTop;
        if (!seen[top]) {
          seen[top] = true;
          tops.push(top);
        }
      }
      tops.sort(function (a, b) { return a - b; });
      this.lineCount = tops.length;
      this.rowPitch = tops.length > 1 ? tops[1] - tops[0] : this.lineHeight;

      /* the window shows three whole rows, not three line heights */
      const c = cfg();
      if (!(c.showAllLines && c.mode !== "time")) {
        this.els.wrapper.style.height = (this.rowPitch * 3) + "px";
      }
    },

    /* The rows change shape when the font size, the line width or the theme
       changes: measure them again and put the caret back where it belongs. */
    refreshLayout: function () {
      if (!this.els.words || !this.wordEls.length) return;
      this.measureLayout();
      this.scrollToActive();
      this.updateCaret();
    },

    applyCaretStyles: function () {
      MT.Config.apply();
      const c = cfg();
      const caret = this.els.caret;
      caret.style.display = c.caretStyle === "off" ? "none" : "";
      caret.style.opacity = "1";
      const pace = this.els.paceCaret;
      pace.style.display = "none";
      pace.classList.remove("shown");
    },

    /* -------------------------------------------------------------- */
    /* rendering                                                      */
    /* -------------------------------------------------------------- */

    updateAllWords: function () {
      for (let i = 0; i < this.words.length; i++) this.updateWord(i);
    },

    syncSpans: function (i) {
      const target = this.words[i] || "";
      const typed = this.input[i] || [];
      const wordEl = this.wordEls[i];
      const spans = this.letterEls[i];
      if (!wordEl || !spans) return;

      const needed = Math.max(target.length, typed.length);
      while (spans.length < needed) {
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = typed[spans.length];
        wordEl.appendChild(span);
        spans.push(span);
      }
      while (spans.length > needed) {
        const span = spans.pop();
        if (span && span.parentNode) span.parentNode.removeChild(span);
      }
    },

    updateWord: function (i) {
      const c = cfg();
      const target = this.words[i] || "";
      const typed = this.input[i] || [];
      const spans = this.letterEls[i];
      const wordEl = this.wordEls[i];
      if (!spans || !wordEl) return;

      const silent = c.blindMode || c.confidenceMode === "max";
      const complete = this.isWordComplete(i);
      let hasError = false;

      for (let pos = 0; pos < spans.length; pos++) {
        const span = spans[pos];
        let cls;
        if (pos >= target.length) {
          cls = silent ? "letter" : "letter incorrect extra";
          hasError = true;
        } else {
          const typedChar = typed[pos];
          if (typedChar === undefined) {
            /* not typed yet — only a mistake if the word is already left behind */
            if (complete && !silent) {
              cls = "letter incorrect";
              hasError = true;
            } else {
              cls = "letter";
            }
          } else if (typedChar === target[pos]) {
            cls = "letter correct";
          } else {
            cls = silent ? "letter" : "letter incorrect";
            hasError = true;
          }
        }
        if (span.className !== cls) span.className = cls;
      }

      if (!c.blindMode) wordEl.classList.toggle("error", hasError);
      wordEl.classList.toggle("active", i === this.activeIndex && !this.finished);
    },

    updateCaret: function () {
      const c = cfg();
      const caret = this.els.caret;
      if (!caret || c.caretStyle === "off") return;

      const i = this.activeIndex;
      const wordEl = this.wordEls[i];
      if (!wordEl) return;

      const target = this.words[i] || "";
      const typed = this.input[i] || [];
      const spans = this.letterEls[i] || [];

      let left;
      let top = wordEl.offsetTop;
      if (typed.length === 0) {
        left = wordEl.offsetLeft;
      } else if (typed.length < target.length && spans[typed.length]) {
        left = spans[typed.length].offsetLeft;
      } else {
        const last = spans[spans.length - 1];
        left = last ? last.offsetLeft + last.offsetWidth : wordEl.offsetLeft + wordEl.offsetWidth;
      }

      const inset = this.lineHeight * 0.04;
      caret.style.top = (top + inset + this.scrollOffset) + "px";
      caret.style.left = left + "px";
      caret.style.height = (this.lineHeight * 0.92) + "px";

      caret.classList.add("typing");
      const self = this;
      clearTimeout(this._caretIdle);
      this._caretIdle = setTimeout(function () {
        caret.classList.remove("typing");
      }, 900);
    },

    scrollToActive: function () {
      const c = cfg();
      if (c.showAllLines && c.mode !== "time") return;
      const wordEl = this.wordEls[this.activeIndex];
      if (!wordEl) return;
      /* scroll by whole rows: the pitch, not the line height */
      const pitch = this.rowPitch || this.lineHeight;
      const line = Math.round(wordEl.offsetTop / pitch);
      const targetOffset = -Math.max(0, line - 1) * pitch;
      if (targetOffset !== this.scrollOffset) {
        this.scrollOffset = targetOffset;
        this.els.words.style.transform = "translateY(" + targetOffset + "px)";
      }
    },

    /* -------------------------------------------------------------- */
    /* pace caret                                                     */
    /* -------------------------------------------------------------- */

    resolvePaceSpeed: function () {
      const c = cfg();
      if (c.paceCaret === "off") return 0;
      if (c.paceCaret === "custom") return Number(c.paceCaretCustomSpeed) || 100;
      const results = MT.Store.results;
      if (c.paceCaret === "last") {
        return results.length ? results[results.length - 1].wpm : 0;
      }
      if (c.paceCaret === "avg") {
        if (!results.length) return 0;
        const tail = results.slice(-10);
        return tail.reduce(function (a, r) { return a + r.wpm; }, 0) / tail.length;
      }
      /* pb */
      const key = MT.Store.pbKey({
        mode: c.mode,
        modeValue: c.mode === "time" ? c.time : c.mode === "words" ? c.words : c.quoteLength,
        language: c.language,
        punctuation: c.punctuation,
        numbers: c.numbers,
        funbox: c.funbox,
      });
      const pb = MT.Store.pbs[key];
      return pb ? pb.wpm : 0;
    },

    startPaceCaret: function () {
      const speed = this.resolvePaceSpeed();
      if (!speed) return;
      this.paceSpeed = speed;
      this.pacePosition = 0;
      this.totalTargetChars = this.words.reduce(function (a, w) { return a + w.length + 1; }, 0);
      const self = this;
      this.els.paceCaret.classList.add("shown");
      this.paceInterval = setInterval(function () {
        self.pacePosition += (self.paceSpeed * 5) / 60 / 10; /* 100ms of typing */
        self.updatePaceCaret();
      }, 100);
    },

    updatePaceCaret: function (reset) {
      const pace = this.els.paceCaret;
      if (!pace) return;
      const speed = this.resolvePaceSpeed();
      if (!speed) {
        pace.classList.remove("shown");
        return;
      }
      if (reset) {
        pace.classList.add("shown");
        this.paceSpeed = speed;
        this.pacePosition = 0;
      }
      const total = this.words.reduce(function (a, w) { return a + w.length + 1; }, 0);
      let pos = Math.min(this.pacePosition, total);
      let wordIndex = 0;
      while (wordIndex < this.words.length && pos > this.words[wordIndex].length) {
        pos -= this.words[wordIndex].length + 1;
        wordIndex++;
      }
      if (wordIndex >= this.words.length) {
        pace.style.display = "none";
        return;
      }
      const wordEl = this.wordEls[wordIndex];
      if (!wordEl) return;
      const spans = this.letterEls[wordIndex] || [];
      const cIndex = Math.max(0, Math.floor(pos));
      let left;
      if (cIndex < spans.length && spans[cIndex]) left = spans[cIndex].offsetLeft;
      else {
        const last = spans[spans.length - 1];
        left = last ? last.offsetLeft + last.offsetWidth : wordEl.offsetLeft;
      }
      pace.style.display = "";
      pace.style.top = (wordEl.offsetTop + this.lineHeight * 0.04 + this.scrollOffset) + "px";
      pace.style.left = left + "px";
      pace.style.height = (this.lineHeight * 0.92) + "px";
    },

    /* -------------------------------------------------------------- */
    /* input                                                          */
    /* -------------------------------------------------------------- */

    onKeyDown: function (e) {
      if (MT.Commands && MT.Commands.isOpen()) return;
      const target = e.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA") && target.id !== "mobileInput") return;
      if (e.ctrlKey && (e.key === "k" || e.key === "K")) return; /* handled globally */

      const c = cfg();
      const key = e.key;

      if (this.finished) {
        if (key === "Enter" || (key === " " && !e.shiftKey)) {
          e.preventDefault();
          this._enterGuard = true;
          const self = this;
          setTimeout(function () { self._enterGuard = false; }, 60);
          this.nextTest();
        } else if (key === "Tab") {
          e.preventDefault();
          this.nextTest();
        } else if (key === "Backspace") {
          e.preventDefault();
          this.load(true);
        }
        return;
      }

      if (key === "Tab") {
        e.preventDefault();
        this.armRestart();
        return;
      }

      if (key === "Enter") {
        e.preventDefault();
        this._enterGuard = true;
        const self = this;
        setTimeout(function () { self._enterGuard = false; }, 60);
        if (this.pendingRestart) {
          this.restart();
          return;
        }
        if (this.zen) {
          if (this.input[0] && this.input[0].length) this.finish("zen");
          return;
        }
        if (c.quickRestart === "enter") this.restart();
        return;
      }

      if (key === "Escape") {
        if (c.quickRestart === "esc") {
          e.preventDefault();
          this.restart();
        }
        return;
      }

      if (key === "Backspace") {
        e.preventDefault();
        if (e.ctrlKey || e.altKey) this.deleteWord();
        else this.pressBackspace();
        return;
      }

      if (key === "Shift" || key === "Control" || key === "Alt" || key === "Meta" ||
          key === "CapsLock" || key === "ArrowLeft" || key === "ArrowRight" ||
          key === "ArrowUp" || key === "ArrowDown" || key === "Home" || key === "End" ||
          key === "PageUp" || key === "PageDown" || key === "Insert" || key === "Delete" ||
          key === "F1" || key === "F2" || key === "F3" || key === "F4" || key === "F5" ||
          key === "F6" || key === "F7" || key === "F8" || key === "F9" || key === "F10" ||
          key === "F11" || key === "F12" || key === "ContextMenu" || key === "Escape") {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (key.length !== 1) return;

      e.preventDefault();
      this.typeChar(key);
    },

    armRestart: function () {
      const self = this;
      this.pendingRestart = true;
      this.els.restartHint.hidden = false;
      clearTimeout(this.pendingRestartTimer);
      this.pendingRestartTimer = setTimeout(function () {
        self.pendingRestart = false;
        self.els.restartHint.hidden = true;
      }, 2000);
    },

    typeChar: function (ch) {
      if (this.finished) return;
      if (this.zen) return this.zenType(ch);
      if (ch === " ") return this.pressSpace();
      if (ch === "\n" || ch === "\t") return;
      this.pressLetter(ch);
    },

    pressLetter: function (ch) {
      const c = cfg();
      if (!this.started) this.start();

      const i = this.activeIndex;
      const target = this.words[i] || "";
      const typed = this.input[i];
      if (!typed) return;

      /* cap the extra letters so a stuck key cannot blow up the layout */
      if (typed.length >= target.length + 12) return;

      typed.push(ch);
      this.syncSpans(i);

      const isCorrect = typed.length <= target.length && ch === target[typed.length - 1];
      this.keypressTotal++;
      this.allCharsTyped++;
      this.charsThisSecond++;
      if (MT.Keymap) MT.Keymap.recordPress(ch, isCorrect);

      if (isCorrect) {
        this.keypressCorrect++;
        this.correctChars++;
        if (c.soundOnClick !== "off") MT.Sound.playClick(c.soundOnClick);
      } else {
        this.keypressIncorrect++;
        this.errorsThisSecond++;
        if (c.soundOnError !== "off") MT.Sound.playError(c.soundOnError);
      }

      this.updateWord(i);
      this.updateCaret();
      this.updateLiveStats();

      if (!isCorrect && c.stopOnError === "letter") {
        this.finish("error");
        return;
      }

      /* quick end: the last word finishes the test without needing a space */
      if (c.quickEnd && !this.zen && c.mode !== "time" &&
          i === this.words.length - 1 && typed.length >= target.length) {
        this.finish("complete");
      }
    },

    pressSpace: function () {
      const c = cfg();
      const i = this.activeIndex;
      const target = this.words[i] || "";
      const typed = this.input[i] || [];
      if (typed.length === 0) return;
      if (!this.started) this.start();

      const wordCorrect = typed.length === target.length && this.wordIsFullyCorrect(i);
      this.keypressTotal++;
      this.allCharsTyped++;
      this.charsThisSecond++;
      if (wordCorrect) {
        this.keypressCorrect++;
        this.correctChars++; /* the space is credited */
        if (c.soundOnClick !== "off") MT.Sound.playClick(c.soundOnClick);
      } else {
        this.keypressIncorrect++;
        this.errorsThisSecond++;
        if (c.soundOnError !== "off") MT.Sound.playError(c.soundOnError);
      }
      if (MT.Keymap) MT.Keymap.recordPress(" ", wordCorrect);

      /* leave the word behind: remaining letters become missed */
      this.updateWord(i);

      if (!wordCorrect && c.stopOnError === "word") {
        this.finish("error");
        return;
      }

      this.activeIndex++;
      this.pendingRestart = false;

      /* keep a healthy number of words ahead in time mode */
      if (c.mode === "time" && this.activeIndex > this.words.length - 25) {
        this.appendWords(40);
      }

      if (this.activeIndex >= this.words.length) {
        this.activeIndex = this.words.length - 1;
        this.updateCaret();
        this.updateLiveStats();
        this.finish("complete");
        return;
      }

      this.wordEls[this.activeIndex].classList.add("active");
      this.updateWord(this.activeIndex - 1);
      this.scrollToActive();
      this.updateCaret();
      this.updateLiveStats();
    },

    pressBackspace: function () {
      const c = cfg();
      if (this.finished) return;
      if (c.difficulty === "expert" || c.difficulty === "master" ||
          c.confidenceMode === "on" || c.confidenceMode === "max") return;
      if (!this.started) return;

      const i = this.activeIndex;
      const typed = this.input[i] || [];

      if (typed.length > 0) {
        typed.pop();
        if (this.zen) this.words[i] = (this.words[i] || "").slice(0, -1);
        this.syncSpans(i);
        this.updateWord(i);
        this.updateCaret();
        this.updateLiveStats();
        return;
      }

      if (i > 0) {
        this.activeIndex = i - 1;
        this.wordEls[this.activeIndex].classList.add("active");
        this.updateWord(i);
        this.updateWord(this.activeIndex);
        this.scrollToActive();
        this.updateCaret();
        this.updateLiveStats();
      }
    },

    deleteWord: function () {
      const c = cfg();
      if (this.finished) return;
      if (c.difficulty === "expert" || c.difficulty === "master" ||
          c.confidenceMode === "on" || c.confidenceMode === "max") return;
      if (!this.started) return;
      const i = this.activeIndex;
      this.input[i] = [];
      this.syncSpans(i);
      this.updateWord(i);
      this.updateCaret();
    },

    zenType: function (ch) {
      const c = cfg();
      if (!this.started) this.start();
      const i = this.activeIndex;
      if (ch === " ") {
        if (!this.input[i] || this.input[i].length === 0) return;
        this.keypressTotal++;
        this.allCharsTyped++;
        this.charsThisSecond++;
        this.keypressCorrect++;
        this.correctChars++;
        this.activeIndex++;
        this.words.push("");
        this.input.push([]);
        this.addZenWordEl();
      } else {
        if (!this.input[i]) this.input[i] = [];
        this.input[i].push(ch);
        this.words[i] = this.words[i] + ch;
        this.keypressTotal++;
        this.allCharsTyped++;
        this.charsThisSecond++;
        this.keypressCorrect++;
        this.correctChars++;
        this.syncSpans(i);
      }
      this.updateWord(i);
      this.measureLayout();
      this.scrollToActive();
      this.updateCaret();
      this.updateLiveStats();
      if (c.soundOnClick !== "off") MT.Sound.playClick(c.soundOnClick);
    },

    addZenWordEl: function () {
      const wordEl = document.createElement("div");
      wordEl.className = "word";
      this.els.words.appendChild(wordEl);
      this.wordEls.push(wordEl);
      this.letterEls.push([]);
    },

    /* -------------------------------------------------------------- */
    /* timers + stats                                                 */
    /* -------------------------------------------------------------- */

    start: function () {
      this.started = true;
      this.startTime = Date.now();
      const oof = document.getElementById("outOfFocus");
      if (oof) oof.hidden = true;
      this.lastKeyTime = this.startTime;
      document.body.classList.add("typing");

      const self = this;
      this.timerInterval = setInterval(function () { self.tick(); }, 1000);
      this.startPaceCaret();

      if (MT.UI && MT.UI.onTestStart) MT.UI.onTestStart();
    },

    pauseTimer: function () {
      /* keep it simple: a hidden tab pauses the sampling interval */
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = null;
    },

    resumeTimer: function () {
      if (this.timerInterval || this.finished || !this.started) return;
      const self = this;
      this.timerInterval = setInterval(function () { self.tick(); }, 1000);
    },

    stopTimers: function () {
      if (this.timerInterval) clearInterval(this.timerInterval);
      if (this.paceInterval) clearInterval(this.paceInterval);
      clearTimeout(this.pendingRestartTimer);
      this.timerInterval = null;
      this.paceInterval = null;
      document.body.classList.remove("typing");
    },

    tick: function () {
      if (!this.started || this.finished) return;
      const c = cfg();
      const seconds = this.history.length + 1;
      const raw = Math.round((this.charsThisSecond / 5) * 60);
      const wpmChars = this.correctChars;
      const elapsed = (Date.now() - this.startTime) / 60000;
      const wpm = elapsed > 0 ? Math.round(wpmChars / 5 / elapsed) : 0;

      this.history.push({ raw: raw, wpm: wpm, errors: this.errorsThisSecond });
      if (raw > this.bestBurst) this.bestBurst = raw;
      this.errorsThisSecond = 0;
      this.charsThisSecond = 0;

      if (c.mode === "time") {
        const remaining = Math.max(0, Number(c.time) - seconds);
        if (this.els.timerBarFill) {
          this.els.timerBarFill.style.width = ((remaining / Number(c.time)) * 100) + "%";
        }
        if (this.els.liveTimer) this.els.liveTimer.textContent = remaining;
        this.updateLiveStats();
        if (remaining <= 0) {
          this.finish("time");
          return;
        }
      } else {
        if (this.els.liveTimer) this.els.liveTimer.textContent = seconds;
        this.updateLiveStats();
      }

      this.updatePaceCaret();
    },

    /* `floorMs` exists for the live readout: a test that has been running for a
       tenth of a second would otherwise divide by almost nothing and flash a
       four-digit wpm. Final results use the true elapsed time. */
    elapsedMinutes: function (floorMs) {
      const end = this.endTime || Date.now();
      const ms = Math.max(floorMs || 1, end - this.startTime);
      return ms / 60000;
    },

    wordIsFullyCorrect: function (i) {
      const target = this.words[i] || "";
      const typed = this.input[i] || [];
      if (typed.length !== target.length) return false;
      for (let c = 0; c < target.length; c++) {
        if (typed[c] !== target[c]) return false;
      }
      return true;
    },

    isWordComplete: function (i) {
      return i < this.activeIndex || this.finished;
    },

    computeWpm: function (floorMs) {
      const minutes = this.elapsedMinutes(floorMs);
      return Math.round(this.correctChars / 5 / minutes);
    },

    computeRaw: function (floorMs) {
      const minutes = this.elapsedMinutes(floorMs);
      return Math.round(this.allCharsTyped / 5 / minutes);
    },

    computeAccuracy: function () {
      if (this.keypressTotal === 0) return 100;
      return (this.keypressCorrect / this.keypressTotal) * 100;
    },

    computeConsistency: function () {
      const samples = this.history.map(function (h) { return h.raw; }).filter(function (v) { return v >= 0; });
      if (samples.length < 2) return 100;
      const mean = samples.reduce(function (a, b) { return a + b; }, 0) / samples.length;
      if (mean === 0) return 0;
      const variance = samples.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }, 0) / samples.length;
      const sd = Math.sqrt(variance);
      return Math.max(0, Math.min(100, (1 - sd / mean) * 100));
    },

    countChars: function () {
      const out = { correct: 0, incorrect: 0, extra: 0, missed: 0 };
      for (let i = 0; i < this.words.length; i++) {
        const target = this.words[i] || "";
        const typed = this.input[i] || [];
        for (let pos = 0; pos < target.length; pos++) {
          const t = typed[pos];
          if (t === undefined) {
            if (i < this.activeIndex || this.finished) out.missed++;
          } else if (t === target[pos]) {
            out.correct++;
          } else {
            out.incorrect++;
          }
        }
        if (typed.length > target.length) out.extra += typed.length - target.length;
      }
      return out;
    },

    updateLiveStats: function () {
      const c = cfg();
      const els = this.els;
      const mapping = {
        speed: "liveWpm",
        acc: "liveAcc",
        burst: "liveBurst",
        timer: "liveTimer",
      };
      const wanted = mapping[c.liveStatsStyle] || null;

      ["liveWpm", "liveAcc", "liveBurst", "liveTimer"].forEach(function (id) {
        const node = document.getElementById(id);
        if (node) node.style.display = id === wanted ? "" : "none";
      });

      if (els.liveStats) {
        els.liveStats.style.visibility = this.started && !this.finished ? "visible" : "hidden";
      }

      if (els.liveWpm) els.liveWpm.textContent = this.started ? this.computeWpm(1000) : 0;
      if (els.liveAcc) els.liveAcc.textContent = Math.round(this.computeAccuracy()) + "%";
      if (els.liveBurst) els.liveBurst.textContent = this.bestBurst;
    },

    /* -------------------------------------------------------------- */
    /* finishing                                                      */
    /* -------------------------------------------------------------- */

    finish: function (reason) {
      if (this.finished) return;
      this.finished = true;
      this.endTime = Date.now();
      this.stopTimers();

      /* sample the final partial second so the chart has a last point */
      if (this.charsThisSecond > 0 || this.errorsThisSecond > 0) {
        const raw = Math.round((this.charsThisSecond / 5) * 60);
        if (raw > this.bestBurst) this.bestBurst = raw;
        const minutes = this.elapsedMinutes();
        this.history.push({
          raw: raw,
          wpm: minutes > 0 ? Math.round(this.correctChars / 5 / minutes) : 0,
          errors: this.errorsThisSecond,
        });
      }

      const c = cfg();
      const modeValue = c.mode === "time" ? Number(c.time)
        : c.mode === "words" ? (Number(c.words) >= 1000 ? "on and on" : Number(c.words))
        : c.mode === "quote" ? c.quoteLength : "zen";

      const chars = this.countChars();
      const wpm = this.computeWpm();
      const acc = this.computeAccuracy();

      const result = {
        wpm: wpm,
        raw: this.computeRaw(),
        acc: Number(acc.toFixed(2)),
        consistency: Number(this.computeConsistency().toFixed(2)),
        burst: this.bestBurst,
        chars: chars,
        mode: c.mode,
        modeValue: modeValue,
        language: c.language,
        languageLabel: MT.getLanguage(c.language).label || c.language,
        punctuation: !!c.punctuation,
        numbers: !!c.numbers,
        difficulty: c.difficulty,
        funbox: c.funbox,
        quote: this.quote ? this.quote.source : null,
        timestamp: Date.now(),
        duration: Math.round((this.endTime - this.startTime) / 100) / 10,
        history: this.history.slice(),
        reason: reason,
        failed: false,
      };

      /* minimum thresholds */
      if ((c.minWpm === "custom" && result.wpm < Number(c.minWpmCustomSpeed)) ||
          (c.minAcc === "custom" && result.acc < Number(c.minAccCustom)) ||
          (c.minBurst === "custom" && result.burst < Number(c.minBurstCustomSpeed))) {
        result.failed = true;
      }

      if (!result.failed) {
        MT.Store.addResult(result);
        result.isPb = MT.Store.checkPb(result);
      } else {
        MT.Store.addResult(result);
        result.isPb = false;
      }

      this.result = result;
      this.lastResult = result;

      this.els.caret.style.opacity = "0";
      if (this.els.paceCaret) this.els.paceCaret.style.display = "none";

      MT.UI.showResult(result);
    },

    /* -------------------------------------------------------------- */
    /* restart / navigation                                           */
    /* -------------------------------------------------------------- */

    restart: function () {
      this.pendingRestart = false;
      this.els.restartHint.hidden = true;
      this.load(this.restartSameWords);
    },

    nextTest: function () {
      this.restartSameWords = false;
      this.load(false);
    },

    repeatTest: function () {
      this.restartSameWords = true;
      this.load(true);
    },
  };
})();
