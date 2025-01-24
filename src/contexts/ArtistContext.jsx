import React, { createContext, useContext, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const ArtistContext = createContext();

const TOP_ARTISTS = [
  {
    id: "459320",
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
    image: "https://c.saavncdn.com/artists/Yo_Yo_Honey_Singh_002_20221216102650_500x500.jpg",
    isVerified: true,
  },
  {
    id: "456863",
    name: "Badshah",
    image: "https://c.saavncdn.com/artists/Badshah_006_20241118064015_500x500.jpg",
    isVerified: true,
  },
  {
    id: "456269",
    name: "A.R. Rahman",
    image: "https://c.saavncdn.com/artists/AR_Rahman_002_20210120084455_500x500.jpg",
    isVerified: true,
  },
  {
    id: "565990",
    name: "Taylor Swift",
    image: "https://c.saavncdn.com/artists/Taylor_Swift_003_20200226074119_500x500.jpg",
    isVerified: true,
  },
  {
    id: "458918",
    name: "Raftaar",
    image: "https://c.saavncdn.com/artists/Raftaar_009_20230223100912_500x500.jpg",
    isVerified: true,
  },
  {
    id: "455109",
    name: "Lata Mangeshkar",
    image: "https://c.saavncdn.com/artists/Lata_Mangeshkar_500x500.jpg",
    isVerified: true,
  },
  {
    id: "455127",
    name: "Udit Narayan",
    image: "https://c.saavncdn.com/artists/Udit_Narayan_004_20241029065120_500x500.jpg",
    isVerified: true,
  },
  {
    id: "455130",
    name: "Shreya Ghoshal",
    image: "https://c.saavncdn.com/artists/Shreya_Ghoshal_500x500.jpg",
    isVerified: true,
  },
  {
    id: "881158",
    name: "Jubin Nautiyal",
    image: "https://c.saavncdn.com/artists/Jubin_Nautiyal_003_20231130204020_500x500.jpg",
    isVerified: true,
  },
  {
    id: "568565",
    name: "Justin Bieber",
    image: "https://c.saavncdn.com/artists/Justin_Bieber_005_20201127112218_500x500.jpg",
    isVerified: true,
  },
  {
    id: "458681",
    name: "Amitabh Bhattacharya",
    image: "https://c.saavncdn.com/artists/Amitabh_Bhattacharya_003_20241118063351_500x500.jpg",
    isVerified: true,
  },
  {
    id: "1335467",
    name: "Alan Walker",
    image: "https://c.saavncdn.com/artists/Alan_Walker_003_20231116095443_500x500.jpg",
    isVerified: true,
  },
  {
    id: "461968",
    name: "Sachin-Jigar",
    image: "https://c.saavncdn.com/artists/Sachin-Jigar_002_20180507092234_500x500.jpg",
    isVerified: true,
  },
  {
    id: "670466",
    name: "Madhubanti Bagchi",
    image: "https://c.saavncdn.com/artists/Madhubanti_Bagchi_003_20250124101814_500x500.jpg",
    isVerified: true,
  },
  {
    id: "473376",
    name: "Divya Kumar",
    image: "https://c.saavncdn.com/artists/Divya_Kumar_003_20241118064159_500x500.jpg",
    isVerified: true,
  },
  {
    id: "819413",
    name: "Anurag Saikia",
    image: "https://c.saavncdn.com/artists/Anurag_Saikia_000_20221220193444_500x500.jpg",
    isVerified: true,
  },
  {
    id: "3623112",
    name: "Sachet-Parampara",
    image: "https://c.saavncdn.com/artists/Sachet-Parampara_20190221095720_500x500.jpg",
    isVerified: true,
  },
  {
    id: "3623111",
    name: "Parampara Tandon",
    image: "https://c.saavncdn.com/artists/Parampara_Thakur_20191130070743_500x500.jpg",
    isVerified: true,
  },
  {
    id: "464474",
    name: "Manoj Tiwari",
    image: "https://c.saavncdn.com/artists/Manoj_Tiwari_500x500.jpg",
    isVerified: true,
  },
  {
    id: "4878402",
    name: "Anuv Jain",
    image: "https://c.saavncdn.com/artists/Anuv_Jain_001_20231206073013_500x500.jpg",
    isVerified: true,
  },
  {
    id: "878751",
    name: "Paradox",
    image: "https://c.saavncdn.com/artists/Paradox_000_20230315143733_500x500.jpg",
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

export const useArtists = () => {
  const context = useContext(ArtistContext);
  if (!context) {
    throw new Error("useArtists must be used within an ArtistProvider");
  }
  return context;
};

export default ArtistContext;
