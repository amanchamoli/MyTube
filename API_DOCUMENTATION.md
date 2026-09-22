# YouTube Clone Backend - API Documentation 

> Complete API reference, data contracts, authentication guidelines, and integration examples for the frontend team.

---

## 1. Overview & Setup

- **Base URL**: `http://localhost:8000/api/v1` (configured via `PORT` in `.env`, default: `8000`)
- **CORS**: Configured with credentials support (`credentials: true`). Ensure requests send cookies if using cookie auth.
- **Content Types**:
  - Standard Requests: `application/json`
  - File Uploads: `multipart/form-data`

---

## 2. Authentication Architecture

The backend supports **two modes of token transmission**:
1. **HTTP-only Cookies** (Recommended for Web): Cookies named `accessToken` and `refreshToken` are set automatically on login and refresh.
2. **Authorization Header** (Mobile / SPA alternate):
   ```http
   Authorization: Bearer <accessToken>
   ```

### Token Lifecycles & Refresh Flow
- **Access Token**: Short-lived JWT containing `_id`, `email`, `username`, `fullname`.
- **Refresh Token**: Long-lived JWT stored in the database for issuing new access tokens.
- **Auto-Refresh Mechanism**:
  When an API request returns `401 Unauthorized`, call `POST /api/v1/users/refresh-token` with the refresh token (or with cookies), update stored tokens, and replay the failed request.

### Axios Interceptor Setup Example:
```typescript
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true, // Crucial for cookie transmission
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post("/users/refresh-token");
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login or clear auth state
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 3. Standard Response Format

### Success Response Envelope
All successful responses return HTTP status `200` or `201`:
```json
{
  "starusCode": 200,
  "data": { ... },
  "message": "Action completed successfully",
  "success": true
}
```
*(Note: The backend payload key is `starusCode` with an `r`)*

### Error Response Envelope
Error responses return status codes `400`, `401`, `403`, `404`, `409`, or `500`:
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Descriptive error message",
  "success": false,
  "errors": []
}
```

---

## 4. Frontend TypeScript Types

```typescript
export interface User {
  _id: string;
  username: string;
  email: string;
  fullname: string;
  avatar: string;
  coverImage?: string;
  watchHistory?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChannelProfile {
  _id: string;
  username: string;
  email: string;
  fullname: string;
  avatar: string;
  coverImage: string;
  subscribersCount: number;
  channelsSubscribedToCount: number;
  isSubscribed: boolean;
}

export interface Video {
  _id: string;
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number; // in seconds
  views: number;
  isPublished: boolean;
  owner: {
    _id: string;
    username: string;
    fullname: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface VideoDetail extends Video {
  likesCount: number;
  isLiked: boolean;
  owner: {
    _id: string;
    username: string;
    fullname: string;
    avatar: string;
    subscribersCount: number;
    isSubscribed: boolean;
  };
}

export interface Tweet {
  _id: string;
  content: string;
  owner: {
    _id: string;
    username: string;
    fullname: string;
    avatar: string;
  };
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  video: string;
  owner: {
    _id: string;
    username: string;
    fullname: string;
    avatar: string;
  };
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Playlist {
  _id: string;
  name: string;
  description: string;
  videos: Video[];
  owner: {
    _id: string;
    username: string;
    fullname: string;
    avatar: string;
  };
  totalVideos: number;
  totalViews: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelStats {
  totalSubscribers: number;
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
}

export interface PaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}
```

---

## 5. Endpoints Reference

### 🟢 Health Check
| Method | Endpoint | Auth | Content-Type |
|---|---|---|---|
| `GET` | `/healthcheck` | No | - |

#### Response:
```json
{
  "starusCode": 200,
  "data": {
    "status": "OK"
  },
  "message": "Server is healthy",
  "success": true
}
```

---

### 👤 User & Authentication (`/users`)

#### 1. Register User
`POST /users/register`
- **Auth**: No
- **Content-Type**: `multipart/form-data`
- **Body Form-Data**:
  - `fullname` (text, required)
  - `username` (text, required)
  - `email` (text, required)
  - `password` (text, required)
  - `avatar` (file, required)
  - `coverImage` (file, optional)
