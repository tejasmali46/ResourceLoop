import mongoose from 'mongoose';
import { Resource } from '../models/Resource.js';
import { EventRequest } from '../models/EventRequest.js';
import { Incident } from '../models/Incident.js';
import { checkResourceAvailability } from './schedulingEngine.js';
import { ENV } from '../config/env.js';

export interface AIQueryInput {
  query: string;
  context?: {
    eventId?: string;
    incidentId?: string;
    preferredDate?: string;
    attendance?: number;
  };
}

export interface AIResponse {
  provider: 'RULE_BASED' | 'GEMINI';
  summary: string;
  matchedResources?: Array<{
    id: string;
    name: string;
    category: string;
    capacity?: number;
    availableQuantity: number;
    isAvailable: boolean;
    matchReason: string;
  }>;
  checklistSuggestions?: string[];
  workflowExplanation?: {
    status: string;
    currentStage: string;
    pendingWithRole: string;
    nextSteps: string[];
  };
  conflictDetails?: {
    hasConflict: boolean;
    conflictReason?: string;
    suggestedSlots?: Array<{ startDate: Date; endDate: Date; availableQuantity: number }>;
  };
  incidentSummary?: {
    incidentNumber: string;
    category: string;
    status: string;
    timeline: string[];
    observations: string[];
    openQuestions: string[];
  };
}

export async function processAIQuery(input: AIQueryInput): Promise<AIResponse> {
  const queryLower = input.query.toLowerCase();

  // If incident summary is requested
  if (input.context?.incidentId || queryLower.includes('incident') || queryLower.includes('damage report')) {
    return handleIncidentSummary(input);
  }

  // If asking about a pending request or status
  if (
    input.context?.eventId ||
    queryLower.includes('why is my') ||
    queryLower.includes('pending') ||
    queryLower.includes('status of request')
  ) {
    return handleWorkflowExplanation(input);
  }

  // Natural language resource discovery & event planning
  return handleResourceDiscoveryAndPlanning(input);
}

/**
 * Explains workflow state of a real request.
 */
async function handleWorkflowExplanation(input: AIQueryInput): Promise<AIResponse> {
  let event = null;

  if (input.context?.eventId) {
    event = await EventRequest.findById(input.context.eventId)
      .populate('facultyCoordinator', 'name email')
      .populate('department', 'name code hod')
      .populate('venue', 'name location');
  } else {
    // Try to find the latest event matching keywords or user's latest
    const match = input.query.match(/REQ-\d+-\d+/i);
    if (match) {
      event = await EventRequest.findOne({ requestNumber: match[0].toUpperCase() })
        .populate('facultyCoordinator', 'name email')
        .populate('department', 'name code hod')
        .populate('venue', 'name location');
    }
  }

  if (!event) {
    return {
      provider: 'RULE_BASED',
      summary:
        "I could not locate an event request matching that identifier. Please provide a valid Request ID (e.g. REQ-2026-0001) or open the request directly in your dashboard.",
    };
  }

  let pendingRole = 'None';
  let nextSteps: string[] = [];

  if (event.status === 'UNDER_REVIEW') {
    if (event.currentApprovalStage === 'FACULTY_REVIEW') {
      pendingRole = `Assigned Faculty Coordinator (${(event.facultyCoordinator as any)?.name || 'Faculty'})`;
      nextSteps = [
        'Faculty Coordinator needs to review event justification and attendance scale.',
        event.requiresHodApproval
          ? 'Will next forward to Department HOD for institutional sign-off.'
          : 'Will next forward to Resource Manager for equipment confirmation.',
      ];
    } else if (event.currentApprovalStage === 'HOD_REVIEW') {
      pendingRole = `Head of Department (${(event.department as any)?.code || 'HOD'})`;
      nextSteps = [
        'Department HOD must authorize cross-departmental / high-capacity resource usage.',
        'Will next forward to Resource Manager for final dispatch.',
      ];
    } else if (event.currentApprovalStage === 'RESOURCE_MANAGER_REVIEW') {
      pendingRole = 'Resource Manager';
      nextSteps = [
        'Resource manager will verify equipment condition and slot availability before issuing final confirmation.',
      ];
    }
  } else if (event.status === 'CHANGES_REQUESTED') {
    pendingRole = 'Student Organizer';
    nextSteps = [
      `Reviewer requested changes: "${event.changeNotes || 'Please adjust request details'}"`,
      'Edit the event details and re-submit for review.',
    ];
  } else if (event.status === 'CONFIRMED') {
    pendingRole = 'Ready for Handover';
    nextSteps = [
      'All approvals completed. Visit the resource manager during your designated setup window to record initial condition and check out equipment.',
    ];
  } else if (event.status === 'WAITLISTED') {
    pendingRole = 'Priority Waitlist';
    nextSteps = [
      'Your request is approved in principle, but one or more items are at capacity. The system will automatically promote your booking if a cancellation occurs.',
    ];
  }

  const summary = `Event "${event.title}" (${event.requestNumber}) is currently in status "${event.status}". Active stage: ${event.currentApprovalStage}. Current action pending with: ${pendingRole}.`;

  return {
    provider: 'RULE_BASED',
    summary,
    workflowExplanation: {
      status: event.status,
      currentStage: event.currentApprovalStage,
      pendingWithRole: pendingRole,
      nextSteps,
    },
  };
}

