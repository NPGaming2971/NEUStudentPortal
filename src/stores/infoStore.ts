import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getStudentAvatar, getStudentInfo, type StudentInfo } from '@/services/studentInfoService';

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

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

                if (!force && studentInfo && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
                    return;
                }

                set({ isLoading: true, error: null });

                try {
                    const response = await getStudentInfo();
                    set({
                        studentInfo: response.sinhVien,
                        isLoading: false,
                        lastFetched: Date.now(),
                    });
                } catch (error) {
                    console.error('Error fetching student info:', error);
                    set({
                        error: 'Không thể tải thông tin sinh viên',
                        isLoading: false,
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
                    lastFetched: null,
                });
            },

            getInitials: () => {
                const { studentInfo } = get();
                if (!studentInfo?.HoTen) return 'SV';

                const names = studentInfo.HoTen.trim().split(' ');
                if (names.length >= 2) {
                    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                }
                return names[0].substring(0, 2).toUpperCase();
            },
        }),
        {
            name: 'studentInfoStorage',
            partialize: (state) => ({
                studentInfo: state.studentInfo,
                lastFetched: state.lastFetched,
            }),
        }
    )
);
