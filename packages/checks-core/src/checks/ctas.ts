import type { UXSpec } from 'flowlock-uxspec';

/**
 * Validates CTAs (Call to Actions) point to valid screens
 */
export function checkCTAs(spec: UXSpec): any[] {
  const results: any[] = [];
  const screens = spec.screens || [];
  const screenIds = new Set(screens.map(s => s.id));
  
  for (const screen of screens) {
    const ctas = (screen as any).ctas || [];
    
    for (const cta of ctas) {
      // Check that target screen exists
      if (!screenIds.has(cta.to)) {
        results.push({
          id: `cta_invalid_target_${screen.id}_${cta.id}`,
          level: 'error',
          status: 'fail',
          message: `Screen '${screen.name}' has CTA '${cta.label || cta.id}' pointing to non-existent screen '${cta.to}'`,
          ref: `screen:${screen.id},cta:${cta.id}`,
        });
      }
      
      // Check for self-referencing CTAs
      if (cta.to === screen.id) {
        results.push({
          id: `cta_self_reference_${screen.id}_${cta.id}`,
          level: 'warning',
          status: 'fail',
          message: `Screen '${screen.name}' has CTA '${cta.label || cta.id}' pointing to itself`,
          ref: `screen:${screen.id},cta:${cta.id}`,
        });
      }
      
      // Check CTA has label
      if (!cta.label && !cta.id) {
        results.push({
          id: `cta_no_label_${screen.id}`,
          level: 'warning',
          status: 'fail',
          message: `Screen '${screen.name}' has CTA without label or id`,
          ref: `screen:${screen.id}`,
        });
      }
    }
    
    // Check that success/error screens don't have dead-end CTAs
    if (screen.type === 'success' || screen.type === 'error') {
      if (ctas.length === 0) {
        results.push({
          id: `cta_dead_end_${screen.id}`,
          level: 'warning',
          status: 'fail',
          message: `${screen.type} screen '${screen.name}' has no CTAs (dead-end)`,
          ref: `screen:${screen.id}`,
        });
      }
    }
  }
  
  // Build navigation graph from CTAs
  const navGraph = new Map<string, Set<string>>();
  for (const screen of screens) {
    const ctas = (screen as any).ctas || [];
    const targets = new Set(ctas.map((c: any) => c.to).filter((t: string) => screenIds.has(t)));
    navGraph.set(screen.id, targets);
  }
  
  // Check for orphaned screens (no incoming CTAs)
  const hasIncoming = new Set<string>();
  for (const [_, targets] of navGraph) {
    for (const target of targets) {
      hasIncoming.add(target);
    }
  }
  
  // Home/dashboard screens are allowed to have no incoming CTAs
  const homeScreens = new Set(
    screens.filter(s => 
      s.type === 'dashboard' || 
      s.type === 'home' || 
      s.id.includes('home') ||
      ((s as any).routes || []).includes('/')
    ).map(s => s.id)
  );
  
  for (const screen of screens) {
    if (!hasIncoming.has(screen.id) && !homeScreens.has(screen.id)) {
      // Check if it's referenced in flows
      const inFlow = spec.flows.some(f => 
        f.steps.some(s => s.screenId === screen.id || (s as any).screen === screen.id)
      );
      
      if (!inFlow) {
        results.push({
          id: `cta_orphaned_${screen.id}`,
          level: 'warning',
          status: 'fail',
          message: `Screen '${screen.name}' is orphaned (no CTAs point to it and not in flows)`,
          ref: `screen:${screen.id}`,
        });
      }
    }
  }
  
  if (results.length === 0) {
    results.push({
      id: 'ctas',
      level: 'info',
      status: 'pass',
      message: 'All CTAs are properly configured and point to valid screens',
    });
  }
  
  return results;
}
