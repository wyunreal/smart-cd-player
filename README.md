# Smart CD Player

A modern web application to manage multiple CD players and your disc collection. Built with Next.js 15, React 19, and Material-UI (MUI) v6.

## 🎵 Features

- **Multiple Player Management**: Manage up to 3 CD players simultaneously
- **CD Collection**: Organize and search through your complete disc collection
- **Album Information**: Automatic fetching of album information, including cover art
- **Responsive Interface**: Optimized experience for mobile and desktop devices
- **Slot Management**: Assign CDs to specific slots in each player
- **Authentication**: Integrated authentication system with NextAuth
- **Customizable Themes**: Support for light and dark themes

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- Yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/wyunreal/smart-cd-player.git
cd smart-cd-player
```

2. Navigate to the project directory:

```bash
cd cd-manager
```

3. Install dependencies:

```bash
yarn install
```

4. Configure environment variables:

Create a `.env.local` file in the `cd-manager` directory:

```bash
# Generate a secret with: npx auth secret
AUTH_SECRET=your_generated_secret

# OAuth configuration (optional)
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret

# Directory to store album cover art (optional)
# Default: ../data/images
IMAGES_DIR=/absolute/path/to/images/directory
```

5. Run the development server:

```bash
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
smart-cd-player/
├── shared-services.yaml     # Shared service registry (names, ports) for cross-service references
├── cd-manager/              # Main Next.js application (web UI + API)
│   ├── api/                 # Business logic and APIs
│   ├── app/                 # Next.js App Router routes and components
│   │   ├── (dashboard)/     # Dashboard pages
│   │   ├── api/             # API Routes
│   │   ├── components/      # React components
│   │   ├── forms/           # Forms
│   │   ├── hooks/           # Custom React Hooks
│   │   └── providers/       # Context Providers
│   ├── theme/               # MUI theme configuration
│   └── public/              # Static files
├── composite-video-parser/  # Reads the CD player display from composite video
│   ├── src/                 # HTTP server, digit streams, frame providers
│   ├── digit-classifier/    # CNN + ONNX model, training and capture tooling
│   ├── charts/              # Helm chart (k3s)
│   └── docs/                # Deployment notes
├── audio-streamer/          # Audio streaming service
├── remote-controller/       # IR remote client
└── data/                    # Global data
    └── db/                  # database, json files by now
    └── images/              # Album art
```

## 🛠️ Technologies

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **React**: v19.0.0
- **UI Framework**: [Material-UI (MUI) v6](https://mui.com/)
- **Authentication**: [NextAuth v5](https://next-auth.js.org/)
- **Styling**: Emotion (CSS-in-JS)
- **Animations**: React Spring, React Transition Group
- **TypeScript**: For type-safety
- **Data Management**: MUI X Data Grid

## 📋 Main Features

### Player Management

- Define CD players with different capacities
- Activate/deactivate players as needed
- Navigate between multiple players

### CD Collection

- Add CDs manually or through automatic search
- Complete information: artist, album, year, genre, tracks
- Automatic download of album cover art
- Search and filter your collection

### Slot Assignment

- Assign CDs to specific slots in each player
- Intuitive visualization of all slots
- Complete CD details in each slot

## 🎛️ Composite Video Parser

`composite-video-parser/` reads the VFD/7-segment display of a CD player from
composite video and exposes its state (disc, track, minutes, seconds, mode) over
HTTP, so `cd-manager` can show what each player is doing.

### How it works

1. **Capture** — a capture card (`/dev/video0` through V4L2 + ffmpeg) or an HTTP
   frame source produces low-rate RGB frames (e.g. 720×480 @ 2 fps).
2. **Geometry** — each stream defines fixed rectangles over the digit cells,
   plus a `powerPixel` (is the device on?) and a `modePixel` (is it stopped?).
3. **Classification** — every rect is cropped to 26×21, binarized with
   `min(R,G,B) > threshold` and classified by a small CNN exported to ONNX.
   The `blank` class means "no digit in this cell".
4. **State** — the cells are combined into disc / track / MM.SS, and the mode is
   derived from whether the seconds advance.

### Configuration

`config.json` is keyed by stream id; each stream has its own capture source and
geometry, so several capture cards can be calibrated independently:

```json
{
  "streams": {
    "player-1": {
      "capture": { "id": "capturadora-a", "device": "/dev/video0", "width": 720, "height": 480, "fps": 2 },
      "geometry": {
        "powerPixel": { "x": 200, "y": 47 },
        "modePixel": { "x": 470, "y": 60 },
        "rects": {
          "disc_1": { "x": 160, "y": 50, "width": 26, "height": 21 }
        }
      }
    }
  },
  "server": { "port": 3100 },
  "detection": { "minDigitConfidenceMargin": 0.15, "retryDelayMinMs": 30, "retryDelayMaxMs": 50 }
}
```

All nine rect names are required (`disc_1..3`, `track_1..2`, `time_1..4`), and
`capture` must define exactly one of `device` or `url`.

### HTTP API

| Endpoint | Description |
|---|---|
| `GET /display` | map of stream id → `{ status, mode, disc, track, minutes, seconds, timestamp }` |
| `GET /streams` | capture id/device, size, fps, `capturing`, `hasFrame`, `lastError` |
| `GET /frame?id=<id>` | latest frame as PNG (`id` optional when there is a single stream) |
| `GET /frame-filtered?id=<id>` | binarized frame (same threshold the model uses) |
| `GET /health` | overall `status` plus per-stream `ok` / `idle` / `error` |
| `POST /capture/start` · `POST /capture/stop` | start/stop capture (it also starts lazily) |

### Digit classifier and tooling

The classifier lives in `composite-video-parser/digit-classifier/` (see its
[README](composite-video-parser/digit-classifier/README.md)). Every script
accepts `--stream <id>` and `--url`.

| Tool | Purpose |
|---|---|
| `annotate_rects.py` | draw the stream's rects/pixels on a frame (calibrate a new capture card) |
| `fetch_crops.py` | save the rect crops of one frame |
| `capture_digits.py` | capture `time_4` crops while a CD plays |
| `bootstrap_dataset.py` | rebuild `source-digits/` from scratch: `collect` → `cluster` → label → `distribute` |
| `check_live.py` | classify one live frame with the current model (digits + mode) |
| `train.py` | train and export the ONNX model |
| `make_fixture.mjs` | regenerate the parser's end-to-end test fixture |

Deployment (k3s + Helm): see
[`composite-video-parser/docs/kubernetes.md`](composite-video-parser/docs/kubernetes.md).

## 🔧 Available Scripts

```bash
yarn dev      # Start the development server
yarn build    # Build the application for production
yarn start    # Start the production server
yarn lint     # Run the linter
```

## 📝 Configuration

The application uses JSON files to store data:

- `cd-collection.json`: Complete CD collection
- `player-definitions.json`: Player configuration
- `player-content.json`: CD to slot assignments
- `config.json`: General application configuration

## 🎨 Customization

The theme can be customized in the `theme/` directory:

- `colors.ts`: Color palette
- `typography.ts`: Typography configuration
- `components.ts`: MUI component styles
- `theme.ts`: Main theme configuration

## 🚢 Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com/):

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Configure volumes for images and db
5. Deploy!

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more options.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## 👤 Author

**wyunreal**

---

⭐ If you find this project useful, consider giving it a star on GitHub!
