# Gantt Chart Component for WeWeb

An interactive, full-featured Gantt chart component built for WeWeb applications. It provides a clear view of project timelines with full data binding and many customization options.

## Features

### 📊 Core Features
- **Interactive timeline**: Tasks shown as horizontal bars on a timeline
- **Multiple time scales**: Day, week, and month views
- **Progress display**: Progress bars inside task bars
- **User assignments**: Assigned users with avatars and names
- **Current date marker**: Highlights today on the timeline

### 🔗 WeWeb Integration
- **Full data binding**: Bind tasks and users from any WeWeb data source
- **Responsive props**: All visual options work with WeWeb’s responsive system
- **Actions**: Configurable click actions for WeWeb workflows
- **Property panel**: Full configuration via WeWeb’s property panel

### 🎨 Customization
- **Colors**: Different colors for task states and UI elements
- **Typography**: Configurable font sizes for tasks and headers
- **Layout**: Configurable panel widths and row heights
- **Accessibility**: High contrast and keyboard navigation

### ⚡ Performance
- **Virtual scrolling**: Handles large lists (100+ tasks)
- **Efficient updates**: Incremental updates when data changes
- **Memory**: Cleanup and basic performance handling
- **Responsive**: Works on mobile with adaptive layout

### 🛡️ Error Handling
- **Validation**: Checks data and shows clear errors
- **Fallbacks**: Recovery and fallback states
- **Warnings**: Validation warnings in development
- **Loading**: Loading states and progress indicators

## Installation

1. Add the component files to your WeWeb project:
   - `src/wwElement.vue` – main component
   - `ww-config.js` – WeWeb configuration

2. The component will show up in your WeWeb component library.

## Configuration

### Required Data Structure

#### Tasks Data
```javascript
[
  {
    id: 1,                          // Unique identifier
    name: "Task Name",              // Display name (required)
    startDate: "2024-01-01",        // Start date (required)
    endDate: "2024-01-05",          // End date (required)
    assignedUser: 1,                // User ID reference
    progress: 50,                   // Progress percentage (0-100)
    status: "in-progress",          // Task status
    color: "#3B82F6",               // Custom color (optional)
    description: "Task details"     // Additional information
  }
]
```

#### Users Data
```javascript
[
  {
    id: 1,                          // Unique identifier
    name: "John Doe",               // Display name (required)
    avatar: "https://...",          // Avatar image URL
    color: "#3B82F6",               // Associated color
    role: "Developer"               // User role/title
  }
]
```

### Property Configuration

#### Data Properties
- **Tasks Data**: Bindable array of task objects
- **Users Data**: Bindable array of user objects

#### Timeline Settings
- **Start Date**: Timeline start (auto-calculated if not set)
- **End Date**: Timeline end (auto-calculated if not set)
- **Time Scale**: Day, week, or month
- **Show Weekends**: Include weekends on the timeline

#### Appearance
- **Chart Height**: Component height
- **Task Colors**: Colors per task state
- **Grid Color**: Timeline grid color
- **Background Color**: Component background
- **Text Color**: Default text color

#### Advanced Styling
- **Task Font Size**: Font size for task labels
- **Header Font Size**: Font size for timeline headers
- **Task Row Height**: Height of each task row
- **Left Panel Width**: Width of the task list panel

#### Interaction
- **Enable Tooltips**: Show tooltips on hover
- **Enable Task Click**: Allow task clicks
- **Task Click Action**: WeWeb action on task click
- **Keyboard Navigation**: Keyboard shortcuts

#### Accessibility
- **High Contrast Mode**: Higher contrast option
- **Reduced Motion**: Respects user motion preferences

## Usage Examples

### Basic Setup
1. Add the Gantt Chart component to your page.
2. Bind your tasks to the "Tasks Data" property.
3. Bind your users to the "Users Data" property.
4. Set appearance and interaction options.

### With WeWeb Collections
```javascript
// Bind to a WeWeb collection
tasksData: {{ collections.tasks }}
usersData: {{ collections.users }}
```

### Custom Styling
```javascript
// Custom color scheme
taskBarColor: "#2563EB"
completedTaskColor: "#059669"
gridColor: "#E5E7EB"
backgroundColor: "#FFFFFF"
```

### Interactive Features
```javascript
// Enable interactions
enableTooltips: true
enableTaskClick: true
taskClickAction: "navigate-to-task-detail"
```

## Task Status Values

Supported task status values:
- `not-started`: Gray – not started
- `in-progress`: Blue (default) – active
- `completed`: Green – finished
- `on-hold`: Orange – paused

## Performance

### Large Datasets
- Virtual scrolling turns on for 50+ tasks.
- Consider pagination for 200+ tasks.
- Prefer incremental loading when possible.

### Tips
- Use stable task IDs for efficient updates.
- Use consistent date formats.
- Avoid unnecessary property changes.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Accessibility

- **Screen readers**: ARIA labels and descriptions
- **Keyboard**: Arrow keys for timeline navigation
- **High contrast**: Optional higher contrast
- **Focus**: Clear focus indicators
- **Reduced motion**: Respects user preferences

## Troubleshooting

### Common Issues

**Chart not showing**
- Ensure tasks data is a valid array.
- Check that name, startDate, and endDate are present.
- Use a supported date format.

**Performance**
- Use virtual scrolling for large lists.
- Check for circular references in task data.
- Prefer incremental updates.

**Styling**
- Check responsive property settings.
- Use valid hex color values.
- Give the container enough height.

### Error Messages

The component shows clear messages for:
- Invalid data structure
- Missing required fields
- Invalid date formats
- Performance-related warnings

## Development

### Local Development
1. Clone the repo.
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

### Building
```bash
npm run build
```

### Testing
```bash
npm run test
```

## License

This component is for use with WeWeb. See your WeWeb license for terms.

## Support

- WeWeb documentation
- This README for common solutions
- WeWeb support for platform issues

## Changelog

### Version 1.0.0
- Initial release
- Full Gantt chart behavior
- WeWeb integration
- Virtual scrolling
- Error handling
- Accessibility features
