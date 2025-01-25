import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, LibraryMusic, PlaylistPlay, Favorite, Person } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useArtists } from '../contexts/ArtistContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/top-playlists') return 1;
    if (path === '/top-artists') return 2;
    if (path === '/library') return 3;
    return 0;
  };

  const navItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Top Playlists', icon: <PlaylistPlay />, path: '/top-playlists' },
    { text: 'Top Artists', icon: <Person />, path: '/top-artists' },
    { text: 'Library', icon: <LibraryMusic />, path: '/library' },
  ];

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
          const item = navItems[newValue];
          navigate(item.path);
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
        {navItems.map((item, index) => (
          <BottomNavigationAction key={index} label={item.text} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
