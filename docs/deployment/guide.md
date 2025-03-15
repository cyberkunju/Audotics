# Deployment Guide

## Overview
This guide details the deployment process for Audotics, covering all environments (development, staging, and production) and the necessary steps for successful deployment.

## Deployment Environments

### Development
- Local development environment
- Feature testing
- Integration testing
- Performance testing

### Staging
- Pre-production environment
- UAT testing
- Performance validation
- Security testing

### Production
- Live environment
- High availability
- Scalability
- Monitoring

## Infrastructure Setup

### 1. Cloud Infrastructure (AWS)

#### VPC Configuration
```hcl
# Terraform configuration
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "audotics-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_subnet" "private" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
}
```

#### Security Groups
```hcl
resource "aws_security_group" "web" {
  name = "web"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 2. Kubernetes Setup

#### Cluster Configuration
```yaml
# cluster-config.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: audotics-cluster
  region: us-west-2

nodeGroups:
  - name: ng-1
    instanceType: t3.large
    desiredCapacity: 3
    minSize: 2
    maxSize: 5
```

#### Namespace Setup
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: audotics
  labels:
    name: audotics
```

## Application Deployment

### 1. Frontend Deployment

#### Docker Configuration
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

#### Kubernetes Deployment
```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: audotics
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: audotics/frontend:latest
        ports:
        - containerPort: 3000
```

### 2. Backend Deployment

#### Docker Configuration
```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 4000
CMD ["npm", "run", "start:prod"]
```

#### Kubernetes Deployment
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: audotics
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: audotics/backend:latest
        ports:
        - containerPort: 4000
```

### 3. Database Deployment

#### PostgreSQL
```yaml
# postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: audotics
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        env:
        - name: POSTGRES_DB
          value: audotics
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
```

#### Redis Cache
```yaml
# redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: audotics
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7
        ports:
        - containerPort: 6379
```

## CI/CD Pipeline

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Build and push Docker images
      run: |
        docker build -t audotics/frontend:latest ./frontend
        docker build -t audotics/backend:latest ./backend
        docker push audotics/frontend:latest
        docker push audotics/backend:latest
    
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --name audotics-cluster
        kubectl apply -f k8s/
```

## Monitoring Setup

### 1. Prometheus Configuration
```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
```

### 2. Grafana Dashboard
```yaml
# grafana-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
```

## Deployment Checklist

### Pre-deployment
- [ ] Code review completed
- [ ] Tests passed
- [ ] Security scan completed
- [ ] Performance tested
- [ ] Documentation updated

### Deployment
- [ ] Database backup
- [ ] Deploy infrastructure changes
- [ ] Deploy application updates
- [ ] Run smoke tests
- [ ] Monitor metrics

### Post-deployment
- [ ] Verify functionality
- [ ] Check monitoring
- [ ] Review logs
- [ ] Update status page
- [ ] Notify stakeholders

## Rollback Procedure

### 1. Application Rollback
```bash
# Rollback deployment
kubectl rollout undo deployment/frontend -n audotics
kubectl rollout undo deployment/backend -n audotics

# Verify rollback
kubectl rollout status deployment/frontend -n audotics
kubectl rollout status deployment/backend -n audotics
```

### 2. Database Rollback
```bash
# Restore database backup
pg_restore -h $DB_HOST -U $DB_USER -d audotics backup.sql
```

## References
- [Infrastructure Setup](cloud.md)
- [Kubernetes Guide](kubernetes.md)
- [CI/CD Pipeline](cicd.md)
- [Monitoring Setup](../performance/monitoring.md)
