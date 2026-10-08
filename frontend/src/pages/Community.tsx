import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreVertical,
  Flag,
  UserX,
  EyeOff,
  Image as ImageIcon,
  Camera,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
  X,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Search
} from 'lucide-react';
import api from '../api/client';
import { API_BASE_URL } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';
import FollowButton from '../components/FollowButton';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function Community() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Post composer states
  const [newContent, setNewContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [postCategory, setPostCategory] = useState('Tips');
  const [newLocation, setNewLocation] = useState('');
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Moderation & Action states
  const [activeMenuPostId, setActiveMenuPostId] = useState<number | null>(null);
  const [reportingPost, setReportingPost] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState('Offensive');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'error'>('info');
  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<number[]>([]);

  // Expanded comments state: map of postId -> boolean
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [postCommentsMap, setPostCommentsMap] = useState<Record<number, any[]>>({});
  const [commentInputMap, setCommentInputMap] = useState<Record<number, string>>({});
  const [loadingCommentsMap, setLoadingCommentsMap] = useState<Record<number, boolean>>({});

  const categories = ['All', 'Disease Alert', 'Tips', 'Market', 'Q&A'];

  const showToast = (msg: string, type: 'info' | 'error' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4500);
  };

  useEffect(() => {
    fetchPosts();
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const res = await api.get('/users/blocked');
      if (Array.isArray(res.data)) {
        setBlockedUserIds(res.data.map((u: any) => u.id));
      }
    } catch (_) {}
  };

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await api.get('/posts/feed');
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image file size exceeds 8 MB.', 'error');
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      showToast('Please enter post content before publishing.', 'error');
      return;
    }

    try {
      setPublishing(true);
      const formData = new FormData();
      formData.append('content', newContent.trim());
      formData.append('crop_category', postCategory);
      if (newLocation) formData.append('location', newLocation);
      if (selectedFile) formData.append('image', selectedFile);

      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPosts([res.data, ...posts]);
      setNewContent('');
      setSelectedFile(null);
      setImagePreview(null);
      setNewLocation('');
      showToast('🌾 Post published to AgriNex community!');
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.response?.data?.message || '';
      if (
        detail.toLowerCase().includes('inappropriate') ||
        detail.toLowerCase().includes('moderation') ||
        err?.response?.status === 400 ||
        err?.response?.status === 422
      ) {
        showToast('This post cannot be published because it contains inappropriate content.', 'error');
      } else {
        showToast(detail || 'This post cannot be published because it contains inappropriate content.', 'error');
      }
      // Note: newContent is PRESERVED so the user can edit their text!
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const newLikedState = !post.is_liked;
      const newCount = newLikedState ? (post.likes_count || 0) + 1 : Math.max(0, (post.likes_count || 0) - 1);

      setPosts(posts.map((p) => (p.id === postId ? { ...p, is_liked: newLikedState, likes_count: newCount } : p)));
      await api.post(`/posts/${postId}/like`);
    } catch (_) {}
  };

  const handleBookmark = async (postId: number) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const newSavedState = !post.is_saved;

      setPosts(posts.map((p) => (p.id === postId ? { ...p, is_saved: newSavedState } : p)));
      await api.post(`/posts/${postId}/save`);
      showToast(newSavedState ? 'Post saved to bookmarks' : 'Post removed from bookmarks');
    } catch (_) {}
  };

  const handleShare = (post: any) => {
    if (navigator.share) {
      navigator
        .share({
          title: 'AgriNex Farming Community Post',
          text: post.content,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/community#post-${post.id}`);
      showToast('🔗 Post link copied to clipboard!');
    }
  };

  const handleOpenReport = (post: any) => {
    setActiveMenuPostId(null);
    setReportingPost(post);
  };

  const handleSubmitReport = async () => {
    if (!reportingPost) return;
    try {
      setSubmittingReport(true);
      await api.post(`/posts/${reportingPost.id}/report`, { reason: reportReason.toLowerCase() });
      showToast('🚩 Post reported. Our moderation team will review it.');
      setHiddenPostIds((prev) => [...prev, reportingPost.id]);
      setReportingPost(null);
    } catch (err: any) {
      showToast('Failed to report post. Please try again.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleBlockUser = async (targetUserId: number) => {
    setActiveMenuPostId(null);
    try {
      await api.post(`/users/${targetUserId}/block`);
      setBlockedUserIds((prev) => [...prev, targetUserId]);
      showToast('🚫 User blocked. Their updates are now hidden.');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to block user', 'error');
    }
  };

  const handleHidePost = (postId: number) => {
    setActiveMenuPostId(null);
    setHiddenPostIds((prev) => [...prev, postId]);
    showToast('👁 Post hidden from your feed.');
  };

  const toggleComments = async (postId: number) => {
    const willOpen = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: willOpen }));

    if (willOpen && !postCommentsMap[postId]) {
      try {
        setLoadingCommentsMap((prev) => ({ ...prev, [postId]: true }));
        const res = await api.get(`/posts/${postId}/comments`);
        setPostCommentsMap((prev) => ({ ...prev, [postId]: Array.isArray(res.data) ? res.data : [] }));
      } catch {
        setPostCommentsMap((prev) => ({ ...prev, [postId]: [] }));
      } finally {
        setLoadingCommentsMap((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    const text = (commentInputMap[postId] || '').trim();
    if (!text) return;

    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: text });
      const currentList = postCommentsMap[postId] || [];
      setPostCommentsMap((prev) => ({ ...prev, [postId]: [...currentList, res.data] }));
      setCommentInputMap((prev) => ({ ...prev, [postId]: '' }));
      setPosts(posts.map((p) => (p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p)));
    } catch (err: any) {
      showToast('Failed to submit comment.', 'error');
    }
  };

  const { data: suggestedFarmers = [] } = useQuery({
    queryKey: ['suggested_farmers_feed'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/users/suggested');
        return res.data;
      } catch {
        const res = await api.get('/users/suggested');
        return res.data;
      }
    },
  });

  const filteredPosts = posts.filter((post) => {
    if (hiddenPostIds.includes(post.id)) return false;
    if (blockedUserIds.includes(post.user_id)) return false;
    if (selectedCategory === 'All') return true;
    const cat = (post.crop_category || '').toLowerCase();
    const target = selectedCategory.toLowerCase();
    return cat.includes(target) || target.includes(cat);
  });

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* ─── TOAST NOTIFICATION ─── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 ${
              toastType === 'error'
                ? 'bg-red-700 text-white border-red-500'
                : 'bg-[#123B24] text-white border-[#6BCB45]/40'
            }`}
          >
            <span>{toastType === 'error' ? '⚠️' : '🌾'}</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HEADER & CATEGORY TABS ─── */}
      <div className="farm-card p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#123B24] tracking-tight">
            AgriNex Community 🌾
          </h1>
          <p className="text-xs sm:text-sm text-[#546E7A] font-medium mt-1">
            Connect. Share. Grow.
          </p>
        </div>

        {/* Category Tabs: All | Disease Alert | Tips | Market | Q&A */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#123B24] text-white shadow-farm-sm'
                  : 'bg-[#F5F7EF] text-[#1A2E1A] hover:bg-[#EEF3E8]'
              }`}
            >
              {cat === 'All' && '🌱 All'}
              {cat === 'Disease Alert' && '⚠️ Disease Alert'}
              {cat === 'Tips' && '💡 Tips'}
              {cat === 'Market' && '📈 Market'}
              {cat === 'Q&A' && '❓ Q&A'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── MAIN 2-COLUMN LAYOUT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT 2 COLUMNS: POST COMPOSER & POSTS */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Composer */}
          <div className="farm-card p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <img
                src={
                  user?.profile_picture ||
                  `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || 'farmer'}`
                }
                alt="avatar"
                className="w-11 h-11 rounded-full border-2 border-[#185C2B] object-cover bg-white shrink-0"
              />
              <div className="flex-1 space-y-3">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share a farming observation, ask a crop question, or post a pest alert..."
                  rows={3}
                  className="agri-input resize-none bg-[#F5F7EF]"
                />

                {/* Attached Image Preview */}
                {imagePreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-[#EEF3E8] max-h-60 bg-black">
                    <img
                      src={imagePreview}
                      alt="upload preview"
                      className="w-full h-full object-cover max-h-60"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {/* Direct image upload */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F7EF] hover:bg-[#EEF3E8] text-xs font-bold text-[#185C2B] transition-all cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>📷 Add Photo</span>
                    </button>

                    {/* Camera upload */}
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F7EF] hover:bg-[#EEF3E8] text-xs font-bold text-[#185C2B] transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Camera</span>
                    </button>

                    {/* Category selector */}
                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#F5F7EF] text-xs font-bold text-[#123B24] border border-[#EEF3E8] outline-none"
                    >
                      <option value="Tips">Tips</option>
                      <option value="Disease Alert">Disease Alert</option>
                      <option value="Market">Market</option>
                      <option value="Q&A">Q&A</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCreatePost}
                    disabled={publishing || !newContent.trim()}
                    className="btn-primary py-2.5 px-5 text-xs font-bold rounded-xl"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Post</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Post Feed */}
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-[24px] skeleton-shimmer" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="farm-card p-12 text-center space-y-3">
              <span className="text-4xl block">🌾</span>
              <h3 className="text-base font-black text-[#123B24]">No community posts in this category</h3>
              <p className="text-xs text-[#546E7A]">Be the first farmer to share an update or question!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredPosts.map((post, index) => {
                const isCommentsOpen = Boolean(expandedComments[post.id]);
                const commentList = postCommentsMap[post.id] || [];
                const isLoadingComments = Boolean(loadingCommentsMap[post.id]);

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="farm-card p-6 space-y-4"
                  >
                    {/* Post Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Avatar with green ring */}
                        <img
                          src={
                            post.author_avatar ||
                            `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.user_id || 'farmer'}`
                          }
                          alt="avatar"
                          className="w-11 h-11 rounded-full border-2 border-[#185C2B] object-cover bg-white ring-2 ring-[#A7D96A]/60"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-black text-[#123B24]">
                              {post.author_name || `Farmer ${post.user_id}`}
                            </h4>
                            {post.author_verified && (
                              <CheckCircle2 className="w-4 h-4 text-[#185C2B]" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#546E7A] font-medium">
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            {post.location && (
                              <span className="flex items-center gap-0.5 text-[#185C2B]">
                                <MapPin className="w-3 h-3" /> {post.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ⋮ Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                          className="p-2 rounded-xl text-[#546E7A] hover:text-[#123B24] hover:bg-[#F5F7EF] transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuPostId === post.id && (
                          <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-xl border border-[#EEF3E8] p-1.5 z-30 space-y-1">
                            <button
                              type="button"
                              onClick={() => handleOpenReport(post)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 text-left transition-all cursor-pointer"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span>🚩 Report Post</span>
                            </button>
                            {post.user_id !== user?.id && (
                              <button
                                type="button"
                                onClick={() => handleBlockUser(post.user_id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#546E7A] hover:bg-[#F5F7EF] text-left transition-all cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>🚫 Block User</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleHidePost(post.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#546E7A] hover:bg-[#F5F7EF] text-left transition-all cursor-pointer"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>👁 Hide Post</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Text */}
                    <p className="text-xs sm:text-sm text-[#1A2E1A] leading-relaxed whitespace-pre-line font-normal">
                      {post.content}
                    </p>

                    {/* Full-width image with Lightbox click */}
                    {post.image_url && (
                      <div
                        onClick={() => setLightboxImage(getImageUrl(post.image_url))}
                        className="rounded-2xl overflow-hidden border border-[#EEF3E8] cursor-pointer group relative max-h-96"
                      >
                        <img
                          src={getImageUrl(post.image_url)}
                          alt="attachment"
                          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          🔍 View Full Image
                        </div>
                      </div>
                    )}

                    {/* Action Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#EEF3E8] text-xs font-bold text-[#546E7A]">
                      <div className="flex items-center gap-4">
                        {/* Like button with animated fill */}
                        <button
                          type="button"
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                            post.is_liked
                              ? 'text-red-500 bg-red-50'
                              : 'hover:bg-[#F5F7EF] hover:text-[#185C2B]'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              post.is_liked ? 'fill-red-500 text-red-500 animate-bounce' : ''
                            }`}
                          />
                          <span>{post.likes_count || 0}</span>
                        </button>

                        {/* Comment toggle button */}
                        <button
                          type="button"
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#F5F7EF] hover:text-[#185C2B] transition-all cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments_count || 0}</span>
                        </button>

                        {/* Share button */}
                        <button
                          type="button"
                          onClick={() => handleShare(post)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#F5F7EF] hover:text-[#185C2B] transition-all cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>

                      {/* Bookmark / Save */}
                      <button
                        type="button"
                        onClick={() => handleBookmark(post.id)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          post.is_saved
                            ? 'text-[#F9A825] bg-amber-50'
                            : 'hover:bg-[#F5F7EF] hover:text-[#123B24]'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${post.is_saved ? 'fill-[#F9A825]' : ''}`} />
                      </button>
                    </div>

                    {/* Expandable Comments Section */}
                    <AnimatePresence>
                      {isCommentsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-3 border-t border-[#EEF3E8] space-y-3 overflow-hidden"
                        >
                          {/* Comment Input */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Write an agronomy comment or advice..."
                              value={commentInputMap[post.id] || ''}
                              onChange={(e) =>
                                setCommentInputMap((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment(post.id);
                              }}
                              className="agri-input py-2 text-xs flex-1 bg-[#F5F7EF]"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(post.id)}
                              className="btn-primary py-2 px-4 rounded-xl text-xs font-bold"
                            >
                              Send
                            </button>
                          </div>

                          {/* Comments List */}
                          {isLoadingComments ? (
                            <div className="py-4 text-center text-xs text-[#546E7A] flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-[#185C2B]" />
                              <span>Loading comments...</span>
                            </div>
                          ) : commentList.length === 0 ? (
                            <p className="text-[11px] text-[#546E7A] italic py-1">No comments yet. Start the conversation!</p>
                          ) : (
                            <div className="space-y-2 pt-1 max-h-60 overflow-y-auto no-scrollbar">
                              {commentList.map((c) => (
                                <div key={c.id} className="p-3 rounded-2xl bg-[#F5F7EF] space-y-1">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-[#123B24]">{c.author_name || `Farmer ${c.user_id}`}</span>
                                    <span className="text-[#546E7A] text-[10px]">{new Date(c.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs text-[#1A2E1A]">{c.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: TRENDING TOPICS & SUGGESTED FARMERS */}
        <div className="space-y-6">
          {/* Trending Topics */}
          <div className="farm-card p-6 space-y-4">
            <h3 className="text-sm font-black text-[#123B24] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#185C2B]" />
              <span>Trending Farm Discussions</span>
            </h3>

            <div className="space-y-2.5">
              {[
                { tag: '#KharifPaddy', count: '2.4k updates', desc: 'Brown plant hopper warnings' },
                { tag: '#TomatoBlight', count: '1.8k updates', desc: 'Foliar spray remedies' },
                { tag: '#DripIrrigation', count: '940 updates', desc: 'Water savings & timers' },
                { tag: '#OrganicNeem', count: '620 updates', desc: 'Natural pest bio-repellents' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#F5F7EF] hover:bg-[#EEF3E8] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#185C2B]">{item.tag}</span>
                    <span className="text-[10px] font-bold text-[#546E7A]">{item.count}</span>
                  </div>
                  <p className="text-[11px] text-[#546E7A] mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Farmers */}
          <div className="farm-card p-6 space-y-4">
            <h3 className="text-sm font-black text-[#123B24] flex items-center gap-2">
              <span>🌾</span>
              <span>Suggested Farmers</span>
            </h3>

            <div className="space-y-3">
              {suggestedFarmers.slice(0, 4).map((f: any) => (
                <div key={f.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F5F7EF] transition-all">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        f.profile_photo ||
                        f.profile_picture ||
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${f.id}`
                      }
                      alt="farmer"
                      className="w-9 h-9 rounded-full object-cover border border-[#A7D96A]"
                    />
                    <div>
                      <h5 className="text-xs font-bold text-[#123B24] truncate max-w-[110px]">
                        {f.display_name || f.full_name || `Farmer ${f.id}`}
                      </h5>
                      <p className="text-[10px] text-[#546E7A]">{f.village || 'Agronomist'}</p>
                    </div>
                  </div>
                  <FollowButton userId={f.id} initialIsFollowing={f.is_following} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── FULL-SCREEN IMAGE LIGHTBOX MODAL ─── */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-all z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={lightboxImage}
                alt="Enlarged community crop attachment"
                className="w-full h-full object-contain max-h-[85vh] rounded-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── REPORT REASON MODAL ─── */}
      <AnimatePresence>
        {reportingPost && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[28px] p-6 max-w-md w-full shadow-2xl border border-[#EEF3E8] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EEF3E8]">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <Flag className="w-5 h-5" />
                  <h3 className="text-base font-black text-[#123B24]">Report Community Post</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReportingPost(null)}
                  className="p-1 rounded-lg text-[#546E7A] hover:text-[#123B24]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#546E7A]">
                Select why this update violates agricultural community standards:
              </p>

              <div className="space-y-2">
                {['Offensive', 'Spam', 'Harassment', 'Misinformation', 'Other'].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      reportReason === reason
                        ? 'border-[#185C2B] bg-[#EEF3E8] text-[#123B24]'
                        : 'border-[#EEF3E8] text-[#1A2E1A] hover:bg-[#F5F7EF]'
                    }`}
                  >
                    <span>{reason}</span>
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="text-[#185C2B] focus:ring-[#185C2B]"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF3E8]">
                <button
                  type="button"
                  onClick={() => setReportingPost(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#EEF3E8] text-xs font-bold text-[#546E7A]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  disabled={submittingReport}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
