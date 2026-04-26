import React, { useState } from 'react'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import FreshnessPage from './pages/FreshnessPage.jsx'
import TestsPage from './pages/TestsPage.jsx'
import PipelinesPage from './pages/PipelinesPage.jsx'
import './App.css'

const PAGES = {
  overview: OverviewPage,
  freshness: FreshnessPage,
  tests: TestsPage,
  pipelines: PipelinesPage,
}

export default function App() {
  const [page, setPage] = useState('overview')
  const PageComponent = PAGES[page] || OverviewPage

  return (
    <div className="app-shell">
      <Sidebar active={page} onNav={setPage} />
      <div className="app-main">
        <Header page={page} />
        <main className="app-content">
          <PageComponent />
        </main>
      </div>
    </div>
  )
}
