export type Credentials = {
  email: string;
  password: string;
};

export function getCredentials(): Credentials | null {
  const email = process.env.E2E_ADMIN_EMAIL || process.env.E2E_EMAIL || '';
  const password =
    process.env.E2E_ADMIN_PASSWORD || process.env.E2E_PASSWORD || '';

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export const optionalIds = {
  aiInsightId: process.env.E2E_AI_INSIGHT_ID || '',
  employeeId: process.env.E2E_EMPLOYEE_ID || '',
  policyId: process.env.E2E_POLICY_ID || '',
};
