const solc = require('solc');
const fs = require('fs');
const path = require('path');

// Function to find imports
function findImports(relativePath) {
  // Handle OpenZeppelin imports
  if (relativePath.startsWith('@openzeppelin/')) {
    const contractPath = path.join(__dirname, '../../node_modules', relativePath);
    try {
      const source = fs.readFileSync(contractPath, 'utf8');
      return { contents: source };
    } catch (error) {
      console.error(`Could not find import: ${relativePath}`);
      return { error: 'File not found' };
    }
  }
  
  return { error: 'File not found' };
}

async function compileContract(sourceCode) {
  const input = {
    language: 'Solidity',
    sources: {
      'Tokenize.sol': {
        content: sourceCode,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    const errors = output.errors.filter((error) => error.severity === 'error');
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.formattedMessage).join('\n'));
    }
  }

  const [, contractsInFile] = Object.entries(output.contracts || {})[0] || [];
  const [, contract] = contractsInFile ? Object.entries(contractsInFile)[0] : [];

  if (!contract) {
    throw new Error('No contract output found');
  }

  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
  };
}

module.exports = {
  compileContract
};
