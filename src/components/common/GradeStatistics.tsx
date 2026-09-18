import { useMemo } from 'react';
import {
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { TrendingUp, Award, BookOpen, Target, GraduationCap, Lightbulb, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import type { CourseGrade, GradeYear, GradeSemester } from '@/services/academicService';

interface GradeStatisticsProps {
    yearlyResults: GradeYear[];
    gpa: {
        semesterGPA10?: number;
        semesterGPA4?: number;
        cumulativeGPA10?: number;
        cumulativeGPA4?: number;
        creditsEarned?: number;
    };
}

const GRADE_COLORS: Record<string, string> = {
    'A+': '#22c55e',
    'A': '#22c55e',
    'B+': '#3b82f6',
    'B': '#3b82f6',
    'C+': '#06b6d4',
    'C': '#06b6d4',
    'D+': '#f97316',
    'D': '#f97316',
    'F': '#ef4444',
};

const PIE_COLORS = ['#22c55e', '#3b82f6', '#06b6d4', '#f97316', '#ef4444', '#8b5cf6'];

export default function GradeStatistics({ yearlyResults, gpa }: GradeStatisticsProps) {
    // Calculate statistics
    const stats = useMemo(() => {
        const allCourses: CourseGrade[] = [];
        const semesterGPAs: { name: string; gpa10: number; gpa4: number; credits: number }[] = [];
        const gradeDistribution: Record<string, number> = {};

        yearlyResults.forEach((year) => {
            year.DanhSachDiem?.forEach((semester: GradeSemester) => {
                const rawCourses = semester.DanhSachDiemHK || [];

                // Dedupe by module code so theory/tutorial sections are not double-counted
                const seen = new Set<string>();
                const courses = rawCourses.filter((course) => {
                    const key = course.CurriculumID || course.StudyUnitID || '';
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                allCourses.push(...courses);

                // Semester GPA from AverageScore (per-semester summary)
                const avg = semester.AverageScore;
                if (avg && (avg.AverageScore != null || avg.AverageScore4 != null)) {
                    const semesterName = `${year.NamHoc.split('-')[0].slice(-2)}/${semester.HocKy.replace('HK0', 'HK')}`;
                    semesterGPAs.push({
                        name: semesterName,
                        gpa10: avg.AverageScore ?? 0,
                        gpa4: avg.AverageScore4 ?? 0,
                        credits: avg.TongSTC ?? 0,
                    });
                }

                // Count grade distribution
                courses.forEach((course) => {
                    const grade = course.DiemTK_Chu || 'Chưa có';
                    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
                });
            });
        });

        // Calculate pass/fail
        const passCount = allCourses.filter(c => c.Ispass === 'True').length;
        const failCount = allCourses.filter(c => c.Ispass === 'False').length;

        // Calculate total credits
        const totalCredits = allCourses.reduce((sum, c) => sum + (c.Credits || 0), 0);
        const passedCredits = allCourses
            .filter(c => c.Ispass === 'True')
            .reduce((sum, c) => sum + (c.Credits || 0), 0);

        // Grade distribution for pie chart
        const gradeData = Object.entries(gradeDistribution)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => {
                const order = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
                return order.indexOf(a.name) - order.indexOf(b.name);
            });

        // Score distribution (histogram)
        const scoreRanges = [
            { range: '9-10', min: 9, max: 10, count: 0 },
            { range: '8-9', min: 8, max: 9, count: 0 },
            { range: '7-8', min: 7, max: 8, count: 0 },
            { range: '6-7', min: 6, max: 7, count: 0 },
            { range: '5-6', min: 5, max: 6, count: 0 },
            { range: '4-5', min: 4, max: 5, count: 0 },
            { range: '0-4', min: 0, max: 4, count: 0 },
        ];

        allCourses.forEach((course) => {
            const score = parseFloat(String(course.DiemTK_10 ?? ''));
            if (!isNaN(score)) {
                const range = scoreRanges.find(r => score >= r.min && score < r.max) || scoreRanges[scoreRanges.length - 1];
                if (range) range.count++;
            }
        });

        return {
            totalCourses: allCourses.length,
            passCount,
            failCount,
            totalCredits,
            passedCredits,
            semesterGPAs,
            gradeData,
            scoreRanges: scoreRanges.reverse(),
            passRate: allCourses.length > 0 ? (passCount / allCourses.length * 100).toFixed(1) : 0,
        };
    }, [yearlyResults]);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-muted-foreground">GPA Tích lũy</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                        {gpa.cumulativeGPA4?.toFixed(2) || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">/4.0</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-muted-foreground">Tổng môn học</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalCourses}</p>
                    <p className="text-xs text-muted-foreground">
                        {stats.passCount} đạt / {stats.failCount} chưa đạt
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-muted-foreground">Tỷ lệ đạt</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{stats.passRate}%</p>
                    <p className="text-xs text-muted-foreground">tỷ lệ vượt qua</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="text-xs text-muted-foreground">Tín chỉ</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{stats.passedCredits}</p>
                    <p className="text-xs text-muted-foreground">/{stats.totalCredits} tín chỉ</p>
                </div>
            </div>

            {/* GPA Trend Chart */}
            {stats.semesterGPAs.length > 0 && (
                <div className="p-4 rounded-xl border bg-card shadow-sm">
                    <h3 className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2">
                        <LineChartIcon className="w-4 h-4 text-primary" />
                        Xu hướng GPA theo học kỳ
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={stats.semesterGPAs}>
                            <defs>
                                <linearGradient id="colorGpa10" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorGpa4" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                stroke="#9ca3af"
                            />
                            <YAxis
                                domain={[0, 10]}
                                tick={{ fontSize: 12 }}
                                stroke="#9ca3af"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="gpa10"
                                name="GPA (thang 10)"
                                stroke="#3b82f6"
                                fill="url(#colorGpa10)"
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="gpa4"
                                name="GPA (thang 4)"
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={{ fill: '#22c55e', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                {/* Grade Distribution Pie Chart */}
                {stats.gradeData.length > 0 && (
                    <div className="p-4 rounded-xl border bg-card shadow-sm">
                        <h3 className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4 text-primary" />
                            Phân bố điểm chữ
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={stats.gradeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {stats.gradeData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={GRADE_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Score Distribution Bar Chart */}
                {stats.scoreRanges.some(r => r.count > 0) && (
                    <div className="p-4 rounded-xl border bg-card shadow-sm">
                        <h3 className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Phân bố điểm số
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stats.scoreRanges} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <YAxis
                                    dataKey="range"
                                    type="category"
                                    tick={{ fontSize: 12 }}
                                    stroke="#9ca3af"
                                    width={50}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    name="Số môn"
                                    fill="#8b5cf6"
                                    radius={[0, 4, 4, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Credits Progress */}
            <div className="p-4 rounded-xl border bg-card shadow-sm">
                <h3 className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Tiến độ tín chỉ
                </h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tín chỉ hoàn thành</span>
                        <span className="font-semibold">{stats.passedCredits}/{stats.totalCredits}</span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{
                                width: `${stats.totalCredits > 0 ? (stats.passedCredits / stats.totalCredits * 100) : 0}%`
                            }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        {stats.totalCredits > 0 ? (stats.passedCredits / stats.totalCredits * 100).toFixed(1) : 0}% hoàn thành
                    </p>
                </div>
            </div>

            {/* Performance Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border shadow-sm">
                <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Tổng kết
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-primary">
                            {yearlyResults.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Năm học</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-primary">
                            {stats.semesterGPAs.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Học kỳ</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-primary">
                            {stats.totalCourses}
                        </p>
                        <p className="text-xs text-muted-foreground">Môn học</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-primary">
                            {gpa.creditsEarned || stats.passedCredits}
                        </p>
                        <p className="text-xs text-muted-foreground">TC tích lũy</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
