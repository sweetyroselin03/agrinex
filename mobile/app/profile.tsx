import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings, 
  Grid2x2, 
  Bookmark, 
  ChevronRight,
  Heart,
  MessageCircle,
  Calendar,
  Video,
  MapPin,
  ShieldCheck,
  Plus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import BottomNav from '../components/BottomNav';
import { useAuthStore } from '../store/useAuthStore';
import { usePostStore, Post } from '../store/usePostStore';
import Colors from '../constants/Colors';
import { useThemeStore } from '../store/useThemeStore';

const { width } = Dimensions.get('window');

export default function Profile() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { posts, savedPostIds, fetchPosts } = usePostStore();
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    fetchPosts();
  }, []);

  const userPosts = posts.filter(p => p.user_id === user?.id);

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image
        source={require('../assets/empty-posts.png')}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>No Posts Yet</Text>
      <Text style={styles.emptySubtitle}>
        Share your farming journey, crop updates, and AI insights.
      </Text>
      <TouchableOpacity 
        style={styles.createPostBtn}
        onPress={() => router.push('/(tabs)/community')}
      >
        <Plus size={20} color="white" />
        <Text style={styles.createPostBtnText}>Create First Post</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Modern Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
          >
            <Settings color="white" size={24} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.full_name ? user.full_name[0] : 'F'}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck color="white" size={16} fill="#10B981" />
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name || 'Farmer John'}</Text>
            <Text style={styles.userHandle}>@{user?.email?.split('@')[0] || 'farmer'}</Text>
            
            <View style={styles.locationContainer}>
              <MapPin size={14} color="#10B981" />
              <Text style={styles.locationText}>{user?.village || 'Green Valley'}, India</Text>
            </View>

            <Text style={styles.bioText}>
              {user?.bio || 'Passionate about smart farming and organic wheat cultivation. 🌱 Expert in soil health.'}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userPosts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1.2k</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>482</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.editProfileBtn}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Icon Tabs */}
          <View style={styles.tabsWrapper}>
            <TouchableOpacity onPress={() => setActiveTab('posts')} style={styles.tabItem}>
              <Grid2x2 color={activeTab === 'posts' ? '#10B981' : '#94A3B8'} size={26} />
              {activeTab === 'posts' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveTab('videos')} style={styles.tabItem}>
              <Video color={activeTab === 'videos' ? '#10B981' : '#94A3B8'} size={26} />
              {activeTab === 'videos' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveTab('saved')} style={styles.tabItem}>
              <Bookmark color={activeTab === 'saved' ? '#10B981' : '#94A3B8'} size={26} />
              {activeTab === 'saved' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts Content */}
        <View style={styles.contentSection}>
          {userPosts.length === 0 ? renderEmptyState() : (
            <View style={styles.postsGrid}>
              {userPosts.map((post, index) => (
                <TouchableOpacity key={index} style={styles.gridItem}>
                  {post.image_url ? (
                    <Image source={{ uri: post.image_url }} style={styles.gridImage} />
                  ) : (
                    <View style={styles.gridPlaceholder}>
                      <Text style={styles.gridText} numberOfLines={3}>{post.content}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 140,
    backgroundColor: '#F8FAFC',
  },
  profileHeader: {
    backgroundColor: '#10B981',
    paddingTop: 70,
    paddingBottom: 120,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  settingsBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -90,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: -90,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: '#FFFFFF',
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 56,
    fontWeight: '900',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  userHandle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 14,
  },
  bioText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#4B5563',
    lineHeight: 22,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    marginTop: 4,
  },
  editProfileBtn: {
    marginTop: 24,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  editProfileText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 15,
  },
  tabsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 26,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 14,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -15,
    width: 24,
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  contentSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingBottom: 120,
  },
  emptyImage: {
    width: 140,
    height: 140,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 18,
  },
  emptySubtitle: {
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  createPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 24,
    gap: 8,
  },
  createPostBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: (width - 52) / 2,
    height: (width - 52) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  gridText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
