import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import ChangePasswordDialog from "@/components/common/ChangePasswordDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/useTheme";
import { useInfoStore } from "@/stores/infoStore";
import { useMenuStore } from "@/stores/menuStore";
import type { SidebarMenuItem } from "@/services/menuService";
import assets from "@/assets";
import {
	Bell,
	GraduationCap,
	Calendar,
	ClipboardList,
	FileText,
	LogOut,
	BookOpen,
	ClipboardCheck,
	PenLine,
	BarChart3,
	MessageSquare,
	ArrowLeft,
	Sun,
	Moon,
	MoreVertical,
	Pencil,
	KeyRound,
	User,
	TrendingUp,
	HelpCircle,
	Archive,
	CalendarDays,
	Receipt,
	CreditCard,
	HeartPulse,
	Files,
	FolderKanban,
	MapPin,
	Lightbulb,
	ChartColumn,
	Building2,
	BadgeCheck,
	BookOpenCheck,
	ClipboardPen,
	CalendarX2,
	Shield,
	ExternalLink,
} from "lucide-react";

interface MenuItem {
	name: string;
	path: string;
	icon: React.ElementType;
	specialAction?: () => void;
}

interface MenuGroup {
	title: string;
	items: MenuItem[];
}

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
	onLogout: () => void;
}

const MENU_ICONS: Record<string, React.ElementType> = {
	DocumentObject: FileText,
	User,
	TienDoHocTap: TrendingUp,
	Bell,
	Huongdansudung: HelpCircle,
	ArchiveNew: Archive,
	CalendarStudent: Calendar,
	CalendarExam: CalendarDays,
	DocumentCheck: ClipboardCheck,
	Marks: GraduationCap,
	DocumentBehaviorScore: BarChart3,
	Order: Receipt,
	Decisions: FileText,
	CreditCard,
	Regists: PenLine,
	Baohiemyte: HeartPulse,
	DocumentTwoPapper: Files,
	Ketquaphancongdoan: FolderKanban,
	Noingoaitrusv: MapPin,
	PencilAlt: PenLine,
	IdeaDisscus: Lightbulb,
	ChartSquareBar: ChartColumn,
	Graduation: GraduationCap,
	DichvucongMotcua: Building2,
	Esurvey: ClipboardList,
	Tailieuso: BookOpen,
	Comment: MessageSquare,
	Chungchingoaingu: BadgeCheck,
	Chuongtrinhdaotaothu2: BookOpenCheck,
	Registacademic: ClipboardPen,
	Hoanthi: CalendarX2,
	BaoHiemYTe: Shield,
};

const DEFAULT_ICON: React.ElementType = HelpCircle;

const getMenuIcon = (iconKey: string): React.ElementType =>
	MENU_ICONS[iconKey] ?? DEFAULT_ICON;

const buildMenuTree = (items: SidebarMenuItem[]): MenuGroup[] => {
	const groups: MenuGroup[] = [];

	items.forEach((root) => {
		const children = root.childMenu ?? [];
		if (children.length === 0) {
			const path = root.LienKet ?? "";
			if (!path) return;
			groups.push({
				title: root.TenChucNang,
				items: [],
			});
			return;
		}

		groups.push({
			title: root.TenChucNang,
			items: children
				.filter((child) => child.LienKet)
				.map((child) => ({
					name: child.TenChucNang,
					path: child.LienKet!,
					icon: getMenuIcon(child.DoHoaDeThuong),
				})),
		});
	});

	return groups;
};

