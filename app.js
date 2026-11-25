/* Easy English - shared engine */
(function(){
'use strict';
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},del:function(k){try{localStorage.removeItem(k)}catch(e){}}};
function $(s,r){return (r||document).querySelector(s)}
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function rich(s){return esc(s).replace(/\*(.+?)\*/g,'<u>$1</u>')}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function slug(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').trim().replace(/[^a-z0-9\u0600-\u06ff ]/g,'').replace(/ /g,'_')||'guest'}
function norm(s){return String(s).toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[.!?,]+$/,'').replace(/\s+/g,' ').trim()}


/* ---------- my mistakes ---------- */
function qid(q){var s=q.q+'|'+JSON.stringify(q.o||q.a),h=5381;for(var i=0;i<s.length;i++){h=((h<<5)+h+s.charCodeAt(i))|0}return 'q'+(h>>>0).toString(36)}
function mkey(){return 'ee_m_'+slug(user())}
function getMiss(){var m=null;try{m=JSON.parse(store.get(mkey()))}catch(e){}return (m&&typeof m==='object'&&!m.length)?m:{}}
function putMiss(m){store.set(mkey(),JSON.stringify(m))}
function srcLabel(id,title){var m=/^(ol|al)(\d)-/.exec(id||'');var t=String(title||'').replace(/ \u00b7 Set \d+$/,'');return (m?m[1].toUpperCase()+' Unit '+m[2]+' \u00b7 ':'')+t}
function recordMiss(q,src){var m=getMiss(),k=qid(q);m[k]={q:q,src:src||'',t:Date.now()};var ks=Object.keys(m);if(ks.length>300){ks.sort(function(a,b){return m[a].t-m[b].t});delete m[ks[0]]}putMiss(m)}
function removeMiss(q){var m=getMiss(),k=qid(q);if(m[k]){delete m[k];putMiss(m)}}
function missCount(){return Object.keys(getMiss()).length}

/* ---------- sound ---------- */
var ctx=null;
function audio(){if(!ctx){try{ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(ctx&&ctx.state==='suspended'){ctx.resume()}return ctx}
function muted(){return store.get('ee_mute')==='1'}
function tone(freq,start,dur,type,vol){var c=audio();if(!c||muted())return;var o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.value=freq;var t=c.currentTime+start;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.25,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+0.05)}
var sfx={
  ok:function(){tone(660,0,.14,'triangle',.28);tone(880,.1,.2,'triangle',.28)},
  no:function(){tone(220,0,.18,'sawtooth',.16);tone(165,.14,.26,'sawtooth',.16)},
  click:function(){tone(520,0,.06,'sine',.12)},
  win:function(){[523,659,784,1047,784,1047,1319].forEach(function(f,i){tone(f,i*.12,.25,'triangle',.28)})},
  fail:function(){tone(330,0,.2,'triangle',.2);tone(262,.2,.3,'triangle',.2)},
  unlock:function(){[784,988,1175,1568].forEach(function(f,i){tone(f,i*.09,.3,'square',.1)})}
};
function say(text){try{if(!window.speechSynthesis)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.85;speechSynthesis.speak(u)}catch(e){}}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-say]');if(b){say(b.getAttribute('data-say'))}});

/* ---------- confetti ---------- */
function confetti(ms){
  var cv=$('#confetti');if(!cv){cv=el('canvas');cv.id='confetti';document.body.appendChild(cv)}
  var w=cv.width=window.innerWidth,h=cv.height=window.innerHeight,g=cv.getContext('2d');
  var cols=['#ffc533','#ff6b6b','#2fd6a1','#3aa0ff','#ff7ac3','#ffffff','#a77bff'];
  var ps=[];for(var i=0;i<150;i++){ps.push({x:Math.random()*w,y:-20-Math.random()*h*.6,vx:(Math.random()-.5)*4,vy:2+Math.random()*4,s:5+Math.random()*8,c:cols[i%cols.length],r:Math.random()*6,vr:(Math.random()-.5)*.3})}
  var t0=Date.now();
  (function frame(){g.clearRect(0,0,w,h);var alive=false;ps.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.r+=p.vr;if(p.y<h+20)alive=true;g.save();g.translate(p.x,p.y);g.rotate(p.r);g.fillStyle=p.c;g.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6);g.restore()});
    if(alive&&Date.now()-t0<(ms||4200))requestAnimationFrame(frame);else g.clearRect(0,0,w,h)})();
}

