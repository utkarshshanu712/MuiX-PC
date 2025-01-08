import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, CircularProgress, Chip, Stack, Menu, MenuItem } from '@mui/material';
import { 
  Favorite, FavoriteBorder, PlayArrow, Pause, 
  PlaylistAdd, ArrowBack, Timer, MoreVert,
  Language, CheckBox, CheckBoxOutlineBlank, Download 
} from '@mui/icons-material';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';
import { useSettings } from '../contexts/SettingsContext';

const categories = [
  {
    name: 'Daily Mix',
    color: '#1DB954',
    queries: [
      'Featured Playlists', 'Recommended for today', 'trending songs', 'popular songs', 'top charts', 'Mix',
      'new releases', 'hot tracks', 'top hits', 'latest songs', 'music mix', 'best of the week',
      'editors picks', 'recommended for you', 'must-listen', 'top 100 songs',
      'Pyaar', 'Dil', 'Dard', 'Ishq', 'Mohabbat', 'Judaai', 'Bewafa', 'Dhoka',
      'Yaadein', 'Intezaar', 'Tanhai', 'Romantic', 'Love Songs Hindi', 'Hindi Hits',
      'Bollywood Romance', 'Hindi Love Mix', 'Sad Love Songs Hindi',
      'Bollywood', 'Hindi', 'Indian', 'Desi', 'Bollywood Hits', 'Hindi Songs',
      'Indian Music', 'Desi Music', 'Bollywood Music', 'Hindi Music',
      'Arijit Singh', 'Shreya Ghoshal', 'Atif Aslam', 'A. R. Rahman', 'Mohit Chauhan',
      'Sunidhi Chauhan', 'Kumar Sanu', 'Alka Yagnik', 'Udit Narayan', 'Sonu Nigam',
      'Shankar Mahadevan', 'Kailash Kher', 'Javed Ali', 'KK', 'Rahat Fateh Ali Khan',
      'Mika Singh', 'Himesh Reshammiya', 'Yo Yo Honey Singh', 'Badshah', 'Diljit Dosanjh',
      'Guru Randhawa', 'Neha Kakkar', 'Arijit Singh', 'Shreya Ghoshal', 'Atif Aslam',
      'A. R. Rahman', 'Mohit Chauhan', 'Sunidhi Chauhan', 'Kumar Sanu', 'Alka Yagnik',
      'Udit Narayan', 'Sonu Nigam', 'Shankar Mahadevan', 'Kailash Kher', 'Javed Ali',
      'KK', 'Rahat Fateh Ali Khan', 'Mika Singh', 'Himesh Reshammiya', 'Yo Yo Honey Singh',
      'Badshah', 'Diljit Dosanjh', 'Guru Randhawa', 'Neha Kakkar','Pawan Singh latest song', 'Pawan Singh new song 2024', 'Pawan Singh trending',
    'Khesari Lal new song 2024', 'Khesari Lal Yadav latest', 'Khesari Lal hit song',
    'Kallu new song 2024', 'Kallu latest songs', 'Kallu hit songs',
    'Ritesh Pandey new 2024', 'Ritesh Pandey latest', 'Ritesh Pandey hits',
    'Arvind Akela Kallu 2024', 'Arvind Akela new song', 'Arvind Akela hits',
    'new bhojpuri songs 2024', 'latest bhojpuri songs', 'top bhojpuri songs',
    'bhojpuri hit songs 2024', 'bhojpuri viral songs', 'bhojpuri trending songs',
    'bhojpuri dj songs 2024', 'bhojpuri remix songs', 'bhojpuri party songs',
    'bhojpuri romantic songs', 'bhojpuri love songs', 'bhojpuri sad songs',
    'bhojpuri album songs', 'bhojpuri film songs', 'bhojpuri movie songs',
    'bhojpuri stage show', 'bhojpuri live show', 'bhojpuri dance songs',
    'Pramod Premi new song', 'Ankush Raja latest', 'Shilpi Raj new song',
    'Gunjan Singh latest', 'Samar Singh new song', 'Neelkamal Singh latest','punjabi songs', 'latest punjabi songs', 'punjabi hits', 'new punjabi songs',
    'popular punjabi songs', 'trending punjabi songs', 'punjabi party songs',
    'punjabi folk songs', 'punjabi pop songs', 'punjabi viral songs',
    'punjabi bhangra', 'punjabi trending', 'punjabi popular', 'punjabi new releases',    'hindi songs', 'bollywood songs', 'latest hindi songs', 'hindi hits',
    'bollywood hits', 'hindi top songs', 'new hindi songs', 'popular hindi songs',
    'trending hindi songs', 'hindi romantic songs', 'hindi party songs',
    'hindi classics', 'old hindi songs', 'hindi film songs', 'hindi movie songs',
    'hindi pop songs', 'hindi indie songs', 'hindi viral songs',
    'hindi trending', 'hindi popular', 'hindi new releases',    'rajasthani songs', 'latest rajasthani songs', 'rajasthani hits',
    'new rajasthani songs', 'popular rajasthani songs', 'trending rajasthani songs',
    'rajasthani folk songs', 'rajasthani pop songs', 'rajasthani viral songs',
    'rajasthani trending', 'rajasthani popular', 'rajasthani new releases'
    ]
  },
  {
    name: 'Chill',
    color: '#4A90E2',
    queries: [
      'chill songs hindi', 'relaxing songs', 'soft music', 'ambient tracks',
      'chillout music', 'smooth tunes', 'easy listening', 'mellow songs',
      'calm vibes', 'acoustic chill', 'evening chill', 'downtempo', 'unwind music',
      'peaceful tracks', 'lo-fi beats', 'serene vibes', 'afternoon relax',
      'Sukoon', 'Shanti', 'Rahat', 'Peaceful Hindi Songs', 'Relaxing Bollywood','Sukoon', 'Shanti', 'Rahat', 'Peaceful Hindi Songs', 'Relaxing Bollywood', 'Chill Punjabi',
      'Thandi Thandi Hawa', 'Thandak', 'Thanda Mizaaj', 'Shanti Ke Geet', 'Bhojpuri Chill',
      'Haryanvi Relax', 'Bhojpuri Relaxing Songs', 'Haryanvi Chillout', 'tadap', 'intezaar', 'bepanah',
    ]
  },
  {
    name: 'Sleep',
    color: '#9B59B6',
    queries: [
      'sleep songs hindi','Ishq', 'Mohabbat', 'Judaai', 'Bewafa', 'Dhoka', 'Yaadein', 'Intezaar', 'Tanhai', 'Romantic',
      'Love Songs Hindi', 'Hindi Hits', 'Bollywood Romance', 'Hindi Love Mix', 'Sad Love Songs Hindi',
      'Bhojpuri Sleep Songs', 'Haryanvi Bedtime Music',
      'peace', 'Pyaar', 'Neend', 'Raat', 'Night Songs Hindi', 'Pyaar', 'Dil', 'Dard',
      'Ishq', 'Mohabbat', 'Judaai', 'Bewafa', 'Dhoka', 'Yaadein', 'Intezaar',
      'Tanhai', 'Romantic', 'Love Songs Hindi', 'Hindi Hits', 'Bollywood Romance',
      'Hindi Love Mix', 'Sad Love Songs Hindi', 'Bollywood', 'Hindi', 'Indian', 'Desi'
    ]
  },
  {
    name: 'Sad Songs',
    color: '#E74C3C',
    queries: [
      '1990s sad songs', '2000s sad songs', 'Arijit Singh', 'Arijit', 'sad songs hindi',
      'heartbreak songs', 'emotional songs', 'melancholic music', 'tearjerkers'
     ,  'thanda mizaaj', 'shanti ke geet',  'haryanvi relax', 'bhojpuri relaxing songs',
     , 'punjabi thandi thandi hawa', 'haryanvi sukoon', 'bhojpuri sukoon',
     'punjabi shanti', 'haryanvi raahat', 'pyaar', 'dil', 'dard', 'ishq', 'mohabbat', 'judaai', 'bewafa', 'dhoka',
     'yaadein', 'intezaar', 'tanhai', 'romantic', 'love songs', 'hindi hits', 'bollywood romance',
     'hindi love mix', 'sad love songs', 'bhojpuri peace', 'haryanvi pyaar', 
       'aching heart tunes', 'heartache songs', 'Pyaar', 'Dil', 'Dardu', 'Dard',
      'Bewafai', 'Dhoka', 'Judaai', 'Tanhai', 'Romantic', 'Love Songs Hindi',
      'Hindi Hits', 'Bollywood Romance', 'Hindi Love Mix', 'Sad Love Songs Hindi',
      'Bollywood', 'Hindi', 'Indian', 'Desi', 'Pyaar', 'Dil', 'Dard', 'Ishq',
      'Mohabbat', 'Judaai', 'Bewafa', 'Dhoka', 'Yaadein', 'Intezaar', 'Tanhai',
      'Bichadna', 'Alvida', 'Tanha', 'Tadap', 'Intezaar', 'Bepanah', 'Dard Bhare Geet',
      'Rona', 'Aansu', 'Bichhadna', 'Alvida', 'Tanhai', 'Tadap', 'Intezaar', 'Bepanah',
      , 'Haryanvi Emotional Songs',  'Haryanvi Judaai',
    ]
  },
  {
    name: 'Party',
    color: '#F1C40F',
    queries: [
      'Diljit Dosanjh', 'Honey', 'Badshah', 'Honey Singh', 'Rap', 'party songs hindi',
      'dance hits', 'upbeat music', 'party anthems', 'celebration tracks',
      'party favorites', 'club hits', 'dance floor fillers', 'upbeat party songs',
      'party bangers', 'nonstop party mix', 'festive tracks', 'party starters',
      'nightlife anthems', 'party mix', 'high energy party songs', 'party classics',
      'Daru', 'Sharabi', 'Punjabi Party', 'Dance Hits Hindi', 'Club Mix Hindi',
      'Pyaar', 'Dil', 'Dard', 'Ishq', 'Mohabbat', 'Judaai', 'Bewafa', 'Dhoka',
      'Yaadein', 'Intezaar', 'Tanhai', 'Romantic', 'Love Songs Hindi', 'Hindi Hits'
    ]
  },
  {
    name: 'Workout',
    color: '#E67E22',
    queries: [
      'Jose', 'High', 'workout songs hindi', 'energetic songs', 'gym music',
      'fitness tracks', 'workout anthems', 
      'cardio music', 'workout playlist', 'Josh', 'Power', 'Energy Hindi Songs',
      'Pyaar', 'Josh', 'Power', 'Energy', 'Tension', 'Tension Songs Hindi','Energy Hindi Songs', 'Punjabi Workout', 
      'Haryanvi Fitness', 'Punjabi High Energy',  'Haryanvi Cardio'
    ]
  }
];

