import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompliancePage from './page';

const complianceMock = vi.hoisted(() => ({
  getCompliancePolicies: vi.fn(),
  getComplianceMetrics: vi.fn(),
  createCompliancePolicy: vi.fn(),
  deleteCompliancePolicy: vi.fn(),
}));

const referenceMock = vi.hoisted(() => ({
  getReferenceData: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/app/actions/compliance', () => complianceMock);
vi.mock('@/app/actions/reference-data', () => referenceMock);
vi.mock('sonner', () => ({ toast: toastMock }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('CompliancePage policy flow', () => {
  beforeEach(() => {
    complianceMock.getCompliancePolicies.mockResolvedValue([]);
    complianceMock.getComplianceMetrics.mockResolvedValue({
      overallComplianceRate: 0,
      totalPolicies: 0,
      compliantPolicies: 0,
      atRiskPolicies: 0,
      nonCompliantPolicies: 0,
    });
    complianceMock.createCompliancePolicy.mockResolvedValue({ success: true });
    referenceMock.getReferenceData.mockResolvedValue({
      complianceCategories: ['Data Security'],
      compliancePolicyTypes: [
        { value: 'policy', label: 'Policy Acknowledgement' },
      ],
    });
    toastMock.success.mockClear();
    toastMock.error.mockClear();
  });

  it('requires title and description before creating a policy', async () => {
    const user = userEvent.setup();
    render(<CompliancePage />);

    await screen.findByRole('button', { name: /new policy/i });
    await user.click(screen.getByRole('button', { name: /new policy/i }));

    await user.click(screen.getByRole('button', { name: /create policy/i }));

    expect(toastMock.error).toHaveBeenCalledWith(
      'Please fill in all required fields'
    );
    expect(complianceMock.createCompliancePolicy).not.toHaveBeenCalled();
  });

  it('creates a policy with the provided fields', async () => {
    const user = userEvent.setup();
    render(<CompliancePage />);

    await screen.findByRole('button', { name: /new policy/i });
    await user.click(screen.getByRole('button', { name: /new policy/i }));

    await user.type(
      screen.getByPlaceholderText(/remote work security policy/i),
      'Remote Work Policy'
    );
    await user.type(
      screen.getByPlaceholderText(/brief description of the policy/i),
      'Employees must encrypt devices.'
    );

    await user.click(screen.getByRole('button', { name: /create policy/i }));

    await waitFor(() => {
      expect(complianceMock.createCompliancePolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Remote Work Policy',
          category: 'Data Security',
          department: undefined,
          description: 'Employees must encrypt devices.',
          type: 'policy',
          reviewFrequencyDays: 90,
        })
      );
    });

    expect(toastMock.success).toHaveBeenCalledWith(
      'Policy created successfully'
    );
  });
});
