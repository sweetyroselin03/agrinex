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
  
  // Post publisher states
  const [newContent, setNewContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [postCategory, setPostCategory] = useState('Farming Tips');
  const [newLocation, setNewLocation] = useState('');
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Action / Moderation states
  const [activeMenuPostId, setActiveMenuPostId] = useState<number | null>(null);
  const [reportingPost, setReportingPost] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState('Offensive');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<number[]>([]);

  // Comment section state
  const [activePostForComments, setActivePostForComments] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentVal, setNewCommentVal] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const categories = ['All', 'Disease Alert', 'Farming Tips', 'Market', 'Q&A', 'Weather'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size exceeds 5 MB.');
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      showToast('Please enter post content.');
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
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPosts([res.data, ...posts]);
      setNewContent('');
      setSelectedFile(null);
      setImagePreview(null);
      setNewLocation('');
      showToast('🌾 Post published to AgriNex community!');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to publish post.';
      showToast(errMsg);
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const newLikedState = !post.is_liked;
      const newCount = newLikedState ? (post.likes_count || 0) + 1 : Math.max(0, (post.likes_count || 0) - 1);

      setPosts(posts.map(p => p.id === postId ? { ...p, is_liked: newLikedState, likes_count: newCount } : p));
      await api.post(`/posts/${postId}/like`);
    } catch (_) {}
  };

  const handleBookmark = async (postId: number) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const newSavedState = !post.is_saved;

      setPosts(posts.map(p => p.id === postId ? { ...p, is_saved: newSavedState } : p));
      await api.post(`/posts/${postId}/save`);
      showToast(newSavedState ? 'Post saved to bookmarks' : 'Post removed from bookmarks');
    } catch (_) {}
  };

  const handleShare = (post: any) => {
    if (navigator.share) {
      navigator.share({
        title: 'AgriNex Farming Community Post',
        text: post.content,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/community#post-${post.id}`);
      showToast('🔗 Post link copied to clipboard!');
    }
  };

  // Moderation & Reporting
  const handleOpenReport = (post: any) => {
    setActiveMenuPostId(null);
    setReportingPost(post);
  };

  const handleSubmitReport = async () => {
    if (!reportingPost) return;
    try {
      setSubmittingReport(true);
      await api.post(`/posts/${reportingPost.id}/report`, { reason: reportReason.toLowerCase() });
      showToast('🚩 Post reported successfully. Our team is reviewing it.');
      setHiddenPostIds(prev => [...prev, reportingPost.id]);
      setReportingPost(null);
    } catch (err: any) {
      showToast('Failed to report post. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleBlockUser = async (targetUserId: number) => {
    setActiveMenuPostId(null);
    try {
      await api.post(`/users/${targetUserId}/block`);
      setBlockedUserIds(prev => [...prev, targetUserId]);
      showToast('🚫 User blocked. Their posts will no longer appear in your feed.');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to block user');
    }
  };

  const handleHidePost = (postId: number) => {
    setActiveMenuPostId(null);
    setHiddenPostIds(prev => [...prev, postId]);
    showToast('👁 Post hidden from your feed.');
  };

  // Comments
  const handleOpenComments = async (post: any) => {
    setActivePostForComments(post);
    setLoadingComments(true);
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentVal.trim() || !activePostForComments) return;
    try {
      setSubmittingComment(true);
      const res = await api.post(`/posts/${activePostForComments.id}/comments`, {
        content: newCommentVal.trim()
      });
      setComments([...comments, res.data]);
      setNewCommentVal('');
      setPosts(posts.map(p => p.id === activePostForComments.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
    } catch (err: any) {
      showToast('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Query suggested farmers
  const { data: suggestedFarmers = [] } = useQuery({
    queryKey: ['suggested_users_community'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/users/suggested');
        return res.data;
      } catch {
        const res = await api.get('/users/suggested');
        return res.data;
      }
    }
  });

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if (hiddenPostIds.includes(post.id)) return false;
    if (blockedUserIds.includes(post.user_id)) return false;
    if (selectedCategory === 'All') return true;
    return post.crop_category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-8 pb-12">

      {/* ─── TOAST NOTIFICATION ─── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-[#1B5E20] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 text-sm font-bold"
          >
            <span>🌾</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HEADER & CATEGORY TABS ─── */}
      <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E0E7DE] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-xs font-black uppercase tracking-wider mb-2">
              <span>🌾</span> Farmers Community Feed
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#1A2E1A]">
              AgriNex <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#66BB6A]">Community</span>
            </h1>
            <p className="text-sm font-medium text-[#546E7A] mt-1">
              Connect with 12,000+ progressive farmers, agronomists, and crop specialists nationwide.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#2E7D32] animate-ping"></span>
            <span className="text-xs font-bold text-[#2E7D32]">Moderation Shield Active</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-[#1B5E20] text-white shadow-[0_4px_15px_rgba(27,94,32,0.25)]'
                  : 'bg-[#F1F8E9] text-[#1A2E1A] hover:bg-[#E8F5E9]'
              }`}
            >
              {cat === 'All' && '🌱 All Discussions'}
              {cat === 'Disease Alert' && '⚠️ Disease Alerts'}
              {cat === 'Farming Tips' && '💡 Farming Tips'}
              {cat === 'Market' && '📈 Market Prices'}
              {cat === 'Q&A' && '❓ Agronomy Q&A'}
              {cat === 'Weather' && '🌤️ Weather Intel'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── MAIN 2-COLUMN COMMUNITY LAYOUT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT 2 COLUMNS: POST CREATOR & FEED */}
        <div className="lg:col-span-2 space-y-6">

          {/* Post Creation Card */}
          <div className="bg-white rounded-[22px] p-6 border border-[#E0E7DE] shadow-sm">
            <div className="flex items-start gap-4">
              <img
                src={user?.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || 'user'}`}
                alt="avatar"
                className="w-11 h-11 rounded-full border-2 border-[#66BB6A] object-cover shrink-0 bg-white"
              />
              <div className="flex-1 space-y-3">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share crop progress, ask pest queries, or post farming tips..."
                  rows={3}
                  className="w-full rounded-2xl bg-[#F1F8E9] border border-[#E0E7DE] p-4 text-sm text-[#1A2E1A] placeholder-[#546E7A] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all resize-none"
                />

                {/* Preview Image if selected */}
                {imagePreview && (
                  <div className="relative rounded-xl overflow-hidden border border-[#E0E7DE] max-h-60">
                    <img src={imagePreview} alt="upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F1F8E9] hover:bg-[#E8F5E9] text-xs font-bold text-[#1B5E20] transition-all"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>{selectedFile ? 'Change Photo' : 'Attach Photo'}</span>
                    </button>

                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#F1F8E9] text-xs font-bold text-[#1A2E1A] border-none focus:ring-1 focus:ring-[#2E7D32]"
                    >
                      <option value="Farming Tips">Farming Tips</option>
                      <option value="Disease Alert">Disease Alert</option>
                      <option value="Market">Market</option>
                      <option value="Q&A">Q&A</option>
                      <option value="Weather">Weather</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCreatePost}
                    disabled={publishing || !newContent.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' }}
                  >
                    {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{publishing ? 'Publishing...' : 'Post Update'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed with Staggered Animation */}
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-[20px] skeleton-shimmer" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-[22px] p-12 text-center border border-[#E0E7DE] shadow-sm space-y-3">
              <span className="text-5xl block animate-float-leaf">🌾</span>
              <h3 className="text-lg font-black text-[#1A2E1A]">No posts found in this category</h3>
              <p className="text-xs text-[#546E7A]">Be the first farmer to start a discussion or share advice!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredPosts.map((post, index) => {
                const isHidden = post.is_hidden || (post.report_count || 0) >= 3;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    className="bg-white rounded-[20px] p-6 border border-[#E0E7DE] shadow-[0_4px_20px_rgba(27,94,32,0.06)] hover:shadow-[0_8px_30px_rgba(27,94,32,0.12)] transition-all relative"
                  >
                    {isHidden ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs font-bold text-[#546E7A] flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#F57F17]" />
                        <span>Post removed - community guidelines</span>
                      </div>
                    ) : (
                      <>
                        {/* Author Section */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={post.author_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.user_id || 'farmer'}`}
                              alt="author"
                              className="w-11 h-11 rounded-full border-2 border-[#2E7D32] object-cover bg-white ring-2 ring-[#E8F5E9]"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-black text-[#1B5E20]">
                                  {post.author_name || `Farmer ${post.user_id}`}
                                </h4>
                                {post.author_verified && (
                                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32] fill-green-100" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-[#546E7A] font-medium">
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                {post.location && (
                                  <span className="flex items-center gap-0.5 text-[#2E7D32]">
                                    <MapPin className="w-3 h-3" /> {post.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Options Menu Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                              className="p-2 rounded-xl text-[#546E7A] hover:text-[#1A2E1A] hover:bg-[#F1F8E9] transition-all"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuPostId === post.id && (
                              <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-xl border border-[#E0E7DE] p-1.5 z-30 space-y-1">
                                <button
                                  onClick={() => handleOpenReport(post)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all text-left"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                  <span>🚩 Report Post</span>
                                </button>
                                {post.user_id !== user?.id && (
                                  <button
                                    onClick={() => handleBlockUser(post.user_id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#546E7A] hover:bg-slate-50 transition-all text-left"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>🚫 Block User</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleHidePost(post.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#546E7A] hover:bg-slate-50 transition-all text-left"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>👁 Hide Post</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content text */}
                        <p className="text-sm text-[#1A2E1A] leading-relaxed whitespace-pre-line mb-4 font-normal">
                          {post.content}
                        </p>

                        {/* Attached Image with Lightbox click */}
                        {post.image_url && (
                          <div 
                            onClick={() => setLightboxImage(getImageUrl(post.image_url))}
                            className="rounded-2xl overflow-hidden border border-[#E0E7DE] mb-4 cursor-pointer group relative max-h-96"
                          >
                            <img
                              src={getImageUrl(post.image_url)}
                              alt="post attachment"
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                              🔍 Click to enlarge
                            </div>
                          </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-[#546E7A] font-bold">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleLike(post.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                                post.is_liked
                                  ? 'text-red-500 bg-red-50'
                                  : 'hover:bg-[#F1F8E9] hover:text-[#1B5E20]'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-red-500 text-red-500 animate-bounce' : ''}`} />
                              <span>{post.likes_count || 0}</span>
                            </button>

                            <button
                              onClick={() => handleOpenComments(post)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#F1F8E9] hover:text-[#1B5E20] transition-all"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments_count || 0}</span>
                            </button>

                            <button
                              onClick={() => handleShare(post)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#F1F8E9] hover:text-[#1B5E20] transition-all"
                            >
                              <Share2 className="w-4 h-4" />
                              <span>Share</span>
                            </button>
                          </div>

                          <button
                            onClick={() => handleBookmark(post.id)}
                            className={`p-2 rounded-xl transition-all ${
                              post.is_saved
                                ? 'text-[#F9A825] bg-amber-50'
                                : 'hover:bg-[#F1F8E9] hover:text-[#1A2E1A]'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${post.is_saved ? 'fill-[#F9A825]' : ''}`} />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: TRENDING TOPICS, SUGGESTED FARMERS, CALENDAR */}
        <div className="space-y-6">

          {/* Trending Topics */}
          <div className="bg-white rounded-[22px] p-6 border border-[#E0E7DE] shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#1A2E1A] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2E7D32]" />
              <span>Trending Farm Discussions</span>
            </h3>

            <div className="space-y-2.5">
              {[
                { tag: '#KharifPaddy', posts: '2.4k posts', desc: 'Brown plant hopper warning' },
                { tag: '#TomatoBlight', posts: '1.8k posts', desc: 'Foliar spray remedies' },
                { tag: '#DripIrrigation', posts: '940 posts', desc: 'Subsidies and timers' },
                { tag: '#OrganicNeem', posts: '620 posts', desc: 'Pest prevention recipes' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#F1F8E9] hover:bg-[#E8F5E9] transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#1B5E20]">{item.tag}</span>
                    <span className="text-[10px] font-bold text-[#546E7A]">{item.posts}</span>
                  </div>
                  <p className="text-[11px] text-[#546E7A] mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Farmers */}
          <div className="bg-white rounded-[22px] p-6 border border-[#E0E7DE] shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#1A2E1A] flex items-center gap-2">
              <span>🌾</span>
              <span>Suggested Farmers to Connect</span>
            </h3>

            <div className="space-y-3">
              {suggestedFarmers.slice(0, 4).map((f: any) => (
                <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F1F8E9] transition-all">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={f.profile_photo || f.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${f.id}`}
                      alt="farmer"
                      className="w-9 h-9 rounded-full object-cover border border-[#A5D6A7]"
                    />
                    <div>
                      <h5 className="text-xs font-bold text-[#1A2E1A] truncate max-w-[110px]">
                        {f.display_name || f.full_name || `Farmer ${f.id}`}
                      </h5>
                      <p className="text-[10px] text-[#546E7A]">{f.village || 'Progressive Grower'}</p>
                    </div>
                  </div>
                  <FollowButton userId={f.id} initialIsFollowing={f.is_following} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Active Disease Alerts Widget */}
          <div className="bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] rounded-[22px] p-6 border border-[#FFCC80] shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#E65100]">
              <AlertTriangle className="w-4 h-4 text-[#E65100]" />
              <span>Regional Disease Alert</span>
            </div>
            <h4 className="text-sm font-black text-[#5D4037]">Late Blight in Solanaceae Crops</h4>
            <p className="text-xs text-[#5D4037]/90 leading-relaxed">
              High humidity & cloud cover triggers spore dispersal. Spray Mancozeb 75% WP @ 2g/L or copper oxychloride preventively.
            </p>
          </div>

          {/* Seasonal Farming Calendar */}
          <div className="bg-white rounded-[22px] p-6 border border-[#E0E7DE] shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-[#1B5E20]">
              <Calendar className="w-4 h-4 text-[#2E7D32]" />
              <span>Farming Calendar • Sept - Oct</span>
            </div>
            <ul className="text-xs space-y-2 text-[#546E7A]">
              <li className="flex items-start gap-2">
                <span className="text-[#2E7D32] font-bold">✓</span>
                <span>Harvest early Kharif groundnut and green gram.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2E7D32] font-bold">✓</span>
                <span>Field prep for Rabi wheat, mustard, and chickpea.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2E7D32] font-bold">✓</span>
                <span>Deep summer plowing to eliminate pest pupae.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* ─── REPORT REASON MODAL ─── */}
      <AnimatePresence>
        {reportingPost && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-[#E0E7DE] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <Flag className="w-5 h-5" />
                  <h3 className="text-base font-black text-[#1A2E1A]">Report Post</h3>
                </div>
                <button onClick={() => setReportingPost(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#546E7A]">
                Help us keep AgriNex safe. Select the reason why this post violates agricultural community standards:
              </p>

              <div className="space-y-2">
                {['Spam', 'Offensive', 'Harassment', 'Irrelevant', 'Misinformation'].map((reason) => (
                  <label 
                    key={reason}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      reportReason === reason
                        ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#1B5E20]'
                        : 'border-[#E0E7DE] text-[#1A2E1A] hover:bg-slate-50'
                    }`}
                  >
                    <span>{reason}</span>
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="text-[#2E7D32] focus:ring-[#2E7D32]"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReportingPost(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#546E7A] hover:bg-slate-50"
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

      {/* ─── IMAGE LIGHTBOX MODAL ─── */}
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
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-all z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <img src={lightboxImage} alt="enlarged crop" className="w-full h-full object-contain max-h-[85vh] rounded-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── COMMENT THREAD MODAL / DRAWER ─── */}
      <AnimatePresence>
        {activePostForComments && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActivePostForComments(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-[24px] p-6 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E0E7DE]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-[#1A2E1A]">Comments & Advice</h3>
                <button onClick={() => setActivePostForComments(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {loadingComments ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2E7D32]" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#546E7A]">
                    No comments yet. Share your agronomic advice below!
                  </div>
                ) : (
                  comments.map((cmt) => (
                    <div key={cmt.id} className="p-3 rounded-xl bg-[#F1F8E9] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1B5E20]">
                          {cmt.author_name || `Farmer ${cmt.user_id}`}
                        </span>
                        <span className="text-[10px] text-[#546E7A]">
                          {new Date(cmt.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#1A2E1A]">{cmt.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={newCommentVal}
                  onChange={(e) => setNewCommentVal(e.target.value)}
                  placeholder="Add your farming advice..."
                  className="flex-1 rounded-xl bg-[#F1F8E9] border border-[#E0E7DE] px-4 py-2.5 text-xs text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newCommentVal.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
