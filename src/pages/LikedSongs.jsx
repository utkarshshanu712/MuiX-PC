import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Grid } from '@mui/material';
import { PlayArrow, Favorite, AccessTime, Shuffle } from '@mui/icons-material';
import { useLibrary } from '../contexts/LibraryContext';

const LikedSongs = ({ onSongSelect }) => {
  const { likedSongs } = useLibrary();
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    // Calculate total duration of liked songs
    const total = likedSongs.reduce((acc, song) => acc + (song.duration || 0), 0);
    setTotalDuration(total);
  }, [likedSongs]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayAll = (shuffle = false) => {
    if (likedSongs.length === 0) return;
    
    let songs = [...likedSongs];
    if (shuffle) {
      // Fisher-Yates shuffle
      for (let i = songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songs[i], songs[j]] = [songs[j], songs[i]];
      }
    }
    
    // Play first song and set rest as queue
    const [firstSong, ...queueSongs] = songs;
    onSongSelect(firstSong, queueSongs);
  };

  const handleSongClick = (song, index) => {
    // Create queue from liked songs starting from clicked song
    const queueSongs = [
      ...likedSongs.slice(index + 1),
      ...likedSongs.slice(0, index)
    ];
    onSongSelect(song, queueSongs);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, mb: { xs: 1, sm: 4 } }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex',
        gap: 3,
        mb: 4,
        bgcolor: 'rgba(29, 185, 84, 0.3)',
        borderRadius: 2,
        p: { xs: 1, sm: 3 }
      }}>
        <Box sx={{
          width: { xs: 80, sm: 160 },
          height: { xs: 80, sm: 150 },
          bgcolor: '#282828',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2
        }}>
          <Favorite sx={{ fontSize: { xs: 40, sm: 140 }, color: '#1db954' }} />
        </Box>

        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'flex-end', sm: 'space-between' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1,
          mb: 3
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="overline" color="text.secondary">Playlist</Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: '0.8rem', sm: '3.5rem' }, fontWeight: 'bold' }}>
              Liked Songs
            </Typography>
          </Box>
          <Box>
            <Typography color="text.secondary" variant="body2">
              {likedSongs.length} songs • {Math.floor(totalDuration / 60)} minutes
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Play Button and Songs List */}
      <Box sx={{ mb: 4 }}>
        {likedSongs.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mb: 0 }}>
            <IconButton
              onClick={() => handlePlayAll(false)}
              sx={{
                mb: 3,
                p: { xs: 1, sm: 1.5 },
                bgcolor: '#1db954',
                '&:hover': { bgcolor: '#1ed760', transform: 'scale(1.04)' },
                transition: 'all 0.2s ease'
              }}
            >
              <PlayArrow sx={{ fontSize: { xs: 40, sm: 50 }, color: 'white' }} />
            </IconButton>

            <IconButton
              onClick={() => handlePlayAll(true)}
              sx={{
                mb: 3,
                p: { xs: 1, sm: 1.5 },
                bgcolor: '#1db954',
                '&:hover': { bgcolor: '#1ed760', transform: 'scale(1.04)' },
                transition: 'all 0.2s ease'
              }}
            >
              <Shuffle sx={{ fontSize: { xs: 40, sm: 50 }, color: 'white' }} />
            </IconButton>
          </Box>
        )}

        {/* Songs List */}
        <Grid container sx={{ mt: 2, px: 2 }} columns={14}>
          <Grid item xs={1}>
            <Typography color="text.secondary">#</Typography>
          </Grid>
          <Grid item xs={5}>
            <Typography color="text.secondary">Title</Typography>
          </Grid>
          <Grid item xs={4} sx={{ display: { xs: 'block', sm: 'block', md: 'block' }, textAlign: 'left' }}>
            <Typography color="text.secondary">Artist</Typography>
          </Grid>
          <Grid item xs={3} sx={{ display: { xs: 'none', sm: 'block', md: 'block' } }}>
            <Typography color="text.secondary">Added Date</Typography>
          </Grid>
          <Grid item xs={1} sx={{ display: { xs: 'block', sm: 'block', md: 'block' }, px: 4 }}>
            <AccessTime sx={{ color: 'text.secondary', fontSize: 20 }} />
          </Grid>
        </Grid>

        <Box sx={{ mt: 1, overflow: 'auto', height: 'calc(100vh - 250px)' }}>
          {likedSongs.map((song, index) => (
            <Grid
              container
              key={song.id}
              sx={{
                py: 1,
                px: 2,
                alignItems: 'center',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 1
                },
                cursor: 'pointer'
              }}
              columns={14}
              onClick={() => handleSongClick(song, index)}
            >
              <Grid item xs={1}>
                <Typography>{index + 1}</Typography>
              </Grid>
              <Grid item xs={5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img
                    src={song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url}
                    alt={song.name}
                    style={{ width: 40, height: 40, borderRadius: 4 }}
                  />
                  <Typography noWrap sx={{ fontSize: { xs: '0.7rem', sm: '1rem' } }}>{song.name}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4} sx={{ display: { xs: 'block', sm: 'block', md: 'block' }, textAlign: 'left', px: { xs: '1.5rem', sm: '0rem' } }}>
                <Typography noWrap={false} color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                  {song.primaryArtists || song.artists?.primary?.[0]?.name}
                </Typography>
              </Grid>
              <Grid item xs={3} sx={{ display: { xs: 'none', sm: 'block', md: 'block' } }}>
                <Typography color="text.secondary">
                  {new Date(song.likedAt || Date.now()).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={1} sx={{ display: { xs: 'block', sm: 'block', md: 'block' }, px: 4 }}>
                <Typography color="text.secondary">
                  {formatDuration(song.duration)}
                </Typography>
              </Grid>
            </Grid>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LikedSongs;