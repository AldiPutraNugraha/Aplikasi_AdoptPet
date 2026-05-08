import { hasRequiredMonitoringReportInput, normalizeConditionNote } from '@/lib/domain/monitoring-report';

it('normalizes monitoring condition notes', () => {
  expect(normalizeConditionNote('  Sehat\naktif, makan normal  ')).toBe('Sehat aktif, makan normal');
});

it('requires at least one condition photo before submitting a report', () => {
  expect(hasRequiredMonitoringReportInput({ conditionPhotoPaths: [], conditionNote: 'Sehat' })).toBe(false);
  expect(hasRequiredMonitoringReportInput({ conditionPhotoPaths: ['reports/adopter-1/report-1/photo.jpg'], conditionNote: '' })).toBe(
    true,
  );
});

it('rejects external URLs as condition photo references', () => {
  expect(
    hasRequiredMonitoringReportInput({ conditionPhotoPaths: ['https://example.com/report.jpg'], conditionNote: '' }),
  ).toBe(false);
});
