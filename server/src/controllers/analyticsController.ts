import { Request, Response, NextFunction } from 'express';
import { Resource } from '../models/Resource.js';
import { EventRequest } from '../models/EventRequest.js';
import { Reservation } from '../models/Reservation.js';
import { HandoverRecord } from '../models/HandoverRecord.js';
import { Incident } from '../models/Incident.js';
import { Club } from '../models/Club.js';
import { Department } from '../models/Department.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getInstitutionAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalResources,
      totalEvents,
      statusBreakdown,
      categoryCounts,
      incidentsSummary,
      activeHandoversCount,
      departments,
      clubs,
    ] = await Promise.all([
      Resource.countDocuments({ operationalStatus: 'AVAILABLE' }),
      EventRequest.countDocuments(),
      EventRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Resource.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, totalUnits: { $sum: '$totalQuantity' } } },
      ]),
      Incident.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      HandoverRecord.countDocuments({ status: 'CHECKED_OUT' }),
      Department.find().select('name code'),
      Club.find().select('name code category monthlyBookingQuota'),
    ]);

    // Format status counts cleanly
    const eventsByStatus: Record<string, number> = {};
    for (const item of statusBreakdown) {
      eventsByStatus[item._id] = item.count;
    }

    // Incidents formatted
    const incidentsByStatus: Record<string, number> = {};
    for (const item of incidentsSummary) {
      incidentsByStatus[item._id] = item.count;
    }

    // Departmental distribution of events
    const departmentEvents = await EventRequest.aggregate([
      { $group: { _id: '$department', eventCount: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { name: '$dept.name', code: '$dept.code', count: '$eventCount' } },
    ]);

    // Most requested resources
    const topRequestedResources = await Reservation.aggregate([
      { $group: { _id: '$resource', totalBookings: { $sum: 1 }, totalQuantityBooked: { $sum: '$quantity' } } },
      { $sort: { totalBookings: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'resources', localField: '_id', foreignField: '_id', as: 'res' } },
      { $unwind: '$res' },
      { $project: { name: '$res.name', category: '$res.category', code: '$res.code', totalBookings: 1, totalQuantityBooked: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalResources,
        totalEvents,
        activeHandoversCount,
        eventsByStatus,
        incidentsByStatus,
        categoryCounts: categoryCounts.map((c) => ({ category: c._id, count: c.count, totalUnits: c.totalUnits })),
        departmentDemand: departmentEvents,
        topRequestedResources,
        departmentsCount: departments.length,
        clubsCount: clubs.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const userRoles = user.roles?.length ? user.roles : [user.role];

    // Student stats
    const myEvents = await EventRequest.find({ organizer: user._id });
    const pendingCount = myEvents.filter((e) => e.status === 'UNDER_REVIEW').length;
    const confirmedCount = myEvents.filter((e) => e.status === 'CONFIRMED').length;
    const changesCount = myEvents.filter((e) => e.status === 'CHANGES_REQUESTED').length;
    const waitlistedCount = myEvents.filter((e) => e.status === 'WAITLISTED').length;

    // Faculty review stats
    let facultyPendingCount = 0;
    if (userRoles.includes('FACULTY') || userRoles.includes('ADMIN')) {
      facultyPendingCount = await EventRequest.countDocuments({
        facultyCoordinator: user._id,
        currentApprovalStage: 'FACULTY_REVIEW',
        status: 'UNDER_REVIEW',
      });
    }

    // HOD review stats
    let hodPendingCount = 0;
    if (userRoles.includes('HOD') || userRoles.includes('ADMIN')) {
      hodPendingCount = await EventRequest.countDocuments({
        department: user.department,
        currentApprovalStage: 'HOD_REVIEW',
        status: 'UNDER_REVIEW',
      });
    }

    // Resource manager stats
    let managerPendingCheckout = 0;
    let managerPendingReturn = 0;
    if (userRoles.includes('RESOURCE_MANAGER') || userRoles.includes('ADMIN')) {
      managerPendingCheckout = await Reservation.countDocuments({ status: 'CONFIRMED' });
      managerPendingReturn = await HandoverRecord.countDocuments({ status: 'CHECKED_OUT' });
    }

    res.status(200).json({
      success: true,
      stats: {
        myEventsCount: myEvents.length,
        pendingCount,
        confirmedCount,
        changesCount,
        waitlistedCount,
        facultyPendingCount,
        hodPendingCount,
        managerPendingCheckout,
        managerPendingReturn,
      },
    });
  } catch (error) {
    next(error);
  }
}
