// This page is displayed when a logged-in user has no chat sessions yet.
// It lives within the (app) route group, so it uses the layout with the sidebar.

export default function WelcomePage() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <h1 className="text-2xl font-semibold mb-4">Welcome!</h1>
            <p className="text-muted-foreground mb-6">
                It looks like you don&apos;t have any conversations started.
            </p>
            <p className="text-muted-foreground">
                Use the &quot;New Chat&quot; button in the sidebar to begin.
            </p>
        </div>
    );
} 