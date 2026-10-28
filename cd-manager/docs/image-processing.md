# Image processing

The CD collection stores its artwork in `IMAGES_DIR`. Images are processed in
two ways:

1. **Normalized for the web** — EXIF orientation applied, metadata stripped,
   capped dimensions, WebP encoding, and a 150px thumbnail derived from the
   processed image.
2. **CD covers centred on the disc** — the outer circle of the CD is detected
   and the image is cropped to the square that circumscribes it. The disc
   centre then sits exactly at the centre of the image, so the CSS rotation in
   the now-playing screen spins the disc in place instead of making it orbit.

For the repeatable procedure to rebuild the processed images from the raw
files, see [Runbook: reprocessing the raw images](#runbook-reprocessing-the-raw-images).

## Non-destructive by design

The CLI **never modifies, renames or deletes a raw image**, and it never
writes `cd-collection.json`. It only adds new files whose names are prefixed
with `processed-v<version>-`:

| Raw file | Processed large | Processed thumbnail |
| --- | --- | --- |
| `12-cd.jpg` | `processed-v1-12-cd.jpg.webp` | `processed-v1-12-cd.jpg-150.webp` |
| `12-album.png` | `processed-v1-12-album.png.webp` | `processed-v1-12-album.png-150.webp` |

The raw filename (including its extension) is part of the processed name, so
the mapping is deterministic and collisions are impossible.

Because the files are additive, reverting is just deleting the
`processed-v*` files. `getCdCollection()` resolves each artwork to its
processed variant when the file exists and falls back to the raw one
otherwise, so the database never needs to change. The writers (`addCd`,
`editCd`, `deleteCd`) always read and persist the raw URIs.

Set `USE_PROCESSED_IMAGES=false` to ignore the processed files at runtime
without deleting them.

New CDs added from the app generate their processed variants automatically in
`addCd`, next to the raw files. If processing fails, the CD is still added with
the raw files, a warning is logged, and the app falls back to the raw artwork.
The CLI can retry those images later.

## Output sizes

| Kind | Large output | Thumbnail |
| --- | --- | --- |
| `cd` | Square crop around the detected disc, max 1000×1000 | 150×150 |
| `album` | Square cover crop, max 1000×1000 | 150×150 |
| `artist` | Aspect ratio preserved, long edge max 1200 | 150×150 |

Large images are never upscaled. Thumbnails are always 150×150 so list
layouts stay consistent.

## CLI

```bash
# Dry-run (default): processes in memory and reports what would change.
yarn images:process

# Only CDs, first 20:
yarn images:process --only=cd --limit=20

# Apply the changes and write a JSON report:
yarn images:process --write

# Regenerate images that already have processed variants:
yarn images:process --write --force
```

Options:

| Flag | Description |
| --- | --- |
| `--write` | Apply changes. Without it the CLI is a dry-run. |
| `--only=cd,album,artist` | Limit to specific artwork kinds. |
| `--limit=N` | Process at most N images. |
| `--force` | Regenerate already processed images. |
| `--concurrency=N` | Parallel images (default 4). |
| `--report=PATH` | Write the JSON report to a custom path. |
| `--revert` | Delete `processed-v*` files (requires `--write`). |
| `--version=N` | With `--revert`, only delete that pipeline version. |
| `--prune-old-versions` | Delete processed files from older versions (requires `--write`). |

The CLI reads `DATA_DIR` and `IMAGES_DIR` from the environment, using the same
defaults as the app (`../data/db` and `../data/images` relative to the
`cd-manager` working directory).

Dry-runs do not write anything. In `--write` mode the report is stored in
`$DATA_DIR/reports/processed-images-<timestamp>.json`.

## Reverting

```bash
# List what would be deleted (dry-run)
yarn images:process --revert

# Delete every processed image, keeping the raw originals intact
yarn images:process --revert --write

# Delete only the v1 outputs
yarn images:process --revert --version=1 --write
```

Revert and prune only delete files matching
`processed-v<number>-*.webp`. Any other file in `IMAGES_DIR` is ignored.

After bumping `PROCESSING_VERSION`, old processed files stop being used and
can be cleaned up with `yarn images:process --prune-old-versions --write`.

## Running against the cluster

The real data lives on the PVC, so the CLI can run as a one-off Kubernetes Job
inside the cluster. `scripts/process-cluster-images.sh` builds the `tools`
stage of the Dockerfile (which includes `tsx`, `sharp` and the CLI), imports it
into k3s and creates a Job that mounts the data PVC at `/app/data`.

```bash
cd cd-manager

# Dry-run over the whole collection
./scripts/process-cluster-images.sh pi 192.168.1.50

# Preview only CD crops, first 20
./scripts/process-cluster-images.sh pi 192.168.1.50 --only=cd --limit=20

# Apply the changes
./scripts/process-cluster-images.sh pi 192.168.1.50 --write

# Revert
./scripts/process-cluster-images.sh pi 192.168.1.50 --revert --write
```

Every argument after the host is passed to `images:process`. The script uses
`sudo k3s kubectl` over SSH; override `KUBECTL_CMD` if the remote host needs a
different command (for example `kubectl` without `sudo`). Other defaults:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NAMESPACE` | `default` | Namespace of the Job and PVC. |
| `PVC_NAME` | `cd-manager` | Data PVC to mount. |
| `IMAGE_REPOSITORY` | `cd-manager-tools` | Tools image repository. |
| `IMAGE_TAG` | `imgproc-<timestamp>` | Tools image tag. |
| `PLATFORM` | `linux/amd64` | Build platform. |
| `SKIP_BUILD` | `0` | Set to `1` to reuse an already imported image. |
| `KUBECTL_CMD` | `sudo k3s kubectl` | Remote kubectl command. |
| `CTR_CMD` | `sudo k3s ctr` | Remote containerd command used for the import. |

The import, the Job creation and the log following all run inside a single
SSH/TTY session, so `sudo` prompts for the password once instead of once per
command. If you already imported the image (for example after a failed run),
reuse it and skip the 1.5 GB transfer:

```bash
SKIP_BUILD=1 IMAGE_TAG=imgproc-20261028223032 \
  ./scripts/process-cluster-images.sh wyunreal 192.168.68.50
```

The Job only adds `processed-v*` files and reports; it never modifies raw
images or `cd-collection.json`. Reports are written to
`/app/data/reports/` on the PVC and are visible through FileBrowser. The
completed Job is kept for 7 days so its logs remain available.

FileBrowser is exposed by the chart's NodePort (30001 by default) and mounts
the same PVC at its root, so the processed images are under `images/` and the
reports under `reports/`:

```text
http://<node-ip>:30001
```

If you prefer not to run it in the cluster, the alternative is to sync
`DATA_DIR` and `IMAGES_DIR` locally, run the CLI there, and copy back only the
new `processed-v*` files. The raw files are read-only in both cases.

## Runbook: reprocessing the raw images

Use this procedure whenever raw artwork changes, a job fails or is incomplete,
the pipeline is updated, or processed files are missing. The app keeps serving
the raw artwork for any image without a processed counterpart, so reprocessing
can run while the app is up.

> Processed files are only served by app builds that include the read-time
> resolver in `getCdCollection`. If the deployment predates that change, deploy
> the app first.

### TL;DR

```bash
cd cd-manager

# Reprocess every raw image and rebuild existing processed files
./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> --write --force

# Only generate what is missing (new CDs, failed images, etc.)
./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> --write
```

### When to use which command

| Situation | Command |
| --- | --- |
| New raw images, failed processing or an incomplete previous run | `--write` (skips existing pairs) |
| Force a full rebuild of every artwork | `--write --force` |
| Only CD disc images | `--only=cd --write` (add `--force` to rebuild) |
| Test a small batch first | `--only=cd --limit=20 --force` then repeat with `--write` |
| Pipeline changed | Bump `PROCESSING_VERSION`, rebuild the tools image, `--write`, deploy the app, then prune old versions |
| Bad crops / low confidence | Inspect the report, tune the detector, bump the version, reprocess |

### Standard full reprocess (cluster)

The script builds the `tools` Docker stage, imports it into k3s and runs a Job
that mounts the real PVC at `/app/data`. Raw files and `cd-collection.json` are
never modified.

```bash
cd cd-manager

# 1. Dry-run: processes in memory and prints the summary without writing.
#    --force previews a rebuild of images that already have processed variants.
./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> --force

# 1b. Optional: write the dry-run report on the PVC for later review.
./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> --force \
  --report=/app/data/reports/dry-run.json

# 2. Apply. Creates or replaces only processed-v<version>-* files.
./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> \
  --write --force

# 3. A JSON report is written to /app/data/reports/ on the PVC.
#    Open it from FileBrowser or copy it with kubectl:
kubectl exec deploy/cd-manager -c cd-manager -- \
  sh -c 'ls -lt /app/data/reports | head'
```

If the image was already imported (for example after a failed run), reuse its
tag instead of transferring 1.5 GB again:

```bash
SKIP_BUILD=1 IMAGE_TAG=imgproc-20261028223032 \
  ./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> --write
```

To force every image to be rebuilt, including those that already have both
processed variants:

```bash
./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> \
  --write --force
```

Only new or missing images:

```bash
./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> --write
```

Only CD disc images, or a small preview batch:

```bash
./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> \
  --only=cd --write

./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> \
  --only=cd --limit=20
```

### Reprocessing after a pipeline change

1. Bump `PROCESSING_VERSION` in `api/image-processing/constants.ts` (for
   example from `1` to `2`).
2. Run the checks:

   ```bash
   yarn test
   yarn lint
   yarn build
   ```

3. Generate the new version. `--force` is not needed because the target names
   change from `processed-v1-*` to `processed-v2-*`:

   ```bash
   ./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> --write
   ```

   The currently deployed app still resolves `v1` and keeps working. It ignores
   the new `v2` files until it is redeployed.

4. Deploy the app so the resolver knows about the new version:

   ```bash
   ./scripts/deploy-remote-k3s.sh <REMOTE_USER> <REMOTE_HOST>
   ```

5. Verify a few images and the app (see below), then remove the old version:

   ```bash
   ./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> \
     --prune-old-versions --write
   ```

### Reprocessing after adding new CDs

New CDs added from the app generate their processed variants automatically.
The raw files are downloaded first, then `normalizeArt` writes the large and
thumbnail WebP files. The database keeps pointing at the raw URIs, so the
read-time resolver starts serving the processed versions immediately.

If the processing failed (for example because `sharp` could not decode an
unusual source), the add still succeeds with the raw files and warns in the
server log. Run the CLI without `--force` to retry only what is missing:

```bash
./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> --write
```

The already processed images are skipped because both variants exist.

### Verify the result

- The Job log prints a summary with `ready`, `skipped`, `failed` and
  `needsReview` counts.
- In the JSON report check:
  - `summary.failed` and `summary.needsReview` must be `0` (or explain each one).
  - each CD result has `disc.detected: true` and a reasonable `disc.confidence`.
  - `largeFile`/`thumbFile` exist under `/app/data/images/`.
- Compare one raw and its processed file in FileBrowser:
  - raw: `images/7-cd.jpeg`
  - processed: `images/processed-v1-7-cd.jpeg.webp`
- In the app, open the Network tab while a disc is spinning. The request should
  be for `/api/images/processed-v1-...webp`, not `.../7-cd.jpeg`.

Count processed files on the PVC:

```bash
kubectl exec deploy/cd-manager -c cd-manager -- \
  sh -c "ls /app/data/images | grep -c '^processed-v1-'"
```

Replace `v1` with the current `PROCESSING_VERSION` when applicable.

Check free space before a full rebuild:

```bash
kubectl exec deploy/cd-manager -c cd-manager -- df -h /app/data
```

Processed files coexist with the raw originals, so a full rebuild plus older
versions needs temporary extra space.

### Roll back

Fast rollback without deleting anything: set `USE_PROCESSED_IMAGES=false` in
the deployment environment and restart the app. The resolver falls back to the
raw images.

Permanent rollback: delete the processed files with `--revert` (see
[Reverting](#reverting)). The database never points at processed files, so no
JSON restore is needed.

### Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `sudo: a terminal is required to read the password` | Use the current `scripts/process-cluster-images.sh`; it runs import, apply and logs inside one SSH/TTY session. |
| `ImagePullBackOff` for the tools image | The image was not imported. Re-run without `SKIP_BUILD`, or import the tarball with `sudo k3s ctr images import`. |
| `SKIP_BUILD=1` uses an image that is not there | Set `IMAGE_TAG` to the exact tag that was imported. |
| PVC not found | Set `PVC_NAME` (default `cd-manager`) and `NAMESPACE` (default `default`). |
| Job cannot write to `/app/data` | The PVC must be writable by UID 1001. The app's init container applies that ownership on deployment. |
| App still requests raw images | Check that the processed file exists, that `USE_PROCESSED_IMAGES` is not `false`, that the deployed app includes the resolver, and that `PROCESSING_VERSION` matches the file names. Hard-refresh the browser. |
| Bad crop or low confidence | Check `needsReview`/`disc.confidence` in the report. Tune the detector, bump `PROCESSING_VERSION`, reprocess. There is no per-file manual override yet. |
| Disk full | Check `df -h /app/data`, remove old versions with `--prune-old-versions --write`, or move backups off the PVC. |

### Local alternative

If you prefer to run the CLI outside the cluster, sync `DATA_DIR` and
`IMAGES_DIR` locally, run:

```bash
yarn images:process --write --force
```

and copy back only the new `processed-v*` files. The raw files are read-only in
both cases.

## Disc detection

The outer circle is detected on a downscaled grayscale version of the image
using a gradient-direction Hough transform, followed by a local refinement
and a circumference-support confidence score. If the confidence is below
`DISC_MIN_CONFIDENCE` (0.55), or the disc is cropped by the frame, the CLI
falls back to a centred square crop and marks the image as `needsReview` in
the report.

Detection runs on the image after applying EXIF orientation, and the crop is
performed on the full-resolution source, so the output keeps the original
detail.

## Pipeline version

`PROCESSING_VERSION` in `api/image-processing/constants.ts` is part of every
processed filename. Bumping it invalidates all previous outputs: the app stops
resolving them and uses the raw files until the CLI regenerates them with the
new version.
