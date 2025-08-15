# GEMINI.md

## Project Overview

This is a comprehensive ERP (Enterprise Resource Planning) system designed for business management, with a focus on electronic invoicing. The frontend is built as a modern, modular, and scalable single-page application (SPA) using Vue.js and the latest web technologies. It communicates with a Supabase backend for data persistence, authentication, and other backend services.

### Key Technologies

*   **Frontend:**
    *   **Framework:** Vue.js 3 (with Composition API)
    *   **Build Tool:** Vite
    *   **Routing:** Vue Router
    *   **State Management:** Pinia
    *   **Styling:** Tailwind CSS
    *   **UI Components:** Headless UI, Lucide Icons
    *   **Form Validation:** VeeValidate & Yup
    *   **Internationalization (i18n):** vue-i18n
    *   **Testing:** Vitest (for unit tests)
*   **Backend:**
    *   **Service:** Supabase (PostgreSQL database, Authentication, Storage)
*   **Language:** TypeScript

### Architecture

The project follows a standard structure for Vue.js applications, with a clear separation of concerns:

*   `src/components`: Reusable UI components.
*   `src/views`: Application pages, corresponding to routes.
*   `src/router`: Routing configuration.
*   `src/stores`: Pinia stores for state management.
*   `src/services`: Services for interacting with the Supabase backend.
*   `src/composables`: Reusable composition functions.
*   `src/assets`: Static assets like CSS and images.
*   `supabase/migrations`: Database schema migrations.

## Building and Running

### Prerequisites

*   Node.js (version specified in `package.json`)
*   A Supabase project with the required schema (see `supabase/migrations`).
*   A `.env` file with the following variables:
    *   `VITE_SUPABASE_URL`: Your Supabase project URL.
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase project anonymous key.

### Key Commands

*   **Install dependencies:**
    ```bash
    npm install
    ```
*   **Run development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:6430`.
*   **Build for production:**
    ```bash
    npm run build
    ```
*   **Run unit tests:**
    ```bash
    npm run test:unit
    ```
*   **Lint and format code:**
    ```bash
    npm run lint
    npm run format
    ```

## Development Conventions

*   **Coding Style:** The project uses ESLint and Prettier to enforce a consistent coding style. It's recommended to use the provided VS Code extensions for automatic formatting and linting on save.
*   **State Management:** All application state should be managed through Pinia stores. Each store corresponds to a specific domain (e.g., `auth`, `products`, `sales`).
*   **API Interaction:** All communication with the Supabase backend should be encapsulated in services within the `src/services` directory.
*   **Routing:** Each view should have a corresponding route in `src/router/index.ts`. Route-level code splitting is used to lazy-load views.
*   **Commits:** (Assumed) Follow conventional commit standards for clear and automated versioning.
