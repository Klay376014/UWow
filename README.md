# UWow — User Management

Vue 3 + TypeScript + Vite。以 MSW 模擬後端（2,000 筆 mock 資料），前端以「千萬筆資料、每頁 500 筆無限捲動、50 人同時使用」為設計前提。

## 開發

```bash
npm install
npm run dev
npm run build
```

## 結構

```
src/
├─ api/        fetch 封裝與錯誤型別
├─ mocks/      MSW handlers 與記憶體資料庫（篩選、排序、分頁、樂觀鎖）
├─ stores/     Pinia：清單查詢狀態、個人釘選（localStorage）
└─ types/      資料模型
```

## 設計決策

- 篩選、排序、分頁皆在後端完成，前端只持有已載入的頁
- 每個欄位各自篩選：字串欄位為包含比對，Age 為數值區間，Date Start 為日期區間
- 修改／刪除帶 `version` 做樂觀鎖，衝突回 409、已刪除回 404
- 釘選為每位使用者各自設定，暫存於 localStorage；位置以整份結果的 index 計算，與排序無關
