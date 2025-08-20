export function checkScreen(spec: any) {
  const results: any[] = [];
  const screens = spec?.screens || [];

  for (const s of screens) {
    const roles = s.roles || s.allowedRoles || [];
    if (!Array.isArray(roles) || roles.length === 0) {
      results.push({
        id: "screen_roles_defined",
        level: "error",
        status: "fail",
        message: `Screen "${s.name || s.id}" must declare allowed roles.`,
        meta: { screen: s.id || s.name }
      });
    }
  }

  if (results.length === 0) {
    results.push({
      id: "screen_roles_defined",
      level: "info",
      status: "pass",
      message: "All screens declare allowed roles."
    });
  }
  return results;
}
