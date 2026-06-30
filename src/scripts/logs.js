import { db, getFormattedDate, getFormattedTime } from './db.js';

(function () {
  "use strict";

  var app = document.querySelector("[data-log-app]");
  if (!app) return;

  function loadLogs() { return db.getLogs(); }

  var labels = {
    module:{accounts:"Tài khoản",products:"Sản phẩm",orders:"Đơn hàng",reviews:"Đánh giá",support:"Đổi trả & CSKH",pricing:"Giá & Khuyến mãi",promotions:"Giá & Khuyến mãi",ai:"AI",system:"Hệ thống"},
    result:{success:"Thành công",failed:"Thất bại",denied:"Bị từ chối",conflict:"Xung đột dữ liệu",warning:"Cảnh báo"},
    severity:{normal:"Bình thường",attention:"Cần chú ý",critical:"Nghiêm trọng"}
  };
  var state = {tab:"all",search:"",module:"",result:"",period:"7"};
  var selectedLog = null;
  var panel = document.querySelector("#log-panel");
  var overlay = document.querySelector("#log-overlay");

  function icon(name) { return '<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#' + name + '"></use></svg>'; }
  function badgeResult(value) { return '<span class="admin-badge admin-log-result--' + value + '">' + labels.result[value] + '</span>'; }
  function badgeSeverity(value) { return '<span class="admin-badge admin-log-severity--' + value + '">' + labels.severity[value] + '</span>'; }
  function moduleBadge(value) { return '<span class="admin-log-module">' + labels.module[value] + '</span>'; }
  function showToast(message) { var toast=document.querySelector("#log-toast");toast.textContent=message;toast.hidden=false;window.clearTimeout(showToast.timer);showToast.timer=window.setTimeout(function(){toast.hidden=true;},2400); }

  function filterMarkup() {
    return '<form class="admin-filter-bar admin-log-filter" data-log-filter><label class="admin-search-field">' + icon("search") + '<input class="admin-form-control" type="search" data-log-search placeholder="Tìm mã đối tượng, Admin, IP hoặc hành động..."></label><select class="admin-form-control" data-log-module><option value="">Tất cả phân hệ</option><option value="accounts">Tài khoản</option><option value="products">Sản phẩm</option><option value="orders">Đơn hàng</option><option value="reviews">Đánh giá</option><option value="support">Đổi trả & CSKH</option><option value="promotions">Giá & Khuyến mãi</option><option value="ai">AI</option><option value="system">Hệ thống</option></select><select class="admin-form-control" data-log-result><option value="">Tất cả kết quả</option><option value="success">Thành công</option><option value="failed">Thất bại</option><option value="denied">Bị từ chối</option><option value="conflict">Xung đột dữ liệu</option><option value="warning">Cảnh báo</option></select><select class="admin-form-control" data-log-period><option value="today">Hôm nay</option><option value="7">7 ngày qua</option><option value="30">30 ngày qua</option></select><button class="admin-btn admin-btn--filter admin-btn--sm" type="submit">Lọc</button><button class="admin-btn admin-btn--ghost admin-btn--sm" type="button" data-log-reset>Đặt lại</button></form>';
  }

  function filteredLogs() {
    var logs = loadLogs();
    var query=state.search.toLowerCase();
    return logs.filter(function(log){
      var tabMatch=state.tab==="all"||log.type===state.tab;
      var searchMatch=!query||(log.id+log.actor+log.ip+log.actionLabel+log.target+log.targetName).toLowerCase().includes(query);
      var moduleMatch=!state.module||log.module===state.module||(state.module==="promotions"&&log.module==="pricing");
      return tabMatch&&searchMatch&&moduleMatch&&(!state.result||log.result===state.result);
    });
  }

  function genericRows(list) {
    return list.map(function(log){return '<tr><td><span class="admin-log-time">'+log.time+'<small>'+log.clock+'</small></span></td><td><span class="admin-log-actor"><strong>'+log.actor+'</strong><small>'+log.actorId+'</small></span></td><td><span class="admin-log-role">'+log.role+'</span></td><td>'+moduleBadge(log.module)+'</td><td><span class="admin-log-action">'+log.actionLabel+'</span></td><td><span class="admin-log-target"><strong>'+log.target+'</strong><small>'+log.targetName+'</small></span></td><td>'+badgeResult(log.result)+'</td><td>'+badgeSeverity(log.severity)+'</td><td><button class="admin-icon-button admin-icon-button--sm" type="button" title="Xem chi tiết" aria-label="Xem chi tiết" data-log-detail="'+log.id+'">'+icon("eye")+'</button></td></tr>';}).join("");
  }

  function genericTable(list) {
    return '<div class="admin-table-wrap"><table class="admin-table admin-log-table"><thead><tr><th>Thời gian</th><th>Admin</th><th>Vai trò</th><th>Phân hệ</th><th>Hành động</th><th>Đối tượng</th><th>Kết quả</th><th>Mức độ</th><th>Thao tác</th></tr></thead><tbody>'+genericRows(list)+'</tbody></table></div>';
  }

  function systemTable(list) {
    return '<div class="admin-table-wrap"><table class="admin-table admin-log-table"><thead><tr><th>Thời gian</th><th>Loại sự kiện</th><th>Phân hệ</th><th>Mô tả</th><th>Mức độ</th><th>Trạng thái xử lý</th><th>Thao tác</th></tr></thead><tbody>'+list.map(function(log){return '<tr><td><span class="admin-log-time">'+log.time+'<small>'+log.clock+'</small></span></td><td><strong>'+log.actionLabel+'</strong><br><small>'+log.id+'</small></td><td>'+moduleBadge(log.module)+'</td><td><span class="admin-log-action">'+log.summary+'</span></td><td>'+badgeSeverity(log.severity)+'</td><td><span class="admin-badge admin-badge--'+(log.handling==="Mới"?"danger":"warning")+'">'+log.handling+'</span></td><td><button class="admin-icon-button admin-icon-button--sm" type="button" title="Xem chi tiết" aria-label="Xem chi tiết" data-log-detail="'+log.id+'">'+icon("eye")+'</button></td></tr>';}).join("")+'</tbody></table></div>';
  }

  function aiTable(list) {
    return '<div class="admin-table-wrap"><table class="admin-table admin-log-table"><thead><tr><th>Thời gian</th><th>Loại log</th><th>Người dùng / Session</th><th>Tương tác</th><th>CTR</th><th>Chuyển CSKH</th><th>Kết quả</th><th>Thao tác</th></tr></thead><tbody>'+list.map(function(log){return '<tr><td><span class="admin-log-time">'+log.time+'<small>'+log.clock+'</small></span></td><td><strong>'+log.actionLabel+'</strong><br><small>'+log.id+'</small></td><td><span class="admin-log-target"><strong>'+log.actorId+'</strong><small>'+log.target+'</small></span></td><td>'+log.ai.interaction+'</td><td>'+(log.ai.ctr||"—")+'</td><td><span class="admin-badge admin-badge--'+(log.context["Chuyển CSKH"]==="Có"?"warning":"neutral")+'">'+log.context["Chuyển CSKH"]+'</span></td><td>'+badgeResult(log.result)+'</td><td><button class="admin-icon-button admin-icon-button--sm" type="button" title="Xem chi tiết" aria-label="Xem chi tiết" data-log-detail="'+log.id+'">'+icon("eye")+'</button></td></tr>';}).join("")+'</tbody></table></div>';
  }

  function emptyState() { return '<div class="admin-log-empty">'+icon("search")+'<strong>Không tìm thấy nhật ký phù hợp</strong><p>Hãy thử thay đổi từ khóa, phân hệ, hành động hoặc khoảng thời gian.</p><button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-log-reset>Đặt lại bộ lọc</button></div>'; }

  function syncControls() {
    var map={"[data-log-search]":"search","[data-log-module]":"module","[data-log-result]":"result","[data-log-period]":"period"};
    Object.keys(map).forEach(function(selector){var control=document.querySelector(selector);if(control)control.value=state[map[selector]];});
  }

  function render() {
    var allLogs = loadLogs();
    var list=filteredLogs();
    var table=list.length?(state.tab==="system"?systemTable(list):state.tab==="ai"?aiTable(list):genericTable(list)):emptyState();
    panel.innerHTML=filterMarkup()+table+(list.length?'<div class="admin-log-footer"><p class="admin-table-note">Hiển thị '+list.length+' / '+allLogs.length+' nhật ký</p><nav class="admin-pagination"><button type="button" disabled>←</button><button class="is-active" type="button">1</button><button type="button">2</button><button type="button">→</button></nav></div>':'');
    syncControls();
  }

  function dataList(object) { return '<dl class="admin-data-list">'+Object.keys(object).map(function(key){return '<div><dt>'+key+'</dt><dd>'+object[key]+'</dd></div>';}).join("")+'</dl>'; }

  function drawerContent(tab) {
    var log=selectedLog;
    if(tab==="overview") return '<p class="admin-log-summary">'+log.summary+'</p>'+dataList({"Mã log":log.id,"Thời gian":log.time+" "+log.clock,"Người thực hiện":log.actor,"Vai trò":log.role,"Phân hệ":labels.module[log.module],"Hành động":log.actionLabel,"Đối tượng":log.target+" · "+log.targetName,"Kết quả":labels.result[log.result],"Mức độ":labels.severity[log.severity]});
    if(tab==="changes") {
      if(log.type==="ai") return '<p class="admin-log-summary">'+log.ai.interaction+'</p>'+dataList({"Sản phẩm đã click":log.ai.clicked,"Sản phẩm đã mua":log.ai.purchased});
      if(!log.changes.length) return '<div class="admin-log-empty">'+icon("log")+'<strong>Không có dữ liệu thay đổi</strong><p>Sự kiện này không phát sinh old_value và new_value.</p></div>';
      return '<table class="admin-log-compare"><thead><tr><th>Trường</th><th>Trước thay đổi</th><th>Sau thay đổi</th></tr></thead><tbody>'+log.changes.map(function(row){return '<tr><td>'+row[0]+'</td><td>'+row[1]+'</td><td>'+row[2]+'</td></tr>';}).join("")+'</tbody></table>';
    }
    if(tab==="context") {
      if(log.type==="ai") return dataList({"CTR":log.ai.ctr,"Sản phẩm click":log.ai.clicked,"Sản phẩm mua":log.ai.purchased,"Chuyển CSKH":log.context["Chuyển CSKH"]});
      return dataList(log.context);
    }
    return dataList({"IP address":log.ip,"User agent":"Chrome 126 · Windows 11","Session ID":"SES-"+log.id.slice(-6),"Mã lỗi":log.error||"—","Retry status":log.error?"Đang theo dõi":"Không áp dụng"})+'<h3 class="admin-drawer__section">Raw JSON</h3><pre class="admin-log-code">'+JSON.stringify({audit_id:log.id,actor_id:log.actorId,action:log.action,module:log.module,target_id:log.target,result:log.result,timestamp:log.time+" "+log.clock},null,2)+'</pre>';
  }

  function openDrawer(id) {
    var logs = loadLogs();
    selectedLog=logs.filter(function(log){return log.id===id;})[0];
    if(!selectedLog){showToast("Không thể tải chi tiết nhật ký.");return;}
    var second=selectedLog.type==="ai"?"Nội dung tương tác":"Trước / Sau thay đổi";
    var third=selectedLog.type==="ai"?"Hiệu quả":"Ngữ cảnh liên quan";
    overlay.innerHTML='<div class="admin-drawer-backdrop" data-log-close></div><aside class="admin-drawer admin-log-drawer" role="dialog" aria-modal="true"><header class="admin-drawer__header"><div class="admin-log-drawer__heading"><small>'+selectedLog.id+'</small><h2>Chi tiết nhật ký</h2><div class="admin-log-drawer__meta">'+badgeResult(selectedLog.result)+badgeSeverity(selectedLog.severity)+'<span class="admin-badge admin-badge--neutral">'+selectedLog.time+' '+selectedLog.clock+'</span></div></div><button class="admin-icon-button" type="button" data-log-close aria-label="Đóng">×</button></header><div class="admin-drawer__tabs"><button class="admin-drawer__tab is-active" type="button" data-log-drawer-tab="overview">Tổng quan</button><button class="admin-drawer__tab" type="button" data-log-drawer-tab="changes">'+second+'</button><button class="admin-drawer__tab" type="button" data-log-drawer-tab="context">'+third+'</button><button class="admin-drawer__tab" type="button" data-log-drawer-tab="technical">Kỹ thuật</button></div><div class="admin-drawer__body" data-log-drawer-body>'+drawerContent("overview")+'</div></aside>';
  }

  function openExport() {
    overlay.innerHTML='<div class="admin-modal-overlay"><section class="admin-modal admin-modal--lg" role="dialog" aria-modal="true" aria-labelledby="log-export-title"><header class="admin-modal__header"><div><p class="label-upper">Nhật ký hệ thống</p><h2 id="log-export-title">Xuất nhật ký hệ thống</h2></div><button class="admin-icon-button" type="button" data-log-close aria-label="Đóng">×</button></header><form class="admin-modal__body admin-log-export-form" id="log-export-form" data-log-export-form><label class="admin-form-group"><span class="admin-form-label">Khoảng thời gian</span><select class="admin-form-control"><option>Hôm nay</option><option selected>7 ngày qua</option><option>30 ngày qua</option><option>Tùy chọn</option></select></label><label class="admin-form-group"><span class="admin-form-label">Phân hệ</span><select class="admin-form-control"><option>Tất cả phân hệ</option><option>Tài khoản</option><option>Sản phẩm</option><option>Đơn hàng</option><option>Giá & Khuyến mãi</option><option>AI</option><option>Hệ thống</option></select></label><label class="admin-form-group"><span class="admin-form-label">Loại log</span><select class="admin-form-control"><option>Tất cả nhật ký</option><option>Thao tác Admin</option><option>Sự kiện hệ thống</option><option>Nhật ký AI</option></select></label><label class="admin-form-group"><span class="admin-form-label">Định dạng</span><select class="admin-form-control"><option>Excel</option><option>CSV</option><option>PDF</option></select></label><label class="admin-log-toggle admin-log-export-form__full"><input type="checkbox" checked> Bao gồm chi tiết dữ liệu trước / sau thay đổi</label></form><footer class="admin-modal__footer"><button class="admin-btn admin-btn--ghost" type="button" data-log-close>Hủy</button><button class="admin-btn admin-btn--secondary" type="submit" form="log-export-form">'+icon("download")+'Xuất nhật ký</button></footer></section></div>';
  }

  document.addEventListener("click",function(event){
    var tab=event.target.closest("[data-log-tab]");
    var detail=event.target.closest("[data-log-detail]");
    var drawerTab=event.target.closest("[data-log-drawer-tab]");
    var sidebarButton=event.target.closest("[data-log-sidebar]");
    if(tab){state.tab=tab.dataset.logTab;document.querySelectorAll("[data-log-tab]").forEach(function(button){button.classList.toggle("admin-tab--active",button===tab);});render();}
    if(detail)openDrawer(detail.dataset.logDetail);
    if(drawerTab){document.querySelectorAll("[data-log-drawer-tab]").forEach(function(button){button.classList.toggle("is-active",button===drawerTab);});document.querySelector("[data-log-drawer-body]").innerHTML=drawerContent(drawerTab.dataset.logDrawerTab);}
    if(event.target.closest("[data-log-close]"))overlay.innerHTML="";
    if(event.target.closest("[data-log-export]"))openExport();
    if(event.target.closest("[data-log-refresh]")){app.classList.add("admin-log-refreshing");window.setTimeout(function(){app.classList.remove("admin-log-refreshing");showToast("Đã tải lại nhật ký.");render();},650);}
    if(event.target.closest("[data-log-reset]")){state={tab:state.tab,search:"",module:"",result:"",period:"7"};render();}
    var alertButton=event.target.closest("[data-log-alert-result]");if(alertButton){state.result=alertButton.dataset.logAlertResult;state.tab="all";document.querySelectorAll("[data-log-tab]").forEach(function(button){button.classList.toggle("admin-tab--active",button.dataset.logTab==="all");});render();}
    if(sidebarButton){if(window.innerWidth>768){app.classList.toggle("admin-layout--sidebar-collapsed");}else{var sidebar=document.querySelector("#admin-sidebar");var backdrop=document.querySelector("[data-log-sidebar-close]");sidebar.classList.toggle("is-open");backdrop.hidden=!sidebar.classList.contains("is-open");}}
  });

  document.addEventListener("submit",function(event){
    if(event.target.matches("[data-log-filter]")){event.preventDefault();state.search=document.querySelector("[data-log-search]").value.trim();state.module=document.querySelector("[data-log-module]").value;state.result=document.querySelector("[data-log-result]").value;state.period=document.querySelector("[data-log-period]").value;render();if(!filteredLogs().length)showToast("Không tìm thấy dữ liệu phù hợp.");}
    if(event.target.matches("[data-log-export-form]")){event.preventDefault();overlay.innerHTML="";showToast("Đang xuất nhật ký.");window.setTimeout(function(){showToast("Xuất nhật ký thành công.");},700);}
  });

  document.querySelector("[data-log-sidebar-close]").addEventListener("click",function(){document.querySelector("#admin-sidebar").classList.remove("is-open");this.hidden=true;});
  document.addEventListener("keydown",function(event){if(event.key==="Escape")overlay.innerHTML="";});
  render();
}());
