# Deploy repo này lên Railway

Repo có **app thật** nằm trong thư mục **`ophim-web`**, không phải ở thư mục gốc.

## Bước bắt buộc

1. Vào **Railway Dashboard** → chọn project **fim** → **Settings** (của service).
2. Tìm **Root Directory** (hoặc **Service Root**).
3. Điền: **`ophim-web`**.
4. Lưu và **Redeploy**.

Sau đó Railway sẽ build và chạy từ `ophim-web` (có `package.json` với script `start` và `build`). Chi tiết deploy xem **ophim-web/DEPLOY.md**.
