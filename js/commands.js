/* =====================================================================
   The command line (Esc). Fuzzy-searches every theme, language, mode,
   setting and navigation action.
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});

  function fuzzy(text, query) {
    text = text.toLowerCase();
    query = query.toLowerCase().replace(/\s+/g, "");
    if (!query) return { score: 0, positions: [] };
    let ti = 0;
    let qi = 0;
    let streak = 0;
    let score = 0;
    const positions = [];
    while (qi < query.length) {
      if (ti >= text.length) return null;
      if (text[ti] === query[qi]) {
        positions.push(ti);
        streak++;
        score += 1 + streak * 2 + (ti === 0 || text[ti - 1] === " " ? 4 : 0);
        qi++;
        ti++;
      } else {
        ti++;
        streak = 0;
      }
    }
    score -= text.length * 0.02;
    return { score: score, positions: positions };
  }

  function highlight(text, positions) {
    if (!positions || !positions.length) return text;
    const set = {};
    positions.forEach(function (p) { set[p] = true; });
    let out = "";
    for (let i = 0; i < text.length; i++) {
      out += set[i] ? "<mark>" + text[i] + "</mark>" : text[i];
    }
    return out;
  }

  const ICONS = {
    nav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18"/></svg>',
    language: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
    mode: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>',
    setting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/></svg>',
    action: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
  };

  MT.Commands = {
    open: false,
    items: [],
    filtered: [],
    selected: 0,
    palette: null,
    input: null,
    list: null,

    init: function () {
      this.palette = document.getElementById("commandPalette");
      this.input = document.getElementById("paletteInput");
      this.list = document.getElementById("paletteList");
      const self = this;

      this.input.addEventListener("input", function () { self.filter(self.input.value); });
      this.input.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          e.preventDefault();
          self.close();
        } else if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
          e.preventDefault();
          self.move(1);
        } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
          e.preventDefault();
          self.move(-1);
        } else if (e.key === "Enter") {
          e.preventDefault();
          self.run(self.filtered[self.selected]);
        }
      });

      this.palette.addEventListener("mousedown", function (e) {
        if (e.target === self.palette) self.close();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !self.open && MT.Config.data.quickRestart !== "esc") {
          if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") &&
              e.target.id !== "mobileInput") return;
          e.preventDefault();
          self.toggle();
        } else if (e.ctrlKey && (e.key === "k" || e.key === "K")) {
          e.preventDefault();
          self.toggle();
        }
      });
    },

    build: function () {
      const items = [];
      const c = MT.Config.data;

      /* navigation */
      items.push({ name: "go to test", hint: "page", icon: ICONS.nav, action: function () { MT.UI.showPage("test"); } });
      items.push({ name: "go to about", hint: "page", icon: ICONS.nav, action: function () { MT.UI.showPage("about"); } });
      items.push({ name: "go to profile", hint: "page", icon: ICONS.nav, action: function () { MT.UI.showPage("profile"); } });
      items.push({ name: "go to settings", hint: "page", icon: ICONS.nav, action: function () { MT.UI.showPage("settings"); } });

      /* actions */
      items.push({ name: "restart test", hint: "tab enter", icon: ICONS.action, action: function () { MT.Typing.restart(); } });
      items.push({ name: "repeat test", hint: "same words", icon: ICONS.action, action: function () { MT.Typing.repeatTest(); } });
      items.push({ name: "next test", hint: "new words", icon: ICONS.action, action: function () { MT.Typing.nextTest(); } });
      items.push({ name: "toggle sound", hint: c.soundOnClick === "off" ? "currently off" : "currently " + c.soundOnClick, icon: ICONS.setting, action: function () {
        MT.Config.set("soundOnClick", c.soundOnClick === "off" ? "click" : "off");
        MT.UI.syncAll();
      } });
      items.push({ name: "reset settings", hint: "danger", icon: ICONS.action, action: function () {
        MT.Config.reset();
        MT.UI.syncAll();
        MT.UI.notify("settings reset");
      } });
      items.push({ name: "reset all personal data", hint: "danger", icon: ICONS.action, action: function () {
        MT.Store.clear();
        MT.Config.load();
        MT.Config.apply();
        MT.UI.syncAll();
        MT.UI.notify("all local data deleted");
      } });

      /* modes */
      ["time", "words", "quote", "zen"].forEach(function (mode) {
        items.push({
          name: "mode " + mode,
          hint: c.mode === mode ? "current" : "",
          icon: ICONS.mode,
          action: function () { MT.Config.set("mode", mode); MT.Typing.nextTest(); MT.UI.syncAll(); },
        });
      });

      [15, 30, 60, 120].forEach(function (value) {
        items.push({
          name: "time " + value + "s",
          hint: c.mode === "time" && Number(c.time) === value ? "current" : "",
          icon: ICONS.mode,
          action: function () { MT.Config.set("mode", "time"); MT.Config.set("time", value); MT.Typing.nextTest(); MT.UI.syncAll(); },
        });
      });

      [10, 25, 50, 100, 1000].forEach(function (value) {
        items.push({
          name: "words " + (value >= 1000 ? "on and on" : value),
          hint: c.mode === "words" && Number(c.words) === value ? "current" : "",
          icon: ICONS.mode,
          action: function () { MT.Config.set("mode", "words"); MT.Config.set("words", value); MT.Typing.nextTest(); MT.UI.syncAll(); },
        });
      });

      ["short", "medium", "long", "thicc"].forEach(function (value) {
        items.push({
          name: "quote " + value,
          hint: c.mode === "quote" && c.quoteLength === value ? "current" : "",
          icon: ICONS.mode,
          action: function () { MT.Config.set("mode", "quote"); MT.Config.set("quoteLength", value); MT.Typing.nextTest(); MT.UI.syncAll(); },
        });
      });

      /* languages */
      (MT.languageOrder || []).forEach(function (name) {
        const lang = MT.languages[name];
        items.push({
          name: "language " + (lang.label || name),
          hint: c.language === name ? "current" : "",
          icon: ICONS.language,
          action: function () { MT.Config.set("language", name); MT.Typing.nextTest(); MT.UI.syncAll(); },
        });
      });

      /* funboxes */
      MT.funboxes.forEach(function (fb) {
        items.push({
          name: "funbox " + fb.name,
          hint: c.funbox === fb.name ? "current" : (fb.description || ""),
          icon: ICONS.setting,
          action: function () { MT.Config.set("funbox", fb.name); MT.Typing.nextTest(); MT.UI.syncAll(); },
        });
      });

      /* themes */
      MT.themeOrder.forEach(function (name) {
        items.push({
          name: "theme " + name,
          hint: c.theme === name ? "current" : "",
          icon: ICONS.theme,
          action: function () { MT.Config.set("theme", name); MT.Config.apply(); MT.UI.syncAll(); },
        });
      });

      /* every button / toggle setting */
      MT.settingsSchema.forEach(function (setting) {
        if (setting.type === "button") {
          setting.options.forEach(function (option) {
            items.push({
              name: setting.configKey + " " + option,
              hint: String(c[setting.configKey]) === String(option) ? "current" : setting.group,
              icon: ICONS.setting,
              action: function () {
                MT.Config.set(setting.configKey, option);
                MT.Typing.nextTest();
                MT.UI.syncAll();
              },
            });
          });
        } else if (setting.type === "toggle") {
          ["on", "off"].forEach(function (state) {
            items.push({
              name: setting.configKey + " " + state,
              hint: c[setting.configKey] === (state === "on") ? "current" : setting.group,
              icon: ICONS.setting,
              action: function () {
                MT.Config.set(setting.configKey, state === "on");
                MT.Config.apply();
                MT.UI.syncAll();
              },
            });
          });
        }
      });

      this.items = items;
    },

    toggle: function () {
      if (this.open) this.close();
      else this.openPalette();
    },

    openPalette: function () {
      this.build();
      this.open = true;
      this.palette.hidden = false;
      this.input.value = "";
      this.selected = 0;
      this.filter("");
      this.input.focus();
      MT.Typing.stopTimers();
    },

    close: function () {
      this.open = false;
      this.palette.hidden = true;
      this.input.blur();
    },

    isOpen: function () { return this.open; },

    move: function (delta) {
      if (!this.filtered.length) return;
      this.selected = (this.selected + delta + this.filtered.length) % this.filtered.length;
      this.renderList();
      const el = this.list.querySelector(".palette-item.selected");
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    },

    filter: function (query) {
      const results = [];
      this.items.forEach(function (item) {
        const m = fuzzy(item.name, query);
        if (m) results.push({ item: item, score: m.score, positions: m.positions });
      });
      results.sort(function (a, b) { return b.score - a.score; });
      this.filtered = results.slice(0, 60).map(function (r) {
        return { item: r.item, positions: r.positions };
      });
      this.selected = 0;
      this.renderList();
    },

    renderList: function () {
      const self = this;
      this.list.innerHTML = "";
      if (!this.filtered.length) {
        this.list.innerHTML = '<div class="palette-empty">nothing matches that</div>';
        return;
      }
      const frag = document.createDocumentFragment();
      this.filtered.forEach(function (entry, index) {
        const btn = document.createElement("button");
        btn.className = "palette-item" + (index === self.selected ? " selected" : "");
        btn.innerHTML =
          '<span class="pico">' + (entry.item.icon || "") + "</span>" +
          '<span class="pname">' + highlight(entry.item.name, entry.positions) + "</span>" +
          (entry.item.hint ? '<span class="phint">' + entry.item.hint + "</span>" : "");
        btn.addEventListener("mouseenter", function () {
          self.selected = index;
          self.renderList();
        });
        btn.addEventListener("click", function () {
          self.run(entry);
        });
        frag.appendChild(btn);
      });
      this.list.appendChild(frag);
    },

    run: function (entry) {
      if (!entry || !entry.item) return;
      this.close();
      entry.item.action();
    },
  };
})();
