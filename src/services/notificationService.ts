// Notification Service - Student notifications/messages
import api from '@/lib/api';

export const getStudentNotifications = async () => {
    try {
        const response = await api.get('/student/GetMessagesByReceiverID');
        return response.data;
    } catch (error) {
        console.error('Error fetching student notifications:', error);
        throw error;
    }
};

export const updateMessageStatus = async (messageId: number) => {
    try {
        await api.get('/student/UpdateStatusMessages', {
            params: { id: messageId },
        });
    } catch (error) {
        console.error('Error updating message status:', error);
        throw error;
    }
};
