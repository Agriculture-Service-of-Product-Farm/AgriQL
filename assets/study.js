(function () {
  var canvas = document.getElementById("season");
  var plate = document.getElementById("plate");
  var range = document.getElementById("season-range");
  var label = document.getElementById("stage-label");
  var verdict = document.getElementById("verdict");
  if (!canvas || !plate || !range) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var t = reduce ? 1 : 0;
  var playing = !reduce;
  var startedAt = 0;
  var duration = 7200;
  var reads = plate.parentElement.querySelectorAll("[data-at]");

  function stageName(value) {
    if (value < 0.12) return "Sown";
    if (value < 0.4) return "Emerged";
    if (value < 0.72) return "In leaf";
    return "In flower";
  }

  function sync() {
    var pct = Math.round(t * 100);
    if (document.activeElement !== range) range.value = String(pct);
    range.setAttribute("aria-valuenow", String(pct));
    label.textContent = stageName(t) + " · drawing";
    for (var i = 0; i < reads.length; i++) {
      reads[i].classList.toggle("lit", t >= Number(reads[i].getAttribute("data-at")));
    }
  }

  function draw() {
    var box = plate.getBoundingClientRect();
    var cssW = Math.max(1, box.width);
    var cssH = Math.max(1, box.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var bw = Math.round(cssW * dpr);
    var bh = Math.round(cssH * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    ctx.fillStyle = "#10241c";
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = "rgba(231,240,223,0.12)";
    ctx.lineWidth = 1;
    var step = Math.max(28, Math.round(cssW / 8));
    ctx.beginPath();
    for (var x = step; x < cssW; x += step) {
      ctx.moveTo(x + 0.5, 16);
      ctx.lineTo(x + 0.5, cssH - 16);
    }
    for (var y = step; y < cssH; y += step) {
      ctx.moveTo(16, y + 0.5);
      ctx.lineTo(cssW - 16, y + 0.5);
    }
    ctx.stroke();

    var ground = cssH * 0.82;
    var top = cssH * 0.14;
    var originX = cssW * 0.46;
    var grown = ease(t);

    ctx.fillStyle = "#163028";
    ctx.fillRect(0, ground, cssW, cssH - ground);
    ctx.strokeStyle = "rgba(143,191,120,0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cssW * 0.1, ground);
    ctx.lineTo(cssW * 0.9, ground);
    ctx.stroke();

    ctx.strokeStyle = "rgba(231,240,223,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cssW * 0.12, top);
    ctx.lineTo(cssW * 0.12, ground);
    ctx.stroke();
    for (var mark = 0; mark <= 4; mark++) {
      var my = ground - (ground - top) * (mark / 4);
      ctx.beginPath();
      ctx.moveTo(cssW * 0.1, my);
      ctx.lineTo(cssW * 0.14, my);
      ctx.stroke();
    }

    ctx.fillStyle = "#d7efc8";
    ctx.beginPath();
    ctx.ellipse(originX, ground - 1, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    function pointAt(u) {
      var y = ground - (ground - top) * u;
      var x = originX + Math.sin(u * Math.PI) * cssW * 0.03;
      return [x, y];
    }

    ctx.strokeStyle = "#c6e7b0";
    ctx.lineWidth = Math.max(2, cssW * 0.008);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    var steps = 40;
    for (var i = 0; i <= steps; i++) {
      var u = (i / steps) * grown;
      var p = pointAt(u);
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();

    leaf(ctx, pointAt(0.34), -1, cssW, clamp01((grown - 0.28) / 0.16));
    leaf(ctx, pointAt(0.52), 1, cssW, clamp01((grown - 0.42) / 0.16));
    leaf(ctx, pointAt(0.7), -1, cssW, clamp01((grown - 0.58) / 0.16));

    var tip = pointAt(grown);
    ctx.strokeStyle = "rgba(215,239,200,0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cssW * 0.2, tip[1]);
    ctx.lineTo(cssW * 0.86, tip[1]);
    ctx.stroke();

    var bloom = clamp01((grown - 0.78) / 0.16);
    if (bloom > 0) {
      ctx.globalAlpha = bloom;
      ctx.fillStyle = "#f4f0e6";
      ctx.beginPath();
      ctx.arc(tip[0], tip[1] - 6, 4 + bloom * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function leaf(ctx, at, dir, cssW, amount) {
    if (amount <= 0) return;
    var reach = cssW * 0.16 * amount;
    ctx.save();
    ctx.globalAlpha = Math.min(1, amount + 0.15);
    ctx.fillStyle = dir < 0 ? "#3d9a45" : "#8fbf78";
    ctx.beginPath();
    ctx.moveTo(at[0], at[1]);
    ctx.bezierCurveTo(at[0] + dir * reach * 0.45, at[1] - reach * 0.35, at[0] + dir * reach, at[1] - reach * 0.05, at[0] + dir * reach * 0.92, at[1] + reach * 0.22);
    ctx.bezierCurveTo(at[0] + dir * reach * 0.55, at[1] + reach * 0.08, at[0] + dir * reach * 0.2, at[1] + reach * 0.05, at[0], at[1]);
    ctx.fill();
    ctx.restore();
  }

  function ease(v) {
    return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function frame(now) {
    if (playing) {
      if (!startedAt) startedAt = now;
      t = Math.min(1, (now - startedAt) / duration);
      if (t >= 1) playing = false;
    }
    draw();
    sync();
    if (playing) requestAnimationFrame(frame);
  }

  range.addEventListener("input", function () {
    playing = false;
    t = Number(range.value) / 100;
    draw();
    sync();
  });

  var again = document.getElementById("draw-again");
  if (again) {
    again.addEventListener("click", function () {
      if (reduce) {
        t = 1;
        draw();
        sync();
        return;
      }
      playing = true;
      startedAt = 0;
      t = 0;
      requestAnimationFrame(frame);
    });
  }

  var adder = document.getElementById("try-add");
  if (adder && verdict) {
    adder.addEventListener("click", function () {
      verdict.hidden = false;
      verdict.classList.remove("show");
      void verdict.offsetWidth;
      verdict.classList.add("show");
    });
  }

  if (window.ResizeObserver) {
    new ResizeObserver(function () { draw(); }).observe(plate);
  } else {
    window.addEventListener("resize", draw);
  }
  window.addEventListener("orientationchange", function () {
    setTimeout(draw, 60);
  });

  sync();
  requestAnimationFrame(frame);
})();
