// Type definitions for FlowLock CLI commands

export interface AuditOptions {
  fix?: boolean;
  inventory?: boolean;
  only?: string;
  skip?: string;
  json?: boolean;
  quiet?: boolean;
}

export interface InventoryOptions {
  config: string;
  out: string;
  dbOnly?: boolean;
  apiOnly?: boolean;
  uiOnly?: boolean;
}

export interface InitExistingOptions {
  skipScripts?: boolean;
  skipCommands?: boolean;
}

export interface WatchOptions {
  cloud?: boolean;
  cloudUrl?: string;
  projectId?: string;
}

export interface AgentOptions {
  cloud?: string;
  project?: string;
  token?: string;
}

export interface ExportOptions {
  format: 'junit' | 'csv' | 'svg' | 'json';
  output?: string;
}

export interface CommandResult {
  ok: boolean;
  code: number;
  out: string;
  artifacts?: string[];
}

export interface RuntimeInventory {
  db: {
    dialect?: string;
    entities: Array<{
      id: string;
      fields: Array<{
        id: string;
        type?: string;
      }>;
    }>;
  };
  api: {
    endpoints: Array<{
      path: string;
      methods: string[];
      returns?: {
        entity: string;
        fields: string[];
      };
    }>;
  };
  ui: {
    reads: string[];
    writes: string[];
  };
}