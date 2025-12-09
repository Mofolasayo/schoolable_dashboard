'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/lib/hooks/use-toast';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Show error from URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: decodeURIComponent(errorParam),
      });
    }
  }, [searchParams, toast]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Show loading toast
    toast({
      title: 'Signing in...',
      description: 'Please wait while we verify your credentials.',
    });

    try {
      await login(formData);
      // Success toast
      toast({
        title: 'Success!',
        description: 'Welcome back to Schoolable Admin.',
        className: 'bg-green-50 border-green-200',
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Invalid credentials';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3">
          <div className="mb-4 flex justify-center">
            <img
              src="/schoolable_logo.png"
              alt="Schoolable"
              className="h-16 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-center text-2xl font-bold text-slate-900">
            Schoolable Admin
          </CardTitle>
          {/* <CardDescription className="text-center text-slate-600">
                        Super Admin Dashboard Access
                    </CardDescription> */}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium text-slate-700">
                Admin Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="schoolablesuberadmin@gmail.com"
                className="h-11"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="h-11 pr-10"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 h-11 w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Authorized access only. Contact your administrator for credentials.
          </p>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 rounded-lg bg-slate-100 p-3 text-xs">
              <p className="mb-1 font-semibold text-slate-700">
                Test Credentials:
              </p>
              <p className="text-slate-600">
                Email: schoolablesuberadmin@gmail.com
              </p>
              <p className="text-slate-600">
                Password: schoolablesuperadmin1234
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
