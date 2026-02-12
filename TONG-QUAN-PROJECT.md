# Tổng quan project GocchillcuaBeu

## Mục đích
Web xem phim cho người dùng Việt, cá nhân hóa (GocchillcuaBeu, theme hồng). Nguồn phim: API OPhim, gọi qua backend proxy.

## Cấu trúc chính

```
Ryan_Movie/
├── WORKFLOW-NGHIEP-VU.md    # Luồng nghiệp vụ, API, routing
├── TONG-QUAN-PROJECT.md     # File này
└── ophim-web/
    ├── src/                  # Frontend React
    │   ├── App.jsx, main.jsx
    │   ├── components/       # Navbar, Footer, MovieCard, VideoPlayer, BackToTop, ErrorBoundary
    │   ├── pages/            # Home, CatalogPage, SinglePage, EpisodePage, NotFound
    │   ├── services/api.js   # Gọi backend /api
    │   └── constants/specialDays.js
    ├── server/               # Backend Express
    │   ├── index.js          # Routes /api/*, proxy ảnh + stream
    │   ├── config.js
    │   └── services/OPhimClient.js
    ├── public/               # banner.png, favicon.svg
    ├── Dockerfile            # Build frontend + chạy server
    └── docker-compose.yml    # Deploy một service :5000
```

## Tính năng đã có
- Trang chủ: banner (đổi theo ngày đặc biệt), phim mới, phim bộ/lẻ, tìm kiếm `?search=`
- Menu: Thể loại, Quốc gia (API, Việt Nam đầu danh sách)
- Catalog: danh sách / thể loại / quốc gia, phân trang, sắp xếp mới nhất
- Chi tiết phim (Single): poster, thông tin, danh sách tập
- Xem tập (Episode): HLS qua proxy, breadcrumb, chọn tập
- Proxy ảnh + stream (m3u8 rewrite) qua backend
- Không dùng key/auth; giao diện theme hồng, copy “Bệu”
- Trang 404 (NotFound), Error Boundary toàn app
- SEO: meta description, og:title, og:description, og:image trong index.html
- Deploy: Dockerfile + docker-compose.yml

## Đã hoàn thành (dọn dẹp & chuẩn hóa)
- **api.js:** Bỏ verifyKey, checkAuth, setOnUnauthorized, setAdminSecret, adminKeys (backend không còn auth).
- **Pages:** Xóa CategoryPage.jsx, Search.jsx (chỉ dùng redirect trong App).
- **package.json:** name = "gocchillcuabeu".
- **server/.env.example:** Rút gọn, bỏ SESSION/ADMIN/key.
- **ErrorBoundary:** Bọc App trong main.jsx; lỗi render hiển thị trang “Có lỗi xảy ra” + Tải lại / Về Trang chủ.
- **SEO:** index.html thêm meta description, og:title, og:description, og:image.
- **Docker:** Dockerfile (multi-stage: build frontend → chạy server), docker-compose.yml (service app :5000).
- **README:** Cập nhật tên, Build, Docker, bỏ key/admin.

## File server không dùng (giữ tham khảo)
- `server/middleware/auth.js`, `server/services/KeyStore.js` (auth đã gỡ).
- `StreamProxyService.js`, `StreamTokenStore.js`, `responseSanitizer.js` (logic stream nằm trong index.js).
