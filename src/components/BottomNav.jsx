import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, LibraryMusic, PlaylistPlay, Favorite, Whatshot } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/for-you') return 1;
    if (path === '/top-playlists') return 2;
    if (path === '/library') return 3;
    return 0;
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        display: { xs: 'block', md: 'none' },
        zIndex: 1100,
        height: '56px',
        bgcolor: 'rgba(18, 18, 18, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        '& .MuiBottomNavigation-root': {
          height: '100%',
          minHeight: '56px',
          bgcolor: 'transparent',
        }
      }} 
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={getCurrentValue()}
        onChange={(event, newValue) => {
          switch(newValue) {
            case 0:
              navigate('/');
              break;
            case 1:
              navigate('/for-you');
              break;
            case 2:
              navigate('/top-playlists');
              break;
            case 3:
              navigate('/library');
              break;
            default:
              navigate('/');
          }
        }}
        sx={{
          bgcolor: '#282828',
          '& .MuiBottomNavigationAction-root': {
            color: '#b3b3b3',
            '&.Mui-selected': {
              color: '#1DB954'
            }
          }
        }}
      >
        <BottomNavigationAction label="Home" icon={<Home />} />
        <BottomNavigationAction label="For You" icon={<Whatshot />} />
        <BottomNavigationAction label="Top Playlists" icon={<PlaylistPlay />} />
        <BottomNavigationAction label="Library" icon={<LibraryMusic />} />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
