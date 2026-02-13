import type { Metadata } from 'next';
import { config } from '@/config';
import { getReferenceData } from '@/app/actions/reference-data';

export const metadata: Metadata = {
  title: `${config.app.name} · Communication`,
};

export default async function CommunicationPage() {
  let messagingEnabled = false;
  try {
    const refs = await getReferenceData();
    messagingEnabled = refs.featureFlags?.messagingEnabled ?? false;
  } catch (error) {
    console.warn('Failed to load reference data:', error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Communication</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal messaging and company announcements.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-background p-12 text-center">
        <p className="text-muted-foreground">
          {messagingEnabled
            ? 'Messaging is enabled, but this workspace is still being configured.'
            : 'Messaging is currently disabled for production. Announcements remain available in their own workspace.'}
        </p>
      </div>
    </div>
  );
}
