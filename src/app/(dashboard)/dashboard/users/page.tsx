import type { Metadata } from 'next';
import StaffDirectoryClient from './StaffDirectoryClient';

export const metadata: Metadata = {
  title: 'Staff Directory · Dashboard',
};

export default function DashboardUsersPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Staff Directory</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            View details of all employees in the organization.
          </p>
        </div>
      </header>

      <StaffDirectoryClient />
    </div>
  );
}
