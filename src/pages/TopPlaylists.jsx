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
        px: 1,
      }}>
        <Typography 
          variant="h5"
          component="h1"
          sx={{
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            fontWeight: 700,
            color: '#4DC1CC',
            mb: { xs: 1, sm: 0 },
          }}
        >
          Top Playlists
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
        }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Language:
          </Typography>
          <Select
            value={selectedLanguage}
            onChange={handleLanguageChange}
            size="small"
            sx={{
              minWidth: 120,
              '& .MuiSelect-select': {
                py: 1,
              },
            }}
          >
            {languages.map((lang) => (
              <MenuItem key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 1, sm: 2 } }}>
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {playlists.map((playlist) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={playlist.id}>
              <Card 
                onClick={() => handlePlaylistClick(playlist)}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardMedia
                  component="img"
                  image={playlist.image}
                  alt={playlist.title}
                  sx={{
                    aspectRatio: '1/1',
                    objectFit: 'cover',
                  }}
                />
                <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}
                  >
                    {playlist.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {playlist.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default TopPlaylists;
