import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Onboarding from "./Onboarding";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import VideoDetail from "./VideoDetail";
import Upload from "./Upload";
import TrackMetadata from "./TrackMetadata";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import ChatPage from "./ChatPage";
import SearchResults from "./SearchResults";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:user_id" element={<Profile />} />
        <Route path="/video/:id" element={<VideoDetail />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/upload/metadata" element={<TrackMetadata />} />
        <Route path="/messages" element={<ChatPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