/* ---------- user + progress ---------- */
function user(){return store.get('ee_user')||''}
function pkey(sec){return 'ee_p_'+slug(user())+'_'+sec}
function getProg(sec,n){var p=null;try{p=JSON.parse(store.get(pkey(sec)))}catch(e){}if(!p||!p.pass)p={pass:[],best:[]};for(var i=0;i<n;i++){if(p.pass[i]==null)p.pass[i]=false;if(p.best[i]==null)p.best[i]=0}return p}
function saveProg(sec,p){store.set(pkey(sec),JSON.stringify(p))}
function doneCount(sec,n){var p=getProg(sec,n);return p.pass.slice(0,n).filter(Boolean).length}


/* ---------- avatars ---------- */
var AV=[
 {bg:'#ffd6e7',skin:'#f6d2b5',hj:'#e8508a',top:'#ffb347'},
 {bg:'#d7f5ee',skin:'#8d5a3b',hj:'#1aa78d',top:'#ffe066'},
 {bg:'#e1dcff',skin:'#e8b98f',hj:'#6b4de0',top:'#ff7ac3'},
 {bg:'#fff0c9',skin:'#c68b59',hj:'#f08a24',top:'#3aa0ff'},
 {bg:'#d9ecff',skin:'#5e3a26',hj:'#2e7bd6',top:'#ffc533'},
 {bg:'#ffe0d9',skin:'#f1c9a5',hj:'#d9453d',top:'#2fd6a1'},
 {bg:'#ffe9f4',skin:'#f6d2b5',hair:'#3b2418',st:'long',top:'#ff7ac3'},
 {bg:'#e3f8e9',skin:'#c68b59',hair:'#1c1412',st:'bun',top:'#2fd6a1'},
 {bg:'#fff1d6',skin:'#e8b98f',hair:'#a5602a',st:'pony',top:'#3aa0ff'},
 {bg:'#e6e2ff',skin:'#5e3a26',hair:'#140e0c',st:'curly',top:'#ffc533'},
 {bg:'#d9f1ff',skin:'#f1c9a5',hair:'#e0a93a',st:'bob',top:'#ff6b6b'},
 {bg:'#ffe3e3',skin:'#8d5a3b',hair:'#2a1a14',st:'bob',top:'#6b4de0'}
];
function avSVG(i,sz){
 var a=AV[(i>=0&&i<AV.length)?i:0],b='';
 b+='<circle cx="50" cy="50" r="50" fill="'+a.bg+'"/>';
 if(a.hj){b+='<ellipse cx="50" cy="55" rx="35" ry="40" fill="'+a.hj+'"/>'}
 else if(a.st==='long'){b+='<path d="M20 100 Q8 50 28 30 Q50 8 72 30 Q92 50 80 100Z" fill="'+a.hair+'"/>'}
 else if(a.st==='pony'){b+='<ellipse cx="50" cy="48" rx="27" ry="30" fill="'+a.hair+'"/><ellipse cx="76" cy="64" rx="10" ry="22" fill="'+a.hair+'" transform="rotate(-20 76 64)"/>'}
 else if(a.st==='bun'){b+='<circle cx="50" cy="15" r="12" fill="'+a.hair+'"/>'}
 else if(a.st==='curly'){[[22,40],[30,26],[44,20],[58,20],[72,26],[80,40],[18,56],[84,56]].forEach(function(c){b+='<circle cx="'+c[0]+'" cy="'+c[1]+'" r="12" fill="'+a.hair+'"/>'})}
 b+='<path d="M14 100 Q18 78 50 76 Q82 78 86 100Z" fill="'+a.top+'"/>';
 if(a.hj){b+='<path d="M22 100 Q22 80 50 79 Q78 80 78 100Z" fill="'+a.hj+'"/>'}
 b+='<ellipse cx="50" cy="54" rx="21" ry="24" fill="'+a.skin+'"/>';
 if(a.hj){b+='<path d="M27 50 Q30 26 50 25 Q70 26 73 50 Q66 38 50 37 Q34 38 27 50Z" fill="'+a.hj+'"/>'}
 else if(a.st==='bob'){b+='<path d="M24 62 Q18 28 50 26 Q82 28 76 62 Q76 40 50 38 Q24 40 24 62Z" fill="'+a.hair+'"/>'}
 else{b+='<path d="M28 48 Q32 28 50 28 Q68 28 72 48 Q60 36 50 38 Q40 36 28 48Z" fill="'+a.hair+'"/>'}
 b+='<circle cx="42" cy="56" r="2.8" fill="#2b1d1a"/><circle cx="58" cy="56" r="2.8" fill="#2b1d1a"/>';
 b+='<circle cx="35" cy="63" r="4" fill="#ff7a8a" opacity=".35"/><circle cx="65" cy="63" r="4" fill="#ff7a8a" opacity=".35"/>';
 b+='<path d="M43 65 Q50 72 57 65" stroke="#2b1d1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="'+sz+'" height="'+sz+'" style="border-radius:50%;display:inline-block;vertical-align:middle" aria-hidden="true">'+b+'</svg>';
}
function avIdx(){var v=store.get('ee_av');return v==null||v===''?-1:(+v)}
function pickAvatar(cb){
 var m=el('div','modal');var cur=avIdx();
 var h='<div class="box"><h2>Pick your avatar</h2><div style="color:#4a4580;margin-bottom:10px">Choose the one you like. You can change it any time.</div><div class="avgrid">';
 for(var i=0;i<AV.length;i++)h+='<button class="avb'+(i===cur?' sel':'')+'" data-i="'+i+'" aria-label="Avatar '+(i+1)+'">'+avSVG(i,64)+'</button>';
 h+='</div><button class="btn" id="avok" style="margin-top:14px">Done</button></div>';
 m.innerHTML=h;document.body.appendChild(m);
 var sel=cur;
 m.querySelectorAll('.avb').forEach(function(b){b.onclick=function(){sfx.click();sel=+b.getAttribute('data-i');m.querySelectorAll('.avb').forEach(function(x){x.classList.toggle('sel',x===b)});store.set('ee_av',String(sel))}});
 $('#avok',m).onclick=function(){if(sel<0){sel=0;store.set('ee_av','0')}m.remove();sfx.ok();try{lbPush()}catch(e){}if(cb)cb();else{var d=$('#av');if(d)d.innerHTML=avSVG(avIdx(),28)}};
}

