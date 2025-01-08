import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, IconButton } from '@mui/material';
import { PersonRemove, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useArtists } from '../contexts/ArtistContext';

const Following = () => {
  const { followedArtists, followArtist } = useArtists();
  const navigate = useNavigate();

  if (followedArtists.length === 0) {
    return (
      <Box sx={{ 
        p: 4, 
        textAlign: 'center',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Person sx={{ fontSize: 60, color: 'grey.500', mb: 2 }} />
        <Typography variant="h5" color="white" gutterBottom>
          No artists followed yet
        </Typography>
        <Typography color="text.secondary">
          Follow your favorite artists to see them here
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: 'white' }}>
        Artists You Follow
      </Typography>

      <Grid container spacing={3}>
        {followedArtists.map((artist) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
            <Card 
              onClick={() => navigate(`/artist/${artist.id}`)}
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
                    Following
                  </Typography>
                </Box>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    followArtist(artist);
                  }}
                  sx={{ color: '#1db954' }}
                >
                  <PersonRemove />
                </IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Following;
