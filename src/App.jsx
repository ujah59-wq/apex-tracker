import { useState, useEffect, useCallback, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import CaloriesView, { DEFAULT_FOODS } from "./CaloriesView.jsx";

const STORAGE_KEYS = { TASKS:"pt_tasks", DAILY_LOGS:"pt_daily_logs", GOALS:"pt_goals", FOODS:"pt_foods", CALORIE_LOGS:"pt_calorie_logs" };
async function storageGet(key) { 
  try { 
    if (typeof window !== 'undefined' && window.storage) return await window.storage.get(key); 
    const v = localStorage.getItem(key); 
    return v ? { value: v } : null; 
  } catch { return null; } 
}
async function storageSet(key, value) { 
  try { 
    if (typeof window !== 'undefined' && window.storage) await window.storage.set(key, JSON.stringify(value)); 
    else localStorage.setItem(key, JSON.stringify(value)); 
  } catch {} 
}

const DEFAULT_TASKS = [
  {id:"t1",name:"2HR Trade Journaling",points:15,emoji:"📓"},
  {id:"t2",name:"3k Calorie Surplus",points:10,emoji:"🍽️"},
  {id:"t3",name:"1HR ICE Report",points:5,emoji:"📊"},
  {id:"t4",name:"No Social Media",points:10,emoji:"🚫"},
  {id:"t5",name:"1HR Gym",points:10,emoji:"🏋️"},
  {id:"t6",name:"1HR Reading",points:10,emoji:"📚"},
  {id:"t7",name:"No AC",points:5,emoji:"❄️"},
  {id:"t8",name:"5 Salah",points:10,emoji:"🕌"},
  {id:"t9",name:"30 Pushups",points:5,emoji:"💪"},
  {id:"t10",name:"No MD",points:10,emoji:"🧘"},
  {id:"t11",name:"Clean Room",points:10,emoji:"🏠"},
];

const GOAL_CATEGORIES = [
  {id:"financial",label:"Financial",emoji:"💰"},
  {id:"religious",label:"Religious",emoji:"🕌"},
  {id:"mental",label:"Mental",emoji:"🧠"},
  {id:"dating",label:"Dating",emoji:"❤️"},
  {id:"productivity",label:"Productivity",emoji:"⚡"},
  {id:"social",label:"Social",emoji:"🤝"},
  {id:"family",label:"Family",emoji:"👨‍👩‍👧"},
];

const TASK_STATUS = {DONE:"done",NOT_DONE:"not_done",UNCHECKED:"unchecked"};
const todayStr=()=>new Date().toISOString().slice(0,10);
const currentMonthKey=()=>todayStr().slice(0,7);
const formatMonthKey=(mk)=>new Date(mk+"-01T12:00:00").toLocaleDateString("en-US",{month:"long",year:"numeric"});
function scoreColor(s){if(s>=90)return{solid:"#16a34a",glass:"rgba(34,197,94,0.18)",border:"rgba(34,197,94,0.35)"};if(s>=70)return{solid:"#0891b2",glass:"rgba(6,182,212,0.18)",border:"rgba(6,182,212,0.35)"};if(s>=50)return{solid:"#d97706",glass:"rgba(251,191,36,0.18)",border:"rgba(251,191,36,0.35)"};return{solid:"#dc2626",glass:"rgba(239,68,68,0.18)",border:"rgba(239,68,68,0.35)"};}
function scoreHex(s){return scoreColor(s).solid;}
function getWeekDays(){const days=[],t=new Date();for(let i=6;i>=0;i--){const d=new Date(t);d.setDate(t.getDate()-i);days.push(d.toISOString().slice(0,10));}return days;}
function formatDate(ds){return new Date(ds+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function formatDateLong(ds){return new Date(ds+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});}
function getDaysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function calcScore(statuses,tasks){return tasks.filter(t=>statuses[t.id]===TASK_STATUS.DONE).reduce((s,t)=>s+t.points,0);}

const BUBBLES=[
  {w:520,h:520,x:-10,y:-10,color:"rgba(167,139,250,0.28)",dur:18,delay:0},
  {w:420,h:420,x:55,y:35,color:"rgba(96,165,250,0.22)",dur:22,delay:3},
  {w:380,h:380,x:5,y:55,color:"rgba(52,211,153,0.20)",dur:26,delay:1},
  {w:300,h:300,x:70,y:5,color:"rgba(251,146,60,0.18)",dur:20,delay:5},
  {w:260,h:260,x:20,y:70,color:"rgba(244,114,182,0.22)",dur:24,delay:2},
  {w:200,h:200,x:75,y:60,color:"rgba(250,204,21,0.18)",dur:28,delay:7},
];
function BubbleBackground(){return(<div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}><div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#f0f4ff 0%,#faf5ff 30%,#f0fdf4 60%,#fff7ed 100%)"}}/>{BUBBLES.map((b,i)=>(<div key={i} className={`bubble bubble-${i}`} style={{position:"absolute",width:b.w,height:b.h,left:`${b.x}%`,top:`${b.y}%`,borderRadius:"50%",background:b.color,filter:"blur(48px)",animationDuration:`${b.dur}s`,animationDelay:`${b.delay}s`}}/>))}</div>);}
function Glass({children,style={},className=""}){return(<div className={`glass-card ${className}`} style={{background:"rgba(255,255,255,0.55)",backdropFilter:"blur(28px) saturate(180%)",WebkitBackdropFilter:"blur(28px) saturate(180%)",border:"1px solid rgba(255,255,255,0.75)",borderRadius:22,boxShadow:"0 8px 32px rgba(100,80,200,0.08), 0 1.5px 0 rgba(255,255,255,0.9) inset",...style}}>{children}</div>);}
function CustomTooltip({active,payload,label}){if(!active||!payload?.length)return null;return(<div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.9)",borderRadius:12,padding:"8px 14px",boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}><div style={{color:"#9ca3af",fontSize:11,marginBottom:2}}>{label}</div><div style={{color:"#6d28d9",fontWeight:800,fontSize:18}}>{payload[0].value}</div></div>);}
function Chip({children}){return<div style={{background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:20,padding:"4px 11px",fontSize:11,color:"#7c3aed",fontWeight:600}}>{children}</div>;}
function ChartLabel({children}){return<div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#94a3b8",marginBottom:12}}>{children}</div>;}

function TaskNotePanel({taskId,note,onChange}){
  const[open,setOpen]=useState(false);
  const n=note||{feelBefore:"",feelAfter:"",items:[]};
  const update=(patch)=>onChange(taskId,{...n,...patch});
  const addItem=()=>update({items:[...n.items,{id:Date.now().toString(),text:"",done:false}]});
  const toggleItem=(id)=>update({items:n.items.map(it=>it.id===id?{...it,done:!it.done}:it)});
  const editItem=(id,text)=>update({items:n.items.map(it=>it.id===id?{...it,text}:it)});
  const removeItem=(id)=>update({items:n.items.filter(it=>it.id!==id)});
  return(<div style={{marginTop:6}}><button onClick={(e)=>{e.stopPropagation();setOpen(o=>!o);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#7c3aed",fontWeight:600,padding:"2px 0",fontFamily:"inherit"}}>{open?"▲ hide notes":"▼ add notes / progress"}</button>{open&&(<div onClick={e=>e.stopPropagation()} style={{marginTop:8,padding:"12px 14px",background:"rgba(124,58,237,0.05)",borderRadius:14,border:"1px solid rgba(124,58,237,0.15)"}}><div style={{display:"flex",gap:8,marginBottom:10}}><div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>😐 Before</div><textarea value={n.feelBefore} onChange={e=>update({feelBefore:e.target.value})} placeholder="How did you feel before?" rows={2} style={{...inp,width:"100%",resize:"none",fontSize:12}}/></div><div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>😊 After</div><textarea value={n.feelAfter} onChange={e=>update({feelAfter:e.target.value})} placeholder="How did you feel after?" rows={2} style={{...inp,width:"100%",resize:"none",fontSize:12}}/></div></div><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>📋 Progress Checklist</div>{n.items.map(it=>(<div key={it.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><button onClick={()=>toggleItem(it.id)} style={{width:18,height:18,borderRadius:5,border:"1.5px solid rgba(124,58,237,0.4)",background:it.done?"linear-gradient(135deg,#7c3aed,#2563eb)":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{it.done&&<span style={{color:"#fff",fontSize:10,fontWeight:800}}>✓</span>}</button><input value={it.text} onChange={e=>editItem(it.id,e.target.value)} placeholder="Progress item..." style={{...inp,flex:1,fontSize:12,padding:"5px 9px",textDecoration:it.done?"line-through":"none",opacity:it.done?0.6:1}}/><button onClick={()=>removeItem(it.id)} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:14,padding:"0 2px"}}>✕</button></div>))}<button onClick={addItem} style={{fontSize:11,color:"#7c3aed",fontWeight:700,background:"rgba(124,58,237,0.08)",border:"1px dashed rgba(124,58,237,0.3)",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",marginTop:4}}>+ Add item</button></div>)}</div>);
}

function DayView({dateStr,tasks,log,onUpdate}){
  const statuses=log?.statuses||{};
  const notes=log?.notes||{};
  const totalPoints=tasks.reduce((s,t)=>s+t.points,0);
  const score=calcScore(statuses,tasks);
  const pct=totalPoints>0?Math.round((score/totalPoints)*100):0;
  const sc=scoreColor(pct);
  const cycleStatus=(taskId)=>{
    const cur=statuses[taskId]||TASK_STATUS.UNCHECKED;
    const next=cur===TASK_STATUS.UNCHECKED?TASK_STATUS.DONE:cur===TASK_STATUS.DONE?TASK_STATUS.NOT_DONE:TASK_STATUS.UNCHECKED;
    const newStatuses={...statuses,[taskId]:next};
    onUpdate({...log,statuses:newStatuses,score:calcScore(newStatuses,tasks),completed:Object.keys(newStatuses).filter(id=>newStatuses[id]===TASK_STATUS.DONE)});
  };
  const updateNote=(taskId,note)=>onUpdate({...log,notes:{...notes,[taskId]:note}});
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}><div style={{fontSize:12,color:"#94a3b8"}}>{formatDateLong(dateStr)}</div><div style={{display:"flex",alignItems:"baseline",gap:2}}><span style={{fontSize:28,fontWeight:800,color:sc.solid}}>{score}</span><span style={{fontSize:13,color:"#94a3b8"}}>/{totalPoints}</span></div></div><div style={{height:5,background:"rgba(0,0,0,0.07)",borderRadius:3,marginBottom:16,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${sc.solid},${sc.solid}cc)`,borderRadius:3,transition:"width 0.5s"}}/></div><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Tap: unchecked → ✅ done → ❌ not done</div><div style={{display:"flex",flexDirection:"column",gap:10}}>{tasks.map(task=>{const status=statuses[task.id]||TASK_STATUS.UNCHECKED;const isDone=status===TASK_STATUS.DONE;const isNotDone=status===TASK_STATUS.NOT_DONE;return(<div key={task.id} style={{padding:"12px 16px",borderRadius:18,background:isDone?"rgba(124,58,237,0.1)":isNotDone?"rgba(239,68,68,0.07)":"rgba(255,255,255,0.55)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",boxShadow:isDone?"0 2px 12px rgba(124,58,237,0.15)":"0 2px 16px rgba(0,0,0,0.06)",borderLeft:isDone?"3px solid #7c3aed":isNotDone?"3px solid #dc2626":"3px solid transparent",transition:"all 0.22s"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>cycleStatus(task.id)}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:26,height:26,borderRadius:8,flexShrink:0,background:isDone?"linear-gradient(135deg,#7c3aed,#2563eb)":isNotDone?"rgba(239,68,68,0.15)":"rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:isDone?"0 3px 10px rgba(124,58,237,0.4)":"none",border:isNotDone?"1.5px solid rgba(239,68,68,0.4)":"none",transition:"all 0.22s"}}>{isDone&&<span style={{color:"#fff",fontSize:13,fontWeight:800}}>✓</span>}{isNotDone&&<span style={{color:"#dc2626",fontSize:13,fontWeight:800}}>✕</span>}</div><span style={{fontSize:18}}>{task.emoji}</span><span style={{fontSize:14,fontWeight:600,color:isDone?"#7c3aed":isNotDone?"#dc2626":"#334155",textDecoration:isDone?"line-through":"none",opacity:isDone||isNotDone?0.8:1}}>{task.name}</span></div><div style={{fontSize:12,fontWeight:700,color:isDone?"#7c3aed":isNotDone?"#dc2626":"#94a3b8",background:isDone?"rgba(124,58,237,0.1)":isNotDone?"rgba(239,68,68,0.08)":"rgba(0,0,0,0.05)",padding:"3px 9px",borderRadius:20}}>{isDone?`+${task.points}`:isNotDone?"✕":`+${task.points}`}</div></div><TaskNotePanel taskId={task.id} note={notes[task.id]} onChange={updateNote}/></div>);})}</div>{pct===100&&(<Glass style={{marginTop:16,padding:16,textAlign:"center",background:"rgba(124,58,237,0.08)",borderColor:"rgba(124,58,237,0.3)"}}><div style={{fontSize:22}}>🌟</div><div style={{fontWeight:800,color:"#7c3aed",fontSize:15,marginTop:4}}>Perfect Day!</div></Glass>)}</div>);
}

function GoalsView({goals,onUpdate}){
  const mk=currentMonthKey();
  const[selectedMonth,setSelectedMonth]=useState(mk);
  const[addingFor,setAddingFor]=useState(null);
  const[newGoalText,setNewGoalText]=useState("");
  const allMonths=useMemo(()=>{const keys=new Set([mk,...Object.keys(goals)]);return[...keys].sort().reverse();},[goals,mk]);
  const monthGoals=goals[selectedMonth]||{};
  const addGoal=(catId)=>{if(!newGoalText.trim())return;const cat=monthGoals[catId]||[];onUpdate({...goals,[selectedMonth]:{...monthGoals,[catId]:[...cat,{id:Date.now().toString(),text:newGoalText.trim(),done:false}]}});setNewGoalText("");setAddingFor(null);};
  const toggleGoal=(catId,goalId)=>{const cat=(monthGoals[catId]||[]).map(g=>g.id===goalId?{...g,done:!g.done}:g);onUpdate({...goals,[selectedMonth]:{...monthGoals,[catId]:cat}});};
  const deleteGoal=(catId,goalId)=>{const cat=(monthGoals[catId]||[]).filter(g=>g.id!==goalId);onUpdate({...goals,[selectedMonth]:{...monthGoals,[catId]:cat}});};
  return(<div style={pg}><h1 style={ptitle}>Monthly Goals</h1><div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>{allMonths.map(m=>(<button key={m} onClick={()=>setSelectedMonth(m)} style={{flexShrink:0,padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",background:selectedMonth===m?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,0.6)",color:selectedMonth===m?"#fff":"#64748b",fontWeight:selectedMonth===m?700:500,fontSize:12,boxShadow:selectedMonth===m?"0 4px 14px rgba(124,58,237,0.3)":"0 2px 8px rgba(0,0,0,0.06)"}}>{formatMonthKey(m)}</button>))}</div><div style={{display:"flex",flexDirection:"column",gap:12}}>{GOAL_CATEGORIES.map(cat=>{const items=monthGoals[cat.id]||[];const doneCount=items.filter(g=>g.done).length;return(<Glass key={cat.id} style={{padding:16}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:items.length>0||addingFor===cat.id?10:0}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{cat.emoji}</span><div><div style={{fontWeight:800,fontSize:14,color:"#1e1b4b"}}>{cat.label}</div>{items.length>0&&<div style={{fontSize:11,color:"#94a3b8"}}>{doneCount}/{items.length} complete</div>}</div></div><button onClick={()=>setAddingFor(addingFor===cat.id?null:cat.id)} style={{background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:10,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>+ Add</button></div>{items.length>0&&(<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:addingFor===cat.id?10:0}}>{items.map(g=>(<div key={g.id} style={{display:"flex",alignItems:"center",gap:8}}><button onClick={()=>toggleGoal(cat.id,g.id)} style={{width:20,height:20,borderRadius:6,border:"1.5px solid rgba(124,58,237,0.4)",background:g.done?"linear-gradient(135deg,#7c3aed,#2563eb)":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{g.done&&<span style={{color:"#fff",fontSize:11,fontWeight:800}}>✓</span>}</button><span style={{flex:1,fontSize:13,color:g.done?"#94a3b8":"#334155",textDecoration:g.done?"line-through":"none",fontWeight:500}}>{g.text}</span><button onClick={()=>deleteGoal(cat.id,g.id)} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:13,opacity:0.6}}>✕</button></div>))}</div>)}{addingFor===cat.id&&(<div style={{display:"flex",gap:8}}><input autoFocus value={newGoalText} onChange={e=>setNewGoalText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGoal(cat.id)} placeholder={`Add ${cat.label} goal...`} style={{...inp,flex:1,fontSize:13}}/><button onClick={()=>addGoal(cat.id)} style={btnSave}>Save</button><button onClick={()=>setAddingFor(null)} style={btnCancel}>✕</button></div>)}{items.length>0&&(<div style={{height:3,background:"rgba(0,0,0,0.06)",borderRadius:2,marginTop:10,overflow:"hidden"}}><div style={{height:"100%",width:`${items.length?Math.round((doneCount/items.length)*100):0}%`,background:"linear-gradient(90deg,#7c3aed,#2563eb)",borderRadius:2,transition:"width 0.4s"}}/></div>)}</Glass>);})}</div></div>);
}

export default function ProductivityTracker(){
  const[tasks,setTasks]=useState(DEFAULT_TASKS);
  const[dailyLogs,setDailyLogs]=useState({});
  const[goals,setGoals]=useState({});
  const[foods,setFoods]=useState(DEFAULT_FOODS);
  const[calorieLogs,setCalorieLogs]=useState({});
  const[view,setView]=useState("dashboard");
  const[calendarDate,setCalendarDate]=useState(()=>{const n=new Date();return{year:n.getFullYear(),month:n.getMonth()};});
  const[selectedDay,setSelectedDay]=useState(null);
  const[settingsEdit,setSettingsEdit]=useState(null);
  const[newTaskForm,setNewTaskForm]=useState({name:"",points:5,emoji:"✅"});
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      const[tRes,lRes,gRes,fRes,cRes]=await Promise.all([storageGet(STORAGE_KEYS.TASKS),storageGet(STORAGE_KEYS.DAILY_LOGS),storageGet(STORAGE_KEYS.GOALS),storageGet(STORAGE_KEYS.FOODS),storageGet(STORAGE_KEYS.CALORIE_LOGS)]);
      if(tRes?.value){try{setTasks(JSON.parse(tRes.value));}catch{}}
      if(lRes?.value){try{setDailyLogs(JSON.parse(lRes.value));}catch{}}
      if(gRes?.value){try{setGoals(JSON.parse(gRes.value));}catch{}}
      if(fRes?.value){try{setFoods(JSON.parse(fRes.value));}catch{}}
      if(cRes?.value){try{setCalorieLogs(JSON.parse(cRes.value));}catch{}}
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{if(!loading)storageSet(STORAGE_KEYS.TASKS,tasks);},[tasks,loading]);
  useEffect(()=>{if(!loading)storageSet(STORAGE_KEYS.DAILY_LOGS,dailyLogs);},[dailyLogs,loading]);
  useEffect(()=>{if(!loading)storageSet(STORAGE_KEYS.GOALS,goals);},[goals,loading]);
  useEffect(()=>{if(!loading)storageSet(STORAGE_KEYS.FOODS,foods);},[foods,loading]);
  useEffect(()=>{if(!loading)storageSet(STORAGE_KEYS.CALORIE_LOGS,calorieLogs);},[calorieLogs,loading]);

  const today=todayStr();
  const todayLog=dailyLogs[today]||{statuses:{},notes:{},score:0,completed:[]};
  const totalPoints=tasks.reduce((s,t)=>s+t.points,0);
  const todayScore=todayLog.score||0;
  const pct=totalPoints>0?Math.round((todayScore/totalPoints)*100):0;
  const updateLog=useCallback((dateStr,log)=>{setDailyLogs(prev=>({...prev,[dateStr]:log}));},[]);
  const todayCalorieLog=calorieLogs[today]||{};
  const updateCalorieLog=(log)=>setCalorieLogs(prev=>({...prev,[today]:log}));

  const last30=useMemo(()=>{const days=[];for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);days.push({date:formatDate(ds),score:dailyLogs[ds]?.score||0});}return days;},[dailyLogs]);
  const habitStats=useMemo(()=>{const logDates=Object.keys(dailyLogs).sort();if(!logDates.length)return tasks.map(t=>({...t,rate:0}));return tasks.map(t=>{const done=logDates.filter(d=>dailyLogs[d]?.statuses?.[t.id]===TASK_STATUS.DONE||dailyLogs[d]?.completed?.includes(t.id)).length;return{...t,rate:Math.round((done/logDates.length)*100)};}).sort((a,b)=>b.rate-a.rate);},[dailyLogs,tasks]);
  const streaks=useMemo(()=>{const sorted=Object.keys(dailyLogs).sort().reverse();const tp=tasks.reduce((s,t)=>s+t.points,0);let current=0,perfect=0,bestPerfect=0,tempPerfect=0;for(let i=0;i<sorted.length;i++){if((dailyLogs[sorted[i]]?.score||0)>0)current++;else break;}for(let i=0;i<sorted.length;i++){if((dailyLogs[sorted[i]]?.score||0)>=tp){tempPerfect++;if(i===0)perfect=tempPerfect;}else{bestPerfect=Math.max(bestPerfect,tempPerfect);tempPerfect=0;}}bestPerfect=Math.max(bestPerfect,tempPerfect,perfect);return{current,perfect,bestPerfect};},[dailyLogs,tasks]);
  const analytics=useMemo(()=>{const logDates=Object.keys(dailyLogs).sort();if(!logDates.length)return{weekAvg:0,monthAvg:0,bestDay:null,bestScore:0,mostMissed:null,mostDone:null};const week=getWeekDays();const wScores=week.map(d=>dailyLogs[d]?.score||0).filter(s=>s>0);const weekAvg=wScores.length?Math.round(wScores.reduce((a,b)=>a+b,0)/wScores.length):0;const now=new Date();const mDates=logDates.filter(d=>d.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`));const monthAvg=mDates.length?Math.round(mDates.reduce((s,d)=>s+(dailyLogs[d]?.score||0),0)/mDates.length):0;const bestDay=logDates.reduce((best,d)=>(!best||dailyLogs[d]?.score>dailyLogs[best]?.score)?d:best,null);const taskMissed={},taskDone={};logDates.forEach(d=>tasks.forEach(t=>{if(dailyLogs[d]?.statuses?.[t.id]===TASK_STATUS.DONE||dailyLogs[d]?.completed?.includes(t.id))taskDone[t.id]=(taskDone[t.id]||0)+1;else taskMissed[t.id]=(taskMissed[t.id]||0)+1;}));return{weekAvg,monthAvg,bestDay,bestScore:bestDay?dailyLogs[bestDay]?.score:0,mostMissed:tasks.find(t=>t.id===Object.keys(taskMissed).sort((a,b)=>taskMissed[b]-taskMissed[a])[0]),mostDone:tasks.find(t=>t.id===Object.keys(taskDone).sort((a,b)=>taskDone[b]-taskDone[a])[0])};},[dailyLogs,tasks]);

  const saveTask=(task)=>{setTasks(prev=>prev.map(t=>t.id===task.id?task:t));setSettingsEdit(null);};
  const deleteTask=(id)=>setTasks(prev=>prev.filter(t=>t.id!==id));
  const addTask=()=>{if(!newTaskForm.name.trim())return;setTasks(prev=>[...prev,{...newTaskForm,id:"t"+Date.now()}]);setNewTaskForm({name:"",points:5,emoji:"✅"});};
  const reorderTask=(id,dir)=>setTasks(prev=>{const idx=prev.findIndex(t=>t.id===id);const next=[...prev];const si=idx+dir;if(si<0||si>=next.length)return prev;[next[idx],next[si]]=[next[si],next[idx]];return next;});

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#f0f4ff,#faf5ff)"}}><div style={{fontFamily:"system-ui",color:"#7c3aed",fontSize:18,fontWeight:600}}>Loading…</div></div>);

  const navItems=[
    {id:"dashboard",icon:"⊞",label:"Dash"},
    {id:"today",icon:"◉",label:"Today"},
    {id:"calories",icon:"🍽️",label:"Cals"},
    {id:"calendar",icon:"▦",label:"Cal"},
    {id:"analytics",icon:"▲",label:"Stats"},
    {id:"goals",icon:"🎯",label:"Goals"},
    {id:"settings",icon:"⚙",label:"Set"},
  ];
  const sc=scoreColor(pct);

  return(
    <div style={{minHeight:"100vh",fontFamily:"'SF Pro Rounded','DM Sans',system-ui,sans-serif",position:"relative",color:"#1e1b4b"}}>
      <style>{CSS}</style>
      <BubbleBackground/>
      <nav style={{position:"sticky",top:0,zIndex:200,background:"rgba(255,255,255,0.6)",backdropFilter:"blur(30px) saturate(200%)",WebkitBackdropFilter:"blur(30px) saturate(200%)",borderBottom:"1px solid rgba(255,255,255,0.8)",boxShadow:"0 2px 20px rgba(120,80,220,0.07)"}}>
        <div className="nav-inner">
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:28,height:28,borderRadius:9,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(124,58,237,0.35)",fontSize:14}}>⚡</div>
            <span style={{fontWeight:800,fontSize:16,letterSpacing:"-0.02em",background:"linear-gradient(135deg,#7c3aed,#2563eb)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>APEX</span>
          </div>
        </div>
        <div className="nav-tabs">
          {navItems.map(n=>(<button key={n.id} onClick={()=>setView(n.id)} className="nav-btn" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"7px 12px",borderRadius:12,border:"none",cursor:"pointer",background:view===n.id?"rgba(124,58,237,0.12)":"transparent",color:view===n.id?"#7c3aed":"#94a3b8",fontWeight:view===n.id?700:500,transition:"all 0.2s",fontFamily:"inherit",flexShrink:0,minWidth:52}}><span style={{fontSize:16}}>{n.icon}</span><span style={{fontSize:10,letterSpacing:"0.04em",fontWeight:600}}>{n.label}</span></button>))}
        </div>
      </nav>

      <main style={{position:"relative",zIndex:1,paddingBottom:48}}>

        {view==="dashboard"&&(
          <div style={pg}>
            <h1 style={ptitle}>{formatDateLong(today)}</h1>
            <Glass style={{padding:24,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:24}}>
                <div style={{position:"relative",width:120,height:120,flexShrink:0}}>
                  <svg width="120" height="120" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="9"/>
                    <circle cx="60" cy="60" r="50" fill="none" stroke={sc.solid} strokeWidth="9" strokeDasharray={`${2*Math.PI*50}`} strokeDashoffset={`${2*Math.PI*50*(1-pct/100)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)"}}/>
                  </svg>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <div style={{fontSize:24,fontWeight:800,color:sc.solid,lineHeight:1}}>{todayScore}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>/ {totalPoints}</div>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,letterSpacing:"0.14em",color:"#94a3b8",marginBottom:4,fontWeight:600}}>TODAY'S SCORE</div>
                  <div style={{fontSize:42,fontWeight:800,lineHeight:1,color:sc.solid,letterSpacing:"-0.03em",marginBottom:4}}>{pct}%</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginBottom:12}}>{(todayLog.completed||[]).length} of {tasks.length} done</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Chip>🔥 {streaks.current}d streak</Chip><Chip>⭐ {streaks.perfect} perfect</Chip></div>
                </div>
              </div>
            </Glass>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[{label:"Week Avg",val:analytics.weekAvg,suf:"pts",grad:"135deg,#7c3aed,#2563eb"},{label:"Month Avg",val:analytics.monthAvg,suf:"pts",grad:"135deg,#ec4899,#f97316"},{label:"Best Ever",val:analytics.bestScore||0,suf:"pts",grad:"135deg,#10b981,#06b6d4"},{label:"Best Streak",val:streaks.bestPerfect,suf:"🌟",grad:"135deg,#f59e0b,#ef4444"}].map(s=>(<Glass key={s.label} style={{padding:"16px 18px"}}><div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.02em",background:`linear-gradient(${s.grad})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s.val}<span style={{fontSize:11,fontWeight:600}}> {s.suf}</span></div><div style={{fontSize:10,color:"#94a3b8",marginTop:4,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{s.label}</div></Glass>))}
            </div>
            <Glass style={{padding:18,marginBottom:16}}>
              <ChartLabel>30-Day Trend</ChartLabel>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={last30} margin={{top:5,right:8,left:-22,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/>
                  <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} interval={6}/>
                  <YAxis tick={{fill:"#94a3b8",fontSize:10}} domain={[0,totalPoints]}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5} dot={false} activeDot={{r:5,fill:"#7c3aed"}}/>
                </LineChart>
              </ResponsiveContainer>
            </Glass>
            <Glass style={{padding:18}}>
              <ChartLabel>Habit Completion Rate</ChartLabel>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={habitStats} layout="vertical" margin={{top:0,right:10,left:60,bottom:0}}>
                  <XAxis type="number" domain={[0,100]} tick={{fill:"#94a3b8",fontSize:10}} tickFormatter={v=>`${v}%`}/>
                  <YAxis type="category" dataKey="name" tick={{fill:"#64748b",fontSize:10}} width={60} tickFormatter={v=>v.length>10?v.slice(0,10)+"…":v}/>
                  <Tooltip formatter={v=>[`${v}%`,"Rate"]} contentStyle={{background:"rgba(255,255,255,0.9)",border:"none",borderRadius:10}}/>
                  <Bar dataKey="rate" radius={[0,6,6,0]}>{habitStats.map((e,i)=><Cell key={i} fill={scoreHex(e.rate)}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Glass>
          </div>
        )}

        {view==="today"&&(<div style={pg}><h1 style={{...ptitle,marginBottom:14}}>Today's Tasks</h1><DayView dateStr={today} tasks={tasks} log={todayLog} onUpdate={(log)=>updateLog(today,log)}/></div>)}

        {view==="calories"&&(<CaloriesView foods={foods} onFoodsUpdate={setFoods} calorieLog={todayCalorieLog} onLogUpdate={updateCalorieLog}/>)}

        {view==="calendar"&&(
          <div style={pg}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <button className="cal-nav" onClick={()=>setCalendarDate(d=>{const m=d.month===0?11:d.month-1;return{year:d.month===0?d.year-1:d.year,month:m};})}>‹</button>
              <div style={{fontWeight:800,fontSize:18,letterSpacing:"-0.02em",color:"#1e1b4b"}}>{new Date(calendarDate.year,calendarDate.month).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
              <button className="cal-nav" onClick={()=>setCalendarDate(d=>{const m=d.month===11?0:d.month+1;return{year:d.month===11?d.year+1:d.year,month:m};})}>›</button>
            </div>
            <Glass style={{padding:16,marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#94a3b8",padding:"4px 0"}}>{d}</div>)}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                {(()=>{const firstDay=new Date(calendarDate.year,calendarDate.month,1).getDay();const dim=getDaysInMonth(calendarDate.year,calendarDate.month);const cells=[];for(let i=0;i<firstDay;i++)cells.push(<div key={`e${i}`}/>);for(let d=1;d<=dim;d++){const ds=`${calendarDate.year}-${String(calendarDate.month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const log=dailyLogs[ds];const pctDay=log&&totalPoints>0?Math.round((log.score/totalPoints)*100):0;const col=log?scoreColor(pctDay):null;const isToday=ds===today;const isSel=selectedDay===ds;cells.push(<button key={ds} onClick={()=>setSelectedDay(isSel?null:ds)} className="cal-cell-btn" style={{aspectRatio:"1",borderRadius:10,border:isToday?"2px solid #7c3aed":isSel?"2px solid rgba(124,58,237,0.5)":"2px solid transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:col?col.glass:"rgba(0,0,0,0.02)",transition:"all 0.15s",padding:2}}><div style={{fontSize:12,fontWeight:isToday?800:600,color:isToday?"#7c3aed":col?col.solid:"#64748b"}}>{d}</div>{log&&<div style={{width:4,height:4,borderRadius:"50%",background:col.solid,marginTop:1}}/>}</button>);}return cells;})()}
              </div>
            </Glass>
            <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>{[["#16a34a","90-100"],["#0891b2","70-89"],["#d97706","50-69"],["#dc2626","<50"]].map(([c,l])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:3,background:c}}/><span style={{fontSize:11,color:"#64748b",fontWeight:600}}>{l}</span></div>))}</div>
            {selectedDay&&(<Glass style={{padding:18}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><div style={{fontWeight:800,fontSize:15,color:"#1e1b4b"}}>{formatDateLong(selectedDay)}</div>{selectedDay>today&&<div style={{fontSize:11,color:"#94a3b8"}}>Future date</div>}</div>{selectedDay<=today?(<DayView dateStr={selectedDay} tasks={tasks} log={dailyLogs[selectedDay]||{statuses:{},notes:{},score:0,completed:[]}} onUpdate={(log)=>updateLog(selectedDay,log)}/>):(<div style={{color:"#94a3b8",fontSize:13}}>Can't log future dates.</div>)}</Glass>)}
          </div>
        )}

        {view==="analytics"&&(
          <div style={pg}>
            <h1 style={ptitle}>Analytics</h1>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[{label:"Week Avg",val:analytics.weekAvg,sub:"points",grad:"135deg,#7c3aed,#2563eb"},{label:"Month Avg",val:analytics.monthAvg,sub:"points",grad:"135deg,#ec4899,#f97316"},{label:"Best Day",val:analytics.bestDay?formatDate(analytics.bestDay):"—",sub:`${analytics.bestScore} pts`,grad:"135deg,#10b981,#06b6d4"},{label:"Active Streak",val:streaks.current,sub:"days",grad:"135deg,#f59e0b,#ef4444"},{label:"Perfect Streak",val:streaks.perfect,sub:"days",grad:"135deg,#7c3aed,#ec4899"},{label:"Best Perfect",val:streaks.bestPerfect,sub:"ever",grad:"135deg,#10b981,#7c3aed"}].map(s=>(<Glass key={s.label} style={{padding:"16px 18px"}}><div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.02em",background:`linear-gradient(${s.grad})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s.val}</div><div style={{fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginTop:3}}>{s.label}</div><div style={{fontSize:11,color:"#cbd5e1",marginTop:2}}>{s.sub}</div></Glass>))}
            </div>
            {analytics.mostMissed&&(<Glass style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",marginBottom:12,borderColor:"rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.06)"}}><span style={{fontSize:26}}>⚠️</span><div><div style={{fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Most Missed</div><div style={{fontWeight:700,color:"#334155",fontSize:15,marginTop:2}}>{analytics.mostMissed.emoji} {analytics.mostMissed.name}</div></div></Glass>)}
            {analytics.mostDone&&(<Glass style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",marginBottom:16,borderColor:"rgba(16,185,129,0.3)",background:"rgba(16,185,129,0.06)"}}><span style={{fontSize:26}}>🏆</span><div><div style={{fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Top Habit</div><div style={{fontWeight:700,color:"#334155",fontSize:15,marginTop:2}}>{analytics.mostDone.emoji} {analytics.mostDone.name}</div></div></Glass>)}
            <Glass style={{padding:18,marginBottom:16}}><ChartLabel>30-Day Score History</ChartLabel><ResponsiveContainer width="100%" height={180}><LineChart data={last30} margin={{top:5,right:8,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} interval={4}/><YAxis tick={{fill:"#94a3b8",fontSize:10}} domain={[0,totalPoints]}/><Tooltip content={<CustomTooltip/>}/><Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5} dot={{r:3,fill:"#7c3aed"}}/></LineChart></ResponsiveContainer></Glass>
            <Glass style={{padding:18}}><ChartLabel>Task Completion Rates</ChartLabel><ResponsiveContainer width="100%" height={240}><BarChart data={habitStats} layout="vertical" margin={{top:0,right:30,left:70,bottom:0}}><XAxis type="number" domain={[0,100]} tick={{fill:"#94a3b8",fontSize:10}} tickFormatter={v=>`${v}%`}/><YAxis type="category" dataKey="name" tick={{fill:"#64748b",fontSize:11}} width={70} tickFormatter={v=>v.length>12?v.slice(0,12)+"…":v}/><Tooltip formatter={v=>[`${v}%`,"Completion"]} contentStyle={{background:"rgba(255,255,255,0.9)",border:"none",borderRadius:10}}/><Bar dataKey="rate" radius={[0,6,6,0]}>{habitStats.map((e,i)=><Cell key={i} fill={scoreHex(e.rate)}/>)}</Bar></BarChart></ResponsiveContainer></Glass>
          </div>
        )}

        {view==="goals"&&<GoalsView goals={goals} onUpdate={setGoals}/>}

        {view==="settings"&&(
          <div style={pg}>
            <h1 style={ptitle}>Settings</h1>
            <Glass style={{padding:"12px 16px",marginBottom:16,background:totalPoints===100?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.08)",borderColor:totalPoints===100?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}}><span style={{fontSize:13,color:"#64748b"}}>Total points: </span><span style={{fontWeight:800,fontSize:15,color:totalPoints===100?"#16a34a":"#dc2626"}}>{totalPoints}</span>{totalPoints!==100&&<span style={{fontSize:12,color:"#dc2626"}}> — recommended: 100</span>}</Glass>
            {tasks.map((task,idx)=>(<Glass key={task.id} style={{padding:14,marginBottom:10}}>{settingsEdit?.id===task.id?(<div style={{display:"flex",flexDirection:"column",gap:10}}><div style={{display:"flex",gap:8,alignItems:"center"}}><input value={settingsEdit.emoji} onChange={e=>setSettingsEdit(p=>({...p,emoji:e.target.value}))} style={{...inp,width:48,textAlign:"center"}} maxLength={2}/><input value={settingsEdit.name} onChange={e=>setSettingsEdit(p=>({...p,name:e.target.value}))} style={{...inp,flex:1}} placeholder="Task name"/><input type="number" value={settingsEdit.points} onChange={e=>setSettingsEdit(p=>({...p,points:parseInt(e.target.value)||0}))} style={{...inp,width:58}} min={1} max={100}/></div><div style={{display:"flex",gap:8}}><button style={btnSave} onClick={()=>saveTask(settingsEdit)}>Save</button><button style={btnCancel} onClick={()=>setSettingsEdit(null)}>Cancel</button></div></div>):(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{display:"flex",flexDirection:"column",gap:2}}><button className="reorder-btn" onClick={()=>reorderTask(task.id,-1)} disabled={idx===0}>▲</button><button className="reorder-btn" onClick={()=>reorderTask(task.id,1)} disabled={idx===tasks.length-1}>▼</button></div><span style={{fontSize:20}}>{task.emoji}</span><div><div style={{fontSize:14,fontWeight:600,color:"#334155"}}>{task.name}</div><div style={{fontSize:12,fontWeight:700,background:"linear-gradient(135deg,#7c3aed,#2563eb)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{task.points} pts</div></div></div><div style={{display:"flex",gap:8}}><button style={{...btnCancel,fontSize:12}} onClick={()=>setSettingsEdit({...task})}>Edit</button><button style={{background:"rgba(239,68,68,0.1)",color:"#dc2626",border:"none",borderRadius:10,padding:"5px 10px",cursor:"pointer",fontSize:14,fontFamily:"inherit"}} onClick={()=>deleteTask(task.id)}>✕</button></div></div>)}</Glass>))}
            <Glass style={{padding:18,marginTop:8,border:"1.5px dashed rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.04)"}}><ChartLabel>Add New Task</ChartLabel><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}><input value={newTaskForm.emoji} onChange={e=>setNewTaskForm(p=>({...p,emoji:e.target.value}))} style={{...inp,width:48,textAlign:"center"}} maxLength={2} placeholder="✅"/><input value={newTaskForm.name} onChange={e=>setNewTaskForm(p=>({...p,name:e.target.value}))} style={{...inp,flex:1}} placeholder="Task name"/><input type="number" value={newTaskForm.points} onChange={e=>setNewTaskForm(p=>({...p,points:parseInt(e.target.value)||0}))} style={{...inp,width:58}} min={1} max={100}/></div><button style={{...btnSave,width:"100%",justifyContent:"center"}} onClick={addTask}>+ Add Task</button></Glass>
          </div>
        )}
      </main>
    </div>
  );
}

const pg={maxWidth:720,margin:"0 auto",padding:"24px 20px"};
const ptitle={fontWeight:800,fontSize:22,letterSpacing:"-0.02em",color:"#1e1b4b",marginBottom:6,marginTop:0};
const inp={background:"rgba(255,255,255,0.7)",backdropFilter:"blur(12px)",border:"1.5px solid rgba(255,255,255,0.85)",borderRadius:12,color:"#334155",padding:"9px 11px",fontSize:13,outline:"none",fontFamily:"inherit",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"};
const btnSave={background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:12,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",boxShadow:"0 4px 14px rgba(124,58,237,0.35)"};
const btnCancel={background:"rgba(0,0,0,0.05)",color:"#64748b",border:"none",borderRadius:12,padding:"9px 16px",cursor:"pointer",fontSize:13,fontFamily:"inherit"};

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;height:100%;}
  button,input,textarea{font-family:inherit;}

  /* Bubble animations */
  .bubble{animation:floatBubble linear infinite alternate;}
  .bubble-0{animation-name:float0;}.bubble-1{animation-name:float1;}.bubble-2{animation-name:float2;}
  .bubble-3{animation-name:float3;}.bubble-4{animation-name:float4;}.bubble-5{animation-name:float5;}
  @keyframes float0{0%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-40px) scale(1.05)}100%{transform:translate(-20px,25px) scale(0.97)}}
  @keyframes float1{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,30px) scale(1.08)}100%{transform:translate(25px,-30px) scale(0.95)}}
  @keyframes float2{0%{transform:translate(0,0) scale(1)}50%{transform:translate(50px,20px) scale(1.06)}100%{transform:translate(-30px,-40px) scale(1.02)}}
  @keyframes float3{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-25px,-50px) scale(0.95)}100%{transform:translate(40px,35px) scale(1.07)}}
  @keyframes float4{0%{transform:translate(0,0) scale(1)}50%{transform:translate(35px,45px) scale(1.04)}100%{transform:translate(-45px,-20px) scale(0.96)}}
  @keyframes float5{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-30px,35px) scale(1.09)}100%{transform:translate(30px,-45px) scale(0.94)}}

  /* Nav */
  .nav-inner{max-width:720px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:8px 20px 0;}
  .nav-tabs{max-width:720px;margin:0 auto;display:flex;overflow-x:auto;gap:4px;padding:6px 16px 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
  .nav-tabs::-webkit-scrollbar{display:none;}

  /* Cards & buttons */
  .glass-card{transition:box-shadow 0.2s;}
  .nav-btn:hover{background:rgba(124,58,237,0.08)!important;}
  .cal-nav{background:rgba(255,255,255,0.6);border:1.5px solid rgba(255,255,255,0.85);border-radius:12px;color:#334155;font-size:22px;cursor:pointer;padding:4px 16px;box-shadow:0 2px 10px rgba(0,0,0,0.07);}
  .cal-cell-btn:hover{transform:scale(1.1);}.cal-cell-btn:active{transform:scale(0.96);}
  .reorder-btn{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:9px;padding:1px 4px;line-height:1;transition:color 0.15s;}.reorder-btn:hover{color:#7c3aed;}
  input:focus,textarea:focus{border-color:rgba(124,58,237,0.5)!important;box-shadow:0 0 0 3px rgba(124,58,237,0.1)!important;}

  /* Scrollbar */
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.2);border-radius:4px;}

  /* Desktop layout */
  @media(min-width:640px){
    .nav-tabs{justify-content:center;}
    .nav-btn{min-width:64px!important;padding:8px 16px!important;}
    .nav-btn span:last-child{font-size:11px!important;}
  }
`;