function askName(force,cb){
  var m=el('div','modal');
  m.innerHTML='<div class="box"><div style="font-size:54px">👋</div><h2>Welcome!</h2><div style="color:#4a4580">What is your name?</div><input id="nm" maxlength="24" placeholder="Type your name" autocomplete="off"><button class="btn" id="go">Let\'s start!</button>'+(force?'':'<div style="margin-top:12px"><button class="btn ghost" id="cx" style="font-size:15px;padding:8px 18px">Cancel</button></div>')+'</div>';
  document.body.appendChild(m);
  var inp=$('#nm',m);inp.value=force?'':user();setTimeout(function(){inp.focus()},60);
  function go(){var v=inp.value.replace(/\s+/g,' ').trim();if(!v){inp.focus();return}store.set('ee_user',v);m.remove();audio();sfx.ok();var fin=function(){if(cb)cb();else location.reload()};if(avIdx()<0)pickAvatar(fin);else fin()}
  $('#go',m).onclick=go;inp.onkeydown=function(e){if(e.key==='Enter')go()};
  var cx=$('#cx',m);if(cx)cx.onclick=function(){m.remove()};
}

function applyDark(){document.body.classList.toggle('dark',store.get('ee_dark')==='1')}
try{applyDark()}catch(e){}
function header(){
  var bub=el('div','bubbles');for(var i=0;i<9;i++){var s=document.createElement('span');var z=40+Math.random()*120;s.style.cssText='width:'+z+'px;height:'+z+'px;left:'+Math.random()*100+'%;animation-duration:'+(14+Math.random()*16)+'s;animation-delay:-'+Math.random()*20+'s';bub.appendChild(s)}
  document.body.insertBefore(bub,document.body.firstChild);
  var t=el('div','top');
  t.innerHTML='<a class="brand" href="index.html"><i>EE</i><span class="bt"> Easy English</span></a><span class="sp"></span><button class="chip" id="av" aria-label="Choose avatar"></button><button class="chip" id="dk" aria-label="Dark mode"></button><a class="chip" id="mm" href="mistakes.html" aria-label="My mistakes"></a><button class="chip" id="who"></button><button class="chip" id="mute" aria-label="Sound"></button>';
  document.body.insertBefore(t,bub.nextSibling);
  function paint(){$('#av').innerHTML=avIdx()>=0?avSVG(avIdx(),24):'\ud83d\ude42';$('#dk').textContent=store.get('ee_dark')==='1'?'\u2600\ufe0f':'\ud83c\udf19';var mc=missCount();$('#mm').textContent='\ud83d\udcdd'+(mc?' '+mc:'');$('#mute').textContent=muted()?'🔇':'🔊';$('#who').textContent=user()?user():'Sign in'}
  $('#dk').onclick=function(){store.set('ee_dark',store.get('ee_dark')==='1'?'0':'1');applyDark();paint()};
  paint();
  try{touchDay()}catch(e){}
  $('#mute').onclick=function(){store.set('ee_mute',muted()?'0':'1');paint();if(!muted()){audio();sfx.click()}};
  $('#who').onclick=function(){askName(false)};
  $('#av').onclick=function(){if(!user()){askName(true,function(){location.reload()});return}pickAvatar(function(){location.reload()})};
  var f=el('div','foot','Easy English &middot; Dina Fathi');document.body.appendChild(f);
  if(!user())askName(true,function(){location.reload()});
}

