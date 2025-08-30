import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import Events from "./pages/Events"
import Navbar from "./components/Navbar"
import NotFound from "./components/NotFound"
import Contact from "./pages/Contact"
import Gallery from "./pages/Gallery"
import Team2 from "./pages/Team2"
import GFGBentoGrid from "./components/GFGBentoGrid";
import Timer from "./pages/Timer"
import ResultOut from "./components/ResultOut"



function App() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
    
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/team" element={<Team2 />} />
        <Route path="/events" element={<Events />} />
        <Route path="/notfound" element={<NotFound></NotFound>} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/bentogrid" element={<GFGBentoGrid />} />
        <Route path="/timer" element={<Timer />} />
        <Route path="/results" element={<ResultOut />} />
      </Routes>
    </div>
  )
}
export default App
