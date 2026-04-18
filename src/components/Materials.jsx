import { useState, useEffect } from 'react'

const STORAGE_KEY = 'veggie-garden-materials'

const CATEGORIES = [
  { value: 'soil', label: '土', emoji: '🪣', color: '#795548', bg: '#efebe9' },
  { value: 'fertilizer', label: '肥料・活力剤', emoji: '🌿', color: '#388e3c', bg: '#e8f5e9' },
  { value: 'pesticide', label: '農薬・忌避剤', emoji: '🧴', color: '#e53935', bg: '#ffebee' },
  { value: 'other', label: 'その他', emoji: '📦', color: '#757575', bg: '#f5f5f5' },
]

const UNITS = ['L', 'mL', 'kg', 'g', '袋', '本', '個', '枚', '箱', 'セット']

function MaterialForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(initial)

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <div className="form-group">
        <label>名称</label>
        <input type="text" placeholder="例：培養土、草花用肥料" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
      </div>
      <div className="form-group">
        <label>カテゴリ</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.value} type="button"
              onClick={() => setForm(f => ({ ...f, category: cat.value }))}
              style={{
                padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: `2px solid ${form.category === cat.value ? cat.color : '#ddd'}`,
                background: form.category === cat.value ? cat.bg : 'white',
                color: form.category === cat.value ? cat.color : '#999',
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>数量</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="number" placeholder="例: 5" min="0" step="any" value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            style={{ flex: 1 }} />
          <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
            style={{ width: 84 }}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn-primary">{submitLabel}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>キャンセル</button>
      </div>
    </form>
  )
}

export default function Materials() {
  const [materials, setMaterials] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials))
  }, [materials])

  function addMaterial(form) {
    if (!form.name.trim()) return
    setMaterials(prev => [{
      id: Date.now(),
      name: form.name.trim(),
      category: form.category,
      quantity: form.quantity,
      unit: form.unit,
      addedAt: new Date().toISOString(),
    }, ...prev])
    setShowForm(false)
  }

  function saveEdit(form) {
    if (!form.name.trim()) return
    setMaterials(prev => prev.map(m => m.id === editingId ? { ...m, ...form, name: form.name.trim() } : m))
    setEditingId(null)
  }

  function deleteMaterial(id) {
    if (!window.confirm('この資材を削除してもよいですか？')) return
    setMaterials(prev => prev.filter(m => m.id !== id))
  }

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: materials.filter(m => m.category === cat.value),
  })).filter(g => g.items.length > 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>資材管理</h2>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null) }}>+ 追加</button>
      </div>

      {showForm && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>資材を追加</h3>
          <MaterialForm
            initial={{ name: '', category: 'soil', quantity: '', unit: 'L' }}
            onSubmit={addMaterial}
            onCancel={() => setShowForm(false)}
            submitLabel="追加する"
          />
        </div>
      )}

      {materials.length === 0 && !showForm ? (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '36px 24px' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>📦</div>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#888', marginBottom: 4 }}>資材がまだありません</p>
          <p style={{ fontSize: 13 }}>「+ 追加」から土や肥料などを登録してください</p>
        </div>
      ) : (
        grouped.map(cat => (
          <div key={cat.value} style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: cat.color,
              margin: '12px 0 6px 4px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {cat.emoji} {cat.label}
              <span style={{
                background: cat.color, color: 'white',
                borderRadius: 10, padding: '1px 7px', fontSize: 11,
              }}>{cat.items.length}</span>
            </div>
            {cat.items.map(item => (
              <div key={item.id} className="card">
                {editingId === item.id ? (
                  <MaterialForm
                    initial={{ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit }}
                    onSubmit={saveEdit}
                    onCancel={() => setEditingId(null)}
                    submitLabel="保存"
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      background: cat.bg, color: cat.color, borderRadius: 8,
                      padding: '6px 10px', fontSize: 20, minWidth: 42, textAlign: 'center', flexShrink: 0,
                    }}>{cat.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, wordBreak: 'break-all' }}>{item.name}</div>
                      {item.quantity && (
                        <div style={{ fontSize: 13, color: cat.color, fontWeight: 600, marginTop: 2 }}>
                          {item.quantity} {item.unit}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn-secondary" style={{ fontSize: 13, padding: '5px 10px' }}
                        onClick={() => { setEditingId(item.id); setShowForm(false) }}>修正</button>
                      <button className="btn-danger" onClick={() => deleteMaterial(item.id)}>削除</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
