// gps.js skeleton
function initGps(){
  // TODO: move GPS / Map / Playback logic here
}

// GPS inline script moved from HTML (v79_test5)

// ==============================
  // State
  // ==============================
  let port = null;
  let reader = null;
  let demoTimer = null;
  let currentMode = "gps"; // serial | can | gps

  // DEMO (vehicle)
  let demoSpeed = 0;
  let demoTargetSpeed = 0;
  let demoOdo = 123456;
  let demoFuelBase = 80;
  let demoCoolant = 35;

  // DEMO (gps)
  let demoLat = 25.0330;
  let demoLon = 121.5654;
  let demoCourse = 90;
  let demoUtcSec = 0;
  let demoSats = 8;
  let demoHdop = 0.9;
  let demoFixQ = 1;

  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const connectBtn = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");
  const demoBtn = document.getElementById("demoBtn");

  const uartGroup = document.getElementById("uartGroup");
  const baudSelect = document.getElementById("baudSelect");
  const dataBitsSelect = document.getElementById("dataBitsSelect");
  const paritySelect = document.getElementById("paritySelect");
  const stopBitsSelect = document.getElementById("stopBitsSelect");
  baudSelect.value = "9600";

  const logEl = document.getElementById("log");
  const warningEl = document.getElementById("warning");
  const modeRadios = document.querySelectorAll("input[name='mode']");

  // Metrics elements arrays
  const cards  = [...Array(8)].map((_,i)=>document.getElementById("card"+i));
  const labels = [...Array(8)].map((_,i)=>document.getElementById("label"+i));
  const subs   = [...Array(8)].map((_,i)=>document.getElementById("sub"+i));
  const values = [...Array(8)].map((_,i)=>document.getElementById("value"+i));
  const units  = [...Array(8)].map((_,i)=>document.getElementById("unit"+i));
  const extras = [...Array(8)].map((_,i)=>document.getElementById("extra"+i));
  const needle0 = document.getElementById("needle0");
  const needle1 = document.getElementById("needle1");

  // GPS bar elements
  const gpsBar = document.getElementById("gpsBar");
  const metricGrid = document.getElementById("metricGrid");
  const gpsSpeedEl = document.getElementById("gpsSpeed");
  const gpsCourseEl = document.getElementById("gpsCourse");
  const gpsAltEl = document.getElementById("gpsAlt");
  const gpsLatEl = document.getElementById("gpsLat");
  const gpsLonEl = document.getElementById("gpsLon");
  const gpsSatsEl = document.getElementById("gpsSats");
  const gpsHdopEl = document.getElementById("gpsHdop");
  const gpsFixEl = document.getElementById("gpsFix");
  const gpsFixChip = document.getElementById("gpsFixChip");
  const gpsUtcEl = document.getElementById("gpsUtc");
  const gpsLocalTsEl = document.getElementById("gpsLocalTs");
  const gpsNeedle = document.getElementById("gpsNeedle");

  // ==============================
  // Mode UI definitions
  // ==============================
  const modeUI = {
    serial: [
      {label:"速度", sub:"PGN 65265 · SPN 84", unit:"km/h", hasNeedle:true, needleMax:250},
      {label:"轉速", sub:"PGN 61444 · SPN 190", unit:"RPM",  hasNeedle:true, needleMax:8000},
      {label:"里程", sub:"PGN 65217", unit:"km"},
      {label:"油量", sub:"PGN 65276 · SPN 96", unit:"%"},
      {label:"電壓", sub:"PGN 65271 · SPN 168", unit:"V"},
      {label:"水溫", sub:"PGN 65262 · SPN 110", unit:"°C"},
      {label:"機油壓", sub:"PGN 65263 · SPN 100", unit:"kPa"},
      {label:"油耗率", sub:"PGN 65266 · SPN 183", unit:"L/h"},
    ],
    can: [
      {label:"速度", sub:"PGN 65265 · SPN 84", unit:"km/h", hasNeedle:true, needleMax:250},
      {label:"轉速", sub:"PGN 61444 · SPN 190", unit:"RPM",  hasNeedle:true, needleMax:8000},
      {label:"里程", sub:"PGN 65217", unit:"km"},
      {label:"油量", sub:"PGN 65276 · SPN 96", unit:"%"},
      {label:"電壓", sub:"PGN 65271 · SPN 168", unit:"V"},
      {label:"水溫", sub:"PGN 65262 · SPN 110", unit:"°C"},
      {label:"機油壓", sub:"PGN 65263 · SPN 100", unit:"kPa"},
      {label:"油耗率", sub:"PGN 65266 · SPN 183", unit:"L/h"},
    ],
  };

  const mapWrap = document.getElementById("mapWrap");
  const playbackBar = document.getElementById("playbackBar");

  function applyModeUI(mode){
    if(mode==="gps"){
      metricGrid.style.display="none";
      gpsBar.style.display="flex";
      mapWrap.style.display="block";
      playbackBar.style.display="flex";
      uartGroup.style.display="flex"; // still show uart group? gps doesn't need uart; hide:
      uartGroup.style.display="none";
      if (mode === "can") logEl.classList.add("log-can");
      else logEl.classList.remove("log-can");
      setTimeout(initMapIfNeeded, 0);
      return;
    }

    // serial/can
    metricGrid.style.display="grid";
    gpsBar.style.display="none";
    mapWrap.style.display="none";
    playbackBar.style.display="none";

    const defs = modeUI[mode];
    defs.forEach((d,i)=>{
      labels[i].textContent = d.label;
      units[i].textContent  = d.unit || "";
      subs[i].textContent   = d.sub || "";
      subs[i].style.display = d.sub ? "block" : "none";
      extras[i].style.display = "none";
      extras[i].textContent = "";
      values[i].textContent = "--";
      cards[i].classList.remove("fix-ok","fix-bad");
    });

    needle0.style.opacity = defs[0].hasNeedle ? "1" : "0";
    needle1.style.opacity = defs[1].hasNeedle ? "1" : "0";

    if (mode === "can") logEl.classList.add("log-can");
    else logEl.classList.remove("log-can");

    uartGroup.style.display = (mode === "can") ? "none" : "flex";
  }

  // ==============================
  // Mini needles
  // ==============================
  

  // ==============================
  // Log
  // ==============================
  

  // ==============================
  // Mode lock
  // ==============================
  function updateModeLock(){
    const locked = (demoTimer !== null) || (port !== null) || (pbPlaying);
    modeRadios.forEach(r => r.disabled = locked);
  }
  function updateUartLock(){
    const locked = (port !== null);
    baudSelect.disabled = locked;
    dataBitsSelect.disabled = locked;
    paritySelect.disabled = locked;
    stopBitsSelect.disabled = locked;
  }

  modeRadios.forEach(r=>{
    r.addEventListener("change", e=>{
      if(!e.target.checked) return;
      currentMode = e.target.value;
      appendLog("模式切換為：" + (
        currentMode==="serial" ? "USB-RS232" :
        currentMode==="can"    ? "USB-CAN" : "USB-GPS"
      ));
      applyModeUI(currentMode);
      updateModeLock();
      updateUartLock();
    });
  });

  // ==============================
  // Serial connect with UART options
  // ==============================
  function getUartOptions(){
    return {
      baudRate: parseInt(baudSelect.value,10),
      dataBits: parseInt(dataBitsSelect.value,10),
      parity: paritySelect.value,
      stopBits: parseInt(stopBitsSelect.value,10)
    };
  }

  async function connectSerial(){
    if(!("serial" in navigator)){
      warningEl.style.display="block";
      warningEl.textContent="此瀏覽器不支援 Web Serial，請使用最新版 Chrome。";
      return;
    }
    warningEl.style.display="none";

    try{
      port = await navigator.serial.requestPort();
      await port.open(getUartOptions());

      statusDot.classList.add("connected");
      statusText.textContent="已連線";
      connectBtn.disabled=true;
      disconnectBtn.disabled=false;

      updateModeLock();
      updateUartLock();

      reader = port.readable.getReader();
      const decoder = new TextDecoder();
      let buffer="";

      while(true){
        const {value,done} = await reader.read();
        if(done) break;
        buffer += decoder.decode(value);

        let idx;
        while((idx=buffer.indexOf("\n"))>=0){
          const line = buffer.slice(0,idx).trim();
          buffer = buffer.slice(idx+1);
          if(line.length>0) handleLine("RX", line);
        }
      }
    }catch(e){
      appendLog("連線錯誤: "+e);
      port=null;
      reader=null;
      connectBtn.disabled=false;
      disconnectBtn.disabled=true;
      statusDot.classList.remove("connected");
      statusText.textContent="尚未連線";
      updateModeLock();
      updateUartLock();
    }
  }

  async function disconnectSerial(){
    try{
      if(reader) await reader.cancel();
      if(port) await port.close();
    }catch{}
    port=null; reader=null;
    connectBtn.disabled=false;
    disconnectBtn.disabled=true;
    statusDot.classList.remove("connected");
    statusText.textContent="尚未連線";
    updateModeLock();
    updateUartLock();
    appendLog("已中斷連線");
  }

  connectBtn.addEventListener("click", connectSerial);
  disconnectBtn.addEventListener("click", disconnectSerial);

  // ==============================
  // DEMO (vehicle)
  // ==============================
  function randomVehicleDemo(){
    const dt = 0.2;

    if(Math.abs(demoSpeed-demoTargetSpeed)<5){
      if(Math.random()<0.3) demoTargetSpeed = Math.random()<0.5 ? 0 : 120;
      else demoTargetSpeed = Math.random()*120;
    }

    const maxAccelPerSec=25;
    const maxDelta=maxAccelPerSec*dt;
    const delta=demoTargetSpeed-demoSpeed;
    const step=Math.sign(delta)*Math.min(Math.abs(delta),maxDelta);
    demoSpeed += step;
    demoSpeed = Math.max(0, Math.min(120, demoSpeed));

    const rpm = 3000 + (demoSpeed/120)*(8000-3000);
    demoOdo += demoSpeed*(dt/3600);

    demoFuelBase -= 0.0005;
    if(demoFuelBase<10) demoFuelBase=80;
    let fuelLevel = demoFuelBase + (Math.random()*10-5);
    fuelLevel = Math.max(0, Math.min(100, fuelLevel));

    let volt = 24.0 + (rpm/8000)*3.0 + (Math.random()*0.6-0.3);
    volt = Math.max(22.5, Math.min(28.5, volt));

    const coolantTarget=70+(demoSpeed/120)*30;
    demoCoolant += (coolantTarget-demoCoolant)*0.02;
    let coolant = demoCoolant + (Math.random()*2-1);
    coolant = Math.max(30, Math.min(110, coolant));

    let oilp=120+(rpm/8000)*500+(Math.random()*30-15);
    oilp=Math.max(80,Math.min(700,oilp));

    let frate=5+(demoSpeed/120)*30+(rpm/8000)*25+(Math.random()*3-1.5);
    frate=Math.max(2,Math.min(80,frate));

    return {speed:demoSpeed,rpm,odo:demoOdo,fuelLevel,volt,coolant,oilp,frate};
  }

  // ==============================
  // DEMO (gps nmea)
  // ==============================
  
  
  
  function makeRMC(lat, lon, speedKmh, courseDeg, utcSec){
    const timeStr = formatUtcTime(utcSec);
    const status = (demoFixQ>0) ? "A" : "V";
    const latStr = toDDMM(lat);
    const lonStr = toDDDMM(lon);
    const ns = lat>=0 ? "N" : "S";
    const ew = lon>=0 ? "E" : "W";
    const knots = (speedKmh/1.852).toFixed(1);
    const course = courseDeg.toFixed(1);
    const date = "120325";
    const body = `GNRMC,${timeStr},${status},${latStr},${ns},${lonStr},${ew},${knots},${course},${date},,,A`;
    return `$${body}*00`;
  }
  function makeGGA(lat, lon, altM, fixQ, sats, hdop, utcSec){
    const timeStr = formatUtcTime(utcSec);
    const latStr = toDDMM(lat);
    const lonStr = toDDDMM(lon);
    const ns = lat>=0 ? "N" : "S";
    const ew = lon>=0 ? "E" : "W";
    const body = `GNGGA,${timeStr},${latStr},${ns},${lonStr},${ew},${fixQ},${String(sats).padStart(2,"0")},${hdop.toFixed(1)},${altM.toFixed(1)},M,,M,,`;
    return `$${body}*00`;
  }

  function randomGpsDemo(speedKmh){
    demoCourse += (Math.random()*10-5);
    if(demoCourse<0) demoCourse+=360;
    if(demoCourse>=360) demoCourse-=360;

    const metersPerSec = speedKmh/3.6;
    const dt = 0.2;
    const dist = metersPerSec*dt;
    const rad = demoCourse*Math.PI/180;
    const dNorth = dist*Math.cos(rad);
    const dEast  = dist*Math.sin(rad);
    const dLat = dNorth/111320;
    const dLon = dEast/(111320*Math.cos(demoLat*Math.PI/180));
    demoLat += dLat; demoLon += dLon;

    demoSats = Math.max(4, Math.min(14, demoSats + (Math.random()<0.3?(Math.random()<0.5?-1:1):0)));
    demoHdop = Math.max(0.6, Math.min(2.5, demoHdop + (Math.random()*0.2-0.1)));
    demoFixQ = demoSats>=6 ? 1 : (demoSats>=4 ? 1 : 0);

    demoUtcSec += dt;
    if(demoUtcSec>=86400) demoUtcSec=0;

    const alt = 30 + Math.sin(demoUtcSec/60)*2;

    return {
      rmc: makeRMC(demoLat, demoLon, speedKmh, demoCourse, demoUtcSec),
      gga: makeGGA(demoLat, demoLon, alt, demoFixQ, demoSats, demoHdop, demoUtcSec)
    };
  }

  // ==============================
  // DEMO start/stop
  // ==============================
  function startDemo(){
    if(demoTimer) return;
    demoBtn.textContent="停止 DEMO";
    demoBtn.classList.add("active");
    updateModeLock();

    demoTimer = setInterval(()=>{
      const v = randomVehicleDemo();

      if(currentMode==="serial"){
        const line =
          `SPD=${v.speed.toFixed(1)};RPM=${v.rpm.toFixed(0)};ODO=${v.odo.toFixed(0)};` +
          `FUEL=${v.fuelLevel.toFixed(1)};VOLT=${v.volt.toFixed(2)};TEMP=${v.coolant.toFixed(1)};` +
          `OILP=${v.oilp.toFixed(0)};FRATE=${v.frate.toFixed(1)}`;
        handleLine("DEMO", line);
      }else if(currentMode==="can"){
        const frames = j1939FramesFromValues(v);
        frames.forEach(f=>handleLine("DEMO", f));
      }else{
        const nmea = randomGpsDemo(v.speed);
        handleLine("DEMO", nmea.rmc);
        handleLine("DEMO", nmea.gga);
      }
    }, 200);
  }

  function stopDemo(){
    if(!demoTimer) return;
    clearInterval(demoTimer);
    demoTimer=null;
    demoBtn.textContent="模擬 DEMO";
    demoBtn.classList.remove("active");
    updateModeLock();
  }

  demoBtn.addEventListener("click", ()=>{
    if(demoTimer) stopDemo();
    else startDemo();
  });

  // ==============================
  // J1939 DEMO frames
  // ==============================
  function hex2(v){ return v.toString(16).toUpperCase().padStart(2,"0"); }
  function j1939FramesFromValues(v){
    const frames=[];
    const spdRaw=Math.round(v.speed*256);
    frames.push(`18FEF100,8,${hex2(spdRaw&0xFF)},${hex2((spdRaw>>8)&0xFF)},FF,FF,FF,FF,FF,FF`);
    const rpmRaw=Math.round(v.rpm*8);
    frames.push(`18F00400,8,FF,FF,FF,${hex2(rpmRaw&0xFF)},${hex2((rpmRaw>>8)&0xFF)},FF,FF,FF`);
    const odoRaw=Math.round(v.odo/0.005);
    frames.push(`18FEC100,8,${hex2(odoRaw&0xFF)},${hex2((odoRaw>>8)&0xFF)},${hex2((odoRaw>>16)&0xFF)},${hex2((odoRaw>>24)&0xFF)},FF,FF,FF,FF`);
    const fuelRaw=Math.round(v.fuelLevel/0.4);
    frames.push(`18FEFC00,8,${hex2(fuelRaw&0xFF)},FF,FF,FF,FF,FF,FF,FF`);
    const voltRaw=Math.round(v.volt/0.05);
    frames.push(`18FEF700,8,FF,FF,FF,FF,${hex2(voltRaw&0xFF)},${hex2((voltRaw>>8)&0xFF)},FF,FF`);
    const tempRaw=Math.round(v.coolant+40);
    frames.push(`18FEEE00,8,${hex2(tempRaw&0xFF)},FF,FF,FF,FF,FF,FF,FF`);
    const oilpRaw=Math.round(v.oilp/4);
    frames.push(`18FEEF00,8,FF,FF,FF,${hex2(oilpRaw&0xFF)},FF,FF,FF,FF`);
    const frRaw=Math.round(v.frate/0.05);
    frames.push(`18FEF200,8,${hex2(frRaw&0xFF)},${hex2((frRaw>>8)&0xFF)},FF,FF,FF,FF,FF,FF`);
    return frames;
  }

  // ==============================
  // Highlight cards
  // ==============================
  let highlightTimer=null;
  function highlightCards(){
    if(currentMode==="gps") return; // gps no cards
    cards.forEach(c=>c.classList.add("metric-card--active"));
    if(highlightTimer) clearTimeout(highlightTimer);
    highlightTimer=setTimeout(()=>{
      cards.forEach(c=>c.classList.remove("metric-card--active"));
    },2000);
  }

  // ==============================
  // Line dispatcher
  // ==============================
  function handleLine(prefix, line){
    appendLog(`${prefix}: ${line}`);

    if(currentMode==="serial") parseSerial(line);
    else if(currentMode==="can") parseCAN(line);
    else parseGPS(line);

    highlightCards();
  }

  // ==============================
  // Parse Serial
  // ==============================
  function parseSerial(line){
    const parts=line.split(";");
    const map={};
    for(const p of parts){
      const [k,v]=p.split("=");
      if(!v) continue;
      map[k.trim().toUpperCase()] = parseFloat(v);
    }

    if(map.SPD!=null){
      values[0].textContent = map.SPD.toFixed(1);
      rotateNeedle(needle0, map.SPD, 0, 250);
    }
    if(map.RPM!=null){
      values[1].textContent = map.RPM.toFixed(0);
      rotateNeedle(needle1, map.RPM, 0, 8000);
    }
    if(map.ODO!=null) values[2].textContent = map.ODO.toFixed(0);
    if(map.FUEL!=null) values[3].textContent = map.FUEL.toFixed(0);
    if(map.VOLT!=null) values[4].textContent = map.VOLT.toFixed(2);
    if(map.TEMP!=null) values[5].textContent = map.TEMP.toFixed(1);
    if(map.OILP!=null) values[6].textContent = map.OILP.toFixed(0);
    if(map.FRATE!=null) values[7].textContent = map.FRATE.toFixed(1);
  }

  // ==============================
  // Parse J1939 CAN RAW
  // ==============================
  function parseCAN(line){
    const p=line.split(",");
    if(p.length<3) return;

    const id=parseInt(p[0],16);
    if(Number.isNaN(id)) return;

    const dlc=parseInt(p[1],10);
    if(Number.isNaN(dlc)) return;

    const bytes=p.slice(2).map(v=>parseInt(v,16));
    if(bytes.length<dlc) return;

    const pf=(id>>16)&0xFF;
    let pgn;
    if(pf<240) pgn=(id>>8)&0xFF00;
    else pgn=(id>>8)&0xFFFF;

    if(pgn===0xFEF1 && bytes.length>=2){
      const raw=bytes[0]+(bytes[1]<<8);
      const spd=raw/256;
      values[0].textContent=spd.toFixed(1);
      rotateNeedle(needle0, spd, 0, 250);
    }

    if(pgn===0xF004 && bytes.length>=5){
      const raw=bytes[3]+(bytes[4]<<8);
      const rpm=raw*0.125;
      values[1].textContent=rpm.toFixed(0);
      rotateNeedle(needle1, rpm, 0, 8000);
    }

    if(pgn===0xFEC1 && bytes.length>=4){
      const raw=bytes[0]+(bytes[1]<<8)+(bytes[2]<<16)+(bytes[3]<<24);
      const km=raw*0.005;
      values[2].textContent=km.toFixed(0);
    }

    if(pgn===0xFEFC && bytes.length>=1){
      const raw=bytes[0];
      const f=raw*0.4;
      values[3].textContent=f.toFixed(0);
    }

    if(pgn===0xFEF7 && bytes.length>=6){
      const raw=bytes[4]+(bytes[5]<<8);
      const vbat=raw*0.05;
      values[4].textContent=vbat.toFixed(2);
    }

   if(pgn===0xFEEE && bytes.length>=1){
      const raw=bytes[0];
      const temp=raw-40;
      values[5].textContent=temp.toFixed(1);
    }

    if(pgn===0xFEEF && bytes.length>=4){
      const raw=bytes[3];
      const oilp=raw*4;
      values[6].textContent=oilp.toFixed(0);
    }

    if(pgn===0xFEF2 && bytes.length>=2){
      const raw=bytes[0]+(bytes[1]<<8);
      const fr=raw*0.05;
      values[7].textContent=fr.toFixed(1);
    }
  }

  // ==============================
  // GPS (NMEA)
  // ==============================
  const gpsState = {
    lat: null, lon: null,
    speedKmh: null, course: null,
    alt: null, sats: null, hdop: null, fixQ: 0,
    utcTime: null, statusA: false,
    srcType: null,
    lastPerfTs: null
  };

  

  

  
  // Convert "HH:MM:SS" UTC string (from RMC) to local computer time string
  


  

