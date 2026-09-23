import registrationApi from '@/lib/registrationApi';

export interface StudyProgram {
	StudyProgramID: string;
	StudyProgramName: string;
	IsOpen?: boolean;
}

export interface RegistSemesterQuota {
	ID: number;
	IdDot: number;
	MainTermMinCredits: number;
	MainTermMaxCredits: number;
	MaxTheoryCredits: number;
	MaxPraticeCredits: number;
	RegistNoneProgram: number;
	DeletePerMin: number;
	IsSinhVienNoPhi: number;
	IsInsert: boolean;
	IsTranfer: boolean;
	IsDelete: boolean;
	DebtFee: number;
	IsCheckDebtFee: boolean;
	RegistAble: boolean;
	RegistAbleDescr: string;
	IsRegistClassStudent: number;
	IsRegistPlan: boolean;
	IsRegistSecond: boolean;
	IsRegistImprove: boolean;
	IsRegistCross: boolean;
	IsRegistOutPlan: boolean;
	IsRegistProgram: number;
	IsRegistOutProgram: boolean;
	isChanDSSVDK: boolean;
	YearStudy: string;
	TermID: string;
	BeginDate: string;
	EndDate: string;
	IsConflictSchedule: boolean;
	LanguageID: string | null;
	IsStudentTest: number;
	RandID: number;
	IsAllowGhiDanh: boolean;
	IsGDKeHoach: boolean;
	IsGDChuongTrinh: boolean;
	IsGDNgoaiChuongTrinh: boolean;
}

export interface StudyType {
	ChucNangID: string;
	TenChucNang: string;
	LienKet: string;
	HienThi: boolean;
	GhiChu: string | null;
	ThuTu: number;
	LoaiHinh: string;
	MapID: string | null;
}

export interface ClassStudyUnitPlan {
	CurriculumID: string;
	CurriculumName: string;
	Credits: number;
	CurriculumTypeGroupName: string;
	IsInsert: boolean;
	SelectionID: string | null;
	SelectionName: string | null;
	IsRegisted: boolean;
	TenChuyenNganh: string | null;
	CurriculumType: number;
}

export interface ClassStudyUnitPlanGroup {
	SelectionName: string | null;
	classStudyUnitPlan: ClassStudyUnitPlan;
	Selections: ClassStudyUnitPlan[];
}

export interface CurriculumTypeGroup {
	CurriculumTypeGroupName: string;
	ClassStudyUnitPlans: ClassStudyUnitPlanGroup[];
}

export interface RegisteredClass {
	ScheduleStudyUnitID: string;
	CurriculumID: string;
	CurriculumName: string;
	Credits: number;
	ProfessorName: string;
	Schedules: string;
	BeginDate: string;
	EndDate: string;
	StudyUnitTypeName: string;
	ScheduleStudyUnitAlias?: string;
	StudyUnitID?: string;
	StudyUnitName?: string | null;
	StudyUnitTypeID?: number;
	Status?: number;
	IsTranfer?: boolean;
	IsDelete?: boolean;
	TrungLich?: boolean;
}

export interface ClassStudyUnitItem {
	StudyUnitID: string;
	StudyUnitName: string | null;
	CurriculumID: string;
	CurriculumName: string;
	CurriculumType: string;
	NumberOfScheduleStudyUnit: number;
	Credits: number;
	CurriculumTypeGroupName: string;
	IsInsert: boolean;
	SelectionID: string;
	SelectionName: string | null;
}

export interface ClassStudyUnitGroup {
	SelectionName: string | null;
	Selections: ClassStudyUnitItem[];
}

export interface ClassAllowRegistGroup {
	CurriculumTypeGroupName: string;
	classStudyUnits: ClassStudyUnitGroup[];
}

export interface ScheduleStudyUnit {
	CurriculumID: string;
	ScheduleStudyUnitAlias: string;
	CurriculumName: string;
	StudyUnitID: string;
	TypeName: string;
	Credits: number;
	StudentQuotas: string;
	StudyUnitTypeID: number;
	NumberOfStudents: number;
	Schedules: string;
	ProfessorName: string;
	IsRegisted: boolean;
	ListOfClassStudentID: string;
	NumberOfChilds: number;
	FeeDebt: string;
	ParentID: string;
	UpdateDate: string;
	NumberRegistOfEmpty: string;
	IsHocTrucTuyen: string;
	IsOnTap: string;
	IsSongNgu: string;
	isOpen?: boolean;
	isOpenChilrentTask?: boolean;
}

export interface CheckConflictResponse {
	IsConflict: boolean;
	IsFull: boolean;
	Message: string | null;
}

