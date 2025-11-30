import type { Metadata } from 'next';
import { config } from '@/config';

export const metadata: Metadata = {
  title: `${config.app.name} · Communication`,
};

export default function CommunicationPage() {
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
          Communication page coming soon...
        </p>
      </div>
    </div>
  );
}
