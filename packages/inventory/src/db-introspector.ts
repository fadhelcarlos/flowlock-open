import { Pool as PgPool } from "pg";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";

export interface ConnectionConfig {
  url: string;
  dialect: 'postgres' | 'mysql' | 'sqlite';
  poolSize?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface DbIntrospectionResult {
  entities: Array<{
    id: string;
    fields: Array<{
      id: string;
      type?: string;
      nullable?: boolean;
      defaultValue?: any;
      isPrimary?: boolean;
      isForeign?: boolean;
      references?: { table: string; column: string };
    }>;
  }>;
  indexes: Array<{
    name: string;
    table: string;
    columns: string[];
    unique: boolean;
    type?: string;
  }>;
  constraints: Array<{
    name: string;
    type: string;
    table: string;
    definition: string;
  }>;
  stats?: {
    totalTables: number;
    totalColumns: number;
    totalIndexes: number;
    totalConstraints: number;
  };
}

class DbIntrospector {
  private config: ConnectionConfig;
  private pgPool?: PgPool;
  private mysqlPool?: mysql.Pool;
  
  constructor(config: ConnectionConfig) {
    this.config = {
      poolSize: 10,
      connectionTimeout: 5000,
      queryTimeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config
    };
  }
  
  async connect(): Promise<void> {
    switch (this.config.dialect) {
      case 'postgres':
        this.pgPool = new PgPool({
          connectionString: this.config.url,
          max: this.config.poolSize,
          connectionTimeoutMillis: this.config.connectionTimeout,
          statement_timeout: this.config.queryTimeout,
        });
        // Test connection
        await this.pgPool.query('SELECT 1');
        break;
        
      case 'mysql':
        this.mysqlPool = mysql.createPool({
          uri: this.config.url,
          connectionLimit: this.config.poolSize,
          connectTimeout: this.config.connectionTimeout,
          waitForConnections: true,
          queueLimit: 0,
        });
        // Test connection
        await this.mysqlPool.execute('SELECT 1');
        break;
        
      case 'sqlite':
        // SQLite doesn't need connection pooling
        break;
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.mysqlPool) {
      await this.mysqlPool.end();
    }
  }
  
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < this.config.retries!; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`${operationName} attempt ${i + 1} failed:`, error);
        
        if (i < this.config.retries! - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }
    
