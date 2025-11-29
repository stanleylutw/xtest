// app.js skeleton
function initApp(){
  // TODO: detect page type and call initJ1939 / initGps in future versions
}

// Shared utility functions copied from inline scripts (v79_test2)

function angleDiffDeg(a, b){
    if(a==null || b==null) return 0;
    let d = Math.abs(a - b) % 360;
    if(d > 180) d = 360 - d;
    return d;
  }

function signedAngleDiffDeg(a, b){
    if(a==null || b==null) return 0;
    let d = (b - a) % 360;
    if(d > 180) d -= 360;
    if(d < -180) d += 360;
    return d;
  }

function fmtTs(ts){
    if(ts==null) return "--";
    if(ts<1e6){ // sequence
      return `#${ts}`;
    }
    const d = new Date(ts*1000);
    return d.toLocaleTimeString();
  }

function formatUtcTime(sec){
    sec = (sec+86400)%86400;
    const h = Math.floor(sec/3600);
    const m = Math.floor((sec%3600)/60);
    const s = Math.floor(sec%60);
    return String(h).padStart(2,"0")+String(m).padStart(2,"0")+String(s).padStart(2,"0")+".00";
  }

function utcStrToSec(utcStr){
    if(!utcStr) return null;
    const s = utcStr.includes(":") ? utcStr : (utcStr.length>=6 ? utcStr.slice(0,2)+":"+utcStr.slice(2,4)+":"+utcStr.slice(4,6) : utcStr);
    const p = s.split(":");
    if(p.length<2) return null;
    const h = parseInt(p[0],10)||0, m = parseInt(p[1],10)||0, se = parseInt(p[2]||"0",10)||0;
    return h*3600 + m*60 + se;
  }

function utcToLocalTimeStr(utcStr){
    if(!utcStr || utcStr==="--") return "--";
    const parts = utcStr.split(":");
    if(parts.length < 2) return utcStr;
    const h = parseInt(parts[0],10)||0;
    const mi = parseInt(parts[1],10)||0;
    const s = parseInt(parts[2],10)||0;
    const now = new Date();
    const dUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, mi, s));
    return dUtc.toLocaleTimeString([], {hour12:false});
  }

function getDtSec(){
    const now = performance.now();
    let dt = 0.2;
    if(gpsState.lastPerfTs != null){
      dt = (now - gpsState.lastPerfTs)/1000;
      if(!isFinite(dt) || dt<=0) dt=0.2;
      dt = Math.min(Math.max(dt, 0.05), 2.0);
    }
    gpsState.lastPerfTs = now;
    return dt;
  }

function appendLog(text){
    const t = new Date();
    const ts = "[" +
      String(t.getHours()).padStart(2,"0") + ":" +
      String(t.getMinutes()).padStart(2,"0") + ":" +
      String(t.getSeconds()).padStart(2,"0") + "]";
    logEl.textContent += `${ts} ${text}\n`;
    logEl.scrollTop = logEl.scrollHeight;
  }

function applyLogSize(){
    const v=logSizeSelect.value;
    if(v==="small") logEl.style.height="140px";
    else if(v==="large") logEl.style.height="340px";
    else logEl.style.height="230px";
  }

function rotateNeedle(el, value, min, max){
    if(!el) return;
    const v = Math.min(Math.max(value, min), max);
    const ratio = (v-min)/(max-min);
    const angle = -90 + ratio*180;
    el.style.transform = `rotate(${angle}deg)`;
  }

function rotateArrowDom(courseDeg){
    if(!marker || !marker._icon) return;
    marker._icon.style.transform = `rotate(${courseDeg}deg)`;
  }

function nmeaToDecimal(ddmm, hemi){
    if(!ddmm) return null;
    const val=parseFloat(ddmm);
    if(Number.isNaN(val)) return null;
    const deg=Math.floor(val/100);
    const min=val-deg*100;
    let dec=deg+(min/60);
    if(hemi==="S"||hemi==="W") dec*=-1;
    return dec;
  }

function toDDMM(value){
    const deg = Math.floor(Math.abs(value));
    const min = (Math.abs(value)-deg)*60;
    const dd = String(deg).padStart(2,"0");
    const mm = min.toFixed(4).padStart(7,"0");
    return dd+mm;
  }

function toDDDMM(value){
    const deg = Math.floor(Math.abs(value));
    const min = (Math.abs(value)-deg)*60;
    const dd = String(deg).padStart(3,"0");
    const mm = min.toFixed(4).padStart(7,"0");
    return dd+mm;
  }

function fixTextFromState(){
    const fixOk = gpsState.fixQ>0 && gpsState.statusA;
    if(!fixOk) return "No Fix";
    if(gpsState.fixQ===4) return "RTK Fix";
    if(gpsState.fixQ===2) return "DGPS Fix";
    return (gpsState.sats!=null && gpsState.sats>=4) ? "3D Fix" : "2D Fix";
  }
