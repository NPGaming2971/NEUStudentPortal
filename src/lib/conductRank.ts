import { Trophy, Star, TrendingUp, Award, AlertCircle, type LucideIcon } from 'lucide-react';

export interface ConductRankConfig {
	color: string;
	bgColor: string;
	icon: LucideIcon;
	textColor: string;
}

const ConductRankConfigs: Record<string, ConductRankConfig> = {
	'xuất sắc': {
		color: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
		bgColor: 'bg-yellow-500/10 border-yellow-500/30',
		icon: Trophy,
		textColor: 'text-yellow-600 dark:text-yellow-400'
	},
	tốt: {
		color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
		bgColor: 'bg-green-500/10 border-green-500/30',
		icon: Star,
		textColor: 'text-green-600 dark:text-green-400'
	},
	khá: {
		color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
		bgColor: 'bg-blue-500/10 border-blue-500/30',
		icon: TrendingUp,
		textColor: 'text-blue-600 dark:text-blue-400'
	},
	'trung bình': {
		color: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
		bgColor: 'bg-orange-500/10 border-orange-500/30',
		icon: Award,
		textColor: 'text-orange-600 dark:text-orange-400'
	},
	yếu: {
		color: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
		bgColor: 'bg-red-500/10 border-red-500/30',
		icon: AlertCircle,
		textColor: 'text-red-600 dark:text-red-400'
	},
	kém: {
		color: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
		bgColor: 'bg-red-500/10 border-red-500/30',
		icon: AlertCircle,
		textColor: 'text-red-600 dark:text-red-400'
	}
};

const DefaultConductRankConfig: ConductRankConfig = {
	color: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
	bgColor: 'bg-gray-500/10 border-gray-500/30',
	icon: Award,
	textColor: 'text-gray-600 dark:text-gray-400'
};

const normalizeConductRank = (rank: string | null | undefined): string => (rank ?? '').trim().toLowerCase();

// Full config for the "Điểm rèn luyện" score table (ConductScorePage).
export const getConductRankConfig = (rank: string | null | undefined): ConductRankConfig =>
	ConductRankConfigs[normalizeConductRank(rank)] ?? DefaultConductRankConfig;

// Just the badge color class, for compact rank chips (ConductAssessmentPage).
export const getConductRankBadgeClass = (rank: string | null | undefined): string =>
	ConductRankConfigs[normalizeConductRank(rank)]?.color ?? 'bg-muted text-muted-foreground';

// Score → rank label, shared by the conduct assessment live totals.
export const getConductRankFromScore = (score: number): string => {
	if (score >= 90) return 'Xuất sắc';
	if (score >= 80) return 'Tốt';
	if (score >= 65) return 'Khá';
	if (score >= 50) return 'Trung bình';
	if (score >= 35) return 'Kém';
	return 'Yếu';
};
