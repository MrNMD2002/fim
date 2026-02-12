# Workflow nghiệp vụ – OPhim Clone (React)

Tài liệu mô tả toàn bộ luồng nghiệp vụ (business workflow) của website xem phim, từ lúc người dùng vào trang đến khi xem phim và duyệt danh sách.

---

## 1. Tổng quan hệ thống

- **Mục đích:** Web xem phim online (clone OPhim): duyệt danh sách, tìm kiếm, lọc theo thể loại/quốc gia, xem chi tiết phim và phát tập phim.
- **Nguồn dữ liệu:** API OPhim (Base: `https://ophim1.com`), gọi qua proxy `/api` khi dev.
- **Công nghệ:** React + Vite, React Router, axios (API qua backend proxy).

---

## 2. Sơ đồ luồng tổng quát

```
[Vào web] → Trang chủ (/)
     │
     ├─→ Tìm kiếm (?search=...) → Kết quả tìm kiếm trên Trang chủ
     │
     ├─→ Menu: Trang chủ / Thể loại / Quốc gia
     │        │
     │        ├─→ Thể loại → /the-loai/:slug (Catalog – lọc client theo thể loại)
     │        └─→ Quốc gia → /quoc-gia/:slug (Catalog – lọc client theo quốc gia)
     │
     ├─→ Từ Trang chủ: "Phim mới cập nhật" / "Phim bộ" / "Phim lẻ"
     │        → /danh-sach/:slug (Catalog: phim-moi-cap-nhat | phim-bo | phim-le)
     │
     ├─→ Click một phim (từ Trang chủ / Catalog / Tìm kiếm)
     │        → Trang chi tiết phim: /phim/:movieSlug (Single)
     │
     └─→ Từ Trang chi tiết: "Xem phim" / icon play
              → Trang xem tập: /phim/:movieSlug/tap-:episodeId (Episode)
                   → VideoPlayer (embed iframe hoặc HLS m3u8)
```

---

## 3. Chi tiết từng luồng nghiệp vụ

### 3.1. Trang chủ (Home) – `/`

| Bước | Hành động nghiệp vụ | Kỹ thuật / Ghi chú |
|------|----------------------|--------------------|
| 1 | Người dùng mở web hoặc click "Trang chủ" | Route `/`, component `Home` |
| 2 | Hệ thống gọi API lấy danh sách phim mới cập nhật (trang 1) | `fetchPhimMoiCapNhat(1)` → map `mapListResponse` |
| 3 | Hiển thị: block "Mới cập nhật", "Phim bộ", "Phim lẻ" (lưới MovieCard) | SectionThumb, SectionSide |
| 4 | Mỗi block có link "Xem thêm" | Link tới `/danh-sach/phim-moi-cap-nhat`, `/danh-sach/phim-bo`, `/danh-sach/phim-le` |
| 5 | Click vào một phim (poster / tên) | Điều hướng tới `/phim/{slug}` (Single) |

**Trường hợp có tham số tìm kiếm:** `/?search=keyword`

| Bước | Hành động nghiệp vụ | Kỹ thuật / Ghi chú |
|------|----------------------|--------------------|
| 1 | Người dùng nhập từ khóa trên Nav và gửi form tìm kiếm | `navigate('/?search=' + encodeURIComponent(keyword))` |
| 2 | Trang chủ đọc `searchParams.get('search')` | `useSearchParams()` |
| 3 | Gọi API tìm kiếm | `searchKeyword(keyword)` → GET `/v1/api/tim-kiem?keyword=...` |
| 4 | Hiển thị "Kết quả tìm kiếm: {keyword}" và danh sách phim (MovieCard) | Nếu không có kết quả: "Không tìm thấy phim nào." |
| 5 | Click một phim trong kết quả | Điều hướng tới `/phim/{slug}` (Single) |

---

### 3.2. Thanh điều hướng (Nav) – Header toàn site

| Hành động nghiệp vụ | Kết quả |
|----------------------|--------|
| Click Logo | Về Trang chủ `/` |
| Click "Trang chủ" | Về Trang chủ `/` |
| Click "Thể loại" → chọn một thể loại (dropdown) | Điều hướng `/the-loai/{slug}` (Catalog type category) |
| Click "Quốc gia" → chọn một quốc gia (dropdown) | Điều hướng `/quoc-gia/{slug}` (Catalog type region) |
| Mở ô tìm kiếm → nhập từ khóa → Submit | Điều hướng `/?search={keyword}` (Trang chủ với kết quả tìm kiếm) |

Menu Thể loại và Quốc gia lấy từ API: `GET /v1/api/the-loai`, `GET /v1/api/quoc-gia` (proxy qua backend `/api/categories`, `/api/countries`). Việt Nam luôn hiển thị đầu danh sách quốc gia.

