# Glossary

Domain-specific terminology used throughout the project.

## A

**Assignee**: User responsible for completing a task

**Attachment**: File uploaded to a task (stored in S3)

**Auth Token**: JWT token used for authentication

## B

**Backlog**: List of tasks not yet assigned to a sprint

**Burndown Chart**: Graph showing remaining work over time

## C

**CDN (Content Delivery Network)**: Distributed network for serving static assets (Vercel Edge)

**Comment**: Text discussion on a task

**Connection Pooling**: Reusing database connections for performance (Prisma)

## D

**Dashboard**: Main view showing projects and tasks

**Dependency**: Task that blocks another task from starting

**Due Date**: Deadline for completing a task

## E

**Edge Function**: Serverless function running at CDN edge (Vercel)

**Epic**: Large feature broken down into multiple tasks

## F

**Full-Text Search**: Search across task titles and descriptions (PostgreSQL tsvector)

## G

**Guest**: Limited-access user role (read-only)

## H

**HTTP-Only Cookie**: Cookie that can't be accessed via JavaScript (security)

## I

**Invite**: Request to join a team

**ISR (Incremental Static Regeneration)**: Next.js feature for updating static pages

## J

**JWT (JSON Web Token)**: Token format for authentication

## L

**Label**: Tag for categorizing tasks (e.g., "bug", "feature")

## M

**Member**: Standard user role with write access

**Mention**: @username notification in comments

**Middleware**: Code that runs before API routes (auth check)

**Migration**: Database schema change (managed by Prisma)

**Milestone**: Major project goal with target date

## N

**Notification**: Alert sent to user (in-app or email)

## O

**OAuth**: Third-party login (Google, GitHub)

**ORM (Object-Relational Mapping)**: Database abstraction layer (Prisma)

**Optimistic Locking**: Prevent concurrent updates using version field

## P

**Pagination**: Splitting large lists into pages (20 items/page default)

**Priority**: Urgency level (low, medium, high, critical)

**Project**: Container for related tasks

## Q

**Query Cache**: Temporary storage of database results (Redis, 5 min TTL)

**Quorum**: Minimum number of approvals needed (code review)

## R

**RBAC (Role-Based Access Control)**: Permission system based on user roles

**Read Replica**: Copy of database for read-only queries (future scaling)

**Redis**: In-memory cache for sessions and frequently accessed data

## S

**Seed Data**: Sample data for development (npm run db:seed)

**Sentry**: Error tracking service

**Server Component**: React component rendered on server (Next.js App Router)

**Soft Delete**: Mark as deleted without removing from database (deletedAt field)

**Sprint**: Time-boxed period for completing tasks (2 weeks default)

**SSR (Server-Side Rendering)**: Generate HTML on server

**Status**: Current state (todo, in-progress, done, blocked)

## T

**Task**: Single unit of work

**Team**: Group of users working together

**TTL (Time To Live)**: Cache expiration time

**tsvector**: PostgreSQL data type for full-text search

## U

**UUID (Universally Unique Identifier)**: 128-bit ID format for all entities

**Uptime**: Percentage of time system is available (99.9% SLA)

## V

**Validation**: Checking input against rules (Zod schemas)

**Vercel**: Hosting platform for Next.js apps

**Virtual Scrolling**: Render only visible items in long lists (performance)

## W

**WebSocket**: Real-time bidirectional communication

**Workflow**: Defined process for completing work (customizable per project)

## Z

**Zod**: TypeScript-first schema validation library

---

## Acronyms Quick Reference

| Acronym | Full Form |
|---------|-----------|
| API     | Application Programming Interface |
| CDN     | Content Delivery Network |
| CI/CD   | Continuous Integration/Continuous Deployment |
| CRUD    | Create, Read, Update, Delete |
| DB      | Database |
| JWT     | JSON Web Token |
| ORM     | Object-Relational Mapping |
| RBAC    | Role-Based Access Control |
| REST    | Representational State Transfer |
| SLA     | Service Level Agreement |
| SSR     | Server-Side Rendering |
| TTL     | Time To Live |
| UI      | User Interface |
| URL     | Uniform Resource Locator |
| UUID    | Universally Unique Identifier |

---

## Common Commands

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm test` | Run test suite |
| `npm run build` | Build for production |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Add sample data |
| `npm run lint` | Check code style |
| `npx prisma studio` | Open database GUI |