function updateGpsBarUI(){
    const speed = gpsState.speedKmh ?? 0;
    gpsSpeedEl.textContent = (gpsState.speedKmh!=null) ? speed.toFixed(1) : "--";
    rotateNeedle(gpsNeedle, speed, 0, 250);

    gpsCourseEl.textContent = (gpsState.course!=null) ? gpsState.course.toFixed(1) : "--";
    gpsAltEl.textContent = (gpsState.alt!=null) ? gpsState.alt.toFixed(1) : "--";
    gpsLatEl.textContent = (gpsState.lat!=null) ? gpsState.lat.toFixed(6) : "--";
    gpsLonEl.textContent = (gpsState.lon!=null) ? gpsState.lon.toFixed(6) : "--";
    gpsSatsEl.textContent = (gpsState.sats!=null) ? gpsState.sats.toFixed(0) : "--";
    gpsHdopEl.textContent = (gpsState.hdop!=null) ? gpsState.hdop.toFixed(1) : "--";
    gpsUtcEl.textContent = utcToLocalTimeStr(gpsState.utcTime);
    gpsLocalTsEl.textContent = new Date().toLocaleTimeString();

    const fixTxt = fixTextFromState();
    gpsFixEl.textContent = fixTxt;
    const fixOk = gpsState.fixQ>0 && gpsState.statusA;
    gpsFixChip.classList.toggle("ok", fixOk);
    gpsFixChip.classList.toggle("bad", !fixOk);

    // Update map/tracks
    if (fixOk && gpsState.lat!=null && gpsState.lon!=null) {
      updateTracksAndMap(
        gpsState.lat,
        gpsState.lon,
        gpsState.speedKmh || 0,
        gpsState.course || 0,
        gpsState.sats,
        gpsState.hdop,
        fixOk,
        gpsState.srcType || null
      );
    } else {
      updateMapMarkerStyle(false);
    }
  }

  function parseGPS(line){
    if(!line.startsWith("$")) return;

    const star=line.indexOf("*");
    const payload=(star>0?line.slice(1,star):line.slice(1));
    const f=payload.split(",");

    const type=f[0].slice(-3).toUpperCase();

  gpsState.srcType = type;

    if(type==="RMC"){
      gpsState.utcTime = f[1] ? (f[1].slice(0,2)+":"+f[1].slice(2,4)+":"+f[1].slice(4,6)) : gpsState.utcTime;
      gpsState.statusA = (f[2]==="A");

      const lat=nmeaToDecimal(f[3],f[4]);
      const lon=nmeaToDecimal(f[5],f[6]);
      if(lat!=null) gpsState.lat=lat;
      if(lon!=null) gpsState.lon=lon;

      const knots=parseFloat(f[7]);
      if(!Number.isNaN(knots)) gpsState.speedKmh=knots*1.852;

      const course=parseFloat(f[8]);
      if(!Number.isNaN(course)) gpsState.course=course;
    }

    if(type==="GGA"){
      const lat=nmeaToDecimal(f[2],f[3]);
      const lon=nmeaToDecimal(f[4],f[5]);
      if(lat!=null) gpsState.lat=lat;
      if(lon!=null) gpsState.lon=lon;

      const fixQ=parseInt(f[6],10);
      if(!Number.isNaN(fixQ)) gpsState.fixQ=fixQ;

      const sats=parseInt(f[7],10);
      if(!Number.isNaN(sats)) gpsState.sats=sats;

      const hdop=parseFloat(f[8]);
      if(!Number.isNaN(hdop)) gpsState.hdop=hdop;

      const alt=parseFloat(f[9]);
      if(!Number.isNaN(alt)) gpsState.alt=alt;
    }

    if(type==="VTG"){
      const kmh=parseFloat(f[7]);
      if(!Number.isNaN(kmh)) gpsState.speedKmh=kmh;
    }

    updateGpsBarUI();
  }

  // ==============================
  // Map + Tracks (Raw vs Filtered) + Anti-drift
  // ==============================
  let mapInited = false;
  let map = null;
  let dayLayer = null;
  let darkLayer = null;
  let currentTile = "day";

  let marker = null;
  let rawPolyline = null;
  let fltPolyline = null;
  let sharpLayerGroup = null;

  
  let rawTrack = [];
  let fltTrack = [];
  let t15Polyline = null;
  let t15Track = [];
  let t15TotalM = 0;
  let t15Visible = true;
  let last15sSec = null;
  let t15AccSec = 0;
  let t15IntervalSec = 15;
  let t15RealtimeEnabled = true;
  let parkEvents = [];
  let parkMarkers = [];
  let parkVisible = true;
  let parkCluster = null;
  let parkTimelineSec = 0;
  let lastParkUtcSec = null;  // v83_test6: track UTC-based seconds for parking timeline
  let parkCount = 0;
  let totalParkTimeSec = 0;   // v83_test9: total parking time in seconds (sum of all valid parking segments)
  // Parking V1.2 + P_Locking v1.0
  let pLocking = false;              // 是否目前鎖定在某一個停車事件上
  let pLockEventIndex = -1;          // 目前鎖定的 P 事件在 parkEvents 裡的 index
  let pLockSpeedWindow = [];         // P_Locking 模式下最近三筆速度樣本（km/h）

  // Sharp turn (急轉向) state
  let sharpVisible = true;
  let sharpAngleDeg = 60;
  let sharpSpeedKmh = 20;
  let sharpCount = 0;
  let sharpCooldownSec = 0;    // Sharp Turn v2.3: 全域 10 秒冷卻倒數
  let sharpLastUtcSec = null;  // 上一次用於冷卻計算的 UTC 秒數
  let rawLastUtcSec = null;  // Raw 1Hz: 上一次輸出 Raw 點的 UTC 秒（HHMMSS）

let rawVisible = true;
  let fltVisible = true;

  // Auto-fit / follow
  let followEnabled = true; // ON by default
  const followToggleBtn = document.getElementById("followToggleBtn");

  // Bounds & throttle for fit
  let trackBounds = null;
  let lastFitMs = 0;
  const FIT_THROTTLE_MS = 1000;

  // Distance totals
  let rawTotalM = 0;
  let fltTotalM = 0;
  let rawLastPos = null;
  let fltLastPos = null;
  let fltLastPointReg = null;
  let lastBigTurnAnchor = null; // anchor for last accepted big turn (g3), used only for 10m suppression
  const rawKmEl = document.getElementById("rawKm");
  const fltKmEl = document.getElementById("fltKm");
  const parkPtsEl = document.getElementById("parkPts");
