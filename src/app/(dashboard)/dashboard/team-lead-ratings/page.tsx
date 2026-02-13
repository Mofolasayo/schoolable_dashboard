'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Search,
  Loader2,
} from 'lucide-react';
import {
  getTeamLeadsForRating,
  getAuraAlerts,
  submitTeamLeadRating,
  acknowledgeAuraAlert,
  getTeamLeadRatingHistory,
  type TeamLeadForRating,
  type AuraAlert,
  type AlertSummary,
  type RatingFormData,
} from '@/app/actions/team-lead-ratings';
import { getStaffAvatarUrl } from '@/lib/avatar';

type TeamLead = TeamLeadForRating;

const getTeamLeadAvatar = (lead: TeamLead) =>
  getStaffAvatarUrl({
    avatar_url: lead.avatar_url ?? lead.avatarUrl ?? undefined,
    gender: lead.gender ?? null,
    employee_id: lead.employee_id ?? lead.employeeId ?? undefined,
    id: lead.id,
    email: lead.email,
    full_name: lead.name,
    role: lead.role ?? null,
  });

// Star Rating Component
function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hovered || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 self-center text-sm text-gray-500">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );
}

// Alert Badge Component
function AlertBadge({ type }: { type: string }) {
  const config: Record<
    string,
    { color: string; icon: React.ReactNode; label: string }
  > = {
    SCORE_DROP: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <TrendingDown className="h-3 w-3" />,
      label: 'Score Drop',
    },
    SCORE_INCREASE: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <TrendingUp className="h-3 w-3" />,
      label: 'Improvement',
    },
    CONSISTENT_DECLINE: {
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: <AlertTriangle className="h-3 w-3" />,
      label: 'Declining Trend',
    },
    CONSISTENT_IMPROVEMENT: {
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <TrendingUp className="h-3 w-3" />,
      label: 'Improving',
    },
  };

  const { color, icon, label } = config[type] || {
    color: 'bg-gray-100 text-gray-800',
    icon: null,
    label: type,
  };

  return (
    <Badge className={`${color} flex items-center gap-1`}>
      {icon}
      {label}
    </Badge>
  );
}

