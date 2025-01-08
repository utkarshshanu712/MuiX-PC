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
      p: { xs: 1, sm: 3 },
      pb: { xs: 'calc(2rem + 90px)', sm: 'calc(3rem + 90px)' },
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw',
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        mb: { xs: 3, sm: 4 },
        px: 1,
      }}>
        <Typography 
          variant="h5"
          component="h1" 
          sx={{ 
            fontSize: { xs: '2rem', sm: '2.25rem' },
            fontWeight: 700,
            mb: 1,
            color: '#4DC1CC',
            ml: 4,
          }}
        >
          Top Playlists
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 4, mb: 2 }}>
          <Typography 
            variant="subtitle1"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              color: 'rgba(255, 255, 255, 0.7)',
              mr: 2,
            }}
          >
            Category:
          </Typography>
          <Select
            value={selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}
            onChange={handleLanguageChange}
            sx={{
              minWidth: 120,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiSelect-select': {
                py: 0.5,
                color: 'white',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
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
        }}>
          <Typography>
            No playlists found for {selectedLanguage}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ px: 1 }}>
          <Grid container spacing={0.25}>
            {playlists.map((playlist) => (
              <Grid item xs={6} key={playlist.id}>
                <Card
                  onClick={() => handlePlaylistClick(playlist)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    '&:hover': { 
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'scale(1.02)',
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s',
                    mx: 0.5,
                    borderRadius: 1,
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
                      }}
                    />
                  </Box>
                  <CardContent sx={{ p: 1, flexGrow: 1 }}>
                    <Typography 
                      variant="body1"
                      sx={{ 
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {playlist.name}
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.8rem',
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
