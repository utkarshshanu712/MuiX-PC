import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';

const CreatePlaylist = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { createPlaylist } = useLibrary();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      createPlaylist(name.trim());
      navigate(-1);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ color: 'white', mb: 4 }}>
          Create New Playlist
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Playlist Name"
            name="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1db954',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#1db954',
                },
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              bgcolor: '#1db954',
              '&:hover': {
                bgcolor: '#1ed760',
              },
            }}
          >
            Create Playlist
          </Button>
          <Button
            fullWidth
            onClick={() => navigate(-1)}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CreatePlaylist;