function Sidebar({ isOpen, onClose, onLogout }: SidebarProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const [isDesktop, setIsDesktop] = useState(false);
	const [showChangePassword, setShowChangePassword] = useState(false);
	const { theme, setTheme } = useTheme();
	const { studentInfo, avatar, fetchStudentInfo, fetchStudentAvatar, getInitials } = useInfoStore();
	const menu = useMenuStore((state) => state.menu);
	const fetchMenu = useMenuStore((state) => state.fetchMenu);

	const selectedPath = location.pathname;
	const isRegistrationMode = useMemo(() => {
		return (
			location.pathname.includes("/student/dangkyhocphan") &&
			!location.pathname.includes("/student/ketquadangky")
		);
	}, [location.pathname]);

	// Fetch student info on mount
	useEffect(() => {
		fetchStudentInfo();
		fetchStudentAvatar();
	}, [fetchStudentInfo, fetchStudentAvatar]);

	// Fetch menu on mount
	useEffect(() => {
		fetchMenu();
	}, [fetchMenu]);

	useEffect(() => {
		const checkScreenSize = () => {
			setIsDesktop(window.innerWidth >= 1024);
		};
		checkScreenSize();
		window.addEventListener("resize", checkScreenSize);
		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	const registrationMenu: MenuGroup[] = [
		{
			title: "Đăng ký học phần",
			items: [
				{
					name: "Đăng ký học phần",
					path: "/student/dangkyhocphan",
					icon: PenLine,
				},
				{
					name: "Đăng ký ghi danh",
					path: "/student/dangkyhocphan/plan",
					icon: ClipboardList,
				},
				{
					name: "Tra cứu học phần",
					path: "/student/dangkyhocphan/search",
					icon: BookOpen,
				},
				{
					name: "Lịch sử đăng ký",
					path: "/student/dangkyhocphan/history",
					icon: ClipboardCheck,
				},
			],
		},
	];

	const mainMenu = useMemo(
		() => buildMenuTree(menu),
		[menu],
	);

	const handleNavigation = (path: string, specialAction?: () => void) => {
		if (specialAction) {
			specialAction();
			return;
		}

		if (path.startsWith("http")) {
			window.open(path, "_blank");
			onClose();
			return;
		}

		if (path && path !== selectedPath) {
			navigate(path);
			onClose();
		}
	};

	const handleBackToNormalSidebar = () => {
		navigate("/student/info");
	};

	const currentMenu = isRegistrationMode ? registrationMenu : mainMenu;

	return (
		<>
			{/* Overlay - only on mobile */}
			{!isDesktop && (
				<div
					className={cn(
						"fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
						isOpen ? "opacity-100" : (
							"opacity-0 pointer-events-none"
						),
					)}
					onClick={onClose}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 flex flex-col transition-transform duration-300 ease-in-out",
					isOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{/* Header */}
				<div className='p-4 border-b border-border'>
					<div className='flex items-center gap-3'>
						<img
							src={assets.imageLogo}
							alt='NEU Logo'
							className='w-12 h-12 object-contain cursor-pointer'
							onClick={() => handleNavigation("/pagenews")}
						/>
						<div className='flex-1 min-w-0'>
							<h1
								className='font-bold text-foreground text-sm cursor-pointer hover:text-primary transition-colors leading-tight'
								onClick={() => handleNavigation("/pagenews")}
							>
								Đại Học Kinh tế Quốc dân
							</h1>
							<p className='text-xs text-muted-foreground'>
								Cổng thông tin sinh viên
							</p>
						</div>
					</div>
				</div>

				{/* Back Button for Registration Mode */}
				{isRegistrationMode && (
					<div className='p-3 border-b border-border'>
						<Button
							variant='ghost'
							className='w-full justify-start gap-2 text-primary hover:text-primary hover:bg-primary/10'
							onClick={handleBackToNormalSidebar}
						>
							<ArrowLeft size={18} />
							<span>Trở về trang chính</span>
						</Button>
					</div>
				)}

				{/* Menu */}
				<div className='flex-1 overflow-y-auto py-4 px-3 space-y-6'>
					{currentMenu.length === 0 && (
						<p className='text-xs text-muted-foreground px-3'>
							Đang tải menu...
						</p>
					)}
					{currentMenu.map((group, groupIndex) => (
						<div key={groupIndex}>
							<h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2'>
								{group.title}
							</h3>
							<div className='space-y-1'>
								{group.items.map((item, itemIndex) => {
									const Icon = item.icon;
									const isSelected =
										item.path === selectedPath;

									return (
										<button
											key={itemIndex}
											onClick={() =>
												handleNavigation(
													item.path,
													item.specialAction,
												)
											}
											className={cn(
												"cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
												isSelected ?
													"bg-primary text-primary-foreground font-medium"
													: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
											)}
										>
											<Icon
												size={18}
												className='shrink-0'
											/>
											<span className='truncate'>
												{item.name}
											</span>
											{item.path.startsWith(
												"http",
											) && (
												<ExternalLink
													size={14}
													className='shrink-0 ml-auto opacity-70'
												/>
											)}
										</button>
									);
								})}
							</div>
						</div>
					))}
				</div>

				{/* Footer */}
				<div className='p-4 border-t border-border'>
					<div className='flex items-center gap-3'>
						{/* Avatar */}
						<Avatar className='h-10 w-10 border-2 border-primary/20'>
							<AvatarImage src={avatar || undefined} alt={studentInfo?.HoTen || 'Avatar'} />
							<AvatarFallback className='bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold text-sm'>
								{getInitials()}
							</AvatarFallback>
						</Avatar>

						{/* Info */}
						<div className='flex-1 min-w-0'>
							<p className='text-sm font-semibold text-foreground truncate'>
								{studentInfo?.HoTen || 'Đang tải...'}
							</p>
							<p className='text-xs text-muted-foreground font-mono'>
								{studentInfo?.MaSinhVien || '---'}
							</p>
						</div>

						{/* Dropdown Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' size='icon' className='h-8 w-8 shrink-0'>
									<MoreVertical size={18} />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-56'>
								<DropdownMenuItem onClick={() => navigate('/student/update')}>
									<Pencil size={16} className='mr-2' />
									Cập nhật thông tin
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setShowChangePassword(true)}>
									<KeyRound size={16} className='mr-2' />
									Đổi mật khẩu
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<div className='px-2 py-1.5'>
									<p className='text-xs text-muted-foreground mb-2'>Giao diện</p>
									<Tabs value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")} className="w-full">
										<TabsList className="w-full flex h-8">
											<TabsTrigger value="light" className="flex-1 text-xs px-2">
												<Sun size={14} className="mr-1.5" />
												Sáng
											</TabsTrigger>
											<TabsTrigger value="dark" className="flex-1 text-xs px-2">
												<Moon size={14} className="mr-1.5" />
												Tối
											</TabsTrigger>
										</TabsList>
									</Tabs>
								</div>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={onLogout}
									className='text-destructive focus:text-destructive focus:bg-destructive/10'
								>
									<LogOut size={16} className='mr-2' />
									Đăng xuất
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</aside>
			<ChangePasswordDialog
				open={showChangePassword}
				onOpenChange={setShowChangePassword}
			/>
		</>
	);
}

export default Sidebar;