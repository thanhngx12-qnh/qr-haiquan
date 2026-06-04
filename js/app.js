/* ============================================================
   CẤU HÌNH VỊ TRÍ CỘT EXCEL (INDEX MAPPING)
   ------------------------------------------------------------
   - Cột A = 0 | Cột B = 1 | Cột C = 2 | Cột D = 3 ...
   - Nếu bạn muốn bỏ qua cột nào, chỉ việc gán số nhảy cóc.
     Hệ thống sẽ tự động điền phím Tab (\t) vào các khoảng trống.
   ============================================================ */
var qrOutputConfig = {
  "mst": 0,       // Điền vào Cột A
  "tencty": 1,    // Điền vào Cột B
  "sotokhai": 2,  // Điền vào Cột C
  "diadiem": 3,   // Điền vào Cột D
  "bks": 4,       // Điền vào Cột E
  "socont": 5,    // Điền vào Cột F
  "mathang": 6,   // Điền vào Cột G
  "nguoikhai": 7, // Điền vào Cột H
  "laixe": 8      // Điền vào Cột I
};

var qrOutputConfig = {
  "bks": 0,       // Điền vào Cột E
  "socont": 2,    // Điền vào Cột F
  "sotokhai": 3,  // Điền vào Cột C
  "diadiem": 5,   // Điền vào Cột D
  "mathang": 6,   // Điền vào Cột G
  "laixe": 8,      // Điền vào Cột I
  "nguoikhai": 11, // Điền vào Cột H
};
/* Ví dụ nếu muốn nhảy cóc:
var qrOutputConfig = {
  "mst": 0,       // Cột A
                  // Cột B trống (tự động \t)
  "sotokhai": 2,  // Cột C
  "bks": 5        // Cột F (Cột D, E trống tự động \t)
};
*/

var QRGenInline = (function(){
  function encodeUTF8(str){
    var bytes=[];
    for(var i=0;i<str.length;i++){
      var c=str.charCodeAt(i);
      if(c<0x80) bytes.push(c);
      else if(c<0x800){bytes.push(0xC0|(c>>6));bytes.push(0x80|(c&0x3F));}
      else if(c<0x10000){bytes.push(0xE0|(c>>12));bytes.push(0x80|((c>>6)&0x3F));bytes.push(0x80|(c&0x3F));}
      else{bytes.push(0xF0|(c>>18));bytes.push(0x80|((c>>12)&0x3F));bytes.push(0x80|((c>>6)&0x3F));bytes.push(0x80|(c&0x3F));}
    }
    return bytes;
  }
  function toFallbackURL(text,size){
    return 'https://api.qrserver.com/v1/create-qr-code/?size='+size+'x'+size
      +'&charset-source=UTF-8&ecc=H&data='+encodeURIComponent(text);
  }
  return {toFallbackURL:toFallbackURL, encodeUTF8:encodeUTF8};
})();

var phieus = [];
var nextId = 1;

window.addEventListener('DOMContentLoaded', function(){
  detectLib();
  addPhieu();
});

function detectLib(){
  var badge = document.getElementById('lib-badge');
  var text  = document.getElementById('lib-text');
  if(typeof QRCode !== 'undefined' && typeof QRCode.toCanvas === 'function'){
    text.textContent = 'Thư viện offline (soldair): Sẵn sàng';
    return;
  }
  if(typeof QRCode !== 'undefined'){
    text.textContent = 'Thư viện offline (qrcodejs): Sẵn sàng';
    return;
  }
  badge.className = 'lib-badge warn';
  text.textContent = 'Không tìm thấy thư viện offline — dùng API online cho QR';
}

