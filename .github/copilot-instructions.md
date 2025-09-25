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
- **AdminAuth**: Firebase Authentication for admin users with secure access control
- **DataTable**: Dynamic table with sorting, displays Firestore document data
- **QueryConsole**: Advanced query builder for Firestore with filters, ordering, and limits
- **MigrationConsole**: Batch operations for editing, duplicating, and deleting documents
- **App**: Main container managing connection state, authentication, data flow, and all operations

## Firebase Integration
- **Initialization**: Firebase app initialized in `services/firebase.js` with user-provided config
- **Authentication**: Firebase Auth for admin user verification and session management
- **Firestore**: Uses modular Firebase v9+ SDK for Firestore operations
- **Collections**: Dynamically fetches and displays any Firestore collection
- **Advanced Queries**: Supports where clauses, orderBy, and limit operations via `executeQuery`
- **Batch Operations**: Supports batch updates, field deletion, document duplication, and deletion
- **Error Handling**: Comprehensive error handling for all Firebase operations

## Authentication System
- **Admin-Only Access**: Query and migration consoles require Firebase Authentication
- **Email/Password Login**: Secure admin credentials stored in Firebase Auth
- **Session Management**: Persistent authentication state with automatic sign-out
- **Security Enforcement**: Database operations restricted to authenticated admin users
- **User Feedback**: Real-time auth status with detailed error messages

## Migration Console Features
- **Document Selection**: Multi-select interface for choosing documents to operate on
- **Batch Updates**: Update multiple documents with new field values simultaneously
- **Field Deletion**: Remove specific fields from multiple documents with confirmation warnings
- **Document Duplication**: Clone existing documents with all their data
- **Document Deletion**: Remove multiple documents with confirmation prompts
- **Field Management**: Dynamic field editor with type-aware value parsing
- **Operation Status**: Real-time feedback on migration operations
- **Auto-refresh**: Automatically refreshes data after successful operations

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
- **Collapsible Sections**: Query console and migration console expand/collapse to save screen space
- **Dynamic Forms**: Filter rows and update fields can be added/removed with real-time validation
- **Query State Management**: Clear distinction between original and filtered data sets
- **Multi-selection Interface**: Checkbox-based document selection with bulk actions
- **Confirmation Dialogs**: Safety prompts for destructive operations like deletion
- **Color-coded Operations**: Different gradient colors for different operation types (orange=query, red=migration, blue=duplicate, blue=auth)
- **Authentication Gates**: Visual barriers requiring admin login for sensitive operations
- **Warning Messages**: Red-themed alerts for destructive field deletion operations