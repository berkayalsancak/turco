export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  is_private: boolean;
  is_admin: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  media_urls: string[];
  caption: string | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: Profile;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  expires_at: string;
  profile?: Profile;
  viewed?: boolean;
}

export interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  music: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: Profile;
  liked_by_me?: boolean;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string | null;
  reel_id: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string | null;
  reel_id: string | null;
  parent_id: string | null;
  text: string;
  created_at: string;
  profile?: Profile;
  replies?: Comment[];
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_user?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string | null;
  media_url: string | null;
  read: boolean;
  created_at: string;
}

export interface Call {
  id: string;
  caller_id: string;
  callee_id: string;
  status: string;
  offer_sdp: string | null;
  answer_sdp: string | null;
  ice_candidates: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  post_id: string | null;
  reel_id: string | null;
  text: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
}
