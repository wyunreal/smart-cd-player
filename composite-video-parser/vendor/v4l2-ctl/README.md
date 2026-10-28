# Vendored v4l2-ctl

`v4l2-ctl` is not packaged by Chainguard/Wolfi, so the parser image vendors the
Debian package instead of failing the Docker build.

- Version: `v4l2-ctl 1.22.1`
- Source package: `v4l-utils` from Debian bookworm (`linux/amd64`)
- License: GPL-2.0 (see the Debian package metadata/source)
- Files:
  - `bin/v4l2-ctl`
  - `lib/libv4l2.so.0`
  - `lib/libv4lconvert.so.0`
  - `lib/libjpeg.so.62`

The Dockerfile copies these files into `/usr/local/bin` and
`/usr/local/lib/v4l` and sets `LD_LIBRARY_PATH`. This binary is x86-64 and
matches the `linux/amd64` build platform used by the k3s node.

Refresh these files if upgrading `v4l-utils` or building for another
architecture.
