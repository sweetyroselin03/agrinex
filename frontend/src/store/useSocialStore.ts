import { create } from 'zustand';
import client from '../api/client';

export interface UserSearchItem {
  id: number;
  full_name?: string;
  display_name?: string;
  username?: string;
  email: string;
  village?: string;
  profile_picture?: string;
  profile_photo?: string;
  avatar_url?: string;
  bio?: string;
  verified?: boolean;
  is_verified?: boolean;
  followers?: number;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  isFollowing?: boolean;
}

export interface UserProfileItem {
  id: number;
  email: string;
  phone?: string;
  full_name?: string;
  display_name?: string;
  username?: string;
  village?: string;
  district?: string;
  state?: string;
  farm_size?: string;
  experience?: string;
  crop_specialization?: string;
  specialization?: string;
  profile_picture?: string;
  profile_photo?: string;
  bio?: string;
  is_verified?: boolean;
  created_at?: string;
  joined_date?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
  isFollowing: boolean;
}

interface SocialState {
  searchResults: UserSearchItem[];
  isSearching: boolean;
  searchQuery: string;
  unreadCount: number;

  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<UserSearchItem[]>;
  clearSearch: () => void;

  toggleFollowUser: (userId: number, currentIsFollowing: boolean) => Promise<{ isFollowing: boolean; followersCount: number }>;
  fetchUnreadCount: () => Promise<number>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  searchResults: [],
  isSearching: false,
  searchQuery: '',
  unreadCount: 0,

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  performSearch: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return [];
    }
    set({ isSearching: true, searchQuery: query });
    try {
      const res = await client.get(`/api/users/search`, { params: { q: query.trim() } });
      const results: UserSearchItem[] = res.data;
      set({ searchResults: results, isSearching: false });
      return results;
    } catch (err) {
      // Fallback try non-prefix /users/search
      try {
        const res = await client.get(`/users/search`, { params: { q: query.trim() } });
        const results: UserSearchItem[] = res.data;
        set({ searchResults: results, isSearching: false });
        return results;
      } catch (e) {
        set({ searchResults: [], isSearching: false });
        return [];
      }
    }
  },

  clearSearch: () => set({ searchResults: [], searchQuery: '', isSearching: false }),

  toggleFollowUser: async (userId: number, currentIsFollowing: boolean) => {
    try {
      let res;
      if (currentIsFollowing) {
        res = await client.delete(`/api/users/${userId}/follow`);
      } else {
        res = await client.post(`/api/users/${userId}/follow`);
      }
      const isFollowing = res.data.isFollowing ?? res.data.is_following ?? !currentIsFollowing;
      const followersCount = res.data.followersCount ?? res.data.followers_count ?? 0;

      // Update in-memory search results
      const currentResults = get().searchResults;
      const updatedResults = currentResults.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            is_following: isFollowing,
            isFollowing: isFollowing,
            followers_count: followersCount,
            followers: followersCount,
          };
        }
        return user;
      });
      set({ searchResults: updatedResults });

      return { isFollowing, followersCount };
    } catch (err) {
      throw err;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await client.get('/api/notifications');
      const notifs = res.data || [];
      const unread = notifs.filter((n: any) => !n.is_read).length;
      set({ unreadCount: unread });
      return unread;
    } catch (err) {
      return 0;
    }
  }
}));
