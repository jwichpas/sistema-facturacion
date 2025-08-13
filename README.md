# Sistema ERP - Frontend

Modern, responsive frontend for a multi-company ERP system built with Vue 3, TypeScript, and Tailwind CSS. This system provides comprehensive business management capabilities including inventory management, sales, purchases, electronic invoicing, and SUNAT compliance reporting.

## 🚀 Features

- **Vue 3** with Composition API and `<script setup>` syntax
- **TypeScript** for type safety
- **Tailwind CSS v4** with dark/light mode support
- **Pinia** for state management
- **Vue Router** for navigation
- **VeeValidate + Yup** for form validation
- **Vue I18n** for internationalization (Spanish/English)
- **Supabase** integration for backend services
- **PWA** capabilities (configurable)
- **Responsive design** for desktop, tablet, and mobile

## 🏗️ Project Structure

```
src/
├── assets/          # Static assets and styles
├── components/      # Reusable Vue components
├── composables/     # Vue composition functions
├── locales/         # i18n translation files
├── plugins/         # Vue plugins configuration
├── router/          # Vue Router configuration
├── services/        # API and business logic services
├── stores/          # Pinia stores
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and constants
└── views/           # Page components
```

## 🛠️ Technology Stack

### Core Framework

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server

### UI/UX

- **Tailwind CSS v4** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Lucide Vue** - Beautiful & consistent icons
- **VueUse Motion** - Smooth animations

### State Management & Forms

- **Pinia** - Intuitive state management
- **VeeValidate** - Form validation
- **Yup** - Schema validation

### Data & Visualization

- **TanStack Table** - Powerful data tables
- **ApexCharts** - Interactive charts
- **Three.js** - 3D warehouse visualization

### Backend Integration

- **Supabase** - Backend-as-a-Service
- **Supabase Auth** - Authentication
- **Supabase Storage** - File storage

## 📋 Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- npm or yarn package manager

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd sistema-facturacion
npm install
```

### 2. Environment Setup

Copy the environment template and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:6430`

### 4. Build for Production

```bash
npm run build
```

## 🧪 Testing

Run unit tests:

```bash
npm run test:unit
```

## 🔧 Code Quality

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## 🌐 Internationalization

The application supports Spanish (default) and English:

- Spanish: `es`
- English: `en`

Translation files are located in `src/locales/` and are currently inlined in the i18n plugin for build compatibility.

## 🎨 Theming

The application supports:

- **Light mode**
- **Dark mode**
- **System preference** (automatic)

Theme preferences are persisted in localStorage.

## 📱 PWA Support

Progressive Web App features are available but currently disabled due to build compatibility issues. They can be re-enabled by uncommenting the PWA plugin in `vite.config.ts`.

## 🏢 ERP Modules

The system is designed to support the following business modules:

- **Dashboard & Analytics**
- **Product & Inventory Management**
- **Customer & Supplier Management**
- **Sales Management & POS**
- **Purchase Management**
- **Warehouse & Transfer Management**
- **Electronic Invoicing (SUNAT)**
- **Reporting & Compliance**

## 🔐 Authentication

Authentication is handled through Supabase Auth with support for:

- Email/password authentication
- Session management
- Multi-company context
- Role-based access control

## 📊 State Management

The application uses Pinia stores for state management:

- **Auth Store** - User authentication and company context
- **UI Store** - Global UI state, theme, notifications
- Additional stores will be added for each business module

## 🛡️ Type Safety

Full TypeScript support with:

- Comprehensive type definitions in `src/types/`
- Strict type checking
- IntelliSense support
- Runtime type validation with Yup schemas

## 📝 Development Guidelines

- Use Composition API with `<script setup>` syntax
- Follow the established project structure
- Implement proper error handling
- Add TypeScript types for all new features
- Use the provided utility functions and constants
- Follow the established naming conventions

## 🤝 Contributing

1. Follow the existing code style and structure
2. Add proper TypeScript types
3. Include appropriate error handling
4. Test your changes thoroughly
5. Update documentation as needed

## 📄 License

This project is proprietary software. All rights reserved.
