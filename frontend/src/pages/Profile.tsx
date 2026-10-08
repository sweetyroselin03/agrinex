import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Save,
  Microscope,
  Activity,
  Leaf
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

  const initialTab =
    (searchParams.get('tab') as 'posts' | 'farm_profile' | 'disease_reports' | 'activity' | 'settings' | 'security') ||
    'farm_profile';
  const [activeTab, setActiveTab] = useState<
    'posts' | 'farm_profile' | 'disease_reports' | 'activity' | 'settings' | 'security'
  >(initialTab);

  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch Target User Profile
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

  // Fetch User Posts
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

  // Fetch Disease Reports
  const { data: userScans = [], isLoading: loadingScans } = useQuery({
    queryKey: ['user_scans_profile', targetId],
    queryFn: async () => {
      try {
        const res = await api.get('/ai/scans');
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(targetId),
  });

  const profile = profileData || currentUser;
  const displayName = profile?.display_name || profile?.full_name || 'Farmer';
  const username = profile?.username || profile?.email?.split('@')[0] || 'farmer';
  const followersCount = profile?.followers_count ?? 0;
  const followingCount = profile?.following_count ?? 0;
  const postsCount = profile?.posts_count ?? userPosts.length ?? 0;
  const isFollowing = profile?.is_following ?? profile?.isFollowing ?? false;
  const avatarSrc =
    profile?.profile_photo ||
    profile?.profile_picture ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile?.email || 'farmer'}`;

  // Form states for profile edit
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
    if (profile) {
      setFullName(profile.full_name || '');
      setUsernameInput(profile.username || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setVillage(profile.village || '');
      setDistrict(profile.district || '');
      setState(profile.state || '');
      setFarmSize(profile.farm_size || '');
      setExperience(profile.experience || '');
      setCropSpecialization(profile.crop_specialization || '');
      setWebsite(profile.website || '');
    }
  }, [profile]);

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
      setLocalErr(err?.response?.data?.detail || 'Failed to update profile.');
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
          title: `${displayName} on AgriNex AI`,
          text: `Check out ${displayName}'s farm profile on AgriNex AI!`,
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
      <div className="farm-card p-12 text-center text-[#546E7A] text-xs flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#185C2B]" />
        <span>Loading farmer profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ─── AGRICULTURAL FARMER PROFILE HERO ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="farm-card overflow-hidden p-0 relative shadow-farm-md"
      >
        {/* Banner with Farm Panorama */}
        <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-[#123B24]">
          <img
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80"
            alt="Farm banner"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#123B24] via-transparent to-transparent" />
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* Avatar with green ring */}
            <div className="relative shrink-0">
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white object-cover bg-white shadow-farm-lg ring-4 ring-[#A7D96A]/60"
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
                    className="btn-primary py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2"
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
                  className="px-5 py-2.5 rounded-xl border border-[#EEF3E8] bg-[#F5F7EF] text-[#123B24] hover:bg-[#EEF3E8] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#185C2B]" />
                  <span>Edit Profile</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleShareProfile}
                className="px-4 py-2.5 rounded-xl border border-[#EEF3E8] text-[#546E7A] hover:bg-[#F5F7EF] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                title="Share Profile"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-[#185C2B]" />
                    <span className="text-[#185C2B]">Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
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
                <h1 className="text-2xl font-black text-[#123B24] tracking-tight">{displayName}</h1>
                <BadgeCheck className="w-5 h-5 text-[#185C2B] shrink-0" />
                <span className="text-xs text-[#185C2B] font-bold bg-[#EEF3E8] px-2.5 py-0.5 rounded-full border border-[#A7D96A]">
                  {profile?.crop_specialization || 'Progressive Farmer'}
                </span>
              </div>
              <p className="text-xs text-[#546E7A] font-medium mt-0.5">@{username}</p>
            </div>

            {profile?.bio && (
              <p className="text-xs text-[#1A2E1A] leading-relaxed font-medium max-w-2xl">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#546E7A] font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#185C2B] shrink-0" />
                <span>
                  {profile?.village
                    ? `${profile.village}, ${profile.district || ''} ${profile.state || ''}`
                    : 'Agricultural Region'}
                </span>
              </span>
              {profile?.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[#185C2B] hover:underline font-semibold"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="max-w-xs truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {profile?.created_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#546E7A] shrink-0" />
                  <span>
                    Joined{' '}
                    {new Date(profile.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Social Stats Counters */}
          <div className="flex items-center gap-8 border-t border-[#EEF3E8] mt-6 pt-4 text-xs">
            <div>
              <span className="font-black text-[#123B24] text-base block leading-none">{postsCount}</span>
              <span className="text-[10px] text-[#546E7A] font-bold uppercase tracking-wider block mt-1">Posts</span>
            </div>
            <div>
              <span className="font-black text-[#123B24] text-base block leading-none">{followersCount}</span>
              <span className="text-[10px] text-[#546E7A] font-bold uppercase tracking-wider block mt-1">Followers</span>
            </div>
            <div>
              <span className="font-black text-[#123B24] text-base block leading-none">{followingCount}</span>
              <span className="text-[10px] text-[#546E7A] font-bold uppercase tracking-wider block mt-1">Following</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── TAB NAVIGATION BAR: Farm Profile | My Posts | Disease Reports | Activity ─── */}
      <div className="flex items-center border border-[#EEF3E8] bg-white rounded-2xl p-1 shadow-farm-sm overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('farm_profile')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all whitespace-nowrap px-4 cursor-pointer ${
            activeTab === 'farm_profile'
              ? 'bg-[#123B24] text-white shadow-farm-sm'
              : 'text-[#546E7A] hover:text-[#123B24] hover:bg-[#F5F7EF]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Farm Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all whitespace-nowrap px-4 cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-[#123B24] text-white shadow-farm-sm'
              : 'text-[#546E7A] hover:text-[#123B24] hover:bg-[#F5F7EF]'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>My Posts ({userPosts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('disease_reports')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all whitespace-nowrap px-4 cursor-pointer ${
            activeTab === 'disease_reports'
              ? 'bg-[#123B24] text-white shadow-farm-sm'
              : 'text-[#546E7A] hover:text-[#123B24] hover:bg-[#F5F7EF]'
          }`}
        >
          <Microscope className="w-4 h-4" />
          <span>Disease Reports ({userScans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all whitespace-nowrap px-4 cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-[#123B24] text-white shadow-farm-sm'
              : 'text-[#546E7A] hover:text-[#123B24] hover:bg-[#F5F7EF]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Community Activity</span>
        </button>

        {isOwnProfile && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all whitespace-nowrap px-4 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#123B24] text-white shadow-farm-sm'
                  : 'text-[#546E7A] hover:text-[#123B24] hover:bg-[#F5F7EF]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all whitespace-nowrap px-4 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#123B24] text-white shadow-farm-sm'
                  : 'text-[#546E7A] hover:text-[#123B24] hover:bg-[#F5F7EF]'
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
        {/* SECTION 1: FARM PROFILE (bio, location, crops) */}
        {activeTab === 'farm_profile' && (
          <motion.div
            key="farm_profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <div className="farm-card p-6 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-[#185C2B] shrink-0 shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] text-[#546E7A] font-bold uppercase tracking-wider">Region / Village</h4>
                <p className="text-sm font-black text-[#123B24] mt-1">
                  {profile?.village
                    ? `${profile.village}, ${profile.district || ''} ${profile.state || ''}`
                    : 'Not Specified'}
                </p>
              </div>
            </div>

            <div className="farm-card p-6 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-[#185C2B] shrink-0 shadow-sm">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] text-[#546E7A] font-bold uppercase tracking-wider">Crops Grown</h4>
                <p className="text-sm font-black text-[#123B24] mt-1">
                  {profile?.crop_specialization || 'Not Specified'}
                </p>
              </div>
            </div>

            <div className="farm-card p-6 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-[#8B6B45] shrink-0 shadow-sm">
                <Compass className="w-6 h-6 text-[#8B6B45]" />
              </div>
              <div>
                <h4 className="text-[10px] text-[#546E7A] font-bold uppercase tracking-wider">Farm Land Area</h4>
                <p className="text-sm font-black text-[#123B24] mt-1">
                  {profile?.farm_size ? `${profile.farm_size} Acres` : 'Not Specified'}
                </p>
              </div>
            </div>

            <div className="farm-card p-6 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-[#F9A825] shrink-0 shadow-sm">
                <Award className="w-6 h-6 text-[#8B6B45]" />
              </div>
              <div>
                <h4 className="text-[10px] text-[#546E7A] font-bold uppercase tracking-wider">Experience Level</h4>
                <p className="text-sm font-black text-[#123B24] mt-1">
                  {profile?.experience ? `${profile.experience} Years` : 'Experienced Farmer'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 2: MY POSTS */}
        {activeTab === 'posts' && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {loadingPosts ? (
              <div className="farm-card p-12 text-center text-xs flex justify-center items-center gap-2 text-[#546E7A]">
                <Loader2 className="w-4 h-4 animate-spin text-[#185C2B]" />
                <span>Loading posts...</span>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="farm-card p-12 text-center text-xs space-y-2 text-[#546E7A]">
                <Grid className="w-8 h-8 text-[#A7D96A] mx-auto" />
                <p className="font-bold text-[#123B24]">No community posts yet</p>
                <p>When updates are posted to the community feed, they will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPosts.map((post: any) => (
                  <div
                    key={post.id}
                    className="farm-card p-5 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      {post.image_url && (
                        <div className="rounded-xl overflow-hidden mb-3 h-44 bg-[#F5F7EF]">
                          <img
                            src={post.image_url}
                            alt="Post media"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <p className="text-xs text-[#1A2E1A] font-medium line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#EEF3E8] text-[11px] text-[#546E7A] font-bold">
                      <span className="flex items-center gap-1 text-red-500">
                        <Heart className="w-3.5 h-3.5 fill-red-500" />
                        <span>{post.likes_count || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{post.comments_count || 0}</span>
                      </span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* SECTION 3: DISEASE REPORTS */}
        {activeTab === 'disease_reports' && (
          <motion.div
            key="disease_reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {loadingScans ? (
              <div className="farm-card p-12 text-center text-xs flex justify-center items-center gap-2 text-[#546E7A]">
                <Loader2 className="w-4 h-4 animate-spin text-[#185C2B]" />
                <span>Loading disease diagnostic reports...</span>
              </div>
            ) : userScans.length === 0 ? (
              <div className="farm-card p-12 text-center text-xs space-y-2 text-[#546E7A]">
                <Microscope className="w-8 h-8 text-[#A7D96A] mx-auto" />
                <p className="font-bold text-[#123B24]">No diagnostic reports recorded</p>
                <p>Use the AI Crop Diagnostic tool to scan foliage and generate pathology reports.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {userScans.map((scan: any, i: number) => (
                  <div key={scan.id || i} className="farm-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">
                        {scan.severity_level === 'Healthy' ? '🌱' : '⚠️'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          scan.severity_level === 'Healthy'
                            ? 'bg-green-100 text-[#185C2B]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {scan.severity_level || 'Evaluated'}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-[#123B24]">{scan.disease_name}</h4>
                    <p className="text-xs text-[#546E7A] line-clamp-2">
                      {scan.symptoms || scan.treatment || 'Pathology evaluation complete.'}
                    </p>
                    <div className="pt-2 border-t border-[#EEF3E8] flex justify-between items-center text-[10px] text-[#546E7A]">
                      <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                      <span className="font-bold text-[#185C2B]">Confidence: {Math.round(scan.confidence || 92)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* SECTION 4: COMMUNITY ACTIVITY */}
        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="farm-card p-6 space-y-4"
          >
            <h3 className="text-base font-black text-[#123B24]">Farmer Community Engagement</h3>
            <div className="divide-y divide-[#EEF3E8]">
              <div className="py-3 flex items-center justify-between text-xs">
                <span className="text-[#546E7A]">Total Community Discussions Started</span>
                <span className="font-black text-[#123B24]">{postsCount}</span>
              </div>
              <div className="py-3 flex items-center justify-between text-xs">
                <span className="text-[#546E7A]">Agronomist Followers</span>
                <span className="font-black text-[#123B24]">{followersCount}</span>
              </div>
              <div className="py-3 flex items-center justify-between text-xs">
                <span className="text-[#546E7A]">Farmers Followed</span>
                <span className="font-black text-[#123B24]">{followingCount}</span>
              </div>
              <div className="py-3 flex items-center justify-between text-xs">
                <span className="text-[#546E7A]">Moderation Trust Status</span>
                <span className="font-black text-[#185C2B]">Verified • Good Standing</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* EDIT PROFILE TAB */}
        {activeTab === 'settings' && isOwnProfile && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="farm-card p-6 md:p-8"
          >
            <div className="border-b border-[#EEF3E8] pb-4 mb-6">
              <h3 className="font-black text-[#123B24] text-lg">Edit Farm Profile</h3>
              <p className="text-xs text-[#546E7A]">Update your public bio, location, and crops grown.</p>
            </div>

            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 text-[#185C2B] text-xs flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 text-[#185C2B] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {localErr && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{localErr}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="agri-input text-xs"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    placeholder="farmer"
                    className="agri-input text-xs"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">Bio Note</label>
                  <textarea
                    rows={3}
                    maxLength={250}
                    placeholder="Describe your farming methods and land..."
                    className="agri-input text-xs resize-none"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">Village / Town</label>
                  <input
                    type="text"
                    className="agri-input text-xs"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">District</label>
                  <input
                    type="text"
                    className="agri-input text-xs"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    className="agri-input text-xs"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">Phone</label>
                  <input
                    type="text"
                    className="agri-input text-xs"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">Farm Land Area (Acres)</label>
                  <input
                    type="text"
                    className="agri-input text-xs"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">Crops Grown</label>
                  <input
                    type="text"
                    placeholder="e.g. Rice, Wheat, Cotton"
                    className="agri-input text-xs"
                    value={cropSpecialization}
                    onChange={(e) => setCropSpecialization(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">Experience (Years)</label>
                  <input
                    type="text"
                    className="agri-input text-xs"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">Website / Social</label>
                  <input
                    type="url"
                    className="agri-input text-xs"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#EEF3E8]">
                <button
                  type="submit"
                  disabled={authLoading || isSubmitting}
                  className="btn-primary py-3 px-6 text-xs font-bold rounded-xl"
                >
                  {authLoading || isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
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
            className="farm-card p-6 md:p-8 max-w-xl"
          >
            <div className="border-b border-[#EEF3E8] pb-4 mb-6">
              <h3 className="font-black text-[#123B24] text-lg">Change Password</h3>
              <p className="text-xs text-[#546E7A]">Update your login password securely.</p>
            </div>

            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 text-[#185C2B] text-xs flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 text-[#185C2B] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {localErr && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{localErr}</span>
              </div>
            )}

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  className="agri-input text-xs"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="Retype new password"
                  className="agri-input text-xs"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading || isSubmitting}
                  className="btn-primary py-3 px-6 text-xs font-bold rounded-xl"
                >
                  {authLoading || isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
