# Mike wrap

This is a code bundle for Mike wrap. The original project is available at https://www.figma.com/design/xl49liLEDgv3FVubSCcjXh/Mike-wrap.

## 功能說明

這是一個年度回顧應用，整合了以下功能：

1. **圖片辨識功能**：使用 Google Gemini API 辨識用戶上傳的截圖，自動提取帳號資訊
2. **用戶資料讀取**：從 Google Sheets 讀取用戶的年度回顧資料
3. **多語言支援**：支援繁體中文和英文

## 運行方式

### 本地開發

1. 安裝依賴：
```bash
npm install
```

2. 設定環境變數：
   - 複製 `.env.example` 為 `.env.local`
   - 填入以下環境變數：
     - `MIKE_GEMINI_API_KEY`: Gemini API 金鑰（注意：使用 MIKE_GEMINI_API_KEY 避免與 Netlify 內部環境變數衝突）
     - `GOOGLE_SHEET_ID`: Google Sheet ID
     - `GOOGLE_SHEET_NAME`: Sheet 名稱（預設為「用戶數據庫」）
     - `GOOGLE_SERVICE_ACCOUNT_KEY`: Google 服務帳號 JSON（完整內容）

3. 啟動開發伺服器：
```bash
npm run dev
```

### Netlify 部署

1. 在 Netlify 後台設定環境變數：
   - `MIKE_GEMINI_API_KEY`（注意：使用 MIKE_GEMINI_API_KEY 避免與 Netlify 內部環境變數衝突）
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SHEET_NAME`
   - `GOOGLE_SERVICE_ACCOUNT_KEY`

2. 連接 GitHub 倉庫並部署

3. Netlify Functions 會自動從 `netlify/functions/` 目錄部署

## 專案結構

```
/
├── netlify/
│   ├── functions/
│   │   ├── recognize-account.ts    # 圖片辨識 API
│   │   ├── get-user-data.ts        # 用戶資料讀取 API
│   │   └── utils/
│   │       ├── gemini.ts          # Gemini API 工具
│   │       ├── google-sheets.ts   # Google Sheets API 工具
│   │       └── rate-limit.ts      # Rate limiting 工具
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── gemini.ts          # 前端 Gemini API 封裝
│   │   │   └── sheets.ts           # 前端 Sheets API 封裝
│   │   └── components/
│   │       └── MikeWrap.tsx        # 主要組件
└── netlify.toml                    # Netlify 設定檔
```

## API 端點

### POST /api/recognize-account

辨識圖片中的帳號。

**請求體：**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**回應：**
```json
{
  "status": "ok",
  "account_prefix": "example123",
  "raw_account": "example123@gmail.com"
}
```

### POST /api/get-user-data

取得用戶的年度回顧資料。

**請求體：**
```json
{
  "account": "example123"
}
```

**回應：**
```json
{
  "status": "ok",
  "data": {
    "account": "example123",
    "days_with_mike": 232,
    "active_days": 196,
    ...
  }
}
```

## 注意事項

1. **環境變數**：確保所有必要的環境變數都已正確設定
2. **Google Sheets 權限**：確保服務帳號有讀取 Google Sheet 的權限
3. **Rate Limiting**：系統實作了基本的 rate limiting（每 IP 每分鐘 5 次，每小時 20 次）
4. **圖片大小限制**：上傳的圖片最大為 5MB
