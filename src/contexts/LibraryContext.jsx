import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import axios from "axios";

const LibraryContext = createContext();

export const LibraryProvider = ({ children }) => {
  // Initialize state from localStorage
  const [storedPlaylists, setStoredPlaylists] = useLocalStorage("playlists", []);
  const [likedSongs, setLikedSongs] = useLocalStorage("likedSongs", []);
  
  // Keep a local state for immediate updates
  const [playlists, setPlaylists] = useState(storedPlaylists);

  // Sync local state with localStorage
  useEffect(() => {
    setPlaylists(storedPlaylists);
  }, [storedPlaylists]);

  // Sync localStorage with local state
  useEffect(() => {
    setStoredPlaylists(playlists);
  }, [playlists, setStoredPlaylists]);

  // Create a new playlist
  const createPlaylist = useCallback((name, song = null) => {
    if (!name.trim()) {
      console.error('Playlist name is required');
      return null;
    }

    const newPlaylist = {
      id: Date.now().toString(),
      name: name.trim(),
      songs: [],
      createdAt: new Date().toISOString(),
      thumbnail: null
    };

    console.log('Creating playlist:', newPlaylist);
    
    setPlaylists(prevPlaylists => {
      const updatedPlaylists = [...prevPlaylists, newPlaylist];
      console.log('Updated playlists:', updatedPlaylists);
      return updatedPlaylists;
    });

    return newPlaylist;
  }, []);

  // Add a song to a playlist
  const addToPlaylist = useCallback((playlistId, song) => {
    if (!song) {
      console.error('No song provided to add to playlist');
      return Promise.reject(new Error('No song provided'));
    }
    
    if (!playlistId) {
      console.error('No playlist ID provided');
      return Promise.reject(new Error('No playlist ID provided'));
    }

    return new Promise((resolve) => {
      setPlaylists(prevPlaylists => {
        const updatedPlaylists = prevPlaylists.map(playlist => {
          if (playlist.id === playlistId) {
            // Check if song already exists in playlist
            if (playlist.songs.some(s => s.id === song.id)) {
              return playlist;
            }

            // Create a new playlist with the added song
            const updatedPlaylist = {
              ...playlist,
              songs: [...playlist.songs, song],
              thumbnail: playlist.thumbnail || song.image?.[2]?.url
            };

            console.log('Adding song to playlist:', playlistId, 'Updated playlist:', updatedPlaylist);
            return updatedPlaylist;
          }
          return playlist;
        });

        // Resolve with the updated playlists
        resolve(updatedPlaylists);
        return updatedPlaylists;
      });
    });
  }, []);

  // Add multiple songs to a playlist at once
  const addSongsToPlaylist = useCallback((playlistId, songs) => {
    if (!Array.isArray(songs) || songs.length === 0) {
      console.error('No songs provided to add to playlist');
      return Promise.reject(new Error('No songs provided'));
    }
    
    if (!playlistId) {
      console.error('No playlist ID provided');
      return Promise.reject(new Error('No playlist ID provided'));
    }

    return new Promise((resolve) => {
      setPlaylists(prevPlaylists => {
        const updatedPlaylists = prevPlaylists.map(playlist => {
          if (playlist.id === playlistId) {
            // Filter out songs that already exist in the playlist
            const newSongs = songs.filter(song => 
              !playlist.songs.some(existingSong => existingSong.id === song.id)
            );

            if (newSongs.length === 0) {
              return playlist;
            }

            // Create a new playlist with all new songs added
            const updatedPlaylist = {
              ...playlist,
              songs: [...playlist.songs, ...newSongs],
              thumbnail: playlist.thumbnail || newSongs[0]?.image?.[2]?.url
            };

            console.log('Adding songs to playlist:', playlistId, 'Updated playlist:', updatedPlaylist);
            return updatedPlaylist;
          }
          return playlist;
        });

        // Resolve with the updated playlists
        resolve(updatedPlaylists);
        return updatedPlaylists;
      });
    });
  }, []);

  // Get a playlist by ID
  const getPlaylist = useCallback((playlistId) => {
    if (!playlistId) return null;
    console.log('Getting playlist:', playlistId, 'Current playlists:', playlists);
    const playlist = playlists.find(p => p.id === playlistId);
    console.log('Found playlist:', playlist);
    return playlist || null;
  }, [playlists]);

  // Remove a song from a playlist
  const removeFromPlaylist = useCallback((playlistId, songId) => {
    setPlaylists(prevPlaylists => {
      const updatedPlaylists = prevPlaylists.map(playlist => {
        if (playlist.id === playlistId) {
          const newSongs = playlist.songs.filter(song => song.id !== songId);
          // Update thumbnail if needed
          const thumbnail = newSongs.length > 0 ? newSongs[0].image?.[2]?.url : null;
          return {
            ...playlist,
            songs: newSongs,
            thumbnail,
          };
        }
        return playlist;
      });
      return updatedPlaylists;
    });
  }, []);

  // Delete an entire playlist
  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists(prevPlaylists => 
      prevPlaylists.filter(playlist => playlist.id !== playlistId)
    );
  }, []);

  // Like/Unlike a song
  const toggleLikeSong = useCallback((song) => {
    if (!song) return;

    setLikedSongs(prev => {
      const isLiked = prev.some((s) => s.id === song.id);
      if (isLiked) {
        return prev.filter((s) => s.id !== song.id);
      }
      return [...prev, { ...song, likedAt: new Date().toISOString() }];
    });
  }, [setLikedSongs]);

  // Check if a song is liked
  const isLiked = useCallback((songId) => {
    return likedSongs.some((song) => song.id === songId);
  }, [likedSongs]);

  const handleSongSelect = useCallback(async (song, songs = []) => {
    if (!song) return;
    try {
      if (!song.downloadUrl?.[0]?.url) {
        // Clean up song ID format
        const songId = song.id.replace(/^[a-zA-Z]+_/, "");

        try {
          const response = await axios.get(
            `https://saavn.dev/api/songs?id=${songId}`
          );
          const freshSong = response.data.data[0];
          if (freshSong) {
            // Process queue songs
            const updatedQueue = await Promise.all(
              songs.map(async (queueSong) => {
                if (!queueSong.downloadUrl?.[0]?.url) {
                  const queueId = queueSong.id.replace(/^[a-zA-Z]+_/, "");
                  try {
                    const songResponse = await axios.get(
                      `https://saavn.dev/api/songs?id=${queueId}`
                    );
                    return songResponse.data.data[0];
                  } catch (error) {
                    console.warn("Failed to fetch queue song:", queueSong.name);
                    return queueSong;
                  }
                }
                return queueSong;
              })
            );

            window.dispatchEvent(
              new CustomEvent("playSong", {
                detail: { song: freshSong, queue: updatedQueue },
              })
            );
          }
        } catch (error) {
          // If API call fails but song has URLs, use it directly
          if (song.downloadUrl?.[0]?.url) {
            window.dispatchEvent(
              new CustomEvent("playSong", {
                detail: { song, queue: songs },
              })
            );
          } else {
            throw error;
          }
        }
      } else {
        // If song already has URLs, dispatch it directly
        window.dispatchEvent(
          new CustomEvent("playSong", {
            detail: { song, queue: songs },
          })
        );
      }
    } catch (error) {
      console.error("Error handling song select:", error);
      alert("Unable to play this song. Please try another.");
    }
  }, []);

  const value = {
    playlists,
    likedSongs,
    createPlaylist,
    addToPlaylist,
    addSongsToPlaylist,
    getPlaylist,
    removeFromPlaylist,
    deletePlaylist,
    isLiked,
    toggleLikeSong,
    handleSongSelect,
  };

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
};
