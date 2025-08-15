import { z } from 'zod';

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissions: z.array(z.string()).optional(),
});

export const FieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'email', 'url', 'text']),
  required: z.boolean().optional(),
  derived: z.boolean().optional(),
  provenance: z.string().optional(),
  external: z.boolean().optional(),
  source: z.string().optional(),
});

export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(FieldSchema),
});

export const FormFieldSchema = z.object({
  fieldId: z.string(),
  label: z.string().optional(),
  validation: z.any().optional(),
});

export const FormSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  fields: z.array(FormFieldSchema),
  type: z.enum(['create', 'update', 'read']).optional(),
});

export const ScreenSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['list', 'detail', 'form', 'dashboard', 'success', 'error']),
  entityId: z.string().optional(),
  forms: z.array(FormSchema).optional(),
  reads: z.array(z.string()).optional(),
});

export const FlowStepSchema = z.object({
  id: z.string(),
  screenId: z.string(),
  next: z.array(z.object({
    condition: z.string().optional(),
    targetStepId: z.string(),
  })).optional(),
});

export const FlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  entryStepId: z.string(),
  steps: z.array(FlowStepSchema),
  roles: z.array(z.string()).optional(),
});

export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['security', 'validation', 'business']),
  rule: z.string(),
  severity: z.enum(['error', 'warning', 'info']).optional(),
});

export const UXSpecSchema = z.object({
  version: z.string().default('1.0.0'),
  name: z.string(),
  roles: z.array(RoleSchema).optional(),
  entities: z.array(EntitySchema),
  screens: z.array(ScreenSchema),
  flows: z.array(FlowSchema),
  policies: z.array(PolicySchema).optional(),
});

export type Role = z.infer<typeof RoleSchema>;
export type Field = z.infer<typeof FieldSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type Form = z.infer<typeof FormSchema>;
export type Screen = z.infer<typeof ScreenSchema>;
export type FlowStep = z.infer<typeof FlowStepSchema>;
export type Flow = z.infer<typeof FlowSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type UXSpec = z.infer<typeof UXSpecSchema>;