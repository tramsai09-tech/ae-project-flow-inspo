// Extend window object to include CEP properties
declare global {
  interface Window {
    __adobe_cep__?: any;
    CSInterface?: any;
  }
}

/**
 * Executes an ExtendScript function in the After Effects host environment.
 * @param functionName The name of the function to execute (e.g. "applyBezierToSelectedKeys")
 * @param args Array of arguments to pass to the function
 * @returns Promise resolving with the response from the host script
 */
export function evalScript(functionName: string, ...args: any[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.CSInterface) {
      console.warn(`[CEP Adapter] Not running in CEP environment. Mocking call to ${functionName}`);
      return resolve(`MOCKED_RESPONSE_FROM_${functionName}`);
    }

    try {
      const cs = new window.CSInterface();
      const argsString = args.map(arg => {
        if (typeof arg === 'string') return `'${arg.replace(/'/g, "\\'")}'`;
        // Stringify objects and wrap them in single quotes so AE receives a JSON string
        return `'${JSON.stringify(arg).replace(/'/g, "\\'")}'`;
      }).join(', ');
      const script = `${functionName}(${argsString})`;
      
      cs.evalScript(script, (result: string) => {
        if (result && result.startsWith('ERROR:')) {
          reject(new Error(result));
        } else {
          resolve(result);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
