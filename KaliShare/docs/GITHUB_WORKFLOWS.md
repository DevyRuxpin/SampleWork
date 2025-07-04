# 🚀 GitHub Actions Workflows - KaliShare App

## Overview
This document explains the GitHub Actions workflows set up for the KaliShare app, including CI/CD pipelines, code quality checks, and deployment automation.

## 📁 Workflow Files

### 1. **ci-cd.yml** - Main CI/CD Pipeline
**Triggers**: Push to `main`/`develop` branches, Pull Requests

**Jobs**:
- **Test Backend**: Runs backend tests with PostgreSQL service
- **Test Frontend**: Runs frontend tests and builds
- **Security Scan**: Runs npm audit for security vulnerabilities
- **Docker Build**: Builds and tests Docker containers
- **Deploy Staging**: Deploys to staging on `develop` branch
- **Deploy Production**: Deploys to production on `main` branch
- **Notify**: Sends notifications on success/failure

### 2. **code-quality.yml** - Code Quality Checks
**Triggers**: Push to `main`/`develop` branches, Pull Requests

**Jobs**:
- **Lint Backend**: Runs backend linting
- **Lint Frontend**: Runs frontend linting
- **Check Dependencies**: Checks for outdated packages
- **Validate Docker**: Validates Docker configurations

### 3. **deploy.yml** - Deployment Workflow
**Triggers**: Push to `main`/`develop` branches, Manual dispatch

**Jobs**:
- **Deploy Staging**: Deploys to staging environment
- **Deploy Production**: Deploys to production environment
- **Health Check**: Verifies deployment health
- **Notify Deployment**: Sends deployment notifications

## 🔧 Setup Instructions

### 1. **Repository Secrets**
Add these secrets in your GitHub repository settings:

#### **Required Secrets**:
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Analytics
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Docker (if using Docker Hub)
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# Deployment URLs
STAGING_URL=https://your-staging-app.com
PRODUCTION_URL=https://your-production-app.com

# Deployment Hooks (for Render, Railway, etc.)
RENDER_DEPLOY_HOOK_STAGING=https://api.render.com/deploy/xxx
RENDER_DEPLOY_HOOK_PRODUCTION=https://api.render.com/deploy/yyy

# Notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

### 2. **Environment Protection**
Set up environment protection rules for production:
- Go to Settings → Environments
- Create "production" environment
- Add protection rules (required reviewers, wait timer)

### 3. **Branch Protection**
Set up branch protection for `main`:
- Require status checks to pass
- Require pull request reviews
- Restrict direct pushes

## 🎯 Workflow Features

### **Automated Testing**
- Backend tests with PostgreSQL service
- Frontend tests with coverage
- Security vulnerability scanning
- Docker container validation

### **Quality Gates**
- Code linting and formatting
- Dependency security audits
- Docker configuration validation
- Build verification

### **Deployment Automation**
- Automatic staging deployment on `develop` branch
- Manual production deployment with approval
- Health checks after deployment
- Rollback capabilities

### **Notifications**
- Success/failure notifications
- Deployment status updates
- Security alert notifications

## 🔄 Workflow Triggers

### **Automatic Triggers**:
- **Push to `develop`**: Runs tests, deploys to staging
- **Push to `main`**: Runs tests, deploys to production
- **Pull Request**: Runs tests and quality checks

### **Manual Triggers**:
- **Workflow Dispatch**: Manual deployment to any environment
- **Release Creation**: Automatic deployment on new releases

## 🛠 Customization

### **Adding New Environments**:
1. Create new workflow file or modify existing
2. Add environment secrets
3. Update deployment commands
4. Add health check endpoints

### **Adding New Checks**:
1. Add new job to appropriate workflow
2. Define steps and requirements
3. Update dependencies and notifications

### **Custom Notifications**:
1. Add notification service secrets
2. Update notification steps
3. Customize message format

## 📊 Monitoring

### **Workflow Status**:
- View workflow runs in Actions tab
- Monitor job status and logs
- Set up failure notifications

### **Deployment Status**:
- Check deployment health endpoints
- Monitor application metrics
- Set up uptime monitoring

## 🔒 Security

### **Secrets Management**:
- All sensitive data stored as GitHub secrets
- Environment-specific secrets
- Rotating secrets regularly

### **Access Control**:
- Environment protection rules
- Required reviewers for production
- Audit logs for all deployments

## 🚨 Troubleshooting

### **Common Issues**:
1. **Tests Failing**: Check test logs and fix issues
2. **Build Errors**: Verify Docker configurations
3. **Deployment Failures**: Check deployment logs and secrets
4. **Permission Errors**: Verify repository permissions

### **Debug Steps**:
1. Check workflow logs in Actions tab
2. Verify secrets are correctly set
3. Test locally with same commands
4. Check environment configurations

## 📈 Best Practices

### **Development Workflow**:
1. Create feature branch from `develop`
2. Make changes and test locally
3. Create pull request to `develop`
4. Pass all CI checks
5. Merge to `develop` (auto-deploys to staging)
6. Create pull request to `main` for production

### **Deployment Strategy**:
1. Always test in staging first
2. Use blue-green deployment when possible
3. Monitor health after deployment
4. Have rollback plan ready

### **Security**:
1. Regular dependency updates
2. Security scanning in CI/CD
3. Environment-specific configurations
4. Audit trail for all changes 