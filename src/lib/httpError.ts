const readString = (value: unknown): string | null => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
};

const collectMessages = (data: unknown, depth: number, messages: string[], visited: Set<unknown>): void => {
	if (data === null || depth > 4 || visited.has(data)) return;
	visited.add(data);

	const text = readString(data);
	if (text) {
		messages.push(text);
		return;
	}
	if (Array.isArray(data)) {
		for (const item of data) collectMessages(item, depth + 1, messages, visited);
		return;
	}
	if (typeof data === 'object') {
		const record = data as Record<string, unknown>;
		for (const key of [
			'message',
			'Message',
			'msg',
			'Msg',
			'error',
			'Error',
			'detail',
			'Detail',
			'title',
			'Title',
			'description',
			'Description'
		]) {
			if (key in record) collectMessages(record[key], depth + 1, messages, visited);
		}
		for (const key of ['errors', 'Errors', 'ModelState', 'modelState']) {
			const errors = record[key];
			if (errors && typeof errors === 'object') {
				for (const value of Object.values(errors as Record<string, unknown>))
					collectMessages(value, depth + 1, messages, visited);
			}
		}
	}
};

const readServerMessage = (data: unknown): string | null => {
	if (data === undefined) return null;
	const messages: string[] = [];
	collectMessages(data, 0, messages, new Set());
	return messages.length ? messages.join('\n') : null;
};

const readStatus = (error: unknown): number | undefined => {
	if (!error || typeof error !== 'object') return undefined;
	const candidate = error as { response?: { status?: unknown }; status?: unknown; statusCode?: unknown };
	for (const value of [candidate.response?.status, candidate.status, candidate.statusCode]) {
		if (typeof value === 'number') return value;
	}
	return undefined;
};

const networkLike = (error: Error): boolean =>
	/timeout|network error|failed to fetch|load failed|timed out/i.test(error.message);

export const httpErrorStatus = (error: unknown): number | undefined => readStatus(error);

export const responseMessage = (data: unknown): string | null => readServerMessage(data);

export const httpErrorMessage = (error: unknown): string => {
	const status = readStatus(error);
	const response = error && typeof error === 'object' ? (error as { response?: unknown }).response : undefined;
	if (response !== undefined || status !== undefined) {
		const serverMessage = readServerMessage(response);
		if (serverMessage) return serverMessage;
	}
	if (error instanceof Error && error.message && !networkLike(error)) {
		return error.message;
	}
	return status ? `Yêu cầu thất bại (mã ${status})` : 'Lỗi kết nối mạng, vui lòng thử lại';
};
