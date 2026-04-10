import { useState } from 'react'
import VegetableList from './components/VegetableList'
import Calendar from './components/Calendar'
import Calculator from './components/Calculator'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('vegetables')

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌱 ベランダ菜園管理</h1>
        <p>My Little Green Garden</p>
      </header>

      <nav className="tab-nav">
        <button
          className={activeTab === 'vegetables' ? 'active' : ''}
          onClick={() => setActiveTab('vegetables')}
        >
          🥬 野菜管理
        </button>
        <button
          className={activeTab === 'calendar' ? 'active' : ''}
          onClick={() => setActiveTab('calendar')}
        >
          📅 カレンダー
        </button>
        <button
          className={activeTab === 'calculator' ? 'active' : ''}
          onClick={() => setActiveTab('calculator')}
        >
          🧮 計算
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'vegetables' && <VegetableList />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'calculator' && <Calculator />}
      </main>
    </div>
  )
}

export default App
