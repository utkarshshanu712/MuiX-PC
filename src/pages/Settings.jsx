import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Link,
  IconButton,
  Avatar,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import CodeIcon from '@mui/icons-material/Code';
import { useSettings } from '../contexts/SettingsContext';

const Settings = () => {
  const {
    streamingQuality,
    setStreamingQuality,
    downloadQuality,
    setDownloadQuality,
    qualityOptions,
  } = useSettings();

  return (
    <Box 
      sx={{ 
        height: '100vh',
        overflow: 'auto',
        bgcolor: '#121212',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '4px',
        },
      }}
    >
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', pb: { xs: 8, sm: 3 } }}>
        <Typography variant="h4" sx={{ mb: 4, color: 'white' }}>
          Settings
        </Typography>

        <Paper sx={{ p: 3, mb: 3, bgcolor: '#282828' }}>
          <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
            Audio Quality
          </Typography>

          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="streaming-quality-label" sx={{ color: 'gray' }}>
                Streaming Quality
              </InputLabel>
              <Select
                labelId="streaming-quality-label"
                value={streamingQuality}
                onChange={(e) => setStreamingQuality(e.target.value)}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                {qualityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="body2" sx={{ mt: 1, color: 'gray' }}>
                Higher quality uses more data
              </Typography>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="download-quality-label" sx={{ color: 'gray' }}>
                Download Quality
              </InputLabel>
              <Select
                labelId="download-quality-label"
                value={downloadQuality}
                onChange={(e) => setDownloadQuality(e.target.value)}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                {qualityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="body2" sx={{ mt: 1, color: 'gray' }}>
                Higher quality files take up more storage
              </Typography>
            </FormControl>
          </Box>
        </Paper>

        <Paper sx={{ mt: 4, p: 3, bgcolor: 'rgba(40, 40, 40, 0.95)' }}>
          <Typography variant="h5" gutterBottom>
            About MuiX
          </Typography>
          <Typography variant="body1" paragraph>
            MuiX is a modern music streaming platform that brings your favorite tunes right to your fingertips. 
            With a sleek interface and powerful features, it's designed to make your music experience seamless and enjoyable.
          </Typography>
          <Typography variant="body1" paragraph>
            Key Features:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li">🎵 Instant music search</Typography>
            <Typography component="li">🎨 Beautiful, responsive UI</Typography>
            <Typography component="li">📱 Cross-platform compatibility</Typography>
            <Typography component="li">🎧 High-quality audio streaming</Typography>
            <Typography component="li">💫 Personalized experience</Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" gutterBottom>
            Developer
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
              <img 
                src="https://github.com/utkarshshanu712.png" 
                alt="UK" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </Avatar>
            <Box>
              <Typography variant="h6">Utkarsh Kumar</Typography>
              <Typography variant="body2" color="text.secondary">
                Full Stack Developer
              </Typography>
            </Box>
          </Box>


          <Typography variant="body1" paragraph>
            I'm a passionate developer with expertise in web and desktop application development. 
            Have a great day! 😊 Feel free to connect with me on LinkedIn or reach out via email. 
            I'm always open to discussing new projects and ideas!
          </Typography>

          <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 3 }}>
            "In coding, sometimes things break, but our spirit doesn't!" 💪
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton
              component={Link}
              href="mailto:shanuutkarsh712@gmail.com"
              color="primary"
              title="Email"
              target="_blank"
            >
              <EmailIcon />
            </IconButton>
            <IconButton
              component={Link}
              href="https://linkedin.com/in/utkarsh-kumar-8344b1337"
              color="primary"
              title="LinkedIn"
              target="_blank"
            >
              <LinkedInIcon />
            </IconButton>
            <IconButton
              component={Link}
              href="https://github.com/utkarshshanu712"
              color="primary"
              title="GitHub"
              target="_blank"
            >
              <GitHubIcon />
            </IconButton>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" gutterBottom>
            Technical Details
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon color="primary" />
            <Typography variant="body1">
              Built with React, Material-UI, and ❤️
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Settings;
