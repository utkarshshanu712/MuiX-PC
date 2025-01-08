import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import { PlayCircleFilled, Verified, Shuffle, PersonAdd, PersonRemove } from '@mui/icons-material';
import SongList from '../components/SongList';
import { useArtists } from '../contexts/ArtistContext';

const TabPanel = ({ children, value, index }) => (
  <Box 
    role="tabpanel" 
    hidden={value !== index} 
    id={`artist-tabpanel-${index}`}
    sx={{
      height: value === 2 ? 'calc(100vh - 300px)' : 'auto', // Fixed height for "All Songs" tab
      overflowY: value === 2 ? 'auto' : 'visible',
      '&::-webkit-scrollbar': {
        width: '12px',
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#ffffff30',
        borderRadius: '6px',
        border: '3px solid transparent',
        backgroundClip: 'padding-box',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#ffffff50',
        borderRadius: '6px',
        border: '3px solid transparent',
        backgroundClip: 'padding-box',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
    }}
  >
    {value === index && children}
  </Box>
);

const Artist = ({ onSongSelect }) => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const loadingRef = useRef(null);
  const { isFollowing, followArtist } = useArtists();

  const fetchSongs = useCallback(async (artistName, pageNum = 1, isInitial = false) => {
    if (!artistName || (!hasMore && !isInitial)) return;
    
    try {
      setIsLoadingMore(true);
      const cleanArtistName = artistName
        .split('(')[0]
        .split('-')[0]
        .split('&')[0]
        .trim()
        .toLowerCase();

      // Fetch songs for current page
      const response = await axios.get('https://saavn.dev/api/search/songs', {
        params: {
          query: cleanArtistName,
          page: pageNum,
          limit: 20 // Reduced limit for better performance
        }
      });

      const songs = response.data?.data?.results || [];
      
      // Filter songs by artist
      const filteredSongs = songs.filter(song => {
        if (!song.downloadUrl?.[0]?.url) return false;

        const artistsToCheck = [
          song.primaryArtists,
          song.featuredArtists,
          ...(song.artists?.primary?.map(a => a.name) || [])
        ].map(a => (a || '').toLowerCase());

        return artistsToCheck.some(artist => 
          artist.includes(cleanArtistName) || 
          cleanArtistName.includes(artist)
        );
      });

      setAllSongs(prev => {
        const existingSongs = new Set(prev.map(s => s.id));
        const uniqueNewSongs = filteredSongs.filter(song => !existingSongs.has(song.id));
        return isInitial ? filteredSongs : [...prev, ...uniqueNewSongs];
      });

      setHasMore(filteredSongs.length > 0);
      setPage(pageNum + 1);
      setError(null);

    } catch (err) {
      console.error('Error fetching songs:', err);
      setError('Failed to load songs');
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore && tabValue === 2) {
          fetchSongs(artist?.name, page, false);
        }
      },
      { threshold: 0.5 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [fetchSongs, isLoadingMore, hasMore, page, artist?.name, tabValue]);

  // Handle tab changes
  useEffect(() => {
    if (tabValue === 2 && allSongs.length === 0 && artist?.name) {
      fetchSongs(artist.name, 1, true);
    }
  }, [tabValue, artist?.name]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchSongs(artist?.name, page, false);
    }
  };

  const fetchArtist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching artist with ID:', id);
      const response = await axios.get(`https://saavn.dev/api/artists/${id}`);
      const artistData = response.data?.data;

      if (artistData) {
        console.log('Artist data received:', artistData);
        setArtist(artistData);
        await fetchSongs(artistData.name);
      } else {
        setError('Artist data not found');
      }
    } catch (err) {
      console.error('Error fetching artist:', err);
      setError('Failed to load artist information');
    } finally {
      setLoading(false);
    }
  }, [id, fetchSongs]);

  useEffect(() => {
    if (id) {
      fetchArtist();
    }
  }, [id, fetchArtist]);

  const handlePlayAll = (songs, startIndex = 0) => {
    if (songs && songs.length > 0) {
      const currentSong = songs[startIndex];
      const remainingQueue = [...songs.slice(startIndex + 1), ...songs.slice(0, startIndex)];
      onSongSelect(currentSong, remainingQueue);
    }
  };

  const handleShuffle = (songs) => {
    if (!songs || songs.length === 0) return;
    
    const shuffledSongs = [...songs];
    for (let i = shuffledSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledSongs[i], shuffledSongs[j]] = [shuffledSongs[j], shuffledSongs[i]];
    }
    
    onSongSelect(shuffledSongs[0], shuffledSongs.slice(1));
  };

  const PlayButtons = ({ songs }) => (
    <Box sx={{ 
      display: 'flex', 
      gap: { xs: 1, sm: 2 }, 
      mb: 3,
      flexWrap: 'wrap',
      justifyContent: { xs: 'center', sm: 'flex-start' }
    }}>
      <Button
        variant="contained"
        startIcon={<PlayCircleFilled />}
        onClick={() => handlePlayAll(songs)}
        disabled={!songs?.length}
        sx={{
          bgcolor: '#1DB954',
          '&:hover': { bgcolor: '#1ed760' },
          textTransform: 'none',
          borderRadius: 50,
          px: { xs: 3, sm: 4 },
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}
      >
        Play
      </Button>
      <Button
        variant="outlined"
        startIcon={<Shuffle />}
        onClick={() => handleShuffle(songs)}
        disabled={!songs?.length}
        sx={{
          borderColor: '#ffffff40',
          color: 'white',
          '&:hover': { borderColor: 'white', bgcolor: 'transparent' },
          textTransform: 'none',
          borderRadius: 50,
          px: { xs: 3, sm: 4 },
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}
      >
        Shuffle
      </Button>
    </Box>
  );

  const renderFollowButton = () => (
    <Button
      variant={isFollowing(id) ? "outlined" : "contained"}
      startIcon={isFollowing(id) ? <PersonRemove /> : <PersonAdd />}
      onClick={() => followArtist({
        id,
        name: artist.name,
        image: artist.image?.[1]?.url
      })}
      sx={{
        ml: 2,
        borderColor: '#1DB954',
        bgcolor: isFollowing(id) ? 'transparent' : '#1DB954',
        '&:hover': {
          bgcolor: isFollowing(id) ? 'rgba(29, 185, 84, 0.1)' : '#1ed760',
          borderColor: '#1ed760'
        }
      }}
    >
      {isFollowing(id) ? 'Following' : 'Follow'}
    </Button>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !artist) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6">
          {error || 'Artist not found'}
        </Typography>
      </Box>
    );
  }

  const renderSongsList = (songs = allSongs, showLoadMore = false) => (
    <Box sx={{ width: '100%' }}>
      {songs.length > 0 ? (
        <React.Fragment>
          <SongList
            songs={songs}
            onSongSelect={(song, index) => {
              console.log('Selected song:', song);
              onSongSelect(song, songs.slice(index + 1));
            }}
          />
          {showLoadMore && (
            <Box 
              ref={loadingRef}
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                py: 3,
                opacity: isLoadingMore ? 0.5 : 1
              }}
            >
              {hasMore && (
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': { borderColor: '#1db954', color: '#1db954' }
                  }}
                >
                  {isLoadingMore ? 'Loading...' : 'Load More Songs'}
                </Button>
              )}
            </Box>
          )}
        </React.Fragment>
      ) : (
        <Typography color="text.secondary" textAlign="center" py={4}>
          {isLoadingMore ? 'Loading songs...' : 'No songs found for this artist'}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 4 }, 
      height: 'calc(100vh - 90px)',
      overflowY: 'auto',
      '&::-webkit-scrollbar': {
        width: '12px',
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#ffffff30',
        borderRadius: '6px',
        border: '3px solid transparent',
        backgroundClip: 'padding-box',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#ffffff50',
        borderRadius: '6px',
        border: '3px solid transparent',
        backgroundClip: 'padding-box',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
    }}> 
      {/* Artist Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'center', sm: 'flex-start' },
        mb: 4,
        textAlign: { xs: 'center', sm: 'left' }
      }}>
        <Avatar
          src={artist.image?.[2]?.url || artist.image?.[1]?.url}
          alt={artist.name}
          sx={{ 
            width: { xs: 150, sm: 200 }, 
            height: { xs: 150, sm: 200 }, 
            mb: { xs: 2, sm: 0 },
            mr: { xs: 0, sm: 4 }
          }}
        />
        <Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 1,
            justifyContent: { xs: 'center', sm: 'flex-start' },
            flexWrap: 'wrap'
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                fontSize: { xs: '1.75rem', sm: '2.125rem' }
              }}
            >
              {artist.name}
            </Typography>
            {artist.isVerified && <Verified sx={{ color: '#1DB954' }} />}
            {renderFollowButton()}
          </Box>
          <Typography variant="body1" color="text.secondary">
            {artist.followerCount?.toLocaleString()} followers
          </Typography>
          {artist.bio?.[0]?.text && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 2, 
                maxWidth: 800,
                px: { xs: 2, sm: 0 }
              }}
            >
              {artist.bio[0].text}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 3,
        mx: { xs: -2, sm: 0 }
      }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)} 
          textColor="inherit"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minWidth: { xs: 'auto', sm: 120 },
              px: { xs: 2, sm: 3 }
            }
          }}
        >
          <Tab label="Overview" />
          <Tab label="Popular" />
          <Tab label="All Songs" />
          <Tab label="About" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={{ xs: 2, sm: 4 }}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
              Popular Songs
            </Typography>
            <PlayButtons songs={allSongs.slice(0, 10)} />
            {renderSongsList(allSongs.slice(0, 10))}
          </Grid>
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                  Artist Bio
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {artist.bio?.[0]?.text}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <PlayButtons songs={allSongs.slice(0, 20)} />
        {renderSongsList(allSongs.slice(0, 20))}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <PlayButtons songs={allSongs} />
          {renderSongsList(allSongs, true)}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {artist.bio?.map((section, index) => (
          <Box key={section.sequence} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              {section.title}
            </Typography>
            <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
              {section.text}
            </Typography>
            {index < artist.bio.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </TabPanel>
    </Box>
  );
};

export default Artist;