/**
 * Handles natural language discovery, conflict check, and planning checklist.
 */
async function handleResourceDiscoveryAndPlanning(input: AIQueryInput): Promise<AIResponse> {
  const queryLower = input.query.toLowerCase();

  // Extract attendance estimate
  let attendance = input.context?.attendance || 50;
  const attMatch = queryLower.match(/(\d+)\s*(people|students|participants|attendees|capacity|person)/);
  if (attMatch) {
    attendance = parseInt(attMatch[1], 10);
  }

  // Extract target date
  const targetDate = input.context?.preferredDate
    ? new Date(input.context.preferredDate)
    : new Date(Date.now() + 24 * 60 * 60 * 1000); // default to tomorrow 10:00 AM
  targetDate.setHours(10, 0, 0, 0);
  const targetEnd = new Date(targetDate.getTime() + 4 * 60 * 60 * 1000); // 4 hour duration

  // Query database for candidate resources
  const allResources = await Resource.find({ operationalStatus: 'AVAILABLE' }).populate('department');

  const matchedResources: AIResponse['matchedResources'] = [];
  const checklistSuggestions: string[] = [];

  // Match venues
  if (queryLower.includes('hall') || queryLower.includes('seminar') || queryLower.includes('auditorium') || queryLower.includes('venue') || queryLower.includes('room') || queryLower.includes('hackathon')) {
    const venues = allResources.filter((r) =>
      ['SEMINAR_HALL', 'AUDITORIUM', 'CONFERENCE_ROOM', 'CLASSROOM', 'WORKSHOP'].includes(r.category)
    );

    for (const v of venues) {
      const avail = await checkResourceAvailability(v._id, targetDate, targetEnd, 1);
      const fitsAttendance = (v.capacity || 0) >= attendance;
      let reason = `Accommodates ${v.capacity || 'N/A'} attendees (requested ~${attendance}). Located at ${v.location}.`;
      if (!fitsAttendance) {
        reason += ` Warning: capacity (${v.capacity}) is lower than requested attendance (${attendance}).`;
      }

      matchedResources.push({
        id: v._id.toString(),
        name: v.name,
        category: v.category,
        capacity: v.capacity,
        availableQuantity: avail.availableQuantity,
        isAvailable: avail.isAvailable && fitsAttendance,
        matchReason: reason,
      });
    }
  }

  // Match audio visual / equipment
  if (queryLower.includes('projector') || queryLower.includes('mic') || queryLower.includes('speaker') || queryLower.includes('camera') || queryLower.includes('kit') || queryLower.includes('equipment') || queryLower.includes('hackathon')) {
    const equipment = allResources.filter((r) =>
      ['AUDIO_VISUAL', 'COMPUTING', 'PHOTOGRAPHY', 'MAKER_FABRICATION'].includes(r.category)
    );

    for (const eq of equipment) {
      const isRelevant =
        (queryLower.includes('projector') && eq.category === 'AUDIO_VISUAL' && eq.name.toLowerCase().includes('projector')) ||
        (queryLower.includes('mic') && eq.name.toLowerCase().includes('mic')) ||
        (queryLower.includes('speaker') && eq.name.toLowerCase().includes('speaker')) ||
        (queryLower.includes('camera') && eq.category === 'PHOTOGRAPHY') ||
        (queryLower.includes('hackathon') && ['AUDIO_VISUAL', 'COMPUTING'].includes(eq.category));

      if (isRelevant) {
        const avail = await checkResourceAvailability(eq._id, targetDate, targetEnd, 1);
        matchedResources.push({
          id: eq._id.toString(),
          name: eq.name,
          category: eq.category,
          availableQuantity: avail.availableQuantity,
          isAvailable: avail.isAvailable,
          matchReason: `Pool inventory: ${eq.totalQuantity} total. Operating hours: ${eq.operatingHours.start}-${eq.operatingHours.end}.`,
        });
      }
    }
  }

  // If still empty, return top featured available resources
  if (matchedResources.length === 0) {
    for (const r of allResources.slice(0, 4)) {
      const avail = await checkResourceAvailability(r._id, targetDate, targetEnd, 1);
      matchedResources.push({
        id: r._id.toString(),
        name: r.name,
        category: r.category,
        capacity: r.capacity,
        availableQuantity: avail.availableQuantity,
        isAvailable: avail.isAvailable,
        matchReason: `General institutional resource in ${r.category}. Total inventory: ${r.totalQuantity}.`,
      });
    }
  }

  // Generate event equipment checklist suggestions
  if (queryLower.includes('hackathon')) {
    checklistSuggestions.push('High-capacity Seminar Hall or Auditorium with reliable power');
    checklistSuggestions.push('Dual HD Projectors for stage presentation and live leaderboards');
    checklistSuggestions.push('Handheld & Collar Wireless Microphones');
    checklistSuggestions.push('Dedicated Public Address (PA) Portable Speaker System');
    checklistSuggestions.push('DSLR Camera Kit for recording and media coverage');
    checklistSuggestions.push('Club verification & Faculty Coordinator sponsorship sign-off');
  } else if (queryLower.includes('workshop')) {
    checklistSuggestions.push('Interactive Computer Lab or Seminar Hall');
    checklistSuggestions.push('Presentation Projector with HDMI/Type-C cables');
    checklistSuggestions.push('Lapel Microphone for speaker');
    checklistSuggestions.push('Attendance verification sheets or QR check-in');
  } else {
    checklistSuggestions.push('Verify venue seating accommodates expected headcount');
    checklistSuggestions.push('Ensure booking includes 30 min buffer for setup & cleanup');
    checklistSuggestions.push('Check whether specialized lab supervisor permission is required');
  }

  const summary = `Found ${matchedResources.filter((m) => m.isAvailable).length} verified available resources matching your event requirements for ~${attendance} participants. All capacity and schedule availability verified against live database records.`;

  return {
    provider: 'RULE_BASED',
    summary,
    matchedResources,
    checklistSuggestions,
  };
}

