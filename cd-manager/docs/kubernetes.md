# Kubernetes Deployment Guide

This guide explains how to deploy the Smart CD Player Manager to a Kubernetes cluster using Helm.

## Prerequisites

-   Docker installed and running
-   Kubernetes cluster (local or remote)
-   `kubectl` configured
-   `helm` installed

## Configuring kubectl for Remote Access (Home Server)

To deploy from your local machine to your home server's cluster, you need to copy the `kubeconfig` file.

1.  **On your Home Server**:
    Locate your kubeconfig file (usually at `~/.kube/config` or `/etc/rancher/k3s/k3s.yaml` for K3s).

2.  **On your Local Machine**:
    Download this file to your local machine:
    ```bash
    scp user@<SERVER_IP>:~/.kube/config ./kubeconfig-home
    ```

3.  **Update Server IP**:
    Open `./kubeconfig-home` and change `server: https://127.0.0.1:6443` to your server's LAN IP (e.g., `server: https://192.168.1.50:6443`).

4.  **Use the Config**:
    You can point `kubectl` to this file temporarily:
    ```bash
    export KUBECONFIG=./kubeconfig-home
    kubectl get nodes
    ```
    Or merge it into your main config.

## 1. Build the Docker Image

Build the Docker image using the provided `Dockerfile`.

```bash
docker build -t cd-manager:latest .
```

If you are using a local cluster like kind or minikube, you might need to load the image into the cluster:

**Kind:**
```bash
kind load docker-image cd-manager:latest
```

**Minikube:**
```bash
minikube image load cd-manager:latest
```

## 2. Deploy using Helm

Navigate to the project root and install the chart.

```bash
helm install cd-manager ./charts/cd-manager
```

### Separating Secrets

You can keep your configuration in `values.yaml` and your secrets in a separate file (e.g., `secrets.yaml`) that is **not committed to git**.

1.  Copy the example secrets file:
    ```bash
    cp charts/cd-manager/secrets.example.yaml secrets.yaml
    ```
2.  Edit `secrets.yaml` with your actual credentials.
3.  Deploy using both files (values are merged, with later files overriding):
    ```bash
    helm install cd-manager ./charts/cd-manager -f charts/cd-manager/values.yaml -f secrets.yaml
    ```

### Helper Scripts

We provide helper scripts in the `scripts/` directory to simplify deployment:

-   `./scripts/deploy-k8s.sh`: Deploys (or upgrades) the application. It automatically detects if `secrets.yaml` exists and uses it.
-   `./scripts/uninstall-k8s.sh`: Uninstalls the application.

```bash
# Deploy
./scripts/deploy-k8s.sh

# Deploy with extra args (e.g., set NodePort)
./scripts/deploy-k8s.sh --set service.type=NodePort
```

### Configuration

You can customize the deployment by modifying `charts/cd-manager/values.yaml` or passing arguments to the `helm install` command.

Common configuration options:

-   `replicaCount`: Number of pods to run (default: 1)
-   `image.repository`: Docker image repository (default: cd-manager)
-   `image.tag`: Docker image tag (default: latest appVersion)
-   `service.type`: Kubernetes Service type (default: ClusterIP)
-   `service.nodePort`: Static NodePort (default: empty, range 30000-32767)
-   `persistence.enabled`: Enable persistent storage (default: true)
-   `persistence.size`: Size of the persistent volume (default: 1Gi)
-   `env.DATA_DIR`: Path to the data directory (default: /app/data)
-   `env.IMAGES_DIR`: Path to the images directory (default: /app/data/images)

-   `env.AUTH_TRUST_HOST`: Trust host for next-auth (default: true)

**Secrets:**

By default, the chart creates a Kubernetes Secret with the values provided in `values.yaml` (under the `secrets` key).

-   `secrets.authSecret`: `AUTH_SECRET`
-   `secrets.discogsUserToken`: `DISCOGS_USER_TOKEN`
-   `secrets.googleClientId`: `GOOGLE_CLIENT_ID`
-   `secrets.googleClientSecret`: `GOOGLE_CLIENT_SECRET`

**Using Existing Secrets:**

If you prefer to manage secrets externally (e.g., via SealedSecrets or ExternalSecrets), set `secrets.existingSecret` to the name of your pre-existing secret. This secret must contain the following keys: `AUTH_SECRET`, `DISCOGS_USER_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### Data Persistence

The chart assumes a default `DATA_DIR` of `/app/data`. A PersistentVolumeClaim (PVC) is created by default to store the `player-definitions.json` and other data. This ensures configuration persists across pod restarts.

Example: Deploying with NodePort service:

```bash
helm install cd-manager ./charts/cd-manager --set service.type=NodePort
```

## 3. Verify Deployment

Check the status of the deployment:

```bash
kubectl get pods
kubectl get svc
```

## 4. Uninstall

To remove the deployment:

```bash
helm uninstall cd-manager
```

## Home Server / Bare Metal Deployment

If you are running Kubernetes on your own hardware (e.g., a home server on your LAN), standard `LoadBalancer` services will standardly remain in a "Pending" state because you don't have a cloud provider to provision an IP.

### Option 1: NodePort (Easiest)

Use `type: NodePort`. Kubernetes will open a port (typically 30000-32767) on your server's LAN IP.

1.  Set `service.type` to `NodePort` in `values.yaml` (or via `--set`).
2.  (Optional) Set `service.nodePort` to a specific port (e.g., `31000`) if you want a fixed entry point.
3.  Deploy the chart.
4.  Find the port (if not static): `kubectl get svc cd-manager`
5.  Access via: `http://<YOUR_SERVER_LAN_IP>:<PORT>`

### Option 2: MetalLB (Advanced)

If you want a dedicated LAN IP for the application (e.g., `192.168.1.100`), you can install [MetalLB](https://metallb.universe.tf/) in your cluster.

1.  Install and configure MetalLB with a range of IPs from your home router.
2.  Set `service.type` to `LoadBalancer`.
3.  MetalLB will assign a "real" LAN IP to your service.
