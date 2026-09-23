// Discussion Service - Comments and discussions for courses
import api from '@/lib/api';

export interface CourseForComment {
	ScheduleStudyUnitID: string;
	StudyUnitAlias: string;
	CurriculumName: string;
	ProfessorName: string;
	Credits: number;
	CreditInfos: string;
	ListOfWeekSchedules: string;
	StudyUnitTypeID: number;
}

export interface Discussion {
	DiscussionID: string;
	SenderID: string;
	SenderName: string;
	DiscussionDate: string;
	DiscussionContent: string;
}

export interface InsertCommentResponse {
	Message?: string;
	success?: boolean;
}

export const getComments = async (yearStudy: string, termId: string): Promise<CourseForComment[]> => {
	try {
		const response = await api.get('/student/Comment', {
			params: {
				namhoc: yearStudy,
				hocky: termId
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching comments:', error);
		throw error;
	}
};

export const getDiscussions = async (scheduleStudyUnitID: string): Promise<Discussion[]> => {
	try {
		const response = await api.get('/student/GetDiscussions_Sel', {
			params: { ScheduleStudyUnitID: scheduleStudyUnitID }
		});
		return Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error('Error fetching discussions:', error);
		return [];
	}
};

export const insertComment = async (scheduleID: string, content: string): Promise<InsertCommentResponse> => {
	try {
		const response = await api.post('/student/InsertComment', {
			ScheduleID: scheduleID,
			NoiDung: content,
			NguoiGui: null
		});
		return response.data;
	} catch (error) {
		console.error('Error inserting comment:', error);
		throw error;
	}
};
