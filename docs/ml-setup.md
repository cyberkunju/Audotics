# Machine Learning Setup for Audotics

This guide explains how to set up the machine learning environment for the Audotics application, including GPU acceleration if available.

## Prerequisites

1. **NVIDIA GPU** with CUDA support (optional, for GPU acceleration)
2. **NVIDIA GPU Drivers** installed (if using GPU acceleration)
3. **Python 3.8-3.12** installed and available in your system PATH (Python 3.10 or 3.11 recommended)

> **Note on Python Versions**: While the system will attempt to work with any Python 3.x version, we recommend using Python 3.10 or 3.11 for best compatibility with ML libraries. Python 3.13+ is very recent and some ML packages like TensorFlow may not yet be fully compatible.

> **Note for Windows Users**: On Windows, Python might be available as `py` instead of `python`. Our scripts automatically check for both commands.

## Installation

We've simplified the GPU setup process by removing the separate virtual environment. Now, you can install all the necessary dependencies directly in your system Python.

### Automatic Installation

We provide scripts to automatically install all required ML dependencies:

#### Windows

```bash
# Run the installer script
install-ml-deps.bat
```

#### Linux/macOS

```bash
# Make the script executable
chmod +x install-ml-deps.sh

# Run the installer script
./install-ml-deps.sh
```

### Manual Installation

If you prefer to install the dependencies manually:

1. Install PyTorch with CUDA support:
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
   ```

2. Install other required ML libraries:
   ```bash
   pip install tensorflow numpy pandas scikit-learn matplotlib wandb pynvml
   ```

## Verifying GPU Support

Once installed, you can verify GPU support by running:

```bash
# Test GPU functionality
node backend/test-gpu.js
```

This script will:
1. Check if PyTorch is installed
2. Verify CUDA availability
3. Display GPU information
4. Run a performance test

You should see output confirming your GPU is detected and working properly:

```
=== Testing PyTorch and CUDA ===
PyTorch is installed.
CUDA Available: True
GPU Count: 1
GPU Device: NVIDIA GeForce RTX 3080
Compute Capability: 8.6
Total Memory: 10240.00 MB

=== Running GPU Performance Test ===
Creating test tensors...
Running matrix multiplication...
Matrix multiplication time: 123.45 ms
Memory used: 1525.50 MB
GPU test completed successfully!

=== GPU Information Summary ===
GPU is available and working properly!
- Device: NVIDIA GeForce RTX 3080
- Compute Capability: 8.6
- Memory: 10240 MB
- CUDA Version: 11.7
```

## CPU-Only Mode

If you don't have a CUDA-capable GPU or the proper drivers installed, the system will automatically fall back to CPU-only mode. This is perfectly fine for development and testing, though training and inference will be slower.

When running in CPU-only mode, you'll see output like this:

```
=== Testing PyTorch and CUDA ===
PyTorch is installed.
CUDA Available: False

=== GPU Not Available ===
CUDA is not available. Make sure you have:
1. A CUDA-capable GPU installed
2. NVIDIA GPU drivers installed
3. CUDA Toolkit installed
4. PyTorch with CUDA support installed
```

All functionality will still work, just at reduced performance. To install PyTorch for CPU-only mode:

```bash
pip install torch torchvision torchaudio
```

## Troubleshooting

If you encounter issues:

1. **CUDA Not Available**: Ensure your GPU drivers are installed and up-to-date
2. **Python Not Found**: Make sure Python is installed and in your system PATH
3. **PyTorch Installation Fails**: Try installing an older version compatible with your CUDA version
4. **Package Not Found Errors**: If using Python 3.13+, consider downgrading to Python 3.10 or 3.11 for better compatibility

For more detailed troubleshooting, check NVIDIA's [CUDA documentation](https://docs.nvidia.com/cuda/cuda-installation-guide-microsoft-windows/index.html) or the [PyTorch installation guide](https://pytorch.org/get-started/locally/).

## Recent Changes

We've recently made the following improvements to the ML setup process:

1. **Removed Separate Environment**: We no longer require a separate Python virtual environment for GPU acceleration. This simplifies setup and maintenance.

2. **Automatic Detection**: The system now automatically detects whether a CUDA-capable GPU is available and adapts accordingly.

3. **CPU Fallback**: If no GPU is available, the system will automatically use CPU-only mode, ensuring all functionality works regardless of hardware.

4. **Simplified Installation**: The installation scripts now handle both GPU and CPU-only setups, making it easier to get started.

5. **Better Error Handling**: The scripts now provide clearer error messages and guidance when issues occur.

These changes make the Audotics ML components more accessible and easier to set up, while still providing GPU acceleration when available for optimal performance.

## Technical Details

Audotics now uses your system Python installation instead of a dedicated virtual environment for GPU acceleration. This approach:

- Reduces setup complexity
- Makes it easier to integrate with other tools and libraries
- Eliminates environment switching
- Improves compatibility across systems

The GPU acceleration is used for:
- Audio feature extraction
- Machine learning model training
- Content recommendation algorithms
- Real-time audio processing 