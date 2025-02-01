import React, { useState } from 'react';
import { 
  Box, Typography, Button, TextField, Dialog, Grid,
  Card, CardContent, CardMedia, IconButton, Menu, MenuItem,
  DialogTitle, DialogContent, DialogActions, CircularProgress,
  useTheme, useMediaQuery
} from '@mui/material';
import { Add as AddIcon, MoreVert, Delete, PlayArrow, Favorite, CloudDownload } from '@mui/icons-material';
import { useLibrary } from '../contexts/LibraryContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Library = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const library = useLibrary();
  const { 
    playlists, 
    likedSongs, 
    createPlaylist, 
    deletePlaylist, 
    removeFromPlaylist, 
    addToPlaylist,
    addSongsToPlaylist
  } = library;
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [saavnPlaylistUrl, setSaavnPlaylistUrl] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [songToRemove, setSongToRemove] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const navigate = useNavigate();

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      const playlist = createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setOpenDialog(false);
      if (playlist) {
        navigate(`/playlist/${playlist.id}`);
      }
    }
  };

  const handleImportPlaylist = async () => {
    if (!saavnPlaylistUrl.trim()) return;
    
    try {
      setImporting(true);
      setImportProgress(0);
      
      // Extract playlist ID or handle full URL
      const playlistLink = saavnPlaylistUrl.trim();
      
      // Fetch playlist details with all songs at once (page 0, limit 1000)
      const response = await axios.get(
        `https://saavn.dev/api/playlists?link=${encodeURIComponent(playlistLink)}&page=0&limit=1000`
      );
      
      if (response?.data?.data) {
        const playlistData = response.data.data;
        const totalSongs = playlistData.songCount || 0;
        console.log('Total songs in playlist:', totalSongs, 'Songs fetched:', playlistData.songs?.length);
        
        // Create new playlist with initial data
        const newPlaylist = createPlaylist(playlistData.name || 'Imported Playlist');
        if (!newPlaylist) {
          throw new Error('Failed to create playlist');
        }

        // Process all songs at once
        const processedSongs = (playlistData.songs || []).map(song => ({
          id: song.id,
          name: song.name,
          artists: song.artists,
          duration: song.duration,
          image: song.image,
          downloadUrl: song.downloadUrl,
          hasLyrics: song.hasLyrics,
          album: song.album,
          year: song.year,
          language: song.language
        }));

        console.log('Processing songs:', processedSongs.length);

        // Add all songs to playlist in a single batch update
        if (processedSongs.length > 0) {
          setImportProgress(10); // Show initial progress
          await addSongsToPlaylist(newPlaylist.id, processedSongs);
          console.log('Added songs to playlist:', processedSongs.length);
          setImportProgress(100);
        }

        setOpenImportDialog(false);
        setSaavnPlaylistUrl('');
        
        // Navigate to the newly created playlist
        navigate(`/playlist/${newPlaylist.id}`);
      }
    } catch (error) {
      console.error('Error importing playlist:', error);
      alert('Failed to import playlist. Please check the URL and try again.');
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const handleMenuClick = (event, playlist) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedPlaylist(playlist);
  };

  const handlePlaylistAction = (playlist, action) => {
    if (!playlist) return;
    
    setMenuAnchor(null);
    
    switch (action) {
      case 'play':
        navigate(`/playlist/${playlist.id}`);
        break;
      case 'delete':
        deletePlaylist(playlist.id);
        break;
      default:
        break;
    }
  };

  const handleRemoveSong = (songId) => {
    if (selectedPlaylist) {
      library.removeFromPlaylist(selectedPlaylist.id, songId);
    }
  };

  const handlePlaylistClick = (playlist) => {
    navigate(`/playlist/${playlist.id}`);
  };

  return (
    <Box sx={{
      p: { xs: 2, sm: 3 },
      pb: { xs: '120px', sm: '100px' }, // Account for bottom nav and player on mobile
      height: '100%',
      overflow: 'auto'
    }}>
      {/* Header Section */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" component="h1" sx={{ 
          fontSize: { xs: '1.8rem', sm: '2.4rem' },
          fontWeight: 'bold'
        }}>
          Your Library
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              bgcolor: '#1db954',
              '&:hover': { bgcolor: '#1ed760' },
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 }
            }}
          >
            Create Playlist
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenImportDialog(true)}
            sx={{
              borderColor: '#1db954',
              color: '#1db954',
              '&:hover': {
                borderColor: '#1ed760',
                bgcolor: 'rgba(29, 185, 84, 0.1)'
              },
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 }
            }}
          >
            Import Playlist
          </Button>
        </Box>
      </Box>

      {/* Playlists Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Liked Songs Card */}
        <Grid item xs={6} sm={4} md={3}>
          <Card 
            onClick={() => navigate('/liked-songs')}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              bgcolor: 'background.paper',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                bgcolor: 'action.hover'
              }
            }}
          >
            <CardMedia
              component="div"
              sx={{
                pt: '100%',
                position: 'relative',
                bgcolor: '#282828'
              }}
            >
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
            </CardMedia>
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
              <Typography variant="h6" noWrap sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                Liked Songs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {playlists.map((playlist) => (
          <Grid item xs={6} sm={4} md={3} key={playlist.id}>
            <Card
              onClick={() => navigate(`/playlist/${playlist.id}`)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                bgcolor: 'background.paper',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  bgcolor: 'action.hover'
                }
              }}
            >
              <Box sx={{
                position: 'relative',
                paddingTop: '100%',
                bgcolor: '#282828'
              }}>
                {playlist.thumbnail ? (
                  <Box
                    component="img"
                    src={playlist.thumbnail}
                    alt={playlist.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
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
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(e, playlist);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Box>
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="h6" noWrap sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                  {playlist.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Playlist Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Create New Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Playlist Name"
            type="text"
            fullWidth
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreatePlaylist}
            variant="contained"
            sx={{ bgcolor: '#1db954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Playlist Dialog */}
      <Dialog
        open={openImportDialog}
        onClose={() => !importing && setOpenImportDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Import JioSaavn Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="JioSaavn Playlist URL"
            type="text"
            fullWidth
            value={saavnPlaylistUrl}
            onChange={(e) => setSaavnPlaylistUrl(e.target.value)}
            disabled={importing}
          />
          {importing && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <CircularProgress 
                variant="determinate" 
                value={importProgress} 
                sx={{ color: '#1db954' }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Importing playlist... {Math.round(importProgress)}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenImportDialog(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImportPlaylist}
            disabled={importing || !saavnPlaylistUrl.trim()}
            variant="contained"
            sx={{ bgcolor: '#1db954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Playlist Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => handlePlaylistAction(selectedPlaylist, 'play')}>
          <PlayArrow sx={{ mr: 1 }} /> Play
        </MenuItem>
        <MenuItem onClick={() => handlePlaylistAction(selectedPlaylist, 'delete')}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Library;
