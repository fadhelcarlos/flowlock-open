import { z } from 'zod';

// Role with enhanced permissions
export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissions: z.array(z.string()).optional(),
});

// JTBD (Jobs To Be Done) - NEW
export const JTBDSchema = z.object({
  role: z.string(),
  tasks: z.array(z.string()),
  description: z.string().optional(),
});

// Field with enhanced attributes
export const FieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'email', 'url', 'text', 'enum']),
  required: z.boolean().optional(),
  derived: z.boolean().optional(),
  provenance: z.string().optional(),
  external: z.boolean().optional(),
  source: z.string().optional(),
  enum: z.array(z.string()).optional(), // For enum types
  min: z.number().optional(), // For number validation
  max: z.number().optional(), // For number validation
  pattern: z.string().optional(), // For string regex validation
});

// Entity Relations - NEW
export const RelationSchema = z.object({
  id: z.string(),
  to: z.string(), // Target entity
  kind: z.enum(['1:1', '1:many', 'many:1', 'many:many']),
  ordered: z.boolean().optional(),
  cascade: z.boolean().optional(),
});

// Entity with relations
export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(FieldSchema),
  relations: z.array(RelationSchema).optional(), // NEW
});

// Form with writes tracking - ENHANCED
export const FormFieldSchema = z.object({
  fieldId: z.string(),
  label: z.string().optional(),
  validation: z.any().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
});

export const FormSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  fields: z.array(FormFieldSchema),
  type: z.enum(['create', 'update', 'read', 'delete']).optional(),
  writes: z.array(z.string()).optional(), // NEW - explicit writes tracking
});

// Card component - NEW
export const CardSchema = z.object({
  id: z.string(),
  entityId: z.string().optional(),
  reads: z.array(z.string()),
  title: z.string().optional(),
  subtitle: z.string().optional(),
});

// List component - NEW
export const ListSchema = z.object({
  id: z.string(),
  entityId: z.string().optional(),
  reads: z.array(z.string()),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  paginated: z.boolean().optional(),
});

// CTA (Call to Action) - NEW
export const CTASchema = z.object({
  id: z.string(),
  label: z.string(),
  to: z.string(), // Target screen ID
  type: z.enum(['primary', 'secondary', 'link']).optional(),
  icon: z.string().optional(),
});

// Enhanced Screen with all components
export const ScreenSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['list', 'detail', 'form', 'dashboard', 'success', 'error', 'home']),
  entity: z.string().optional(), // Support both 'entity' and 'entityId'
  entityId: z.string().optional(),
  routes: z.array(z.string()).optional(), // NEW - URL routes
  forms: z.array(FormSchema).optional(),
  cards: z.array(CardSchema).optional(), // NEW
  lists: z.array(ListSchema).optional(), // NEW
  ctas: z.array(CTASchema).optional(), // NEW
  reads: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(), // Moved here for direct access
  uiStates: z.array(z.string()).optional(), // Keep for compatibility
  states: z.array(z.string()).optional(), // NEW - alias for uiStates
});

// State Transition - NEW
export const StateTransitionSchema = z.object({
  entity: z.string(),
  from: z.string(),
  to: z.string(),
  trigger: z.string().optional(),
});

// Enhanced Flow Step
export const FlowStepSchema = z.object({
  id: z.string(),
  screen: z.string().optional(), // Alternative to screenId
  screenId: z.string().optional(), // Keep for compatibility
  reads: z.array(z.string()).optional(), // NEW - step-level reads
  writes: z.array(z.string()).optional(), // NEW - step-level writes
  transition: StateTransitionSchema.optional(), // NEW - state transitions
  next: z.array(z.object({
    condition: z.string().optional(),
    targetStepId: z.string(),
  })).optional(),
});

// Enhanced Flow with success tracking
export const FlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  jtbd: z.string().optional(), // NEW - link to JTBD
  role: z.string().optional(), // NEW - single role
  roles: z.array(z.string()).optional(), // Keep for compatibility
  entryStepId: z.string(),
  steps: z.array(FlowStepSchema),
  success: z.object({ // NEW - success criteria
    screen: z.string().optional(),
    condition: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
});

// State Machine Definition - NEW
export const StateSchema = z.object({
  entity: z.string(),
  allowed: z.array(z.string()), // Allowed states
  initial: z.string().optional(),
  terminal: z.array(z.string()).optional(),
  transitions: z.array(z.object({
    from: z.string(),
    to: z.string(),
    trigger: z.string().optional(),
  })).optional(),
});

// Policy with enhanced rules
export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['security', 'validation', 'business', 'ux']),
  rule: z.string(),
  severity: z.enum(['error', 'warning', 'info']).optional(),
  enabled: z.boolean().optional(),
  config: z.any().optional(), // For policy-specific configuration
});

// Glossary Entry - NEW
export const GlossarySchema = z.object({
  term: z.string(),
  definition: z.string(),
  formula: z.string().optional(), // For derived fields
  source: z.string().optional(), // For external fields
  tags: z.array(z.string()).optional(),
});

// Main UX Specification - ENHANCED
export const UXSpecSchema = z.object({
  version: z.string().default('1.0.0'),
  project: z.string().optional(), // NEW - alternative to name
  name: z.string(),
  description: z.string().optional(), // NEW
  roles: z.array(RoleSchema).optional(),
  jtbd: z.union([
    z.array(JTBDSchema),  // New format: array of JTBD objects
    z.record(z.array(z.string()))  // Old format: object with role keys
  ]).optional(), // NEW - supports both formats
  entities: z.array(EntitySchema),
  screens: z.array(ScreenSchema),
  flows: z.array(FlowSchema),
  states: z.array(StateSchema).optional(), // NEW
  policies: z.array(PolicySchema).optional(),
  glossary: z.array(GlossarySchema).optional(), // NEW
  permissions: z.array(z.any()).optional(), // NEW - flexible permissions
});

// Export types
export type Role = z.infer<typeof RoleSchema>;
export type JTBD = z.infer<typeof JTBDSchema>;
export type Field = z.infer<typeof FieldSchema>;
export type Relation = z.infer<typeof RelationSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type Form = z.infer<typeof FormSchema>;
export type Card = z.infer<typeof CardSchema>;
export type List = z.infer<typeof ListSchema>;
export type CTA = z.infer<typeof CTASchema>;
export type Screen = z.infer<typeof ScreenSchema>;
export type StateTransition = z.infer<typeof StateTransitionSchema>;
export type FlowStep = z.infer<typeof FlowStepSchema>;
export type Flow = z.infer<typeof FlowSchema>;
export type State = z.infer<typeof StateSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type Glossary = z.infer<typeof GlossarySchema>;
export type UXSpec = z.infer<typeof UXSpecSchema>;