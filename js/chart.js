/* =====================================================================
   A small dependency-free SVG line/bar chart with a hover tooltip.
   Used by the results screen and by the profile page.
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});
  const SVGNS = "http://www.w3.org/2000/svg";

  function el(tag, attrs) {
    const node = document.createElementNS(SVGNS, tag);
    if (attrs) {
      for (const k in attrs) {
        if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      }
    }
    return node;
  }

  function niceMax(value) {
    if (!isFinite(value) || value <= 0) return 10;
    const pow = Math.pow(10, Math.floor(Math.log10(value)));
    const n = value / pow;
    let nice;
    if (n <= 1) nice = 1;
    else if (n <= 1.5) nice = 1.5;
    else if (n <= 2) nice = 2;
    else if (n <= 3) nice = 3;
    else if (n <= 5) nice = 5;
    else if (n <= 7.5) nice = 7.5;
    else nice = 10;
    return nice * pow;
  }

  MT.Chart = {
    /**
     * options = {
     *   xLabels: [string],               // one per data point
     *   lines: [{ name, color, values, fill }],
     *   bars:  { name, color, values },  // drawn on a secondary right axis
     *   height: number,
     *   startAtZero: bool,
     *   yUnit: string
     * }
     */
    render: function (container, options) {
      if (!container) return;
      container.innerHTML = "";
      const data = options.lines && options.lines[0] ? options.lines[0].values : [];
      const n = data.length;

      const width = Math.max(320, container.clientWidth || 640);
      const height = options.height || 200;
      const pad = { top: 16, right: options.bars ? 34 : 12, bottom: 24, left: 36 };
      const plotW = width - pad.left - pad.right;
      const plotH = height - pad.top - pad.bottom;

      const wrap = document.createElement("div");
      wrap.className = "chart-wrap";
      container.appendChild(wrap);

      if (n === 0) {
        wrap.innerHTML = '<p class="empty-note">not enough data to draw a chart yet</p>';
        return;
      }

      const svg = el("svg", { viewBox: "0 0 " + width + " " + height, width: width, height: height });

      /* -------- scales -------- */
      let maxY = 0;
      options.lines.forEach(function (line) {
        line.values.forEach(function (v) { if (v > maxY) maxY = v; });
      });
      if (options.bars) options.bars.values.forEach(function (v) { if (v > maxY) maxY = v; });
      const yMax = niceMax(maxY * 1.08);
      const yMin = options.startAtZero === false ? Math.max(0, maxY * 0.5) : 0;

      let barMax = 1;
      if (options.bars) {
        let peak = 1;
        options.bars.values.forEach(function (v) { if (v > peak) peak = v; });
        barMax = niceMax(Math.max(3, peak));
      }

      const px = function (i) { return pad.left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW); };
      const py = function (v) {
        const clamped = Math.max(yMin, v);
        return pad.top + plotH - ((clamped - yMin) / (yMax - yMin)) * plotH;
      };

      /* -------- grid + y labels -------- */
      const gridGroup = el("g");
      const ySteps = 4;
      for (let i = 0; i <= ySteps; i++) {
        const val = yMin + ((yMax - yMin) * i) / ySteps;
        const y = py(val);
        gridGroup.appendChild(el("line", {
          x1: pad.left, x2: pad.left + plotW, y1: y, y2: y,
          stroke: "var(--sub-alt-color)", "stroke-width": 1,
        }));
        const label = el("text", {
          x: pad.left - 7, y: y + 3, "text-anchor": "end",
          fill: "var(--sub-color)", "font-size": "9", "font-family": "var(--font-family)",
        });
        label.textContent = Math.round(val);
        gridGroup.appendChild(label);
      }
      svg.appendChild(gridGroup);

      /* -------- x labels -------- */
      const xGroup = el("g");
      const shortLabels = !options.xLabels || options.xLabels.every(function (label) {
        return String(label).length <= 3;
      });
      const labelBudget = shortLabels ? 34 : 66;
      const maxLabels = Math.max(2, Math.floor(plotW / labelBudget));
      const labelEvery = Math.max(1, Math.ceil(n / maxLabels));
      for (let i = 0; i < n; i++) {
        const extreme = i === 0 || i === n - 1;
        if (!extreme && i % labelEvery !== 0) continue;
        const label = el("text", {
          x: px(i), y: height - 7,
          "text-anchor": i === 0 ? "start" : i === n - 1 ? "end" : "middle",
          fill: "var(--sub-color)", "font-size": "9", "font-family": "var(--font-family)",
        });
        label.textContent = (options.xLabels && options.xLabels[i] !== undefined) ? options.xLabels[i] : i + 1;
        xGroup.appendChild(label);
      }
      svg.appendChild(xGroup);

      /* -------- error bars -------- */
      if (options.bars && options.bars.values.some(function (v) { return v > 0; })) {
        const barW = Math.max(1.5, Math.min(7, plotW / Math.max(1, n) - 2));
        const bars = el("g");
        options.bars.values.forEach(function (v, i) {
          if (!v) return;
          const h = (v / barMax) * plotH;
          const rect = el("rect", {
            x: px(i) - barW / 2, y: pad.top + plotH - h,
            width: barW, height: Math.max(1.5, h),
            fill: options.bars.color, opacity: 0.45, rx: 1,
          });
          bars.appendChild(rect);
        });
        svg.appendChild(bars);
      }

      /* -------- lines -------- */
      options.lines.forEach(function (line) {
        const pts = line.values.map(function (v, i) { return px(i) + "," + py(v); });
        if (line.fill) {
          const areaPoints = [pad.left + "," + (pad.top + plotH)]
            .concat(pts)
            .concat([px(n - 1) + "," + (pad.top + plotH)])
            .join(" ");
          const gradId = "grad-" + Math.random().toString(36).slice(2, 8);
          const defs = el("defs");
          const grad = el("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1" });
          grad.appendChild(el("stop", { offset: "0%", "stop-color": line.color, "stop-opacity": "0.28" }));
          grad.appendChild(el("stop", { offset: "100%", "stop-color": line.color, "stop-opacity": "0" }));
          defs.appendChild(grad);
          svg.appendChild(defs);
          svg.appendChild(el("polygon", { points: areaPoints, fill: "url(#" + gradId + ")" }));
        }
        svg.appendChild(el("polyline", {
          points: pts.join(" "),
          fill: "none",
          stroke: line.color,
          "stroke-width": line.width || 2,
          "stroke-linejoin": "round",
          "stroke-linecap": "round",
          "vector-effect": "non-scaling-stroke",
        }));
      });

      /* -------- hover layer -------- */
      const hoverLine = el("line", {
        x1: 0, x2: 0, y1: pad.top, y2: pad.top + plotH,
        stroke: "var(--sub-color)", "stroke-width": 1, opacity: 0,
      });
      svg.appendChild(hoverLine);

      const dots = el("g");
      svg.appendChild(dots);

      wrap.appendChild(svg);

      const tooltip = document.createElement("div");
      tooltip.className = "chart-tooltip";
      tooltip.hidden = true;
      wrap.appendChild(tooltip);

      svg.addEventListener("mousemove", function (e) {
        const rect = svg.getBoundingClientRect();
        const scale = rect.width / width;
        const x = (e.clientX - rect.left) / scale;
        let index = Math.round(((x - pad.left) / plotW) * (n - 1));
        index = Math.max(0, Math.min(n - 1, index));

        hoverLine.setAttribute("x1", px(index));
        hoverLine.setAttribute("x2", px(index));
        hoverLine.setAttribute("opacity", 0.5);

        dots.innerHTML = "";
        options.lines.forEach(function (line) {
          dots.appendChild(el("circle", {
            cx: px(index), cy: py(line.values[index]), r: 3,
            fill: line.color, stroke: "var(--bg-color)", "stroke-width": 1.5,
          }));
        });

        const rows = [];
        rows.push('<div class="t-row"><span class="t-key">' +
          ((options.xLabels && options.xLabels[index] !== undefined) ? options.xLabels[index] : index + 1) + "</span><span></span></div>");
        options.lines.forEach(function (line) {
          rows.push('<div class="t-row"><span class="t-key">' + line.name + "</span><span>" +
            Math.round(line.values[index]) + (options.yUnit || "") + "</span></div>");
        });
        if (options.bars) {
          rows.push('<div class="t-row"><span class="t-key">' + options.bars.name + "</span><span>" +
            options.bars.values[index] + "</span></div>");
        }
        tooltip.innerHTML = rows.join("");
        tooltip.hidden = false;
        tooltip.style.left = (px(index) * scale) + "px";
        tooltip.style.top = (py(Math.max.apply(null, options.lines.map(function (l) { return l.values[index]; }))) * scale) + "px";
      });

      svg.addEventListener("mouseleave", function () {
        hoverLine.setAttribute("opacity", 0);
        dots.innerHTML = "";
        tooltip.hidden = true;
      });

      /* -------- legend -------- */
      const legend = document.createElement("div");
      legend.className = "chart-legend";
      const parts = [];
      options.lines.forEach(function (line) {
        parts.push('<span><i class="swatch" style="background:' + line.color + '"></i>' + line.name + "</span>");
      });
      if (options.bars) {
        parts.push('<span><i class="swatch" style="background:' + options.bars.color + '"></i>' + options.bars.name + "</span>");
      }
      legend.innerHTML = parts.join("");
      container.appendChild(legend);
    },
  };
})();
