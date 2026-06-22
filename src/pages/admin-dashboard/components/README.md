# Admin Dashboard Components

This directory contains the modular components for the Admin Dashboard Settings tabs.

## Structure

```
components/
├── BillingInvoices.tsx    # Billing & Invoices tab content
├── GeneralSettings.tsx    # General Settings tab content
├── Notifications.tsx      # Notifications tab content
├── Security.tsx           # Security tab content
└── index.ts              # Barrel export file
```

## Components

### BillingInvoices
Displays billing information including:
- Payment reconciliation alerts
- Revenue statistics (Total Revenue, Outstanding Invoices, Failed Payments)
- Recent invoices table with filtering and search

### GeneralSettings
Placeholder for general platform-wide configuration and preferences.

### Notifications
Placeholder for notification preferences configuration.

### Security
Displays security settings including:
- Two-Factor Authentication toggle
- Session Timeout configuration
- Login Notifications toggle
- Password Policy configuration
- Security recommendations

## Usage

Import components from the barrel export:

```tsx
import { BillingInvoices, GeneralSettings, Notifications, Security } from './components'
```

Or import individually:

```tsx
import BillingInvoices from './components/BillingInvoices'
```

## Styling

All components use the existing CSS classes from `AdminDashboard.css`. The class naming convention follows BEM methodology with the `admin-settings__` prefix.