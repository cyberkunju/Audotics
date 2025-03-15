# Audotics Deployment Guide

## Overview

This guide details the deployment process for the Audotics platform across different environments.

## Deployment Environments

### 1. Development Environment

#### Local Setup
```bash
# Clone repository
git clone https://github.com/your-org/audotics.git
cd audotics

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development servers
docker-compose up -d

# Run migrations
npm run migrate

# Start application
npm run dev
```

### 2. Staging Environment

#### Kubernetes Deployment
```yaml
# kubernetes/staging/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: audotics-backend
  namespace: staging
spec:
  replicas: 3
  selector:
    matchLabels:
      app: audotics-backend
  template:
    metadata:
      labels:
        app: audotics-backend
    spec:
      containers:
      - name: backend
        image: audotics/backend:staging
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: staging
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

#### Helm Chart
```yaml
# helm/audotics/values.yaml
backend:
  replicaCount: 3
  image:
    repository: audotics/backend
    tag: latest
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

frontend:
  replicaCount: 2
  image:
    repository: audotics/frontend
    tag: latest
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 200m
      memory: 256Mi

database:
  host: postgres
  port: 5432
  name: audotics
```

### 3. Production Environment

#### Infrastructure as Code (Terraform)
```hcl
# main.tf
provider "aws" {
  region = "us-west-2"
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "audotics-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-west-2a", "us-west-2b", "us-west-2c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = false
  
  tags = {
    Environment = "production"
    Project     = "audotics"
  }
}

module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "audotics-cluster"
  cluster_version = "1.24"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  node_groups = {
    general = {
      desired_capacity = 3
      max_capacity     = 5
      min_capacity    = 2
      
      instance_types = ["t3.medium"]
    }
    
    ml = {
      desired_capacity = 2
      max_capacity     = 4
      min_capacity    = 1
      
      instance_types = ["g4dn.xlarge"]
    }
  }
}
```

## Deployment Process

### 1. Continuous Integration
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install Dependencies
      run: npm ci
      
    - name: Run Tests
      run: npm test
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Build Docker Image
      run: |
        docker build -t audotics/backend:${{ github.sha }} .
        docker build -t audotics/frontend:${{ github.sha }} ./frontend
        
    - name: Push Docker Images
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push audotics/backend:${{ github.sha }}
        docker push audotics/frontend:${{ github.sha }}
        
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
        
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --name audotics-cluster
        helm upgrade --install audotics ./helm/audotics \
          --set backend.image.tag=${{ github.sha }} \
          --set frontend.image.tag=${{ github.sha }}
```

### 2. Database Migrations
```typescript
// migrations/20240101000000_initial.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.timestamps(true, true);
  });
  
  await knex.schema.createTable('playlists', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.uuid('user_id').references('id').inTable('users');
    table.boolean('is_collaborative').defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('playlists');
  await knex.schema.dropTable('users');
}
```

### 3. Monitoring Setup

#### Prometheus Configuration
```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)

  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
```

#### Grafana Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "Audotics Overview",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))",
            "legendFormat": "Error rate"
          }
        ]
      }
    ]
  }
}
```

### 4. Backup Strategy

#### Database Backup Script
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=7
DB_NAME="audotics"
DB_USER="postgres"

# Create backup
backup_database() {
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="$BACKUP_DIR/$DB_NAME_$TIMESTAMP.sql.gz"
  
  pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE
  
  # Upload to S3
  aws s3 cp $BACKUP_FILE s3://audotics-backups/postgres/
}

# Cleanup old backups
cleanup_old_backups() {
  find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete
  
  # Cleanup S3
  aws s3 ls s3://audotics-backups/postgres/ | \
    awk '{print $4}' | \
    sort -r | \
    tail -n +8 | \
    xargs -I {} aws s3 rm s3://audotics-backups/postgres/{}
}

# Main execution
backup_database
cleanup_old_backups
```

### 5. SSL/TLS Configuration

#### Nginx Configuration
```nginx
# nginx/conf.d/default.conf
server {
    listen 443 ssl http2;
    server_name api.audotics.com;

    ssl_certificate /etc/nginx/ssl/audotics.crt;
    ssl_certificate_key /etc/nginx/ssl/audotics.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    
    location / {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Rollback Procedures

### 1. Kubernetes Rollback
```bash
# Rollback deployment
kubectl rollout undo deployment/audotics-backend -n production

# Verify rollback
kubectl rollout status deployment/audotics-backend -n production
```

### 2. Database Rollback
```bash
# Rollback migration
npm run migrate:rollback

# Restore from backup
gunzip < /backups/postgres/audotics_20240101_000000.sql.gz | psql -U postgres audotics
```

## Emergency Procedures

### 1. System Health Check
```bash
#!/bin/bash

# Check system health
check_system_health() {
  # Check API endpoints
  curl -f https://api.audotics.com/health || notify_team "API health check failed"
  
  # Check database connection
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1" || notify_team "Database connection failed"
  
  # Check Redis connection
  redis-cli -h $REDIS_HOST ping || notify_team "Redis connection failed"
  
  # Check Kubernetes pods
  kubectl get pods -n production | grep -v Running | notify_team "Pod issues detected"
}

# Notify team
notify_team() {
  message=$1
  curl -X POST $SLACK_WEBHOOK_URL \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"ALERT: $message\"}"
}

# Run health check
check_system_health
```

### 2. Incident Response
```bash
#!/bin/bash

# Handle incident
handle_incident() {
  incident_type=$1
  
  case $incident_type in
    "database_connection")
      # Check connection pool
      kubectl exec -it $DB_POD -- pg_isready
      
      # Check active connections
      psql -c "SELECT count(*) FROM pg_stat_activity;"
      ;;
      
    "high_memory")
      # Get memory usage
      kubectl top pods -n production
      
      # Scale up if needed
      kubectl scale deployment audotics-backend -n production --replicas=5
      ;;
      
    "high_cpu")
      # Get CPU usage
      kubectl top nodes
      
      # Scale horizontally
      kubectl scale deployment audotics-backend -n production --replicas=5
      ;;
  esac
}

# Run incident response
handle_incident $1
```
