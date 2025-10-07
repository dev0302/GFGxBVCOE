import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import Events from "./pages/Events"
import Navbar from "./components/Navbar"
import { FeatureFlagsProvider } from "./context/FeatureFlags.jsx"
import NotFound from "./components/NotFound"
import Contact from "./pages/Contact"
import Gallery from "./pages/Gallery"
import Team2 from "./pages/Team2"
import GFGBentoGrid from "./components/GFGBentoGrid";
import Timer from "./pages/Timer"
import ResultPage from "./pages/ResultPage"
import Quiz from "./pages/Quiz"
import Leaderboard from "./pages/Leaderboard"
import QuizResult from "./pages/QuizResult"




function App() {
  return (
    <FeatureFlagsProvider>
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
          <Route path="/timer" element={<ResultPage />} />
          <Route path="/results" element={<ResultPage />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/quiz/result" element={<QuizResult />} />
        </Routes>
      </div>
    </FeatureFlagsProvider>
  )
}
export default App
