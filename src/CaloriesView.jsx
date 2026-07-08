import { useState, useMemo } from "react";

const CALORIE_TARGET = 3000;

export const DEFAULT_FOODS = [
  { id: "f1",  name: "Egg",              caloriesPerUnit: 70,   unit: "egg" },
  { id: "f2",  name: "Chicken Drumstick",caloriesPerUnit: 150,  unit: "drumstick" },
  { id: "f3",  name: "Peanut Butter",    caloriesPerUnit: 5.8,  unit: "g" },
  { id: "f4",  name: "Bagel",            caloriesPerUnit: 250,  unit: "bagel" },
  { id: "f5",  name: "Pasta",            caloriesPerUnit: 3.5,  unit: "g" },
  { id: "f6",  name: "Stew",             caloriesPerUnit: 0.4,  unit: "g" },
  { id: "f7",  name: "Protein Powder",   caloriesPerUnit: 3.68, unit: "g" },
  { id: "f8",  name: "Egusi",            caloriesPerUnit: 3.04, unit: "g" },
  { id: "f9",  name: "Banana",           caloriesPerUnit: 90,   unit: "banana" },
  { id: "f10", name: "Salmon Fillet",    caloriesPerUnit: 118,  unit: "fillet" },
  { id: "f11", name: "Yoghurt",          caloriesPerUnit: 120,  unit: "tub" },
  { id: "f12", name: "Beef",             caloriesPerUnit: 1.5,  unit: "g" },
  { id: "f13", name: "Garri",            caloriesPerUnit: 3.6,  unit: "g" },
  { id: "f14", name: "Potato",           caloriesPerUnit: 0.9,  unit: "g" },
  { id: "f15", name: "Baked Beans",      caloriesPerUnit: 168,  unit: "can" },
  { id: "f16", name: "Sausages",         caloriesPerUnit: 2.48, unit: "g" },
  { id: "f17", name: "Oats",             caloriesPerUnit: 4,    unit: "g" },
];

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];

const MEAL_COLORS = {
  Breakfast: { solid: "#f59e0b", glass: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", icon: "🌅" },
  Lunch:     { solid: "#10b981", glass: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", icon: "☀️" },
  Dinner:    { solid: "#7c3aed", glass: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.3)", icon: "🌙" },
  Snacks:    { solid: "#ec4899", glass: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.3)", icon: "🍎" },
};

function Glass({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.55)",
      backdropFilter: "blur(28px) saturate(180%)",
      WebkitBackdropFilter: "blur(28px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.75)",
      borderRadius: 20,
      boxShadow: "0 8px 32px rgba(100,80,200,0.08), 0 1.5px 0 rgba(255,255,255,0.9) inset",
      ...style
    }}>
      {children}
    </div>
  );
}

