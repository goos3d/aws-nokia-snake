# Planned AWS Architecture

## Status

This is a deployment design only. No AWS resources have been provisioned and the game is not deployed.

## Design

```text
Viewer browser
    │ HTTPS
    ▼
Amazon CloudFront distribution
    │ Signed origin request (OAC / SigV4)
    ▼
Private Amazon S3 bucket in us-east-2
    ├── index.html
    ├── style.css
    └── game.js
```

The game is static. It needs no API, database, authentication service, or compute runtime.

## Components

### Amazon S3

Amazon S3 stores the game files in a general-purpose bucket in the project's selected Region, `us-east-2`.

- The bucket is private; S3 static website hosting is **not** enabled.
- S3 Block Public Access remains enabled for all settings.
- Default encryption uses SSE-S3.
- The bucket is tagged `Project=aws-learning-lab`.

S3 is analogous to a private storage volume in a homelab, not a public web server.

### Amazon CloudFront

CloudFront is the public delivery layer. It caches static files and supplies a default `*.cloudfront.net` HTTPS domain, so this lab does not need a custom DNS name or ACM certificate.

- Viewer protocol policy redirects HTTP to HTTPS.
- `index.html` is the default root object.
- The distribution is tagged `Project=aws-learning-lab`.
- A managed cache policy is used for static content.

CloudFront is comparable to placing a reverse proxy/CDN in front of a homelab service, except its edge network is operated by AWS.

### Origin Access Control (OAC)

OAC makes CloudFront sign S3 origin requests with SigV4 and replaces the older Origin Access Identity approach. The S3 bucket policy grants `s3:GetObject` only to `cloudfront.amazonaws.com` and scopes it to both the exact distribution ARN (`AWS:SourceArn`) and the project AWS account (`AWS:SourceAccount`).

This blocks direct public S3 access and prevents a different CloudFront distribution from reading the game.

## Security boundaries

1. Internet viewers reach CloudFront, not S3.
2. CloudFront reads S3 through OAC.
3. S3 rejects anonymous direct requests.
4. The bucket policy permits only one distribution.
5. No credentials are shipped to browsers or committed to Git.

## Excluded services

Lambda, API Gateway, databases, Route 53, ACM, WAF, and a custom domain are intentionally excluded. They are unnecessary for a small static game and would add cost or operational complexity.

## Monitoring and cost controls

- Check spend and project limits in **AWS Settings → Billing**.
- Use Billing and Cost Management for budgets and cost analysis.
- Review CloudFront and S3 usage before enabling optional logging.
- Use the cleanup procedure immediately after the lab if it is no longer needed.
