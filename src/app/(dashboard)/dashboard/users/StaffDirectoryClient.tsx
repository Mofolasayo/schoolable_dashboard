'use client';

import { useEffect, useState } from 'react';
import { StaffProfile, getStaffProfiles } from '@/app/actions/staff';
import {
  getEmployeeCertificates,
  type TrainingRecord,
} from '@/app/actions/certificates';
import Loading from './loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Award,
  FileCheck,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

export default function StaffDirectoryClient() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [certificates, setCertificates] = useState<TrainingRecord[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);

  useEffect(() => {
    getStaffProfiles().then((data) => {
      setStaff(data);
      setIsLoading(false);
    });
  }, []);

  // Fetch certificates when a staff member is selected
  useEffect(() => {
    let isActive = true;

    const fetchCertificates = async () => {
      if (!selectedStaff?.id) {
        if (isActive) {
          setCertificates([]);
        }
        return;
      }
      setLoadingCerts(true);
      try {
        const data = await getEmployeeCertificates(selectedStaff.id);
        if (isActive) {
          setCertificates(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isActive) {
          setCertificates([]);
        }
      } finally {
        if (isActive) {
          setLoadingCerts(false);
        }
      }
    };

    fetchCertificates();

    return () => {
      isActive = false;
    };
  }, [selectedStaff?.id]);

  if (isLoading) return <Loading />;

  const filteredStaff = staff.filter(
    (person) =>
      person.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <FileCheck className="h-4 w-4 text-emerald-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-rose-600" />;
      default:
        return <Award className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="border-rose-200 bg-rose-50 text-rose-700">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or department..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredStaff.length} employees
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-border/40 hover:bg-transparent">
              <TableHead className="w-[40%] pl-6">Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((person) => (
                <TableRow
                  key={person.id}
                  className="cursor-pointer border-b border-border/40 transition-colors hover:bg-slate-50/60"
                  onClick={() => setSelectedStaff(person)}
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-slate-100/50">
                        <AvatarImage src={person.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-slate-100 text-slate-500">
                          {person.full_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-700">
                          {person.full_name}
                        </div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {person.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-600">
                    {person.role || '—'}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {person.department || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        person.status?.toLowerCase() === 'active'
                          ? 'border-emerald-200 bg-emerald-50 font-normal text-emerald-700'
                          : 'border-slate-200 bg-slate-50 font-normal text-slate-600'
                      }
                    >
                      {person.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <Sheet
        open={!!selectedStaff}
        onOpenChange={(open) => !open && setSelectedStaff(null)}
      >
        <SheetContent className="overflow-y-auto border-l p-0 shadow-2xl sm:max-w-md">
          <SheetTitle className="sr-only">
            {selectedStaff?.full_name
              ? `${selectedStaff.full_name} profile`
              : 'Staff profile'}
          </SheetTitle>
          {selectedStaff && (
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex flex-col items-center border-b border-border/40 bg-slate-50/50 p-8 text-center">
                <Avatar className="mb-4 h-24 w-24 border-4 border-white shadow-sm">
                  <AvatarImage src={selectedStaff.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-slate-100 text-xl text-slate-500">
                    {selectedStaff.full_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mb-1 text-xl font-semibold text-slate-800">
                  {selectedStaff.full_name}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {selectedStaff.role}
                </p>
                <div className="mt-4 flex gap-2">
                  <Badge
                    variant="secondary"
                    className="border border-slate-200 bg-white font-normal text-slate-600"
                  >
                    {selectedStaff.department}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`font-normal ${selectedStaff.status === 'active' ? 'border border-emerald-100 bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {selectedStaff.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-8 p-6">
                {/* Contact Group */}
                <section>
                  <h3 className="mb-4 pl-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Contact Information
                  </h3>
                  <div className="prose prose-sm max-w-none space-y-4">
                    <div className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50/80">
                      <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <span className="mb-0.5 block text-xs text-slate-400">
                          Email Address
                        </span>
                        <span className="break-all text-sm font-medium text-slate-700">
                          {selectedStaff.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50/80">
                      <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <span className="mb-0.5 block text-xs text-slate-400">
                          Phone Number
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {selectedStaff.phone || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50/80">
                      <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <span className="mb-0.5 block text-xs text-slate-400">
                          Location
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {selectedStaff.address
                            ? `${selectedStaff.address}, ${selectedStaff.city || ''}`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="mx-2 h-px bg-slate-100" />

                {/* Employment Group */}
                <section>
                  <h3 className="mb-4 pl-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Employment Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3">
                      <span className="mb-1 block text-xs text-slate-400">
                        Employee ID
                      </span>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {selectedStaff.employee_id || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <span className="mb-1 block text-xs text-slate-400">
                        Date Joined
                      </span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {formatDate(selectedStaff.date_joined)}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <span className="mb-1 block text-xs text-slate-400">
                        Date of Birth
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {formatDate(selectedStaff.date_of_birth)}
                      </span>
                    </div>
                    <div className="p-3">
                      <span className="mb-1 block text-xs text-slate-400">
                        Gender
                      </span>
                      <span className="text-sm font-medium capitalize text-slate-700">
                        {selectedStaff.gender || 'N/A'}
                      </span>
                    </div>
                  </div>
                </section>

                <div className="mx-2 h-px bg-slate-100" />

                {/* Certificates Section */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 pl-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Award className="h-4 w-4" />
                    Training Certificates
                  </h3>

                  {loadingCerts ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    </div>
                  ) : certificates.length === 0 ? (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-6 text-center">
                      <Award className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-sm text-slate-500">
                        No certificates uploaded yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex-shrink-0">
                            {getStatusIcon(cert.status)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-slate-700">
                                {cert.name}
                              </span>
                              {cert.certificateUrl && (
                                <a
                                  href={cert.certificateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              {cert.quarter} {cert.year} •{' '}
                              {formatDate(cert.createdAt)}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(cert.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="border-t border-border/40 bg-slate-50/30 p-6">
                <Button className="h-11 w-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700">
                  Edit profile
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
