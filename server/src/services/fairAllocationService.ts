import mongoose from 'mongoose';
import { Club } from '../models/Club.js';
import { EventRequest } from '../models/EventRequest.js';

export interface FairAllocationResult {
  allowed: boolean;
  currentMonthBookings: number;
  monthlyQuota: number;
  priorityScore: number;
  explanation: string;
}

export async function evaluateClubFairUsage(
  clubId: mongoose.Types.ObjectId | string,
  eventType: string
): Promise<FairAllocationResult> {
  const club = await Club.findById(clubId);
  const quota = club?.monthlyBookingQuota || 8;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Count confirmed or in-progress events for this club this month
  const currentMonthBookings = await EventRequest.countDocuments({
    organizingClub: clubId,
    status: { $in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'UNDER_REVIEW'] },
    startDate: { $gte: startOfMonth },
  });

  if (currentMonthBookings >= quota) {
    return {
      allowed: false,
      currentMonthBookings,
      monthlyQuota: quota,
      priorityScore: 10,
      explanation: `Club has reached its monthly fair-allocation limit of ${quota} bookings (${currentMonthBookings} active/completed this month). Administrative override required.`,
    };
  }

  // Calculate explainable priority score: (100 - bookings*10) + eventTypeBonus
  let eventTypeBonus = 10;
  if (['HACKATHON', 'WORKSHOP', 'COMPETITION'].includes(eventType)) {
    eventTypeBonus = 25;
  } else if (['ORIENTATION', 'PROJECT_DEMO'].includes(eventType)) {
    eventTypeBonus = 15;
  }

  const priorityScore = Math.max(10, 100 - currentMonthBookings * 10 + eventTypeBonus);

  return {
    allowed: true,
    currentMonthBookings,
    monthlyQuota: quota,
    priorityScore,
    explanation: `Fair-use approved: ${currentMonthBookings}/${quota} monthly bookings used. Fair priority score: ${priorityScore} (includes +${eventTypeBonus} institutional event weight).`,
  };
}
