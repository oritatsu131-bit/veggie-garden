import { useState, useEffect } from 'react'
import VegetableDetail from './VegetableDetail'

const STORAGE_KEY = 'veggie-garden-vegetables'
const ARCHIVE_KEY = 'veggie-garden-archive'

export default function VegetableList() {
  const [vegetables, setVegetables] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [archivedVegetables, setArchivedVegetables] = useState(() => {
    const saved = localStorage.getItem(ARCHIVE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [cultivationType, setCultivationType] = useState('soil')
  const [selectedVeg, setSelectedVeg] = useState(null)
  const [showArchive, setShowArchive] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vegetables))
  }, [vegetables])

  useEffect(() => {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedVegetables))
  }, [archivedVegetables])

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

  function archiveVegetable(id) {
    const veg = vegetables.find(v => v.id === id)
    if (!veg) return
    setArchivedVegetables(prev => [{ ...veg, archivedAt: new Date().toISOString() }, ...prev])
    setVegetables(prev => prev.filter(v => v.id !== id))
    if (selectedVeg?.id === id) setSelectedVeg(null)
  }

  function restoreVegetable(id) {
    const veg = archivedVegetables.find(v => v.id === id)
    if (!veg) return
    const { archivedAt, ...restored } = veg
    setVegetables(prev => [restored, ...prev])
    setArchivedVegetables(prev => prev.filter(v => v.id !== id))
  }

  function permanentDelete(id) {
    if (!window.confirm('記録も含めて完全に削除してもよいですか？')) return
    setArchivedVegetables(prev => prev.filter(v => v.id !== id))
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
        onArchive={() => archiveVegetable(selectedVeg.id)}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
          {vegetables.map(veg => (
            <div
              key={veg.id}
              className="card"
              style={{ cursor: 'pointer', margin: 0, padding: 14 }}
              onClick={() => setSelectedVeg(veg)}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>
                {veg.cultivationType === 'hydro' ? '💧' : '🪴'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, wordBreak: 'break-all' }}>
                {veg.name}
              </div>
              <span style={{
                background: veg.cultivationType === 'hydro' ? '#e3f2fd' : '#e8f5e9',
                color: veg.cultivationType === 'hydro' ? '#1565c0' : '#2e7d32',
                borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600,
              }}>
                {veg.cultivationType === 'hydro' ? '水耕' : '土耕'}
              </span>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>
                {new Date(veg.addedAt).toLocaleDateString('ja-JP')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 保管庫 */}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => setShowArchive(v => !v)}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
            border: '2px dashed #c8d8c0', background: 'transparent',
            color: '#7a9a6e', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          📦 保管庫
          {archivedVegetables.length > 0 && (
            <span style={{
              background: '#7a9a6e', color: 'white',
              borderRadius: 10, padding: '1px 7px', fontSize: 12,
            }}>{archivedVegetables.length}</span>
          )}
          <span style={{ fontSize: 12, marginLeft: 4 }}>{showArchive ? '▲' : '▼'}</span>
        </button>

        {showArchive && (
          <div style={{ marginTop: 10 }}>
            {archivedVegetables.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', padding: '20px 0', fontSize: 14 }}>
                保管庫は空です
              </div>
            ) : (
              archivedVegetables.map(veg => (
                <div
                  key={veg.id}
                  className="card"
                  style={{ opacity: 0.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#666' }}>{veg.name}</div>
                    <div style={{ fontSize: 12, marginTop: 3, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        background: veg.cultivationType === 'hydro' ? '#e3f2fd' : '#e8f5e9',
                        color: veg.cultivationType === 'hydro' ? '#1565c0' : '#2e7d32',
                        borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600,
                      }}>
                        {veg.cultivationType === 'hydro' ? '💧 水耕' : '🪴 土耕'}
                      </span>
                      <span style={{ color: '#bbb' }}>
                        終了: {new Date(veg.archivedAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => restoreVegetable(veg.id)}
                      style={{
                        background: '#e8f5e9', color: '#2e7d32', border: 'none',
                        borderRadius: 6, padding: '5px 10px', fontSize: 12,
                        cursor: 'pointer', fontWeight: 600,
                      }}
                    >復元</button>
                    <button
                      onClick={() => permanentDelete(veg.id)}
                      style={{
                        background: 'none', color: '#ccc', border: 'none',
                        borderRadius: 6, padding: '5px 8px', fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >完全削除</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
