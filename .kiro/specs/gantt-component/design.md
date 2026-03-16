# Design Document – Gantt Component

## Overview

The Gantt component is implemented as a custom WeWeb element that renders an interactive Gantt chart. It receives user and activity data through bindable properties and renders a timeline with colored bars for status and duration.

## Architecture

### Component Structure

The component follows the standard WeWeb layout:
- `src/wwElement.vue`: Main Vue component
- `ww-config.js`: Property and metadata configuration

### Data Flow

```
Bound data (users + activities) → Processing → Gantt rendering
```

1. **Input**: Data from `users` and `activities` tables via binding
2. **Processing**: Group by user, compute positions and colors
3. **Output**: Rendered Gantt with bars and labels

## Components and Interfaces

### Component Properties (ww-config.js)

```javascript
{
  atividades: {
    type: "Array",
    bindable: true,
    defaultValue: []
  },
  usuarios: {
    type: "Array", 
    bindable: true,
    defaultValue: []
  },
  altura: {
    type: "Length",
    defaultValue: "400px"
  },
  corPendente: {
    type: "Color",
    defaultValue: "#9CA3AF"
  },
  corEmDesenvolvimento: {
    type: "Color", 
    defaultValue: "#3B82F6"
  },
  corEmValidacao: {
    type: "Color",
    defaultValue: "#F59E0B"
  },
  corFinalizada: {
    type: "Color",
    defaultValue: "#10B981"
  }
}
```

### Vue Template Structure

```vue
<template>
  <div class="gantt-container">
    <div class="gantt-header">
      <div class="users-column">Users</div>
      <div class="timeline-header">
        <!-- Time scale -->
      </div>
    </div>
    <div class="gantt-body">
      <div class="gantt-row" v-for="usuario in processedUsers">
        <div class="user-label">{{ usuario.nome }}</div>
        <div class="timeline-row">
          <div class="activity-bar" v-for="atividade in usuario.atividades">
            <!-- Activity bar -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

### Main Computed Properties

1. **processedUsers**: Groups activities by responsible user
2. **timelineRange**: Total period (min/max dates)
3. **timeScale**: Time scale (days/weeks)
4. **activityPositions**: Bar positions on the timeline

## Data Models

### Expected Structure – Users
```javascript
{
  id: "uuid",
  nome: "string",
  email: "string", 
  role: "string",
  ativo: boolean
}
```

### Expected Structure – Activities
```javascript
{
  id: "number",
  nome: "string",
  descricao: "string",
  assigned_to: "uuid", // FK to users
  data_inicio: "timestamp",
  data_previsao_termino: "timestamp", 
  data_real_termino: "timestamp",
  status: "Pending|In progress|In validation|Completed"
}
```

### Internal Processed Model
```javascript
{
  usuario: {
    id: "uuid",
    nome: "string",
    atividades: [
      {
        id: "number",
        nome: "string", 
        startDate: Date,
        endDate: Date,
        status: "string",
        position: { left: "px", width: "px" },
        color: "hex"
      }
    ]
  }
}
```

## Error Handling

### Invalid Data
- **Activities without dates**: Shown as a point at the start of the timeline
- **User not found**: Group under "Unassigned"
- **Invalid dates**: Skip activity and log a warning

### Loading States
- **Empty data**: Show "No activities found"
- **Loading**: Show skeleton/placeholder

### Validation
- Ensure `data_inicio <= data_previsao_termino`
- Validate date format before processing
- Ensure status is one of the allowed values

## Testing Strategy

### Unit Tests
1. **Data processing**: Correct grouping by user
2. **Position calculation**: Correct bar placement
3. **Color mapping**: Correct color per status
4. **Edge cases**: Invalid, empty, or missing data

### Integration Tests
1. **Data binding**: Data received correctly
2. **Rendering**: Expected DOM structure
3. **Responsiveness**: Different screen sizes

### Main Test Cases
- Activities with all dates set
- Activities without dates (pending)
- Multiple users with multiple activities
- User with no assigned activities
- Activities with no assigned user
- Timeline with different periods (days, weeks, months)

## Performance

### Optimizations
- **Virtual scrolling**: For many users/activities
- **Memoization**: Cache position calculations
- **Lazy rendering**: Only visible items

### Limits
- Recommended max: 100 users, 1000 activities
- Max timeline: 2 years for good performance

## Accessibility

- ARIA labels for activity bars
- Keyboard navigation
- Sufficient color contrast
- Alt text for visual elements