function getQRDataURL(text, sizePx){
  return new Promise(function(resolve){
    if(!text){ resolve(''); return; }
    if(typeof QRCode !== 'undefined' && typeof QRCode.toDataURL === 'function'){
      QRCode.toDataURL(text,{
        width:sizePx, margin:1, errorCorrectionLevel:'H',
        color:{dark:'#000',light:'#fff'}
      }).then(resolve).catch(function(){ resolve(QRGenInline.toFallbackURL(text,sizePx)); });
      return;
    }
    if(typeof QRCode !== 'undefined'){
      try{
        var div = document.createElement('div');
        div.style.cssText='position:fixed;left:-9999px;top:-9999px;width:'+sizePx+'px;height:'+sizePx+'px';
        document.body.appendChild(div);
        new QRCode(div,{text:text,width:sizePx,height:sizePx,
          colorDark:'#000000',colorLight:'#ffffff',
          correctLevel:(QRCode.CorrectLevel&&QRCode.CorrectLevel.H)||3});
        setTimeout(function(){
          var cv = div.querySelector('canvas');
          var url = cv ? cv.toDataURL('image/png') : QRGenInline.toFallbackURL(text,sizePx);
          document.body.removeChild(div);
          resolve(url);
        }, 80);
        return;
      }catch(e){ }
    }
    resolve(QRGenInline.toFallbackURL(text,sizePx));
  });
}

function buildQRStr(p){
  // 1. Tìm vị trí cột xa nhất (max index)
  var maxIndex = 0;
  for (var key in qrOutputConfig) {
    if (qrOutputConfig[key] > maxIndex) {
      maxIndex = qrOutputConfig[key];
    }
  }

  // 2. Tạo một mảng gồm các chuỗi rỗng có độ dài bằng số cột xa nhất
  var arr = new Array(maxIndex + 1).fill("");

  // 3. Đưa dữ liệu vào đúng vị trí Index (Cột) đã cấu hình
  for (var key in qrOutputConfig) {
    var colIndex = qrOutputConfig[key];
    arr[colIndex] = p[key] || "";
  }
  
  // 4. Nối mảng lại bằng phím Tab (\t). 
  // Các khoảng trống trong mảng (những cột không khai báo) sẽ tự động biến thành \t
  return arr.join('\t');
}

function addPhieu(){
  var id = nextId++;
  var p = {id:id,mst:'',tencty:'',sotokhai:'',diadiem:'',bks:'',socont:'',mathang:'',nguoikhai:'',laixe:''};
  phieus.push(p);
  renderCard(p);
  updateUI();
  toast('Đã thêm phiếu #'+id,'info');
}

function duplicatePhieu(id){
  var src = phieus.find(function(x){return x.id===id;});
  if(!src) return;
  var nid = nextId++;
  var copy = Object.assign({},src,{id:nid});
  phieus.push(copy);
  renderCard(copy);
  setTimeout(function(){
    fillCard(copy);
    refreshStatus(copy);
  },30);
  updateUI();
  toast('Nhân đôi phiếu #'+id+' → #'+nid,'success');
}

function deletePhieu(id){
  var el = document.getElementById('card-'+id);
  if(el) el.remove();
  phieus = phieus.filter(function(p){return p.id!==id;});
  updateUI();
  toast('Đã xóa phiếu #'+id,'info');
}

function clearAll(){
  if(!confirm('Xóa toàn bộ phiếu?')) return;
  phieus=[];
  var list = document.getElementById('phieu-list');
  list.innerHTML='';
  renderEmpty();
  updateUI();
  toast('Đã xóa tất cả','info');
}

function collapseAll(){
  phieus.forEach(function(p){setCollapse(p.id,true);});
}

function setCollapse(id, collapsed){
  var body = document.getElementById('body-'+id);
  var foot = document.getElementById('foot-'+id);
  var chev = document.getElementById('chev-'+id);
  if(!body) return;
  if(collapsed){
    body.className='card-body closed';
    if(foot) foot.style.display='none';
    if(chev) chev.className='chevron';
  } else {
    body.className='card-body';
    if(foot) foot.style.display='';
    if(chev) chev.className='chevron up';
  }
}

