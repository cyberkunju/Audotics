#!/usr/bin/env python3
"""
GPU Accelerator Script for Audotics

This script provides GPU acceleration for the Audotics project.
It interfaces with TypeScript through JSON and provides functionality
for checking GPU info, testing GPU performance, and accelerating model training.
"""

import os
import sys
import json
import time
import math
import argparse
import traceback
import platform
import tempfile
from pathlib import Path
from typing import Dict, Any, List, Optional, Union

# Set environment variables for optimal GPU performance
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow logging
os.environ['CUDA_DEVICE_ORDER'] = 'PCI_BUS_ID'
os.environ['CUDA_CACHE_DISABLE'] = '0'  # Enable CUDA caching for better performance

try:
    import pynvml
    HAS_PYNVML = True
except ImportError:
    HAS_PYNVML = False

def init_nvml():
    """Initialize NVML for GPU monitoring"""
    if HAS_PYNVML:
        try:
            pynvml.nvmlInit()
            return True
        except Exception as e:
            print(f"NVML initialization error: {e}", file=sys.stderr)
    return False

def get_gpu_utilization():
    """Get current GPU utilization percentage"""
    if not HAS_PYNVML:
        return None
    
    try:
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        util = pynvml.nvmlDeviceGetUtilizationRates(handle)
        return util.gpu  # GPU utilization percentage
    except Exception:
        return None

def get_gpu_memory_info():
    """Get GPU memory info in MB"""
    if not HAS_PYNVML:
        return None, None
    
    try:
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        meminfo = pynvml.nvmlDeviceGetMemoryInfo(handle)
        return meminfo.used / 1024 / 1024, meminfo.total / 1024 / 1024
    except Exception:
        return None, None

def get_gpu_info():
    """
    Get information about the available GPU using PyTorch
    """
    result = {
        "cuda_available": False,
        "device_count": 0,
        "device_name": None,
        "device_capability": None,
        "memory_allocated_mb": None,
        "memory_reserved_mb": None,
        "memory_total_mb": None,
        "pytorch_version": None,
        "cuda_version": None,
        "test_performance_ms": None,
        "gpu_utilization": None
    }
    
    try:
        import torch
        result["pytorch_version"] = torch.__version__
        
        if torch.cuda.is_available():
            result["cuda_available"] = True
            result["device_count"] = torch.cuda.device_count()
            result["device_name"] = torch.cuda.get_device_name(0)
            result["cuda_version"] = torch.version.cuda
            
            # Get compute capability
            device_properties = torch.cuda.get_device_properties(0)
            result["device_capability"] = f"{device_properties.major}.{device_properties.minor}"

            # Initialize NVML for better GPU monitoring
            if init_nvml():
                _, total_memory = get_gpu_memory_info()
                if total_memory is not None:
                    result["memory_total_mb"] = round(total_memory)
                result["gpu_utilization"] = get_gpu_utilization()
            
            # Test GPU by running a matrix multiplication test
            start_time = time.time()
            
            # Allocate memory
            x = torch.randn(5000, 5000, device='cuda')
            y = torch.randn(5000, 5000, device='cuda')
            
            # Synchronize before timing
            torch.cuda.synchronize()
            compute_start = time.time()
            
            # Matrix multiplication 
            z = torch.matmul(x, y)
            
            # Synchronize after computation
            torch.cuda.synchronize()
            end_time = time.time()
            
            # Record times and memory usage
            result["test_performance_ms"] = round((end_time - compute_start) * 1000)
            result["memory_allocated_mb"] = round(torch.cuda.memory_allocated() / (1024 * 1024))
            result["memory_reserved_mb"] = round(torch.cuda.memory_reserved() / (1024 * 1024))
            
            # Update utilization after test
            if HAS_PYNVML:
                result["gpu_utilization"] = get_gpu_utilization()
            
    except Exception as e:
        print(f"Error getting GPU info with PyTorch: {e}", file=sys.stderr)
        traceback.print_exc()
    
    return result