- **Response `201 Created`**:
```json
{
  "starusCode": 201,
  "data": {
    "_id": "651f1...123",
    "username": "aman",
    "email": "aman@example.com",
    "fullname": "Aman Chamoli",
    "avatar": "https://res.cloudinary.com/.../avatar.png",
    "coverImage": "https://res.cloudinary.com/.../cover.png",
    "createdAt": "2026-09-22T10:00:00.000Z",
    "updatedAt": "2026-09-22T10:00:00.000Z"
  },
  "message": "User registered successfully",
  "success": true
}
```

#### 2. Login User
`POST /users/login`
- **Auth**: No
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "username": "aman", // or "email": "aman@example.com"
  "password": "yourPassword123"
}
```
- **Response `200 OK`**:
*(Also automatically sets `accessToken` and `refreshToken` httpOnly cookies)*
```json
{
  "starusCode": 200,
  "data": {
    "user": {
      "_id": "651f1...123",
      "username": "aman",
      "email": "aman@example.com",
      "fullname": "Aman Chamoli",
      "avatar": "https://...",
      "coverImage": "https://..."
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  },
  "message": "User logged in successfully",
  "success": true
}
```

#### 3. Logout User
`POST /users/logout`
- **Auth**: Yes
- **Response `200 OK`**: Clears auth cookies.
```json
{
  "starusCode": 200,
  "data": {},
  "message": "User logged out successfully",
  "success": true
}
```

#### 4. Refresh Access Token
`POST /users/refresh-token`
- **Auth**: No (uses cookie or request body)
- **Content-Type**: `application/json`
- **Body** *(Optional if cookies sent)*:
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  },
  "message": "Access token refreshed successfully",
  "success": true
}
```

#### 5. Change Current Password
`POST /users/change-password`
- **Auth**: Yes
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "oldPassword": "oldPassword123",
  "newPassword": "newSecretPassword456"
}
```
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {},
  "message": "Password changed successfully",
  "success": true
}
```

#### 6. Get Current User Profile
`GET /users/current-user`
- **Auth**: Yes
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "_id": "651f1...123",
    "username": "aman",
    "email": "aman@example.com",
    "fullname": "Aman Chamoli",
    "avatar": "https://...",
    "coverImage": "https://...",
    "watchHistory": ["651a...", "651b..."],
    "createdAt": "2026-09-22T10:00:00.000Z",
    "updatedAt": "2026-09-22T10:00:00.000Z"
  },
  "message": "Current user fetched successfully",
  "success": true
}
```

#### 7. Update Account Details
`PATCH /users/update-account`
- **Auth**: Yes
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "fullname": "Aman Singh Chamoli",
  "email": "newemail@example.com"
}
```
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "_id": "651f1...123",
    "username": "aman",
    "email": "newemail@example.com",
    "fullname": "Aman Singh Chamoli",
    "avatar": "https://..."
  },
  "message": "Account details updated successfully",
  "success": true
}
```

#### 8. Update User Avatar
`PATCH /users/avatar`
- **Auth**: Yes
- **Content-Type**: `multipart/form-data`
- **Body Form-Data**:
  - `avatar` (file, required)
- **Response `200 OK`**: Returns updated user object with new avatar URL.

#### 9. Update User Cover Image
`PATCH /users/cover-image`
- **Auth**: Yes
- **Content-Type**: `multipart/form-data`
- **Body Form-Data**:
  - `coverImage` (file, required)
- **Response `200 OK`**: Returns updated user object with new coverImage URL.

#### 10. Get User Channel Profile
`GET /users/c/:username`
- **Auth**: Yes
- **URL Params**: `username` (e.g. `aman`)
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "_id": "651f1...123",
    "username": "aman",
    "email": "aman@example.com",
    "fullname": "Aman Chamoli",
    "avatar": "https://...",
    "coverImage": "https://...",
    "subscribersCount": 1420,
    "channelsSubscribedToCount": 42,
    "isSubscribed": false
  },
  "message": "User channel fetched successfully",
  "success": true
}
```

