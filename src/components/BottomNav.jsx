import React from "react";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { Home, Search, LibraryMusic, Settings } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.elevated,
        backdropFilter: "blur(10px)",
      }}
      elevation={3}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={(_, newValue) => {
          navigate(newValue);
        }}
        sx={{
          bgcolor: "transparent",
          height: 65,
          "& .MuiBottomNavigationAction-root": {
            color: theme.palette.text.secondary,
            minWidth: "auto",
            padding: "6px 0",
            "&.Mui-selected": {
              color: theme.palette.primary.main,
              "& .MuiSvgIcon-root": {
                transform: "scale(1.1)",
              },
            },
            "& .MuiSvgIcon-root": {
              fontSize: "1.5rem",
              transition: "transform 0.2s",
            },
            "& .MuiBottomNavigationAction-label": {
              fontSize: "0.75rem",
              fontWeight: 500,
            },
          },
        }}
      >
        <BottomNavigationAction label="Home" value="/" icon={<Home />} />
        <BottomNavigationAction
          label="Search"
          value="/search"
          icon={<Search />}
        />
        <BottomNavigationAction
          label="Library"
          value="/library"
          icon={<LibraryMusic />}
        />
        <BottomNavigationAction
          label="Settings"
          value="/settings"
          icon={<Settings />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
