import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Grid, CircularProgress, Avatar, Tabs, Tab } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import SongCard from '../components/SongCard';

const ITEMS_PER_PAGE = 20;

const Search = ({ onSongSelect }) => {
  const [searchResults, setSearchResults] = useState({ songs: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pages, setPages] = useState({ songs: 1, artists: 1, albums: 1 });
  const [hasMore, setHasMore] = useState({ songs: true, artists: true, albums: true });
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef();
  const navigate = useNavigate();
  const searchTimeout = useRef(null);

  // Debounce search query
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.trim()) {
      searchTimeout.current = setTimeout(() => {
        setDebouncedQuery(query);
      }, 300);
    } else {
      setDebouncedQuery('');
      setSearchResults({ songs: [], artists: [], albums: [] });
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const handleSearch = async () => {
    if (!debouncedQuery.trim()) {
      setSearchResults({ songs: [], artists: [], albums: [] });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const types = ['songs', 'artists', 'albums'];
      const promises = types.map(type =>
        axios.get(`https://saavn.dev/api/search/${type}`, {
          params: {
            query: debouncedQuery,
            page: 1,
            limit: ITEMS_PER_PAGE
          }
        })
      );

      const responses = await Promise.all(promises);
      const newResults = {
        songs: responses[0].data?.data?.results || [],
        artists: responses[1].data?.data?.results || [],
        albums: responses[2].data?.data?.results || [],
      };

      setSearchResults(newResults);
      setPages({ songs: 1, artists: 1, albums: 1 });
      setHasMore({
        songs: (responses[0].data?.data?.total || 0) > ITEMS_PER_PAGE,
        artists: (responses[1].data?.data?.total || 0) > ITEMS_PER_PAGE,
        albums: (responses[2].data?.data?.total || 0) > ITEMS_PER_PAGE,
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch search results');
    } finally {
      setLoading(false);
    }
  };

  // Effect for handling search
  useEffect(() => {
    if (debouncedQuery) {
      handleSearch();
    }
  }, [debouncedQuery]);

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
  };

  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const currentType = ['songs', 'artists', 'albums'][activeTab];
        if (hasMore[currentType]) {
          loadMoreItems(currentType);
        }
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, activeTab, hasMore]);

  const loadMoreItems = async (type) => {
    if (loadingMore || !hasMore[type] || !debouncedQuery) return;
    setLoadingMore(true);

    try {
      const response = await axios.get(
        `https://saavn.dev/api/search/${type}`, {
          params: {
            query: debouncedQuery,
            page: pages[type],
            limit: ITEMS_PER_PAGE
          }
        }
      );

      const newResults = response.data?.data?.results || [];
      const total = response.data?.data?.total || 0;

      setSearchResults(prev => ({
        ...prev,
        [type]: [...prev[type], ...newResults]
      }));

      setPages(prev => ({
        ...prev,
        [type]: prev[type] + 1
      }));

      setHasMore(prev => ({
        ...prev,
        [type]: newResults.length > 0 && searchResults[type].length + newResults.length < total
      }));

    } catch (error) {
      console.error(`Error loading more ${type}:`, error);
      setError(`Failed to load more ${type}`);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Typography color="error" align="center" sx={{ mt: 4 }}>
          {error}
        </Typography>
      );
    }

    switch (activeTab) {
      case 0: // Songs
        return (
          <Grid container spacing={2}>
            {searchResults.songs.map((song, index) => (
              <Grid 
                item 
                xs={12} sm={6} md={4} lg={3} 
                key={`${song.id}-${index}`}
                ref={index === searchResults.songs.length - 1 ? lastElementRef : null}
              >
                <SongCard song={song} onSelect={onSongSelect} />
              </Grid>
            ))}
          </Grid>
        );

      case 1: // Artists
        return (
          <Grid container spacing={2}>
            {searchResults.artists.map((artist, index) => (
              <Grid 
                item 
                xs={6} sm={4} md={3} lg={2} 
                key={`${artist.id}-${index}`}
                ref={index === searchResults.artists.length - 1 ? lastElementRef : null}
              >
                <Box
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    p: 2,
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  <Avatar
                    src={artist.image?.[2]?.url || artist.image?.[1]?.url}
                    sx={{ width: 150, height: 150, mb: 1, borderRadius: '50%' }}
                  />
                  <Typography variant="subtitle1" align="center" noWrap>
                    {artist.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        );

      case 2: // Albums
        return (
          <Grid container spacing={2}>
            {searchResults.albums.map((album, index) => (
              <Grid 
                item 
                xs={6} sm={4} md={3} lg={2} 
                key={`${album.id}-${index}`}
                ref={index === searchResults.albums.length - 1 ? lastElementRef : null}
              >
                <Box
                  onClick={() => navigate(`/album/${album.id}`)}
                  sx={{
                    cursor: 'pointer',
                    p: 2,
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  <img
                    src={album.image?.[2]?.url || album.image?.[1]?.url}
                    alt={album.name}
                    style={{ width: '100%', aspectRatio: '1', borderRadius: 8 }}
                  />
                  <Typography variant="subtitle1" noWrap sx={{ mt: 1 }}>
                    {album.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {album.primaryArtists}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        );
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 3, flexShrink: 0 }}>
        <SearchBar
          value={query}
          onChange={handleQueryChange}
        />
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ mt: 2 }}
        >
          <Tab label="Songs" />
          <Tab label="Artists" />
          <Tab label="Albums" />
        </Tabs>
      </Box>

      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        px: 3,
        pb: 3,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#282828',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#535353',
          borderRadius: '4px',
        }
      }}>
        {renderContent()}
        {loadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Search;
