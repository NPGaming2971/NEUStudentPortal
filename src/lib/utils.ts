import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export interface FormatDateOptions {
	includeTime?: boolean;
	fallback?: string;
}

export function formatDate(dateString: string | null | undefined, options: FormatDateOptions = {}): string {
	const { includeTime = false, fallback = '' } = options;
	if (!dateString) return fallback;
	try {
		const date = new Date(dateString);
		if (Number.isNaN(date.getTime())) return fallback;
		const intlOptions: Intl.DateTimeFormatOptions = {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		};
		if (includeTime) {
			intlOptions.hour = '2-digit';
			intlOptions.minute = '2-digit';
		}
		return date.toLocaleDateString('vi-VN', intlOptions);
	} catch {
		return fallback;
	}
}

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND'
	}).format(amount);
}
export function formatTitle(title: string): string {
	if (!title) return '';
	return title
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.trim();
}

export function formatNotificationBody(body: string): string {
	if (!body) return '';
	return body;
}
