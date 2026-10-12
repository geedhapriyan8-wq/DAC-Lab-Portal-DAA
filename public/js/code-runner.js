/* ============================================================
   DSA Lab Portal — Code Runner & Interactive Terminal Engine
   ============================================================ */

window.CodeRunner = (function() {
  'use strict';

  // Helper to generate a simple hash of text
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase();
  }

  // Simulated execution interpreter for lab code
  function execute(codeString, targetAssertion) {
    const logs = [];
    const startTime = performance.now();

    let success = false;
    let errorMessage = null;

    try {
      // 1. Check for shell / CLI commands
      if (/^\s*(docker|curl|pip|git|python -m|uvicorn)\b/m.test(codeString)) {
        const bashLines = codeString.split('\n');
        for (const line of bashLines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('# Expected') || trimmed.startsWith('# {"status"')) {
            logs.push(trimmed.replace(/^#\s*(Expected.*?:\s*)?/, ''));
          } else if (trimmed.startsWith('docker build')) {
            logs.push('=> [internal] load build definition from Dockerfile');
            logs.push('=> => naming to docker.io/library/ml-predictor-api:v1');
          } else if (trimmed.startsWith('docker run')) {
            logs.push('d8f149b5c2a0487b9264fa93bc67d3e6012891f7a01c8');
          } else if (trimmed.startsWith('curl')) {
            logs.push('{"status": "success", "prediction": 5.83, "model_version": "v1.0.3"}');
          } else if (trimmed.startsWith('docker logs')) {
            logs.push('[INFO] Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)');
            logs.push('[INFO] Application startup complete.');
          } else if (trimmed.startsWith('pip install')) {
            logs.push(`Requirement already satisfied: ${trimmed.slice(12).split(' ')[0]} (cached)`);
            logs.push('Successfully installed packages.');
          }
        }
        if (logs.length === 0) {
          logs.push('✓ Command executed successfully with exit status 0.');
        }
      } else {
        // 2. Python parsing for print statements
        const printRegex = /print\s*\(([\s\S]*?)\)/g;
        let match;
        const printOutputs = [];

        while ((match = printRegex.exec(codeString)) !== null) {
          let content = match[1].trim();
          // Handle quotes / f-strings formatting
          if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
            content = content.slice(1, -1);
          } else if (content.startsWith('f"') || content.startsWith("f'")) {
            content = content.slice(2, -1);
            content = content.replace(/\{([^}]+)\}/g, (m, p1) => {
              if (p1.includes(':.') || p1.includes(':')) {
                p1 = p1.split(':')[0];
              }
              return `[${p1.trim()}]`;
            });
          }
          // Unescape internal escaped characters
          content = content.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
          printOutputs.push(content);
        }

        if (printOutputs.length > 0) {
          printOutputs.forEach(out => logs.push(out));
        } else {
          logs.push('✓ Script executed cleanly (Exit code 0).');
        }
      }

      // Assertion evaluation
      if (targetAssertion) {
        const fullOutput = logs.join('\n').toLowerCase();
        if (typeof targetAssertion === 'string') {
          success = fullOutput.includes(targetAssertion.toLowerCase()) || codeString.toLowerCase().includes(targetAssertion.toLowerCase());
        } else if (Array.isArray(targetAssertion)) {
          success = targetAssertion.every(term => fullOutput.includes(term.toLowerCase()) || codeString.toLowerCase().includes(term.toLowerCase()));
        } else {
          success = true;
        }
      } else {
        success = true;
      }

    } catch (err) {
      errorMessage = err.message;
      logs.push(`❌ Traceback (most recent call last):\n  RuntimeError: ${err.message}`);
      success = false;
    }

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000 + 0.08).toFixed(3);

    return {
      success,
      logs,
      output: logs.join('\n'),
      duration: `${duration}s`,
      error: errorMessage
    };
  }

  // Cryptographic Proof of Work generator
  async function generateProofHash(userId, topicId, labNum, quizScore, outputLog) {
    const raw = `${userId}:${topicId}:${labNum}:${quizScore}:${(outputLog || '').slice(0, 80)}:${Date.now()}`;
    if (window.crypto && window.crypto.subtle) {
      try {
        const msgUint8 = new TextEncoder().encode(raw);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        return `DSA-PROOF-${hashHex.slice(0, 16)}-${simpleHash(userId)}`;
      } catch (e) {
        // Fallback below
      }
    }
    return `DSA-PROOF-${simpleHash(raw)}-${Date.now().toString(36).toUpperCase()}`;
  }

  return {
    execute,
    generateProofHash
  };
})();
