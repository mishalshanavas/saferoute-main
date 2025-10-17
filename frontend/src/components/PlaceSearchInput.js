import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';

const PlaceSearchInput = ({ 
  placeholder, 
  value, 
  onChange, 
  onPlaceSelect, 
  className = "",
  gradientColor = "from-cyan-400 to-blue-400" 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Free geocoding API using Nominatim (OpenStreetMap)
  const searchPlaces = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=us,ca,gb,au,de,fr,it,es,nl,in,jp,cn`
      );
      const data = await response.json();
      
      const formattedSuggestions = data.map(place => ({
        id: place.place_id,
        name: place.display_name,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        address: place.display_name,
        type: place.type || 'location'
      }));
      
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (value) {
        searchPlaces(value);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handlePlaceSelect = (place) => {
    onChange(place.name);
    onPlaceSelect(place);
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handlePlaceSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        // Handle other keys
        break;
    }
  };

  const clearInput = () => {
    onChange('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <div className={`w-3 h-3 bg-gradient-to-r ${gradientColor} rounded-full shadow-lg`}></div>
          </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 bg-black/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          autoComplete="off"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          )}
          {value && !isLoading && (
            <button
              onClick={clearInput}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}
          <Search className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      
      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-black/95 border border-gray-600 rounded-xl backdrop-blur-md max-h-60 overflow-y-auto shadow-2xl"
          style={{
            zIndex: 999999
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-600 last:border-b-0 ${
                selectedIndex === index ? 'bg-gray-700' : 'bg-transparent'
              }`}
              onClick={() => handlePlaceSelect(suggestion)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate">
                    {suggestion.name.split(',')[0]}
                  </div>
                  <div className="text-gray-400 text-sm truncate">
                    {suggestion.address}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceSearchInput;