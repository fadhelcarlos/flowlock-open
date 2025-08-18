import type { FlowlockCheck, CheckResult } from "flowlock-plugin-sdk";
import type { UXSpec } from "flowlock-uxspec";

// Root-level checks (already FlowlockCheck objects)
import { honestReadsCheck } from "./honest-reads";
import { creatableNeedsDetailCheck } from "./creatable-needs-detail";
import { reachabilityCheck } from "./reachability";

// Subfolder checks (FUNCTION exports => wrap+normalize)
import { checkUIStates } from "./checks/uiStates";
import { checkStateMachines } from "./checks/stateMachine";
import { checkScreen } from "./checks/screen";
import { checkSpecCoverage } from "./checks/coverage";
import { checkJTBD } from "./checks/jtbd";
import { checkRelations } from "./checks/relations";
import { checkRoutes } from "./checks/routes";
import { checkCTAs } from "./checks/ctas";

/** Normalize unknown results to CheckResult[] with narrow level/status. Drops extra props. */
function normalizeResults(raw: any): CheckResult[] {
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((r: any) => {
    const level = (r?.level === "info" || r?.level === "warning" || r?.level === "error")
      ? r.level
      : "error";
    const status = (r?.status === "pass" || r?.status === "fail")
      ? r.status
      : "fail";
    const out: CheckResult = {
      id: String(r?.id ?? "unknown"),
      level: level as any,     // cast to satisfy union
      status: status as any,   // cast to satisfy union
      message: String(r?.message ?? ""),
    };
    if (r?.ref != null) (out as any).ref = String(r.ref);
    return out;
  });
}

// Wrap the function-style checks into FlowlockCheck objects
const uiStates: FlowlockCheck = {
  id: "ui_states",
  name: "UI States",
  description: "Flags missing loading/empty/error states for each data view.",
  run: (spec: UXSpec) => normalizeResults(checkUIStates(spec)),
};

const stateMachine: FlowlockCheck = {
  id: "state_machines",
  name: "State Machines",
  description: "Validates declared state transitions and terminal states.",
  run: (spec: UXSpec) => normalizeResults(checkStateMachines(spec)),
};

const screen: FlowlockCheck = {
  id: "screen",
  name: "SCREEN",
  description: "Ensures all screens declare allowed roles.",
  run: (spec: UXSpec) => normalizeResults(checkScreen(spec)),
};

const coverage: FlowlockCheck = {
  id: "spec_coverage",
  name: "Spec Coverage",
  description: "Reports % coverage of entities/fields by forms, displays, and flows.",
  run: (spec: UXSpec) => normalizeResults(checkSpecCoverage(spec)),
};

const jtbd: FlowlockCheck = {
  id: "jtbd",
  name: "Jobs To Be Done",
  description: "Validates that all JTBD are addressed by flows.",
  run: (spec: UXSpec) => normalizeResults(checkJTBD(spec)),
};

const relations: FlowlockCheck = {
  id: "relations",
  name: "Entity Relations",
  description: "Validates entity relations are properly defined.",
  run: (spec: UXSpec) => normalizeResults(checkRelations(spec)),
};

const routes: FlowlockCheck = {
  id: "routes",
  name: "Screen Routes",
  description: "Validates screen routes are unique and properly formatted.",
  run: (spec: UXSpec) => normalizeResults(checkRoutes(spec)),
};

const ctas: FlowlockCheck = {
  id: "ctas",
  name: "Call to Actions",
  description: "Validates CTAs point to valid screens.",
  run: (spec: UXSpec) => normalizeResults(checkCTAs(spec)),
};

// Optional short aliases (kept for convenience)
export const honestReads = honestReadsCheck;
export const creatableNeedsDetail = creatableNeedsDetailCheck;
export const reachability = reachabilityCheck;
export { uiStates, stateMachine, screen, coverage, jtbd, relations, routes, ctas };
export const roleBoundaries = screen; // Backward compatibility alias

// Bundle consumed by the runner/CLI
export const coreChecks: FlowlockCheck[] = [
  honestReadsCheck,
  creatableNeedsDetailCheck,
  reachabilityCheck,
  uiStates,
  stateMachine,
  screen,
  coverage,
  jtbd,
  relations,
  routes,
  ctas,
];
