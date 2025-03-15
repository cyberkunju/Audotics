# TensorFlow.js Setup Guide

## Configuration

TensorFlow.js with Node.js bindings requires specific configuration in the `package.json` file. This ensures that the native bindings for TensorFlow are properly located and loaded at runtime.

### Required Configuration

The following configuration has been added to the root `package.json`:

```json
"binary": {
  "module_name": "tensorflow-binding",
  "module_path": "./node_modules/@tensorflow/tfjs-node/lib/binding/{platform}-{arch}-{node_abi}"
}
```

This configuration tells `node-pre-gyp` (used by TensorFlow.js) where to find the compiled bindings.

### Dependencies

Make sure the following dependencies are installed:

```json
"dependencies": {
  "@tensorflow/tfjs": "^4.17.0",
  "@tensorflow/tfjs-node": "^4.17.0"
}
```

## Troubleshooting

### Common Issues

1. **Error: package.json must declare binary property**

   If you encounter this error:
   ```
   Error: audotics-backend package.json is not node-pre-gyp ready:
   package.json must declare these properties:
   binary
   ```

   Solution: Add the `binary` field to `package.json` as shown above.

2. **Cannot find module '@tensorflow/tfjs-node'**

   Solution: Run `npm install @tensorflow/tfjs-node` to install the dependency.

3. **Node version compatibility issues**

   TensorFlow.js requires a compatible Node.js version. Check the compatibility matrix in the official TensorFlow.js documentation.

## Usage Tips

1. **Import TensorFlow.js in your code:**

   ```typescript
   import * as tf from '@tensorflow/tfjs-node';
   ```

2. **Check if GPU is available:**

   ```typescript
   console.log('Using GPU:', tf.getBackend() === 'webgl');
   ```

3. **Memory management:**

   TensorFlow.js uses automatic garbage collection, but for large models, you might need to manually dispose of tensors:

   ```typescript
   const tensor = tf.tensor([1, 2, 3]);
   // Use tensor for computation
   tensor.dispose(); // Free memory
   ```

   Or use `tf.tidy` for automatic cleanup:

   ```typescript
   const result = tf.tidy(() => {
     const x = tf.tensor([1, 2, 3]);
     const y = tf.tensor([4, 5, 6]);
     return x.add(y);
   }); // All intermediate tensors are automatically disposed
   ```

## Further Resources

- [TensorFlow.js Official Documentation](https://www.tensorflow.org/js)
- [TensorFlow.js Node.js API](https://js.tensorflow.org/api/latest/)
- [TensorFlow.js Models](https://github.com/tensorflow/tfjs-models) 