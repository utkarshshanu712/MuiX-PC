import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme, useTheme, useMediaQuery } from '@mui/material';
import axios from "axios";
import Sidebar from "./components/Sidebar";
import Player from "./components/Player";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Library from "./pages/Library";
import Login from "./pages/Login";
import Playlist from "./pages/Playlist";
import LikedSongs from "./pages/LikedSongs";
import Artist from './pages/Artist';
import Album from './pages/Album';
import TopArtists from './pages/TopArtists';
import Following from './pages/Following';
import TopPlaylists from './pages/TopPlaylists';
import TopPlaylistDetails from './pages/TopPlaylistDetails';
import ForYou from './pages/ForYou';
import CreatePlaylist from './pages/CreatePlaylist';
import { TopPlaylistsProvider } from './contexts/TopPlaylistsContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { LibraryProvider } from "./contexts/LibraryContext";
import { ArtistProvider } from './contexts/ArtistContext';
import { AudioProvider } from './contexts/AudioContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { useLocalStorage } from "./hooks/useLocalStorage";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1DB954",
    },
    background: {
      default: "#121212",
      paper: "#121212",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
});

function AppContent() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isForYouPage = location.pathname === '/for-you';
  const [navigationKey, setNavigationKey] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Reset navigation state when location changes
  useEffect(() => {
    if (isNavigating) return; // Prevent multiple navigation attempts
    
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
      setNavigationKey(prev => prev + 1);
      // Force scroll to top on navigation
      window.scrollTo(0, 0);
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Prevent navigation when already navigating
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('lastPath', location.pathname);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location.pathname]);

  // Handle back/forward browser buttons
  useEffect(() => {
    const handlePopState = () => {
      if (!isNavigating) {
        setNavigationKey(prev => prev + 1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isNavigating]);

  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [currentTrack, setCurrentTrack] = useLocalStorage("currentTrack", null);
  const [queue, setQueue] = useLocalStorage("queue", []);
  const [playHistory, setPlayHistory] = useLocalStorage("playHistory", []);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const MINIMUM_QUEUE_LENGTH = 50;
  const FETCH_THRESHOLD = 10;

  useEffect(() => {
    const storedTrack = localStorage.getItem("currentTrack");
    if (storedTrack) {
      try {
        const track = JSON.parse(storedTrack);
        // Validate that the track has all required properties
        if (track && track.id && track.name && (track.downloadUrl?.[0]?.url || track.image)) {
          setCurrentTrack(track);
        } else {
          localStorage.removeItem("currentTrack");
          setCurrentTrack(null);
        }
      } catch (error) {
        console.error("Error parsing stored track:", error);
        localStorage.removeItem("currentTrack");
        setCurrentTrack(null);
      }
    }
  }, []);

  const fetchLyrics = async (track) => {
    try {
      // Check cache first
      const cachedLyrics = sessionStorage.getItem(`lyrics-${track.id}`);
      if (cachedLyrics) {
        return cachedLyrics;
      }

      // Add delay to prevent too many requests
      await new Promise(resolve => setTimeout(resolve, 1000));

      const lyricsUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&ctx=web6dot0&api_version=4&_format=json&_marker=0%3F_marker%3D0&lyrics_id=${track.id}`;
      const response = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(lyricsUrl)}`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );

      if (response.status === 429) {
        console.warn('Too many requests for lyrics, will retry later');
        return null;
      }

      const data = await response.text();
      const lyricsData = JSON.parse(data);
      
      if (lyricsData && lyricsData.lyrics) {
        // Cache the lyrics
        sessionStorage.setItem(`lyrics-${track.id}`, lyricsData.lyrics);
        return lyricsData.lyrics;
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
    }
    return null;
  };

  const fetchSimilarSongs = async (song, existingIds = []) => {
    try {
      const artistName =
        song.primaryArtists?.split(",")[0] || song.artists?.primary?.[0]?.name;

      if (artistName) {
        // Add delay to prevent too many requests
        await new Promise(resolve => setTimeout(resolve, 1000));

        const searchResponse = await axios.get(
          `https://saavn.dev/api/search/songs?query=${encodeURIComponent(
            artistName
          )}&limit=30`
        );

        const results = searchResponse.data?.data?.results || [];
        // Filter out duplicates and current song
        return results.filter(
          (track) =>
            !existingIds.includes(track.id) &&
            track.id !== song.id &&
            track.downloadUrl?.[0]?.url
        ).slice(0, 10); // Limit to 10 songs at a time
      }
      return [];
    } catch (error) {
      console.error("Error fetching similar songs:", error);
      return [];
    }
  };

  const maintainQueueLength = async () => {
    if (isLoadingMore || queue.length >= MINIMUM_QUEUE_LENGTH) return;

    setIsLoadingMore(true);
    try {
      const lastSong = queue[queue.length - 1] || currentTrack;
      if (!lastSong) return;

      const existingIds = new Set([
        currentTrack?.id,
        ...queue.map((song) => song.id),
        ...playHistory.map((song) => song.id),
      ]);

      let moreSongs = [];
      let attempts = 0;
      const maxAttempts = 2; // Reduce max attempts

      while (
        moreSongs.length < MINIMUM_QUEUE_LENGTH - queue.length &&
        attempts < maxAttempts
      ) {
        // Add delay between attempts
        if (attempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const newSongs = await fetchSimilarSongs(lastSong);
        moreSongs = [
          ...moreSongs,
          ...newSongs.filter((song) => !existingIds.has(song.id)),
        ];
        attempts++;
      }

      if (moreSongs.length > 0) {
        setQueue((prev) => [...prev, ...moreSongs.slice(0, MINIMUM_QUEUE_LENGTH - prev.length)]);
      }
    } catch (error) {
      console.error("Error maintaining queue:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Check queue length whenever it changes
  useEffect(() => {
    if (queue.length < FETCH_THRESHOLD) {
      maintainQueueLength();
    }
  }, [queue.length]);

  const handleSongSelect = useCallback(async (song, queueSongs = []) => {
    // If song is already playing, do nothing
    if (currentTrack?.id === song.id) return;

    // Update current track
    setCurrentTrack(song);

    // Handle queue management
    if (queueSongs.length > 0) {
      // If queueSongs is provided, use it as the new queue
      const newQueue = queueSongs.filter(s => s.id !== song.id);
      setQueue(newQueue);
    } else {
      // If song is not in a playlist, don't create a new queue
      setQueue([]);
    }

    // Add current song to play history
    setPlayHistory(prev => {
      const newHistory = [song, ...prev.filter(s => s.id !== song.id)].slice(0, 50);
      return newHistory;
    });

    // Fetch lyrics if available
    try {
      const lyrics = await fetchLyrics(song);
      if (lyrics) {
        setCurrentTrack(prev => ({ ...prev, lyrics }));
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
    }
  }, [currentTrack, fetchLyrics]);

  const handleQueueItemClick = useCallback((song, index) => {
    if (!song) return;
    
    // Remove clicked song and all songs before it from queue
    const newQueue = queue.slice(index + 1);
    setQueue(newQueue);
    
    // Set the clicked song as current track
    setCurrentTrack(song);
    
    // Add to play history
    setPlayHistory(prev => {
      const newHistory = [song, ...prev.filter(s => s.id !== song.id)].slice(0, 50);
      return newHistory;
    });
  }, [queue]);

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    
    const nextSong = queue[0];
    const newQueue = queue.slice(1);
    
    setCurrentTrack(nextSong);
    setQueue(newQueue);
    
    // Add to play history
    setPlayHistory(prev => {
      const newHistory = [nextSong, ...prev.filter(s => s.id !== nextSong.id)].slice(0, 50);
      return newHistory;
    });
  }, [queue]);

  const handlePrevious = useCallback(() => {
    if (playHistory.length === 0) return;
    
    const previousSong = playHistory[0];
    const newHistory = playHistory.slice(1);
    
    if (currentTrack) {
      setQueue(prev => [currentTrack, ...prev]);
    }
    
    setCurrentTrack(previousSong);
    setPlayHistory(newHistory);
  }, [currentTrack, playHistory]);

  const handleReorderQueue = (newQueue) => {
    setQueue(newQueue);
  };

  const handleLogin = (name) => {
    setUsername(name);
  };

  if (!username) {
    return (
      <Box sx={{ height: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        <main style={{ height: '100vh', overflow: 'auto', position: 'relative' }}>
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <main style={{ 
        height: isForYouPage ? '100vh' : 'calc(100vh - 90px)', 
        overflow: 'auto',
        position: 'relative'
      }}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <Sidebar appName="MuiX" username={username} />
            <Box
              component="main"
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                bgcolor: "#121212",
              }}
            >
              <Routes key={navigationKey}>
                <Route path="/" element={<Home onSongSelect={handleSongSelect} username={username} />} />
                <Route path="/for-you" element={<ForYou />} />
                <Route path="/library" element={<Library />} />
                <Route path="/create-playlist" element={<CreatePlaylist />} />
                <Route path="/search" element={<Search onSongSelect={handleSongSelect} />} />
                <Route path="/playlist/:url" element={<Playlist onSongSelect={handleSongSelect} />} />
                <Route path="/liked-songs" element={<LikedSongs onSongSelect={handleSongSelect} />} />
                <Route path="/artist/:id" element={<Artist onSongSelect={handleSongSelect} />} />
                <Route path="/album/:id" element={<Album onSongSelect={handleSongSelect} />} />
                <Route path="/top-artists" element={<TopArtists />} />
                <Route path="/following" element={<Following />} />
                <Route path="/top-playlists" element={<TopPlaylists />} />
                <Route path="/playlist/top/:id" element={<TopPlaylistDetails onSongSelect={handleSongSelect} />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Box>
          </Box>
          {!isForYouPage && (
            <Box
              sx={{
                position: "sticky",
                bottom: 0,
                bgcolor: "#282828",
                borderTop: "1px solid #404040",
                zIndex: 10,
              }}
            >
              <Player
                currentTrack={currentTrack}
                onNext={handleNext}
                onPrevious={handlePrevious}
                hasNext={queue.length > 0}
                hasPrevious={playHistory.length > 0}
                queue={queue}
                onQueueItemClick={handleQueueItemClick}
                onReorderQueue={handleReorderQueue}
              />
            </Box>
          )}
          <BottomNav />
        </Box>
      </main>
      {!isForYouPage && <Player />}
    </Box>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <UserPreferencesProvider>
          <ArtistProvider>
            <LibraryProvider>
              <SettingsProvider>
                <AudioProvider>
                  <TopPlaylistsProvider>
                    <AppContent />
                  </TopPlaylistsProvider>
                </AudioProvider>
              </SettingsProvider>
            </LibraryProvider>
          </ArtistProvider>
        </UserPreferencesProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
