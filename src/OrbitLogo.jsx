import './OrbitLogo.css';

const OrbitLogo = () => {
  return (
    <div className="orbit-container">
      
      {/* Intersecting Orbit Rings */}
      <div className="ring ring-horizontal">
        <div className="orbiting-star"></div>
      </div>
      <div className="ring ring-diagonal-right"></div>
      <div className="ring ring-diagonal-left"></div>

      {/* Central Interactive Core */}
      <div className="logo-core">
        <span className="logo-letter">N</span>
        <span className="logo-letter">U</span>
        <div className="logo-sparkle"></div>
      </div>

    </div>
  );
};

export default OrbitLogo;
