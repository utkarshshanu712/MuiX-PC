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
      <Typography variant="h4" sx={{ mb: 4, color: 'white', textAlign: 'center' }}>
        Top Artists
      </Typography>

      <Grid container spacing={2} sx={{justifyContent: { xs: 'center', sm: 'flex-start' }}}>
        {topArtists.map((artist) => (
          <Grid item xs={6} sm={6} md={4} lg={3} key={artist.id} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card 
              onClick={() => handleArtistClick(artist.id)}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.05)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-5px)'
                },
                maxWidth: { xs: 280, sm: '100%' },
                boxShadow: 3,
              }}
            >
              <CardMedia
                component="img"
                sx={{ 
                  objectFit: 'cover',
                  height: { xs: 'auto', sm: 250 },
                  width: { xs: '100%', sm: '100%' },
                  aspectRatio: { xs: '1/1', sm: 'auto' },
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }}
                image={artist.image}
                alt={artist.name}
              />
              <CardContent sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Box sx={{ mb: { xs: 1, sm: 0 } }}>
                  <Typography variant="h6" color="white" noWrap>
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
