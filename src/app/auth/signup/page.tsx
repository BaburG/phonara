'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { z } from 'zod'; // For potential client-side validation

// Basic client-side validation schema (can mirror server schema)
const signupSchema = z.object({
    name: z.string().optional(),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // path of error
});

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    // Client-side validation
    const validationResult = signupSchema.safeParse({
        name,
        email,
        password,
        confirmPassword
    });

    if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors;
        setFieldErrors(errors);
        setError("Please fix the errors in the form.")
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific errors from the API
        if (response.status === 409) {
          setError(data.error || 'User with this email already exists.');
          setFieldErrors({ email: [data.error || 'User already exists'] });
        } else if (response.status === 400) {
            setError(data.error || 'Invalid input.');
             // Optionally map server validation errors to fields
             const apiFieldErrors: Record<string, string[] | undefined> = {};
             if (data.details) {
                 data.details.forEach((detail: any) => {
                    if (detail.path && detail.path.length > 0) {
                       apiFieldErrors[detail.path[0]] = [detail.message];
                    }
                 });
             }
             setFieldErrors(apiFieldErrors);
        } else {
          setError(data.error || 'An unexpected error occurred during registration.');
        }
        console.error("Registration error:", data);
      } else {
        // Registration successful
        setSuccess('Registration successful! Redirecting to sign in...');
        // Redirect to sign-in page after a short delay
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      }
    } catch (err) {
      console.error("Registration exception:", err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Enter your details below to create a new account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
               {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>}
            </div>
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
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
               {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword[0]}</p>}
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive text-center">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm font-medium text-green-600 text-center">
                {success}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || !!success}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/auth/signin" className="underline hover:text-primary">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 