def tf_get_gpu_info():
    """
    Get GPU information using TensorFlow
    """
    result = {
        "tf_version": None,
        "gpu_available": False,
        "device_name": None,
        "cuda_version": None,
        "test_performance_ms": None,
        "memory_info": None
    }
    
    try:
        import tensorflow as tf
        result["tf_version"] = tf.__version__
        
        # Check physical devices
        physical_devices = tf.config.list_physical_devices('GPU')
        
        if physical_devices:
            result["gpu_available"] = True
            
            # Enable memory growth
            for device in physical_devices:
                tf.config.experimental.set_memory_growth(device, True)
            
            # Create a test tensor and run an operation
            start_time = time.time()
            with tf.device('/GPU:0'):
                a = tf.random.normal([5000, 5000])
                b = tf.random.normal([5000, 5000])
                c = tf.matmul(a, b)
                # Force execution
                c_val = c.numpy() 
            end_time = time.time()
            
            result["test_performance_ms"] = round((end_time - start_time) * 1000)
            result["device_name"] = tf.config.get_visible_devices('GPU')[0].name
            
            # Try to get memory info using NVML if available
            if HAS_PYNVML:
                used_mem, total_mem = get_gpu_memory_info()
                if used_mem is not None and total_mem is not None:
                    result["memory_info"] = {
                        "used_mb": round(used_mem),
                        "total_mb": round(total_mem)
                    }
                    
    except Exception as e:
        print(f"Error getting GPU info with TensorFlow: {e}", file=sys.stderr)
    
    return result

def get_virtual_env_info():
    """
    Get information about the current Python environment
    """
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "executable": sys.executable,
        "packages": {
            "torch": get_package_version("torch"),
            "tensorflow": get_package_version("tensorflow"),
            "numpy": get_package_version("numpy"),
            "pynvml": get_package_version("pynvml"),
            "cuda": os.environ.get("CUDA_VERSION", None)
        }
    }

def get_package_version(package_name):
    """Helper to get package version safely"""
    try:
        import importlib
        module = importlib.import_module(package_name)
        return getattr(module, "__version__", "unknown")
    except ImportError:
        return None

class SimpleDataset:
    """Simple dataset class for training"""
    def __init__(self, data, targets, batch_size=32):
        self.data = data
        self.targets = targets
        self.batch_size = batch_size
        self.n_samples = len(data)
        self.indices = list(range(self.n_samples))
    
    def __len__(self):
        return math.ceil(self.n_samples / self.batch_size)
    
    def shuffle(self):
        import random
        random.shuffle(self.indices)
    
    def get_batch(self, idx):
        import torch
        start_idx = idx * self.batch_size
        end_idx = min(start_idx + self.batch_size, self.n_samples)
        batch_indices = self.indices[start_idx:end_idx]
        
        # Convert to tensors
        batch_x = torch.tensor([self.data[i] for i in batch_indices], dtype=torch.float32)
        batch_y = torch.tensor([self.targets[i] for i in batch_indices], dtype=torch.long)
        
        return batch_x, batch_y

