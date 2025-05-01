'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, Mic, FileText, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center">
          {/* Left side: Logo and Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center">
                <Mic className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-emerald-500">
                  Phonara
                </h1>
                <p className="text-sm text-muted-foreground">Medical Translation Assistant</p>
              </div>
            </Link>
          </div>

          {/* Right side: Links and Auth */}
          <div className="flex items-center gap-4">
            <Link href="/transcript">
              <Button variant="outline" className="gap-2 transition-all hover:shadow-md">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">View Transcript</span>
              </Button>
            </Link>

            {status === 'authenticated' && session?.user?.email && (
              <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 bg-gray-100 text-gray-700 border-gray-200 font-normal">
                <User size={14} />
                {session.user.email}
              </Badge>
            )}

            {status === 'authenticated' ? (
              <Button
                variant="ghost"
                size="icon" // Use icon size for a compact look
                className="text-muted-foreground hover:text-foreground h-9 w-9" // Adjust size if needed
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                title="Sign out"
              >
                <LogOut size={18} />
                <span className="sr-only">Sign Out</span>
              </Button>
            ) : (
              <Link href="/auth/signin">
                 <Button variant="default">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 