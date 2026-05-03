import { useState, useEffect } from 'react';

const THEMES = ['ocean', 'dusk', 'ember'];
const DEFAULT_THEME = 'ocean';

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('nucleus-theme');
    return THEMES.includes(saved) ? saved : DEFAULT_THEME;
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('nucleus-theme', theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('nucleus-theme');
    const initial = THEMES.includes(saved) ? saved : DEFAULT_THEME;
    document.body.setAttribute('data-theme', initial);
  }, []);

  const setTheme = (t) => {
    if (THEMES.includes(t)) setThemeState(t);
  };

  return { theme, setTheme, themes: THEMES };
}