def accelerate_training(config, training_data=None):
    """
    Accelerate model training using GPU
    
    Args:
        config: Training configuration with parameters
        training_data: Optional training data
        
    Returns:
        Training metrics and results
    """
    import torch
    import torch.nn as nn
    import torch.optim as optim
    
    # Check if GPU is available
    if not torch.cuda.is_available():
        return {
            "device": "cpu",
            "error": "CUDA not available for PyTorch"
        }
        
    # Initialize GPU monitoring if available
    has_monitoring = init_nvml()
    
    # Get configuration parameters with defaults
    input_size = config.get("input_size", 784)  # Default for MNIST
    hidden_size = config.get("hidden_size", 128)
    output_size = config.get("output_size", 10)
    batch_size = config.get("batch_size", 32)
    epochs = config.get("epochs", 5)
    learning_rate = config.get("learning_rate", 0.001)
    use_mixed_precision = config.get("use_mixed_precision", True)
    optimize_memory = config.get("optimize_memory", True)
    
    # Define a simple neural network model
    class NeuralNet(nn.Module):
        def __init__(self):
            super(NeuralNet, self).__init__()
            # First block
            self.layer1 = nn.Linear(input_size, hidden_size)
            self.bn1 = nn.BatchNorm1d(hidden_size)
            self.act1 = nn.ReLU()
            self.dropout1 = nn.Dropout(0.2)
            
            # Second block
            self.layer2 = nn.Linear(hidden_size, hidden_size)
            self.bn2 = nn.BatchNorm1d(hidden_size)
            self.act2 = nn.ReLU()
            self.dropout2 = nn.Dropout(0.3)
            
            # Third block
            self.layer3 = nn.Linear(hidden_size, hidden_size // 2)
            self.bn3 = nn.BatchNorm1d(hidden_size // 2)
            self.act3 = nn.ReLU()
            self.dropout3 = nn.Dropout(0.2)
            
            # Fourth block
            self.layer4 = nn.Linear(hidden_size // 2, hidden_size // 4)
            self.bn4 = nn.BatchNorm1d(hidden_size // 4)
            self.act4 = nn.ReLU()
            
            # Output layer
            self.output = nn.Linear(hidden_size // 4, output_size)
        
        def forward(self, x):
            # First block
            x = self.layer1(x)
            x = self.bn1(x)
            x = self.act1(x)
            x = self.dropout1(x)
            
            # Second block
            x = self.layer2(x)
            x = self.bn2(x)
            x = self.act2(x)
            x = self.dropout2(x)
            
            # Third block
            x = self.layer3(x)
            x = self.bn3(x)
            x = self.act3(x)
            x = self.dropout3(x)
            
            # Fourth block
            x = self.layer4(x)
            x = self.bn4(x)
            x = self.act4(x)
            
            # Output layer
            x = self.output(x)
            return x
    
    # Training metrics
    loss_history = []
    accuracy_history = []
    gpu_stats = []
    
    try:
        # Generate dummy data if no training data is provided
        if training_data is None:
            import numpy as np
            # Create dummy training data (as a simplified MNIST-like dataset)
            num_samples = 10000
            data = np.random.randn(num_samples, input_size).astype(np.float32)
            targets = np.random.randint(0, output_size, size=num_samples).astype(np.int64)
        else:
            data = training_data.get("data", [])
            targets = training_data.get("targets", [])
            
        # Create dataset
        dataset = SimpleDataset(data, targets, batch_size)
        
        # Move model to GPU
        device = torch.device("cuda")
        model = NeuralNet().to(device)
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        
        # Setup mixed precision training if requested
        scaler = torch.cuda.amp.GradScaler() if use_mixed_precision else None
        
        # Optimize memory usage
        if optimize_memory:
            # Enable cuDNN benchmark for optimized kernels
            torch.backends.cudnn.benchmark = True
            
            # Clear GPU cache
            torch.cuda.empty_cache()
        
        # Main training loop
        start_time = time.time()
        
        for epoch in range(epochs):
            epoch_start = time.time()
            dataset.shuffle()
            running_loss = 0.0
            correct = 0
            total = 0
            
            # Record GPU stats at the beginning of the epoch
            if has_monitoring:
                gpu_utilization = get_gpu_utilization()
                memory_allocated = torch.cuda.memory_allocated() / (1024 * 1024)
                memory_reserved = torch.cuda.memory_reserved() / (1024 * 1024)
            else:
                gpu_utilization = None
                memory_allocated = torch.cuda.memory_allocated() / (1024 * 1024)
                memory_reserved = torch.cuda.memory_reserved() / (1024 * 1024)
            
            # Train through batches
            for i in range(len(dataset)):
                # Get batch and move to GPU
                inputs, labels = dataset.get_batch(i)
                inputs, labels = inputs.to(device), labels.to(device)
                
                # Zero gradients
                optimizer.zero_grad()
                
                # Forward pass - use mixed precision if enabled
                if use_mixed_precision:
                    with torch.cuda.amp.autocast():
                        outputs = model(inputs)
                        loss = criterion(outputs, labels)
                    
                    # Backward and optimize with scaled gradients
                    scaler.scale(loss).backward()
                    scaler.step(optimizer)
                    scaler.update()
                else:
                    outputs = model(inputs)
                    loss = criterion(outputs, labels)
                    loss.backward()
                    optimizer.step()
                
                # Update metrics
                running_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
                
                # Free memory for testing with small GPUs
                if optimize_memory:
                    del inputs, labels, outputs
                    torch.cuda.empty_cache()
            
            # Calculate epoch metrics
            epoch_loss = running_loss / len(dataset)
            epoch_acc = 100 * correct / total
            epoch_time = time.time() - epoch_start
            
            # Record metrics
            loss_history.append(float(epoch_loss))
            accuracy_history.append(float(epoch_acc))
            
            # Record GPU stats at the end of the epoch
            if has_monitoring:
                gpu_utilization_end = get_gpu_utilization()
                # Use the maximum utilization observed during the epoch
                if gpu_utilization is not None and gpu_utilization_end is not None:
                    gpu_utilization = max(gpu_utilization, gpu_utilization_end)
            
            # Add stats to gpu_stats list
            gpu_stats.append({
                "epoch": epoch + 1,
                "memory_allocated_mb": round(memory_allocated),
                "memory_reserved_mb": round(memory_reserved),
                "gpu_utilization": gpu_utilization,
                "epoch_time_seconds": round(epoch_time, 3)
            })
            
            print(f"Epoch {epoch+1}/{epochs} - Loss: {epoch_loss:.4f}, Accuracy: {epoch_acc:.2f}%, "
                  f"Time: {epoch_time:.2f}s, GPU Util: {gpu_utilization or 'N/A'}%")
        
        # Total training time
        total_time = time.time() - start_time
        
        # Final memory usage
        memory_usage = torch.cuda.memory_allocated() / (1024 * 1024)
        
        # Calculate average GPU utilization
        if has_monitoring and any(s["gpu_utilization"] is not None for s in gpu_stats):
            valid_stats = [s["gpu_utilization"] for s in gpu_stats if s["gpu_utilization"] is not None]
            avg_utilization = sum(valid_stats) / len(valid_stats) if valid_stats else None
        else:
            avg_utilization = None
        
        return {
            "device": "cuda",
            "epochs": epochs,
            "batch_size": batch_size,
            "training_time_seconds": round(total_time, 3),
            "loss": loss_history,
            "accuracy": accuracy_history,
            "memory_usage_mb": round(memory_usage),
            "gpu_utilization": avg_utilization,
            "gpu_stats": gpu_stats
        }
        
    except Exception as e:
        print(f"Error during GPU training: {e}", file=sys.stderr)
        traceback.print_exc()
        return {
            "device": "cuda" if torch.cuda.is_available() else "cpu",
            "error": str(e),
            "training_time_seconds": 0,
            "loss": [],
            "accuracy": [],
            "memory_usage_mb": 0,
            "gpu_utilization": None
        }
    finally:
        # Clean up NVML
        if HAS_PYNVML:
            try:
                pynvml.nvmlShutdown()
            except:
                pass

def is_gpu_available():
    """Check if GPU is available for PyTorch or TensorFlow"""
    # Try PyTorch first
    try:
        import torch
        if torch.cuda.is_available():
            return True
    except:
        pass
    
    # Then try TensorFlow
    try:
        import tensorflow as tf
        gpus = tf.config.list_physical_devices('GPU')
        if len(gpus) > 0:
            return True
    except:
        pass
    
    return False

def main():
    parser = argparse.ArgumentParser(description='GPU Accelerator for Audotics')
    parser.add_argument('--action', choices=['info', 'test', 'train'], 
                       default='info', help='Action to perform')
    parser.add_argument('--config', type=str, help='Configuration JSON file path')
    parser.add_argument('--data', type=str, help='Training data JSON file path')
    parser.add_argument('--output', type=str, help='Output file path')
    
    args = parser.parse_args()
    
    result = {}
    
    # Load configuration if provided
    config = {}
    if args.config:
        try:
            with open(args.config, 'r') as f:
                config = json.load(f)
        except Exception as e:
            print(f"Error loading config: {e}", file=sys.stderr)
    elif 'CONFIG' in os.environ:
        try:
            config = json.loads(os.environ['CONFIG'])
        except Exception as e:
            print(f"Error loading config from environment: {e}", file=sys.stderr)
    
    # Load data if provided
    training_data = None
    if args.data:
        try:
            with open(args.data, 'r') as f:
                training_data = json.load(f)
        except Exception as e:
            print(f"Error loading training data: {e}", file=sys.stderr)
    
    # Process the action
    if args.action == 'info':
        # Get GPU info from both frameworks
        result['pytorch'] = get_gpu_info()
        result['tensorflow'] = tf_get_gpu_info()
        result['environment'] = get_virtual_env_info()
        result['gpu_available'] = is_gpu_available()
    
    elif args.action == 'test':
        # Run a test computation on GPU
        torch_info = get_gpu_info()
        tf_info = tf_get_gpu_info()
        
        result = {
            'pytorch_test': {
                'cuda_available': torch_info['cuda_available'],
                'device_name': torch_info['device_name'],
                'test_performance_ms': torch_info['test_performance_ms'],
                'memory_allocated_mb': torch_info['memory_allocated_mb'],
                'gpu_utilization': torch_info['gpu_utilization']
            },
            'tensorflow_test': {
                'gpu_available': tf_info['gpu_available'],
                'device_name': tf_info['device_name'],
                'test_performance_ms': tf_info['test_performance_ms']
            },
            'gpu_available': is_gpu_available()
        }
    
    elif args.action == 'train':
        # Run accelerated training
        result = accelerate_training(config, training_data)
    
    # Write results to output file if specified
    if args.output:
        try:
            with open(args.output, 'w') as f:
                json.dump(result, f, indent=2)
        except Exception as e:
            print(f"Error writing output: {e}", file=sys.stderr)
    
    # Always print results to stdout as JSON
    print(json.dumps(result))

if __name__ == "__main__":
    main() 