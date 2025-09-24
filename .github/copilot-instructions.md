# Copilot Instructions for firebase-db-webclient

## Project Overview
This is a React + Vite web application intended as a Firebase database client. Currently bootstrapped with the default Vite React template, this project uses modern React patterns with ES modules and strict mode enabled.

## Architecture & Key Files
- **Entry Point**: `src/main.jsx` - React 19 with StrictMode, renders into `#root` div
- **Main App**: `src/App.jsx` - Currently contains Vite template boilerplate
- **Styling**: Uses vanilla CSS with CSS custom properties (`:root` variables) in `src/index.css`
- **Build Tool**: Vite with React plugin, configured in `vite.config.js`

## Development Workflow
```bash
npm run dev      # Start dev server with HMR
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint check
```

## Code Conventions
- **ES Modules**: All files use `import/export` syntax (note `"type": "module"` in package.json)
- **JSX Extension**: React components use `.jsx` extension explicitly
- **React 19**: Uses latest React with new `createRoot` API
- **Function Components**: Prefer function components with hooks over class components

## ESLint Configuration
- Uses flat config format (`eslint.config.js`) with recommended rules
- **React Hooks**: Enforces hooks rules with `eslint-plugin-react-hooks`
- **React Refresh**: Includes Vite-specific refresh rules
- **Custom Rule**: Unused variables starting with uppercase/underscore are ignored
- **Globals**: Browser environment configured

## Firebase Integration (Planned)
The project name suggests Firebase database integration. When implementing:
- Firebase SDK should be installed and configured in a separate service file
- Consider using React Context for Firebase auth state
- Database operations should be abstracted into custom hooks

## Asset Management
- **Public Assets**: Place in `/public` (e.g., `vite.svg` referenced as `/vite.svg`)
- **Component Assets**: Place in `src/assets/` (e.g., `react.svg` imported as module)
- **Icons**: Uses SVG format for logos and icons

## Styling Approach
- **CSS Custom Properties**: Defined in `:root` for theming
- **Dark Mode**: Configured with `color-scheme: light dark`
- **Component Styles**: Co-located CSS files (e.g., `App.css` next to `App.jsx`)
- **Modern CSS**: Uses `place-items`, system font stack, and CSS logical properties