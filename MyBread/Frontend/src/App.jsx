import { useState } from 'react';
import StocksPage from './stocks/StocksPage';
import './App.css';

function App() {
    const [currentPage, setCurrentPage] = useState('Stocks');
    const [menuOpen, setMenuOpen] = useState(false);

    const pages = [
        'Dashboard',
        'Lessons',
        'Stocks',
        'Achievements'
    ];

    return (
        <div className="mybread-app">
            <aside className="mybread-sidebar">
                <div className="mybread-sidebar-header">
                    <h2 className="mybread-brand">MyBread</h2>
                    <button
                        type="button"
                        className="mybread-menu-toggle"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        aria-controls="mybread-navigation"
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>
                </div>
                <nav
                    id="mybread-navigation"
                    className={`mybread-navigation ${menuOpen ? 'is-open' : ''}`}
                    aria-label="Main navigation"
                >
                    {pages.map((page) => (
                        <button
                            key={page}
                            type="button"
                            className={
                                currentPage === page
                                    ? 'mybread-nav-link active'
                                    : 'mybread-nav-link'
                            }
                            aria-current={
                                currentPage === page
                                    ? 'page'
                                    : undefined
                            }
                            onClick={() => {
                                setCurrentPage(page);
                                setMenuOpen(false);
                            }}
                            >
                            {page}
                        </button>
                    ))}
                </nav>
                <div className="mybread-sidebar-footer">
                    <div>XP: —</div>
                    <div>Coins: —</div>
                </div>
            </aside>
            <main className="mybread-main">
                {currentPage === 'Stocks' ? (
                    <StocksPage />
                ) : (
                    <section className="mybread-placeholder">
                        <h1>{currentPage}</h1>
                    </section>
                )}
            </main>
        </div>
    );
}

export default App;