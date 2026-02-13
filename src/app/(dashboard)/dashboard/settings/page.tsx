'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { logout } from '@/app/login/actions';
import {
  Building2,
  Bell,
  Shield,
  Palette,
  LogOut,
  Mail,
  Smartphone,
  Moon,
  Sun,
  Monitor,
  Check,
  Camera,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getUserAvatarUrl } from '@/lib/avatar';
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getOrganizationSettings,
  updateOrganizationSettings,
  getUserPreferences,
  updateUserPreferences,
  type StaffProfile,
  type OrganizationSettings,
  type UserPreferences,
} from '@/app/actions/settings';

type SettingSection =
  | 'personal_info'
  | 'organization'
  | 'notifications'
  | 'security'
  | 'appearance';

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] =
    useState<SettingSection>('organization');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Profile State
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [organization, setOrganization] = useState<OrganizationSettings | null>(
    null
  );
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Check for tab param
    const tab = searchParams.get('tab');
    if (tab === 'personal_info') {
      setActiveSection('personal_info');
    }

    const fetchSettings = async () => {
      try {
        const [profileData, orgData, prefData] = await Promise.all([
          getMyProfile(),
          getOrganizationSettings(),
          getUserPreferences(),
        ]);

        setProfile(profileData);
        setOrganization(orgData);
        setPreferences(prefData);
        if (prefData?.theme) {
          setTheme(prefData.theme);
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
        toast.error('Failed to load settings data');
      }
    };
    fetchSettings();
  }, [searchParams]);

  const handleProfileUpdate = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const updated = await updateMyProfile({
        full_name: profile.full_name,
        job_title: profile.job_title,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
      });
      if (!updated) {
        throw new Error('Profile update failed');
      }
      setProfile(updated);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const result = await uploadAvatar(formData);
      if (!result) {
        throw new Error('Avatar upload failed');
      }
      const updated = await getMyProfile();
      if (updated) {
        setProfile(updated);
      }
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const saveOrganization = async () => {
    if (!organization) return;
    setIsSavingOrg(true);
    try {
      const updated = await updateOrganizationSettings({
        name: organization.name,
        email: organization.email,
        license: organization.license,
        address: organization.address,
      });
      if (!updated) {
        throw new Error('Organization update failed');
      }
      setOrganization(updated);
      toast.success('Organization settings updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update organization settings');
    } finally {
      setIsSavingOrg(false);
    }
  };

  const savePreferences = async (updates: Partial<UserPreferences>) => {
    setIsSavingPrefs(true);
    try {
      const updated = await updateUserPreferences(updates);
      if (!updated) {
        throw new Error('Preferences update failed');
      }
      setPreferences(updated);
      if (updated.theme) {
        setTheme(updated.theme);
      }
      toast.success('Preferences updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update preferences');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleNotificationsSave = async () => {
    if (!preferences) return;
    await savePreferences({
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      marketingNotifications: preferences.marketingNotifications,
      securityAlerts: preferences.securityAlerts,
    });
  };

  const handleThemeSave = async () => {
    await savePreferences({ theme });
  };

  const sections: {
    id: SettingSection;
    label: string;
    icon: React.ElementType;
    description: string;
  }[] = [
    {
      id: 'personal_info',
      label: 'Personal Information',
      icon: User,
      description: 'Update your personal details and photo',
    },
    {
      id: 'organization',
      label: 'Organization',
      icon: Building2,
      description: 'Manage school profile and details',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Configure system alerts',
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
      description: 'Customize the interface look and feel',
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Update password and security settings',
    },
  ];

  const organizationInitials = organization?.name
    ? organization.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'NA';

  const updateOrganizationField = (updates: Partial<OrganizationSettings>) => {
    setOrganization((prev) => ({
      id: prev?.id ?? null,
      name: prev?.name ?? null,
      email: prev?.email ?? null,
      license: prev?.license ?? null,
      address: prev?.address ?? null,
      updatedAt: prev?.updatedAt ?? null,
      updatedBy: prev?.updatedBy ?? null,
      ...updates,
    }));
  };

  const updatePreferenceField = (updates: Partial<UserPreferences>) => {
    if (!preferences) return;
    setPreferences({ ...preferences, ...updates });
  };

  const canEditPreferences = Boolean(preferences);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-normal text-gray-800">Platform Settings</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage system-wide configurations and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar / Navigation */}
        <div className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                    : 'border-border/40 bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  className={`rounded-lg p-2 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isActive ? 'text-primary' : 'text-gray-700'
                    }`}
                  >
                    {section.label}
                  </p>
                  <p className="line-clamp-1 text-[10px] text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeSection === 'personal_info' && (
            <div className="duration-300 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-800">
                  Personal Information
                </h2>
                <p className="mb-6 mt-1 text-xs text-muted-foreground">
                  View and update your personal details.
                </p>

                {/* Loading State */}
                {!profile && !isLoading && (
                  <div className="py-10 text-center text-sm text-gray-500">
                    Loading profile...
                  </div>
                )}

                {profile && (
                  <>
                    {/* Avatar */}
                    <div className="mb-8 flex items-center gap-6">
                      <div className="relative h-20 w-20 cursor-pointer">
                        <img
                          src={getUserAvatarUrl({
                            avatar_url: profile.avatar_url,
                            employee_id: profile.employee_id,
                            email: profile.email,
                            full_name: profile.full_name,
                            gender: profile.gender,
                            role: profile.role,
                          })}
                          alt="Profile"
                          className="h-full w-full rounded-full object-cover ring-4 ring-gray-50"
                        />
                        <div
                          onClick={handleAvatarClick}
                          className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white bg-primary text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                          {isUploading ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {profile.full_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {profile.role}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {profile.employee_id}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      {/* Full Name */}
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="full_name"
                          className="text-xs font-medium text-gray-700"
                        >
                          Full Name
                        </label>
                        <input
                          id="full_name"
                          type="text"
                          value={profile.full_name || ''}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              full_name: e.target.value,
                            })
                          }
                          className="rounded-md border border-border/40 bg-zinc-50/50 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      {/* Job Title */}
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="job_title"
                          className="text-xs font-medium text-gray-700"
                        >
                          Job Title
                        </label>
                        <input
                          id="job_title"
                          type="text"
                          value={profile.job_title || ''}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              job_title: e.target.value,
                            })
                          }
                          className="rounded-md border border-border/40 bg-zinc-50/50 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profile.email || ''}
                          disabled
                          className="w-full cursor-not-allowed rounded-lg border border-border/40 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(e) =>
                            setProfile({ ...profile, phone: e.target.value })
                          }
                          className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                          placeholder="+234..."
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium text-gray-700">
                          Address
                        </label>
                        <textarea
                          value={profile.address || ''}
                          onChange={(e) =>
                            setProfile({ ...profile, address: e.target.value })
                          }
                          rows={2}
                          className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium text-gray-700">
                            City
                          </label>
                          <input
                            type="text"
                            value={profile.city || ''}
                            onChange={(e) =>
                              setProfile({ ...profile, city: e.target.value })
                            }
                            className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium text-gray-700">
                            State
                          </label>
                          <input
                            type="text"
                            value={profile.state || ''}
                            onChange={(e) =>
                              setProfile({ ...profile, state: e.target.value })
                            }
                            className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 border-t border-border/40 pt-6">
                      <button className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
                        Cancel
                      </button>
                      <button
                        onClick={handleProfileUpdate}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeSection === 'organization' && (
            <div className="duration-300 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-800">
                  Organization Profile
                </h2>
                <p className="mb-6 mt-1 text-xs text-muted-foreground">
                  Update your school&apos;s official details and branding.
                </p>

                {/* Logo */}
                <div className="mb-8 flex items-center gap-6">
                  <div className="relative h-20 w-20">
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-primary/10 text-2xl font-bold text-primary">
                      {organizationInitials}
                    </div>
                    <button className="absolute -bottom-2 -right-2 rounded-full border border-white bg-white p-1.5 shadow-sm transition-colors hover:bg-gray-50">
                      <Camera className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {organization?.name || 'Organization'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {organization?.license || '—'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-gray-700">
                      School Name
                    </label>
                    <input
                      type="text"
                      value={organization?.name || ''}
                      onChange={(e) =>
                        updateOrganizationField({ name: e.target.value })
                      }
                      className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-gray-700">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={organization?.email || ''}
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-border/40 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Contact support to update your primary contact email.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-gray-700">
                      License
                    </label>
                    <input
                      type="text"
                      value={organization?.license || ''}
                      onChange={(e) =>
                        updateOrganizationField({ license: e.target.value })
                      }
                      className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      value={organization?.address || ''}
                      onChange={(e) =>
                        updateOrganizationField({ address: e.target.value })
                      }
                      rows={3}
                      className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-border/40 pt-6">
                  <button className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    onClick={saveOrganization}
                    disabled={isSavingOrg || !organization}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSavingOrg ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="duration-300 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-800">
                  Notifications
                </h2>
                <p className="mb-6 mt-1 text-xs text-muted-foreground">
                  Choose what you want to be notified about.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4 rounded-lg border border-border/40 p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 rounded-full bg-blue-50 p-2 text-blue-600">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Email Notifications
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Receive daily summaries and critical alerts via email.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={preferences?.emailNotifications ?? false}
                        onChange={(e) =>
                          updatePreferenceField({
                            emailNotifications: e.target.checked,
                          })
                        }
                        disabled={!canEditPreferences || isSavingPrefs}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-lg border border-border/40 p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 rounded-full bg-purple-50 p-2 text-purple-600">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Push Notifications
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Receive real-time alerts on your mobile device.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={preferences?.pushNotifications ?? false}
                        onChange={(e) =>
                          updatePreferenceField({
                            pushNotifications: e.target.checked,
                          })
                        }
                        disabled={!canEditPreferences || isSavingPrefs}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-lg border border-border/40 p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 rounded-full bg-emerald-50 p-2 text-emerald-600">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Product Updates
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Stay informed about new features and announcements.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={preferences?.marketingNotifications ?? false}
                        onChange={(e) =>
                          updatePreferenceField({
                            marketingNotifications: e.target.checked,
                          })
                        }
                        disabled={!canEditPreferences || isSavingPrefs}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-lg border border-border/40 p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 rounded-full bg-amber-50 p-2 text-amber-600">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Security Alerts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Get notified about login attempts and password
                          changes.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={preferences?.securityAlerts ?? false}
                        onChange={(e) =>
                          updatePreferenceField({
                            securityAlerts: e.target.checked,
                          })
                        }
                        disabled={!canEditPreferences || isSavingPrefs}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20"></div>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleNotificationsSave}
                      disabled={!canEditPreferences || isSavingPrefs}
                      className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isSavingPrefs ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="duration-300 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-800">
                  Interface Theme
                </h2>
                <p className="mb-6 mt-1 text-xs text-muted-foreground">
                  Select your preferred interface appearance.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <button
                    onClick={() => setTheme('light')}
                    disabled={!canEditPreferences || isSavingPrefs}
                    className={`relative flex flex-col items-center gap-3 rounded-xl border p-4 transition-all ${
                      theme === 'light'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border/40 hover:bg-gray-50'
                    }`}
                  >
                    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
                      <Sun className="h-6 w-6 text-orange-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      Light
                    </span>
                    {theme === 'light' && (
                      <div className="absolute right-3 top-3 text-primary">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    disabled={!canEditPreferences || isSavingPrefs}
                    className={`relative flex flex-col items-center gap-3 rounded-xl border p-4 transition-all ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border/40 hover:bg-gray-50'
                    }`}
                  >
                    <div className="rounded-lg bg-gray-900 p-4 shadow-sm ring-1 ring-white/10">
                      <Moon className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      Dark
                    </span>
                    {theme === 'dark' && (
                      <div className="absolute right-3 top-3 text-primary">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    disabled={!canEditPreferences || isSavingPrefs}
                    className={`relative flex flex-col items-center gap-3 rounded-xl border p-4 transition-all ${
                      theme === 'system'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border/40 hover:bg-gray-50'
                    }`}
                  >
                    <div className="rounded-lg bg-gray-100 p-4 shadow-sm ring-1 ring-gray-900/5">
                      <Monitor className="h-6 w-6 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      System
                    </span>
                    {theme === 'system' && (
                      <div className="absolute right-3 top-3 text-primary">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleThemeSave}
                    disabled={!canEditPreferences || isSavingPrefs}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSavingPrefs ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="duration-300 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-6">
                <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-medium text-gray-800">
                    Change Password
                  </h2>
                  <p className="mb-6 mt-1 text-xs text-muted-foreground">
                    Ensure your account is secure along with a strong password.
                  </p>

                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-gray-700">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50/50 p-6">
                  <h2 className="text-lg font-medium text-red-900">
                    Danger Zone
                  </h2>
                  <p className="mt-1 text-xs text-red-600/80">
                    Irreversible and destructive actions.
                  </p>

                  <div className="mt-6 flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Sign out of all devices
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        You will be logged out of your current session.
                      </p>
                    </div>
                    <form action={logout}>
                      <Button
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-120px)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