const parkTimeEl = document.getElementById("parkTime");  // v83_test9: display total parking time

  function formatHmsFromSec(sec){
    if (!Number.isFinite(sec) || sec <= 0) return "00:00:00";
    const total = Math.floor(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n)=> n.toString().padStart(2,"0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }



  function formatClockFromSec(sec){
    if (!Number.isFinite(sec)) return "--:--:--";
    let s = Math.floor(sec);
    if (!Number.isFinite(s)) return "--:--:--";
    // normalize to 0..86399
    s = ((s % 86400) + 86400) % 86400;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n)=> n.toString().padStart(2,"0");
    return `${pad(h)}:${pad(m)}:${pad(ss)}`;
  }
  function updateParkSummary(){
    if (parkTimeEl) {
      parkTimeEl.textContent = formatHmsFromSec(totalParkTimeSec);
    }
    if (parkPtsEl) {
      parkPtsEl.textContent = parkCount;
    }
  }


  // Stop detection state
  const stopState = {
    lastPos: null,
    stillSec: 0,
  };

  // EMA state (filtered)
  
  // Sharp Turn detection state (v84_test8)
  const sharpState = {
    window: []  // sliding window of up to 4 points
  };

const emaState = {
    latF: null,
    lonF: null
  };

  // Heading-change based filtered state (v50)
  let prevRawPosForHeading = null;
  let prevCourseForHeading = null;
  const turnState = {
    inTurn: false,
    turnStartCourse: null,
    lockedPos: null,   // raw point at g1
    stableCount: 0,
    window: [],        // g2,g3,g4 window
    turnSign: 0        // +1 for left, -1 for right
  };

  

  // Signed smallest-angle difference in degrees within [-180, 180]
  

  let turnAccTh = 100;        // UI controlled threshold
  let turnAccBase = null;    // f: base course
  let turnAccSum = 0;        // acc: signed accumulated change




    let afterBigTurn = false;   // flag: just accepted a big turn (g3), waiting for heading to stabilize

  function feedFailedTurnWindowToCond3(g1, window){
    try{
      const pts = [];
      if (g1 && typeof g1.courseDeg === "number"){
        pts.push(g1);
      }
      if (Array.isArray(window)){
        for (const p of window){
          if (p && typeof p.courseDeg === "number"){
            pts.push(p);
          }
        }
      }
      if (!pts.length) return;
      // If Cond3 has not initialized its base yet, use first heading as base
      if (turnAccBase == null && pts[0].courseDeg != null){
        turnAccBase = pts[0].courseDeg;
        turnAccSum = 0;
        pts.shift();
      }
      for (const p of pts){
        if (p.courseDeg == null) continue;
        const dSigned2 = (typeof signedAngleDiffDeg === "function")
          ? signedAngleDiffDeg(turnAccBase, p.courseDeg)
          : 0;
        if (!Number.isFinite(dSigned2)) continue;
        turnAccSum += dSigned2;
      }
    }catch(e){
      console.warn("feedFailedTurnWindowToCond3 error", e);
    }
  }

function initMapIfNeeded(){
    if(mapInited) return;
    mapInited = true;

    map = L.map('map', { zoomControl: true }).setView([25.0330, 121.5654], 15);

    dayLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap & Carto'
    });

    marker = L.marker([25.0330, 121.5654], { icon: makeArrowIcon(false) }).addTo(map);
    marker.bindTooltip("等待 GPS...", { permanent:true, direction:"top", offset:[0,-6], opacity:0.9 });

    rawPolyline = L.polyline([], {
      color:getComputedStyle(document.documentElement).getPropertyValue('--raw-red').trim(),
      weight:4, opacity:0.55, dashArray:"6,4"
    }).addTo(map);

    t15Polyline = L.polyline([], {
      color:'#ff0000',
      weight:4, opacity:0.8
    }).addTo(map);

    fltPolyline = L.polyline([], {
      color:'#0066ff',
      weight:4, opacity:0.9
    }).addTo(map);

    sharpLayerGroup = L.layerGroup().addTo(map);

    trackBounds = L.latLngBounds([]);
    rawLastUtcSec = null;

    addLegendControl();

    // If user interacts with map, auto turn OFF follow/fit
    map.on("dragstart zoomstart touchstart", ()=>{
      if(!followEnabled) return;
      followEnabled = false;
      refreshFollowBtn();
      appendLog("USER: 手動瀏覽 → 自動關閉跟隨/縮放");
    });
  }

  function addLegendControl(){
    // Legend removed in V86_test3 (no map legend in V86_test3)
  }

  function refreshLegend(){
    const lr = document.getElementById("legendRaw");
    const lf = document.getElementById("legendFlt");
    if(lr) lr.classList.toggle("legend-off", !rawVisible);
    if(lf) lf.classList.toggle("legend-off", !fltVisible);
  }

  function makeArrowIcon(isGray){
    const cls = isGray ? "arrow-marker gray" : "arrow-marker";
    return L.divIcon({
      className: "",
      html: `<div class="${cls}"></div>`,
      iconSize: [18,18],
      iconAnchor: [9,9]
    });
  }

  function updateMapMarkerStyle(fixOk){
    if(!marker) return;
    marker.setIcon(makeArrowIcon(!fixOk));
    setTimeout(()=>rotateArrowDom(gpsState.course || 0), 0);
  }

  

  // Haversine distance (meters)
  function haversineM(lat1, lon1, lat2, lon2){
    const R = 6371000;
    const toRad = d => d*Math.PI/180;
    const dLat = toRad(lat2-lat1);
    const dLon = toRad(lon2-lon1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R*c;
  }

  
function updateKmDisplays(){
    rawKmEl.textContent = (rawTotalM/1000).toFixed(2) + " km";
    fltKmEl.textContent = (fltTotalM/1000).toFixed(2) + " km";
    const rawPtsEl = document.getElementById("rawPts");
    const fltPtsEl = document.getElementById("fltPts");
    if(rawPtsEl) rawPtsEl.textContent = rawTrack.length;
    if(fltPtsEl) fltPtsEl.textContent = fltTrack.length;
    const t15KmEl = document.getElementById("t15Km");
    const t15PtsEl = document.getElementById("t15Pts");
    if(t15KmEl) t15KmEl.textContent = (t15TotalM/1000).toFixed(2) + " km";
    if(t15PtsEl) t15PtsEl.textContent = t15Track.length;
  }
// Determine dt from last update (seconds)
  

  // Filter pipeline for a new point (Filtered only)
  


function filterPipeline(lat, lon, speedKmh, courseDeg, sats, hdop, dt){
    const VMIN = 3;             // km/h: below this skip filtered points
    const HDOP_MAX = 2.5;       // hdop quality gate
    const TURN_DELTA = 15;      // deg, heading change to enter turn (Cond1)
    const STABLE_DELTA = 10;    // deg, stable segment |Δheading| < 10
    const MIN_TURN_DIST_M = 10; // m, too close to last filtered -> ignore new turn

    // 0) HDOP gate: bad quality => reject and do NOT update heading/accum state
    if (hdop != null && hdop > HDOP_MAX){
      return { accept:false, reason:"hdop_bad" };
    }

    // 1) First filtered point: accept unconditionally (after HDOP gate)
    if (!fltLastPos){
      prevRawPosForHeading = {lat, lon};
      prevCourseForHeading = courseDeg;
      turnAccBase = courseDeg;
      turnAccSum = 0;
      return { accept:true, latF:lat, lonF:lon, courseF:courseDeg, speedF:speedKmh, reason:"first" };
    }

    // 2) Speed gate: low-speed jitter is never added to filtered, but we still update heading bases
    if (speedKmh != null && speedKmh < VMIN){
      prevRawPosForHeading = {lat, lon};
      prevCourseForHeading = courseDeg;
      return { accept:false, reason:"low_speed" };
    }

    // 3) Ensure we have a previous raw point for heading comparison
    if (!prevRawPosForHeading || prevCourseForHeading == null){
      prevRawPosForHeading = {lat, lon};
      prevCourseForHeading = courseDeg;
      return { accept:false, reason:"no_prev" };
    }

    // 4) Adjacent heading delta between previous raw and current
    const deltaPrev = Math.abs(angleDiffDeg(prevCourseForHeading, courseDeg));

    // ---------- Cond1: turn detection with g1~g4, drawing g3 ----------
    if (!turnState.inTurn){
      if (deltaPrev >= TURN_DELTA){
        // candidate g1 is the previous raw point
        const g1Lat = prevRawPosForHeading.lat;
        const g1Lon = prevRawPosForHeading.lon;

        // Step5: if g1 is too close to last big-turn anchor (g3), ignore this new turn
        let tooClose = false;
        if (lastBigTurnAnchor && lastBigTurnAnchor.lat != null && lastBigTurnAnchor.lon != null){
          const dM = haversineM(lastBigTurnAnchor.lat, lastBigTurnAnchor.lon, g1Lat, g1Lon);
          if (!Number.isNaN(dM) && dM < MIN_TURN_DIST_M){
            tooClose = true;
          }
        }

        if (!tooClose){
          const dSignedFirst = signedAngleDiffDeg(prevCourseForHeading, courseDeg);
          const sign = Math.sign(dSignedFirst) || 1;

          turnState.inTurn = true;
          turnState.turnStartCourse = prevCourseForHeading; // g1 heading
          turnState.lockedPos = { lat:g1Lat, lon:g1Lon, courseDeg:prevCourseForHeading, speedKmh:speedKmh };
          turnState.window = [];
          turnState.turnSign = sign;
          // current point is g2 candidate
          turnState.window.push({ lat, lon, courseDeg, speedKmh });
        }
      }

      // update previous raw heading state
      prevRawPosForHeading = {lat, lon};
      prevCourseForHeading = courseDeg;
    } else {
      // already in a turn: check continued deviation vs g1 and same turn side
      const dSigned = signedAngleDiffDeg(turnState.turnStartCourse, courseDeg);
      const dAbs = Math.abs(dSigned);
      const sign = Math.sign(dSigned) || turnState.turnSign;

      if (dAbs >= TURN_DELTA && sign === turnState.turnSign){
        // still turning in same direction vs g1
        turnState.window.push({ lat, lon, courseDeg, speedKmh });
      } else {
        // streak broken -> reset turn state
        // v95_test1: feed failed turn window back into Cond3 accumulation
        if (turnState.lockedPos || (turnState.window && turnState.window.length > 0)){
          feedFailedTurnWindowToCond3(turnState.lockedPos, turnState.window);
        }
        turnState.inTurn = false;
        turnState.turnStartCourse = null;
        turnState.lockedPos = null;
        turnState.stableCount = 0;
        turnState.window = [];
        turnState.turnSign = 0;
      }

      // always update previous heading baseline
      prevRawPosForHeading = {lat, lon};
      prevCourseForHeading = courseDeg;

      // If we are still in turn and have g2,g3,g4 -> accept g3 as filtered point
      if (turnState.inTurn && turnState.window.length >= 3){
        const g2 = turnState.window[0];
        const g3 = turnState.window[1]; // middle point of the turn window
        const g4 = turnState.window[2];

        // Sharp Turn v3.0: 在 g3 打點當下，建立一筆 TurnCandidate
        try {
          if (typeof sharpV3_onTurnDetected === "function") {
            // 角度與速度
            const h1 = (turnState.turnStartCourse != null) ? turnState.turnStartCourse
                      : (turnState.lockedPos && typeof turnState.lockedPos.courseDeg === "number" ? turnState.lockedPos.courseDeg : null);
            const h2 = g2.courseDeg;
            const h3 = g3.courseDeg;
            const h4 = g4.courseDeg;
            const d12 = (typeof signedAngleDiffDeg === "function" && h1 != null) ? signedAngleDiffDeg(h1, h2) : null;
            const d13 = (typeof signedAngleDiffDeg === "function" && h1 != null) ? signedAngleDiffDeg(h1, h3) : null;
            const d14 = (typeof signedAngleDiffDeg === "function" && h1 != null) ? signedAngleDiffDeg(h1, h4) : null;

            let angleSum = null;
            let maxDeltaDeg = null;
            if (d12 != null && d13 != null && d14 != null) {
              angleSum = Math.abs(d12) + Math.abs(d13) + Math.abs(d14);
              maxDeltaDeg = Math.max(Math.abs(d12), Math.abs(d13), Math.abs(d14));
            }

            const v2 = g2.speedKmh != null ? g2.speedKmh : 0;
            const v3 = g3.speedKmh != null ? g3.speedKmh : 0;
            const v4 = g4.speedKmh != null ? g4.speedKmh : 0;
            const avgSpeed = (v2 + v3 + v4) / 3;
            const maxSpeed = Math.max(v2, v3, v4);

            // 方向文字
            let directionText = "";
            let signSum = 0;
            if (d12 != null) signSum += d12;
            if (d13 != null) signSum += d13;
            if (d14 != null) signSum += d14;
            let dirSign = signSum > 0 ? 1 : (signSum < 0 ? -1 : (turnState.turnSign || 0));
            if (dirSign > 0) directionText = "右轉";
            else if (dirSign < 0) directionText = "左轉";

            // 時間與 UTC 秒數
            let timeLocal = null;
            let utcSec = null;
            try {
              if (typeof gpsState !== "undefined" && gpsState && typeof gpsState.utcTime === "string") {
                timeLocal = gpsState.utcTime;
                if (typeof utcStrToSec === "function") {
                  utcSec = utcStrToSec(gpsState.utcTime);
                  if (!Number.isFinite(utcSec)) {
                    utcSec = null;
                  }
                }
              }
            } catch(e2){}

            // HDOP / Fix 字串
            let gpsQualityText = "";
            try {
              const parts = [];
              if (typeof hdop === "number") parts.push("HDOP " + hdop.toFixed(1));
              if (typeof gpsState !== "undefined" && gpsState && typeof gpsState.fixQ !== "undefined") {
                const fq = gpsState.fixQ;
                let label = "";
                if (fq === 3) label = "Fix: 3D";
                else if (fq === 2) label = "Fix: 2D";
                else if (fq === 1) label = "Fix: GPS";
                else label = "Fix: ?";
                parts.push(label);
              }
              gpsQualityText = parts.join(" / ");
            } catch(e3){}

            const cand = {
              lat: g3.lat,
              lon: g3.lon,
              angleSum: angleSum,
              maxDeltaDeg: maxDeltaDeg,
              avgSpeed: avgSpeed,
              maxSpeed: maxSpeed,
              utcSec: utcSec,
              g1Lat: turnState.lockedPos ? turnState.lockedPos.lat : null,
              g1Lon: turnState.lockedPos ? turnState.lockedPos.lon : null,
              g2Lat: g2.lat,
              g2Lon: g2.lon,
              g3Lat: g3.lat,
              g3Lon: g3.lon,
              g4Lat: g4.lat,
              g4Lon: g4.lon,
              g1Heading: h1,
              g2Heading: h2,
              g3Heading: h3,
              g4Heading: h4,
              g1Speed: (turnState.lockedPos && typeof turnState.lockedPos.speedKmh === "number") ? turnState.lockedPos.speedKmh : null,
              g2Speed: typeof g2.speedKmh === "number" ? g2.speedKmh : null,
              g3Speed: typeof g3.speedKmh === "number" ? g3.speedKmh : null,
              g4Speed: typeof g4.speedKmh === "number" ? g4.speedKmh : null,
              h1: h1,
              h2: h2,
              h3: h3,
              h4: h4,
              d12: d12,
              d13: d13,
              d14: d14,
              directionText: directionText,
              timeLocal: timeLocal,
              gpsQualityText: gpsQualityText
            };

            sharpV3_onTurnDetected(cand);
          }
        } catch(e){}

        // reset turn state
        turnState.inTurn = false;
        turnState.turnStartCourse = null;
        turnState.lockedPos = null;
        turnState.stableCount = 0;
        turnState.turnSign = 0;
        turnState.window = [];

        // mark that we just accepted a big turn at g3 -> Cond3 will wait for stable heading
        afterBigTurn = true;
        lastBigTurnAnchor = { lat:g3.lat, lon:g3.lon };

        // reset Cond3 accumulators based on g3 heading
        turnAccBase = g3.courseDeg;
        turnAccSum = 0;

        return { accept:true, latF:g3.lat, lonF:g3.lon, courseF:g3.courseDeg, speedF:g3.speedKmh, reason:"turn_g3" };
      }
    }

    // ---------- Cond3: accumulated turning angle supplement points (Filtered v2.2) ----------
    if (turnAccBase == null){
      turnAccBase = courseDeg;
      turnAccSum = 0;
    }

    // 4-A) If we are inside a turn window or a new Cond1 (Δheading ≥ TURN_DELTA) just triggered,
    //      pause straight-segment accumulation for this sample (do not change turnAccSum).
    if (turnState.inTurn || deltaPrev >= TURN_DELTA){
      return { accept:false, reason:"wait" };
    }

    // 4-B) Right after a big turn has been accepted at g3, wait for heading to stabilize.
    //      When adjacent heading change becomes small again (< TURN_DELTA), treat this as
    //      the start of a new straight segment: reset base+sum once, but do not emit a point.
    if (afterBigTurn){
      if (deltaPrev < TURN_DELTA){
        turnAccBase = courseDeg;
        turnAccSum = 0;
        afterBigTurn = false;
      }
      return { accept:false, reason:"wait" };
    }

    // 4-C) Normal straight / gentle curve: accumulate signed heading difference vs turnAccBase
    const dSigned2 = signedAngleDiffDeg(turnAccBase, courseDeg);
    turnAccSum += dSigned2;

    if (Math.abs(turnAccSum) >= turnAccTh){
      // accept current point, and reset base+sum
      turnAccBase = courseDeg;
      turnAccSum = 0;
      return { accept:true, latF:lat, lonF:lon, courseF:courseDeg, speedF:speedKmh, reason:"cond3" };
    }

    return { accept:false, reason:"wait" };
  }
function updateStopState(lat, lon, speedKmh, dt){
    if(!stopState.lastPos){
      stopState.lastPos = {lat, lon};
      stopState.stillSec = 0;
      return;
    }
    const d = haversineM(stopState.lastPos.lat, stopState.lastPos.lon, lat, lon);
    if(speedKmh < 1.5 && d < 3){
      stopState.stillSec += dt;
    } else {
      stopState.stillSec = 0;
      stopState.lastPos = {lat, lon};
    }
  }

  function isStopped(lat, lon, speedKmh, dt){
    updateStopState(lat, lon, speedKmh, dt);
    return stopState.stillSec >= 3.0;
  }


  function finalizeParkCluster(){
    if (!parkCluster) return;
    const span = parkCluster.tLast - parkCluster.t0;
    if (span >= 20) {
      // Parking V1.2: 停車時間 = 偵測起點～離開 10m 的時間（span）
      // 之後再由 P_Locking 期間累加額外時間
      const utc0 = (parkCluster.utc0 != null && Number.isFinite(parkCluster.utc0)) ? parkCluster.utc0 : null;
      const utcLast = (parkCluster.utcLast != null && Number.isFinite(parkCluster.utcLast)) ? parkCluster.utcLast : null;
      addParkingEvent(parkCluster.anchorLat, parkCluster.anchorLon, span, utc0, utcLast);

      // 初始先把 span 納入總停車秒數，之後由 P_Locking 再持續累加
      if (Number.isFinite(span) && span > 0) {
        totalParkTimeSec += span;
      }

      // 啟動 P_Locking，鎖定在最新的 P 事件上
      pLocking = true;
      pLockEventIndex = parkEvents.length - 1;
      pLockSpeedWindow = [];

      updateParkSummary();
    }
  }

  
  // Parking V1.2: 建立 / 更新停車 tooltip HTML 的共用函式
  function buildParkingTooltipHtml(evt){
    if (!evt) return "";
    const lat = evt.lat;
    const lon = evt.lon;
    const spanSec = evt.spanSec;
    const utc0 = evt.utc0;
    const utcLast = evt.utcLast;

    let startStr = "--";
    let endStr = "--";
    if (utc0 != null && Number.isFinite(utc0)) {
      startStr = formatClockFromSec(utc0);
    }
    if (utcLast != null && Number.isFinite(utcLast)) {
      endStr = formatClockFromSec(utcLast);
    }

    // Duration: convert spanSec (seconds) into 中文時間格式
    let zhDuration = "";
    if (typeof spanSec === "number" && spanSec >= 0) {
      const h = Math.floor(spanSec / 3600);
      const m = Math.floor((spanSec % 3600) / 60);
      const s = Math.floor(spanSec % 60);
      const parts = [];
      if (h > 0) parts.push(h + " 小時");
      if (m > 0) parts.push(m + " 分");
      if (s > 0 || parts.length === 0) parts.push(s + " 秒");
      zhDuration = parts.join(" ");
    } else {
      zhDuration = "未知";
    }

    return (
      "【停車事件】" +
      "<br>• 起：" + startStr +
      "<br>• 迄：" + endStr +
      "<br>• 時長：" + zhDuration +
      "<br>• 座標：" + (lat != null ? lat.toFixed(6) : "--") +
      ", " + (lon != null ? lon.toFixed(6) : "--")
    );
  }

  // Parking V1.2: 依據事件 index 重新套用 tooltip 內容
  function refreshParkingTooltipForEvent(index){
    if (!map) return;
    if (index == null || index < 0 || index >= parkEvents.length) return;
    const evt = parkEvents[index];
    const marker = parkMarkers[index];
    if (!evt || !marker) return;
    const tooltipHtml = buildParkingTooltipHtml(evt);
    marker.bindTooltip(
      tooltipHtml,
      {
        direction: "top",
        opacity: 1,
        className: "park-tooltip"
      }
    );
  }

function addParkingEvent(lat, lon, spanSec, utc0, utcLast){
    const evt = { lat, lon, spanSec, utc0, utcLast };
    parkEvents.push(evt);
    parkCount++;
    if (parkPtsEl) parkPtsEl.textContent = parkCount;
    if (!map) return;
    const icon = L.divIcon({
      className: "stop-icon",
      html: "<div class='stop-icon-inner'>P</div>",
      iconSize: [18, 18]
    });
    const marker = L.marker([lat, lon], { icon });
    parkMarkers.push(marker);
    if (parkVisible) {
      marker.addTo(map);
    }
    if (trackBounds) {
      trackBounds.extend([lat, lon]);
    }

    // Build tooltip content for parking event（使用事件物件）
    const tooltipHtml = buildParkingTooltipHtml(evt);

marker.bindTooltip(
  tooltipHtml,
  {
    direction: "top",
    opacity: 1,
    className: "park-tooltip"
  }
);
    marker.off("mouseover");
    marker.off("mouseout");
    let parkTooltipOpen = false;
    marker.on("click", () => {
      if (!parkTooltipOpen) {
        marker.openTooltip();
        parkTooltipOpen = true;
      } else {
        marker.closeTooltip();
        parkTooltipOpen = false;
      }
    });
  }

  function updateTracksAndMap(lat, lon, speedKmh, courseDeg, sats, hdop, fixOk, srcType){
    initMapIfNeeded();
    const dt = getDtSec();
    const isRmcSrc = (srcType === "RMC");

    // Sharp Turn v2.3: 使用 dt 來遞減全域冷卻秒數
    if (!Number.isNaN(dt) && dt > 0) {
      sharpCooldownSec = Math.max(0, sharpCooldownSec - dt);
    }

    // RAW: 每秒只取一筆 RMC 當代表點（配合最近 GGA HDOP）
    const posRaw = L.latLng(lat, lon);
    if (fixOk && isRmcSrc && gpsState && typeof gpsState.utcTime === "string" && gpsState.utcTime.length >= 8) {
      const t = gpsState.utcTime;
      const utcKey = t.slice(0, 2) + t.slice(3, 5) + t.slice(6, 8); // "HH:MM:SS" -> "HHMMSS"
      if (rawLastUtcSec == null || rawLastUtcSec !== utcKey) {
        rawLastUtcSec = utcKey;
        rawPolyline.addLatLng(posRaw);
        rawTrack.push(posRaw);
        if (rawLastPos) {
          rawTotalM += haversineM(rawLastPos.lat, rawLastPos.lon, lat, lon);
        }
        rawLastPos = { lat, lon };
      }
    }

    // Sharp Turn v1 detection (independent from filtered track)
    if (isRmcSrc && fixOk && !Number.isNaN(courseDeg) && !Number.isNaN(speedKmh) && hdop != null) {
      if (sharpCooldownSec > 0) {
        // 冷卻期間內：維持 window 前進，但不觸發新的 S 事件
        if (!sharpState.window) sharpState.window = [];
        sharpState.window.push({
          lat,
          lon,
          courseDeg,
          speedKmh,
          hdop
        });
        if (sharpState.window.length > 4) {
          sharpState.window.shift();
        }
      } else {
        if (!sharpState.window) sharpState.window = [];
        sharpState.window.push({
          lat,
          lon,
          courseDeg,
          speedKmh,
          hdop
        });
        if (sharpState.window.length > 4) {
          sharpState.window.shift();
        }
        if (sharpState.window.length === 4) {
          const g1 = sharpState.window[0];
          const g2 = sharpState.window[1];
          const g3 = sharpState.window[2];
          const g4 = sharpState.window[3];

          // g1 lock: Δ12 >= 15° and HDOP < 2.5
          const d12 = signedAngleDiffDeg(g1.courseDeg, g2.courseDeg);
          if (Math.abs(d12) >= 15 && g1.hdop != null && g1.hdop < 2.5) {
            const d13 = signedAngleDiffDeg(g1.courseDeg, g3.courseDeg);
            const d14 = signedAngleDiffDeg(g1.courseDeg, g4.courseDeg);

            const s1 = Math.sign(d12);
            const s2 = Math.sign(d13);
            const s3 = Math.sign(d14);

            // require all same sign and non-zero（一路同側轉彎）
            if (s1 !== 0 && s1 === s2 && s1 === s3) {
              const accHeading = Math.abs(d12) + Math.abs(d13) + Math.abs(d14);
              const avgSpeed = (g2.speedKmh + g3.speedKmh + g4.speedKmh) / 3;

              
            }
          }
        }
      }
    }

// 15-second track (UTC-based only)
    if (gpsState.utcTime) {
      const utcSec = utcStrToSec(gpsState.utcTime);
      if (utcSec != null && !Number.isNaN(utcSec)) {
        if (last15sSec != null) {
          let delta = utcSec - last15sSec;
          // 處理跨午夜（例如 23:59 -> 00:00）
          if (delta < -43200) {
            delta += 86400;
          }
          if (delta < 0) {
            delta = 0;
          }
          t15AccSec += delta;
        }
        last15sSec = utcSec;
      }
    }

    if (t15RealtimeEnabled && t15AccSec >= t15IntervalSec) {
      const pos15 = { lat, lon };
      if (t15Track.length > 0) {
        const prev15 = t15Track[t15Track.length - 1];
        t15TotalM += haversineM(prev15.lat, prev15.lon, pos15.lat, pos15.lon);
      }
      t15Track.push(pos15);
      if (t15Polyline) {
        t15Polyline.addLatLng(L.latLng(pos15.lat, pos15.lon));
      }
      t15AccSec = t15AccSec % t15IntervalSec;
    }

    
    // Parking detection (v83_test6)
    // Use UTC-based timeline when available, fallback to dt when UTC is missing (e.g., DEMO)
    let dtPark = dt;
    if (gpsState.utcTime) {
      const utcSecForPark = utcStrToSec(gpsState.utcTime);
      if (utcSecForPark != null && !Number.isNaN(utcSecForPark)) {
        if (lastParkUtcSec != null) {
          let delta = utcSecForPark - lastParkUtcSec;
          // handle crossing midnight
          if (delta < -43200) {
            delta += 86400;
          }
          if (delta < 0) {
            delta = 0;
          }
          dtPark = delta;
        }
        lastParkUtcSec = utcSecForPark;
      }
    }
    parkTimelineSec += dtPark;
    if (!pLocking && speedKmh != null && !Number.isNaN(speedKmh)) {
      const isSlow = speedKmh <= 3.0;
      if (isSlow) {
        if (!parkCluster) {
          parkCluster = {
            anchorLat: lat,
            anchorLon: lon,
            t0: parkTimelineSec,
            tLast: parkTimelineSec,
            utc0: (Number.isFinite(lastParkUtcSec) ? lastParkUtcSec : null),
            utcLast: (Number.isFinite(lastParkUtcSec) ? lastParkUtcSec : null)
          };
        } else {
          const dPark = haversineM(parkCluster.anchorLat, parkCluster.anchorLon, lat, lon);
          if (dPark <= 10) {
            parkCluster.tLast = parkTimelineSec;
            if (Number.isFinite(lastParkUtcSec)) {
              parkCluster.utcLast = lastParkUtcSec;
            }
          } else {
            finalizeParkCluster();
            parkCluster = {
              anchorLat: lat,
              anchorLon: lon,
              t0: parkTimelineSec,
              tLast: parkTimelineSec,
              utc0: (Number.isFinite(lastParkUtcSec) ? lastParkUtcSec : null),
              utcLast: (Number.isFinite(lastParkUtcSec) ? lastParkUtcSec : null)
            };
          }
        }
      } else {
        // v83_test5: disabled auto-finalize when speed > 3 km/h
        // keep parkCluster; it will be finalized by distance/time logic (radius/time)
        // (Logic adapted from v29-style detectStopEvents)
      }
    }

    // Parking V1.2: P_Locking 模式（只影響停車事件與時間，不影響軌跡演算法）
    if (pLocking) {
      // 1) 停車時間累積：使用與 Parking 相同的 dtPark 時軸
      if (dtPark != null && !Number.isNaN(dtPark) && dtPark > 0) {
        totalParkTimeSec += dtPark;

        // 同步更新目前鎖定的 P 事件時長與結束時間
        if (pLockEventIndex >= 0 && pLockEventIndex < parkEvents.length) {
          const evt = parkEvents[pLockEventIndex];
          if (evt) {
            if (typeof evt.spanSec === "number" && !Number.isNaN(evt.spanSec)) {
              evt.spanSec += dtPark;
            } else {
              evt.spanSec = dtPark;
            }
            if (Number.isFinite(lastParkUtcSec)) {
              evt.utcLast = lastParkUtcSec;
            }
          }
        }
        // 重新套用目前停車事件的 tooltip 內容
        refreshParkingTooltipForEvent(pLockEventIndex);
        updateParkSummary();
      }

      // 2) 檢查解除條件：HDOP < 2.5 且最近三筆速度都 > 5 km/h
      const hdopVal = gpsState.hdop;
      if (hdopVal != null && !Number.isNaN(hdopVal) && hdopVal < 2.5 &&
          speedKmh != null && !Number.isNaN(speedKmh)) {
        pLockSpeedWindow.push(speedKmh);
        if (pLockSpeedWindow.length > 3) {
          pLockSpeedWindow.shift();
        }
        if (pLockSpeedWindow.length === 3 &&
            pLockSpeedWindow.every(v => v > 5.0)) {
          // 條件成立 → 結束本次 P_Locking
          pLocking = false;
          pLockEventIndex = -1;
          pLockSpeedWindow = [];
        }
      } else {
        // 訊號或速度不穩定時，重置速度窗口，避免誤判
        pLockSpeedWindow = [];
      }
    }

if(rawLastPos){
      rawTotalM += haversineM(rawLastPos.lat, rawLastPos.lon, lat, lon);
    }
    rawLastPos = {lat, lon};

    if(rawVisible && !map.hasLayer(rawPolyline)) rawPolyline.addTo(map);
    if(!rawVisible && map.hasLayer(rawPolyline)) map.removeLayer(rawPolyline);

    // bounds always include RAW when visible
    if(rawVisible) trackBounds.extend(posRaw);

    // FILTERED pipeline
    const out = isRmcSrc ? filterPipeline(lat, lon, speedKmh, courseDeg, sats, hdop, dt) : {accept:false};

    let viewPos = posRaw;
    let viewCourse = courseDeg;
    let viewSpeed = speedKmh;

    if(out.accept){
      const posF = L.latLng(out.latF, out.lonF);
      fltPolyline.addLatLng(posF);

      
            fltTrack.push(posF);
      try {
        if (typeof sharpV3_pushFilteredPoint === "function") {
          // live mode: 使用 gpsState.utcTime（若有）作為 utcSec，否則允許為 null
          let utcSec = null;
          try {
            if (typeof utcStrToSec === "function" && gpsState && typeof gpsState.utcTime === "string") {
              utcSec = utcStrToSec(gpsState.utcTime);
              if (!Number.isFinite(utcSec)) utcSec = null;
            }
          } catch(e){}
          sharpV3_pushFilteredPoint({
            lat: out.latF,
            lon: out.lonF,
            heading: out.courseF,
            speedKmh: out.speedF,
            utcSec: utcSec
          });
        }
      } catch(e){}
      if (fltLastPos){
        fltTotalM += haversineM(fltLastPos.lat, fltLastPos.lon, out.latF, out.lonF);
      }
      fltLastPos = {lat: out.latF, lon: out.lonF};
      fltLastPointReg = {
        lat: out.latF,
        lon: out.lonF,
        courseDeg: out.courseF,
        speedKmh: out.speedF,
        hdop: hdop,
        sats: sats,
        utcTime: gpsState.utcTime
      };

      if(fltVisible) trackBounds.extend(posF);

      viewPos = posF;
      viewCourse = out.courseF;
      viewSpeed = out.speedF;

      updateMapMarkerStyle(true);

      if(fltVisible && !map.hasLayer(fltPolyline)) fltPolyline.addTo(map);
      if(!fltVisible && map.hasLayer(fltPolyline)) map.removeLayer(fltPolyline);
    } else {
      updateMapMarkerStyle(false);
      if(fltVisible && !map.hasLayer(fltPolyline)) fltPolyline.addTo(map);
      if(!fltVisible && map.hasLayer(fltPolyline)) map.removeLayer(fltPolyline);
    }

    marker.setLatLng(viewPos);
    rotateArrowDom(viewCourse);
    marker.setTooltipContent(`${(viewSpeed||0).toFixed(1)} km/h · ${viewCourse.toFixed(0)}°`);

    if(followEnabled){
      const now = Date.now();
      if(trackBounds.isValid() && now - lastFitMs > FIT_THROTTLE_MS){
        lastFitMs = now;
        map.fitBounds(trackBounds, { padding:[20,20], maxZoom:18 });
      } else {
        map.panTo(viewPos, { animate:true });
      }
    }

    updateKmDisplays();
    refreshLegend();
  }

  // ==============================
  // Map buttons / toggles
  // ==============================
  const darkToggleBtn = document.getElementById("darkToggleBtn");
  const clearTrackBtn = document.getElementById("clearTrackBtn");
  const fsToggleBtn = document.getElementById("fsToggleBtn");
const rawToggle = document.getElementById("rawToggle");
  const fltChip = document.getElementById("fltChip");
  const fltMainToggle = document.getElementById("fltMainToggle");
  const fltDebugToggle = document.getElementById("fltDebugToggle");


  function refreshFollowBtn(){
    followToggleBtn.textContent = followEnabled ? "🧲 跟隨/縮放 ON" : "🖐️ 手動瀏覽";
  }
  followToggleBtn.addEventListener("click", ()=>{
    followEnabled = !followEnabled;
    refreshFollowBtn();
    appendLog(`USER: 跟隨/縮放 ${followEnabled ? "ON" : "OFF"}`);
    if(followEnabled && trackBounds && trackBounds.isValid()){
      map.fitBounds(trackBounds, { padding:[20,20], maxZoom:18 });
    }
  });

  if (fsToggleBtn) {
    fsToggleBtn.addEventListener("click", () => {
      const container = document.getElementById("mapWrap");
      if (!container) return;
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          container.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    });
  }

  
  function adjustMapHeightForFullscreen(inFs){
    const mapDiv = document.getElementById("map");
    if (!mapDiv) return;
    if (inFs) {
      const rect = mapDiv.getBoundingClientRect();
      const top = rect.top;
      let h = window.innerHeight - top - 16;
      if (h < 200) h = 200;
      mapDiv.style.height = h + "px";
    } else {
      // 回到 CSS 控制的固定高度（例如 #map{height:520px;}）
      mapDiv.style.height = "";
    }
  }

  document.addEventListener("fullscreenchange", () => {
    const container = document.getElementById("mapWrap");
    const inFs = document.fullscreenElement === container;
    if (fsToggleBtn) {
      fsToggleBtn.textContent = inFs ? "🗗" : "⛶";
      fsToggleBtn.title = inFs ? "離開全螢幕" : "全螢幕";
    }
    adjustMapHeightForFullscreen(inFs);
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }
  });

  window.addEventListener("resize", () => {
    const container = document.getElementById("mapWrap");
    const inFs = document.fullscreenElement === container;
    if (inFs) {
      adjustMapHeightForFullscreen(true);
      if (map) {
        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      }
    }
  });

  darkToggleBtn.addEventListener("click", ()=>{
    if(!map) initMapIfNeeded();

    if(currentTile === "day"){
      map.removeLayer(dayLayer);
      darkLayer.addTo(map);
      currentTile = "dark";
      darkToggleBtn.textContent = "☀️ 日間";
      appendLog("USER: 切換夜間地圖");
    } else {
      map.removeLayer(darkLayer);
      dayLayer.addTo(map);
      currentTile = "day";
      darkToggleBtn.textContent = "🌙 夜間";
      appendLog("USER: 切換日間地圖");
    }
  });

  clearTrackBtn.addEventListener("click", ()=>{
    if(!rawPolyline || !fltPolyline) return;
    rawPolyline.setLatLngs([]);
    fltPolyline.setLatLngs([]);
    trackBounds = L.latLngBounds([]);
    lastFitMs = 0;
    rawTotalM = 0; fltTotalM = 0;
    rawTrack = [];
    fltTrack = [];
    rawLastPos = null; fltLastPos = null;
    emaState.latF = null; emaState.lonF = null;
    stopState.lastPos = null; stopState.stillSec = 0;
    
    // clear parking track
    if (map && parkMarkers.length) {
      parkMarkers.forEach(m => {
        if (map.hasLayer(m)) map.removeLayer(m);
      });
    }
    parkMarkers = [];
    parkEvents = [];
    parkCluster = null;
    parkTimelineSec = 0;
    lastParkUtcSec = null; // v83_test6: reset UTC-based timeline
    parkCount = 0;
    totalParkTimeSec = 0;  // v83_test9: reset total parking time

    // Parking V1.2: 同時重置 P_Locking 狀態
    pLocking = false;
    pLockEventIndex = -1;
    pLockSpeedWindow = [];

    updateParkSummary();
    if (parkPtsEl) parkPtsEl.textContent = 0;

    updateKmDisplays();
    appendLog("USER: 清除軌跡");
  
    // clear 15s track
    t15Track = [];
    t15TotalM = 0;
    last15sSec = null;
    t15AccSec = 0;
    if(t15Polyline) t15Polyline.setLatLngs([]);

    // clear sharp turn markers & state
    if (sharpLayerGroup) {
      sharpLayerGroup.clearLayers();
    }
    if (sharpState && sharpState.window) {
      sharpState.window = [];
    }
    sharpCount = 0;
    sharpCooldownSec = 0;
    sharpLastUtcSec = null;
    // Sharp Turn v3.0: reset events & state (Debug 版)
    try {
      if (typeof sharpV3_resetAll === "function") {
        sharpV3_resetAll();
      }
      if (typeof sharpV3_rebuildDebugLayers === "function") {
        sharpV3_rebuildDebugLayers();
      }
    } catch(e){}
    const sharpPtsEl = document.getElementById("sharpPts");
    if (sharpPtsEl) sharpPtsEl.textContent = 0;


});

  function setRawVisible(v){
    rawVisible = v;
    rawToggle.classList.toggle("off", !rawVisible);
    if(map){
      if(rawVisible) rawPolyline.addTo(map);
      else map.removeLayer(rawPolyline);
    }
    refreshLegend();
  }
  function setFltVisible(v){
    fltVisible = v;
    if (fltChip) fltChip.classList.toggle("off", !fltVisible);
    if(map){
      if(fltVisible) fltPolyline.addTo(map);
      else map.removeLayer(fltPolyline);
    }
    refreshLegend();
  }


  function setT15Visible(v){
    t15Visible = v;
    const chip = document.getElementById("t15Toggle");
    if(chip){
      chip.classList.toggle("off", !t15Visible);
    }
    if(map && t15Polyline){
      if(t15Visible) t15Polyline.addTo(map);
      else map.removeLayer(t15Polyline);
    }
    // 不動 Raw / Filtered 的圖例，只控制 15s 線是否顯示
  }
  function setParkVisible(v){
    parkVisible = v;
    const chip = document.getElementById("parkToggle");
    if (chip) {
      chip.classList.toggle("off", !parkVisible);
    }
    if (map && parkMarkers.length) {
      parkMarkers.forEach(m => {
        if (parkVisible) {
          if (!map.hasLayer(m)) m.addTo(map);
        } else {
          if (map.hasLayer(m)) map.removeLayer(m);
        }
      });
    }
  }
  function setSharpVisible(v){
    sharpVisible = v;
    const chip = document.getElementById("sharpToggle");
    if (chip) {
      chip.classList.toggle("off", !sharpVisible);
    }
    if (map && sharpLayerGroup) {
      if (sharpVisible) {
        if (!map.hasLayer(sharpLayerGroup)) {
          sharpLayerGroup.addTo(map);
        }
      } else {
        if (map.hasLayer(sharpLayerGroup)) {
          map.removeLayer(sharpLayerGroup);
        }
      }
    }
  }







  rawToggle.addEventListener("click", ()=>{
    setRawVisible(!rawVisible);
    appendLog(`USER: Raw 軌跡 ${rawVisible ? "ON" : "OFF"}`);
  });
  if (fltMainToggle) {
    fltMainToggle.addEventListener("click", (ev)=>{
      ev.stopPropagation();
      setFltVisible(!fltVisible);
      appendLog(`USER: Filtered 軌跡 ${fltVisible ? "ON" : "OFF"}`);
    });
  }

  if (fltDebugToggle) {
    fltDebugToggle.addEventListener("click", (ev)=>{
      ev.stopPropagation();
      sharpV3_debugVisible = !sharpV3_debugVisible;
      appendLog(`USER: Sharp v3 debug dots ${sharpV3_debugVisible ? "ON" : "OFF"}`);
      sharpV3_rebuildDebugLayers();
    });
  }

  
  const t15Toggle = document.getElementById("t15Toggle");
  const t15IntervalSelect = document.getElementById("t15IntervalSelect");
  const sharpToggle = document.getElementById("sharpToggle");
  const sharpAngleSel = document.getElementById("sharpAngle");
  const sharpSpeedSel = document.getElementById("sharpSpeed");

  const parkToggle = document.getElementById("parkToggle");
  if (parkToggle) {
    parkToggle.addEventListener("click", ()=>{
      setParkVisible(!parkVisible);
      appendLog(`USER: 停車 軌跡 ${parkVisible ? "ON" : "OFF"}`);
    });
  }

  if (sharpToggle) {
    sharpToggle.addEventListener("click", ()=>{
      setSharpVisible(!sharpVisible);
      appendLog(`USER: 急轉向 S icon ${sharpVisible ? "ON" : "OFF"}`);
    });
  }

  // init dropdown options for sharp angle (5-90 step 5) and speed (5-60 step 5)
  if (sharpAngleSel) {
    sharpAngleSel.innerHTML = "";
    for (let v = 5; v <= 90; v += 5) {
      const opt = document.createElement("option");
      opt.value = String(v);
      opt.textContent = String(v);
      if (v === sharpAngleDeg) opt.selected = true;
      sharpAngleSel.appendChild(opt);
    }
    sharpAngleSel.addEventListener("change", ()=>{
      const v = parseInt(sharpAngleSel.value, 10);
      if (!Number.isNaN(v)) {
        sharpAngleDeg = v;
        appendLog(`USER: 急轉向角度閥值改為 ${sharpAngleDeg}`);
        // V89_test6: 在 ALL 模式下，變更角度閥值時，只重算 Sharp Turn（不影響其他軌跡）
        if (typeof recalcSharpOnlyFromAll === 'function' && pbPoints && pbPoints.length>0 && pbSpeedSelect && pbSpeedSelect.value === "all") {
          recalcSharpOnlyFromAll();
        }
      }
    });
  }

  if (sharpSpeedSel) {
    sharpSpeedSel.innerHTML = "";
    for (let v = 5; v <= 60; v += 5) {
      const opt = document.createElement("option");
      opt.value = String(v);
      opt.textContent = String(v);
      if (v === sharpSpeedKmh) opt.selected = true;
      sharpSpeedSel.appendChild(opt);
    }
    sharpSpeedSel.addEventListener("change", ()=>{
      const v = parseInt(sharpSpeedSel.value, 10);
      if (!Number.isNaN(v)) {
        sharpSpeedKmh = v;
        appendLog(`USER: 急轉向速度閥值改為 ${sharpSpeedKmh}`);
        // V89_test6: 在 ALL 模式下，變更速度閥值時，只重算 Sharp Turn（不影響其他軌跡）
        if (typeof recalcSharpOnlyFromAll === 'function' && pbPoints && pbPoints.length>0 && pbSpeedSelect && pbSpeedSelect.value === "all") {
          recalcSharpOnlyFromAll();
        }
      }
    });
  }


  if (t15IntervalSelect){
    const v0 = parseInt(t15IntervalSelect.value, 10);
    if (!Number.isNaN(v0) && v0 > 0){
      t15IntervalSec = v0;
    }
    ["click","mousedown","touchstart"].forEach(evt=>{
      t15IntervalSelect.addEventListener(evt, (e)=>{ e.stopPropagation(); });
    });
    t15IntervalSelect.addEventListener("change", ()=>{
      const v = parseInt(t15IntervalSelect.value, 10);
      if (!Number.isNaN(v) && v > 0){
        t15IntervalSec = v;
        appendLog(`USER: 15s 軌跡時間改為 ${v} 秒`);
        if (typeof recalcT15OnlyFromAll === "function" && pbPoints && pbPoints.length>0 && typeof pbSpeedSelect !== "undefined" && pbSpeedSelect && pbSpeedSelect.value === "all"){
          recalcT15OnlyFromAll();
        }
      }
    });
  }

  if(t15Toggle){
    t15Toggle.addEventListener("click", ()=>{
      setT15Visible(!t15Visible);
      appendLog(`USER: 15s 軌跡 ${t15Visible ? "ON" : "OFF"}`);
    });
  }