function renderEmpty(){
  var list = document.getElementById('phieu-list');
  if(!list.querySelector('.empty-state')){
    list.innerHTML = '<div class="empty-state"><svg width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><h3>Chưa có phiếu nào</h3><p>Nhấn "Thêm phiếu" để bắt đầu</p></div>';
  }
}

function renderCard(p){
  var list = document.getElementById('phieu-list');
  var es = list.querySelector('.empty-state');
  if(es) es.remove();

  var card = document.createElement('div');
  card.className = 'phieu-card';
  card.id = 'card-'+p.id;
  card.innerHTML =
    '<div class="card-head" onclick="toggleCard('+p.id+')">'
      +'<div class="phieu-num">'+p.id+'</div>'
      +'<div class="card-title" id="ctitle-'+p.id+'">Phiếu #'+p.id+' — Chưa nhập'
        +'<span class="card-subtitle" id="csubtitle-'+p.id+'"></span></div>'
      +'<span class="status-pill sp-pending" id="spill-'+p.id+'">Chưa đủ</span>'
      +'<svg class="chevron up" id="chev-'+p.id+'" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>'
    +'</div>'
    +'<div class="card-body" id="body-'+p.id+'">'
      +'<div class="form-grid">'
        +'<div class="fg">'
          +'<label>Mã số thuế <span class="req">*</span></label>'
          +'<div class="fi-row">'
            +'<input class="fi" id="f'+p.id+'mst" placeholder="VD: 4800155257" oninput="setField('+p.id+',\'mst\',this.value)">'
            +'<button class="btn btn-ghost btn-sm" style="flex-shrink:0" onclick="fetchMST('+p.id+')" id="fbtn'+p.id+'" title="Tra cứu tên DN (cần Internet)">'
              +'<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
            +'</button>'
          +'</div>'
        +'</div>'
        +'<div class="fg col-span-2">'
          +'<label>Tên công ty (DN) <span class="req">*</span></label>'
          +'<input class="fi" id="f'+p.id+'tencty" placeholder="VD: Công ty CP Tà Lùng Quang Minh" oninput="setField('+p.id+',\'tencty\',this.value)">'
        +'</div>'
        +'<div class="fg">'
          +'<label>Số tờ khai (STK) <span class="req">*</span></label>'
          +'<div class="fi-wrap">'
            +'<input class="fi" id="f'+p.id+'sotokhai" placeholder="12 chữ số" maxlength="12" oninput="setField('+p.id+',\'sotokhai\',this.value.replace(/\\D/g,\'\'))">'
            +'<span class="fi-check" id="stkchk'+p.id+'"></span>'
          +'</div>'
          +'<div class="field-err" id="stkerr'+p.id+'">STK phải đúng 12 chữ số!</div>'
        +'</div>'
        +'<div class="fg">'
          +'<label>Địa điểm tập kết <span class="req">*</span></label>'
          +'<input class="fi" id="f'+p.id+'diadiem" placeholder="VD: Phú Anh, Sơn Cảng" oninput="setField('+p.id+',\'diadiem\',this.value)">'
        +'</div>'
        +'<div class="fg">'
          +'<label>Biển kiểm soát <span class="req">*</span></label>'
          +'<input class="fi" id="f'+p.id+'bks" placeholder="VD: 34H121212" style="text-transform:uppercase" oninput="setField('+p.id+',\'bks\',this.value.toUpperCase().replace(/[^A-Z0-9]/g,\'\'))">'
        +'</div>'
        +'<div class="fg">'
          +'<label>Số container <span class="req">*</span></label>'
          +'<input class="fi" id="f'+p.id+'socont" placeholder="VD: CICU5999091" style="text-transform:uppercase" oninput="setField('+p.id+',\'socont\',this.value.toUpperCase())">'
        +'</div>'
        +'<div class="fg">'
          +'<label>Mặt hàng <span class="req">*</span></label>'
          +'<input class="fi" id="f'+p.id+'mathang" placeholder="VD: Sầu riêng tươi" oninput="setField('+p.id+',\'mathang\',this.value)">'
        +'</div>'
        +'<div class="fg">'
          +'<label>Người khai hải quan <span class="req">*</span></label>'
          +'<input class="fi" id="f'+p.id+'nguoikhai" placeholder="VD: Trần Ngọc Linh" oninput="setField('+p.id+',\'nguoikhai\',this.value)">'
        +'</div>'
        +'<div class="fg">'
          +'<label>Họ tên lái xe <span class="opt-tag">Tùy chọn</span></label>'
          +'<input class="fi" id="f'+p.id+'laixe" placeholder="VD: Nguyễn Văn A" oninput="setField('+p.id+',\'laixe\',this.value)">'
        +'</div>'
      +'</div>'
    +'</div>'
    +'<div class="card-foot" id="foot-'+p.id+'">'
      +'<span class="foot-info" id="finfo-'+p.id+'">Điền đủ 7 trường (*) để tạo QR</span>'
      +'<div style="display:flex;gap:6px">'
        +'<button class="btn btn-ghost btn-sm" onclick="duplicatePhieu('+p.id+')">'
          +'<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Nhân đôi'
        +'</button>'
        +'<button class="btn btn-red btn-sm" onclick="deletePhieu('+p.id+')">'
          +'<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7"/><path d="M4 7h16M10 11v6M14 11v6M9 4h6a1 1 0 011 1v2H8V5a1 1 0 011-1z"/></svg>Xóa'
        +'</button>'
      +'</div>'
    +'</div>';
  list.appendChild(card);
}

