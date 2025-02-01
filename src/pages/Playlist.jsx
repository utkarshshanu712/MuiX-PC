import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid, useTheme, useMediaQuery } from '@mui/material';
import { PlayArrow, Shuffle, Delete, Download, Favorite, ArrowBack } from '@mui/icons-material';
import SongList from '../components/SongList';
import { useLibrary } from '../contexts/LibraryContext';

const Playlist = ({ onSongSelect }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { getPlaylist, removeFromPlaylist, deletePlaylist, playlists } = useLibrary();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  
  useEffect(() => {
    const playlist = getPlaylist(playlistId);
    console.log('Playlist component - ID:', playlistId, 'Found playlist:', playlist, 'All playlists:', playlists);
    if (playlist) {
      setCurrentPlaylist(playlist);
    } else {
      console.error('Playlist not found:', playlistId);
      navigate('/library');
    }
  }, [playlistId, getPlaylist, playlists, navigate]);

  if (!currentPlaylist) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Loading playlist...</Typography>
      </Box>
    );
  }

  const handlePlayAll = (shuffle = false) => {
    if (!currentPlaylist?.songs?.length) return;
    
    let songs = [...currentPlaylist.songs];
    if (shuffle) {
      for (let i = songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songs[i], songs[j]] = [songs[j], songs[i]];
      }
    }
    
    const [firstSong, ...queueSongs] = songs;
    onSongSelect(firstSong, queueSongs);
  };

  const handleRemoveSong = (songId) => {
    setSongToDelete(songId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSong = () => {
    if (songToDelete && currentPlaylist) {
      removeFromPlaylist(currentPlaylist.id, songToDelete);
      setDeleteDialogOpen(false);
      setSongToDelete(null);
    }
  };

  const handleDeletePlaylist = () => {
    deletePlaylist(currentPlaylist.id);
    navigate('/library');
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 },
      pb: { xs: '120px', sm: '100px' },
      height: '100vh',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'center', sm: 'flex-start' },
        gap: { xs: 3, sm: 4 },
        mb: 4,
        position: 'relative'
      }}>
        {isMobile && (
          <IconButton 
            onClick={() => navigate('/library')}
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              color: 'white'
            }}
          >
            <ArrowBack />
          </IconButton>
        )}

        {/* Playlist Thumbnail */}
        <Box sx={{
          width: { xs: '200px', sm: '230px' },
          height: { xs: '200px', sm: '230px' },
          boxShadow: 3,
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          bgcolor: '#282828'
        }}>
          {currentPlaylist.thumbnail ? (
            <Box
              component="img"
              src={currentPlaylist.thumbnail}
              alt={currentPlaylist.name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <Favorite
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '4rem',
                color: '#1db954'
              }}
            />
          )}
        </Box>

        {/* Playlist Info and Actions */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: { xs: 'center', sm: 'flex-start' },
          textAlign: { xs: 'center', sm: 'left' },
          width: '100%'
        }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            PLAYLIST
          </Typography>
          <Typography variant="h4" sx={{ 
            fontSize: { xs: '1.8rem', sm: '2.4rem' },
            fontWeight: 'bold'
          }}>
            {currentPlaylist.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {currentPlaylist.songs.length} {currentPlaylist.songs.length === 1 ? 'song' : 'songs'}
          </Typography>
          
          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            mt: { xs: 1, sm: 2 }
          }}>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => handlePlayAll(false)}
              disabled={!currentPlaylist.songs.length}
              sx={{
                bgcolor: '#1db954',
                '&:hover': { bgcolor: '#1ed760' }
              }}
            >
              Play
            </Button>
            <Button
              variant="outlined"
              startIcon={<Shuffle />}
              onClick={() => handlePlayAll(true)}
              disabled={!currentPlaylist.songs.length}
              sx={{
                borderColor: '#1db954',
                color: '#1db954',
                '&:hover': {
                  borderColor: '#1ed760',
                  bgcolor: 'rgba(29, 185, 84, 0.1)'
                }
              }}
            >
              Shuffle
            </Button>
            <IconButton 
              onClick={handleDeletePlaylist}
              sx={{ color: 'error.main' }}
            >
              <Delete />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Songs List */}
      {currentPlaylist.songs.length > 0 ? (
        <Box sx={{ mt: { xs: 2, sm: 4 } }}>
          <SongList
            songs={currentPlaylist.songs}
            onSongSelect={onSongSelect}
            onDelete={handleRemoveSong}
            showDelete
          />
        </Box>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          No songs in this playlist yet.
        </Typography>
      )}

      {/* Delete Song Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Song</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this song from the playlist?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteSong} color="error">Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Playlist;
