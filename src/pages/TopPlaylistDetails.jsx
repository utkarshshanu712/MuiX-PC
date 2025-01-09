import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { PlayArrow, Shuffle } from '@mui/icons-material';
import axios from 'axios';
import SongList from '../components/SongList';

const TopPlaylistDetails = ({ onSongSelect }) => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylistDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https://saavn.dev/api/playlists?id=${id}&limit=1000`);
        
        if (!response.data.success) {
          throw new Error('Failed to fetch playlist');
        }

        const playlistData = response.data.data;
        
        // Ensure songs have downloadUrl
        const processedSongs = playlistData.songs?.map(song => ({
          ...song,
          downloadUrl: song.downloadUrl || song.download_url
        })) || [];
        
        setPlaylist(playlistData);
        setAllSongs(processedSongs);

      } catch (error) {
        console.error('Error fetching playlist:', error);
        setError('Failed to load playlist. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlaylistDetails();
    }
  }, [id]);

  const handlePlayAll = (shuffle = false) => {
    if (!allSongs?.length) return;
    
    let songs = [...allSongs];
    if (shuffle) {
      for (let i = songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songs[i], songs[j]] = [songs[j], songs[i]];
      }
    }
    
    const [firstSong, ...queueSongs] = songs;
    onSongSelect(firstSong, queueSongs);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        pb: { xs: 'calc(2rem + 90px)', sm: 'calc(3rem + 90px)' },
        gap: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
          Loading playlist...
        </Typography>
      </Box>
    );
  }

  if (error || !playlist) {
    return (
      <Box sx={{ 
        p: { xs: 2, sm: 4 },
        pb: { xs: 'calc(2rem + 90px)', sm: 'calc(3rem + 90px)' }
      }}>
        <Typography color="error">{error || 'Playlist not found'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw',
      pb: { xs: 'calc(2rem + 90px)', sm: 'calc(3rem + 90px)' },
    }}>
      {/* Header Section */}
      <Box sx={{ 
        position: 'relative',
        p: { xs: 2, sm: 3 },
        background: 'linear-gradient(to bottom, rgba(77, 193, 204, 0.2), #121212)',
      }}>
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 3 },
          alignItems: { xs: 'center', sm: 'flex-start' },
          mb: 3,
        }}>
          {/* Playlist Image */}
          <Box sx={{ 
            width: { xs: '200px', sm: '220px' },
            height: { xs: '200px', sm: '220px' },
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 60px rgba(0, 0, 0, 0.5)',
          }}>
            {playlist.image?.[2]?.url ? (
              <img
                src={playlist.image[2].url}
                alt={playlist.name}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }}>
                <Typography variant="h1" sx={{ color: '#4DC1CC' }}>
                  {playlist.name[0].toUpperCase()}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Playlist Info */}
          <Box sx={{ 
            flex: 1,
            textAlign: { xs: 'center', sm: 'left' },
          }}>
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
              }}
            >
              Playlist
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 1,
                fontSize: { xs: '2rem', sm: '2.25rem' },
                fontWeight: 700,
                color: '#4DC1CC',
              }}
            >
              {playlist.name}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 1,
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
              }}
            >
              {playlist.songCount || allSongs.length} songs
            </Typography>
            {playlist.description && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2,
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.8rem',
                }}
              >
                {playlist.description}
              </Typography>
            )}

            {/* Action Buttons */}
            {allSongs?.length > 0 && (
              <Box sx={{ 
                display: 'flex',
                gap: 2,
                mt: 2,
                justifyContent: { xs: 'center', sm: 'flex-start' },
              }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => handlePlayAll(false)}
                  sx={{
                    bgcolor: '#4DC1CC',
                    '&:hover': { bgcolor: '#5FD3DE' },
                    textTransform: 'none',
                    borderRadius: 4,
                    px: 3,
                  }}
                >
                  Play All
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Shuffle />}
                  onClick={() => handlePlayAll(true)}
                  sx={{
                    bgcolor: '#4DC1CC',
                    '&:hover': { bgcolor: '#5FD3DE' },
                    textTransform: 'none',
                    borderRadius: 4,
                    px: 3,
                  }}
                >
                  Shuffle
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Songs List */}
      <Box sx={{ 
        px: { xs: 1, sm: 2 },
        overflowX: 'hidden',
      }}>
        <SongList 
          songs={allSongs}
          onSongSelect={(song, index) => {
            if (onSongSelect && song?.downloadUrl?.[0]?.url) {
              const queueSongs = [
                ...allSongs.slice(index + 1),
                ...allSongs.slice(0, index)
              ];
              onSongSelect(song, queueSongs);
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default TopPlaylistDetails;