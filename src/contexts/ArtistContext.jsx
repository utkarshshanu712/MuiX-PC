import React, { createContext, useContext, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const ArtistContext = createContext();

const TOP_ARTISTS = [
  {
    id: "455867",
    name: "Mukesh",
    image: "https://c.saavncdn.com/artists/Mukesh_500x500.jpg",
    isVerified: true,
  },
  {
    id: "464333",
    name: "Piyush Mishra",
    image:
      "https://c.saavncdn.com/artists/Piyush_Mishra_20200507093157_500x500.jpg",
    isVerified: true,
  },
  {
    id: "464932", // Neha Kakkar's correct ID
    name: "Neha Kakkar",
    image:
      "https://c.saavncdn.com/artists/Neha_Kakkar_006_20200822042626_500x500.jpg",
    isVerified: true,
  },
  {
    id: "459320", // Arijit Singh's ID
    name: "Arijit Singh",
    image: "https://c.saavncdn.com/artists/Arijit_Singh_500x500.jpg",
    isVerified: true,
  },
  {
    id: "455144",
    name: "Kishore Kumar",
    image: "https://c.saavncdn.com/artists/Kishore_Kumar_500x500.jpg",
    isVerified: true,
  },
  {
    id: "485956",
    name: "Yo Yo Honey Singh",
    image:
      "https://c.saavncdn.com/artists/Yo_Yo_Honey_Singh_002_20221216102650_500x500.jpg",
    isVerified: true,
  },
  {
    id: "456863", // Badshah's ID
    name: "Badshah",
    image:
      "https://c.saavncdn.com/artists/Badshah_006_20241118064015_500x500.jpg",
    isVerified: true,
  },
  {
    id: "456269", // Actual ID for Atif Aslam
    name: "A.R. Rahman",
    image:
      "https://c.saavncdn.com/artists/AR_Rahman_002_20210120084455_500x500.jpg",
    isVerified: true,
  },
  {
    id: "568565",
    name: "Justin Bieber",
    image:
      "https://c.saavncdn.com/artists/Justin_Bieber_005_20201127112218_500x500.jpg",
    isVerified: true,
  },
  {
    id: "458918",
    name: "Raftaar",
    image:
      "https://c.saavncdn.com/artists/Raftaar_009_20230223100912_500x500.jpg",
    isVerified: true,
  },
  {
    id: "455109",
    name: "Lata Mangeshkar",
    image: "https://c.saavncdn.com/artists/Lata_Mangeshkar_500x500.jpg",
    isVerified: true,
  },
  {
    id: "468245",
    name: "Diljit Dosanjh",
    image: "https://c.saavncdn.com/artists/Diljit_Dosanjh_500x500.jpg",
    isVerified: true,
  },
  {
    id: "578407",
    name: "Ed Sheeran",
    image: "https://c.saavncdn.com/artists/Ed_Sheeran_500x500.jpg",
    isVerified: true,
  },
  {
    id: "455130",
    name: "Shreya Ghoshal",
    image: "https://c.saavncdn.com/artists/Shreya_Ghoshal_500x500.jpg",
    isVerified: true,
  },
  {
    id: "455127",
    name: "Udit Narayan",
    image:
      "https://c.saavncdn.com/artists/Udit_Narayan_004_20241029065120_500x500.jpg",
    isVerified: true,
  },
  {
    id: "712878",
    name: "Guru Randhawa",
    image: "https://c.saavncdn.com/artists/Guru_Randhawa_500x500.jpg",
    isVerified: true,
  },
  {
    id: "464474",
    name: "Manoj Tiwari",
    image: "https://c.saavncdn.com/artists/Manoj_Tiwari_150x150.jpg",
    isVerified: true,
  },
];

export const ArtistProvider = ({ children }) => {
  const [followedArtists, setFollowedArtists] = useLocalStorage(
    "followedArtists",
    []
  );
  const [topArtists] = useState(TOP_ARTISTS);

  const followArtist = (artist) => {
    setFollowedArtists((prev) => {
      const isFollowing = prev.some((a) => a.id === artist.id);
      if (isFollowing) {
        return prev.filter((a) => a.id !== artist.id);
      }
      return [...prev, artist];
    });
  };

  const isFollowing = (artistId) => {
    return followedArtists.some((artist) => artist.id === artistId);
  };

  const value = {
    topArtists,
    followedArtists,
    followArtist,
    isFollowing,
  };

  return (
    <ArtistContext.Provider value={value}>{children}</ArtistContext.Provider>
  );
};

// Add this export
export const useArtists = () => {
  const context = useContext(ArtistContext);
  if (!context) {
    throw new Error("useArtists must be used within an ArtistProvider");
  }
  return context;
};

export default ArtistContext;
