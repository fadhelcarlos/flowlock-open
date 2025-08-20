declare module "better-sqlite3" {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement<BindParameters extends any[] = any[]> {
    database: Database;
    source: string;
    reader: boolean;
    readonly: boolean;
    busy: boolean;
    
    run(...params: BindParameters): RunResult;
    get(...params: BindParameters): any;
    all(...params: BindParameters): any[];
    iterate(...params: BindParameters): IterableIterator<any>;
    pluck(toggleState?: boolean): this;
    expand(toggleState?: boolean): this;
    raw(toggleState?: boolean): this;
    columns(): Array<{ name: string; column: string | null; table: string | null; database: string | null; type: string | null; }>;
    bind(...params: BindParameters): this;
  }

  interface Transaction<F extends (...args: any) => any> {
    (...args: Parameters<F>): ReturnType<F>;
    default(...args: Parameters<F>): ReturnType<F>;
    deferred(...args: Parameters<F>): ReturnType<F>;
    immediate(...args: Parameters<F>): ReturnType<F>;
    exclusive(...args: Parameters<F>): ReturnType<F>;
  }

  interface Database {
    memory: boolean;
    readonly: boolean;
    name: string;
    open: boolean;
    inTransaction: boolean;

    prepare<BindParameters extends any[] = any[]>(source: string): Statement<BindParameters>;
    transaction<F extends (...args: any) => any>(fn: F): Transaction<F>;
    pragma(source: string, options?: { simple?: boolean }): any;
    backup(destinationFile: string, options?: { attached?: string; progress?: (info: { totalPages: number; remainingPages: number }) => number }): Promise<void>;
    serialize(options?: { attached?: string }): Buffer;
    function(name: string, options: { varargs?: boolean; deterministic?: boolean; safeIntegers?: boolean }, fn: (...args: any[]) => any): this;
    aggregate(name: string, options: { start?: any; step: (total: any, next: any) => any; inverse?: (total: any, dropped: any) => any; result?: (total: any) => any; varargs?: boolean; deterministic?: boolean; safeIntegers?: boolean }): this;
    loadExtension(path: string, entryPoint?: string): this;
    exec(source: string): this;
    close(): this;
    defaultSafeIntegers(toggleState?: boolean): this;
    unsafeMode(toggleState?: boolean): this;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: { 
      readonly?: boolean;
      fileMustExist?: boolean;
      timeout?: number;
      verbose?: (message?: any, ...additionalArgs: any[]) => void;
      nativeBinding?: string;
    }): Database;
    (filename: string, options?: { 
      readonly?: boolean;
      fileMustExist?: boolean;
      timeout?: number;
      verbose?: (message?: any, ...additionalArgs: any[]) => void;
      nativeBinding?: string;
    }): Database;
    
    SqliteError: typeof Error;
  }

  const Database: DatabaseConstructor;
  export = Database;
}
