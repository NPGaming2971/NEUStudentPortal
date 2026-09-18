import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '@/assets';
import { Button } from '@/components/ui/button';
import { getNewsGroups, getNewsItems } from '@/services/newsService';
import type { NewsGroup, NewsItem } from '@/services/newsService';
import { getFooterInfo } from '@/services/footerService';
import type { FooterInfo } from '@/services/footerService';
import {
    ChevronLeft, ChevronRight, Moon, Sun,
    MapPin, Phone, Mail
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';


const ITEMS_PER_PAGE = 6;
const ALL_GROUP_ID = 0;

interface NewsGroupNode extends NewsGroup {
    children?: NewsGroupNode[];
}

function buildNewsTree(groups: NewsGroup[]): NewsGroupNode[] {
    const byId = new Map<number, NewsGroupNode>();
    groups.forEach((g) => byId.set(g.MaNhomTin, { ...g }));

    const roots: NewsGroupNode[] = [];
    byId.forEach((node) => {
        const parentId = node.ParentId;
        const isSelfParent = parentId != null && parentId === node.MaNhomTin;
        const parent = parentId == null || isSelfParent ? undefined : byId.get(parentId);
        if (parent) {
            (parent.children = parent.children || []).push(node);
        } else {
            roots.push(node);
        }
    });

    const sortChildren = (nodes: NewsGroupNode[]) => {
        nodes.sort((a, b) => (a.ThuTu ?? 0) - (b.ThuTu ?? 0));
        nodes.forEach((n) => {
            if (n.children) sortChildren(n.children);
        });
    };
    sortChildren(roots);
    return roots;
}

function HomePage() {
    const navigate = useNavigate();
    const [newsGroups, setNewsGroups] = useState<NewsGroup[]>([]);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number>(ALL_GROUP_ID);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [footerInfo, setFooterInfo] = useState<FooterInfo>();

    const { theme, setTheme } = useTheme();
    const { isAuthenticated, user } = useAuth();

    const newsTree = useMemo(() => {
        const dvDaoTao = user?.dvDaoTao;
        const filtered = dvDaoTao
            ? newsGroups.filter((g) => g.He === dvDaoTao || !g.He)
            : newsGroups;
        return buildNewsTree(filtered);
    }, [newsGroups, user?.dvDaoTao]);
    const selectedGroupName = useMemo(() => {
        if (selectedGroup === ALL_GROUP_ID) return 'Tất cả tin';
        const flat = newsGroups.find((g) => g.MaNhomTin === selectedGroup);
        return flat?.TenNhomTin || 'Tin tức';
    }, [newsGroups, selectedGroup]);

    useEffect(() => {
        const fetchFooterInfo = async () => {
            try {
                const data = await getFooterInfo();
                setFooterInfo(data);
            } catch (error) {
                console.error('Error fetching footer info:', error);
            }
        };
        fetchFooterInfo();
    }, []);

    useEffect(() => {
        const fetchNewsGroups = async () => {
            try {
                const data = await getNewsGroups();
                setNewsGroups(data);
            } catch (error) {
                console.error('Error fetching news groups:', error);
            }
        };
        fetchNewsGroups();
    }, []);

    useEffect(() => {
        const fetchNewsItems = async () => {
            setIsLoading(true);
            try {
                const data = await getNewsItems(selectedGroup);
                setNewsItems(data);
                setCurrentPage(1);
            } catch (error) {
                console.error('Error fetching news items:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNewsItems();
    }, [selectedGroup]);

    const totalPages = Math.ceil(newsItems.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = newsItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className="min-h-screen w-full">
            {/* Theme Toggle Button - Fixed Position */}
            <div className="fixed top-4 right-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-background/80 backdrop-blur-sm shadow-md border-primary/20 hover:bg-accent"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>

            {/* Section 1 - Hero */}
            <section className="relative min-h-screen flex bg-gradient-to-br from-primary via-primary/95 to-primary/80 overflow-hidden dark:from-background dark:via-background/90 dark:to-primary/20">
    

                <div className="relative z-10 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 max-w-2xl">
                    <div className="mb-8">
                        <img
                            src={assets.imageLogo}
                            alt="NEU Logo"
                            className="w-20 h-20 md:w-24 md:h-24 object-contain"
                        />
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight dark:text-foreground">
                        NEU Portal
                    </h1>

                    <p className="text-lg md:text-xl text-white/80 mb-10 max-w-md dark:text-muted-foreground">
                        Cổng thông tin sinh viên Đại học Kinh tế Quốc dân
                    </p>

                    <div className="flex justify-start">
                        <Button
                            size="lg"
                            className="bg-white text-primary hover:bg-white/90 px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                            onClick={() => navigate(isAuthenticated ? '/student/info' : '/login')}
                        >
                            {isAuthenticated ? 'Quản lý thông tin' : 'Đăng nhập'}
                        </Button>
                    </div>
                </div>
            </section>

            {/* Section 2 - Notifications */}
            <section className="min-h-screen flex flex-col justify-center py-16 px-4 md:px-8 lg:px-16 bg-background">
                <div className="max-w-7xl mx-auto w-full">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
                        Thông báo
                    </h2>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar - News Groups */}
                        <div className="lg:w-64 shrink-0">
                            <div className="bg-card rounded-2xl border border-border p-4 sticky top-4">
                                <h3 className="font-semibold text-card-foreground mb-4 text-sm uppercase tracking-wider">
                                    Nhóm tin
                                </h3>
                                <ul className="space-y-1">
                                    <li>
                                        <button
                                            onClick={() => setSelectedGroup(ALL_GROUP_ID)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${selectedGroup === ALL_GROUP_ID
                                                ? 'bg-primary text-primary-foreground font-medium'
                                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                }`}
                                        >
                                            Tất cả tin
                                        </button>
                                    </li>
                                    {newsTree.map((parent) => (
                                        <li key={parent.MaNhomTin} className="space-y-1">
                                            <button
                                                onClick={() => setSelectedGroup(parent.MaNhomTin)}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${selectedGroup === parent.MaNhomTin
                                                    ? 'bg-primary text-primary-foreground font-medium'
                                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                    }`}
                                            >
                                                {parent.TenNhomTin}
                                            </button>
                                            {parent.children?.map((child) => (
                                                <button
                                                    key={child.MaNhomTin}
                                                    onClick={() => setSelectedGroup(child.MaNhomTin)}
                                                    className={`w-full text-left pl-8 pr-4 py-2 rounded-xl text-xs border-l-2 ml-4 transition-all ${selectedGroup === child.MaNhomTin
                                                        ? 'bg-primary text-primary-foreground font-medium border-primary'
                                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground border-border'
                                                        }`}
                                                >
                                                    {child.TenNhomTin}
                                                </button>
                                            ))}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Content - News List */}
                        <div className="flex-1">
                            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-border">
                                    <h3 className="font-semibold text-card-foreground">
                                        {selectedGroupName}
                                    </h3>
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft size={16} />
                                            </Button>
                                            <span className="text-sm text-muted-foreground px-2">
                                                {currentPage} / {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronRight size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* News Items */}
                                <div className="divide-y divide-border">
                                    {isLoading ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            Đang tải...
                                        </div>
                                    ) : paginatedItems.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            Không có thông báo
                                        </div>
                                    ) : (
                                        paginatedItems.map((item) => (
                                            <div
                                                key={item.MaTin}
                                                className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                                                onClick={() => navigate(`/news/${item.MaTin}`)}
                                            >
                                                <h4 className="font-medium text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                                                    {item.TieuDe}
                                                </h4>
                                                <span className="text-sm text-muted-foreground mt-2 block">
                                                    {formatDate(item.CreateDate)}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-card border-t border-border mt-auto">
                <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-12">
                    {footerInfo && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Logo + Address */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    {footerInfo.loginLogoUrl && (
                                        <img
                                            src="https://nguoihoc.neu.edu.vn/static/media/logo_footer.f3b0caed.png"
                                            alt={footerInfo.schoolName}
                                            className="h-16 w-auto object-contain"
                                        />
                                    )}
                                    <span className="font-bold text-xl text-foreground uppercase">
                                        {footerInfo.schoolName}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg text-foreground mb-4">Liên hệ</h3>
                                    <div className="space-y-3 text-sm text-muted-foreground">
                                        {footerInfo.address && (
                                            <div className="flex items-start gap-2">
                                                <MapPin size={16} className="mt-1 shrink-0 text-primary" />
                                                <span>{footerInfo.address}</span>
                                            </div>
                                        )}
                                        {footerInfo.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-primary" />
                                                <span>{footerInfo.phone}</span>
                                            </div>
                                        )}
                                        {footerInfo.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-primary" />
                                                <span>{footerInfo.email}</span>
                                            </div>
                                        )}
                                        {footerInfo.fax && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-primary" />
                                                <span>Fax: {footerInfo.fax}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Website */}
                            {footerInfo.website && (
                                <div>
                                    <h3 className="font-bold text-lg text-foreground mb-4">Website</h3>
                                    <a
                                        href={`https://${footerInfo.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {footerInfo.website}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} {footerInfo?.schoolName}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default HomePage;