// ==============================
  // Rules modal (Raw / Filtered)
  // ==============================
  const ruleModal = document.getElementById("ruleModal");
  const ruleTitle = document.getElementById("ruleTitle");
  const ruleBody = document.getElementById("ruleBody");
  const rawInfo = document.getElementById("rawInfo");
  const fltInfo = document.getElementById("fltInfo");
  const t15Info = document.getElementById("t15Info");
  const parkInfo = document.getElementById("parkInfo");
  const sharpInfo = document.getElementById("sharpInfo");
  const verInfo = document.getElementById("verInfo");

  function showRuleModal(type){
    if(type==="raw"){
      ruleTitle.textContent="🟥 Raw 原始軌跡 規則";
      ruleBody.innerHTML = `
        <p><b>用途：</b>作為基準對照，觀察 GPS 原始漂移與跳點，以及與其他軌跡的差異。</p>
        <ul>
          <li>以 NMEA（RMC/GGA）每秒一筆資料為基礎。</li>
          <li>僅使用「有效定位」點（RMC=A 且有 Fix）。</li>
          <li>為避免畫面過度密集，對極近距離樣本做輕度抽稀（相鄰距離極小時會略過）。</li>
          <li>不做任何角度或速度平滑處理，盡量保留原始軌跡形態與抖動。</li>
        </ul>
      `;
      
    
    } else if(type==="flt"){
      ruleTitle.textContent="🟦 Filtered v2.5 優化軌跡 規則";
      ruleBody.innerHTML = `
        <p><b>用途：</b>在保留關鍵彎道與整體形狀的前提下，減少漂移與多餘點，得到較接近實際行車路徑的藍線。</p>
        <ul>
          <li><b>進入條件：</b>僅使用「定位有效」且 HDOP ≤ 2.5、速度 ≥ 3 km/h 的點。</li>
          <li><b>彎道視窗（Cond1）：</b>遇到相鄰 heading 變化 ≥ 15° 時，啟動 g1～g4 視窗，計算 g2/g3/g4 相對 g1 的方向差 d12/d13/d14。</li>
          <li><b>彎道成立：</b>當 d12、d13、d14 都 ≥ 15° 且方向一致（同側轉彎）時，在 g3 打一顆 Filtered 點，並重設彎後的角度累積基準，交給急轉向模組作為候選彎。</li>
          <li><b>疑似彎道失敗（v2.5 新增）：</b>若 g1～g4 最終沒有達到彎道條件，不會直接丟棄這一段資料，而是把 g1 及視窗內的點視為「直線樣本」，回饋到 Cond3 的角度累積，避免 heading 資訊被浪費。</li>
          <li><b>彎後冷卻：</b>彎道成立後，若相鄰 |Δheading| 持續 ≥ 10° 視為仍在彎中，暫停 Cond3 累積；直到 |Δheading| &lt; 10° 才解除冷卻並重新開始直線累積。</li>
          <li><b>直線累積（Cond3）：</b>在直線穩定路段累加彎折量，當累積量達到「角度閥值」設定時補打一顆 Filtered 點，並以該點 heading 作為新的基準繼續累積。</li>
          <li><b>過近彎道抑制：</b>若新彎的 g3 與上一個 g3 距離 &lt; 10 公尺，會忽略這次彎道，避免同一個彎道被重複打點。</li>
        </ul>
      `;
    } else if(type==="t15"){
      ruleTitle.textContent="🟧 15s 固定時間取樣軌跡 規則";
      ruleBody.innerHTML = `
        <p><b>用途：</b>以固定時間間隔觀察長時間行駛趨勢。</p>
        <ul>
          <li>同樣只在「定位有效」時才參與計算。</li>
          <li>以 RMC 的 UTC 秒數為主，每當 UTC 秒數累積達 15 秒（或對 15 取餘數為 0）時，在當前位置打一個 15 秒點並連線。</li>
          <li>跨午夜時自動處理 23:59:59 → 00:00:00 的跳變，避免時間倒退造成中斷。</li>
          <li>當 NMEA 資料不連續時，會以實際時間差 dt 補正，避免 15 秒軌跡完全消失。</li>
          <li>15s 里程以相鄰 15 秒點的距離累加，適合看長距離的整體走向。</li>
        </ul>
      `;
      
    } else if(type==="sharp"){
      ruleTitle.textContent="🔴 急轉向 Sharp Turn v3.0 規則";
      ruleBody.innerHTML = `
        <p><b>用途：</b>偵測「急轉向」行為，作為 UBI／駕駛習慣評估指標之一。</p>
        <ul>
          <li><b>候選來源：</b>由 Filtered 的彎道視窗產生候選點（candidate），每一筆候選的位置固定在 g3。</li>
          <li><b>角度條件：</b>每個候選都帶有 angleSum（|d12|+|d13|+|d14|）與 maxDeltaDeg，系統以 angleSum 搭配「角度」閥值判斷是否足夠急。</li>
          <li><b>速度條件：</b>優先使用 g3 的速度作為判斷依據，不足時才退回平均速度，並與「速度」閥值比對。</li>
          <li><b>冷卻機制：</b>每次產生一個 S 事件後，會依「冷卻秒數」設定，在指定秒數內忽略新的候選，避免同一個彎道被重複計數。</li>
          <li><b>動態重算：</b>調整角度／速度閥值時，不需重跑 Filtered，只會對既有候選重新判斷哪些要畫成 S icon。</li>
          <li><b>統計顯示：</b>右上「急轉向 (N 點)」中的 N 為目前條件下有效的 S 事件數量。</li>
        </ul>
      `;
      
    } else if(type==="park"){
      ruleTitle.textContent="🅿 停車偵測規則";
      ruleBody.innerHTML = `
        <p><b>用途：</b>標示車輛在同一地點附近停留超過一定時間的停車點（P icon），並計算完整停車時長。</p>
        <ul>
          <li><b>停車偵測期：</b>當速度 ≤ 3 km/h 時建立錨點（Anchor），之後位置在 Anchor ±10 公尺內視為同一停車群組，累積停留時間 ≥ 20 秒即成立停車事件，在 Anchor 位置打 P icon。</li>
          <li><b>P_Locking 停車鎖定：</b>停車事件成立後進入 P_Locking 模式，在解除前的所有時間都會累加到該次停車時長，且不會再產生第二個 P。</li>
          <li><b>停車時間定義：</b>停車時間 = 從 Anchor 建立開始，到 P_Locking 解除為止的全部時間（包含偵測期 + P_Locking 期間）。</li>
          <li><b>離開條件：</b>當 HDOP < 2.5，且連續三筆速度 > 5 km/h 時，判定車輛離開停車位置並解除 P_Locking，停止累積停車時間。</li>
          <li><b>漂移處理：</b>在 P_Locking 期間若 GPS 漂移但未達離開條件，不會建立新的 Anchor 或新增 P，只會持續累計同一次停車事件。</li>
        </ul>
      `;
    
    ruleModal.style.display="flex";}
    ruleModal.style.display="flex";
  }

  if(rawInfo){
    rawInfo.addEventListener("click", e=>{
      e.stopPropagation();
      showRuleModal("raw");
    });
  }
  if(fltInfo){
    fltInfo.addEventListener("click", e=>{
      e.stopPropagation();
      showRuleModal("flt");
    });
  }
  if(t15Info){
    t15Info.addEventListener("click", e=>{
      e.stopPropagation();
      showRuleModal("t15");
    });
  }
  if(parkInfo){
    parkInfo.addEventListener("click", e=>{
      e.stopPropagation();
      showRuleModal("park");
    });
  }
  if(sharpInfo){
    sharpInfo.addEventListener("click", e=>{
      e.stopPropagation();
      showRuleModal("sharp");
    });
  }
  document.getElementById("ruleClose").addEventListener("click", ()=>{
    ruleModal.style.display="none";
  });
  ruleModal.addEventListener("click", e=>{
    if(e.target===ruleModal) ruleModal.style.display="none";
  });

  // ==============================// ==============================
  // Playback: load GPS log (TXT/CSV) + play/replay
  // ==============================
  let pbPoints = [];
  let pbIndex = 0;
  let pbTimer = null;
  let pbPlaying = false;

  // TXT 解析後的統計（NMEA 行數與 UTC 秒數）
  let lastTxtSeconds = 0;
  let lastTxtLines = 0;

  const gpsLogInput = document.getElementById("gpsLogInput");
  const loadGpsLogBtn = document.getElementById("loadGpsLogBtn");
  const pbFileName = document.getElementById("pbFileName");
  const pbTotalRecordsEl = document.getElementById("pbTotalRecords");
  const pbTotalSecondsEl = document.getElementById("pbTotalSeconds");
  const pbProgress = document.getElementById("pbProgress");
  const allStatus = document.getElementById("allStatus");

  const pbToStartBtn = document.getElementById("pbToStartBtn");
  const pbPlayBtn = document.getElementById("pbPlayBtn");
  const pbPauseBtn = document.getElementById("pbPauseBtn");
  const pbReplayBtn = document.getElementById("pbReplayBtn");
  const pbSpeedSelect = document.getElementById("pbSpeedSelect");

  const turnAccThInput = document.getElementById("turnAccTh");
  if(turnAccThInput){
    // V88_test4: dropdown preset values for Filtered threshold
    turnAccTh = parseFloat(turnAccThInput.value) || 100;
    turnAccThInput.addEventListener("change", ()=>{
      turnAccTh = parseFloat(turnAccThInput.value) || 100;
      // V88_test4: when threshold dropdown changes in ALL mode with loaded log, recompute Filtered only
      if(typeof recalcFilteredOnlyFromAll === 'function' && pbPoints && pbPoints.length>0 && pbSpeedSelect && pbSpeedSelect.value === "all"){
        recalcFilteredOnlyFromAll();
      }
    });
    // prevent Filtered chip toggle when interacting with threshold dropdown
    ["click","mousedown"].forEach(evt=>{
      turnAccThInput.addEventListener(evt, e=>{ e.stopPropagation(); });
    });
  }  loadGpsLogBtn.addEventListener("click", ()=>gpsLogInput.click());
  gpsLogInput.addEventListener("change", async (e)=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    await loadGpsLogFile(file);
  });

  async function loadGpsLogFile(file){
    const text = await file.text();
    pbPoints = [];
    pbIndex = 0;
    stopPlayback();

    let totalRecords = 0;
    let totalSeconds = 0;

    // detect csv or txt
    if(file.name.toLowerCase().endsWith(".csv")){
      pbPoints = parseCsvLog(text);
      totalRecords = pbPoints.length;

      if(pbPoints.length > 0){
        const uniqueSecs = new Set(pbPoints.map(p => Math.floor(p.ts)));
        totalSeconds = uniqueSecs.size;
      } else {
        totalSeconds = 0;
      }
    } else {
      pbPoints = parseTxtLog(text);
      totalRecords = lastTxtLines || pbPoints.length;
      totalSeconds = lastTxtSeconds || pbPoints.length;
    }

    pbFileName.textContent = file.name;
    if(pbTotalRecordsEl) pbTotalRecordsEl.textContent = totalRecords;
    if(pbTotalSecondsEl) pbTotalSecondsEl.textContent = totalSeconds;

    pbProgress.textContent = `0/${pbPoints.length}`;
    appendLog(`GPS Log 載入完成：${file.name}, points=${pbPoints.length}, seconds=${totalSeconds}`);

    // Clear tracks for fresh playback
    clearAllTracksForPlayback();
    updateModeLock();
  }

  function parseCsvLog(text){
    const lines = text.split(/\r?\n/).filter(l=>l.trim().length>0);
    if(lines.length<2) return [];
    const header = lines[0].split(",").map(s=>s.trim().toLowerCase());
    const idx = (k)=>header.indexOf(k);

    const iTs=idx("ts");
    const iLat=idx("lat");
    const iLon=idx("lon");
    const iSpd=idx("speed_kmh");
    const iCourse=idx("course");
    const iAlt=idx("alt");
    const iFixq=idx("fixq");
    const iSats=idx("sats");
    const iHdop=idx("hdop");
    const iStatus=idx("statusa");

    const pts=[];
    for(let li=1; li<lines.length; li++){
      const c = lines[li].split(",").map(s=>s.trim());
      const lat=parseFloat(c[iLat]);
      const lon=parseFloat(c[iLon]);
      if(!isFinite(lat)||!isFinite(lon)) continue;
      const tsRaw = iTs>=0 ? parseFloat(c[iTs]) : li;
      const ts = (tsRaw>1e12) ? tsRaw/1000 : tsRaw; // accept ms or sec
      pts.push({
        ts,
        lat, lon,
        speedKmh: iSpd>=0?parseFloat(c[iSpd]):0,
        course: iCourse>=0?parseFloat(c[iCourse]):0,
        alt: iAlt>=0?parseFloat(c[iAlt]):null,
        fixQ: iFixq>=0?parseInt(c[iFixq],10):1,
        sats: iSats>=0?parseInt(c[iSats],10):null,
        hdop: iHdop>=0?parseFloat(c[iHdop]):null,
        statusA: iStatus>=0?(c[iStatus]==="1"||c[iStatus].toLowerCase()==="true"):true
      });
    }
    pts.sort((a,b)=>a.ts-b.ts);
    return pts;
  }

  // TXT log: extract NMEA lines from your debug log and stitch RMC/GGA
  function parseTxtLog(text){
    const lines = text.split(/\r?\n/);
    const nmeaLines = [];
    for(const l of lines){
      const m = l.match(/(\$G[NP][A-Z]{3}.*)$/);
      if(m) nmeaLines.push(m[1].trim());
    }
    if(nmeaLines.length===0) return [];

    // 紀錄 TXT 來源 NMEA 行數
    lastTxtLines = nmeaLines.length;

    // stitch into points by sequential time as appearance index
    let tempState = {
      lat:null, lon:null, speedKmh:0, course:0, alt:null, sats:null, hdop:null, fixQ:0, statusA:false, utcTime:null,
      srcType:null
    };
    const pts=[];
    let seqTs=0;

    // 追蹤 UTC 秒數（同一秒多筆 NMEA 只算一次）
    const utcSet = new Set();

    for(const nmea of nmeaLines){
      const payload = nmea.startsWith("$") ? nmea.slice(1).split("*")[0] : nmea;
      const f = payload.split(",");
      const type = f[0].slice(-3).toUpperCase();

      if(type==="RMC"){
        tempState.utcTime = f[1] ? (f[1].slice(0,2)+":"+f[1].slice(2,4)+":"+f[1].slice(4,6)) : tempState.utcTime;
        if(f[1] && f[1].length >= 6){
          utcSet.add(f[1].slice(0,6));
        }
        tempState.statusA = (f[2]==="A");
        const lat=nmeaToDecimal(f[3],f[4]);
        const lon=nmeaToDecimal(f[5],f[6]);
        if(lat!=null) tempState.lat=lat;
        if(lon!=null) tempState.lon=lon;
        const knots=parseFloat(f[7]);
        if(!Number.isNaN(knots)) tempState.speedKmh=knots*1.852;
        const course=parseFloat(f[8]);
        if(!Number.isNaN(course)) tempState.course=course;
        tempState.srcType = "RMC";
      }
      if(type==="GGA"){
        if(f[1] && f[1].length >= 6){
          utcSet.add(f[1].slice(0,6));
        }
        const lat=nmeaToDecimal(f[2],f[3]);
        const lon=nmeaToDecimal(f[4],f[5]);
        if(lat!=null) tempState.lat=lat;
        if(lon!=null) tempState.lon=lon;
        const fixQ=parseInt(f[6],10);
        if(!Number.isNaN(fixQ)) tempState.fixQ=fixQ;
        const sats=parseInt(f[7],10);
        if(!Number.isNaN(sats)) tempState.sats=sats;
        const hdop=parseFloat(f[8]);
        if(!Number.isNaN(hdop)) tempState.hdop=hdop;
        const alt=parseFloat(f[9]);
        if(!Number.isNaN(alt)) tempState.alt=alt;
        tempState.srcType = "GGA";
      }
      if(type==="VTG"){
        const kmh=parseFloat(f[7]);
        if(!Number.isNaN(kmh)) tempState.speedKmh=kmh;
        tempState.srcType = "VTG";
      }

      if(tempState.lat!=null && tempState.lon!=null){
        const ptsItem = {
          ts: seqTs++,
          lat: tempState.lat,
          lon: tempState.lon,
          speedKmh: tempState.speedKmh||0,
          course: tempState.course||0,
          alt: tempState.alt,
          fixQ: tempState.fixQ||0,
          sats: tempState.sats,
          hdop: tempState.hdop,
          statusA: tempState.statusA,
          utcTime: tempState.utcTime || null,
          srcType: tempState.srcType || null
        };
        pts.push(ptsItem);
      }
    }

    // 記錄此 TXT 檔案的「總秒數」（依 UTC 秒數計算）
    lastTxtSeconds = utcSet.size;

    return pts;
  }

  

  function clearAllTracksForPlayback(){
    // reset Sharp Turn (v2.3 + v3.0)
    if (typeof clearSharpOnly === "function") {
      clearSharpOnly();
    }
    if (typeof sharpV3_resetAll === "function") {
      sharpV3_resetAll();
    }
    t15Track = [];
    t15TotalM = 0;
    last15sSec = null;
    t15AccSec = 0;
    t15AccSec = 0;
    t15AccSec = 0;
    if(t15Polyline) t15Polyline.setLatLngs([]);

    rawTrack = [];
    fltTrack = [];

    if(rawPolyline) rawPolyline.setLatLngs([]);
    if(fltPolyline) fltPolyline.setLatLngs([]);
    trackBounds = L.latLngBounds([]);
    lastFitMs = 0;
    rawTotalM = 0; fltTotalM = 0;
    rawTrack = [];
    fltTrack = [];
    rawLastPos = null; fltLastPos = null;
    rawLastUtcSec = null;
    emaState.latF = null; emaState.lonF = null;
    stopState.lastPos = null; stopState.stillSec = 0;
    
    // clear parking track
    if (map && parkMarkers.length) {
      parkMarkers.forEach(m => {
        if (map.hasLayer(m)) map.removeLayer(m);
      });
    }
    parkMarkers = [];
    parkEvents = [];
    parkCluster = null;
    parkTimelineSec = 0;
    lastParkUtcSec = null; // v83_test6: reset UTC-based timeline
    parkCount = 0;
    totalParkTimeSec = 0;  // v83_test9: reset total parking time
    updateParkSummary();
    if (parkPtsEl) parkPtsEl.textContent = 0;

    updateKmDisplays();
  }

  function stopPlayback(){
    if(pbTimer) clearTimeout(pbTimer);
    pbTimer=null;
    pbPlaying=false;
    pbPlayBtn.disabled=false;
    pbPauseBtn.disabled=true;
    updateModeLock();
  }

  pbToStartBtn.addEventListener("click", ()=>{
    pbIndex=0;
    pbProgress.textContent = `${pbIndex}/${pbPoints.length}`;
    appendLog("Playback: 回到起點");
  });

  pbPlayBtn.addEventListener("click", ()=>{
    if(pbPoints.length===0) return;
    const sp = pbSpeedSelect.value;
    if(sp==="all"){
      clearAllTracksForPlayback();
      pbIndex = 0;
      if (typeof pbProgress !== "undefined") {
        pbProgress.textContent = `0/${pbPoints.length}`;
      }

      // V96_test11_fixed: link 15s/30s dropdown to Filtered threshold when ALL playback starts
      try {
        if (typeof t15IntervalSelect !== "undefined" &&
            t15IntervalSelect &&
            typeof turnAccThInput !== "undefined" &&
            turnAccThInput) {
          const iv = parseInt(t15IntervalSelect.value, 10);
          if (!Number.isNaN(iv)) {
            let targetTh = turnAccTh;
            if (iv === 15) {
              targetTh = 100;
            } else if (iv === 30) {
              targetTh = 200;
            }
            turnAccTh = targetTh;
            try {
              turnAccThInput.value = String(targetTh);
            } catch(e){}
          }
        }
      } catch(e){}
      playAllAtOnce();
    } else {
      startPlayback(parseFloat(sp));
    }
  });

  pbPauseBtn.addEventListener("click", ()=>{
    stopPlayback();
    appendLog("Playback: 暫停");
  });

  pbReplayBtn.addEventListener("click", ()=>{
    clearAllTracksForPlayback();
    pbIndex=0;
    pbProgress.textContent = `0/${pbPoints.length}`;
    appendLog("Playback: Replay");
    const sp = pbSpeedSelect.value;
    if(sp==="all") playAllAtOnce();
    else startPlayback(parseFloat(sp));
  });

  function applyPointToSystem(pt){
    gpsState.lat = pt.lat;
    gpsState.lon = pt.lon;
    gpsState.speedKmh = pt.speedKmh||0;
    gpsState.course = pt.course||0;
    gpsState.alt = pt.alt;
    gpsState.fixQ = pt.fixQ||0;
    gpsState.sats = pt.sats;
    gpsState.hdop = pt.hdop;
    gpsState.statusA = (pt.statusA!==false);
    gpsState.utcTime = pt.utcTime || gpsState.utcTime;
    gpsState.srcType = pt.srcType || gpsState.srcType || null;

    updateGpsBarUI();
  }

  
  function startPlayback(speedMul){
    stopPlayback();
    pbPlaying = true;
    pbPlayBtn.disabled = true;
    pbPauseBtn.disabled = false;
    updateModeLock();
    appendLog(`Playback: 開始 (${speedMul}x)`);

    const step = ()=>{
      if(!pbPlaying) return;
      if(pbIndex >= pbPoints.length){
        // V88_test5: hide speed/heading tooltip when log playback finishes
        if (typeof marker !== "undefined" && marker) {
          try {
            if (marker.closeTooltip) marker.closeTooltip();
            else if (marker.setTooltipContent) marker.setTooltipContent("");
          } catch(e){}
        }

        // V89_test3: 播放結束後自動縮放＋置中整段軌跡（僅使用現有 trackBounds，不重算任何軌跡）
        if (trackBounds && trackBounds.isValid && trackBounds.isValid()) {
          try {
            map.fitBounds(trackBounds, { padding:[20,20], maxZoom:18 });
          } catch(e){}
        }

        stopPlayback();
        appendLog("Playback: 播放完畢");
        return;
      }
      const pt = pbPoints[pbIndex];
      applyPointToSystem(pt);
      pbIndex++;
      pbProgress.textContent = `${pbIndex}/${pbPoints.length}`;

      // 依照 log ts 計算下一筆 dt（秒）
      let dt = 0.2;
      if(pbIndex < pbPoints.length){
        const t0 = pbPoints[pbIndex-1].ts;
        const t1 = pbPoints[pbIndex].ts;
        const rawDt = (t1 - t0);
        if(isFinite(rawDt) && rawDt > 0){
          dt = rawDt / speedMul;
          dt = Math.min(Math.max(dt, 0.02), 2.0);
        }
      }
      pbTimer = setTimeout(step, dt * 1000);
    };

    step();
  }

  // ==============================
  // ALL MODE: 一次套用所有軌跡
  // ==============================
  

  // ==============================
  // V88_test3: Recalculate Filtered only (ALL mode, threshold change)
  // ==============================
  function clearFilteredTrackOnly(){
    // reset Filtered track & related state, do NOT touch raw/15s/parking/sharp
    fltTrack = [];
    fltTotalM = 0;
    fltLastPos = null;
    fltLastPointReg = null;
    prevRawPosForHeading = null;
    prevCourseForHeading = null;
    if (turnState){
      turnState.inTurn = false;
      turnState.turnStartCourse = null;
      turnState.lockedPos = null;
      turnState.stableCount = 0;
      turnState.window = [];
      turnState.turnSign = 0;
    }
    if (fltPolyline){
      fltPolyline.setLatLngs([]);
    }
    updateKmDisplays();
  }


