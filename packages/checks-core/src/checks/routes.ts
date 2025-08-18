import type { UXSpec } from 'flowlock-uxspec';

/**
 * Validates that screen routes are unique and properly formatted
 */
export function checkRoutes(spec: UXSpec): any[] {
  const results: any[] = [];
  const screens = spec.screens || [];
  const routeMap = new Map<string, string[]>();
  
  for (const screen of screens) {
    const routes = (screen as any).routes || [];
    
    for (const route of routes) {
      // Check route format (should start with /)
      if (!route.startsWith('/')) {
        results.push({
          id: `route_format_${screen.id}_${route}`,
          level: 'warning',
          status: 'fail',
          message: `Screen '${screen.name}' has route '${route}' that doesn't start with '/'`,
          ref: `screen:${screen.id},route:${route}`,
        });
      }
      
      // Check for duplicate routes
      if (routeMap.has(route)) {
        routeMap.get(route)!.push(screen.id);
      } else {
        routeMap.set(route, [screen.id]);
      }
      
      // Check for route parameters consistency
      if (route.includes(':')) {
        const params = route.match(/:(\w+)/g) || [];
        const entityId = screen.entityId;
        
        if (entityId && params.length > 0) {
          // Validate that route params match entity fields
          const entity = spec.entities.find(e => e.id === entityId);
          if (entity) {
            for (const param of params) {
              const fieldName = param.substring(1); // Remove ':'
              const hasField = entity.fields.some(f => f.id === fieldName || f.id === 'id');
              
              if (!hasField) {
                results.push({
                  id: `route_param_${screen.id}_${fieldName}`,
                  level: 'warning',
                  status: 'fail',
                  message: `Route parameter ':${fieldName}' in screen '${screen.name}' doesn't match entity fields`,
                  ref: `screen:${screen.id},route:${route}`,
                });
              }
            }
          }
        }
      }
    }
  }
  
  // Report duplicate routes
  for (const [route, screenIds] of routeMap.entries()) {
    if (screenIds.length > 1) {
      results.push({
        id: `route_duplicate_${route.replace(/\//g, '_')}`,
        level: 'error',
        status: 'fail',
        message: `Route '${route}' is used by multiple screens: ${screenIds.join(', ')}`,
        ref: `route:${route}`,
      });
    }
  }
  
  // Check that home/dashboard screens have root routes
  const homeScreens = screens.filter(s => 
    s.type === 'dashboard' || s.type === 'home' || s.id.includes('home')
  );
  
  for (const screen of homeScreens) {
    const routes = (screen as any).routes || [];
    const hasRootRoute = routes.some((r: string) => r === '/' || r === '/dashboard' || r === '/home');
    
    if (!hasRootRoute && routes.length === 0) {
      results.push({
        id: `route_missing_home_${screen.id}`,
        level: 'info',
        status: 'fail',
        message: `Home/dashboard screen '${screen.name}' has no root route defined`,
        ref: `screen:${screen.id}`,
      });
    }
  }
  
  if (results.length === 0) {
    results.push({
      id: 'routes',
      level: 'info',
      status: 'pass',
      message: 'All routes are unique and properly formatted',
    });
  }
  
  return results;
}
