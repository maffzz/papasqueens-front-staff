import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout({ children, title = 'Dashboard' }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar title={title} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  )
}
