(function () {
  var canvas = document.getElementById("topo");
  var plate = document.getElementById("topo-plate");
  var title = document.getElementById("topo-title");
  var body = document.getElementById("topo-body");
  var badge = document.getElementById("topo-badge");
  if (!canvas || !plate) return;

  var nodes = [
    { id: "sources", x: 150, y: 190, title: "Data sources", status: "in", text: "CSV, TSV, JSON, and Excel can be imported and exported. Parquet is refused. A spreadsheet that exists only online is refused." },
    { id: "ingest", x: 390, y: 190, title: "Ingestion", status: "in", text: "IMPORT brings a file into a table and records the source file. A path that leaves the data directory is refused." },
    { id: "schema", x: 620, y: 90, title: "Schema", status: "in", text: "CREATE SCHEMA and SHOW SCHEMAS are in this release. Each agriql query starts fresh, so name the database in the same request." },
    { id: "units", x: 620, y: 290, title: "Units", status: "in", text: "A length is not added to a mass. Millimetres and metres can be, because both are length. AgriQL does not predict yield." },
    { id: "query", x: 860, y: 190, title: "Query", status: "in", text: "A summary reads one table. The aggregates are count, minimum, maximum, average, and standard deviation. PROFILE reports empty values. SERIES … ON counts gaps in a time column." },
    { id: "store", x: 1100, y: 190, title: ".aqdb file", status: "in", text: "A season of soil, crop, water, and weather measurements stays in one .aqdb file. The file can be copied and opened later." },
    { id: "python", x: 1340, y: 80, title: "Python", status: "in", text: "The Python client sends a query and returns rows. It is not a second database. Pandas and Polars are optional." },
    { id: "r", x: 1340, y: 190, title: "R", status: "in", text: "The R client sends a query and returns rows. It compiles against the AgriQL library. It is not a second database." },
    { id: "arrow", x: 390, y: 390, title: "Arrow", status: "in", text: "Arrow does not open a database. It turns a text table into an Arrow file, and it can read that file back." },
    { id: "joins", x: 860, y: 400, title: "Joins", status: "out", text: "Not in version 3.10.1. A summary does not join two tables." },
    { id: "yield", x: 620, y: 450, title: "Yield forecast", status: "out", text: "Not a capability. AgriQL stores and checks measurements. It does not forecast a harvest." }
  ];
  var edges = [
    ["sources", "ingest"],
    ["ingest", "schema"],
    ["ingest", "units"],
    ["schema", "query"],
    ["units", "query"],
    ["query", "store"],
    ["store", "python"],
    ["store", "r"],
    ["sources", "arrow"]
  ];
  var byId = {};
  nodes.forEach(function (n) { byId[n.id] = n; });

  var cam = { x: 0, y: 0, k: 1 };
  var selected = "store";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dragging = false;
  var moved = false;
  var last = { x: 0, y: 0 };
  var phase = 0;

  function show(id) {
    selected = id;
    var n = byId[id];
    title.textContent = n.title;
    body.textContent = n.text;
    badge.textContent = n.status === "in" ? "In 3.10.1" : "Not in 3.10.1";
    badge.className = n.status === "in" ? "pill in" : "pill out";
    var buttons = document.querySelectorAll("[data-node]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", buttons[i].getAttribute("data-node") === id ? "true" : "false");
    }
  }

  function bounds() {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(function (n) {
      minX = Math.min(minX, n.x - 78);
      minY = Math.min(minY, n.y - 36);
      maxX = Math.max(maxX, n.x + 78);
      maxY = Math.max(maxY, n.y + 36);
    });
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  function fit() {
    var b = bounds();
    var w = plate.clientWidth;
    var h = plate.clientHeight;
    var k = Math.min(w / (b.maxX - b.minX), h / (b.maxY - b.minY));
    cam.k = Math.max(0.42, Math.min(k, 1.35));
    cam.x = (w - (b.minX + b.maxX) * cam.k) / 2;
    cam.y = (h - (b.minY + b.maxY) * cam.k) / 2;
  }

  function world(sx, sy) {
    var r = canvas.getBoundingClientRect();
    return { x: (sx - r.left - cam.x) / cam.k, y: (sy - r.top - cam.y) / cam.k };
  }

  function hit(p) {
    for (var i = nodes.length - 1; i >= 0; i--) {
      var n = nodes[i];
      if (Math.abs(p.x - n.x) < 74 && Math.abs(p.y - n.y) < 32) return n.id;
    }
    return null;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var cssW = Math.max(1, plate.clientWidth);
    var cssH = Math.max(1, plate.clientHeight);
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
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.k, cam.k);

    edges.forEach(function (e) {
      var a = byId[e[0]];
      var b = byId[e[1]];
      ctx.strokeStyle = "rgba(183,227,154,0.85)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (!reduce) {
        var t = (phase + e[0].length * 0.07) % 1;
        ctx.fillStyle = "#f4f0e6";
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    nodes.forEach(function (n) {
      var on = n.id === selected;
      ctx.fillStyle = n.status === "in" ? (on ? "#1a4a32" : "#163028") : "#10241c";
      ctx.strokeStyle = n.status === "in" ? (on ? "#d7efc8" : "#8fbf78") : "#8a6a62";
      ctx.lineWidth = on ? 2.4 : 1.2;
      if (n.status === "out") ctx.setLineDash([5, 4]);
      roundRect(ctx, n.x - 72, n.y - 28, 144, 56, 14);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = n.status === "in" ? "#f4f0e6" : "#d7cfc4";
      ctx.font = "600 14px 'Source Sans 3', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.title, n.x, n.y);
    });
    ctx.restore();
  }

  function frame() {
    if (!reduce) phase = (phase + 0.004) % 1;
    draw();
    if (!reduce && !document.hidden) requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", function (ev) {
    dragging = true;
    moved = false;
    last.x = ev.clientX;
    last.y = ev.clientY;
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener("pointermove", function (ev) {
    if (!dragging) return;
    var dx = ev.clientX - last.x;
    var dy = ev.clientY - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    cam.x += dx;
    cam.y += dy;
    last.x = ev.clientX;
    last.y = ev.clientY;
    if (reduce) draw();
  });
  canvas.addEventListener("pointerup", function (ev) {
    dragging = false;
    if (!moved) {
      var id = hit(world(ev.clientX, ev.clientY));
      if (id) show(id);
    }
  });
  canvas.addEventListener("wheel", function (ev) {
    ev.preventDefault();
    var before = world(ev.clientX, ev.clientY);
    var next = Math.max(0.35, Math.min(1.8, cam.k * (ev.deltaY < 0 ? 1.08 : 0.92)));
    cam.k = next;
    var r = canvas.getBoundingClientRect();
    cam.x = ev.clientX - r.left - before.x * cam.k;
    cam.y = ev.clientY - r.top - before.y * cam.k;
    if (reduce) draw();
  }, { passive: false });

  document.getElementById("topo-in").addEventListener("click", function () { cam.k = Math.min(1.8, cam.k * 1.15); if (reduce) draw(); });
  document.getElementById("topo-out").addEventListener("click", function () { cam.k = Math.max(0.35, cam.k / 1.15); if (reduce) draw(); });
  document.getElementById("topo-fit").addEventListener("click", function () { fit(); draw(); });
  document.querySelectorAll("[data-node]").forEach(function (btn) {
    btn.addEventListener("click", function () { show(btn.getAttribute("data-node")); });
  });

  if (window.ResizeObserver) new ResizeObserver(function () { draw(); }).observe(plate);
  window.addEventListener("orientationchange", function () { setTimeout(function () { fit(); draw(); }, 80); });
  show("store");
  fit();
  if (reduce) draw();
  else requestAnimationFrame(frame);
})();
