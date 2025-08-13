# CompanySelector Component

A comprehensive dropdown component for selecting and switching between companies in a multi-tenant ERP system.

## Features

- **Company Selection**: Displays available companies with detailed information
- **Role-based Display**: Shows user role and permissions for each company
- **Company Information**: Displays RUC, currency, contact details
- **Loading States**: Handles loading and switching states gracefully
- **Error Handling**: Provides clear error messages and retry functionality
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Internationalization**: Supports multiple languages (Spanish/English)

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showDetails` | `boolean` | `true` | Whether to show expanded company details |
| `autoRefresh` | `boolean` | `false` | Whether to automatically refresh companies on mount |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `companyChanged` | `Company` | Emitted when a company is successfully selected |
| `error` | `string` | Emitted when an error occurs during company operations |

## Usage

### Basic Usage

```vue
<template>
  <CompanySelector 
    @company-changed="handleCompanyChange"
    @error="handleError"
  />
</template>

<script setup>
import CompanySelector from '@/components/ui/CompanySelector.vue'

const handleCompanyChange = (company) => {
  console.log('Company changed to:', company.legal_name)
  // Refresh page or update context
}

const handleError = (error) => {
  console.error('Company selector error:', error)
  // Show notification or handle error
}
</script>
```

### With Custom Props

```vue
<template>
  <CompanySelector 
    :show-details="false"
    :auto-refresh="true"
    @company-changed="handleCompanyChange"
  />
</template>
```

### In Navigation Bar

```vue
<template>
  <nav class="flex items-center justify-between">
    <div class="nav-left">
      <!-- Other nav items -->
    </div>
    
    <div class="nav-right">
      <CompanySelector @company-changed="refreshPage" />
      <!-- Other nav items -->
    </div>
  </nav>
</template>
```

## Component States

### Loading State
- Shows spinner animation
- Disables button interaction
- Displays loading message in dropdown

### Error State
- Shows error icon and message
- Provides retry button
- Maintains previous company selection

### Empty State
- Shows when no companies are available
- Displays helpful message
- Suggests contacting administrator

### Switching State
- Shows during company transition
- Prevents multiple simultaneous switches
- Provides visual feedback

## Company Information Display

Each company in the dropdown shows:

- **Company Name**: Trade name or legal name
- **RUC**: Formatted tax identification number
- **Role Badge**: User's role in the company (Admin, Manager, etc.)
- **Currency**: Company's default currency symbol
- **Contact Details**: Email, phone, address (when expanded)
- **Selection Indicator**: Check mark for current company

## Role Badge Colors

- **Super Admin**: Purple
- **Admin**: Red
- **Manager**: Blue
- **Seller**: Green
- **Viewer**: Gray

## Accessibility Features

- Full keyboard navigation support
- ARIA labels and roles
- Screen reader announcements
- Focus management
- High contrast support

## Internationalization

Supports the following translation keys:

```json
{
  "company": {
    "selectCompany": "Select Company",
    "loading": "Loading companies...",
    "noCompanies": "No companies",
    "noCompaniesDescription": "You don't have access to any companies.",
    "ruc": "RUC",
    "showDetails": "Show details",
    "hideDetails": "Hide details",
    "switchingCompany": "Switching company...",
    "companyChanged": "Company changed successfully",
    "errorSwitching": "Error switching company"
  }
}
```

## Dependencies

- `@vueuse/core` - For click outside functionality
- `lucide-vue-next` - For icons
- `@/stores/company` - Company state management
- `@/utils/company` - Utility functions for formatting

## Store Integration

The component integrates with the `useCompanyStore()` Pinia store:

- `currentCompany` - Currently selected company
- `availableCompanies` - List of companies user has access to
- `loading` - Loading state
- `switchingCompany` - Company switching state
- `error` - Error messages
- `setCurrentCompany()` - Method to switch companies
- `loadUserCompanies()` - Method to refresh company list

## Styling

Uses Tailwind CSS classes with dark mode support:

- Light theme: White background, gray borders
- Dark theme: Gray-800 background, gray-700 borders
- Hover states: Subtle background changes
- Focus states: Ring outline for accessibility
- Transitions: Smooth animations for state changes

## Testing

The component includes comprehensive unit tests covering:

- Rendering with different states
- User interactions (clicking, selecting)
- Event emissions
- Error handling
- Loading states
- Empty states

Run tests with:
```bash
npm run test:unit -- CompanySelector.test.ts
```

## Performance Considerations

- Uses `computed` properties for reactive data
- Implements click outside with `@vueuse/core` for efficiency
- Lazy loads company details only when needed
- Debounces rapid company switches
- Caches company data in Pinia store

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Supports both touch and mouse interactions
- Graceful degradation for older browsers