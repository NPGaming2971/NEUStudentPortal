import type { ComponentType, ReactNode } from "react";
import { Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Layouts
import NothingLayout from "@/components/layouts/NothingLayout";
import SidebarLayout from "@/components/layouts/SidebarLayout";

// Pages
import HomePage from "@/pages/HomePage";
import NewsDetailPage from "@/pages/NewsDetailPage";
import NotFoundPage from "@/pages/NotFoundPage";
import LoginPage from "@/pages/LoginPage";
import StudentPage from "@/pages/StudentPage";
import NotificationsPage from "@/pages/NotificationsPage";
import EducationalProgramPage from "@/pages/EducationalProgramPage";
import ClassSchedulePage from "@/pages/ClassSchedulePage";
import ExamSchedulePage from "@/pages/ExamSchedulePage";
import DecisionsPage from "@/pages/DecisionsPage";
import AttendancePage from "@/pages/AttendancePage";
import ConductScorePage from "@/pages/ConductScorePage";
import AcademicResultsPage from "@/pages/AcademicResultsPage";
import FinancePage from "@/pages/FinancePage";
import CourseRegistrationResultsPage from "@/pages/CourseRegistrationResultsPage";
import GraduationPage from "@/pages/GraduationPage";
import DiscussionPage from "@/pages/DiscussionPage";
import ConductAssessmentPage from "@/pages/ConductAssessmentPage";
import CertificatesPage from "@/pages/CertificatesPage";
import RegistrationPage from "@/pages/RegistrationPage";
import RegistrationPlanPage from "@/pages/RegistrationPlanPage";
import RegistrationSearchPage from "@/pages/RegistrationSearchPage";
import RegistrationHistoryPage from "@/pages/RegistrationHistoryPage";
import StudentUpdatePage from "@/pages/StudentUpdatePage";
import PlaceholderPage from "@/pages/PlaceholderPage";

export interface RouteConfig {
	path: string;
	component: ComponentType;
	layout: ComponentType<{ children: ReactNode }>;
}

function ProtectedHomePage() {
	const { isAuthenticated } = useAuth();
	if (!isAuthenticated) return <Navigate to="/login" replace />;
	return <HomePage />;
}

const publicRoutes: RouteConfig[] = [
	{
		path: "/",
		component: ProtectedHomePage,
		layout: NothingLayout,
	},
	{
		path: "/pagenews",
		component: HomePage,
		layout: NothingLayout,
	},
	{
		path: "/news/:newsId",
		component: NewsDetailPage,
		layout: NothingLayout,
	},
	{
		path: "/login",
		component: LoginPage,
		layout: NothingLayout,
	},
	{
		path: "*",
		component: NotFoundPage,
		layout: NothingLayout,
	},
];

const privateRoutes: RouteConfig[] = [
	{
		path: "/student/info",
		component: StudentPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/update",
		component: StudentUpdatePage,
		layout: SidebarLayout,
	},
	{
		path: "/student/index",
		component: NotificationsPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/tiendohoctap",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/thongtintotnghiep",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/studyprograms",
		component: EducationalProgramPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/classstudentschedules",
		component: ClassSchedulePage,
		layout: SidebarLayout,
	},
	{
		path: "/student/exam",
		component: ExamSchedulePage,
		layout: SidebarLayout,
	},
	{
		path: "/student/decisions",
		component: DecisionsPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/diemdanhsinhvien",
		component: AttendancePage,
		layout: SidebarLayout,
	},
	{
		path: "/student/xemdiemrenluyen",
		component: ConductScorePage,
		layout: SidebarLayout,
	},
	{
		path: "/student/marks",
		component: AcademicResultsPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/accountfees",
		component: FinancePage,
		layout: SidebarLayout,
	},
	{
		path: "/student/ketquadangky",
		component: CourseRegistrationResultsPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/chitiethoadon",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/chuandaura",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/baohiemyte",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/miengiamtrocap",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/ketquaphancongdoan",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/noingoaitrusv",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/graduation",
		component: GraduationPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/lienhe",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/chuongtrinhdaotaothu2",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/registacademic",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/hoanthi",
		component: PlaceholderPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/comment",
		component: DiscussionPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/behaviorscore",
		component: ConductAssessmentPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/chungchingoaingu",
		component: CertificatesPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/dangkyhocphan",
		component: RegistrationPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/dangkyhocphan/plan",
		component: RegistrationPlanPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/dangkyhocphan/search",
		component: RegistrationSearchPage,
		layout: SidebarLayout,
	},
	{
		path: "/student/dangkyhocphan/history",
		component: RegistrationHistoryPage,
		layout: SidebarLayout,
	},
];

export const renderRoutes = () => (
	<>
		{publicRoutes.map((route, index) => {
			const Page = route.component;
			const Layout = route.layout;

			return (
				<Route
					key={index}
					path={route.path}
					element={
						<Layout>
							<Page />
						</Layout>
					}
				/>
			);
		})}
		{privateRoutes.map((route, index) => {
			const Page = route.component;
			const Layout = route.layout;

			return (
				<Route
					key={`private-${index}`}
					path={route.path}
					element={
						<Layout>
							<Page />
						</Layout>
					}
				/>
			);
		})}
	</>
);

export { publicRoutes, privateRoutes };