const inp = {
  background: "rgba(255,255,255,0.7)",
  border: "1.5px solid rgba(255,255,255,0.85)",
  borderRadius: 10,
  color: "#334155",
  padding: "8px 10px",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

// ─── Food Picker Modal ────────────────────────────────────────────────────────
function FoodPickerModal({ foods, onAddMany, onClose }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // food being configured
  const [qty, setQty] = useState(1);
  const [basket, setBasket] = useState([]); // [{food, qty, calories}]

  const filtered = useMemo(() =>
    foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    [foods, search]
  );

  const basketTotal = basket.reduce((s, b) => s + b.calories, 0);
  const inBasket = (foodId) => basket.find(b => b.food.id === foodId);

  const selectFood = (f) => {
    // if clicking already-selected food, deselect
    if (selected?.id === f.id) { setSelected(null); return; }
    setSelected(f);
    // pre-fill qty from basket if already added
    const existing = inBasket(f.id);
    setQty(existing ? existing.qty : (f.unit === "g" ? 100 : 1));
  };

  const addToBasket = () => {
    if (!selected || qty <= 0) return;
    const calories = Math.round(selected.caloriesPerUnit * parseFloat(qty));
    setBasket(prev => {
      const exists = prev.find(b => b.food.id === selected.id);
      if (exists) return prev.map(b => b.food.id === selected.id ? { ...b, qty: parseFloat(qty), calories } : b);
      return [...prev, { food: selected, qty: parseFloat(qty), calories }];
    });
    setSelected(null);
    setSearch("");
  };

  const removeFromBasket = (foodId) => setBasket(prev => prev.filter(b => b.food.id !== foodId));

  const handleConfirm = () => {
    if (basket.length === 0) return;
    onAddMany(basket.map(b => ({ foodId: b.food.id, qty: b.qty, calories: b.calories })));
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(255,255,255,0.97)", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:600, maxHeight:"88vh", display:"flex", flexDirection:"column", padding:20, boxShadow:"0 -8px 40px rgba(0,0,0,0.15)" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:"#1e1b4b" }}>Add Foods</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>Pick multiple — tap a food, set quantity, tap ✚</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(0,0,0,0.07)", border:"none", borderRadius:20, width:28, height:28, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* Basket summary */}
        {basket.length > 0 && (
          <div style={{ background:"rgba(124,58,237,0.06)", border:"1.5px solid rgba(124,58,237,0.2)", borderRadius:14, padding:"10px 14px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#7c3aed", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>
              Basket — {basketTotal} kcal total
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {basket.map(b => (
                <div key={b.food.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ fontSize:13, color:"#334155", fontWeight:600 }}>{b.food.name} <span style={{ color:"#94a3b8", fontWeight:400 }}>× {b.qty} {b.food.unit}</span></div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#7c3aed" }}>{b.calories} kcal</span>
                    <button onClick={()=>removeFromBasket(b.food.id)} style={{ background:"none", border:"none", color:"#dc2626", cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search foods..." autoFocus
          style={{ ...inp, marginBottom:10, width:"100%", fontSize:14 }}
        />

        {/* Food list */}
        <div style={{ overflowY:"auto", flex:1, marginBottom:12 }}>
          {filtered.map(f => {
            const inB = inBasket(f.id);
            const isSelecting = selected?.id === f.id;
            return (
              <div key={f.id}>
                <div onClick={() => selectFood(f)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:12, marginBottom:4, cursor:"pointer", background: isSelecting ? "rgba(124,58,237,0.1)" : inB ? "rgba(16,185,129,0.07)" : "rgba(0,0,0,0.02)", border: isSelecting ? "1.5px solid rgba(124,58,237,0.4)" : inB ? "1.5px solid rgba(16,185,129,0.35)" : "1.5px solid transparent", transition:"all 0.15s" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, color: isSelecting ? "#7c3aed" : inB ? "#10b981" : "#334155" }}>{f.name}</div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>{f.caloriesPerUnit} kcal / {f.unit}{inB ? ` · ${inB.qty}${f.unit} added` : ""}</div>
                  </div>
                  <div style={{ width:22, height:22, borderRadius:6, background: isSelecting ? "linear-gradient(135deg,#7c3aed,#2563eb)" : inB ? "rgba(16,185,129,0.2)" : "rgba(0,0,0,0.05)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:800, color: isSelecting ? "#fff" : inB ? "#10b981" : "#94a3b8" }}>{isSelecting ? "▲" : inB ? "✓" : "+"}</span>
                  </div>
                </div>

                {/* Inline qty row when selected */}
                {isSelecting && (
                  <div style={{ display:"flex", gap:8, alignItems:"center", padding:"8px 12px 10px", background:"rgba(124,58,237,0.05)", borderRadius:"0 0 12px 12px", marginBottom:4, marginTop:-4 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:"#7c3aed", fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Qty ({f.unit})</div>
                      <input type="number" value={qty} min={0.1} step={f.unit==="g"?10:1}
                        onChange={e=>setQty(e.target.value)}
                        autoFocus
                        style={{ ...inp, width:"100%", fontSize:14 }}/>
                    </div>
                    <div style={{ textAlign:"center", minWidth:64 }}>
                      <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, marginBottom:4, textTransform:"uppercase" }}>Cals</div>
                      <div style={{ fontSize:20, fontWeight:800, color:"#7c3aed" }}>{Math.round(f.caloriesPerUnit * (parseFloat(qty)||0))}</div>
                    </div>
                    <button onClick={addToBasket} style={{ background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", border:"none", borderRadius:12, padding:"10px 16px", cursor:"pointer", fontWeight:800, fontSize:18, fontFamily:"inherit", boxShadow:"0 4px 12px rgba(124,58,237,0.35)", alignSelf:"flex-end" }}>✚</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Confirm button */}
        <button onClick={handleConfirm} disabled={basket.length===0}
          style={{ width:"100%", background: basket.length>0 ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(0,0,0,0.08)", color: basket.length>0 ? "#fff" : "#94a3b8", border:"none", borderRadius:16, padding:"14px", cursor: basket.length>0 ? "pointer" : "default", fontWeight:800, fontSize:15, fontFamily:"inherit", boxShadow: basket.length>0 ? "0 4px 14px rgba(124,58,237,0.35)" : "none", transition:"all 0.2s" }}>
          {basket.length > 0 ? `Add ${basket.length} food${basket.length>1?"s":""} · ${basketTotal} kcal` : "Select foods above"}
        </button>
      </div>
    </div>
  );
}

// ─── Food Library Manager ─────────────────────────────────────────────────────
function FoodLibrary({ foods, onUpdate }) {
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newForm, setNewForm] = useState({ name:"", caloriesPerUnit:"", unit:"g" });
  const [search, setSearch] = useState("");

  const filtered = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const saveEdit = () => {
    onUpdate(foods.map(f => f.id===editId ? { ...f, ...editForm, caloriesPerUnit: parseFloat(editForm.caloriesPerUnit) } : f));
    setEditId(null);
  };

  const deleteFood = (id) => onUpdate(foods.filter(f => f.id!==id));

  const addFood = () => {
    if (!newForm.name.trim() || !newForm.caloriesPerUnit) return;
    onUpdate([...foods, { id:"f"+Date.now(), name:newForm.name.trim(), caloriesPerUnit:parseFloat(newForm.caloriesPerUnit), unit:newForm.unit||"g" }]);
    setNewForm({ name:"", caloriesPerUnit:"", unit:"g" });
  };

  return (
    <div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search food library..." style={{ ...inp, width:"100%", marginBottom:12 }}/>

      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
        {filtered.map(f => (
          <Glass key={f.id} style={{ padding:"12px 14px" }}>
            {editId===f.id ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} style={{ ...inp, flex:2 }} placeholder="Food name"/>
                  <input type="number" value={editForm.caloriesPerUnit} onChange={e=>setEditForm(p=>({...p,caloriesPerUnit:e.target.value}))} style={{ ...inp, flex:1 }} placeholder="kcal"/>
                  <input value={editForm.unit} onChange={e=>setEditForm(p=>({...p,unit:e.target.value}))} style={{ ...inp, width:60 }} placeholder="unit"/>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={saveEdit} style={btnSave}>Save</button>
                  <button onClick={()=>setEditId(null)} style={btnCancel}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color:"#334155" }}>{f.name}</div>
                  <div style={{ fontSize:12, color:"#94a3b8" }}>{f.caloriesPerUnit} kcal / {f.unit}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>{setEditId(f.id);setEditForm({name:f.name,caloriesPerUnit:f.caloriesPerUnit,unit:f.unit});}} style={btnCancel}>Edit</button>
                  <button onClick={()=>deleteFood(f.id)} style={{ background:"rgba(239,68,68,0.1)", color:"#dc2626", border:"none", borderRadius:10, padding:"5px 10px", cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>✕</button>
                </div>
              </div>
            )}
          </Glass>
        ))}
      </div>

      <Glass style={{ padding:16, border:"1.5px dashed rgba(124,58,237,0.3)", background:"rgba(124,58,237,0.04)" }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Add New Food</div>
        <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
          <input value={newForm.name} onChange={e=>setNewForm(p=>({...p,name:e.target.value}))} placeholder="Food name" style={{ ...inp, flex:"2 1 120px" }}/>
          <input type="number" value={newForm.caloriesPerUnit} onChange={e=>setNewForm(p=>({...p,caloriesPerUnit:e.target.value}))} placeholder="kcal/unit" style={{ ...inp, flex:"1 1 80px" }}/>
          <input value={newForm.unit} onChange={e=>setNewForm(p=>({...p,unit:e.target.value}))} placeholder="unit (g/egg…)" style={{ ...inp, flex:"1 1 80px" }}/>
        </div>
        <button onClick={addFood} style={{ ...btnSave, width:"100%" }}>+ Add Food</button>
      </Glass>
    </div>
  );
}

// ─── Main Calories View ───────────────────────────────────────────────────────
export default function CaloriesView({ foods, onFoodsUpdate, calorieLog, onLogUpdate }) {
  const [activeTab, setActiveTab] = useState("log");
  const [pickerMeal, setPickerMeal] = useState(null);

  // calorieLog shape: { Breakfast: [{foodId, qty, calories, id}], Lunch: [...], ... }
  const log = calorieLog || {};

  const totalCalories = useMemo(() =>
    MEALS.reduce((sum, meal) => sum + (log[meal]||[]).reduce((s,e) => s+e.calories, 0), 0),
    [log]
  );

  const surplus = totalCalories - CALORIE_TARGET;
  const pct = Math.min(Math.round((totalCalories / CALORIE_TARGET) * 100), 150);

  const addEntry = (meal, entries) => {
    const newEntries = entries.map((e, i) => ({ ...e, id: (Date.now() + i).toString() }));
    onLogUpdate({ ...log, [meal]: [...(log[meal]||[]), ...newEntries] });
  };

  const removeEntry = (meal, id) => {
    onLogUpdate({ ...log, [meal]: (log[meal]||[]).filter(e=>e.id!==id) });
  };

  const getFoodName = (foodId) => foods.find(f=>f.id===foodId)?.name || "Unknown";
  const getFoodUnit = (foodId) => foods.find(f=>f.id===foodId)?.unit || "";

  const statusColor = surplus >= 0 ? "#16a34a" : "#dc2626";
  const statusLabel = surplus >= 0
    ? `+${surplus} kcal surplus 🔥`
    : `${Math.abs(surplus)} kcal deficit ❄️`;

  return (
    <div style={{ maxWidth:720, margin:"0 auto", padding:"24px 20px 48px" }}>
      <h1 style={{ fontWeight:800, fontSize:22, letterSpacing:"-0.02em", color:"#1e1b4b", marginBottom:4, marginTop:0 }}>Calories</h1>
      <div style={{ fontSize:12, color:"#94a3b8", marginBottom:16 }}>Target: {CALORIE_TARGET} kcal/day</div>

      {/* Summary card */}
      <Glass style={{ padding:20, marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Today's Intake</div>
            <div style={{ fontSize:44, fontWeight:800, lineHeight:1, color:"#1e1b4b", letterSpacing:"-0.03em" }}>{totalCalories}</div>
            <div style={{ fontSize:13, color:"#94a3b8" }}>kcal</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Status</div>
            <div style={{ fontSize:15, fontWeight:800, color:statusColor }}>{statusLabel}</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Target: {CALORIE_TARGET} kcal</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height:10, background:"rgba(0,0,0,0.06)", borderRadius:5, overflow:"visible", position:"relative", marginBottom:6 }}>
          <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background: surplus>=0 ? "linear-gradient(90deg,#10b981,#16a34a)" : "linear-gradient(90deg,#f59e0b,#ef4444)", borderRadius:5, transition:"width 0.5s" }}/>
          {/* Target marker */}
          <div style={{ position:"absolute", top:-4, left:"66.7%", width:2, height:18, background:"rgba(124,58,237,0.5)", borderRadius:1 }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#94a3b8" }}>
          <span>0</span>
          <span style={{ color:"rgba(124,58,237,0.7)", fontWeight:600 }}>3000 target</span>
          <span>4500</span>
        </div>
      </Glass>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["log","📋 Daily Log"],["library","🥦 Food Library"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{ flex:1, padding:"9px", borderRadius:14, border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:13, background:activeTab===id?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,0.6)", color:activeTab===id?"#fff":"#64748b", boxShadow:activeTab===id?"0 4px 14px rgba(124,58,237,0.3)":"0 2px 8px rgba(0,0,0,0.06)", transition:"all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab==="log" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {MEALS.map(meal => {
            const mc = MEAL_COLORS[meal];
            const entries = log[meal] || [];
            const mealTotal = entries.reduce((s,e)=>s+e.calories,0);
            return (
              <Glass key={meal} style={{ padding:16, borderColor:mc.border, background:mc.glass }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:entries.length>0?12:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:22 }}>{mc.icon}</span>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15, color:"#1e1b4b" }}>{meal}</div>
                      {entries.length > 0 && <div style={{ fontSize:12, fontWeight:700, color:mc.solid }}>{mealTotal} kcal</div>}
                    </div>
                  </div>
                  <button onClick={()=>setPickerMeal(meal)} style={{ background:mc.solid, color:"#fff", border:"none", borderRadius:12, padding:"7px 14px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit", boxShadow:`0 3px 10px ${mc.solid}44` }}>+ Add</button>
                </div>

                {entries.length > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {entries.map(entry => (
                      <div key={entry.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", background:"rgba(255,255,255,0.6)", borderRadius:12 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{getFoodName(entry.foodId)}</div>
                          <div style={{ fontSize:11, color:"#94a3b8" }}>{entry.qty} {getFoodUnit(entry.foodId)}</div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ fontSize:14, fontWeight:800, color:mc.solid }}>{entry.calories} kcal</div>
                          <button onClick={()=>removeEntry(meal,entry.id)} style={{ background:"rgba(239,68,68,0.1)", color:"#dc2626", border:"none", borderRadius:8, width:24, height:24, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                        </div>
                      </div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:4 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:mc.solid, background:`${mc.solid}18`, padding:"3px 10px", borderRadius:20 }}>Total: {mealTotal} kcal</div>
                    </div>
                  </div>
                )}

                {entries.length === 0 && (
                  <div style={{ fontSize:12, color:"#94a3b8", marginTop:8, fontStyle:"italic" }}>Nothing logged yet — tap + Add</div>
                )}
              </Glass>
            );
          })}
        </div>
      )}

      {activeTab==="library" && <FoodLibrary foods={foods} onUpdate={onFoodsUpdate}/>}

      {pickerMeal && (
        <FoodPickerModal
          foods={foods}
          onAddMany={(entries) => addEntry(pickerMeal, entries)}
          onClose={() => setPickerMeal(null)}
        />
      )}
    </div>
  );
}

const btnSave = { background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", border:"none", borderRadius:12, padding:"9px 20px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit", boxShadow:"0 4px 14px rgba(124,58,237,0.35)" };
const btnCancel = { background:"rgba(0,0,0,0.05)", color:"#64748b", border:"none", borderRadius:12, padding:"9px 16px", cursor:"pointer", fontSize:13, fontFamily:"inherit" };
