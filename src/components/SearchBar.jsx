import React from 'react';
import { Box, InputBase, IconButton } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const SearchBar = ({ value, onChange }) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#282828',
        borderRadius: 2,
        px: 2,
        py: 1,
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <SearchIcon sx={{ color: 'grey.500', mr: 1 }} />
      <InputBase
        value={value}
        onChange={handleChange}
        placeholder="What do you want to listen to?"
        fullWidth
        sx={{
          color: 'white',
          '& input::placeholder': {
            color: 'grey.500',
            opacity: 1,
          },
        }}
      />
    </Box>
  );
};

export default SearchBar;
