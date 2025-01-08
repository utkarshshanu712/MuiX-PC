import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, IconButton } from '@mui/material';
import { PersonAdd, PersonRemove } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useArtists } from '../contexts/ArtistContext';

const TopArtists = () => {
  const { topArtists, followArtist, isFollowing } = useArtists();
  const navigate = useNavigate();

  const handleArtistClick = (artistId) => {
    navigate(`/artist/${artistId}`);
  };

  return (
    <Box sx={{ 
      p: 4, 
      pb: { xs: "126px", sm: "90px" }, 
      height: "100%",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      "&::-webkit-scrollbar": {
        width: "8px",
      },
      "&::-webkit-scrollbar-track": {
        background: "transparent",
      },
      "&::-webkit-scrollbar-thumb": {
        background: "#555",
        borderRadius: "4px",
      },
    }}>
      <Typography variant="h4" sx={{ mb: 4, color: 'white' }}>
        Top Artists
      </Typography>

      <Grid container spacing={3}>
        {topArtists.map((artist) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
            <Card 
              onClick={() => handleArtistClick(artist.id)}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.05)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <CardMedia
                component="img"
                height="250"
                image={artist.image}
                alt={artist.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Box>
                  <Typography variant="h6" color="white">
                    {artist.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Artist
                  </Typography>
                </Box>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    followArtist(artist);
                  }}
                  sx={{ 
                    color: isFollowing(artist.id) ? '#1db954' : 'white',
                    '&:hover': { color: '#1db954' }
                  }}
                >
                  {isFollowing(artist.id) ? <PersonRemove /> : <PersonAdd />}
                </IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TopArtists;
