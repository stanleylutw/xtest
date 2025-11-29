// j1939.js skeleton
function initJ1939(){
  // TODO: move J1939-specific initialization and logic here
}

// J1939 inline script moved from HTML (v79_test4)

// ==============================
  // State
  // ==============================
  let port = null;
  let reader = null;
  let demoTimer = null;
  let currentMode = "serial"; // serial | can | gps

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
        fixOk
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
      const course=parseFloat(f[1]);
      if(!Number.isNaN(course)) gpsState.course=course;

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

  
  let rawTrack = [];
  let fltTrack = [];
  let t15Polyline = null;
  let t15Track = [];
  let t15TotalM = 0;
  let t15Visible = true;
  let last15sSec = null;
  let t15AccSec = 0;
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
  const rawKmEl = document.getElementById("rawKm");
  const fltKmEl = document.getElementById("fltKm");

  // Stop detection state
  const stopState = {
    lastPos: null,
    stillSec: 0,
  };

  // EMA state (filtered)
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
    stableCount: 0
  };

  

  // Signed smallest-angle difference in degrees within [-180, 180]
  

  let turnAccTh = 500;        // UI controlled threshold
  let turnAccBase = null;    // f: base course
  let turnAccSum = 0;        // acc: signed accumulated change




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
      color:'#f97316',
      weight:4, opacity:0.8
    }).addTo(map);

    fltPolyline = L.polyline([], {
      color:getComputedStyle(document.documentElement).getPropertyValue('--flt-blue').trim(),
      weight:4, opacity:0.9
    }).addTo(map);

    trackBounds = L.latLngBounds([]);

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
    const Legend = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd: function(){
        const div = L.DomUtil.create('div','legend-box');
        div.id = "legendBox";
        div.innerHTML = `
          <div class="legend-row" id="legendRaw">
            <span class="legend-line raw"></span>
            <span>Raw 原始軌跡</span>
          </div>
          <div class="legend-row" id="legendFlt">
            <span class="legend-line flt"></span>
            <span>Filtered 優化軌跡</span>
          </div>
        `;
        L.DomEvent.disableClickPropagation(div);
        return div;
      }
    });
    map.addControl(new Legend());
    refreshLegend();
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
    const VMIN = 3;           // km/h: below this skip filtered points
    const HDOP_MAX = 2.5;     // hdop quality gate
    const TURN_DELTA = 15;    // deg, heading change to enter turn (cond1)
    const NEED_STREAK = 4;    // consecutive confirmations (g2..g5)

    // HDOP gate: bad quality => reject and do NOT update heading/accum state
    if(hdop != null && hdop > HDOP_MAX){
      return { accept:false, reason:"hdop_bad" };
    }

    // Accept first filtered point
    if(!fltLastPos){
      prevRawPosForHeading = {lat, lon};
      prevCourseForHeading = courseDeg;

      turnAccBase = courseDeg;
      turnAccSum = 0;

      return { accept:true, latF:lat, lonF:lon, courseF:courseDeg, speedF:speedKmh };
    }

    // Low speed gate: do not add points; also do not run heading logic
    if(speedKmh != null && speedKmh < VMIN){
      prevRawPosForHeading = {lat, lon};
      prevCourseForHeading = courseDeg;
      return { accept:false, reason:"low_speed" };
    }

    // ---- Condition 1: heading streak lock g1 ----
    const delta = angleDiffDeg(prevCourseForHeading, courseDeg);

    if(!turnState.inTurn){
      if(delta >= TURN_DELTA){
        // Enter turn: lock g1 (previous raw point)
        turnState.inTurn = true;
        turnState.turnStartCourse = prevCourseForHeading;
        turnState.lockedPos = prevRawPosForHeading ? {...prevRawPosForHeading} : {lat, lon};
        turnState.stableCount = 1; // current g2 satisfies delta vs g1

        prevRawPosForHeading = {lat, lon};
        prevCourseForHeading = courseDeg;
      } else {
        prevRawPosForHeading = {lat, lon};
        prevCourseForHeading = courseDeg;
      }
    } else {
      // In turn: confirm sustained heading change vs g1
      const d2 = angleDiffDeg(turnState.turnStartCourse, courseDeg);
      if(d2 >= TURN_DELTA){
        turnState.stableCount += 1;
      } else {
        // streak broken -> reset
        turnState.inTurn = false;
        turnState.turnStartCourse = null;
        turnState.lockedPos = null;
        turnState.stableCount = 0;
      }

      if(turnState.stableCount >= NEED_STREAK){
        // Confirmed sustained turn: add locked g1 point to filtered
        const lp = turnState.lockedPos || {lat, lon};

        turnState.inTurn = false;
        turnState.turnStartCourse = null;
        turnState.lockedPos = null;
        turnState.stableCount = 0;

        prevRawPosForHeading = {lat, lon};
        prevCourseForHeading = courseDeg;

        // reset condition3 accumulators on accept
        turnAccBase = courseDeg;
        turnAccSum = 0;

        return { accept:true, latF:lp.lat, lonF:lp.lon, courseF:courseDeg, speedF:speedKmh, reason:"cond1" };
      }

      prevRawPosForHeading = {lat, lon};
      prevCourseForHeading = courseDeg;
    }

    // ---- Condition 3: signed accumulated heading change vs base ----
    if(turnAccBase == null) turnAccBase = courseDeg;
    const dSigned = signedAngleDiffDeg(turnAccBase, courseDeg);
    turnAccSum += dSigned;

    if(Math.abs(turnAccSum) >= turnAccTh){
      // accept current point, and reset base+sum
      turnAccBase = courseDeg;
      turnAccSum = 0;
      return { accept:true, latF:lat, lonF:lon, courseF:courseDeg, speedF:speedKmh, reason:"cond3" };
    }

    return { accept:false, reason:"cond3_wait" };
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

  function updateTracksAndMap(lat, lon, speedKmh, courseDeg, sats, hdop, fixOk){
    initMapIfNeeded();
    const dt = getDtSec();

    // RAW: absolutely no filtering beyond fix gate already checked
    const posRaw = L.latLng(lat, lon);
    rawPolyline.addLatLng(posRaw);
    
    rawTrack.push(posRaw);

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

    if (t15AccSec >= 15) {
      const pos15 = { lat, lon };
      if (t15Track.length > 0) {
        const prev15 = t15Track[t15Track.length - 1];
        t15TotalM += haversineM(prev15.lat, prev15.lon, pos15.lat, pos15.lon);
      }
      t15Track.push(pos15);
      if (t15Polyline) {
        t15Polyline.addLatLng(L.latLng(pos15.lat, pos15.lon));
      }
      t15AccSec = t15AccSec % 15;
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
    const out = filterPipeline(lat, lon, speedKmh, courseDeg, sats, hdop, dt);

    let viewPos = posRaw;
    let viewCourse = courseDeg;
    let viewSpeed = speedKmh;

    if(out.accept){
      const posF = L.latLng(out.latF, out.lonF);
      fltPolyline.addLatLng(posF);

      
      fltTrack.push(posF);
if(fltLastPos){
        fltTotalM += haversineM(fltLastPos.lat, fltLastPos.lon, out.latF, out.lonF);
      }
      fltLastPos = {lat: out.latF, lon: out.lonF};

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
  const rawToggle = document.getElementById("rawToggle");
  const fltToggle = document.getElementById("fltToggle");

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
    updateKmDisplays();
    appendLog("USER: 清除軌跡");
  
    // clear 15s track
    t15Track = [];
    t15TotalM = 0;
    last15sSec = null;
    t15AccSec = 0;
    if(t15Polyline) t15Polyline.setLatLngs([]);

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
    fltToggle.classList.toggle("off", !fltVisible);
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


  rawToggle.addEventListener("click", ()=>{
    setRawVisible(!rawVisible);
    appendLog(`USER: Raw 軌跡 ${rawVisible ? "ON" : "OFF"}`);
  });
  fltToggle.addEventListener("click", ()=>{
    setFltVisible(!fltVisible);
    appendLog(`USER: Filtered 軌跡 ${fltVisible ? "ON" : "OFF"}`);
  });

  
  const t15Toggle = document.getElementById("t15Toggle");
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
  const verInfo = document.getElementById("verInfo");

  function showRuleModal(type){
    if(type==="raw"){
      ruleTitle.textContent="🟥 Raw 原始軌跡 規則";
      ruleBody.innerHTML = `
        <p><b>用途：</b>作為基準對照，觀察 GPS 原始漂移與跳點。</p>
        <ul>
          <li>僅使用「有效定位」的點（RMC=A 且有 Fix）。</li>
          <li><b>不做任何濾波與修正</b>：不看 HDOP、不看速度、不剔除漂移、不平滑。</li>
          <li>每一個有效點都畫在地圖上，並累加相鄰距離作為 Raw 里程。</li>
        </ul>
      `;
    } else if(type==="flt"){
      ruleTitle.textContent="🟦 Filtered 優化軌跡 規則";
      ruleBody.innerHTML = `
        <p><b>用途：</b>在保留關鍵形狀的前提下，減少漂移與多餘點，得到較接近實際行車路徑的藍線。</p>
        <ul>
          <li><b>定位品質條件：</b>HDOP 過大（>2.5）的點直接丟棄，不畫線也不計算。</li>
          <li><b>速度條件：</b>速度低於 3 km/h 視為低速／可能停車，只更新方向基準，不加入 Filtered。</li>
          <li><b>轉彎起點鎖定：</b>當方向瞬間改變超過約 15° 並持續數個定位點，會把當初的轉彎起點鎖定為關鍵節點。</li>
          <li><b>累積轉角閥值：</b>持續累積方向變化量，角度累積超過「閥值」設定（例如 500°）時，將當前點加入 Filtered。</li>
          <li>只有符合上述條件的點才會畫在藍線上，並用來累加 Filtered 里程。</li>
        </ul>
      `;
    } else if(type==="t15"){
      ruleTitle.textContent="🟧 15s 固定時間取樣軌跡 規則";
      ruleBody.innerHTML = `
        <p><b>用途：</b>以固定時間間隔觀察長時間行駛趨勢。</p>
        <ul>
          <li>同樣只在「定位有效」時才參與計算。</li>
          <li>每當累積時間達 15 秒，就在當前位置打一個橘色點並連線。</li>
          <li>不另外檢查速度、轉彎與 HDOP，只依時間長度固定取樣。</li>
          <li>15s 里程以相鄰 15 秒點的距離累加，適合看長距離的整體走向。</li>
        </ul>
      `;
    } else if(type==="ver"){
      ruleTitle.textContent = "📜 版本修改紀錄（Release Notes）";
      ruleBody.innerHTML = `
        <p><b>v77_1126</b></p>
        <ul>
          <li>新增：Playback Speed = All 時，在地圖上方顯示半透明遮罩與小視窗，顯示「已處理筆數／總筆數」與完成百分比。</li>
          <li>新增：按下 All 播放後，立刻顯示「ALL 模式繪製中」狀態，避免使用者以為畫面當機。</li>
          <li>修正：整理 ALL 模式相關程式碼結構，消除重複與殘留區段，避免 SyntaxError。</li>
        </ul>
        <p><b>v73_1123</b></p>
        <ul>
          <li>修正 Rules Modal JavaScript 語法錯誤（const 重複宣告），確保 Raw / Filtered / 15s 規則視窗正常開啟。</li>
        </ul>
        <p><b>v72_1123</b></p>
        <ul>
          <li>在 15s 軌跡 chip 後新增 ⓘ 按鈕。</li>
          <li>為 Raw / Filtered / 15s 三條線更新「完整條件說明」，不顯示程式碼但列出所有規則。</li>
        </ul>
        <p><b>v71_1123</b></p>
        <ul>
          <li>Filtered 「閥值」欄位：預設值改為 500，調整步進改為 50，有效範圍 50～800。</li>
        </ul>
        <p><b>v70_1123</b></p>
        <ul>
          <li>移除回放資訊中的「時間範圍 #0 ~ #xxxx」顯示，只保留檔案名、總筆數、總秒數。</li>
        </ul>
        <p><b>v69_1123</b></p>
        <ul>
          <li>重新定義「總筆數｜總秒數」：TXT 以 NMEA 行數與 UTC 秒數去重；CSV 以 pbPoints 與 ts 秒數去重。</li>
        </ul>
        <p><b>v63 ~ v67（摘要）</b></p>
        <ul>
          <li>v63：修正「清除軌跡」時 15s 線沒有被清除的問題。</li>
          <li>v64：USB mode-switch 位置調整到 toolbar-left 最前面。</li>
          <li>v65：回放模式改用 log 內 ts 當 dt，修正 15s 點太疏的問題。</li>
          <li>v66：15s 線改為橘色，並新增 15s chip 可切換顯示／隱藏。</li>
          <li>v67：修正 15s chip 事件綁定，使切換功能實際生效。</li>
        </ul>
      `;
    }
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
    turnAccTh = Math.max(50, Math.min(800, parseFloat(turnAccThInput.value)||500));
    turnAccThInput.addEventListener("input", ()=>{
      turnAccTh = Math.max(50, Math.min(800, parseFloat(turnAccThInput.value)||500));
    });
  }


  loadGpsLogBtn.addEventListener("click", ()=>gpsLogInput.click());
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
      lat:null, lon:null, speedKmh:0, course:0, alt:null, sats:null, hdop:null, fixQ:0, statusA:false, utcTime:null
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
      }
      if(type==="VTG"){
        const course=parseFloat(f[1]);
        if(!Number.isNaN(course)) tempState.course=course;
        const kmh=parseFloat(f[7]);
        if(!Number.isNaN(kmh)) tempState.speedKmh=kmh;
      }

      if(tempState.lat!=null && tempState.lon!=null){
        const ptsItem = {
          ts: seqTs++,
          lat: tempState.lat,
          lon: tempState.lon,
          speedKmh: tempState.speedKmh||0,
          course: tempState.course||0,
          utcTime: tempState.utcTime || null,
          alt: tempState.alt,
          fixQ: tempState.fixQ||0,
          sats: tempState.sats,
          hdop: tempState.hdop,
          statusA: tempState.statusA
        };
        pts.push(ptsItem);
      }
    }

    // 記錄此 TXT 檔案的「總秒數」（依 UTC 秒數計算）
    lastTxtSeconds = utcSet.size;

    return pts;
  }

  

  function clearAllTracksForPlayback(){
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
    emaState.latF = null; emaState.lonF = null;
    stopState.lastPos = null; stopState.stillSec = 0;
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
  function playAllAtOnce(){
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
      appendLog("Playback: All 完成（可 Replay）");

      if(allStatus){
        allStatus.textContent = "ALL 模式：軌跡套用完成。";
        setTimeout(()=>{ allStatus.textContent = ""; }, 3000);
      }

      if(overlay){
        if(allTitleEl){
          allTitleEl.textContent = "✅ ALL 模式：軌跡套用完成";
        }
        setTimeout(()=>{
          overlay.style.display = "none";
        }, 1800);
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