/* ---------- quiz engine ---------- */
var CHEER_OK=['Great job','Perfect','Brilliant','Well done','Excellent','Superstar','Nice one','You got it'];
var CHEER_NO=['Almost','Not quite','Keep going','Good try','Don\'t worry'];
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function kindLabel(t){return {mcq:'Choose',tf:'True or False',type:'Type the answer',order:'Put in order',multi:'Pick TWO'}[t]||'Question'}

function runSet(opts){
  /* opts: {title, questions, onDone(passed,score)} */
  var Q=shuffle(opts.questions);var name=user()||'friend';
  var root=el('div','quiz');document.body.appendChild(root);document.body.style.overflow='hidden';
  var idx=0,score=0,missed=[],marks=[];
  function close(){if(typeof tmr!=='undefined'&&tmr)clearInterval(tmr);root.remove();document.body.style.overflow='';}
  function frame(){
    root.innerHTML='<div class="qtop"><button class="x" aria-label="Close">✕</button><div class="t">'+esc(opts.title)+'</div><div class="t" style="flex:0;white-space:nowrap" id="cnt"></div></div><div class="dots" id="dots"></div><div class="qbody" id="qb"></div>';
    $('.x',root).onclick=function(){if(confirm('Leave this set? Your answers in this try will be lost.'))close()};
  }
  function dots(){var d=$('#dots',root);d.innerHTML='';Q.forEach(function(q,i){var s=el('i',i===idx?'cur':(marks[i]===1?'ok':marks[i]===0?'no':''));d.appendChild(s)});$('#cnt',root).textContent=(Math.min(idx+1,Q.length))+' / '+Q.length}
  function finishQ(q,right,given){
    marks[idx]=right?1:0;if(right){score++;sfx.ok()}else{missed.push({q:q,given:given});sfx.no()};try{if(opts.onAnswer)opts.onAnswer(q,right);else if(right)removeMiss(q);else recordMiss(q,opts.src||opts.title)}catch(e){}
    dots();
    var fb=$('#fb',root);fb.className='fb show '+(right?'ok':'no');
    var ans=answerText(q);
    fb.innerHTML=(right?'✅ '+pick(CHEER_OK)+', '+esc(name)+'!':'❌ '+pick(CHEER_NO)+', '+esc(name)+'. Correct answer: <b>'+esc(ans)+'</b>')+(q.e?'<span class="why">'+rich(q.e)+'</span>':'');
    var nx=$('#nx',root);nx.style.display='block';$('button',nx).textContent=idx===Q.length-1?'See my result':'Next ➜';$('button',nx).focus&&$('button',nx).focus();
  }
  function answerText(q){if(q.t==='multi')return q.o[0]+' + '+q.o[1];if(q.t==='mcq')return q.o[0];if(q.t==='tf')return q.a?'True':'False';return String(q.a).split('|')[0]}
  function show(){
    dots();var q=Q[idx];var b=$('#qb',root);
    b.innerHTML='<div class="qcard"><span class="qkind">'+kindLabel(q.t)+'</span><div class="qtext">'+rich(q.q)+'</div><div id="area"></div><div class="fb" id="fb"></div></div><div class="qnext" id="nx" style="display:none"><button class="btn alt">Next ➜</button></div>';
    $('#nx button',root).onclick=function(){sfx.click();idx++;if(idx>=Q.length)result();else show()};
    var area=$('#area',root);
    if(q.t==='mcq'){
      var os=shuffle(q.o.map(function(t,i){return {t:t,c:i===0}}));var wrap=el('div','opts');
      os.forEach(function(o){var bt=el('button','opt');bt.textContent=o.t;bt.onclick=function(){
        var all=wrap.querySelectorAll('.opt');for(var i=0;i<all.length;i++){all[i].disabled=true}
        os.forEach(function(x,i){if(x.c)all[i].classList.add('ok')});if(!o.c)bt.classList.add('no');finishQ(q,o.c,o.t)};wrap.appendChild(bt)});
      area.appendChild(wrap);
    }else if(q.t==='multi'){
      var mo=shuffle(q.o.map(function(t,i){return {t:t,c:i<2}}));var mw=el('div','opts multi');var sel=[];
      var mchk=el('button','btn');mchk.textContent='Check ✔';mchk.disabled=true;mchk.style.marginTop='14px';
      var hint=el('div','mini');hint.style.margin='4px 0 10px';hint.textContent='Tap the TWO correct answers.';
      mo.forEach(function(o){var bt=el('button','opt');bt.textContent=o.t;bt.onclick=function(){sfx.click();var k=sel.indexOf(o);if(k>-1){sel.splice(k,1);bt.classList.remove('sel')}else if(sel.length<2){sel.push(o);bt.classList.add('sel')}mchk.disabled=sel.length!==2};o.b=bt;mw.appendChild(bt)});
      mchk.onclick=function(){var all=mw.querySelectorAll('.opt');for(var i=0;i<all.length;i++){all[i].disabled=true}
        var right=sel.length===2&&sel.every(function(x){return x.c});mo.forEach(function(x){if(x.c)x.b.classList.add('ok');else if(sel.indexOf(x)>-1)x.b.classList.add('no');x.b.classList.remove('sel')});
        mchk.style.display='none';finishQ(q,right,sel.map(function(x){return x.t}).join(' + '))};
      area.appendChild(hint);area.appendChild(mw);area.appendChild(mchk);
    }else if(q.t==='tf'){
      var w2=el('div','opts tf');[['True',true],['False',false]].forEach(function(p){var bt=el('button','opt');bt.textContent=p[0];bt.onclick=function(){
        var all=w2.querySelectorAll('.opt');for(var i=0;i<all.length;i++){all[i].disabled=true}
        var right=(p[1]===q.a);all[q.a?0:1].classList.add('ok');if(!right)bt.classList.add('no');finishQ(q,right,p[0])};w2.appendChild(bt)});
      area.appendChild(w2);
    }else if(q.t==='type'){
      var inp=el('input','typebox');inp.type='text';inp.autocomplete='off';inp.autocapitalize='off';inp.spellcheck=false;inp.placeholder='Type here...';
      var chk=el('button','btn');chk.textContent='Check ✔';chk.style.marginTop='14px';
      area.appendChild(inp);area.appendChild(chk);setTimeout(function(){inp.focus()},80);
      function doCheck(){var v=norm(inp.value);if(!v){inp.focus();return}var ok=String(q.a).split('|').some(function(a){return norm(a)===v});inp.disabled=true;chk.style.display='none';inp.classList.add(ok?'ok':'no');finishQ(q,ok,inp.value)}
      chk.onclick=doCheck;inp.onkeydown=function(e){if(e.key==='Enter')doCheck()};
    }else if(q.t==='order'){
      var words=shuffle(String(q.a).split('|')[0].replace(/[.?!]$/,'').split(' '));var endp=(String(q.a).split('|')[0].match(/[.?!]$/)||[''])[0];
      var line=el('div','line'),bank=el('div','bank');var placed=[];
      var chk2=el('button','btn');chk2.textContent='Check ✔';chk2.disabled=true;
      function draw(){line.innerHTML='';bank.innerHTML='';
        placed.forEach(function(wi,pi){var b2=el('button','w');b2.textContent=words[wi];b2.onclick=function(){sfx.click();placed.splice(pi,1);draw()};line.appendChild(b2)});
        words.forEach(function(w,wi){var b3=el('button','w'+(placed.indexOf(wi)>-1?' used':''));b3.textContent=w;b3.onclick=function(){sfx.click();placed.push(wi);draw()};bank.appendChild(b3)});
        chk2.disabled=placed.length!==words.length}
      draw();area.appendChild(line);area.appendChild(bank);area.appendChild(chk2);
      chk2.onclick=function(){var s=norm(placed.map(function(i){return words[i]}).join(' ')+endp);var ok=String(q.a).split('|').some(function(a){return norm(a)===s});
        chk2.style.display='none';bank.style.display='none';line.querySelectorAll('button').forEach(function(x){x.disabled=true;x.style.pointerEvents='none'});line.style.borderColor=ok?'#14b86a':'#ef4565';finishQ(q,ok,s)};
    }
    window.scrollTo(0,0);root.scrollTop=0;
  }
  function result(){
    var n=Q.length,pass=score===n;var b=$('#qb',root);
    var elapsed=Math.round((Date.now()-t0)/1000),bonus=0;if(tmr){clearInterval(tmr)}if(opts.challenge&&score>=8){bonus=elapsed<=60?3:elapsed<=90?2:elapsed<=120?1:0}
    $('#dots',root).innerHTML='';$('#cnt',root).textContent='';
    var stars=score===n?'⭐⭐⭐':score>=n-2?'⭐⭐':score>=n/2?'⭐':'';
    var h='<div class="result"><div class="score" style="color:'+(pass?'#14b86a':'#ff6b6b')+'">'+score+' / '+n+'</div><div class="stars">'+(stars||'💪')+'</div>';
    if(opts.challenge){h+=pass?'<h2>Perfect challenge, '+esc(name)+'! 🏆</h2><p>All 10 correct!</p>':'<h2>Nice try, '+esc(name)+'! ⚡</h2><p>You got '+score+' out of '+n+'. Check the answers below, then challenge yourself again.</p>'}else if(pass&&opts.review){h+='<h2>Brilliant, '+esc(name)+'! 🎉</h2><p>All of these are fixed and removed from your list.</p>'}else if(!pass&&opts.review){h+='<h2>Good effort, '+esc(name)+'!</h2><p>The ones you got right are removed from your list. Practice the rest again.</p>'}else if(pass){h+='<h2>Amazing, '+esc(name)+'! 🎉</h2><p>All answers correct. '+(opts.hasNext?'The next set is unlocked!':'You finished every set in this section!')+'</p>'}
    else{h+='<h2>So close, '+esc(name)+'!</h2><p>You need all '+n+' correct to unlock the next set. Look at the answers below, then try again. You can do it! 💪</p>'}
    if(!pass&&missed.length){h+='<div class="review">';missed.forEach(function(m){h+='<div class="r">'+rich(m.q.q)+'<br>✔ <b>'+esc(answerText(m.q))+'</b>'+(m.q.e?'<br><small>'+rich(m.q.e)+'</small>':'')+'</div>'});h+='</div>'}
    if(opts.challenge){h+='<div class="cres">\u23f1 Time: <b>'+elapsed+' s</b> &nbsp; '+(bonus?'Speed bonus: <b>'+'\u26a1'.repeat(bonus)+'</b>':'No speed bonus this time')+'</div><p class="mini" style="text-align:center">Bonus \u26a1: 8+ correct and under 120 s = 1, under 90 s = 2, under 60 s = 3.</p>'}
    h+='<div class="btns">';
    if(pass&&opts.hasNext)h+='<button class="btn" id="bn">Next set ➜</button>';
    if(!pass&&!opts.challenge)h+='<button class="btn" id="br">Try again 🔁</button>';
    h+='<button class="btn ghost" id="bc">Back to sets</button></div></div>';
    b.innerHTML=h;
    if(pass){sfx.win();confetti();}else sfx.fail();
    var done=opts.onDone&&opts.onDone(pass,score,elapsed,bonus);
    var bn=$('#bn',root);if(bn)bn.onclick=function(){close();if(opts.next)opts.next()};
    var br=$('#br',root);if(br)br.onclick=function(){close();runSet(opts)};
    $('#bc',root).onclick=close;
    root.scrollTop=0;
  }
  var t0=Date.now(),tmr=null;
  frame();show();
  if(opts.challenge){var tm=el('div','t');tm.id='tm';tm.style.cssText='flex:0;white-space:nowrap;margin-left:8px';tm.textContent='\u23f1 0:00';$('.qtop',root).appendChild(tm);tmr=setInterval(function(){var e=Math.round((Date.now()-t0)/1000);tm.textContent='\u23f1 '+Math.floor(e/60)+':'+('0'+e%60).slice(-2)},500)}
}

