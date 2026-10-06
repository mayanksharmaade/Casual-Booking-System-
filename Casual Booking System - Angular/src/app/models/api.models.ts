export type Role =
  | 'SuperAdmin'
  | 'StoreManager'
  | 'AssistantManager'
  | 'Casual'
  | 'AreaManager';

export interface AuthResponse {
  token:string;
  userId:string;
  email:string;
  role:Role;
  displayName:string;
  storeId?:number|null;
}

export interface AdminDashboard {
  stores:number;
  pendingStores:number;
  casuals:number;
  pendingCasuals:number;
  areaManagers:number;
  zones:number;
  activeUsers:number;
  pendingRegistrations:number;
  activeBookings:number;
  staffingAlerts:number;
}

export interface Registration {
  userId:string;
  email:string;
  firstName:string;
  lastName:string;
  role:string;
  status:number;
  storeId?:number|null;
  storeName?:string|null;
  phone?:string|null;
  city?:string|null;
  zoneId?:number|null;
  zoneName?:string|null;
  skills:string[];
  storeCode?:string|null;
  storeAddress?:string|null;
}

export interface Zone {
  id:number;
  name:string;
  isActive:boolean;
}

export interface PayRate {
  workerKind:string;
  workerId:number;
  workerName:string;
  workerType:string;
  storeName?:string|null;
  baseHourlyRate?:number|null;
  casualLoadingPercent:number;
  saturdayLoadingPercent:number;
}

export interface PublicHoliday {
  id:number;
  holidayDate:string;
  name:string;
  isActive:boolean;
}

export interface AuditLog {
  id:number;
  userId?:string|null;
  action:string;
  entityName:string;
  entityId?:string|null;
  details?:string|null;
  createdAtUtc:string;
}

export interface UserAccount {
  userId:string;
  email:string;
  firstName:string;
  lastName:string;
  role:number;
  approvalStatus:number;
  isActive:boolean;
  storeId?:number|null;
}

export interface AdminStore {
  id:number;
  code:string;
  name:string;
  city:string;
  zoneName:string;
  registrationStatus:number;
  isActive:boolean;
}

export interface AreaManagerAdmin {
  userId:string;
  email:string;
  name:string;
  approvalStatus:number;
  isActive:boolean;
  zones:Zone[];
}

export interface SystemReport {
  from:string;
  to:string;
  totalBookings:number;
  acceptedBookings:number;
  completedBookings:number;
  cancelledBookings:number;
  expiredBookings:number;
  estimatedCasualLabourCost:number;
  activeStores:number;
  activeCasuals:number;
  staffingGapEvents:number;
  managerOverrides:number;
}

export interface DailyLabourItem {
  workerName:string;
  workerType:string;
  scheduledHours:number;
  unpaidBreakHours:number;
  paidHours:number;
  baseHourlyRate:number;
  casualLoadingPercent:number;
  saturdayLoadingPercent:number;
  effectiveHourlyRate:number;
  cost:number;
}

export interface DashboardAbsence {
  id:number;
  employeeId:number;
  employeeName:string;
  employeeType:number;
  absenceType:number;
  startDateTime:string;
  endDateTime:string;
  reason?:string|null;
}

export interface StoreDashboard {
  todayRostered:number;

  storeManagersToday:number;
  assistantManagersToday:number;
  fullTimeToday:number;
  partTimeToday:number;
  volunteersToday:number;
  casualsToday:number;

  pendingBookings:number;
  acceptedUpcoming:number;
  staffingGaps:number;

  dailyBudget:number;
  scheduledLabourCost:number;
  budgetVariance:number;
  budgetStatus:string;

  isPublicHoliday:boolean;
  publicHolidayName?:string|null;

  cancellationsLast30Days:number;

  labourItems:DailyLabourItem[];

  absenceRangeFrom:string;
  absenceRangeTo:string;

  absences:DashboardAbsence[];
}

export interface Employee {
  id:number;
  firstName:string;
  lastName:string;
  employeeType:number;
  phone?:string;
  skillSummary?:string;
  baseHourlyRate?:number|null;
  isActive:boolean;
}

export interface RosterEntry {
  id:number;
  employeeId:number;
  employeeName:string;
  employeeType:number;
  startDateTime:string;
  endDateTime:string;
  estimatedCost:number;
  isCancelled:boolean;
  isGeneratedFromPattern:boolean;
}

export interface EmployeeWorkPattern {
  id:number;
  employeeId:number;
  dayOfWeek:number;
  dayName:string;
  startTime:string;
  endTime:string;
  scheduledHours:number;
  paidHours:number;
}

