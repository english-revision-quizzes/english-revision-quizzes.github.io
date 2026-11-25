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

function askName(force,cb){
  var m=el('div','modal');
  m.innerHTML='<div class="box"><div style="font-size:54px">👋</div><h2>Welcome!</h2><div class="ar" style="font-weight:700;margin-bottom:2px">أهلاً بيكي</div><div style="color:#4a4580">What is your name?</div><input id="nm" maxlength="24" placeholder="Type your name" autocomplete="off"><button class="btn" id="go">Let\'s start!</button>'+(force?'':'<div style="margin-top:12px"><button class="btn ghost" id="cx" style="font-size:15px;padding:8px 18px">Cancel</button></div>')+'</div>';
  document.body.appendChild(m);
  var inp=$('#nm',m);inp.value=force?'':user();setTimeout(function(){inp.focus()},60);
  function go(){var v=inp.value.replace(/\s+/g,' ').trim();if(!v){inp.focus();return}store.set('ee_user',v);m.remove();audio();sfx.ok();if(cb)cb();else location.reload()}
  $('#go',m).onclick=go;inp.onkeydown=function(e){if(e.key==='Enter')go()};
  var cx=$('#cx',m);if(cx)cx.onclick=function(){m.remove()};
}

function header(){
  var bub=el('div','bubbles');for(var i=0;i<9;i++){var s=document.createElement('span');var z=40+Math.random()*120;s.style.cssText='width:'+z+'px;height:'+z+'px;left:'+Math.random()*100+'%;animation-duration:'+(14+Math.random()*16)+'s;animation-delay:-'+Math.random()*20+'s';bub.appendChild(s)}
  document.body.insertBefore(bub,document.body.firstChild);
  var t=el('div','top');
  t.innerHTML='<a class="brand" href="index.html"><i>EE</i> Easy English</a><span class="sp"></span><button class="chip" id="who"></button><button class="chip" id="mute" aria-label="Sound"></button>';
  document.body.insertBefore(t,bub.nextSibling);
  function paint(){$('#mute').textContent=muted()?'🔇':'🔊';$('#who').textContent=user()?'👤 '+user():'👤 Sign in'}
  paint();
  $('#mute').onclick=function(){store.set('ee_mute',muted()?'0':'1');paint();if(!muted()){audio();sfx.click()}};
  $('#who').onclick=function(){askName(false)};
  var f=el('div','foot','Easy English &middot; Dina Fathi');document.body.appendChild(f);
  if(!user())askName(true,function(){location.reload()});
}

/* ---------- quiz engine ---------- */
var CHEER_OK=['Great job','Perfect','Brilliant','Well done','Excellent','Superstar','Nice one','You got it'];
var CHEER_NO=['Almost','Not quite','Keep going','Good try','Don\'t worry'];
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function kindLabel(t){return {mcq:'Choose',tf:'True or False',type:'Type the answer',order:'Put in order'}[t]||'Question'}

