/* =====================================================================
   Theme definitions.
   Each theme is the same ten-colour shape monkeytype uses:
     bg, main, caret, sub, subAlt, text, error, errorExtra,
     colorfulError, colorfulErrorExtra
   These palettes are recreations of well-known colour schemes (Dracula,
   Nord, Solarized, Monokai, etc.) plus originals in the monkeytype
   spirit. They are data, not anyone's copyrighted code.
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});

  function t(name, bg, main, caret, sub, subAlt, text, error, errorExtra, cErr, cErrExtra, light) {
    return {
      name: name,
      bg: bg, main: main, caret: caret, sub: sub, subAlt: subAlt, text: text,
      error: error, errorExtra: errorExtra,
      colorfulError: cErr || error, colorfulErrorExtra: cErrExtra || errorExtra,
      light: !!light,
    };
  }

  MT.themeList = [
    t("serika_dark",     "#323437", "#e2b714", "#e2b714", "#646669", "#2c2e31", "#d1d0c5", "#ca4754", "#7e2a33"),
    t("serika",          "#e1e1e3", "#e2b714", "#e2b714", "#aaaeb3", "#d1d3d8", "#323437", "#ca4754", "#7e2a33", null, null, true),
    t("8008",            "#333a45", "#f44c7f", "#f44c7f", "#939eae", "#2b313b", "#e9ecf0", "#da3333", "#791717", "#f44c7f", "#a01f4e"),
    t("alduin",          "#1c1c1c", "#dfd5b3", "#dfd5b3", "#5f5f5f", "#101010", "#ede6d4", "#c95b5b", "#6b2a2a"),
    t("aurora",          "#011926", "#00e980", "#00e980", "#245c69", "#000c13", "#e0f5f8", "#b94da1", "#621946", "#00e980", "#00a35a"),
    t("blues",           "#d8e4ef", "#26619c", "#26619c", "#7f9bb5", "#c2d4e4", "#1a2b3c", "#c0392b", "#82261c", null, null, true),
    t("botanical",       "#7b9c98", "#224d43", "#224d43", "#3f615c", "#63827e", "#1a2f2a", "#ff6b6b", "#a33b3b", "#ff6b6b", "#a33b3b"),
    t("carbon",          "#313131", "#f66e0d", "#f66e0d", "#616161", "#2a2a2a", "#f5e6c8", "#e72d2d", "#7e2323", "#f66e0d", "#f5e6c8"),
    t("chainglass",      "#141221", "#fd77d7", "#dde5ed", "#504869", "#0b0914", "#e0e0f0", "#fd77d7", "#e6b2d4", "#df46ac", "#a91a6b"),
    t("cyberspace",      "#181c18", "#00ce7c", "#00ce7c", "#9578d3", "#131613", "#c2fbe1", "#ff5f5f", "#8a2b2b"),
    t("dark",            "#111111", "#eeeeee", "#eeeeee", "#444444", "#1b1b1b", "#eeeeee", "#da3333", "#791717"),
    t("dark_note",       "#1f1f1f", "#f2c17b", "#f2c17b", "#4b4b4b", "#181818", "#e5e5e5", "#e58a8a", "#8a4b4b"),
    t("dracula",         "#282a36", "#bd93f9", "#f8f8f2", "#6272a4", "#20222c", "#f8f8f2", "#ff5555", "#a32b2b", "#ff79c6", "#8a2b58"),
    t("frozen_llama",    "#1e2c3c", "#7fd4f0", "#7fd4f0", "#4a6a85", "#16212c", "#dceaf5", "#e06c8b", "#8a3247"),
    t("future_funk",     "#2e1a47", "#f7f2ea", "#c18fff", "#c9b8e0", "#251539", "#b3a4c4", "#ff3d81", "#a31f4f", "#ff3d81", "#ff8fc0"),
    t("gb",              "#0f1c0f", "#7ac74f", "#7ac74f", "#3f5c33", "#142413", "#d9f0c9", "#e04a4a", "#8a2b2b"),
    t("github_dark",     "#0d1117", "#58a6ff", "#58a6ff", "#8b949e", "#161b22", "#c9d1d9", "#f85149", "#8b2b26"),
    t("honey",           "#f7e7c1", "#b3711b", "#b3711b", "#a8946a", "#ecdcb6", "#4a3a20", "#c0392b", "#7a2318", null, null, true),
    t("laser",           "#1a1a2e", "#f02e8f", "#f02e8f", "#5c5c8a", "#12122a", "#e6e6ff", "#ff4d4d", "#8a1f1f", "#f02e8f", "#ff8fc0"),
    t("lavender",        "#f1edf9", "#6d4ea8", "#6d4ea8", "#a99cc4", "#e4dcf3", "#33265a", "#c0392b", "#7a2318", null, null, true),
    t("matrix",          "#000000", "#15ff00", "#15ff00", "#006500", "#032000", "#d1ffcd", "#ff0000", "#7a0000", "#15ff00", "#d1ffcd"),
    t("metro",           "#f2f2f2", "#545454", "#545454", "#a8a8a8", "#e3e3e3", "#333333", "#d64545", "#8a2b2b", null, null, true),
    t("mint",            "#05385b", "#5cdb95", "#5cdb95", "#20688a", "#032c47", "#eafcf6", "#f35588", "#8a2b4a", "#f35588", "#ff9cc0"),
    t("modern_dolch",    "#2d2f3b", "#a5b1ff", "#a5b1ff", "#5a5f78", "#242632", "#e8ecff", "#ff6b8a", "#8a2b40"),
    t("monokai",         "#272822", "#a6e22e", "#a6e22e", "#75715e", "#1e1f1c", "#f8f8f2", "#f92672", "#8f1f45", "#f92672", "#ae81ff"),
    t("moonlight",       "#191f28", "#b6c6de", "#b6c6de", "#4b5b70", "#141a21", "#dbe4f0", "#ff5f5f", "#8a2b2b"),
    t("ms_cake",         "#f6e6e8", "#bb6b8a", "#bb6b8a", "#b393a0", "#ecdadd", "#4a2b35", "#c0392b", "#7a2318", null, null, true),
    t("night_owl",       "#011627", "#c792ea", "#80a4c2", "#4b6479", "#001220", "#d6deeb", "#ef5350", "#8a2b2b", "#ffcb8b", "#c792ea"),
    t("nord",            "#2e3440", "#88c0d0", "#88c0d0", "#4c566a", "#272c36", "#d8dee9", "#bf616a", "#7d2f35", "#ebcb8b", "#bf616a"),
    t("oblivion",        "#1c1f26", "#b3b8c8", "#b3b8c8", "#5a6070", "#151820", "#dfe3ee", "#ff6b6b", "#8a2b2b"),
    t("ocean",           "#1b4b5a", "#7ee0d0", "#7ee0d0", "#2f7183", "#123844", "#e6f7f5", "#ff7b7b", "#8a2b2b"),
    t("olivia",          "#241f22", "#f2c4c8", "#f2c4c8", "#6b5d63", "#1b171a", "#f5eaec", "#d97b8e", "#8a3b48"),
    t("paper",           "#e8e5d8", "#4a4a4a", "#4a4a4a", "#9a9686", "#ddd9c8", "#3b3b3b", "#c04b4b", "#7a2b2b", null, null, true),
    t("peaches",         "#f6e0d4", "#d16a6a", "#d16a6a", "#b09a92", "#ecd2c4", "#4a2f2f", "#c0392b", "#7a2318", null, null, true),
    t("pinky",           "#2b2228", "#ff8ac4", "#ff8ac4", "#6e5a66", "#211a1f", "#ffeef6", "#ff5f7e", "#8a2b40"),
    t("purple",          "#241b2f", "#a17fd6", "#a17fd6", "#5f5275", "#1b1424", "#e8ddff", "#ff6b8a", "#8a2b40"),
    t("red_samurai",     "#1e1a1a", "#f07b5b", "#f07b5b", "#6b5450", "#161313", "#f5e5e0", "#d1462f", "#7a2318"),
    t("rose_pine",       "#191724", "#ebbcba", "#ebbcba", "#6e6a86", "#1f1d2e", "#e0def4", "#eb6f92", "#8a2b48", "#f6c177", "#eb6f92"),
    t("royal",           "#2d2b4a", "#a594ff", "#a594ff", "#5c5880", "#232140", "#ecebff", "#ff6b8a", "#8a2b40"),
    t("sonokai",         "#2c2e34", "#9ed072", "#9ed072", "#7f8490", "#23262b", "#e2e2e3", "#fc5d7c", "#8a2b3f", "#76cce0", "#fc5d7c"),
    t("solarized_dark",  "#002b36", "#859900", "#859900", "#586e75", "#00222b", "#93a1a1", "#dc322f", "#822217", "#b58900", "#cb4b16"),
    t("solarized_light", "#fdf6e3", "#859900", "#859900", "#93a1a1", "#eee8d5", "#586e75", "#dc322f", "#822217", null, null, true),
    t("strawberry",      "#2b1b23", "#ff5d8f", "#ff5d8f", "#6e4a58", "#211319", "#ffe9f0", "#ff7b7b", "#8a2b2b"),
    t("sunset",          "#2b1b2b", "#ff9a5c", "#ff9a5c", "#6b4f66", "#20131f", "#ffe9d6", "#ff5f7e", "#8a2b40"),
    t("taro",            "#b3a0c9", "#3f3447", "#3f3447", "#5d4f6b", "#a591bd", "#2a2230", "#8a2b40", "#4a1622"),
    t("terminal",        "#191919", "#00ff9c", "#00ff9c", "#3f6f5c", "#101010", "#d0ffe9", "#ff5f5f", "#8a2b2b"),
    t("tron_orange",     "#0d0d0d", "#ff8c1a", "#ff8c1a", "#5c4326", "#050505", "#ffdfb0", "#ff3d00", "#8a2100", "#ff8c1a", "#ffdfb0"),
    t("vscode",          "#1e1e1e", "#007acc", "#007acc", "#858585", "#252526", "#d4d4d4", "#f44747", "#8a2b2b", "#dcdcaa", "#ce9178"),
    t("watermelon",      "#1f1a1a", "#ff6b81", "#ff6b81", "#6b4a52", "#161111", "#ffe9ec", "#ff3b5c", "#8a1f30"),
    t("waves",           "#1b2b3a", "#5ec8f0", "#5ec8f0", "#43607a", "#132030", "#e2f1fa", "#ff7b7b", "#8a2b2b"),
    t("magic_girl",      "#1f1a2b", "#ff8ad8", "#ff8ad8", "#5f4a70", "#171223", "#ffe6f8", "#7b8cff", "#3f4a8a"),
  ];

  MT.themes = {};
  MT.themeList.forEach(function (theme) { MT.themes[theme.name] = theme; });

  MT.themeOrder = MT.themeList.map(function (x) { return x.name; });

  /* Fallback custom theme — user editable in settings */
  MT.defaultCustomTheme = {
    name: "custom",
    bg: "#1a1a1a", main: "#7fd4f0", caret: "#7fd4f0", sub: "#555555",
    subAlt: "#101010", text: "#dddddd", error: "#ca4754", errorExtra: "#7e2a33",
    colorfulError: "#ca4754", colorfulErrorExtra: "#7e2a33",
  };

  MT.getTheme = function (name, custom) {
    if (name === "custom") return custom || MT.defaultCustomTheme;
    return MT.themes[name] || MT.themes.serika_dark;
  };

  /* theme "map" for the 3-dot swatch previews */
  MT.themeSwatch = function (theme) {
    return [theme.bg, theme.main, theme.text];
  };
})();
