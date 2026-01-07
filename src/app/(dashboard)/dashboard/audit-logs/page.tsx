'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Filter,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    Clock,
    User,
    FileText,
    Edit,
    Trash2,
    Plus,
    Eye,
    Shield,
} from 'lucide-react';
import { getAuditLogs } from '@/app/actions/audit';

interface AuditLog {
    id: number;
    entityType: string;
    entityId: string;
    action: string;
    actorId: string | null;
    actorName: string | null;
    actorEmail: string | null;
    changes: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
    ipAddress: string | null;
    createdAt: string;
}

interface _AuditLogsResponse {
    logs: AuditLog[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

const _API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

const entityTypes = ['All', 'TASK', 'PROFILE', 'ANNOUNCEMENT', 'COMPLIANCE', 'ATTENDANCE'];

const actionIcons: Record<string, typeof Plus> = {
    CREATE: Plus,
    UPDATE: Edit,
    DELETE: Trash2,
    VIEW: Eye,
    LOGIN: Shield,
    LOGOUT: Shield,
};

const actionColors: Record<string, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    VIEW: 'bg-gray-100 text-gray-700',
    LOGIN: 'bg-purple-100 text-purple-700',
    LOGOUT: 'bg-amber-100 text-amber-700',
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEntityType, setSelectedEntityType] = useState('All');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 20;

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getAuditLogs(currentPage, pageSize, selectedEntityType);
            setLogs(data.logs);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, selectedEntityType]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Filter logs by search query
    const filteredLogs = logs.filter(log =>
        searchQuery === '' ||
        log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actorEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getActionIcon = (action: string) => {
        const Icon = actionIcons[action] || FileText;
        return Icon;
    };

    const getActionColor = (action: string) => {
        return actionColors[action] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-xl font-normal text-gray-800">Audit Logs</h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Track all system activities and changes for compliance and security.
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                        onClick={fetchLogs}
                        className="ml-auto text-sm font-medium text-red-700 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Search */}
                    <div className="max-w-md flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Entity Type Filter */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Entity:</span>
                            <div className="flex items-center gap-1">
                                {entityTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setSelectedEntityType(type);
                                            setCurrentPage(0);
                                        }}
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedEntityType === type
                                            ? 'bg-primary text-white'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
                <div className="border-b border-border/40 p-6">
                    <h2 className="text-sm font-normal text-gray-700">Activity Log</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {totalElements} total entries
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center p-12">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading audit logs...</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredLogs.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12">
                        <div className="rounded-full bg-muted/50 p-4 mb-4">
                            <Shield className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-800 mb-1">No audit logs found</h3>
                        <p className="text-xs text-muted-foreground text-center max-w-sm">
                            {searchQuery || selectedEntityType !== 'All'
                                ? 'Try adjusting your filters.'
                                : 'Audit logs will appear here as system activities occur.'}
                        </p>
                    </div>
                )}

                {/* Logs List */}
                {!isLoading && filteredLogs.length > 0 && (
                    <div className="divide-y divide-border/40">
                        {filteredLogs.map((log) => {
                            const ActionIcon = getActionIcon(log.action);
                            return (
                                <div
                                    key={log.id}
                                    className="p-4 hover:bg-muted/20 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Action Icon */}
                                        <div className={`flex-shrink-0 rounded-lg p-2 ${getActionColor(log.action)}`}>
                                            <ActionIcon className="h-4 w-4" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {log.action}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                    {log.entityType}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                {log.entityType} ID: {log.entityId}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                {log.actorName && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {log.actorName}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(log.createdAt)}
                                                </span>
                                                {log.ipAddress && (
                                                    <span className="text-xs text-muted-foreground/60">
                                                        IP: {log.ipAddress}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
                        <p className="text-xs text-muted-foreground">
                            Page {currentPage + 1} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                                className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage >= totalPages - 1}
                                className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
