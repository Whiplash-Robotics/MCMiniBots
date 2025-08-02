# Terraform AWS Setup

Simple Terraform configuration to provision an EC2 instance and S3 bucket on AWS.

## Prerequisites

1. **Install Terraform**: Download from [terraform.io](https://www.terraform.io/downloads.html)
2. **Install AWS CLI**: Download from [aws.amazon.com](https://aws.amazon.com/cli/)
3. **Configure AWS credentials**:
   ```powershell
   aws configure
   ```
   Enter your AWS Access Key ID, Secret Access Key, and preferred region.

## Setup Instructions

1. **Navigate to the terraform directory**:
   ```powershell
   cd terraform
   ```

2. **Initialize Terraform**:
   ```powershell
   terraform init
   ```

3. **Apply the configuration**:
   ```powershell
   terraform apply
   ```
   Type `yes` when prompted to confirm.

## What Gets Created

- **EC2 Instance**: A t3.micro Amazon Linux instance
- **S3 Bucket**: A bucket with a random suffix to ensure uniqueness

## Clean Up

To destroy all created resources:
```powershell
terraform destroy
```
Type `yes` when prompted to confirm.

## Notes