function clearT15TrackOnly(){
  t15Track = [];
  t15TotalM = 0;
  last15sSec = null;
  t15AccSec = 0;
  if (t15Polyline){
    t15Polyline.setLatLngs([]);
  }
  updateKmDisplays();
}

function clearSharpOnly(){
  // reset Sharp Turn S-events & overlay, do NOT touch raw/15s/parking/filtered or v3 candidates
  sharpCount = 0;
  sharpCooldownSec = 0;
  sharpLastUtcSec = null;
  if (sharpLayerGroup){
    sharpLayerGroup.clearLayers();
  }
  if (sharpState && sharpState.window){
    sharpState.window = [];
  }
  if (typeof sharpV3_sharpEvents !== "undefined" && sharpV3_sharpEvents) {
    sharpV3_sharpEvents = [];
  }
  const sharpPtsEl = document.getElementById("sharpPts");
  if (sharpPtsEl) sharpPtsEl.textContent = "0";
}


function recalcSharpOnlyFromAll(){
  const overlay = document.getElementById("allOverlay");
  const allCountDoneEl = document.getElementById("allCountDone");
  const allCountTotalEl = document.getElementById("allCountTotal");
  const allPercentEl = document.getElementById("allPercent");
  const allTitleEl = document.getElementById("allOverlayTitle");

  // Debug 版：若尚未有任何 v3.0 候選彎道，則直接清除並關閉 overlay
  if (typeof sharpV3_turnCandidates === "undefined" || !sharpV3_turnCandidates || sharpV3_turnCandidates.length === 0) {
    clearSharpOnly();
    if (overlay){
      overlay.style.display = "none";
    }
    return;
  }

  if(overlay && allCountDoneEl && allCountTotalEl && allPercentEl){
    allCountDoneEl.textContent = "0";
    allCountTotalEl.textContent = sharpV3_turnCandidates.length.toString();
    allPercentEl.textContent = "0";
    if(allTitleEl){
      allTitleEl.textContent = "⏳ Sharp Turn 重算中（ALL 模式，v3 Debug）";
    }
    overlay.style.display = "block";
  }

  // 先清除舊的 S icon（v2.3 + v3.0），但保留 fltTrack / candidates
  clearSharpOnly();

  // v3.0：只針對已存在的 TurnCandidate[] 重新評估急轉嚴重度
  try {
    if (typeof sharpV3_recomputeSharpEvents === "function") {
      sharpV3_recomputeSharpEvents(sharpAngleDeg, sharpSpeedKmh, sharpCooldownSec);
    }
  } catch(e){}

  // 依照 v3.0 的事件重建 S icon 圖層
  if (typeof rebuildSharpMarkersFromV3 === "function") {
    rebuildSharpMarkersFromV3();
  }

  // 更新 S 點數量顯示
  const sharpPtsEl = document.getElementById("sharpPts");
  if (sharpPtsEl && typeof sharpV3_sharpEvents !== "undefined" && sharpV3_sharpEvents) {
    sharpPtsEl.textContent = sharpV3_sharpEvents.length.toString();
  }

  if(overlay && allCountDoneEl && allCountTotalEl && allPercentEl){
    const total = sharpV3_turnCandidates.length;
    allCountDoneEl.textContent = total.toString();
    allCountTotalEl.textContent = total.toString();
    allPercentEl.textContent = total > 0 ? "100" : "0";
  }

  if(overlay){
    if(allTitleEl){
      allTitleEl.textContent = "✅ Sharp Turn 重算完成（ALL 模式，v3 Debug）";
    }
    overlay.style.display = "none";
  }

  // Debug 計數更新
  if (typeof sharpV3_updateDebugCounts === "function") {
    sharpV3_updateDebugCounts();
  }
}
function recalcT15OnlyFromAll(){
  if(!pbPoints || pbPoints.length === 0) return;

  const overlay = document.getElementById("allOverlay");
  const allCountDoneEl = document.getElementById("allCountDone");
  const allCountTotalEl = document.getElementById("allCountTotal");
  const allPercentEl = document.getElementById("allPercent");
  const allTitleEl = document.getElementById("allOverlayTitle");

  if(overlay && allCountDoneEl && allCountTotalEl && allPercentEl){
    allCountDoneEl.textContent = "0";
    allCountTotalEl.textContent = pbPoints.length.toString();
    allPercentEl.textContent = "0%";
    if (allTitleEl){
      allTitleEl.textContent = "⏳ 15s 軌跡重算中（ALL 模式）";
    }
    overlay.style.display = "flex";
  }

  clearT15TrackOnly();

  setTimeout(()=>{
    let lastSec = null;
    let accSec = 0;

    for(let i=0; i<pbPoints.length; i++){
      const pt = pbPoints[i];
      const lat = pt.lat;
      const lon = pt.lon;

      let sec = null;
      try {
        if (typeof utcStrToSec === "function" && pt && typeof pt.utcTime === "string") {
          sec = utcStrToSec(pt.utcTime);
        }
      } catch(e){
        sec = null;
      }
      if (!Number.isFinite(sec) && typeof pt.ts === "number"){
        sec = pt.ts;
      }

      if (sec != null && !Number.isNaN(sec)){
        if (lastSec != null){
          let delta = sec - lastSec;
          if (delta < -43200) delta += 86400;
          if (delta < 0) delta = 0;
          accSec += delta;
        }
        lastSec = sec;
      }

      if (accSec >= t15IntervalSec && Number.isFinite(lat) && Number.isFinite(lon)){
        const pos15 = { lat, lon };
        if (t15Track.length > 0){
          const prev15 = t15Track[t15Track.length - 1];
          t15TotalM += haversineM(prev15.lat, prev15.lon, pos15.lat, pos15.lon);
        }
        t15Track.push(pos15);
        if (t15Polyline){
          t15Polyline.addLatLng(L.latLng(pos15.lat, pos15.lon));
        }
        accSec = accSec % t15IntervalSec;
      }

      if (overlay && allCountDoneEl && allCountTotalEl && allPercentEl && (i % 200 === 0 || i === pbPoints.length - 1)){
        const done = i + 1;
        allCountDoneEl.textContent = String(done);
        allCountTotalEl.textContent = String(pbPoints.length);
        const percent = Math.floor(done * 100 / pbPoints.length);
        allPercentEl.textContent = percent + "%";
      }
    }

    last15sSec = lastSec;
    t15AccSec = accSec;

    updateKmDisplays();

    if (overlay){
      overlay.style.display = "none";
    }
  }, 0);
}

