export interface CourseTypeInfo {
	label: string;
	className: string;
}

// Numerical study-unit type codes: 1 = Lý thuyết, 2 = Thực hành, 3 = LT & TH.
const CourseTypes: Record<number, CourseTypeInfo> = {
	1: { label: 'Lý thuyết', className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
	2: { label: 'Thực hành', className: 'bg-green-500/20 text-green-600 border-green-500/30' },
	3: { label: 'LT & TH', className: 'bg-purple-500/20 text-purple-600 border-purple-500/30' }
};

const DefaultCourseType: CourseTypeInfo = {
	label: 'Khác',
	className: 'bg-gray-500/20 text-gray-600 border-gray-500/30'
};

export const getCourseTypeInfo = (typeId: number | null | undefined): CourseTypeInfo =>
	CourseTypes[typeId ?? -1] ?? DefaultCourseType;

export const isTheoryCourseType = (typeId: number | null | undefined): boolean => typeId === 1;
