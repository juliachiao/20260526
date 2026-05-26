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
let raindrops = [];     
let topStations = [];   

// 全市平均狀態變數
let cityAverageRain = 0;
let weatherStatusText = "觀測中";
let statusLightColor;

// 漣漪特效變數
let rippleCircles = []; 

// 右上角天氣圖示專用雨滴粒子
let iconDrops = [
  { xOffset: -30, y: 0,   speed: 2.3 },
  { xOffset: -10, y: -20, speed: 2.8 },
  { xOffset: 10,  y: -5,  speed: 2.5 },
  { xOffset: 30,  y: -15, speed: 3.0 }
];

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 初始化原生 Leaflet 地圖
  mapObject = L.map('map').setView([25.0650, 121.5350], 12);

  // 載入標準彩色 OpenStreetMap 底圖
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapObject);

  // 初始化全域下雨粒子
  for (let i = 0; i < 80; i++) {
    raindrops.push({
      x: random(width),
      y: random(-height, 0),
      speed: random(5, 8),   
      len: random(12, 22)    
    });
  }

  // 計算排行榜與全市平均雨量
  calculateTopStations();
  calculateCityMetrics();

  // 在地圖上釘上紅色圓點
  renderMapMarkers();
}

function draw() {
  clear(); // 保持畫布全透明
  
  // 1. 執行全域持續自動下雨的特效更新
  drawWeatherEffects();

  // 2. 動態追蹤第一名並繪製雷達波紋擴散特效
  drawTopStationRipple();

  // 3. 繪製全網頁四周的 Y2K 夢幻雷射漸層霓虹發光邊框
  drawCyberBorder();

  // 4. 繪製放大 1.5 倍的動態天氣下雨圖案
  drawWeatherIcon();

  // 5. 繪製「純淨夢幻紫美化版」面板 UI
  drawUI();
}

// 自動計算雨量前三名
function calculateTopStations() {
  let tempArray = [];
  for (let name in stationData) {
    tempArray.push({ name: name, rain: stationData[name].rain });
  }
  tempArray.sort((a, b) => b.rain - a.rain);
  topStations = tempArray.slice(0, 3);
}

// 自動計算全市平均數據與燈號評級
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
    statusLightColor = color(120, 190, 180); 
  } else if (cityAverageRain > 0 && cityAverageRain <= 1.5) {
    weatherStatusText = "微雨局降 / 狀態良好";
    statusLightColor = color(109, 89, 147); // 深紫狀態燈
  } else if (cityAverageRain > 1.5 && cityAverageRain <= 3.0) {
    weatherStatusText = "全市普遍降雨 / 注意路面濕滑";
    statusLightColor = color(220, 140, 20);   
  } else {
    weatherStatusText = "部分地區暴雨 / 大雨警戒中";
    statusLightColor = color(230, 60, 60);   
  }
}

// 繪製全域下雨特效
function drawWeatherEffects() {
  stroke(140, 120, 180, 120); // 改為淡紫色雨滴線條，與看板呼應
  strokeWeight(1.2);

  for (let i = 0; i < raindrops.length; i++) {
    let r = raindrops[i];
    line(r.x, r.y, r.x, r.y + r.len);
    r.y += r.speed;
    if (r.y > height) {
      r.x = random(width);
      r.y = random(-20, 0);
    }
  }
}

// 在地圖第一名位置繪製雷達擴散波紋
function drawTopStationRipple() {
  if (topStations.length === 0) return;

  let topName = topStations[0].name;
  let topCoord = stationData[topName];

  if (topCoord) {
    let latLng = L.latLng(topCoord.lat, topCoord.lon);
    let containerPoint = mapObject.latLngToContainerPoint(latLng);
    
    if (frameCount % 25 === 0) {
      rippleCircles.push({ radius: 14, alpha: 255 });
    }

    push();
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(140, 110, 180, 0.5)';

    for (let i = rippleCircles.length - 1; i >= 0; i--) {
      let c = rippleCircles[i];
      c.radius += 1.8;
      c.alpha -= 2.2;

      if (c.alpha <= 0) {
        rippleCircles.splice(i, 1);
        continue;
      }

      noFill();
      strokeWeight(2);
      stroke(140, 110, 180, c.alpha); // 紫色波紋圈
      ellipse(containerPoint.x, containerPoint.y, c.radius * 2);

      strokeWeight(1);
      stroke(205, 180, 219, c.alpha * 0.4); 
      ellipse(containerPoint.x, containerPoint.y, (c.radius - 8) * 2);
    }
    pop();
  }
}

