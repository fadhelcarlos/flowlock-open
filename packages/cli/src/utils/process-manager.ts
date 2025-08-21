import { spawn, ChildProcess, SpawnOptions } from "child_process";
import { EventEmitter } from "events";

export interface ProcessOptions extends SpawnOptions {
  timeout?: number;
  maxOutputLength?: number;
  killSignal?: NodeJS.Signals;
  retries?: number;
  retryDelay?: number;
}

export interface ProcessResult {
  code: number;
  signal?: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  success: boolean;
  timedOut: boolean;
}

export class ProcessError extends Error {
  constructor(
    message: string,
    public code?: number,
    public signal?: NodeJS.Signals | null,
    public stdout?: string,
    public stderr?: string,
    public timedOut: boolean = false
  ) {
    super(message);
    this.name = 'ProcessError';
  }
}

export class ProcessTimeoutError extends ProcessError {
  constructor(timeout: number, stdout?: string, stderr?: string) {
    super(`Process timed out after ${timeout}ms`, undefined, undefined, stdout, stderr, true);
    this.name = 'ProcessTimeoutError';
  }
}

export class ManagedProcess extends EventEmitter {
  private child?: ChildProcess;
  private timeoutId?: NodeJS.Timeout;
  private killed = false;
  private finished = false;
  
  constructor(
    private command: string,
    private args: string[] = [],
    private options: ProcessOptions = {}
  ) {
    super();
  }

  async run(): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
      const {
        timeout = 120000, // 2 minutes default
        maxOutputLength = 1024 * 1024, // 1MB default
        killSignal = 'SIGTERM',
        ...spawnOptions
      } = this.options;

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Create child process
      this.child = spawn(this.command, this.args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
        ...spawnOptions,
      });

      // Handle process creation errors
      this.child.on('error', (error) => {
        this.cleanup();
        reject(new ProcessError(`Failed to start process: ${error.message}`, undefined, undefined, stdout, stderr));
      });

      // Collect stdout
      this.child.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        if (stdout.length + chunk.length <= maxOutputLength) {
          stdout += chunk;
        } else {
          stdout = stdout.slice(0, maxOutputLength - chunk.length) + chunk;
        }
        this.emit('stdout', chunk);
      });

      // Collect stderr  
      this.child.stderr?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        if (stderr.length + chunk.length <= maxOutputLength) {
          stderr += chunk;
        } else {
          stderr = stderr.slice(0, maxOutputLength - chunk.length) + chunk;
        }
        this.emit('stderr', chunk);
      });

      // Handle process exit
      this.child.on('exit', (code, signal) => {
        if (this.finished) return;
        this.finished = true;
        
        this.cleanup();

        const result: ProcessResult = {
          code: code || 0,
          signal,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          success: !timedOut && code === 0,
          timedOut,
        };

        this.emit('exit', result);

        if (timedOut) {
          reject(new ProcessTimeoutError(timeout, stdout, stderr));
        } else if (code !== 0 && !this.killed) {
          const errorMsg = stderr || stdout || `Process exited with code ${code}`;
          reject(new ProcessError(errorMsg, code, signal, stdout, stderr));
        } else {
          resolve(result);
        }
      });

      // Set timeout
      if (timeout > 0) {
        this.timeoutId = setTimeout(() => {
          if (!this.finished) {
            timedOut = true;
            this.kill(killSignal);
          }
        }, timeout);
      }

      this.emit('start', this.child.pid);
    });
  }

  kill(signal: NodeJS.Signals = 'SIGTERM'): boolean {
    if (!this.child || this.finished) return false;
    
    this.killed = true;
    this.emit('kill', signal);
    
    try {
      // On Windows, try to kill the entire process tree
      if (process.platform === 'win32' && this.child.pid) {
        spawn('taskkill', ['/pid', this.child.pid.toString(), '/t', '/f'], { stdio: 'ignore' });
      } else {
        this.child.kill(signal);
      }
      return true;
    } catch (error) {
      this.emit('error', new ProcessError(`Failed to kill process: ${error}`));
      return false;
    }
  }

  private cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  get pid(): number | undefined {
    return this.child?.pid;
  }

  get isRunning(): boolean {
    return !this.finished && !!this.child && !this.child.killed;
  }
}

export class ProcessManager {
  private processes = new Map<string, ManagedProcess>();
  private isShuttingDown = false;

  constructor() {
    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGHUP', () => this.shutdown('SIGHUP'));
  }

  async runProcess(
    id: string,
    command: string,
    args: string[] = [],
    options: ProcessOptions = {}
  ): Promise<ProcessResult> {
    if (this.isShuttingDown) {
      throw new ProcessError('Process manager is shutting down');
    }

    // Kill existing process with same id
    await this.killProcess(id);

    const managedProcess = new ManagedProcess(command, args, options);
    this.processes.set(id, managedProcess);

    try {
      const result = await managedProcess.run();
      this.processes.delete(id);
      return result;
    } catch (error) {
      this.processes.delete(id);
      throw error;
    }
  }

  async runProcessWithRetry(
    id: string,
    command: string,
    args: string[] = [],
    options: ProcessOptions = {}
  ): Promise<ProcessResult> {
    const { retries = 0, retryDelay = 1000, ...processOptions } = options;
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.runProcess(`${id}_attempt_${attempt}`, command, args, processOptions);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry timeout errors or on the last attempt
        if (error instanceof ProcessTimeoutError || attempt === retries) {
          throw error;
        }

        console.warn(`Process ${id} failed (attempt ${attempt + 1}/${retries + 1}): ${lastError.message}. Retrying in ${retryDelay}ms...`);
        await this.delay(retryDelay);
      }
    }

    throw lastError!;
  }

  async killProcess(id: string): Promise<boolean> {
    const process = this.processes.get(id);
    if (!process) return false;

    const killed = process.kill();
    this.processes.delete(id);
    return killed;
  }

  async killAllProcesses(signal: NodeJS.Signals = 'SIGTERM'): Promise<void> {
    const killPromises = Array.from(this.processes.entries()).map(([id, process]) => {
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 5000); // 5 second timeout per process
        
        process.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        process.kill(signal);
      });
    });

    await Promise.all(killPromises);
    this.processes.clear();
  }

  getRunningProcesses(): string[] {
    return Array.from(this.processes.keys()).filter(id => {
      const process = this.processes.get(id);
      return process?.isRunning;
    });
  }

  async shutdown(signal?: NodeJS.Signals): Promise<void> {
    if (this.isShuttingDown) return;
    
    console.log(`\nProcess manager shutting down due to ${signal || 'shutdown'}...`);
    this.isShuttingDown = true;

    // First try graceful shutdown
    await this.killAllProcesses('SIGTERM');

    // Wait a bit, then force kill any remaining processes
    setTimeout(async () => {
      if (this.processes.size > 0) {
        console.log('Force killing remaining processes...');
        await this.killAllProcesses('SIGKILL');
      }
    }, 5000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global process manager instance
export const processManager = new ProcessManager();

// Convenience functions for backward compatibility
export async function runCommand(
  command: string,
  args: string[] = [],
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return processManager.runProcess(tempId, command, args, options);
}