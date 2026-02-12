/**
 * Ngày đặc biệt: banner + strip Navbar đổi nội dung theo ngày.
 * Thêm mục mới: { month: 1-12, day: 1-31, label: 'tên', bannerSlug?: 'ten-file' }.
 * bannerSlug dùng cho ảnh /banner-{bannerSlug}.png (vd: sinh-nhat, valentine). Nếu không có thì dùng banner.png.
 */
export const SPECIAL_DAYS = [
  { month: 10, day: 16, label: 'sinh nhật', bannerSlug: 'sinh-nhat' },
  { month: 2, day: 14, label: 'Valentine', bannerSlug: 'valentine' },
  { month: 3, day: 8, label: '8/3', bannerSlug: '83' },
  { month: 1, day: 1, label: 'năm mới', bannerSlug: 'nam-moi' },
];

const defaultBanner = '/banner.png';

/**
 * Kiểm tra hôm nay có phải ngày đặc biệt không.
 * @returns { { label: string, bannerSlug?: string } | null }
 */
export function getSpecialDayToday() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const found = SPECIAL_DAYS.find((d) => d.month === month && d.day === day);
  return found ? { label: found.label, bannerSlug: found.bannerSlug } : null;
}

/**
 * Text cho strip Navbar / banner chính: ngày đặc biệt thì "Chúc Bệu {label} vui vẻ!", không thì câu mặc định.
 */
export function getBannerMessage(defaultMessage = 'Lúc nào giận tớ thì vào đây xem nha ^^') {
  const special = getSpecialDayToday();
  return special ? `Chúc Bệu ${special.label} vui vẻ!` : defaultMessage;
}

/**
 * Đường dẫn ảnh banner theo ngày: nếu có ngày đặc biệt và bannerSlug thì thử /banner-{bannerSlug}.png, còn không dùng /banner.png.
 */
export function getBannerImageUrl() {
  const special = getSpecialDayToday();
  if (special?.bannerSlug) return `/banner-${special.bannerSlug}.png`;
  return defaultBanner;
}
