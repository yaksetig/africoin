import solc from 'solc';

export interface CompilationResult {
  abi: any[];
  bytecode: string;
  success: boolean;
  errors: string[];
}

export async function compileContract(sourceCode: string): Promise<CompilationResult> {
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
      const errors = output.errors.filter((error: any) => error.severity === 'error');
      if (errors.length > 0) {
        return {
          abi: [],
          bytecode: '',
          success: false,
          errors: errors.map((e: any) => e.formattedMessage),
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
      errors: [error instanceof Error ? error.message : 'Unknown compilation error'],
    };
  }
}