/** Shared vocabulary for future server-authorized portals; these are not auth controls. */
export const roles = ["parent", "school_owner", "school_staff", "inspector", "moderator", "admin", "super_admin"] as const;
export type Role = (typeof roles)[number];
export const applicationStatuses = ["Draft", "Submitted", "Documents Review", "Assessment Scheduled", "Under Review", "Offer Made", "Accepted", "Declined", "Withdrawn"] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];
export type ApplicationStatusEvent = { applicationId: string; from: ApplicationStatus; to: ApplicationStatus; actorId: string; occurredAt: string; reason?: string };
export const mediaCategories = ["Campus", "Early Years", "Nursery Classrooms", "Classrooms", "Primary Classrooms", "Secondary Classrooms", "Science Laboratory", "ICT Laboratory", "Library", "Sports", "Basketball Court", "Playground", "Transportation", "Dining", "Kitchen", "Sick Bay", "Toilets", "Boarding", "Security", "3D Renderings", "Other"] as const;
export type MediaCategory = (typeof mediaCategories)[number];
