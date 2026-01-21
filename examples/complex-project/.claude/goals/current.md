# Current Goals

> **Sprint**: 2026-01-21 to 2026-02-04 (2 weeks)

## Sprint Goal

**"Real-time collaboration MVP"**

Enable multiple users to collaborate on tasks with live updates, comments, and notifications.

## Primary Objectives

### 1. WebSocket Integration (High Priority)
**Owner**: Backend Team
**Due**: 2026-01-28

**Tasks**:
- [ ] Set up WebSocket server (Socket.io)
- [ ] Implement connection pooling and reconnection
- [ ] Create event types (task_updated, comment_added, user_joined)
- [ ] Add authentication to WebSocket connections
- [ ] Test with 100 concurrent connections

**Success Criteria**:
- Real-time updates < 100ms latency
- Graceful handling of disconnections
- No memory leaks during 24-hour stress test

---

### 2. Comment System (High Priority)
**Owner**: Full-Stack Team
**Due**: 2026-01-30

**Tasks**:
- [ ] Design comment data model (Prisma schema)
- [ ] Build comment API endpoints (CRUD)
- [ ] Create comment UI component
- [ ] Add @mention support
- [ ] Implement markdown rendering
- [ ] Add email notifications for mentions

**Success Criteria**:
- Comments appear in real-time for all users
- @mentions trigger notifications
- Markdown renders correctly (code blocks, links, bold)
- Mobile-responsive design

---

### 3. Presence Indicators (Medium Priority)
**Owner**: Frontend Team
**Due**: 2026-02-03

**Tasks**:
- [ ] Track active users per task
- [ ] Display avatar stack for viewers
- [ ] Show typing indicators in comments
- [ ] Add "Last seen" timestamps
- [ ] Implement heartbeat ping (30s interval)

**Success Criteria**:
- Users see who's viewing each task
- Typing indicators appear within 200ms
- Presence data syncs correctly on reconnect

---

### 4. Notification System (Medium Priority)
**Owner**: Backend Team
**Due**: 2026-02-04

**Tasks**:
- [ ] Create notification data model
- [ ] Build notification API (list, mark read, clear all)
- [ ] Implement email digests (daily)
- [ ] Add in-app notification bell with count
- [ ] Create user notification preferences

**Success Criteria**:
- Notifications delivered within 1 minute
- Users can customize notification settings
- Email digest contains last 24 hours of activity
- Unread count updates in real-time

## Secondary Objectives

### Performance Optimization
- Reduce bundle size by 20% (code splitting)
- Improve Lighthouse score from 85 to 95
- Optimize database queries (add indexes)

### Developer Experience
- Set up Playwright for E2E tests
- Create Storybook for component library
- Document WebSocket API in OpenAPI spec

## Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Real-time Latency | < 100ms | TBD |
| Comment Submission | < 200ms | TBD |
| Notification Delivery | < 1min | TBD |
| WebSocket Uptime | 99.9% | TBD |
| Concurrent Users | 100+ | 20 |

## Risks & Blockers

### High Risk
- **WebSocket Scaling**: Current Vercel plan may not support 100+ concurrent connections
  - **Mitigation**: Research Vercel limits, consider Redis adapter for horizontal scaling

### Medium Risk
- **Email Rate Limits**: SendGrid free tier is 100 emails/day
  - **Mitigation**: Upgrade plan or batch notifications into digests

### Blockers
- None currently

## Out of Scope (For This Sprint)

- File attachments (deferred to next sprint)
- Reactions/emojis on comments
- Threaded comment replies
- Rich text editor (using markdown for now)
- Voice/video calls

## Definition of Done

A task is considered "done" when:
- [ ] Code is implemented and reviewed
- [ ] Unit tests pass (80%+ coverage)
- [ ] Integration tests pass
- [ ] Manual QA completed
- [ ] Deployed to staging
- [ ] Product owner approves
- [ ] Documentation updated

## Sprint Retrospective (After Sprint)

_To be filled out on 2026-02-04_

**What went well?**
- TBD

**What could improve?**
- TBD

**Action items for next sprint:**
- TBD
