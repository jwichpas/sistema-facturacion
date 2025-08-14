# UI Components

This directory contains reusable UI components for the ERP system, focusing on data display and dashboard functionality.

## Components

### DataTable

Advanced data table component built with TanStack Table, providing comprehensive data management capabilities.

**Features:**
- Sorting, filtering, and pagination
- Column visibility controls and resizing
- Row selection and bulk actions
- Global search functionality
- Responsive design with mobile support
- Dark mode compatibility

**Usage:**
```vue
<template>
  <DataTable
    :columns="columns"
    :data="data"
    :enable-row-selection="true"
    :enable-column-visibility="true"
    :enable-column-resizing="true"
    :enable-global-filter="true"
    @selection-change="onSelectionChange"
    @row-click="onRowClick"
  >
    <template #bulk-actions="{ selectedRows, clearSelection }">
      <BaseButton @click="bulkDelete(selectedRows)">
        Delete Selected
      </BaseButton>
    </template>
  </DataTable>
</template>
```

### KpiCard

Key Performance Indicator card component with trend indicators and customizable icons.

**Features:**
- Displays title, value, and trend information
- Automatic trend indicator with color coding
- Customizable icon slot
- Subtitle support
- Dark mode compatibility

**Usage:**
```vue
<template>
  <KpiCard
    title="Total Revenue"
    :value="formatCurrency(revenue)"
    :delta="revenueGrowth"
    subtitle="vs last month"
  >
    <template #icon>
      <DollarSign class="w-5 h-5" />
    </template>
  </KpiCard>
</template>
```

### ChartWidget

Chart widget component using ApexCharts for data visualization.

**Features:**
- Multiple chart types (line, bar, area, donut, pie, etc.)
- Customizable height and styling
- Action slot for additional controls
- Dark mode compatibility
- Responsive design

**Usage:**
```vue
<template>
  <ChartWidget
    title="Sales Trend"
    subtitle="Monthly performance"
    type="line"
    :height="300"
    :options="chartOptions"
    :series="chartSeries"
  >
    <template #actions>
      <BaseButton @click="exportData">Export</BaseButton>
    </template>
  </ChartWidget>
</template>
```

### ActivityFeed

Activity feed component for displaying recent actions and events.

**Features:**
- Displays activity items with timestamps
- Avatar generation from names/titles
- Meta information support
- Action slot for additional controls
- Dark mode compatibility

**Usage:**
```vue
<template>
  <ActivityFeed
    title="Recent Activity"
    :items="activityItems"
  >
    <template #actions>
      <BaseButton @click="viewAll">View All</BaseButton>
    </template>
  </ActivityFeed>
</template>
```

### TrendIndicator

Standalone trend indicator component for showing value changes.

**Features:**
- Automatic trend direction detection
- Multiple format options (percentage, currency, number)
- Color-coded indicators
- Icon display control
- Label support

**Usage:**
```vue
<template>
  <TrendIndicator
    :value="15.5"
    format="percentage"
    label="vs last month"
  />
</template>
```

## Data Types

### FeedItem Interface

```typescript
interface FeedItem {
  title: string
  description?: string
  time: string
  meta?: string
  actor?: string
}
```

### Column Definition

For DataTable component, use TanStack Table column definitions:

```typescript
import type { ColumnDef } from '@tanstack/vue-table'

const columns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 200,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
  },
]
```

## Examples

See the following example files for comprehensive usage:
- `DataTableExample.vue` - Complete DataTable implementation examples
- `DashboardExample.vue` - Full dashboard layout with all components

## Testing

All components include comprehensive test suites:
- Unit tests for component rendering and props
- Event emission testing
- Accessibility and responsive behavior
- Dark mode compatibility

Run tests with:
```bash
npm run test:unit -- src/components/ui/__tests__/
```

## Styling

Components use Tailwind CSS with:
- Dark mode support via `dark:` prefixes
- Responsive design with breakpoint prefixes
- Consistent color palette and spacing
- Accessibility-focused design patterns

## Dependencies

- `@tanstack/vue-table` - Advanced table functionality
- `vue3-apexcharts` - Chart rendering
- `lucide-vue-next` - Icon components
- `tailwindcss` - Styling framework