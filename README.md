# 一起找到方法｜合理調整情境遊戲

設計者：國家教育研究院 黃彥融副研究員  
程式版本：1.0.0

這是一個不需要編譯的靜態網頁遊戲，可直接放在 GitHub Pages。內容依教育部 114 年 12 月《各教育階段學校及幼兒園提供合理調整參考指引》草案（研習用）設計。案例為虛構教學情境，並非個案裁決或能力測驗。

## 先試玩

- 在電腦解壓縮後開啟 `index.html`，即可完整試玩及下載 PNG 行動卡。
- 另提供的單檔試玩版已內嵌所有程式與樣式，適合先確認內容；Google Sheets 收件保持關閉。
- 本版沒有外部字型、圖片服務或分析追蹤依賴。閱讀指引連結及啟用收件時才需要網路。
- 手機建議使用 GitHub Pages 網址，以 Safari 或 Chrome 開啟。若 iPhone 沒有直接下載圖片，可按「開啟圖片」後長按儲存。

## 遊戲內容

1. 首頁與完整設計者署名。
2. 八項選填背景：稱呼、性別、縣市、教育階段、服務身分、年資、調整需求處理經驗、指引使用經驗。
3. 四位學生的適用判斷，可選「可能適用」「需進一步了解」「目前資訊未顯示需要」。
4. 三個案例，各三個決策。選擇後提供對應回饋，再接續新情境。沒有總分或答錯淘汰。
5. 「我的省思」「我的意見與建議」各一題，均選填，可留白或填「無」。
6. 依本次選擇產生行動卡，可下載 PNG，也能回看情境選擇。

「指引小抄」包含三階段與四項研判原則。個別化、保密、適用對象、拒絕需舉證與替代方案、不需額外付費等內容，亦融入案例回饋。

## 放上 GitHub Pages

1. 建立或使用一個 GitHub repository。
2. 將本資料夾內的檔案上傳至 repository 根目錄，確保 `index.html` 在根目錄。不要只把 ZIP 上傳。
3. 到 Settings → Pages，選擇 Deploy from a branch，指定 `main` 與 `/(root)`，儲存。
4. 等待部署完成，開啟 Pages 顯示的網址。使用相對路徑，亦支援 `https://帳號.github.io/專案名稱/`。

若使用免費方案，通常需使用公開 repository。收集到的作答請保留在你的 Google Sheets，無須放入 repository。

官方說明：https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Google Sheets 由你設定

GitHub 版的 `config.js` 已填入你提供的 Apps Script 收件網址，目前保留「測試」模式。已確認該網址可匿名回傳 `ra-game-receiver`、版本 `1.0.0`；這項檢查尚不代表已完成試算表寫入。請依 `docs/Google-Sheets-串接.md` 確認 `SPREADSHEET_ID` 與 `ALLOWED_ORIGINS`，再從 GitHub Pages 完成一筆測試。無須公開試算表。

若已上傳上一版至 GitHub，只需替換根目錄的 `config.js`。日後更換收件網址或場次時，亦在此設定。以下為設定範例：

```js
window.RA_CONFIG = Object.freeze({
  endpoint: "https://script.google.com/macros/s/你的部署ID/exec",
  collectionBatch: "研習場次名稱",
  recordType: "正式",
  requestTimeoutMs: 25000,
});
```

正式收件前將 `recordType` 由「測試」改成「正式」。若使用同一遊戲辦理不同場次，可保持 `collectionBatch` 空白，分享 `?batch=場次名稱` 的網址。程式不要求玩家再填場次。

## 檔案對照

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 網頁入口 |
| `styles.css` | 桌面、手機版面與視覺樣式 |
| `content.js` | 背景選項、學生樣態、案例、回饋、指引提示、兩題回應 |
| `logic.js` | 36個欄位、資料整理及行動卡文字產製規則 |
| `game.js` | 畫面、互動、分頁暫存、PNG 下載、收件回執處理 |
| `config.js` | 收件網址、場次、正式／測試設定 |
| `google-apps-script/Code.gs` | 可複製到 Apps Script 的匿名收件範例 |
| `docs/中文欄位.txt` | 一列中文欄名，可貼至 Sheet 第一列 |
| `docs/題目對照.json` | 題目、選項代碼、原文、階段、原則與回饋 |
| `docs/內容與資料規則.md` | 政策對應、行動卡規則與資料解讀方式 |

## 修改內容

改題幹、選項、回饋、政策依據或行動卡規則時，請一併更新 `content.js` 的版本及收件端 `GAME_VERSION`。避免新舊版本的意見混在一起。

固定選項代碼用於對照題本，不依賴選項順序。Google Sheets 欄名用中文，收件端依名稱對應，所以可移動欄位順序；若更改欄名，需要同步改 `FIELD_MAP`。兩個版本共用同一收件程式前，需先擴充其版本驗證與題目代碼表。

## 已知限制

- 目前的三個案例分別是國中、國小及高中情境，供各教育階段借鏡，尚未另寫學前與大專專屬劇本。
- 背景和情境進度暫存在 `sessionStorage`。同一分頁重新整理可接續；關閉分頁、瀏覽器限制暫存或更換裝置時，不保證保留。
- 只收完成遊戲的紀錄；不收中途離開資料，也不推估個別教師人數。
- 收件網址已設定並通過唯讀服務檢查，尚未驗證實際寫入試算表。正式上線前，請依串接說明送出一筆「測試」紀錄確認權限與回執。
- 行動卡是固定規則整理，不呼叫生成式 AI，也不是經驗證的量表。

## 程式檢查

已檢查桌面及390px手機完整流程、重新整理接續、兩題留白或填「無」、PNG下載、單檔離線試玩、36欄資料對照及模擬收件回執。另以375px檢查較長稱呼的行動卡。Google實際部署及iOS原生儲存圖片，仍需在你的上線環境確認。

資料邏輯與收件欄位的檢查可執行 `node --test tests/core.test.cjs`。其他瀏覽器測試需要開發環境提供 Playwright 與 Chromium，遊戲本身不需要安裝它們。

## 政策來源

教育部《各教育階段學校及幼兒園提供合理調整參考指引》（草案，研習用），114 年 12 月。

https://special.moe.gov.tw/api/file/download?filePath=fd7e44de539a4b729c709ca63268f44c.pdf

指引內文頁碼與 PDF 頁碼相差四頁，遊戲中的連結已依此定位。
