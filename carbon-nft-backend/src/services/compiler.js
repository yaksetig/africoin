const solc = require('solc');

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
        remappings: ['@openzeppelin/=node_modules/@openzeppelin/'],
      },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

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