import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/common/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';

interface SidebarLayoutProps {
    children: ReactNode;
}

const DESKTOP_BREAKPOINT = 1024;

function SidebarLayout({ children }: SidebarLayoutProps) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    usePageTitle();
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : false
    );
    const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : false
    );
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            const desktop = window.innerWidth >= DESKTOP_BREAKPOINT;
            setIsDesktop(desktop);
            setIsSidebarOpen(desktop);
        };

        checkScreenSize();

        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/pagenews');
    };

    const handleCloseSidebar = () => {
        if (!isDesktop) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Button
                variant="outline"
                size="icon"
                className="fixed top-4 left-4 z-50 shadow-md bg-background hover:bg-accent"
                onClick={toggleSidebar}
            >
                {isSidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
            </Button>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                onLogout={() => setShowLogoutConfirm(true)}
            />

            <main
                className={`transition-all duration-300 lg:pt-4 pb-8 ${isSidebarOpen && isDesktop ? 'ml-72 px-8 mt-4' : 'pt-16 px-4'
                    }`}
            >
                {children}
            </main>

            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Xác nhận đăng xuất
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleLogout}
                            >
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SidebarLayout;
