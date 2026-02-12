import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const KEYS_FILE = path.join(DATA_DIR, 'keys.json');

let data = { keys: [] };

function load() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const raw = fs.readFileSync(KEYS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      data.keys = Array.isArray(parsed?.keys) ? parsed.keys : [];
    } else {
      data.keys = [];
    }
  } catch (e) {
    console.error('KeyStore load error:', e.message);
    data.keys = [];
  }
}

function save() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('KeyStore save error:', e.message);
    throw e;
  }
}

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

load();

export const keyStore = {
  /** Danh sách key đang active (chỉ giá trị key) */
  getActiveKeys() {
    return data.keys.filter((k) => k.active).map((k) => k.key);
  },

  /** Tất cả key (để admin xem/sửa) */
  getAllKeys() {
    return [...data.keys];
  },

  /** Thêm key mới (generate hoặc dùng key tùy chọn), trả về entry đã tạo */
  addKey(customKey) {
    const key = customKey?.trim() || generateKey();
    if (data.keys.some((k) => k.key === key)) throw new Error('Key already exists');
    const id = crypto.randomUUID();
    const entry = { id, key, active: true, createdAt: new Date().toISOString() };
    data.keys.push(entry);
    save();
    return entry;
  },

  /** Bật/tắt key theo id */
  setActive(id, active) {
    const entry = data.keys.find((k) => k.id === id);
    if (!entry) throw new Error('Key not found');
    entry.active = !!active;
    save();
    return entry;
  },

  /** Xóa key (tùy chọn) */
  remove(id) {
    const idx = data.keys.findIndex((k) => k.id === id);
    if (idx === -1) throw new Error('Key not found');
    data.keys.splice(idx, 1);
    save();
  },

  reload: load,
};

export default keyStore;
