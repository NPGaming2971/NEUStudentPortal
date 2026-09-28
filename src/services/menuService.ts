import api from '@/lib/api';
import { Endpoints } from '@/lib/endpoints';

export interface SidebarMenuItem {
	Id: number;
	TenChucNang: string;
	ThuTu: number;
	LienKet: string | null;
	DoHoaDeThuong: string;
	childMenu?: SidebarMenuItem[];
}

export const getMenu = async (language = 'vi'): Promise<SidebarMenuItem[]> => {
	try {
		const response = await api.get(Endpoints.Auth.GetMenu, {
			params: { language }
		});
		const data = response.data;
		return Array.isArray(data) ? data : (data?.data ?? []);
	} catch (error) {
		console.error('Error fetching sidebar menu:', error);
		throw error;
	}
};
