import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [coverImage, setCoverImage] = useState('');
  const defaultCover = process.env.PUBLIC_URL + '/logo.png';

  const titleRef = useRef(null);
  const artistRef = useRef(null);

  const [isTitleScrollable, setIsTitleScrollable] = useState(false);
  const [isArtistScrollable, setIsArtistScrollable] = useState(false);

  // Mappa dei programmi e relative copertine locali
  const programCovers = {
    'Morning Show': process.env.PUBLIC_URL + '/program_covers/Morning Show.jpg',
    'Jazz Hour': process.env.PUBLIC_URL + '/program_covers/Jazz Hour.jpg',
    'Rock Wave': process.env.PUBLIC_URL + '/program_covers/Rock Wave.jpg'
  };

  // Recupera il brano corrente
  useEffect(() => {
    const fetchCurrentSong = async () => {
      try {
        const response = await fetch('https://api.laut.fm/station/radiopiave/current_song');
        const data = await response.json();
        setCurrentSong(data);
      } catch (error) {
        console.error('Errore nel recupero del brano corrente:', error);
      }
    };

    fetchCurrentSong();
    const interval = setInterval(fetchCurrentSong, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (titleRef.current) {
      setIsTitleScrollable(titleRef.current.scrollWidth > titleRef.current.clientWidth);
    }
    if (artistRef.current) {
      setIsArtistScrollable(artistRef.current.scrollWidth > artistRef.current.clientWidth);
    }
  }, [currentSong]);

  const getClosestProgramCover = (programTitle) => {
    if (!programTitle) return defaultCover;

    const normalizedTitle = programTitle.toLowerCase().trim();
    for (const key in programCovers) {
      if (normalizedTitle.includes(key.toLowerCase())) {
        return programCovers[key];
      }
    }

    return defaultCover;
  };

  const fetchLastFmCover = async (artist, track) => {
    const apiKey = process.env.REACT_APP_LASTFM_API_KEY;
    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data?.track?.album?.image) {
        const cover = data.track.album.image.find((img) => img.size === 'extralarge');
        return cover ? cover['#text'] : null;
      }
    } catch (error) {
      console.error('Errore nella chiamata a Last.fm:', error);
    }
    return null;
  };

  useEffect(() => {
    const updateCoverImage = async () => {
      const programTitle = currentSong?.title || '';
      const artistOrSecondLine = currentSong?.artist?.name || '';

      // Cerca la copertina per il programma
      const localCover = getClosestProgramCover(`${programTitle} ${artistOrSecondLine}`);
      if (localCover !== defaultCover) {
        setCoverImage(localCover);
        return;
      }

      // Se non trova una copertina locale, utilizza Last.fm
      if (currentSong?.artist?.name && currentSong?.title) {
        const cover = await fetchLastFmCover(currentSong.artist.name, currentSong.title);
        setCoverImage(cover || defaultCover);
      } else {
        setCoverImage(defaultCover);
      }
    };

    updateCoverImage();
  }, [currentSong]);

  return (
    <div className="App">
      <header>
        <h1>Radio Piave</h1>
      </header>
      <main>
        {currentSong ? (
          <div className="song-info">
            <img
              src={coverImage}
              alt={currentSong.title || 'Radio Piave'}
              className="cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultCover;
              }}
            />
            <div
              className={`marquee-container ${isTitleScrollable ? 'scrollable' : ''}`}
              ref={titleRef}
            >
              <span>{currentSong.title || 'Ora in onda'}</span>
            </div>
            <div
              className={`marquee-container ${isArtistScrollable ? 'scrollable' : ''}`}
              ref={artistRef}
            >
              <span>{currentSong.artist?.name || 'Artista sconosciuto'}</span>
            </div>
          </div>
        ) : (
          <p>Caricamento in corso...</p>
        )}
        <audio controls src="https://stream.laut.fm/radiopiave"></audio>
      </main>
      <footer>
        <p>&copy; 2024 Radio Piave. Tutti i diritti riservati.</p>
      </footer>
    </div>
  );
}

export default App;
