// Notification Service - Student notifications/messages
import api from '@/lib/api';
import { Endpoints } from '@/lib/endpoints';

export const getStudentNotifications = async () => {
	try {
		const response = await api.get(Endpoints.Student.GetMessagesByReceiverID);
		return response.data;
	} catch (error) {
		console.error('Error fetching student notifications:', error);
		throw error;
	}
};

export const updateMessageStatus = async (messageId: number) => {
	try {
		await api.get(Endpoints.Student.UpdateStatusMessages, {
			params: { id: messageId }
		});
	} catch (error) {
		console.error('Error updating message status:', error);
		throw error;
	}
};
