import { parentPort, workerData } from 'worker_threads';

// Type definitions
interface WorkerData {
  params?: Record<string, any>;
  callStack?: string[];
  code: string;
}

interface CallActionMessage {
  type: string;
  payload: {
    identifier: string;
    params: Record<string, any>;
    callStack: string[];
  };
}

interface CallActionResultMessage {
  type: 'callActionResult';
  payload: any;
}

interface WorkerMessage {
  type?: string;
  error?: string;
  result?: any;
  payload?: any;
}

type MemoKey = string;
type MemoStore = Record<MemoKey, any>;

// Block unsafe globals
const disabled: Record<string, boolean> = {
  require: true,
  process: true,
  module: true,
  exports: true,
  __filename: true,
  __dirname: true,
  Buffer: true,
};

for (const key of Object.keys(disabled)) {
  (global as any)[key] = new Proxy(
    {},
    {
      get(): never {
        throw new Error(`${key} is disabled in sandbox`);
      },
    }
  );
}

// Freeze params to prevent accidental mutation
const params: Readonly<Record<string, any>> = Object.freeze(
  (workerData as WorkerData).params || {}
);
const callStack: string[] = (workerData as WorkerData).callStack || [];
const memo: MemoStore = {};

// -----------------------------
// Support nested callAction
// -----------------------------
async function requestSubAction(
  type: string,
  identifier: string,
  params: Record<string, any> = {}
): Promise<any> {
  const memoKey: MemoKey = JSON.stringify({ type, identifier, params });
  
  if (memo[memoKey]) {
    return memo[memoKey];
  }

  return new Promise((resolve) => {
    const messageHandler = (msg: CallActionResultMessage) => {
      if (msg.type === 'callActionResult') {
        memo[memoKey] = msg.payload;
        resolve(msg.payload);
      }
    };

    parentPort!.once('message', messageHandler);

    const message: CallActionMessage = {
      type,
      payload: { identifier, params, callStack },
    };
    parentPort!.postMessage(message);
  });
}

// Define global callAction functions
(global as any).callAction = (name: string, params: Record<string, any>) =>
  requestSubAction('callAction', name, params);
(global as any).callActionById = (id: string, params: Record<string, any>) =>
  requestSubAction('callActionById', id, params);

// -----------------------------
// Wrap user script into async function
// -----------------------------
let userFn: (params: Record<string, any>) => Promise<any>;

try {
  const wrappedFunction = `
    (async function(params){
      ${(workerData as WorkerData).code}
    })
  `;
  
  // Note: Using eval is generally unsafe, but this appears to be for a sandboxed environment
  const evaluatedFn = eval(wrappedFunction);
  
  if (typeof evaluatedFn !== 'function') {
    const errorMessage: WorkerMessage = { 
      error: `TypeError: The script must be a function` 
    };
    parentPort!.postMessage(errorMessage);
    return; // Exit gracefully without process.exit
  }
  
  userFn = evaluatedFn;
} catch (err: any) {
  const errorMessage: WorkerMessage = { 
    error: `SyntaxError: ${err.message}` 
  };
  parentPort!.postMessage(errorMessage);
  return; // Exit gracefully without process.exit
}

// -----------------------------
// Execute the wrapped function
// -----------------------------
(async (): Promise<void> => {
  try {
    const result = await userFn(params);
    const successMessage: WorkerMessage = { result };
    parentPort!.postMessage(successMessage);
  } catch (err: any) {
    const errorMessage: WorkerMessage = { 
      error: `ExecutionError: ${err.message}` 
    };
    parentPort!.postMessage(errorMessage);
  }
})();