function runSet(opts){
  /* opts: {title, questions, onDone(passed,score)} */
  var Q=shuffle(opts.questions);var name=user()||'friend';
  var root=el('div','quiz');document.body.appendChild(root);document.body.style.overflow='hidden';
  var idx=0,score=0,missed=[],marks=[];
  function close(){root.remove();document.body.style.overflow='';}
  function frame(){
    root.innerHTML='<div class="qtop"><button class="x" aria-label="Close">✕</button><div class="t">'+esc(opts.title)+'</div><div class="t" style="flex:0;white-space:nowrap" id="cnt"></div></div><div class="dots" id="dots"></div><div class="qbody" id="qb"></div>';
    $('.x',root).onclick=function(){if(confirm('Leave this set? Your answers in this try will be lost.'))close()};
  }
  function dots(){var d=$('#dots',root);d.innerHTML='';Q.forEach(function(q,i){var s=el('i',i===idx?'cur':(marks[i]===1?'ok':marks[i]===0?'no':''));d.appendChild(s)});$('#cnt',root).textContent=(Math.min(idx+1,Q.length))+' / '+Q.length}
  function finishQ(q,right,given){
    marks[idx]=right?1:0;if(right){score++;sfx.ok()}else{missed.push({q:q,given:given});sfx.no()}
    dots();
    var fb=$('#fb',root);fb.className='fb show '+(right?'ok':'no');
    var ans=answerText(q);
    fb.innerHTML=(right?'✅ '+pick(CHEER_OK)+', '+esc(name)+'!':'❌ '+pick(CHEER_NO)+', '+esc(name)+'. Correct answer: <b>'+esc(ans)+'</b>')+(q.e?'<span class="why">'+rich(q.e)+'</span>':'');
    var nx=$('#nx',root);nx.style.display='block';$('button',nx).textContent=idx===Q.length-1?'See my result':'Next ➜';$('button',nx).focus&&$('button',nx).focus();
  }
  function answerText(q){if(q.t==='mcq')return q.o[0];if(q.t==='tf')return q.a?'True':'False';return String(q.a).split('|')[0]}
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
    $('#dots',root).innerHTML='';$('#cnt',root).textContent='';
    var stars=score===n?'⭐⭐⭐':score>=n-2?'⭐⭐':score>=n/2?'⭐':'';
    var h='<div class="result"><div class="score" style="color:'+(pass?'#14b86a':'#ff6b6b')+'">'+score+' / '+n+'</div><div class="stars">'+(stars||'💪')+'</div>';
    if(pass){h+='<h2>Amazing, '+esc(name)+'! 🎉</h2><p>All answers correct. '+(opts.hasNext?'The next set is unlocked!':'You finished every set in this section!')+'</p>'}
    else{h+='<h2>So close, '+esc(name)+'!</h2><p>You need all '+n+' correct to unlock the next set. Look at the answers below, then try again. You can do it! 💪</p>'}
    if(!pass&&missed.length){h+='<div class="review">';missed.forEach(function(m){h+='<div class="r">'+rich(m.q.q)+'<br>✔ <b>'+esc(answerText(m.q))+'</b>'+(m.q.e?'<br><small>'+rich(m.q.e)+'</small>':'')+'</div>'});h+='</div>'}
    h+='<div class="btns">';
    if(pass&&opts.hasNext)h+='<button class="btn" id="bn">Next set ➜</button>';
    if(!pass)h+='<button class="btn" id="br">Try again 🔁</button>';
    h+='<button class="btn ghost" id="bc">Back to sets</button></div></div>';
    b.innerHTML=h;
    if(pass){sfx.win();confetti();}else sfx.fail();
    var done=opts.onDone&&opts.onDone(pass,score);
    var bn=$('#bn',root);if(bn)bn.onclick=function(){close();if(opts.next)opts.next()};
    var br=$('#br',root);if(br)br.onclick=function(){close();runSet(opts)};
    $('#bc',root).onclick=close;
    root.scrollTop=0;
  }
  frame();show();
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
    runSet({title:cfg.title+' · Set '+(i+1),questions:cfg.sets[i],hasNext:i<n-1,
      next:function(){start(i+1)},
      onDone:function(pass,score){var p=getProg(cfg.id,n);if(score>(p.best[i]||0))p.best[i]=score;var was=p.pass[i];if(pass){p.pass[i]=true;if(i<n-1&&!p.pass[i+1]&&!was)setTimeout(sfx.unlock,900)}saveProg(cfg.id,p);render()}});
  }
  render();
}

/* ---------- welcome text on home ---------- */
function greet(){var g=$('#greet');if(g&&user()){g.innerHTML='Welcome back, <span class="welcome-name">'+esc(user())+'</span>! 🌟'}}

window.EE={header:header,initSection:initSection,getProg:getProg,doneCount:doneCount,greet:greet,user:user,say:say,sfx:sfx,_runSet:runSet};
})();
