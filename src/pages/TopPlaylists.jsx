import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, CardMedia, CircularProgress, Select, MenuItem } from '@mui/material';
import { useTopPlaylists } from '../contexts/TopPlaylistsContext';

const TopPlaylists = () => {
  const navigate = useNavigate();
  const { playlists, loading, error, selectedLanguage, setSelectedLanguage, languages } = useTopPlaylists();

  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value.toLowerCase());
  };

  const handlePlaylistClick = (playlist) => {
    if (playlist.id) {
      navigate(`/playlist/top/${playlist.id}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        width: '100%', 
        p: 4,
        pb: { xs: 'calc(2rem + 90px)', sm: 'calc(3rem + 90px)' },
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        p: 4,
        pb: { xs: 'calc(2rem + 90px)', sm: 'calc(3rem + 90px)' },
      }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      pb: { xs: 'calc(2rem + 90px)', sm: 'calc(3rem + 90px)' },
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw',
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: { xs: 'flex-start', sm: 'space-between' },
        mb: { xs: 3, sm: 4 },
        gap: { xs: 2, sm: 0 },
      }}>
        <Typography 
          variant="h5"
          component="h1" 
          sx={{ 
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            fontWeight: 700,
            color: '#4DC1CC',
          }}
        >
          Top Playlists
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
        }}>
          <Typography 
            variant="subtitle1"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Category:
          </Typography>
          <Select
            value={selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}
            onChange={handleLanguageChange}
            sx={{
              minWidth: { xs: 140, sm: 160 },
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiSelect-select': {
                py: 1,
                color: 'white',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4DC1CC',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4DC1CC',
              },
            }}
          >
            {languages.map((lang) => (
              <MenuItem key={lang} value={lang}>
                {lang}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {playlists.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: 'rgba(255, 255, 255, 0.7)',
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          mx: { xs: 1, sm: 2 },
        }}>
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            No playlists found for {selectedLanguage}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ px: { xs: 1, sm: 2 } }}>
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
            {playlists.map((playlist) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={playlist.id}>
                <Card
                  onClick={() => handlePlaylistClick(playlist)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    '&:hover': { 
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 12px rgba(77, 193, 204, 0.2)',
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    borderRadius: { xs: 1.5, sm: 2 },
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                    <CardMedia
                      component="img"
                      image={playlist.image?.[2]?.url || '/default-playlist.png'}
                      alt={playlist.name}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                  </Box>
                  <CardContent 
                    sx={{ 
                      p: { xs: 1.5, sm: 2 },
                      flexGrow: 1,
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <Typography 
                      variant="body1"
                      sx={{ 
                        color: 'white',
                        fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.5,
                      }}
                    >
                      {playlist.name}
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {playlist.songCount || 'Loading...'} songs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default TopPlaylists;
