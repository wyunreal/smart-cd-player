# Kubernetes Deployment Guide

This guide explains how to deploy the Composite Video Parser to a K3s cluster using Helm.

## Prerequisites

- Docker installed and running
- K3s cluster with access to `/dev/video0`
- `kubectl` configured to point to your K3s cluster
- `helm` installed

## Configuring kubectl for Remote Access

To deploy from your local machine to your K3s cluster:

1. **On your K3s server**:
   Locate the kubeconfig file at `/etc/rancher/k3s/k3s.yaml`.

2. **On your local machine**:
   ```bash
   scp user@<SERVER_IP>:~/.kube/config ./kubeconfig-home
   ```

3. **Update Server IP**:
   Open `./kubeconfig-home` and change `server: https://127.0.0.1:6443` to your server's LAN IP (e.g., `server: https://192.168.1.50:6443`).

4. **Use the Config**:
   ```bash
   export KUBECONFIG=./kubeconfig-home
   kubectl get nodes
   ```

## Quick Deploy

The fastest way to deploy is using the provided script:

```bash
./scripts/deploy-remote-k3s.sh <REMOTE_USER> <REMOTE_HOST>
```

Example:

```bash
./scripts/deploy-remote-k3s.sh pi 192.168.1.50
```

This script automatically:

1. Bumps the package version (patch)
2. Builds the Docker image locally
3. Transfers and imports the image into K3s
4. Deploys (or upgrades) with Helm

## Manual Deploy

### 1. Build the Docker Image

```bash
docker build -t composite-video-parser:latest .
```

### 2. Transfer to K3s

```bash
docker save composite-video-parser:latest | gzip > composite-video-parser.tar.gz
scp composite-video-parser.tar.gz user@<SERVER_IP>:/tmp/
ssh user@<SERVER_IP> "sudo k3s ctr images import /tmp/composite-video-parser.tar.gz"
```

### 3. Deploy with Helm

```bash
helm upgrade --install composite-video-parser ./charts/composite-video-parser \
    --set image.tag=latest \
    -f ./charts/composite-video-parser/values.yaml
```

## Configuration

Customize the deployment by modifying `charts/composite-video-parser/values.yaml` or passing `--set` arguments.

| Option                       | Default                  | Description                         |
|------------------------------|--------------------------|-------------------------------------|
| `replicaCount`               | `1`                      | Number of pods                      |
| `image.repository`           | `composite-video-parser` | Docker image name                   |
| `image.tag`                  | `""` (appVersion)        | Docker image tag                    |
| `service.type`               | `NodePort`               | Kubernetes Service type             |
| `service.port`               | `3100`                   | Service port                        |
| `service.nodePort`           | `30002`                  | Static NodePort (30000-32767)       |
| `securityContext.privileged` | `true`                   | Required for `/dev/video0` access   |
| `env.CONFIG_PATH`            | `/app/config.json`       | Path to config file inside container|
| `videoDevice.enabled`        | `true`                   | Mount video device from host        |
| `videoDevice.hostPath`       | `/dev/video0`            | Host video device path              |

## Video Device Access

The container needs access to `/dev/video0` on the host for V4L2 video capture via FFmpeg. This is achieved by:

- Mounting `/dev/video0` as a `hostPath` volume with type `CharDevice`
- Running the container with `privileged: true` security context

Ensure the video capture device is connected to your K3s node before deploying.

## API Endpoints

Once deployed, the service is available at `http://<NODE_IP>:30002`:

| Endpoint             | Description                                      |
|----------------------|--------------------------------------------------|
| `GET /health`        | Health check (`{"status": "ok"}`)                |
| `GET /display`       | Current disc, track, minutes, seconds as JSON    |
| `GET /frame`         | Latest captured frame as PNG                     |
| `GET /frame-filtered`| Binarized frame (threshold visualization) as PNG |

## Verify Deployment

```bash
# Check pod status
kubectl get pods

# Check service
kubectl get svc

# Health check
curl http://<NODE_IP>:30002/health

# Get current display state
curl http://<NODE_IP>:30002/display

# View captured frame (save as PNG)
curl http://<NODE_IP>:30002/frame -o frame.png
```

## Uninstall

```bash
./scripts/uninstall-k8s.sh
```

Or manually:

```bash
helm uninstall composite-video-parser
```
