# UWow — User Management

Vue 3 + TypeScript + Vite。以 MSW 模擬後端（2,000 筆 mock 資料），前端以「千萬筆資料、每頁 500 筆無限捲動、50 人同時使用」為設計前提。

## 開發

```bash
npm install
npm run dev
npm run build
npm test
```

## 部署

Demo：https://klay376014.github.io/UWow/

推到 `main` 後由 GitHub Actions（`.github/workflows/deploy.yml`）跑測試、建置並部署到 GitHub Pages。

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
- 每個欄位各自篩選：字串欄位用 includes 且不分大小寫，Age 為數值區間（設定範圍 18 ~ 65），Date Start 為日期區間
- 修改／刪除帶 `version` 做樂觀鎖防止同時修改同一筆資料
- 釘選為每位使用者各自設定，暫存於 localStorage；位置以整份結果的 index 計算，與排序無關

## 釘選（Pin）怎麼運作

### 存在哪裡

- localStorage 的 `uwow:pins` 中，記錄三種值：`userId`、`userName`（給「Pinned」清單顯示用）、`position`。
- 目前 demo 設計最多可以釘選 100 筆（`MAX_PINS`）。

相關程式：`src/stores/pins.ts`、`src/utils/mergePinned.ts`、`src/stores/userList.ts`。

### 操作上可能遇到的狀況：不同資料指定同一個 position 當釘選列

情境例：指定釘選在 #5，但 #5 已經有另一筆釘選，就以新的一筆為主，舊的就順延移至 #6，如果 #6 也有釘選了，就一路接著往下推，直到遇到空位為止（`insertPin`）。如發生上述情況在釘選前會先提示使用者。

### 清單是怎麼拼出來的

每次重新載入（改篩選、改排序、釘選或取消釘選）時：

1. 用 id 一次撈回來，同樣套用目前的篩選與排序，不符合篩選條件的釘選列則隱藏。
2. 請後端「排除已釘選的 id」，避免同一筆抓了兩次，假設每頁原本有 500 筆，如果這一頁的裡有 k 筆釘選，就只跟後端要 `500 - k` 筆，讓每頁剛好湊滿 500 列。
3. 透過 `mergePinned` 從頭一列一列往下排，排到第 N 列時如果有人釘在 N，就放釘選那筆，否則放下一筆一般資料。

   ```
   一般資料： A  B  C  D  E
   釘選：     X 釘在 #2、Y 釘在 #4
   結果：     A  X  B  Y  C  D  E
   ```

4. 如果釘的位置比目前載入的資料還後面，就先不顯示，等捲到那裡再去排序；全部資料都載完後還沒輪到的釘選列（例如篩選後只有 10 筆，但我釘選了第 20 列、第 25 列⋯⋯等），就直接接在最後面。

總筆數 = 一般資料總數 + 釘選筆數。

### 其他實作的項目

- 釘選或移動後會自動捲到那一列。
- 改了某筆的名字，釘選清單裡的名字也會跟著更新。
- 刪掉一筆已釘選的資料，釘選也會一起拿掉。
- 沒有任何篩選時，如果某個釘選的 id 後端已經找不到（例如被別人刪了），就順手把這個釘選清掉。有篩選時不清，因為找不到可能只是被篩掉而已。
