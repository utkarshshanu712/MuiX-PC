import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { PlayCircleFilled, Shuffle } from '@mui/icons-material';
import SongList from '../components/SongList';

const Album = ({ onSongSelect }) => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`https://saavn.dev/api/albums?id=${id}`);
        const albumData = response.data?.data;
        
        if (albumData) {
          const transformedSongs = albumData.songs.map(song => ({
            ...song,
            image: song.image || albumData.image,
            album: {
              name: albumData.name,
              url: albumData.url
            }
          }));

          setAlbum({
            ...albumData,
            songs: transformedSongs
          });
        }
      } catch (err) {
        console.error('Error fetching album:', err);
        setError('Failed to load album');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAlbum();
    }
  }, [id]);

  const handlePlayAll = () => {
    if (album?.songs?.length > 0) {
      onSongSelect(album.songs[0], album.songs);
    }
  };

  const handleShuffleAll = () => {
    if (album?.songs?.length > 0) {
      const shuffledSongs = [...album.songs]
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
      
      onSongSelect(shuffledSongs[0], shuffledSongs);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!album) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Album not found</Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        height: '100%', 
        overflow: 'auto',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), #121212)',
      }}
    >
      {/* Album Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'flex-start',
          gap: 3,
          p: isMobile ? 2 : 3,
          textAlign: isMobile ? 'center' : 'left',
          pt: isMobile ? 4 : 3,
        }}
      >
        <img
          src={album.image?.[2]?.url || album.image?.[1]?.url}
          alt={album.name}
          style={{
            width: isMobile ? '70%' : '200px',
            maxWidth: '300px',
            height: 'auto',
            aspectRatio: '1',
            borderRadius: '8px',
            boxShadow: '0 4px 60px rgba(0,0,0,.5)'
          }}
        />
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'flex-end',
            width: isMobile ? '100%' : 'auto',
            mt: isMobile ? 2 : 0
          }}
        >
          <Typography variant="overline">Album</Typography>
          <Typography 
            variant={isMobile ? 'h5' : 'h4'} 
            sx={{ 
              mb: 1,
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 'bold'
            }}
          >
            {album.name}
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              mb: 2
            }}
          >
            {album.primaryArtists}
            {album.year && ` • ${album.year}`}
            {album.songCount && ` • ${album.songCount} songs`}
          </Typography>
          
          {/* Play and Shuffle Buttons */}
          <Box 
            sx={{ 
              mt: 1,
              display: 'flex', 
              gap: 2,
              justifyContent: isMobile ? 'center' : 'flex-start',
              flexWrap: 'wrap'
            }}
          >
            <Button
              variant="contained"
              startIcon={<PlayCircleFilled />}
              onClick={handlePlayAll}
              sx={{
                bgcolor: '#1DB954',
                '&:hover': { bgcolor: '#1ed760' },
                borderRadius: '20px',
                px: 3,
                py: 1,
                minWidth: isMobile ? '120px' : '140px'
              }}
            >
              Play
            </Button>
            <Button
              variant="outlined"
              startIcon={<Shuffle />}
              onClick={handleShuffleAll}
              sx={{
                color: '#fff',
                borderColor: '#fff',
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                },
                borderRadius: '20px',
                px: 3,
                py: 1,
                minWidth: isMobile ? '120px' : '140px'
              }}
            >
              Shuffle
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Songs List */}
      <Box sx={{ p: isMobile ? 2 : 3, pt: 2, pb: 10 }}>
        <SongList songs={album.songs} onSongSelect={onSongSelect} />
      </Box>
    </Box>
  );
};

export default Album;
