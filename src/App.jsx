import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import Team from "./pages/Team"
import Events from "./pages/Events"
import Navbar from "./components/Navbar"
<<<<<<< HEAD
import NotFound from "./components/NotFound"
=======
import Contact from "./pages/Contact"
>>>>>>> 4ab432d268e46033adfc9ac8a37430eca3107692

function App() {
  return (
    <>
    
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/team" element={<Team />} />
        <Route path="/events" element={<Events />} />
<<<<<<< HEAD
        <Route path="/notfound" element={<NotFound></NotFound>} />
=======
        <Route path="/contact" element={<Contact />} />
>>>>>>> 4ab432d268e46033adfc9ac8a37430eca3107692
      </Routes>
    </>
  )
}
export default App
