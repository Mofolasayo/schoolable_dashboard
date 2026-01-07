'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    RefreshCw,
    Loader2,
    AlertCircle,
    FileText,
    Download,
    Eye,
    Folder,
    FolderOpen,
    Upload,
    File,
    Image,
    FileCheck,
    Clock,
    User,
    ChevronRight,
    X,
} from 'lucide-react';
import { getCompliancePolicies, type CompliancePolicy } from '@/app/actions/compliance';
import { toast } from 'sonner';

interface Document {
    id: string;
    name: string;
    type: 'policy' | 'certificate' | 'submission' | 'other';
    category: string;
    uploadedBy: string | null;
    uploadedAt: string;
    status: 'active' | 'archived' | 'pending';
    fileUrl?: string;
}

const baseFolderCategories = [
    { name: 'All Documents', icon: Folder },
    { name: 'Compliance Policies', icon: FileCheck },
    { name: 'Training Certificates', icon: FileText },
    { name: 'HR Documents', icon: User },
];

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Documents');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadCategory, setUploadCategory] = useState('Compliance Policies');
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Compute folder counts dynamically
    const folderCategories = baseFolderCategories.map(folder => ({
        ...folder,
        count: folder.name === 'All Documents'
            ? documents.length
            : documents.filter(d => d.category === folder.name).length
    }));

    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch compliance policies as documents
            const policies = await getCompliancePolicies();

            // Convert policies to document format
            const docs: Document[] = policies.map((policy: CompliancePolicy) => ({
                id: policy.id,
                name: policy.title, // Use title as name
                type: 'policy' as const,
                category: 'Compliance Policies',
                uploadedBy: 'System',
                uploadedAt: policy.lastReview || new Date().toISOString(),
                status: policy.status === 'active' ? 'active' as const : 'archived' as const,
            }));

            setDocuments(docs);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch documents');
            setDocuments([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Filter documents
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = searchQuery === '' ||
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'All Documents' ||
            doc.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'policy':
                return FileCheck;
            case 'certificate':
                return FileText;
            case 'submission':
                return Image;
            default:
                return File;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-100 text-emerald-700';
            case 'pending':
                return 'bg-amber-100 text-amber-700';
            case 'archived':
                return 'bg-gray-100 text-gray-500';
            default:
                return 'bg-gray-100 text-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-xl font-normal text-gray-800">Document Repository</h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Manage and access organizational documents, policies, and certificates.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchDocuments}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                    >
                        <Upload className="h-3.5 w-3.5" />
                        Upload Document
                    </button>
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg bg-white rounded-xl shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b border-border/40">
                            <h2 className="text-lg font-semibold">Upload Document</h2>
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setUploadFile(null);
                                }}
                                className="p-1.5 rounded-lg hover:bg-muted/50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Drag and Drop Zone */}
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border/60'
                                    }`}
                                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragActive(false);
                                    if (e.dataTransfer.files?.[0]) {
                                        setUploadFile(e.dataTransfer.files[0]);
                                    }
                                }}
                            >
                                {uploadFile ? (
                                    <div className="space-y-2">
                                        <FileCheck className="h-10 w-10 mx-auto text-emerald-500" />
                                        <p className="text-sm font-medium">{uploadFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <button
                                            onClick={() => setUploadFile(null)}
                                            className="text-xs text-red-500 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium">Drag and drop your file here</p>
                                        <p className="text-xs text-muted-foreground mt-1">or</p>
                                        <label className="mt-2 inline-block cursor-pointer">
                                            <span className="text-sm text-primary font-medium hover:underline">Browse files</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        setUploadFile(e.target.files[0]);
                                                    }
                                                }}
                                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                            />
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-2">PDF, DOC, DOCX, PNG, JPG (max 10MB)</p>
                                    </>
                                )}
                            </div>

                            {/* Category Selection */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Category</label>
                                <select
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                >
                                    <option>Compliance Policies</option>
                                    <option>Training Certificates</option>
                                    <option>HR Documents</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-border/40 bg-muted/20">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setUploadFile(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted/50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!uploadFile) {
                                        toast.error('Please select a file to upload');
                                        return;
                                    }
                                    setIsUploading(true);
                                    // Simulated upload - in production, this would call an API
                                    await new Promise(resolve => setTimeout(resolve, 1500));

                                    // Add to local state for demo
                                    const newDoc: Document = {
                                        id: `doc_${Date.now()}`,
                                        name: uploadFile.name,
                                        type: 'other',
                                        category: uploadCategory,
                                        uploadedBy: 'Current User',
                                        uploadedAt: new Date().toISOString(),
                                        status: 'active',
                                    };
                                    setDocuments(prev => [newDoc, ...prev]);

                                    setIsUploading(false);
                                    setShowUploadModal(false);
                                    setUploadFile(null);
                                    toast.success('Document uploaded successfully!', {
                                        description: `${uploadFile.name} has been added to ${uploadCategory}.`,
                                    });
                                }}
                                disabled={!uploadFile || isUploading}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                        onClick={fetchDocuments}
                        className="ml-auto text-sm font-medium text-red-700 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                {/* Sidebar - Folders */}
                <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm h-fit">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                        Categories
                    </h3>
                    <div className="space-y-1">
                        {folderCategories.map((folder) => {
                            const FolderIcon = selectedCategory === folder.name ? FolderOpen : folder.icon;
                            return (
                                <button
                                    key={folder.name}
                                    onClick={() => setSelectedCategory(folder.name)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === folder.name
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <FolderIcon className="h-4 w-4" />
                                        <span>{folder.name}</span>
                                    </div>
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                        {folder.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 pt-6 border-t border-border/40">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                            Storage Overview
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Documents</span>
                                <span className="font-medium">{documents.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Active</span>
                                <span className="font-medium text-emerald-600">
                                    {documents.filter(d => d.status === 'active').length}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Archived</span>
                                <span className="font-medium text-gray-500">
                                    {documents.filter(d => d.status === 'archived').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Documents List */}
                <div className="space-y-4">
                    {/* Search */}
                    <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Documents Grid/List */}
                    <div className="rounded-xl border border-border/40 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-border/40 p-4">
                            <h2 className="text-sm font-medium text-gray-700">
                                {selectedCategory}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex items-center justify-center p-12">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Loading documents...</p>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && filteredDocuments.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-12">
                                <div className="rounded-full bg-muted/50 p-4 mb-4">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-800 mb-1">No documents found</h3>
                                <p className="text-xs text-muted-foreground text-center max-w-sm">
                                    {searchQuery
                                        ? 'Try adjusting your search query.'
                                        : 'Upload documents to get started.'}
                                </p>
                            </div>
                        )}

                        {/* Documents List */}
                        {!isLoading && filteredDocuments.length > 0 && (
                            <div className="divide-y divide-border/40">
                                {filteredDocuments.map((doc) => {
                                    const FileIcon = getFileIcon(doc.type);
                                    return (
                                        <div
                                            key={doc.id}
                                            className="p-4 hover:bg-muted/20 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* File Icon */}
                                                <div className="flex-shrink-0 rounded-lg bg-primary/10 p-3">
                                                    <FileIcon className="h-5 w-5 text-primary" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-sm font-medium text-gray-900 truncate">
                                                            {doc.name}
                                                        </h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(doc.status)}`}>
                                                            {doc.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Folder className="h-3 w-3" />
                                                            {doc.category}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDate(doc.uploadedAt)}
                                                        </span>
                                                        {doc.uploadedBy && (
                                                            <span className="flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                {doc.uploadedBy}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Coming Soon Banner */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-amber-100 p-2">
                                <Folder className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-amber-800">
                                    More Features Coming Soon
                                </h3>
                                <p className="text-xs text-amber-700 mt-1">
                                    Full document upload, versioning, sharing, and organization features are in development.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
