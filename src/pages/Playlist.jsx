import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from '@mui/material';
import { PlayArrow, Shuffle, Delete, Download } from '@mui/icons-material';
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
        <Box sx={{ 
          width: 200, 
          height: 200, 
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#282828',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {playlist.thumbnail ? (
            <img
              src={playlist.thumbnail}
              alt={playlist.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Typography variant="h1" sx={{ color: '#1db954' }}>
              {playlist.name[0].toUpperCase()}
            </Typography>
          )}
        </Box>

        <Box>
          <Typography variant="overline">Playlist</Typography>
          <Typography variant="h3" sx={{ mb: 2 }}>{playlist.name}</Typography>
          <Typography variant="body1" color="text.secondary">
            {playlist.songs.length} songs
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            {playlist.songs.length > 0 && (
              <>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => handlePlayAll(false)}
                  sx={{
                    bgcolor: '#1db954',
                    '&:hover': { bgcolor: '#1ed760' }
                  }}
                >
                  Play All
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Shuffle />}
                  onClick={() => handlePlayAll(true)}
                  sx={{
                    bgcolor: '#1db954',
                    '&:hover': { bgcolor: '#1ed760' }
                  }}
                >
                  Shuffle
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDownloadPlaylist}
                  sx={{
                    bgcolor: '#1db954',
                    '&:hover': { bgcolor: '#1ed760' }
                  }}
                >
                  Download Playlist
                </Button>
              </>
            )}
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
          </Box>
        </Box>
      </Box>

      {playlist.songs.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "gray" }}>#</TableCell>
                <TableCell sx={{ color: "gray" }}>Title</TableCell>
                <TableCell sx={{ color: "gray" }}>Artist</TableCell>
                <TableCell sx={{ color: "gray" }}>Duration</TableCell>
                <TableCell sx={{ color: "gray" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {playlist.songs.map((song, index) => (
                <TableRow
                  key={song.id}
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                    cursor: "pointer",
                  }}
                  onClick={() => onSongSelect(song, playlist.songs.filter(s => s.id !== song.id))}
                >
                  <TableCell sx={{ color: "white" }}>{index + 1}</TableCell>
                  <TableCell sx={{ color: "white" }}>{song.name}</TableCell>
                  <TableCell sx={{ color: "white" }}>
                    {song.primaryArtists}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>
                    {/* formatDuration(song.duration) */}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSong(song);
                      }}
                      sx={{ color: "white" }}
                    >
                      <Download />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSong(song.id);
                      }}
                      sx={{ color: "white" }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          This playlist is empty. Add some songs to get started!
        </Typography>
      )}

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
