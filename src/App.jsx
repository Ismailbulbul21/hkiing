import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AdminPanel from './pages/AdminPanel'
import CredentialsView from './pages/CredentialsView'
import SurveyForm from './pages/SurveyForm'
import NotFound from './pages/NotFound'
import ConnectionManager from './components/ConnectionManager'
import './App.css'

const App = () => {
  return (
    <Router>
      <div className="app-container">
        {/* This component manages persistent connections */}
        <ConnectionManager />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/survey" element={<SurveyForm />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/credentials" element={<CredentialsView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App