function fillCard(p){
  var fields = ['mst','tencty','sotokhai','diadiem','bks','socont','mathang','nguoikhai','laixe'];
  fields.forEach(function(k){
    var el = document.getElementById('f'+p.id+k);
    if(el) el.value = p[k] || '';
  });
}

function toggleCard(id){
  var body = document.getElementById('body-'+id);
  if(!body) return;
  setCollapse(id, !body.classList.contains('closed'));
}

var REQUIRED = ['mst','tencty','sotokhai','diadiem','bks','socont','mathang','nguoikhai'];

function setField(id, key, value){
  var p = phieus.find(function(x){return x.id===id;});
  if(!p) return;
  p[key] = value;
  var el = document.getElementById('f'+id+key);
  if(el && el.value !== value) el.value = value;

  if(key === 'sotokhai'){
    var err = document.getElementById('stkerr'+id);
    var chk = document.getElementById('stkchk'+id);
    if(!value){ el.className='fi'; if(err)err.classList.remove('show'); if(chk)chk.textContent=''; }
    else if(value.length===12){ el.className='fi ok'; if(err)err.classList.remove('show'); if(chk){chk.textContent='✓';chk.style.color='var(--green)';} }
    else{ el.className='fi bad'; if(err)err.classList.add('show'); if(chk)chk.textContent=''; }
  }
  refreshStatus(p);
}

function isReady(p){
  return REQUIRED.every(function(k){return p[k]&&p[k].trim();}) && p.sotokhai.length===12;
}

function refreshStatus(p){
  var card  = document.getElementById('card-'+p.id);
  var spill = document.getElementById('spill-'+p.id);
  var title = document.getElementById('ctitle-'+p.id);
  var finfo = document.getElementById('finfo-'+p.id);

  var ok = isReady(p);
  if(card) card.className = 'phieu-card'+(ok?' ready':(p.sotokhai&&p.sotokhai.length>0&&p.sotokhai.length!==12?' errored':''));
  if(spill){ spill.textContent = ok?'Sẵn sàng ✓':'Chưa đủ'; spill.className='status-pill '+(ok?'sp-ready':'sp-pending'); }

  var preview = p.sotokhai||p.bks||p.tencty||'';
  if(title) title.innerHTML = 'Phiếu #'+p.id+(preview?' — <b>'+preview+'</b>':' — Chưa nhập')
    +'<span class="card-subtitle" id="csubtitle-'+p.id+'">'+(p.bks?' | '+p.bks:'')+'</span>';
  if(finfo) finfo.textContent = ok
    ? '✓ Sẵn sàng | STK: '+p.sotokhai+' | BKS: '+p.bks
    : 'Cần đủ 7 trường (*) và STK đúng 12 số';

  updateUI();
}

