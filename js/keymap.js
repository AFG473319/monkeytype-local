/* =====================================================================
   On-screen keymap: layout data, rendering and live highlighting.
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});

  MT.layouts = {
    qwerty: {
      name: "qwerty",
      rows: ["`1234567890-=", "qwertyuiop[]\\", "asdfghjkl;'", "zxcvbnm,./"],
    },
    dvorak: {
      name: "dvorak",
      rows: ["`1234567890[]", "',.pyfgcrl/=\\", "aoeuidhtns-", ";qjkxbmwvz"],
    },
    colemak: {
      name: "colemak",
      rows: ["`1234567890-=", "qwfpgjluy;[]", "arstdhneio'", "zxcvbkm,./"],
    },
    workman: {
      name: "workman",
      rows: ["`1234567890-=", "qdrwbjfup;[]", "ashtgyneoi'", "zxmcvkl,./"],
    },
  };

  /* shifted variants so capital letters and symbols light the right key */
  const shiftMap = {
    "~": "`", "!": "1", "@": "2", "#": "3", "$": "4", "%": "5", "^": "6",
    "&": "7", "*": "8", "(": "9", ")": "0", "_": "-", "+": "=",
    "{": "[", "}": "]", "|": "\\", ":": ";", '"': "'", "<": ",", ">": ".", "?": "/",
  };

  const keyWidths = { space: "space" };

  function normalize(ch) {
    if (!ch) return null;
    if (ch === " ") return "space";
    if (shiftMap[ch]) return shiftMap[ch];
    if (ch.length === 1 && ch >= "A" && ch <= "Z") return ch.toLowerCase();
    return ch;
  }

  MT.Keymap = {
    container: null,
    keys: {},
    heat: {},
    layout: "qwerty",
    style: "staggered",
    showTips: true,
    visible: false,

    init: function (container) {
      this.container = container;
    },

    setLayout: function (layout) {
      this.layout = MT.layouts[layout] ? layout : "qwerty";
      this.render();
    },

    setStyle: function (style) {
      this.style = style;
      this.render();
    },

    render: function () {
      if (!this.container) return;
      const layout = MT.layouts[this.layout] || MT.layouts.qwerty;
      this.container.innerHTML = "";
      this.container.classList.toggle("heat", this.style === "map");
      this.keys = {};

      const frag = document.createDocumentFragment();

      layout.rows.forEach(function (row, rowIndex) {
        const rowEl = document.createElement("div");
        rowEl.className = "keymap-row";
        if (this.style === "staggered") rowEl.classList.add("row-" + rowIndex);
        if (this.style === "split") rowEl.classList.add("row-" + rowIndex);
        rowEl.dataset.row = rowIndex;

        const chars = row.split("");
        const mid = Math.ceil(chars.length / 2);

        chars.forEach(function (ch, i) {
          if (this.style === "split" && i === mid) {
            const gap = document.createElement("div");
            gap.className = "keymap-gap";
            rowEl.appendChild(gap);
          }
          const key = document.createElement("div");
          key.className = "keymap-key";
          key.dataset.key = ch;
          if (this.showTips) key.textContent = ch;
          const label = document.createElement("span");
          label.className = "heat-label";
          label.textContent = "";
          key.appendChild(label);
          rowEl.appendChild(key);
          this.keys[ch] = key;
        }, this);

        frag.appendChild(rowEl);
      }, this);

      const spaceRow = document.createElement("div");
      spaceRow.className = "keymap-row space-row";
      const spaceKey = document.createElement("div");
      spaceKey.className = "keymap-key space";
      spaceKey.dataset.key = "space";
      if (this.showTips) spaceKey.textContent = "space";
      const spaceLabel = document.createElement("span");
      spaceLabel.className = "heat-label";
      spaceKey.appendChild(spaceLabel);
      spaceRow.appendChild(spaceKey);
      this.keys["space"] = spaceKey;
      frag.appendChild(spaceRow);

      this.container.appendChild(frag);
      this.applyHeat();
    },

    highlight: function (ch) {
      const key = this.keys[normalize(ch)];
      if (key) key.classList.add("active");
    },

    unhighlight: function (ch) {
      const key = this.keys[normalize(ch)];
      if (key) key.classList.remove("active");
    },

    releaseAll: function () {
      Object.keys(this.keys).forEach(function (k) {
        this.keys[k].classList.remove("active", "pressed-wrong");
      }, this);
    },

    recordPress: function (ch, correct) {
      const key = normalize(ch);
      if (!key || !this.keys[key]) return;
      if (!this.heat[key]) this.heat[key] = { total: 0, wrong: 0 };
      this.heat[key].total++;
      if (!correct) this.heat[key].wrong++;
      const el = this.keys[key];
      el.classList.add("active");
      if (!correct) el.classList.add("pressed-wrong");
      else el.classList.remove("pressed-wrong");
      clearTimeout(el._pressTimer);
      el._pressTimer = setTimeout(function () {
        el.classList.remove("active");
      }, 110);
      this.applyHeat();
    },

    applyHeat: function () {
      if (this.style !== "map") return;
      const keys = this.keys;
      Object.keys(keys).forEach(function (k) {
        const stat = this.heat[k];
        const label = keys[k].querySelector(".heat-label");
        if (!stat || stat.total === 0) {
          keys[k].style.background = "";
          if (label) label.textContent = "";
          return;
        }
        const correct = stat.total - stat.wrong;
        const ratio = stat.wrong / stat.total;
        /* blend from sub-alt toward error depending on error rate */
        const color = ratio === 0
          ? "var(--sub-color)"
          : "color-mix(in srgb, var(--error-color) " + Math.round(30 + ratio * 70) + "%, var(--sub-alt-color))";
        keys[k].style.background = color;
        if (label) label.textContent = correct;
      }, this);
    },

    resetHeat: function () {
      this.heat = {};
      Object.keys(this.keys).forEach(function (k) {
        this.keys[k].style.background = "";
        const label = this.keys[k].querySelector(".heat-label");
        if (label) label.textContent = "";
      }, this);
    },
  };
})();
