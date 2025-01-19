import React, { useState, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Divider, 
  ListItemButton,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Home, 
  Search, 
  LibraryMusic, 
  AddBox, 
  Favorite, 
  Person, 
  Language, 
  Settings,
  MusicNote as MusicNoteIcon,
  Add,
  PersonAdd,
  Menu as MenuIcon,
  Close as CloseIcon,
  Recommend,
  RemoveRedEye,
  Power,
  Fireplace,
  FireHydrantAlt,
  Whatshot,
  FollowTheSigns,
  FollowTheSignsTwoTone,
  FavoriteBorder,
  Group,
  Download
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';
import { useArtists } from '../contexts/ArtistContext';

const Sidebar = () => {
  const { likedSongs } = useLibrary();
  const location = useLocation();
  const { topArtists, followedArtists } = useArtists();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const mainMenuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Top Playlists', icon: <Language />, path: '/top-playlists' },
    { text: 'For You', icon: <Whatshot />, path: '/for-you' },
    { text: 'Search', icon: <Search />, path: '/search' },
  ];
  const playlistItems = [
    { 
      text: `Liked Songs (${likedSongs.length})`, 
      icon: <Favorite />, 
      path: '/liked-songs' 
    },
    { text: 'Your Library', icon: <LibraryMusic />, path: '/library' },
  ];
  

  const exploreItems = [
    { text: 'Top Artists', icon: <Person />, path: '/top-artists' },
    { text: 'Following Artists', icon: <Group />, path: '/following' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const sidebarItemStyle = (isActive) => ({
    color: 'white',
    '&:hover': {
      color: '#1DB954',
    },
    ...(isActive && {
      color: '#1DB954',
    }),
  });

  const sidebarContent = (
    <>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          noWrap
          component={Link}
          to="/"
          sx={{
            mb: 1,
            color: 'white',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              color: '#1db954',
            },
          }}
        >
          <MusicNoteIcon sx={{ mr: 1 }} />
          MuiX
        </Typography>
      </Box>

      <List>
        {mainMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => isMobile && handleDrawerToggle()}
              sx={{
                borderRadius: 2,
                mb: 1,
                ...sidebarItemStyle(location.pathname === item.path),
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

      <List>
        {playlistItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => isMobile && handleDrawerToggle()}
              sx={{
                borderRadius: 1,
                mb: 1,
                ...sidebarItemStyle(location.pathname === item.path),
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

      <List>
        {exploreItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => isMobile && handleDrawerToggle()}
              sx={{
                borderRadius: 1,
                mb: 1,
                ...sidebarItemStyle(location.pathname === item.path),
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <>
      {/* Mobile Menu Toggle */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 10,
            left: 10,
            zIndex: 1200,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Sidebar Content */}
      <Box
        component="nav"
        sx={{
          width: { sm: 240 },
          flexShrink: { sm: 0 },
        }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            anchor="left"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better mobile performance
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: 240,
                bgcolor: '#121212',
              },
            }}
          >
            {sidebarContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: 240,
                bgcolor: '#121212',
                border: 'none',
              },
            }}
            open
          >
            {sidebarContent}
          </Drawer>
        )}
      </Box>
    </>
  );
};

export default Sidebar;
