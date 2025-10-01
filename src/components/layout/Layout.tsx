import { Outlet } from 'react-router-dom'
import Header from './Header'
import './Layout.css'

const Layout = () => {
  return (
    <div className="app-container no-sidebar">
      {/* <Sidebar /> */}
      <div className="main-content">
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout