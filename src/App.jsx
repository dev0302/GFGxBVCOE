import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Navbar from "./components/Navbar"

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="pt-20"> {/* Reduced padding for smaller navbar */}
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
