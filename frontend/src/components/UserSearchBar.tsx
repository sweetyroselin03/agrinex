import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, MapPin, Users, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useSocialStore, type UserSearchItem } from '../store/useSocialStore';
import FollowButton from './FollowButton';

interface UserSearchBarProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSelectUser?: (user: UserSearchItem) => void;
}

export default function UserSearchBar({
  placeholder = 'Search farmers by name, username, village, or crops...',
  className = '',
  autoFocus = false,
  onSelectUser,
}: UserSearchBarProps) {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, performSearch, searchResults, isSearching, clearSearch } = useSocialStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search logic (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch(searchQuery);
        setIsOpen(true);
      } else {
        clearSearch();
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserClick = (userId: number, user: UserSearchItem) => {
    setIsOpen(false);
    if (onSelectUser) {
      onSelectUser(user);
    }
    navigate(`/profile/${userId}`);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
        <input
          type="text"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0 || searchQuery.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-xs font-medium text-brandDark outline-none transition-all placeholder:text-slate-400 shadow-sm"
        />
        {searchQuery ? (
          <button
            onClick={() => {
              clearSearch();
              setIsOpen(false);
            }}
            className="absolute right-3.5 p-1 text-slate-400 hover:text-brandDark rounded-full hover:bg-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        ) : isSearching ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin absolute right-4" />
        ) : null}
      </div>

      {/* Dropdown Overlay Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-6 text-center text-xs text-textSec flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Searching AgriNex directory...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-6 text-center text-xs text-textSec">
              <p className="font-semibold text-brandDark">No matching users found.</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching by full name, username, or email address.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              <div className="px-4 py-2 bg-slate-50/80 text-[10px] font-bold text-textSec uppercase tracking-wider flex justify-between items-center">
                <span>Farmer Results ({searchResults.length})</span>
                <span className="text-[9px] text-slate-400">Click to visit profile</span>
              </div>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id, user)}
                  className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatar_url || user.profile_photo || user.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`}
                      alt={user.display_name || user.full_name || 'farmer'}
                      className="w-11 h-11 rounded-full border border-slate-200 object-cover bg-slate-50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-brandDark truncate group-hover:text-primary transition-colors">
                          {user.display_name || user.full_name || 'Farmer'}
                        </h4>
                        {(user.verified || user.is_verified) && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 fill-primary/10" />
                        )}
                      </div>
                      <p className="text-[11px] text-textSec truncate">@{user.username || user.email.split('@')[0]}</p>
                      
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{user.village || 'Local Village'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{user.followers_count || user.followers || 0} followers</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <FollowButton
                      userId={user.id}
                      userName={user.display_name || user.full_name || 'farmer'}
                      initialIsFollowing={user.is_following || user.isFollowing}
                      initialFollowersCount={user.followers_count || user.followers || 0}
                      size="sm"
                    />
                    <button
                      onClick={() => handleUserClick(user.id, user)}
                      className="p-1.5 text-slate-400 hover:text-brandDark rounded-lg hover:bg-slate-200/50 transition-all"
                      title="Visit Profile"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
