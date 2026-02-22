// Modern Page Styles - Shared across all pages
// Based on SuperDesign & UI Audit best practices

export const pageStyles = {
  container: {
    padding: 'var(--space-8) var(--space-4)',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    padding: 'var(--space-12) 0',
  },
  title: {
    fontSize: 'var(--text-4xl)',
    fontWeight: '700',
    marginBottom: 'var(--space-3)',
    background: 'linear-gradient(135deg, #FFD700, #8B5CF6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: 'var(--text-lg)',
    color: 'var(--text-secondary)',
  },
  card: {
    background: 'var(--gradient-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-6)',
    marginBottom: 'var(--space-6)',
  },
  cardTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    marginBottom: 'var(--space-4)',
    color: 'var(--text-primary)',
  },
  input: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    outline: 'none',
  },
  buttonPrimary: {
    background: 'var(--gradient-gold)',
    color: 'var(--text-inverse)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-6)',
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 'var(--space-6)',
  },
};

// Export CSS string for injection
export const pageCSS = `
/* Modern Page Container */
.page-container {
  padding: var(--space-8) var(--space-4);
  max-width: 1200px;
  margin: 0 auto;
}

.page-header-modern {
  text-align: center;
  padding: var(--space-12) 0;
}

.page-badge {
  display: inline-block;
  background: oklch(55% 0.2 270 / 0.2);
  color: var(--color-gold);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-4);
}

.page-title-modern {
  font-size: var(--text-4xl);
  font-weight: 700;
  margin-bottom: var(--space-3);
  background: linear-gradient(135deg, #FFD700, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle-modern {
  font-size: var(--text-lg);
  color: var(--text-secondary);
}

/* Card Styles */
.card-glass {
  background: var(--gradient-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: all var(--transition-base);
}

.card-glass:hover {
  border-color: var(--border-default);
  transform: translateY(-2px);
}

.card-title-modern {
  font-size: var(--text-xl);
  font-weight: 600;
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

/* Form Elements */
.input-modern {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: oklch(15% 0.02 280);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: all var(--transition-fast);
}

.input-modern:focus {
  border-color: var(--color-purple);
  box-shadow: 0 0 0 3px oklch(55% 0.2 270 / 0.2);
  outline: none;
}

/* Quick Amount Buttons */
.quick-amount-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.quick-amount-btn {
  padding: var(--space-2) var(--space-3);
  background: oklch(15% 0.02 280);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-amount-btn:hover {
  background: oklch(25% 0.04 280);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

/* Stats Display */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-4);
}

.stat-box {
  background: oklch(15% 0.02 280);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  text-align: center;
}

.stat-label-modern {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-2);
}

.stat-value-modern {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-gold);
}

/* Prize List */
.prize-list-modern {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.prize-row-modern {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: oklch(15% 0.02 280);
  border-radius: var(--radius-md);
}

.prize-name-modern {
  font-size: var(--text-base);
  color: var(--text-primary);
}

.prize-percent-modern {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-gold);
}

/* Info List */
.info-list-modern {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.info-row-modern {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.info-label-modern {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.info-value-modern {
  color: var(--text-primary);
  font-weight: 500;
  font-size: var(--text-sm);
}

/* Warning Banner */
.warning-banner {
  background: oklch(60% 0.18 25 / 0.15);
  border: 1px solid oklch(60% 0.18 25 / 0.3);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  color: var(--color-error);
  text-align: center;
}

/* Success Banner */
.success-banner {
  background: oklch(65% 0.15 150 / 0.15);
  border: 1px solid oklch(65% 0.15 150 / 0.3);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  color: var(--color-success);
  text-align: center;
}

/* Tabs */
.tabs-modern {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-2);
}

.tab-modern {
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-base);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-bottom: 2px solid transparent;
  margin-bottom: -9px;
}

.tab-modern:hover {
  color: var(--text-primary);
}

.tab-modern.active {
  color: var(--color-gold);
  border-bottom-color: var(--color-gold);
}

/* Responsive */
@media (max-width: 768px) {
  .page-title-modern {
    font-size: var(--text-2xl);
  }
  
  .quick-amount-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
`;

export default pageStyles;
