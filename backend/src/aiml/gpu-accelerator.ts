/**
 * GPU Accelerator Module
 * Provides TypeScript interface to Python-based GPU acceleration for the Audotics platform
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Define interfaces for GPU information
export interface GPUInfo {
  pytorch: {
    available: boolean;
    version?: string | null;
    cuda_version?: string | null;
    devices: Array<{
      name: string;
      memory_total_mb: number;
      compute_capability?: string | null;
      memory_allocated_mb?: number | null;
    }>;
  };
  tensorflow: {
    available: boolean;
    version?: string | null;
    devices: Array<{
      name: string;
      memory_total_mb?: number | null;
    }>;
  };
  test_results?: {
    matrix_multiply_time_ms: number;
    memory_allocated_mb?: number | null;
  } | null;
}

export interface TrainingResults {
  device: string;
  epochs: number;
  batch_size: number;
  training_time_seconds: number;
  loss: number[];
  accuracy: number[];
  memory_usage_mb?: number | null;
  gpu_utilization?: number | null;
  gpu_stats?: Array<{
    epoch: number;
    memory_allocated_mb: number;
    memory_reserved_mb: number;
    gpu_utilization: number | null;
    epoch_time_seconds: number;
  }> | null;
  error?: string;
}

// Helper function to run Python command and return JSON result
async function runPythonCommand(
  scriptPath: string, 
  args: string[] = [], 
  inputData: any = null
): Promise<any> {
  // Set a default if Python is installed using venv or conda
  const pythonBinaries = [
    'python',        // System default
    'python3',       // Unix/Linux default
    'py'             // Windows Python launcher
  ];

  // Find the first working Python executable
  let pythonPath = pythonBinaries[0];  // Default to first option

  // Check if the GPU accelerator script exists
  const gpuScriptPath = path.resolve(scriptPath);
  if (!fs.existsSync(gpuScriptPath)) {
    throw new Error(`GPU accelerator script not found at ${gpuScriptPath}`);
  }

  return new Promise((resolve, reject) => {
    // Create a temporary file for input data if provided
    let tempFilePath = '';
    if (inputData) {
      tempFilePath = path.join(os.tmpdir(), `gpu_input_${Date.now()}.json`);
      fs.writeFileSync(tempFilePath, JSON.stringify(inputData));
      args.push('--input', tempFilePath);
    }

    // Run the Python process
    console.log(`Running: ${pythonPath} ${gpuScriptPath} ${args.join(' ')}`);
    const process = spawn(pythonPath, [gpuScriptPath, ...args]);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      // Clean up temporary file if created
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          console.error('Error cleaning up temporary file:', e);
        }
      }

      if (code !== 0) {
        return reject(new Error(`GPU command failed with code ${code}: ${stderr}`));
      }

      try {
        // Find JSON output in stdout (ignoring any other prints)
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonResult = JSON.parse(jsonMatch[0]);
          resolve(jsonResult);
        } else {
          reject(new Error(`No valid JSON output found: ${stdout}`));
        }
      } catch (error) {
        reject(new Error(`Failed to parse GPU command output: ${error.message}\nOutput: ${stdout}`));
      }
    });

    process.on('error', (error) => {
      // Try with alternative Python commands if available
      if (pythonBinaries.length > 1) {
        const alternative = pythonBinaries.shift();
        if (alternative !== undefined) {
          pythonBinaries.push(alternative); // Move to end of array
          pythonPath = pythonBinaries[0];
          console.log(`Trying alternative Python command: ${pythonPath}`);
          runPythonCommand(scriptPath, args, inputData).then(resolve).catch(reject);
        } else {
          console.error('Failed to get alternative Python command');
          reject(new Error(`Failed to start GPU process: ${error.message}`));
        }
      } else {
        reject(new Error(`Failed to start GPU process: ${error.message}`));
      }
    });
  });
}

/**
 * Get GPU information including availability, device specs and test results
 */
