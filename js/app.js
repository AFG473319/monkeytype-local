/* =====================================================================
   Bootstrap. Everything starts here.
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});
  let booted = false;

  function boot() {
    if (booted) return;
    booted = true;

    /* 1. configuration and stored results */
    MT.Config.load();
    MT.Store.loadResults();

    /* 2. subsystems */
    MT.Keymap.init(document.getElementById("keymap"));
    MT.Commands.init();
    MT.Typing.init();
    MT.UI.init();

    /* 3. paint the theme */
    MT.Config.apply();

    /* 4. route from the hash, then start the first test */
    const hash = (location.hash || "").replace("#", "");
    if (hash) MT.UI.showPage(hash);

    MT.Typing.load(false);

    /* 5. smaller niceties ------------------------------------------------ */

    /* browsers block audio until a gesture; unlock on the first click */
    const unlock = function () {
      MT.Sound.unlock();
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("keydown", unlock);

    /* hash routing for back / forward */
    window.addEventListener("hashchange", function () {
      MT.UI.showPage((location.hash || "#test").replace("#", ""));
    });

    /* keep the caret honest when the window is not focused during a test */
    const oof = document.getElementById("outOfFocus");
    window.addEventListener("blur", function () {
      if (oof && MT.Typing.started && !MT.Typing.finished) oof.hidden = false;
    });
    window.addEventListener("focus", function () {
      if (oof) oof.hidden = true;
    });

    /* charts are drawn in pixels, so redraw them if the window changes size */
    let resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!document.getElementById("result").hidden && MT.Typing.result) {
          MT.UI.showResult(MT.Typing.result);
        }
        if (MT.UI.page === "profile") MT.UI.renderProfile();
      }, 220);
    });

    /* mobile: tapping the typing area should raise the on-screen keyboard */
    document.getElementById("wordsWrapper").addEventListener("touchend", function () {
      MT.Typing.focusInput();
    });

    document.title = "monkeytype";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
