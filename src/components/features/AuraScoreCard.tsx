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

function toPercent(score: number) {
  return score <= 5 ? (score / 5) * 100 : score;
}

// Get score color based on percentage
function getScoreColor(score: number) {
  const percent = toPercent(score);
  if (percent >= 80) return 'text-emerald-600';
  if (percent >= 60) return 'text-blue-600';
  if (percent >= 40) return 'text-amber-600';
  return 'text-red-600';
}

// Get progress bar color based on percentage
function getProgressColor(score: number) {
  const percent = toPercent(score);
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 60) return 'bg-blue-500';
  if (percent >= 40) return 'bg-amber-500';
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
      <div className="h-32 rounded-lg bg-gray-200"></div>
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-gray-200"></div>
        ))}
      </div>
    </div>
  );
}

// Main Aura Score Card Component
export function AuraScoreCard({
  data,
  isLoading,
  showDetails = true,
}: AuraScoreCardProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!data) {
    return (
      <Card className="border-dashed bg-gray-50">
        <CardContent className="py-12 text-center">
          <Sparkles className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600">
            No Aura Data Available
          </h3>
          <p className="mt-1 text-sm text-gray-500">
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

  const displayScore =
    typeof data.qgpa === 'number' ? data.qgpa : (data.auraScore ?? 0) / 20;
  const progressValue = Math.max(0, Math.min(toPercent(displayScore), 100));
  const qgpaText =
    typeof data.qgpa === 'number'
      ? data.qgpa.toFixed(2)
      : displayScore.toFixed(2);

  return (
    <div className="space-y-4">
      {/* Main Aura Score Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <CardContent className="relative py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 opacity-90">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">Aura Score</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold">
                  {displayScore.toFixed(1)}
                </span>
              </div>
              <p className="mt-2 text-sm opacity-80">
                Quarter: {data.quarterStart?.slice(0, 7) ?? 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <div className="mb-2 text-sm opacity-80">Current Grade</div>
              <Badge
                className={`px-4 py-2 text-2xl font-bold ${getGradeColor(data.grade)}`}
              >
                {data.grade}
              </Badge>
              <div className="mt-3 text-sm opacity-80">
                QGPA: <span className="font-bold">{qgpaText}</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progressValue} className="h-2 bg-white/20" />
          </div>
        </CardContent>
      </Card>

      {/* Pillar Breakdown */}
      {showDetails && pillars.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {pillars.map((pillar, index) => (
            <Card key={index} className="transition-shadow hover:shadow-md">
              <CardContent className="pb-4 pt-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500">
                  {getPillarIcon(pillar.name)}
                  <span className="truncate text-xs font-medium">
                    {pillar.name}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <span
                    className={`text-xl font-bold ${getScoreColor(pillar.score)}`}
                  >
                    {Math.round(pillar.score)}%
                  </span>
                  <span className="text-xs text-gray-400">
                    {pillar.weight}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pillar.score)}`}
                    style={{ width: `${pillar.score}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-400">
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
        <span className={`font-bold ${getScoreColor(score)}`}>
          {score.toFixed(1)}
        </span>
      </div>
      <Badge className={`text-xs ${getGradeColor(grade)}`}>{grade}</Badge>
    </div>
  );
}

export default AuraScoreCard;
