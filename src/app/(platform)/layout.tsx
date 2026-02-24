import Sidebar from "@/components/ui/Sidebar";
import Ticker from "@/components/ui/Ticker";
import { getUserSettings } from "@/app/actions/settings";

export default async function PlatformLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getUserSettings().catch(() => null);
    const isCompact = settings?.compactView ?? false;

    return (
        <>
            <a href="#main-content" className="skip-nav">
                Skip to main content
            </a>
            <Ticker />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} data-compact={isCompact || undefined}>
                <Sidebar />
                <main
                    id="main-content"
                    tabIndex={-1}
                    style={{ flex: 1, overflowY: 'auto' }}
                    className="bg-primary text-primary transition-colors duration-300"
                >
                    {children}
                </main>
            </div>
        </>
    );
}
