import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css'; // Import global styles
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import CountryPage from './pages/CountryPage';
import { TravelProvider } from './context/TravelContext';

import Sidebar from './components/Sidebar';
import StarMap from './pages/StarMap';
import TravelCalendar from './pages/TravelCalendar';
import AddTripModal from './components/Map/AddTripModal';
import AllPosts from './pages/AllPosts';
import FuturePlans from './pages/FuturePlans';
import Memo from './pages/Memo';
import Games from './pages/Games';
import LoveGallery from './pages/LoveGallery';
import BackupProposal from './pages/BackupProposal';

function AppContent() {
  const location = useLocation();
  const isBackupPage = location.pathname === '/backup';

  return (
    <div className={`flex bg-[#0a0a0a] min-h-screen text-white ${isBackupPage ? 'h-screen overflow-hidden' : ''}`}>
      {!isBackupPage && <Sidebar />}
      <main className={isBackupPage ? 'w-full h-full' : 'flex-1 ml-16 relative'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<LoveGallery />} />
          <Route path="/country/:countryName" element={<CountryPage />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/all-posts" element={<AllPosts />} />
          <Route path="/future-plans" element={<FuturePlans />} />
          <Route path="/memo" element={<Memo />} />
          <Route path="/games" element={<Games />} />
          <Route path="/star-map" element={<StarMap />} />
          <Route path="/calendar" element={<TravelCalendar />} />
          <Route path="/backup" element={<BackupProposal />} />
        </Routes>
        {!isBackupPage && <AddTripModal />}
      </main>
    </div>
  );
}

function App() {
  return (
    <TravelProvider>
      <Router>
        <AppContent />
      </Router>
    </TravelProvider>
  );
}

export default App;
