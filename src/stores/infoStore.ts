import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getStudentAvatar, getStudentInfo, type StudentInfo } from '@/services/studentInfoService';
import { getInitials as getStudentInitials } from '@/lib/utils';

interface InfoState {
	studentInfo: StudentInfo | null;
	avatar: string;
	isLoading: boolean;
	error: string | null;
	lastFetched: number | null;

	// Actions
	fetchStudentInfo: (force?: boolean) => Promise<void>;
	fetchStudentAvatar: (force?: boolean) => Promise<void>;
	clearStudentInfo: () => void;
	getInitials: () => string;
}

const CacheDuration = 5 * 60 * 1000; // 5 minutes

export const useInfoStore = create<InfoState>()(
	persist(
		(set, get) => ({
			studentInfo: null,
			avatar: '',
			isLoading: false,
			error: null,
			lastFetched: null,

			fetchStudentInfo: async (force = false) => {
				const { lastFetched, studentInfo } = get();

				if (!force && studentInfo && lastFetched && Date.now() - lastFetched < CacheDuration) {
					return;
				}

				set({ isLoading: true, error: null });

				try {
					const response = await getStudentInfo();
					set({
						studentInfo: response.sinhVien,
						isLoading: false,
						lastFetched: Date.now()
					});
				} catch (error) {
					console.error('Error fetching student info:', error);
					set({
						error: 'Không thể tải thông tin sinh viên',
						isLoading: false
					});
				}
			},

			fetchStudentAvatar: async (force = false) => {
				const { avatar } = get();
				if (!force && avatar) {
					return;
				}

				try {
					const response = await getStudentAvatar();
					set({ avatar: response.data });
				} catch (error) {
					console.error('Error fetching student avatar:', error);
				}
			},

			clearStudentInfo: () => {
				set({
					studentInfo: null,
					avatar: '',
					isLoading: false,
					error: null,
					lastFetched: null
				});
			},

			getInitials: () => {
				const { studentInfo } = get();
				if (!studentInfo?.HoTen) return 'SV';
				return getStudentInitials(studentInfo.HoTen);
			}
		}),
		{
			name: 'studentInfoStorage',
			partialize: (state) => ({
				studentInfo: state.studentInfo,
				lastFetched: state.lastFetched
			})
		}
	)
);
