(function(){
  'use strict';
  const D=window.RA_DATA,L=window.RA_LOGIC,C=window.RA_CONFIG;
  const main=document.getElementById('main'),guide=document.getElementById('guide-dialog');
  const storageKey=`ra-game:${D.version}:${location.pathname.replace(/index\.html$/,'')}`;
  const validSteps=['home','profile','intro','intro-review','question','reflection','result'];
  let cardURL='',activeGuide='S1',sending=false,storageAvailable=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function uid(){if(crypto.randomUUID)return crypto.randomUUID();const a=new Uint8Array(16);crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');}
  function fresh(){return {schema:1,version:D.version,id:uid(),step:'home',questionIndex:0,profile:L.cleanProfile({}),profileDone:false,intro:{},introReviewed:false,answers:{},revealed:{},hints:{1:[],2:[],3:[]},reflections:{reflection_self:'',feedback:''},completedAt:'',batch:String(C.collectionBatch||new URLSearchParams(location.search).get('batch')||'').slice(0,60),send:{status:'idle',message:''}};}
  function restore(){
    const empty=fresh();
    try{
      const old=JSON.parse(sessionStorage.getItem(storageKey)||'null');
      if(!old||old.schema!==1||old.version!==D.version||!validSteps.includes(old.step)||typeof old.id!=='string')return empty;
      empty.id=/^[a-f0-9-]{16,60}$/i.test(old.id)?old.id:empty.id;
      empty.profile=L.cleanProfile(old.profile);empty.profileDone=Boolean(old.profileDone);empty.introReviewed=Boolean(old.introReviewed);
      D.students.forEach(s=>{if(D.introOptions.some(o=>o.id===old.intro?.[s.id]))empty.intro[s.id]=old.intro[s.id];});
      L.questions.forEach(q=>{if(q.options.some(o=>o.id===old.answers?.[q.id])){empty.answers[q.id]=old.answers[q.id];empty.revealed[q.id]=Boolean(old.revealed?.[q.id]);}});
      D.cases.forEach(c=>empty.hints[c.id]=Array.isArray(old.hints?.[c.id])?[...new Set(old.hints[c.id].filter(k=>D.guides[k]))]:[]);
      D.reflections.forEach(r=>empty.reflections[r.key]=typeof old.reflections?.[r.key]==='string'?old.reflections[r.key].slice(0,3000):'');
      empty.batch=typeof old.batch==='string'?old.batch.slice(0,60):empty.batch;
      empty.completedAt=typeof old.completedAt==='string'&&!Number.isNaN(Date.parse(old.completedAt))?old.completedAt:'';
      empty.step=old.step;empty.questionIndex=Number.isInteger(old.questionIndex)?Math.min(8,Math.max(0,old.questionIndex)):0;
      if(['reflection','result'].includes(empty.step)&&!L.ready(empty))empty.step='intro';
      if(empty.step==='question'&&D.students.some(s=>!empty.intro[s.id]))empty.step='intro';
      if(empty.step==='question'){const firstPending=L.questions.findIndex(q=>!empty.revealed[q.id]);if(firstPending>=0)empty.questionIndex=Math.min(empty.questionIndex,firstPending);}
      if(old.send?.status==='sent')empty.send={status:'sent',message:''};
      else if(['sending','failed'].includes(old.send?.status))empty.send={status:'failed',message:'尚未確認收到你的回應。可以重試，行動卡仍可下載。'};
      return empty;
    }catch{storageAvailable=false;return empty;}
  }
  let state=restore();
  function save(){try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{storageAvailable=false;}}
  function announce(text){document.getElementById('announcer').textContent=text;}
  function portrait(index,extra=''){
    const colors=['#f0d5c5','#dceadd','#e3e0ef','#eddfb6'],shirts=['#b9714e','#386e63','#70758e','#9a8050'],skin=['#e4b18e','#efc19e','#d6a582','#e8b796'];
    const hair=index===1?'<path d="M29 64V43c0-33 63-33 63 0v46H76V58H44v25H29Z" fill="#33473f"/>':index===2?'<path d="M31 48c-7-31 24-45 37-29 26-7 29 29 16 37l-4-24-34 9-5 16Z" fill="#364047"/>':'<path d="M29 51c-6-27 9-38 31-38 24 0 37 19 29 41L78 38c-14 7-20 9-36 7l-4 16Z" fill="#3e4c43"/>';
    return `<svg class="${extra}" aria-hidden="true" focusable="false" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="130" rx="25" fill="${colors[index]}"/><circle cx="99" cy="23" r="13" fill="#fffefa66"/><path d="M15 130v-12c0-43 90-43 90 0v12" fill="${shirts[index]}"/>${hair}<path d="M49 77h22v25c-4 8-19 8-22 0" fill="${skin[index]}"/><ellipse cx="60" cy="56" rx="25" ry="31" fill="${skin[index]}"/><path d="M35 46c0-25 33-41 49-13-18 4-29 11-49 13" fill="${index===2?'#364047':'#3e4c43'}"/><circle cx="50" cy="56" r="2" fill="#33473f"/><circle cx="70" cy="56" r="2" fill="#33473f"/><path d="M54 69q6 5 12 0" fill="none" stroke="#9a614b" stroke-width="2" stroke-linecap="round"/>${index===0?'<g fill="none" stroke="#745b44" stroke-width="2"><rect x="39" y="49" width="19" height="15" rx="6"/><rect x="62" y="49" width="19" height="15" rx="6"/><path d="M58 55h4"/></g>':''}<path d="m44 99 16 15 16-15" stroke="#fffefa88" fill="none" stroke-width="3"/></svg>`;
  }
  function resumeStep(){if(state.completedAt&&L.ready(state))return 'result';if(L.ready(state))return 'reflection';if(state.introReviewed){state.questionIndex=Math.max(0,L.questions.findIndex(q=>!state.revealed[q.id]));return 'question';}if(D.students.every(s=>state.intro[s.id]))return 'intro-review';if(state.profileDone)return 'intro';return 'profile';}
  function hasProgress(){return state.profileDone||Object.keys(state.answers).length>0||Object.keys(state.intro).length>0;}
  function go(step,index){state.step=step;if(index!==undefined)state.questionIndex=index;save();render();}
  function progress(){
    const wrap=document.getElementById('progress-wrap');if(state.step==='home'){wrap.innerHTML='';return;}
    const labels=['認識你','序幕','案例一','案例二','案例三','回顧'];
    let current=state.step==='profile'?0:state.step.startsWith('intro')?1:state.step==='question'?2+Math.floor(state.questionIndex/3):5;
    const completed=Object.keys(state.revealed).filter(k=>state.revealed[k]).length;
    wrap.innerHTML=`<nav class="progress-shell" aria-label="遊戲進度"><div class="progress-label"><span>${state.step==='result'?'練習完成，帶走你的行動卡':'用你的步調，一步一步思考'}</span><span>${completed} / 9 個情境決策</span></div><ol class="progress-track">${labels.map((label,i)=>`<li class="${i<current?'done':i===current?'current':''}" ${i===current?'aria-current="step"':''}>${label}</li>`).join('')}</ol></nav>`;
  }
  function render(){
    progress();
    const views={home:renderHome,profile:renderProfile,intro:renderIntro,'intro-review':renderIntroReview,question:renderQuestion,reflection:renderReflection,result:renderResult};
    views[state.step]();
    main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
    document.title=`${main.querySelector('h1')?.textContent||D.title}｜合理調整情境遊戲`;
    announce(state.step==='question'?`案例${Math.floor(state.questionIndex/3)+1}，第${state.questionIndex%3+1}個決策`:main.querySelector('h1')?.textContent||'');
  }
  function renderHome(){
    main.innerHTML=`<section class="hero"><div class="hero-copy"><div class="eyebrow">合理調整 · 從現場開始</div><h1>每個需要，<br>都值得<em>一起想。</em></h1><p>當學生提出不同的學習需求，<br>你會怎麼判斷，又怎麼把支持接起來？</p><div class="hero-meta"><span class="tag">3 個校園情境</span><span class="tag">約 10–15 分鐘</span><span class="tag">帶走專屬行動卡</span></div>${hasProgress()?'<div class="home-resume">這個分頁保留了你上次的練習進度。</div>':''}<div class="button-row"><button class="btn btn-primary" id="start">${hasProgress()?'繼續我的練習':'開始情境練習'} <span aria-hidden="true">↗</span></button>${hasProgress()?'<button class="btn btn-quiet" data-restart>重新開始</button>':''}</div><p class="designer">${esc(D.designer)}</p></div><div class="hero-art" aria-hidden="true"><div class="art-arch"></div><div class="art-sun">✳</div><div class="art-note"><b>先聽聽，你需要什麼？</b>把對話，變成可行的支持。</div><div class="art-caption">一起找到方法</div><div class="art-person">${portrait(0)}</div><div class="art-person two">${portrait(1)}</div><div class="art-stamp"><span>從一個請求，到一次平等參與。</span><span>↗</span></div></div></section><section class="overview" aria-label="遊戲內容"><div class="overview-item"><span class="overview-num">01</span><div><h3>先看見需要</h3><p>遇見四位學生，想想誰可能適用。</p></div></div><div class="overview-item"><span class="overview-num">02</span><div><h3>走進三個現場</h3><p>結合三階段與四項原則作判斷。</p></div></div><div class="overview-item"><span class="overview-num">03</span><div><h3>留下想法，帶走行動</h3><p>省思與建議都選填，行動卡可下載。</p></div></div></section><div class="home-note"><p>案例為教學設計的虛構情境。${C.endpoint?'本遊戲於完成時收集背景、情境選擇及自願填寫的回應，作為計畫意見整理與指引修訂參考。':'目前為體驗模式，作答不會送出，僅暫存於此瀏覽器分頁。'}背景可略過，請勿在文字回應中填寫可辨識學生的資料。</p><p>內容依據教育部《各教育階段學校及幼兒園提供合理調整參考指引》114 年 12 月草案（研習用）。<a href="${D.policyURL}" target="_blank" rel="noopener noreferrer">閱讀指引 ↗</a></p></div>`;
    document.getElementById('start').onclick=()=>go(hasProgress()?resumeStep():'profile');
  }
  function renderProfile(){
    main.innerHTML=`<div class="intro-heading"><p class="eyebrow">開始之前</p><h1>先認識你，<br>也認識你的教育現場。</h1><p>這些背景有助於理解不同工作情境的意見。全部選填，沒有適合的選項也可以略過。</p></div><form id="profile-form" class="form-card"><div class="profile-grid">${D.profile.map(f=>{
      const value=state.profile[f.key];
      if(f.kind==='multi')return `<fieldset class="field full"><legend>${esc(f.label)} <span class="optional">可複選</span></legend><small>${esc(f.note)}</small><div class="checks">${f.options.map((o,i)=>`<label class="check"><input type="checkbox" name="roles" value="${esc(o)}" ${value.includes(o)?'checked':''}>${esc(o)}</label>`).join('')}</div></fieldset>`;
      const control=f.kind==='text'?`<input id="${f.key}" name="${f.key}" type="text" maxlength="20" autocomplete="off" value="${esc(value)}" placeholder="${esc(f.placeholder)}">`:`<select id="${f.key}" name="${f.key}"><option value="">請選擇，或保留空白</option>${f.options.map(o=>`<option value="${esc(o)}" ${value===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
      return `<div class="field ${['request_experience','guideline_experience'].includes(f.key)?'full':''}"><label for="${f.key}">${esc(f.label)} <span class="optional">選填</span></label>${f.note?`<small id="${f.key}-help">${esc(f.note)}</small>`:''}${control}</div>`;
    }).join('')}</div><div class="form-actions button-row"><button class="btn btn-primary" type="submit">認識幾位學生 <span aria-hidden="true">→</span></button><button class="btn btn-quiet" id="skip-profile" type="button">略過背景，直接開始</button></div><p class="local-note">${storageAvailable?'進度暫存於此分頁。':'此瀏覽器未開放暫存，重新整理可能失去進度。'}</p></form>`;
    const form=document.getElementById('profile-form');
    function collect(){const data=new FormData(form),obj={};D.profile.forEach(f=>obj[f.key]=f.kind==='multi'?data.getAll(f.key):data.get(f.key)||'');state.profile=L.cleanProfile(obj);save();}
    form.addEventListener('input',collect);
    form.addEventListener('change',e=>{if(e.target.name==='roles'&&e.target.checked){const exclusive=['目前未服務','不願透露'];form.querySelectorAll('input[name=roles]').forEach(el=>{if(el!==e.target&&(exclusive.includes(e.target.value)||exclusive.includes(el.value)))el.checked=false;});}collect();});
    form.onsubmit=e=>{e.preventDefault();collect();state.profileDone=true;go('intro');};
    document.getElementById('skip-profile').onclick=()=>{state.profile=L.cleanProfile({});state.profileDone=true;go('intro');};
  }
  function renderIntro(){
    main.innerHTML=`<div class="intro-heading"><p class="eyebrow">序幕 · 先看見需要</p><h1>誰可能需要合理調整？</h1><p>先依眼前資訊作判斷。你不必一次知道所有答案，「需進一步了解」也是一個重要的選擇。</p></div><form id="intro-form"><div class="student-grid">${D.students.map(s=>`<article class="student-card"><div class="student-top"><div class="portrait">${portrait(s.avatar)}</div><div><h2 id="${s.id}-name">${s.name}</h2><span class="tag">${s.stage}</span></div></div><p class="student-description" id="${s.id}-desc">${s.description}</p><fieldset class="intro-choices" aria-labelledby="${s.id}-name" aria-describedby="${s.id}-desc"><legend class="sr-only">${s.name}是否可能適用</legend>${D.introOptions.map(o=>`<label class="intro-choice"><input type="radio" name="${s.id}" value="${o.id}" ${state.intro[s.id]===o.id?'checked':''}>${o.label}</label>`).join('')}</fieldset></article>`).join('')}</div><div class="below-cards"><button class="btn btn-quiet" id="back-profile" type="button">← 回到背景</button><span class="small muted" id="intro-count"></span><button class="btn btn-primary" id="intro-next" type="submit">看看指引怎麼想 →</button></div></form>`;
    function sync(){const n=D.students.filter(s=>state.intro[s.id]).length;document.getElementById('intro-count').textContent=`已判斷 ${n} / 4 位學生`;document.getElementById('intro-next').disabled=n!==4;}
    document.getElementById('intro-form').onchange=e=>{state.intro[e.target.name]=e.target.value;save();sync();};
    document.getElementById('intro-form').onsubmit=e=>{e.preventDefault();if(D.students.every(s=>state.intro[s.id]))go('intro-review');};
    document.getElementById('back-profile').onclick=()=>go('profile');sync();
  }
  function renderIntroReview(){
    main.innerHTML=`<div class="intro-heading"><p class="eyebrow">序幕回看</p><h1>從身分，再往需要多看一步。</h1><p>適用對象的判斷，是進一步了解與研判的起點；不代表任何請求都必須原樣通過。</p></div><div class="review-list">${D.students.map(s=>{const picked=D.introOptions.find(o=>o.id===state.intro[s.id]);return `<article class="review-student"><div class="portrait">${portrait(s.avatar)}</div><div><h3>${s.name} <span class="your-choice">你的選擇：${esc(picked?.label||'未作答')}</span></h3><p>${s.preferred==='POSSIBLE'?'本案已有可能適用的資訊。':'本案需要進一步了解。'}${s.feedback}</p></div></article>`;}).join('')}</div><div class="review-takeaway"><h3>先受理與釐清，再判斷具體措施。</h3><p>正式身分不是唯一線索。也要看障礙處境、必要的佐證，以及學生在學習或活動中遇到的實質困難。</p><a class="source-link" href="${D.policyURL}#page=7" target="_blank" rel="noopener noreferrer">指引「適用對象」，內文第 3–4 頁 ↗</a></div><div class="button-row"><button class="btn btn-primary" id="enter-cases">走進第一個案例 →</button></div>`;
    document.getElementById('enter-cases').onclick=()=>{state.introReviewed=true;go('question',0);};
  }
  function renderQuestion(){
    const qi=state.questionIndex,q=L.questions[qi],c=D.cases[q.caseId-1],picked=L.selection(q,state),revealed=Boolean(state.revealed[q.id]);
    main.innerHTML=`<div class="case-layout"><aside class="case-aside" aria-label="案例背景"><div class="case-profile ${c.color}"><div class="portrait">${portrait(c.avatar)}</div><p class="eyebrow">案例 0${c.id} · ${c.stage} · ${c.name}</p><h2>${c.title}</h2><p class="case-subtitle">${c.subtitle}</p><blockquote>${c.quote}</blockquote><div class="case-steps" aria-label="本案第${qi%3+1}個決策">${[1,2,3].map((n,i)=>`<span class="case-step ${i===qi%3?'active':''}" aria-hidden="true">${n}</span>`).join('')}<span>三個決策</span></div></div><details class="case-context" ${qi%3===0?'open':''}><summary>回看案例背景</summary><p>${c.scene}</p></details></aside><section class="case-content"><div class="case-mark"><span class="tag green">情境 ${qi%3+1} / 3</span><span class="stage-label">${D.guides[q.stage].type} · <strong>${D.guides[q.stage].short}</strong></span></div><h1>${q.title}</h1><p class="scene-text">${q.situation}</p><form class="decision-form" id="decision-form"><fieldset class="decision-options"><legend class="sr-only">選擇你會優先採取的做法</legend>${q.options.map((o,i)=>`<label class="decision-option"><input type="radio" name="decision" value="${o.id}" ${picked?.id===o.id?'checked':''} ${revealed?'disabled':''}><span class="option-text"><span class="option-letter" aria-hidden="true">${String.fromCharCode(65+i)}</span>${o.label}</span></label>`).join('')}</fieldset><div class="decision-bottom"><button class="btn btn-quiet" type="button" id="previous-question">← ${qi===0?'回看序幕':'回看前一步'}</button>${!revealed?`<button class="btn btn-primary" type="submit" id="confirm-choice" ${picked?'':'disabled'}>選好，繼續對話 →</button>`:'<span class="small muted">已保留這次的選擇</span>'}</div></form><div class="principle-links"><span>想想這些原則</span>${[q.stage,...q.principles].map(k=>`<button class="principle-link" type="button" data-guide="${k}">${D.guides[k].short} ↗</button>`).join('')}</div>${revealed?feedbackHTML(q,picked,qi):''}</section></div>`;
    document.getElementById('decision-form').onchange=e=>{if(state.revealed[q.id])return;state.answers[q.id]=e.target.value;save();document.getElementById('confirm-choice').disabled=false;};
    document.getElementById('decision-form').onsubmit=e=>{e.preventDefault();if(!L.selection(q,state)||state.revealed[q.id])return;state.revealed[q.id]=true;save();renderQuestion();const panel=document.getElementById('decision-feedback');panel.focus({preventScroll:true});panel.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});announce('已保留你的選擇，接著閱讀這個情境的回饋。');progress();};
    document.getElementById('previous-question').onclick=()=>qi===0?go('intro-review'):go('question',qi-1);
    if(revealed)document.getElementById('next-question').onclick=()=>qi===8?go('reflection'):go('question',qi+1);
  }
  function feedbackHTML(q,o,qi){return `<section class="feedback-panel" id="decision-feedback" tabindex="-1" aria-labelledby="feedback-heading"><p class="eyebrow">把判斷，再往前推進一步</p><h3 id="feedback-heading">指引在這裡，提醒我們什麼？</h3><p>${o.feedback}</p><div class="action-tip"><strong>可以帶回現場的一步</strong>${o.action}</div><a class="source-link" href="${D.policyURL}#page=${parseInt(q.pages,10)+4}" target="_blank" rel="noopener noreferrer">對照指引內文第 ${q.pages} 頁 ↗</a><div class="button-row" style="margin-top:20px"><button class="btn btn-primary" type="button" id="next-question">${qi===8?'回顧我的想法':qi%3===2?'走進下一個案例':'繼續這段對話'} →</button></div>${qi%3===2&&qi<8?`<p class="next-case-tag">接下來：${D.cases[Math.floor(qi/3)+1].title}</p>`:''}</section>`;}
  function renderReflection(){
    main.innerHTML=`<div class="intro-heading"><p class="eyebrow">三個案例之後</p><h1>${state.profile.nickname?`${esc(state.profile.nickname)}，`:'此刻，'}<br>你想留下什麼？</h1><p>把剛才的判斷帶回自己的教育現場，也幫助我們把指引與遊戲做得更貼近實際需要。</p></div><div class="reflection-intro">歡迎分享你的想法，簡短幾句即可。若暫無想法，可填「無」或直接略過，不影響完成遊戲及下載行動卡。</div><form id="reflection-form" class="form-card"><div class="reflection-grid">${D.reflections.map(r=>`<div><label for="${r.key}">${r.label} <span class="optional">選填</span></label><p class="reflection-question" id="${r.key}-help">${r.question}</p><textarea id="${r.key}" name="${r.key}" maxlength="3000" aria-describedby="${r.key}-help" placeholder="${r.placeholder}">${esc(state.reflections[r.key])}</textarea><p class="reflection-count"><span id="${r.key}-count">${state.reflections[r.key].length}</span> / 3000</p></div>`).join('')}</div><div class="form-actions button-row"><button class="btn btn-quiet" type="button" id="back-case">← 回看案例</button><button class="btn btn-primary push-right" type="submit">完成，製作我的行動卡 ↗</button></div><p class="local-note">${C.endpoint?'按下完成後，會送出本次背景、情境選擇及自願填寫的回應。':'本次為體驗模式，作答未連接收件，仍可下載行動卡。'}</p></form>`;
    document.getElementById('reflection-form').oninput=e=>{if(!D.reflections.some(r=>r.key===e.target.name))return;state.reflections[e.target.name]=e.target.value;document.getElementById(`${e.target.name}-count`).textContent=e.target.value.length;if(state.send.status==='sent')state.send={status:'idle',message:''};save();};
    document.getElementById('reflection-form').onsubmit=e=>{e.preventDefault();if(!L.ready(state))return;state.completedAt=state.completedAt||new Date().toISOString();go('result');};
    document.getElementById('back-case').onclick=()=>go('question',8);
  }
  function renderResult(){
    const card=L.makeCard(state),name=state.profile.nickname||'老師';
    main.innerHTML=`<div class="result-layout"><section class="result-copy"><p class="eyebrow">把今天的想法，帶回下一次現場</p><h1>${esc(name)}，<br>這是你的行動卡。</h1><p>從這次的情境選擇，整理你優先考量的事情，以及下一步可以練習的做法。</p><div class="result-values"><div><h3>我重視的事</h3>${card.values.map(v=>`<p>${esc(v)}</p>`).join('')}</div><div><h3>我會怎麼做</h3><ul>${card.actions.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div><div><h3>我想多留意</h3><p>${esc(card.next)}</p></div></div><p class="card-description">這張卡描述本次選擇帶出的考量與建議，並非人格分類或能力評分。</p><div id="send-status" class="send-status" role="status" aria-live="polite"></div><div class="button-row"><button class="btn btn-quiet" id="edit-feedback">← 回看省思與意見</button><button class="btn btn-quiet" data-restart>重新練習</button></div></section><section class="result-card-area" aria-label="行動卡預覽與下載"><div class="result-card-wrap"><div class="card-loading" id="card-loading">正在準備你的行動卡…</div><img id="card-image" alt="我的合理調整行動卡，完整文字已列於本頁" hidden></div><div class="result-actions"><button class="btn btn-primary" id="download-card" disabled>下載行動卡 PNG ↓</button><a class="btn btn-light" id="open-card" target="_blank" rel="noopener" hidden>開啟圖片 ↗</a></div><p class="small muted">手機若未直接下載，可開啟圖片後長按儲存。</p><p id="card-error" class="toast" role="alert"></p></section></div><details class="review-decisions"><summary>回看我在三個案例中的選擇</summary>${D.cases.map(c=>`<section class="review-case"><h3>${c.name}｜${c.title}</h3>${c.questions.map(q=>`<p><strong>${q.title}</strong>${esc(L.selection(q,state)?.label||'')}</p>`).join('')}</section>`).join('')}</details>`;
    document.getElementById('edit-feedback').onclick=()=>go('reflection');updateSendStatus();
    const gameID=state.id;
    createCardImage(card,name,state.completedAt).then(blob=>{
      if(state.id!==gameID||state.step!=='result')return;
      if(cardURL)URL.revokeObjectURL(cardURL);cardURL=URL.createObjectURL(blob);
      const img=document.getElementById('card-image'),open=document.getElementById('open-card'),btn=document.getElementById('download-card');
      img.src=cardURL;img.hidden=false;document.getElementById('card-loading').hidden=true;open.href=cardURL;open.hidden=false;btn.disabled=false;
      btn.onclick=()=>{const a=document.createElement('a');a.href=cardURL;a.download=`我的合理調整行動卡_${name.replace(/[\\/:*?"<>|\u0000-\u001f]/g,'').slice(0,20)||'老師'}.png`;document.body.appendChild(a);a.click();a.remove();announce('行動卡圖片已準備下載。');};
    }).catch(()=>{if(state.id===gameID&&state.step==='result'){document.getElementById('card-loading').hidden=true;document.getElementById('card-error').textContent='圖片暫時無法產生。請重新整理後再試，本頁的行動內容仍會保留。';}});
    if(state.send.status==='idle')sendResponse();
  }
  function roundRect(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
  async function createCardImage(card,name,date){
    if(document.fonts?.ready)await document.fonts.ready;
    const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1440;const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('canvas unavailable');
    const font='"PingFang TC","Noto Sans CJK TC","Microsoft JhengHei",sans-serif';
    function text(str,x,y,size=28,color='#173e3c',weight=400){ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${font}`;ctx.fillText(str,x,y);}
    function wrap(str,x,y,width,size=27,line=43,color='#173e3c',weight=400){ctx.font=`${weight} ${size}px ${font}`;let current='';const lines=[];for(const char of Array.from(str)){if(char==='\n'){lines.push(current);current='';continue;}if(ctx.measureText(current+char).width>width&&current){lines.push(current);current=char;}else current+=char;}if(current)lines.push(current);lines.forEach((s,i)=>text(s,x,y+i*line,size,color,weight));return y+lines.length*line;}
    ctx.fillStyle='#f8f6ef';ctx.fillRect(0,0,1000,1440);
    roundRect(ctx,35,35,930,1370,32,'#fffefa');
    roundRect(ctx,65,65,870,278,26,'#173e3c');
    ctx.globalAlpha=.18;ctx.strokeStyle='#f5dfa9';ctx.lineWidth=2;for(const radius of [91,126,160]){ctx.beginPath();ctx.arc(887,107,radius,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
    text('一起找到方法  /  合理調整情境遊戲',99,116,20,'#dceadd',500);
    text('我的合理調整行動卡',98,190,46,'#fffefa',700);
    wrap(`${name} 的這一次練習`,101,245,675,27,38,'#f5dfa9',500);
    const formatted=new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date||Date.now()));
    text(formatted,101,309,18,'#dceadd');
    let y=wrap(card.theme,100,415,795,37,53,'#173e3c',700);
    y+=34;text('01   我重視的事',100,y,23,'#28665b',700);y+=42;
    for(const v of card.values)y=wrap(v,100,y,795,25,40)+8;
    y+=22;ctx.strokeStyle='#d5ddcf';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(100,y);ctx.lineTo(900,y);ctx.stroke();y+=47;
    text('02   我會怎麼做',100,y,23,'#28665b',700);y+=44;
    for(let i=0;i<card.actions.length;i++){text(`${i+1}.`,100,y,25,'#28665b',700);y=wrap(card.actions[i],135,y,755,25,40)+14;}
    y+=15;
    const noteStart=y;ctx.font=`400 25px ${font}`;
    // Reserve enough room for every generated reminder; the longest is four lines.
    roundRect(ctx,78,noteStart-18,844,205,18,'#e6eee2');
    text('03   我想多留意',101,noteStart+19,23,'#28665b',700);
    const noteEnd=wrap(card.next,101,noteStart+66,791,25,39);
    if(noteEnd>1300)throw new Error('card text exceeds layout');
    text('本次選擇的思考與建議，並非人格分類或能力評分。',100,1317,17,'#526562');
    text(D.designer,100,1356,19,'#173e3c',500);
    return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG export failed')),'image/png'));
  }
  function openGuide(code){
    if(!D.guides[code])return;activeGuide=code;
    if(state.step==='question'){const cid=L.questions[state.questionIndex].caseId;if(!state.hints[cid].includes(code))state.hints[cid].push(code);save();}
    const g=D.guides[code];
    document.getElementById('guide-content').innerHTML=`<div class="guide-header"><div><p class="eyebrow">需要時，隨手翻一下</p><h2 id="guide-heading">指引小抄</h2></div><button class="close-btn" id="close-guide" aria-label="關閉指引">×</button></div><div class="guide-tabs" aria-label="選擇流程階段或原則">${Object.entries(D.guides).map(([key,v])=>`<button type="button" data-guide-tab="${key}" aria-pressed="${key===code}">${v.type.startsWith('階段')?`${v.type} · `:''}${v.short}</button>`).join('')}</div><section class="guide-body"><p class="eyebrow">${g.type}</p><h3>${g.title}</h3><p>${g.text}</p><a class="source-link" href="${D.policyURL}#page=${parseInt(g.pages,10)+4}" target="_blank" rel="noopener noreferrer">對照指引內文第 ${g.pages} 頁 ↗</a></section><div class="guide-footer"><p>四項原則是研判措施的重要切入點。個別化、保密、適用對象與範圍、拒絕需舉證及替代方案、不需額外付費，也一併放在情境中思考。</p>教育部指引草案（研習用），114 年 12 月。</div>`;
    document.getElementById('close-guide').onclick=()=>guide.close();
    if(!guide.open)guide.showModal();else guide.querySelector(`[data-guide-tab="${code}"]`).focus();
  }
  function endpointValid(){try{const u=new URL(C.endpoint);return u.protocol==='https:'&&u.hostname==='script.google.com'&&/^\/macros\/s\/[\w-]+\/exec$/.test(u.pathname)&&!u.search&&!u.hash;}catch{return false;}}
  function googleMessageOrigin(origin){try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||/^[a-z0-9-]+-script\.googleusercontent\.com$/.test(u.hostname));}catch{return false;}}
  function postWithReceipt(body){
    return new Promise((resolve,reject)=>{
      const nonce=uid(),frame=document.createElement('iframe'),form=document.createElement('form');
      frame.name=`ra-response-${nonce}`;frame.title='回應收件確認';frame.hidden=true;
      form.method='POST';form.action=C.endpoint;form.target=frame.name;form.hidden=true;form.acceptCharset='UTF-8';
      const values={payload:JSON.stringify(body),nonce,reply_origin:location.origin};
      Object.entries(values).forEach(([key,value])=>{const input=document.createElement('input');input.type='hidden';input.name=key;input.value=value;form.appendChild(input);});
      const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',received);form.remove();frame.remove();};
      function received(event){const data=event.data;if(!googleMessageOrigin(event.origin)||!data||data.type!=='ra-game-receipt'||data.nonce!==nonce||data.id!==body.record.play_id)return;cleanup();data.ok===true?resolve(data):reject(new Error('server'));}
      const timer=setTimeout(()=>{cleanup();reject(new Error('timeout'));},Math.min(60000,Math.max(5000,Number(C.requestTimeoutMs)||25000)));
      window.addEventListener('message',received);document.body.append(frame,form);
      try{form.submit();}catch(error){cleanup();reject(error);}
    });
  }
  async function sendResponse(){
    if(sending||state.send.status==='sent')return;
    if(!C.endpoint){state.send={status:'local',message:''};save();updateSendStatus();return;}
    if(!endpointValid()||location.protocol==='file:'){state.send={status:'failed',message:'這個版本目前無法連上收件服務。你的行動卡仍可下載。'};save();updateSendStatus();return;}
    const currentID=state.id;let data;try{data=L.payload(state,C);}catch{return;}
    sending=true;state.send={status:'sending',message:''};save();updateSendStatus();
    try{await postWithReceipt(data);if(state.id===currentID)state.send={status:'sent',message:''};}
    catch{if(state.id===currentID)state.send={status:'failed',message:'尚未確認收到你的回應。可以稍後重試，行動卡仍可下載。'};}
    finally{sending=false;if(state.id===currentID){save();updateSendStatus();}}
  }
  function updateSendStatus(){
    const el=document.getElementById('send-status');if(!el)return;
    const status=state.send.status;el.dataset.status=status;
    const messages={idle:C.endpoint?'正在準備送出回應…':'本次為體驗模式，作答未送出。',local:'本次為體驗模式，作答未送出。',sending:'正在送出本次回應，行動卡可先下載。',sent:'已收到本次回應，謝謝你提供修訂參考。',failed:state.send.message};
    el.innerHTML=`<p>${esc(messages[status]||'')}</p>${status==='failed'?'<button class="btn btn-small btn-light" id="retry-send" type="button">重試送出</button>':''}`;
    if(status==='failed')document.getElementById('retry-send').onclick=sendResponse;
  }
  document.addEventListener('click',event=>{
    const guideButton=event.target.closest('[data-guide]');if(guideButton){openGuide(guideButton.dataset.guide);return;}
    const tab=event.target.closest('[data-guide-tab]');if(tab){openGuide(tab.dataset.guideTab);return;}
    if(event.target.closest('[data-restart]'))document.getElementById('restart-dialog').showModal();
  });
  document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();go('home');});
  document.getElementById('cancel-restart').onclick=()=>document.getElementById('restart-dialog').close();
  document.getElementById('confirm-restart').onclick=()=>{document.getElementById('restart-dialog').close();if(cardURL){URL.revokeObjectURL(cardURL);cardURL='';}state=fresh();save();render();};
  guide.addEventListener('click',event=>{if(event.target===guide){const rect=guide.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)guide.close();}});
  render();
})();