function recalcFilteredOnlyFromAll(){
  if (typeof sharpV3_resetAll === "function") {
    sharpV3_resetAll();
  }
  if (typeof clearSharpOnly === "function") {
    clearSharpOnly();
  }
    if(!pbPoints || pbPoints.length === 0) return;

    const overlay = document.getElementById("allOverlay");
    const allCountDoneEl = document.getElementById("allCountDone");
    const allCountTotalEl = document.getElementById("allCountTotal");
    const allPercentEl = document.getElementById("allPercent");
    const allTitleEl = document.getElementById("allOverlayTitle");

    if(overlay && allCountDoneEl && allCountTotalEl && allPercentEl){
      allCountDoneEl.textContent = "0";
      allCountTotalEl.textContent = pbPoints.length.toString();
      allPercentEl.textContent = "0";
      if(allTitleEl){
        allTitleEl.textContent = "⏳ Filtered 重算中（ALL 模式）";
      }
      overlay.style.display = "flex";
    }

    clearFilteredTrackOnly();

    // use setTimeout to allow overlay to render before heavy loop
    setTimeout(()=>{
      for(let i=0; i<pbPoints.length; i++){
        const pt = pbPoints[i];
        const lat = pt.lat;
        const lon = pt.lon;
        const speedKmh = pt.speedKmh || 0;
        const courseDeg = pt.course || 0;
        const sats = pt.sats;
        const hdop = pt.hdop;
        const srcType = pt.srcType || null;
        const isRmcSrc = (srcType === "RMC");

        const out = isRmcSrc ? filterPipeline(lat, lon, speedKmh, courseDeg, sats, hdop, 0) : {accept:false};

        if(out.accept){
          const posF = L.latLng(out.latF, out.lonF);
          fltPolyline.addLatLng(posF);
                    fltTrack.push(posF);
          try {
            if (typeof sharpV3_pushFilteredPoint === "function") {
              let utcSec = null;
              try {
                if (typeof utcStrToSec === "function" && pt && typeof pt.utcTime === "string") {
                  utcSec = utcStrToSec(pt.utcTime);
                  if (!Number.isFinite(utcSec)) utcSec = null;
                }
              } catch(e){}
              sharpV3_pushFilteredPoint({
                lat: out.latF,
                lon: out.lonF,
                heading: out.courseF,
                speedKmh: out.speedF,
                utcSec: utcSec
              });
            }
          } catch(e){}
          if(fltLastPos){
            fltTotalM += haversineM(fltLastPos.lat, fltLastPos.lon, out.latF, out.lonF);
          }
          fltLastPos = {lat: out.latF, lon: out.lonF};
          fltLastPointReg = {
            lat: out.latF,
            lon: out.lonF,
            courseDeg: out.courseF,
            speedKmh: out.speedF,
            hdop: hdop,
            sats: sats,
            utcTime: pt.utcTime
          };
          if(fltVisible && map && !map.hasLayer(fltPolyline)) fltPolyline.addTo(map);
        }

        if(allCountDoneEl && allPercentEl && allCountTotalEl){
          const done = i + 1;
          const total = pbPoints.length;
          allCountDoneEl.textContent = done.toString();
          const pct = total > 0 ? Math.floor(done * 100 / total) : 0;
          allPercentEl.textContent = pct.toString();
        }
      }

      updateKmDisplays();

      if(overlay){
        if(allTitleEl){
          allTitleEl.textContent = "✅ Filtered 重算完成（ALL 模式）";
        }
        // V89_test5: 完成後立即關閉 overlay（不再延遲）
        overlay.style.display = "none";

        // V90_v3fix: ALL 模式完成後，自動依目前設定重算 Sharp Turn v3.0 並重建 S icon
        if (typeof sharpV3_recomputeSharpEvents === "function") {
          try {
            sharpV3_recomputeSharpEvents(sharpAngleDeg, sharpSpeedKmh, sharpCooldownSec);
          } catch(e){}
        }
        if (typeof rebuildSharpMarkersFromV3 === "function") {
          try {
            rebuildSharpMarkersFromV3();
          } catch(e){}
        }

        if (typeof recalcT15OnlyFromAll === "function") {
          try {
            recalcT15OnlyFromAll();
          } catch(e){}
        }
        t15RealtimeEnabled = true;

        var sharpPtsEl = document.getElementById("sharpPts");
        if (sharpPtsEl && typeof sharpV3_sharpEvents !== "undefined" && sharpV3_sharpEvents) {
          sharpPtsEl.textContent = sharpV3_sharpEvents.length.toString();
        }
      }
    }, 0);
  }

