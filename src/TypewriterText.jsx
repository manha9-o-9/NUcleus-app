import { useState, useEffect } from 'react';
import './index.css';

const TypewriterText = ({ text, delay = 50, onComplete }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);
      
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      // Trigger completion callback after a small buffer once typing is done
      const completionTimeout = setTimeout(onComplete, 1000);
      return () => clearTimeout(completionTimeout);
    }
  }, [currentIndex, delay, text, onComplete]);

  return (
    <p className="typewriter-text">
       {currentText}
       <span className="cursor">|</span>
    </p>
  );
};

export default TypewriterText;