#### 11. Get Watch History
`GET /users/history`
- **Auth**: Yes
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": [
    {
      "_id": "6520...video1",
      "videoFile": "https://...",
      "thumbnail": "https://...",
      "title": "Backend Tutorial #1",
      "description": "Intro to Node",
      "duration": 345.2,
      "views": 150,
      "owner": {
        "_id": "651f...",
        "username": "aman",
        "fullname": "Aman Chamoli",
        "avatar": "https://..."
      }
    }
  ],
  "message": "Watch history fetched successfully",
  "success": true
}
```

---

### 🎥 Videos (`/videos`)

#### 1. Get All Videos (Paginated & Search)
`GET /videos`
- **Auth**: Yes
- **Query Params**:
  - `page` (number, default: `1`)
  - `limit` (number, default: `10`)
  - `query` (string, optional text search on title & description)
  - `sortBy` (string, default: `createdAt`)
  - `sortType` (`"asc"` | `"desc"`, default: `"desc"`)
  - `userId` (string, optional creator user ID filter)
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "docs": [
      {
        "_id": "652a...vid1",
        "videoFile": "https://res.cloudinary.com/.../video.mp4",
        "thumbnail": "https://res.cloudinary.com/.../thumb.jpg",
        "title": "Build a YouTube Clone",
        "description": "Full course step by step",
        "duration": 1824.5,
        "views": 482,
        "isPublished": true,
        "createdAt": "2026-09-20T12:00:00.000Z",
        "owner": {
          "_id": "651f...usr",
          "username": "aman",
          "fullname": "Aman Chamoli",
          "avatar": "https://..."
        }
      }
    ],
    "totalDocs": 24,
    "limit": 10,
    "page": 1,
    "totalPages": 3,
    "hasPrevPage": false,
    "hasNextPage": true,
    "prevPage": null,
    "nextPage": 2
  },
  "message": "Videos fetched successfully",
  "success": true
}
```

#### 2. Publish a Video
`POST /videos`
- **Auth**: Yes
- **Content-Type**: `multipart/form-data`
- **Body Form-Data**:
  - `title` (text, required)
  - `description` (text, required)
  - `videoFile` (file, required, video format)
  - `thumbnail` (file, required, image format)
- **Response `201 Created`**:
```json
{
  "starusCode": 201,
  "data": {
    "_id": "652a...vid1",
    "videoFile": "https://...",
    "thumbnail": "https://...",
    "title": "Build a YouTube Clone",
    "description": "Full course step by step",
    "duration": 1824.5,
    "views": 0,
    "isPublished": true,
    "owner": "651f...",
    "createdAt": "2026-09-22T12:00:00.000Z"
  },
  "message": "Video published successfully",
  "success": true
}
```

#### 3. Get Video by ID
`GET /videos/:videoId`
- **Auth**: Yes
- **Side Effects**: Automatically increments video `views` by 1 and pushes `videoId` to user's `watchHistory`.
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "_id": "652a...vid1",
    "videoFile": "https://...",
    "thumbnail": "https://...",
    "title": "Build a YouTube Clone",
    "description": "Full course step by step",
    "duration": 1824.5,
    "views": 483,
    "isPublished": true,
    "likesCount": 94,
    "isLiked": false,
    "createdAt": "2026-09-20T12:00:00.000Z",
    "owner": {
      "_id": "651f...usr",
      "username": "aman",
      "fullname": "Aman Chamoli",
      "avatar": "https://...",
      "subscribersCount": 1420,
      "isSubscribed": true
    }
  },
  "message": "Video fetched successfully",
  "success": true
}
```

#### 4. Update Video Details
`PATCH /videos/:videoId`
- **Auth**: Yes (Owner only)
- **Content-Type**: `multipart/form-data` (or `application/json` if not changing thumbnail)
- **Body Form-Data**:
  - `title` (text, optional)
  - `description` (text, optional)
  - `thumbnail` (file, optional)
- **Response `200 OK`**: Returns updated video object.

#### 5. Delete Video
`DELETE /videos/:videoId`
- **Auth**: Yes (Owner only)
- **Side Effect**: Cleans up video, as well as all associated comments and likes.
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {},
  "message": "Video deleted successfully",
  "success": true
}
```

