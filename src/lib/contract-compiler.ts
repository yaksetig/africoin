import { compileContract as compileContractAPI } from './api';

export interface CompilationResult {
  abi: any[];
  bytecode: string;
  success: boolean;
  errors: string[];
}

export async function compileContract(sourceCode: string): Promise<CompilationResult> {
  return await compileContractAPI(sourceCode);
}