export type UserRole = 'STUDENT' | 'FACULTY' | 'HOD' | 'RESOURCE_MANAGER' | 'ADMIN';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  clubMemberships?: Array<{
    _id: string;
    name: string;
    code: string;
    category: string;
    isVerified: boolean;
  }>;
  studentOrEmpId?: string;
  phone?: string;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ResourceCategory =
  | 'AUDIO_VISUAL'
  | 'COMPUTING'
  | 'PHOTOGRAPHY'
  | 'MAKER_FABRICATION'
  | 'LABORATORY'
  | 'CLASSROOM'
  | 'SEMINAR_HALL'
  | 'AUDITORIUM'
  | 'CONFERENCE_ROOM'
  | 'WORKSHOP'
  | 'OTHER';

export type ConditionGrade = 'EXCELLENT' | 'GOOD' | 'MINOR_ISSUES' | 'DAMAGED' | 'OTHER';

export interface Resource {
  _id: string;
  name: string;
  code: string;
  category: ResourceCategory;
  description: string;
  image?: string;
  department: {
    _id: string;
    name: string;
    code: string;
    location?: string;
  };
  location: string;
  manager: {
    _id: string;
    name: string;
    email: string;
  };
  resourceType: 'INDIVIDUAL' | 'POOLED';
  capacity?: number;
  totalQuantity: number;
  availableQuantity: number;
  operationalStatus: 'AVAILABLE' | 'MAINTENANCE' | 'DECOMMISSIONED';
  operatingHours: {
    start: string;
    end: string;
  };
  maxBookingHours: number;
  minAdvanceHours: number;
  usageInstructions?: string;
  eligibilityNotes?: string;
  requiresTraining: boolean;
  requiresSupervision: boolean;
  requiresHodApproval: boolean;
  accessories: string[];
  conditionStatus: ConditionGrade;
  maintenancePeriods?: Array<{
    startDate: string;
    endDate: string;
    reason: string;
  }>;
}

export type EventStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED_PENDING_CONFIRMATION'
  | 'APPROVED_PENDING_RESOURCE_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'WAITLISTED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type TaskStatus =
  | 'ACTIONABLE'
  | 'STAGED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED'
  | 'CANCELLED';

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  hod?: any;
}

export interface ApprovalTask {
  _id: string;
  request: EventRequest | string;
  stage: ApprovalStageName;
  assignedReviewer?: User | string;
  assignedReviewerRole: UserRole;
  department?: Department | string;
  status: TaskStatus;
  decisionReason?: string;
  decisionTimestamp?: string;
  reassignmentHistory?: Array<{
    fromReviewer?: User | string;
    toReviewer: User | string;
    reassignedAt: string;
    reason: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalStageName =
  | 'FACULTY_REVIEW'
  | 'HOD_REVIEW'
  | 'RESOURCE_MANAGER_REVIEW'
  | 'COMPLETED'
  | 'REJECTED';

export interface EventRequest {
  _id: string;
  requestNumber: string;
  title: string;
  description: string;
  eventType: string;
  organizingClub: {
    _id: string;
    name: string;
    code: string;
    category: string;
    monthlyBookingQuota?: number;
  };
  organizer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    studentOrEmpId?: string;
  };
  department: {
    _id: string;
    name: string;
    code: string;
  };
  facultyCoordinator: {
    _id: string;
    name: string;
    email: string;
  };
  venue?: Resource;
  startDate: string;
  endDate: string;
  setupMinutes: number;
  cleanupMinutes: number;
  expectedAttendance: number;
  purpose?: string;
  status: EventStatus;
  currentApprovalStage: ApprovalStageName;
  requiresHodApproval: boolean;
  changeNotes?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface Reservation {
  _id: string;
  event: string | EventRequest;
  resource: Resource;
  quantity: number;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'WAITLISTED' | 'CHECKED_OUT' | 'RETURNED' | 'CANCELLED';
  waitlistPosition: number;
  initialCondition?: ConditionGrade;
  finalCondition?: ConditionGrade;
}

export interface ApprovalDecision {
  _id: string;
  stage: ApprovalStageName;
  reviewer: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  reviewerRole: string;
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  reason: string;
  previousState: string;
  resultingState: string;
  createdAt: string;
}

export interface HandoverRecord {
  _id: string;
  event: EventRequest;
  reservation?: Reservation;
  resource: Resource;
  borrower: User;
  manager: User;
  quantityHandedOver: number;
  checkoutTime: string;
  initialCondition: ConditionGrade;
  initialNotes?: string;
  initialAccessoriesConfirmed: boolean;
  returnTime?: string;
  finalCondition?: ConditionGrade;
  finalNotes?: string;
  finalAccessoriesConfirmed?: boolean;
  discrepancyFlagged: boolean;
  status: 'CHECKED_OUT' | 'RETURNED' | 'COMPLETED' | 'DISCREPANCY_FLAGGED';
}

export interface Incident {
  _id: string;
  incidentNumber: string;
  event?: EventRequest;
  resource?: Resource;
  reporter: User;
  category: string;
  description: string;
  evidence: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'AWAITING_INFORMATION' | 'RESOLVED' | 'CLOSED';
  assignedReviewer?: User;
  reviewNotes?: string;
  findings?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionLink?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actor?: User;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}