#### 6. Toggle Video Publish Status
`PATCH /videos/toggle/publish/:videoId`
- **Auth**: Yes (Owner only)
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "isPublished": false
  },
  "message": "Publish status toggled successfully",
  "success": true
}
```

---

### 💬 Comments (`/comments`)

#### 1. Get Comments for a Video
`GET /comments/:videoId`
- **Auth**: Yes
- **Query Params**:
  - `page` (number, default: `1`)
  - `limit` (number, default: `10`)
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "docs": [
      {
        "_id": "653b...comm1",
        "content": "Awesome explanation!",
        "likesCount": 12,
        "isLiked": true,
        "createdAt": "2026-09-22T08:30:00.000Z",
        "owner": {
          "_id": "651f...",
          "username": "john_doe",
          "fullname": "John Doe",
          "avatar": "https://..."
        }
      }
    ],
    "totalDocs": 5,
    "limit": 10,
    "page": 1,
    "totalPages": 1
  },
  "message": "Comments fetched successfully",
  "success": true
}
```

#### 2. Add Comment
`POST /comments/:videoId`
- **Auth**: Yes
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "content": "Really helped me understand MongoDB aggregations!"
}
```
- **Response `201 Created`**: Returns created comment document.

#### 3. Update Comment
`PATCH /comments/c/:commentId`
- **Auth**: Yes (Comment owner only)
- **Body**:
```json
{
  "content": "Updated comment content"
}
```
- **Response `200 OK`**: Returns updated comment document.

#### 4. Delete Comment
`DELETE /comments/c/:commentId`
- **Auth**: Yes (Comment owner only)
- **Side Effect**: Deletes comment and associated comment likes.
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {},
  "message": "Comment deleted successfully",
  "success": true
}
```

---

### 👍 Likes (`/likes`)

#### 1. Toggle Video Like
`POST /likes/toggle/v/:videoId`
- **Auth**: Yes
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "isLiked": true // or false
  },
  "message": "Video liked", // or "Video unliked"
  "success": true
}
```

#### 2. Toggle Comment Like
`POST /likes/toggle/c/:commentId`
- **Auth**: Yes
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "isLiked": true
  },
  "message": "Comment liked",
  "success": true
}
```

#### 3. Toggle Tweet Like
`POST /likes/toggle/t/:tweetId`
- **Auth**: Yes
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "isLiked": true
  },
  "message": "Tweet liked",
  "success": true
}
```

#### 4. Get Liked Videos of Current User
`GET /likes/videos`
- **Auth**: Yes
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": [
    {
      "video": {
        "_id": "652a...",
        "videoFile": "https://...",
        "thumbnail": "https://...",
        "title": "Mastering React 19",
        "description": "Complete guide",
        "duration": 940,
        "views": 1020,
        "isPublished": true,
        "owner": {
          "_id": "651f...",
          "username": "alex",
          "fullname": "Alex Smith",
          "avatar": "https://..."
        }
      }
    }
  ],
  "message": "Liked videos fetched successfully",
  "success": true
}
```

---

### 🐦 Tweets / Community Posts (`/tweets`)

#### 1. Create Tweet
`POST /tweets`
- **Auth**: Yes
- **Body**:
```json
{
  "content": "Excited to launch our new video series today!"
}
```
- **Response `201 Created`**: Returns created tweet.

