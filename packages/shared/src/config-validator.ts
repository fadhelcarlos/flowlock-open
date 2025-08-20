/**
 * Configuration validation for FlowLock system
 */

import { FlowlockConfig } from './types';
import { ConfigurationError } from './errors';
import { validateRequiredField, validateArrayField, validateEnum } from './validation';

const VALID_DB_MODES = ['auto', 'schema', 'live'] as const;
const VALID_DB_DIALECTS = ['postgres', 'mysql', 'sqlite'] as const;
const VALID_CHECKS = [
  'DB_SCHEMA',
  'API_SURFACE', 
  'DB_PROVENANCE',
  'PII_BOUNDARY',
  'ROUTES',
  'CTAS',
  'HONEST_READS',
  'RUNTIME_DETERMINISM',
  'INVENTORY'
] as const;

export function validateFlowlockConfig(config: any): FlowlockConfig {
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError('Configuration must be an object');
  }

  // Required fields
  validateRequiredField(config.projectName, 'projectName');

  // Validate inventory section if present
  if (config.inventory) {
    const inv = config.inventory;
    
    // Validate DB configuration
    if (inv.db) {
      if (inv.db.mode) {
        validateEnum(inv.db.mode, VALID_DB_MODES, 'inventory.db.mode');
      }
      if (inv.db.dialect) {
        validateEnum(inv.db.dialect, VALID_DB_DIALECTS, 'inventory.db.dialect');
      }
      if (inv.db.schemaFiles) {
        validateArrayField(inv.db.schemaFiles, 'inventory.db.schemaFiles');
      }
    }

    // Validate API configuration
    if (inv.api) {
      if (inv.api.scan) {
        validateArrayField(inv.api.scan, 'inventory.api.scan');
      }
    }

    // Validate UI configuration
    if (inv.ui) {
      if (inv.ui.scan) {
        validateArrayField(inv.ui.scan, 'inventory.ui.scan');
      }
    }
  }

  // Validate audit section if present
  if (config.audit) {
    if (config.audit.checks) {
      validateArrayField(config.audit.checks, 'audit.checks');
      for (const check of config.audit.checks) {
        if (!VALID_CHECKS.includes(check)) {
          throw new ConfigurationError(
            `Invalid check '${check}' in audit.checks. Valid values: ${VALID_CHECKS.join(', ')}`
          );
        }
      }
    }
  }

  return config as FlowlockConfig;
}

export function loadFlowlockConfig(configPath: string): FlowlockConfig {
  const fs = require('fs');
  const path = require('path');
  const YAML = require('yaml');

  if (!fs.existsSync(configPath)) {
    throw new ConfigurationError(`Configuration file not found: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const isYaml = configPath.endsWith('.yaml') || configPath.endsWith('.yml');
  
  try {
    const parsed = isYaml ? YAML.parse(raw) : JSON.parse(raw);
    return validateFlowlockConfig(parsed);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new ConfigurationError(`Failed to parse configuration: ${error}`);
  }
}