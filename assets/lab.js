(function () {
  var input = document.getElementById("lab-code");
  var paint = document.getElementById("lab-paint");
  var explain = document.getElementById("lab-explain");
  var preview = document.getElementById("lab-preview");
  if (!input || !paint) return;

  var examples = {
    import: {
      code: "USE DATABASE farm;\nIMPORT CSV 'soil.csv' INTO agriculture.soil;",
      explain: "This names the database, then imports a CSV into one table. The same form accepts TSV, JSON, and XLSX. Parquet is refused. A path that leaves the data directory is refused. This page does not import a file.",
      preview: "No rows. A file is not being read."
    },
    summary: {
      code: "USE DATABASE farm;\nSELECT plant_id, AVG(soil_moisture)\nFROM agriculture.soil\nWHERE soil_moisture < 25\nGROUP BY plant_id;",
      explain: "This would summarise one table. COUNT, MIN, MAX, and STDDEV are the other aggregates. There is no join. Names here are examples. This page does not calculate an average.",
      preview: "No result table. Nothing was executed."
    },
    profile: {
      code: "USE DATABASE farm;\nPROFILE agriculture.soil;",
      explain: "PROFILE reports empty values and unusual numbers in one table. This page does not profile a table.",
      preview: "No profile. Nothing was executed."
    },
    series: {
      code: "USE DATABASE farm;\nSERIES agriculture.soil ON observed_at;",
      explain: "SERIES … ON counts gaps along the time column you name. A gap is not a reading of zero. This page does not count gaps.",
      preview: "No gap count. Nothing was executed."
    },
    export: {
      code: "USE DATABASE farm;\nEXPORT XLSX agriculture.soil TO 'soil.xlsx';",
      explain: "EXPORT can write CSV, TSV, JSON, or Excel. It writes one table. This page does not write a file.",
      preview: "No file. Nothing was exported."
    },
    units: {
      code: "-- Not a query. A rule of the language.\n-- 25 mm + 25 kg is refused.\n-- 25 mm + 2 m can be compared, because both are length.",
      explain: "AgriQL rejects a length added to a mass. Millimetres and metres are both length. The numeral 25 does not make rain, moisture, and fertiliser the same quantity. AgriQL does not predict yield.",
      preview: "Rule, not a query result: millimetres plus kilograms is refused."
    }
  };

  var words = ["USE", "DATABASE", "CREATE", "SCHEMA", "SHOW", "SCHEMAS", "IMPORT", "CSV", "TSV", "JSON", "XLSX", "INTO", "SELECT", "FROM", "WHERE", "GROUP", "BY", "AVG", "COUNT", "MIN", "MAX", "STDDEV", "PROFILE", "SERIES", "ON", "EXPORT", "TO"];

  function escapeHtml(value) {
    return value.replace(/&/g, "&").replace(/</g, "<");
  }

  function highlight(value) {
    var safe = escapeHtml(value + "\n");
    return safe.replace(new RegExp("\\b(" + words.join("|") + ")\\b", "g"), "<span class=\"kw\">$1</span>");
  }

  function render() {
    paint.innerHTML = highlight(input.value);
    paint.scrollTop = input.scrollTop;
    paint.scrollLeft = input.scrollLeft;
  }

  function load(key) {
    var item = examples[key];
    input.value = item.code;
    explain.textContent = item.explain;
    preview.textContent = item.preview;
    document.querySelectorAll("[data-example]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-example") === key ? "true" : "false");
    });
    render();
  }

  input.addEventListener("input", render);
  input.addEventListener("scroll", function () {
    paint.scrollTop = input.scrollTop;
    paint.scrollLeft = input.scrollLeft;
  });
  document.querySelectorAll("[data-example]").forEach(function (btn) {
    btn.addEventListener("click", function () { load(btn.getAttribute("data-example")); });
  });
  document.getElementById("lab-copy").addEventListener("click", function () {
    var note = document.getElementById("lab-copied");
    function done() {
      note.hidden = false;
      note.textContent = "Copied the statement. It was not run.";
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(input.value).then(done, function () {
        input.select();
        done();
      });
    } else {
      input.select();
      done();
    }
  });
  load("summary");
})();