---

### 3.3. Danh sách / Catalog – `/danh-sach/:slug`, `/the-loai/:slug`, `/quoc-gia/:slug`

Ba kiểu Catalog (cùng component, khác `type` và cách lọc):

- **Danh sách:** `type = 'catalog'`, slug: `phim-moi-cap-nhat` | `phim-bo` | `phim-le`
- **Thể loại:** `type = 'category'`, slug từ URL (vd: `hanh-dong`)
- **Quốc gia:** `type = 'region'`, slug từ URL (vd: `han-quoc`, `viet-nam`)

| Bước | Hành động nghiệp vụ | Kỹ thuật / Ghi chú |
|------|----------------------|--------------------|
| 1 | Vào Catalog (từ menu, từ link "Xem thêm" trên Trang chủ) | Route tương ứng, component `Catalog` với `type` phù hợp |
| 2 | Danh sách thể loại / quốc gia | Lấy từ Navbar (API `/api/categories`, `/api/countries`); Catalog không load lại menu |
| 3 | Gọi API danh sách phim theo type | Catalog: `getListBySlug(slug, page)`; Thể loại: `getMoviesByCategory(slug, page)`; Quốc gia: `getMoviesByCountry(slug, page)` |
| 4 | Sắp xếp mới nhất + hiển thị | `sortMoviesByNewest(items)`; lưới MovieCard, phân trang "Xem thêm" |
| 5 | Hiển thị: tiêu đề (từ seoOnPage hoặc slug), lưới phim (MovieCard), nút "Xem thêm" (load thêm trang) | State `page` tăng khi click "Xem thêm" |
| 6 | Click một phim | Điều hướng `/phim/{slug}` (Single) |

---

### 3.4. Trang chi tiết phim (Single) – `/phim/:movieSlug`

| Bước | Hành động nghiệp vụ | Kỹ thuật / Ghi chú |
|------|----------------------|--------------------|
| 1 | Người dùng vào từ MovieCard (Trang chủ / Catalog / Tìm kiếm) | Route `/phim/:movieSlug`, component `Single` |
| 2 | Gọi API chi tiết phim + danh sách phim (để "Có thể bạn thích") | `fetchPhimBySlug(movieSlug)`, `fetchPhimMoiCapNhat(1)` |
| 3 | Map dữ liệu: thông tin phim + danh sách tập (episodes) từ `episodes[].server_data` | `mapDetailResponse(detail)` |
| 4 | Hiển thị: poster, tên, tên gốc, quốc gia, nút "Xem phim", thông tin đạo diễn/diễn viên/trạng thái/thời lượng/ngôn ngữ/nội dung, block "Có thể bạn thích", "Xem nhiều" | Nút "Xem phim" dùng tập đầu tiên trong `movie.episodes` |
| 5 | Xác định URL xem tập | Link tới `/phim/{slug}/tap/{id}` (hoặc `/phim/{slug}/tap-{id}`). Tập đầu: `firstEp.id` |
| 6 | Click "Xem phim" hoặc click một tập trong danh sách tập | Điều hướng tới `/phim/:movieSlug/tap/:episodeId` (Episode) |

---

### 3.5. Trang xem tập phim (Episode) – `/phim/:movieSlug/tap-:episodeId`

| Bước | Hành động nghiệp vụ | Kỹ thuật / Ghi chú |
|------|----------------------|--------------------|
| 1 | Người dùng vào từ Single ("Xem phim") hoặc link trực tiếp | Route `/phim/:movieSlug/tap-:episodeId`, component `Episode` |
| 2 | Gọi API chi tiết phim (để lấy danh sách tập + link phát) và danh sách phim liên quan | `fetchPhimBySlug(movieSlug)`, `fetchPhimMoiCapNhat(1)` |
| 3 | Map chi tiết + episodes (id, name, slug, server, link_embed, link_m3u8) | `mapDetailResponse(detail)` |
| 4 | Tìm tập theo `episodeId` (số từ URL) | `movie.episodes.find(e => e.id === epId)` |
| 5 | Nếu không tìm thấy phim hoặc tập | Hiển thị "Không tìm thấy phim." / "Không tìm thấy tập phim." |
| 6 | Hiển thị: VideoPlayer (embed hoặc HLS m3u8), tên phim + tập, danh sách tập (theo server), "Có thể bạn thích", "Xem nhiều" | VideoPlayer nhận `linkEmbed`, `linkM3u8` từ episode |
| 7 | Phát video | Nếu có `link_m3u8`: dùng hls.js; nếu có `link_embed`: iframe. Có thể có link "Mở trong tab mới" khi iframe bị chặn |
| 8 | Click tập khác trong sidebar | Điều hướng `/phim/{movieSlug}/tap-{episodeId}` (cùng trang Episode, đổi tập) |
| 9 | Click tên phim hoặc phim trong "Có thể bạn thích" | Điều hướng `/phim/{slug}` (Single) |

