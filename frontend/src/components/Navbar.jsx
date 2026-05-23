// frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ArrowRight } from 'lucide-react';
import api from '../api/axios';

const Navbar = ({ title }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search API Call
  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      try {
        const response = await api.get(`/leads/search?q=${query}`);
        setResults(response.data);
      } catch (error) {
        console.error('Failed to search leads:', error);
      }
    };

    const debounceId = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceId);
  }, [query]);

  const handleSelectLead = (id) => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    navigate(`/leads/${id}`);
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'NEW': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'INTERESTED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PROPOSAL_SHARED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PAYMENT_COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'RNR_DNP':
      case 'NOT_INTERESTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
      {/* Title */}
      <h2 className="text-xl font-bold text-slate-800 capitalize">{title}</h2>

      {/* Global Search Bar */}
      <div className="relative w-full max-w-md mx-4" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute inset-y-0 left-0 ml-3 h-5 w-5 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name or phone..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="absolute inset-y-0 right-0 mr-3 h-5 w-5 my-auto text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && results.length > 0 && (
          <div className="absolute left-0 mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 max-h-60 overflow-y-auto">
            {results.map((lead) => (
              <button
                key={lead.id}
                onClick={() => handleSelectLead(lead.id)}
                className="flex w-full items-center justify-between rounded-lg p-2.5 text-left text-sm hover:bg-slate-50 transition"
              >
                <div>
                  <div className="font-semibold text-slate-700">{lead.name}</div>
                  <div className="text-xs text-slate-400">{lead.phone}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStageColor(lead.stage)}`}>
                    {lead.stage}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute left-0 mt-2 w-full rounded-lg border border-slate-200 bg-white p-4 text-center text-sm text-slate-400 shadow-xl">
            No matches found for "{query}"
          </div>
        )}
      </div>

      {/* Notifications / Alerts Panel */}
      <div className="flex items-center space-x-4">
        <button className="relative rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
