import React, { Component, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CaloriesView, { DEFAULT_FOODS, getTotalCalories, MEALS } from "./CaloriesView.jsx";

// ─── Storage ──────────────────────────────────────────────────────────────────
const SK = { TASKS:"pt_tasks", DAILY_LOGS:"pt_daily_logs", GOALS:"pt_goals", FOODS:"pt_foods", CAL_LOGS:"pt_cal_logs2", THEME:"pt_theme", PROFILE:"pt_profile" };
async function sGet(key){try{if(typeof window!=="undefined"&&window.storage)return await window.storage.get(key);const v=localStorage.getItem(key);return v?{value:v}:null;}catch{return null;}}
async function sSet(key,value){try{if(typeof window!=="undefined"&&window.storage)await window.storage.set(key,JSON.stringify(value));else localStorage.setItem(key,JSON.stringify(value));}catch{}}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_TASKS=[
  {id:"t1",name:"2HR Trade Journaling",points:15,emoji:"📓"},
  {id:"t2",name:"3k Calorie Surplus",points:10,emoji:"🍽️",calorieLinked:true},
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

const GOAL_CATS=[
  {id:"financial",label:"Financial",emoji:"💰"},
  {id:"religious",label:"Religious",emoji:"🕌"},
  {id:"mental",label:"Mental",emoji:"🧠"},
  {id:"dating",label:"Dating",emoji:"❤️"},
  {id:"productivity",label:"Productivity",emoji:"⚡"},
  {id:"social",label:"Social",emoji:"🤝"},
  {id:"family",label:"Family",emoji:"👨‍👩‍👧"},
];

const TASK_STATUS={DONE:"done",NOT_DONE:"not_done",UNCHECKED:"unchecked"};

// ─── Theme definitions ────────────────────────────────────────────────────────
const THEMES = {
  light:{
    name:"Light",emoji:"☀️",
    bg:"linear-gradient(135deg,#f0f4ff 0%,#faf5ff 30%,#f0fdf4 60%,#fff7ed 100%)",
    navBg:"rgba(255,255,255,0.6)",navBorder:"rgba(255,255,255,0.8)",
    cardBg:"rgba(255,255,255,0.55)",cardBorder:"rgba(255,255,255,0.75)",
    text:"#1e1b4b",textSec:"#94a3b8",textMid:"#334155",textSub:"#64748b",
    inpBg:"rgba(255,255,255,0.7)",inpBorder:"rgba(255,255,255,0.85)",
    bubbles:["rgba(167,139,250,0.28)","rgba(96,165,250,0.22)","rgba(52,211,153,0.20)","rgba(251,146,60,0.18)","rgba(244,114,182,0.22)","rgba(250,204,21,0.18)"],
  },
  dark:{
    name:"Dark",emoji:"🌙",
    bg:"linear-gradient(135deg,#0f0e17 0%,#1a1625 30%,#0e1a14 60%,#1a1208 100%)",
    navBg:"rgba(15,14,23,0.85)",navBorder:"rgba(255,255,255,0.08)",
    cardBg:"rgba(255,255,255,0.05)",cardBorder:"rgba(255,255,255,0.1)",
    text:"#e2e8f0",textSec:"#4a5568",textMid:"#cbd5e1",textSub:"#718096",
    inpBg:"rgba(255,255,255,0.07)",inpBorder:"rgba(255,255,255,0.12)",
    bubbles:["rgba(124,58,237,0.18)","rgba(37,99,235,0.15)","rgba(16,185,129,0.12)","rgba(245,158,11,0.1)","rgba(236,72,153,0.12)","rgba(6,182,212,0.1)"],
  },
  midnight:{
    name:"Midnight",emoji:"🔮",
    bg:"linear-gradient(135deg,#0a0a1a 0%,#0d0b1e 40%,#0a1628 100%)",
    navBg:"rgba(8,8,20,0.9)",navBorder:"rgba(124,58,237,0.2)",
    cardBg:"rgba(124,58,237,0.07)",cardBorder:"rgba(124,58,237,0.2)",
    text:"#c4b5fd",textSec:"#6d28d9",textMid:"#a78bfa",textSub:"#7c3aed",
    inpBg:"rgba(124,58,237,0.1)",inpBorder:"rgba(124,58,237,0.3)",
    bubbles:["rgba(124,58,237,0.25)","rgba(109,40,217,0.2)","rgba(139,92,246,0.18)","rgba(167,139,250,0.15)","rgba(196,181,253,0.12)","rgba(91,33,182,0.2)"],
  },
  forest:{
    name:"Forest",emoji:"🌿",
    bg:"linear-gradient(135deg,#0a1a0e 0%,#0d1f14 40%,#0a180d 100%)",
    navBg:"rgba(8,20,10,0.9)",navBorder:"rgba(16,185,129,0.2)",
    cardBg:"rgba(16,185,129,0.07)",cardBorder:"rgba(16,185,129,0.2)",
    text:"#a7f3d0",textSec:"#065f46",textMid:"#6ee7b7",textSub:"#10b981",
    inpBg:"rgba(16,185,129,0.1)",inpBorder:"rgba(16,185,129,0.3)",
    bubbles:["rgba(16,185,129,0.22)","rgba(5,150,105,0.18)","rgba(52,211,153,0.15)","rgba(110,231,183,0.12)","rgba(167,243,208,0.1)","rgba(6,95,70,0.2)"],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr=()=>new Date().toISOString().slice(0,10);
const fmtMonth=(mk)=>new Date(mk+"-01T12:00:00").toLocaleDateString("en-US",{month:"long",year:"numeric"});
function scoreColor(s){if(s>=90)return{solid:"#16a34a",glass:"rgba(34,197,94,0.18)"};if(s>=70)return{solid:"#0891b2",glass:"rgba(6,182,212,0.18)"};if(s>=50)return{solid:"#d97706",glass:"rgba(251,191,36,0.18)"};return{solid:"#dc2626",glass:"rgba(239,68,68,0.18)"};}
function scoreHex(s){return scoreColor(s).solid;}
function fmtDate(ds){return new Date(ds+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function fmtDateLong(ds){return new Date(ds+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});}
function getDIM(y,m){return new Date(y,m+1,0).getDate();}
function calcScore(statuses,tasks){return tasks.filter(t=>statuses[t.id]===TASK_STATUS.DONE).reduce((s,t)=>s+t.points,0);}
function getWeekDays(){const days=[],t=new Date();for(let i=6;i>=0;i--){const d=new Date(t);d.setDate(t.getDate()-i);days.push(d.toISOString().slice(0,10));}return days;}

// ─── Spider Chart ─────────────────────────────────────────────────────────────
function SpiderChart({ data, theme }) {
  const t = THEMES[theme]||THEMES.light;
  const size = 280, cx = 140, cy = 140, r = 100;
  const n = data.length;
  if(!n) return null;

  const angleStep = (2*Math.PI)/n;
  const getPoint = (i,val,maxVal,radius)=>{
    const angle = i*angleStep - Math.PI/2;
    const pct = maxVal>0?(val/maxVal):0;
    return {
      x: cx + radius*pct*Math.cos(angle),
      y: cy + radius*pct*Math.sin(angle),
    };
  };
  const getAxisPoint=(i,radius)=>{
    const angle=i*angleStep-Math.PI/2;
    return{x:cx+radius*Math.cos(angle),y:cy+radius*Math.sin(angle)};
  };

  // Grid rings
  const rings=[0.25,0.5,0.75,1];
  const gridLines=rings.map(pct=>{
    const pts=data.map((_,i)=>getAxisPoint(i,r*pct));
    return pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ")+"Z";
  });

  // Axis lines
  const axes=data.map((_,i)=>{const p=getAxisPoint(i,r);return`M${cx},${cy}L${p.x},${p.y}`;});

  // Data polygon
  const dataPoints=data.map((d,i)=>getPoint(i,d.rate,100,r));
  const polygon=dataPoints.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ")+"Z";

  // Labels
  const labels=data.map((d,i)=>{
    const angle=i*angleStep-Math.PI/2;
    const lx=cx+(r+22)*Math.cos(angle);
    const ly=cy+(r+22)*Math.sin(angle);
    const anchor=lx<cx-5?"end":lx>cx+5?"start":"middle";
    return{...d,lx,ly,anchor};
  });

  const isDark=theme!=="light";

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <svg width={size} height={size} style={{overflow:"visible"}}>
        {/* Grid rings */}
        {gridLines.map((d,i)=>(
          <path key={i} d={d} fill="none" stroke={isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.07)"} strokeWidth={1}/>
        ))}
        {/* Axes */}
        {axes.map((d,i)=>(
          <path key={i} d={d} stroke={isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"} strokeWidth={1}/>
        ))}
        {/* Data fill */}
        <path d={polygon} fill="rgba(124,58,237,0.18)" stroke="#7c3aed" strokeWidth={2.5} strokeLinejoin="round"/>
        {/* Data points */}
        {dataPoints.map((p,i)=>(
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#7c3aed" stroke={isDark?"#1a1625":"#fff"} strokeWidth={2}/>
        ))}
        {/* Labels */}
        {labels.map((l,i)=>(
          <text key={i} x={l.lx} y={l.ly} textAnchor={l.anchor} dominantBaseline="middle" fontSize={9} fontWeight={700} fill={t.textSec} fontFamily="DM Sans,system-ui">
            {l.emoji} {l.name.length>8?l.name.slice(0,8)+"…":l.name}
          </text>
        ))}
        {/* % labels on rings */}
        {[25,50,75,100].map(pct=>(
          <text key={pct} x={cx+4} y={cy-r*(pct/100)+4} fontSize={8} fill={t.textSec} opacity={0.7}>{pct}%</text>
        ))}
      </svg>
    </div>
  );
}

// ─── Bubble Background ────────────────────────────────────────────────────────
const BUBBLE_CONFIGS=[
  {w:520,h:520,x:-10,y:-10,dur:18,delay:0},
  {w:420,h:420,x:55,y:35,dur:22,delay:3},
  {w:380,h:380,x:5,y:55,dur:26,delay:1},
  {w:300,h:300,x:70,y:5,dur:20,delay:5},
  {w:260,h:260,x:20,y:70,dur:24,delay:2},
  {w:200,h:200,x:75,y:60,dur:28,delay:7},
];
function BubbleBackground({theme}){
  const t=THEMES[theme]||THEMES.light;
  return(
    <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,background:t.bg}}/>
      {BUBBLE_CONFIGS.map((b,i)=>(
        <div key={i} className={`bubble bubble-${i}`} style={{position:"absolute",width:b.w,height:b.h,left:`${b.x}%`,top:`${b.y}%`,borderRadius:"50%",background:t.bubbles[i]||t.bubbles[0],filter:"blur(48px)",animationDuration:`${b.dur}s`,animationDelay:`${b.delay}s`}}/>
      ))}
    </div>
  );
}

// ─── Glass Card ───────────────────────────────────────────────────────────────
function Glass({children,style={},theme}){
  const t=THEMES[theme]||THEMES.light;
  return(
    <div style={{background:t.cardBg,backdropFilter:"blur(28px) saturate(180%)",WebkitBackdropFilter:"blur(28px) saturate(180%)",border:`1px solid ${t.cardBorder}`,borderRadius:22,boxShadow:"0 8px 32px rgba(100,80,200,0.08)",...style}}>
      {children}
    </div>
  );
}

function Inp({theme,...props}){
  const t=THEMES[theme]||THEMES.light;
  return <input {...props} style={{background:t.inpBg,border:`1.5px solid ${t.inpBorder}`,borderRadius:12,color:t.textMid,padding:"9px 11px",fontSize:13,outline:"none",fontFamily:"inherit",...(props.style||{})}}/>;
}

function Chip({children}){return<div style={{background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:20,padding:"4px 11px",fontSize:11,color:"#7c3aed",fontWeight:600}}>{children}</div>;}
function ChartLabel({children,theme}){const t=THEMES[theme]||THEMES.light;return<div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:t.textSec,marginBottom:12}}>{children}</div>;}

function CustomTooltip({active,payload,label}){
  if(!active||!payload?.length)return null;
  return(<div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.9)",borderRadius:12,padding:"8px 14px",boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}><div style={{color:"#9ca3af",fontSize:11,marginBottom:2}}>{label}</div><div style={{color:"#6d28d9",fontWeight:800,fontSize:18}}>{payload[0].value}</div></div>);
}

// ─── Task Note Panel ──────────────────────────────────────────────────────────
function TaskNotePanel({taskId,note,onChange,theme}){
  const[open,setOpen]=useState(false);
  const t=THEMES[theme]||THEMES.light;
  const n=note||{feelBefore:"",feelAfter:"",items:[]};
  const update=(patch)=>onChange(taskId,{...n,...patch});
  const addItem=()=>update({items:[...n.items,{id:Date.now().toString(),text:"",done:false}]});
  const toggleItem=(id)=>update({items:n.items.map(it=>it.id===id?{...it,done:!it.done}:it)});
  const editItem=(id,text)=>update({items:n.items.map(it=>it.id===id?{...it,text}:it)});
  const removeItem=(id)=>update({items:n.items.filter(it=>it.id!==id)});
  const inpSt={background:t.inpBg,border:`1.5px solid ${t.inpBorder}`,borderRadius:10,color:t.textMid,padding:"7px 9px",fontSize:12,outline:"none",fontFamily:"inherit"};
  return(
    <div style={{marginTop:6}}>
      <button onClick={e=>{e.stopPropagation();setOpen(o=>!o);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#7c3aed",fontWeight:600,padding:"2px 0",fontFamily:"inherit"}}>{open?"▲ hide notes":"▼ notes / progress"}</button>
      {open&&(
        <div onClick={e=>e.stopPropagation()} style={{marginTop:8,padding:"12px 14px",background:"rgba(124,58,237,0.05)",borderRadius:14,border:"1px solid rgba(124,58,237,0.15)"}}>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:t.textSec,marginBottom:4,textTransform:"uppercase"}}>😐 Before</div><textarea value={n.feelBefore} onChange={e=>update({feelBefore:e.target.value})} placeholder="How did you feel before?" rows={2} style={{...inpSt,width:"100%",resize:"none"}}/></div>
            <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:t.textSec,marginBottom:4,textTransform:"uppercase"}}>😊 After</div><textarea value={n.feelAfter} onChange={e=>update({feelAfter:e.target.value})} placeholder="How did you feel after?" rows={2} style={{...inpSt,width:"100%",resize:"none"}}/></div>
          </div>
          <div style={{fontSize:10,fontWeight:700,color:t.textSec,marginBottom:6,textTransform:"uppercase"}}>📋 Progress Checklist</div>
          {n.items.map(it=>(
            <div key={it.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <button onClick={()=>toggleItem(it.id)} style={{width:18,height:18,borderRadius:5,border:"1.5px solid rgba(124,58,237,0.4)",background:it.done?"linear-gradient(135deg,#7c3aed,#2563eb)":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{it.done&&<span style={{color:"#fff",fontSize:10,fontWeight:800}}>✓</span>}</button>
              <input value={it.text} onChange={e=>editItem(it.id,e.target.value)} placeholder="Progress item..." style={{...inpSt,flex:1,textDecoration:it.done?"line-through":"none",opacity:it.done?0.6:1}}/>
              <button onClick={()=>removeItem(it.id)} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:14,padding:"0 2px"}}>✕</button>
            </div>
          ))}
          <button onClick={addItem} style={{fontSize:11,color:"#7c3aed",fontWeight:700,background:"rgba(124,58,237,0.08)",border:"1px dashed rgba(124,58,237,0.3)",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",marginTop:4}}>+ Add item</button>
        </div>
      )}
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({dateStr,tasks,log,onUpdate,theme,calorieTotal}){
  const t=THEMES[theme]||THEMES.light;
  const statuses=log?.statuses||{};
  const notes=log?.notes||{};
  const totalPoints=tasks.reduce((s,task)=>s+task.points,0);

  // Auto-compute statuses considering calorie-linked tasks
  const effectiveStatuses=useMemo(()=>{
    const s={...statuses};
    tasks.forEach(task=>{
      if(task.calorieLinked){
        s[task.id]=calorieTotal>=3000?TASK_STATUS.DONE:TASK_STATUS.NOT_DONE;
      }
    });
    return s;
  },[statuses,tasks,calorieTotal]);

  const score=calcScore(effectiveStatuses,tasks);
  const pct=totalPoints>0?Math.round((score/totalPoints)*100):0;
  const sc=scoreColor(pct);

  const cycleStatus=(taskId)=>{
    const task=tasks.find(t=>t.id===taskId);
    if(task?.calorieLinked)return; // can't manually toggle calorie-linked
    const cur=statuses[taskId]||TASK_STATUS.UNCHECKED;
    const next=cur===TASK_STATUS.UNCHECKED?TASK_STATUS.DONE:cur===TASK_STATUS.DONE?TASK_STATUS.NOT_DONE:TASK_STATUS.UNCHECKED;
    const newStatuses={...statuses,[taskId]:next};
    onUpdate({...log,statuses:newStatuses,score:calcScore({...effectiveStatuses,...newStatuses},tasks),completed:Object.keys({...effectiveStatuses,...newStatuses}).filter(id=>({...effectiveStatuses,...newStatuses})[id]===TASK_STATUS.DONE)});
  };
  const updateNote=(taskId,note)=>onUpdate({...log,notes:{...notes,[taskId]:note}});

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div style={{fontSize:12,color:t.textSec}}>{fmtDateLong(dateStr)}</div>
        <div style={{display:"flex",alignItems:"baseline",gap:2}}><span style={{fontSize:28,fontWeight:800,color:sc.solid}}>{score}</span><span style={{fontSize:13,color:t.textSec}}>/{totalPoints}</span></div>
      </div>
      <div style={{height:5,background:t.theme==="light"?"rgba(0,0,0,0.07)":"rgba(255,255,255,0.08)",borderRadius:3,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${sc.solid},${sc.solid}cc)`,borderRadius:3,transition:"width 0.5s"}}/>
      </div>
      <div style={{fontSize:10,fontWeight:700,color:t.textSec,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Tap: unchecked → ✅ done → ❌ not done</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {tasks.map(task=>{
          const status=effectiveStatuses[task.id]||TASK_STATUS.UNCHECKED;
          const isDone=status===TASK_STATUS.DONE;
          const isNotDone=status===TASK_STATUS.NOT_DONE;
          const isLinked=task.calorieLinked;
          return(
            <div key={task.id} style={{padding:"12px 16px",borderRadius:18,background:isDone?"rgba(124,58,237,0.1)":isNotDone?"rgba(239,68,68,0.07)":t.cardBg,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderLeft:isDone?"3px solid #7c3aed":isNotDone?"3px solid #dc2626":"3px solid transparent",transition:"all 0.22s",border:`1px solid ${t.cardBorder}`,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:isLinked?"default":"pointer"}} onClick={()=>cycleStatus(task.id)}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:26,height:26,borderRadius:8,flexShrink:0,background:isDone?"linear-gradient(135deg,#7c3aed,#2563eb)":isNotDone?"rgba(239,68,68,0.15)":"rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:isDone?"0 3px 10px rgba(124,58,237,0.4)":"none",border:isNotDone?"1.5px solid rgba(239,68,68,0.4)":"none",transition:"all 0.22s"}}>
                    {isDone&&<span style={{color:"#fff",fontSize:13,fontWeight:800}}>✓</span>}
                    {isNotDone&&<span style={{color:"#dc2626",fontSize:13,fontWeight:800}}>✕</span>}
                  </div>
                  <span style={{fontSize:18}}>{task.emoji}</span>
                  <div>
                    <span style={{fontSize:14,fontWeight:600,color:isDone?"#7c3aed":isNotDone?"#dc2626":t.textMid,textDecoration:isDone?"line-through":"none",opacity:isDone||isNotDone?0.8:1}}>{task.name}</span>
                    {isLinked&&<div style={{fontSize:10,color:t.textSec,marginTop:1}}>Auto-tracked from Calories tab</div>}
                  </div>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:isDone?"#7c3aed":isNotDone?"#dc2626":t.textSec,background:isDone?"rgba(124,58,237,0.1)":isNotDone?"rgba(239,68,68,0.08)":"rgba(0,0,0,0.05)",padding:"3px 9px",borderRadius:20}}>{isDone?`+${task.points}`:isNotDone?"✕":`+${task.points}`}</div>
              </div>
              {!isLinked&&<TaskNotePanel taskId={task.id} note={notes[task.id]} onChange={updateNote} theme={theme}/>}
            </div>
          );
        })}
      </div>
      {pct===100&&<Glass theme={theme} style={{marginTop:16,padding:16,textAlign:"center",background:"rgba(124,58,237,0.08)",borderColor:"rgba(124,58,237,0.3)"}}><div style={{fontSize:22}}>🌟</div><div style={{fontWeight:800,color:"#7c3aed",fontSize:15,marginTop:4}}>Perfect Day!</div></Glass>}
    </div>
  );
}

// ─── Goals View ───────────────────────────────────────────────────────────────
function GoalsView({goals,onUpdate,theme}){
  const t=THEMES[theme]||THEMES.light;
  const mk=todayStr().slice(0,7);
  const[selMonth,setSelMonth]=useState(mk);
  const[addingFor,setAddingFor]=useState(null);
  const[newGoalText,setNewGoalText]=useState("");
  const allMonths=useMemo(()=>{const keys=new Set([mk,...Object.keys(goals)]);return[...keys].sort().reverse();},[goals,mk]);
  const mg=goals[selMonth]||{};
  const addGoal=(catId)=>{if(!newGoalText.trim())return;const cat=mg[catId]||[];onUpdate({...goals,[selMonth]:{...mg,[catId]:[...cat,{id:Date.now().toString(),text:newGoalText.trim(),done:false}]}});setNewGoalText("");setAddingFor(null);};
  const toggleGoal=(catId,gid)=>{const cat=(mg[catId]||[]).map(g=>g.id===gid?{...g,done:!g.done}:g);onUpdate({...goals,[selMonth]:{...mg,[catId]:cat}});};
  const delGoal=(catId,gid)=>{const cat=(mg[catId]||[]).filter(g=>g.id!==gid);onUpdate({...goals,[selMonth]:{...mg,[catId]:cat}});};
  const inpSt={background:t.inpBg,border:`1.5px solid ${t.inpBorder}`,borderRadius:12,color:t.textMid,padding:"9px 11px",fontSize:13,outline:"none",fontFamily:"inherit"};
  return(
    <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px"}}>
      <h1 style={{fontWeight:800,fontSize:22,letterSpacing:"-0.02em",color:t.text,marginBottom:4,marginTop:0}}>Monthly Goals</h1>
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {allMonths.map(m=>(
          <button key={m} onClick={()=>setSelMonth(m)} style={{flexShrink:0,padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",background:selMonth===m?"linear-gradient(135deg,#7c3aed,#2563eb)":t.cardBg,color:selMonth===m?"#fff":t.textSub,fontWeight:selMonth===m?700:500,fontSize:12,boxShadow:selMonth===m?"0 4px 14px rgba(124,58,237,0.3)":"none"}}>{fmtMonth(m)}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {GOAL_CATS.map(cat=>{
          const items=mg[cat.id]||[];
          const doneCount=items.filter(g=>g.done).length;
          return(
            <Glass key={cat.id} theme={theme} style={{padding:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:items.length>0||addingFor===cat.id?10:0}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>{cat.emoji}</span>
                  <div><div style={{fontWeight:800,fontSize:14,color:t.text}}>{cat.label}</div>{items.length>0&&<div style={{fontSize:11,color:t.textSec}}>{doneCount}/{items.length} complete</div>}</div>
                </div>
                <button onClick={()=>setAddingFor(addingFor===cat.id?null:cat.id)} style={{background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:10,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>+ Add</button>
              </div>
              {items.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:addingFor===cat.id?10:0}}>{items.map(g=>(<div key={g.id} style={{display:"flex",alignItems:"center",gap:8}}><button onClick={()=>toggleGoal(cat.id,g.id)} style={{width:20,height:20,borderRadius:6,border:"1.5px solid rgba(124,58,237,0.4)",background:g.done?"linear-gradient(135deg,#7c3aed,#2563eb)":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{g.done&&<span style={{color:"#fff",fontSize:11,fontWeight:800}}>✓</span>}</button><span style={{flex:1,fontSize:13,color:g.done?t.textSec:t.textMid,textDecoration:g.done?"line-through":"none",fontWeight:500}}>{g.text}</span><button onClick={()=>delGoal(cat.id,g.id)} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:13,opacity:0.6}}>✕</button></div>))}</div>}
              {addingFor===cat.id&&<div style={{display:"flex",gap:8}}><input autoFocus value={newGoalText} onChange={e=>setNewGoalText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGoal(cat.id)} placeholder={`Add ${cat.label} goal...`} style={{...inpSt,flex:1}}/><button onClick={()=>addGoal(cat.id)} style={bSave}>Save</button><button onClick={()=>setAddingFor(null)} style={bCancel(t)}>✕</button></div>}
              {items.length>0&&<div style={{height:3,background:"rgba(0,0,0,0.06)",borderRadius:2,marginTop:10,overflow:"hidden"}}><div style={{height:"100%",width:`${items.length?Math.round((doneCount/items.length)*100):0}%`,background:"linear-gradient(90deg,#7c3aed,#2563eb)",borderRadius:2,transition:"width 0.4s"}}/></div>}
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const[tasks,setTasks]=useState(DEFAULT_TASKS);
  const[dailyLogs,setDailyLogs]=useState({});
  const[goals,setGoals]=useState({});
  const[foods,setFoods]=useState(DEFAULT_FOODS);
  const[calorieLogs,setCalorieLogs]=useState({});
  const[theme,setTheme]=useState("light");
  const[profilePic,setProfilePic]=useState(null);
  const[view,setView]=useState("dashboard");
  const[calDate,setCalDate]=useState(()=>{const n=new Date();return{year:n.getFullYear(),month:n.getMonth()};});
  const[selDay,setSelDay]=useState(null);
  const[settingsEdit,setSettingsEdit]=useState(null);
  const[newTaskForm,setNewTaskForm]=useState({name:"",points:5,emoji:"✅"});
  const[loading,setLoading]=useState(true);
  const profileRef=useRef();

  useEffect(()=>{
    (async()=>{
      const[tR,lR,gR,fR,cR,thR,pR]=await Promise.all([sGet(SK.TASKS),sGet(SK.DAILY_LOGS),sGet(SK.GOALS),sGet(SK.FOODS),sGet(SK.CAL_LOGS),sGet(SK.THEME),sGet(SK.PROFILE)]);
      if(tR?.value){try{setTasks(JSON.parse(tR.value));}catch{}}
      if(lR?.value){try{setDailyLogs(JSON.parse(lR.value));}catch{}}
      if(gR?.value){try{setGoals(JSON.parse(gR.value));}catch{}}
      if(fR?.value){try{setFoods(JSON.parse(fR.value));}catch{}}
      if(cR?.value){try{setCalorieLogs(JSON.parse(cR.value));}catch{}}
      if(thR?.value){try{setTheme(JSON.parse(thR.value));}catch{}}
      if(pR?.value){try{setProfilePic(JSON.parse(pR.value));}catch{}}
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{if(!loading)sSet(SK.TASKS,tasks);},[tasks,loading]);
  useEffect(()=>{if(!loading)sSet(SK.DAILY_LOGS,dailyLogs);},[dailyLogs,loading]);
  useEffect(()=>{if(!loading)sSet(SK.GOALS,goals);},[goals,loading]);
  useEffect(()=>{if(!loading)sSet(SK.FOODS,foods);},[foods,loading]);
  useEffect(()=>{if(!loading)sSet(SK.CAL_LOGS,calorieLogs);},[calorieLogs,loading]);
  useEffect(()=>{if(!loading)sSet(SK.THEME,theme);},[theme,loading]);
  useEffect(()=>{if(!loading&&profilePic)sSet(SK.PROFILE,profilePic);},[profilePic,loading]);

  const today=todayStr();
  const todayCalTotal=getTotalCalories(calorieLogs[today]);
  const todayLog=useMemo(()=>{
    const base=dailyLogs[today]||{statuses:{},notes:{},score:0,completed:[]};
    // Auto-update score based on calorie-linked tasks
    const effectiveStatuses={...base.statuses};
    tasks.forEach(task=>{if(task.calorieLinked)effectiveStatuses[task.id]=todayCalTotal>=3000?TASK_STATUS.DONE:TASK_STATUS.NOT_DONE;});
    return{...base,score:calcScore(effectiveStatuses,tasks),completed:Object.keys(effectiveStatuses).filter(id=>effectiveStatuses[id]===TASK_STATUS.DONE)};
  },[dailyLogs,today,tasks,todayCalTotal]);

  const totalPoints=tasks.reduce((s,task)=>s+task.points,0);
  const todayScore=todayLog.score||0;
  const pct=totalPoints>0?Math.round((todayScore/totalPoints)*100):0;

  const updateLog=useCallback((dateStr,log)=>{setDailyLogs(prev=>({...prev,[dateStr]:log}));},[]);

  const getCalTotalForDate=(dateStr)=>getTotalCalories(calorieLogs[dateStr]);

  const last30=useMemo(()=>{
    const days=[];
    for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);days.push({date:fmtDate(ds),score:dailyLogs[ds]?.score||0});}
    return days;
  },[dailyLogs]);

  const habitStats=useMemo(()=>{
    const logDates=Object.keys(dailyLogs).sort();
    if(!logDates.length)return tasks.map(t=>({...t,rate:0}));
    return tasks.map(task=>{
      const done=logDates.filter(d=>dailyLogs[d]?.statuses?.[task.id]===TASK_STATUS.DONE||dailyLogs[d]?.completed?.includes(task.id)).length;
      return{...task,rate:Math.round((done/logDates.length)*100)};
    }).sort((a,b)=>b.rate-a.rate);
  },[dailyLogs,tasks]);

  const streaks=useMemo(()=>{
    const sorted=Object.keys(dailyLogs).sort().reverse();
    const tp=tasks.reduce((s,t)=>s+t.points,0);
    let current=0,perfect=0,bestPerfect=0,tempPerfect=0;
    for(let i=0;i<sorted.length;i++){if((dailyLogs[sorted[i]]?.score||0)>0)current++;else break;}
    for(let i=0;i<sorted.length;i++){if((dailyLogs[sorted[i]]?.score||0)>=tp){tempPerfect++;if(i===0)perfect=tempPerfect;}else{bestPerfect=Math.max(bestPerfect,tempPerfect);tempPerfect=0;}}
    bestPerfect=Math.max(bestPerfect,tempPerfect,perfect);
    return{current,perfect,bestPerfect};
  },[dailyLogs,tasks]);

  const analytics=useMemo(()=>{
    const logDates=Object.keys(dailyLogs).sort();
    if(!logDates.length)return{weekAvg:0,monthAvg:0,bestDay:null,bestScore:0,mostMissed:null,mostDone:null};
    const week=getWeekDays();
    const wScores=week.map(d=>dailyLogs[d]?.score||0).filter(s=>s>0);
    const weekAvg=wScores.length?Math.round(wScores.reduce((a,b)=>a+b,0)/wScores.length):0;
    const now=new Date();
    const mDates=logDates.filter(d=>d.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`));
    const monthAvg=mDates.length?Math.round(mDates.reduce((s,d)=>s+(dailyLogs[d]?.score||0),0)/mDates.length):0;
    const bestDay=logDates.reduce((best,d)=>(!best||dailyLogs[d]?.score>dailyLogs[best]?.score)?d:best,null);
    const taskMissed={},taskDone={};
    logDates.forEach(d=>tasks.forEach(task=>{if(dailyLogs[d]?.statuses?.[task.id]===TASK_STATUS.DONE||dailyLogs[d]?.completed?.includes(task.id))taskDone[task.id]=(taskDone[task.id]||0)+1;else taskMissed[task.id]=(taskMissed[task.id]||0)+1;}));
    return{weekAvg,monthAvg,bestDay,bestScore:bestDay?dailyLogs[bestDay]?.score:0,mostMissed:tasks.find(task=>task.id===Object.keys(taskMissed).sort((a,b)=>taskMissed[b]-taskMissed[a])[0]),mostDone:tasks.find(task=>task.id===Object.keys(taskDone).sort((a,b)=>taskDone[b]-taskDone[a])[0])};
  },[dailyLogs,tasks]);

  const saveTask=(task)=>{setTasks(prev=>prev.map(t=>t.id===task.id?task:t));setSettingsEdit(null);};
  const deleteTask=(id)=>setTasks(prev=>prev.filter(t=>t.id!==id));
  const addTask=()=>{if(!newTaskForm.name.trim())return;setTasks(prev=>[...prev,{...newTaskForm,id:"t"+Date.now()}]);setNewTaskForm({name:"",points:5,emoji:"✅"});};
  const reorderTask=(id,dir)=>setTasks(prev=>{const idx=prev.findIndex(t=>t.id===id);const next=[...prev];const si=idx+dir;if(si<0||si>=next.length)return prev;[next[idx],next[si]]=[next[si],next[idx]];return next;});

  const handleProfilePic=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>setProfilePic(ev.target.result);
    reader.readAsDataURL(file);
  };

  const th=THEMES[theme]||THEMES.light;

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:th.bg}}><div style={{fontFamily:"system-ui",color:"#7c3aed",fontSize:18,fontWeight:600}}>Loading…</div></div>);

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
    <div style={{minHeight:"100vh",fontFamily:"'SF Pro Rounded','DM Sans',system-ui,sans-serif",position:"relative",color:th.text}}>
      <style>{CSS}</style>
      <BubbleBackground theme={theme}/>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:200,background:th.navBg,backdropFilter:"blur(30px) saturate(200%)",WebkitBackdropFilter:"blur(30px) saturate(200%)",borderBottom:`1px solid ${th.navBorder}`,boxShadow:"0 2px 20px rgba(0,0,0,0.1)"}}>
        <div className="nav-inner">
          {/* Profile pic / logo */}
          <div onClick={()=>profileRef.current?.click()} style={{cursor:"pointer",width:32,height:32,borderRadius:10,overflow:"hidden",background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(124,58,237,0.35)",flexShrink:0}}>
            {profilePic?<img src={profilePic} alt="profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:16}}>⚡</span>}
          </div>
          <input ref={profileRef} type="file" accept="image/*" onChange={handleProfilePic} style={{display:"none"}}/>
          <span style={{fontWeight:800,fontSize:16,letterSpacing:"-0.02em",background:"linear-gradient(135deg,#7c3aed,#2563eb)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>APEX</span>
        </div>
        <div className="nav-tabs">
          {navItems.map(n=>(<button key={n.id} onClick={()=>setView(n.id)} className="nav-btn" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"7px 12px",borderRadius:12,border:"none",cursor:"pointer",background:view===n.id?"rgba(124,58,237,0.12)":"transparent",color:view===n.id?"#7c3aed":th.textSec,fontWeight:view===n.id?700:500,transition:"all 0.2s",fontFamily:"inherit",flexShrink:0,minWidth:52}}><span style={{fontSize:16}}>{n.icon}</span><span style={{fontSize:10,letterSpacing:"0.04em",fontWeight:600}}>{n.label}</span></button>))}
        </div>
      </nav>

      <main style={{position:"relative",zIndex:1,paddingBottom:48}}>

        {/* DASHBOARD */}
        {view==="dashboard"&&(
          <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px"}}>
            <h1 style={{fontWeight:800,fontSize:22,letterSpacing:"-0.02em",color:th.text,marginBottom:6,marginTop:0}}>{fmtDateLong(today)}</h1>
            <Glass theme={theme} style={{padding:24,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:24}}>
                <div style={{position:"relative",width:120,height:120,flexShrink:0}}>
                  <svg width="120" height="120" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="9"/>
                    <circle cx="60" cy="60" r="50" fill="none" stroke={sc.solid} strokeWidth="9" strokeDasharray={`${2*Math.PI*50}`} strokeDashoffset={`${2*Math.PI*50*(1-pct/100)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)"}}/>
                  </svg>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <div style={{fontSize:24,fontWeight:800,color:sc.solid,lineHeight:1}}>{todayScore}</div>
                    <div style={{fontSize:10,color:th.textSec,marginTop:2}}>/{totalPoints}</div>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,letterSpacing:"0.14em",color:th.textSec,marginBottom:4,fontWeight:600}}>TODAY'S SCORE</div>
                  <div style={{fontSize:42,fontWeight:800,lineHeight:1,color:sc.solid,letterSpacing:"-0.03em",marginBottom:4}}>{pct}%</div>
                  <div style={{fontSize:12,color:th.textSec,marginBottom:12}}>{todayLog.completed.length} of {tasks.length} done</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Chip>🔥 {streaks.current}d streak</Chip><Chip>⭐ {streaks.perfect} perfect</Chip></div>
                </div>
              </div>
            </Glass>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[{label:"Week Avg",val:analytics.weekAvg,suf:"pts",grad:"135deg,#7c3aed,#2563eb"},{label:"Month Avg",val:analytics.monthAvg,suf:"pts",grad:"135deg,#ec4899,#f97316"},{label:"Best Ever",val:analytics.bestScore||0,suf:"pts",grad:"135deg,#10b981,#06b6d4"},{label:"Best Streak",val:streaks.bestPerfect,suf:"🌟",grad:"135deg,#f59e0b,#ef4444"}].map(s=>(
                <Glass key={s.label} theme={theme} style={{padding:"16px 18px"}}>
                  <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.02em",background:`linear-gradient(${s.grad})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s.val}<span style={{fontSize:11,fontWeight:600}}> {s.suf}</span></div>
                  <div style={{fontSize:10,color:th.textSec,marginTop:4,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{s.label}</div>
                </Glass>
              ))}
            </div>
            <Glass theme={theme} style={{padding:18,marginBottom:16}}>
              <ChartLabel theme={theme}>30-Day Trend</ChartLabel>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={last30} margin={{top:5,right:8,left:-22,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)"/>
                  <XAxis dataKey="date" tick={{fill:th.textSec,fontSize:10}} interval={6}/>
                  <YAxis tick={{fill:th.textSec,fontSize:10}} domain={[0,totalPoints]}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5} dot={false} activeDot={{r:5,fill:"#7c3aed"}}/>
                </LineChart>
              </ResponsiveContainer>
            </Glass>
            <Glass theme={theme} style={{padding:18}}>
              <ChartLabel theme={theme}>Habit Completion — Spider Chart</ChartLabel>
              <SpiderChart data={habitStats} theme={theme}/>
            </Glass>
          </div>
        )}

        {/* TODAY */}
        {view==="today"&&(
          <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px"}}>
            <h1 style={{fontWeight:800,fontSize:22,letterSpacing:"-0.02em",color:th.text,marginBottom:14,marginTop:0}}>Today's Tasks</h1>
            <DayView dateStr={today} tasks={tasks} log={todayLog} onUpdate={(log)=>updateLog(today,log)} theme={theme} calorieTotal={todayCalTotal}/>
          </div>
        )}

        {/* CALORIES */}
        {view==="calories"&&(
          <CaloriesView
            foods={foods} onFoodsUpdate={setFoods}
            calorieLog={calorieLogs[today]} onLogUpdate={(log)=>setCalorieLogs(prev=>({...prev,[today]:log}))}
            allCalorieLogs={calorieLogs} onAllLogsUpdate={setCalorieLogs}
            theme={theme}
          />
        )}

        {/* CALENDAR */}
        {view==="calendar"&&(
          <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <button className="cal-nav" style={{color:th.textMid,background:th.cardBg,border:`1.5px solid ${th.cardBorder}`}} onClick={()=>setCalDate(d=>{const m=d.month===0?11:d.month-1;return{year:d.month===0?d.year-1:d.year,month:m};})}>‹</button>
              <div style={{fontWeight:800,fontSize:18,letterSpacing:"-0.02em",color:th.text}}>{new Date(calDate.year,calDate.month).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
              <button className="cal-nav" style={{color:th.textMid,background:th.cardBg,border:`1.5px solid ${th.cardBorder}`}} onClick={()=>setCalDate(d=>{const m=d.month===11?0:d.month+1;return{year:d.month===11?d.year+1:d.year,month:m};})}>›</button>
            </div>
            <Glass theme={theme} style={{padding:16,marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:th.textSec,padding:"4px 0"}}>{d}</div>)}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                {(()=>{
                  const firstDay=new Date(calDate.year,calDate.month,1).getDay();
                  const dim=getDIM(calDate.year,calDate.month);
                  const cells=[];
                  for(let i=0;i<firstDay;i++)cells.push(<div key={`e${i}`}/>);
                  for(let d=1;d<=dim;d++){
                    const ds=`${calDate.year}-${String(calDate.month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                    const log=dailyLogs[ds];
                    const pctDay=log&&totalPoints>0?Math.round((log.score/totalPoints)*100):0;
                    const col=log?scoreColor(pctDay):null;
                    const isToday=ds===today;
                    const isSel=selDay===ds;
                    cells.push(
                      <button key={ds} onClick={()=>setSelDay(isSel?null:ds)} className="cal-cell-btn" style={{aspectRatio:"1",borderRadius:10,border:isToday?"2px solid #7c3aed":isSel?"2px solid rgba(124,58,237,0.5)":"2px solid transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:col?col.glass:th.cardBg,transition:"all 0.15s",padding:2}}>
                        <div style={{fontSize:12,fontWeight:isToday?800:600,color:isToday?"#7c3aed":col?col.solid:th.textSub}}>{d}</div>
                        {log&&<div style={{width:4,height:4,borderRadius:"50%",background:col.solid,marginTop:1}}/>}
                      </button>
                    );
                  }
                  return cells;
                })()}
              </div>
            </Glass>
            <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>{[["#16a34a","90-100"],["#0891b2","70-89"],["#d97706","50-69"],["#dc2626","<50"]].map(([c,l])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:3,background:c}}/><span style={{fontSize:11,color:th.textSub,fontWeight:600}}>{l}</span></div>))}</div>
            {selDay&&(
              <Glass theme={theme} style={{padding:18}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{fontWeight:800,fontSize:15,color:th.text}}>{fmtDateLong(selDay)}</div>
                  {selDay>today&&<div style={{fontSize:11,color:th.textSec}}>Future date</div>}
                </div>
                {selDay<=today?(
                  <DayView dateStr={selDay} tasks={tasks} log={dailyLogs[selDay]||{statuses:{},notes:{},score:0,completed:[]}} onUpdate={(log)=>updateLog(selDay,log)} theme={theme} calorieTotal={getCalTotalForDate(selDay)}/>
                ):(
                  <div style={{color:th.textSec,fontSize:13}}>Can't log future dates.</div>
                )}
              </Glass>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {view==="analytics"&&(
          <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px"}}>
            <h1 style={{fontWeight:800,fontSize:22,letterSpacing:"-0.02em",color:th.text,marginBottom:6,marginTop:0}}>Analytics</h1>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[{label:"Week Avg",val:analytics.weekAvg,sub:"points",grad:"135deg,#7c3aed,#2563eb"},{label:"Month Avg",val:analytics.monthAvg,sub:"points",grad:"135deg,#ec4899,#f97316"},{label:"Best Day",val:analytics.bestDay?fmtDate(analytics.bestDay):"—",sub:`${analytics.bestScore} pts`,grad:"135deg,#10b981,#06b6d4"},{label:"Active Streak",val:streaks.current,sub:"days",grad:"135deg,#f59e0b,#ef4444"},{label:"Perfect Streak",val:streaks.perfect,sub:"days",grad:"135deg,#7c3aed,#ec4899"},{label:"Best Perfect",val:streaks.bestPerfect,sub:"ever",grad:"135deg,#10b981,#7c3aed"}].map(s=>(
                <Glass key={s.label} theme={theme} style={{padding:"16px 18px"}}>
                  <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.02em",background:`linear-gradient(${s.grad})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s.val}</div>
                  <div style={{fontSize:10,color:th.textSec,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginTop:3}}>{s.label}</div>
                  <div style={{fontSize:11,color:th.textSec,marginTop:2}}>{s.sub}</div>
                </Glass>
              ))}
            </div>
            {analytics.mostMissed&&<Glass theme={theme} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",marginBottom:12,borderColor:"rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.06)"}}><span style={{fontSize:26}}>⚠️</span><div><div style={{fontSize:10,color:th.textSec,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Most Missed</div><div style={{fontWeight:700,color:th.textMid,fontSize:15,marginTop:2}}>{analytics.mostMissed.emoji} {analytics.mostMissed.name}</div></div></Glass>}
            {analytics.mostDone&&<Glass theme={theme} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",marginBottom:16,borderColor:"rgba(16,185,129,0.3)",background:"rgba(16,185,129,0.06)"}}><span style={{fontSize:26}}>🏆</span><div><div style={{fontSize:10,color:th.textSec,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Top Habit</div><div style={{fontWeight:700,color:th.textMid,fontSize:15,marginTop:2}}>{analytics.mostDone.emoji} {analytics.mostDone.name}</div></div></Glass>}
            <Glass theme={theme} style={{padding:18,marginBottom:16}}>
              <ChartLabel theme={theme}>30-Day Score History</ChartLabel>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={last30} margin={{top:5,right:8,left:-22,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)"/>
                  <XAxis dataKey="date" tick={{fill:th.textSec,fontSize:10}} interval={4}/>
                  <YAxis tick={{fill:th.textSec,fontSize:10}} domain={[0,totalPoints]}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5} dot={{r:3,fill:"#7c3aed"}}/>
                </LineChart>
              </ResponsiveContainer>
            </Glass>
            <Glass theme={theme} style={{padding:18}}>
              <ChartLabel theme={theme}>Habit Completion — Spider Chart</ChartLabel>
              <SpiderChart data={habitStats} theme={theme}/>
            </Glass>
          </div>
        )}

        {/* GOALS */}
        {view==="goals"&&<GoalsView goals={goals} onUpdate={setGoals} theme={theme}/>}

        {/* SETTINGS */}
        {view==="settings"&&(
          <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px"}}>
            <h1 style={{fontWeight:800,fontSize:22,letterSpacing:"-0.02em",color:th.text,marginBottom:16,marginTop:0}}>Settings</h1>

            {/* Theme picker */}
            <Glass theme={theme} style={{padding:18,marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,color:th.textSec,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Theme</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {Object.entries(THEMES).map(([key,val])=>(
                  <button key={key} onClick={()=>setTheme(key)} style={{padding:"12px 16px",borderRadius:16,border:theme===key?"2px solid #7c3aed":"2px solid transparent",cursor:"pointer",background:val.bg,fontFamily:"inherit",textAlign:"left",transition:"all 0.2s",boxShadow:theme===key?"0 4px 14px rgba(124,58,237,0.3)":"none"}}>
                    <div style={{fontSize:20,marginBottom:4}}>{val.emoji}</div>
                    <div style={{fontSize:13,fontWeight:700,color:val.text}}>{val.name}</div>
                  </button>
                ))}
              </div>
            </Glass>

            {/* Profile pic */}
            <Glass theme={theme} style={{padding:18,marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,color:th.textSec,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Profile Picture</div>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:64,height:64,borderRadius:18,overflow:"hidden",background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 14px rgba(124,58,237,0.3)"}}>
                  {profilePic?<img src={profilePic} alt="profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:28}}>⚡</span>}
                </div>
                <div>
                  <div style={{fontSize:13,color:th.textMid,marginBottom:8,fontWeight:500}}>Tap to update your profile picture. It shows in the top left nav.</div>
                  <button onClick={()=>profileRef.current?.click()} style={bSave}>Upload Photo</button>
                  {profilePic&&<button onClick={()=>setProfilePic(null)} style={{...bCancel(th),marginLeft:8}}>Remove</button>}
                </div>
              </div>
            </Glass>

            {/* Points total */}
            <Glass theme={theme} style={{padding:"12px 16px",marginBottom:16,background:totalPoints===100?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.08)",borderColor:totalPoints===100?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}}>
              <span style={{fontSize:13,color:th.textSub}}>Total points: </span>
              <span style={{fontWeight:800,fontSize:15,color:totalPoints===100?"#16a34a":"#dc2626"}}>{totalPoints}</span>
              {totalPoints!==100&&<span style={{fontSize:12,color:"#dc2626"}}> — recommended: 100</span>}
            </Glass>

            {tasks.map((task,idx)=>(
              <Glass key={task.id} theme={theme} style={{padding:14,marginBottom:10}}>
                {settingsEdit?.id===task.id?(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <input value={settingsEdit.emoji} onChange={e=>setSettingsEdit(p=>({...p,emoji:e.target.value}))} style={{...inpSt(th),width:48,textAlign:"center"}} maxLength={2}/>
                      <input value={settingsEdit.name} onChange={e=>setSettingsEdit(p=>({...p,name:e.target.value}))} style={{...inpSt(th),flex:1}} placeholder="Task name"/>
                      <input type="number" value={settingsEdit.points} onChange={e=>setSettingsEdit(p=>({...p,points:parseInt(e.target.value)||0}))} style={{...inpSt(th),width:58}} min={1} max={100}/>
                    </div>
                    <div style={{display:"flex",gap:8}}><button style={bSave} onClick={()=>saveTask(settingsEdit)}>Save</button><button style={bCancel(th)} onClick={()=>setSettingsEdit(null)}>Cancel</button></div>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{display:"flex",flexDirection:"column",gap:2}}>
                        <button className="reorder-btn" onClick={()=>reorderTask(task.id,-1)} disabled={idx===0}>▲</button>
                        <button className="reorder-btn" onClick={()=>reorderTask(task.id,1)} disabled={idx===tasks.length-1}>▼</button>
                      </div>
                      <span style={{fontSize:20}}>{task.emoji}</span>
                      <div>
                        <div style={{fontSize:14,fontWeight:600,color:th.textMid}}>{task.name}</div>
                        <div style={{fontSize:12,fontWeight:700,background:"linear-gradient(135deg,#7c3aed,#2563eb)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{task.points} pts{task.calorieLinked?" · auto-tracked":""}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button style={{...bCancel(th),fontSize:12}} onClick={()=>setSettingsEdit({...task})}>Edit</button>
                      <button style={{background:"rgba(239,68,68,0.1)",color:"#dc2626",border:"none",borderRadius:10,padding:"5px 10px",cursor:"pointer",fontSize:14,fontFamily:"inherit"}} onClick={()=>deleteTask(task.id)}>✕</button>
                    </div>
                  </div>
                )}
              </Glass>
            ))}

            <Glass theme={theme} style={{padding:18,marginTop:8,border:"1.5px dashed rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.04)"}}>
              <div style={{fontSize:10,fontWeight:700,color:th.textSec,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Add New Task</div>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                <input value={newTaskForm.emoji} onChange={e=>setNewTaskForm(p=>({...p,emoji:e.target.value}))} style={{...inpSt(th),width:48,textAlign:"center"}} maxLength={2} placeholder="✅"/>
                <input value={newTaskForm.name} onChange={e=>setNewTaskForm(p=>({...p,name:e.target.value}))} style={{...inpSt(th),flex:1}} placeholder="Task name"/>
                <input type="number" value={newTaskForm.points} onChange={e=>setNewTaskForm(p=>({...p,points:parseInt(e.target.value)||0}))} style={{...inpSt(th),width:58}} min={1} max={100}/>
              </div>
              <button style={{...bSave,width:"100%",justifyContent:"center"}} onClick={addTask}>+ Add Task</button>
            </Glass>
          </div>
        )}
      </main>
    </div>
  );
}

const bSave={background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:12,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",boxShadow:"0 4px 14px rgba(124,58,237,0.35)"};
const bCancel=(t)=>({background:t?.inpBg||"rgba(0,0,0,0.05)",color:t?.textSub||"#64748b",border:"none",borderRadius:12,padding:"9px 16px",cursor:"pointer",fontSize:13,fontFamily:"inherit"});
const inpSt=(t)=>({background:t?.inpBg||"rgba(255,255,255,0.7)",border:`1.5px solid ${t?.inpBorder||"rgba(255,255,255,0.85)"}`,borderRadius:12,color:t?.textMid||"#334155",padding:"9px 11px",fontSize:13,outline:"none",fontFamily:"inherit"});

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;}html,body{margin:0;padding:0;height:100%;}button,input,textarea{font-family:inherit;}
  .bubble{animation:floatBubble linear infinite alternate;}
  .bubble-0{animation-name:float0;}.bubble-1{animation-name:float1;}.bubble-2{animation-name:float2;}
  .bubble-3{animation-name:float3;}.bubble-4{animation-name:float4;}.bubble-5{animation-name:float5;}
  @keyframes float0{0%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-40px) scale(1.05)}100%{transform:translate(-20px,25px) scale(0.97)}}
  @keyframes float1{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,30px) scale(1.08)}100%{transform:translate(25px,-30px) scale(0.95)}}
  @keyframes float2{0%{transform:translate(0,0) scale(1)}50%{transform:translate(50px,20px) scale(1.06)}100%{transform:translate(-30px,-40px) scale(1.02)}}
  @keyframes float3{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-25px,-50px) scale(0.95)}100%{transform:translate(40px,35px) scale(1.07)}}
  @keyframes float4{0%{transform:translate(0,0) scale(1)}50%{transform:translate(35px,45px) scale(1.04)}100%{transform:translate(-45px,-20px) scale(0.96)}}
  @keyframes float5{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-30px,35px) scale(1.09)}100%{transform:translate(30px,-45px) scale(0.94)}}
  .nav-inner{max-width:720px;margin:0 auto;display:flex;align-items:center;gap:10px;padding:8px 16px 0;}
  .nav-tabs{max-width:720px;margin:0 auto;display:flex;overflow-x:auto;gap:4px;padding:6px 12px 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
  .nav-tabs::-webkit-scrollbar{display:none;}
  .glass-card{transition:box-shadow 0.2s;}
  .nav-btn:hover{background:rgba(124,58,237,0.08)!important;}
  .cal-nav{font-size:22px;cursor:pointer;padding:4px 16px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.07);}
  .cal-cell-btn:hover{transform:scale(1.1);}.cal-cell-btn:active{transform:scale(0.96);}
  .reorder-btn{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:9px;padding:1px 4px;line-height:1;transition:color 0.15s;}.reorder-btn:hover{color:#7c3aed;}
  input:focus,textarea:focus{border-color:rgba(124,58,237,0.5)!important;box-shadow:0 0 0 3px rgba(124,58,237,0.1)!important;}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.2);border-radius:4px;}
  @media(min-width:640px){.nav-tabs{justify-content:center;}.nav-btn{min-width:64px!important;padding:8px 16px!important;}}
`;
