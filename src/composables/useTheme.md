# useTheme Composable

A comprehensive Vue 3 composable for managing application themes with support for light, dark, and system preferences.

## Features

- **Multiple Theme Support**: Light, dark, and system preference themes
- **Reactive State**: Fully reactive theme state with Vue 3 composition API
- **System Integration**: Automatic detection and response to system theme changes
- **Smooth Transitions**: Built-in support for smooth theme transitions
- **Persistence**: Automatic theme preference persistence in localStorage
- **CSS Integration**: Utilities for managing CSS custom properties
- **Accessibility**: Support for reduced motion and high contrast preferences

## Basic Usage

```vue
<template>
  <div>
    <p>Current theme: {{ currentTheme }}</p>
    <p>Effective theme: {{ effectiveTheme }}</p>
    <p>Is dark mode: {{ isDark }}</p>
    
    <button @click="toggleTheme">
      Toggle Theme
    </button>
    
    <select v-model="selectedTheme" @change="setTheme(selectedTheme)">
      <option v-for="theme in availableThemes" :key="theme" :value="theme">
        {{ getThemeLabel(theme) }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'

const {
  currentTheme,
  effectiveTheme,
  isDark,
  availableThemes,
  setTheme,
  toggleTheme,
  getThemeLabel
} = useTheme()

const selectedTheme = ref(currentTheme.value)
</script>
```

## API Reference

### Reactive State

| Property | Type | Description |
|----------|------|-------------|
| `currentTheme` | `Ref<Theme>` | Currently selected theme ('light', 'dark', 'system') |
| `effectiveTheme` | `Ref<Theme>` | Actual theme being applied (resolves 'system' to 'light' or 'dark') |
| `isDark` | `Ref<boolean>` | Whether dark mode is currently active |
| `isLight` | `Ref<boolean>` | Whether light mode is currently active |
| `availableThemes` | `Theme[]` | Array of available theme options |

### Theme Management Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setTheme` | `theme: Theme` | Set the current theme |
| `toggleTheme` | - | Toggle between light and dark themes |
| `setLightTheme` | - | Set theme to light |
| `setDarkTheme` | - | Set theme to dark |
| `setSystemTheme` | - | Set theme to system preference |
| `applyThemeWithTransition` | `theme: Theme` | Apply theme with smooth transition |

### Utility Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `getThemeLabel` | `theme: Theme` | `string` | Get localized theme label |
| `getThemeIcon` | `theme: Theme` | `string` | Get icon name for theme |
| `getColorScheme` | - | `'light' \| 'dark'` | Get current color scheme |
| `isValidTheme` | `theme: string` | `boolean` | Validate theme string |

### CSS Utilities

| Method | Parameters | Description |
|--------|------------|-------------|
| `setCSSCustomProperty` | `property: string, value: string` | Set CSS custom property |
| `getCSSCustomProperty` | `property: string` | Get CSS custom property value |

### Persistence Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `saveThemePreference` | `theme: Theme` | - | Save theme to localStorage |
| `loadThemePreference` | - | `Theme` | Load theme from localStorage |

## Advanced Usage

### Custom Theme Transitions

```vue
<script setup>
import { useTheme } from '@/composables/useTheme'

const { applyThemeWithTransition, setCSSCustomProperty } = useTheme()

// Apply theme with custom transition duration
const applyCustomTheme = (theme) => {
  setCSSCustomProperty('--theme-transition', 'all 0.5s ease-in-out')
  applyThemeWithTransition(theme)
}
</script>
```

### System Theme Detection

```vue
<script setup>
import { watch } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { currentTheme, effectiveTheme, setupSystemThemeListener } = useTheme()

// Watch for system theme changes
watch(effectiveTheme, (newTheme) => {
  console.log('Effective theme changed to:', newTheme)
})

// Set up system theme listener
onMounted(() => {
  const cleanup = setupSystemThemeListener()
  
  onUnmounted(() => {
    cleanup()
  })
})
</script>
```

### CSS Custom Properties Integration

