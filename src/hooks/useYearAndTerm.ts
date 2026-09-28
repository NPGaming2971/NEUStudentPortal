import { useEffect, useMemo, useReducer } from 'react';
import { getYearAndTerm, type Term, type YearAndTermData } from '@/services/scheduleService';

export interface YearTermFilterState {
	yearTermData: YearAndTermData | null;
	selectedYear: string;
	setSelectedYear: (year: string) => void;
	selectedTerm: string;
	setSelectedTerm: (term: string) => void;
	termsForSelectedYear: Term[];
	isLoading: boolean;
	error: string | null;
	retry: () => void;
}

interface YearTermState {
	data: YearAndTermData | null;
	selectedYear: string;
	selectedTerm: string;
	isLoading: boolean;
	error: string | null;
	reloadKey: number;
}

type YearTermAction =
	| { type: 'load' }
	| { type: 'success'; data: YearAndTermData }
	| { type: 'failure' }
	| { type: 'selectYear'; year: string }
	| { type: 'selectTerm'; term: string }
	| { type: 'reload' };

const resolveYearTerm = (data: YearAndTermData | null, year: string, currentTerm: string): string => {
	const item = data?.items.find((i) => i.YearStudy === year);
	if (!item) return currentTerm;
	const fallbackTerm = item.Terms.find((t) => t.CurrentTerm)?.TermID ?? item.Terms[0]?.TermID ?? '';
	return item.Terms.some((t) => t.TermID === currentTerm) ? currentTerm : fallbackTerm;
};

const initialState: YearTermState = {
	data: null,
	selectedYear: '',
	selectedTerm: '',
	isLoading: true,
	error: null,
	reloadKey: 0
};

const yearTermReducer = (state: YearTermState, action: YearTermAction): YearTermState => {
	switch (action.type) {
		case 'load':
			return { ...state, isLoading: true, error: null };
		case 'success':
			return {
				...state,
				data: action.data,
				selectedYear: action.data.CurrentYear,
				selectedTerm: action.data.CurrentTerm,
				isLoading: false,
				error: null
			};
		case 'failure':
			return { ...state, isLoading: false, error: 'Không thể tải dữ liệu năm học và học kỳ' };
		case 'selectYear':
			return {
				...state,
				selectedYear: action.year,
				selectedTerm: resolveYearTerm(state.data, action.year, state.selectedTerm)
			};
		case 'selectTerm':
			return { ...state, selectedTerm: action.term };
		case 'reload':
			return { ...state, reloadKey: state.reloadKey + 1 };
	}
};

/**
 * Shares the year/term fetch + "reset term when the year changes" behaviour
 * used by every filterable page. Accepts an optional fetcher so the conduct
 * (YearAndTermScore) and registration (GetAllYearStudyAndTerm) endpoints can
 * reuse the same logic — both are normalized to the YearAndTermData shape.
 */
export const useYearAndTerm = (fetcher: () => Promise<YearAndTermData> = getYearAndTerm): YearTermFilterState => {
	const [state, dispatch] = useReducer(yearTermReducer, initialState);

	useEffect(() => {
		let cancelled = false;
		dispatch({ type: 'load' });
		fetcher()
			.then((data) => {
				if (!cancelled) dispatch({ type: 'success', data });
			})
			.catch((err) => {
				console.error('Error:', err);
				if (!cancelled) dispatch({ type: 'failure' });
			});
		return () => {
			cancelled = true;
		};
	}, [fetcher, state.reloadKey]);

	const termsForSelectedYear = useMemo<Term[]>(() => {
		if (!state.data) return [];
		return state.data.items.find((i) => i.YearStudy === state.selectedYear)?.Terms ?? state.data.Terms ?? [];
	}, [state.data, state.selectedYear]);

	return {
		yearTermData: state.data,
		selectedYear: state.selectedYear,
		setSelectedYear: (year: string) => dispatch({ type: 'selectYear', year }),
		selectedTerm: state.selectedTerm,
		setSelectedTerm: (term: string) => dispatch({ type: 'selectTerm', term }),
		termsForSelectedYear,
		isLoading: state.isLoading,
		error: state.error,
		retry: () => dispatch({ type: 'reload' })
	};
};
