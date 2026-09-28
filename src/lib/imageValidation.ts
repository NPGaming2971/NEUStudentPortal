export const MaxImageSize = 5 * 1024 * 1024; // 5MB

export interface ImageValidationResult {
	ok: boolean;
	message: string | null;
}

const StrictImageTypes = ['image/png', 'image/jpeg'];
const StrictImageTypePattern = /\.(png|jpe?g)$/i;

const MaxImageSizeMessage = 'Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.';
const AnyImageTypeMessage = 'Chỉ chấp nhận file hình ảnh.';
const StrictImageTypeMessage = 'Chỉ được đính kèm ảnh định dạng PNG hoặc JPG.';

// Shared image validation for every evidence/certificate upload. By default any
// image type is accepted (certificate uploads); pass strictTypes to require
// PNG/JPG only (conduct assessment evidence).
export const validateImageFile = (
	file: File | null | undefined,
	options?: { strictTypes?: boolean }
): ImageValidationResult => {
	if (!file) return { ok: false, message: 'Vui lòng chọn ảnh.' };
	const strict = options?.strictTypes ?? false;
	const typeOk = strict
		? StrictImageTypes.includes(file.type) || StrictImageTypePattern.test(file.name)
		: file.type.startsWith('image/');
	if (!typeOk) {
		return { ok: false, message: strict ? StrictImageTypeMessage : AnyImageTypeMessage };
	}
	if (file.size > MaxImageSize) {
		return { ok: false, message: MaxImageSizeMessage };
	}
	return { ok: true, message: null };
};
