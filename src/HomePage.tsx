import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
    return (
        <div className="home-page">
            <div className="home-container">
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-content">
                        <div className="hero-icon">♟</div>
                        <h1 className="hero-title">
                            Vocal Chess
                        </h1>
                        <p className="hero-subtitle">
                            Experience chess like never before. Play with your voice, powered by AI.
                        </p>
                        <Link to="/game" className="cta-button">
                            <span>Start Playing</span>
                            <span className="arrow">→</span>
                        </Link>
                    </div>
                </section>

                {/* Game Modes Section */}
                <section className="features-section">
                    <h2 className="section-title">Choose Your Time Control</h2>
                    <div className="features-grid">
                        <Link to="/game" className="feature-card game-mode-card">
                            <div className="feature-icon">⚡</div>
                            <h3 className="feature-title">Bullet</h3>
                            <p className="time-control">1+0 • 2+1</p>
                            <p className="feature-description">
                                Lightning-fast games. Think quick, move faster.
                            </p>
                        </Link>

                        <Link to="/game" className="feature-card game-mode-card">
                            <div className="feature-icon">⏱️</div>
                            <h3 className="feature-title">Blitz</h3>
                            <p className="time-control">3+0 • 5+0</p>
                            <p className="feature-description">
                                Fast-paced action. Perfect balance of speed and strategy.
                            </p>
                        </Link>

                        <Link to="/game" className="feature-card game-mode-card">
                            <div className="feature-icon">🎯</div>
                            <h3 className="feature-title">Rapid</h3>
                            <p className="time-control">10+0 • 15+10</p>
                            <p className="feature-description">
                                Time to think. Strategic gameplay with comfortable pace.
                            </p>
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="home-footer">
                    <p>Built with React, TypeScript, and Transformers.js</p>
                </footer>
            </div>
        </div>
    );
};

export default HomePage;
