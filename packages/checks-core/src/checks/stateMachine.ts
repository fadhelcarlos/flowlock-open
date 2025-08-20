import { ErrorCodes } from "flowlock-shared/errors";

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
        message: `Entity "${ent.id}" has status enum but no state machine`,
        meta: { entity: ent.id },
        details: {
          code: ErrorCodes.CONFIG_MISSING_REQUIRED,
          expected: `State machine definition for entity with status field`,
          actual: `No state machine found`,
          location: `spec.stateMachines.${ent.id}`,
          suggestion: `Add state machine definition:\n{\n  "stateMachines": {\n    "${ent.id}": {\n      "states": ${JSON.stringify(enumVals)},\n      "initialState": "${enumVals[0]}",\n      "transitions": [\n        { "from": "${enumVals[0]}", "to": "${enumVals[1] || enumVals[0]}", "action": "transition_name" }\n      ]\n    }\n  }\n}`,
          documentation: "https://flowlock.dev/docs/state-machines",
          context: {
            entity: ent.id,
            statusValues: enumVals
          }
        }
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
          message: `State machine missing enum value "${v}"`,
          meta: { entity: ent.id, state: v },
          details: {
            code: ErrorCodes.VALIDATION_STATE_INVALID,
            expected: `All enum values should be represented as states`,
            actual: `Enum value "${v}" not in state machine`,
            location: `${ent.id}.stateMachine.states`,
            suggestion: `Add missing state to state machine:\n{\n  "stateMachines": {\n    "${ent.id}": {\n      "states": ${JSON.stringify([...states, v])},\n      ...\n    }\n  }\n}`,
            documentation: "https://flowlock.dev/docs/state-machines#states",
            context: {
              entity: ent.id,
              missingState: v,
              currentStates: states,
              enumValues: enumVals
            }
          }
        });
      }
    }

    // Transitions must reference valid states
    for (const t of transitions) {
      if (!states.includes(t.from) || !states.includes(t.to)) {
        const invalidStates = [];
        if (!states.includes(t.from)) invalidStates.push(t.from);
        if (!states.includes(t.to)) invalidStates.push(t.to);
        
        results.push({
          id: "state_machine_transition_valid",
          level: "error",
          status: "fail",
          message: `Invalid transition: ${t.from} -> ${t.to}`,
          meta: { entity: ent.id, transition: t },
          details: {
            code: ErrorCodes.VALIDATION_STATE_INVALID,
            expected: `Transitions must reference existing states`,
            actual: `Invalid states: ${invalidStates.join(", ")}`,
            location: `${ent.id}.stateMachine.transitions`,
            suggestion: invalidStates.length === 1
              ? `Either add state "${invalidStates[0]}" to states array, or fix the transition to use existing states: ${states.join(", ")}`
              : `Add missing states to the state machine:\n"states": ${JSON.stringify([...states, ...invalidStates])}\n\nOr update transition to use existing states.`,
            documentation: "https://flowlock.dev/docs/state-machines#transitions",
            context: {
              entity: ent.id,
              transition: t,
              invalidStates: invalidStates,
              availableStates: states
            }
          }
        });
      }
    }

    // Reachability heuristic: each non-terminal should have an outgoing
    for (const s of states) {
      const out = transitions.filter(t => t.from === s).length;
      const inn = transitions.filter(t => t.to === s).length;
      if (out === 0 && inn === 0) {
        // Check if it could be initial or terminal state
        const isInitial = m.initialState === s || states.indexOf(s) === 0;
        const isTerminal = s.toLowerCase().includes('complete') || 
                          s.toLowerCase().includes('done') || 
                          s.toLowerCase().includes('cancelled') ||
                          s.toLowerCase().includes('failed');
        
        results.push({
          id: "state_machine_island_state",
          level: "warning",
          status: "fail",
          message: `State "${s}" is unreachable (island)`,
          meta: { entity: ent.id, state: s },
          details: {
            code: ErrorCodes.DETERMINISM_UNREACHABLE_STATE,
            expected: `States should be reachable through transitions`,
            actual: `State "${s}" has no inbound or outbound transitions`,
            location: `${ent.id}.stateMachine.states[${s}]`,
            suggestion: isInitial
              ? `Add outbound transition from initial state:\n{ "from": "${s}", "to": "${states.find(st => st !== s)}", "action": "start" }`
              : isTerminal
              ? `Add inbound transition to terminal state:\n{ "from": "${states.find(st => st !== s)}", "to": "${s}", "action": "complete" }`
              : `Connect state with transitions:\n{ "from": "${states[0]}", "to": "${s}", "action": "transition_to_${s}" }\n{ "from": "${s}", "to": "${states.find(st => st !== s)}", "action": "next" }`,
            documentation: "https://flowlock.dev/docs/state-machines#reachability",
            context: {
              entity: ent.id,
              isolatedState: s,
              allStates: states,
              existingTransitions: transitions.length,
              isInitial: isInitial,
              isTerminal: isTerminal
            }
          }
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