// Get all study programs for registration
export const getAllStudyPrograms = async (): Promise<StudyProgram[]> => {
	try {
		const response = await registrationApi.get('/Authen/GetAllStudyProgramRegist');
		return Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error('Error fetching study programs:', error);
		throw error;
	}
};

// Get registration semester quota
export const getRegistSemesterQuota = async (studyProgramId: string): Promise<RegistSemesterQuota | null> => {
	try {
		const response = await registrationApi.get('/Regist/GetRegistSemesterCreditQuota', {
			params: {
				StudyProgramID: studyProgramId
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching registration quota:', error);
		throw error;
	}
};

// ==================== NORMAL REGISTRATION APIs ====================

// Get all classes registered
export const getAllClassRegisted = async (
	status: string,
	turnId: number
): Promise<{ Rows: RegisteredClass[]; Reval: unknown }> => {
	try {
		const response = await registrationApi.post('/Regist/GetAllClassRegisted', {
			ReqParam1: status,
			ReqParam2: turnId.toString()
		});
		return response.data || { Rows: [], Reval: null };
	} catch (error) {
		console.error('Error fetching registered classes:', error);
		throw error;
	}
};

// Get all classes allowed to register
export const getAllClassAllowRegist = async (
	studyProgramId: string,
	studyType: string,
	yearStudy: string,
	termId: string
): Promise<ClassAllowRegistGroup[]> => {
	try {
		const response = await registrationApi.post('/Regist/GetAllClassAllowRegist', {
			ReqParam1: studyProgramId,
			ReqParam2: studyType,
			ReqParam3: yearStudy,
			ReqParam4: termId,
			ReqParam5: ''
		});
		return Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error('Error fetching allowed classes:', error);
		throw error;
	}
};

// Get all schedule units for a class
export const getAllScheduleUnitAllowRegist = async (
	studyProgramId: string,
	studyType: string,
	studyUnitId: string
): Promise<ScheduleStudyUnit[]> => {
	try {
		const response = await registrationApi.post('/Regist/GetAllScheduleUnitAllowRegist', {
			ReqParam1: studyProgramId,
			ReqParam2: studyType,
			ReqParam3: studyUnitId
		});
		return Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error('Error fetching schedule units:', error);
		throw error;
	}
};

// Check if registration conflicts
export const checkExitsRegist = async (
	studyProgramId: string,
	schedules: ScheduleStudyUnit[]
): Promise<CheckConflictResponse> => {
	try {
		const response = await registrationApi.post('/Regist/CheckExitsRegist', schedules, {
			params: {
				StudyProgramID: studyProgramId
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error checking registration conflict:', error);
		throw error;
	}
};

// Submit registration
export const registScheduleStudyUnit = async (
	turnId: number,
	studyProgramId: string,
	schedules: ScheduleStudyUnit[]
): Promise<string> => {
	try {
		const response = await registrationApi.post('/Regist/RegistScheduleStudyUnit', schedules, {
			params: {
				TurnID: turnId,
				Action: 'REGIST',
				StudyProgramID: studyProgramId
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error submitting registration:', error);
		throw error;
	}
};

// Remove registration
export const removeScheduleStudyUnit = async (
	turnId: number,
	studyProgramId: string,
	registeredClass: RegisteredClass
): Promise<string> => {
	try {
		const response = await registrationApi.post('/Regist/RemoveScheduleStudyUnit', registeredClass, {
			params: {
				TurnID: turnId,
				StudyProgramID: studyProgramId
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error removing registration:', error);
		throw error;
	}
};

// ==================== PLAN REGISTRATION APIs ====================

// Get all study programs for plan registration
export const getAllStudyProgramsForPlan = async (): Promise<StudyProgram[]> => {
	try {
		const response = await registrationApi.get('/Authen/GetAllStudyProgramRegistPlan');
		return Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error('Error fetching study programs for plan:', error);
		throw error;
	}
};

// Get plan registration semester quota
export const getPlanRegistSemesterQuota = async (studyProgramId: string): Promise<RegistSemesterQuota | null> => {
	try {
		const response = await registrationApi.get('/RegistPlan/GetRegistSemesterCreditQuota', {
			params: {
				studyProgramID: studyProgramId
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching plan registration quota:', error);
		throw error;
	}
};

// Get all study types
export const getAllStudyTypes = async (): Promise<StudyType[]> => {
	try {
		const response = await registrationApi.get('/Authen/GetAllStudyType');
		return Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error('Error fetching study types:', error);
		throw error;
	}
};

// Get all classes registered for plan
export const getAllClassesRegisteredPlan = async (yearStudy: string, termId: string): Promise<RegisteredClass[]> => {
	try {
		const response = await registrationApi.post('/RegistPlan/GetAllClassRegistedPlan', {
			ReqParam1: yearStudy,
			ReqParam2: termId
		});
		return Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error('Error fetching registered classes for plan:', error);
		throw error;
	}
};

// Get all classes allowed to register for plan
export const getAllClassesAllowedPlan = async (
	studyProgramId: string,
	studyType: string,
	yearStudy: string,
	termId: string
): Promise<CurriculumTypeGroup[]> => {
	try {
		const response = await registrationApi.post('/RegistPlan/GetAllClassAllowRegistPlan', {
			ReqParam1: studyProgramId,
			ReqParam2: studyType,
			ReqParam3: yearStudy,
			ReqParam4: termId
		});
		return Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error('Error fetching allowed classes for plan:', error);
		throw error;
	}
};

// Insert schedule study unit plan (register a course)
export const insertScheduleStudyUnitPlan = async (
	courses: ClassStudyUnitPlan[],
	studyType: string,
	yearStudy: string,
	termId: string,
	studyProgramId: string
): Promise<string> => {
	try {
		const response = await registrationApi.post(
			'/RegistPlan/InsertScheduleStudyUnitPlan',
			courses.map((course) => ({
				...course,
				IsRegisted: true
			})),
			{
				params: {
					Types: studyType,
					YearStudy: yearStudy,
					TermID: termId,
					studyProgramID: studyProgramId
				}
			}
		);
		return response.data || 'Đăng ký thành công';
	} catch (error) {
		console.error('Error registering course plan:', error);
		throw error;
	}
};

export interface ScheduleStudyUnitSearch {
	ScheduleStudyUnitName: string;
	ScheduleStudyUnitID: string;
	ScheduleStudyUnitAlias: string;
	CurriculumID: string;
	StudyUnitTypeName: string;
	StudentQuotas: string;
	Schedules: string;
	ProfessorName: string;
	Credits: number;
	StudyUnitTypeID: number;
	StudyUnitID: string;
	ClassOfStudentID: string;
	BeginDate: string;
	EndDate: string;
}

export const searchScheduleStudyUnits = async (
	searchQuery: string,
	searchType: '0' | '1' = '0'
): Promise<ScheduleStudyUnitSearch[]> => {
	try {
		const response = await registrationApi.post('/Schedule/GetAllScheduleStudyUnit', {
			ReqParam1: searchQuery,
			ReqParam2: searchType
		});
		return Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error('Error searching schedule study units:', error);
		throw error;
	}
};

// ==================== YEAR STUDY AND TERM ====================

export interface YearStudyAndTerm {
	YearStudys: string[];
	TermIDs: string[];
	CurrentTermID: string;
	CurrentYearStudy: string;
}

// Get all year studies and terms
export const getAllYearStudyAndTerm = async (): Promise<YearStudyAndTerm> => {
	try {
		const response = await registrationApi.get('/Schedule/GetAllYearStudyAndTerm');
		return response.data;
	} catch (error) {
		console.error('Error fetching year study and term:', error);
		throw error;
	}
};

// ==================== REGISTRATION HISTORY ====================

export interface RegistrationHistory {
	UpdateDate: string;
	Task: string;
	Info: string;
	UpdateStaff: string;
	CurriculumName: string;
	CurriculumID: string;
	Status: number;
	color: string;
}

// Get all registration history
export const getAllRegistrationHistory = async (yearStudy: string, termId: string): Promise<RegistrationHistory[]> => {
	try {
		const response = await registrationApi.post('/Regist/GetAllHistory', {
			ReqParam1: yearStudy,
			ReqParam2: termId
		});
		return Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error('Error fetching registration history:', error);
		throw error;
	}
};

// Remove schedule study unit plan (cancel registration)
export interface RemoveCourseRequest {
	CurriculumID: string;
	CurriculumName: string;
	Credits: number;
	IsDelete: boolean;
	IsRegisted: boolean;
}

export const removeScheduleStudyUnitPlan = async (
	courses: RemoveCourseRequest[],
	studyType: string,
	yearStudy: string,
	termId: string,
	studyProgramId: string
): Promise<string> => {
	try {
		const response = await registrationApi.post(
			'/RegistPlan/RemoveScheduleStudyUnitPlan',
			courses.map((course) => ({
				CurriculumID: course.CurriculumID,
				CurriculumName: course.CurriculumName,
				Credits: course.Credits,
				IsDelete: true,
				IsRegisted: true
			})),
			{
				params: {
					Types: studyType,
					YearStudy: yearStudy,
					TermID: termId,
					studyProgramID: studyProgramId
				}
			}
		);
		return response.data || 'Hủy đăng ký thành công';
	} catch (error) {
		console.error('Error removing course plan:', error);
		throw error;
	}
};
