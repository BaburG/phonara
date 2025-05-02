import { Sidebar } from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Fixed width Sidebar */}
            <div className="w-64 flex-shrink-0 h-full hidden md:block"> 
                {/* Add hidden md:block to hide on small screens if desired */}
                <Sidebar />
            </div>

            {/* Main content area wrapper - Make this a flex column */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Add the Header here */}
                <Header /> 

                {/* Page content - Allow scrolling */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
