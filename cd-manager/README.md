# CD Manager

Next.js application for the Smart CD Player project. It combines the web UI, the
CD collection APIs and the multi-player slot management in one server.

The app can manage up to 3 CD players and presents their slots as a single
virtual changer: Player 1 contributes slots `1..capacity`, Player 2 continues
after it, and Player 3 continues after Player 2.

## Features

- **Unified player view**: carousel and slider over all players at once
- **Capacity-based virtual slots**: the virtual number is
  `previous players capacity + physical slot`
- **Only occupied slots in the UI**: empty slots are managed when adding a CD,
  not shown as gaps in the carousel
- **Physical slot commands**: playback always targets the correct player and the
  physical slot inside that player
- **Global slot search** and “All from artist” across players
- **Collection integration**: “See on player” jumps to the matching virtual slot
- **Player configuration** from the toolbar menu
- **Now playing / media session**: follows the playing player, with the focused
  slot’s player as fallback

## Coding Guidelines

- **No Classes**: Avoid using ES6 classes. Use plain objects and factory functions instead.

## Setup

Install dependencies:

```bash
yarn install
```

Run `npx auth secret` to generate a secret and set it in `.env.local`. Add the
`CLIENT_ID` and `CLIENT_SECRET` from your OAuth provider to the same file.

Optional environment variables:

```bash
# Directory that stores the JSON database and album art
DATA_DIR=../data/db
IMAGES_DIR=../data/images
```

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

```bash
yarn dev      # Start the development server
yarn build    # Build for production
yarn start    # Start the production server
yarn lint     # Run ESLint
yarn test     # Run the Jest test suite
```

## Tests

The virtual-slot logic lives in [`lib/virtual-slots.ts`](./lib/virtual-slots.ts)
and is covered by `lib/__tests__/virtual-slots.test.ts`:

- capacity-based offsets
- physical slot to virtual number resolution
- visible slots containing only CDs
- cross-player artist grouping and CD lookup

Run the full suite with:

```bash
yarn test --runInBand
```

## Data files

The application stores its data as JSON:

- `cd-collection.json`: complete CD collection
- `player-definitions.json`: player configuration, capacity and stream IDs
- `player-content.json`: CD assignments by player and physical slot
- `config.json`: general application configuration

Adding or removing CDs does not change the schema when using the unified view;
the UI only changes how the existing player-indexed data is presented.

## Documentation

- [IR Remote Client](./docs/ir-remote-client.md)
- [Kubernetes Deployment](./docs/kubernetes.md)
- [Image processing and reprocessing](./docs/image-processing.md)
