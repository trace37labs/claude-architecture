# Architecture

## System Design

### High-Level Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────┐
│   Vercel    │  ← Next.js App
│   (CDN +    │  ← API Routes
│   Edge Fn)  │  ← SSR
└──────┬──────┘
       │
       ├─────→ PostgreSQL (Railway)
       ├─────→ S3 (AWS)
       ├─────→ Redis (Upstash)
       └─────→ External APIs
```

### Request Flow

1. **Client Request** → Vercel Edge Network
2. **Edge Function** → Authentication check (JWT)
3. **App Router** → Server component render or API route
4. **Database** → Prisma query with connection pooling
5. **Cache** → Redis for session data
6. **Response** → JSON or HTML stream to client

## Data Model

### Core Entities

```typescript
// User
User {
  id: string (UUID)
  email: string (unique)
  name: string
  role: Role (admin | member | guest)
  teams: Team[]
  createdAt: DateTime
}

// Team
Team {
  id: string
  name: string
  slug: string (unique)
  members: User[]
  projects: Project[]
}

// Project
Project {
  id: string
  name: string
  teamId: string
  tasks: Task[]
  status: Status (active | archived)
}

// Task
Task {
  id: string
  title: string
  description: string (markdown)
  projectId: string
  assigneeId?: string
  status: TaskStatus
  priority: Priority
  dueDate?: DateTime
  comments: Comment[]
  attachments: Attachment[]
}
```

### Database Schema

See `prisma/schema.prisma` for full schema.

**Key Design Decisions**:
- UUIDs for all primary keys (URL-safe, distributed-friendly)
- Soft deletes with `deletedAt` timestamp
- Optimistic locking with `version` field
- Indexes on frequently queried fields (email, slug, status)
- Full-text search using PostgreSQL `tsvector`

## Authentication & Authorization

### Authentication Flow

1. User submits credentials
2. NextAuth validates against database
3. JWT token generated with claims:
   ```json
   {
     "userId": "uuid",
     "email": "user@example.com",
     "role": "member",
     "teams": ["team-1", "team-2"]
   }
   ```
4. Token stored in HTTP-only cookie
5. Subsequent requests include token
6. Middleware validates token on each request

### Authorization Strategy

**Role-Based Access Control (RBAC)**:

| Role    | Can Read | Can Write | Can Delete | Can Invite |
|---------|----------|-----------|------------|------------|
| Admin   | All      | All       | All        | Yes        |
| Member  | Team     | Assigned  | Own        | No         |
| Guest   | Assigned | None      | None       | No         |

**Permission Check Example**:
```typescript
function canEditTask(user: User, task: Task): boolean {
  if (user.role === 'admin') return true;
  if (task.assigneeId === user.id) return true;
  return user.teams.some(t => t.id === task.project.teamId);
}
```

## API Design

### REST Conventions

- `GET /api/projects` - List projects (with pagination)
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (soft delete)

### Response Format

**Success**:
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

**Error**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "email": "Must be a valid email"
    }
  }
}
```

## Caching Strategy

### Layers

1. **Browser Cache**: Static assets (1 year)
2. **CDN Cache**: Public pages (1 hour)
3. **Redis Cache**: Session data, user profiles (15 min)
4. **Database Cache**: Prisma query cache (5 min)

### Cache Invalidation

- **On Write**: Invalidate relevant cache keys
- **Time-Based**: TTL expiration
- **Manual**: Admin can force refresh

Example:
```typescript
// After updating project
await redis.del(`project:${projectId}`);
await redis.del(`team:${teamId}:projects`);
```

## Performance Optimizations

### Frontend
- Code splitting with dynamic imports
- Image optimization with Next.js Image
- Lazy loading for below-the-fold content
- Debounced search inputs
- Virtual scrolling for long lists

### Backend
- Connection pooling (Prisma)
- Database indexes on common queries
- Pagination for all list endpoints
- Selective field loading (don't fetch all fields)
- Background jobs for heavy operations (email sending)

### Example Optimization
```typescript
// Before: N+1 query problem
const projects = await db.project.findMany();
for (const project of projects) {
  project.taskCount = await db.task.count({ where: { projectId: project.id } });
}

// After: Single query with aggregation
const projects = await db.project.findMany({
  include: {
    _count: {
      select: { tasks: true }
    }
  }
});
```

## Security Measures

### Input Validation
- Zod schemas for all API inputs
- Sanitize HTML in markdown fields
- Rate limiting (100 req/min per user)

### Data Protection
- HTTPS only (enforced)
- Password hashing with bcrypt (12 rounds)
- Secrets in environment variables
- No sensitive data in logs

### Dependency Security
- Weekly `npm audit` scans
- Dependabot auto-updates for patches
- Manual review for major updates

## Monitoring & Observability

### Logging
- **Application Logs**: Winston (JSON format)
- **Access Logs**: Vercel edge logs
- **Error Tracking**: Sentry

### Metrics
- **Performance**: Vercel Analytics
- **Business**: Custom events → Mixpanel
- **Infrastructure**: Railway metrics

### Alerts
- Error rate >1% → Slack alert
- Response time >500ms → PagerDuty
- Database connections >80% → Email to ops

## Deployment Architecture

### Environments

| Environment | Branch    | Auto-Deploy | Purpose           |
|-------------|-----------|-------------|-------------------|
| Development | feature/* | No          | Local dev         |
| Staging     | main      | Yes         | Testing           |
| Production  | release/* | Manual      | Live users        |

### Deployment Process

1. Push to branch
2. GitHub Actions runs CI
   - Build TypeScript
   - Run linter
   - Run tests
   - Run security scan
3. If main: Auto-deploy to staging
4. If release: Manual approval → production
5. Monitor for 1 hour post-deploy

### Rollback Procedure

If critical issue detected:
```bash
# Revert to previous deployment (Vercel)
vercel rollback
```

Recovery Time Objective (RTO): <5 minutes

## Scaling Considerations

### Current Scale
- Users: ~1,000 active
- Requests: ~10,000 req/hour
- Database: ~100GB data
- Files: ~500GB in S3

### Scaling Strategy
- **0-10K users**: Current setup (single region)
- **10K-100K users**: Add read replicas, CDN expansion
- **100K-1M users**: Multi-region, database sharding, microservices

### Bottlenecks to Watch
- Database connections (current limit: 100)
- Vercel function execution time (max 10s)
- S3 request rate (current: well below limits)