function updateUI(){
  var n  = phieus.length;
  var nr = phieus.filter(isReady).length;
  document.getElementById('cnt').textContent = n;
  var ca = document.getElementById('btn-clearall');
  if(ca) ca.style.display = n>0?'':'none';
  var pb = document.getElementById('print-bar');
  if(pb) pb.style.display = n>0?'':'none';
  var pt = document.getElementById('pb-title');
  var ps = document.getElementById('pb-sub');
  if(pt) pt.textContent = nr+'/'+n+' phiếu sẵn sàng in';
  if(ps) ps.textContent = nr<n
    ? '⚠ '+(n-nr)+' phiếu chưa đủ thông tin sẽ bị bỏ qua khi in'
    : n>0?'✓ Tất cả phiếu đã đủ thông tin':'';
}

function fetchMST(id){
  var p = phieus.find(function(x){return x.id===id;});
  if(!p||!p.mst){ toast('Nhập MST trước khi tra cứu','error'); return; }
  var btn = document.getElementById('fbtn'+id);
  btn.innerHTML='<span class="spin">↻</span>';
  btn.disabled=true;
  fetch('https://api.vietqr.io/v2/business/'+p.mst)
    .then(function(r){return r.json();})
    .then(function(d){
      if(d.code==='00'&&d.data&&d.data.name){
        var el=document.getElementById('f'+id+'tencty');
        if(el) el.value=d.data.name;
        setField(id,'tencty',d.data.name);
        toast('Tìm thấy: '+d.data.name,'success');
      } else { toast('Không tìm thấy DN với MST này','error'); }
    })
    .catch(function(){ toast('Lỗi kết nối — nhập tay tên công ty','error'); })
    .finally(function(){
      btn.innerHTML='<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
      btn.disabled=false;
    });
}

function openPreview(){
  var list = phieus.filter(isReady);
  if(!list.length){ toast('Chưa có phiếu nào đủ thông tin','error'); return; }
  var body = document.getElementById('modal-body');
  body.innerHTML = '<div style="margin-bottom:10px;padding:8px 12px;background:var(--bg);border-radius:7px;font-size:13px">'
    +'<b>'+list.length+' phiếu</b> sẽ được in'+(phieus.length>list.length?' · <span style="color:var(--orange)">'+( phieus.length-list.length)+' phiếu bỏ qua</span>':'')
    +'</div>'
    +list.map(function(p){
      return '<div style="border:1px solid var(--border);border-radius:7px;padding:10px;margin-bottom:8px;font-size:12px">'
        +'<b style="font-size:13px">Phiếu #'+p.id+'</b>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;margin-top:6px">'
          +'<div><b>STK:</b> '+p.sotokhai+'</div>'
          +'<div><b>BKS:</b> '+p.bks+'</div>'
          +'<div><b>MST:</b> '+p.mst+'</div>'
          +'<div><b>Cont:</b> '+p.socont+'</div>'
          +'<div style="grid-column:1/-1"><b>DN:</b> '+p.tencty+'</div>'
          +'<div style="grid-column:1/-1"><b>Hàng:</b> '+p.mathang+'</div>'
          +(p.laixe?'<div><b>Lái xe:</b> '+p.laixe+'</div>':'')
        +'</div>'
      +'</div>';
    }).join('');
  document.getElementById('modal-preview').classList.add('open');
}
function closeModal(){ document.getElementById('modal-preview').classList.remove('open'); }
document.getElementById('modal-preview').addEventListener('click',function(e){if(e.target===this)closeModal();});

