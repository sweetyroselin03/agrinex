import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Plus, 
  Search,
  Camera
} from 'lucide-react-native';
import BottomNav from '../components/BottomNav';
import { usePostStore } from '../store/usePostStore';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export default function Community() {
  const { posts, fetchPosts, likePost, isLoading } = usePostStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AgriFeed</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Search color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Plus color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stories Simulation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories}>
          <TouchableOpacity style={styles.addStory}>
            <View style={styles.storyCirclePlus}>
              <Plus color="white" size={20} />
            </View>
            <Text style={styles.storyName}>Your Story</Text>
          </TouchableOpacity>
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} style={styles.storyItem}>
              <View style={styles.storyBorder}>
                <View style={styles.storyCircle}>
                   <Text style={styles.storyInitial}>{i === 1 ? 'S' : i === 2 ? 'M' : 'F'}</Text>
                </View>
              </View>
              <Text style={styles.storyName}>Farmer {i}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Feed Posts */}
        {posts.map((post, index) => (
          <MotiView
            key={post.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 100 }}
            style={styles.postCard}
          >
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                <View style={styles.avatar}>
                   <Text style={styles.avatarText}>{post.author_name ? post.author_name[0] : 'F'}</Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{post.author_name}</Text>
                  <Text style={styles.postTime}>2 hours ago</Text>
                </View>
              </View>
              <TouchableOpacity>
                <MoreVertical color="#9ca3af" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.postText}>{post.content}</Text>
            
            {post.image_url && (
              <Image 
                source={{ uri: post.image_url }} 
                style={styles.postImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.postFooter}>
              <View style={styles.actions}>
                <TouchableOpacity 
                  onPress={() => likePost(post.id)}
                  style={styles.actionButton}
                >
                  <Heart 
                    color={post.is_liked ? '#EF4444' : '#F8FAFC'} 
                    size={24} 
                    fill={post.is_liked ? '#EF4444' : 'transparent'}
                  />
                  <Text style={styles.actionText}>{post.likes_count}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <MessageCircle color="#F8FAFC" size={24} />
                  <Text style={styles.actionText}>{post.comments_count}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Share2 color="#F8FAFC" size={24} />
                </TouchableOpacity>
              </View>
            </View>
          </MotiView>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071226',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  stories: {
    paddingLeft: 20,
    marginBottom: 24,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  addStory: {
    alignItems: 'center',
    marginRight: 20,
  },
  storyCirclePlus: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  storyBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  storyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0B1730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  storyName: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  authorName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  postTime: {
    color: '#6b7280',
    fontSize: 12,
  },
  postText: {
    color: '#F8FAFC',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
});
