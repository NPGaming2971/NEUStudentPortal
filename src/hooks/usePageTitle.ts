import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMenuStore } from "@/stores/menuStore";
import type { SidebarMenuItem } from "@/services/menuService";

const REGISTRATION_TITLES: Record<string, string> = {
	"/student/dangkyhocphan": "Đăng ký học phần",
	"/student/dangkyhocphan/plan": "Đăng ký ghi danh",
	"/student/dangkyhocphan/search": "Tra cứu học phần",
	"/student/dangkyhocphan/history": "Lịch sử đăng ký",
};

const DEFAULT_TITLE = "Cổng thông tin đào tạo";

const flattenMenu = (items: SidebarMenuItem[]): { path: string; name: string }[] => {
	const result: { path: string; name: string }[] = [];
	const walk = (nodes: SidebarMenuItem[]) => {
		nodes.forEach((node) => {
			if (node.LienKet) result.push({ path: node.LienKet, name: node.TenChucNang });
			if (node.childMenu?.length) walk(node.childMenu);
		});
	};
	walk(items);
	return result;
};

export const usePageTitle = () => {
	const location = useLocation();
	const { pathname } = location;
	const menu = useMenuStore((state) => state.menu);

	useEffect(() => {
		const title =
			REGISTRATION_TITLES[pathname] ??
			flattenMenu(menu).find((item) => item.path === pathname)?.name;

		document.title = title ? title : DEFAULT_TITLE;
	}, [pathname, menu]);
};