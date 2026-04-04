import { useState, useEffect } from 'react'
import VegetableDetail from './VegetableDetail'

const STORAGE_KEY = 'veggie-garden-vegetables'

export default function VegetableList() {
  const [vegetables, setVegetables] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [cultivationType, setCultivationType] = useState('soil')
  const [selectedVeg, setSelectedVeg] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vegetables))
  }, [vegetables])

  function addVegetable(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const veg = {
      id: Date.now(),
      name: newName.trim(),
      cultivationType,
      addedAt: new Date().toISOString(),
    }
    setVegetables(prev => [veg, ...prev])
    setNewName('')
    setCultivationType('soil')
    setShowForm(false)
    setSelectedVeg(veg)
  }

  function deleteVegetable(id) {
    setVegetables(prev => prev.filter(v => v.id !== id))
    if (selectedVeg?.id === id) setSelectedVeg(null)
  }

  function updateVegetable(updated) {
    setVegetables(prev => prev.map(v => v.id === updated.id ? updated : v))
    setSelectedVeg(updated)
  }

  if (selectedVeg) {
    return (
      <VegetableDetail
        vegetable={selectedVeg}
        onBack={() => setSelectedVeg(null)}
        onDelete={() => deleteVegetable(selectedVeg.id)}
        onUpdate={updateVegetable}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>育てている野菜</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ 追加</button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={addVegetable}>
            <div className="form-group">
              <label>野菜の名前</label>
              <input
                type="text"
                placeholder="例：トマト、キュウリ、バジル"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>栽培方法</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setCultivationType('soil')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    border: `2px solid ${cultivationType === 'soil' ? '#4a7c3f' : '#dde8d8'}`,
                    background: cultivationType === 'soil' ? '#e8f5e9' : 'white',
                    color: cultivationType === 'soil' ? '#2e7d32' : '#888',
                  }}
                >🪴 土耕栽培</button>
                <button
                  type="button"
                  onClick={() => setCultivationType('hydro')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    border: `2px solid ${cultivationType === 'hydro' ? '#1565c0' : '#dde8d8'}`,
                    background: cultivationType === 'hydro' ? '#e3f2fd' : 'white',
                    color: cultivationType === 'hydro' ? '#1565c0' : '#888',
                  }}
                >💧 水耕栽培</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary">追加する</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {vegetables.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#888', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
          <p>まだ野菜が登録されていません</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>「+ 追加」から野菜を登録してください</p>
        </div>
      ) : (
        vegetables.map(veg => (
          <div
            key={veg.id}
            className="card"
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setSelectedVeg(veg)}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{veg.name}</div>
              <div style={{ fontSize: 12, marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{
                  background: veg.cultivationType === 'hydro' ? '#e3f2fd' : '#e8f5e9',
                  color: veg.cultivationType === 'hydro' ? '#1565c0' : '#2e7d32',
                  borderRadius: 4, padding: '1px 6px', fontWeight: 600,
                }}>
                  {veg.cultivationType === 'hydro' ? '💧 水耕' : '🪴 土耕'}
                </span>
                <span style={{ color: '#aaa' }}>登録日: {new Date(veg.addedAt).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
            <span style={{ fontSize: 20 }}>›</span>
          </div>
        ))
      )}
    </div>
  )
}
