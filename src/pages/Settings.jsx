import React from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Link,
  IconButton,
  Avatar,
  Button,
  Grid,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import CodeIcon from "@mui/icons-material/Code";
import { useSettings } from "../contexts/SettingsContext";
import { useThemeContext } from "../contexts/ThemeContext";

const Settings = () => {
  const {
    streamingQuality,
    setStreamingQuality,
    downloadQuality,
    setDownloadQuality,
    qualityOptions,
  } = useSettings();

  const { themeMode, setThemeMode, themeOptions } = useThemeContext();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        overflow: "auto",
        bgcolor: "background.default",
        color: "text.primary",
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          background: "rgba(255, 255, 255, 0.1)",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255, 255, 255, 0.3)",
          borderRadius: "4px",
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          maxWidth: 800,
          mx: "auto",
          pb: { xs: 16, sm: 12 }, // Increased bottom padding for player and navbar
        }}
      >
        <Typography variant="h4" sx={{ mb: 4 }}>
          Settings
        </Typography>

        {/* Audio Quality Settings - Moved to top */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            Audio Quality
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="streaming-quality-label">
              Streaming Quality
            </InputLabel>
            <Select
              labelId="streaming-quality-label"
              value={streamingQuality}
              onChange={(e) => setStreamingQuality(e.target.value)}
            >
              {qualityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              Higher quality uses more data
            </Typography>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="download-quality-label">
              Download Quality
            </InputLabel>
            <Select
              labelId="download-quality-label"
              value={downloadQuality}
              onChange={(e) => setDownloadQuality(e.target.value)}
            >
              {qualityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              Higher quality files take up more storage
            </Typography>
          </FormControl>
        </Paper>

        {/* Theme Selection - Moved below audio settings */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            Theme
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(themeOptions).map(([key, themeOption]) => (
              <Grid item xs={6} sm={4} md={3} key={key}>
                <Button
                  fullWidth
                  variant={themeMode === key ? "contained" : "outlined"}
                  onClick={() => setThemeMode(key)}
                  sx={{
                    height: 100,
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: themeOption.palette.background.default,
                    color: themeOption.palette.text.primary,
                    border: `2px solid ${
                      themeMode === key
                        ? themeOption.palette.primary.main
                        : "rgba(255,255,255,0.1)"
                    }`,
                    "&:hover": {
                      bgcolor: themeOption.palette.background.paper,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "60%",
                      background: themeOption.palette.gradient,
                      mb: 1,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "inherit" }}>
                    {themeOption.name}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Updated About Section */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 3,
            bgcolor: "rgba(40, 40, 40, 0.95)",
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" gutterBottom>
            About MuiX
          </Typography>
          <Typography variant="body1" paragraph>
            MuiX is a modern music streaming platform that brings your favorite
            tunes right to your fingertips. With a sleek interface and powerful
            features, it's designed to make your music experience seamless and
            enjoyable.
          </Typography>
          <Typography variant="body1" paragraph>
            Key Features:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li">🎵 Instant music search</Typography>
            <Typography component="li">🎨 Beautiful, responsive UI</Typography>
            <Typography component="li">
              📱 Cross-platform compatibility
            </Typography>
            <Typography component="li">
              🎧 High-quality audio streaming
            </Typography>
            <Typography component="li">💫 Personalized experience</Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" gutterBottom>
            Developer
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
              <img
                src="https://github.com/utkarshshanu712.png"
                alt="UK"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Avatar>
            <Box>
              <Typography variant="h6">Utkarsh Kumar</Typography>
              <Typography variant="body2" color="text.secondary">
                Full Stack Developer
              </Typography>
            </Box>
          </Box>

          <Typography variant="body1" paragraph>
            I'm a passionate developer with expertise in web and desktop
            application development. Have a great day! 😊 Feel free to connect
            with me on LinkedIn or reach out via email. I'm always open to
            discussing new projects and ideas!
          </Typography>

          <Typography
            variant="body1"
            sx={{ fontStyle: "italic", color: "text.secondary", mb: 3 }}
          >
            "In coding, sometimes things break, but our spirit doesn't!" 💪
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <IconButton
              component={Link}
              href="mailto:shanuutkarsh712@gmail.com"
              color="primary"
              title="Email"
              target="_blank"
            >
              <EmailIcon />
            </IconButton>
            <IconButton
              component={Link}
              href="https://linkedin.com/in/utkarsh-kumar-8344b1337"
              color="primary"
              title="LinkedIn"
              target="_blank"
            >
              <LinkedInIcon />
            </IconButton>
            <IconButton
              component={Link}
              href="https://github.com/utkarshshanu712"
              color="primary"
              title="GitHub"
              target="_blank"
            >
              <GitHubIcon />
            </IconButton>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" gutterBottom>
            Technical Details
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CodeIcon color="primary" />
            <Typography variant="body1">
              Built with React, Material-UI, and ❤️
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Settings;
