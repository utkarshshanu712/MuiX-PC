import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Link, Paper, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoading(true);
      try {
        localStorage.setItem('username', username.trim());
        onLogin(username.trim());
        navigate('/');
      } catch (error) {
        console.error('Login error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(45deg, #1DB954 30%, #191414 90%)',
        padding: 3,
      }}
    >
      <Paper
        elevation={24}
        sx={{
          p: 4,
          borderRadius: 4,
          maxWidth: 450,
          width: '100%',
          bgcolor: 'rgba(40, 40, 40, 0.95)',
          color: 'white',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <MusicNoteIcon sx={{ fontSize: 40, color: '#1DB954', mr: 1 }} />
              <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                MuiX
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Your Personal Music Companion 🎵
            </Typography>
          </Box>

          <TextField
            label="Enter Your Name"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: '#1DB954',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1DB954',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#1DB954',
                },
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!username.trim() || isLoading}
            sx={{
              bgcolor: '#1DB954',
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: '#1ed760',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(29, 185, 84, 0.5)',
              },
            }}
          >
            {isLoading ? 'Logging in...' : 'Start Listening 🎧'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Made with ❤️ by Utkarsh Kumar
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 2,
                mt: 2 
              }}
            >
              <IconButton
                component={Link}
                href="mailto:shanuutkarsh712@gmail.com"
                color="inherit"
                title="Email"
                target="_blank"
              >
                <EmailIcon />
              </IconButton>
              <IconButton
                component={Link}
                href="https://linkedin.com/in/utkarsh-kumar-8344b1337"
                color="inherit"
                title="LinkedIn"
                target="_blank"
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                component={Link}
                href="https://github.com/utkarshshanu712"
                color="inherit"
                title="GitHub"
                target="_blank"
              >
                <GitHubIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
