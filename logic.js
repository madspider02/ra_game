(function(root){
  'use strict';
  const D=root.RA_DATA;
  const questions=D.cases.flatMap(c=>c.questions.map(q=>({...q,caseId:c.id})));
  const fields=[
    ['play_id','作答編號'],['completed_at','完成時間'],['game_version','遊戲版本'],['guideline_version','依據指引版本'],['collection_batch','收集場次'],['record_type','紀錄類型'],
    ['nickname','希望的稱呼'],['gender','性別'],['service_county','主要服務縣市'],['education_stage','主要服務教育階段'],['roles','目前服務身分'],['tenure_band','教育現場服務年資'],['request_experience','調整需求處理經驗'],['guideline_experience','指引接觸與使用經驗'],
    ...D.students.map((s,i)=>[s.id,`序幕學生${i+1}判斷`]),
    ...questions.map(q=>[q.id,`案例${q.caseId}決策${q.id.slice(-1)}`]),
    ...D.cases.map(c=>[`case${c.id}_hints`,`案例${c.id}開啟提示`]),
    ['reflection_self','個人省思'],['feedback','意見回饋'],['card_theme','行動卡主題'],['card_values','我重視的事'],['card_actions','我會怎麼做'],['card_next_step','我想多留意'],
  ];
  const themes={
    voice:{name:'從聆聽開始，讓支持貼近人',value:'你在本次選擇中，多次先考量學生的需要與感受。',action:'邀請學生說明困難，並一起確認適合的支持方式。'},
    learning:{name:'看清學習核心，打開參與方式',value:'你在本次選擇中，留意學習目的與呈現方式的關係。',action:'先說清楚核心學習，再討論可以改變的完成方式。'},
    feasibility:{name:'把支持變成做得到的安排',value:'你在本次選擇中，多次關注資源、環境與執行條件。',action:'具體查明學校與主管機關資源，和學生比較可行方案。'},
    process:{name:'把責任接起來，讓支持持續',value:'你在本次選擇中，多次留意受理、分工與執行程序。',action:'可立即提供的支持先落實，跨單位需求由窗口協調。'},
    fairness:{name:'重新看見公平的不同樣子',value:'你在本次選擇中，留意一致規則、評量與公平之間的關係。',action:'以平等參與為出發點，區分必要調整與保障學習結果。'},
  };
  const reminders={eligibility:'適用判斷不只看特教身分；也要了解障礙處境、佐證與實質需要。',delay:'清楚且可立即協調的支持，不必等正式會議才開始。',coordination:'跨科與跨單位的需求，需要學校窗口接起協調責任。',privacy:'分享資料前，先確認需要知道的人、必要內容及學生意願。',tracking:'措施是否有效，要聽學生的實際經驗，並約定追蹤時間。',fairness:'別讓「大家都一樣」成為唯一的公平標準。',individual:'同類型障礙，也可能需要不同措施；每次都要回到具體任務。',alternatives:'某項請求不適合時，分別說明理由，並討論仍能保留參與的替代方式。',resources:'評估負擔不能只看班級預算，也要查明學校與主管機關可用支持。',goals:'改變呈現方式可以保留核心學習；提供支持不等於保證及格。',costs:'學生不應額外負擔合理調整所增加的費用。',participation:'「到得了」之後，還要確認能否一起參與、表達與完成任務。',implementation:'把同意的方案轉成明確的負責人、時程與備案。',voice:'即使出於照顧，也要保留學生確認方案與表達意見的機會。'};
  function selection(q,state){return q.options.find(o=>o.id===state.answers[q.id]);}
  function makeCard(state){
    const counts={},watches={},chosen=questions.map(q=>selection(q,state)).filter(Boolean);
    chosen.forEach(o=>{o.focus.forEach(f=>counts[f]=(counts[f]||0)+1);if(o.watch)watches[o.watch]=(watches[o.watch]||0)+1;});
    const ranked=Object.keys(themes).sort((a,b)=>(counts[b]||0)-(counts[a]||0)).filter(k=>counts[k]);
    if(!ranked.length)ranked.push('voice','learning');
    const top=ranked.slice(0,2), watch=Object.keys(watches).sort((a,b)=>watches[b]-watches[a])[0];
    return {theme:themes[top[0]].name,values:top.map(k=>themes[k].value),actions:[...new Set([...top.map(k=>themes[k].action),'約定負責人與追蹤時間，回看調整是否改善參與。'])].slice(0,3),next:reminders[watch]||'持續把學生的實際參與帶回討論，也為每項措施安排追蹤與檢討。'};
  }
  function cleanProfile(p){const result={};D.profile.forEach(f=>{const v=p&&p[f.key];if(f.kind==='text')result[f.key]=typeof v==='string'?v.slice(0,20):'';else if(f.kind==='multi'){let list=Array.isArray(v)?[...new Set(v.filter(x=>f.options.includes(x)))]:[];const exclusive=list.find(x=>['目前未服務','不願透露'].includes(x));result[f.key]=exclusive?[exclusive]:list;}else result[f.key]=f.options.includes(v)?v:'';});return result;}
  function ready(state){return D.students.every(s=>D.introOptions.some(o=>o.id===state.intro[s.id]))&&questions.every(q=>selection(q,state)&&state.revealed[q.id]);}
  function payload(state,config){
    if(!ready(state))throw new Error('尚有情境未完成');
    const card=makeCard(state),p=cleanProfile(state.profile),record={play_id:state.id,completed_at:state.completedAt,game_version:D.version,guideline_version:D.guidelineVersion,collection_batch:String(state.batch||'').slice(0,60),record_type:config.recordType==='正式'?'正式':'測試',...p,roles:p.roles.join(' | ')};
    D.students.forEach(s=>record[s.id]=state.intro[s.id]);questions.forEach(q=>record[q.id]=state.answers[q.id]);
    D.cases.forEach(c=>record[`case${c.id}_hints`]=(state.hints[c.id]||[]).filter(k=>D.guides[k]).join(' | ')||'NONE');
    D.reflections.forEach(r=>record[r.key]=String(state.reflections[r.key]||'').slice(0,3000));
    Object.assign(record,{card_theme:card.theme,card_values:card.values.join('\n'),card_actions:card.actions.join('\n'),card_next_step:card.next});
    return {schema_version:1,record};
  }
  const api={questions,fields,makeCard,cleanProfile,ready,payload,selection};root.RA_LOGIC=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
