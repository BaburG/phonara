export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-64 bg-gray-200 animate-pulse rounded mt-2"></div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <section>
            <div className="h-6 w-40 bg-gray-200 animate-pulse rounded mb-4"></div>
            <div className="h-20 bg-gray-200 animate-pulse rounded"></div>
          </section>
          
          <section>
            <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
          </section>
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container mx-auto text-center">
          <div className="h-4 w-48 bg-gray-200 animate-pulse rounded mx-auto"></div>
        </div>
      </footer>
    </div>
  );
} 