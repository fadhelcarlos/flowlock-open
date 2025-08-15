export { honestReadsCheck } from './honest-reads';
export { creatableNeedsDetailCheck } from './creatable-needs-detail';
export { reachabilityCheck, type ReachabilityConfig } from './reachability';

import { honestReadsCheck } from './honest-reads';
import { creatableNeedsDetailCheck } from './creatable-needs-detail';
import { reachabilityCheck } from './reachability';

export const coreChecks = [
  honestReadsCheck,
  creatableNeedsDetailCheck,
  reachabilityCheck,
];