import type { UXSpec } from "flowlock-uxspec";
import type { CheckResult } from "flowlock-plugin-sdk";
import fs from "node:fs";
import path from "node:path";

interface DbValidationConfig {
  requireTransactions?: boolean;
  requireIndexes?: boolean;
  requireConstraints?: boolean;
  requireAuth?: boolean;
  maxConnectionPoolSize?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
}

interface DbSchema {
  tables: DbTable[];
  indexes: DbIndex[];
  constraints: DbConstraint[];
  triggers?: DbTrigger[];
}

interface DbTable {
  name: string;
  columns: DbColumn[];
  primaryKey?: string[];
  foreignKeys?: ForeignKey[];
}

interface DbColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  unique?: boolean;
}

interface DbIndex {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

interface DbConstraint {
  name: string;
  type: 'check' | 'unique' | 'foreign' | 'primary';
  table: string;
  definition: string;
}

interface ForeignKey {
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

interface DbTrigger {
  name: string;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  timing: 'BEFORE' | 'AFTER';
  function: string;
}

// Load database schema from inventory or config
function loadDbSchema(): DbSchema | null {
  const schemaPath = path.resolve(process.cwd(), "artifacts/db_schema.json");
  if (!fs.existsSync(schemaPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(schemaPath, "utf8"));
}

// Validate transaction boundaries in flows
function validateTransactionBoundaries(spec: UXSpec): CheckResult[] {
  const results: CheckResult[] = [];
  
  for (const flow of spec.flows ?? []) {
    const writesPerStep = new Map<string, string[]>();
    
    for (const step of flow.steps ?? []) {
      if (step.writes && step.writes.length > 1) {
        // Multiple writes in single step should be transactional
        const entities = new Set(step.writes.map(w => String(w).split('.')[0]));
        if (entities.size > 1) {
          results.push({
            id: `db.transaction.boundary.${flow.id}.${step.id}`,
            level: "warning",
            status: "fail",
            message: `Step '${step.id}' in flow '${flow.id}' writes to multiple entities without explicit transaction boundary`
          });
        }
      }
    }
  }
  
  return results;
}

// Validate indexes for frequently queried fields
function validateIndexes(spec: UXSpec, schema: DbSchema): CheckResult[] {
  const results: CheckResult[] = [];
  const queryPatterns = new Map<string, number>();
  
  // Collect query patterns from screens and flows
  for (const screen of spec.screens ?? []) {
    for (const read of screen.reads ?? []) {
      const key = String(read);
      queryPatterns.set(key, (queryPatterns.get(key) ?? 0) + 1);
    }
  }
  
  // Check for missing indexes on frequently queried fields
  for (const [fieldPath, count] of queryPatterns) {
    if (count >= 3) { // Threshold for frequent queries
      const [entity, field] = fieldPath.split('.');
      const table = schema.tables.find(t => t.name.toLowerCase() === entity.toLowerCase());
      
      if (table) {
        const hasIndex = schema.indexes.some(idx => 
          idx.table === table.name && idx.columns.includes(field)
        );
        
        if (!hasIndex) {
          results.push({
            id: `db.index.missing.${entity}.${field}`,
            level: "warning",
            status: "fail",
            message: `Field '${entity}.${field}' is frequently queried (${count} times) but lacks an index`
          });
        }
      }
    }
  }
  
  return results;
}

// Validate auth integration with database
function validateAuthIntegration(spec: UXSpec, schema: DbSchema): CheckResult[] {
  const results: CheckResult[] = [];
  
  // Check for user/auth related tables
  const authTables = ['users', 'user', 'auth', 'sessions', 'roles', 'permissions'];
  const hasAuthTable = schema.tables.some(t => 
    authTables.includes(t.name.toLowerCase())
  );
  
  if (!hasAuthTable && spec.screens?.some(s => s.roles && s.roles.length > 0)) {
    results.push({
      id: "db.auth.missing_table",
      level: "error",
      status: "fail",
      message: "Screens define roles but no auth-related tables found in database"
    });
  }
  
  // Check for RLS or row-level security if using PostgreSQL
  const userTable = schema.tables.find(t => t.name.toLowerCase() === 'users');
  if (userTable) {
    // Validate password field encryption
    const passwordField = userTable.columns.find(c => 
      c.name.toLowerCase().includes('password')
    );
    
    if (passwordField && !passwordField.name.includes('hash')) {
      results.push({
        id: "db.auth.password_encryption",
        level: "error",
        status: "fail",
        message: "Password field should be stored as hash, not plain text"
      });
    }
  }
  
  return results;
}

// Validate connection pooling configuration
function validateConnectionPooling(config: DbValidationConfig): CheckResult[] {
  const results: CheckResult[] = [];
  
  if (!config.maxConnectionPoolSize || config.maxConnectionPoolSize < 10) {
    results.push({
      id: "db.pool.size",
      level: "warning",
      status: "fail",
      message: `Connection pool size (${config.maxConnectionPoolSize ?? 'not set'}) may be too small for production`
    });
  }
  
  if (!config.connectionTimeout || config.connectionTimeout > 30000) {
    results.push({
      id: "db.pool.timeout",
      level: "warning", 
      status: "fail",
      message: `Connection timeout (${config.connectionTimeout ?? 'not set'}ms) should be configured for resilience`
    });
  }
  
  return results;
}

// Validate data integrity constraints
function validateDataIntegrity(spec: UXSpec, schema: DbSchema): CheckResult[] {
  const results: CheckResult[] = [];
  
  for (const entity of spec.entities ?? []) {
    const table = schema.tables.find(t => 
      t.name.toLowerCase() === entity.id.toLowerCase()
    );
    
    if (!table) continue;
    
    // Check for primary key
    if (!table.primaryKey || table.primaryKey.length === 0) {
      results.push({
        id: `db.integrity.primary_key.${entity.id}`,
        level: "error",
        status: "fail",
        message: `Table '${entity.id}' lacks a primary key`
      });
    }
    
    // Check required fields have NOT NULL constraints
    for (const field of entity.fields ?? []) {
      if (field.required) {
        const column = table.columns.find(c => c.name === field.id);
        if (column && column.nullable) {
          results.push({
            id: `db.integrity.nullable.${entity.id}.${field.id}`,
            level: "warning",
            status: "fail",
            message: `Required field '${entity.id}.${field.id}' allows NULL in database`
          });
        }
      }
    }
    
    // Check for orphan prevention on relationships
    for (const relation of entity.relations ?? []) {
      const fk = table.foreignKeys?.find(fk => 
        fk.referencedTable.toLowerCase() === relation.entity.toLowerCase()
      );
      
      if (fk && !fk.onDelete) {
        results.push({
          id: `db.integrity.cascade.${entity.id}.${relation.entity}`,
          level: "warning",
          status: "fail",
          message: `Foreign key to '${relation.entity}' lacks ON DELETE rule, may cause orphans`
        });
      }
    }
  }
  
  return results;
}

// Main validation function
export function checkDatabaseValidation(spec: UXSpec): CheckResult[] {
  const results: CheckResult[] = [];
  
  // Load configuration
  const configPath = path.resolve(process.cwd(), "flowlock.config.json");
  let config: DbValidationConfig = {};
  
  if (fs.existsSync(configPath)) {
    const flowlockConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config = flowlockConfig.database ?? {};
  }
  
  // Load database schema
  const schema = loadDbSchema();
  
  if (!schema) {
    results.push({
      id: "db.schema.missing",
      level: "warning",
      status: "fail",
      message: "Database schema not found at artifacts/db_schema.json. Run schema extraction first."
    });
    
    // Can still validate transaction boundaries without schema
    results.push(...validateTransactionBoundaries(spec));
    return results;
  }
  
  // Run all validations
  results.push(...validateTransactionBoundaries(spec));
  results.push(...validateIndexes(spec, schema));
  results.push(...validateAuthIntegration(spec, schema));
  results.push(...validateConnectionPooling(config));
  results.push(...validateDataIntegrity(spec, schema));
  
  if (results.length === 0) {
    results.push({
      id: "db.validation.ok",
      level: "info",
      status: "pass",
      message: "Database validations passed - transactions, indexes, auth, pooling, and integrity checks OK"
    });
  }
  
  return results;
}