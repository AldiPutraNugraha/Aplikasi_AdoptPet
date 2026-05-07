import type { AdoptionRequestStatus, MonitoringReportStatus, PetStatus } from '@/types/domain';

export function petStatusAfterRequest(): PetStatus {
  return 'requested';
}

export function petStatusAfterApproval(): PetStatus {
  return 'adopted';
}

export function petStatusAfterMonitoring(status: MonitoringReportStatus): PetStatus {
  if (status === 'submitted') return 'monitoring_submitted';
  if (status === 'late') return 'monitoring_late';
  return 'monitoring_due';
}

export function canOwnerDecideRequest(status: AdoptionRequestStatus) {
  return status === 'pending';
}