const languageQueries = {
  hindi: [
    'hindi songs', 'bollywood songs', 'latest hindi songs', 'hindi hits',
    'bollywood hits', 'hindi top songs', 'new hindi songs', 'popular hindi songs',
    'trending hindi songs', 'hindi romantic songs', 'hindi party songs',
    'hindi classics', 'old hindi songs', 'hindi film songs', 'hindi movie songs',
    'hindi pop songs', 'hindi indie songs', 'hindi viral songs',
    'hindi trending', 'hindi popular', 'hindi new releases'
  ],
  punjabi: [
    'punjabi songs', 'latest punjabi songs', 'punjabi hits', 'new punjabi songs',
    'popular punjabi songs', 'trending punjabi songs', 'punjabi party songs',
    'punjabi folk songs', 'punjabi pop songs', 'punjabi viral songs',
    'punjabi bhangra', 'punjabi trending', 'punjabi popular', 'punjabi new releases'
  ],
  bhojpuri: [
    'Pawan Singh latest song', 'Pawan Singh new song 2024', 'Pawan Singh trending',
    'Khesari Lal new song 2024', 'Khesari Lal Yadav latest', 'Khesari Lal hit song',
    'Kallu new song 2024', 'Kallu latest songs', 'Kallu hit songs',
    'Ritesh Pandey new 2024', 'Ritesh Pandey latest', 'Ritesh Pandey hits',
    'Arvind Akela Kallu 2024', 'Arvind Akela new song', 'Arvind Akela hits',
    'new bhojpuri songs 2024', 'latest bhojpuri songs', 'top bhojpuri songs',
    'bhojpuri hit songs 2024', 'bhojpuri viral songs', 'bhojpuri trending songs',
    'bhojpuri dj songs 2024', 'bhojpuri remix songs', 'bhojpuri party songs',
    'bhojpuri romantic songs', 'bhojpuri love songs', 'bhojpuri sad songs',
    'bhojpuri album songs', 'bhojpuri film songs', 'bhojpuri movie songs',
    'bhojpuri stage show', 'bhojpuri live show', 'bhojpuri dance songs',
    'Pramod Premi new song', 'Ankush Raja latest', 'Shilpi Raj new song',
    'Gunjan Singh latest', 'Samar Singh new song', 'Neelkamal Singh latest'
  ],
  haryanvi: [
    'haryanvi songs', 'latest haryanvi songs', 'haryanvi hits', 'new haryanvi songs',
    'popular haryanvi songs', 'trending haryanvi songs', 'haryanvi folk songs',
    'haryanvi pop songs', 'haryanvi viral songs', 'haryanvi trending',
    'haryanvi popular', 'haryanvi new releases'
  ],
  rajasthani: [
    'rajasthani songs', 'latest rajasthani songs', 'rajasthani hits',
    'new rajasthani songs', 'popular rajasthani songs', 'trending rajasthani songs',
    'rajasthani folk songs', 'rajasthani pop songs', 'rajasthani viral songs',
    'rajasthani trending', 'rajasthani popular', 'rajasthani new releases'
  ]
};

