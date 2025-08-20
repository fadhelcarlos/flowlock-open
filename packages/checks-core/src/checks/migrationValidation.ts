import type { CheckResult } from "flowlock-plugin-sdk";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

interface Migration {
  id: string;
  version: string;
  timestamp: number;
  checksum: string;
  description?: string;
  up: string;
  down?: string;
  transactional?: boolean;
  dependencies?: string[];
}

interface MigrationHistory {
  applied: Array<{
    id: string;
    version: string;
    checksum: string;
    appliedAt: number;
    executionTime?: number;
  }>;
  pending: Migration[];
  conflicts: Array<{
    id: string;
    issue: string;
  }>;
}

class MigrationValidator {
  private migrationsDir: string;
  private historyFile: string;
  
  constructor(
    migrationsDir = "migrations",
    historyFile = "artifacts/migration_history.json"
  ) {
    this.migrationsDir = path.resolve(process.cwd(), migrationsDir);
    this.historyFile = path.resolve(process.cwd(), historyFile);
  }
  
  private loadMigrations(): Migration[] {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }
    
    const migrations: Migration[] = [];
    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => /\.(sql|js|ts)$/.test(f))
      .sort();
    
    for (const file of files) {
      const filePath = path.join(this.migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse migration metadata from filename or content
      const match = file.match(/^(\d+)[-_](.+)\.(sql|js|ts)$/);
      if (!match) continue;
      
      const version = match[1];
      const description = match[2].replace(/[-_]/g, ' ');
      
      // Extract up/down scripts from content
      const upMatch = content.match(/--\s*UP\s*\n([\s\S]*?)(?:--\s*DOWN|$)/i);
      const downMatch = content.match(/--\s*DOWN\s*\n([\s\S]*?)$/i);
      
      // Check for transaction markers
      const transactional = !content.includes('-- NO TRANSACTION');
      
      // Extract dependencies
      const depMatch = content.match(/--\s*DEPENDS:\s*(.+)/i);
      const dependencies = depMatch ? depMatch[1].split(',').map(d => d.trim()) : [];
      
      migrations.push({
        id: file,
        version,
        timestamp: parseInt(version),
        checksum: this.calculateChecksum(content),
        description,
        up: upMatch ? upMatch[1].trim() : content,
        down: downMatch ? downMatch[1].trim() : undefined,
        transactional,
        dependencies
      });
    }
    
    return migrations;
  }
  
  private loadHistory(): MigrationHistory {
    if (!fs.existsSync(this.historyFile)) {
      return { applied: [], pending: [], conflicts: [] };
    }
    
    return JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
  }
  
  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
  
  private validateDependencies(migrations: Migration[]): CheckResult[] {
    const results: CheckResult[] = [];
    const versionSet = new Set(migrations.map(m => m.version));
    
    for (const migration of migrations) {
      if (!migration.dependencies) continue;
      
      for (const dep of migration.dependencies) {
        if (!versionSet.has(dep)) {
          results.push({
            id: `migration.dependency.missing.${migration.version}`,
            level: "error",
            status: "fail",
            message: `Migration ${migration.version} depends on missing migration ${dep}`
          });
        }
        
        // Check dependency order
        const depMigration = migrations.find(m => m.version === dep);
        if (depMigration && depMigration.timestamp > migration.timestamp) {
          results.push({
            id: `migration.dependency.order.${migration.version}`,
            level: "error",
            status: "fail",
            message: `Migration ${migration.version} depends on future migration ${dep}`
          });
        }
      }
    }
    
    return results;
  }
  
  private validateTransactionBoundaries(migration: Migration): CheckResult[] {
    const results: CheckResult[] = [];
    const sql = migration.up.toLowerCase();
    
    // Check for DDL operations that can't be in transactions (PostgreSQL specific)
    const nonTransactionalDDL = [
      'create index concurrently',
      'drop index concurrently',
      'alter type',
      'create database',
      'drop database'
    ];
    
    for (const ddl of nonTransactionalDDL) {
      if (sql.includes(ddl) && migration.transactional !== false) {
        results.push({
          id: `migration.transaction.invalid.${migration.version}`,
          level: "error",
          status: "fail",
          message: `Migration ${migration.version} contains '${ddl}' which cannot run in a transaction`
        });
      }
    }
    
    // Check for explicit transaction control
    if ((sql.includes('begin') || sql.includes('commit') || sql.includes('rollback')) && 
        migration.transactional !== false) {
      results.push({
        id: `migration.transaction.explicit.${migration.version}`,
        level: "warning",
        status: "fail",
        message: `Migration ${migration.version} has explicit transaction control but is marked as transactional`
      });
    }
    
    // Check for operations that should be in transactions
    const shouldBeTransactional = [
      'insert',
      'update',
      'delete',
      'alter table'
    ];
    
    const hasDataModification = shouldBeTransactional.some(op => sql.includes(op));
    if (hasDataModification && migration.transactional === false) {
      results.push({
        id: `migration.transaction.recommended.${migration.version}`,
        level: "warning",
        status: "fail",
        message: `Migration ${migration.version} modifies data but is not transactional`
      });
    }
    
    return results;
  }
  
  private validateRollback(migration: Migration): CheckResult[] {
    const results: CheckResult[] = [];
    
    if (!migration.down) {
      // Check if migration is reversible
      const sql = migration.up.toLowerCase();
      const irreversibleOps = [
        'drop table',
        'drop column',
        'drop constraint',
        'truncate'
      ];
      
      const hasIrreversible = irreversibleOps.some(op => sql.includes(op));
      
      if (hasIrreversible) {
        results.push({
          id: `migration.rollback.missing.${migration.version}`,
          level: "warning",
          status: "fail",
          message: `Migration ${migration.version} has potentially irreversible operations but no rollback script`
        });
      }
    } else {
      // Validate rollback script
      const upOps = this.extractOperations(migration.up);
      const downOps = this.extractOperations(migration.down);
      
      // Check for symmetry
      if (upOps.creates.length > 0 && downOps.drops.length === 0) {
        results.push({
          id: `migration.rollback.incomplete.${migration.version}`,
          level: "warning",
          status: "fail",
          message: `Migration ${migration.version} creates objects but rollback doesn't drop them`
        });
      }
    }
    
    return results;
  }
  
  private extractOperations(sql: string) {
    const lower = sql.toLowerCase();
    return {
      creates: [...lower.matchAll(/create\s+(table|index|view|function)\s+(\w+)/g)],
      drops: [...lower.matchAll(/drop\s+(table|index|view|function)\s+(\w+)/g)],
      alters: [...lower.matchAll(/alter\s+(table|index|view)\s+(\w+)/g)]
    };
  }
  
  private validateDataIntegrity(migration: Migration): CheckResult[] {
    const results: CheckResult[] = [];
    const sql = migration.up.toLowerCase();
    
    // Check for unsafe operations
    if (sql.includes('delete from') && !sql.includes('where')) {
      results.push({
        id: `migration.integrity.delete.${migration.version}`,
        level: "error",
        status: "fail",
        message: `Migration ${migration.version} contains DELETE without WHERE clause`
      });
    }
    
    if (sql.includes('update') && !sql.includes('where')) {
      results.push({
        id: `migration.integrity.update.${migration.version}`,
        level: "error",
        status: "fail",
        message: `Migration ${migration.version} contains UPDATE without WHERE clause`
      });
    }
    
    // Check for NOT NULL additions without defaults
    const notNullMatch = sql.match(/alter\s+table\s+\w+\s+(?:alter|modify)\s+column\s+\w+\s+[^,;]*not\s+null/gi);
    if (notNullMatch && !sql.includes('default')) {
      results.push({
        id: `migration.integrity.notnull.${migration.version}`,
        level: "warning",
        status: "fail",
        message: `Migration ${migration.version} adds NOT NULL constraint without default value`
      });
    }
    
    return results;
  }
  
  validate(): CheckResult[] {
    const results: CheckResult[] = [];
    
    // Load migrations and history
    const migrations = this.loadMigrations();
    const history = this.loadHistory();
    
    if (migrations.length === 0) {
      results.push({
        id: "migration.none",
        level: "info",
        status: "pass",
        message: "No migrations found"
      });
      return results;
    }
    
    // Check for checksum mismatches
    for (const applied of history.applied) {
      const migration = migrations.find(m => m.id === applied.id);
      if (migration && migration.checksum !== applied.checksum) {
        results.push({
          id: `migration.checksum.mismatch.${applied.version}`,
          level: "error",
          status: "fail",
          message: `Applied migration ${applied.version} has been modified after execution`
        });
      }
    }
    
    // Validate each migration
    for (const migration of migrations) {
      results.push(...this.validateTransactionBoundaries(migration));
      results.push(...this.validateRollback(migration));
      results.push(...this.validateDataIntegrity(migration));
    }
    
    // Validate dependencies
    results.push(...this.validateDependencies(migrations));
    
    // Check for gaps in version numbers
    const versions = migrations.map(m => parseInt(m.version)).sort((a, b) => a - b);
    for (let i = 1; i < versions.length; i++) {
      if (versions[i] - versions[i - 1] > 1) {
        results.push({
          id: "migration.gap",
          level: "warning",
          status: "fail",
          message: `Gap in migration versions between ${versions[i - 1]} and ${versions[i]}`
        });
      }
    }
    
    // Report pending migrations
    const appliedVersions = new Set(history.applied.map(a => a.version));
    const pending = migrations.filter(m => !appliedVersions.has(m.version));
    
    if (pending.length > 0) {
      results.push({
        id: "migration.pending",
        level: "info",
        status: "pass",
        message: `${pending.length} pending migration(s): ${pending.map(m => m.version).join(', ')}`
      });
    }
    
    if (results.filter(r => r.status === 'fail').length === 0) {
      results.push({
        id: "migration.validation.ok",
        level: "info",
        status: "pass",
        message: `All ${migrations.length} migrations validated successfully`
      });
    }
    
    return results;
  }
}

export function checkMigrationValidation(): CheckResult[] {
  const validator = new MigrationValidator();
  return validator.validate();
}

// Helper to generate migration template
export function generateMigrationTemplate(
  name: string,
  options?: {
    transactional?: boolean;
    dependencies?: string[];
    reversible?: boolean;
  }
): string {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
  
  let template = `-- Migration: ${name}
-- Timestamp: ${timestamp}
-- Date: ${new Date().toISOString()}
`;
  
  if (options?.dependencies && options.dependencies.length > 0) {
    template += `-- DEPENDS: ${options.dependencies.join(', ')}\n`;
  }
  
  if (options?.transactional === false) {
    template += `-- NO TRANSACTION\n`;
  }
  
  template += `
-- UP
-- Add your forward migration SQL here

`;
  
  if (options?.reversible !== false) {
    template += `-- DOWN
-- Add your rollback SQL here

`;
  }
  
  return template;
}