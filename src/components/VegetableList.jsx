import { useState, useEffect, useRef } from 'react'
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
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [fetchingIds, setFetchingIds] = useState(new Set())
  const [notFoundIds, setNotFoundIds] = useState(new Set())
  const touchDraggingRef = useRef(false)
  const wasDragRef = useRef(false)
  const touchStartPos = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vegetables))
  }, [vegetables])

  useEffect(() => {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedVegetables))
  }, [archivedVegetables])

  async function fetchVegImage(veg) {
    try {
      const res = await fetch(`https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(veg.name)}`)
      const data = await res.json()
      if (data.thumbnail?.source) {
        setVegetables(prev => prev.map(v => v.id === veg.id ? { ...v, vegImageUrl: data.thumbnail.source } : v))
      }
    } catch {}
  }

  async function fetchVegImageManual(veg) {
    setFetchingIds(prev => new Set([...prev, veg.id]))
    setNotFoundIds(prev => { const s = new Set(prev); s.delete(veg.id); return s })
    try {
      const res = await fetch(`https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(veg.name)}`)
      const data = await res.json()
      if (data.thumbnail?.source) {
        setVegetables(prev => prev.map(v => v.id === veg.id ? { ...v, vegImageUrl: data.thumbnail.source } : v))
      } else {
        setNotFoundIds(prev => new Set([...prev, veg.id]))
      }
    } catch {
      setNotFoundIds(prev => new Set([...prev, veg.id]))
    } finally {
      setFetchingIds(prev => { const s = new Set(prev); s.delete(veg.id); return s })
    }
  }

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
    fetchVegImage(veg)
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

  function reorderVegetables(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return
    setVegetables(prev => {
      const arr = [...prev]
      const fromIdx = arr.findIndex(v => v.id === fromId)
      const toIdx = arr.findIndex(v => v.id === toId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [item] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, item)
      return arr
    })
  }

  function updateVegetable(updated) {
    setVegetables(prev => prev.map(v => v.id === updated.id ? updated : v))
    setSelectedVeg(updated)
  }

  const calendarEvents = JSON.parse(localStorage.getItem('veggie-garden-events') || '[]')

  function getTotalHarvest(vegName) {
    return calendarEvents
      .filter(e => e.type === 'harvest' && e.vegetable === vegName && e.harvestCount)
      .reduce((sum, e) => sum + Number(e.harvestCount), 0)
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
        <div className="card" style={{ textAlign: 'center', padding: 0, overflow: 'hidden' }}>
          <div style={{
            height: 160,
            background: 'linear-gradient(180deg, rgba(30,80,20,0.18) 0%, rgba(30,80,20,0.55) 100%), url(https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=80) center/cover no-repeat',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 16,
          }}>
            <span style={{ fontSize: 48, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}>🌱</span>
          </div>
          <div style={{ padding: '20px 24px 24px', color: '#7a9a6a' }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#4a7c3f', marginBottom: 6 }}>さあ、菜園をはじめよう！</p>
            <p style={{ fontSize: 13 }}>「+ 追加」から育てたい野菜を登録してください</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
          {vegetables.map(veg => (
            <div
              key={veg.id}
              className="card"
              data-veg-id={veg.id}
              draggable="true"
              onDragStart={() => setDraggingId(veg.id)}
              onDragOver={(e) => { e.preventDefault(); if (draggingId !== veg.id) setDragOverId(veg.id) }}
              onDrop={(e) => { e.preventDefault(); reorderVegetables(draggingId, veg.id); setDragOverId(null) }}
              onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
              onTouchStart={(e) => {
                touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
                touchDraggingRef.current = false
                wasDragRef.current = false
                setDraggingId(veg.id)
              }}
              onTouchMove={(e) => {
                if (!touchStartPos.current) return
                const dx = e.touches[0].clientX - touchStartPos.current.x
                const dy = e.touches[0].clientY - touchStartPos.current.y
                if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                  touchDraggingRef.current = true
                  wasDragRef.current = true
                }
                if (touchDraggingRef.current) {
                  const touch = e.touches[0]
                  const el = document.elementFromPoint(touch.clientX, touch.clientY)
                  const card = el?.closest('[data-veg-id]')
                  if (card) setDragOverId(Number(card.dataset.vegId))
                }
              }}
              onTouchEnd={() => {
                if (touchDraggingRef.current) reorderVegetables(draggingId, dragOverId)
                touchDraggingRef.current = false
                touchStartPos.current = null
                setDraggingId(null)
                setDragOverId(null)
              }}
              onClick={() => {
                if (wasDragRef.current) { wasDragRef.current = false; return }
                setSelectedVeg(veg)
              }}
              style={{
                cursor: draggingId === veg.id ? 'grabbing' : 'grab',
                margin: 0,
                padding: 14,
                opacity: draggingId === veg.id ? 0.4 : 1,
                outline: dragOverId === veg.id && draggingId !== veg.id ? '2px solid #4a7c3f' : 'none',
                transition: 'opacity 0.15s',
                userSelect: 'none',
              }}
            >
              {veg.vegImageUrl ? (
                <img
                  src={veg.vegImageUrl}
                  alt={veg.name}
                  style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <div style={{ marginBottom: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>
                    {veg.cultivationType === 'hydro' ? '💧' : '🪴'}
                  </div>
                  {fetchingIds.has(veg.id) ? (
                    <div style={{ fontSize: 11, color: '#aaa' }}>取得中…</div>
                  ) : notFoundIds.has(veg.id) ? (
                    <div style={{ fontSize: 11, color: '#e57373' }}>画像が見つかりませんでした</div>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); fetchVegImageManual(veg) }}
                      style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 4,
                        background: '#f0f7f0', color: '#4a7c3f',
                        border: '1px solid #c8d8c0', cursor: 'pointer', fontWeight: 600,
                      }}
                    >画像登録</button>
                  )}
                </div>
              )}
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
              {getTotalHarvest(veg.name) > 0 && (
                <div style={{ fontSize: 12, color: '#ff9800', fontWeight: 700, marginTop: 6 }}>
                  🥕 累計 {getTotalHarvest(veg.name)}個
                </div>
              )}
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
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
            border: '2px dashed #c8d8c0', background: 'white',
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