function playAllAtOnce(){
    try {
      if (typeof t15IntervalSelect !== "undefined") {
        const v = parseInt(t15IntervalSelect.value);
        if (!isNaN(v)) {
          t15IntervalSec = v;
        }
      }
    } catch(e){}
    t15RealtimeEnabled = false;
    t15Track = [];
    t15TotalM = 0;
    t15AccSec = 0;
    last15sSec = null;
    if (t15Polyline) {
      try {
        t15Polyline.setLatLngs([]);
      } catch(e){}
    }


    stopPlayback();
    appendLog("Playback: All 一次載入");
    if(pbPoints.length === 0) return;

    if(allStatus){
      allStatus.textContent = "ALL 模式：正在套用完整軌跡…";
    }

    const overlay = document.getElementById("allOverlay");
    const allCountDoneEl = document.getElementById("allCountDone");
    const allCountTotalEl = document.getElementById("allCountTotal");
    const allPercentEl = document.getElementById("allPercent");
    const allTitleEl = document.getElementById("allOverlayTitle");

    if(overlay && allCountDoneEl && allCountTotalEl && allPercentEl){
      allCountDoneEl.textContent = "0";
      allCountTotalEl.textContent = pbPoints.length.toString();
      allPercentEl.textContent = "0";
      if(allTitleEl){
        allTitleEl.textContent = "⏳ ALL 模式繪製中";
      }
      overlay.style.display = "flex";
    }

    // 使用 setTimeout 讓瀏覽器先渲染遮罩，再進行大量計算
    setTimeout(()=>{
      for(pbIndex = 0; pbIndex < pbPoints.length; pbIndex++){
        applyPointToSystem(pbPoints[pbIndex]);
        pbProgress.textContent = `${pbIndex+1}/${pbPoints.length}`;

        if(allCountDoneEl && allPercentEl && allCountTotalEl){
          const done = pbIndex + 1;
          const total = pbPoints.length;
          allCountDoneEl.textContent = done.toString();
          const pct = total > 0 ? Math.floor(done * 100 / total) : 0;
          allPercentEl.textContent = pct.toString();
        }
      }

      pbIndex = pbPoints.length;
      // V88_test5: hide speed/heading tooltip when ALL mode finishes applying full track
      if (typeof marker !== "undefined" && marker) {
        try {
          if (marker.closeTooltip) marker.closeTooltip();
          else if (marker.setTooltipContent) marker.setTooltipContent("");
        } catch(e){}
      }

      // V89_test3: ALL 模式套用完整軌跡後，自動縮放＋置中整段路徑（不重算任何軌跡）
      if (trackBounds && trackBounds.isValid && trackBounds.isValid()) {
        try {
          map.fitBounds(trackBounds, { padding:[20,20], maxZoom:18 });
        } catch(e){}
      }

      appendLog("Playback: All 完成（可 Replay）");

      // V89_test5: ALL 播放結束後，自動關閉「停車」與「急轉向」chip（預設畫面先不顯示 P/S）
      try {
        if (typeof setParkVisible === "function") {
          setParkVisible(false);
        }
        if (typeof setSharpVisible === "function") {
          setSharpVisible(false);
        }
      } catch(e){}

      if(allStatus){
        allStatus.textContent = "ALL 模式：軌跡套用完成。";
        setTimeout(()=>{ allStatus.textContent = ""; }, 3000);
      }

      if(overlay){
        if(allTitleEl){
          allTitleEl.textContent = "✅ ALL 模式：軌跡套用完成";
        }
        // V89_test5: 完成後立即關閉 overlay（不再延遲）
        overlay.style.display = "none";

        // V90_v3fix: ALL 模式完成後，自動依目前設定重算 Sharp Turn v3.0 並重建 S icon
        if (typeof sharpV3_recomputeSharpEvents === "function") {
          try {
            sharpV3_recomputeSharpEvents(sharpAngleDeg, sharpSpeedKmh, sharpCooldownSec);
          } catch(e){}
        }
        if (typeof rebuildSharpMarkersFromV3 === "function") {
          try {
            rebuildSharpMarkersFromV3();
          } catch(e){}
        }

        if (typeof recalcT15OnlyFromAll === "function") {
          try {
            recalcT15OnlyFromAll();
          } catch(e){}
        }
        t15RealtimeEnabled = true;

        var sharpPtsEl = document.getElementById("sharpPts");
        if (sharpPtsEl && typeof sharpV3_sharpEvents !== "undefined" && sharpV3_sharpEvents) {
          sharpPtsEl.textContent = sharpV3_sharpEvents.length.toString();
        }
      }
    }, 0);
  }

