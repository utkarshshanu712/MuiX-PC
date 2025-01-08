import React, { useState } from "react";
import {
  Menu,
  MenuItem,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Divider,
  ListItemIcon,
} from "@mui/material";
import { Add as AddIcon, PlaylistAdd } from "@mui/icons-material";
import { useLibrary } from "../contexts/LibraryContext";

const PlaylistMenu = ({ anchorEl, onClose, song }) => {
  const { playlists, addToPlaylist, createPlaylist } = useLibrary();
  const [openDialog, setOpenDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const handleCreateAndAdd = () => {
    if (!song) {
      console.error('No song provided to add to playlist');
      return;
    }

    if (newPlaylistName.trim()) {
      console.log('Creating playlist with song:', song);
      const newPlaylist = createPlaylist(newPlaylistName.trim());
      console.log('Created playlist:', newPlaylist);
      
      // Add the song to the newly created playlist
      if (newPlaylist) {
        console.log('Adding song to new playlist:', { playlistId: newPlaylist.id, song });
        addToPlaylist(newPlaylist.id, song);
      }
      
      setNewPlaylistName("");
      setOpenDialog(false);
      onClose();
    }
  };

  const handleAddToPlaylist = (playlistId) => {
    if (!song) {
      console.error('No song provided to add to playlist');
      return;
    }

    console.log('Adding song to playlist:', { playlistId, song });
    addToPlaylist(playlistId, song);
    onClose();
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        PaperProps={{
          sx: {
            bgcolor: "#282828",
            color: "white",
            minWidth: 200,
          },
        }}
        slotProps={{
          paper: {
            'aria-hidden': undefined,
            inert: undefined
          }
        }}
      >
        <MenuItem onClick={() => setOpenDialog(true)}>
          <ListItemIcon>
            <AddIcon sx={{ color: 'white' }} />
          </ListItemIcon>
          <Typography>Create New Playlist</Typography>
        </MenuItem>

        {playlists.length > 0 && <Divider sx={{ bgcolor: "#404040", my: 1 }} />}

        {playlists.map((playlist) => (
          <MenuItem
            key={playlist.id}
            onClick={() => handleAddToPlaylist(playlist.id)}
            sx={{ 
              "&:hover": { bgcolor: "#383838" },
              py: 1
            }}
          >
            <ListItemIcon>
              <PlaylistAdd sx={{ color: 'white' }} />
            </ListItemIcon>
            <Typography noWrap>
              {playlist.name}
              <Typography component="span" variant="body2" sx={{ color: 'grey.500', ml: 1 }}>
                ({playlist.songs.length})
              </Typography>
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: "#282828",
            color: "white",
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'grey.300' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateAndAdd}
            variant="contained"
            sx={{
              bgcolor: '#1db954',
              '&:hover': { bgcolor: '#1ed760' }
            }}
          >
            Create & Add Song
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlaylistMenu;
