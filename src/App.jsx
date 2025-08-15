import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import Team from "./pages/Team"
import Events from "./pages/Events"
import Navbar from "./components/Navbar"
import NotFound from "./components/NotFound"
import Contact from "./pages/Contact"

function App() {
  return (
    <>
    
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/team" element={<Team />} />
        <Route path="/events" element={<Events />} />
        <Route path="/notfound" element={<NotFound></NotFound>} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </>
  )
}
export default App
