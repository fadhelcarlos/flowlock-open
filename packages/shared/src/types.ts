/**
 * Shared type definitions for FlowLock system
 */

export interface FlowlockConfig {
  $schema?: string;
  projectName: string;
  inventory?: {
    db?: {
      mode?: "auto" | "schema" | "live";
      dialect?: "postgres" | "mysql" | "sqlite";
      urlEnv?: string;
      schemaFiles?: string[];
    };
    api?: {
      scan?: string[];
      jsdoc?: boolean;
      openapiPrefer?: boolean;
      specUrl?: string;
    };
    ui?: {
      scan?: string[];
      readAttribute?: string;
      writeAttribute?: string;
    };
  };
  audit?: {
    requireInventory?: boolean;
    checks?: string[];
  };
}

export interface RuntimeContext {
  projectRoot: string;
  configPath: string;
  config: FlowlockConfig;
  artifactsDir: string;
  inventoryPath?: string;
  determinismPath?: string;
}

export interface CheckContext extends RuntimeContext {
  enabledChecks: string[];
  fixMode: boolean;
  strictMode: boolean;
}