// Main Page Component
export default function TeamLeadRatingsPage() {
  const [activeTab, setActiveTab] = useState('team-leads');
  const [teamLeads, setTeamLeads] = useState<TeamLead[]>([]);
  const [alerts, setAlerts] = useState<AuraAlert[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRated, setFilterRated] = useState<'all' | 'rated' | 'pending'>(
    'all'
  );
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [ratingLoadError, setRatingLoadError] = useState<string | null>(null);

  // Rating modal state
  const [selectedTeamLead, setSelectedTeamLead] = useState<TeamLead | null>(
    null
  );
  const [ratingForm, setRatingForm] = useState<RatingFormData>({
    leadershipScore: 0,
    teamManagementScore: 0,
    communicationScore: 0,
    resultsDeliveryScore: 0,
    cultureChampionScore: 0,
    leadershipNotes: '',
    areasOfStrength: '',
    areasForImprovement: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tlData, alertData] = await Promise.all([
        getTeamLeadsForRating(),
        getAuraAlerts(),
      ]);
      setTeamLeads(tlData.teamLeads);
      setCurrentWeek(tlData.currentWeek);
      setAlerts(alertData.alerts);
      setAlertSummary(alertData.summary);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const resetRatingForm = () => {
    setRatingForm({
      leadershipScore: 0,
      teamManagementScore: 0,
      communicationScore: 0,
      resultsDeliveryScore: 0,
      cultureChampionScore: 0,
      leadershipNotes: '',
      areasOfStrength: '',
      areasForImprovement: '',
    });
  };

  const openRatingModal = async (teamLead: TeamLead) => {
    setSelectedTeamLead(teamLead);
    setRatingLoadError(null);
    resetRatingForm();

    if (!teamLead.ratedThisWeek) {
      return;
    }

    setIsRatingLoading(true);
    try {
      const history = await getTeamLeadRatingHistory(teamLead.id);
      const ratings = history?.ratings ?? [];
      const ratingForWeek =
        ratings.find((rating) => rating.weekNumber === currentWeek) ??
        ratings[0];

      if (ratingForWeek) {
        setRatingForm({
          leadershipScore: ratingForWeek.leadershipScore || 0,
          teamManagementScore: ratingForWeek.teamManagementScore || 0,
          communicationScore: ratingForWeek.communicationScore || 0,
          resultsDeliveryScore: ratingForWeek.resultsDeliveryScore || 0,
          cultureChampionScore: ratingForWeek.cultureChampionScore || 0,
          leadershipNotes: ratingForWeek.leadershipNotes || '',
          areasOfStrength: ratingForWeek.areasOfStrength || '',
          areasForImprovement: ratingForWeek.areasForImprovement || '',
        });
      } else {
        setRatingLoadError('No rating details found for this week.');
      }
    } catch (error) {
      console.error('Error loading rating details:', error);
      setRatingLoadError('Failed to load rating details.');
    } finally {
      setIsRatingLoading(false);
    }
  };

  // Filter team leads
  const filteredTeamLeads = teamLeads.filter((tl) => {
    const matchesSearch =
      tl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tl.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterRated === 'all' ||
      (filterRated === 'rated' && tl.ratedThisWeek) ||
      (filterRated === 'pending' && !tl.ratedThisWeek);
    return matchesSearch && matchesFilter;
  });

  // Submit rating
  async function handleSubmitRating() {
    if (!selectedTeamLead) return;

    // Validate
    const hasAllScores =
      ratingForm.leadershipScore > 0 &&
      ratingForm.teamManagementScore > 0 &&
      ratingForm.communicationScore > 0 &&
      ratingForm.resultsDeliveryScore > 0 &&
      ratingForm.cultureChampionScore > 0;

    if (!hasAllScores) {
      alert('Please provide all ratings');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitTeamLeadRating(
        selectedTeamLead.id,
        ratingForm
      );
      if (!result.success) {
        alert(result.error || 'Failed to submit rating');
        return;
      }
      setSelectedTeamLead(null);
      setRatingForm({
        leadershipScore: 0,
        teamManagementScore: 0,
        communicationScore: 0,
        resultsDeliveryScore: 0,
        cultureChampionScore: 0,
        leadershipNotes: '',
        areasOfStrength: '',
        areasForImprovement: '',
      });
      loadData(); // Refresh
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  }

  // Acknowledge alert
  async function handleAcknowledgeAlert(alertId: number) {
    try {
      const result = await acknowledgeAuraAlert(alertId);
      if (!result.success) {
        console.error(result.error || 'Failed to acknowledge alert');
        return;
      }
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  // Stats
  const completedRatings = teamLeads.filter((tl) => tl.ratedThisWeek).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">
            Team Lead Ratings
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Week {currentWeek} performance reviews
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Card className="rounded-xl border border-border/40 bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-normal text-gray-800">
                {completedRatings}/{teamLeads.length}
              </p>
              <p className="text-xs text-muted-foreground">Rated this week</p>
            </CardContent>
          </Card>
          {alertSummary && alertSummary.total > 0 && (
            <Card className="rounded-xl border border-border/40 bg-white shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-normal text-gray-800">
                  {alertSummary.total}
                </p>
                <p className="text-xs text-muted-foreground">Active alerts</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2 rounded-lg border border-border/40 bg-white p-1.5 shadow-sm">
          <TabsTrigger
            value="team-leads"
            className="flex items-center gap-2 text-xs"
          >
            <Users className="h-4 w-4" />
            Team Leads ({teamLeads.length})
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="flex items-center gap-2 text-xs"
          >
            <AlertTriangle className="h-4 w-4" />
            Alerts ({alerts.length})
          </TabsTrigger>
        </TabsList>

        {/* Team Leads Tab */}
        <TabsContent value="team-leads" className="mt-8">
          <div className="space-y-5">
            {/* Search and Filter */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search team leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center gap-2">
                {['all', 'pending', 'rated'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() =>
                      setFilterRated(filter as 'all' | 'rated' | 'pending')
                    }
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      filterRated === filter
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border/40 bg-white text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    {filter === 'all'
                      ? 'All'
                      : filter === 'pending'
                        ? 'Pending'
                        : 'Rated'}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Leads Grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeamLeads.map((tl) => (
                <Card
                  key={tl.id}
                  className={`rounded-xl border border-border/40 bg-white shadow-sm transition-colors hover:bg-muted/20 ${
                    tl.ratedThisWeek ? 'ring-1 ring-emerald-200' : ''
                  }`}
                >
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getTeamLeadAvatar(tl)} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                          {tl.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold text-gray-900">
                            {tl.name}
                          </h3>
                          {tl.ratedThisWeek && (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{tl.department}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {tl.teamSize} members
                          </span>
                          {tl.lastRatingAvg && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {tl.lastRatingAvg.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        className={
                          tl.ratedThisWeek
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }
                      >
                        {tl.ratedThisWeek ? 'Rated' : 'Pending'}
                      </Badge>
                      <button
                        onClick={() => openRatingModal(tl)}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                      >
                        {tl.ratedThisWeek ? 'View Rating' : 'Rate Lead'}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {filteredTeamLeads.length === 0 && teamLeads.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-white p-12 text-center shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-sm font-medium text-gray-800">
                No team leads yet
              </h3>
              <p className="mb-4 max-w-md text-xs text-muted-foreground">
                Team leads are assigned through HR Management. Once team leads
                are configured, they will appear here for weekly performance
                ratings.
              </p>
              <a
                href="/dashboard/hr-policy"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
              >
                Go to HR Management
              </a>
            </div>
          )}

          {filteredTeamLeads.length === 0 && teamLeads.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-white p-12 text-center shadow-sm">
              <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-xs text-muted-foreground">
                No team leads match your search
              </p>
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-8">
          {alerts.length === 0 ? (
            <Card className="rounded-xl border border-border/40 bg-white shadow-sm">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                <h3 className="text-sm font-medium text-gray-800">All clear</h3>
                <p className="text-xs text-muted-foreground">
                  No active Aura alerts at this time
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className="rounded-xl border border-border/40 bg-white shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`rounded-full p-2 ${
                            alert.alertType.includes('DROP') ||
                            alert.alertType.includes('DECLINE')
                              ? 'bg-red-100'
                              : 'bg-green-100'
                          }`}
                        >
                          {alert.alertType.includes('DROP') ||
                          alert.alertType.includes('DECLINE') ? (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          ) : (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {alert.employeeName}
                            </h3>
                            <AlertBadge type={alert.alertType} />
                          </div>
                          <p className="text-sm text-gray-600">
                            {alert.message}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                            <span>{alert.department || 'No department'}</span>
                            <span>
                              {alert.previousScore?.toFixed(0)} →{' '}
                              {alert.currentScore?.toFixed(0)}(
                              {alert.changePercentage > 0 ? '+' : ''}
                              {alert.changePercentage?.toFixed(1)}%)
                            </span>
                            {alert.weeksTrending > 1 && (
                              <span>{alert.weeksTrending} weeks trending</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rating Modal */}
      {selectedTeamLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border/40 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border/40 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getTeamLeadAvatar(selectedTeamLead)} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-600">
                    {selectedTeamLead.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-sm font-medium text-gray-800">
                    {selectedTeamLead.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedTeamLead.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTeamLead(null);
                  setRatingLoadError(null);
                  resetRatingForm();
                }}
                className="rounded-md border border-border/40 bg-white px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="space-y-6 p-4">
              {isRatingLoading && (
                <div className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading rating details...
                </div>
              )}
              {ratingLoadError && (
                <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  <AlertTriangle className="h-4 w-4" />
                  {ratingLoadError}
                </div>
              )}
              {/* Rating Categories */}
              <div className="space-y-4">
                <StarRating
                  label="Leadership & Vision"
                  value={ratingForm.leadershipScore}
                  onChange={(v) =>
                    setRatingForm({ ...ratingForm, leadershipScore: v })
                  }
                />
                <StarRating
                  label="Team Management"
                  value={ratingForm.teamManagementScore}
                  onChange={(v) =>
                    setRatingForm({ ...ratingForm, teamManagementScore: v })
                  }
                />
                <StarRating
                  label="Communication"
                  value={ratingForm.communicationScore}
                  onChange={(v) =>
                    setRatingForm({ ...ratingForm, communicationScore: v })
                  }
                />
                <StarRating
                  label="Results Delivery"
                  value={ratingForm.resultsDeliveryScore}
                  onChange={(v) =>
                    setRatingForm({ ...ratingForm, resultsDeliveryScore: v })
                  }
                />
                <StarRating
                  label="Culture Champion"
                  value={ratingForm.cultureChampionScore}
                  onChange={(v) =>
                    setRatingForm({ ...ratingForm, cultureChampionScore: v })
                  }
                />
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Leadership Notes
                  </label>
                  <Textarea
                    placeholder="Any specific observations about their leadership..."
                    value={ratingForm.leadershipNotes}
                    onChange={(e) =>
                      setRatingForm({
                        ...ratingForm,
                        leadershipNotes: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Areas of Strength
                  </label>
                  <Textarea
                    placeholder="What are they doing well?"
                    value={ratingForm.areasOfStrength}
                    onChange={(e) =>
                      setRatingForm({
                        ...ratingForm,
                        areasOfStrength: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Areas for Improvement
                  </label>
                  <Textarea
                    placeholder="Where can they grow?"
                    value={ratingForm.areasForImprovement}
                    onChange={(e) =>
                      setRatingForm({
                        ...ratingForm,
                        areasForImprovement: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTeamLead(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitRating} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
