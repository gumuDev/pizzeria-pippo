// Dev-only helper: aggregates react-scan render events in memory and exposes
// window.downloadReactScanReport() to export them as JSON. Loaded only when
// NODE_ENV === "development" (see app/layout.tsx). Not part of react-scan
// itself — react-scan's bundled auto.global.js doesn't expose getReport() on
// window, so this taps the same onRender hook it exposes via window.reactScan.
(function () {
  if (typeof window === "undefined" || typeof window.reactScan !== "function") {
    console.warn("[react-scan-reporter] window.reactScan no está disponible todavía.");
    return;
  }

  window.__reactScanReport = new Map();

  window.reactScan({
    onRender: function (fiber, renders) {
      try {
        var type = fiber && fiber.type;
        var name = (type && (type.displayName || type.name)) || (typeof type === "string" ? type : "Unknown");
        var entry = window.__reactScanReport.get(name) || {
          component: name,
          renderCount: 0,
          unnecessaryCount: 0,
          totalTimeMs: 0,
        };
        renders.forEach(function (r) {
          entry.renderCount += r.count || 1;
          if (r.unnecessary) entry.unnecessaryCount += 1;
          if (r.time) entry.totalTimeMs += r.time;
        });
        window.__reactScanReport.set(name, entry);
      } catch (e) {
        // no-op — nunca romper el render de la app por un error en el reporter
      }
    },
  });

  window.downloadReactScanReport = function () {
    var data = Array.from(window.__reactScanReport.values()).sort(function (a, b) {
      return b.renderCount - a.renderCount;
    });
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "react-scan-report-" + Date.now() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("[react-scan-reporter] Reporte descargado —", data.length, "componentes.");
    console.table(data.slice(0, 20));
  };

  console.log(
    "[react-scan-reporter] Activo. Navegá la app y después corré window.downloadReactScanReport() en la consola para bajar un JSON ordenado por cantidad de renders."
  );
})();
