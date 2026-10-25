(function(){
"use strict";
var CFG=window.APP_CONFIG||{},SHOP={name:"The Gentlemen's Barber",address:"12 Main Boulevard, Gulberg, Lahore",phone:"+92 300 1234567",tel:"+923001234567",email:"hello@gentlemensbarber.com",open:10,close:20,step:30};
var sb=null;
try{if(window.supabase&&CFG.supabaseUrl&&CFG.supabaseKey&&CFG.supabaseUrl.indexOf("YOUR_")<0)sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey)}catch(e){sb=null}
var SERVICES=[];
function norm(r){return{name:r.name,price:r.price,sale:r.sale_price,min:r.duration,desc:r.description||"",popular:!!r.popular,active:r.active!==false,sort:r.sort}}
function priceHtml(s){return s.sale!=null&&s.sale<s.price?'<s class="meta">'+rs(s.price)+'</s> '+rs(s.sale)+' <span class="tag sale">Sale</span>':rs(s.price)}
function loadServices(){if(!sb)return Promise.resolve();return sb.from("services").select("*").eq("active",true).order("sort",{ascending:true}).order("name",{ascending:true}).then(function(r){if(!r.error)SERVICES=(r.data||[]).map(norm);return r})}
var $=function(s,r){return(r||document).querySelector(s)};
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML}
function rs(n){return"Rs "+Number(n).toLocaleString("en-US")}
function digits(s){return String(s).replace(/\D/g,"")}
function mins(t){var p=t.split(":");return+p[0]*60+ +p[1]}
function hm(m){return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")}
function iso(y,m,d){return y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0")}
function pretty(d,t){var p=d.split("-");return new Date(p[0],p[1]-1,p[2]).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"})+" at "+String(t).slice(0,5)}
function svcByName(n){return SERVICES.filter(function(s){return s.name===n})[0]}
function nowPK(){var o={};new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Karachi",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date()).forEach(function(x){o[x.type]=x.value});
 return{date:o.year+"-"+o.month+"-"+o.day,mins:(+o.hour%24)*60+ +o.minute,y:+o.year,m:+o.month-1}}
 
var page=document.body.getAttribute("data-page");
var nav=[["index","index.html","Home"],["services","services.html","Services"],["book","book.html","Book"],["my-bookings","my-bookings.html","My Bookings"],["contact","contact.html","Contact"]].map(function(l){return'<a href="'+l[1]+'"'+(page===l[0]?' class="on" aria-current="page"':"")+">"+l[2]+"</a>"}).join("");
var hours='<p>Monday \u2013 Friday: 10:00 \u2013 20:00</p><p>Saturday: 10:00 \u2013 20:00</p><p>Sunday: Closed</p>';
var h=$("#site-header");if(h)h.outerHTML='<div class="pole"></div><header class="site"><div class="wrap"><a class="logo" href="index.html">'+esc(SHOP.name)+'</a><nav aria-label="Main">'+nav+'<a class="cta" href="book.html">Book Now</a></nav></div></header>';
var f=$("#site-footer");if(f)f.outerHTML='<footer class="site"><div class="wrap"><div><h3>'+esc(SHOP.name)+'</h3><p>'+esc(SHOP.address)+'</p></div><div><h3>Hours</h3>'+hours+'</div><div><h3>Contact</h3><p><a href="tel:'+SHOP.tel+'">'+SHOP.phone+'</a></p><p><a href="mailto:'+SHOP.email+'">'+SHOP.email+'</a></p><p><a href="auth.html">Owner Login</a></p></div></div></footer>';
if(!sb&&["book","my-bookings","auth","dashboard"].indexOf(page)>-1)$("main").insertAdjacentHTML("afterbegin",'<div class="wrap"><div class="msg err" role="alert">Online booking is not connected yet. Add your Supabase URL and key in js/config.js.</div></div>');
 
var pl=$("#popular"),sl=$("#services");
if(pl||sl)loadServices().then(function(r){
 if(!r||r.error){var m='<p class="meta">Could not load services. Please refresh.</p>';if(pl)pl.innerHTML=m;if(sl)sl.innerHTML=m;return}
 if(pl){var pop=SERVICES.filter(function(s){return s.popular});pl.innerHTML=pop.length?pop.map(function(s){return"<li><span>"+esc(s.name)+'</span><span class="price">'+priceHtml(s)+"</span></li>"}).join(""):'<li class="meta">Services coming soon.</li>'}
 if(sl)sl.innerHTML=SERVICES.length?SERVICES.map(function(s){return'<article class="card svc"><div><h3>'+esc(s.name)+'</h3><p style="margin:0">'+esc(s.desc)+'</p><p class="meta" style="margin:4px 0 0">'+s.min+' min</p></div><div style="text-align:right"><p class="price" style="margin:0 0 8px">'+priceHtml(s)+'</p><a class="btn sm" href="book.html?service='+encodeURIComponent(s.name)+'">Book this</a></div></article>'}).join(""):'<p class="meta">Services coming soon.</p>'});
 
/* BOOK */
if(page==="book"){
 var n0=nowPK(),st={svc:null,date:null,time:null,y:n0.y,m:n0.m,booked:[],busy:false,req:0};
 
 var sBox=$("#svc-list"),cal=$("#cal"),tBox=$("#times"),form=$("#book-form"),out=$("#book-msg"),submit=form.querySelector("button[type=submit]");
 function slots(){
  var d=st.date.split("-"),out=[];if(new Date(d[0],d[1]-1,d[2]).getDay()===0)return out;var n=nowPK();
  for(var t=SHOP.open*60;t+st.svc.min<=SHOP.close*60;t+=SHOP.step){
   var ok=!(n.date===st.date&&t<=n.mins)&&!st.booked.some(function(r){return t<r[1]&&t+st.svc.min>r[0]});out.push({t:hm(t),ok:ok})}
  return out}
 function rSvc(){sBox.innerHTML=SERVICES.map(function(s,i){return'<button type="button" class="opt'+(st.svc===s?" sel":"")+'" data-i="'+i+'" aria-pressed="'+(st.svc===s)+'"><span>'+esc(s.name)+" \u00b7 "+s.min+' min</span><span class="price">'+priceHtml(s)+"</span></button>"}).join("")}
 function rCal(){
  var first=new Date(st.y,st.m,1),dim=new Date(st.y,st.m+1,0).getDate(),today=nowPK().date;
  var html='<div class="cal-h"><button type="button" class="btn sm alt" id="pv" aria-label="Previous month">&lsaquo;</button><span>'+first.toLocaleDateString("en-GB",{month:"long",year:"numeric"})+'</span><button type="button" class="btn sm alt" id="nx" aria-label="Next month">&rsaquo;</button></div><div class="cal-g">';
  ["Su","Mo","Tu","We","Th","Fr","Sa"].forEach(function(d){html+="<b>"+d+"</b>"});
  for(var i=0;i<first.getDay();i++)html+="<span></span>";
  for(var d=1;d<=dim;d++){var ds=iso(st.y,st.m,d),dis=ds<today||new Date(st.y,st.m,d).getDay()===0;
   html+='<button type="button" class="day'+(st.date===ds?" sel":"")+'" data-d="'+ds+'"'+(dis?" disabled":"")+">"+d+"</button>"}
  cal.innerHTML=html+"</div>";
  $("#pv").disabled=st.y*12+st.m<=n0.y*12+n0.m;
  $("#pv").onclick=function(){st.m--;if(st.m<0){st.m=11;st.y--}rCal()};
  $("#nx").onclick=function(){st.m++;if(st.m>11){st.m=0;st.y++}rCal()}}
 function rTimes(msg){
  if(msg){tBox.innerHTML='<p class="meta">'+esc(msg)+"</p>";return}
  if(!st.date){tBox.innerHTML='<p class="meta">Select a date first.</p>';return}
  if(!st.svc){tBox.innerHTML='<p class="meta">Choose a service first.</p>';return}
  var s=slots();
  if(!s.length){tBox.innerHTML='<p class="meta">No times available on this date.</p>';return}
  if(!s.some(function(x){return x.ok})){tBox.innerHTML='<p class="meta">Fully booked. Please pick another date.</p>';return}
  tBox.innerHTML='<div class="slots">'+s.map(function(x){return'<button type="button" class="slot'+(st.time===x.t?" sel":"")+'" data-t="'+x.t+'"'+(x.ok?"":" disabled")+">"+x.t+"</button>"}).join("")+"</div>"}
 function loadTimes(){
  if(!st.date||!st.svc||!sb){rTimes();return Promise.resolve()}
  var my=++st.req;rTimes("Loading times\u2026");
  return sb.rpc("get_booked_slots",{p_date:st.date}).then(function(r){
   if(my!==st.req)return;
   if(r.error){rTimes("Could not load times. Please refresh and try again.");return}
   st.booked=(r.data||[]).map(function(x){var s=mins(x.slot_time);return[s,s+x.slot_minutes]});rTimes()})}
 sBox.onclick=function(e){var b=e.target.closest(".opt");if(!b)return;st.svc=SERVICES[+b.dataset.i];st.time=null;rSvc();loadTimes()};
 cal.onclick=function(e){var b=e.target.closest(".day");if(!b||b.disabled)return;st.date=b.dataset.d;st.time=null;rCal();loadTimes()};
 tBox.onclick=function(e){var b=e.target.closest(".slot");if(!b||b.disabled)return;st.time=b.dataset.t;rTimes()};
 function say(cls,html){out.className="msg "+cls;out.innerHTML=html;out.scrollIntoView({block:"center"})}
 form.onsubmit=function(e){e.preventDefault();if(st.busy)return;
  var name=form.name.value.trim(),email=form.email.value.trim(),phone=form.phone.value.trim();
  if(!sb)return say("err","Online booking is not connected yet.");
  if(!st.svc)return say("err","Please choose a service.");if(!st.date)return say("err","Please pick a date.");if(!st.time)return say("err","Please pick a time.");
  if(name.length<2)return say("err","Please enter your full name.");
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return say("err","Please enter a valid email address.");
  if(digits(phone).length<7)return say("err","Please enter a valid phone number.");
  st.busy=true;submit.disabled=true;submit.textContent="Booking\u2026";
  sb.rpc("create_booking",{p_service:st.svc.name,p_date:st.date,p_time:st.time,p_name:name,p_email:email,p_phone:phone,p_notes:form.notes.value.trim()}).then(function(r){
   st.busy=false;submit.disabled=false;submit.textContent="Confirm Booking";
   if(r.error){st.time=null;loadTimes();return say("err",esc(r.error.message||"Booking failed. Please try again."))}
   var ok="<strong>Booking confirmed.</strong> "+esc(st.svc.name)+" on "+esc(pretty(st.date,st.time))+". Use your email and phone in <a href='my-bookings.html'>My Bookings</a> to view or cancel it.";
   form.reset();st.time=null;st.date=null;rCal();rTimes();say("ok",ok)})};
 loadServices().then(function(r){var q=new URLSearchParams(location.search).get("service");if(q){var f=SERVICES.filter(function(s){return s.name===q})[0];if(f)st.svc=f}if(!SERVICES.length)sBox.innerHTML='<p class="meta">No services available right now.</p>';else rSvc();rCal();loadTimes()})}
 
/* MY BOOKINGS */
if(page==="my-bookings"){
 var lf=$("#lookup"),lo=$("#results");
 function show(email,phone){
  lo.innerHTML='<p class="meta">Searching\u2026</p>';
  sb.rpc("lookup_bookings",{p_email:email,p_phone:phone}).then(function(r){
   if(r.error){lo.innerHTML='<div class="msg err">Could not load bookings. Please try again.</div>';return}
   var n=nowPK(),list=r.data||[];
   if(!list.length){lo.innerHTML='<div class="msg err">No bookings found for that email and phone.</div>';return}
   lo.innerHTML=list.map(function(b){var up=b.status==="confirmed"&&(b.booking_date+" "+b.booking_time)>=(n.date+" "+hm(n.mins));
    return'<article class="card svc" style="margin-top:12px"><div><h3>'+esc(b.service)+'</h3><p style="margin:0">'+esc(pretty(b.booking_date,b.booking_time))+'</p><p class="meta" style="margin:2px 0">'+rs(b.price)+" \u00b7 "+b.duration+' min</p><span class="tag '+esc(b.status)+'">'+esc(b.status)+"</span></div>"+(up?'<button class="btn sm" data-c="'+esc(b.id)+'">Cancel booking</button>':"")+"</article>"}).join("");
   lo.onclick=function(e){var c=e.target.closest("[data-c]");if(!c||!confirm("Cancel this booking?"))return;
    sb.rpc("cancel_booking",{p_id:c.dataset.c,p_email:email,p_phone:phone}).then(function(x){
     if(x.error||!x.data){alert("Could not cancel. Please call us.");return}show(email,phone)})}})}
 lf.onsubmit=function(e){e.preventDefault();if(!sb)return;show(lf.email.value.trim().toLowerCase(),digits(lf.phone.value))}}
 
/* OWNER LOGIN */
if(page==="auth"&&sb){
 sb.auth.getSession().then(function(r){if(r.data&&r.data.session)location.replace("dashboard.html")});
 var af=$("#auth-form"),am=$("#auth-msg");
 af.onsubmit=function(e){e.preventDefault();am.className="";am.textContent="";
  sb.auth.signInWithPassword({email:af.email.value.trim(),password:af.password.value}).then(function(r){
   if(r.error){am.className="msg err";am.textContent="Incorrect email or password.";return}location.href="dashboard.html"})}}
 
/* DASHBOARD */
if(page==="dashboard"&&sb){
 sb.auth.getSession().then(function(r){if(!r.data||!r.data.session)location.replace("auth.html");else initDash()});
 var initDash=function(){
  var tb=$("#rows"),fs=$("#f-status"),fd=$("#f-date"),fq=$("#f-q"),all=[];
  $("#logout").onclick=function(){sb.auth.signOut().then(function(){location.href="auth.html"})};
  function draw(){
   var today=nowPK().date,conf=all.filter(function(b){return b.status==="confirmed"});
   $("#s-today").textContent=conf.filter(function(b){return b.booking_date===today}).length;
   $("#s-up").textContent=conf.filter(function(b){return b.booking_date>=today}).length;
   $("#s-total").textContent=all.length;
   $("#s-rev").textContent=rs(all.filter(function(b){return b.status==="completed"}).reduce(function(a,b){return a+b.price},0));
   var q=fq.value.trim().toLowerCase(),rows=all.filter(function(b){return(!fs.value||b.status===fs.value)&&(!fd.value||b.booking_date===fd.value)&&(!q||(b.name+b.email+b.phone+b.service).toLowerCase().indexOf(q)>-1)});
   tb.innerHTML=rows.length?rows.map(function(b){return"<tr><td>"+esc(pretty(b.booking_date,b.booking_time))+"</td><td>"+esc(b.name)+"<br><span class='meta'>"+esc(b.email)+"<br>"+esc(b.phone)+"</span></td><td>"+esc(b.service)+"<br><span class='meta'>"+rs(b.price)+"</span></td><td>"+esc(b.notes)+"</td><td><span class='tag "+esc(b.status)+"'>"+esc(b.status)+"</span></td><td><select data-s='"+esc(b.id)+"' aria-label='Change status'>"+["confirmed","completed","cancelled"].map(function(s){return"<option"+(s===b.status?" selected":"")+">"+s+"</option>"}).join("")+"</select> <button class='btn sm alt' data-x='"+esc(b.id)+"'>Delete</button></td></tr>"}).join(""):"<tr><td colspan='6'>No bookings match.</td></tr>"}
  function refresh(){return sb.from("bookings").select("*").order("booking_date",{ascending:true}).order("booking_time",{ascending:true}).then(function(r){
   if(r.error){tb.innerHTML="<tr><td colspan='6'>Could not load bookings: "+esc(r.error.message)+"</td></tr>";return}all=r.data||[];draw()})}
  tb.onchange=function(e){var id=e.target.dataset.s;if(!id)return;sb.from("bookings").update({status:e.target.value}).eq("id",id).then(function(r){if(r.error)alert("Update failed: "+r.error.message);refresh()})};
  tb.onclick=function(e){var x=e.target.closest("[data-x]");if(!x||!confirm("Delete this booking permanently?"))return;sb.from("bookings").delete().eq("id",x.dataset.x).then(function(r){if(r.error)alert("Delete failed: "+r.error.message);refresh()})};
  [fs,fd,fq].forEach(function(el){el.oninput=draw});$("#clear").onclick=function(){fs.value="";fd.value="";fq.value="";draw()};
  var sv=[],editing=null,sf=$("#svc-form"),sr=$("#svc-rows"),smsg=$("#sv-msg");
  function sayS(c,t){smsg.className="msg "+c;smsg.textContent=t}
  function resetF(){editing=null;sf.reset();$("#svc-title").textContent="Add a service";$("#sv-save").textContent="Add service";$("#sv-cancel").hidden=true}
  function drawS(){sr.innerHTML=sv.length?sv.map(function(s,i){return"<tr><td>"+s.sort+"</td><td>"+esc(s.name)+"<br><span class='meta'>"+esc(s.desc)+"</span></td><td>"+priceHtml(s)+"</td><td>"+s.min+" min</td><td><input type='checkbox' data-p='"+i+"' "+(s.popular?"checked":"")+" aria-label='Popular'></td><td><input type='checkbox' data-a='"+i+"' "+(s.active?"checked":"")+" aria-label='Visible'></td><td><button class='btn sm alt' data-e='"+i+"'>Edit</button> <button class='btn sm alt' data-d='"+i+"'>Delete</button></td></tr>"}).join(""):"<tr><td colspan='7'>No services yet.</td></tr>"}
  function loadS(){return sb.from("services").select("*").order("sort",{ascending:true}).order("name",{ascending:true}).then(function(r){if(r.error){sr.innerHTML="<tr><td colspan='7'>Could not load services: "+esc(r.error.message)+"</td></tr>";return}sv=(r.data||[]).map(norm);drawS()})}
  sf.onsubmit=function(e){e.preventDefault();
   var price=parseInt($("#sv-price").value,10),saleRaw=$("#sv-sale").value.trim(),sale=saleRaw===""?null:parseInt(saleRaw,10),dur=parseInt($("#sv-dur").value,10),name=$("#sv-name").value.trim();
   if(!name||isNaN(price)||price<0||isNaN(dur)||dur<5)return sayS("err","Please fill in the name, price and duration.");
   if(sale!==null&&(isNaN(sale)||sale<0||sale>=price))return sayS("err","The sale price must be lower than the normal price.");
   var row={name:name,price:price,sale_price:sale,duration:dur,sort:parseInt($("#sv-sort").value,10)||0,description:$("#sv-desc").value.trim(),popular:$("#sv-pop").checked,active:$("#sv-act").checked};
   var req=editing?sb.from("services").update(row).eq("name",editing):sb.from("services").insert(row);
   req.then(function(r){if(r.error)return sayS("err",r.error.code==="23505"?"A service with that name already exists.":"Could not save: "+r.error.message);resetF();sayS("ok","Saved. The website is updated.");loadS()})};
  $("#sv-cancel").onclick=resetF;
  sr.onclick=function(e){var b=e.target.closest("button");if(!b)return;
   if(b.dataset.e!=null){var s=sv[+b.dataset.e];editing=s.name;$("#sv-name").value=s.name;$("#sv-price").value=s.price;$("#sv-sale").value=s.sale==null?"":s.sale;$("#sv-dur").value=s.min;$("#sv-sort").value=s.sort;$("#sv-desc").value=s.desc;$("#sv-pop").checked=s.popular;$("#sv-act").checked=s.active;$("#svc-title").textContent="Edit service";$("#sv-save").textContent="Save changes";$("#sv-cancel").hidden=false;sayS("","");smsg.className="";sf.scrollIntoView({block:"center"})}
   else if(b.dataset.d!=null){var d=sv[+b.dataset.d];if(!confirm('Delete "'+d.name+'"?'))return;sb.from("services").delete().eq("name",d.name).then(function(r){if(r.error)sayS("err",r.error.code==="23503"?"This service has bookings, so it cannot be deleted. Untick Visible to hide it instead.":"Delete failed: "+r.error.message);else sayS("ok","Deleted.");loadS()})}};
  sr.onchange=function(e){var t=e.target,i=t.dataset.p!=null?t.dataset.p:t.dataset.a;if(i==null)return;var s=sv[+i];sb.from("services").update(t.dataset.p!=null?{popular:t.checked}:{active:t.checked}).eq("name",s.name).then(function(r){if(r.error)alert("Update failed: "+r.error.message);loadS()})};
  refresh();loadS()}}
})();
 
