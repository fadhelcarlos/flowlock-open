export function checkSpecCoverage(spec: any) {
  const screens = spec?.screens || [];
  if (screens.length === 0) {
    return [{
      id: "spec_coverage",
      level: "warning",
      status: "fail",
      message: "No screens defined in spec."
    }];
  }
  const rolesOK = screens.filter((s:any) => Array.isArray(s.roles) && s.roles.length>0).length;
  const statesOK = screens.filter((s:any) => {
    const req = ["empty","loading","error"];
    const have = new Set((s.uiStates||[]).map((x:string)=>x.toLowerCase()));
    return req.every(r => have.has(r));
  }).length;

  const rolePct = Math.round((rolesOK / screens.length) * 100);
  const statePct = Math.round((statesOK / screens.length) * 100);

  return [{
    id: "spec_coverage",
    level: "info",
    status: (rolePct===100 && statePct===100) ? "pass" : "fail",
    message: `Spec coverage — Roles: ${rolePct}% • UI states: ${statePct}%`,
    meta: { rolePct, statePct, total: screens.length }
  }];
}
