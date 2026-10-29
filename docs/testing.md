# ResourceLoop Automated Testing Guide

ResourceLoop includes a comprehensive automated test suite powered by Vitest and Supertest that validates backend routes, role authorization, multi-resource reservation logic, condition reporting, edge cases, and the AI assistant.

---

## 1. Running the Automated Test Suite

From the project root:
```bash
npm run test:server
```

Or from the `server` directory:
```bash
cd server
npm test
```

---

## 2. Verified Test Coverage Matrix

The 20 automated tests cover the following mission-critical workflows:

| # | Test Description | Expected Behavior | Status |
|---|------------------|-------------------|--------|
| 1 | Health Check (`GET /health`) | Returns 200 OK with `status: "UP"` | ✅ PASSED |
| 2 | Invalid Login (`POST /api/v1/auth/login`) | Returns 401 Unauthorized | ✅ PASSED |
| 3 | Authenticated User (`GET /api/v1/auth/me`) | Returns user profile and role | ✅ PASSED |
| 4 | Unauthorized Route Access | Student calling Admin route receives 403 Forbidden | ✅ PASSED |
| 5 | Resource Catalog Listing | Returns populated resources with categories | ✅ PASSED |
| 6 | Availability Capacity Engine | Accurately calculates real available inventory | ✅ PASSED |
| 7 | Combined Event Request Creation | Persists EventRequest and linked reservations atomically | ✅ PASSED |
| 8 | Self-Approval Prevention | Student attempting to approve their own request blocked with 403 | ✅ PASSED |
| 9 | Faculty Review Decision | Assigned Faculty Coordinator approves stage; routes to next | ✅ PASSED |
| 10 | Resource Manager Confirmation | Final approval triggers atomic capacity lock to `CONFIRMED` | ✅ PASSED |
| 11 | Physical Checkout Handover | Inspects initial condition grade and creates `HandoverRecord` | ✅ PASSED |
| 12 | Return with Condition Discrepancy | Damaged return auto-flags discrepancy and creates an `Incident` | ✅ PASSED |
| 13 | ResourceLoop Intelligence Discovery | Natural language query returns real data without paid API keys | ✅ PASSED |
| 14 | Notification Persistence & Reads | Notifications persist and can be marked as read | ✅ PASSED |
| 15 | Institutional Analytics Calculation | Calculates real aggregations from MongoDB records | ✅ PASSED |
| 16 | End Time Before Start Time | Validates timing order; returns 400 Bad Request | ✅ PASSED |
| 17 | Duplicate Email Registration | Rejects duplicate email with 409 Conflict | ✅ PASSED |
| 18 | Past Date Event Booking | Rejects past-date submissions with 400 Bad Request | ✅ PASSED |
| 19 | AI Workflow State Explanation | Explains pending reviewer and next actions for `REQ-2026-XXXX` | ✅ PASSED |
| 20 | Incident Investigation & Resolution | Records reviewer findings and marks status `RESOLVED` | ✅ PASSED |

---

## 3. Test Idempotency & Cleanliness

The test suite runs against the local or test MongoDB instance. It automatically isolates test records and cleans up transient state so the test suite can be run repeatedly without interference.
