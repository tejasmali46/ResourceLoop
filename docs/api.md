# ResourceLoop REST API Documentation (v1)

All endpoints are versioned under `/api/v1`. Protected endpoints require an `Authorization: Bearer <token>` header.

---

## 1. Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/login`
- **Description**: Authenticate a user and receive JWT.
- **Body**:
  ```json
  { "email": "student.ecell@resourceloop.edu", "password": "Password@123" }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": { "id": "...", "name": "Aarav Patel", "role": "STUDENT" }
  }
  ```

### `POST /api/v1/auth/register`
- **Description**: Register a new student club representative. (Privileged roles cannot be self-registered).
- **Body**: `{ name, email, password, studentOrEmpId, department, clubId }`
- **Response**: `201 Created`

### `GET /api/v1/auth/me`
- **Description**: Get current user profile, club memberships, and unread notifications count.

---

## 2. Resource Catalog (`/api/v1/resources`)

### `GET /api/v1/resources`
- **Query params**: `category`, `department`, `operationalStatus`, `search`, `minCapacity`
- **Response**: List of matching resources with populated department & manager.

### `GET /api/v1/resources/:id`
- **Response**: Single resource detail, active maintenance periods, and upcoming calendar reservations.

### `POST /api/v1/resources/check-availability`
- **Body**: `{ resourceId, startDate, endDate, quantity }`
- **Response**: Real availability calculation, conflict reasons, and suggested alternative slots if unavailable.

### `POST /api/v1/resources`
- **Role required**: `RESOURCE_MANAGER` or `ADMIN`
- **Body**: Resource definition fields.

---

## 3. Event Requests (`/api/v1/events`)

### `POST /api/v1/events`
- **Description**: Flagship Combined Event Request creation.
- **Body**:
  ```json
  {
    "title": "Spring Hackathon 2026",
    "eventType": "HACKATHON",
    "organizingClubId": "...",
    "departmentId": "...",
    "facultyCoordinatorId": "...",
    "venueId": "...",
    "startDate": "2026-11-05T09:00:00Z",
    "endDate": "2026-11-05T18:00:00Z",
    "expectedAttendance": 150,
    "setupMinutes": 60,
    "cleanupMinutes": 60,
    "equipmentRequests": [
      { "resourceId": "...", "quantity": 2 },
      { "resourceId": "...", "quantity": 1 }
    ]
  }
  ```
- **Response**: `201 Created` with unique `requestNumber` (e.g. `REQ-2026-0002`).

### `GET /api/v1/events`
- **Query params**: `status`, `clubId`, `departmentId`, `search`
- **Response**: Role-scoped list of event requests.

### `GET /api/v1/events/:id`
- **Response**: Full event record, linked reservations, approval decisions, and handover receipts.

### `POST /api/v1/events/:id/cancel`
- **Description**: Cancel an event, release reserved capacity, and promote any waitlisted bookings.

---

## 4. Multi-Stage Approvals (`/api/v1/approvals`)

### `GET /api/v1/approvals/pending`
- **Role required**: `FACULTY`, `HOD`, `RESOURCE_MANAGER`, `ADMIN`
- **Response**: Returns requests currently pending review at the caller's authorized stage.

### `POST /api/v1/approvals/decision`
- **Role required**: Authorized reviewer for current stage.
- **Body**:
  ```json
  {
    "eventId": "...",
    "decision": "APPROVED", // "APPROVED" | "REJECTED" | "CHANGES_REQUESTED"
    "reason": "Event objectives and safety protocols approved for 150 attendees."
  }
  ```
- **Response**: Updated event state, next stage routing, and notification dispatch.

---

## 5. Handover & Condition Reporting (`/api/v1/handover`)

### `GET /api/v1/handover/queue`
- **Role required**: `RESOURCE_MANAGER`, `ADMIN`
- **Response**: `{ readyForCheckout: [...], activeCheckedOut: [...] }`

### `POST /api/v1/handover/checkout`
- **Body**: `{ eventId, reservationId, resourceId, initialCondition, initialNotes, initialAccessoriesConfirmed }`
- **Response**: `201 Created` HandoverRecord in status `CHECKED_OUT`.

### `POST /api/v1/handover/return`
- **Body**: `{ handoverId, finalCondition, finalNotes, finalAccessoriesConfirmed, reportedDiscrepancy }`
- **Response**: `200 OK`. If condition degraded or accessories missing, auto-flags discrepancy and creates an Incident!

---

## 6. Incident Management (`/api/v1/incidents`)

### `GET /api/v1/incidents`
- **Response**: List of incidents with reporter, resource, event, and resolution details.

### `POST /api/v1/incidents`
- **Body**: `{ category, description, eventId, resourceId, evidence }`
- **Response**: `201 Created` with unique `incidentNumber`.

### `PUT /api/v1/incidents/:id`
- **Role required**: `RESOURCE_MANAGER`, `HOD`, `ADMIN`
- **Body**: `{ status: "RESOLVED", findings, resolution }`
- **Response**: `200 OK` with updated incident.

---

## 7. ResourceLoop Intelligence (`/api/v1/assistant`)

### `POST /api/v1/assistant/query`
- **Body**: `{ query: "Find a seminar hall for 150 people and 2 projectors next week" }`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "provider": "RULE_BASED",
      "summary": "Found 3 verified available resources matching your event requirements...",
      "matchedResources": [...],
      "checklistSuggestions": [...]
    }
  }
  ```

---

## 8. Analytics & Audit (`/api/v1/analytics`, `/api/v1/audit`)

### `GET /api/v1/analytics/institution`
- **Role required**: `ADMIN`, `HOD`, `RESOURCE_MANAGER`
- **Response**: Real calculated counts, category inventory, events by status, and departmental demand.

### `GET /api/v1/audit`
- **Role required**: `ADMIN`, `HOD`
- **Response**: Paginated institutional audit events.
