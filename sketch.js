// 台北市主要測站經緯度座標對照表 + 即時雨量數據
const stationData = {
  "格致國中": { lat: 25.1362, lon: 121.5387, rain: 5.5 },
  "陽明高中": { lat: 25.0945, lon: 121.5148, rain: 4.0 },
  "瑠公國中": { lat: 25.0372, lon: 121.5847, rain: 3.5 },
  "民生國中": { lat: 25.0602, lon: 121.5606, rain: 3.0 },
  "湖田國小": { lat: 25.1528, lon: 121.5323, rain: 2.5 },
  "三興國小": { lat: 25.0303, lon: 121.5583, rain: 2.0 },
  "東湖國小": { lat: 25.0689, lon: 121.6169, rain: 2.0 },
  "萬華國中": { lat: 25.0278, lon: 121.4986, rain: 2.0 },
  "太平國小": { lat: 25.0610, lon: 121.5111, rain: 1.5 },
  "長安國小": { lat: 25.0489, lon: 121.5283, rain: 1.5 },
  "桃源國中": { lat: 25.1397, lon: 121.4914, rain: 1.0 },
  "至善國中": { lat: 25.1014, lon: 121.5489, rain: 1.0 },
  "雙園": { lat: 25.0232, lon: 121.4925, rain: 1.0 },
  "北投國小": { lat: 25.1321, lon: 121.5005, rain: 0.5 },
  "碧湖國小": { lat: 25.0811, lon: 121.5878, rain: 0.5 },
  "舊莊國小": { lat: 25.0402, lon: 121.6186, rain: 1.0 },
  "北政國中": { lat: 24.9861, lon: 121.5786, rain: 0.5 },
  "中洲": { lat: 25.1235, lon: 121.4608, rain: 0.5 },
  "大屯國小": { lat: 25.1741, lon: 121.4925, rain: 0.0 },
  "中正國中": { lat: 25.0336, lon: 121.5201, rain: 0.0 },
  "平等國小": { lat: 25.1278, lon: 121.5714, rain: 0.0 },
  "博嘉國小": { lat: 25.0000, lon: 121.5886, rain: 0.0 },
  "台灣大學(新)": { lat: 25.0175, lon: 121.5397, rain: 0.0 }
};

let mapObject; 
let raindrops = [];     // 儲存下雨粒子的陣列
let topStations = [];   // 雨量前三名測站名單

// 全市平均狀態變數
let cityAverageRain = 0;
let weatherStatusText = "觀測中";
let statusLightColor;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 初始化原生 Leaflet 地圖
  mapObject = L.map('map').setView([25.0650, 121.5350], 12);

  // 載入標準彩色 OpenStreetMap 底圖
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapObject);

  // 🛠️ 建立 80 個隨機散落的下雨粒子，製造自然落下的環境感
  for (let i = 0; i < 80; i++) {
    raindrops.push({
      x: random(width),
      y: random(-height, 0),
      speed: random(5, 8),   // 設定穩定的下雨速度
      len: random(12, 22)    // 雨滴線條的長度
    });
  }

  // 計算排行榜與全市平均雨量
  calculateTopStations();
  calculateCityMetrics();

  // 在地圖上繪製動態紅點
  renderMapMarkers();
}

function draw() {
  clear(); // 保持畫布全透明，透出底圖
  
  // 1. 執行全域持續下雨的動態更新
  drawWeatherEffects();

  // 2. 繪製左上角精美面板 UI
  drawUI();
}

// 計算雨量前三名
function calculateTopStations() {
  let tempArray = [];
  for (let name in stationData) {
    tempArray.push({ name: name, rain: stationData[name].rain });
  }
  tempArray.sort((a, b) => b.rain - a.rain);
  topStations = tempArray.slice(0, 3);
}

// 計算全市平均數據與燈號評級
function calculateCityMetrics() {
  let totalRain = 0;
  let count = 0;
  for (let name in stationData) {
    totalRain += stationData[name].rain;
    count++;
  }
  cityAverageRain = totalRain / count;
  
  if (cityAverageRain === 0) {
    weatherStatusText = "全市無雨 / 天氣晴朗";
    statusLightColor = color(168, 218, 220); 
  } else if (cityAverageRain > 0 && cityAverageRain <= 1.5) {
    weatherStatusText = "微雨局降 / 狀態良好";
    statusLightColor = color(189, 224, 254); // #bde0fe
  } else if (cityAverageRain > 1.5 && cityAverageRain <= 3.0) {
    weatherStatusText = "全市普遍降雨 / 注意路面濕滑";
    statusLightColor = color(255, 183, 3);   // 亮橘黃
  } else {
    weatherStatusText = "部分地區暴雨 / 大雨警戒中";
    statusLightColor = color(255, 74, 74);   // 警戒紅
  }
}

