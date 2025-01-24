import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Snackbar
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
  { id: "trending", title: "Trending Now", query: "latest songs" },
  { id: "punjabi", title: "Punjabi Hits", query: "punjabi hits" },
  { id: "bollywood", title: "Bollywood Hits", query: "Top Bollywood Hits" },
  { id: "old songs", title: "Old Songs", query: "old hindi songs" },
];

const albumCategories = [
  { id: "new-releases", title: "New Releases", query: "new albums 2024" },
  { 
    id: "new-movies", 
    title: "Movie Albums", 
    type: "album",
    query: "new bollywood movie albums "
  },
  { id: "top-albums", title: "Top Albums", query: "best albums" },
  // { id: "featured-albums", title: "Featured Albums", query: "featured albums" },
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
  const containerRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);

  const handlePlayAll = (shuffle = false) => {
    if (!songs || songs.length === 0) return;
    
    let songsToPlay = [...songs];
    if (shuffle) {
      // Fisher-Yates shuffle
      for (let i = songsToPlay.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songsToPlay[i], songsToPlay[j]] = [songsToPlay[j], songsToPlay[i]];
      }
    }
    
    const [firstSong, ...remainingSongs] = songsToPlay;
    onSongSelect(firstSong, remainingSongs);
  };

  const checkScrollButtons = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft + clientWidth < scrollWidth);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [songs]);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <Box sx={{ mb: 4, position: 'relative', px: { xs: 2, sm: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2
      }}>
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontSize: { xs: '1.2rem', sm: '1.4rem' },
            fontWeight: 700,
            pl: 0.5
          }}
        >
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => handlePlayAll(false)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              textTransform: 'none',
              borderRadius: 3,
              px: 2,
              height: 32,
              minWidth: 80
            }}
          >
            Play all
          </Button>
          <IconButton 
            onClick={() => handlePlayAll(true)}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              width: 32,
              height: 32
            }}
          >
            <ShuffleIcon />
          </IconButton>
          <IconButton 
            onClick={() => scroll('left')}
            disabled={!showLeftScroll}
            sx={{ 
              color: 'white', 
              '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton 
            onClick={() => scroll('right')}
            disabled={!showRightScroll}
            sx={{ 
              color: 'white', 
              '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      <Box
        ref={containerRef}
        onScroll={checkScrollButtons}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(4, minmax(200px, 1fr))',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 2,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          pb: 1,
          WebkitOverflowScrolling: 'touch',
          gridAutoFlow: 'dense'
        }}
      >
        {songs.map((song) => (
          <Box
            key={song.id}
            onClick={() => onSongSelect(song)}
            sx={{
              display: 'flex',
              gap: 2,
              p: 1.5,
              bgcolor: 'rgba(255,255,255,0.05)',
              borderRadius: 1,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
              },
              scrollSnapAlign: 'start',
              minWidth: { xs: '200px', sm: '300px' }
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                overflow: 'hidden',
                flexShrink: 0,
                bgcolor: 'rgba(0,0,0,0.2)',
                position: 'relative'
              }}
            >
              <img
                src={
                  Array.isArray(song.image) && song.image.length > 0
                    ? song.image[song.image.length - 1].url // Get highest quality image (last in array)
                    : song.image?.url || song.downloadUrl?.[song.downloadUrl.length - 1]?.url || 'https://via.placeholder.com/48?text=Music'
                }
                alt={song.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  console.log('Image load error for:', song.name);
                  e.target.src = 'https://via.placeholder.com/48?text=Music';
                }}
                loading="lazy"
              />
            </Box>
            <Box sx={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2
                }}
              >
                {song.name}
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.8rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mt: 0.5
                }}
              >
                {song.primaryArtists}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const AlbumCard = ({ album, onAlbumSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const imageUrl = album.image?.[2]?.link || 
                  album.image?.[1]?.link || 
                  album.image?.[0]?.link ||
                  album.image?.[2]?.url ||
                  album.image?.[1]?.url ||
                  album.image?.[0]?.url;

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        setIsLoading(true);
        onAlbumSelect(album).finally(() => setIsLoading(false));
      }}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: { xs: 'none', sm: 'scale(1.05)' }
        }
      }}
    >
      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
        <Box
          component="img"
          src={imageUrl}
          alt={album.name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300?text=Album+Art';
          }}
          sx={{ 
            width: '100%',
            aspectRatio: '1/1',
            objectFit: 'cover',
            display: 'block',
            filter: isHovered ? 'brightness(0.7)' : 'brightness(1)',
            transition: 'filter 0.3s'
          }}
        />
        {isHovered && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              width: 35,
              height: 35,
              borderRadius: '50%',
              bgcolor: '#1DB954',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'scale(1)' : 'scale(0.8)',
              transition: 'all 0.2s',
            }}
          >
            <PlayArrowIcon sx={{ color: '#000', fontSize: 20 }} />
          </Box>
        )}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.5)',
            }}
          >
            <CircularProgress size={30} sx={{ color: 'white' }} />
          </Box>
        )}
      </Box>
      <Box sx={{ mt: 1, px: 0.5 }}>
        <Typography 
          variant="body1"
          sx={{
            color: 'white',
            fontWeight: 500,
            fontSize: '0.95rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.2,
            minHeight: '2.4em'
          }}
        >
          {album.name}
        </Typography>
        <Typography 
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.85rem',
            mt: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {album.primaryArtists || 'Various Artists'}
        </Typography>
      </Box>
    </Box>
  );
};

