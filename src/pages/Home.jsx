import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  InputBase,
  Paper,
} from "@mui/material";
import { 
  ChevronLeft, 
  ChevronRight, 
  Close as CloseIcon, 
  PlayArrow as PlayArrowIcon,
  Shuffle as ShuffleIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTopPlaylists } from '../contexts/TopPlaylistsContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

const categories = [
  { id: "trending", title: "Trending Now", query: "latest songs," },
  { id: "punjabi", title: "Punjabi Hits", query: "punjabi hits" },
  { id: "bollywood", title: "Bollywood Hits", query: "Top Bollywood Hits" },
  { id: "romantic", title: "Romantic Hits", query: "hindi Romantic songs" },
  { id: "old songs", title: "Old Songs", query: "old hindi songs" },
];

const topCharts = [
  {
    link: "https://www.jiosaavn.com/featured/hindi-india-superhits-top-50/zlJfJYVuyjpxWb5,FqsjKg__",
    title: "Hindi: India Superhits Top 50",
    type: "playlist",
  },
  {
    link: "https://www.jiosaavn.com/featured/most-searched-songs-hindi/csv-SfcHUmHc1EngHtQQ2g__",
    title: "Most Searched Songs",
    type: "playlist",
  },
  {
    link: "https://www.jiosaavn.com/featured/trending-today/I3kvhipIy73uCJW60TJk1Q__",
    title: "Trending Today",
    type: "playlist",
  },
  {
    link: "https://www.jiosaavn.com/featured/hindi-1990s/dSYq41esdPJAI5VmDfZSSg__",
    title: "Hindi 1990s",
    type: "playlist",
  },
  {
    link: "https://www.jiosaavn.com/featured/hindi-1970s/Pgp0Amd0LZnuCJW60TJk1Q__",
    title: "Hindi 1970s",
    type: "playlist",
  },
  {
    link: "https://www.jiosaavn.com/featured/hindi-1980s/,H6xc4W4ZikV3Xpvr9dnYw__",
    title: "Hindi 1980s",
    type: "playlist",
  },
  {
    link: "https://www.jiosaavn.com/featured/hindi-2000s/dSYq41esdPJwtkLw7-JlUw__",
    title: "Hindi 2000s",
    type: "playlist",
  },
  {
    link: "https://www.jiosaavn.com/featured/most-streamed-love-songs-hindi/RQKZhDpGh8uAIonqf0gmcg__",
    title: "Most Streamed Love Songs",
    type: "playlist",
  },
];