export async function getGPUInfo(): Promise<GPUInfo> {
  try {
    const scriptPath = path.join(__dirname, 'python', 'gpu_accelerator.py');
    const result = await runPythonCommand(scriptPath, ['--action', 'info']);
    return result.gpu as GPUInfo;
  } catch (error) {
    console.error('Error getting GPU info:', error);
    return {
      pytorch: {
        available: false,
        devices: []
      },
      tensorflow: {
        available: false,
        devices: []
      }
    };
  }
}

/**
 * Run a GPU test to verify functionality
 */
export async function testGPU(): Promise<any> {
  try {
    const scriptPath = path.join(__dirname, 'python', 'gpu_accelerator.py');
    return await runPythonCommand(scriptPath, ['--action', 'test']);
  } catch (error) {
    console.error('Error testing GPU:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Train a model using GPU acceleration
 * @param config Configuration for the training
 * @param trainingData Optional training data
 * @param modelOutputPath Optional path to save the model
 */
export async function trainWithGPU(
  config: any,
  trainingData?: any,
  modelOutputPath?: string
): Promise<TrainingResults> {
  try {
    const scriptPath = path.join(__dirname, 'python', 'gpu_accelerator.py');
    const args = ['--action', 'train'];
    
    if (modelOutputPath) {
      args.push('--output', modelOutputPath);
    }

    // Enhanced configuration with mixed precision support
    const enhancedConfig = {
      ...config,
      use_mixed_precision: true,  // Enable mixed precision training by default
      optimize_memory: true       // Enable memory optimization
    };

    const result = await runPythonCommand(scriptPath, args, {
      config: enhancedConfig,
      training_data: trainingData || null
    });
    
    // Log detailed GPU performance metrics if available
    if (result.gpu_stats && result.gpu_stats.length > 0) {
      console.log('==== GPU Performance Metrics ====');
      console.log(`Average GPU Utilization: ${calculateAverageUtilization(result.gpu_stats)}%`);
      console.log(`Peak Memory Usage: ${calculatePeakMemory(result.gpu_stats)} MB`);
      console.log(`Fastest Epoch: ${findFastestEpoch(result.gpu_stats)} seconds`);
      console.log('================================');
    }
    
    return result;
  } catch (error) {
    console.error('Error training with GPU:', error);
    throw new Error(`GPU training failed: ${error.message}`);
  }
}

/**
 * Calculate average GPU utilization from epoch stats
 */
function calculateAverageUtilization(gpuStats: Array<{gpu_utilization: number | null}>): number {
  const validStats = gpuStats.filter(stat => stat.gpu_utilization !== null);
  if (validStats.length === 0) return 0;
  
  const sum = validStats.reduce((acc, stat) => acc + (stat.gpu_utilization || 0), 0);
  return Math.round(sum / validStats.length);
}

/**
 * Find peak memory usage from epoch stats
 */
function calculatePeakMemory(gpuStats: Array<{memory_allocated_mb: number}>): number {
  return Math.max(...gpuStats.map(stat => stat.memory_allocated_mb));
}

/**
 * Find the fastest epoch time
 */
function findFastestEpoch(gpuStats: Array<{epoch: number, epoch_time_seconds: number}>): number {
  const fastestEpoch = gpuStats.reduce((fastest, current) => 
    current.epoch_time_seconds < fastest.epoch_time_seconds ? current : fastest, 
    gpuStats[0]);
  
  return fastestEpoch.epoch_time_seconds;
}

/**
 * Check if GPU acceleration is available
 */
export async function isGPUAvailable(): Promise<boolean> {
  try {
    const gpuInfo = await getGPUInfo();
    return (gpuInfo && (gpuInfo.pytorch.available || gpuInfo.tensorflow.available)) || false;
  } catch (error) {
    console.error('Error checking GPU availability:', error);
    return false;
  }
} 