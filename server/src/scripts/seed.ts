import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Club } from '../models/Club.js';
import { Resource } from '../models/Resource.js';
import { EventRequest } from '../models/EventRequest.js';
import { Reservation } from '../models/Reservation.js';
import { ApprovalPolicy } from '../models/ApprovalPolicy.js';
import { ApprovalDecision } from '../models/ApprovalDecision.js';
import { ApprovalTask } from '../models/ApprovalTask.js';
import { HandoverRecord } from '../models/HandoverRecord.js';
import { Incident } from '../models/Incident.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { InstitutionSettings } from '../models/InstitutionSettings.js';

async function seed() {
  console.log('[Seed] Starting database seeding for ResourceLoop...');
  await connectDB();

  // Clear existing collections safely for a clean testbed
  console.log('[Seed] Clearing previous records...');
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Club.deleteMany({}),
    Resource.deleteMany({}),
    EventRequest.deleteMany({}),
    Reservation.deleteMany({}),
    ApprovalPolicy.deleteMany({}),
    ApprovalDecision.deleteMany({}),
    ApprovalTask.deleteMany({}),
    HandoverRecord.deleteMany({}),
    Incident.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    InstitutionSettings.deleteMany({}),
  ]);

  // 1. Create Institution Settings
  await InstitutionSettings.create({
    institutionName: 'Apex University of Technology & Sciences',
    institutionTimezone: 'Asia/Kolkata',
    defaultBufferMinutes: 30,
    maxClubMonthlyBookings: 8,
    requireHodAboveAttendance: 100,
    autoCancelHoldMinutes: 60,
    allowWeekendBookings: true,
    aiEnabled: true,
    aiProvider: 'RULE_BASED',
  });

  // 2. Create Departments
  console.log('[Seed] Creating Departments...');
  const deptCSE = await Department.create({
    name: 'Computer Science & Engineering',
    code: 'CSE',
    description: 'Department of Computer Science and Emerging Technologies',
    location: 'Block C, Academic Complex',
  });

  const deptECE = await Department.create({
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    description: 'Department of Electronics, IoT, and Robotics',
    location: 'Block B, Engineering Building',
  });

  const deptMECH = await Department.create({
    name: 'Mechanical & Fabrication Engineering',
    code: 'MECH',
    description: 'Department of Mechanical Systems and Maker Labs',
    location: 'Block D, Workshop Complex',
  });

  const deptSAE = await Department.create({
    name: 'Student Affairs & Extracurriculars',
    code: 'SAE',
    description: 'Central Office for Clubs, Cultural Festivals, and Campus Events',
    location: 'Student Activity Centre (SAC)',
  });

  // 3. Create Users
  console.log('[Seed] Creating Demo Users...');
  const commonPassword = 'Password@123';

  const admin = await User.create({
    name: 'Dr. Sarah Jenkins',
    email: 'admin@resourceloop.edu',
    password: commonPassword,
    role: 'ADMIN',
    roles: ['ADMIN'],
    department: deptSAE._id,
    phone: '+91 98765 43210',
    studentOrEmpId: 'EMP-ADM-001',
    isVerified: true,
    isActive: true,
  });

  const hodCSE = await User.create({
    name: 'Prof. Arvind Sharma',
    email: 'hod.cse@resourceloop.edu',
    password: commonPassword,
    role: 'HOD',
    roles: ['HOD', 'FACULTY'],
    department: deptCSE._id,
    phone: '+91 98765 43211',
    studentOrEmpId: 'EMP-HOD-CSE',
    isVerified: true,
    isActive: true,
  });
  deptCSE.hod = hodCSE._id as any;
  await deptCSE.save();

  const facultyEcell = await User.create({
    name: 'Prof. Elena Vance',
    email: 'faculty.ecell@resourceloop.edu',
    password: commonPassword,
    role: 'FACULTY',
    roles: ['FACULTY'],
    department: deptCSE._id,
    phone: '+91 98765 43212',
    studentOrEmpId: 'EMP-FAC-014',
    isVerified: true,
    isActive: true,
  });

  const facultyRobo = await User.create({
    name: 'Dr. Marcus Brody',
    email: 'faculty.robotics@resourceloop.edu',
    password: commonPassword,
    role: 'FACULTY',
    roles: ['FACULTY'],
    department: deptECE._id,
    phone: '+91 98765 43213',
    studentOrEmpId: 'EMP-FAC-029',
    isVerified: true,
    isActive: true,
  });

  const resourceManager = await User.create({
    name: 'Robert Hayes',
    email: 'manager.av@resourceloop.edu',
    password: commonPassword,
    role: 'RESOURCE_MANAGER',
    roles: ['RESOURCE_MANAGER'],
    department: deptSAE._id,
    phone: '+91 98765 43214',
    studentOrEmpId: 'EMP-MGR-002',
    isVerified: true,
    isActive: true,
  });

  const studentAarav = await User.create({
    name: 'Aarav Patel',
    email: 'student.ecell@resourceloop.edu',
    password: commonPassword,
    role: 'STUDENT',
    roles: ['STUDENT'],
    department: deptCSE._id,
    phone: '+91 98765 43215',
    studentOrEmpId: 'PRN-2024-0083',
    isVerified: true,
    isActive: true,
  });

  const studentPriya = await User.create({
    name: 'Priya Sharma',
    email: 'student.coding@resourceloop.edu',
    password: commonPassword,
    role: 'STUDENT',
    roles: ['STUDENT'],
    department: deptCSE._id,
    phone: '+91 98765 43216',
    studentOrEmpId: 'PRN-2024-0112',
    isVerified: true,
    isActive: true,
  });

  // 4. Create Clubs
  console.log('[Seed] Creating Clubs...');
  const clubECell = await Club.create({
    name: 'Entrepreneurship Cell',
    code: 'E-CELL',
    description: 'Fostering student innovation, startups, pitch competitions, and hackathons.',
    department: deptCSE._id,
    category: 'ENTREPRENEURSHIP',
    facultyCoordinator: facultyEcell._id,
    authorizedRepresentatives: [studentAarav._id],
    isVerified: true,
    monthlyBookingQuota: 8,
  });

  const clubCoding = await Club.create({
    name: 'Developers & Coding Club',
    code: 'CODE-CLUB',
    description: 'Competitive programming, open-source workshops, and web dev bootcamps.',
    department: deptCSE._id,
    category: 'TECHNICAL',
    facultyCoordinator: facultyEcell._id,
    authorizedRepresentatives: [studentPriya._id],
    isVerified: true,
    monthlyBookingQuota: 8,
  });

  const clubRobo = await Club.create({
    name: 'Robotics & Automation Society',
    code: 'ROBO-SOC',
    description: 'Hardware hacking, autonomous drones, battle bots, and IoT hardware projects.',
    department: deptECE._id,
    category: 'TECHNICAL',
    facultyCoordinator: facultyRobo._id,
    authorizedRepresentatives: [],
    isVerified: true,
    monthlyBookingQuota: 8,
  });

  // Update student club memberships
  studentAarav.clubMemberships = [clubECell._id as any];
  await studentAarav.save();

  studentPriya.clubMemberships = [clubCoding._id as any];
  await studentPriya.save();

  // 5. Create Resources
  console.log('[Seed] Creating Resources...');
  const resAuditorium = await Resource.create({
    name: 'Apex Grand Auditorium',
    code: 'AUD-MAIN-01',
    category: 'AUDITORIUM',
    description: '500-seat central auditorium equipped with surround sound, stage lighting, and central air conditioning.',
    department: deptSAE._id,
    location: 'Central Campus Block, Ground Floor',
    manager: resourceManager._id,
    resourceType: 'INDIVIDUAL',
    capacity: 500,
    totalQuantity: 1,
    availableQuantity: 1,
    operationalStatus: 'AVAILABLE',
    operatingHours: { start: '08:00', end: '21:00' },
    maxBookingHours: 10,
    minAdvanceHours: 24,
    requiresHodApproval: true,
    accessories: ['Stage Podium', 'Wireless Handheld Mics (4)', 'Ceiling Sound System', 'DMX Lighting Board'],
    conditionStatus: 'EXCELLENT',
  });

  const resSeminarHall = await Resource.create({
    name: 'Sir CV Raman Seminar Hall',
    code: 'SEM-HALL-101',
    category: 'SEMINAR_HALL',
    description: 'Acoustically treated 150-seat tiered lecture hall with dual projector screens and high-speed Wi-Fi.',
    department: deptCSE._id,
    location: 'Block C, 1st Floor, Room 101',
    manager: resourceManager._id,
    resourceType: 'INDIVIDUAL',
    capacity: 150,
    totalQuantity: 1,
    availableQuantity: 1,
    operationalStatus: 'AVAILABLE',
    operatingHours: { start: '08:00', end: '20:00' },
    maxBookingHours: 8,
    minAdvanceHours: 4,
    requiresHodApproval: false,
    accessories: ['Ceiling Mounted Dual Projectors', 'Wireless Mic Set', 'HDMI Splitter', 'Audio Amplifier'],
    conditionStatus: 'EXCELLENT',
  });

  const resConfRoom = await Resource.create({
    name: 'Alan Turing Innovation Conference Room',
    code: 'CONF-ROOM-202',
    category: 'CONFERENCE_ROOM',
    description: '40-person executive conference suite with 75" interactive 4K display and teleconferencing camera.',
    department: deptCSE._id,
    location: 'Block C, 2nd Floor, Room 202',
    manager: resourceManager._id,
    resourceType: 'INDIVIDUAL',
    capacity: 40,
    totalQuantity: 1,
    availableQuantity: 1,
    operationalStatus: 'AVAILABLE',
    operatingHours: { start: '08:00', end: '19:00' },
    maxBookingHours: 4,
    minAdvanceHours: 2,
    requiresHodApproval: false,
    accessories: ['4K Interactive Display', 'Poly Studio Soundbar', 'Conference Mic Pods'],
    conditionStatus: 'EXCELLENT',
  });

  const resProjectorPool = await Resource.create({
    name: 'Epson PowerLite 4K Laser Projector Pool',
    code: 'PROJ-POOL',
    category: 'AUDIO_VISUAL',
    description: 'High-lumen portable laser presentation projectors suitable for auditoriums and large classrooms.',
    department: deptSAE._id,
    location: 'AV Equipment Store, SAC Room 12',
    manager: resourceManager._id,
    resourceType: 'POOLED',
    totalQuantity: 4,
    availableQuantity: 4,
    operationalStatus: 'AVAILABLE',
    operatingHours: { start: '08:00', end: '20:00' },
    maxBookingHours: 12,
    minAdvanceHours: 2,
    requiresHodApproval: false,
    accessories: ['HDMI Cable (10m)', 'Power Cable', 'IR Remote Control', 'Padded Carrying Case'],
    conditionStatus: 'EXCELLENT',
  });

  const resMicSet = await Resource.create({
    name: 'Shure BLX288 Dual Wireless Microphone Kit',
    code: 'MIC-SHURE-01',
    category: 'AUDIO_VISUAL',
    description: 'Professional handheld and lapel wireless microphone sets with interference-free analog VHF/UHF.',
    department: deptSAE._id,
    location: 'AV Equipment Store, SAC Room 12',
    manager: resourceManager._id,
    resourceType: 'POOLED',
    totalQuantity: 6,
    availableQuantity: 6,
    operationalStatus: 'AVAILABLE',
    operatingHours: { start: '08:00', end: '20:00' },
    maxBookingHours: 12,
    minAdvanceHours: 2,
    requiresHodApproval: false,
    accessories: ['Receiver Unit', '2x Handheld Mics', 'Collar Mic Transmitter', 'XLR to 1/4" Cable', 'Power Supply'],
    conditionStatus: 'EXCELLENT',
  });

  const resSpeakerSystem = await Resource.create({
    name: 'JBL EON ONE Pro Portable PA Speaker System',
    code: 'SPK-JBL-01',
    category: 'AUDIO_VISUAL',
    description: 'Battery-powered linear-array portable PA speaker system with 7-channel mixer and Bluetooth.',
    department: deptSAE._id,
    location: 'AV Equipment Store, SAC Room 12',
    manager: resourceManager._id,
    resourceType: 'POOLED',
    totalQuantity: 3,
    availableQuantity: 3,
    operationalStatus: 'AVAILABLE',
    operatingHours: { start: '08:00', end: '20:00' },
    maxBookingHours: 12,
    minAdvanceHours: 4,
    requiresHodApproval: false,
    accessories: ['IEC Power Cord', 'Column Spacers', 'protective Slipcover'],
    conditionStatus: 'EXCELLENT',
  });

  const resCameraKit = await Resource.create({
    name: 'Sony Alpha A7 IV 4K Mirrorless Camera Kit',
    code: 'CAM-SONY-01',
    category: 'PHOTOGRAPHY',
    description: 'Full-frame 33MP hybrid camera kit for official event photography and 4K 60p livestream recording.',
    department: deptSAE._id,
    location: 'Media Production Lab, SAC Room 14',
    manager: resourceManager._id,
    resourceType: 'INDIVIDUAL',
    totalQuantity: 2,
    availableQuantity: 2,
    operationalStatus: 'AVAILABLE',
    operatingHours: { start: '08:00', end: '19:00' },
    maxBookingHours: 8,
    minAdvanceHours: 6,
    requiresHodApproval: false,
    accessories: ['Sony 24-70mm f/2.8 GM Lens', '2x NP-FZ100 Batteries', 'Dual Charger', '128GB SanDisk Extreme SD', 'Peak Design Strap', 'Camera Bag'],
    conditionStatus: 'EXCELLENT',
  });

  const res3DPrinter = await Resource.create({
    name: 'Bambu Lab X1-Carbon Combo 3D Printer',
    code: '3D-PRINTER-01',
    category: 'MAKER_FABRICATION',
    description: 'High-speed multi-color coreXY 3D printer for prototyping student engineering designs and robot parts.',
    department: deptMECH._id,
    location: 'Maker Lab, Block D, Room 004',
    manager: resourceManager._id,
    resourceType: 'INDIVIDUAL',
    totalQuantity: 1,
    availableQuantity: 1,
    operationalStatus: 'AVAILABLE',
    operatingHours: { start: '09:00', end: '18:00' },
    maxBookingHours: 8,
    minAdvanceHours: 12,
    requiresTraining: true,
    requiresSupervision: true,
    requiresHodApproval: false,
    accessories: ['AMS 4-Filament Unit', 'Tool Kit', 'Textured PEI Plate', 'Spare 0.4mm Hardened Hotend'],
    conditionStatus: 'GOOD',
  });

  // 6. Create Default Approval Policy
  console.log('[Seed] Configuring Approval Policies...');
  await ApprovalPolicy.create({
    name: 'Standard Institutional Event Policy',
    description: 'Multi-stage approval routing for student club events and academic activities.',
    stages: [
      { stageName: 'FACULTY_REVIEW', roleRequired: 'FACULTY', isMandatory: true, order: 1 },
      { stageName: 'HOD_REVIEW', roleRequired: 'HOD', isMandatory: true, order: 2 },
      { stageName: 'RESOURCE_MANAGER_REVIEW', roleRequired: 'RESOURCE_MANAGER', isMandatory: true, order: 3 },
    ],
    minAttendanceForHod: 100,
    isActive: true,
  });

  // 7. Create Demo Event (End-to-End Scenario 1: Ready for collection)
  console.log('[Seed] Seeding Demo Event Request & Reservations...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(18, 0, 0, 0);

  const demoEvent = await EventRequest.create({
    requestNumber: 'REQ-2026-0001',
    title: 'Apex Annual Innovation Hackathon 2026',
    description: '36-hour inter-college technical hackathon with 150 student developers building AI solutions.',
    eventType: 'HACKATHON',
    organizingClub: clubECell._id,
    organizer: studentAarav._id,
    department: deptCSE._id,
    facultyCoordinator: facultyEcell._id,
    venue: resSeminarHall._id,
    startDate: tomorrow,
    endDate: tomorrowEnd,
    setupMinutes: 60,
    cleanupMinutes: 60,
    expectedAttendance: 150,
    purpose: 'Promote student entrepreneurship and hands-on coding prototypes.',
    status: 'CONFIRMED',
    currentApprovalStage: 'COMPLETED',
    requiresHodApproval: true,
  });

  // Venue reservation
  const resvVenue = await Reservation.create({
    event: demoEvent._id,
    resource: resSeminarHall._id,
    quantity: 1,
    startDate: tomorrow,
    endDate: tomorrowEnd,
    status: 'CONFIRMED',
    allocatedAt: new Date(),
  });

  // Projectors reservation (2 units)
  const resvProj = await Reservation.create({
    event: demoEvent._id,
    resource: resProjectorPool._id,
    quantity: 2,
    startDate: tomorrow,
    endDate: tomorrowEnd,
    status: 'CONFIRMED',
    allocatedAt: new Date(),
  });

  // Mic reservation (2 units)
  const resvMic = await Reservation.create({
    event: demoEvent._id,
    resource: resMicSet._id,
    quantity: 2,
    startDate: tomorrow,
    endDate: tomorrowEnd,
    status: 'CONFIRMED',
    allocatedAt: new Date(),
  });

  // Speaker reservation (1 unit)
  const resvSpk = await Reservation.create({
    event: demoEvent._id,
    resource: resSpeakerSystem._id,
    quantity: 1,
    startDate: tomorrow,
    endDate: tomorrowEnd,
    status: 'CONFIRMED',
    allocatedAt: new Date(),
  });

  // Record completed approval decisions for demonstration
  await ApprovalDecision.create({
    event: demoEvent._id,
    stage: 'FACULTY_REVIEW',
    reviewer: facultyEcell._id,
    reviewerRole: 'FACULTY',
    decision: 'APPROVED',
    reason: 'Excellent initiative by E-Cell. Faculty mentorship and safety protocol in place.',
    previousState: 'UNDER_REVIEW',
    resultingState: 'UNDER_REVIEW',
  });

  await ApprovalDecision.create({
    event: demoEvent._id,
    stage: 'HOD_REVIEW',
    reviewer: hodCSE._id,
    reviewerRole: 'HOD',
    decision: 'APPROVED',
    reason: 'Approved for departmental hosting. 150 attendees sanctioned for CV Raman Hall.',
    previousState: 'UNDER_REVIEW',
    resultingState: 'UNDER_REVIEW',
  });

  await ApprovalDecision.create({
    event: demoEvent._id,
    stage: 'RESOURCE_MANAGER_REVIEW',
    reviewer: resourceManager._id,
    reviewerRole: 'RESOURCE_MANAGER',
    decision: 'APPROVED',
    reason: 'All requested AV and venue equipment inspected and reserved in operational pool.',
    previousState: 'UNDER_REVIEW',
    resultingState: 'CONFIRMED',
  });

  // Record completed approval tasks for demo event
  await ApprovalTask.create({
    request: demoEvent._id,
    stage: 'FACULTY_REVIEW',
    assignedReviewer: facultyEcell._id,
    assignedReviewerRole: 'FACULTY',
    department: deptCSE._id,
    status: 'APPROVED',
    decisionReason: 'Excellent initiative by E-Cell. Faculty mentorship and safety protocol in place.',
    decisionTimestamp: new Date(),
  });

  await ApprovalTask.create({
    request: demoEvent._id,
    stage: 'HOD_REVIEW',
    assignedReviewer: hodCSE._id,
    assignedReviewerRole: 'HOD',
    department: deptCSE._id,
    status: 'APPROVED',
    decisionReason: 'Approved for departmental hosting. 150 attendees sanctioned for CV Raman Hall.',
    decisionTimestamp: new Date(),
  });

  await ApprovalTask.create({
    request: demoEvent._id,
    stage: 'RESOURCE_MANAGER_REVIEW',
    assignedReviewer: resourceManager._id,
    assignedReviewerRole: 'RESOURCE_MANAGER',
    status: 'APPROVED',
    decisionReason: 'All requested AV and venue equipment inspected and reserved in operational pool.',
    decisionTimestamp: new Date(),
  });

  // Seed Live Pending Scenario 2: Actionable in Faculty Review Queue
  console.log('[Seed] Seeding Pending Faculty Review Event...');
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);
  nextWeek.setHours(10, 0, 0, 0);
  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setHours(17, 0, 0, 0);

  const pendingFacultyEvent = await EventRequest.create({
    requestNumber: 'REQ-2026-0002',
    title: 'AI & Robotics Hands-on Bootcamp 2026',
    description: 'Practical weekend workshop on computer vision and ROS2 mobile robots for 80 students.',
    eventType: 'WORKSHOP',
    organizingClub: clubECell._id,
    organizer: studentAarav._id,
    department: deptCSE._id,
    facultyCoordinator: facultyEcell._id,
    venue: resAuditorium._id,
    startDate: nextWeek,
    endDate: nextWeekEnd,
    setupMinutes: 30,
    cleanupMinutes: 30,
    expectedAttendance: 80,
    purpose: 'Hands-on technical workshop for club members and freshers.',
    status: 'UNDER_REVIEW',
    currentApprovalStage: 'FACULTY_REVIEW',
    requiresHodApproval: false,
  });

  await Reservation.create({
    event: pendingFacultyEvent._id,
    resource: resAuditorium._id,
    quantity: 1,
    startDate: nextWeek,
    endDate: nextWeekEnd,
    status: 'PENDING',
  });

  await Reservation.create({
    event: pendingFacultyEvent._id,
    resource: resProjectorPool._id,
    quantity: 1,
    startDate: nextWeek,
    endDate: nextWeekEnd,
    status: 'PENDING',
  });

  await ApprovalTask.create({
    request: pendingFacultyEvent._id,
    stage: 'FACULTY_REVIEW',
    assignedReviewer: facultyEcell._id,
    assignedReviewerRole: 'FACULTY',
    department: deptCSE._id,
    status: 'ACTIONABLE',
  });

  await ApprovalTask.create({
    request: pendingFacultyEvent._id,
    stage: 'RESOURCE_MANAGER_REVIEW',
    assignedReviewerRole: 'RESOURCE_MANAGER',
    status: 'STAGED',
  });

  await Notification.create({
    recipient: facultyEcell._id,
    title: 'New Event Approval Request',
    message: `${studentAarav.name} submitted an event request "AI & Robotics Hands-on Bootcamp 2026" for Entrepreneurship Cell. Awaiting your review.`,
    type: 'REVIEW_ASSIGNED',
    relatedEntityId: pendingFacultyEvent._id.toString(),
    relatedEntityType: 'EventRequest',
    actionLink: `/approvals/${pendingFacultyEvent._id}`,
    read: false,
  });

  // Seed Live Pending Scenario 3: Actionable in HOD Review Queue
  console.log('[Seed] Seeding Pending HOD Review Event...');
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 12);
  nextMonth.setHours(9, 30, 0, 0);
  const nextMonthEnd = new Date(nextMonth);
  nextMonthEnd.setHours(18, 30, 0, 0);

  const pendingHodEvent = await EventRequest.create({
    requestNumber: 'REQ-2026-0003',
    title: 'Global Tech Leaders Keynote & Demo Day',
    description: 'Departmental guest lecture by Silicon Valley AI leads, followed by student capstone project demos.',
    eventType: 'GUEST_LECTURE',
    organizingClub: clubCoding._id,
    organizer: studentPriya._id,
    department: deptCSE._id,
    facultyCoordinator: facultyEcell._id,
    venue: resAuditorium._id,
    startDate: nextMonth,
    endDate: nextMonthEnd,
    setupMinutes: 45,
    cleanupMinutes: 45,
    expectedAttendance: 140,
    purpose: 'Academic and industry collaboration lecture series.',
    status: 'UNDER_REVIEW',
    currentApprovalStage: 'HOD_REVIEW',
    requiresHodApproval: true,
  });

  await Reservation.create({
    event: pendingHodEvent._id,
    resource: resAuditorium._id,
    quantity: 1,
    startDate: nextMonth,
    endDate: nextMonthEnd,
    status: 'PENDING',
  });

  await Reservation.create({
    event: pendingHodEvent._id,
    resource: resMicSet._id,
    quantity: 2,
    startDate: nextMonth,
    endDate: nextMonthEnd,
    status: 'PENDING',
  });

  // Recorded prior faculty approval decision
  await ApprovalDecision.create({
    event: pendingHodEvent._id,
    stage: 'FACULTY_REVIEW',
    reviewer: facultyEcell._id,
    reviewerRole: 'FACULTY',
    decision: 'APPROVED',
    reason: 'Distinguished guest keynote verified. Academic objectives match curriculum and department standards.',
    previousState: 'UNDER_REVIEW',
    resultingState: 'UNDER_REVIEW',
  });

  await ApprovalTask.create({
    request: pendingHodEvent._id,
    stage: 'FACULTY_REVIEW',
    assignedReviewer: facultyEcell._id,
    assignedReviewerRole: 'FACULTY',
    department: deptCSE._id,
    status: 'APPROVED',
    decisionReason: 'Distinguished guest keynote verified. Academic objectives match curriculum and department standards.',
    decisionTimestamp: new Date(),
  });

  await ApprovalTask.create({
    request: pendingHodEvent._id,
    stage: 'HOD_REVIEW',
    assignedReviewer: hodCSE._id,
    assignedReviewerRole: 'HOD',
    department: deptCSE._id,
    status: 'ACTIONABLE',
  });

  await ApprovalTask.create({
    request: pendingHodEvent._id,
    stage: 'RESOURCE_MANAGER_REVIEW',
    assignedReviewerRole: 'RESOURCE_MANAGER',
    status: 'STAGED',
  });

  await Notification.create({
    recipient: hodCSE._id,
    title: 'HOD Approval Required',
    message: `Event "Global Tech Leaders Keynote & Demo Day" (140 attendees) approved by Faculty Coordinator. Awaiting your departmental authorization.`,
    type: 'REVIEW_ASSIGNED',
    relatedEntityId: pendingHodEvent._id.toString(),
    relatedEntityType: 'EventRequest',
    actionLink: `/approvals/${pendingHodEvent._id}`,
    read: false,
  });

  // Seed Live Pending Scenario 4: Actionable in Resource Manager Queue
  console.log('[Seed] Seeding Pending Resource Manager Review Event...');
  const next2Weeks = new Date();
  next2Weeks.setDate(next2Weeks.getDate() + 14);
  next2Weeks.setHours(9, 0, 0, 0);
  const next2WeeksEnd = new Date(next2Weeks);
  next2WeeksEnd.setHours(17, 0, 0, 0);

  const pendingMgrEvent = await EventRequest.create({
    requestNumber: 'REQ-2026-0004',
    title: 'Autonomous Drone Flight & Computer Vision Showcase',
    description: 'Outdoor flight arena setup and high-speed camera tracking demo.',
    eventType: 'PROJECT_DEMO',
    organizingClub: clubECell._id,
    organizer: studentAarav._id,
    department: deptCSE._id,
    facultyCoordinator: facultyEcell._id,
    venue: resSeminarHall._id,
    startDate: next2Weeks,
    endDate: next2WeeksEnd,
    setupMinutes: 30,
    cleanupMinutes: 30,
    expectedAttendance: 60,
    purpose: 'Robotics demo and drone flight exhibition.',
    status: 'APPROVED_PENDING_RESOURCE_CONFIRMATION',
    currentApprovalStage: 'RESOURCE_MANAGER_REVIEW',
    requiresHodApproval: false,
  });

  await Reservation.create({
    event: pendingMgrEvent._id,
    resource: resSeminarHall._id,
    quantity: 1,
    startDate: next2Weeks,
    endDate: next2WeeksEnd,
    status: 'PENDING',
  });

  await Reservation.create({
    event: pendingMgrEvent._id,
    resource: resCameraKit._id,
    quantity: 1,
    startDate: next2Weeks,
    endDate: next2WeeksEnd,
    status: 'PENDING',
  });

  await ApprovalDecision.create({
    event: pendingMgrEvent._id,
    stage: 'FACULTY_REVIEW',
    reviewer: facultyEcell._id,
    reviewerRole: 'FACULTY',
    decision: 'APPROVED',
    reason: 'Safety and flight protocol vetted. Supervised by faculty mentor.',
    previousState: 'UNDER_REVIEW',
    resultingState: 'APPROVED_PENDING_RESOURCE_CONFIRMATION',
  });

  await ApprovalTask.create({
    request: pendingMgrEvent._id,
    stage: 'FACULTY_REVIEW',
    assignedReviewer: facultyEcell._id,
    assignedReviewerRole: 'FACULTY',
    department: deptCSE._id,
    status: 'APPROVED',
    decisionReason: 'Safety and flight protocol vetted.',
    decisionTimestamp: new Date(),
  });

  await ApprovalTask.create({
    request: pendingMgrEvent._id,
    stage: 'RESOURCE_MANAGER_REVIEW',
    assignedReviewer: resourceManager._id,
    assignedReviewerRole: 'RESOURCE_MANAGER',
    status: 'ACTIONABLE',
  });

  await Notification.create({
    recipient: resourceManager._id,
    title: 'Resource Allocation Confirmation Required',
    message: `Event "Autonomous Drone Flight & Computer Vision Showcase" approved. Awaiting your operational confirmation and gear allocation.`,
    type: 'REVIEW_ASSIGNED',
    relatedEntityId: pendingMgrEvent._id.toString(),
    relatedEntityType: 'EventRequest',
    actionLink: `/approvals/${pendingMgrEvent._id}`,
    read: false,
  });

  // 8. Create a Sample Incident Case with Condition Reporting
  console.log('[Seed] Seeding Incident Record...');
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 3);

  const sampleIncident = await Incident.create({
    incidentNumber: 'INC-2026-0001',
    event: demoEvent._id,
    resource: resProjectorPool._id,
    reporter: resourceManager._id,
    category: 'DAMAGED_EQUIPMENT',
    description: 'During post-event check-in return, HDMI port bracket was reported loose and power cable was missing from accessories bag.',
    evidence: [],
    status: 'UNDER_REVIEW',
    assignedReviewer: admin._id,
    reviewNotes: 'Borrower states the HDMI cable was received in bent condition. Department tech inspecting connector integrity.',
  });

  // 9. Notifications
  await Notification.create({
    recipient: studentAarav._id,
    title: 'Event Confirmed: Apex Hackathon 2026',
    message: 'Your event and 4 requested resources have been confirmed. Please visit the AV store tomorrow morning for equipment handover.',
    type: 'BOOKING_CONFIRMED',
    relatedEntityId: demoEvent._id.toString(),
    relatedEntityType: 'EventRequest',
    actionLink: `/student/requests/${demoEvent._id}`,
    read: false,
  });

  await Notification.create({
    recipient: facultyEcell._id,
    title: 'Review Acknowledged',
    message: 'HOD and Resource Manager have sanctioned the E-Cell hackathon.',
    type: 'REQUEST_APPROVED',
    relatedEntityId: demoEvent._id.toString(),
    relatedEntityType: 'EventRequest',
    actionLink: `/approvals/${demoEvent._id}`,
    read: true,
  });

  // 10. Initial Audit Logs
  await AuditLog.create({
    actor: studentAarav._id,
    actorName: studentAarav.name,
    actorRole: studentAarav.role,
    action: 'EVENT_SUBMITTED',
    entityType: 'EventRequest',
    entityId: demoEvent._id.toString(),
    details: { requestNumber: 'REQ-2026-0001', title: demoEvent.title },
  });

  await AuditLog.create({
    actor: resourceManager._id,
    actorName: resourceManager.name,
    actorRole: resourceManager.role,
    action: 'APPROVAL_APPROVED_RESOURCE_MANAGER_REVIEW',
    entityType: 'EventRequest',
    entityId: demoEvent._id.toString(),
    details: { status: 'CONFIRMED' },
  });

  console.log('[Seed] ✅ Database seeding successfully completed!');
  console.log('====================================================');
  console.log('Demo Accounts Provisioned (Password for all: Password@123):');
  console.log('1. Admin:            admin@resourceloop.edu');
  console.log('2. HOD (CSE):        hod.cse@resourceloop.edu');
  console.log('3. Faculty Coord:    faculty.ecell@resourceloop.edu');
  console.log('4. Resource Manager: manager.av@resourceloop.edu');
  console.log('5. Student (E-Cell): student.ecell@resourceloop.edu');
  console.log('6. Student (Coding): student.coding@resourceloop.edu');
  console.log('====================================================');

  await disconnectDB();
}

seed().catch((err) => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