---

### 3.6. VideoPlayer (phát nội dung)

| Hành động nghiệp vụ | Kỹ thuật / Ghi chú |
|----------------------|--------------------|
| Ưu tiên phát embed | Nếu có `link_embed` → iframe với `link_embed` |
| Phát HLS (m3u8) | Nếu có `link_m3u8` và không dùng embed → dùng hls.js gắn vào thẻ `<video>` |
| Fallback / trải nghiệm | Có thể hiển thị link "Mở trong tab mới" để mở URL phát trực tiếp khi iframe bị chặn |

---

## 4. API sử dụng (nghiệp vụ)

| Nghiệp vụ | API / Endpoint | Ghi chú |
|-----------|----------------|---------|
| Danh sách phim trang chủ (phim mới cập nhật) | GET `/danh-sach/phim-moi-cap-nhat?page=1` | Trang chủ, related |
| Danh sách có thể loại/quốc gia (filter) | GET `/v1/api/danh-sach/phim-moi-cap-nhat?page=...` | Catalog: map + lọc client theo thể loại/quốc gia |
| Danh sách thể loại (menu filter) | GET `/v1/api/the-loai` | Dropdown Thể loại trong Catalog |
| Danh sách quốc gia (menu filter) | GET `/v1/api/quoc-gia` | Dropdown Quốc gia trong Catalog |
| Tìm kiếm theo từ khóa | GET `/v1/api/tim-kiem?keyword=...` | Trang chủ khi có `?search=...` |
| Chi tiết phim + danh sách tập (server, link embed/m3u8) | GET `/phim/{slug}` | Single, Episode |

---

## 5. Định tuyến (URL) và điều hướng

| URL | Trang | Mô tả nghiệp vụ |
|-----|--------|------------------|
| `/` | Home | Trang chủ: slider, block phim mới / phim bộ / phim lẻ; nếu có `?search=` thì hiển thị kết quả tìm kiếm |
| `/?search=keyword` | Home | Kết quả tìm kiếm theo từ khóa |
| `/danh-sach/phim-moi-cap-nhat` | Catalog | Danh sách phim mới cập nhật (có phân trang) |
| `/danh-sach/phim-bo` | Catalog | Danh sách phim bộ (lọc client) |
| `/danh-sach/phim-le` | Catalog | Danh sách phim lẻ (lọc client) |
| `/the-loai/:slug` | Catalog | Danh sách phim theo thể loại (slug có thể dạng `hanh-dong-1`) |
| `/quoc-gia/:slug` | Catalog | Danh sách phim theo quốc gia |
| `/phim/:movieSlug` | Single | Chi tiết một phim, nút "Xem phim" dẫn tới tập 1 |
| `/phim/:movieSlug/tap/:episodeId` hoặc `/phim/:movieSlug/tap-:episodeId` | Episode | Xem tập phim (số tập từ `episodeId`) |

Phân trang trong Catalog: cùng path, thêm query `?page=2`, ...

---

## 6. Luồng dữ liệu tóm tắt

1. **Trang chủ:** API list (phim mới) → map → Slider + SectionThumb + SectionSide; hoặc API search → map → danh sách kết quả.
2. **Catalog:** API the-loai + quoc-gia (filter) và API danh-sach (phim) → map → lọc client theo type/slug → danh sách + filter + phân trang.
3. **Single:** API phim chi tiết → map (movie + episodes) → hiển thị thông tin + nút xem tập 1.
4. **Episode:** API phim chi tiết → map → tìm tập theo id → VideoPlayer(embed / m3u8).

---

## 7. Xử lý lỗi / trường hợp đặc biệt

| Tình huống | Cách xử lý nghiệp vụ |
|------------|----------------------|
| Không tìm thấy phim (slug sai / API lỗi) | Single/Episode: hiển thị "Không tìm thấy phim." |
| Không tìm thấy tập (episodeId không tồn tại) | Episode: hiển thị "Không tìm thấy tập phim." |
| Phim chưa có tập | Single: vẫn có nút/link tới `tap-1`; text có thể là "Chưa có tập"; Episode sẽ báo không tìm thấy tập nếu API không trả tập |
| Tìm kiếm không có kết quả | Trang chủ: "Không tìm thấy phim nào." |
| Catalog không có slug / thiếu dữ liệu | Hiển thị "Không có dữ liệu cho mục này" hoặc danh sách rỗng |
| Lỗi khi gọi API (mạng, CORS, ...) | Thông báo lỗi trên từng trang (vd: "Không tải được danh sách", "Lỗi tải phim") |

---
