# Deployment Guide

## Status and approval

This guide is not an automated deployment. Do not create resources until the architecture, expected costs, and this procedure have been explicitly approved.

The planned deployment is a private S3 bucket in `us-east-2` with CloudFront and Origin Access Control (OAC). It does not use an S3 website endpoint because OAC works with a standard S3 bucket origin.

## Prerequisites

- Confirm the selected Region in **AWS Settings → View all projects → Overview → Additional Info → Region**. This guide expects `us-east-2`.
- Verify the active AWS identity with `sts:GetCallerIdentity`.
- Select a globally unique, lowercase bucket name, for example `aws-nokia-snake-<unique-suffix>`.
- Confirm spend limits in **AWS Settings → Billing** and, if wanted, create a budget in Billing and Cost Management.
- Use temporary authenticated credentials only. Never commit access keys or generated configuration containing sensitive details.

## Required resources

Tag supported resources with `Project=aws-learning-lab`:

1. A private S3 general-purpose bucket in `us-east-2`.
2. An OAC for an S3 origin, with `always` signing behavior and SigV4.
3. A CloudFront distribution with the S3 bucket as a standard bucket origin.

## Procedure

### 1. Create and protect the bucket

Create/tag the bucket in `us-east-2`, enable default SSE-S3 encryption, and enable every S3 Block Public Access setting. Do not enable S3 website hosting or attach a public-read policy.

### 2. Upload the static application

Upload `index.html`, `style.css`, and `game.js`. Documentation files do not need to be hosted. Use conservative cache durations during initial testing.

### 3. Create OAC

Create one CloudFront OAC with origin type `s3`, signing behavior `always`, and signing protocol `sigv4`. Do not use the older OAI mechanism.

### 4. Create the CloudFront distribution

Configure the normal regional S3 bucket domain as the origin—not an S3 website endpoint—and attach the OAC. Set the default behavior to redirect HTTP to HTTPS, use `index.html` as the default root object, use the assigned `cloudfront.net` domain, and apply the project tag.

Record the distribution ID and default domain. CloudFront is global; the S3 bucket remains in the selected Region.

### 5. Scope the bucket policy

After the distribution ID is available, grant only `s3:GetObject` to the CloudFront service principal. Replace placeholders only during deployment:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontReadOnly",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::BUCKET_NAME/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::PROJECT_ACCOUNT_ID:distribution/DISTRIBUTION_ID",
        "AWS:SourceAccount": "PROJECT_ACCOUNT_ID"
      }
    }
  }]
}
```

Keep Block Public Access enabled.

### 6. Validate

Wait for status `Deployed`, then load `https://<distribution-domain>/`, confirm HTTP redirects to HTTPS, and verify direct S3 object access returns Access Denied. Check browser console errors and confirm the hosted game makes no external network requests.

## Least-privilege deployment permissions

Use a deployment identity restricted to the named bucket and distribution. It needs only S3 create/configure/tag, object upload/list/delete, encryption/public-access/policy actions, plus CloudFront create/tag/read/update permissions for one distribution and OAC. Do not create IAM users or long-lived access keys for this lab.

## Optional monitoring

Start with Billing/Cost Management and the project spend limit. Evaluate CloudFront access logs and additional security services separately because they can add storage, request, or recurring charges.
