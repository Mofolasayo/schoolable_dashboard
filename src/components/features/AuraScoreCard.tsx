'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Target,
    Users,
    Star,
    TrendingUp,
    MessageSquare,
    Sparkles,
} from 'lucide-react';
import type { AuraResponse, PillarDetail } from '@/lib/api/backend';

interface AuraScoreCardProps {
    data: AuraResponse | null;
    isLoading?: boolean;
    showDetails?: boolean;
}

// Get grade color based on grade letter
function getGradeColor(grade: string) {
    switch (grade) {
        case 'A':
            return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'B':
            return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'C':
            return 'bg-amber-100 text-amber-800 border-amber-300';
        case 'D':
            return 'bg-orange-100 text-orange-800 border-orange-300';
        case 'F':
            return 'bg-red-100 text-red-800 border-red-300';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
}

// Get score color based on percentage
function getScoreColor(score: number) {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
}

// Get progress bar color based on percentage
function getProgressColor(score: number) {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
}

// Get pillar icon
function getPillarIcon(name: string) {
    switch (name.toLowerCase()) {
        case 'technical':
            return <Target className="h-4 w-4" />;
        case 'behavioral':
            return <Users className="h-4 w-4" />;
        case 'culture fit':
        case 'culturefit':
            return <Star className="h-4 w-4" />;
        case 'growth & learning':
        case 'growthlearning':
            return <TrendingUp className="h-4 w-4" />;
        case 'collaboration':
            return <MessageSquare className="h-4 w-4" />;
        default:
            return <Sparkles className="h-4 w-4" />;
    }
}

// Loading skeleton
function LoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                ))}
            </div>
        </div>
    );
}

// Main Aura Score Card Component
export function AuraScoreCard({ data, isLoading, showDetails = true }: AuraScoreCardProps) {
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!data) {
        return (
            <Card className="bg-gray-50 border-dashed">
                <CardContent className="py-12 text-center">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600">No Aura Data Available</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Performance data will appear once the quarter starts
                    </p>
                </CardContent>
            </Card>
        );
    }

    const pillars: PillarDetail[] = data.pillars
        ? [
            data.pillars.technical,
            data.pillars.behavioral,
            data.pillars.cultureFit,
            data.pillars.growthLearning,
            data.pillars.collaboration,
        ]
        : [];

    return (
        <div className="space-y-4">
            {/* Main Aura Score Card */}
            <Card className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <CardContent className="py-6 relative">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <Sparkles className="h-5 w-5" />
                                <span className="text-sm font-medium">Aura Score</span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-bold">{Math.round(data.auraScore)}</span>
                                <span className="text-2xl opacity-80">/100</span>
                            </div>
                            <p className="text-sm opacity-80 mt-2">
                                Quarter: {data.quarterStart?.slice(0, 7) ?? 'N/A'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm opacity-80 mb-2">Current Grade</div>
                            <Badge className={`text-2xl px-4 py-2 font-bold ${getGradeColor(data.grade)}`}>
                                {data.grade}
                            </Badge>
                            <div className="text-sm opacity-80 mt-3">
                                QGPA: <span className="font-bold">{data.qgpa?.toFixed(2) ?? 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Progress value={data.auraScore} className="h-2 bg-white/20" />
                    </div>
                </CardContent>
            </Card>

            {/* Pillar Breakdown */}
            {showDetails && pillars.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {pillars.map((pillar, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-2 text-gray-500 mb-2">
                                    {getPillarIcon(pillar.name)}
                                    <span className="text-xs font-medium truncate">{pillar.name}</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <span className={`text-xl font-bold ${getScoreColor(pillar.score)}`}>
                                        {Math.round(pillar.score)}%
                                    </span>
                                    <span className="text-xs text-gray-400">{pillar.weight}%</span>
                                </div>
                                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pillar.score)}`}
                                        style={{ width: `${pillar.score}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    +{pillar.contribution?.toFixed(1) ?? '0'} pts
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

// Compact version for team member lists
export function AuraScoreBadge({
    score,
    grade,
}: {
    score: number;
    grade: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <Sparkles className={`h-4 w-4 ${getScoreColor(score)}`} />
                <span className={`font-bold ${getScoreColor(score)}`}>{Math.round(score)}</span>
            </div>
            <Badge className={`text-xs ${getGradeColor(grade)}`}>{grade}</Badge>
        </div>
    );
}

export default AuraScoreCard;