const logSizeSelect=document.getElementById("logSize");
  
  logSizeSelect.addEventListener("change", applyLogSize);
  applyLogSize();

  // ==============================
  // Export log
  // ==============================
  const exportFormatSelect=document.getElementById("exportFormat");
  document.getElementById("exportBtn").addEventListener("click", ()=>{
    const format=exportFormatSelect.value;
    const lines=logEl.textContent.split("\n").filter(s=>s.trim().length>0);
    let out="";
    if(format==="txt"){
      out=logEl.textContent;
    }else{
      out="Time,Type,Data\n";
      for(const line of lines){
        const m=line.match(/^\[(.*?)\]\s(\w+):\s(.*)$/);
        if(!m) continue;
        out+=`${m[1]},${m[2]},${m[3]}\n`;
      }
    }
    const blob=new Blob([out],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`j1939-log.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("clearLogBtn").addEventListener("click", ()=>{
    logEl.textContent="";
  });

  // Format modal
  const formatModal=document.getElementById("formatModal");
  document.getElementById("formatInfoBtn").addEventListener("click", ()=>{
    formatModal.style.display="flex";
  });
  document.getElementById("formatClose").addEventListener("click", ()=>{
    formatModal.style.display="none";
  });
  formatModal.addEventListener("click", e=>{
    if(e.target===formatModal) formatModal.style.display="none";
  });

  // ==============================
  // Init
  // ==============================
  applyModeUI(currentMode);
  updateModeLock();
  updateUartLock();
  refreshFollowBtn();
  updateKmDisplays();

// ===============================
// Sharp Turn v3.0 core (Debug 版)
// ===============================
let sharpV3_fltInfoTrack = [];
let sharpV3_turnCandidates = [];
let sharpV3_sharpEvents = [];
let sharpV3_lastSEventUtc = null;

function sharpV3_resetAll(){
  sharpV3_fltInfoTrack = [];
  sharpV3_turnCandidates = [];
  sharpV3_sharpEvents = [];
  sharpV3_lastSEventUtc = null;
  if (typeof sharpV3_updateDebugCounts === "function") {
    sharpV3_updateDebugCounts();
  }
}

// fltPoint: {lat, lon, heading, speedKmh, utcSec}
function sharpV3_pushFilteredPoint(fltPoint){
  if (!fltPoint || typeof fltPoint.lat !== "number" || typeof fltPoint.lon !== "number") return;
  // utcSec 可以為 null，僅在 cooldown 判斷時使用
  sharpV3_fltInfoTrack.push({
    lat: fltPoint.lat,
    lon: fltPoint.lon,
    heading: fltPoint.heading,
    speedKmh: fltPoint.speedKmh,
    utcSec: fltPoint.utcSec
  });

  // Debug：可視需要在此觸發即時 TurnDetector
  // 目前為了穩定與容易比較，仍建議由既有 sweep 函式來統一處理。
  if (typeof sharpV3_updateDebugCounts === "function") {
    sharpV3_updateDebugCounts();
  }
}

// Severity Evaluator：依照目前 dropdown 參數重算 sharpEvents
function sharpV3_recomputeSharpEvents(angleThDeg, speedThKmh, cooldownSec){
  sharpV3_sharpEvents = [];
  sharpV3_lastSEventUtc = null;
  if (!sharpV3_turnCandidates || sharpV3_turnCandidates.length === 0) {
    if (typeof sharpV3_updateDebugCounts === "function") {
      sharpV3_updateDebugCounts();
    }
    return;
  }

  const angleTh = typeof angleThDeg === "number" ? angleThDeg : 0;
  const speedTh = typeof speedThKmh === "number" ? speedThKmh : 0;
  const cdSec = typeof cooldownSec === "number" ? cooldownSec : 0;

  for (let i = 0; i < sharpV3_turnCandidates.length; i++) {
    const cand = sharpV3_turnCandidates[i];
    if (!cand) continue;

    // 角度條件
    if (typeof cand.angleSum === "number" && cand.angleSum < angleTh) {
      continue;
    }
    // 速度條件（v3 fix：優先用 g3Speed，若沒有才退回 avgSpeed）
    let speedForCheck = null;
    if (typeof cand.g3Speed === "number" && !Number.isNaN(cand.g3Speed)) {
      speedForCheck = cand.g3Speed;
    } else if (typeof cand.avgSpeed === "number" && !Number.isNaN(cand.avgSpeed)) {
      speedForCheck = cand.avgSpeed;
    }
    if (typeof speedForCheck === "number" && speedForCheck < speedTh) {
      continue;
    }

    let utc = cand.utcSec;
    if (utc == null || !Number.isFinite(utc)) {
      utc = 0;
    }

    // 冷卻判斷
    if (sharpV3_lastSEventUtc != null && (utc - sharpV3_lastSEventUtc) < cdSec) {
      continue;
    }

    sharpV3_lastSEventUtc = utc;

    // 建立 S 事件（Debug 版：保留多種欄位給 tooltip 用）
    const ev = {
      lat: cand.lat,
      lon: cand.lon,
      utcSec: utc,
      angleSum: cand.angleSum,
      maxDeltaDeg: cand.maxDeltaDeg,
      avgSpeed: cand.avgSpeed,
      maxSpeed: cand.maxSpeed,
      h1: cand.h1,
      h2: cand.h2,
      h3: cand.h3,
      h4: cand.h4,
      d12: cand.d12,
      d13: cand.d13,
      d14: cand.d14,
      directionText: cand.directionText || "",
      timeLocal: cand.timeLocal || "",
      gpsQualityText: cand.gpsQualityText || ""
    };
    sharpV3_sharpEvents.push(ev);
  }

  if (typeof sharpV3_updateDebugCounts === "function") {
    sharpV3_updateDebugCounts();
  }
}

// Debug：更新 fltInfo / candidate / S 數量
function sharpV3_updateDebugCounts(){
  const fltEl = document.getElementById("sharpDbgFltInfo");
  const candEl = document.getElementById("sharpDbgCand");
  const sEl = document.getElementById("sharpDbgSEvt");
  if (fltEl) fltEl.textContent = sharpV3_fltInfoTrack ? sharpV3_fltInfoTrack.length.toString() : "0";
  if (candEl) candEl.textContent = sharpV3_turnCandidates ? sharpV3_turnCandidates.length.toString() : "0";
  if (sEl) sEl.textContent = sharpV3_sharpEvents ? sharpV3_sharpEvents.length.toString() : "0";
}

// Debug：建立 fltInfo / candidate.g3 / S 的圖層
let sharpV3_debugLayer = null;
let sharpV3_debugVisible = false;

function sharpV3_rebuildDebugLayers(){
  if (!map || typeof L === "undefined") return;
  if (!sharpV3_debugLayer) {
    sharpV3_debugLayer = L.layerGroup().addTo(map);
  }
  sharpV3_debugLayer.clearLayers();
  if (!sharpV3_debugVisible) {
    return;
  }

  // fltInfoTrack 小灰點
  if (sharpV3_fltInfoTrack && sharpV3_fltInfoTrack.length > 0) {
    sharpV3_fltInfoTrack.forEach(function(p, idx){
      if (typeof p.lat !== "number" || typeof p.lon !== "number") return;
      const m = L.circleMarker([p.lat, p.lon], {
        radius: 6,
        weight: 0,
        fillOpacity: 0.9,
        color: "#3b82b1",
        fillColor: "#3b82b1"
      });
      const fltTooltipHtml =
        "【Filtered 點】" +
        "<br>• 索引：flt[" + idx + "]" +
        "<br>• 方位：" + (p.heading!=null ? p.heading.toFixed(1) + "°" : "na") +
        "<br>• 速度：" + (p.speedKmh!=null ? p.speedKmh.toFixed(1) + " km/h" : "na");
      m.bindTooltip(
        fltTooltipHtml,
        {
          direction: "top",
          opacity: 1,
          className: "park-tooltip"
        }
      );
      sharpV3_debugLayer.addLayer(m);
    });
  }

  // candidate.g3 黃點
  if (sharpV3_turnCandidates && sharpV3_turnCandidates.length > 0) {
    sharpV3_turnCandidates.forEach(function(c, idx){
      if (typeof c.lat !== "number" || typeof c.lon !== "number") return;
      const m = L.circleMarker([c.lat, c.lon], {
        radius: 6,
        weight: 0,
        fillOpacity: 0.9,
        color: "#1e3a8a",
        fillColor: "#1e3a8a"
      });
      var line1 = "cand[" + idx + "] angleSum=" + (c.angleSum!=null?c.angleSum.toFixed(1):"na") +
                    " avgV=" + (c.avgSpeed!=null?c.avgSpeed.toFixed(1):"na");
      function fmtDeg(val){
        return (typeof val === "number" && !isNaN(val)) ? val.toFixed(1) + "\u00b0" : "na";
      }
      function fmtSpd(val){
        return (typeof val === "number" && !isNaN(val)) ? val.toFixed(1) : "na";
      }
      var g1Str = "g1=" + fmtDeg(c.g1Heading) + "/" + fmtSpd(c.g1Speed);
      var g2Str = "g2=" + fmtDeg(c.g2Heading) + "/" + fmtSpd(c.g2Speed);
      var g3Str = "g3=" + fmtDeg(c.g3Heading) + "/" + fmtSpd(c.g3Speed);
      var g4Str = "g4=" + fmtDeg(c.g4Heading) + "/" + fmtSpd(c.g4Speed);
      var line2 = g1Str + " " + g2Str + " " + g3Str + " " + g4Str;
      var tooltipHtml =
        "【Filtered 視窗】" +
        "<br>• 視窗編號：cand[" + idx + "]" +
        "<br>• angleSum：" + (c.angleSum!=null?c.angleSum.toFixed(1):"na") +
        "<br>• 平均速度：" + (c.avgSpeed!=null?c.avgSpeed.toFixed(1):"na") + " km/h" +
        "<br>• " + g1Str +
        "<br>• " + g2Str +
        "<br>• " + g3Str +
        "<br>• " + g4Str;
      m.bindTooltip(
        tooltipHtml,
        {
          direction: "top",
          opacity: 1,
          className: "park-tooltip"
        }
      );
      sharpV3_debugLayer.addLayer(m);
    });
  }

  // S events：實際 S icon 已由 rebuildSharpMarkersFromV3 負責，debug layer這裡不重複
}

// candidate 產生時的事件處理（你提到的 onTurnDetected 概念）
function sharpV3_onTurnDetected(cand){
  if (!cand) return;
  sharpV3_turnCandidates.push(cand);
  // Debug：更新數量並重建 Debug 圖層
  if (typeof sharpV3_updateDebugCounts === "function") {
    sharpV3_updateDebugCounts();
  }
  if (typeof sharpV3_rebuildDebugLayers === "function") {
    sharpV3_rebuildDebugLayers();
  }
}

// ===============================
// Sharp Turn v3.0 UI integration
// ===============================
function rebuildSharpMarkersFromV3(){
  if (typeof sharpV3_sharpEvents === "undefined" || !sharpV3_sharpEvents) return;
  if (!sharpLayerGroup && typeof L !== "undefined" && map) {
    sharpLayerGroup = L.layerGroup().addTo(map);
  }
  if (!sharpLayerGroup) return;

  // 清除舊的 S icon
  sharpLayerGroup.clearLayers();

  for (let i = 0; i < sharpV3_sharpEvents.length; i++) {
    const ev = sharpV3_sharpEvents[i];
    if (typeof ev.lat !== "number" || typeof ev.lon !== "number") continue;

    const sPos = L.latLng(ev.lat, ev.lon);
    const sIcon = L.divIcon({
      className: "stop-icon sharp-stop-icon",
      html: "<div class='stop-icon-inner'>S</div>",
      iconSize: [18, 18]
    });
    const markerS = L.marker(sPos, { icon: sIcon });

    const tooltipHtml = (function(ev2){
      const lines = [];
      lines.push("<b style=\"color:#d00;\">【急轉向事件 v3.0】</b>");
      if (ev2.timeLocal) lines.push("<br>• 時間：" + ev2.timeLocal);
      if (ev2.directionText) lines.push("<br>• 方向：" + ev2.directionText);
      if (typeof ev2.maxDeltaDeg === "number") lines.push("<br>• 最大角度變化：<b>" + ev2.maxDeltaDeg.toFixed(1) + "°</b>");
      if (typeof ev2.angleSum === "number") lines.push("<br>• 累積角度：<b>" + ev2.angleSum.toFixed(1) + "°</b>");
      if (typeof ev2.avgSpeed === "number") lines.push("<br>• 速度：<b>" + ev2.avgSpeed.toFixed(1) + " km/h</b>");
      if (typeof ev2.lat === "number" && typeof ev2.lon === "number") {
        lines.push("<br>• 座標：" + ev2.lat.toFixed(6) + ", " + ev2.lon.toFixed(6));
      }
      if (ev2.gpsQualityText) {
        lines.push("<br>• HDOP / Fix：" + ev2.gpsQualityText);
      }
      lines.push("<br><b>判定：</b><span style='color:#090;'>angle OK</span> / <span style='color:#090;'>speed OK</span> / <span style='color:#090;'>cooldown OK</span>");
      // Debug 區塊
      if (typeof ev2.h1 === "number" && typeof ev2.h2 === "number" &&
          typeof ev2.h3 === "number" && typeof ev2.h4 === "number") {
        lines.push("<br>------------------------------------");
        lines.push("<br>【Debug 區】");
        lines.push("<br>• h1：" + ev2.h1.toFixed(1) +
                   "  h2：" + ev2.h2.toFixed(1) +
                   "  h3：" + ev2.h3.toFixed(1) +
                   "  h4：" + ev2.h4.toFixed(1));
      }
      if (typeof ev2.d12 === "number" && typeof ev2.d13 === "number" && typeof ev2.d14 === "number") {
        lines.push("<br>• d12：" + ev2.d12.toFixed(1) +
                   "  d13：" + ev2.d13.toFixed(1) +
                   "  d14：" + ev2.d14.toFixed(1));
      }
      return lines.join("");
    })(ev);

    markerS.bindTooltip(
      tooltipHtml,
      {
        direction: "top",
        opacity: 1,
        className: "park-tooltip"
      }
    );
    markerS._tooltipOpen = false;
    markerS.off('mouseover');
    markerS.off('mouseout');
    markerS.on('click', function () {
      if (markerS._tooltipOpen) {
        markerS.closeTooltip();
        markerS._tooltipOpen = false;
      } else {
        markerS.openTooltip();
        markerS._tooltipOpen = true;
      }
    });

    sharpLayerGroup.addLayer(markerS);
  }

  // 若目前 sharpVisible 為 false，則依照現有邏輯隱藏圖層
  if (!sharpVisible && map && sharpLayerGroup && map.hasLayer(sharpLayerGroup)) {
    map.removeLayer(sharpLayerGroup);
  }
}