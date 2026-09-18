import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';
import { useInfoStore } from '@/stores/infoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getStudentUpdateInfo,
    getProvinces,
    getReligions,
    getEthnicGroups,
    getCountries,
    getDistricts,
    updateStudent,
} from '@/services/studentInfoService';
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    MapPin,
    Users,
    UserCheck,
} from 'lucide-react';

interface SelectOption {
    id: number | string;
    name: string;
}

function StudentUpdatePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [countries, setCountries] = useState<SelectOption[]>([]);
    const [provinces, setProvinces] = useState<SelectOption[]>([]);
    const [districts, setDistricts] = useState<SelectOption[]>([]);
    const [religions, setReligions] = useState<SelectOption[]>([]);
    const [ethnicGroups, setEthnicGroups] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showSuccess, showError } = useGlobalNotification();
    const { fetchStudentInfo } = useInfoStore();

    useEffect(() => {
        const initForm = async () => {
            try {
                const [
                    studentData,
                    provincesData,
                    religionsData,
                    ethnicGroupsData,
                    countriesData,
                ] = await Promise.all([
                    getStudentUpdateInfo(),
                    getProvinces(),
                    getReligions(),
                    getEthnicGroups(),
                    getCountries(),
                ]);

                setFormData(studentData || {});
                setProvinces(provincesData?.map((p: { ProvinceID: number; ProvinceName: string }) => ({ id: p.ProvinceID, name: p.ProvinceName })) || []);
                setReligions(religionsData?.map((r: { ReligionID: number; ReligionName: string }) => ({ id: r.ReligionID, name: r.ReligionName })) || []);
                setEthnicGroups(ethnicGroupsData?.map((e: { EthnicID: number; EthnicName: string }) => ({ id: e.EthnicID, name: e.EthnicName })) || []);
                setCountries(countriesData?.map((c: { CountryID: number; CountryName: string }) => ({ id: c.CountryID, name: c.CountryName })) || []);

                if (studentData?.TinhThanhThuongTru) {
                    try {
                        const districtsData = await getDistricts(studentData.TinhThanhThuongTru);
                        setDistricts(districtsData?.map((d: { DistrictID: number; DistrictName: string }) => ({ id: d.DistrictID, name: d.DistrictName })) || []);
                    } catch (error) {
                        console.error('Error fetching initial districts:', error);
                    }
                }
            } catch (error) {
                console.error('Error initializing form:', error);
            } finally {
                setLoading(false);
            }
        };

        initForm();
    }, []);

    useEffect(() => {
        const fetchDistricts = async () => {
            if (formData.TinhThanhThuongTru) {
                try {
                    const districtsData = await getDistricts(formData.TinhThanhThuongTru as number);
                    setDistricts(districtsData?.map((d: { DistrictID: number; DistrictName: string }) => ({ id: d.DistrictID, name: d.DistrictName })) || []);
                } catch (error) {
                    console.error('Error fetching districts:', error);
                }
            } else {
                setDistricts([]);
            }
        };

        fetchDistricts();
    }, [formData.TinhThanhThuongTru]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const checked = e.target.checked;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleBack = () => {
        navigate('/student/info');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await updateStudent(formData);
            showSuccess(response?.Message || 'Lưu dữ liệu thành công');
            // Refresh student info in store
            await fetchStudentInfo(true);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { Message?: string } } };
            showError(err.response?.data?.Message || 'Có lỗi xảy ra khi cập nhật thông tin');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Đang tải form...</p>
                </div>
            </div>
        );
    }

    const inputClassName = "h-10 bg-background border-border focus:ring-primary";

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Cập nhật thông tin
                </h1>
                <p className="text-sm text-muted-foreground">
                    Chỉnh sửa thông tin cá nhân của bạn
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Thông tin cá nhân */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Thông tin cá nhân
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="MaSinhVien">Mã sinh viên</Label>
                                <Input
                                    id="MaSinhVien"
                                    name="MaSinhVien"
                                    value={(formData.MaSinhVien as string) || ''}
                                    disabled
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="HoLot">Họ lót</Label>
                                <Input
                                    id="HoLot"
                                    name="HoLot"
                                    value={(formData.HoLot as string) || ''}
                                    disabled
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="Ten">Tên</Label>
                                <Input
                                    id="Ten"
                                    name="Ten"
                                    value={(formData.Ten as string) || ''}
                                    disabled
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="NgaySinh">Ngày sinh</Label>
                                <Input
                                    id="NgaySinh"
                                    name="NgaySinh"
                                    value={(formData.NgaySinh as string) || ''}
                                    disabled
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="Email">Email trường</Label>
                                <Input
                                    id="Email"
                                    name="Email"
                                    type="email"
                                    value={(formData.Email as string) || ''}
                                    disabled
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="EmailSV">Email khác</Label>
                                <Input
                                    id="EmailSV"
                                    name="EmailSV"
                                    type="email"
                                    value={(formData.EmailSV as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="DiDong">Di động</Label>
                                <Input
                                    id="DiDong"
                                    name="DiDong"
                                    value={(formData.DiDong as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="DienThoaiBan">Điện thoại bàn</Label>
                                <Input
                                    id="DienThoaiBan"
                                    name="DienThoaiBan"
                                    value={(formData.DienThoaiBan as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="CMND">CMND/CCCD</Label>
                                <Input
                                    id="CMND"
                                    name="CMND"
                                    value={(formData.CMND as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="NgayCapCMND">Ngày cấp CMND</Label>
                                <Input
                                    id="NgayCapCMND"
                                    name="NgayCapCMND"
                                    value={(formData.NgayCapCMND as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="NoiCapCMND">Nơi cấp CMND</Label>
                                <Input
                                    id="NoiCapCMND"
                                    name="NoiCapCMND"
                                    value={(formData.NoiCapCMND as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="NoiSinh">Nơi sinh</Label>
                                <Input
                                    id="NoiSinh"
                                    name="NoiSinh"
                                    value={(formData.NoiSinh as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Dân tộc</Label>
                                <Select
                                    value={String(formData.DanToc || '')}
                                    onValueChange={(value) => handleSelectChange('DanToc', value)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder="Chọn dân tộc" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ethnicGroups.map((ethnic) => (
                                            <SelectItem key={ethnic.id} value={String(ethnic.id)}>
                                                {ethnic.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tôn giáo</Label>
                                <Select
                                    value={String(formData.TonGiao || '')}
                                    onValueChange={(value) => handleSelectChange('TonGiao', value)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder="Chọn tôn giáo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {religions.map((religion) => (
                                            <SelectItem key={religion.id} value={String(religion.id)}>
                                                {religion.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Hộ khẩu thường trú */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Hộ khẩu thường trú
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Quốc gia</Label>
                                <Select
                                    value={String(formData.QuocGiaThuongTru || '')}
                                    onValueChange={(value) => handleSelectChange('QuocGiaThuongTru', value)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder="Chọn quốc gia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map((country) => (
                                            <SelectItem key={country.id} value={String(country.id)}>
                                                {country.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tỉnh/Thành phố</Label>
                                <Select
                                    value={String(formData.TinhThanhThuongTru || '')}
                                    onValueChange={(value) => handleSelectChange('TinhThanhThuongTru', value)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder="Chọn tỉnh/thành" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provinces.map((province) => (
                                            <SelectItem key={province.id} value={String(province.id)}>
                                                {province.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Quận/Huyện</Label>
                                <Select
                                    value={String(formData.QuanHuyenThuongTru || '')}
                                    onValueChange={(value) => handleSelectChange('QuanHuyenThuongTru', value)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder="Chọn quận/huyện" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {districts.map((district) => (
                                            <SelectItem key={district.id} value={String(district.id)}>
                                                {district.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="PhuongXaThuongTru">Phường/Xã</Label>
                                <Input
                                    id="PhuongXaThuongTru"
                                    name="PhuongXaThuongTru"
                                    value={(formData.PhuongXaThuongTru as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="SoNhaThuongTru">Số nhà</Label>
                                <Input
                                    id="SoNhaThuongTru"
                                    name="SoNhaThuongTru"
                                    value={(formData.SoNhaThuongTru as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="DiaChiLienLac">Địa chỉ liên lạc</Label>
                                <Input
                                    id="DiaChiLienLac"
                                    name="DiaChiLienLac"
                                    value={(formData.DiaChiLienLac as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Thông tin gia đình */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Thông tin gia đình
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Thông tin cha */}
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-4">Thông tin cha</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="flex items-center space-x-2 col-span-full">
                                    <Checkbox
                                        id="MatCha"
                                        checked={(formData.MatCha as boolean) || false}
                                        onCheckedChange={(checked) => handleCheckboxChange('MatCha', checked as boolean)}
                                    />
                                    <Label htmlFor="MatCha" className="cursor-pointer">Đã mất</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="FatherName">Họ tên cha</Label>
                                    <Input
                                        id="FatherName"
                                        name="FatherName"
                                        value={(formData.FatherName as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="FatherBirthday">Năm sinh</Label>
                                    <Input
                                        id="FatherBirthday"
                                        name="FatherBirthday"
                                        value={(formData.FatherBirthday as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="FatherOccupation">Nghề nghiệp</Label>
                                    <Input
                                        id="FatherOccupation"
                                        name="FatherOccupation"
                                        value={(formData.FatherOccupation as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="DiDongCha">Di động</Label>
                                    <Input
                                        id="DiDongCha"
                                        name="DiDongCha"
                                        value={(formData.DiDongCha as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="EmailCha">Email</Label>
                                    <Input
                                        id="EmailCha"
                                        name="EmailCha"
                                        type="email"
                                        value={(formData.EmailCha as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="HoKhauCha">Hộ khẩu</Label>
                                    <Input
                                        id="HoKhauCha"
                                        name="HoKhauCha"
                                        value={(formData.HoKhauCha as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Thông tin mẹ */}
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-4">Thông tin mẹ</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="flex items-center space-x-2 col-span-full">
                                    <Checkbox
                                        id="MatMe"
                                        checked={(formData.MatMe as boolean) || false}
                                        onCheckedChange={(checked) => handleCheckboxChange('MatMe', checked as boolean)}
                                    />
                                    <Label htmlFor="MatMe" className="cursor-pointer">Đã mất</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="MotherName">Họ tên mẹ</Label>
                                    <Input
                                        id="MotherName"
                                        name="MotherName"
                                        value={(formData.MotherName as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="MotherBirthday">Năm sinh</Label>
                                    <Input
                                        id="MotherBirthday"
                                        name="MotherBirthday"
                                        value={(formData.MotherBirthday as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="MotherOccupation">Nghề nghiệp</Label>
                                    <Input
                                        id="MotherOccupation"
                                        name="MotherOccupation"
                                        value={(formData.MotherOccupation as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="DiDongMe">Di động</Label>
                                    <Input
                                        id="DiDongMe"
                                        name="DiDongMe"
                                        value={(formData.DiDongMe as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="EmailMe">Email</Label>
                                    <Input
                                        id="EmailMe"
                                        name="EmailMe"
                                        type="email"
                                        value={(formData.EmailMe as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="HoKhauMe">Hộ khẩu</Label>
                                    <Input
                                        id="HoKhauMe"
                                        name="HoKhauMe"
                                        value={(formData.HoKhauMe as string) || ''}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Thông tin người liên hệ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-primary" />
                            Thông tin người liên hệ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ContactPersonName">Họ tên</Label>
                                <Input
                                    id="ContactPersonName"
                                    name="ContactPersonName"
                                    value={(formData.ContactPersonName as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ContactPersonPhone">Số điện thoại</Label>
                                <Input
                                    id="ContactPersonPhone"
                                    name="ContactPersonPhone"
                                    value={(formData.ContactPersonPhone as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ContactPersonAdd">Địa chỉ</Label>
                                <Input
                                    id="ContactPersonAdd"
                                    name="ContactPersonAdd"
                                    value={(formData.ContactPersonAdd as string) || ''}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="gap-2"
                    >
                        <ArrowLeft size={18} />
                        Quay lại
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Lưu thông tin
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default StudentUpdatePage;
