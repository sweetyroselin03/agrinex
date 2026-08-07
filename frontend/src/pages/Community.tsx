import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  MapPin, 
  Send,
  Loader2,
  Users,
  CheckCircle2,
  X,
  Sparkles,
  ChevronRight,
  UserCheck,
  Pencil,
  Video,
  Search
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import UserSearchBar from '../components/UserSearchBar';
import FollowButton from '../components/FollowButton';

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Feed states
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'farmers' | 'posts'>('posts');
  const [postSearchQuery, setPostSearchQuery] = useState('');
  
  // Post publisher states
  const [newContent, setNewContent] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' }[]>([]);
  const [mediaCompressing, setMediaCompressing] = useState(false);
  const [showPublisher, setShowPublisher] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Post modal states
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [updatingPost, setUpdatingPost] = useState(false);

  // Comment Thread drawer states
  const [activePostForComments, setActivePostForComments] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentVal, setNewCommentVal] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // React Query for Suggested Farmers
  const { data: suggestedFarmers = [], isLoading: loadingSuggested } = useQuery({
    queryKey: ['suggested_users'],
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

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoadingPosts(true);
    setPostSearchQuery('');
    try {
      const res = await api.get('/posts?limit=10&skip=0');
      setPosts(res.data);
      setHasMore(res.data.length >= 10);
    } catch (e) {
      console.warn('Failed to load posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handlePostSearch = async (val: string) => {
    setPostSearchQuery(val);
    if (!val.trim()) {
      fetchFeed();
      return;
    }
    setLoadingPosts(true);
    try {
      const res = await api.get(`/posts/search?q=${encodeURIComponent(val)}`);
      setPosts(res.data);
      setHasMore(false); // Search returns full results
    } catch {
      console.warn("Search posts failed");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`/posts?skip=${posts.length}&limit=10`);
      if (res.data.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...res.data]);
        setHasMore(res.data.length >= 10);
      }
    } catch (e) {
      console.warn('Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  };

  // Image compressor using canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(event.target?.result as string);
        };
      };
      reader.onerror = () => {
        resolve('');
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setMediaCompressing(true);
    const newMedia = [...selectedMedia];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isImage && !isVideo) continue;
      
      if (isVideo) {
        if (file.size > 8 * 1024 * 1024) {
          alert("Video files must be under 8MB to preserve platform performance.");
          continue;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise<void>((resolve) => {
          reader.onload = () => {
            // Video is exclusive, replace all previous files
            newMedia.length = 0;
            newMedia.push({
              file,
              preview: reader.result as string,
              type: 'video'
            });
            resolve();
          };
        });
        break; // Stop processing since video is exclusive
      } else {
        // Image
        // If there was a video, clear it
        const imageMedia = newMedia.filter(m => m.type === 'image');
        if (imageMedia.length >= 5) {
          alert("You can upload a maximum of 5 images.");
          break;
        }
        const compressed = await compressImage(file);
        if (compressed) {
          // Remove any existing video
          const cleaned = newMedia.filter(m => m.type === 'image');
          cleaned.push({
            file,
            preview: compressed,
            type: 'image'
          });
          newMedia.length = 0;
          newMedia.push(...cleaned);
        }
      }
    }
    
    setSelectedMedia(newMedia);
    setMediaCompressing(false);
    e.target.value = '';
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || publishing || mediaCompressing) return;
    setPublishing(true);

    const imagesList = selectedMedia.filter(m => m.type === 'image').map(m => m.preview);
    const videoUrl = selectedMedia.find(m => m.type === 'video')?.preview || null;
    const finalImageUrl = videoUrl || (imagesList.length > 0 ? imagesList[0] : null);

    try {
      await api.post('/posts', {
        content: newContent.trim(),
        image_url: finalImageUrl,
        images: imagesList,
        location: newLocation.trim() || null
      });
      setNewContent('');
      setNewLocation('');
      setSelectedMedia([]);
      setShowPublisher(false);
      fetchFeed();
    } catch (err) {
      alert('Post creation failed.');
    } finally {
      setPublishing(false);
    }
  };

  const handleEditClick = (post: any) => {
    setEditingPost(post);
    setEditContent(post.content || '');
    setEditLocation(post.location || '');
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || updatingPost || !editingPost) return;
    setUpdatingPost(true);

    try {
      const res = await api.put(`/posts/${editingPost.id}`, {
        content: editContent.trim(),
        location: editLocation.trim() || null
      });
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...res.data } : p));
      setEditingPost(null);
    } catch (err) {
      alert('Failed to update post.');
    } finally {
      setUpdatingPost(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, is_liked: res.data.liked, likes_count: res.data.likes_count } 
          : p
      ));
    } catch (err) {}
  };

  const handleSave = async (postId: number) => {
    try {
      const res = await api.post(`/posts/${postId}/save`);
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, is_saved: res.data.saved } 
          : p
      ));
    } catch (err) {}
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this community post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      alert('Delete request failed.');
    }
  };

  const openCommentsDrawer = async (post: any) => {
    setActivePostForComments(post);
    setNewCommentVal('');
    setComments([]);
    setLoadingComments(true);
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data);
    } catch (e) {
      console.warn('Failed to load comments thread');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentVal.trim() || !activePostForComments || submittingComment) return;
    setSubmittingComment(true);

    try {
      const res = await api.post(`/posts/${activePostForComments.id}/comments`, {
        content: newCommentVal.trim()
      });
      setComments(prev => [res.data, ...prev]);
      setNewCommentVal('');
      setPosts(prev => prev.map(p => 
        p.id === activePostForComments.id 
          ? { ...p, comments_count: (p.comments_count || 0) + 1 } 
          : p
      ));
    } catch (err) {
      alert('Failed to send comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative font-sans selection:bg-brandLight selection:text-brandDark">
      
      {/* ─── LEFT COLUMN: SOCIAL FEED (8 Cols) ─── */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Global Farmer Search Bar Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-extrabold text-brandDark tracking-tight">AgriNex Social Community</h1>
              <p className="text-textSec text-xs">Connect with farmers nationwide, share yield updates & local pest alerts.</p>
            </div>
            
            <button
              onClick={() => setShowPublisher(!showPublisher)}
              className="px-4 py-2.5 rounded-xl bg-primary text-brandDark hover:bg-primary/90 font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Post</span>
            </button>
          </div>

          {/* Tabbed search selector */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'posts' ? 'bg-white text-brandDark shadow-xs' : 'text-textSec hover:text-brandDark'
              }`}
            >
              Search Posts
            </button>
            <button
              onClick={() => setActiveTab('farmers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'farmers' ? 'bg-white text-brandDark shadow-xs' : 'text-textSec hover:text-brandDark'
              }`}
            >
              Search Farmers
            </button>
          </div>

          {activeTab === 'farmers' ? (
            <UserSearchBar placeholder="Search farmers by name, username, village, or crops..." />
          ) : (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search feed updates, pest alerts, or keywords..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl text-xs text-brandDark outline-none transition-all placeholder:text-slate-400"
                value={postSearchQuery}
                onChange={(e) => handlePostSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Dynamic Post Publisher Card */}
        <AnimatePresence>
          {showPublisher && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card p-6 border-slate-200 overflow-hidden"
            >
              <form onSubmit={handleCreatePost} className="space-y-4">
                <textarea
                  required
                  rows={3}
                  placeholder="Share a farming warning, crop query, or yield report with your peers..."
                  className="w-full border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-4 text-xs text-brandDark placeholder-slate-400 outline-none resize-none transition-all leading-normal"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />

                {/* Media Previews */}
                {selectedMedia.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {selectedMedia.map((m, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 group">
                        {m.type === 'video' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-1">
                            <Video className="w-6 h-6 text-primary" />
                            <span className="text-[8px] truncate max-w-full">Video file</span>
                          </div>
                        ) : (
                          <img src={m.preview} alt="upload preview" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={mediaCompressing}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-textSec hover:text-primary transition-all flex items-center gap-1.5 text-xs font-bold"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Attach Media</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="relative flex-1 min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Location (optional)"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs text-brandDark outline-none transition-all"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                    />
                  </div>
                </div>

                {mediaCompressing && (
                  <div className="flex items-center gap-2 text-xs text-primary font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compressing media attachments...</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPublisher(false);
                      setSelectedMedia([]);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-textSec text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={publishing || mediaCompressing || !newContent.trim()}
                    className="px-6 py-2 rounded-xl bg-primary text-brandDark hover:bg-primary/90 font-extrabold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                  >
                    {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social Feed List */}
        {loadingPosts ? (
          <div className="glass-card p-12 text-center text-textSec text-xs flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Loading community feed...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card p-12 text-center text-textSec text-xs space-y-3">
            <Sparkles className="w-8 h-8 text-primary mx-auto opacity-70" />
            <h3 className="font-extrabold text-brandDark text-sm">No community posts found</h3>
            <p className="text-slate-400 max-w-sm mx-auto">Be the first farmer to share a field update or pest warning with your network.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const isOwner = user && user.id === post.user_id;
              
              // Handle images list parse safely
              let parsedImages: string[] = [];
              if (post.images) {
                if (Array.isArray(post.images)) {
                  parsedImages = post.images;
                } else if (typeof post.images === 'string') {
                  try {
                    parsedImages = JSON.parse(post.images);
                  } catch {
                    parsedImages = [];
                  }
                }
              }

              return (
                <div key={post.id} className="glass-card p-6 space-y-4 hover:border-slate-300 transition-all">
                  
                  {/* Post Header with Author Link */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Link to={`/profile/${post.user_id}`} className="shrink-0 group">
                        <img
                          src={post.author_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.author_name || post.user_id}`}
                          alt={post.author_name || 'Author'}
                          className="w-11 h-11 rounded-full border border-slate-200 object-cover bg-slate-50 group-hover:ring-2 group-hover:ring-primary transition-all"
                        />
                      </Link>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/profile/${post.user_id}`}
                            className="font-extrabold text-brandDark text-sm truncate hover:text-primary transition-colors"
                          >
                            {post.author_name || `Farmer ${post.user_id}`}
                          </Link>
                          {post.location && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-textSec bg-slate-100 px-2 py-0.5 rounded-full font-medium shrink-0">
                              <MapPin className="w-3 h-3 text-primary" />
                              {post.location}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-textSec mt-0.5">
                          {new Date(post.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isOwner && (
                        <>
                          <button
                            onClick={() => handleEditClick(post)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Edit post"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 text-slate-400 hover:text-rose hover:bg-rose/10 rounded-xl transition-all"
                            title="Delete post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {!isOwner && (
                        <FollowButton
                          userId={post.user_id}
                          userName={post.author_name}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Optional Image or Video Attachment */}
                  {post.image_url && (post.image_url.startsWith('data:video/') || post.image_url.includes('.mp4') || post.image_url.startsWith('blob:')) ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-950 max-h-96">
                      <video
                        src={post.image_url}
                        controls
                        className="w-full h-full max-h-96 object-contain"
                      />
                    </div>
                  ) : parsedImages.length > 0 ? (
                    <div className={`grid gap-2 rounded-2xl overflow-hidden ${
                      parsedImages.length === 1 ? 'grid-cols-1' :
                      parsedImages.length === 2 ? 'grid-cols-2' :
                      parsedImages.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                    }`}>
                      {parsedImages.slice(0, 4).map((imgUrl: string, idx: number) => {
                        const isLast = idx === 3 && parsedImages.length > 4;
                        return (
                          <div key={idx} className="relative aspect-video bg-slate-50 border border-slate-100/50 max-h-80 overflow-hidden">
                            <img
                              src={imgUrl}
                              alt={`Post media ${idx + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            />
                            {isLast && (
                              <div className="absolute inset-0 bg-brandDark/60 backdrop-blur-xs flex items-center justify-center text-white text-lg font-black pointer-events-none">
                                +{parsedImages.length - 4} More
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : post.image_url ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 max-h-96">
                      <img
                        src={post.image_url}
                        alt="Post media"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null}

                  {/* Post Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-textSec">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          post.is_liked ? 'text-rose font-extrabold' : 'hover:text-brandDark'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-rose text-rose' : ''}`} />
                        <span>{post.likes_count || 0}</span>
                      </button>

                      <button
                        onClick={() => openCommentsDrawer(post)}
                        className="flex items-center gap-1.5 hover:text-brandDark transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments_count || 0}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleSave(post.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        post.is_saved ? 'text-primary' : 'hover:text-brandDark'
                      }`}
                      title={post.is_saved ? 'Unsave' : 'Save post'}
                    >
                      <Bookmark className={`w-4 h-4 ${post.is_saved ? 'fill-primary' : ''}`} />
                    </button>
                  </div>

                </div>
              );
            })}

            {/* Pagination Load More */}
            {hasMore && (
              <div className="text-center pt-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-brandDark hover:border-slate-300 disabled:opacity-50 transition-all inline-flex items-center gap-2"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  <span>Load More Posts</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ─── RIGHT COLUMN: NETWORKING SIDEBAR (4 Cols) ─── */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Current User Card */}
        <section className="glass-card p-6 text-center space-y-4">
          <Link to="/profile" className="inline-block group">
            <img
              src={user?.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || 'farmer'}`}
              alt="avatar"
              className="w-16 h-16 rounded-full border-2 border-slate-200 mx-auto object-cover bg-white group-hover:ring-4 group-hover:ring-primary/20 transition-all"
            />
          </Link>
          <div>
            <Link to="/profile">
              <h3 className="font-extrabold text-brandDark text-sm hover:text-primary transition-colors">
                {user?.full_name || 'My Profile'}
              </h3>
            </Link>
            <p className="text-[10px] text-textSec font-bold uppercase tracking-wider">{user?.village || 'Agricultural Hub'}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs">
            <div>
              <span className="font-black text-brandDark text-sm">{user?.posts_count || 0}</span>
              <span className="text-[9px] text-textSec font-bold uppercase tracking-wider block mt-0.5">Posts</span>
            </div>
            <div>
              <span className="font-black text-brandDark text-sm">{user?.followers_count || 0}</span>
              <span className="text-[9px] text-textSec font-bold uppercase tracking-wider block mt-0.5">Followers</span>
            </div>
            <div>
              <span className="font-black text-brandDark text-sm">{user?.following_count || 0}</span>
              <span className="text-[9px] text-textSec font-bold uppercase tracking-wider block mt-0.5">Following</span>
            </div>
          </div>

          <Link
            to="/profile"
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-brandDark text-xs font-bold rounded-xl transition-all block"
          >
            View Full Profile
          </Link>
        </section>

        {/* Suggested Farmers Network Widget */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-brandDark text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span>Suggested Farmers</span>
              </h3>
              <p className="text-textSec text-[10px]">Growers with similar crops and regional proximity.</p>
            </div>
          </div>

          <div className="space-y-3 pt-1 divide-y divide-slate-50">
            {loadingSuggested ? (
              <div className="text-center text-textSec text-xs flex justify-center items-center gap-2 py-6">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Finding recommended farmers...</span>
              </div>
            ) : suggestedFarmers.length === 0 ? (
              <div className="text-center text-textSec text-xs py-4">
                You are connected with all suggested farmers!
              </div>
            ) : (
              suggestedFarmers.map((sUser: any) => (
                <div key={sUser.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <Link to={`/profile/${sUser.id}`} className="flex items-center gap-2.5 min-w-0 group flex-1">
                    <img
                      src={sUser.profile_photo || sUser.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${sUser.email}`}
                      alt="avatar"
                      className="w-9 h-9 rounded-full border border-slate-200 object-cover bg-white shrink-0 group-hover:ring-2 group-hover:ring-primary transition-all"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs text-brandDark truncate group-hover:text-primary transition-colors">
                        {sUser.display_name || sUser.full_name || 'Farmer'}
                      </h4>
                      <p className="text-[10px] text-textSec truncate">{sUser.village || 'Agricultural Hub'}</p>
                    </div>
                  </Link>

                  <FollowButton
                    userId={sUser.id}
                    userName={sUser.display_name || sUser.full_name}
                    initialIsFollowing={sUser.is_following || sUser.isFollowing}
                    initialFollowersCount={sUser.followers_count || sUser.followers || 0}
                    size="sm"
                    className="shrink-0"
                  />
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* ─── MODAL OVERLAY: EDIT POST ─── */}
      <AnimatePresence>
        {editingPost && (
          <div className="fixed inset-0 z-50 bg-brandDark/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-slate-100 overflow-hidden"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-md font-extrabold text-brandDark">Edit Community Post</h3>
                <button
                  onClick={() => setEditingPost(null)}
                  className="p-1.5 text-textSec hover:text-brandDark hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePost} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-textSec mb-2">Content</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl p-3 text-xs text-brandDark outline-none resize-none"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-textSec mb-2">Location</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl px-3 py-2.5 text-xs text-brandDark outline-none"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPost(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-textSec text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingPost || !editContent.trim()}
                    className="px-6 py-2 rounded-xl bg-primary text-brandDark hover:bg-primary/90 font-extrabold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                  >
                    {updatingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── SLIDING DRAWER OVERLAY: COMMENT THREADS ─── */}
      <AnimatePresence>
        {activePostForComments && (
          <div 
            className="fixed inset-0 z-50 bg-brandDark/40 backdrop-blur-xs flex justify-end"
            onClick={() => setActivePostForComments(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white h-screen flex flex-col shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6 shrink-0">
                <div>
                  <h3 className="font-extrabold text-brandDark text-md">Comment Thread</h3>
                  <p className="text-textSec text-[10px] mt-0.5">Replies to {activePostForComments.author_name}'s update</p>
                </div>
                <button
                  onClick={() => setActivePostForComments(null)}
                  className="p-2 text-textSec hover:text-brandDark hover:bg-slate-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thread list scroll */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {loadingComments ? (
                  <div className="py-12 text-center text-textSec text-xs flex justify-center items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-12 text-center text-textSec text-xs">
                    No comments in this thread. Write one below.
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                      <img
                        src={comment.author_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${comment.author_name}`}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover shrink-0 bg-white border border-slate-200"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="font-extrabold text-brandDark truncate">{comment.author_name}</span>
                          <span className="text-[9px] text-textSec shrink-0">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-normal font-medium">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input form footer */}
              <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-4 mt-4 shrink-0 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Write a supportive reply..."
                  className="flex-1 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-xs text-brandDark placeholder-slate-400 outline-none transition-all"
                  value={newCommentVal}
                  onChange={(e) => setNewCommentVal(e.target.value)}
                  disabled={submittingComment}
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-primary text-brandDark hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center shrink-0"
                  disabled={!newCommentVal.trim() || submittingComment}
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