// 繪製全網頁四周的 Y2K 夢幻雷射漸層邊框
function drawCyberBorder() {
  push();
  noFill();
  let borderWidth = 4;
  strokeWeight(borderWidth);

  let glowIntensity = 25 + sin(frameCount * 0.05) * 8;
  drawingContext.shadowBlur = glowIntensity;
  drawingContext.shadowColor = 'rgba(205, 180, 219, 0.85)';

  for (let x = 0; x < width; x += 10) {
    let inter = map(x, 0, width, 0, 1);
    let c = lerpColor(color('#cdb4db'), color('#e2d4f1'), inter);
    stroke(c);
    line(x, borderWidth/2, Math.min(x + 11, width), borderWidth/2);
  }
  for (let y = 0; y < height; y += 10) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color('#e2d4f1'), color('#cdb4db'), inter);
    stroke(c);
    line(width - borderWidth/2, y, width - borderWidth/2, Math.min(y + 11, height));
  }
  for (let x = width; x > 0; x -= 10) {
    let inter = map(x, 0, width, 1, 0);
    let c = lerpColor(color('#cdb4db'), color('#e2d4f1'), inter);
    stroke(c);
    line(x, height - borderWidth/2, Math.max(x - 11, 0), height - borderWidth/2);
  }
  for (let y = height; y > 0; y -= 10) {
    let inter = map(y, 0, height, 1, 0);
    let c = lerpColor(color('#e2d4f1'), color('#cdb4db'), inter);
    stroke(c);
    line(borderWidth/2, y, borderWidth/2, Math.max(y - 11, 0));
  }
  pop();
}

// 繪製動態天氣圖案
function drawWeatherIcon() {
  push();
  let iconX = width - 100;
  let iconY = 80;

  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = 'rgba(205, 180, 219, 0.85)';

  stroke(109, 89, 147, 220); // 深紫色雨滴
  strokeWeight(3.0); 
  
  for (let i = 0; i < iconDrops.length; i++) {
    let drop = iconDrops[i];
    drop.y += drop.speed;
    if (drop.y > 65) drop.y = 10;
    if (drop.y > 15) {
      line(iconX + drop.xOffset - 3, iconY + drop.y, iconX + drop.xOffset - 6, iconY + drop.y + 12);
    }
  }

  noStroke();
  fill(224, 212, 241, 210); // 夢幻紫雲朵底色
  ellipse(iconX, iconY, 75, 68);          
  ellipse(iconX - 33, iconY + 9, 48, 48); 
  ellipse(iconX + 33, iconY + 6, 51, 51); 
  rect(iconX - 38, iconY + 7, 76, 24);    

  stroke(109, 89, 147, 230); // 深紫色雲朵邊框
  strokeWeight(3.0); 
  noFill();
  
  beginShape();
  arc(iconX - 33, iconY + 9, 48, 48, PI - QUARTER_PI, TWO_PI - HALF_PI);
  arc(iconX, iconY, 75, 68, PI + QUARTER_PI, TWO_PI);
  arc(iconX + 33, iconY + 6, 51, 51, PI + HALF_PI, HALF_PI + QUARTER_PI);
  line(iconX + 38, iconY + 31, iconX - 33, iconY + 33);
  endShape();

  pop();
}

