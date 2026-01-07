'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    ArrowLeft,
    Save,
    Send,
    Star,
    Target,
    Users,
    TrendingUp,
    MessageSquare,
    Lightbulb,
    Shield,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface RatingCriterion {
    id: string;
    name: string;
    description: string;
    pillar: 'behavioral' | 'culture_fit' | 'growth' | 'leadership';
    icon: React.ReactNode;
    forTeamLeadsOnly?: boolean;
}

interface RatingValue {
    criterionId: string;
    score: number; // 1-5
    comment: string;
}

interface Employee {
    id: string;
    name: string;
    department: string;
    jobTitle: string;
    isTeamLead: boolean;
    avatar: string;
    avatarUrl?: string;
}

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

async function fetchEmployee(employeeId: string): Promise<Employee> {
    const res = await fetch(`${API_BASE}/api/admin/staff/${employeeId}`, {
        headers: await getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch employee');
    const data = await res.json();

    // Map API response to our Employee interface
    return {
        id: data.id || employeeId,
        name: data.fullName || data.full_name || 'Unknown',
        department: data.department || 'N/A',
        jobTitle: data.jobTitle || data.job_title || 'N/A',
        isTeamLead: data.isTeamLead || data.is_team_lead || false,
        avatar: (data.fullName || data.full_name || 'U')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase(),
        avatarUrl: data.avatarUrl || data.avatar_url,
    };
}

async function submitAssessment(employeeId: string, data: {
    ratings: Record<string, RatingValue>;
    overallComments: string;
    developmentRecommendations: string;
    isDraft: boolean;
}): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/admin/assessments/${employeeId}`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit assessment');
    return res.json();
}

// Rating criteria definitions
const ratingCriteria: RatingCriterion[] = [
    // Behavioral Competence
    {
        id: 'adaptability',
        name: 'Adaptability',
        description: 'How well does the employee respond to change and adjust to new situations?',
        pillar: 'behavioral',
        icon: <TrendingUp className="h-4 w-4" />,
    },
    {
        id: 'initiative',
        name: 'Initiative',
        description: 'Does the employee proactively identify and solve problems without being asked?',
        pillar: 'behavioral',
        icon: <Lightbulb className="h-4 w-4" />,
    },
    // Culture Fit
    {
        id: 'company_values',
        name: 'Company Values Alignment',
        description: 'How well does the employee embody and promote company core values?',
        pillar: 'culture_fit',
        icon: <Star className="h-4 w-4" />,
    },
    {
        id: 'work_ethics',
        name: 'Work Ethics & Integrity',
        description: 'Is the employee honest, trustworthy, and ethical in their work?',
        pillar: 'culture_fit',
        icon: <Shield className="h-4 w-4" />,
    },
    // Growth & Learning
    {
        id: 'skill_application',
        name: 'Application of New Skills',
        description: 'Has the employee effectively applied newly learned skills in their work?',
        pillar: 'growth',
        icon: <Target className="h-4 w-4" />,
    },
    {
        id: 'feedback_receptiveness',
        name: 'Openness to Feedback',
        description: 'How well does the employee receive and act on constructive feedback?',
        pillar: 'growth',
        icon: <MessageSquare className="h-4 w-4" />,
    },
    // Leadership (Team Leads Only)
    {
        id: 'decision_making',
        name: 'Executive Decision-Making',
        description: 'Quality and impact of decisions made as a leader',
        pillar: 'leadership',
        icon: <Target className="h-4 w-4" />,
        forTeamLeadsOnly: true,
    },
    {
        id: 'people_leadership',
        name: 'People & Culture Leadership',
        description: 'Ability to inspire, develop, and support team members',
        pillar: 'leadership',
        icon: <Users className="h-4 w-4" />,
        forTeamLeadsOnly: true,
    },
    {
        id: 'crisis_handling',
        name: 'Crisis/Conflict Handling',
        description: 'Effectiveness in resolving conflicts and managing crises',
        pillar: 'leadership',
        icon: <Shield className="h-4 w-4" />,
        forTeamLeadsOnly: true,
    },
];

// Rating labels
const ratingLabels: Record<number, { label: string; color: string }> = {
    1: { label: 'Needs Improvement', color: 'text-red-600' },
    2: { label: 'Below Expectations', color: 'text-orange-600' },
    3: { label: 'Meets Expectations', color: 'text-amber-600' },
    4: { label: 'Exceeds Expectations', color: 'text-blue-600' },
    5: { label: 'Outstanding', color: 'text-emerald-600' },
};

// Pillar display info
const pillarInfo: Record<string, { title: string; color: string; bgColor: string }> = {
    behavioral: { title: 'Behavioral Competence (25%)', color: 'text-blue-700', bgColor: 'bg-blue-50' },
    culture_fit: { title: 'Culture Fit (20%)', color: 'text-purple-700', bgColor: 'bg-purple-50' },
    growth: { title: 'Growth & Learning (20%)', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    leadership: { title: 'Collaboration/Leadership', color: 'text-amber-700', bgColor: 'bg-amber-50' },
};

export default function ManagerAssessmentPage() {
    const router = useRouter();
    const params = useParams();
    const employeeId = params.employeeId as string;

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [ratings, setRatings] = useState<Record<string, RatingValue>>(
        ratingCriteria.reduce((acc, criterion) => ({
            ...acc,
            [criterion.id]: { criterionId: criterion.id, score: 3, comment: '' }
        }), {})
    );

    const [overallComments, setOverallComments] = useState('');
    const [developmentRecommendations, setDevelopmentRecommendations] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadEmployee = async () => {
            if (!employeeId) return;
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchEmployee(employeeId);
                setEmployee(data);
            } catch (err) {
                console.error('Error fetching employee:', err);
                setError('Failed to load employee data');
            } finally {
                setIsLoading(false);
            }
        };
        loadEmployee();
    }, [employeeId]);

    // Filter criteria based on whether employee is team lead
    const applicableCriteria = ratingCriteria.filter(
        criterion => !criterion.forTeamLeadsOnly || employee?.isTeamLead
    );

    // Group criteria by pillar
    const criteriaByPillar = applicableCriteria.reduce((acc, criterion) => {
        if (!acc[criterion.pillar]) {
            acc[criterion.pillar] = [];
        }
        acc[criterion.pillar]!.push(criterion);
        return acc;
    }, {} as Record<string, RatingCriterion[]>);

    // Update rating
    const handleRatingChange = (criterionId: string, score: number) => {
        setRatings(prev => {
            const existing = prev[criterionId];
            return {
                ...prev,
                [criterionId]: { criterionId, score, comment: existing?.comment ?? '' }
            };
        });
    };

    // Update comment
    const handleCommentChange = (criterionId: string, comment: string) => {
        setRatings(prev => {
            const existing = prev[criterionId];
            return {
                ...prev,
                [criterionId]: { criterionId, comment, score: existing?.score ?? 3 }
            };
        });
    };

    // Calculate pillar average
    const calculatePillarScore = (pillar: string): number => {
        const pillarCriteria = criteriaByPillar[pillar] || [];
        if (pillarCriteria.length === 0) return 0;

        const sum = pillarCriteria.reduce((total, criterion) => {
            return total + (ratings[criterion.id]?.score ?? 3);
        }, 0);

        return (sum / pillarCriteria.length) * 20; // Convert 1-5 to 0-100
    };

    // Save as draft
    const handleSaveDraft = async () => {
        if (!employeeId) return;
        setIsSaving(true);
        try {
            await submitAssessment(employeeId, {
                ratings,
                overallComments,
                developmentRecommendations,
                isDraft: true,
            });
            toast.success('Assessment saved as draft');
        } catch {
            toast.error('Failed to save draft');
        } finally {
            setIsSaving(false);
        }
    };

    // Submit assessment
    const handleSubmit = async () => {
        if (!employeeId) return;
        setIsSubmitting(true);
        try {
            await submitAssessment(employeeId, {
                ratings,
                overallComments,
                developmentRecommendations,
                isDraft: false,
            });
            toast.success('Assessment submitted successfully');
            router.push('/dashboard/performance');
        } catch {
            toast.error('Failed to submit assessment');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Error state
    if (error || !employee) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Manager Assessment</h1>
                </div>
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6">
                        <p className="text-red-700">{error || 'Employee not found'}</p>
                        <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manager Assessment</h1>
                    <p className="text-gray-500">Q1 2026 Performance Review</p>
                </div>
            </div>

            {/* Employee Info Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        {employee.avatarUrl ? (
                            <img
                                src={employee.avatarUrl}
                                alt={employee.name}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                {employee.avatar}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold">{employee.name}</h2>
                                {employee.isTeamLead && (
                                    <Badge className="bg-amber-100 text-amber-800">Team Lead</Badge>
                                )}
                            </div>
                            <p className="text-gray-500">{employee.jobTitle} • {employee.department}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <h3 className="font-semibold text-blue-800 mb-2">Rating Guidelines</h3>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                        {Object.entries(ratingLabels).map(([score, { label, color }]) => (
                            <div key={score} className="text-center">
                                <div className={`font-bold ${color}`}>{score}</div>
                                <div className="text-blue-700 text-xs">{label}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Rating Sections by Pillar */}
            {Object.entries(criteriaByPillar).map(([pillar, criteria]) => (
                <Card key={pillar}>
                    <CardHeader className={pillarInfo[pillar]?.bgColor ?? 'bg-gray-50'}>
                        <CardTitle className={pillarInfo[pillar]?.color ?? 'text-gray-700'}>
                            {pillarInfo[pillar]?.title ?? pillar}
                        </CardTitle>
                        <CardDescription>
                            Current Score: {calculatePillarScore(pillar).toFixed(0)}%
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                        {criteria.map((criterion) => (
                            <div key={criterion.id} className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-gray-100">
                                        {criterion.icon}
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-base font-medium">{criterion.name}</Label>
                                        <p className="text-sm text-gray-500">{criterion.description}</p>
                                    </div>
                                </div>

                                {/* Rating Slider */}
                                <div className="space-y-3 pl-12">
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[ratings[criterion.id]?.score ?? 3]}
                                            onValueChange={([value]) => handleRatingChange(criterion.id, value ?? 3)}
                                            min={1}
                                            max={5}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <div className="w-24 text-center">
                                            <span className={`font-bold text-lg ${ratingLabels[ratings[criterion.id]?.score ?? 3]?.color ?? 'text-gray-600'}`}>
                                                {ratings[criterion.id]?.score ?? 3}/5
                                            </span>
                                            <p className="text-xs text-gray-500">
                                                {ratingLabels[ratings[criterion.id]?.score ?? 3]?.label ?? 'Meets Expectations'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <Textarea
                                        placeholder={`Add comments for ${criterion.name} (optional)`}
                                        value={ratings[criterion.id]?.comment ?? ''}
                                        onChange={(e) => handleCommentChange(criterion.id, e.target.value)}
                                        rows={2}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {/* Overall Comments */}
            <Card>
                <CardHeader>
                    <CardTitle>Overall Feedback</CardTitle>
                    <CardDescription>Provide summary feedback for this employee</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Overall Comments</Label>
                        <Textarea
                            placeholder="Summarize the employee's overall performance this quarter..."
                            value={overallComments}
                            onChange={(e) => setOverallComments(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Development Recommendations</Label>
                        <Textarea
                            placeholder="What areas should the employee focus on for improvement?"
                            value={developmentRecommendations}
                            onChange={(e) => setDevelopmentRecommendations(e.target.value)}
                            rows={3}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save as Draft'}
                    </Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
