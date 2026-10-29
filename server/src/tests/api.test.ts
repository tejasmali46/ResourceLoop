import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';
import { EventRequest } from '../models/EventRequest.js';
import { Club } from '../models/Club.js';

const app = createApp();

describe('ResourceLoop Backend API Tests', () => {
  let studentToken = '';
  let facultyToken = '';
  let hodToken = '';
  let managerToken = '';
  let adminToken = '';
  let seminarHallId = '';
  let projectorPoolId = '';
  let ecellClubId = '';
  let cseDeptId = '';
  let facultyId = '';

  beforeAll(async () => {
    await connectDB();

    // Clean up any previous test events to ensure idempotency
    const testTitles = [
      'Spring Startup Bootcamp 2026',
      'E-Cell Flagship Hackathon 2026',
      'Unauthorized Party',
      'Initial Coding Camp',
      'Revised Coding Camp (with Syllabus)',
    ];
    for (const title of testTitles) {
      const existing = await EventRequest.findOne({ title });
      if (existing) {
        await import('../models/Reservation.js').then((m) => m.Reservation.deleteMany({ event: existing._id }));
        await import('../models/HandoverRecord.js').then((m) => m.HandoverRecord.deleteMany({ event: existing._id }));
        await import('../models/ApprovalTask.js').then((m) => m.ApprovalTask.deleteMany({ request: existing._id }));
        await import('../models/ApprovalDecision.js').then((m) => m.ApprovalDecision.deleteMany({ event: existing._id }));
        await EventRequest.deleteOne({ _id: existing._id });
      }
    }

    // Login student
    const studentRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.ecell@resourceloop.edu', password: 'Password@123' });
    studentToken = studentRes.body.token;

    // Login faculty
    const facultyRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'faculty.ecell@resourceloop.edu', password: 'Password@123' });
    facultyToken = facultyRes.body.token;
    facultyId = facultyRes.body.user.id;

    // Login HOD
    const hodRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hod.cse@resourceloop.edu', password: 'Password@123' });
    hodToken = hodRes.body.token;

    // Login manager
    const managerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager.av@resourceloop.edu', password: 'Password@123' });
    managerToken = managerRes.body.token;

    // Login admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@resourceloop.edu', password: 'Password@123' });
    adminToken = adminRes.body.token;

    // Retrieve test entities
    const hall = await Resource.findOne({ code: 'SEM-HALL-101' });
    seminarHallId = hall!._id.toString();

    const proj = await Resource.findOne({ code: 'PROJ-POOL' });
    projectorPoolId = proj!._id.toString();

    const club = await Club.findOne({ code: 'E-CELL' });
    ecellClubId = club!._id.toString();
    cseDeptId = club!.department!.toString();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('1. GET /health should return status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('ResourceLoop Core API');
  });

  it('2. POST /api/v1/auth/login with wrong password should return 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.ecell@resourceloop.edu', password: 'WrongPassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('3. GET /api/v1/auth/me should return authenticated user details', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('student.ecell@resourceloop.edu');
    expect(res.body.user.role).toBe('STUDENT');
  });

  it('4. Student attempting to access Admin route should receive 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('5. GET /api/v1/resources should list available resources', async () => {
    const res = await request(app).get('/api/v1/resources');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resources.length).toBeGreaterThan(0);
  });

  it('6. POST /api/v1/resources/check-availability should accurately check capacity', async () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);
    const nextWeekEnd = new Date(nextWeek);
    nextWeekEnd.setHours(12, 0, 0, 0);

    const res = await request(app)
      .post('/api/v1/resources/check-availability')
      .send({
        resourceId: seminarHallId,
        startDate: nextWeek.toISOString(),
        endDate: nextWeekEnd.toISOString(),
        quantity: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAvailable).toBe(true);
  });

  it('7. POST /api/v1/events should allow student to submit multi-resource request', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    targetDate.setHours(10, 0, 0, 0);
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(14, 0, 0, 0);

    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Spring Startup Bootcamp 2026',
        description: 'Hands-on ideation and pitching sessions for young innovators.',
        eventType: 'WORKSHOP',
        organizingClubId: ecellClubId,
        departmentId: cseDeptId,
        facultyCoordinatorId: facultyId,
        venueId: seminarHallId,
        startDate: targetDate.toISOString(),
        endDate: targetDateEnd.toISOString(),
        expectedAttendance: 60,
        equipmentRequests: [
          { resourceId: projectorPoolId, quantity: 1 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.requestNumber).toMatch(/^REQ-2026-\d+/);
    expect(res.body.event.status).toBe('UNDER_REVIEW');
    expect(res.body.event.currentApprovalStage).toBe('FACULTY_REVIEW');
  });

  it('8. Student cannot approve their own event request', async () => {
    // Find event created by student
    const event = await EventRequest.findOne({ title: 'Spring Startup Bootcamp 2026' });

    const res = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        eventId: event!._id.toString(),
        decision: 'APPROVED',
        reason: 'Self approval attempt',
      });

    expect(res.status).toBe(403); // Role restriction blocks student from approvals
  });

  it('9. Faculty coordinator can approve review stage', async () => {
    const event = await EventRequest.findOne({ title: 'Spring Startup Bootcamp 2026' });

    const res = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        eventId: event!._id.toString(),
        decision: 'APPROVED',
        reason: 'Syllabus and agenda reviewed. Approved for 60 participants.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Since attendance < 100 and hall does not require HOD, next stage is RESOURCE_MANAGER_REVIEW
    expect(res.body.event.currentApprovalStage).toBe('RESOURCE_MANAGER_REVIEW');
  });

  it('10. Resource Manager can complete final approval to CONFIRMED', async () => {
    const event = await EventRequest.findOne({ title: 'Spring Startup Bootcamp 2026' });

    const res = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        eventId: event!._id.toString(),
        decision: 'APPROVED',
        reason: 'Equipment operational check passed. Allocation confirmed.',
      });

    expect(res.status).toBe(200);
    expect(res.body.event.status).toBe('CONFIRMED');
  });

  it('11. Resource Manager can checkout equipment and record initial condition', async () => {
    const event = await EventRequest.findOne({ title: 'Spring Startup Bootcamp 2026' });

    const res = await request(app)
      .post('/api/v1/handover/checkout')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        eventId: event!._id.toString(),
        resourceId: projectorPoolId,
        initialCondition: 'EXCELLENT',
        initialNotes: 'Lens clean, power cord and HDMI cable present.',
        initialAccessoriesConfirmed: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.handover.status).toBe('CHECKED_OUT');
  });

  it('12. Resource return with damage triggers Incident creation', async () => {
    const event = await EventRequest.findOne({ title: 'Spring Startup Bootcamp 2026' });
    const handovers = await request(app)
      .get(`/api/v1/handover/history?eventId=${event!._id}`)
      .set('Authorization', `Bearer ${managerToken}`);

    const handoverId = handovers.body.handovers[0]._id;

    const res = await request(app)
      .post('/api/v1/handover/return')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        handoverId,
        finalCondition: 'DAMAGED',
        finalNotes: 'Cracked outer casing on projector body reported.',
        finalAccessoriesConfirmed: true,
        reportedDiscrepancy: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.handover.discrepancyFlagged).toBe(true);
    expect(res.body.handover.status).toBe('DISCREPANCY_FLAGGED');
  });

  it('13. ResourceLoop Intelligence assistant answers natural language query with real database data', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        query: 'I need a seminar hall for 100 people and a projector for a hackathon next week',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.matchedResources.length).toBeGreaterThan(0);
    expect(res.body.data.checklistSuggestions.length).toBeGreaterThan(0);
    expect(res.body.data.provider).toBe('RULE_BASED');
  });

  it('14. Notifications persist and can be marked as read', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBeGreaterThan(0);

    const markAll = await request(app)
      .put('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(markAll.status).toBe(200);
  });

  it('15. GET /api/v1/analytics/institution returns calculated metrics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/institution')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalResources).toBeGreaterThan(0);
    expect(res.body.data.totalEvents).toBeGreaterThan(0);
    expect(res.body.data.categoryCounts.length).toBeGreaterThan(0);
  });

  it('16. End time before start time should return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/v1/resources/check-availability')
      .send({
        resourceId: seminarHallId,
        startDate: '2026-11-10T14:00:00.000Z',
        endDate: '2026-11-10T10:00:00.000Z', // invalid: end before start
        quantity: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/End time must be after start time/i);
  });

  it('17. Duplicate email registration should return 409 conflict', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate Student',
        email: 'student.ecell@resourceloop.edu', // already registered
        password: 'Password@123',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('18. Event creation with past date should return 400', async () => {
    const pastStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pastEnd = new Date(Date.now() - 20 * 60 * 60 * 1000);

    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Past Event Attempt',
        eventType: 'WORKSHOP',
        organizingClubId: ecellClubId,
        departmentId: cseDeptId,
        facultyCoordinatorId: facultyId,
        startDate: pastStart.toISOString(),
        endDate: pastEnd.toISOString(),
        expectedAttendance: 30,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Event date cannot be in the past/i);
  });

  it('19. AI Assistant workflow explanation accurately explains pending request state', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        query: 'Why is my request REQ-2026-0001 pending?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.workflowExplanation).toBeDefined();
    expect(res.body.data.workflowExplanation.status).toBeDefined();
  });

  it('20. Incident resolution records findings and updates status to RESOLVED', async () => {
    const incidents = await request(app)
      .get('/api/v1/incidents')
      .set('Authorization', `Bearer ${adminToken}`);

    const incidentId = incidents.body.incidents[0]._id;

    const res = await request(app)
      .put(`/api/v1/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'RESOLVED',
        findings: 'Technical inspection determined connector was repairable.',
        resolution: 'Connector resoldered and stress tested. Resource returned to active pool.',
      });

    expect(res.status).toBe(200);
    expect(res.body.incident.status).toBe('RESOLVED');
    expect(res.body.incident.resolvedAt).toBeDefined();
  });

  // SECTION 12 REGRESSION TESTS
  let testWorkflowEventId = '';

  it('21. Test A: Student request reaches faculty with persistent ApprovalTask & notification', async () => {
    // Login HOD
    const hodRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hod.cse@resourceloop.edu', password: 'Password@123' });
    hodToken = hodRes.body.token;

    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 20);
    eventDate.setHours(10, 0, 0, 0);
    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(16, 0, 0, 0);

    // 1. Submit valid event request (150 attendance -> requires HOD)
    const submitRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'E-Cell Flagship Hackathon 2026',
        description: '36-hour student hackathon with keynote and prototyping.',
        eventType: 'HACKATHON',
        organizingClubId: ecellClubId,
        departmentId: cseDeptId,
        facultyCoordinatorId: facultyId,
        venueId: seminarHallId,
        startDate: eventDate.toISOString(),
        endDate: eventEndDate.toISOString(),
        expectedAttendance: 150,
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.success).toBe(true);
    testWorkflowEventId = submitRes.body.event._id;

    // 2. Verify ApprovalTask exists for assigned faculty
    const { ApprovalTask } = await import('../models/ApprovalTask.js');
    const task = await ApprovalTask.findOne({
      request: testWorkflowEventId,
      stage: 'FACULTY_REVIEW',
      status: 'ACTIONABLE',
    });
    expect(task).toBeDefined();
    expect(task!.assignedReviewer!.toString()).toBe(facultyId);

    // 3. Verify notification exists for faculty
    const { Notification } = await import('../models/Notification.js');
    const notif = await Notification.findOne({
      recipient: facultyId,
      relatedEntityId: testWorkflowEventId,
    });
    expect(notif).toBeDefined();

    // 4. Verify Faculty dashboard retrieves request in pending approvals
    const pendingRes = await request(app)
      .get('/api/v1/approvals/pending')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(pendingRes.status).toBe(200);
    const hasEvent = pendingRes.body.pendingRequests.some((r: any) => r._id === testWorkflowEventId);
    expect(hasEvent).toBe(true);

    // 5. Faculty approves request
    const approveRes = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        eventId: testWorkflowEventId,
        decision: 'APPROVED',
        reason: 'Proposal verified. Faculty mentor approves budget and schedule.',
      });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
  });

  it('22. Test B: Faculty approval reaches HOD dashboard as actionable task', async () => {
    // 1. Verify HOD dashboard receives the request in pending approvals
    const hodPendingRes = await request(app)
      .get('/api/v1/approvals/pending')
      .set('Authorization', `Bearer ${hodToken}`);
    expect(hodPendingRes.status).toBe(200);
    const hasEventForHod = hodPendingRes.body.pendingRequests.some((r: any) => r._id === testWorkflowEventId);
    expect(hasEventForHod).toBe(true);

    // 2. HOD approves request
    const hodApproveRes = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        eventId: testWorkflowEventId,
        decision: 'APPROVED',
        reason: 'Departmental authorization granted for 150 student attendees.',
      });
    expect(hodApproveRes.status).toBe(200);
    expect(hodApproveRes.body.event.currentApprovalStage).toBe('RESOURCE_MANAGER_REVIEW');
  });

  it('23. Test E: Resource manager confirms allocation and final status becomes CONFIRMED', async () => {
    // Resource Manager approves final operational stage
    const mgrApproveRes = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        eventId: testWorkflowEventId,
        decision: 'APPROVED',
        reason: 'Venue and AV gear verified and reserved in pool.',
      });
    expect(mgrApproveRes.status).toBe(200);
    expect(mgrApproveRes.body.event.status).toBe('CONFIRMED');
    expect(mgrApproveRes.body.event.currentApprovalStage).toBe('COMPLETED');
  });

  it('24. Test C: Rejection sets status to REJECTED and cancels reservations', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 25);
    eventDate.setHours(9, 0, 0, 0);
    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(12, 0, 0, 0);

    const submitRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Party',
        description: 'Casual gathering without faculty advisor.',
        eventType: 'OTHER',
        organizingClubId: ecellClubId,
        departmentId: cseDeptId,
        facultyCoordinatorId: facultyId,
        startDate: eventDate.toISOString(),
        endDate: eventEndDate.toISOString(),
        expectedAttendance: 40,
      });

    const rejectEventId = submitRes.body.event._id;

    // Faculty rejects with reason
    const rejectRes = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        eventId: rejectEventId,
        decision: 'REJECTED',
        reason: 'Does not meet academic or institutional club criteria.',
      });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.event.status).toBe('REJECTED');

    // Verify task is REJECTED
    const { ApprovalTask } = await import('../models/ApprovalTask.js');
    const task = await ApprovalTask.findOne({ request: rejectEventId, stage: 'FACULTY_REVIEW' });
    expect(task!.status).toBe('REJECTED');
  });

  it('25. Test D: Changes requested allows student editing and resubmission', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 28);
    eventDate.setHours(9, 0, 0, 0);
    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(14, 0, 0, 0);

    const submitRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Initial Coding Camp',
        description: 'Introductory coding workshop for junior members.',
        eventType: 'WORKSHOP',
        organizingClubId: ecellClubId,
        departmentId: cseDeptId,
        facultyCoordinatorId: facultyId,
        startDate: eventDate.toISOString(),
        endDate: eventEndDate.toISOString(),
        expectedAttendance: 50,
      });

    const changeEventId = submitRes.body.event._id;

    // Faculty requests changes
    const changeRes = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        eventId: changeEventId,
        decision: 'CHANGES_REQUESTED',
        reason: 'Please provide detailed syllabus and safety precautions.',
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.event.status).toBe('CHANGES_REQUESTED');

    // Student edits and resubmits
    const resubmitRes = await request(app)
      .post(`/api/v1/events/${changeEventId}/resubmit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Revised Coding Camp (with Syllabus)',
        description: 'Complete 3-part syllabus attached covering web development basics.',
        expectedAttendance: 55,
      });

    expect(resubmitRes.status).toBe(200);
    expect(resubmitRes.body.event.status).toBe('UNDER_REVIEW');
    expect(resubmitRes.body.event.currentApprovalStage).toBe('FACULTY_REVIEW');
  });

  it('26. Test F: Authorization safeguards prevent unauthorized approvals', async () => {
    // 1. Student cannot approve requests
    const studentApprove = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        eventId: testWorkflowEventId,
        decision: 'APPROVED',
        reason: 'Student trying to self-approve',
      });
    expect(studentApprove.status).toBe(403);

    // 2. Faculty from another assignment cannot approve
    const facultyRoboRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'faculty.robotics@resourceloop.edu', password: 'Password@123' });

    const unauthorizedFaculty = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${facultyRoboRes.body.token}`)
      .send({
        eventId: testWorkflowEventId,
        decision: 'APPROVED',
        reason: 'Robotics faculty trying to approve E-Cell event',
      });
    expect(unauthorizedFaculty.status).toBe(400); // Throws unauthorized stage review
  });

  // -------------------------------------------------------------
  // COMPREHENSIVE INTEGRATION SUITE: AUTH, RBAC, ADMIN & EVENT FLOW
  // -------------------------------------------------------------

  it('27. Login succeeds for all 5 institutional roles with correct profile info', async () => {
    const rolesToTest = [
      { email: 'student.ecell@resourceloop.edu', expectedRole: 'STUDENT' },
      { email: 'faculty.ecell@resourceloop.edu', expectedRole: 'FACULTY' },
      { email: 'hod.cse@resourceloop.edu', expectedRole: 'HOD' },
      { email: 'manager.av@resourceloop.edu', expectedRole: 'RESOURCE_MANAGER' },
      { email: 'admin@resourceloop.edu', expectedRole: 'ADMIN' },
    ];

    for (const item of rolesToTest) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: item.email, password: 'Password@123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe(item.expectedRole);
    }
  });

  it('28. Login fails for unknown account with clear friendly message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent.user@resourceloop.edu', password: 'Password@123' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });

  it('29. Login and token use are rejected for deactivated accounts', async () => {
    // Create a deactivated user
    const deactivatedUser = await User.create({
      name: 'Deactivated Test User',
      email: 'deactivated.test@resourceloop.edu',
      password: 'Password@123',
      role: 'STUDENT',
      roles: ['STUDENT'],
      isActive: false,
      isVerified: true,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'deactivated.test@resourceloop.edu', password: 'Password@123' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/deactivated/i);

    // Clean up
    await User.deleteOne({ _id: deactivatedUser._id });
  });

  it('30. Login and token use are rejected for unverified accounts', async () => {
    const unverifiedUser = await User.create({
      name: 'Unverified Test User',
      email: 'unverified.test@resourceloop.edu',
      password: 'Password@123',
      role: 'STUDENT',
      roles: ['STUDENT'],
      isActive: true,
      isVerified: false,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'unverified.test@resourceloop.edu', password: 'Password@123' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/pending.*verification/i);

    // Clean up
    await User.deleteOne({ _id: unverifiedUser._id });
  });

  it('31. Public registration rejects privileged role self-assignment and assigns STUDENT', async () => {
    const testEmail = `student.hacker.${Date.now()}@resourceloop.edu`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Curious Hacker',
        email: testEmail,
        password: 'Password@123',
        role: 'ADMIN', // Attempting to self-escalate to ADMIN
        roles: ['ADMIN'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('STUDENT'); // Must strictly be STUDENT
    expect(res.body.user.roles).toEqual(['STUDENT']);

    // Clean up
    await User.deleteOne({ email: testEmail });
  });

  it('32. Non-admin users are forbidden from accessing user administration APIs', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  let provisionedUserId = '';
  it('33. Admin can list, search, and filter user accounts', async () => {
    const listRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.users.length).toBeGreaterThanOrEqual(5);

    // Filter by role
    const facultyFilterRes = await request(app)
      .get('/api/v1/users?role=FACULTY')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(facultyFilterRes.status).toBe(200);
    facultyFilterRes.body.users.forEach((u: any) => {
      expect(u.role).toBe('FACULTY');
    });

    // Passwords must NEVER be exposed
    listRes.body.users.forEach((u: any) => {
      expect(u.password).toBeUndefined();
    });
  });

  it('34. Admin can provision a new privileged account and the user can log in', async () => {
    const provEmail = `lab.incharge.${Date.now()}@resourceloop.edu`;
    const provRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Lab Incharge',
        email: provEmail,
        password: 'Password@123',
        role: 'RESOURCE_MANAGER',
        phone: '+91 98765 11223',
        studentOrEmpId: 'EMP-LAB-99',
        isActive: true,
        isVerified: true,
      });

    expect(provRes.status).toBe(201);
    expect(provRes.body.success).toBe(true);
    expect(provRes.body.user.email).toBe(provEmail);
    expect(provRes.body.user.role).toBe('RESOURCE_MANAGER');
    provisionedUserId = provRes.body.user._id;

    // Login with the newly provisioned credentials
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: provEmail, password: 'Password@123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe('RESOURCE_MANAGER');
  });

  it('35. Admin can update user role, details, and toggle active status', async () => {
    // Update role and details
    const updateRes = await request(app)
      .put(`/api/v1/users/${provisionedUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Lab Incharge Updated',
        phone: '+91 99999 88888',
        role: 'FACULTY',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user.role).toBe('FACULTY');
    expect(updateRes.body.user.phone).toBe('+91 99999 88888');

    // Deactivate user
    const deactRes = await request(app)
      .put(`/api/v1/users/${provisionedUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(deactRes.status).toBe(200);
    expect(deactRes.body.user.isActive).toBe(false);

    // Verify login is now blocked
    const loginAttempt = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: updateRes.body.user.email, password: 'Password@123' });
    expect(loginAttempt.status).toBe(403);

    // Reactivate user
    const reactRes = await request(app)
      .put(`/api/v1/users/${provisionedUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });
    expect(reactRes.status).toBe(200);
    expect(reactRes.body.user.isActive).toBe(true);

    // Clean up
    await User.deleteOne({ _id: provisionedUserId });
  });

  it('36. Admin safety rule: Cannot deactivate or demote the final active administrator', async () => {
    // Find current active admin
    const activeAdmin = await User.findOne({ role: 'ADMIN', isActive: true });
    expect(activeAdmin).toBeDefined();

    // Ensure there is only 1 active admin in test environment
    await User.deleteMany({ role: 'ADMIN', _id: { $ne: activeAdmin!._id } });

    // Attempt to deactivate final admin
    const deactRes = await request(app)
      .put(`/api/v1/users/${activeAdmin!._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(deactRes.status).toBe(400);
    expect(deactRes.body.message).toMatch(/final active administrator/i);

    // Attempt to change role of final admin to STUDENT
    const demoteRes = await request(app)
      .put(`/api/v1/users/${activeAdmin!._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'STUDENT' });
    expect(demoteRes.status).toBe(400);
    expect(demoteRes.body.message).toMatch(/final active administrator/i);
  });

  it('37. IDOR protection: Student cannot access private event of another student', async () => {
    // Create an event for another user in another club/department
    const otherStudent = await User.create({
      name: 'Other Student Private',
      email: `other.private.${Date.now()}@resourceloop.edu`,
      password: 'Password@123',
      role: 'STUDENT',
      roles: ['STUDENT'],
      isActive: true,
      isVerified: true,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 35);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);

    const privateEvent = await EventRequest.create({
      requestNumber: `REQ-PRIV-${Date.now()}`,
      title: 'Confidential Internal Session',
      description: 'Private meeting for leadership team.',
      eventType: 'OTHER',
      organizingClub: ecellClubId,
      organizer: otherStudent._id,
      department: cseDeptId,
      facultyCoordinator: facultyId,
      startDate,
      endDate,
      expectedAttendance: 10,
      status: 'UNDER_REVIEW',
      currentApprovalStage: 'FACULTY_REVIEW',
      requiresHodApproval: false,
    });

    // Create a third unrelated student who has no club memberships
    const unrelatedStudent = await User.create({
      name: 'Unrelated Outsider',
      email: `outsider.${Date.now()}@resourceloop.edu`,
      password: 'Password@123',
      role: 'STUDENT',
      roles: ['STUDENT'],
      clubMemberships: [],
      isActive: true,
      isVerified: true,
    });

    const outsiderLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: unrelatedStudent.email, password: 'Password@123' });

    // Unrelated student tries to read private event by ID
    const accessRes = await request(app)
      .get(`/api/v1/events/${privateEvent._id}`)
      .set('Authorization', `Bearer ${outsiderLogin.body.token}`);

    expect(accessRes.status).toBe(403);
    expect(accessRes.body.message).toMatch(/Forbidden/i);

    // Clean up
    await EventRequest.deleteOne({ _id: privateEvent._id });
    await User.deleteMany({ _id: { $in: [otherStudent._id, unrelatedStudent._id] } });
  });

  it('38. Full End-to-End Workflow: Student -> Faculty -> HOD -> Manager Confirmation -> Confirmed', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 40);
    eventDate.setHours(10, 0, 0, 0);
    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(16, 0, 0, 0);

    // 1. Student submits event requiring HOD approval (attendance >= 100)
    const submitRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Apex Annual Tech Symposium 2026',
        description: 'Large multi-track technological summit requiring HOD and dean authorizations.',
        eventType: 'HACKATHON',
        organizingClubId: ecellClubId,
        departmentId: cseDeptId,
        facultyCoordinatorId: facultyId,
        venueId: seminarHallId,
        startDate: eventDate.toISOString(),
        endDate: eventEndDate.toISOString(),
        expectedAttendance: 150, // >= 100 requires HOD approval
        purpose: 'Annual engineering showcase',
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.success).toBe(true);
    const multiStageEventId = submitRes.body.event._id;

    // Verify initial status and tasks
    const { ApprovalTask } = await import('../models/ApprovalTask.js');
    const facultyTask = await ApprovalTask.findOne({ request: multiStageEventId, stage: 'FACULTY_REVIEW' });
    const hodTask = await ApprovalTask.findOne({ request: multiStageEventId, stage: 'HOD_REVIEW' });
    const mgrTask = await ApprovalTask.findOne({ request: multiStageEventId, stage: 'RESOURCE_MANAGER_REVIEW' });

    expect(facultyTask!.status).toBe('ACTIONABLE');
    expect(hodTask!.status).toBe('STAGED');
    expect(mgrTask!.status).toBe('STAGED');

    // 2. Assigned Faculty reviews and approves
    const facultyReviewRes = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        eventId: multiStageEventId,
        decision: 'APPROVED',
        reason: 'Recommended for HOD department review. Good agenda.',
      });

    expect(facultyReviewRes.status).toBe(200);
    expect(facultyReviewRes.body.event.status).toBe('UNDER_REVIEW');
    expect(facultyReviewRes.body.event.currentApprovalStage).toBe('HOD_REVIEW');

    // Verify HOD task is now ACTIONABLE
    const hodTaskActive = await ApprovalTask.findOne({ request: multiStageEventId, stage: 'HOD_REVIEW' });
    expect(hodTaskActive!.status).toBe('ACTIONABLE');

    // 3. Unauthorized reviewer cannot approve HOD stage (e.g. standard faculty)
    const unauthorizedHodApprove = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        eventId: multiStageEventId,
        decision: 'APPROVED',
        reason: 'Regular faculty attempting to act as HOD',
      });
    expect(unauthorizedHodApprove.status).toBe(400);

    // 4. CSE HOD approves
    const hodReviewRes = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        eventId: multiStageEventId,
        decision: 'APPROVED',
        reason: 'Department clearance granted. Proceed to resource logistics.',
      });

    expect(hodReviewRes.status).toBe(200);
    expect(hodReviewRes.body.event.status).toBe('APPROVED_PENDING_RESOURCE_CONFIRMATION');
    expect(hodReviewRes.body.event.currentApprovalStage).toBe('RESOURCE_MANAGER_REVIEW');

    // Verify Manager task is now ACTIONABLE
    const mgrTaskActive = await ApprovalTask.findOne({ request: multiStageEventId, stage: 'RESOURCE_MANAGER_REVIEW' });
    expect(mgrTaskActive!.status).toBe('ACTIONABLE');

    // 5. Resource Manager confirms operational allocation
    const managerConfirmRes = await request(app)
      .post('/api/v1/approvals/decision')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        eventId: multiStageEventId,
        decision: 'APPROVED',
        reason: 'Hall 101 capacity and AV fixtures confirmed operational.',
      });

    expect(managerConfirmRes.status).toBe(200);
    expect(managerConfirmRes.body.event.status).toBe('CONFIRMED');

    // 6. Verify linked reservations are confirmed
    const { Reservation } = await import('../models/Reservation.js');
    const reservations = await Reservation.find({ event: multiStageEventId });
    expect(reservations.length).toBeGreaterThan(0);
    reservations.forEach((r) => {
      expect(r.status).toBe('CONFIRMED');
    });

    // 7. Verify notifications to Student
    const { Notification } = await import('../models/Notification.js');
    const studentNotifs = await Notification.find({
      relatedEntityId: multiStageEventId,
    });
    expect(studentNotifs.length).toBeGreaterThanOrEqual(3);

    // Clean up
    await Reservation.deleteMany({ event: multiStageEventId });
    await ApprovalTask.deleteMany({ request: multiStageEventId });
    await import('../models/ApprovalDecision.js').then((m) => m.ApprovalDecision.deleteMany({ event: multiStageEventId }));
    await Notification.deleteMany({ relatedEntityId: multiStageEventId });
    await EventRequest.deleteOne({ _id: multiStageEventId });
  });
});
