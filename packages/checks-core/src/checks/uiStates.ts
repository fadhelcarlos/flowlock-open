export function checkUIStates(spec: any) {
  const results: any[] = [];
  const screens = spec?.screens || [];
  const required = ["empty", "loading", "error"];

  for (const s of screens) {
    const have = new Set((s.uiStates || []).map((x: string) => x.toLowerCase()));
    const missing = required.filter(r => !have.has(r));
    if (missing.length) {
      results.push({
        id: "ui_states_present",
        level: "error",
        status: "fail",
        message: `Screen "${s.name || s.id}" missing UI states: ${missing.join(", ")}.`,
        meta: { screen: s.id || s.name, missing }
      });
    }
  }

  if (results.length === 0) {
    results.push({
      id: "ui_states_present",
      level: "info",
      status: "pass",
      message: "All screens declare empty/loading/error states."
    });
  }
  return results;
}