function doPrint(){
  var list = phieus.filter(isReady);
  if(!list.length){ toast('Không có phiếu nào sẵn sàng in','error'); return; }
  
  var loadingModal = document.getElementById('print-loading');
  loadingModal.classList.add('open');
  closeModal();

  var paper = document.getElementById('paper-select').value;

  Promise.all(list.map(function(p){
    return getQRDataURL(buildQRStr(p), 100).then(function(url){
      return {p:p, url:url};
    });
  })).then(function(items){
    var html = buildPrintHTML(items, paper);
    var out = document.getElementById('print-output');
    out.innerHTML = html;
    
    var style = document.getElementById('dynamic-page-style');
    if(!style){ style=document.createElement('style'); style.id='dynamic-page-style'; document.head.appendChild(style); }
    if(paper === 'a5'){
      style.textContent = '@media print{ @page{size:A5 landscape;margin:6mm} .print-pair{page-break-after:always} }';
    } else {
      style.textContent = '@media print{ @page{size:A4 portrait;margin:8mm 6mm} }';
    }
    
    var images = Array.from(out.querySelectorAll('img'));
    var loadedCount = 0;
    var totalImages = images.length;
    var hasPrinted = false;

    function finalize() {
      if(hasPrinted) return;
      hasPrinted = true;
      loadingModal.classList.remove('open');
      setTimeout(function(){ window.print(); }, 150);
    }

    if (totalImages === 0) {
      finalize();
    } else {
      var fallbackTimer = setTimeout(finalize, 4000);

      images.forEach(function(img) {
        if (img.complete) {
          loadedCount++;
          if (loadedCount === totalImages) { clearTimeout(fallbackTimer); finalize(); }
        } else {
          img.onload = img.onerror = function() {
            loadedCount++;
            if (loadedCount === totalImages) { clearTimeout(fallbackTimer); finalize(); }
          };
        }
      });
    }
  }).catch(function(){
     loadingModal.classList.remove('open');
     toast('Có lỗi xảy ra khi tạo QR! Vui lòng thử lại.','error');
  });
}

