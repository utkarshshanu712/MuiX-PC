import React from 'react';
import { Box, Grid, Card, CardContent, Typography, CardMedia, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTopPlaylists } from '../contexts/TopPlaylistsContext';

const TopPlaylists = () => {
  const { 
    playlists, 
    loading, 
    error, 
    selectedLanguage, 
    setSelectedLanguage, 
    languages
  } = useTopPlaylists();
  const navigate = useNavigate();

  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value.toLowerCase());
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2
      }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="language-select-label">Language</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}
            label="Language"
            onChange={handleLanguageChange}
          >
            {languages.map((language) => (
              <MenuItem key={language} value={language}>
                {language}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {playlists.map((playlist) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={playlist.id}>
              <Card 
                onClick={() => handlePlaylistClick(playlist.id)}
                sx={{ 
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={playlist.image?.[2]?.link || playlist.image?.[1]?.link || playlist.image?.[0]?.link}
                  alt={playlist.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {playlist.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {playlist.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TopPlaylists;
