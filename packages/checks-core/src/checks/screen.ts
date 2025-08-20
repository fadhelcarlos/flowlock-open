import { ErrorCodes } from "flowlock-shared/errors";

export function checkScreen(spec: any) {
  const results: any[] = [];
  const screens = spec?.screens || [];
  const availableRoles = spec?.roles?.map((r: any) => r.id || r) || [];

  for (const s of screens) {
    const roles = s.roles || s.allowedRoles || [];
    if (!Array.isArray(roles) || roles.length === 0) {
      // Find screens with similar purpose to suggest roles
      const similarScreens = screens.filter((other: any) => 
        other.id !== s.id && 
        other.type === s.type && 
        (other.roles || other.allowedRoles || []).length > 0
      );
      
      const suggestedRoles = similarScreens.length > 0
        ? Array.from(new Set(similarScreens.flatMap((sc: any) => sc.roles || sc.allowedRoles || [])))
        : availableRoles.length > 0 ? availableRoles : ["user", "admin"];
      
      results.push({
        id: "screen_roles_defined",
        level: "error",
        status: "fail",
        message: `Screen "${s.name || s.id}" must declare allowed roles`,
        meta: { screen: s.id || s.name },
        details: {
          code: ErrorCodes.VALIDATION_MISSING_FIELD,
          expected: "Screen should have 'roles' or 'allowedRoles' array",
          actual: "No roles defined",
          location: `Screen: ${s.name || s.id} (${s.id})`,
          suggestion: similarScreens.length > 0
            ? `Similar ${s.type || 'screens'} use roles: ${suggestedRoles.slice(0, 3).join(", ")}\n\nAdd to screen definition:\n{\n  "id": "${s.id}",\n  "roles": ${JSON.stringify(suggestedRoles.slice(0, 2))}\n}`
            : `Add roles to screen definition:\n{\n  "id": "${s.id}",\n  "roles": ["user"] // or ["admin", "user", "guest"]\n}\n\nAvailable roles in spec: ${availableRoles.length > 0 ? availableRoles.join(", ") : "Define roles in spec.roles first"}`,
          documentation: "https://flowlock.dev/docs/screens#role-based-access",
          context: {
            screenId: s.id,
            screenType: s.type,
            availableRoles: availableRoles,
            suggestedRoles: suggestedRoles.slice(0, 5)
          }
        }
      });
    } else {
      // Check if declared roles exist in spec
      const undefinedRoles = roles.filter((r: string) => 
        availableRoles.length > 0 && !availableRoles.includes(r)
      );
      
      if (undefinedRoles.length > 0) {
        results.push({
          id: "screen_roles_undefined",
          level: "warning",
          status: "fail",
          message: `Screen "${s.name || s.id}" uses undefined roles: ${undefinedRoles.join(", ")}`,
          meta: { screen: s.id || s.name },
          details: {
            code: ErrorCodes.VALIDATION_RELATIONSHIP_BROKEN,
            expected: `Roles should be defined in spec.roles`,
            actual: `Undefined roles: ${undefinedRoles.join(", ")}`,
            location: `Screen: ${s.name || s.id}`,
            suggestion: availableRoles.length > 0
              ? `Use existing roles: ${availableRoles.join(", ")}\n\nOr add missing roles to spec:\n{\n  "roles": [\n    ${undefinedRoles.map((r: string) => `{ "id": "${r}" }`).join(",\n    ")}\n  ]\n}`
              : `Define roles in spec first:\n{\n  "roles": [\n    ${undefinedRoles.map((r: string) => `{ "id": "${r}" }`).join(",\n    ")}\n  ]\n}`,
            documentation: "https://flowlock.dev/docs/roles",
            context: {
              undefinedRoles: undefinedRoles,
              availableRoles: availableRoles
            }
          }
        });
      }
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
