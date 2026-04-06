import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'veggie-garden-events'

const EVENT_TYPES = [
  { value: 'sowing', label: '種まき', emoji: '🌱', color: '#4caf50' },
  { value: 'fertilize', label: '追肥', emoji: '💧', color: '#2196f3' },
  { value: 'harvest', label: '収穫', emoji: '🥕', color: '#ff9800' },
  { value: 'watering', label: '水やり', emoji: '💦', color: '#00bcd4' },
  { value: 'pest', label: '病害虫対応', emoji: '🐛', color: '#f44336' },
  { value: 'other', label: 'その他', emoji: '📝', color: '#9e9e9e' },
]

export default function Calendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [form, setForm] = useState({ type: 'sowing', vegetable: '', note: '', photos: [], harvestCount: '' })
  const [expandedEvent, setExpandedEvent] = useState(null)
  const fileInputRef = useRef(null)
  const addPhotoRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  }, [events])

  const vegetables = JSON.parse(localStorage.getItem('veggie-garden-vegetables') || '[]')

  function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
  function getFirstDay(y, m) { return new Date(y, m, 1).getDay() }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function dateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function eventsOnDay(d) {
    return events.filter(e => e.date === dateKey(year, month, d))
  }

  function openAddForm(d) {
    setSelectedDate(d)
    setForm({ type: 'sowing', vegetable: vegetables[0]?.name || '', note: '', photos: [], harvestCount: '' })
    setShowForm(true)
    setExpandedEvent(null)
  }

  function compressImage(file, callback) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let w = img.width, h = img.height
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX }
        else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        callback(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function handleFormPhotoUpload(e) {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      compressImage(file, (url) => {
        setForm(f => ({
          ...f,
          photos: [...f.photos, { id: Date.now() + Math.random(), url }]
        }))
      })
    })
    e.target.value = ''
  }

  function removeFormPhoto(photoId) {
    setForm(f => ({ ...f, photos: f.photos.filter(p => p.id !== photoId) }))
  }

  function addEvent(e) {
    e.preventDefault()
    const event = { id: Date.now(), date: dateKey(year, month, selectedDate), ...form }
    setEvents(prev => [...prev, event])
    setShowForm(false)
  }

  function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id))
    if (expandedEvent === id) setExpandedEvent(null)
  }

  function handleAddPhotoToEvent(eventId, e) {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      compressImage(file, (url) => {
        setEvents(prev => prev.map(event => {
          if (event.id !== eventId) return event
          return {
            ...event,
            photos: [...(event.photos || []), { id: Date.now() + Math.random(), url }]
          }
        }))
      })
    })
    e.target.value = ''
  }

  function deletePhotoFromEvent(eventId, photoId) {
    setEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event
      return { ...event, photos: (event.photos || []).filter(p => p.id !== photoId) }
    }))
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDay(year, month)
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  const dayNames = ['日','月','火','水','木','金','土']
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div>
      {/* 月ナビゲーション */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button className="btn-secondary" onClick={prevMonth}>‹</button>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{year}年 {monthNames[month]}</h2>
        <button className="btn-secondary" onClick={nextMonth}>›</button>
      </div>

      {/* カレンダー */}
      <div className="card" style={{ padding: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {dayNames.map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 12, fontWeight: 700, padding: '4px 0',
              color: i === 0 ? '#e53935' : i === 6 ? '#1565c0' : '#555'
            }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />
            const dayEvents = eventsOnDay(d)
            const isToday = dateKey(year, month, d) === todayKey
            const dow = (firstDay + d - 1) % 7
            return (
              <div key={d} onClick={() => openAddForm(d)} style={{
                minHeight: 52, border: isToday ? '2px solid #4a7c3f' : '1px solid #eee',
                borderRadius: 6, padding: '2px 4px', cursor: 'pointer',
                background: isToday ? '#f0f7ee' : 'white',
              }}>
                <div style={{
                  fontSize: 12, fontWeight: isToday ? 700 : 400,
                  color: dow === 0 ? '#e53935' : dow === 6 ? '#1565c0' : '#333', marginBottom: 2,
                }}>{d}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {dayEvents.slice(0, 3).map(ev => {
                    const type = EVENT_TYPES.find(t => t.value === ev.type)
                    return <span key={ev.id} style={{ fontSize: 10 }}>{type?.emoji}</span>
                  })}
                  {dayEvents.length > 3 && <span style={{ fontSize: 9, color: '#888' }}>+{dayEvents.length - 3}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* イベント追加フォーム */}
      {showForm && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            📝 {year}年{monthNames[month]}{selectedDate}日 に記録を追加
          </h3>
          <form onSubmit={addEvent}>
            <div className="form-group">
              <label>作業の種類</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>野菜</label>
              {vegetables.length > 0 ? (
                <select value={form.vegetable} onChange={e => setForm(f => ({ ...f, vegetable: e.target.value }))}>
                  {vegetables.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  <option value="">（未選択）</option>
                </select>
              ) : (
                <input type="text" placeholder="例：トマト" value={form.vegetable}
                  onChange={e => setForm(f => ({ ...f, vegetable: e.target.value }))} />
              )}
            </div>
            {form.type === 'harvest' && (
              <div className="form-group">
                <label>収穫個数</label>
                <input
                  type="number"
                  min="0"
                  placeholder="例：5"
                  value={form.harvestCount}
                  onChange={e => setForm(f => ({ ...f, harvestCount: e.target.value }))}
                />
              </div>
            )}
            <div className="form-group">
              <label>メモ（任意）</label>
              <textarea rows={2} placeholder="作業の詳細など" value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label>写真（任意）</label>
              <button type="button" className="btn-secondary" onClick={() => fileInputRef.current.click()}>
                📷 写真を選ぶ
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple
                style={{ display: 'none' }} onChange={handleFormPhotoUpload} />
              {form.photos.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {form.photos.map(p => (
                    <div key={p.id} style={{ position: 'relative' }}>
                      <img src={p.url} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6 }} />
                      <button type="button" onClick={() => removeFormPhoto(p.id)} style={{
                        position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)',
                        color: 'white', border: 'none', borderRadius: '50%',
                        width: 18, height: 18, cursor: 'pointer', fontSize: 10
                      }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary">記録する</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* 今月のイベント一覧 */}
      <div style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>今月の記録</h3>
        {events
          .filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(ev => {
            const type = EVENT_TYPES.find(t => t.value === ev.type)
            const isExpanded = expandedEvent === ev.id
            return (
              <div key={ev.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    background: type?.color, color: 'white', borderRadius: 8,
                    padding: '4px 8px', fontSize: 18, minWidth: 36, textAlign: 'center'
                  }}>{type?.emoji}</div>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {ev.date.split('-')[2]}日 - {ev.vegetable || '未設定'} / {type?.label}
                      {ev.type === 'harvest' && ev.harvestCount && (
                        <span style={{ marginLeft: 6, color: '#ff9800', fontWeight: 700 }}>🥕 {ev.harvestCount}個</span>
                      )}
                    </div>
                    {ev.note && <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{ev.note}</div>}
                    {(ev.photos?.length > 0) && (
                      <div style={{ fontSize: 12, color: '#4a7c3f', marginTop: 2 }}>📷 {ev.photos.length}枚</div>
                    )}
                  </div>
                  <button className="btn-danger" onClick={() => {
                    if (window.confirm('この記録を削除してもよいですか？')) deleteEvent(ev.id)
                  }}>削除</button>
                </div>

                {/* 展開時：写真表示＋追加 */}
                {isExpanded && (
                  <div style={{ marginTop: 12 }}>
                    {ev.photos?.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
                        {ev.photos.map(photo => (
                          <div key={photo.id} style={{ position: 'relative' }}>
                            <img src={photo.url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                            <button onClick={() => deletePhotoFromEvent(ev.id, photo.id)} style={{
                              position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)',
                              color: 'white', border: 'none', borderRadius: '50%',
                              width: 24, height: 24, cursor: 'pointer', fontSize: 12
                            }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button className="btn-secondary" onClick={() => {
                      setTimeout(() => addPhotoRef.current?.click(), 100)
                    }}>
                      📷 写真を追加
                    </button>
                    <input ref={addPhotoRef} type="file" accept="image/*" multiple
                      style={{ display: 'none' }}
                      onChange={e => handleAddPhotoToEvent(ev.id, e)} />
                  </div>
                )}
              </div>
            )
          })}
        {events.filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length === 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', padding: 20, fontSize: 14 }}>
            この月の記録はありません
          </div>
        )}
      </div>
    </div>
  )
}
