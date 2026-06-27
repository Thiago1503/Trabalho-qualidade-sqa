export interface User {
  id: number;
  email: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  id: number;
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface Post {
  id: number;
  title: string;
  body: string;
  liked: boolean;
  reactions?: {
    likes: number;
    dislikes: number;
  };
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  skip: number;
  limit: number;
}

export interface LikedPostsResponse {
  posts: Post[];
  total: number;
  limit: number;
}