    throw new Error(`${operationName} failed after ${this.config.retries} attempts: ${lastError?.message}`);
  }
  
  async introspect(): Promise<DbIntrospectionResult> {
    await this.connect();
    
    try {
      return await this.retryOperation(
        () => this.performIntrospection(),
        'Database introspection'
      );
    } finally {
      await this.disconnect();
    }
  }
  
  private async performIntrospection(): Promise<DbIntrospectionResult> {
    switch (this.config.dialect) {
      case 'postgres':
        return this.introspectPostgres();
      case 'mysql':
        return this.introspectMySQL();
      case 'sqlite':
        return this.introspectSQLite();
      default:
        throw new Error(`Unsupported dialect: ${this.config.dialect}`);
    }
  }
  
  private async introspectPostgres(): Promise<DbIntrospectionResult> {
    if (!this.pgPool) throw new Error('PostgreSQL connection not established');
    
    // Get tables and columns with foreign key info
    const tablesQuery = await this.pgPool.query(`
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        tc.constraint_type,
        kcu2.table_name as foreign_table,
        kcu2.column_name as foreign_column
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage kcu 
        ON c.table_schema = kcu.table_schema
        AND c.table_name = kcu.table_name
        AND c.column_name = kcu.column_name
      LEFT JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
        AND kcu.table_schema = tc.table_schema
      LEFT JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      LEFT JOIN information_schema.key_column_usage kcu2
        ON rc.unique_constraint_name = kcu2.constraint_name
        AND rc.unique_constraint_schema = kcu2.constraint_schema
      WHERE c.table_schema = 'public'
        AND c.table_name NOT LIKE 'pg_%'
      ORDER BY c.table_name, c.ordinal_position
    `);
    
    // Get indexes
    const indexesQuery = await this.pgPool.query(`
      SELECT 
        i.relname as index_name,
        t.relname as table_name,
        array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns,
        ix.indisunique as is_unique,
        am.amname as index_type
      FROM pg_index ix
      JOIN pg_class i ON ix.indexrelid = i.oid
      JOIN pg_class t ON ix.indrelid = t.oid
      JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = ANY(ix.indkey)
      JOIN pg_am am ON i.relam = am.oid
      WHERE t.relkind = 'r'
        AND t.relname NOT LIKE 'pg_%'
      GROUP BY i.relname, t.relname, ix.indisunique, am.amname
    `);
    
    // Get constraints
    const constraintsQuery = await this.pgPool.query(`
      SELECT 
        conname as name,
        contype as type,
        conrelid::regclass as table_name,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
    `);
    
    // Process results
    const entityMap = new Map<string, any>();
    
    for (const row of tablesQuery.rows) {
      const tableName = this.pascalCase(row.table_name);
      
      if (!entityMap.has(tableName)) {
        entityMap.set(tableName, {
          id: tableName,
          fields: []
        });
      }
      
      entityMap.get(tableName).fields.push({
        id: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        defaultValue: row.column_default,
        isPrimary: row.constraint_type === 'PRIMARY KEY',
        isForeign: row.constraint_type === 'FOREIGN KEY',
        references: row.foreign_table ? {
          table: this.pascalCase(row.foreign_table),
          column: row.foreign_column
        } : undefined
      });
    }
    
    const indexes = indexesQuery.rows.map(row => ({
      name: row.index_name,
      table: this.pascalCase(row.table_name),
      columns: row.columns,
      unique: row.is_unique,
      type: row.index_type
    }));
    
    const constraints = constraintsQuery.rows.map(row => ({
      name: row.name,
      type: this.mapConstraintType(row.type),
      table: String(row.table_name),
      definition: row.definition
    }));
    
    const entities = Array.from(entityMap.values());
    
    return {
      entities,
      indexes,
      constraints,
      stats: {
        totalTables: entities.length,
        totalColumns: entities.reduce((sum, e) => sum + e.fields.length, 0),
        totalIndexes: indexes.length,
        totalConstraints: constraints.length
      }
    };
  }
  
  private async introspectMySQL(): Promise<DbIntrospectionResult> {
    if (!this.mysqlPool) throw new Error('MySQL connection not established');
    
    const dbName = new URL(this.config.url).pathname.slice(1);
    
    // Get tables and columns
    const [tables] = await this.mysqlPool.execute(`
      SELECT 
        c.TABLE_NAME,
        c.COLUMN_NAME,
        c.DATA_TYPE,
        c.IS_NULLABLE,
        c.COLUMN_DEFAULT,
        c.COLUMN_KEY,
        kcu.REFERENCED_TABLE_NAME,
        kcu.REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS c
      LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        ON c.TABLE_SCHEMA = kcu.TABLE_SCHEMA
        AND c.TABLE_NAME = kcu.TABLE_NAME
        AND c.COLUMN_NAME = kcu.COLUMN_NAME
        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
      WHERE c.TABLE_SCHEMA = ?
      ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION
    `, [dbName]);
    
    // Get indexes
    const [indexes] = await this.mysqlPool.execute(`
      SELECT 
        INDEX_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND INDEX_NAME != 'PRIMARY'
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `, [dbName]);
    
    // Process results (similar to PostgreSQL)
    const entityMap = new Map<string, any>();
    const indexMap = new Map<string, any>();
    
    for (const row of tables as any[]) {
      const tableName = this.pascalCase(row.TABLE_NAME);
      
      if (!entityMap.has(tableName)) {
        entityMap.set(tableName, {
          id: tableName,
          fields: []
        });
      }
      
      entityMap.get(tableName).fields.push({
        id: row.COLUMN_NAME,
        type: row.DATA_TYPE,
        nullable: row.IS_NULLABLE === 'YES',
        defaultValue: row.COLUMN_DEFAULT,
        isPrimary: row.COLUMN_KEY === 'PRI',
        isForeign: !!row.REFERENCED_TABLE_NAME,
        references: row.REFERENCED_TABLE_NAME ? {
          table: this.pascalCase(row.REFERENCED_TABLE_NAME),
          column: row.REFERENCED_COLUMN_NAME
        } : undefined
      });
    }
    
    // Process indexes
    for (const row of indexes as any[]) {
      const key = `${row.TABLE_NAME}_${row.INDEX_NAME}`;
      
      if (!indexMap.has(key)) {
        indexMap.set(key, {
          name: row.INDEX_NAME,
          table: this.pascalCase(row.TABLE_NAME),
          columns: [],
          unique: !row.NON_UNIQUE
        });
      }
      
      indexMap.get(key).columns.push(row.COLUMN_NAME);
    }
    
    const entities = Array.from(entityMap.values());
    const indexList = Array.from(indexMap.values());
    
    return {
      entities,
      indexes: indexList,
      constraints: [], // MySQL constraints are handled differently
      stats: {
        totalTables: entities.length,
        totalColumns: entities.reduce((sum, e) => sum + e.fields.length, 0),
        totalIndexes: indexList.length,
        totalConstraints: 0
      }
    };
  }
  
  private introspectSQLite(): DbIntrospectionResult {
    const dbPath = this.config.url.replace(/^sqlite:/, '');
    const db = new Database(dbPath, { readonly: true });
    
    try {
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
      
      const entities: any[] = [];
      const indexes: any[] = [];
      
      for (const table of tables) {
        const tableName = String(table.name);
        const columns = db.prepare(`PRAGMA table_info('${tableName}')`).all();
        const tableIndexes = db.prepare(`PRAGMA index_list('${tableName}')`).all();
        const foreignKeys = db.prepare(`PRAGMA foreign_key_list('${tableName}')`).all();
        
        const fkMap = new Map<string, any>();
        for (const fk of foreignKeys as any[]) {
          fkMap.set(fk.from, {
            table: this.pascalCase(fk.table),
            column: fk.to
          });
        }
        
        entities.push({
          id: this.pascalCase(tableName),
          fields: (columns as any[]).map(col => ({
            id: col.name,
            type: col.type,
            nullable: !col.notnull,
            defaultValue: col.dflt_value,
            isPrimary: col.pk === 1,
            isForeign: fkMap.has(col.name),
            references: fkMap.get(col.name)
          }))
        });
        
        // Process indexes
        for (const idx of tableIndexes as any[]) {
          const indexInfo = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
          
          indexes.push({
            name: idx.name,
            table: this.pascalCase(tableName),
            columns: (indexInfo as any[]).map(i => i.name),
            unique: idx.unique === 1
          });
        }
      }
      
      return {
        entities,
        indexes,
        constraints: [],
        stats: {
          totalTables: entities.length,
          totalColumns: entities.reduce((sum, e) => sum + e.fields.length, 0),
          totalIndexes: indexes.length,
          totalConstraints: 0
        }
      };
    } finally {
      db.close();
    }
  }
  
  private pascalCase(str: string): string {
    return str.replace(/(^|[-_./])(\w)/g, (_, __, letter) => letter.toUpperCase());
  }
  
  private mapConstraintType(pgType: string): string {
    const typeMap: Record<string, string> = {
      'c': 'check',
      'f': 'foreign',
      'p': 'primary',
      'u': 'unique',
      't': 'trigger',
      'x': 'exclusion'
    };
    return typeMap[pgType] || pgType;
  }
}

export async function introspectDatabase(config: ConnectionConfig): Promise<DbIntrospectionResult> {
  const introspector = new DbIntrospector(config);
  return introspector.introspect();
}

export async function extractDatabaseSchema(
  url: string, 
  dialect: 'postgres' | 'mysql' | 'sqlite',
  outputPath?: string
): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  
  const result = await introspectDatabase({
    url,
    dialect,
    poolSize: 5,
    connectionTimeout: 10000,
    queryTimeout: 30000,
    retries: 3
  });
  
  const schemaPath = outputPath || path.resolve(process.cwd(), 'artifacts/db_schema.json');
  
  // Ensure directory exists
  const dir = path.dirname(schemaPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write schema
  fs.writeFileSync(schemaPath, JSON.stringify(result, null, 2));
  
  console.log(`✅ Database schema extracted to ${schemaPath}`);
  console.log(`   Tables: ${result.stats?.totalTables}`);
  console.log(`   Columns: ${result.stats?.totalColumns}`);
  console.log(`   Indexes: ${result.stats?.totalIndexes}`);
}