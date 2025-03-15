import wandb from '../utils/wandb-wrapper';

async function testWandb() {
  console.log('Testing Weights & Biases integration...');
  
  try {
    // Initialize wandb
    const run = await wandb.init({
      project: 'audotics-recommendation-test',
      name: `test-run-${new Date().toISOString()}`,
      config: {
        testParam: 1,
        framework: 'tensorflow.js'
      }
    });
    
    console.log('W&B initialized successfully!');
    console.log('Run URL:', run?.url);
    
    // Log some test metrics
    for (let i = 0; i < 10; i++) {
      wandb.log({
        'test/accuracy': 0.5 + i * 0.05,
        'test/loss': 1.0 - i * 0.1,
        'step': i
      });
      console.log(`Logged metrics for step ${i}`);
    }
    
    // Finalize the run
    await wandb.finish();
    console.log('W&B run finalized successfully!');
    
    return true;
  } catch (error) {
    console.error('Error testing W&B integration:', error);
    return false;
  }
}

// Run the test
testWandb()
  .then(success => {
    if (success) {
      console.log('W&B integration test passed!');
      process.exit(0);
    } else {
      console.error('W&B integration test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error during W&B test:', error);
    process.exit(1);
  }); 