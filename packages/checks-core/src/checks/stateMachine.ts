export function checkStateMachines(spec: any) {
  const results: any[] = [];
  const entities = spec?.entities || [];
  const machines = spec?.stateMachines || {};

  for (const ent of entities) {
    const statusField = (ent.fields || []).find((f: any) =>
      f.id?.toLowerCase() === "status" && (Array.isArray(f.enum) || Array.isArray(f.enums))
    );
    if (!statusField) continue;

    const enumVals: string[] = statusField.enum || statusField.enums || [];
    const m = machines[ent.id];
    if (!m) {
      results.push({
        id: "state_machine_defined",
        level: "error",
        status: "fail",
        message: `Entity "${ent.id}" has a status enum but no state machine defined (spec.stateMachines.${ent.id}).`,
        meta: { entity: ent.id }
      });
      continue;
    }

    const states: string[] = m.states || [];
    const transitions: {from:string;to:string;action?:string}[] = m.transitions || [];

    // All enum values should be present as states
    for (const v of enumVals) {
      if (!states.includes(v)) {
        results.push({
          id: "state_machine_states_cover_enum",
          level: "error",
          status: "fail",
          message: `State machine for "${ent.id}" is missing enum value "${v}" in states.`,
          meta: { entity: ent.id, state: v }
        });
      }
    }

    // Transitions must reference valid states
    for (const t of transitions) {
      if (!states.includes(t.from) || !states.includes(t.to)) {
        results.push({
          id: "state_machine_transition_valid",
          level: "error",
          status: "fail",
          message: `Invalid transition in "${ent.id}": ${t.from} -> ${t.to} (must be in states).`,
          meta: { entity: ent.id, transition: t }
        });
      }
    }

    // Reachability heuristic: each non-terminal should have an outgoing
    for (const s of states) {
      const out = transitions.filter(t => t.from === s).length;
      const inn = transitions.filter(t => t.to === s).length;
      if (out === 0 && inn === 0) {
        results.push({
          id: "state_machine_island_state",
          level: "warning",
          status: "fail",
          message: `State "${s}" in "${ent.id}" has no inbound or outbound transitions (island).`,
          meta: { entity: ent.id, state: s }
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      id: "state_machine_valid",
      level: "info",
      status: "pass",
      message: "All state machines are structurally valid or not required."
    });
  }
  return results;
}
