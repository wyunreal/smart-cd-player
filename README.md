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
├── cd-manager/              # Main Next.js application
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
