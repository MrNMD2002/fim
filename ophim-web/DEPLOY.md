# Hướng dẫn deploy GocchillcuaBeu

Project có **một server Node** vừa phục vụ API (`/api/*`) vừa phục vụ frontend đã build (`dist/`). Chọn một trong các cách sau.

---

## 1. Deploy bằng Docker (khuyên dùng)

Phù hợp: VPS (DigitalOcean, Linode, AWS EC2, …), server có cài Docker.

```bash
cd ophim-web
docker compose up -d
```

- Ứng dụng chạy tại **http://localhost:5000** (hoặc http://IP-máy:5000).
- Đổi port: trong `docker-compose.yml` sửa `"5000:5000"` thành `"80:5000"` nếu muốn dùng cổng 80.
- Set biến môi trường (tùy chọn): tạo file `.env` cạnh `docker-compose.yml` với nội dung ví dụ:

```env
PORT=5000
OPHIM_BASE_URL=https://ophim1.com
IMAGE_BASE_URL=https://img.ophim.live
```

Sau đó trong `docker-compose.yml` thêm:

```yaml
env_file: .env
```

Rồi chạy lại: `docker compose up -d --build`.

---

## 2. Deploy thủ công (VPS có Node.js)

Phù hợp: VPS đã cài Node 18+ (không dùng Docker).

**Trên máy deploy:**

```bash
cd ophim-web
npm ci
npm run build
```

- Tạo file `.env` trong thư mục `server/` (copy từ `server/.env.example`, sửa PORT nếu cần).
- Chạy server:

```bash
node server/index.js
```

- Ứng dụng lắng nghe tại **http://localhost:5000**. Muốn chạy nền, dùng **pm2**:

```bash
npm install -g pm2
pm2 start server/index.js --name gocchillcuabeu
pm2 save
pm2 startup
```

**Lưu ý:** Frontend build dùng `/api` (relative), nên user phải truy cập đúng domain/cổng mà server đang chạy (ví dụ http://ip-cua-ban:5000). Nếu dùng Nginx làm reverse proxy, xem mục 4.

---

## 3. Deploy lên Railway / Render / Fly.io

Các nền tảng chạy **Node** được: build = `npm run build`, start = `node server/index.js`, root = thư mục `ophim-web`.

- **Railway:** Kết nối repo Git, root directory = `ophim-web` (hoặc monorepo chọn thư mục đó). Build command: `npm ci && npm run build`. Start command: `node server/index.js`. Set env: `PORT` (Railway tự gán), `OPHIM_BASE_URL`, `IMAGE_BASE_URL` (tùy chọn).
- **Render (Web Service):** Tương tự: Build = `npm ci && npm run build`, Start = `node server/index.js`, thêm env `PORT` (Render tự inject), `OPHIM_BASE_URL`, `IMAGE_BASE_URL`.
- **Fly.io:** Dùng Dockerfile có sẵn: `fly launch`, `fly deploy`. Port 5000 đã expose trong Dockerfile.

Sau khi deploy, mở URL do dịch vụ cấp (vd. https://xxx.railway.app). Không cần cấu hình thêm vì frontend gọi `/api` cùng domain.

---

## 4. Dùng Nginx làm reverse proxy (VPS)

Nếu muốn dùng domain (vd. `https://gocchillcuabeu.com`) và Nginx:

- Ứng dụng Node chạy local tại `http://127.0.0.1:5000` (Docker hoặc pm2 như trên).
- Cấu hình Nginx:

```nginx
server {
    listen 80;
    server_name gocchillcuabeu.com;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- Sau đó cấu hình SSL (Let’s Encrypt): `certbot --nginx -d gocchillcuabeu.com`.

---

## Tóm tắt

| Cách | Lệnh / Việc cần làm |
|------|----------------------|
| **Docker** | `cd ophim-web` → `docker compose up -d` → mở http://IP:5000 |
| **Thủ công** | `npm ci` → `npm run build` → `node server/index.js` (hoặc pm2) |
| **Railway/Render** | Kết nối Git, build = `npm ci && npm run build`, start = `node server/index.js` |
| **Nginx** | Node chạy :5000, Nginx proxy pass sang 127.0.0.1:5000, trỏ domain |

Mọi cách đều dùng **một cổng/domain**: frontend và API cùng host, không cần tách hai server.
