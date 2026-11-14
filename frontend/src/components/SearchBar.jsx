import React, { useState } from 'react';
import { Search, Phone, Globe, CreditCard, Landmark, Wallet, Sparkles, X } from 'lucide-react';

export const detectEntityType = (query) => {
  const trimmed = query.trim();
  if (!trimmed) return 'auto';

  // Crypto wallet: starts with 0x (ETH/BSC) or bc1 / 1 / 3 (BTC)
  if (/^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,90})$/.test(trimmed)) {
    return 'wallet';
  }

  // URL / Domain: contains http or www or has domain extension
  if (/^(https?:\/\/|www\.)/i.test(trimmed) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return 'url';
  }

  // UPI ID: contains @ (e.g. xyz@okaxis, abc@paytm)
  if (/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(trimmed)) {
    return 'bank';
  }

  // Phone number: starts with + or contains 10-13 digits
  const cleanPhone = trimmed.replace(/[\s\-\(\)]/g, '');
  if (/^\+?[0-9]{10,14}$/.test(cleanPhone)) {
    return 'phone';
  }

  // Bank account: digits between 9 and 18
  if (/^\d{9,18}$/.test(trimmed)) {
    return 'bank';
  }

  return 'auto';
};

export const SearchBar = ({ onSearch, initialQuery = '', initialType = 'auto', placeholder = 'Enter Phone (+91...), URL, UPI/Bank Account, or Crypto Wallet...' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const detectedType = detectEntityType(query);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const finalType = type === 'auto' ? (detectedType === 'auto' ? 'phone' : detectedType) : type;
    onSearch({ query: query.trim(), type: finalType, detectedType });
  };

  const handleClear = () => {
    setQuery('');
  };

  const typeOptions = [
    { id: 'auto', label: 'Auto Detect', icon: Sparkles },
    { id: 'phone', label: 'Phone', icon: Phone },
    { id: 'url', label: 'URL / Domain', icon: Globe },
    { id: 'bank', label: 'Bank / UPI', icon: Landmark },
    { id: 'wallet', label: 'Crypto Wallet', icon: Wallet },
  ];

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '6px 12px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'border-color 0.2s',
          }}
          className="search-bar-container"
        >
          <div style={{ color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
            <Search size={20} />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontFamily: 'inherit',
              padding: '10px 8px',
            }}
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '6px',
              }}
            >
              <X size={16} />
            </button>
          )}

          {type === 'auto' && detectedType !== 'auto' && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--primary-accent)',
                backgroundColor: 'var(--primary-accent-light)',
                padding: '4px 8px',
                borderRadius: '6px',
                marginRight: '8px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={11} />
              Detected: {detectedType}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Investigate
          </button>
        </div>

        {/* Type selector tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            flexWrap: 'wrap',
          }}
        >
          {typeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = type === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setType(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--primary-accent)' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--primary-accent-light)' : '#FFFFFF',
                  color: isSelected ? 'var(--primary-accent)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={13} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
