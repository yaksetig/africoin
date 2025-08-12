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
  try {
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
        return {
          abi: [],
          bytecode: '',
          success: false,
          errors: errors.map((e) => e.formattedMessage),
        };
      }
    }

    const contract = output.contracts['Tokenize.sol']['Tokenize'];
    
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
      success: true,
      errors: [],
    };
  } catch (error) {
    return {
      abi: [],
      bytecode: '',
      success: false,
      errors: [error.message || 'Unknown compilation error'],
    };
  }
}

module.exports = {
  compileContract
};
