import React, { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import axios from "axios";

const LibraryContext = createContext();

export const LibraryProvider = ({ children }) => {
  const [playlists, setPlaylists] = useLocalStorage("playlists", []);
  const [likedSongs, setLikedSongs] = useLocalStorage("likedSongs", []);

  // Check if a song is in library
  const isInLibrary = (song) => {
    if (!song?.id) return false;
    return likedSongs.some((likedSong) => likedSong.id === song.id);
  };

  // Add song to library
  const addToLibrary = (song) => {
    if (!song) return;
    if (isInLibrary(song)) return;
    setLikedSongs((prev) => [...prev, song]);
  };

  // Remove song from library
  const removeFromLibrary = (song) => {
    if (!song) return;
    setLikedSongs((prev) => prev.filter((s) => s.id !== song.id));
  };

  // Create a new playlist
  const createPlaylist = (name, song = null) => {
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

    setPlaylists((prev) => [...prev, newPlaylist]);
    console.log('Created new playlist:', newPlaylist);
    return newPlaylist;
  };

  // Add a song to a playlist
  const addToPlaylist = (playlistId, song) => {
    if (!song) {
      console.error('No song provided to add to playlist');
      return;
    }
    
    if (!playlistId) {
      console.error('No playlist ID provided');
      return;
    }
    
    setPlaylists((prev) => {
      const updatedPlaylists = prev.map((playlist) => {
        if (playlist.id === playlistId) {
          // Check if song already exists in playlist
          if (playlist.songs.some(s => s.id === song.id)) {
            return playlist;
          }
          return {
            ...playlist,
            songs: [...playlist.songs, song],
            thumbnail: playlist.thumbnail || song.image?.[0]?.url
          };
        }
        return playlist;
      });
      return updatedPlaylists;
    });
  };

  // Get a playlist by ID
  const getPlaylist = (playlistId) => {
    if (!playlistId) return null;
    return playlists.find((p) => p.id === playlistId) || null;
  };

  // Remove a song from a playlist
  const removeFromPlaylist = (playlistId, songId) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id === playlistId) {
          const newSongs = playlist.songs.filter((song) => song.id !== songId);
          // Update thumbnail if needed
          const thumbnail =
            newSongs.length > 0 ? newSongs[0].image?.[2]?.url : null;
          return {
            ...playlist,
            songs: newSongs,
            thumbnail,
          };
        }
        return playlist;
      })
    );
  };

  // Delete an entire playlist
  const deletePlaylist = (playlistId) => {
    setPlaylists((prev) =>
      prev.filter((playlist) => playlist.id !== playlistId)
    );
  };

  // Like/Unlike a song
  const toggleLikeSong = (song) => {
    if (!song) return;

    setLikedSongs((prev) => {
      const isLiked = prev.some((s) => s.id === song.id);
      if (isLiked) {
        return prev.filter((s) => s.id !== song.id);
      }
      return [...prev, { ...song, likedAt: new Date().toISOString() }];
    });
  };

  // Check if a song is liked
  const isLiked = (songId) => {
    return likedSongs.some((song) => song.id === songId);
  };

  const handleSongSelect = async (song, songs = []) => {
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
  };

  const value = {
    playlists,
    likedSongs,
    createPlaylist,
    addToPlaylist,
    getPlaylist,
    removeFromPlaylist,
    deletePlaylist,
    toggleLikeSong,
    handleSongSelect,
    isLiked,
    isInLibrary,
    addToLibrary,
    removeFromLibrary
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
