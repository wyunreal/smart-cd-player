# HTTPS Setup Guide (Porkbun DNS-01)

This guide documents how to set up HTTPS certificates using Let's Encrypt and Porkbun DNS-01 challenge on a local K3s cluster.

## Prerequisites

- K3s Cluster
- Domain managed by Porkbun (e.g., `web.smart-cd.app`)
- Porkbun API Key and Secret Key

## Components

1.  **Cert-Manager**: Manages certificate lifecycle.
2.  **Porkbun Webhook**: Custom webhook to solve DNS-01 challenge via Porkbun API.
3.  **ClusterIssuer**: Configuration telling Cert-Manager to use Let's Encrypt and the Porkbun webhook.

## Installation Steps

### 1. Install Cert-Manager

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.3 \
  --set installCRDs=true \
  --set "extraArgs={--dns01-recursive-nameservers=8.8.8.8:53,--dns01-recursive-nameservers-only=true}"
```

> **Note**: The `--dns01-recursive-nameservers` flags are required in split-horizon DNS environments (e.g., local K3s) to prevent cert-manager from using local DNS for zone detection.

### 2. Install Porkbun Webhook

We use the community chart from `talinx`.

```bash
helm repo add porkbun-webhook https://talinx.github.io/cert-manager-webhook-porkbun
helm repo update
helm install porkbun-webhook porkbun-webhook/cert-manager-webhook-porkbun \
  --namespace cert-manager \
  --set groupName=acme.smart-cd.app
```

### 3. Create API Secret

**Critical**: This must be created manually to avoid storing secrets in git.

```bash
kubectl create secret generic porkbun-secret \
  --from-literal=PORKBUN_API_KEY=<YOUR_API_KEY> \
  --from-literal=PORKBUN_SECRET_API_KEY=<YOUR_SECRET_KEY> \
  --namespace cert-manager
```

### 4. Apply ClusterIssuer

Create a `cluster-issuer.yaml` file:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: your-email@example.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - dns01:
          webhook:
            groupName: acme.smart-cd.app
            solverName: porkbun
            config:
              apiKey:
                name: porkbun-secret
                key: PORKBUN_API_KEY
              secretApiKey:
                name: porkbun-secret
                key: PORKBUN_SECRET_API_KEY
```

Apply it:

```bash
kubectl apply -f cluster-issuer.yaml
```

## Troubleshooting

### Check Certificate Status

```bash
kubectl get certificate
kubectl describe certificate cd-manager-tls
```

### Check Webhook Logs

If DNS propagation fails:

```bash
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager-webhook-porkbun
```