#### 2. Get User Tweets
`GET /tweets/user/:userId`
- **Auth**: Yes
- **URL Params**: `userId`
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": [
    {
      "_id": "654c...tweet1",
      "content": "Excited to launch our new video series today!",
      "likesCount": 8,
      "isLiked": false,
      "createdAt": "2026-09-22T14:00:00.000Z",
      "owner": {
        "_id": "651f...",
        "username": "aman",
        "fullname": "Aman Chamoli",
        "avatar": "https://..."
      }
    }
  ],
  "message": "User tweets fetched successfully",
  "success": true
}
```

#### 3. Update Tweet
`PATCH /tweets/:tweetId`
- **Auth**: Yes (Tweet owner only)
- **Body**:
```json
{
  "content": "Updated announcement text"
}
```
- **Response `200 OK`**: Returns updated tweet.

#### 4. Delete Tweet
`DELETE /tweets/:tweetId`
- **Auth**: Yes (Tweet owner only)
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {},
  "message": "Tweet deleted successfully",
  "success": true
}
```

---

### 📂 Playlists (`/playlist`)

#### 1. Create Playlist
`POST /playlist`
- **Auth**: Yes
- **Body**:
```json
{
  "name": "Backend Development Masterclass",
  "description": "Everything from Node.js to MongoDB aggregations"
}
```
- **Response `201 Created`**: Returns created playlist object.

#### 2. Get Playlist by ID
`GET /playlist/:playlistId`
- **Auth**: Yes
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "_id": "655d...pl1",
    "name": "Backend Development Masterclass",
    "description": "Everything from Node.js to MongoDB aggregations",
    "totalVideos": 3,
    "totalViews": 2400,
    "owner": {
      "_id": "651f...",
      "username": "aman",
      "fullname": "Aman Chamoli",
      "avatar": "https://..."
    },
    "videos": [
      {
        "_id": "652a...",
        "title": "Intro to Node.js",
        "thumbnail": "https://...",
        "duration": 540,
        "views": 800,
        "owner": {
          "_id": "651f...",
          "username": "aman",
          "fullname": "Aman Chamoli",
          "avatar": "https://..."
        }
      }
    ],
    "createdAt": "2026-09-21T09:00:00.000Z",
    "updatedAt": "2026-09-22T10:00:00.000Z"
  },
  "message": "Playlist fetched successfully",
  "success": true
}
```

#### 3. Get User Playlists
`GET /playlist/user/:userId`
- **Auth**: Yes
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": [
    {
      "_id": "655d...pl1",
      "name": "Backend Development Masterclass",
      "description": "Everything from Node.js to MongoDB aggregations",
      "totalVideos": 3,
      "totalViews": 2400,
      "updatedAt": "2026-09-22T10:00:00.000Z"
    }
  ],
  "message": "User playlists fetched successfully",
  "success": true
}
```

#### 4. Update Playlist
`PATCH /playlist/:playlistId`
- **Auth**: Yes (Playlist owner only)
- **Body**:
```json
{
  "name": "Updated Playlist Name",
  "description": "Updated Playlist Description"
}
```
- **Response `200 OK`**: Returns updated playlist.

#### 5. Delete Playlist
`DELETE /playlist/:playlistId`
- **Auth**: Yes (Playlist owner only)
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {},
  "message": "Playlist deleted successfully",
  "success": true
}
```

#### 6. Add Video to Playlist
`PATCH /playlist/add/:videoId/:playlistId`
- **Auth**: Yes (Playlist owner only)
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": { ...playlistDoc },
  "message": "Video added to playlist successfully",
  "success": true
}
```

#### 7. Remove Video from Playlist
`PATCH /playlist/remove/:videoId/:playlistId`
- **Auth**: Yes (Playlist owner only)
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": { ...playlistDoc },
  "message": "Video removed from playlist successfully",
  "success": true
}
```

---

### 🔔 Subscriptions (`/subscriptions`)

#### 1. Toggle Channel Subscription
`POST /subscriptions/c/:channelId`
- **Auth**: Yes
- **URL Params**: `channelId` (User ID of the channel)
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "isSubscribed": true // or false
  },
  "message": "Subscribed successfully", // or "Unsubscribed successfully"
  "success": true
}
```