const SongCard = ({ song, onSongSelect }) => (
  <Card
    onClick={() => onSongSelect(song)}
    sx={{
      width: '100%',
      bgcolor: "#282828",
      cursor: "pointer",
      "&:hover": { bgcolor: "#383838" },
    }}
  >
    <CardMedia
      component="img"
      image={
        song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url
      }
      alt={song.name}
      sx={{ 
        width: '100%',
        aspectRatio: '1/1',
        objectFit: "cover"
      }}
    />
    <CardContent sx={{ p: 1.5 }}>
      <Typography variant="subtitle1" color="white" noWrap>
        {song.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap>
        {song.primaryArtists}
      </Typography>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, chart, onSongSelect }) => {
  const [playlistImage, setPlaylistImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchPlaylistDetails = async () => {
      try {
        setLoading(true);
        // First fetch to get playlist details and total songs
        const initialResponse = await axios.get(
          `https://saavn.dev/api/playlists?link=${encodeURIComponent(chart.link)}&page=1&limit=50`
        );
        
        if (initialResponse?.data?.data) {
          const playlistData = initialResponse.data.data;
          
          // Set playlist image
          if (playlistData.image) {
            setPlaylistImage(
              playlistData.image[2]?.url ||
              playlistData.image[1]?.url ||
              playlistData.image[0]?.url
            );
          }

          // Get total songs count and first batch of songs
          const totalSongs = playlistData.songCount || 0;
          let allSongs = [...(playlistData.songs || [])];
          
          // Fetch all remaining songs
          let currentPage = 2;
          while (allSongs.length < totalSongs) {
            try {
              const response = await axios.get(
                `https://saavn.dev/api/playlists?link=${encodeURIComponent(chart.link)}&page=${currentPage}&limit=50`
              );
              
              if (response?.data?.data?.songs?.length) {
                allSongs = [...allSongs, ...response.data.data.songs];
              } else {
                break; // Break if no more songs
              }
              
              currentPage++;
            } catch (error) {
              console.error(`Error fetching page ${currentPage}:`, error);
              break;
            }
          }

          // Set all songs to state
          setPlaylistSongs(allSongs);
        }
      } catch (error) {
        console.error("Error fetching playlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistDetails();
  }, [chart.link]);

  const handleClick = () => {
    setOpenModal(true);
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handlePlaySong = (index) => {
    const selectedSong = playlistSongs[index];
    const remainingSongs = [...playlistSongs.slice(index + 1), ...playlistSongs.slice(0, index)];
    onSongSelect(selectedSong, remainingSongs);
  };

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      const [firstSong, ...remainingSongs] = playlistSongs;
      onSongSelect(firstSong, remainingSongs);
    }
  };

  const handleShuffle = () => {
    if (playlistSongs.length > 0) {
      const shuffledSongs = shuffleArray(playlistSongs);
      const [firstSong, ...remainingSongs] = shuffledSongs;
      onSongSelect(firstSong, remainingSongs);
    }
  };

  return (
    <>
      <Card
        onClick={handleClick}
        className="clickable"
        sx={{
          height: '100%',
          bgcolor: '#282828',
          cursor: 'pointer',
          '&:hover': { bgcolor: '#383838' },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 1,
          width: '95%',
          maxHeight: { xs: 120, sm: 160 },
          m: 0.2,
          minWidth: { xs: '110px', sm: '150px' },
          maxWidth: { xs: '100px', sm: '140px' },
        }}
      >
        <Box sx={{ 
          position: 'relative',
          width: '100%',
          height: { xs: 80, sm: 120 },
          overflow: 'hidden',
        }}>
          {playlistImage && (
            <CardMedia
              component="img"
              image={playlistImage}
              alt={chart.title}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          )}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
              }}
            >
              <CircularProgress size={16} />
            </Box>
          )}
        </Box>
        <CardContent sx={{ 
          p: { xs: 0.5, sm: 0.8 },
          '&:last-child': { pb: { xs: 0.5, sm: 0.8 } },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: { xs: 35, sm: 40 },
          bgcolor: '#282828',
        }}>
          <Typography 
            variant="body2"
            component="div" 
            noWrap
            sx={{ 
              fontWeight: 500,
              fontSize: { xs: '0.65rem', sm: '0.7rem' },
              lineHeight: { xs: 1.1, sm: 1.2 },
              mb: 0.25,
              color: 'white',
              px: 0.5,
            }}
          >
            {chart.title}
          </Typography>
          <Typography 
            variant="caption"
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.55rem', sm: '0.6rem' },
              lineHeight: { xs: 1, sm: 1.1 },
              px: 0.5,
            }}
          >
            {playlistSongs.length} songs
          </Typography>
        </CardContent>
      </Card>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#282828", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {playlistImage && (
              <img
                src={playlistImage}
                alt={chart.title}
                style={{ width: 60, height: 60, objectFit: "cover" }}
              />
            )}
            <Box>
              <Typography variant="h6">{chart.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {playlistSongs.length} songs
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setOpenModal(false)}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#282828", p: 0 }}>
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handlePlayAll}
            >
              Play All
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ShuffleIcon />}
              onClick={handleShuffle}
            >
              Shuffle Play
            </Button>
          </Box>
          <List sx={{ width: "100%", bgcolor: "#282828" }}>
            {playlistSongs.map((song, index) => (
              <ListItem
                key={song.id}
                sx={{
                  "&:hover": {
                    bgcolor: "#383838",
                    "& .play-button": {
                      opacity: 1,
                    },
                  },
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    className="play-button"
                    onClick={() => handlePlaySong(index)}
                    sx={{
                      opacity: 0,
                      color: "primary.main",
                      transition: "opacity 0.2s",
                    }}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar
                    src={song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url}
                    alt={song.name}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={song.name}
                  secondary={song.primaryArtists}
                  sx={{ color: "white" }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};

const SwipeableSection = ({ title, songs, onSongSelect, onLoadMore, hasMore }) => {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  const handleNext = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleSongs = songs.slice(startIndex, endIndex);

  return (
    <Box sx={{ mb: { xs: 3, sm: 4 }, px: 1 }}>
      <Typography
        variant="h6"
        sx={{
          fontSize: { xs: '2rem', sm: '2.25rem' },
          fontWeight: 600,
          mb: { xs: 2, sm: 2.5 },
          color: '#4DC1CC',
        }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 2.5,
          maxWidth: '100%',
          overflowX: 'hidden',
          position: 'relative',
        }}
      >
        {visibleSongs.map((song) => (
          <Box
            key={song.id}
            sx={{
              width: '100%',
            }}
          >
            <SongCard song={song} onSongSelect={onSongSelect} />
          </Box>
        ))}

        {songs.length > itemsPerPage && (
          <>
            <IconButton
              onClick={handlePrev}
              disabled={currentPage === 0}
              sx={{
                position: 'absolute',
                left: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
                visibility: currentPage === 0 ? 'hidden' : 'visible',
              }}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              onClick={handleNext}
              disabled={endIndex >= songs.length}
              sx={{
                position: 'absolute',
                right: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
                visibility: endIndex >= songs.length ? 'hidden' : 'visible',
              }}
            >
              <ChevronRight />
            </IconButton>
          </>
        )}
      </Box>

      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            variant="text"
            color="primary"
            onClick={onLoadMore}
            sx={{ color: 'white' }}
          >
            Load More
          </Button>
        </Box>
      )}
    </Box>
  );
};

const Home = ({ onSongSelect, username }) => {
  const { topPlaylists, isLoading } = useTopPlaylists();
  const { recentlyPlayed } = useUserPreferences();
  const [categoryData, setCategoryData] = useState({});
  const [loading, setLoading] = useState({});
  const [pages, setPages] = useState({});
  const [hasMore, setHasMore] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const loadSongsForCategory = async (category, page = 1) => {
    if (loading[category.id]) return;

    setLoading((prev) => ({ ...prev, [category.id]: true }));
    try {
      const response = await axios.get(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(
          category.query
        )}&page=${page}&limit=20`
      );

      const newSongs = response.data?.data?.results || [];

      setCategoryData((prev) => ({
        ...prev,
        [category.id]:
          page === 1 ? newSongs : [...(prev[category.id] || []), ...newSongs],
      }));

      setPages((prev) => ({ ...prev, [category.id]: page }));
      setHasMore((prev) => ({
        ...prev,
        [category.id]: newSongs.length === 20,
      }));
    } catch (error) {
      console.error(`Error loading songs for ${category.title}:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [category.id]: false }));
    }
  };

  useEffect(() => {
    categories.forEach((category) => {
      loadSongsForCategory(category);
    });
  }, []);

  const handleLoadMore = (category) => {
    if (hasMore[category.id] && !loading[category.id]) {
      loadSongsForCategory(category, (pages[category.id] || 1) + 1);
    }
  };

  const handleChartClick = async (chart) => {
    try {
      const response = await axios.get(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(
          chart.query
        )}&limit=20`
      );
      const songs = response.data?.data?.results || [];
      if (songs.length > 0) {
        onSongSelect(songs[0], songs.slice(1));
      }
    } catch (error) {
      console.error("Error loading chart songs:", error);
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 3 },
      pb: { xs: 'calc(2rem + 90px)', sm: 'calc(3rem + 90px)' },
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw',
    }}>
      {/* Header section with search */}
      <Box sx={{ 
        mb: { xs: 3, sm: 4, md: 5 },
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(45deg, rgba(78,205,196,0.1), rgba(255,107,107,0.1))'
          : 'linear-gradient(45deg, #4ECDC4, #FF6B6B)',
        borderRadius: { xs: '0 0 24px 24px', sm: '32px' },
        p: { xs: 3, sm: 4 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Elements */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          transform: 'translate(30%, -30%)',
          pointerEvents: 'none'
        }} />

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          position: 'relative',
          zIndex: 1
        }}>
          <Box>
            <Typography 
              variant="h3" 
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                color: theme.palette.mode === 'dark' ? 'white' : 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                mb: 1
              }}
            >
              Welcome{username ? `, ${username}` : ''}
            </Typography>
            <Typography 
              variant="subtitle1"
              sx={{ 
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'white',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                maxWidth: '600px',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              Discover and enjoy your favorite music with our curated playlists and personalized recommendations
            </Typography>
          </Box>

          <Paper
            onClick={() => navigate('/search')}
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              p: '12px 24px',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box 
  sx={{
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: { xs: '120%', sm: '70%' },
    minWidth: { xs: '290px', sm: '600px' },
    margin: '0 auto'
  }}
>
  <SearchIcon sx={{ color: 'white', mr: 1 }} />
  <Typography 
    variant="body1" 
    sx={{ 
      color: 'white', 
      display: { xs: 'block', sm: 'block' }
    }}
  >
    Search for music...
  </Typography>
</Box>

          </Paper>
        </Box>
      </Box>

      {/* Top Charts section */}
      <Box sx={{ 
        mb: { xs: 3, sm: 4 },
        overflowX: 'hidden',
        px: 1,
      }}>
        <Typography 
          variant="h6"
          sx={{ 
            fontSize: { xs: '2rem', sm: '2.25rem' },
            fontWeight: 600,
            mb: { xs: 2, sm: 2.5 },
            color: '#4DC1CC',
          }}
        >
          Top Charts
        </Typography>

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: { xs: 1.5, md: 11 },
          maxWidth: '100%',
          overflowX: 'hidden',
        }}>
          {topCharts.map((chart) => (
            <Box
              key={chart.link}
              sx={{
                width: '100%',
              }}
            >
              <ChartCard 
                title={chart.title} 
                chart={chart} 
                onSongSelect={onSongSelect}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Recently Played section */}
      {recentlyPlayed?.length > 0 && (
        <Box sx={{ mt: { xs: 3, sm: 4, md: 5 } }}>
          <SwipeableSection
            title="Recently Played"
            songs={recentlyPlayed}
            onSongSelect={onSongSelect}
            onLoadMore={() => {}}
            hasMore={false}
          />
        </Box>
      )}

      {/* Categories section */}
      {categories.map((category) => (
        <SwipeableSection
          key={category.id}
          title={category.title}
          songs={categoryData[category.id] || []}
          onSongSelect={onSongSelect}
          onLoadMore={() => handleLoadMore(category)}
          hasMore={hasMore[category.id]}
        />
      ))}
    </Box>
  );
};

export default Home;