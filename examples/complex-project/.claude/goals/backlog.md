# Backlog

Future work and ideas not yet scheduled for a sprint.

## High Priority (Next Sprint Candidates)

### File Attachments
**Why**: Users want to attach screenshots, documents to tasks
**Effort**: Medium (3-5 days)
**Dependencies**: None

**Acceptance Criteria**:
- Support common formats (PDF, PNG, JPG, DOCX)
- Max 10MB per file
- Store in S3 with secure URLs
- Preview images inline
- Download/delete functionality

---

### Advanced Search
**Why**: Users struggle to find tasks in large projects
**Effort**: Medium (4-6 days)
**Dependencies**: None

**Acceptance Criteria**:
- Full-text search across title, description, comments
- Filter by assignee, status, priority, labels
- Date range filtering
- Save search queries
- Export search results

---

### Mobile App (React Native)
**Why**: Users want to update tasks on the go
**Effort**: Large (2-3 weeks)
**Dependencies**: API stabilization

**Acceptance Criteria**:
- iOS and Android support
- Push notifications
- Offline mode with sync
- Native performance
- 80% feature parity with web

## Medium Priority

### Custom Fields
**Why**: Different teams need different task metadata
**Effort**: Large (2 weeks)
**Dependencies**: None

**Ideas**:
- Add custom fields per project (text, number, date, dropdown)
- Search and filter by custom fields
- Bulk edit custom fields
- Import/export with custom fields

---

### Time Tracking
**Why**: Teams want to track time spent on tasks
**Effort**: Medium (1 week)
**Dependencies**: None

**Features**:
- Start/stop timer per task
- Manual time entry
- Weekly timesheets
- Time reports by user/project
- Billable vs non-billable hours

---

### Integrations
**Why**: Connect with tools teams already use
**Effort**: Variable (1-2 days per integration)

**Integrations to Build**:
- [ ] Slack (notifications, slash commands)
- [ ] GitHub (link PRs to tasks, auto-update status)
- [ ] Figma (embed designs in tasks)
- [ ] Google Calendar (sync due dates)
- [ ] Zapier (connect to 1000+ apps)

---

### Advanced Permissions
**Why**: Need finer-grained access control
**Effort**: Medium (1 week)
**Dependencies**: Current RBAC

**Features**:
- Per-project roles
- Custom permission sets
- Restrict field editing (e.g., only admins can change due dates)
- Audit log of permission changes

## Low Priority (Nice to Have)

### Dark Mode
**Why**: Reduce eye strain for nighttime users
**Effort**: Small (2-3 days)
**Implementation**: CSS variables + localStorage preference

---

### Keyboard Shortcuts
**Why**: Power users want faster navigation
**Effort**: Small (2-3 days)
**Examples**:
- `g + p` → Go to projects
- `g + t` → Go to tasks
- `c` → Create task
- `/` → Search
- `?` → Show shortcuts help

---

### Gantt Chart View
**Why**: Visualize project timeline
**Effort**: Medium (4-5 days)
**Library**: react-gantt-chart or build custom

---

### Export/Import
**Why**: Migrate data, backup, integrate with other tools
**Effort**: Small-Medium (3-4 days)
**Formats**: CSV, JSON, Excel

---

### Multi-Language Support (i18n)
**Why**: Support international teams
**Effort**: Large (2 weeks + ongoing translations)
**Languages**: Start with English, Spanish, French

---

### Recurring Tasks
**Why**: Automate repetitive work
**Effort**: Medium (4-5 days)
**Examples**:
- Daily standup
- Weekly reports
- Monthly reviews

---

### Template Tasks
**Why**: Standardize common workflows
**Effort**: Small (2-3 days)
**Features**:
- Create task templates
- Apply template to create task
- Share templates across projects

## Ideas (Not Yet Defined)

- AI-powered task suggestions
- Voice input for tasks
- Calendar view (monthly/weekly)
- Board view (Kanban)
- Timeline view (roadmap)
- Mind map view
- Bulk task import from Jira/Asana
- Public task board (for open-source projects)
- Subtasks (nested tasks)
- Task dependencies visualization
- Resource allocation / capacity planning
- Budget tracking
- Risk management
- Contract management
- Asset management

## Technical Debt

### High Priority
- [ ] Migrate from Pages Router to App Router (Next.js)
- [ ] Replace `any` types with proper TypeScript types
- [ ] Add database indexes for slow queries
- [ ] Implement proper error boundaries
- [ ] Add E2E test coverage (currently 0%)

### Medium Priority
- [ ] Refactor authentication to use server actions
- [ ] Split large components into smaller pieces
- [ ] Extract business logic from API routes
- [ ] Improve test coverage (currently 60%, target 80%)
- [ ] Update dependencies (some are 6 months old)

### Low Priority
- [ ] Migrate from CSS modules to Tailwind
- [ ] Consolidate utility functions
- [ ] Remove unused dependencies (bundle size)
- [ ] Document all API routes with OpenAPI
- [ ] Set up automated accessibility testing

## Community Requests

> Track user feature requests here

- [ ] Export tasks as PDF (#142)
- [ ] Two-factor authentication (#138)
- [ ] Task templates (#127)
- [ ] Batch task operations (#119)
- [ ] Custom task statuses (#103)

---

**Note**: This backlog is reviewed and prioritized every sprint. Items may be promoted to the current sprint based on business needs and technical dependencies.
