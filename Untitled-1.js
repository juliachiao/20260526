// sketch.js

let rainData = [];
let isLoading = true;
let errorMsg = "";

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 台北市雨量 Open Data API 網址
  const apiUrl = "https://wic.gov.taipei/OpenData/API/Rain/Get?stationNo=&loginId=open_rain&dataKey=85452C1D";
  
  // 設定代理伺服器解決 127.0.0.1 開發時的 CORS 跨網域存取限制
  // 這裡選用免費的 allorigins 作為代理 (你也可以替換成 corsproxy.io 等其他服務)
  const proxyUrl = "https://api.allorigins.win/raw?url=";
  
  // 將目標 API 網址做 URI 編碼並串接在代理伺服器後方
  const fetchUrl = proxyUrl + encodeURIComponent(apiUrl);
  
  // 採用 GET 方式取得資料
  fetch(fetchUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error("網路連線或代理伺服器發生異常");
      }
      return response.json(); // 將回傳的結果解析為 JSON
    })
    .then(data => {
      // 根據 API 實際回傳的資料結構進行處理
      // 相容不同的 JSON 外層包裝格式
      if (Array.isArray(data)) {
        rainData = data;
      } else if (data && data.data) {
        rainData = data.data;
      } else {
        rainData = [data]; // 例外狀況備用
      }
      isLoading = false;
    })
    .catch(err => {
      console.error(err);
      errorMsg = err.message;
      isLoading = false;
    });
}

function draw() {
  background(30, 41, 59); // 使用深藍灰色作為背景
  
  // 若正在載入資料
  if (isLoading) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("資料載入中...", width / 2, height / 2);
    return;
  }
  
  // 若發生錯誤
  if (errorMsg) {
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(255, 100, 100); // 顯示紅色錯誤訊息
    text("發生錯誤：" + errorMsg, width / 2, height / 2);
    return;
  }
  
  // 繪製標題
  textAlign(CENTER, CENTER);
  textSize(32);
  fill(100, 200, 255); // 淺藍色
  text("台北市即時雨量顯示", width / 2, 50);
  
  // 若陣列中沒有資料可顯示
  if (!rainData || rainData.length === 0) {
    fill(255);
    textSize(24);
    text("目前查無雨量資料", width / 2, height / 2);
    return;
  }
  
  // 網格狀排列顯示各測站雨量
  textAlign(LEFT, TOP);
  textSize(16);
  
  let startX = 60;
  let startY = 120;
  let colWidth = 220; // 每個資料欄位的預設寬度
  let rowHeight = 40; // 每個資料行的高度
  let x = startX;
  let y = startY;
  
  for (let i = 0; i < rainData.length; i++) {
    let station = rainData[i];
    
    // 容錯處理：擷取 API 中可能的測站名稱與雨量欄位名稱 (依照該 API 常見的 key)
    let stationName = station.stationName || station.stationNo || "未知測站";
    let rainValue = station.rain !== undefined ? station.rain : (station.rainFall || "0");
    
    // 將雨量字串轉成數值，方便做顏色判斷
    let rainNum = parseFloat(rainValue);
    
    // 簡單的資料視覺化 (利用顏色區分雨量多寡)
    if (rainNum >= 10) {
      fill(255, 100, 100); // 橘紅色代表雨量大
    } else if (rainNum > 0) {
      fill(100, 255, 100); // 綠色代表有降雨
    } else {
      fill(200);           // 灰色代表目前無雨
    }
    
    // 繪製該測站的資料文字
    let displayText = `${stationName} : ${rainValue} mm`;
    text(displayText, x, y);
    
    y += rowHeight;
    // 若 Y 座標超出畫面下方，則換下一個直欄 (排版邏輯)
    if (y > height - 60) {
      y = startY;
      x += colWidth;
    }
  }
}

// 支援視窗縮放功能，確保使用者縮放網頁時畫布能自動全螢幕適應
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
