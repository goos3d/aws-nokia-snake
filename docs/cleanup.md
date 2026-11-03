# Cleanup Guide

Remove the deployment when the AWS learning exercise is complete to avoid unnecessary storage and delivery charges.

## Before deleting

1. Confirm the distribution is used only for this project.
2. Download any S3 files you want to retain.
3. Record the distribution domain only if you need it as a learning reference.

## Cleanup order

### 1. Delete the CloudFront distribution

Disable the distribution, wait for its disabled state to deploy, then delete it. CloudFront distributions cannot be deleted while enabled.

### 2. Delete the OAC

After the distribution is deleted, delete its unused OAC. An OAC attached to a distribution cannot be deleted.

### 3. Empty and delete the S3 bucket

Delete all objects, including object versions and delete markers if versioning was enabled, then delete the bucket.

### 4. Verify removal

Confirm the lab's CloudFront distribution, OAC, S3 bucket, optional log bucket, and any disposable budget or alert no longer exist. Review **AWS Settings → Billing** and Billing and Cost Management for residual usage.

## Expected post-cleanup state

The local Git repository and game files remain intact. Only cloud resources are removed, and the game continues to run by opening `index.html` locally.
