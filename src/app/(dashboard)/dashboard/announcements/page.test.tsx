import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnnouncementsPage from './page';

const announcementsMock = vi.hoisted(() => ({
  createAnnouncement: vi.fn(),
  getAnnouncements: vi.fn(),
  updateAnnouncement: vi.fn(),
  deleteAnnouncement: vi.fn(),
  getAnnouncementReaders: vi.fn(),
  getDepartments: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/app/actions/announcements', () => announcementsMock);
vi.mock('sonner', () => ({ toast: toastMock }));

describe('AnnouncementsPage schedule flow', () => {
  beforeEach(() => {
    announcementsMock.getAnnouncements.mockResolvedValue([]);
    announcementsMock.getAnnouncementReaders.mockResolvedValue([]);
    announcementsMock.getDepartments.mockResolvedValue([]);
    announcementsMock.createAnnouncement.mockResolvedValue({ success: true });
    announcementsMock.updateAnnouncement.mockResolvedValue({ success: true });
    toastMock.success.mockClear();
    toastMock.error.mockClear();
  });

  it('schedules a new announcement', async () => {
    const user = userEvent.setup();
    render(<AnnouncementsPage />);

    await screen.findByRole('button', { name: /new announcement/i });

    await user.click(screen.getByRole('button', { name: /new announcement/i }));

    await user.type(
      screen.getByPlaceholderText(/office closure notice/i),
      'Maintenance Window'
    );
    await user.type(
      screen.getByPlaceholderText(/write your announcement here/i),
      'We will be offline tonight.'
    );

    await user.click(screen.getByLabelText(/schedule for later/i));

    const scheduledDate = '2030-01-01T09:30';

    await waitFor(() => {
      expect(
        document.querySelector('input[type="datetime-local"]')
      ).not.toBeNull();
    });

    const dateInput = document.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;

    fireEvent.change(dateInput, { target: { value: scheduledDate } });

    await waitFor(() => {
      expect(dateInput.value).toBe(scheduledDate);
    });

    await user.click(screen.getByRole('button', { name: /^schedule$/i }));

    await waitFor(() => {
      expect(announcementsMock.createAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Maintenance Window',
          content: 'We will be offline tonight.',
          audience: 'All Staff',
          pinned: false,
          status: 'Scheduled',
          scheduledAt: new Date(scheduledDate).toISOString(),
        })
      );
    });

    expect(toastMock.success).toHaveBeenCalledWith('Announcement saved!');
  });

  it('requires a schedule date before saving', async () => {
    const user = userEvent.setup();
    render(<AnnouncementsPage />);

    await screen.findByRole('button', { name: /new announcement/i });

    await user.click(screen.getByRole('button', { name: /new announcement/i }));

    await user.type(
      screen.getByPlaceholderText(/office closure notice/i),
      'Maintenance Window'
    );
    await user.type(
      screen.getByPlaceholderText(/write your announcement here/i),
      'We will be offline tonight.'
    );

    await user.click(screen.getByLabelText(/schedule for later/i));
    await user.click(screen.getByRole('button', { name: /^schedule$/i }));

    expect(toastMock.error).toHaveBeenCalledWith(
      'Please select a date for scheduling'
    );
    expect(announcementsMock.createAnnouncement).not.toHaveBeenCalled();
  });

  it('updates a scheduled announcement date', async () => {
    const user = userEvent.setup();
    announcementsMock.getAnnouncements.mockResolvedValue([
      {
        id: 'ann-1',
        title: 'Scheduled Update',
        content: 'Follow the plan.',
        audience: 'All Staff',
        pinned: false,
        status: 'Scheduled',
        scheduled_at: '2030-02-01T10:00:00.000Z',
        created_at: '2030-01-01T09:00:00.000Z',
      },
    ]);

    render(<AnnouncementsPage />);

    await screen.findByRole('button', { name: /edit announcement/i });

    await user.click(
      screen.getByRole('button', { name: /edit announcement/i })
    );

    const newScheduledDate = '2030-02-02T11:15';

    await waitFor(() => {
      expect(
        document.querySelector('input[type="datetime-local"]')
      ).not.toBeNull();
    });

    const dateInput = document.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;

    fireEvent.change(dateInput, { target: { value: newScheduledDate } });

    await waitFor(() => {
      expect(dateInput.value).toBe(newScheduledDate);
    });

    await user.click(screen.getByRole('button', { name: /^schedule$/i }));

    await waitFor(() => {
      expect(announcementsMock.updateAnnouncement).toHaveBeenCalledWith(
        'ann-1',
        expect.objectContaining({
          title: 'Scheduled Update',
          content: 'Follow the plan.',
          audience: 'All Staff',
          pinned: false,
          status: 'Scheduled',
          scheduledAt: new Date(newScheduledDate).toISOString(),
        })
      );
    });
  });

  it('toggles between publish and schedule actions', async () => {
    const user = userEvent.setup();
    render(<AnnouncementsPage />);

    await screen.findByRole('button', { name: /new announcement/i });

    await user.click(screen.getByRole('button', { name: /new announcement/i }));

    await user.type(
      screen.getByPlaceholderText(/office closure notice/i),
      'Immediate Update'
    );
    await user.type(
      screen.getByPlaceholderText(/write your announcement here/i),
      'Publishing immediately.'
    );

    expect(
      screen.getByRole('button', { name: /^publish$/i })
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText(/schedule for later/i));
    expect(
      screen.getByRole('button', { name: /^schedule$/i })
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText(/schedule for later/i));
    expect(
      screen.getByRole('button', { name: /^publish$/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^publish$/i }));

    await waitFor(() => {
      expect(announcementsMock.createAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Immediate Update',
          content: 'Publishing immediately.',
          audience: 'All Staff',
          pinned: false,
          status: 'Published',
          scheduledAt: null,
        })
      );
    });
  });

  it('publishes a scheduled announcement immediately on edit', async () => {
    const user = userEvent.setup();
    announcementsMock.getAnnouncements.mockResolvedValue([
      {
        id: 'ann-2',
        title: 'Scheduled Plan',
        content: 'Hold for later.',
        audience: 'All Staff',
        pinned: false,
        status: 'Scheduled',
        scheduled_at: '2030-03-01T08:00:00.000Z',
        created_at: '2030-02-01T09:00:00.000Z',
      },
    ]);

    render(<AnnouncementsPage />);

    await screen.findByRole('button', { name: /edit announcement/i });

    await user.click(
      screen.getByRole('button', { name: /edit announcement/i })
    );

    const scheduleToggle = screen.getByLabelText(/schedule for later/i);
    await user.click(scheduleToggle);

    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(announcementsMock.updateAnnouncement).toHaveBeenCalledWith(
        'ann-2',
        expect.objectContaining({
          title: 'Scheduled Plan',
          content: 'Hold for later.',
          audience: 'All Staff',
          pinned: false,
          status: 'Published',
          scheduledAt: null,
        })
      );
    });
  });
});
