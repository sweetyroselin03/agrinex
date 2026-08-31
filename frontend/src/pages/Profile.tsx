import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Settings, 
  Lock, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  MapPin,
  Sprout,
  Compass,
  Award,
  Grid,
  Users,
  Calendar,
  X,
  Heart,
  MessageCircle,
  MessageSquare,
  Share2,
  Check,
  Globe,
  BadgeCheck,
  Save
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import FollowButton from '../components/FollowButton';

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { user: currentUser, updateProfile, setPassword, isLoading: authLoading, clearError } = useAuthStore();

  const isOwnProfile = !userId || (currentUser && String(currentUser.id) === String(userId));
  const targetId = isOwnProfile ? currentUser?.id : Number(userId);

  const initialTab = (searchParams.get('tab') as 'posts' | 'overview' | 'settings' | 'security') || 'posts';
  const [activeTab, setActiveTab] = useState<'posts' | 'overview' | 'settings' | 'security'>(initialTab);
  const [networkModal, setNetworkModal] = useState<'followers' | 'following' | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch Target User Profile via React Query
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ['user_profile', targetId],
    queryFn: async () => {
      if (!targetId) return null;
      try {
        const res = await api.get(`/api/users/${targetId}`);
        return res.data;
      } catch (err) {
        const res = await api.get(`/users/${targetId}`);
        return res.data;
      }
    },
    enabled: Boolean(targetId),
  });

  // Fetch User Posts via React Query
  const { data: userPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['user_posts', targetId],
    queryFn: async () => {
      if (!targetId) return [];
      try {
        const res = await api.get(`/api/users/${targetId}/posts`);
        return res.data;
      } catch (err) {
        const res = await api.get(`/users/${targetId}/posts`);
        return res.data;
      }
    },
    enabled: Boolean(targetId),
  });

  // Fetch Network (Followers / Following) when Modal is Open
  const { data: networkList = [], isLoading: loadingNetwork } = useQuery({
    queryKey: ['user_network', targetId, networkModal],
    queryFn: async () => {
      if (!targetId || !networkModal) return [];
      try {
        const res = await api.get(`/api/users/${targetId}/${networkModal}`);
        return res.data;
      } catch (err) {
        const res = await api.get(`/users/${targetId}/${networkModal}`);
        return res.data;
      }
    },
    enabled: Boolean(targetId) && Boolean(networkModal),
  });

  // Form states for profile edit
  const userToUse = isOwnProfile ? currentUser : profileData;
  const [fullName, setFullName] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [experience, setExperience] = useState('');
  const [cropSpecialization, setCropSpecialization] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    if (userToUse) {
      setFullName(userToUse.full_name || '');
      setUsernameInput(userToUse.username || '');
      setPhone(userToUse.phone || '');
      setBio(userToUse.bio || '');
      setVillage(userToUse.village || '');
      setDistrict(userToUse.district || '');
      setState(userToUse.state || '');
      setFarmSize(userToUse.farm_size || '');
      setExperience(userToUse.experience || '');
      setCropSpecialization(userToUse.crop_specialization || '');
      setWebsite(userToUse.website || '');
    }
  }, [userToUse]);

  // Password reset forms
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setLocalErr(null);
    clearError();

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setLocalErr('Full name is required.');
      return;
    }

    if (bio.trim().length > 250) {
      setLocalErr('Bio cannot exceed 250 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfile({
        full_name: trimmedFullName,
        username: usernameInput.trim() ? usernameInput.trim().replace(/^@/, '') : undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        village: village.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        farm_size: farmSize.trim() || undefined,
        experience: experience.trim() || undefined,
        crop_specialization: cropSpecialization.trim() || undefined,
        website: website.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['user_profile', targetId] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setSuccessMsg('Profile updated successfully');
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 400 || status === 422) {
        setLocalErr(typeof detail === 'string' ? detail : 'Validation failed. Please check your inputs.');
      } else if (status === 401) {
        setLocalErr('Session expired. Please log in again.');
      } else if (status === 409) {
        setLocalErr('Username already exists. Please choose a different username.');
      } else if (status >= 500) {
        setLocalErr('Server unavailable. Please try again shortly.');
      } else {
        setLocalErr(typeof detail === 'string' ? detail : 'Profile update failed. Please check your internet connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setLocalErr(null);
    clearError();

    if (!newPassword || !confirmPassword) {
      setLocalErr('Password fields cannot be empty.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalErr('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setLocalErr('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      await setPassword(currentUser?.email || '', newPassword);
      setSuccessMsg('Security credentials updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setLocalErr(err?.response?.data?.detail || 'Failed to update security credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareProfile = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on AgriNex`,
          text: `Check out ${displayName}'s profile on AgriNex AI platform!`,
          url: url,
        });
        return;
      } catch (e) {}
    }
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (loadingProfile && !isOwnProfile) {
    return (
      <div className="glass-card p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span>Loading farmer profile...</span>
      </div>
    );
  }

  const profile = profileData || currentUser;
  const displayName = profile?.display_name || profile?.full_name || 'Farmer';
  const username = profile?.username || profile?.email?.split('@')[0] || 'farmer';
  const followersCount = profile?.followers_count ?? 0;
  const followingCount = profile?.following_count ?? 0;
  const postsCount = profile?.posts_count ?? userPosts.length ?? 0;
  const isFollowing = profile?.is_following ?? profile?.isFollowing ?? false;
  const avatarSrc = profile?.profile_photo || profile?.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile?.email || 'farmer'}`;

  return (
    <div className="space-y-6 font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* ─── PROFESSIONAL SOCIAL PROFILE HEADER CARD ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden p-0 relative border-slate-200 shadow-sm"
      >
        
        {/* Banner Gradient */}
        <div className="h-44 sm:h-56 w-full relative bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/30 via-emerald-800/60 to-slate-950" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            
            {/* Avatar Display */}
            <div className="relative shrink-0">
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white object-cover bg-white shadow-xl"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 sm:pt-0">
              {!isOwnProfile && targetId && (
                <>
                  <FollowButton
                    userId={targetId}
                    userName={displayName}
                    initialIsFollowing={isFollowing}
                    initialFollowersCount={followersCount}
                    size="md"
                  />
                  <button
                    type="button"
                    onClick={() => navigate(`/messages?userId=${targetId}`)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                </>
              )}

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Edit Profile</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleShareProfile}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
                title="Share Profile"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* User Bio & Verified Details */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{displayName}</h1>
                <span title="Verified Farmer">
                  <BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                </span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {profile?.crop_specialization || profile?.specialization || 'Agriculture'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">@{username}</p>
            </div>

            {profile?.bio && (
              <p className="text-xs text-slate-700 leading-relaxed font-medium max-w-2xl">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profile?.village ? `${profile.village}, ${profile.district || ''} ${profile.state || ''}` : 'Local Agricultural Hub'}</span>
              </span>
              {profile?.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-emerald-600 hover:underline font-semibold"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="max-w-xs truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {profile?.created_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </span>
              )}
            </div>
          </div>

          {/* Social Stats Counters */}
          <div className="flex items-center gap-8 border-t border-slate-100 mt-6 pt-4 text-xs">
            <div className="text-center sm:text-left">
              <span className="font-extrabold text-slate-900 text-base block leading-none">{postsCount}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Posts</span>
            </div>
            
            <button
              type="button"
              onClick={() => setNetworkModal('followers')}
              className="text-center sm:text-left hover:opacity-80 transition-opacity"
            >
              <span className="font-extrabold text-slate-900 text-base block leading-none">{followersCount}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1 hover:text-emerald-600">Followers</span>
            </button>
            
            <button
              type="button"
              onClick={() => setNetworkModal('following')}
              className="text-center sm:text-left hover:opacity-80 transition-opacity"
            >
              <span className="font-extrabold text-slate-900 text-base block leading-none">{followingCount}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1 hover:text-emerald-600">Following</span>
            </button>
          </div>

        </div>

      </motion.div>

      {/* ─── TAB NAVIGATION BAR ─── */}
      <div className="flex items-center border-b border-slate-200 bg-white rounded-2xl p-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${
            activeTab === 'posts'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Posts ({userPosts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Farm Details</span>
        </button>

        {isOwnProfile && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${
                activeTab === 'security'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Security</span>
            </button>
          </>
        )}
      </div>

      {/* ─── TAB CONTENT PANELS ─── */}
      <AnimatePresence mode="wait">
        
        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {loadingPosts ? (
              <div className="glass-card p-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Loading posts...</span>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-500 text-xs space-y-2">
                <Grid className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-900">No posts published yet</p>
                <p className="text-slate-400">When {displayName} shares community updates, they will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPosts.map((post: any) => (
                  <div key={post.id} className="glass-card p-5 space-y-3 hover:border-emerald-500/40 transition-all flex flex-col justify-between hover:shadow-md">
                    <div>
                      {post.image_url && (
                        <div className="rounded-xl overflow-hidden mb-3 h-44 bg-slate-100">
                          <img
                            src={post.image_url}
                            alt="Post media"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <p className="text-xs text-slate-700 font-medium line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1 text-rose-500">
                        <Heart className="w-3.5 h-3.5 fill-rose-500" />
                        <span>{post.likes_count || 0}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{post.comments_count || 0} comments</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* FARM DETAILS OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <div className="glass-card p-6 flex gap-4 items-start hover:border-emerald-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Region Location</h4>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {profile?.village ? `${profile.village}, ${profile.district || ''} ${profile.state || ''}` : 'Not Specified'}
                </span>
              </div>
            </div>

            <div className="glass-card p-6 flex gap-4 items-start hover:border-emerald-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                <Sprout className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Crop Specialization</h4>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {profile?.crop_specialization || profile?.specialization || 'Not Specified'}
                </span>
              </div>
            </div>

            <div className="glass-card p-6 flex gap-4 items-start hover:border-emerald-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Farming Experience</h4>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {profile?.experience ? `${profile.experience} Years` : 'Not Specified'}
                </span>
              </div>
            </div>

            <div className="glass-card p-6 flex gap-4 items-start hover:border-emerald-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                <Compass className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Farm Land Size</h4>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {profile?.farm_size ? `${profile.farm_size} Acres` : 'Not Specified'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* EDIT PROFILE TAB (TEXT PROFILE INFORMATION ONLY) */}
        {activeTab === 'settings' && isOwnProfile && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 md:p-8"
          >
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-extrabold text-slate-900 text-lg">Edit Profile Details</h3>
              <p className="text-xs text-slate-500">Update your public profile, contact info, and agricultural background.</p>
            </div>

            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {localErr && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{localErr}</span>
              </div>
            )}
            
            <form onSubmit={handleUpdateProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    placeholder="farmer"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                  />
                </div>

                {/* Bio with Character Counter */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bio Note</label>
                    <span className={`text-[10px] font-bold ${bio.length > 250 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {bio.length} / 250
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={250}
                    placeholder="Tell the AgriNex community about your farm and experience..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all resize-none font-medium"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                {/* Village */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Village / Town</label>
                  <input
                    type="text"
                    placeholder="e.g. Baramati"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                  />
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* Farm Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Farm Size (Acres)</label>
                  <input
                    type="text"
                    placeholder="e.g. 5.5"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                  />
                </div>

                {/* Crop Specialization */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Crop Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. Sugarcane, Wheat, Organic Vegetables"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                    value={cropSpecialization}
                    onChange={(e) => setCropSpecialization(e.target.value)}
                  />
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Experience (Years)</label>
                  <input
                    type="text"
                    placeholder="e.g. 8"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>

                {/* Website */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Website / Social Link</label>
                  <input
                    type="url"
                    placeholder="https://myfarm.org"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={authLoading || isSubmitting}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {authLoading || isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && isOwnProfile && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 md:p-8 max-w-xl"
          >
            <h3 className="font-extrabold text-slate-900 text-base mb-1">Security Credentials</h3>
            <p className="text-xs text-slate-500 mb-6">Update your account password to ensure maximum security.</p>
            
            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 outline-none transition-all font-medium"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={authLoading || isSubmitting}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {authLoading || isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Account Password'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ─── FOLLOWERS / FOLLOWING NETWORK LIST MODAL ─── */}
      <AnimatePresence>
        {networkModal && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setNetworkModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
                <h3 className="font-extrabold text-slate-900 text-base capitalize flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>{networkModal} ({networkList.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setNetworkModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 py-2">
                {loadingNetwork ? (
                  <div className="py-8 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Loading network members...</span>
                  </div>
                ) : networkList.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No {networkModal} yet.
                  </div>
                ) : (
                  networkList.map((netUser: any) => (
                    <div key={netUser.id} className="py-3 flex items-center justify-between gap-3">
                      <Link
                        to={`/profile/${netUser.id}`}
                        onClick={() => setNetworkModal(null)}
                        className="flex items-center gap-3 min-w-0 group flex-1"
                      >
                        <img
                          src={netUser.profile_photo || netUser.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${netUser.email}`}
                          alt="avatar"
                          className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-white shrink-0 group-hover:ring-2 group-hover:ring-emerald-500 transition-all"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                            {netUser.display_name || netUser.full_name || 'Farmer'}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">{netUser.village || 'Agricultural Hub'}</p>
                        </div>
                      </Link>

                      {currentUser && currentUser.id !== netUser.id && (
                        <FollowButton
                          userId={netUser.id}
                          userName={netUser.display_name || netUser.full_name}
                          initialIsFollowing={netUser.is_following || netUser.isFollowing}
                          initialFollowersCount={netUser.followers_count || netUser.followers || 0}
                          size="sm"
                          className="shrink-0"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
