import Sidebar from "@/components/ui/Sidebar";
import Ticker from "@/components/ui/Ticker";

export default function PlatformLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Ticker />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
                    {children}
                </main>
            </div>
        </>
    );
}
