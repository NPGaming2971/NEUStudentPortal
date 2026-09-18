import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInfoStore } from '@/stores/infoStore';
import {
    Mail,
    MapPin,
    GraduationCap,
    Loader2,
    AlertCircle,
    CreditCard,
    Users,
    UserCheck,
} from 'lucide-react';

function StudentPage() {
    const { studentInfo: studentData, avatar, isLoading, error, fetchStudentInfo, fetchStudentAvatar } = useInfoStore();

    useEffect(() => {
        fetchStudentInfo();
        fetchStudentAvatar();
    }, [fetchStudentInfo, fetchStudentAvatar]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                            <p className="text-destructive">{error}</p>
                            <Button onClick={() => fetchStudentInfo()}>
                                Thử lại
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Thông tin sinh viên
                </h1>
                <p className="text-sm text-muted-foreground">
                    Xem thông tin cá nhân của bạn
                </p>
            </div>

            {/* Desktop Grid Layout: 3 cols x 2 rows */}
            <div className="grid gap-3 lg:grid-cols-3 lg:grid-rows-2">
                {/* Div 1: Student Avatar & Quick Info - spans 2 rows */}
                <div className="bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground rounded-xl border border-border shadow-sm lg:row-span-2 flex flex-col justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30 shadow-lg overflow-hidden">
                            {avatar ? (
                                <img src={avatar} alt={studentData?.HoTen || 'Avatar'} className="w-full h-full object-cover" />
                            ) : (
                                studentData?.HoTen?.split(' ').pop()?.charAt(0) || 'S'
                            )}
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold">{studentData?.HoTen}</h2>
                            <p className="text-primary-foreground/80">
                                {studentData?.MaSinhVien} • {studentData?.LopSinhVien}
                            </p>
                            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                                    {studentData?.KhoaHoc}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-sm ${studentData?.TinhTrangHoc === 'Còn học'
                                    ? 'bg-green-500/30'
                                    : 'bg-yellow-500/30'
                                    }`}>
                                    {studentData?.TinhTrangHoc}
                                </span>
                            </div>
                        </div>
                        {/* Additional info in avatar section */}
                        <div className="w-full mt-2 pt-2 border-t border-white/20 space-y-1">
                            {[
                                { label: 'Mã sinh viên', value: studentData?.MaSinhVien },
                                { label: 'Ngày sinh', value: studentData?.NgaySinh },
                                { label: 'Giới tính', value: studentData?.GioiTinh },
                                { label: 'CMND/CCCD', value: studentData?.CMND },
                                { label: 'Dân tộc', value: studentData?.DanToc },
                                { label: 'Tôn giáo', value: studentData?.TonGiao },
                            ].map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-primary-foreground/70">{item.label}</span>
                                    <span className="font-medium">{item.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                        {/* Cố vấn học tập */}
                        <div className="w-full mt-2 pt-2 border-t border-white/20 space-y-1">
                            <div className="flex items-center gap-1.5 text-sm font-semibold mb-1">
                                <UserCheck className="h-4 w-4" />
                                Cố vấn học tập
                            </div>
                            {[
                                { label: 'Cố vấn', value: studentData?.CoVanHocTap },
                                { label: 'Liên hệ', value: studentData?.LienHeCoVHT },
                            ].map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-primary-foreground/70">{item.label}</span>
                                    <span className="font-medium">{item.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Div 2: Thông tin liên hệ - row 1, col 2 */}
                <Card className="overflow-hidden">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Mail className="h-5 w-5 text-primary" />
                            Thông tin liên hệ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 px-4 pb-3 pt-2">
                        {[
                            { label: 'Email cá nhân', value: studentData?.EmailCaNhan },
                            { label: 'Email trường', value: studentData?.EmailTruong || 'Chưa có' },
                            { label: 'Di động', value: studentData?.DiDong },
                            { label: 'Điện thoại bàn', value: studentData?.DienThoaiBan },
                            { label: 'Địa chỉ', value: studentData?.DiaChi },
                        ].map((item, index) => (
                            <div key={index} className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {item.label}
                                </span>
                                <span className="text-foreground font-medium break-words">
                                    {item.value || '—'}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Div 3: Thông tin học tập - row 1, col 3 */}
                <Card className="overflow-hidden">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Thông tin học tập
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 px-4 pb-3 pt-2">
                        {[
                            { label: 'Lớp sinh viên', value: studentData?.LopSinhVien },
                            { label: 'Khóa học', value: studentData?.KhoaHoc },
                            { label: 'Niên khóa', value: studentData?.NienKhoa },
                            { label: 'Loại hình đào tạo', value: studentData?.LoaiHinhDaoTao },
                            { label: 'Tình trạng học', value: studentData?.TinhTrangHoc },
                            { label: 'Năm hết hạn', value: studentData?.NamHetHan },
                        ].map((item, index) => (
                            <div key={index} className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {item.label}
                                </span>
                                <span className="text-foreground font-medium break-words">
                                    {item.value || '—'}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Div 4: Địa chỉ chi tiết - row 2, col 2 */}
                <Card className="overflow-hidden lg:col-start-2">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="h-5 w-5 text-primary" />
                            Địa chỉ chi tiết
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 px-4 pb-3 pt-2">
                        {[
                            { label: 'Quốc gia', value: studentData?.QuocGia },
                            { label: 'Tỉnh/Thành phố', value: studentData?.TinhThanh },
                            { label: 'Quận/Huyện', value: studentData?.QuanHuyen || 'Chưa cập nhật' },
                            { label: 'Phường/Xã', value: studentData?.PhuongXa || 'Chưa cập nhật' },
                            { label: 'Địa chỉ', value: studentData?.DiaChi },
                        ].map((item, index) => (
                            <div key={index} className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {item.label}
                                </span>
                                <span className="text-foreground font-medium break-words">
                                    {item.value || '—'}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Div 5: Người liên hệ + Ngân hàng - row 2, col 3 */}
                <Card className="overflow-hidden lg:col-start-3">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-5 w-5 text-primary" />
                            Người liên hệ khẩn cấp
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 px-4 pb-3 pt-2">
                        {[
                            { label: 'Họ tên', value: studentData?.HoTenNguoiLienHe },
                            { label: 'Địa chỉ', value: studentData?.DiaChiNguoiLienHe },
                            { label: 'Điện thoại', value: studentData?.DienThoaiNguoiLienHe },
                        ].map((item, index) => (
                            <div key={index} className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {item.label}
                                </span>
                                <span className="text-foreground font-medium break-words">
                                    {item.value || '—'}
                                </span>
                            </div>
                        ))}
                        {(studentData?.STK || studentData?.TenNganHang) && (
                            <div className="border-t pt-2 mt-2">
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1.5">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    Thông tin ngân hàng
                                </div>
                                {[
                                    { label: 'Số tài khoản', value: studentData?.STK || 'Chưa có' },
                                    { label: 'Ngân hàng', value: studentData?.TenNganHang || 'Chưa có' },
                                ].map((item, index) => (
                                    <div key={index} className="flex flex-col mt-1">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            {item.label}
                                        </span>
                                        <span className="text-foreground font-medium break-words">
                                            {item.value || '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default StudentPage;