```vue
<script setup>
import { useTheme } from '@/composables/useTheme'

const { setCSSCustomProperty, getCSSCustomProperty } = useTheme()

// Set custom theme colors
const setCustomColors = () => {
  setCSSCustomProperty('--primary-color', '#3b82f6')
  setCSSCustomProperty('--secondary-color', '#6b7280')
}

// Get current theme colors
const getCurrentColors = () => {
  const primary = getCSSCustomProperty('--primary-color')
  const secondary = getCSSCustomProperty('--secondary-color')
  return { primary, secondary }
}
</script>
```

## Theme Configuration

### CSS Variables

The theme system uses CSS custom properties for consistent theming:

```css
:root {
  --color-primary: #2563eb;
  --color-primary-50: #eff6ff;
  --color-primary-600: #2563eb;
  --color-gray-50: oklch(0.985 0 0);
  --color-gray-900: oklch(0.21 0.006 285.885);
}

.dark {
  --color-gray-50: oklch(0.985 0 0);
  --color-gray-900: oklch(0.21 0.006 285.885);
}
```

### Tailwind CSS Integration

The composable works seamlessly with Tailwind CSS dark mode:

```css
/* Automatic transitions */
*,
*::before,
*::after {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Theme changing prevention */
.theme-changing * {
  transition: none !important;
}
```

## Accessibility Features

### Reduced Motion Support

The composable respects the user's reduced motion preference:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Support

Support for high contrast mode can be added:

```vue
<script setup>
import { useTheme } from '@/composables/useTheme'

const { setCSSCustomProperty } = useTheme()

const enableHighContrast = () => {
  document.documentElement.classList.add('high-contrast')
  setCSSCustomProperty('--contrast-multiplier', '1.5')
}
</script>
```

## TypeScript Support

The composable is fully typed with TypeScript:

```typescript
import type { Theme } from '@/types'

export interface ThemeComposable {
  currentTheme: Ref<Theme>
  effectiveTheme: Ref<Theme>
  isDark: Ref<boolean>
  isLight: Ref<boolean>
  availableThemes: Theme[]
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  // ... other methods
}
```

## Browser Support

- **Modern Browsers**: Full support in Chrome, Firefox, Safari, Edge
- **CSS Custom Properties**: Required for theme variables
- **matchMedia API**: Required for system preference detection
- **localStorage**: Required for theme persistence

## Performance Considerations

- **Reactive Updates**: Uses Vue 3's reactive system for efficient updates
- **CSS Transitions**: Optimized transitions prevent layout thrashing
- **System Listeners**: Properly cleaned up to prevent memory leaks
- **localStorage**: Minimal storage footprint

## Testing

The composable includes comprehensive unit tests:

```bash
npm run test:unit -- useTheme.test.ts
```

Test coverage includes:
- Theme switching functionality
- System preference detection
- Persistence mechanisms
- CSS utilities
- Validation methods

## Migration Guide

### From Vue 2

```javascript
// Vue 2 (old)
export default {
  data() {
    return {
      theme: 'light'
    }
  },
  methods: {
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    }
  }
}

// Vue 3 (new)
import { useTheme } from '@/composables/useTheme'

export default {
  setup() {
    const { currentTheme, toggleTheme } = useTheme()
    
    return {
      theme: currentTheme,
      toggleTheme
    }
  }
}
```

### From Manual Theme Management

```javascript
// Manual (old)
const setTheme = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('theme', theme)
}

// useTheme (new)
const { setTheme } = useTheme()
setTheme('dark') // Handles DOM updates and persistence automatically
```

## Best Practices

1. **Use Reactive State**: Always use the reactive properties instead of direct DOM manipulation
2. **Respect System Preferences**: Default to 'system' theme for better UX
3. **Smooth Transitions**: Use `applyThemeWithTransition` for user-initiated changes
4. **Accessibility**: Consider reduced motion and high contrast preferences
5. **Performance**: Avoid frequent theme changes that could impact performance
6. **Testing**: Test theme changes across different system preferences

## Troubleshooting

### Theme Not Applying

1. Check if CSS custom properties are defined
2. Verify Tailwind CSS dark mode configuration
3. Ensure proper class application to document element

### System Theme Not Detected

1. Verify browser support for `matchMedia`
2. Check if system preference is actually set
3. Ensure event listeners are properly attached

### Persistence Issues

1. Check localStorage availability
2. Verify theme validation logic
3. Ensure proper initialization order