// 🛠️ 核心修正：全域持續自動下雨的特效函數
function drawWeatherEffects() {
  // 使用溫和半透明的粉藍色線條，完美融入彩色與暗色底圖
  stroke(189, 224, 254, 140); 
  strokeWeight(1.2);

  for (let i = 0; i < raindrops.length; i++) {
    let r = raindrops[i];
    
    // 繪製雨滴線條
    line(r.x, r.y, r.x, r.y + r.len);
    
    // 依據各自的預設速度向下移動
    r.y += r.speed;
    
    // 超出螢幕底部時，回到頂部重新落下，達成無限循環
    if (r.y > height) {
      r.x = random(width);
      r.y = random(-20, 0);
    }
  }
}

// 建立圓點標記與滑鼠互動事件
function renderMapMarkers() {
  for (let stationName in stationData) {
    let s = stationData[stationName];
    let lat = s.lat;
    let lng = s.lon;
    let rainValue = s.rain;

    // 紅點半徑跟隨該區真實雨量多寡自動縮放 (0mm 為 6px，5.5mm 放大到 14px)
    let dynamicRadius = map(rainValue, 0, 6, 6, 14);
    dynamicRadius = constrain(dynamicRadius, 6, 16);

    let marker = L.circleMarker([lat, lng], {
      radius: dynamicRadius,            
      color: '#ffffff',     // 白色外框
      weight: 2,            
      fillColor: '#ff0a14', // 飽和實心紅色
      fillOpacity: 0.9,    
      interactive: true     
    }).addTo(mapObject);

    // 字卡 HTML 內容
    let tooltipContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px; background: #1e202d; color: #fff; border-radius: 6px; min-width: 180px;">
        <b style="font-size: 14px; color: #fff; display: block; margin-bottom: 4px;">測站名稱：${stationName}</b>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.15); margin: 6px 0;">
        <span style="color: #bde0fe; font-size: 13px; display: block; margin-bottom: 3px;">1hr 累積雨量：<b>${rainValue.toFixed(1)} mm</b></span>
        <span style="color: #cccccc; font-size: 11px; display: block; margin-bottom: 2px;">位置座標：${lng.toFixed(4)}, ${lat.toFixed(4)}</span>
        <span style="color: #888888; font-size: 10px; display: block;">監測狀態：即時連線正常</span>
      </div>
    `;

    marker.bindPopup(tooltipContent, {
      closeButton: false,          
      offset: L.point(0, -6),      
      className: 'custom-popup'
    });

    // 滑鼠移入：僅放大圓點與彈出字卡，不干擾背景下雨節奏
    marker.on('mouseover', function () {
      this.openPopup(); 
      this.setStyle({ radius: dynamicRadius + 4, fillColor: '#ff453a' }); 
    });
    
    // 滑鼠移出：復原圓點尺寸
    marker.on('mouseout', function () {
      this.closePopup(); 
      this.setStyle({ radius: dynamicRadius, fillColor: '#ff0a14' });  
    });
  }
}

// 繪製控制面板 UI
function drawUI() {
  push();
  noStroke();
  
  // 主面板背景
  fill(30, 32, 45, 230); 
  rect(20, 20, 440, 265, 8); 
  
  // 大標題：夢幻薰衣草紫
  fill(205, 180, 219); 
  textSize(22);
  textFont('sans-serif');
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text('臺北市即時雨量監測看板', 40, 35);
  
  // 提示文字：舒適粉藍色
  fill(189, 224, 254); 
  textSize(11);
  textStyle(NORMAL);
  text('👉 畫面已開啟全域即時下雨特效，移動至紅點可看詳細數據', 40, 65);

  // 分割線一
  stroke(255, 255, 255, 35);
  line(40, 85, 440, 85);
  noStroke();

  // 全市即時總覽區塊
  fill(255, 255, 255, 220);
  textSize(13);
  textStyle(BOLD);
  text('🌍 全市即時氣象總覽：', 40, 98);
  
  // 霓虹呼吸燈
  let pulseRadius = 11 + sin(frameCount * 0.08) * 2; 
  fill(statusLightColor.levels[0], statusLightColor.levels[1], statusLightColor.levels[2], 80); 
  ellipse(52, 127, pulseRadius + 6);
  fill(statusLightColor); 
  ellipse(52, 127, 11);
  
  fill(255);
  textSize(12);
  textStyle(NORMAL);
  text(`全市平均雨量：`, 75, 122);
  fill(189, 224, 254); 
  textStyle(BOLD);
  text(`${cityAverageRain.toFixed(2)} mm`, 160, 122);
  
  fill(200);
  textStyle(NORMAL);
  text(`環境評估：${weatherStatusText}`, 240, 122);

  // 分割線二
  stroke(255, 255, 255, 35);
  line(40, 150, 440, 150);
  noStroke();

  // 排行榜區塊
  fill(255, 255, 255, 200);
  textSize(13);
  textStyle(BOLD);
  text('📊 當前時段雨量最高測站排行：', 40, 165);
  
  textSize(12);
  textStyle(NORMAL);
  for (let i = 0; i < topStations.length; i++) {
    let st = topStations[i];
    let medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
    
    fill(255, 255, 255, 180);
    text(`${medal} 第 ${i+1} 名： ${st.name}`, 50, 195 + i * 25);
    
    fill(189, 224, 254);
    textStyle(BOLD);
    text(`${st.rain.toFixed(1)} mm`, 360, 195 + i * 25);
    textStyle(NORMAL);
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}