/* ---------- section page ---------- */
function initSection(cfg){
  /* cfg: {id,title,sets:[[q..],...],mount:'#sets'} */
  var mount=$(cfg.mount||'#sets');var n=cfg.sets.length;
  function render(){
    var p=getProg(cfg.id,n);mount.innerHTML='';
    var dc=p.pass.slice(0,n).filter(Boolean).length;
    var prog=$('#secprog');if(prog){prog.innerHTML='<b style="width:'+Math.round(dc/n*100)+'%"></b>';var m=$('#secmini');if(m)m.textContent=dc+' of '+n+' sets completed'}
    cfg.sets.forEach(function(qs,i){
      var unlocked=i===0||p.pass[i-1];var done=p.pass[i];
      var cls='set '+(done?'done':unlocked?'open':'locked');
      var b=el('button',cls);
      b.innerHTML='<span class="big-n">'+(done?'✅':unlocked?(i+1):'🔒')+'</span>Set '+(i+1)+'<small>'+(done?'Completed':unlocked?(qs.length+' questions'):'Locked')+'</small><span class="stars">'+(done?'⭐⭐⭐':'')+'</span>';
      b.onclick=function(){
        if(!unlocked){sfx.no();b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');return}
        audio();sfx.click();start(i)};
      mount.appendChild(b);
    });
  }
  function start(i){
    runSet({title:cfg.title+' · Set '+(i+1),src:srcLabel(cfg.id,cfg.title),questions:cfg.sets[i],hasNext:i<n-1,
      next:function(){start(i+1)},
      onDone:function(pass,score){var p=getProg(cfg.id,n);if(score>(p.best[i]||0))p.best[i]=score;var was=p.pass[i];if(pass){p.pass[i]=true;if(!was)addPoints(10);if(i<n-1&&!p.pass[i+1]&&!was)setTimeout(sfx.unlock,900)}saveProg(cfg.id,p);render()}});
  }
  render();
}


/* ---------- study days ---------- */
function dkey(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function daysKey(){return 'ee_d_'+slug(user())}
function getDays(){var a=[];try{a=JSON.parse(store.get(daysKey()))||[]}catch(e){}return a}
function touchDay(){if(!user())return;var a=getDays(),t=dkey(new Date());if(a.indexOf(t)<0){a.push(t);a=a.slice(-120);store.set(daysKey(),JSON.stringify(a))}}
function bestStreak(){var a=getDays().slice().sort(),best=0,cur=0,prev=null;a.forEach(function(k){var p=k.split('-'),d=Date.UTC(+p[0],+p[1]-1,+p[2]);cur=(prev!==null&&d-prev===864e5)?cur+1:1;prev=d;if(cur>best)best=cur});return best}
function curStreak(){var a=getDays(),n=0,d=new Date();if(a.indexOf(dkey(d))<0)d.setDate(d.getDate()-1);while(a.indexOf(dkey(d))>-1){n++;d.setDate(d.getDate()-1)}return n}

/* ---------- weekly leaderboard (first name + points only) ---------- */
var LB_URL='https://extendsclass.com/api/json-storage/bin/adafabc';
function lbWeek(){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+1)%7));return dkey(d)}
function lbFirst(){var n=(user()||'').trim().split(/\s+/)[0]||'';return n.replace(/[^A-Za-z\u0600-\u06FF]/g,'').slice(0,14)}
function lbId(){var id=store.get('ee_lbid');if(!id){id=Math.random().toString(36).slice(2,8);store.set('ee_lbid',id)}return id}
function lbOff(){return store.get('ee_lboff')==='1'}
function lbParse(t){var i=t.search(/<!doctype/i);if(i>-1)t=t.slice(0,i);var o=JSON.parse(t);if(!o||typeof o!=='object'||typeof o.e!=='object'||o.e===null)o={w:'',e:{}};if(!o.a||typeof o.a!=='object')o.a={};return o}
function lbGet(){return fetch(LB_URL+'?_='+Date.now()+Math.random().toString(36).slice(2,6),{cache:'no-store'}).then(function(r){return r.text()}).then(lbParse)}
function lbKey(){return 'ee_w_'+slug(user())}
function lbLocal(){var o=null;try{o=JSON.parse(store.get(lbKey()))}catch(e){}var w=lbWeek();if(!o||o.w!==w)o={w:w,pts:0};return o}
function lbPush(){
  var nm=lbFirst();if(!nm||lbOff())return Promise.resolve();var loc=lbLocal();if(!loc.pts)return Promise.resolve();
  return lbGet().then(function(b){var w=lbWeek();if(b.w!==w)b={w:w,e:{},a:{}};var k=nm+'|'+lbId();b.e[k]=loc.pts;if(avIdx()>=0)b.a[k]=avIdx();
    var ks=Object.keys(b.e);if(ks.length>300){ks.sort(function(a,c){return b.e[a]-b.e[c]});delete b.e[ks[0]]}
    return fetch(LB_URL,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})}).catch(function(){})}
