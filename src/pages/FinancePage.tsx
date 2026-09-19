import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
    getStudentFinance,
    getStudentScholarshipPolicy,
    type FinanceItem,
    type ScholarshipItem,
} from '@/services/financeService';
import {
    Loader2,
    AlertCircle,
    Wallet,
    Receipt,
    CheckCircle2,
    Clock,
    XCircle,
    GraduationCap,
    Gift,
    Percent,
    CreditCard,
    TrendingDown,
    List,
    CalendarDays,
} from 'lucide-react';

const getStatusConfig = (item: FinanceItem) => {
    if (item.ConNo > 0) {
        return {
            color: 'bg-red-500/10 text-red-600 border-red-500/30',
            icon: XCircle,
            text: 'Còn nợ',
        };
    }
    if (item.PaidAmount > 0) {
        return {
            color: 'bg-green-500/10 text-green-600 border-green-500/30',
            icon: CheckCircle2,
            text: 'Đã đóng',
        };
    }
    return {
        color: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
        icon: Clock,
        text: 'Chưa có',
    };
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

function FinancePage() {
    const [financeData, setFinanceData] = useState<FinanceItem[]>([]);
    const [scholarshipData, setScholarshipData] = useState<ScholarshipItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('tuition');
    const [viewMode, setViewMode] = useState<'all' | 'byYear'>('all');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [finance, scholarship] = await Promise.all([
                getStudentFinance(),
                getStudentScholarshipPolicy().catch(() => []),
            ]);
            setFinanceData(finance || []);
            setScholarshipData(scholarship || []);
        } catch (err) {
            console.error('Error:', err);
            setError('Không thể tải thông tin tài chính. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter out items with no amount
    const filteredFinanceData = useMemo(() => {
        return financeData.filter(item => item.DebtAmount > 0 || item.PaidAmount > 0);
    }, [financeData]);

    // Group finance data by year and term
    const groupedByYear = useMemo(() => {
        const groups: Record<string, { items: FinanceItem[]; totalAmount: number; totalPaid: number; totalDebt: number }> = {};

        filteredFinanceData.forEach(item => {
            const key = `${item.YearStudy} - ${item.TermID}`;
            if (!groups[key]) {
                groups[key] = { items: [], totalAmount: 0, totalPaid: 0, totalDebt: 0 };
            }
            groups[key].items.push(item);
            groups[key].totalAmount += item.DebtAmount || 0;
            groups[key].totalPaid += item.PaidAmount || 0;
            groups[key].totalDebt += item.ConNo || 0;
        });

        return Object.entries(groups)
            .sort((a, b) => {
                const aOrder = a[1].items[0]?.OrderTerm || 0;
                const bOrder = b[1].items[0]?.OrderTerm || 0;
                return bOrder - aOrder;
            });
    }, [filteredFinanceData]);

    const financeSummary = useMemo(() => {
        const totalAmount = filteredFinanceData.reduce((sum, item) => sum + (item.DebtAmount || 0), 0);
        const totalPaid = filteredFinanceData.reduce((sum, item) => sum + (item.PaidAmount || 0), 0);
        const totalDebt = filteredFinanceData.reduce((sum, item) => sum + (item.ConNo || 0), 0);
        const paidItems = filteredFinanceData.filter(item => item.ConNo === 0 && item.PaidAmount > 0).length;
        return { totalAmount, totalPaid, totalDebt, paidItems, totalItems: filteredFinanceData.length };
    }, [filteredFinanceData]);

    const scholarshipSummary = useMemo(() => {
        const data = Array.isArray(scholarshipData) ? scholarshipData : [];
        const totalDiscount = data.reduce((sum, item) => sum + (item.SoTienMienGiam || 0), 0);
        const totalPolicies = data.length;
        return { totalDiscount, totalPolicies };
    }, [scholarshipData]);

    const normalizedScholarshipData = Array.isArray(scholarshipData) ? scholarshipData : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Đang tải thông tin tài chính...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md w-full border-destructive/50">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                            <p className="text-destructive">{error}</p>
                            <Button onClick={() => fetchData()} variant="outline">
                                Thử lại
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Tài chính
                </h1>
                <p className="text-sm text-muted-foreground">
                    Quản lý học phí và chính sách miễn giảm
                </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="tuition" className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        <span className="hidden sm:inline">Học phí</span>
                    </TabsTrigger>
                    <TabsTrigger value="scholarship" className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        <span className="hidden sm:inline">Miễn giảm</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tuition Tab */}
                <TabsContent value="tuition" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/20">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-primary-foreground/70 text-xs">Tổng học phí</p>
                                        <p className="text-sm md:text-lg font-bold truncate">{formatCurrency(financeSummary.totalAmount)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-lg bg-green-500/10 border-green-500/30">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/20">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-muted-foreground text-xs">Đã đóng</p>
                                        <p className="text-sm md:text-lg font-bold text-green-600 truncate">{formatCurrency(financeSummary.totalPaid)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={cn(
                            "border shadow-lg",
                            financeSummary.totalDebt > 0 ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"
                        )}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        financeSummary.totalDebt > 0 ? "bg-red-500/20" : "bg-green-500/20"
                                    )}>
                                        <TrendingDown className={cn(
                                            "w-5 h-5",
                                            financeSummary.totalDebt > 0 ? "text-red-600" : "text-green-600"
                                        )} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-muted-foreground text-xs">Còn nợ</p>
                                        <p className={cn(
                                            "text-sm md:text-lg font-bold truncate",
                                            financeSummary.totalDebt > 0 ? "text-red-600" : "text-green-600"
                                        )}>
                                            {formatCurrency(financeSummary.totalDebt)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <Receipt className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Số khoản</p>
                                        <p className="text-sm md:text-lg font-bold text-foreground">
                                            {financeSummary.paidItems}/{financeSummary.totalItems}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Finance Table */}
                    <div>
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                                <Wallet className="h-5 w-5 text-primary shrink-0" />
                                <span>Chi tiết học phí</span>
                            </h2>
                            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'all' | 'byYear')}>
                                <TabsList className="shrink-0">
                                    <TabsTrigger value="all">
                                        <List className="w-4 h-4" />
                                        <span className="hidden sm:inline">Tất cả</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="byYear">
                                        <CalendarDays className="w-4 h-4" />
                                        <span className="hidden sm:inline">Theo năm</span>
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        {filteredFinanceData.length === 0 ? (
                            <div className="text-center py-12">
                                <Wallet className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground">Chưa có dữ liệu học phí</p>
                            </div>
                        ) : viewMode === 'all' ? (
                            <>
                                {/* Desktop Table - All View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Nội dung</th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Năm học</th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Loại</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Số tiền</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Đã đóng</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Còn nợ</th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFinanceData.map((item) => {
                                                const statusConfig = getStatusConfig(item);
                                                const StatusIcon = statusConfig.icon;
                                                return (
                                                    <tr
                                                        key={item.TransactionID}
                                                        className={cn(
                                                            "border-b border-border/50 transition-colors hover:bg-muted/50",
                                                            item.ConNo > 0 && "bg-red-500/5"
                                                        )}
                                                    >
                                                        <td className="py-4 px-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-foreground line-clamp-1">
                                                                    {item.FeeName || 'Phí khác'}
                                                                </p>
                                                                {item.FeeID && (
                                                                    <p className="text-xs text-muted-foreground font-mono">{item.FeeID}</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-center text-muted-foreground">
                                                            {item.YearStudy} - {item.TermID}
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-center">
                                                            {item.RegistType && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {item.RegistType}
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-right font-medium">
                                                            {formatCurrency(item.DebtAmount)}
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-right text-green-600 font-medium">
                                                            {formatCurrency(item.PaidAmount)}
                                                        </td>
                                                        <td className={cn(
                                                            "py-4 px-4 text-sm text-right font-medium",
                                                            item.ConNo > 0 ? "text-red-600" : "text-green-600"
                                                        )}>
                                                            {formatCurrency(item.ConNo)}
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <Badge className={cn("gap-1", statusConfig.color)}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                {statusConfig.text}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards - All View */}
                                <div className="md:hidden space-y-3">
                                    {filteredFinanceData.map((item) => {
                                        const statusConfig = getStatusConfig(item);
                                        const StatusIcon = statusConfig.icon;
                                        return (
                                            <div
                                                key={item.TransactionID}
                                                className={cn(
                                                    "p-4 rounded-xl border transition-all",
                                                    item.ConNo > 0 ? "border-red-500/30 bg-red-500/5" : "border-border bg-card"
                                                )}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-foreground line-clamp-2">
                                                            {item.FeeName || 'Phí khác'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.YearStudy} - {item.TermID}
                                                        </p>
                                                    </div>
                                                    <Badge className={cn("gap-1 shrink-0 ml-2", statusConfig.color)}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusConfig.text}
                                                    </Badge>
                                                </div>

                                                {item.RegistType && (
                                                    <div className="mb-3">
                                                        <Badge variant="outline" className="text-xs">
                                                            {item.RegistType}
                                                        </Badge>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-3 gap-2 text-sm pt-3 border-t border-border/50">
                                                    <div className="text-center">
                                                        <p className="font-semibold text-xs md:text-sm">{formatCurrency(item.DebtAmount)}</p>
                                                        <p className="text-xs text-muted-foreground">Học phí</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-semibold text-green-600 text-xs md:text-sm">{formatCurrency(item.PaidAmount)}</p>
                                                        <p className="text-xs text-muted-foreground">Đã đóng</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className={cn("font-semibold text-xs md:text-sm", item.ConNo > 0 ? "text-red-600" : "text-green-600")}>
                                                            {formatCurrency(item.ConNo)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">Còn nợ</p>
                                                    </div>
                                                </div>

                                                {item.PaidDate && (
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Ngày đóng: {item.PaidDate}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            /* By Year View */
                            <div className="space-y-4">
                                {groupedByYear.map(([yearKey, group]) => (
                                    <div key={yearKey} className="border rounded-xl overflow-hidden">
                                        {/* Year Header */}
                                        <div className={cn(
                                            "p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2",
                                            group.totalDebt > 0 ? "bg-red-500/10" : "bg-green-500/10"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <CalendarDays className="w-5 h-5 text-primary" />
                                                <div>
                                                    <h3 className="font-semibold text-foreground">{yearKey}</h3>
                                                    <p className="text-xs text-muted-foreground">{group.items.length} khoản phí</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="text-center">
                                                    <p className="font-bold">{formatCurrency(group.totalAmount)}</p>
                                                    <p className="text-xs text-muted-foreground">Tổng</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-green-600">{formatCurrency(group.totalPaid)}</p>
                                                    <p className="text-xs text-muted-foreground">Đã đóng</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className={cn("font-bold", group.totalDebt > 0 ? "text-red-600" : "text-green-600")}>
                                                        {formatCurrency(group.totalDebt)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Còn nợ</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Year Items */}
                                        <div className="divide-y divide-border/50">
                                            {group.items.map((item) => {
                                                const statusConfig = getStatusConfig(item);
                                                const StatusIcon = statusConfig.icon;
                                                return (
                                                    <div
                                                        key={item.TransactionID}
                                                        className={cn(
                                                            "p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2",
                                                            item.ConNo > 0 && "bg-red-500/5"
                                                        )}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-foreground line-clamp-1">
                                                                {item.FeeName || 'Phí khác'}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {item.RegistType && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {item.RegistType}
                                                                    </Badge>
                                                                )}
                                                                {item.PaidDate && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Đóng: {item.PaidDate}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 sm:gap-4">
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium">{formatCurrency(item.DebtAmount)}</p>
                                                                <p className={cn(
                                                                    "text-xs",
                                                                    item.ConNo > 0 ? "text-red-600" : "text-green-600"
                                                                )}>
                                                                    Nợ: {formatCurrency(item.ConNo)}
                                                                </p>
                                                            </div>
                                                            <Badge className={cn("gap-1 shrink-0", statusConfig.color)}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                <span className="hidden sm:inline">{statusConfig.text}</span>
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Scholarship Tab */}
                <TabsContent value="scholarship" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/70 text-sm">Tổng miễn giảm</p>
                                        <p className="text-3xl font-bold mt-1">{formatCurrency(scholarshipSummary.totalDiscount)}</p>
                                    </div>
                                    <div className="p-4 bg-white/20 rounded-full">
                                        <Gift className="w-8 h-8" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-muted-foreground text-sm">Số chính sách</p>
                                        <p className="text-3xl font-bold mt-1 text-foreground">{scholarshipSummary.totalPolicies}</p>
                                        <p className="text-muted-foreground text-sm mt-1">chính sách miễn giảm</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-full">
                                        <Percent className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Scholarship Table */}
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Chính sách miễn giảm học phí
                        </h2>
                        {normalizedScholarshipData.length === 0 ? (
                            <div className="text-center py-12">
                                <Gift className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground">Chưa có dữ liệu miễn giảm</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Năm học</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Học kỳ</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Chính sách</th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">% Miễn giảm</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Số tiền</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Ghi chú</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {normalizedScholarshipData.map((item, index) => (
                                                <tr
                                                    key={`${item.YearStudy}-${item.TermID}-${index}`}
                                                    className="border-b border-border/50 transition-colors hover:bg-muted/50"
                                                >
                                                    <td className="py-4 px-4 text-sm font-medium text-foreground">
                                                        {item.YearStudy}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-foreground">
                                                        Học kỳ {item.TermID}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <Gift className="w-4 h-4 text-amber-500" />
                                                            {item.TenMienGiam}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                                            {item.PhanTramMienGiam}%
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-right font-bold text-amber-600">
                                                        {formatCurrency(item.SoTienMienGiam)}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-muted-foreground">
                                                        {item.GhiChu || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden space-y-3">
                                    {normalizedScholarshipData.map((item, index) => (
                                        <div
                                            key={`${item.YearStudy}-${item.TermID}-${index}`}
                                            className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="font-semibold text-foreground">{item.YearStudy}</p>
                                                    <p className="text-sm text-muted-foreground">Học kỳ {item.TermID}</p>
                                                </div>
                                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                                    {item.PhanTramMienGiam}%
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded">
                                                <Gift className="w-4 h-4 text-amber-500" />
                                                <span className="text-sm font-medium">{item.TenMienGiam}</span>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                                <span className="text-sm text-muted-foreground">Số tiền miễn giảm</span>
                                                <span className="text-lg font-bold text-amber-600">
                                                    {formatCurrency(item.SoTienMienGiam)}
                                                </span>
                                            </div>

                                            {item.GhiChu && (
                                                <p className="text-sm text-muted-foreground mt-2 italic">
                                                    {item.GhiChu}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default FinancePage;
