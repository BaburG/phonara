'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';

// TODO: Implement actual sign-in form using ShadCN components
// and next-auth/react signIn function.

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/'; // Redirect back or to home
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Handle redirect manually
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.'); // Generic error
        console.error("Sign-in error:", result.error);
      } else if (result?.ok) {
        // Sign-in successful, redirect to callback URL or home
        router.push(callbackUrl);
        router.refresh(); // Optional: Refresh server session state if needed
      } else {
         // Handle cases where result is null or neither ok nor error (shouldn't typically happen with credentials)
         setError("An unexpected error occurred during sign-in.");
      }
    } catch (err) {
      console.error("Sign-in exception:", err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
           {/* Optional: Add OAuth buttons here if needed */}
          {/* <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4" onClick={() => signIn('google')} disabled={isLoading}>
             Sign In with Google
          </Button> */}
        </CardContent>
        <CardFooter className="text-center text-sm">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="underline hover:text-primary">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 