function addPoints(n){try{if(!user()||!(n>0))return;var o=lbLocal();o.pts+=Math.round(n);store.set(lbKey(),JSON.stringify(o));lbPush()}catch(e){}}
function lbRemove(){return lbGet().then(function(b){var k=lbFirst()+'|'+lbId();if(b.e[k]!=null){delete b.e[k];delete b.a[k];return fetch(LB_URL,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})}}).catch(function(){})}

/* ---------- exam countdown ---------- */
var EXAMS=[{name:'English AL',date:[2026,11,30],label:'Monday 30 November 2026',em:'\ud83d\udcd7'},{name:'English OL',date:[2026,12,9],label:'Wednesday 9 December 2026',em:'\ud83d\udcd8'}];
function daysTo(d){var n=new Date();var a=Date.UTC(n.getFullYear(),n.getMonth(),n.getDate());var b=Date.UTC(d[0],d[1]-1,d[2]);return Math.round((b-a)/864e5)}
function countdown(sel,only){var m=$(sel);if(!m)return;var h='<div class="cdgrid">';EXAMS.forEach(function(x){if(only&&x.name!==only)return;var n=daysTo(x.date);var big,sm;if(n>1){big=n;sm='days to go'}else if(n===1){big='1';sm='day to go'}else if(n===0){big='\ud83d\udd25';sm='Exam day! Good luck!'}else{big='\u2705';sm='Exam finished'}h+='<div class="cd'+(n>=0&&n<=3?' hot':'')+'"><div class="cde">'+x.em+'</div><div class="cdn">'+big+'</div><div class="cds">'+sm+'</div><div class="cdt">Grade 10 \u00b7 '+x.name+'</div><div class="cdd">'+x.label+'</div></div>'});m.innerHTML=h+'</div>'}

/* ---------- welcome text on home ---------- */
function greet(){var g=$('#greet');if(g&&user()){g.innerHTML='Welcome back, <span class="welcome-name">'+esc(user())+'</span>! 🌟'}}

window.EE={avSVG:avSVG,avIdx:avIdx,pickAvatar:pickAvatar,addPoints:addPoints,lbGet:lbGet,lbWeek:lbWeek,lbFirst:lbFirst,lbId:lbId,lbOff:lbOff,lbLocal:lbLocal,lbPush:lbPush,lbRemove:lbRemove,bestStreak:bestStreak,curStreak:curStreak,countdown:countdown,getMiss:getMiss,missCount:missCount,removeMiss:removeMiss,recordMiss:recordMiss,header:header,initSection:initSection,getProg:getProg,doneCount:doneCount,greet:greet,user:user,say:say,sfx:sfx,_runSet:runSet};
})();
/* build 3 */
