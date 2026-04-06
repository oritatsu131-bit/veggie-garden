import { useState, useEffect, useRef } from 'react'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const EVENT_TYPES = [
  { value: 'sowing', label: '種まき', emoji: '🌱', color: '#4caf50' },
  { value: 'fertilize', label: '追肥', emoji: '💧', color: '#2196f3' },
  { value: 'harvest', label: '収穫', emoji: '🥕', color: '#ff9800' },
  { value: 'watering', label: '水やり', emoji: '💦', color: '#00bcd4' },
  { value: 'pest', label: '病害虫対応', emoji: '🐛', color: '#f44336' },
  { value: 'other', label: 'その他', emoji: '📝', color: '#9e9e9e' },
]

const SECTION_STYLES = [
  { bg: '#e8f5e9', border: '#4caf50', icon: '🌿', titleColor: '#2e7d32' },
  { bg: '#e3f2fd', border: '#2196f3', icon: '📅', titleColor: '#1565c0' },
  { bg: '#fff8e1', border: '#ffb300', icon: '⚠️', titleColor: '#e65100' },
  { bg: '#fce4ec', border: '#e91e63', icon: '💡', titleColor: '#880e4f' },
]

function AdviceView({ text }) {
  // **太字** を除去してテキストだけ取り出す
  function cleanText(t) {
    return t.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim()
  }

  // 行を解析してセクションに分割
  const lines = text.split('\n').filter(l => l.trim())
  const sections = []
  let current = null

  for (const line of lines) {
    const cleaned = cleanText(line)
    // 見出し行（数字. または # で始まる）
    if (/^#+\s/.test(line) || /^\d+[\.\)]\s/.test(line)) {
      if (current) sections.push(current)
      current = { title: cleaned.replace(/^#+\s/, '').replace(/^\d+[\.\)]\s/, ''), items: [] }
    } else if (/^[-・*]\s/.test(line) || /^\s+[-・*]\s/.test(line)) {
      if (!current) current = { title: '', items: [] }
      current.items.push(cleaned.replace(/^[-・*]\s/, '').replace(/^\s+[-・*]\s/, ''))
    } else if (cleaned) {
      if (!current) current = { title: '', items: [] }
      if (current.title === '') {
        current.title = cleaned
      } else {
        current.items.push(cleaned)
      }
    }
  }
  if (current) sections.push(current)

  // セクションが取れなかった場合はそのまま表示
  if (sections.length === 0) {
    return <p style={{ fontSize: 14, lineHeight: 1.8, color: '#333' }}>{cleanText(text)}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sections.map((section, i) => {
        const style = SECTION_STYLES[i % SECTION_STYLES.length]
        return (
          <div key={i} style={{
            background: style.bg,
            border: `1px solid ${style.border}`,
            borderRadius: 10,
            padding: '10px 14px',
          }}>
            {section.title && (
              <div style={{ fontWeight: 700, fontSize: 14, color: style.titleColor, marginBottom: section.items.length ? 8 : 0 }}>
                {style.icon} {section.title}
              </div>
            )}
            {section.items.map((item, j) => (
              <div key={j} style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.7, color: '#333', marginTop: 4 }}>
                <span style={{ color: style.border, fontWeight: 700, marginTop: 1 }}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default function VegetableDetail({ vegetable, onBack, onArchive, onUpdate }) {
  const [advice, setAdvice] = useState(vegetable.savedAdvice || null)
  const [adviceUpdatedAt, setAdviceUpdatedAt] = useState(vegetable.adviceUpdatedAt || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const calendarEvents = JSON.parse(localStorage.getItem('veggie-garden-events') || '[]')
    .filter(e => e.vegetable === vegetable.name)
    .sort((a, b) => b.date.localeCompare(a.date))

  const [memoEntries, setMemoEntries] = useState(
    vegetable.memoEntries || (vegetable.notes ? [{ id: Date.now(), date: vegetable.addedAt.slice(0,10), text: vegetable.notes }] : [])
  )
  const [showMemoForm, setShowMemoForm] = useState(false)
  const [memoForm, setMemoForm] = useState({ date: new Date().toISOString().slice(0,10), text: '' })
  const [photos, setPhotos] = useState(vegetable.photos || [])
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().slice(0,10))
  const [showPhotoForm, setShowPhotoForm] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // 保存済みアドバイスがない場合のみ自動取得
    if (GEMINI_API_KEY && !vegetable.savedAdvice) fetchAdvice()
  }, [vegetable.id])

  async function fetchAdvice() {
    setLoading(true)
    setError(null)
    try {
      const method = vegetable.cultivationType === 'hydro' ? '水耕栽培' : '土耕栽培'
      const methodTips = vegetable.cultivationType === 'hydro'
        ? '水耕栽培特有の注意点（水質・pH・酸素供給・液体肥料の濃度など）'
        : '土耕栽培特有の注意点（土の状態・水はけ・鉢の大きさ・有機肥料など）'
      const prompt = `ベランダ菜園で「${vegetable.name}」を${method}で育てています。以下の情報を日本語で教えてください：

1. ${method}での基本情報（特徴・育てやすさ・${method}との相性）
2. 今の時期（${new Date().toLocaleDateString('ja-JP', { month: 'long' })}）に必要な管理ポイント
3. ${methodTips}
4. 今後1ヶ月で注意すべきこと

回答は箇条書きで簡潔にまとめてください。`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      )
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        const now = new Date().toISOString()
        setAdvice(text)
        setAdviceUpdatedAt(now)
        setError(null)
        onUpdate({ ...vegetable, savedAdvice: text, adviceUpdatedAt: now })
      } else {
        setError('回答を取得できませんでした: ' + JSON.stringify(data))
      }
    } catch (e) {
      setError('通信エラー: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function addMemo(e) {
    e.preventDefault()
    if (!memoForm.text.trim()) return
    const entry = { id: Date.now(), date: memoForm.date, text: memoForm.text.trim() }
    const updated = [...memoEntries, entry].sort((a, b) => b.date.localeCompare(a.date))
    setMemoEntries(updated)
    onUpdate({ ...vegetable, memoEntries: updated })
    setMemoForm({ date: new Date().toISOString().slice(0,10), text: '' })
    setShowMemoForm(false)
  }

  function deleteMemo(id) {
    if (!window.confirm('このメモを削除してもよいですか？')) return
    const updated = memoEntries.filter(m => m.id !== id)
    setMemoEntries(updated)
    onUpdate({ ...vegetable, memoEntries: updated })
  }

  function compressImage(file, callback) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let w = img.width
        let h = img.height
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX }
        else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        callback(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function handlePhotoUpload(e) {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      compressImage(file, (compressedUrl) => {
        const newPhoto = {
          id: Date.now() + Math.random(),
          url: compressedUrl,
          takenAt: photoDate,
        }
        setPhotos(prev => {
          const updated = [...prev, newPhoto].sort((a, b) => b.takenAt.localeCompare(a.takenAt))
          onUpdate({ ...vegetable, memoEntries, photos: updated })
          return updated
        })
      })
    })
    e.target.value = ''
    setShowPhotoForm(false)
  }

  function deletePhoto(photoId) {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== photoId)
      onUpdate({ ...vegetable, memoEntries, photos: updated })
      return updated
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button className="btn-secondary" onClick={onBack}>← 戻る</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>{vegetable.name}</h2>
        <button className="btn-danger" onClick={() => {
          if (window.confirm(`「${vegetable.name}」の栽培を終了して保管庫に移しますか？\n記録はそのまま保管されます。`)) { onArchive(); onBack() }
        }}>栽培終了</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <span style={{
          background: vegetable.cultivationType === 'hydro' ? '#e3f2fd' : '#e8f5e9',
          color: vegetable.cultivationType === 'hydro' ? '#1565c0' : '#2e7d32',
          border: `1px solid ${vegetable.cultivationType === 'hydro' ? '#90caf9' : '#a5d6a7'}`,
          borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 700,
        }}>
          {vegetable.cultivationType === 'hydro' ? '💧 水耕栽培' : '🪴 土耕栽培'}
        </span>
      </div>

      {/* AI アドバイス */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#4a7c3f' }}>🤖 AI 栽培アドバイス</h3>
            {adviceUpdatedAt && (
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                更新日: {new Date(adviceUpdatedAt).toLocaleDateString('ja-JP')}
              </div>
            )}
          </div>
          {GEMINI_API_KEY && !loading && (
            <button className="btn-secondary" onClick={fetchAdvice} style={{ fontSize: 13 }}>
              🔄 更新
            </button>
          )}
        </div>
        {!GEMINI_API_KEY && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffd54f', borderRadius: 8, padding: 12, fontSize: 14, color: '#795548' }}>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Gemini API キーが未設定です</p>
          </div>
        )}
        {GEMINI_API_KEY && loading && (
          <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <p>AIがアドバイスを生成中...</p>
          </div>
        )}
        {GEMINI_API_KEY && error && (
          <div style={{ color: '#e53935', fontSize: 14 }}>
            <p>{error}</p>
            <button className="btn-secondary" style={{ marginTop: 8 }} onClick={fetchAdvice}>再試行</button>
          </div>
        )}
        {GEMINI_API_KEY && !loading && advice && <AdviceView text={advice} />}
      </div>

      {/* カレンダー作業記録 */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#4a7c3f', marginBottom: 12 }}>📅 作業記録</h3>
        {calendarEvents.length === 0 ? (
          <p style={{ fontSize: 13, color: '#aaa' }}>カレンダーに記録がありません</p>
        ) : (
          calendarEvents.map(ev => {
            const type = EVENT_TYPES.find(t => t.value === ev.type)
            return (
              <div key={ev.id} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{
                  background: type?.color, color: 'white', borderRadius: 8,
                  padding: '4px 8px', fontSize: 16, minWidth: 34, textAlign: 'center', flexShrink: 0,
                }}>{type?.emoji}</div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#555', lineHeight: 1.6 }}>
                    <span>{new Date(ev.date).toLocaleDateString('ja-JP')} ／ {type?.label}</span>
                    {ev.note && <span style={{ fontWeight: 400, color: '#666', marginLeft: 6 }}>{ev.note}</span>}
                  </div>
                  {ev.photos?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {ev.photos.map(p => (
                        <img key={p.id} src={p.url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* メモ */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#4a7c3f' }}>📋 メモ</h3>
          <button className="btn-secondary" onClick={() => setShowMemoForm(v => !v)}>
            {showMemoForm ? 'キャンセル' : '+ 追加'}
          </button>
        </div>

        {showMemoForm && (
          <form onSubmit={addMemo} style={{ marginBottom: 12, background: '#f9fbf7', borderRadius: 8, padding: 12 }}>
            <div className="form-group">
              <label>日付</label>
              <input type="date" value={memoForm.date}
                onChange={e => setMemoForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>内容</label>
              <textarea rows={3} value={memoForm.text} autoFocus
                onChange={e => setMemoForm(f => ({ ...f, text: e.target.value }))}
                placeholder="気づいたことや作業内容を書いてください"
                style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn-primary">保存</button>
          </form>
        )}

        {memoEntries.length === 0 ? (
          <p style={{ fontSize: 13, color: '#aaa' }}>メモはありません</p>
        ) : (
          memoEntries.map(entry => (
            <div key={entry.id} style={{ borderLeft: '3px solid #4a7c3f', paddingLeft: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4a7c3f' }}>
                  {new Date(entry.date).toLocaleDateString('ja-JP')}
                </span>
                <button onClick={() => deleteMemo(entry.id)} style={{
                  background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14
                }}>✕</button>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#333', marginTop: 4 }}>
                {entry.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 写真 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#4a7c3f' }}>📷 写真</h3>
          <button className="btn-secondary" onClick={() => setShowPhotoForm(v => !v)}>
            {showPhotoForm ? 'キャンセル' : '+ 追加'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple
            style={{ display: 'none' }} onChange={handlePhotoUpload} />
        </div>

        {showPhotoForm && (
          <div style={{ marginBottom: 12, background: '#f9fbf7', borderRadius: 8, padding: 12 }}>
            <div className="form-group">
              <label>撮影日</label>
              <input type="date" value={photoDate}
                onChange={e => setPhotoDate(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={() => fileInputRef.current.click()}>
              📷 写真を選ぶ
            </button>
          </div>
        )}

        {photos.length === 0 ? (
          <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '16px 0' }}>
            写真はありません
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ position: 'relative' }}>
                <img src={photo.url} alt="野菜の写真"
                  style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 8 }} />
                <button onClick={() => {
                  if (window.confirm('この写真を削除してもよいですか？')) deletePhoto(photo.id)
                }} style={{
                  position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)',
                  color: 'white', border: 'none', borderRadius: '50%',
                  width: 24, height: 24, cursor: 'pointer', fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>✕</button>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' }}>
                  {new Date(photo.takenAt).toLocaleDateString('ja-JP')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
