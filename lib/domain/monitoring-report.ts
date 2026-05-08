export type MonitoringReportInput = {
  conditionPhotoPaths: string[];
  conditionNote: string;
};

export function normalizeConditionNote(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeMonitoringReportInput(input: MonitoringReportInput): MonitoringReportInput {
  return {
    conditionPhotoPaths: input.conditionPhotoPaths
      .map((path) => path.trim())
      .filter((path) => path.startsWith('reports/') && !path.includes('..') && !path.includes('//')),
    conditionNote: normalizeConditionNote(input.conditionNote),
  };
}

export function hasRequiredMonitoringReportInput(input: MonitoringReportInput) {
  return normalizeMonitoringReportInput(input).conditionPhotoPaths.length > 0;
}