// 在地圖上建立圓點標記與滑鼠互動事件
function renderMapMarkers() {
  for (let stationName in stationData) {
    let s = stationData[stationName];
    let lat = s.lat;
    let lng = s.lon;
    let rainValue = s.rain;

    let dynamicRadius = map(rainValue, 0, 6, 6, 14);
    dynamicRadius = constrain(dynamicRadius, 6, 16);

    let marker = L.circleMarker([lat, lng], {
      radius: dynamicRadius,            
      color: '#ffffff',     
      weight: 2,            
      fillColor: '#ff0a14', 
      fillOpacity: 0.9,    
      interactive: true     
    }).addTo(mapObject);

    let tooltipContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px; background: #2e263f; color: #fff; border-radius: 6px; min-width: 180px;">
        <b style="font-size: 14px; color: #fff; display: block; margin-bottom: 4px;">測站名稱：${stationName}</b>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.15); margin: 6px 0;">
        <span style="color: #e2d4f1; font-size: 13px; display: block; margin-bottom: 3px;">1hr 累積雨量: <b>${rainValue.toFixed(1)} mm</b></span>
        <span style="color: #cccccc; font-size: 11px; display: block; margin-bottom: 2px;">位置座標: ${lng.toFixed(4)}, ${lat.toFixed(4)}</span>
      </div>
    `;

    marker.bindPopup(tooltipContent, {
      closeButton: false,          
      offset: L.point(0, -6),      
      className: 'custom-popup'
    });

    marker.on('mouseover', function () {
      this.openPopup(); 
      this.setStyle({ radius: dynamicRadius + 4, fillColor: '#ff453a' }); 
    });
    
    marker.on('mouseout', function () {
      this.closePopup(); 
      this.setStyle({ radius: dynamicRadius, fillColor: '#ff0a14' });  
    });
  }
}

// 繪製面板 UI
function drawUI() {
  push();
  noStroke();
  
  // ==================== [ 🛠️ 左上角：監測看板全新夢幻紫調 ] ====================
  // 1. 主面板背景 (改為圖片中高質感的半透明夢幻紫)
  fill(224, 212, 241, 225); // #e2d4f1 帶高透明毛玻璃感
  rect(20, 20, 440, 280, 10); 

  // 2. 面板邊框 (深紫色優雅勾邊)
  stroke(109, 89, 147, 180); // #6d5993
  strokeWeight(2);
  noFill();
  rect(20, 20, 440, 280, 10);
  
  stroke(255, 255, 255, 100);
  strokeWeight(1);
  rect(21, 21, 438, 278, 9);
  noStroke();
  
  // 3. 標題與裝飾
  let starAlpha = 180 + sin(frameCount * 0.1) * 75; 
  fill(109, 89, 147, starAlpha); 
  textSize(20);
  textAlign(LEFT, TOP);
  text('✦', 38, 38);

  // 大標題：高對比深邃科技紫 (#4a3b68)
  fill(74, 59, 104); 
  textSize(21);
  textFont('system-ui, sans-serif');
  textStyle(BOLD);
  text('臺北市即時雨量監測看板', 62, 36);
  
  // 說明文字 (改為典雅紫)
  fill(109, 89, 147, 220); 
  textSize(11);
  textStyle(NORMAL);
  text('👉 畫面已開啟全域下雨特效，移至紅色圓點看觀測詳情', 42, 66);

  // 分割線
  stroke(109, 89, 147, 60);
  line(40, 86, 440, 86);
  noStroke();

  // 4. 全市即時總覽區塊
  fill(74, 59, 104);
  textSize(13);
  textStyle(BOLD);
  text('🌍 全市即時氣象總覽：', 40, 98);
  
  // 呼吸狀態燈圈
  let pulseRadius = 11 + sin(frameCount * 0.08) * 2; 
  fill(statusLightColor.levels[0], statusLightColor.levels[1], statusLightColor.levels[2], 80); 
  ellipse(52, 127, pulseRadius + 6);
  fill(statusLightColor); 
  ellipse(52, 127, 11);
  
  fill(74, 59, 104);
  textSize(12);
  textStyle(NORMAL);
  text(`全市平均雨量：`, 75, 122);
  textStyle(BOLD);
  text(`${cityAverageRain.toFixed(2)} mm`, 160, 122);
  
  fill(109, 89, 147);
  textStyle(NORMAL);
  text(`環境評估：${weatherStatusText}`, 240, 122);

  // 分割線
  stroke(109, 89, 147, 60);
  line(40, 150, 440, 150);
  noStroke();

  // 5. 排行榜美化 (與圖表顏色完美融合)
  fill(74, 59, 104);
  textSize(13);
  textStyle(BOLD);
  text('📊 當前時段雨量最高測站排行：', 40, 164);
  
  textSize(12);
  for (let i = 0; i < topStations.length; i++) {
    let st = topStations[i];
    let medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
    let textY = 194 + i * 32; 
    
    fill(74, 59, 104);
    textStyle(NORMAL);
    text(`${medal} 第 ${i+1} 名： ${st.name}`, 50, textY);
    
    // 進度條背景槽 (淺紫內縮軌道)
    fill(205, 190, 225, 180);
    rect(180, textY + 3, 160, 6, 3);
    
    // 霓虹漸層進度條 (第一名用高飽和紫紅，二三名用洗鍊紫藍)
    let barWidth = map(st.rain, 0, 6, 0, 160);
    if (i === 0) fill(150, 80, 160, 240); 
    else fill(110, 130, 200, 240);
    rect(180, textY + 3, barWidth, 6, 3);
    
    fill(74, 59, 104);
    textStyle(BOLD);
    text(`${st.rain.toFixed(1)} mm`, 365, textY);
  }

  // ==================== [ 右下角：開發者資訊卡同步紫化 ] ====================
  let cardWidth = 195;
  let cardHeight = 54;
  let cardX = width - cardWidth - 25;
  let cardY = height - cardHeight - 25;

  fill(224, 212, 241, 225); // 同步改為夢幻紫
  rect(cardX, cardY, cardWidth, cardHeight, 6);

  stroke(109, 89, 147, 180); 
  strokeWeight(1.5);
  noFill();
  rect(cardX, cardY, cardWidth, cardHeight, 6);
  noStroke();

  fill(109, 89, 147, 180); 
  rect(cardX + 12, cardY + 12, 3, 10, 1.5);

  textAlign(LEFT, TOP);
  textFont('sans-serif');
  
  fill(109, 89, 147); 
  textSize(9);
  textStyle(BOLD);
  text('SYSTEM DEVELOPER', cardX + 20, cardY + 12);

  fill(74, 59, 104);
  textSize(13);
  textStyle(BOLD);
  text('413737015 季子蕎', cardX + 20, cardY + 28);

  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}