function buildPrintHTML(items, paper){
  var now = new Date();
  var ts = pad(now.getHours())+':'+pad(now.getMinutes())+' '+pad(now.getDate())+'/'+pad(now.getMonth()+1)+'/'+now.getFullYear();

  function pad(n){ return String(n).padStart(2,'0'); }

  function ticketHTML(item){
    var p = item.p;
    var qrURL = item.url || '';

    return '<div class="ticket-double">'
      +'<div class="ticket-side">'
        +'<div class="t-dept">CHI CỤC HẢI QUAN KHU VỰC XVI<br><span class="t-dept-sub">HẢI QUAN CỬA KHẨU TÀ LÙNG</span></div>'
        +'<div class="t-meta">'
          +'<span>Số: ....................</span>'
          +'<span>Ngày: ....................</span>'
        +'</div>'
        +'<div class="t-title">PHIẾU ĐĂNG KÝ PTVT CHỞ HÀNG XUẤT KHẨU (HQ)</div>'
        +'<div class="t-body">'
          +'<div class="t-fields">'
            +'<div class="tf"><span class="tf-l">1. Số tờ khai:</span><span class="tf-v"><b>'+p.sotokhai+'</b></span></div>'
            +'<div class="tf"><span class="tf-l">2. Biển kiểm soát:</span><span class="tf-v"><b>'+p.bks+'</b></span></div>'
            +'<div class="tf"><span class="tf-l">3. Số container:</span><span class="tf-v">'+p.socont+'</span></div>'
            +'<div class="tf"><span class="tf-l">4. Địa điểm:</span><span class="tf-v">'+p.diadiem+'</span></div>'
            +'<div class="tf"><span class="tf-l">5. Mặt hàng:</span><span class="tf-v">'+p.mathang+'</span></div>'
            +'<div class="tf"><span class="tf-l">6. Doanh nghiệp:</span><span class="tf-v">'+p.nguoikhai+'</span></div>'
            +'<div class="tf"><span class="tf-l">7. Tên lái xe:</span><span class="tf-v">'+(p.laixe||'..........................................')+'</span></div>'
            +'<div class="tf"><span class="tf-l">8. Mã số thuế:</span><span class="tf-v">'+p.mst+'</span></div>'
            +'<div class="tf"><span class="tf-l">9. Tên công ty:</span><span class="tf-v">'+p.tencty+'</span></div>'
          +'</div>'
          +'<div class="t-qr-zone">'
            +'<div class="t-qr-lbl" style="margin-bottom:3px;">CC Giám sát</div>'
            +'<div class="t-stamp-box"></div>'
          +'</div>'
        +'</div>'
        +'<div class="t-foot">'
          +'<span>MST: '+p.mst+'</span>'
          +'<span>In: '+ts+'</span>'
        +'</div>'
      +'</div>'
      +'<div class="ticket-side">'
        +'<div class="t-dept">CHI CỤC HẢI QUAN KHU VỰC XVI<br><span class="t-dept-sub">HẢI QUAN CỬA KHẨU TÀ LÙNG</span></div>'
        +'<div class="t-title">ĐKPT CHỞ HÀNG XUẤT KHẨU (DN)</div>'
        +'<div class="t-body">'
        +'<div class="t-fields">'
            +'<div class="t-dn-rows">'
            +'<div class="t-dn-row" style="display:flex;gap:4mm;">'
                +'<div class="t-dn-cell" style="flex:1;">'
                +'<div class="t-dn-lbl">1. BKS:</div>'
                +'<div class="t-dn-val big">'+p.bks+'</div>'
                +'</div>'
                +'<div class="t-dn-cell" style="flex:1;">'
                +'<div class="t-dn-lbl">2. Số TK:</div>'
                +'<div class="t-dn-val big">'+p.sotokhai+'</div>'
                +'</div>'
            +'</div>'
            +'<div class="t-dn-row" style="display:flex;gap:4mm;margin-top:8mm;">'
                +'<div class="t-dn-cell" style="flex:1;">'
                +'<div class="t-dn-lbl">3. NGÀY XC:</div>'
                +'<div class="t-stamp-box-small"></div>'
                +'</div>'
                +'<div class="t-dn-cell" style="flex:1;">'
                +'<div class="t-dn-lbl">4. NGÀY NC:</div>'
                +'<div class="t-stamp-box-small"></div>'
                +'</div>'
            +'</div>'
            +'</div>'
        +'</div>'
        +'<div class="t-qr-zone">'
            +(qrURL
            ? '<div class="t-qr-box"><img src="'+qrURL+'" style="width:100%;height:100%;display:block"/></div>'
            : '<div class="t-qr-box"><span style="font-size:7pt;color:#aaa;text-align:center;padding:2px;">QR</span></div>'
            )
            +'<div class="t-qr-lbl">Mã quét Excel</div>'
        +'</div>'
        +'</div>'
        +'<div class="t-foot"><span style="width:100%;text-align:right">In: '+ts+'</span></div>'
      +'</div>'
    +'</div>';
  }

  if(paper === 'a5'){
    return items.map(function(item, i){
      return '<div class="print-pair">' + ticketHTML(item) + '</div>';
    }).join('');
  } else {
    var pages = [];
    for(var i=0; i<items.length; i+=2){
      var top = items[i];
      var bot = items[i+1];
      pages.push(
        '<div class="print-pair">'
          + ticketHTML(top)
          + (bot ? '<hr class="cut-line"><div style="margin-top:2mm">' + ticketHTML(bot) + '</div>' : '')
        + '</div>'
      );
    }
    return pages.join('');
  }
}

function toast(msg, type){
  var c = document.getElementById('toaster');
  var t = document.createElement('div');
  t.className = 'toast t-'+(type||'info');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function(){
    t.style.animation='tOut .25s ease forwards';
    setTimeout(function(){t.remove();},260);
  }, 2600);
}