const getLanguageSpecificQuery = (language) => {
  const queries = languageQueries[language.toLowerCase()] || [];
  return queries[Math.floor(Math.random() * queries.length)] || language;
};

const MusicCard = ({ song, isPlaying, onPlay, onNext, isLiked, onLike, isVisible, currentTime = 0, duration = 0, onSeek }) => {
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [playlistAnchorEl, setPlaylistAnchorEl] = useState(null);
  const lyricsRef = useRef();
  const navigate = useNavigate();
  const { playlists, addToPlaylist } = useLibrary();
  const imageUrl = song?.image?.[2]?.url || song?.image?.[1]?.url || song?.image?.[0]?.url;

  // Fetch lyrics
  useEffect(() => {
    const fetchLyrics = async () => {
      if (!song?.id) return;
      
      setLoading(false);
      setError(null);

      try {
        const lyricsUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&ctx=web6dot0&api_version=4&_format=json&_marker=0%3F_marker%3D0&lyrics_id=${song.id}`;
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(lyricsUrl)}`);
        const rawData = await response.text();
        
        try {
          const lyricsData = JSON.parse(rawData);
          
          if (lyricsData && lyricsData.lyrics) {
            setLyrics(lyricsData.lyrics);
          } else {
            setError('.');
          }
        } catch (e) {
          setError('Failed to parse lyrics');
        }
      } catch (error) {
        setError('..');
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [song?.id]);

  // Format and highlight lyrics
  const formatLyrics = (lyrics) => {
    if (!lyrics) return [];
    return lyrics
      .replace(/<br\s*\/?>/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  };

  // Update lyric highlighting
  useEffect(() => {
    if (lyrics) {
      const lines = formatLyrics(lyrics);
      const timePerLine = duration / lines.length;
      const currentLine = Math.floor(currentTime / timePerLine);
      setActiveLyricIndex(currentLine);
    }
  }, [currentTime, duration, lyrics]);

  // Update lyrics window to show only 5 lines
  const getLyricsWindow = () => {
    if (!lyrics) return [];
    const allLines = formatLyrics(lyrics);
    const windowSize = 5;
    const currentLine = Math.floor((currentTime / duration) * allLines.length);
    const startIndex = Math.max(0, currentLine - Math.floor(windowSize / 2));
    const endIndex = Math.min(startIndex + windowSize, allLines.length);
    
    return allLines.slice(startIndex, endIndex);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 100 }}
      exit={{ opacity: 0, y: -100 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: isVisible ? 'block' : 'none'
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Box
          component="img"
          src={imageUrl}
          alt={song?.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.7)'
          }}
        />
        
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))',
          display: 'flex',
          flexDirection: 'column',
          p: 2
        }}>
          {/* Top Section with Back Button and Timer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {sleepTimer !== null && (
                <Typography variant="body2" sx={{ color: 'white', mr: 1 }}>
                  {Math.floor(sleepTimer / 60)}:{(sleepTimer % 60).toString().padStart(2, '0')}
                </Typography>
              )}
              <IconButton onClick={(e) => {
                e.stopPropagation();
                setAnchorEl(e.currentTarget);
              }} sx={{ color: sleepTimer !== null ? '#1db954' : 'white' }}>
                <Timer />
              </IconButton>
            </Box>
          </Box>

          {/* Song Info */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
              {song?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {song?.primaryArtists}
            </Typography>
          </Box>

          {/* Lyrics Section */}
          <Box
            ref={lyricsRef}
            sx={{
              flex: 0.3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              mt: 2,
              maxHeight: '30vh',
              overflow: 'hidden'
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : error ? (
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                {error}
              </Typography>
            ) : (
              getLyricsWindow().map((line, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    textAlign: 'center',
                    mb: 1,
                    transition: 'all 0.3s ease',
                    color: index === Math.floor(getLyricsWindow().length / 2) ? 'white' : 'rgba(255,255,255,0.7)',
                    fontSize: index === Math.floor(getLyricsWindow().length / 2) ? '1.1rem' : '0.9rem',
                    fontWeight: index === Math.floor(getLyricsWindow().length / 2) ? 'bold' : 'normal'
                  }}
                >
                  {line}
                </Typography>
              ))
            )}
          </Box>

          {/* Controls Section */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            padding: 2
          }}>
            {/* Progress Bar */}
            <Box sx={{ width: '100%', mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {`${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {`${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 7,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    '& .slider-thumb': {
                      opacity: 1,
                      transform: 'scale(1)'
                    }
                  }
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  onSeek(percentage * duration);
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    bgcolor: 'white',
                    width: `${(currentTime / (duration || 1)) * 100}%`,
                    borderRadius: 2,
                    position: 'relative',
                    transition: 'width 0.1s linear'
                  }}
                >
                  <Box
                    className="slider-thumb"
                    sx={{
                      position: 'absolute',
                      right: -6,
                      top: '50%',
                      transform: 'translateY(-50%) scale(0)',
                      width: 12,
                      height: 12,
                      bgcolor: 'white',
                      borderRadius: '50%',
                      opacity: 0,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Playback Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <IconButton onClick={() => onLike()} sx={{ color: 'white' }}>
                {isLiked ? <Favorite color="primary" /> : <FavoriteBorder />}
              </IconButton>
              <IconButton
                onClick={() => onPlay()}
                sx={{
                  bgcolor: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                  p: 2
                }}
              >
                {isPlaying ? <Pause sx={{ color: '#121212' }} /> : <PlayArrow sx={{ color: '#121212' }} />}
              </IconButton>
              <IconButton onClick={(e) => {
                e.stopPropagation();
                setPlaylistAnchorEl(e.currentTarget);
              }} sx={{ color: 'white' }}>
                <MoreVert />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Sleep Timer Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              bgcolor: '#282828',
              color: 'white',
              minWidth: 200
            }
          }}
        >
          <MenuItem onClick={() => setSleepTimer(null)}>Turn Off</MenuItem>
          <MenuItem onClick={() => setSleepTimer(300)}>5 minutes</MenuItem>
          <MenuItem onClick={() => setSleepTimer(900)}>15 minutes</MenuItem>
          <MenuItem onClick={() => setSleepTimer(1800)}>30 minutes</MenuItem>
          <MenuItem onClick={() => setSleepTimer(3600)}>1 hour</MenuItem>
        </Menu>

        {/* Playlist Menu */}
        <Menu
          anchorEl={playlistAnchorEl}
          open={Boolean(playlistAnchorEl)}
          onClose={() => setPlaylistAnchorEl(null)}
          PaperProps={{
            sx: {
              bgcolor: '#282828',
              color: 'white',
              minWidth: 200
            }
          }}
        >
          <MenuItem onClick={() => {
            addToPlaylist('favorites', song);
            setPlaylistAnchorEl(null);
          }}>
            Add to Favorites
          </MenuItem>
          <MenuItem onClick={async () => {
            try {
              const response = await fetch(song.downloadUrl['320kbps'] || song.downloadUrl['160kbps'] || song.downloadUrl['96kbps'] || song.downloadUrl);
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${song.name} - ${song.primaryArtists}.mp3`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (error) {
              console.error('Error downloading song:', error);
            }
            setPlaylistAnchorEl(null);
          }}>
            <Download sx={{ mr: 1 }} /> Download
          </MenuItem>
          {playlists.map((playlist) => (
            <MenuItem key={playlist.id} onClick={() => {
              addToPlaylist(playlist.id, song);
              setPlaylistAnchorEl(null);
            }}>
              Add to {playlist.name}
            </MenuItem>
          ))}
          <MenuItem onClick={() => {
            setPlaylistAnchorEl(null);
            navigate('/create-playlist');
          }}>
            Create New Playlist
          </MenuItem>
        </Menu>
      </Box>
    </motion.div>
  );
};

const ForYou = () => {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Daily Mix');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [playedSongs, setPlayedSongs] = useState(new Set());
  const [currentQuery, setCurrentQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState(['Hindi']);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const audioRef = useRef(new Audio());
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();
  const { streamingQuality, getUrlForQuality } = useSettings();

  const languages = ['Hindi', 'Punjabi', 'Bhojpuri', 'Haryanvi', 'Rajasthani'];

  const handleLanguageToggle = (language) => {
    setSelectedLanguages(prev => {
      const newLanguages = prev.includes(language) 
        ? prev.filter(lang => lang !== language)
        : [...prev, language];
      
      // Ensure at least one language is selected
      if (newLanguages.length === 0) {
        return ['Hindi'];
      }
      return newLanguages;
    });
  };

  useEffect(() => {
    // Reset songs and fetch new ones when languages change
    setSongs([]);
    setCurrentIndex(0);
    fetchSongs(true);
  }, [selectedLanguages]);

  const handleLanguageMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setShowLanguageMenu(true);
  };

  const handleLanguageMenuClose = () => {
    setAnchorEl(null);
    setShowLanguageMenu(false);
  };

  const getRandomQuery = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return '';

    const queries = category.queries;
    let availableQueries = queries.filter(q => !queryHistory.includes(q));
    
    // If all queries have been used, reset the history but keep the last query
    if (availableQueries.length === 0) {
      const lastUsedQuery = queryHistory[queryHistory.length - 1];
      setQueryHistory([lastUsedQuery]);
      availableQueries = queries.filter(q => q !== lastUsedQuery);
    }

    const newQuery = availableQueries[Math.floor(Math.random() * availableQueries.length)];
    setQueryHistory(prev => [...prev, newQuery]);
    setLastQuery(currentQuery);
    setCurrentQuery(newQuery);
    return newQuery;
  };

  const fetchSongs = async (resetSongs = false) => {
    if (isFetching) return;
    
    setIsFetching(true);
    if (resetSongs) {
      setLoading(true);
      setError(null);
      setPage(1);
      setPlayedSongs(new Set());
    }

    try {
      let baseQuery = getRandomQuery(selectedCategory);
      
      // Generate language-specific queries
      if (selectedLanguages.length > 0) {
        const languageQueries = selectedLanguages.map(lang => {
          const specificQuery = getLanguageSpecificQuery(lang);
          switch(lang.toLowerCase()) {
            case 'hindi':
              return `(${specificQuery} OR "hindi songs" OR "bollywood songs")`;
            case 'punjabi':
              return `(${specificQuery} OR "punjabi songs" OR "bhangra songs")`;
            case 'bhojpuri':
              const bhojpuriQueries = [
                `("${specificQuery}")`,
                `("Pawan Singh" OR "Khesari Lal" OR "Kallu" OR "Ritesh Pandey")`,
                `("bhojpuri new song 2024" OR "bhojpuri latest")`,
                `("bhojpuri trending" OR "bhojpuri viral")`,
                `("bhojpuri hit song" OR "bhojpuri popular")`
              ];
              return bhojpuriQueries[Math.floor(Math.random() * bhojpuriQueries.length)];
            case 'haryanvi':
              return `(${specificQuery} OR "haryanvi songs" OR "haryanvi music")`;
            case 'rajasthani':
              return `(${specificQuery} OR "rajasthani songs" OR "marwari songs")`;
            default:
              return `"${specificQuery}"`;
          }
        });

        const combinedQuery = languageQueries.join(' OR ');
        baseQuery = `${baseQuery} (${combinedQuery})`;
      }

      const response = await axios.get(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(baseQuery)}&page=${resetSongs ? 1 : page}&limit=25`
      );

      console.log('Response data:', response.data);
      const filteredSongs = response.data.data.results.filter(song => {
        if (!song || !song.id || playedSongs.has(song.id)) return false;
        // Enhanced language matching with strict filtering
        const songLanguage = (song.language || '').toLowerCase();
        const songName = (song.name || '').toLowerCase();
        const artistName = (song.primaryArtists || '').toLowerCase();
        const albumName = (song.album?.name || '').toLowerCase();

        const matchesLanguage = selectedLanguages.some(lang => {
          const langLower = lang.toLowerCase();
          switch(langLower) {
            case 'bhojpuri':
              const isBhojpuriSong = 
                songLanguage === 'bhojpuri' || 
                songName.includes('bhojpuri') || 
                artistName.includes('bhojpuri');
              
              const popularArtists = [
                'pawan singh', 'khesari lal', 'kallu', 'ritesh pandey',
                'arvind akela', 'pramod premi', 'ankush raja', 'shilpi raj',
                'gunjan singh', 'samar singh', 'neelkamal singh'
              ];
              
              const isPopularArtist = popularArtists.some(artist => 
                artistName.includes(artist) || songName.includes(artist)
              );
              
              return isBhojpuriSong || isPopularArtist;
            default:
              return songLanguage.includes(langLower);
          }
        });

        return matchesLanguage;
      });

      if (!filteredSongs || filteredSongs.length === 0) {
        console.error('No songs found for the selected languages.');
        setError('No songs available');
        return;
      }

      setSongs(filteredSongs);
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError('Failed to fetch songs');
    } finally {
      setIsFetching(false);
      setLoading(false); // Ensure loading is set to false here
    }
  };

  // Track played songs
  useEffect(() => {
    if (currentTrack) {
      setPlayedSongs(prev => new Set([...prev, currentTrack.id]));
    }
  }, [currentTrack]);

  // Reset played songs when category changes
  useEffect(() => {
    setPlayedSongs(new Set());
  }, [selectedCategory]);

  const handleAddToPlaylist = (song, playlistType) => {
    // Implement playlist addition logic here
    console.log(`Adding ${song.name} to ${playlistType} playlist`);
  };

  // Initial fetch
  useEffect(() => {
    fetchSongs(true);
  }, [selectedCategory]);

  // Handle category change
  const handleCategoryChange = (newCategory) => {
    setSelectedCategory(newCategory);
    setCurrentIndex(0);
    audioRef.current.pause();
    setIsPlaying(false);
  };

  // Check if we need to fetch more songs
  useEffect(() => {
    if (currentIndex >= songs.length - 3 && !isFetching && songs.length > 0) {
      fetchSongs();
    }
  }, [currentIndex, songs.length]);

  const handleNext = async () => {
    if (currentIndex < songs.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      try {
        await handlePlay(songs[nextIndex]);
      } catch (error) {
        console.error('Error playing next song:', error);
      }
    }
  };

  const handlePrevious = async () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      try {
        await handlePlay(songs[prevIndex]);
      } catch (error) {
        console.error('Error playing previous song:', error);
      }
    }
  };

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handlePlay = async (song) => {
    try {
      if (currentTrack?.id === song.id) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
        return;
      }

      // Pause current audio before switching to new song
      audioRef.current.pause();
      setIsPlaying(false);

      const playUrl = Array.isArray(song.downloadUrl) 
        ? getUrlForQuality(song.downloadUrl, streamingQuality)
        : song.downloadUrl[0]?.url || song.downloadUrl;

      if (!playUrl) {
        console.error('No valid URL found for song:', song);
        setError('Could not play this song');
        return;
      }

      audioRef.current.src = playUrl;
      audioRef.current.load();
      setCurrentTrack(song);
      
      // Small delay before playing to ensure proper state transition
      await new Promise(resolve => setTimeout(resolve, 100));
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error in handlePlay:', error);
      if (error.name === 'NotAllowedError') {
        setCurrentTrack(song);
        setIsPlaying(false);
      } else {
        setError('Failed to play song');
      }
    }
  };

  // Initialize audio element with auto-next
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
      setDuration(Math.floor(audio.duration || 0));
    };

    const handleEnded = async () => {
      if (currentIndex < songs.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        
        // Small delay before playing next song
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          const nextSong = songs[nextIndex];
          await handlePlay(nextSong);
        } catch (error) {
          console.error('Auto-play error:', error);
          setError('Failed to play next song');
          setIsPlaying(false);
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleTimeUpdate);
      audio.pause();
    };
  }, [currentIndex, songs, streamingQuality, getUrlForQuality]);

  const handlers = useSwipeable({
    onSwipedUp: () => {
      handleNext();
      // Fetch more songs if we're near the end
      if (currentIndex >= songs.length - 3) {
        fetchSongs();
      }
    },
    onSwipedDown: handlePrevious,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
    delta: 50,
    swipeDuration: 500
  });

  // Shuffle query after each song
  useEffect(() => {
    if (currentTrack) {
      getRandomQuery(selectedCategory);
    }
  }, [currentTrack]);

  const [bhojpuriSongs, setBhojpuriSongs] = useState([]);

  // Special handling for Bhojpuri songs
  useEffect(() => {
    if (selectedLanguages.includes('Bhojpuri')) {
      const filteredBhojpuriSongs = [];
      const otherSongs = [];
      
      songs.forEach(song => {
        const isBhojpuri = 
          song.language?.toLowerCase() === 'bhojpuri' ||
          ['pawan singh', 'khesari lal', 'kallu', 'ritesh pandey',
            'arvind akela', 'pramod premi', 'ankush raja', 'shilpi raj',
            'gunjan singh', 'samar singh', 'neelkamal singh'].some(artist => 
            song.primaryArtists?.toLowerCase().includes(artist) ||
            song.name?.toLowerCase().includes(artist)
          );
        
        if (isBhojpuri) {
          filteredBhojpuriSongs.push(song);
        } else {
          otherSongs.push(song);
        }
      });

      // Ensure first 5 songs are Bhojpuri
      const firstFive = filteredBhojpuriSongs.slice(0, 5);
      const remainingBhojpuri = filteredBhojpuriSongs.slice(5);
      
      // Shuffle the first five songs
      for (let i = firstFive.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [firstFive[i], firstFive[j]] = [firstFive[j], firstFive[i]];
      }

      // Combine all songs
      const shuffledSongs = [...firstFive, ...remainingBhojpuri, ...otherSongs];
      setSongs(shuffledSongs);
    }
  }, [selectedLanguages]);

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden', bgcolor: '#121212', position: 'relative' }}>
      {/* Categories */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          p: 2,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          position: 'relative',
          zIndex: 2,
          alignItems: 'center'
        }}
      >
        {categories.map((category) => (
          <Chip
            key={category.name}
            label={category.name}
            onClick={() => handleCategoryChange(category.name)}
            sx={{
              bgcolor: selectedCategory === category.name ? category.color : 'rgba(255,255,255,0.1)',
              color: 'white',
              '&:hover': {
                bgcolor: selectedCategory === category.name ? category.color : 'rgba(255,255,255,0.2)'
              }
            }}
          />
        ))}
        <IconButton 
          onClick={handleLanguageMenuOpen}
          sx={{ 
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
          }}
        >
          <Language />
        </IconButton>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={showLanguageMenu}
        onClose={handleLanguageMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#282828',
            maxHeight: 300,
            width: 200
          }
        }}
      >
        {languages.map((language) => (
          <MenuItem 
            key={language}
            onClick={() => handleLanguageToggle(language)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'white'
            }}
          >
            {selectedLanguages.includes(language) ? <CheckBox /> : <CheckBoxOutlineBlank />}
            <Typography>{language}</Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Music Cards */}
      <Box {...handlers} sx={{ height: 'calc(100% - 64px)', position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          {songs.map((song, index) => (
            <MusicCard
              key={song.id}
              song={song}
              isPlaying={isPlaying && currentTrack?.id === song.id}
              onPlay={() => handlePlay(song)}
              onNext={handleNext}
              isLiked={isInLibrary(song)}
              onLike={() => isInLibrary(song) ? removeFromLibrary(song) : addToLibrary(song)}
              isVisible={currentIndex === index}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
          ))}
        </AnimatePresence>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Typography color="error" sx={{ textAlign: 'center', mt: 2, position: 'relative', zIndex: 3 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ForYou;
