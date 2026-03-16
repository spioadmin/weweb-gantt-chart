# Requirements Document – Gantt Component

## Introduction

This document defines the requirements for a custom Gantt component for WeWeb that shows project activities on a timeline, including responsible users, start and end dates, and activity status. The component can be bound to `users` and `activities` table data.

## Requirements

### Requirement 1

**User story:** As a project manager, I want to see all activities on a Gantt chart so I can track progress and schedule.

#### Acceptance criteria

1. WHEN the component loads THEN the system MUST show a Gantt chart with all activities
2. WHEN an activity has data_inicio and data_previsao_termino THEN the system MUST show a bar for that period
3. WHEN an activity has no dates THEN the system MUST show a distinct visual indicator
4. WHEN the user views the Gantt THEN the system MUST show the activity name on each bar

### Requirement 2

**User story:** As a system user, I want to see each activity’s status on the Gantt so I can quickly see the current state of tasks.

#### Acceptance criteria

1. WHEN an activity has status "Pending" THEN the system MUST show the bar in gray
2. WHEN an activity is "In progress" THEN the system MUST show the bar in blue
3. WHEN an activity is "In validation" THEN the system MUST show the bar in yellow
4. WHEN an activity is "Completed" THEN the system MUST show the bar in green

### Requirement 3

**User story:** As a project manager, I want to see who is responsible for each activity so I can see how work is distributed.

#### Acceptance criteria

1. WHEN the component shows an activity THEN the system MUST show the responsible user name (assigned_to)
2. WHEN an activity has no assigned user THEN the system MUST show "Unassigned"
3. WHEN the user views the Gantt THEN the system MUST group activities by responsible user

### Requirement 4

**User story:** As a WeWeb developer, I want the component to be bindable to database data so I can easily connect it to users and activities tables.

#### Acceptance criteria

1. WHEN the component is configured THEN the system MUST allow binding the "atividades" property to the activities table
2. WHEN the component is configured THEN the system MUST allow binding the "usuarios" property to the users table
3. WHEN data is updated THEN the system MUST update the Gantt view automatically

### Requirement 5

**User story:** As an end user, I want to move along the Gantt timeline so I can view different periods of the project.

#### Acceptance criteria

1. WHEN the Gantt is shown THEN the system MUST show a time scale (days/weeks/months)
2. WHEN there are many activities THEN the system MUST allow horizontal scroll along the timeline
3. WHEN there are many users THEN the system MUST allow vertical scroll to see all users
