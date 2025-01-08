import React, { useState, useEffect } from "react";
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
  { id: "trending", title: "Trending Now", query: "trending songs" },
  { id: "punjabi", title: "Punjabi Hits", query: "punjabi hits" },
  { id: "bollywood", title: "Bollywood Hits", query: "bollywood hits" },
  { id: "romantic", title: "Romantic Hits", query: "romantic hindi songs" },
  { id: "party", title: "Party Hits", query: "party songs hindi" },
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

const ScrollableSection = ({ title, songs, onSongSelect, onLoadMore, hasMore }) => {
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
        }}
      >
        {songs.map((song) => (
          <Box
            key={song.id}
            sx={{
              width: '100%',
            }}
          >
            <SongCard song={song} onSongSelect={onSongSelect} />
          </Box>
        ))}
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
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between',
        mb: { xs: 2, sm: 4 },
        width: '100%',
        px: 1,
      }}>
        <Box>
          <Typography 
            variant="h5"
            component="h1" 
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 700,
              mb: 1,
              color: 'white',
              ml:4
            }}
          >
            Hi {username}
          </Typography>
          <Typography 
            variant="subtitle1"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              color: 'rgba(255, 255, 255, 0.7)',
              ml:4
            }}
          >
            Discover your favorite music
          </Typography>
        </Box>

        <Paper
          onClick={() => navigate('/search')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            p: '8px 20px',
            mt: 4,
            mr: 1,
            cursor: 'pointer',
            width: { xs: '120px', sm: 'auto' },
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.15)',
            },
          }}
        >
          <SearchIcon sx={{ color: 'white', mr: 1, fontSize: '1.5rem' }} />
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', fontSize: '1rem', }} > {isMobile ? 'Search... ' : 'What do you want to play? Search it and enjoy your Favorite music . . . . . . . . .'} </Typography>
        </Paper>
      </Box>

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
          gap: 1.5,
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

      {recentlyPlayed.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '2rem', sm: '2.25rem' },
              fontWeight: 600,
              mb: { xs: 2, sm: 2.5 },
              color: '#4DC1CC',
            }}
          >
            Recently Played
          </Typography>
          <Grid container spacing={2}>
            {recentlyPlayed.slice(0, 6).map((song) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={song.id}>
                <SongCard song={song} onSongSelect={onSongSelect} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {categories.map((category) => (
        <ScrollableSection
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
