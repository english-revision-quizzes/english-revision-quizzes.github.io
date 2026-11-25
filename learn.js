(function(){
function clean(s){return s.replace(/[\u0600-\u06FF]+/g,' ').replace(/[→＋－？=·≠]/g,' ').replace(/\(.*?\)/g,' ').replace(/____+/g,' blank ').replace(/\s+/g,' ').trim()}
function init(){
 var L=document.querySelector('.learn'); if(!L)return;
 L.addEventListener('click',function(e){
  var tb=e.target.closest('.tb');
  if(tb){var k=tb.getAttribute('data-tab');L.querySelectorAll('.tb').forEach(function(x){x.classList.toggle('on',x===tb)});L.querySelectorAll('.tp').forEach(function(p){p.classList.toggle('on',p.getAttribute('data-pane')===k)});return}
  var wc=e.target.closest('.wc'); if(wc&&!e.target.closest('.say')){var b=wc.querySelector('.say');if(b&&window.EE)EE.say(b.getAttribute('data-say'));wc.classList.add('pop');setTimeout(function(){wc.classList.remove('pop')},300)}
 });
 L.querySelectorAll('ul.pts li').forEach(function(li){var p=li.textContent.split(' · ');if(p.length>=10&&!li.querySelector('b')){li.innerHTML='';li.classList.add('chips');p.forEach(function(w){w=w.trim();if(!w)return;var c=document.createElement('button');c.className='chip2';c.setAttribute('data-say',w);c.textContent='🔊 '+w;li.appendChild(c)})}});
 L.querySelectorAll('.ex,ul.pts li:not(.chips),.tip').forEach(function(el){
  var t=clean(el.textContent); if(t.length<4)return;
  var b=document.createElement('button');b.className='say';b.setAttribute('data-say',t);b.setAttribute('aria-label','Listen');b.textContent='🔊';
  el.appendChild(b);
 });
 L.querySelectorAll('.formula').forEach(function(el){
  var t=clean(el.textContent);var b=document.createElement('button');b.className='say';b.setAttribute('data-say',t);b.textContent='🔊';el.appendChild(b)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
