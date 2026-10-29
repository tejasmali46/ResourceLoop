# ResourceLoop Architecture & Technical Design

## 1. System Overview

ResourceLoop is an institutional resource sharing and event permission management platform engineered for universities and collegiate institutions. It bridges the gap between student clubs requesting scarce assets (seminar halls, laser projectors, audio equipment, robotics tools) and the institutional authorities responsible for asset accountability (Faculty Coordinators, Department Heads, and Resource / Lab Managers).

Unlike generic booking software or disconnected forms, ResourceLoop unifies:
1. **Multi-Resource Event Requests** (A single atomic application coordinates venue selection and multiple equipment pool items).
2. **Deterministic Schedule & Overlap Engine** (Prevents double bookings with operating hours checks, setup/cleanup buffers, and maintenance schedules).
3. **Multi-Stage Approval Routing State Machine** (Faculty -> Department HOD -> Resource Manager).
4. **Physical Handover & Condition Auditing** (Check-in/return condition grading with automatic discrepancy and incident creation).
5. **Fair Resource Allocation** (Club-level monthly booking quotas and priority queuing).
6. **ResourceLoop Intelligence** (Natural-language discovery, workflow transparency, and incident summaries with verified rule-based fallbacks).

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons + Recharts             |
|  - Student Club Portal (Dashboard, 7-Step Event Wizard, Return Tracker)           |
|  - Faculty / HOD Portal (Pending Review Queue, Decision Form, Department Audit)    |
|  - Resource Manager Portal (Handover Queue, Initial/Final Condition Reports)      |
|  - Institution Admin Portal (Live Recharts Analytics, Complete Audit Log Viewer)   |
|  - ResourceLoop Intelligence (Global Natural Language Discovery & Planning Modal)  |
+-----------------------------------------------------------------------------------+
                                          |
                                    REST API / JSON
                                          v
+-----------------------------------------------------------------------------------+
|                                 SERVER TIER                                       |
|  Node.js + Express + TypeScript + Zod Validation + Helmet + Rate Limiter           |
|                                                                                   |
|  Controllers:                                                                     |
|    - AuthController, ResourceController, EventController, ApprovalController     |
|    - HandoverController, IncidentController, NotificationController, Analytics    |
|                                                                                   |
|  Services:                                                                        |
|    - SchedulingEngine: Time overlap calculation, buffers, atomic capacity check   |
|    - ApprovalService: State transitions, policy routing, decision records         |
|    - HandoverService: Check-out/in condition grading & discrepancy detection      |
|    - FairAllocationService: Club monthly quotas & priority queue ordering         |
|    - AiIntelligenceService: Natural language discovery, checklists, explanations  |
|    - AuditService & NotificationService: Persistent logs and alerts               |
+-----------------------------------------------------------------------------------+
                                          |
                                    Mongoose ODM
                                          v
+-----------------------------------------------------------------------------------+
|                                DATABASE TIER                                      |
|  MongoDB (Local / Atlas) with Schemas, Compound Indexes, and Persistent Models:   |
|  - Users, Departments, Clubs, Resources, EventRequests, Reservations              |
|  - ApprovalPolicies, ApprovalDecisions, HandoverRecords, Incidents, AuditLogs     |
+-----------------------------------------------------------------------------------+
```

---

## 3. Workflow State Machine

The core `EventRequest` model transitions through strict, authenticated state gates:

```
[ DRAFT ] ───────────> [ SUBMITTED ]
                            │
                            ▼
                    [ UNDER_REVIEW ]
                      │          │
   (Changes Req)      │          │  (Rejection)
          ◄───────────┤          ├──────────────► [ REJECTED ]
                      │          │
      (Faculty Approved)         ▼
                      ├─► [ HOD_REVIEW (If Attendance >= 100) ]
                      │          │
      (Manager Approved)         ▼
                      └─► [ CONFIRMED ]
                            │
                      (Checked Out)
                            ▼
                     [ IN_PROGRESS ]
                            │
                      (All Returned)
                            ▼
                      [ COMPLETED ]
```

---

## 4. Availability & Conflict Prevention Algorithm

For any requested interval `[requestedStart, requestedEnd]` for a given `Resource`:

1. **Operating Hours Verification**:
   The start and end times must reside inside `resource.operatingHours` (e.g. `08:00 - 20:00`).
2. **Maintenance Check**:
   Resource operational status must be `AVAILABLE` and cannot overlap scheduled `maintenancePeriods`.
3. **Time Overlap Query**:
   ```typescript
   query = {
     resource: resourceId,
     status: { $in: ['CONFIRMED', 'CHECKED_OUT'] },
     startDate: { $lt: requestedEnd },
     endDate: { $gt: requestedStart }
   }
   ```
4. **Capacity Logic**:
   - For `POOLED` items (e.g., laser projectors, microphones, PA speakers):
     $$\text{availableQuantity} = \text{totalQuantity} - \sum \text{overlapping reserved quantities}$$
     If $\text{availableQuantity} \ge \text{requestedQuantity}$, booking proceeds.
   - For `INDIVIDUAL` items (seminar hall, 3D printer):
     If any confirmed reservation overlaps, available quantity is 0.
5. **Alternative Slot Search**:
   If a conflict occurs, the engine automatically checks $+2\text{h}$, $+4\text{h}$, and $+24\text{h}$ candidate intervals against real database records and provides verifiable alternative time suggestions.

---

## 5. Security Architecture

- **Server-Side Authorization**: Roles (`STUDENT`, `FACULTY`, `HOD`, `RESOURCE_MANAGER`, `ADMIN`) are enforced at every Express route. Students cannot self-approve requests, access administrative audit logs, or impersonate clubs they are not members of.
- **Password Hashing**: Cryptographic salt generation via `bcryptjs`.
- **Stateless Tokens**: JWTs signed with HMAC SHA-256 with 7-day expiration.
- **Input Validation**: Strict typing, Zod schema validation, and sanitation against SQL/NoSQL injection.
- **Audit Logging**: Every state change, checkout, return, and incident resolution is permanently stamped in `AuditLog` with actor ID, role, action, and JSON payload.
