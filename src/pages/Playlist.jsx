import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Grid } from '@mui/material';
import { PlayArrow, Shuffle, Delete, Download, Favorite } from '@mui/icons-material';
import SongList from '../components/SongList';
import { useLibrary } from '../contexts/LibraryContext';

const Playlist = ({ onSongSelect }) => {
  const { url } = useParams();
  const navigate = useNavigate();
  const { getPlaylist, removeFromPlaylist, deletePlaylist } = useLibrary();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);
  
  const playlist = getPlaylist(url);

  const handlePlayAll = (shuffle = false) => {
    if (!playlist?.songs?.length) return;
    
    let songs = [...playlist.songs];
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
    if (songToDelete && playlist) {
      removeFromPlaylist(playlist.id, songToDelete);
      setDeleteDialogOpen(false);
      setSongToDelete(null);
    }
  };

  const handleDeletePlaylist = () => {
    deletePlaylist(playlist.id);
    navigate('/library');
  };

  const handleDownloadPlaylist = async () => {
    try {
      for (const song of playlist.songs) {
        if (song.downloadUrl?.[0]?.url) {
          const response = await fetch(song.downloadUrl[0].url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${song.name}.mp3`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          // Add a small delay between downloads to prevent overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error downloading playlist:', error);
    }
  };

  const handleDownloadSong = async (song) => {
    try {
      const response = await fetch(song.downloadUrl[0].url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${song.name}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading song:', error);
    }
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!playlist) {
    return (
      <Box sx={{ 
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Typography color="error" variant="h6">
          Playlist not found
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/library')}
          sx={{
            bgcolor: '#1db954',
            '&:hover': { bgcolor: '#1ed760' }
          }}
        >
          Go to Library
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, mb: { xs: 1, sm: 4 } }}>
      <Box sx={{ 
        display: 'flex',
        gap: 3,
        mb: 4,
        bgcolor: 'rgba(29, 185, 84, 0.3)',
        borderRadius: 2,
        p: { xs: 1, sm: 3 }
      }}>
        <Box sx={{
          width: { xs: 80, sm: 160 },
          height: { xs: 80, sm: 150 },
          bgcolor: '#282828',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2
        }}>
          {playlist.thumbnail ? (
            <img
              src={playlist.thumbnail}
              alt={playlist.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Favorite sx={{ fontSize: { xs: 40, sm: 140 }, color: '#1db954' }} />
          )}
        </Box>

        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'flex-end', sm: 'space-between' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1,
          mb: 3
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="overline" color="text.secondary">Playlist</Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: '0.8rem', sm: '3.5rem' }, fontWeight: 'bold' }}>
              {playlist.name}
            </Typography>
          </Box>
          <Box>
            <Typography color="text.secondary" variant="body2">
              {playlist.songs.length} songs
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        {playlist.songs.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mb: 0 }}>
            <IconButton
              onClick={() => handlePlayAll(false)}
              sx={{
                mb: 3,
                p: { xs: 1, sm: 1.5 },
                bgcolor: '#1db954',
                '&:hover': { bgcolor: '#1ed760', transform: 'scale(1.04)' },
                transition: 'all 0.2s ease'
              }}
            >
              <PlayArrow sx={{ fontSize: { xs: 40, sm: 50 }, color: 'white' }} />
            </IconButton>

            <IconButton
              onClick={() => handlePlayAll(true)}
              sx={{
                mb: 3,
                p: { xs: 1, sm: 1.5 },
                bgcolor: '#1db954',
                '&:hover': { bgcolor: '#1ed760', transform: 'scale(1.04)' },
                transition: 'all 0.2s ease'
              }}
            >
              <Shuffle sx={{ fontSize: { xs: 40, sm: 50 }, color: 'white' }} />
            </IconButton>
            <IconButton
              onClick={handleDownloadPlaylist}
              sx={{
                mb: 3,
                p: { xs: 1, sm: 1.5 },
                bgcolor: '#1db954',
                '&:hover': { bgcolor: '#1ed760', transform: 'scale(1.04)' },
                transition: 'all 0.2s ease'
              }}
            >
              <Download sx={{ fontSize: { xs: 40, sm: 50 }, color: 'white' }} />
            </IconButton>
          </Box>
        )}

        <Grid container sx={{ mt: 2, px: 2 }} columns={14}>
          <Grid item xs={1}><Typography color="text.secondary">#</Typography></Grid>
          <Grid item xs={5}><Typography color="text.secondary">Title</Typography></Grid>
          <Grid item xs={4} sx={{ display: { xs: 'block', sm: 'block', md: 'block' }, textAlign: 'left' }}>
            <Typography color="text.secondary">Artist</Typography>
          </Grid>
          <Grid item xs={3} sx={{ display: { xs: 'none', sm: 'block', md: 'block' } }}>
            <Typography color="text.secondary">Duration</Typography>
          </Grid>
          <Grid item xs={1} sx={{ display: { xs: 'block', sm: 'block', md: 'block' }, px: 4 }}>
            <Typography color="text.secondary">Actions</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 1, overflow: 'auto', height: 'calc(100vh - 250px)' }}>
          {playlist.songs.map((song, index) => (
            <Grid
              container
              key={song.id}
              sx={{
                py: 1,
                px: 2,
                alignItems: 'center',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 1
                },
                cursor: 'pointer'
              }}
              columns={14}
              onClick={() => onSongSelect(song, playlist.songs.filter(s => s.id !== song.id))}
            >
              <Grid item xs={1}><Typography>{index + 1}</Typography></Grid>
              <Grid item xs={5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img
                    src={song.image?.[2]?.url}
                    alt={song.name}
                    style={{ width: 40, height: 40, borderRadius: 4 }}
                  />
                  <Typography noWrap sx={{ fontSize: { xs: '0.7rem', sm: '1rem' } }}>{song.name}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4} sx={{ display: { xs: 'block', sm: 'block', md: 'block' }, textAlign: 'left', px: { xs: '1.5rem', sm: '0rem' } }}>
                <Typography noWrap={false} color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                  {song.artists.primary.map(artist => artist.name).join(', ') || 'Unknown Artist'}
                </Typography>
              </Grid>
              <Grid item xs={3} sx={{ display: { xs: 'none', sm: 'block', md: 'block' } }}>
                <Typography color="text.secondary">
                  {formatDuration(song.duration)}
                </Typography>
              </Grid>
              <Grid item xs={1} sx={{ display: { xs: 'block', sm: 'block', md: 'block' }, px: 4 }}>
                <IconButton onClick={() => handleDownloadSong(song)}><Download /></IconButton>
                <IconButton onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSong(song.id);
                }}><Delete /></IconButton>
              </Grid>
            </Grid>
          ))}
        </Box>
      </Box>
      <Button
        variant="outlined"
        startIcon={<Delete />}
        onClick={handleDeletePlaylist}
        sx={{
          borderColor: '#ff5252',
          color: '#ff5252',
          '&:hover': {
            borderColor: '#ff1744',
            bgcolor: 'rgba(255, 82, 82, 0.08)'
          }
        }}
      >
        Delete Playlist
      </Button>
      {/* Delete Song Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSongToDelete(null);
        }}
        PaperProps={{
          sx: {
            bgcolor: '#282828',
            color: 'white',
          }
        }}
      >
        <DialogTitle>Delete Song</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this song from the playlist?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setSongToDelete(null);
            }}
            sx={{ color: 'grey.300' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteSong}
            variant="contained"
            sx={{
              bgcolor: '#ff5252',
              '&:hover': { bgcolor: '#ff1744' }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Playlist;
