"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Users, Star, TrendingUp, TrendingDown, AlertTriangle,
    CheckCircle2, ChevronRight, Search
} from "lucide-react";

// Types
interface TeamLead {
    id: string;
    name: string;
    email: string;
    department: string;
    avatarUrl: string | null;
    ratedThisWeek: boolean;
    teamSize: number;
    lastRatingAvg: number | null;
    lastRatingWeek: number | null;
}

interface AuraAlert {
    id: number;
    employeeId: string;
    employeeName: string;
    department: string | null;
    alertType: string;
    previousScore: number;
    currentScore: number;
    changePercentage: number;
    message: string;
    weeksTrending: number;
    createdAt: string;
    isRead: boolean;
}

interface RatingFormData {
    leadershipScore: number;
    teamManagementScore: number;
    communicationScore: number;
    resultsDeliveryScore: number;
    cultureChampionScore: number;
    leadershipNotes: string;
    areasOfStrength: string;
    areasForImprovement: string;
}

// API functions
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
}

async function fetchTeamLeads(): Promise<{ teamLeads: TeamLead[]; currentWeek: number; currentYear: number }> {
    const res = await fetch(`${API_BASE}/api/admin/ratings/team-leads`, {
        headers: await getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch team leads");
    return res.json();
}

interface AlertSummary {
    total: number;
    scoreDrops: number;
    consistentDeclines: number;
    improvements: number;
}

async function fetchAlerts(): Promise<{ alerts: AuraAlert[]; summary: AlertSummary | null }> {
    const res = await fetch(`${API_BASE}/api/admin/ratings/alerts`, {
        headers: await getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch alerts");
    return res.json();
}

async function submitRating(teamLeadId: string, data: RatingFormData): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/ratings/team-leads/${teamLeadId}`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit rating");
}

async function acknowledgeAlert(alertId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/ratings/alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: await getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to acknowledge alert");
}

// Star Rating Component
function StarRating({
    value,
    onChange,
    label
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
                            className={`h-8 w-8 ${star <= (hovered || value)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                                }`}
                        />
                    </button>
                ))}
                <span className="ml-2 self-center text-sm text-gray-500">
                    {value > 0 ? `${value}/5` : "Not rated"}
                </span>
            </div>
        </div>
    );
}

// Alert Badge Component
function AlertBadge({ type }: { type: string }) {
    const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
        SCORE_DROP: {
            color: "bg-red-100 text-red-800 border-red-200",
            icon: <TrendingDown className="h-3 w-3" />,
            label: "Score Drop"
        },
        SCORE_INCREASE: {
            color: "bg-green-100 text-green-800 border-green-200",
            icon: <TrendingUp className="h-3 w-3" />,
            label: "Improvement"
        },
        CONSISTENT_DECLINE: {
            color: "bg-orange-100 text-orange-800 border-orange-200",
            icon: <AlertTriangle className="h-3 w-3" />,
            label: "Declining Trend"
        },
        CONSISTENT_IMPROVEMENT: {
            color: "bg-emerald-100 text-emerald-800 border-emerald-200",
            icon: <TrendingUp className="h-3 w-3" />,
            label: "Improving"
        },
    };

    const { color, icon, label } = config[type] || {
        color: "bg-gray-100 text-gray-800",
        icon: null,
        label: type
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
    const [activeTab, setActiveTab] = useState("team-leads");
    const [teamLeads, setTeamLeads] = useState<TeamLead[]>([]);
    const [alerts, setAlerts] = useState<AuraAlert[]>([]);
    const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
    const [currentWeek, setCurrentWeek] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRated, setFilterRated] = useState<"all" | "rated" | "pending">("all");

    // Rating modal state
    const [selectedTeamLead, setSelectedTeamLead] = useState<TeamLead | null>(null);
    const [ratingForm, setRatingForm] = useState<RatingFormData>({
        leadershipScore: 0,
        teamManagementScore: 0,
        communicationScore: 0,
        resultsDeliveryScore: 0,
        cultureChampionScore: 0,
        leadershipNotes: "",
        areasOfStrength: "",
        areasForImprovement: "",
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
                fetchTeamLeads(),
                fetchAlerts(),
            ]);
            setTeamLeads(tlData.teamLeads);
            setCurrentWeek(tlData.currentWeek);
            setAlerts(alertData.alerts);
            setAlertSummary(alertData.summary);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }

    // Filter team leads
    const filteredTeamLeads = teamLeads.filter((tl) => {
        const matchesSearch = tl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tl.department?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterRated === "all" ||
            (filterRated === "rated" && tl.ratedThisWeek) ||
            (filterRated === "pending" && !tl.ratedThisWeek);
        return matchesSearch && matchesFilter;
    });

    // Submit rating
    async function handleSubmitRating() {
        if (!selectedTeamLead) return;

        // Validate
        const hasAllScores = ratingForm.leadershipScore > 0 &&
            ratingForm.teamManagementScore > 0 &&
            ratingForm.communicationScore > 0 &&
            ratingForm.resultsDeliveryScore > 0 &&
            ratingForm.cultureChampionScore > 0;

        if (!hasAllScores) {
            alert("Please provide all ratings");
            return;
        }

        setSubmitting(true);
        try {
            await submitRating(selectedTeamLead.id, ratingForm);
            setSelectedTeamLead(null);
            setRatingForm({
                leadershipScore: 0,
                teamManagementScore: 0,
                communicationScore: 0,
                resultsDeliveryScore: 0,
                cultureChampionScore: 0,
                leadershipNotes: "",
                areasOfStrength: "",
                areasForImprovement: "",
            });
            loadData(); // Refresh
        } catch (error) {
            console.error("Error submitting rating:", error);
            alert("Failed to submit rating");
        } finally {
            setSubmitting(false);
        }
    }

    // Acknowledge alert
    async function handleAcknowledgeAlert(alertId: number) {
        try {
            await acknowledgeAlert(alertId);
            setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        } catch (error) {
            console.error("Error acknowledging alert:", error);
        }
    }

    // Stats
    const _pendingRatings = teamLeads.filter((tl) => !tl.ratedThisWeek).length;
    const completedRatings = teamLeads.filter((tl) => tl.ratedThisWeek).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Lead Ratings</h1>
                    <p className="text-gray-500">Week {currentWeek} Performance Reviews</p>
                </div>
                <div className="flex gap-4">
                    <Card className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-indigo-600">{completedRatings}/{teamLeads.length}</p>
                            <p className="text-xs text-gray-500">Rated This Week</p>
                        </div>
                    </Card>
                    {alertSummary && alertSummary.total > 0 && (
                        <Card className="px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{alertSummary.total}</p>
                                <p className="text-xs text-gray-500">Active Alerts</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="team-leads" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Leads ({teamLeads.length})
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Alerts ({alerts.length})
                    </TabsTrigger>
                </TabsList>

                {/* Team Leads Tab */}
                <TabsContent value="team-leads" className="mt-6">
                    {/* Search and Filter */}
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search team leads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            {["all", "pending", "rated"].map((filter) => (
                                <Button
                                    key={filter}
                                    variant={filterRated === filter ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterRated(filter as "all" | "rated" | "pending")}
                                >
                                    {filter === "all" ? "All" : filter === "pending" ? "Pending" : "Rated"}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Team Leads Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTeamLeads.map((tl) => (
                            <Card
                                key={tl.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${tl.ratedThisWeek ? "border-green-200 bg-green-50/50" : "border-orange-200"
                                    }`}
                                onClick={() => setSelectedTeamLead(tl)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={tl.avatarUrl || ""} />
                                            <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                                {tl.name.split(" ").map((n) => n[0]).join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 truncate">{tl.name}</h3>
                                                {tl.ratedThisWeek && (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{tl.department}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
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
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredTeamLeads.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No team leads found</p>
                        </div>
                    )}
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="mt-6">
                    {alerts.length === 0 ? (
                        <Card className="p-12 text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">All Clear!</h3>
                            <p className="text-gray-500">No active Aura alerts at this time</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {alerts.map((alert) => (
                                <Card key={alert.id} className="overflow-hidden">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-2 rounded-full ${alert.alertType.includes("DROP") || alert.alertType.includes("DECLINE")
                                                    ? "bg-red-100"
                                                    : "bg-green-100"
                                                    }`}>
                                                    {alert.alertType.includes("DROP") || alert.alertType.includes("DECLINE") ? (
                                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                                    ) : (
                                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-gray-900">{alert.employeeName}</h3>
                                                        <AlertBadge type={alert.alertType} />
                                                    </div>
                                                    <p className="text-sm text-gray-600">{alert.message}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                        <span>{alert.department || "No department"}</span>
                                                        <span>
                                                            {alert.previousScore?.toFixed(0)} → {alert.currentScore?.toFixed(0)}
                                                            ({alert.changePercentage > 0 ? "+" : ""}{alert.changePercentage?.toFixed(1)}%)
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={selectedTeamLead.avatarUrl || ""} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                            {selectedTeamLead.name.split(" ").map((n) => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle>{selectedTeamLead.name}</CardTitle>
                                        <CardDescription>{selectedTeamLead.department}</CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedTeamLead(null)}>
                                    ✕
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Rating Categories */}
                            <div className="space-y-4">
                                <StarRating
                                    label="Leadership & Vision"
                                    value={ratingForm.leadershipScore}
                                    onChange={(v) => setRatingForm({ ...ratingForm, leadershipScore: v })}
                                />
                                <StarRating
                                    label="Team Management"
                                    value={ratingForm.teamManagementScore}
                                    onChange={(v) => setRatingForm({ ...ratingForm, teamManagementScore: v })}
                                />
                                <StarRating
                                    label="Communication"
                                    value={ratingForm.communicationScore}
                                    onChange={(v) => setRatingForm({ ...ratingForm, communicationScore: v })}
                                />
                                <StarRating
                                    label="Results Delivery"
                                    value={ratingForm.resultsDeliveryScore}
                                    onChange={(v) => setRatingForm({ ...ratingForm, resultsDeliveryScore: v })}
                                />
                                <StarRating
                                    label="Culture Champion"
                                    value={ratingForm.cultureChampionScore}
                                    onChange={(v) => setRatingForm({ ...ratingForm, cultureChampionScore: v })}
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-2">
                                        Leadership Notes
                                    </label>
                                    <Textarea
                                        placeholder="Any specific observations about their leadership..."
                                        value={ratingForm.leadershipNotes}
                                        onChange={(e) => setRatingForm({ ...ratingForm, leadershipNotes: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-2">
                                        Areas of Strength
                                    </label>
                                    <Textarea
                                        placeholder="What are they doing well?"
                                        value={ratingForm.areasOfStrength}
                                        onChange={(e) => setRatingForm({ ...ratingForm, areasOfStrength: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-2">
                                        Areas for Improvement
                                    </label>
                                    <Textarea
                                        placeholder="Where can they grow?"
                                        value={ratingForm.areasForImprovement}
                                        onChange={(e) => setRatingForm({ ...ratingForm, areasForImprovement: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="outline" onClick={() => setSelectedTeamLead(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitRating}
                                    disabled={submitting}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {submitting ? "Submitting..." : "Submit Rating"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
