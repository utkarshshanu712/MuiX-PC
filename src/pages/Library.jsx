import React, { useState } from 'react';
import { 
  Box, Typography, Button, TextField, Dialog, Grid,
  Card, CardContent, CardMedia, IconButton, Menu, MenuItem,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add as AddIcon, MoreVert, Delete, PlayArrow, Favorite } from '@mui/icons-material';
import { useLibrary } from '../contexts/LibraryContext';
import { useNavigate } from 'react-router-dom';

const Library = () => {
  const { playlists, likedSongs, createPlaylist, deletePlaylist, removeFromPlaylist } = useLibrary();
  const [openDialog, setOpenDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [songToRemove, setSongToRemove] = useState(null);
  const navigate = useNavigate();

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setOpenDialog(false);
    }
  };

  const handlePlaylistAction = (playlist, action, e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setMenuAnchor(null);
    if (action === 'delete') {
      deletePlaylist(playlist.id);
    } else if (action === 'play') {
      navigate(`/playlist/${playlist.id}`);
    }
  };

  const handleRemoveSong = (songId) => {
    if (selectedPlaylist) {
      removeFromPlaylist(selectedPlaylist.id, songId);
    }
  };

  const handlePlaylistClick = (playlist) => {
    navigate(`/playlist/${playlist.id}`);
  };

  const handleMenuClick = (e, playlist) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setMenuAnchor(e.currentTarget);
    setSelectedPlaylist(playlist);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" color="white">Your Library</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => setOpenDialog(true)}
          sx={{
            bgcolor: '#1db954',
            '&:hover': { bgcolor: '#1ed760' }
          }}
        >
          Create Playlist
        </Button>
      </Box>

      <Grid container spacing={2}>
        {/* Liked Songs Card */}
        <Grid item xs={6}>
          <Card 
            sx={{ 
              bgcolor: '#282828', 
              cursor: 'pointer',
              '&:hover': {
                bgcolor: '#333333'
              },
              position: 'relative',
              width: '100%',
              height: 220,  // Fixed height for square card
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => navigate('/liked-songs')}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '30%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}
            >
              <Favorite sx={{ fontSize: '100px', color: '#1db954' }} />
            </Box>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                zIndex: 2,
                mt: 12 // Add margin to position text below the heart icon
              }}
            >
              <Typography variant="h6" color="white">
                Liked Songs
              </Typography>
              <Typography color="text.secondary">
                {likedSongs.length} songs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Playlist Cards */}
        {playlists.map((playlist) => (
          <Grid item xs={6} key={playlist.id}>
            <Card 
              sx={{ 
                bgcolor: '#282828',
                position: 'relative',
                cursor: 'pointer',
                '&:hover .playButton': {
                  opacity: 1
                },
                width: '100%',
                height: 220  // Increased height for square card
              }}
              onClick={() => handlePlaylistClick(playlist)}
            >
              <CardMedia
                component="img"
                height="140"
                image={playlist.thumbnail || '/default-playlist.jpg'}
                alt={playlist.name}
                sx={{ opacity: 0.7 }}
              />
              <Box
                className="playButton"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
              >
                <IconButton
                  size="large"
                  sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                >
                  <PlayArrow sx={{ color: 'white' }} />
                </IconButton>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" color="white" noWrap>
                      {playlist.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {playlist.songs.length} songs
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, playlist)}
                    sx={{ color: 'white' }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Playlist Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: '#282828',
            color: 'white',
          }
        }}
      >
        <DialogTitle>Create New Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Playlist Name"
            fullWidth
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            sx={{
              '& .MuiInputLabel-root': { color: 'grey.400' },
              '& .MuiInput-root': { color: 'white' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'grey.700' },
                '&:hover fieldset': { borderColor: 'grey.500' },
                '&.Mui-focused fieldset': { borderColor: '#1db954' }
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'grey.300' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreatePlaylist}
            variant="contained"
            sx={{
              bgcolor: '#1db954',
              '&:hover': { bgcolor: '#1ed760' }
            }}
          >
            Create Playlist
          </Button>
        </DialogActions>
      </Dialog>

      {/* Playlist Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{
          sx: { bgcolor: '#282828', color: 'white' }
        }}
      >
        <MenuItem onClick={(e) => handlePlaylistAction(selectedPlaylist, 'play', e)}>
          <PlayArrow sx={{ mr: 1 }} /> Play
        </MenuItem>
        <MenuItem onClick={(e) => handlePlaylistAction(selectedPlaylist, 'delete', e)} sx={{ color: '#ff5252' }}>
          <Delete sx={{ mr: 1 }} /> Delete Playlist
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Library;
