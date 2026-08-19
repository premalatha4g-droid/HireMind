const vm = require('vm');

/**
 * Executes candidate code against a list of test cases.
 * @param {string} candidateCode Javascript code submitted by candidate
 * @param {Array} testCases Array of test cases { input: string, expectedOutput: string }
 * @param {number} timeoutMs Execution timeout in milliseconds
 * @returns {Array} Results of executing each test case
 */
const execute = (candidateCode, testCases, timeoutMs = 2000) => {
  const results = [];
  try {
    const sandbox = {};
    vm.createContext(sandbox);
    
    // Execute candidate's functions definition in sandbox
    vm.runInContext(candidateCode, sandbox, { timeout: timeoutMs });
    
    // Find the first exported/defined function inside candidate scope
    let fnName = null;
    for (const k of Object.keys(sandbox)) {
      if (typeof sandbox[k] === 'function') {
        fnName = k;
        break;
      }
    }
    
    if (!fnName) {
      throw new Error('No entry function found.');
    }
    
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      let arg = tc.input;
      if (arg === undefined || arg === null) {
        arg = '[]';
      }
      if (typeof arg !== 'string') {
        arg = JSON.stringify(arg);
      }
      
      let runScript;
      const trimmed = arg.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        runScript = `${fnName}(...${arg})`;
      } else {
        runScript = `${fnName}(${arg})`;
      }

      try {
        const actual = vm.runInContext(runScript, sandbox, { timeout: timeoutMs });
        const actualStr = typeof actual === 'object' && actual !== null ? JSON.stringify(actual) : String(actual);
        const expectedStr = typeof tc.expectedOutput === 'object' && tc.expectedOutput !== null ? JSON.stringify(tc.expectedOutput) : String(tc.expectedOutput);
        const passed = actualStr === expectedStr || String(actual) === String(tc.expectedOutput);
        results.push({ passed, actual: actualStr, error: null });
      } catch (e) {
        results.push({ passed: false, actual: null, error: e.message });
      }
    }
  } catch (err) {
    results.push({ passed: false, actual: null, error: err.message });
  }

  if (results.length === 0) {
    results.push({ passed: false, actual: null, error: "Execution returned empty outputs." });
  }
  return results;
};

module.exports = {
  execute
};
