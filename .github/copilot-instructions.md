# Copilot Instructions for firebase-db-webclient

## Project Overview
This is a React + Vite web application that serves as a Firebase Firestore database client. Users can input their Firebase configuration, connect to their database, and view collection data in a dynamic table with dark mode UI and orange gradient accents.

## Architecture & Key Files
- **Entry Point**: `src/main.jsx` - React 19 with StrictMode, renders into `#root` div
- **Main App**: `src/App.jsx` - Main application with Firebase connection and data display logic
- **Firebase Service**: `src/services/firebase.js` - Firebase initialization and Firestore operations
- **Components**: `src/components/` - FirebaseConfig and DataTable components
- **Styling**: Tailwind CSS v4 with dark mode theme and orange accents

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
- **Tailwind Classes**: Use Tailwind utility classes for styling, avoid custom CSS when possible

## Component Architecture
- **FirebaseConfig**: Handles Firebase configuration input and connection
- **DataTable**: Dynamic table with sorting, displays Firestore document data
- **QueryConsole**: Advanced query builder for Firestore with filters, ordering, and limits
- **App**: Main container managing connection state, data flow, and query execution

## Firebase Integration
- **Initialization**: Firebase app initialized in `services/firebase.js` with user-provided config
- **Firestore**: Uses modular Firebase v9+ SDK for Firestore operations
- **Collections**: Dynamically fetches and displays any Firestore collection
- **Advanced Queries**: Supports where clauses, orderBy, and limit operations via `executeQuery`
- **Error Handling**: Comprehensive error handling for connection and data fetching

## Query Console Features
- **Where Clauses**: Support for all Firestore operators (==, !=, <, <=, >, >=, array-contains, in, not-in)
- **Data Types**: Handles string, number, boolean, and array value types
- **Order By**: Single field ordering with ascending/descending options
- **Limit**: Results pagination with configurable limits
- **Query Status**: Real-time feedback on query execution and results
- **Reset Functionality**: Toggle between filtered and original data sets

## Styling Approach  
- **Dark Mode**: Gray-900 background with gradient headers and orange accents
- **Tailwind v4**: Uses `@tailwindcss/vite` plugin for CSS processing
- **Orange Theme**: Primary accent color from orange-400 to orange-600
- **Responsive**: Mobile-first responsive design with max-width containers
- **Custom Scrollbars**: Dark-themed scrollbars in App.css

## ESLint Configuration
- Uses flat config format (`eslint.config.js`) with recommended rules
- **React Hooks**: Enforces hooks rules with `eslint-plugin-react-hooks`
- **React Refresh**: Includes Vite-specific refresh rules
- **Custom Rule**: Unused variables starting with uppercase/underscore are ignored

## UI Patterns
- **Gradient Backgrounds**: Orange gradients for buttons and headers
- **Loading States**: Spinner animations for async operations  
- **Status Messages**: Success/error feedback with color-coded styling
- **Sortable Tables**: Click column headers to sort table data
- **Responsive Layout**: Adapts to different screen sizes with Tailwind breakpoints
- **Collapsible Sections**: Query console expands/collapses to save screen space
- **Dynamic Forms**: Filter rows can be added/removed with real-time validation
- **Query State Management**: Clear distinction between original and filtered data sets