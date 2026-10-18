/* =====================================================================
   UI: page routing, the config bar, dropdowns, the settings page, the
   profile page and the results screen.
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});
  function cfg() { return MT.Config.data; }

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function modeValueLabel() {
    const c = cfg();
    if (c.mode === "time") return c.time + "s";
    if (c.mode === "words") return Number(c.words) >= 1000 ? "on and on" : c.words + " words";
    if (c.mode === "quote") return c.quoteLength + " quote";
    return "zen";
  }

  let notifyTimer = null;

  MT.UI = {
    currentPage: "test",
    page: "test",

    /* -------------------------------------------------------------- */
    init: function () {
      const self = this;

      /* navigation */
      document.querySelectorAll("[data-nav]").forEach(function (el) {
        el.addEventListener("click", function (e) {
          e.preventDefault();
          self.showPage(el.getAttribute("data-nav"));
        });
      });

      const year = document.getElementById("year");
      if (year) year.textContent = new Date().getFullYear();
      const version = document.getElementById("version");
      if (version) version.textContent = MT.VERSION;

      /* header buttons */
      const themeButton = document.getElementById("themeButton");
      if (themeButton) {
        themeButton.addEventListener("click", function (e) {
          e.stopPropagation();
          self.openThemeDropdown(themeButton);
        });
      }

      const soundButton = document.getElementById("soundButton");
      if (soundButton) {
        soundButton.addEventListener("click", function () {
          const next = cfg().soundOnClick === "off" ? "click" : "off";
          MT.Config.set("soundOnClick", next);
          if (next !== "off") { MT.Sound.unlock(); MT.Sound.preview(next); }
          self.syncAll();
        });
      }

      const commandButton = document.getElementById("commandButton");
      if (commandButton) {
        commandButton.addEventListener("click", function () { MT.Commands.toggle(); });
      }

      const footerReset = document.getElementById("footerResetButton");
      if (footerReset) {
        footerReset.addEventListener("click", function () {
          if (confirm("Delete every stored result, personal best and setting?")) {
            MT.Store.clear();
            MT.Config.reset();
            MT.Config.apply();
            self.syncAll();
            self.notify("all local data deleted");
          }
        });
      }

      /* config bar */
      document.querySelectorAll("#cg-punctuation .config-button, #cg-numbers .config-button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const key = btn.getAttribute("data-config");
          MT.Config.set(key, !cfg()[key]);
          MT.Typing.nextTest();
          self.syncAll();
        });
      });

      document.querySelectorAll("#cg-mode .config-button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          MT.Config.set("mode", btn.getAttribute("data-mode"));
          MT.Typing.nextTest();
          self.syncAll();
        });
      });

      const focusButton = document.getElementById("focusButton");
      if (focusButton) {
        focusButton.addEventListener("click", function () {
          MT.Typing.focusInput();
        });
      }

      /* keep the words area clickable even when the page is not focused */
      window.addEventListener("focus", function () { self.syncAll(); });

      this.showPage("test");
      this.renderSettings();
      this.syncAll();
    },

    /* -------------------------------------------------------------- */
    /* routing                                                        */
    /* -------------------------------------------------------------- */
    showPage: function (name) {
      if (MT.Typing && MT.Typing.blurInput) MT.Typing.blurInput();
      if (!document.querySelector('.page[data-page="' + name + '"]')) name = "test";
      this.page = name;
      document.body.setAttribute("data-page", name);
      document.querySelectorAll(".page").forEach(function (page) {
        page.classList.toggle("active", page.getAttribute("data-page") === name);
      });
      document.querySelectorAll("[data-nav]").forEach(function (el) {
        if (el.tagName === "BUTTON" && el.classList.contains("nav-item")) {
          el.classList.toggle("active", el.getAttribute("data-nav") === name);
        }
      });
      if (name === "profile") this.renderProfile();
      if (name === "settings") this.renderSettings();
      if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
      window.scrollTo(0, 0);
    },

    /* -------------------------------------------------------------- */
    /* generic dropdown                                               */
    /* -------------------------------------------------------------- */
    openDropdown: function (anchor, options) {
      if (MT.Typing && MT.Typing.blurInput) MT.Typing.blurInput();
      const dropdown = document.getElementById("themeDropdown");
      const self = this;

      let items = options.items.slice();
      let query = "";
      let hovered = 0;

      function render() {
        const list = items.filter(function (item) {
          return !query || item.label.toLowerCase().indexOf(query.toLowerCase()) !== -1;
        });
        const listEl = dropdown.querySelector(".dropdown-list");
        listEl.innerHTML = "";
        list.slice(0, 200).forEach(function (item, index) {
          const btn = document.createElement("button");
          btn.className = "dropdown-item" + (String(item.value) === String(options.current) ? " active" : "") +
            (index === hovered ? " hovered" : "");
          let dots = "";
          if (item.swatch) {
            dots = '<span class="swatch-dots">' + item.swatch.map(function (c) {
              return '<i style="background:' + c + '"></i>';
            }).join("") + "</span>";
          }
          btn.innerHTML = dots + '<span class="label">' + esc(item.label) + "</span>";
          btn.addEventListener("click", function () {
            options.onPick(item.value);
            self.closeDropdown();
          });
          listEl.appendChild(btn);
        });
        if (!list.length) listEl.innerHTML = '<div class="dropdown-item">nothing found</div>';
      }

      dropdown.innerHTML =
        (options.search ? '<input class="dropdown-search" type="text" placeholder="search&hellip;" autocomplete="off">' : "") +
        '<div class="dropdown-list"></div>';
      dropdown.dataset.owner = options.owner || "";
      dropdown.hidden = false;

      const rect = anchor.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 24);
      dropdown.style.width = width + "px";
      let left = rect.left + window.scrollX;
      if (left + width > window.innerWidth + window.scrollX - 12) {
        left = window.innerWidth + window.scrollX - width - 12;
      }
      dropdown.style.left = Math.max(12, left) + "px";
      dropdown.style.top = (rect.bottom + window.scrollY + 6) + "px";

      const searchInput = dropdown.querySelector(".dropdown-search");
      if (searchInput) {
        searchInput.addEventListener("input", function () { query = searchInput.value; render(); });
        searchInput.addEventListener("keydown", function (e) {
          const list = dropdown.querySelectorAll(".dropdown-item");
          if (e.key === "ArrowDown") { e.preventDefault(); hovered = Math.min(list.length - 1, hovered + 1); render(); }
          if (e.key === "ArrowUp") { e.preventDefault(); hovered = Math.max(0, hovered - 1); render(); }
          if (e.key === "Enter" && list[hovered]) { e.preventDefault(); list[hovered].click(); }
          if (e.key === "Escape") self.closeDropdown();
        });
        setTimeout(function () { searchInput.focus(); }, 0);
      }

      render();

      this._dropdownClose = function (e) {
        if (!dropdown.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) {
          self.closeDropdown();
        }
      };
      setTimeout(function () {
        document.addEventListener("mousedown", self._dropdownClose);
      }, 0);
    },

    closeDropdown: function () {
      const dropdown = document.getElementById("themeDropdown");
      dropdown.hidden = true;
      dropdown.innerHTML = "";
      if (this._dropdownClose) {
        document.removeEventListener("mousedown", this._dropdownClose);
        this._dropdownClose = null;
      }
    },

    openThemeDropdown: function (anchor) {
      const self = this;
      const items = MT.themeOrder.map(function (name) {
        const theme = MT.themes[name];
        return { value: name, label: name, swatch: MT.themeSwatch(theme) };
      });
      items.unshift({
        value: "custom",
        label: "custom",
        swatch: [cfg().customTheme.bg, cfg().customTheme.main, cfg().customTheme.text],
      });
      this.openDropdown(anchor, {
        owner: "theme",
        search: true,
        items: items,
        current: cfg().theme,
        onPick: function (value) {
          MT.Config.set("theme", value);
          MT.Config.apply();
          self.syncAll();
        },
      });
    },

    openLanguageDropdown: function (anchor) {
      const self = this;
      const items = (MT.languageOrder || []).map(function (name) {
        return { value: name, label: MT.languages[name].label || name };
      });
      this.openDropdown(anchor, {
        owner: "language",
        search: false,
        items: items,
        current: cfg().language,
        onPick: function (value) {
          MT.Config.set("language", value);
          MT.Typing.nextTest();
          self.syncAll();
        },
      });
    },

    openFunboxDropdown: function (anchor) {
      const self = this;
      const items = MT.funboxes.map(function (fb) {
        return { value: fb.name, label: fb.name + (fb.description ? "  —  " + fb.description : "") };
      });
      this.openDropdown(anchor, {
        owner: "funbox",
        search: false,
        items: items,
        current: cfg().funbox,
        onPick: function (value) {
          MT.Config.set("funbox", value);
          MT.Typing.nextTest();
          self.syncAll();
        },
      });
    },

    /* -------------------------------------------------------------- */
    /* config bar                                                     */
    /* -------------------------------------------------------------- */
    updateConfigBar: function () {
      const c = cfg();
      const self = this;

      const punctuation = document.querySelector('#cg-punctuation [data-config="punctuation"]');
      if (punctuation) punctuation.classList.toggle("active", !!c.punctuation);
      const numbers = document.querySelector('#cg-numbers [data-config="numbers"]');
      if (numbers) numbers.classList.toggle("active", !!c.numbers);

      const forced = c.difficulty === "master";
      if (punctuation) punctuation.classList.toggle("disabled", forced);
      if (numbers) numbers.classList.toggle("disabled", forced);

      document.querySelectorAll("#cg-mode .config-button").forEach(function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-mode") === c.mode);
      });

      /* values depend on the current mode */
      const values = document.getElementById("cg-values");
      values.innerHTML = "";
      let options = [];
      if (c.mode === "time") options = [15, 30, 60, 120];
      else if (c.mode === "words") options = [10, 25, 50, 100, 1000];
      else if (c.mode === "quote") options = ["short", "medium", "long", "thicc"];

      const currentValue = c.mode === "time" ? Number(c.time) : c.mode === "words" ? Number(c.words) : c.quoteLength;
      options.forEach(function (option) {
        const btn = document.createElement("button");
        btn.className = "config-button" + (String(option) === String(currentValue) ? " active" : "");
        btn.textContent = option === 1000 ? "on and on" : option;
        btn.addEventListener("click", function () {
          if (c.mode === "time") MT.Config.set("time", option);
          else if (c.mode === "words") MT.Config.set("words", option);
          else MT.Config.set("quoteLength", option);
          MT.Typing.nextTest();
          self.syncAll();
        });
        values.appendChild(btn);
      });

      /* funbox indicator */
      const funboxGroup = document.getElementById("cg-funbox");
      funboxGroup.innerHTML = "";
      if (c.funbox && c.funbox !== "none") {
        const btn = document.createElement("button");
        btn.className = "config-button active";
        btn.textContent = "funbox: " + c.funbox;
        btn.addEventListener("click", function () { self.openFunboxDropdown(btn); });
        funboxGroup.appendChild(btn);
      }

      /* language */
      const langGroup = document.getElementById("cg-language");
      langGroup.innerHTML = "";
      const langBtn = document.createElement("button");
      langBtn.className = "config-button";
      langBtn.textContent = MT.getLanguage(c.language).label || c.language;
      langBtn.addEventListener("click", function () { self.openLanguageDropdown(langBtn); });
      langGroup.appendChild(langBtn);

      /* header state */
      const themeButton = document.getElementById("themeButton");
      if (themeButton) {
        const theme = MT.getTheme(c.theme, c.customTheme);
        themeButton.style.color = theme.light ? "" : "";
      }
      const soundButton = document.getElementById("soundButton");
      if (soundButton) soundButton.classList.toggle("active", c.soundOnClick !== "off");
      const commandButton = document.getElementById("commandButton");
      if (commandButton) commandButton.classList.toggle("active", MT.Commands.isOpen());
    },

    /* -------------------------------------------------------------- */
    /* settings page                                                  */
    /* -------------------------------------------------------------- */
    renderSettings: function () {
      const container = document.getElementById("settingsContent");
      if (!container) return;
      const self = this;
      const c = cfg();

      container.innerHTML = "";
      MT.settingsGroups.forEach(function (group) {
        const wrap = document.createElement("div");
        wrap.className = "settings-group";
        const heading = document.createElement("h2");
        heading.textContent = group;
        wrap.appendChild(heading);

        container.appendChild(wrap);
      });

      const groups = {};
      container.querySelectorAll(".settings-group").forEach(function (wrap, index) {
        groups[MT.settingsGroups[index]] = wrap;
      });

      MT.settingsSchema.forEach(function (setting) {
        groups[setting.group].appendChild(self.buildSettingRow(setting));
      });
    },

    buildSettingRow: function (setting) {
      const self = this;
      const c = cfg();

      const row = document.createElement("div");
      row.className = "setting";

      const name = document.createElement("div");
      name.className = "setting-name";
      name.textContent = setting.name;
      row.appendChild(name);

      const control = document.createElement("div");
      control.className = "setting-control";
      row.appendChild(control);

      if (setting.description) {
        const desc = document.createElement("div");
        desc.className = "setting-description";
        desc.textContent = setting.description;
        row.appendChild(desc);
      }

      const refresh = function () { self.syncSettingRow(setting, control); };

      if (setting.type === "button") {
        setting.options.forEach(function (option) {
          const btn = document.createElement("button");
          btn.className = "option";
          btn.dataset.value = option;
          btn.textContent = option;
          btn.addEventListener("click", function () {
            MT.Config.set(setting.configKey, option);
            self.afterSettingChange(setting);
            refresh();
            self.syncAll();
          });
          control.appendChild(btn);
        });
      } else if (setting.type === "toggle") {
        const toggle = document.createElement("button");
        toggle.className = "toggle";
        toggle.innerHTML = '<span class="knob"></span>';
        toggle.addEventListener("click", function () {
          MT.Config.set(setting.configKey, !cfg()[setting.configKey]);
          self.afterSettingChange(setting);
          refresh();
          self.syncAll();
        });
        control.appendChild(toggle);
      } else if (setting.type === "range") {
        const range = document.createElement("input");
        range.type = "range";
        range.min = setting.min;
        range.max = setting.max;
        range.step = setting.step;
        range.value = cfg()[setting.configKey];
        const value = document.createElement("span");
        value.className = "range-value";
        range.addEventListener("input", function () {
          MT.Config.set(setting.configKey, Number(range.value));
          value.textContent = range.value + (setting.unit || "");
          self.afterSettingChange(setting);
        });
        control.appendChild(range);
        control.appendChild(value);
        value.textContent = range.value + (setting.unit || "");
      } else if (setting.type === "text") {
        const input = document.createElement("input");
        input.className = "text-input";
        input.type = "text";
        input.value = cfg()[setting.configKey];
        input.addEventListener("change", function () {
          MT.Config.set(setting.configKey, input.value.trim() || "Roboto Mono");
          self.afterSettingChange(setting);
          self.syncAll();
        });
        control.appendChild(input);
      } else if (setting.type === "theme") {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.id = "settingsThemeButton";
        btn.addEventListener("click", function () { self.openThemeDropdown(btn); });
        control.appendChild(btn);
      } else if (setting.type === "custom-theme") {
        const swatch = document.createElement("div");
        swatch.className = "swatch-dots";
        swatch.style.display = "flex";
        control.appendChild(swatch);
        ["bg", "main", "caret", "sub", "subAlt", "text", "error", "errorExtra", "colorfulError", "colorfulErrorExtra"].forEach(function (key) {
          const input = document.createElement("input");
          input.type = "color";
          input.title = key;
          input.style.cssText = "width:1.6rem;height:1.6rem;border:none;background:none;cursor:pointer;padding:0";
          input.value = cfg().customTheme[key] || "#000000";
          input.addEventListener("change", function () {
            const custom = Object.assign({}, cfg().customTheme);
            custom[key] = input.value;
            MT.Config.set("customTheme", custom);
            if (cfg().theme !== "custom") MT.Config.set("theme", "custom");
            MT.Config.apply();
            self.syncAll();
          });
          swatch.appendChild(input);
        });
      } else if (setting.type === "action") {
        const btn = document.createElement("button");
        btn.className = "button" + (setting.danger ? " danger-button" : "");
        btn.textContent = setting.configKey === "resetSettings" ? "reset settings" : "delete everything";
        btn.addEventListener("click", function () {
          if (setting.configKey === "resetSettings") {
            MT.Config.reset();
            MT.Config.apply();
            self.renderSettings();
            self.syncAll();
            self.notify("settings reset");
          } else {
            if (confirm("Delete every stored result, personal best and setting?")) {
              MT.Store.clear();
              MT.Config.reset();
              MT.Config.apply();
              self.renderSettings();
            self.syncAll();
              self.notify("all local data deleted");
            }
          }
        });
        control.appendChild(btn);
      }

      this.syncSettingRow(setting, control);
      return row;
    },

    syncSettingRow: function (setting, control) {
      const c = cfg();
      if (setting.type === "button") {
        control.querySelectorAll(".option").forEach(function (btn) {
          btn.classList.toggle("active", String(c[setting.configKey]) === btn.dataset.value);
        });
      } else if (setting.type === "toggle") {
        const toggle = control.querySelector(".toggle");
        if (toggle) toggle.classList.toggle("on", !!c[setting.configKey]);
      } else if (setting.type === "range") {
        const range = control.querySelector("input[type=range]");
        const value = control.querySelector(".range-value");
        if (range && String(range.value) !== String(c[setting.configKey])) {
          range.value = c[setting.configKey];
        }
        if (value) value.textContent = c[setting.configKey] + (setting.unit || "");
      } else if (setting.type === "text") {
        const input = control.querySelector(".text-input");
        if (input && document.activeElement !== input) input.value = c[setting.configKey];
      } else if (setting.type === "theme") {
        const btn = control.querySelector("button");
        if (btn) {
          const theme = MT.getTheme(c.theme, c.customTheme);
          btn.innerHTML = '<span class="swatch-dots">' +
            MT.themeSwatch(theme).map(function (color) {
              return '<i style="background:' + color + '"></i>';
            }).join("") + "</span> " + c.theme;
        }
      }
    },

    afterSettingChange: function (setting) {
      MT.Config.apply();
      if (setting.configKey === "keymapLayout" || setting.configKey === "keymapStyle" || setting.configKey === "showKeyTips") {
        MT.Config.apply();
      }
      if (setting.configKey === "soundOnClick" && cfg().soundOnClick !== "off") {
        MT.Sound.unlock();
        MT.Sound.preview(cfg().soundOnClick);
      }
    },

    /* -------------------------------------------------------------- */
    /* profile page                                                   */
    /* -------------------------------------------------------------- */
    renderProfile: function () {
      const container = document.getElementById("profileContent");
      if (!container) return;
      const self = this;
      const results = MT.Store.results;

      container.innerHTML = "";

      const totalTime = results.reduce(function (a, r) { return a + (r.duration || 0); }, 0);
      const avgWpm = results.length
        ? results.slice(-10).reduce(function (a, r) { return a + r.wpm; }, 0) / Math.min(10, results.length)
        : 0;
      const avgAcc = results.length
        ? results.slice(-10).reduce(function (a, r) { return a + r.acc; }, 0) / Math.min(10, results.length)
        : 0;

      const cards = [
        { label: "tests completed", value: results.length },
        { label: "highest wpm", value: Math.round(MT.Store.bestWpm()) },
        { label: "average wpm", value: Math.round(avgWpm) },
        { label: "average accuracy", value: Math.round(avgAcc) + "%" },
        { label: "time typing", value: self.formatTime(totalTime) },
      ];

      const cardsEl = document.createElement("div");
      cardsEl.className = "profile-cards";
      cards.forEach(function (card) {
        const el = document.createElement("div");
        el.className = "profile-card";
        el.innerHTML = '<div class="pc-label">' + card.label + '</div><div class="pc-value">' + card.value + "</div>";
        cardsEl.appendChild(el);
      });
      container.appendChild(cardsEl);

      /* chart */
      const chartSection = document.createElement("div");
      chartSection.className = "profile-section";
      chartSection.innerHTML = "<h2>progress</h2>";
      const chartHost = document.createElement("div");
      chartSection.appendChild(chartHost);
      container.appendChild(chartSection);

      const recent = results.slice(-50);
      if (recent.length >= 2) {
        MT.Chart.render(chartHost, {
          xLabels: recent.map(function (r) { return self.formatDate(r.timestamp); }),
          lines: [
            { name: "wpm", color: "var(--main-color)", values: recent.map(function (r) { return r.wpm; }), fill: true },
            { name: "raw", color: "var(--sub-color)", values: recent.map(function (r) { return r.raw; }), width: 1.5 },
          ],
          bars: { name: "errors", color: "var(--error-color)", values: recent.map(function (r) { return (r.chars && r.chars.incorrect) || 0; }) },
          height: 220,
          startAtZero: cfg().startGraphsAtZero,
          yUnit: " wpm",
        });
      } else {
        chartHost.innerHTML = '<p class="empty-note">complete a couple of tests and your progress will be charted here</p>';
      }

      /* recent results table */
      const tableSection = document.createElement("div");
      tableSection.className = "profile-section";
      tableSection.innerHTML = "<h2>recent tests</h2>";

      if (!results.length) {
        const note = document.createElement("p");
        note.className = "empty-note";
        note.textContent = "no tests yet — head to the test page and start typing";
        tableSection.appendChild(note);
      } else {
        const best = MT.Store.bestWpm();
        const table = document.createElement("table");
        table.className = "result-table";
        table.innerHTML =
          "<thead><tr>" +
          "<th>when</th><th>test</th><th class='num'>wpm</th><th class='num'>raw</th>" +
          "<th class='num'>acc</th><th class='num'>consistency</th><th class='num'>chars</th>" +
          "</tr></thead>";
        const tbody = document.createElement("tbody");
        results.slice(-40).reverse().forEach(function (r) {
          const tr = document.createElement("tr");
          const chars = r.chars || { correct: 0, incorrect: 0, extra: 0, missed: 0 };
          tr.innerHTML =
            "<td>" + esc(self.formatWhen(r.timestamp)) + "</td>" +
            "<td>" + esc(self.testTypeLabel(r)) + "</td>" +
            '<td class="num' + (r.wpm === best ? " best" : "") + '">' + Math.round(r.wpm) + "</td>" +
            '<td class="num">' + Math.round(r.raw) + "</td>" +
            '<td class="num">' + Math.round(r.acc) + "%</td>" +
            '<td class="num">' + Math.round(r.consistency) + "%</td>" +
            '<td class="num">' + chars.correct + "/" + chars.incorrect + "/" + chars.extra + "/" + chars.missed + "</td>";
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableSection.appendChild(table);
      }

      container.appendChild(tableSection);

      /* personal bests */
      const pbSection = document.createElement("div");
      pbSection.className = "profile-section";
      pbSection.innerHTML = "<h2>personal bests</h2>";
      const pbKeys = Object.keys(MT.Store.pbs);
      if (!pbKeys.length) {
        const note = document.createElement("p");
        note.className = "empty-note";
        note.textContent = "personal bests appear here once you finish a test";
        pbSection.appendChild(note);
      } else {
        const table = document.createElement("table");
        table.className = "result-table";
        table.innerHTML = "<thead><tr><th>test</th><th class='num'>wpm</th><th class='num'>acc</th><th>set</th></tr></thead>";
        const tbody = document.createElement("tbody");
        pbKeys.sort().forEach(function (key) {
          const pb = MT.Store.pbs[key];
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" + esc(key.split("|").join("  ·  ")) + "</td>" +
            '<td class="num best">' + Math.round(pb.wpm) + "</td>" +
            '<td class="num">' + Math.round(pb.acc) + "%</td>" +
            "<td>" + esc(self.formatWhen(pb.timestamp)) + "</td>";
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        pbSection.appendChild(table);
      }
      container.appendChild(pbSection);
    },

    testTypeLabel: function (r) {
      let value = r.modeValue;
      if (r.mode === "time") value = value + "s";
      else if (r.mode === "words") value = value + "w";
      return r.mode + " " + value + (r.punctuation ? " +p" : "") + (r.numbers ? " +n" : "") +
        (r.funbox && r.funbox !== "none" ? " " + r.funbox : "");
    },

    formatTime: function (seconds) {
      seconds = Math.round(seconds);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (h) return h + "h " + m + "m";
      if (m) return m + "m " + s + "s";
      return s + "s";
    },

    formatWhen: function (timestamp) {
      const d = new Date(timestamp);
      const now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (sameDay) return "today " + time;
      const yesterday = new Date(now.getTime() - 86400000);
      if (d.toDateString() === yesterday.toDateString()) return "yesterday " + time;
      return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
    },

    formatDate: function (timestamp) {
      return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
    },

    /* -------------------------------------------------------------- */
    /* results                                                        */
    /* -------------------------------------------------------------- */
    showResult: function (result) {
      const self = this;
      const els = MT.Typing.els;
      const c = cfg();

      els.wrapper.style.display = "none";
      els.wrapper.hidden = true;
      const configBar = document.getElementById("configBar");
      if (configBar) configBar.style.display = "none";
      if (els.liveStats) els.liveStats.style.visibility = "hidden";
      if (els.caret) els.caret.style.display = "none";
      if (els.timerBar) els.timerBar.classList.remove("shown");
      document.body.classList.remove("typing");

      const chars = result.chars;
      const failNote = result.failed
        ? '<div class="result-pb" style="color:var(--error-color)">failed the minimum you set for yourself</div>'
        : result.isPb
          ? '<div class="result-pb">\u2605 new personal best</div>'
          : "";

      els.result.hidden = false;
      els.result.innerHTML =
        '<div class="result-left">' +
          '<div class="result-big">' +
            '<div class="stat"><div class="stat-value">' + Math.round(result.wpm) + '</div><div class="stat-label">wpm</div></div>' +
            '<div class="stat"><div class="stat-value">' + Math.round(result.acc) + '%</div><div class="stat-label">acc</div></div>' +
          "</div>" +
          failNote +
          '<div class="result-small">' +
            '<div class="stat"><div class="stat-value">' + Math.round(result.raw) + '</div><div class="stat-label">raw</div></div>' +
            '<div class="stat"><div class="stat-value">' + Math.round(result.consistency) + '%</div><div class="stat-label">consistency</div></div>' +
            '<div class="stat"><div class="stat-value">' + result.burst + '</div><div class="stat-label">burst</div></div>' +
            '<div class="stat"><div class="stat-value">' + chars.correct + "/" + chars.incorrect + "/" + chars.extra + "/" + chars.missed +
              '</div><div class="stat-label">characters</div></div>' +
          "</div>" +
          '<div class="result-meta">' +
            "<span>test type&nbsp; <b>" + esc(this.testTypeLabel(result)) + "</b>" + (result.languageLabel ? "  ·  " + esc(result.languageLabel) : "") + "</span>" +
            "<span>time&nbsp; <b>" + result.duration + "s</b>" + (result.quote ? "  ·  " + esc(result.quote) : "") + "</span>" +
          "</div>" +
          '<div class="result-buttons">' +
            '<button class="button primary" id="resultNext">next test</button>' +
            '<button class="button" id="resultRepeat">repeat test</button>' +
          "</div>" +
        "</div>" +
        '<div class="result-right"><div id="resultChart"></div></div>' +
        '<div class="words-history" id="resultWords" hidden></div>';

      document.getElementById("resultNext").addEventListener("click", function () {
        MT.Typing.nextTest();
      });
      document.getElementById("resultRepeat").addEventListener("click", function () {
        MT.Typing.repeatTest();
      });

      const chartHost = document.getElementById("resultChart");
      const history = result.history || [];
      if (history.length >= 2) {
        MT.Chart.render(chartHost, {
          xLabels: history.map(function (h, i) { return String(i + 1); }),
          lines: [
            { name: "wpm", color: "var(--main-color)", values: history.map(function (h) { return h.wpm; }), fill: true },
            { name: "raw", color: "var(--sub-color)", values: history.map(function (h) { return h.raw; }), width: 1.5 },
          ],
          bars: { name: "errors", color: "var(--error-color)", values: history.map(function (h) { return h.errors; }) },
          height: 210,
          startAtZero: c.startGraphsAtZero,
          yUnit: " wpm",
        });
      } else {
        chartHost.innerHTML = '<p class="empty-note">too short for a chart</p>';
      }

      if (c.alwaysShowWordsHistory && !c.blindMode && c.confidenceMode !== "max") {
        const host = document.getElementById("resultWords");
        host.hidden = false;
        host.innerHTML = this.buildWordsHistoryHTML();
      }

      this.syncAll();
    },

    buildWordsHistoryHTML: function () {
      const T = MT.Typing;
      const parts = [];
      for (let i = 0; i < T.words.length; i++) {
        const typed = T.input[i] || [];
        if (typed.length === 0 && i > T.activeIndex) break;
        const good = T.wordIsFullyCorrect(i);
        parts.push('<span class="w' + (good ? "" : " bad") + '">' + esc(typed.join("") || T.words[i]) + "</span>");
      }
      return parts.join(" ");
    },

    /* -------------------------------------------------------------- */
    /* notifications                                                  */
    /* -------------------------------------------------------------- */
    notify: function (message) {
      const el = document.getElementById("notification");
      el.textContent = message;
      el.hidden = false;
      clearTimeout(notifyTimer);
      notifyTimer = setTimeout(function () { el.hidden = true; }, 2200);
    },

    onTestStart: function () {
      const c = cfg();
      if (c.focusMode) document.body.classList.add("typing");
      const els = MT.Typing.els;
      if (c.caretStyle !== "off") els.caret.style.display = "";
      if (els.liveStats) els.liveStats.style.visibility = "visible";
      MT.Typing.updateLiveStats();
    },

    /* -------------------------------------------------------------- */
    /* full refresh                                                   */
    /* -------------------------------------------------------------- */
    syncAll: function () {
      MT.Config.apply();
      this.updateConfigBar();
      const themeBtn = document.getElementById("settingsThemeButton");
      if (themeBtn) {
        const c = cfg();
        const theme = MT.getTheme(c.theme, c.customTheme);
        themeBtn.innerHTML = '<span class="swatch-dots">' +
          MT.themeSwatch(theme).map(function (color) {
            return '<i style="background:' + color + '"></i>';
          }).join("") + "</span> " + c.theme;
      }
      if (MT.Commands.isOpen()) {
        const btn = document.getElementById("commandButton");
        if (btn) btn.classList.add("active");
      }
    },
  };
})();
