import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow,
  Favorite,
  FavoriteBorder,
  MoreVert,
  PlaylistAdd,
} from '@mui/icons-material';
import { useLibrary } from '../contexts/LibraryContext';
import PlaylistMenu from './PlaylistMenu';

const SongCard = ({ song, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [playlistAnchor, setPlaylistAnchor] = useState(null);
  const { likedSongs, toggleLikeSong } = useLibrary();

  const isLiked = likedSongs.some(s => s.id === song.id);

  const handleMoreClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePlay = (e) => {
    e.stopPropagation();
    if (song?.downloadUrl?.[0]?.url) {
      onSelect(song, true); // Pass true to indicate autoplay
    }
  };

  const handleCardClick = () => {
    if (song?.downloadUrl?.[0]?.url) {
      onSelect(song, true); // Pass true to indicate autoplay
    }
  };

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      sx={{
        display: 'flex',
        bgcolor: 'background.paper',
        '&:hover': {
          bgcolor: 'action.hover',
          transform: 'scale(1.02)',
          transition: 'all 0.2s ease',
        },
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <CardMedia
        component="img"
        sx={{ width: 100, height: 100 }}
        image={song.image?.[1]?.url || song.image?.[0]?.url}
        alt={song.name}
      />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <CardContent sx={{ flex: '1 0 auto', pr: 6 }}>
          <Typography component="div" variant="subtitle1" noWrap>
            {song.name}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            component="div" 
            noWrap
          >
            {song.primaryArtists || song.artists?.primary?.[0]?.name}
          </Typography>
        </CardContent>
      </Box>

      {isHovered && (
        <IconButton
          onClick={handlePlay}
          sx={{
            position: 'absolute',
            right: 40,
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: '#1DB954',
            '&:hover': {
              bgcolor: '#1ed760',
            },
          }}
        >
          <PlayArrow sx={{ color: 'white' }} />
        </IconButton>
      )}

      <IconButton
        onClick={handleMoreClick}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        <MoreVert />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            bgcolor: '#282828',
            color: 'white',
          }
        }}
      >
        <MenuItem onClick={() => {
          toggleLikeSong(song);
          handleClose();
        }}>
          <ListItemIcon>
            {isLiked ? 
              <Favorite sx={{ color: '#1DB954' }} /> : 
              <FavoriteBorder sx={{ color: 'white' }} />
            }
          </ListItemIcon>
          <Typography>{isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}</Typography>
        </MenuItem>
        <MenuItem onClick={(e) => {
          setPlaylistAnchor(e.currentTarget);
          handleClose();
        }}>
          <ListItemIcon>
            <PlaylistAdd sx={{ color: 'white' }} />
          </ListItemIcon>
          <Typography>Add to Playlist</Typography>
        </MenuItem>
      </Menu>

      <PlaylistMenu 
        anchorEl={playlistAnchor}
        onClose={() => setPlaylistAnchor(null)}
        song={song}
      />
    </Card>
  );
};

export default SongCard;
