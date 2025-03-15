/**
 * Wrapper for Weights & Biases to handle cases where it's not available
 */

// Try to import wandb, but provide a mock if it fails
let wandb: any;
try {
  wandb = require('@wandb/sdk').default;
} catch (error) {
  console.warn('Weights & Biases SDK not available. Using mock implementation.');
  // Create a mock implementation
  wandb = {
    init: (config: any) => {
      console.log('Mock wandb.init called with config:', config);
      return {
        log: (data: any) => {
          console.log('Mock wandb log:', data);
        },
        finish: () => {
          console.log('Mock wandb run finished');
        }
      };
    },
    config: (config: any) => {
      console.log('Mock wandb.config called:', config);
    }
  };
}

export default wandb; 