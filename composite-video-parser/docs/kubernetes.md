# Kubernetes Deployment Guide

This guide explains how to deploy the Composite Video Parser to a K3s cluster using Helm.

## Prerequisites

- Docker installed and running
- K3s cluster with access to the V4L2 capture nodes (e.g. `/dev/video0`)
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

### Shared Service Configuration

The deploy script includes a shared service registry file from the monorepo root (`shared-services.yaml`) via `-f ../../shared-services.yaml`. This file is the single source of truth for service names and ports used in cross-service communication (e.g., `cd-manager` uses it to discover this service's URL).

If you rename this service or change its port, update `shared-services.yaml` and redeploy both services.

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
| `replicaCount`               | `1`                      | Number of pods (keep at 1)          |
| `image.repository`           | `composite-video-parser` | Docker image name                   |
| `image.tag`                  | `""` (appVersion)        | Docker image tag                    |
| `service.type`               | `NodePort`               | Kubernetes Service type             |
| `service.port`               | `3100`                   | Service port                        |
| `service.nodePort`           | `30002`                  | Static NodePort (30000-32767)       |
| `securityContext.privileged` | `true`                   | Required for V4L2 device access     |
| `env.CONFIG_PATH`            | `/app/config.json`       | Path to config file inside container|
| `videoDevices.enabled`       | `true`                   | Mount V4L2 devices from host        |
| `videoDevices.mountHostDev`  | `true`                   | Mount the whole host `/dev` at `/host-dev` |
| `videoDevices.hostDevSource` | `/dev`                   | Host directory to mount             |
| `videoDevices.hostDevMountPath` | `/host-dev`           | Mount path inside the container     |
| `videoDevices.hostPaths`     | `[/dev/video0, /dev/video2]` | Fallback: explicit capture nodes |
| `videoDevices.v4lDir.enabled`| `true`                   | Fallback: mount `/dev/v4l` links    |
| `videoDevices.v4lDir.hostPath`| `/dev/v4l`              | Fallback: host symlink directory    |

## Video Device Access

By default the chart mounts the host `/dev` directory at `/host-dev` and runs the
container privileged. This is deliberate:

- `/dev/videoN` numbering is **not stable** across a USB rescan or reboot.
- Both MacroSilicon MS210x cards expose the same serial (`20200909`), so
  `/dev/v4l/by-id` cannot distinguish them; the `by-id` symlinks collide.
- `/dev/v4l/by-path/...` follows the physical USB port and resolves to whatever
  `/dev/videoN` the kernel assigned. The config uses those paths:

```json
"player-1": {
  "capture": {
    "device": "/host-dev/v4l/by-path/pci-0000:15:00.0-usb-0:1:1.0-video-index0"
  }
},
"player-2": {
  "capture": {
    "device": "/host-dev/v4l/by-path/pci-0000:38:00.3-usb-0:2:1.0-video-index0",
    "inputFormat": "mjpeg"
  }
}
```

Because `/dev` is bind-mounted, a rescan that renumbers `videoN` updates the
symlinks inside `/host-dev` automatically; the stream still opens the same
physical port. This survives reboots and `udev` rescans.

It does **not** survive physically moving a cable to a different USB port: the
port path changes, and the mapping must be updated. With two identical serials,
that is unavoidable unless we add a content-based pairing step later.

The second card only supports YUYV up to 480x320 but MJPEG up to 720x480. Its
stream sets `inputFormat: "mjpeg"` so it captures natively at 720x480 instead of
being upscaled from 480x320.

With a good composite signal, the raw MJPEG colors are already close to
`player-1` (`[0,153,68]` vs `[0,126,38]` for the bar, and `[212,255,239]` vs
`[211,245,226]` for the glyphs). **No `videoFilter` is used**: the earlier
filters either washed the image out or turned the black background dark green.

The second player's OSD font is slightly different from the one the ONNX model
was trained on, so `player-2` uses the template/k-NN classifier built from
`digit-classifier/source-digits`:

```json
"player-2": {
  "capture": {
    "inputFormat": "mjpeg"
  },
  "classifier": "template",
  "binarizationThreshold": 170
}
```

The regression fixture `test/fixtures/player2-playing.png` contains a raw live
frame (`DISC 83 TRACK 3 0.18`) and reads 9/9 with this classifier.

`source-digits` is copied into the image by `yarn build`; the deployed pod does
not need any extra volume for it.

Keep `replicaCount: 1`: all streams run in one pod, and two pods would compete
for the same devices.

## API Endpoints

Once deployed, the service is available at `http://<NODE_IP>:30002`:

| Endpoint             | Description                                      |
|----------------------|--------------------------------------------------|
| `GET /health`        | Health check and per-stream capture state        |
| `GET /display`       | All readings, keyed by player id                 |
| `GET /streams`       | Stream/capture diagnostics                       |
| `GET /frame?id=<id>` | Latest captured frame as PNG                     |
| `GET /frame-annotated?id=<id>` | Raw frame with the digit rects overlaid       |
| `GET /frame-filtered?id=<id>` | Binarized frame (threshold visualization) as PNG |
| `POST /capture/start?id=<id>` | Start one stream (or all without `id`)  |
| `POST /capture/stop?id=<id>`  | Stop one stream (or all without `id`)   |

`GET /display` returns a map keyed by the configured player id:

```json
{
  "player-1": {
    "status": "ok",
    "mode": "playing",
    "disc": 2,
    "track": 7,
    "minutes": 3,
    "seconds": 41,
    "timestamp": 1792300800000
  }
}
```

`status` is one of `ok`, `starting`, `stale` or `error`. An `error` entry also includes an `error` message.

## Multiple CD players / video streams

Each stream has its own capture config and its own geometry. There are no global rects or inheritance:

```json
{
  "streams": {
    "player-1": {
      "capture": {
        "id": "capturadora-a",
        "device": "/host-dev/v4l/by-path/pci-0000:15:00.0-usb-0:1:1.0-video-index0",
        "width": 720,
        "height": 480,
        "fps": 2,
        "brightness": -75,
        "contrast": 240
      },
      "geometry": {
        "powerPixel": { "x": 200, "y": 47 },
        "modePixel": { "x": 470, "y": 60 },
        "rects": {
          "disc_1": { "x": 160, "y": 50, "width": 26, "height": 21 }
        }
      }
    }
  },
  "server": { "port": 3100, "staleAfterMs": 5000 },
  "detection": {
    "minDigitConfidenceMargin": 0.15,
    "retryDelayMinMs": 30,
    "retryDelayMaxMs": 50
  }
}
```

The example above is abbreviated: `rects` must contain all nine names (`disc_1..3`, `track_1..2`, `time_1..4`). See `config.json` for the full list.

`capture.id` and `capture.device` are internal. The public id is the key in `streams` (`player-1`) and is what appears in `/display`.

### Calibrating a stream

```bash
# Fetch the frame of one stream
curl "http://<host>:30002/frame?id=player-2" -o /tmp/p2.png

# Draw its rects and indicator pixels
python3 digit-classifier/train/annotate_rects.py \
  --stream player-2 --file /tmp/p2.png

# Inspect the actual crops
python3 digit-classifier/train/fetch_crops.py --stream player-2 \
  --url "http://<host>:30002/frame?id=player-2"
```

When the geometry looks right, verify the reading for that stream in
`GET /display`:

```bash
curl "http://<host>:30002/display"
```


## Verify Deployment

```bash
# Check pod status
kubectl get pods

# Check service
kubectl get svc

# Health check
curl http://<NODE_IP>:30002/health

# Get current display state (all streams)
curl http://<NODE_IP>:30002/display

# Stream diagnostics
curl http://<NODE_IP>:30002/streams

# View captured frame (save as PNG); add ?id=<stream> when there are many
curl "http://<NODE_IP>:30002/frame?id=player-1" -o frame.png
```

## Uninstall

```bash
./scripts/uninstall-k8s.sh
```

Or manually:

```bash
helm uninstall composite-video-parser
```