export interface StaffingGap {
  rosterEntryId:number;
  employeeId:number;
  employeeName:string;
  employeeType:number;
  startDateTime:string;
  endDateTime:string;
  reason:string;
}

export interface CasualSearch {
  casualProfileId:number;
  name:string;
  city:string;
  phone:string;
  zoneId?:number|null;
  zoneName?:string|null;
  rating:number;
  skills:string[];
  isAvailable:boolean;
  isInStoreZone:boolean;
  baseHourlyRate?:number|null;
  effectiveHourlyRate?:number|null;
  paidHours:number;
  estimatedCost?:number|null;
}

export interface CasualSearchFilters {
  cities:string[];
  zones:Zone[];
  skills:{
    id:number;
    name:string;
  }[];
}

export interface Booking {
  id:number;
  storeId:number;
  storeName:string;
  casualProfileId:number;
  casualName:string;
  startDateTime:string;
  endDateTime:string;
  status:number;
  expiresAtUtc?:string|null;
  estimatedCost:number;
  cancellationReason?:string|null;
  declineReason?:string|null;
  requiredSkillId?:number|null;
  requiredSkillName?:string|null;
  isEmergency:boolean;
  hasManagerOverride:boolean;
  overrideReason?:string|null;
}

export interface StoreReport {
  from:string;
  to:string;
  rosteredEntries:number;
  staffingGaps:number;
  bookingRequests:number;
  acceptedBookings:number;
  completedBookings:number;
  cancelledBookings:number;
  rosterLabourCost:number;
  casualLabourCost:number;
  totalLabourCost:number;
  budgetAllocated:number;
  budgetVariance:number;
}

export interface CasualDashboard {
  pendingRequests:number;
  upcomingShifts:number;
  previousShifts:number;
  weeklyHours:number;
  weeklyLimit:number;
  rating:number;
  unreadNotifications:number;
  currentZoneId:number;
  currentZoneName:string;
}

export interface CasualProfile {
  id:number;
  userId:string;
  firstName:string;
  lastName:string;
  phone:string;
  city:string;
  photoUrl?:string|null;
  currentZoneId:number;
  currentZoneName:string;
  rating:number;
  skills:string[];
}

export interface Availability {
  id:number;
  startDateTime:string;
  endDateTime:string;
}

export interface AppNotification {
  id:number;
  type:string;
  title:string;
  message:string;
  isRead:boolean;
  createdAtUtc:string;
}

export interface CasualReport {
  from:string;
  to:string;
  acceptedHours:number;
  acceptedBookings:number;
  completedBookings:number;
  cancelledBookings:number;
  declinedBookings:number;
  rating:number;
  ratingCount:number;
}

export interface AreaManagerDashboard {
  assignedZones:number;
  stores:number;
  staffingGaps:number;
  pendingBookings:number;
  acceptedBookings:number;
  availableCasuals:number;
  overBudgetStores:number;
  totalScheduledLabourCost:number;
}

export interface AreaStoreSummary {
  storeId:number;
  storeCode:string;
  storeName:string;
  city:string;
  zoneId:number;
  zoneName:string;
  staffingGaps:number;
  pendingBookings:number;
  acceptedBookings:number;
  dailyBudget:number;
  scheduledLabourCost:number;
  budgetVariance:number;
  budgetStatus:string;
}

export interface AreaCasual {
  casualProfileId:number;
  name:string;
  city:string;
  currentZoneId:number;
  currentZoneName:string;
  rating:number;
  skills:string[];
  isAvailable:boolean;
}

export interface CasualTransfer {
  id:number;
  casualProfileId:number;
  casualName:string;
  fromZoneId?:number|null;
  fromZoneName?:string|null;
  toZoneId:number;
  toZoneName:string;
  reason:string;
  transferredAtUtc:string;
}

export interface AreaReport {
  from:string;
  to:string;
  stores:number;
  staffingGapEvents:number;
  bookingRequests:number;
  acceptedBookings:number;
  completedBookings:number;
  cancelledBookings:number;
  managerOverrides:number;
  estimatedLabourCost:number;
}

export const employeeTypeLabel = (value:number) =>
  ({
    1:'Casual',
    2:'Part-Time',
    3:'Full-Time',
    4:'Volunteer',
    5:'Store Manager',
    6:'Assistant Manager'
  }[value] ?? 'Unknown');

export const bookingStatusLabel = (value:number) =>
  ({
    1:'Pending',
    2:'Accepted',
    3:'Declined',
    4:'Expired',
    5:'Cancelled',
    6:'Completed'
  }[value] ?? 'Unknown');

export const absenceTypeLabel = (value:number) =>
  ({
    1:'Leave',
    2:'Sick',
    3:'Weekly Off',
    4:'Unavailable'
  }[value] ?? 'Absence');