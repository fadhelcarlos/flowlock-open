import { httpClient, HttpError, AuthError, NetworkError } from "../utils/http-client";

export interface CloudSendOptions {
  cloud?: boolean;
  cloudUrl?: string;
  projectId?: string;
  token?: string;
}

export class CloudError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'CloudError';
  }
}

export async function sendToCloud(
  payload: any,
  opts: CloudSendOptions = {}
): Promise<void> {
  if (!opts.cloud) {
    return;
  }

  if (!opts.cloudUrl || !opts.projectId) {
    throw new CloudError('Missing required cloud configuration: cloudUrl and projectId are required');
  }

  const url = opts.cloudUrl.replace(/\/$/, "") + "/ingest";
  const headers = opts.token ? { authorization: `Bearer ${opts.token}` } : {};
  const body = { project: opts.projectId, kind: "audit", payload };

  try {
    await httpClient.post(url, body, headers);
    console.log(`✅ Successfully sent audit data to cloud (project: ${opts.projectId})`);
  } catch (error) {
    if (error instanceof AuthError) {
      throw new CloudError(
        `Authentication failed when sending to cloud: ${error.message}. Please check your token.`,
        error,
        false
      );
    } else if (error instanceof NetworkError) {
      throw new CloudError(
        `Network error when sending to cloud: ${error.message}. Please check your internet connection and cloud URL.`,
        error,
        true
      );
    } else if (error instanceof HttpError) {
      const isRetryable = error.statusCode ? error.statusCode >= 500 : false;
      throw new CloudError(
        `HTTP error when sending to cloud: ${error.message}`,
        error,
        isRetryable
      );
    } else {
      throw new CloudError(
        `Unexpected error when sending to cloud: ${error}`,
        error as Error,
        false
      );
    }
  }
}

// Non-throwing version for backward compatibility in non-critical contexts
export async function sendToCloudSafe(
  payload: any,
  opts: CloudSendOptions = {}
): Promise<boolean> {
  try {
    await sendToCloud(payload, opts);
    return true;
  } catch (error) {
    if (error instanceof CloudError) {
      console.warn(`⚠️  Cloud send failed: ${error.message}`);
      if (error.originalError instanceof AuthError) {
        console.warn('💡 Try checking your authentication token or cloud credentials.');
      } else if (error.originalError instanceof NetworkError) {
        console.warn('💡 Try checking your internet connection and cloud URL.');
      }
    } else {
      console.warn(`⚠️  Cloud send failed:`, error);
    }
    return false;
  }
}
