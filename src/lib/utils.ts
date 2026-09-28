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
	return body
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
		.replace(/javascript:/gi, '');
}

export function parseDate(value: string | null | undefined): Date | null {
	const str = (value || '').trim();
	if (!str) return null;

	let match = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/.exec(str);
	if (match) {
		const [, d, m, y] = match;
		const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
		return isNaN(date.getTime()) ? null : date;
	}

	match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(str);
	if (match) {
		const [, y, m, d] = match;
		const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
		return isNaN(date.getTime()) ? null : date;
	}

	const date = new Date(str);
	return isNaN(date.getTime()) ? null : date;
}

export function timeToMinutes(time: string): number {
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
	const normalized = ((minutes % 1440) + 1440) % 1440;
	return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

export interface DateTimeParts {
	date?: string;
	time?: string;
}

export function splitDateTime(value?: string | null): DateTimeParts {
	const [date, time] = (value || '').trim().split(' ');
	return { date: date || undefined, time: time?.slice(0, 5) || undefined };
}

export function convertScoreToGPA4(score10: number): number {
	if (score10 >= 8.5) return 4;
	if (score10 >= 8) return 3.5;
	if (score10 >= 7) return 3;
	if (score10 >= 6.5) return 2.5;
	if (score10 >= 5.5) return 2;
	if (score10 >= 5) return 1.5;
	if (score10 >= 4) return 1;
	return 0;
}

export function getInitials(name: string): string {
	const parts = (name || '').trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