const AlbumSection = ({ title, albums, onAlbumSelect, onLoadMore, hasMore }) => {
  const theme = useTheme();
  const containerRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);

  const checkScrollButtons = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft + clientWidth < scrollWidth);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [albums]);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <Box sx={{ mb: 4, position: 'relative', px: { xs: 2, sm: 3 } }}>
      <Typography
        variant="h6"
        sx={{
          color: 'white',
          fontSize: { xs: '1.2rem', sm: '1.4rem' },
          fontWeight: 500,
          mb: 2,
          pl: 0.5
        }}
      >
        {title}
      </Typography>

      <Box sx={{ position: 'relative' }}>
        {showLeftScroll && (
          <IconButton
            onClick={() => scroll('left')}
            sx={{
              position: 'absolute',
              left: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              zIndex: 2,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}
        
        <Box
          ref={containerRef}
          onScroll={checkScrollButtons}
          sx={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: { 
              xs: '45%',
              sm: '30%',
              md: '23%',
              lg: '18%' 
            },
            gap: 2,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            pb: 1
          }}
        >
          {albums.map((album) => (
            <Box
              key={album.id}
              sx={{
                scrollSnapAlign: 'start',
              }}
            >
              <AlbumCard album={album} onAlbumSelect={onAlbumSelect} />
            </Box>
          ))}
        </Box>

        {showRightScroll && (
          <IconButton
            onClick={() => scroll('right')}
            sx={{
              position: 'absolute',
              right: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              zIndex: 2,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            <ChevronRight />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

const Home = ({ onSongSelect, username }) => {
  const { topPlaylists, isLoading } = useTopPlaylists();
  const { recentlyPlayed } = useUserPreferences();
  const [categoryData, setCategoryData] = useState({});
  const [albumData, setAlbumData] = useState({});
  const [loading, setLoading] = useState({});
  const [pages, setPages] = useState({});
  const [hasMore, setHasMore] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarStyle, setSnackbarStyle] = useState({
    width: '600px',
    left: '50%',
    transform: 'translateX(-50%)',
    top: '5%'
  });
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

  const loadAlbumsForCategory = async (category, page = 1) => {
    if (loading[category.id]) return;

    setLoading((prev) => ({ ...prev, [category.id]: true }));
    try {
      let response;
      if (category.type === 'album') {
        // For movie albums
        response = await axios.get(
          `https://saavn.dev/api/search/albums?query=${encodeURIComponent(
            category.query
          )}&page=${page}&limit=20`
        );
        const newAlbums = response.data?.data?.results || [];
        const movieAlbums = newAlbums.map(album => ({
          ...album,
          type: 'album'  // Mark as album for different routing
        }));

        setAlbumData((prev) => ({
          ...prev,
          [category.id]: page === 1 ? movieAlbums : [...(prev[category.id] || []), ...movieAlbums],
        }));
      } else {
        // For regular playlists
        response = await axios.get(
          `https://saavn.dev/api/search/playlists?query=${encodeURIComponent(
            category.query
          )}&page=${page}&limit=20`
        );
        const newAlbums = response.data?.data?.results || [];
        setAlbumData((prev) => ({
          ...prev,
          [category.id]: page === 1 ? newAlbums : [...(prev[category.id] || []), ...newAlbums],
        }));
      }

      setPages((prev) => ({ ...prev, [category.id]: page }));
      setHasMore((prev) => ({
        ...prev,
        [category.id]: (response.data?.data?.results || []).length === 20,
      }));
    } catch (error) {
      console.error(`Error loading albums for ${category.title}:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [category.id]: false }));
    }
  };

  const handleAlbumClick = (album) => {
    if (album.id) {
      if (album.type === 'album') {
        navigate(`/album/${album.id}`);  // Navigate to album page for movies
      } else {
        navigate(`/playlist/top/${album.id}`);  // Navigate to playlist page for others
      }
    }
  };

  // Load initial data
  useEffect(() => {
    categories.forEach((category) => {
      loadSongsForCategory(category);
    });
    
    albumCategories.forEach((category) => {
      loadAlbumsForCategory(category);
    });
  }, []); // Empty dependency array means this runs once on mount

  // Refresh albums every hour
  useEffect(() => {
    const refreshAlbums = () => {
      albumCategories.forEach((category) => {
        loadAlbumsForCategory(category);
      });
    };

    const intervalId = setInterval(refreshAlbums, 3600000); // 1 hour in milliseconds

    return () => clearInterval(intervalId);
  }, []);

  const musicMessages = [
    // Previous quotes remain the same, now adding 100 more

    // Zen and Music Quotes
    `🎵 Music is meditation,
    Rhythm is breath,
    Find your inner peace. 🧘‍♀️`,
    
    `🎶 In the symphony of chaos,
    Find your calm melody,
    Stay centered. 🌊`,
    
    `🎼 Silence between notes
    Is where true music
    Finds its voice. 🤫`,

    // Technology and Music Quotes
    `🎧 Digital beats,
    Analog souls,
    Music bridges worlds. 🌐`,
    
    `🎵 Algorithms create playlists,
    But emotions
    Choose the song. 💖`,
    
    `🎶 Technology amplifies,
    But passion
    Composes. 🎹`,

    // Emotional Depth Quotes
    `🎼 Some songs are memories,
    Some memories are songs,
    Keep them alive. 💭`,
    
    `🎧 Lyrics are unspoken words,
    Melodies are hidden feelings,
    Music understands. 💕`,
    
    `🎵 Every heartbreak
    Has a soundtrack,
    Healing happens. 🌈`,

    // Cultural Fusion Quotes
    `🎶 Music knows no borders,
    No language,
    Pure connection. 🤝`,
    
    `🎼 Rhythms from different lands,
    Harmonies of humanity,
    One world. 🌍`,
    
    `🎧 Traditional beats,
    Modern interpretations,
    Timeless art. 🎨`,

    // Personal Growth Quotes
    `🎵 Your playlist
    Is a map of your journey,
    Keep exploring. 🗺️`,
    
    `🎶 Change your music,
    Change your mood,
    Change yourself. 🔄`,
    
    `🎼 Lyrics are lessons,
    Beats are teachers,
    Learn constantly. 📚`,

    // Nature and Music Quotes
    `🎧 Music is like wind,
    Invisible yet powerful,
    Touching souls. 🍃`,
    
    `🎵 Ocean waves are rhythms,
    Forest sounds are melodies,
    Nature composes. 🌳`,
    
    `🎶 Birdsong at dawn,
    Crickets at night,
    Earth's playlist. 🌞`,

    // Philosophical Music Quotes
    `🎼 Music is time captured,
    Emotions preserved,
    Memories crystallized. ⏳`,
    
    `🎧 Notes are moments,
    Silence is reflection,
    Music is life. 💫`,
    
    `🎵 Beyond words,
    Beyond thoughts,
    Pure vibration. 🌠`,

    // Creativity and Inspiration
    `🎶 Every song is a story,
    Every artist a narrator,
    Keep creating. 🖌️`,
    
    `🎼 Creativity flows
    Like an endless melody,
    Never stop. 🌊`,
    
    `🎧 Inspiration is music,
    Waiting to be heard,
    Listen closely. 👂`,

    // Resilience and Music
    `🎵 When words break,
    Music bends,
    But never shatters. 💪`,
    
    `🎶 Rhythm is resistance,
    Melody is hope,
    Keep moving. 🚀`,
    
    `🎼 Broken hearts
    Make the most
    Beautiful songs. 💖`,

    // Mindfulness Quotes
    `🎧 Be present
    In each note,
    In each breath. 🧘‍♂️`,
    
    `🎵 Music is now,
    This moment,
    Pure awareness. ✨`,
    
    `🎶 Listen beyond hearing,
    Feel beyond touching,
    Music transcends. 🌈`,

    // Dreams and Aspirations
    `🎼 Your dreams
    Have a soundtrack,
    Play it loud. 🔊`,
    
    `🎧 Every great journey
    Begins with a song,
    Start singing. 🎤`,
    
    `🎵 Melodies are blueprints,
    Rhythms are steps,
    Build your future. 🏗️`,

    // Emotional Intelligence
    `🎶 Music reads emotions
    Before you understand them,
    Listen deeply. 💡`,
    
    `🎼 Some songs heal,
    Some songs hurt,
    Choose wisely. ⚖️`,
    
    `🎧 Emotional depth
    Is measured in
    Musical moments. 💕`,

    // Interconnectedness
    `🎵 We are all
    Part of one
    Great symphony. 🌐`,
    
    `🎶 Different instruments,
    Same orchestra,
    Harmony prevails. 🤝`,
    
    `🎼 Your unique sound
    Completes the
    Universal melody. 🌈`,

    // Self-Discovery
    `🎧 Music reveals
    What silence
    Keeps hidden. 🔍`,
    
    `🎵 Your favorite song
    Is a mirror
    Of your soul. 💫`,
    
    `🎶 Listen to music
    To understand
    Yourself better. 🌟`,

    // Motivation and Empowerment
    `🎼 Your life
    Is your playlist,
    Curate carefully. 📋`,
    
    `🎧 Some days are bass,
    Some are treble,
    Balance is key. ⚖️`,
    
    `🎵 Turn up the volume
    Of your potential,
    Silence the doubts. 🔊`,

    // Spiritual Connections
    `🎶 Music is prayer
    Without words,
    Pure devotion. 🙏`,
    
    `🎼 Vibrations connect
    Beyond physical realm,
    Feel the energy. ✨`,
    
    `🎧 Rhythm is breath,
    Melody is spirit,
    Music is sacred. 💖`,

    // Innovation and Creativity
    `🎵 Break the rules
    Of musical tradition,
    Create your genre. 🎸`,
    
    `🎶 Innovation sounds
    Like a melody
    No one's heard before. 🚀`,
    
    `🎼 Your unique sound
    Is your greatest
    Contribution. 🌟`,

    // Emotional Resilience
    `🎧 When words fail,
    Music speaks
    The unspeakable. 💬`,
    
    `🎵 Healing happens
    In musical
    Frequencies. 🌈`,
    
    `🎶 Embrace your pain,
    Transform it
    Into a song. 🎤`,

    // Cultural Appreciation
    `🎼 Music bridges
    Cultural divides,
    Universal language. 🌍`,
    
    `🎧 Every rhythm
    Tells a story
    Of its origin. 📖`,
    
    `🎵 Respect the roots,
    Celebrate the
    Musical diversity. 🌐`,

    // Personal Empowerment
    `🎶 Your voice
    Is an instrument,
    Play it proudly. 🎤`,
    
    `🎼 Confidence sounds
    Like a perfectly
    Tuned melody. 💫`,
    
    `🎧 Be the composer
    Of your life's
    Greatest symphony. 🌟`,

    `🎶 Your voice
  Is an instrument,
  Play it proudly. 🎤`,
  
`🎼 Confidence sounds
  Like a perfectly
  Tuned melody. 💫`,

`🎧 Be the composer
  Of your life's
  Greatest symphony. 🌟`,

`🎶 Find your rhythm,
  Let the world hear your song. 🎤`,
  
`🎼 Boldly play
  The music of your soul. 🎶`,

`🎧 Sing your heart out
  And let your spirit soar. 🌟`,

`🎵 Every note you hit
  Is a step to finding your harmony. 💫`,

`🎤 Let the melody
  Of your voice echo
  Through the universe. 🌌`,

`🎶 Confidence is your music,
  Let it play on and on. 🎼`,

`🌟 Your laughter is
  The sweetest symphony. 🎶`,

`🎧 Let the music
  Of your dreams guide your steps. 🎵`,

`🎤 Dance to the beat
  Of your own drum. 💃🏽`,

`🎵 Embrace the notes
  That make you, you. 🌟`,

`🎶 Your presence is a symphony
  In the making. 🎤`,

`🎼 Harmonize with the melodies
  Of kindness. 🎶`,

`🎧 Let your smile be
  The crescendo of your day. 💫`,

`🎤 In every silence,
  There's a song waiting. 🌟`,

`🎵 Your voice can light up
  The darkest nights. 🕯️`,

`🎼 Compose your life
  With love and joy. 🎷`,

`🎶 Sing loudly, dream fiercely. 🌌`,

`🎧 Your heart is a maestro,
  Trust its rhythm. 🎵`,

`🎤 Let your spirit resonate
  With hope. 💫`,

`🎼 Every heartbeat is a beat
  Of your life's music. 🌟`,

`🎶 Dance through challenges
  With grace. 💃🏽`,

`🎧 Weave your voice
  Into the tapestry of life. 🎵`,

`🎤 Sing through the rain,
  Rejoice in the sun. ☔🌞`,

`🎼 Your joy is the overture
  Of your journey. 🎶`,

`🎵 Let the world hear
  Your unique melody. 🌏`,

`🎶 Echoes of your laughter
  Carry love. 🌸`,

`🎧 Every word you say
  Is part of a masterpiece. 🎨`,

`🎤 Celebrate each moment
  Like a musical note. 🎼`,

`🎵 Let harmony be
  The foundation of your life. 🎶`,

`🌟 Voice your dreams,
  And let them soar. 🎧`,

`🎤 Sing out the beauty
  Within you. 🎵`,

`🎼 Create a symphony
  Of joy and peace. 🎶`,

`🎧 Embrace the rhythm
  Of your authentic self. 🥁`,

`🎤 Share your song
  With the world. 🌟`,

`🎶 Fill your life
  With songs of gratitude. 💫`,

`🎼 Love is the music
  That binds us all. 🌻`,

`🎤 Your dreams are a
  Beautiful melody. 🎵`,

`🎧 Let kindness be
  Your constant chorus. 🎼`,

`🎤 Be fearless,
  Be vocal, be you. 🌟`,

`🎵 Express the melody
  Of your heart. 🎧`,

`🎶 Bravery shines
  In your every note. 💫`,

`🎼 Let each day be
  A verse of joy. 🎶`,

`🎧 Your voice is powerful,
  Use it wisely. 🌟`,

`🎤 Resonate with positivity
  And strength. 🎵`,

`🎼 Follow the rhythm
  Of your true calling. 🌟`,

`🎧 Life's a song,
  Play it authentically. 🎶`,

`🎤 Compose a life
  You’re proud of. 🎼`,

`🎵 Speak with clarity
  And purpose. 🌟`,

`🎶 Celebrate the harmony
  In diversity. 🌍`,

`🎼 Your words are music,
  Make them count. 🎶`,

`🎤 Sing the song
  Of your dreams. 💫`,

`🎧 Let your voice create
  Ripples of change. 🌟`,

`🎵 Harmonize with
  Your surroundings. 🌸`,

`🎼 Every whisper carries
  A world of meaning. 🌼`,

`🎤 Amplify the good
  Within you. 🎧`,

`🎵 Joy resonates
  In every heartfelt note. 💫`,

`🎶 Be the anthem
  Of your aspirations. 🎼`,

`🎧 Tune out the noise,
  Listen to your inner song. 🌟`,

`🎤 Lend your voice
  To the harmonies of hope. 🎵`,

`🎼 Words become music
  When spoken with love. 💖`,

`🎶 Let the melody
  Of gratitude guide you. 🌠`,

`🎧 Sync your life
  With joy and peace. 🎼`,

`🎤 Voice the beauty
  And wonder within. 🎶`,

`🎵 Love echoes
  In every kind word. 🌻`,

`🎼 Sing your story,
  Share your journey. 🎶`,

`🎧 Play the soundtrack
  Of your passion. 🎸`,

`🎤 Let the rhythm of life
  Inspire you. 🎼`,

`🎶 Be a voice
  Of courage and compassion. 💫`,

`🎼 Turn your dreams
  Into songs of reality. 🌟`,

`🎧 Your voice carries
  The power to uplift. 🌼`,

`🎵 Every note you sing
  Is a step forward. 🎼`,

`🎶 Speak your truth
  With a harmonious heart. 🎧`,

`🎧 Life’s a melody,
  Let’s play it together. 🌟`,

`🎤 Sing through the challenges
  With strength. 🎵`,

`🎼 Let your heartbeats
  Be your music. 💫`,

`🎶 Create a chorus
  Of inspiration. 🌠`,

`🎧 Harmonize with
  The love around you. 🎼`,

`🎤 Serenade the world
  With your kindness. 🌟`,

`🎵 Sing the praises
  Of simplicity. 🌸`,

`🎼 Compose your life
  Like a beautiful symphony. 🎶`,

`🎧 Your words are
  The lyrics of your soul. 💫`,

`🎤 Voice your vision,
  Embrace your dreams. 🌟`,

`🎵 Let each day be
  A dance to your rhythm. 🎶`,

`🎼 Your kindness is
  The harmony we need. 🎼`,

`🎧 Play the song
  Of resilience. 🌟`,

`🎤 Let love be
  The chorus of your life. 🎵`,

`🎼 Fill each moment
  With notes of gratitude. 🌼`,

`🎶 Embrace your melody,
  It's uniquely yours. 💫`,

`🎧 Let your song
  Intertwine with others. 🎼`,

`🎤 Dance to the beat
  That moves your soul. 🎧`,

`🎵 Let your voice
  Light up the world. 🌟`,

`🎼 In every silence,
  A song is born. 🎶`,

  `🎶 Emit your inner light,
    Color the world
    With joy. 🌟`,

`🎤 Bloom where you are,
    Let your voice
    Blossom. 🌼`,

`🎼 Let your energy
    Be radiant and
    Vibrant. 🌠`,

`🎧 Embrace your journey,
    Paint it with
    Hope. 🎵`,

`🎵 Create a masterpiece
    Of love and
    Kindness. 💖`,
 `🎶 Your words are
    Brush strokes on
    Life's canvas. 🎨`,

`🎤 Shine with confidence,
    Illuminate your
    Path. ✨`,

`🎼 Harmonize with others,
    Together we create
    Beauty. 🌸`,

`🎧 Express yourself
    Freely and colorfully. 🎨`,

`🎵 Dream in vibrant hues,
    Live with joy. 🏵️`,

  ];

  // Function to generate a random vibrant color
  const generateVibrantColor = () => {
    const colors = [
      'rgba(156, 39, 176, 0.9)',   // Purple
      'rgba(33, 150, 243, 0.9)',   // Blue
      'rgba(244, 67, 54, 0.9)',    // Red
      'rgba(0, 230, 118, 0.9)',    // Green
      
      'rgba(103, 58, 183, 0.9)',   // Deep Purple
      'rgba(0, 150, 136, 0.9)' ,    // Teal
      'rgba(224, 64, 251, 0.9)',   /* Pinkish Purple */
      'rgba(41, 182, 246, 0.9)',    /* Light Blue */
      'rgba(244, 143, 177, 0.9)',  /* Pink */
      'rgba(76, 175, 80, 0.9)',    /* Light Green */
      
      'rgba(123, 31, 162, 0.9)',    /* Dark Purple */
      'rgba(0, 172, 193, 0.9)',     /* Cyan */
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 5) return 'Good Night!';
    if (currentHour < 8) return 'Good Morning!';
    if (currentHour < 12) return 'Good Morning!';
    if (currentHour < 14) return 'Good Afternoon!';
    if (currentHour < 17) return 'Good Afternoon!';
    if (currentHour < 19) return 'Good Evening!';
    if (currentHour < 22) return 'Good Evening!';
    return 'Good Night!';
};

  useEffect(() => {
    // Generate a random color for this Snackbar instance
    const dynamicColor = generateVibrantColor();
    
    // Get current time-based greeting
    const greeting = getTimeBasedGreeting();
    
    // Always show a message on component mount for testing
    const randomMessage = musicMessages[Math.floor(Math.random() * musicMessages.length)];
    
    // Personalize with username if available
    const fullMessage = username 
      ? `${greeting}, ${username}! 👋\n${randomMessage}` 
      : `${greeting}! 👋\n${randomMessage}`;
    
    console.log('Attempting to show message:', fullMessage);
    
    // Ensure state updates are processed
    const timer = setTimeout(() => {
      setSnackbarMessage(fullMessage);
      setOpenSnackbar(true);
      
      // Store the dynamic color for this Snackbar instance
      localStorage.setItem('currentSnackbarColor', dynamicColor);
      
      console.log('Snackbar should now be visible');
    }, 500);

    // Automatically close the Snackbar after 6 seconds
    const closeTimer = setTimeout(() => {
      setOpenSnackbar(false);
      console.log('Snackbar should now be closed');
    }, 6500);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [username]);

  useEffect(() => {
    const updateSnackbarStyle = () => {
      if (window.innerWidth < 600) {
        setSnackbarStyle({
          width: '90%',
          left: '50%',
          transform: 'translateX(-50%)',
          top: '5%'
        });
      } else {
        setSnackbarStyle({
          width: '600px',
          left: '50%',
          transform: 'translateX(-50%)',
          top: '5%'
        });
      }
    };

    // Initial setup
    updateSnackbarStyle();

    // Add event listener for window resize
    window.addEventListener('resize', updateSnackbarStyle);

    // Cleanup listener
    return () => window.removeEventListener('resize', updateSnackbarStyle);
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

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 800, fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }, color: theme.palette.mode === 'dark' ? 'white' : 'white', textShadow: '0 2px 4px rgba(0,0,0,0.1)', mb: 1 }}>
              Welcome{username ? `, ${username}` : ''}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'white', fontSize: { xs: '1rem', sm: '1.1rem' }, maxWidth: '600px', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              Discover and enjoy your favorite music with our curated playlists and personalized recommendations
            </Typography>
          </Box>

          <Paper onClick={() => navigate('/search')} elevation={0} sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '16px', p: '12px 24px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s ease-in-out', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: { xs: '120%', sm: '70%' }, minWidth: { xs: '290px', sm: '600px' }, margin: '0 auto' }}>
              <SearchIcon sx={{ color: 'white', mr: 1 }} />
              <Typography variant="body1" sx={{ color: 'white', display: { xs: 'block', sm: 'block' } }}>
                Search for music...
              </Typography>
            </Box>

          </Paper>
        </Box>
      </Box>

      {/* Top Charts section */}
      <Box sx={{ mb: { xs: 3, sm: 4 }, overflowX: 'hidden', px: 1 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '2rem', sm: '2.25rem' }, fontWeight: 600, mb: { xs: 2, sm: 2.5 }, color: '#4DC1CC' }}>
          Top Charts
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: { xs: 1.5, md: 11 }, maxWidth: '100%', overflowX: 'hidden' }}>
          {topCharts.map((chart) => (
            <Box key={chart.link} sx={{ width: '100%' }}>
              <ChartCard title={chart.title} chart={chart} onSongSelect={onSongSelect} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Recently Played section */}
      {recentlyPlayed?.length > 0 && (
        <Box sx={{ mt: { xs: 3, sm: 4, md: 5 } }}>
          <AlbumSection 
            title="Recently Played" 
            albums={recentlyPlayed.map(song => ({
              id: song.id,
              name: song.name,
              image: song.image,
              primaryArtists: song.primaryArtists,
              songs: [song]
            }))} 
            onAlbumSelect={(album) => onSongSelect(album.songs[0])}
            onLoadMore={() => {}}
            hasMore={false}
          />
        </Box>
      )}

      {/* Mix Categories and Albums */}
      {categories.map((category, index) => (
        <React.Fragment key={category.id}>
          <SwipeableSection
            title={category.title}
            songs={categoryData[category.id] || []}
            onSongSelect={onSongSelect}
            onLoadMore={() => handleLoadMore(category)}
            hasMore={hasMore[category.id]}
          />

          {/* Insert album category after each regular category */}
          {albumCategories[index] && (
            <AlbumSection
              key={albumCategories[index].id}
              title={albumCategories[index].title}
              albums={albumData[albumCategories[index].id] || []}
              onAlbumSelect={handleAlbumClick}
              onLoadMore={() => handleLoadMore(albumCategories[index])}
              hasMore={hasMore[albumCategories[index].id]}
            />
          )}
        </React.Fragment>
      ))}

      {/* Render remaining album categories */}
      {albumCategories.slice(categories.length).map((category) => (
        <AlbumSection
          key={category.id}
          title={category.title}
          albums={albumData[category.id] || []}
          onAlbumSelect={handleAlbumClick}
          onLoadMore={() => handleLoadMore(category)}
          hasMore={hasMore[category.id]}
        />
      ))}
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => { console.log('Snackbar closed'); setOpenSnackbar(false); }} message={snackbarMessage} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ zIndex: 9999, width: snackbarStyle.width, left: snackbarStyle.left, transform: snackbarStyle.transform, top: snackbarStyle.top, '& .MuiSnackbarContent-root': { minWidth: '300px', width: '100%', fontSize: '1.1rem', justifyContent: 'center', padding: '16px', borderRadius: '12px', backgroundColor: localStorage.getItem('currentSnackbarColor') || 'rgba(156, 39, 176, 0.9)', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', textAlign: 'center', fontStyle: 'italic', whiteSpace: 'pre-line', lineHeight: '1.5', wordWrap: 'break-word' } }} />
    </Box>
  );
};

export default Home;