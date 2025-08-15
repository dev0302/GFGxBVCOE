import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import Team from "./pages/Team"
import Events from "./pages/Events"
import Navbar from "./components/Navbar"
import NotFound from "./components/NotFound"
import Contact from "./pages/Contact"
<<<<<<< HEAD
import Gallery from "./pages/Gallery"
=======
import Team2 from "./pages/Team2"


>>>>>>> b81d90bc4dec0a913a1f0f7d5b9d8cb803a5bf1c

function App() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
    
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/team" element={<Team />} />
        <Route path="/events" element={<Events />} />
        <Route path="/notfound" element={<NotFound></NotFound>} />
        <Route path="/contact" element={<Contact />} />
<<<<<<< HEAD
        <Route path="/gallery" element={<Gallery />} />
=======
        <Route path="/team2" element={<Team2></Team2>}></Route>
>>>>>>> b81d90bc4dec0a913a1f0f7d5b9d8cb803a5bf1c
      </Routes>
    </div>
  )
}
export default App
