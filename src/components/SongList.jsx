import React from 'react';
import { Box, Typography, IconButton, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

const formatDuration = (duration) => {
  if (!duration) return '0:00';
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const SongList = ({ songs = [], onSongSelect, lastSongElementRef }) => {
  if (!Array.isArray(songs)) {
    console.error('Songs prop must be an array');
    return null;
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'transparent' }}>
      {songs.map((song, index) => {
        if (!song) return null;
        
        const songImage = song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url;
        const artistName = song.primaryArtists || 
                         (Array.isArray(song.artists?.primary) ? song.artists.primary[0]?.name : '') || 
                         'Unknown Artist';

        return (
          <ListItem
            ref={index === songs.length - 1 ? lastSongElementRef : null}
            key={song.id || index}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .play-button': {
                  opacity: 1,
                },
              },
              borderRadius: 1,
              cursor: 'pointer',
              mb: 0.5,
            }}
            onClick={() => onSongSelect?.(song)}
            secondaryAction={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  edge="end"
                  className="play-button"
                  sx={{
                    color: 'white',
                    opacity: 0,
                    '&:hover': { opacity: 1 },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSongSelect?.(song);
                  }}
                >
                  <PlayArrow />
                </IconButton>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 2, minWidth: 40 }}
                >
                  {formatDuration(song.duration)}
                </Typography>
              </Box>
            }
          >
            <ListItemAvatar>
              <Avatar
                alt={song.name || 'Song'}
                src={songImage}
                variant="square"
                sx={{ width: 40, height: 40, borderRadius: 1 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="body1" color="white" noWrap>
                  {song.name || 'Untitled'}
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary" noWrap>
                  {artistName}
                </Typography>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export default SongList;