#### 2. Get Subscribers of a Channel
`GET /subscriptions/c/:channelId`
- **Auth**: Yes
- **URL Params**: `channelId`
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": [
    {
      "subscriber": {
        "_id": "651f...",
        "username": "developer1",
        "fullname": "Dev One",
        "avatar": "https://...",
        "subscribedToSubscriber": false, // whether target channel also subscribes back
        "subscribersCount": 15
      }
    }
  ],
  "message": "Channel subscribers fetched successfully",
  "success": true
}
```

#### 3. Get Channels a User Has Subscribed To
`GET /subscriptions/u/:subscriberId`
- **Auth**: Yes
- **URL Params**: `subscriberId` (User ID)
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": [
    {
      "subscribedChannel": {
        "_id": "651f...",
        "username": "techlead",
        "fullname": "Tech Lead",
        "avatar": "https://...",
        "latestVideo": {
          "_id": "652a...",
          "videoFile": "https://...",
          "thumbnail": "https://...",
          "title": "System Design for Beginners",
          "description": "Intro to caching",
          "duration": 600,
          "views": 4200,
          "createdAt": "2026-09-22T05:00:00.000Z"
        }
      }
    }
  ],
  "message": "Subscribed channels fetched successfully",
  "success": true
}
```

---

### 📊 Creator Dashboard (`/dashboard`)

#### 1. Get Channel Analytics / Stats
`GET /dashboard/stats`
- **Auth**: Yes
- **Response `200 OK`**:
```json
{
  "starusCode": 200,
  "data": {
    "totalSubscribers": 1420,
    "totalVideos": 18,
    "totalViews": 45900,
    "totalLikes": 3810
  },
  "message": "Channel stats fetched successfully",
  "success": true
}
```

#### 2. Get Channel Videos (Creator Table)
`GET /dashboard/videos`
- **Auth**: Yes
- **Response `200 OK`**: Returns all videos uploaded by current logged in creator (including unpublished).
```json
{
  "starusCode": 200,
  "data": [
    {
      "_id": "652a...vid1",
      "videoFile": "https://...",
      "thumbnail": "https://...",
      "title": "Build a YouTube Clone",
      "description": "Full course step by step",
      "duration": 1824.5,
      "views": 483,
      "isPublished": true,
      "likesCount": 94,
      "createdAt": "2026-09-20T12:00:00.000Z"
    }
  ],
  "message": "Channel videos fetched successfully",
  "success": true
}
```

---

## 6. HTTP Status Codes Cheat Sheet

| Code | Status | Meaning for Frontend |
|---|---|---|
| `200` | OK | Request succeeded. |
| `201` | Created | Resource successfully created (registration, video publish, comment, tweet, playlist). |
| `400` | Bad Request | Missing required body fields, invalid ObjectId, or duplicate video in playlist. |
| `401` | Unauthorized | Missing token, invalid token, or expired token. Trigger token refresh. |
| `403` | Forbidden | Authenticated user is not the owner of the resource being edited/deleted. |
| `404` | Not Found | Resource (user, video, comment, tweet, playlist, channel) does not exist. |
| `409` | Conflict | User already exists with that username or email. |
| `500` | Internal Server Error | Server or Cloudinary upload error. |

---

## 7. Common Frontend Gotchas & Best Practices

1. **FormData Uploads**:
   When uploading avatars, cover images, videos, or thumbnails with `FormData`, do **not** manually set `'Content-Type': 'multipart/form-data'` header; let the browser/Axios set the boundary automatically:
   ```javascript
   const formData = new FormData();
   formData.append("title", title);
   formData.append("description", description);
   formData.append("videoFile", videoFileInput.files[0]);
   formData.append("thumbnail", thumbnailFileInput.files[0]);

   await api.post("/videos", formData);
   ```

2. **CORS & Credentials**:
   Always include `credentials: "include"` in `fetch` or `withCredentials: true` in `axios` so authentication cookies are transmitted and received.

3. **Response Envelope Notice**:
   Remember that the response status code inside the JSON payload is spelled `starusCode` (e.g. `res.data.starusCode`). The HTTP status code on the network response is standard (e.g. `res.status === 200`).

4. **ObjectId Validation**:
   Route parameters (e.g., `videoId`, `userId`, `playlistId`, `commentId`, `channelId`) are validated as MongoDB ObjectIds (24-character hex strings). Passing invalid strings will return a `400 Bad Request`.
