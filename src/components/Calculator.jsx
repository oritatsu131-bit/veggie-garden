import { useState } from 'react'

function ResultBox({ label, value, unit }) {
  return (
    <div style={{
      background: '#e8f5e9', border: '2px solid #4a7c3f', borderRadius: 12,
      padding: '16px', textAlign: 'center', marginTop: 16,
    }}>
      <div style={{ fontSize: 13, color: '#5a7a50', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, color: '#2e7d32' }}>
        {value}<span style={{ fontSize: 18, marginLeft: 4 }}>{unit}</span>
      </div>
    </div>
  )
}

function PesticideCalc() {
  const [waterAmount, setWaterAmount] = useState('')
  const [waterUnit, setWaterUnit] = useState('ml')
  const [ratio, setRatio] = useState('')

  const waterMl = waterUnit === 'L' ? parseFloat(waterAmount) * 1000 : parseFloat(waterAmount)
  const ratioNum = parseFloat(ratio)
  const result = waterMl / ratioNum
  const isValid = waterMl > 0 && ratioNum > 0 && !isNaN(result)

  function formatResult(ml) {
    if (ml >= 1) return { value: ml.toFixed(1), unit: 'ml' }
    return { value: (ml * 1000).toFixed(1), unit: 'μl（マイクロリットル）' }
  }

  const formatted = isValid ? formatResult(result) : null

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        例：「300倍希釈」で「500ml」作りたい場合 → 農薬を何ml入れるか計算します
      </p>

      <div className="form-group">
        <label>作りたい水の量</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            placeholder="例: 500"
            value={waterAmount}
            onChange={e => setWaterAmount(e.target.value)}
            min="0"
            style={{ flex: 1 }}
          />
          <select value={waterUnit} onChange={e => setWaterUnit(e.target.value)} style={{ width: 80 }}>
            <option value="ml">ml</option>
            <option value="L">L</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>希釈倍率（〇〇倍）</label>
        <input
          type="number"
          placeholder="例: 300"
          value={ratio}
          onChange={e => setRatio(e.target.value)}
          min="1"
        />
      </div>

      {isValid && formatted && (
        <ResultBox
          label={`${waterAmount}${waterUnit} を ${ratio}倍希釈するのに必要な農薬の量`}
          value={formatted.value}
          unit={formatted.unit}
        />
      )}
      {isValid && (
        <div style={{ marginTop: 12, background: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 13, color: '#555' }}>
          <strong>計算式：</strong> {waterAmount}{waterUnit}（={waterMl}ml）÷ {ratio}倍 = {result.toFixed(2)} ml
        </div>
      )}
    </div>
  )
}

function FertilizerCalc() {
  const [soilAmount, setSoilAmount] = useState('')
  const [soilUnit, setSoilUnit] = useState('L')
  const [fertPerUnit, setFertPerUnit] = useState('')
  const [fertUnitBase, setFertUnitBase] = useState('L')

  const soilL = soilUnit === 'ml' ? parseFloat(soilAmount) / 1000 : parseFloat(soilAmount)
  const baseL = fertUnitBase === 'ml' ? parseFloat(fertPerUnit) / 1000 : parseFloat(fertUnitBase === 'L' ? 1 : 1)
  const fertNum = parseFloat(fertPerUnit)
  const isValid = soilL > 0 && fertNum > 0 && !isNaN(soilL) && !isNaN(fertNum)
  const result = isValid ? soilL * fertNum : 0

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        例：「土10Lに対し20g」と書いてある場合、自分の土の量に必要な肥料量を計算します
      </p>

      <div className="form-group">
        <label>自分の土の量</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            placeholder="例: 5"
            value={soilAmount}
            onChange={e => setSoilAmount(e.target.value)}
            min="0"
            style={{ flex: 1 }}
          />
          <select value={soilUnit} onChange={e => setSoilUnit(e.target.value)} style={{ width: 80 }}>
            <option value="L">L</option>
            <option value="ml">ml</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>説明書の記載（土 1L あたり 何g）</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, whiteSpace: 'nowrap', color: '#555' }}>土 1L に対し</span>
          <input
            type="number"
            placeholder="例: 2"
            value={fertPerUnit}
            onChange={e => setFertPerUnit(e.target.value)}
            min="0"
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 14, color: '#555' }}>g</span>
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
          ※「10Lに20g」の場合は「2」と入力（20÷10=2）
        </div>
      </div>

      {isValid && (
        <ResultBox
          label={`土 ${soilAmount}${soilUnit} に必要な肥料の量`}
          value={result % 1 === 0 ? result : result.toFixed(1)}
          unit="g"
        />
      )}
      {isValid && (
        <div style={{ marginTop: 12, background: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 13, color: '#555' }}>
          <strong>計算式：</strong> {soilAmount}{soilUnit} × {fertPerUnit}g/L = {result.toFixed(2)} g
        </div>
      )}
    </div>
  )
}

export default function Calculator() {
  const [activeCalc, setActiveCalc] = useState('pesticide')

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>計算ツール</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setActiveCalc('pesticide')}
          style={{
            flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            border: `2px solid ${activeCalc === 'pesticide' ? '#e53935' : '#ddd'}`,
            background: activeCalc === 'pesticide' ? '#ffebee' : 'white',
            color: activeCalc === 'pesticide' ? '#c62828' : '#888',
          }}
        >🧴 農薬希釈</button>
        <button
          onClick={() => setActiveCalc('fertilizer')}
          style={{
            flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            border: `2px solid ${activeCalc === 'fertilizer' ? '#795548' : '#ddd'}`,
            background: activeCalc === 'fertilizer' ? '#efebe9' : 'white',
            color: activeCalc === 'fertilizer' ? '#4e342e' : '#888',
          }}
        >🌿 肥料計算</button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: activeCalc === 'pesticide' ? '#c62828' : '#4e342e' }}>
          {activeCalc === 'pesticide' ? '🧴 農薬希釈計算' : '🌿 肥料計算'}
        </h3>
        {activeCalc === 'pesticide' ? <PesticideCalc /> : <FertilizerCalc />}
      </div>
    </div>
  )
}