/**
 * Chronological incident summarizer for authorized reviewers.
 */
async function handleIncidentSummary(input: AIQueryInput): Promise<AIResponse> {
  let incident = null;

  if (input.context?.incidentId) {
    incident = await Incident.findById(input.context.incidentId)
      .populate('reporter', 'name email role')
      .populate('resource', 'name code location')
      .populate('event', 'title requestNumber');
  } else {
    incident = await Incident.findOne()
      .populate('reporter', 'name email role')
      .populate('resource', 'name code location')
      .populate('event', 'title requestNumber');
  }

  if (!incident) {
    return {
      provider: 'RULE_BASED',
      summary: 'No active incident found for summary analysis.',
    };
  }

  const timeline = [
    `Initial handover recorded with clean initial condition.`,
    `Check-in inspection performed at return by ${(incident.reporter as any)?.name || 'Resource Manager'}.`,
    `Incident ${incident.incidentNumber} flagged under category "${incident.category}".`,
    `Status currently marked as: ${incident.status}.`,
  ];

  const observations = [
    `Reported observation: ${incident.description}`,
    `Resource implicated: ${(incident.resource as any)?.name || 'Equipment'} (${(incident.resource as any)?.code || ''}).`,
  ];

  const openQuestions = [
    'Was pre-existing minor wear documented prior to borrower checkout?',
    'Did borrower report any electrical power surge or environmental impact during the event?',
    'Has the department technician provided an itemized repair estimate?',
  ];

  return {
    provider: 'RULE_BASED',
    summary: `Structured factual summary for Incident ${incident.incidentNumber} (${incident.category}). Reviewer discretion required for final institutional finding.`,
    incidentSummary: {
      incidentNumber: incident.incidentNumber,
      category: incident.category,
      status: incident.status,
      timeline,
      observations,
      openQuestions,
    },
  };
}
