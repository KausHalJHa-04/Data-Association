// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await api.get('/profile');
      if (res.data.success) setUser(res.data.data.user);
      else {
        // not authenticated or other
        navigate('/login');
      }
    } catch (err) {
      navigate('/login');
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchProfile(); }, []);

  async function createPost(e) {
    e.preventDefault();
    try {
      const res = await api.post('/post', { content });
      if (res.data.success) {
        setContent('');
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleLike(postId) {
    try {
      const res = await api.post(`/like/${postId}`);
      if (res.data.success) fetchProfile();
    } catch (err) { console.error(err); }
  }

  async function logout() {
    try {
      await api.post('/logout');
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  if (!user) return <div className="p-6 text-white">No user</div>;

  return (
    <div className="container mx-auto p-6 bg-slate-700 min-h-screen text-white">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-900 font-bold">DA</div>
          <div>
            <div className="text-sm text-white font-semibold">Hello,</div>
            <h2 className="text-2xl font-semibold text-sky-300">{user.name}</h2>
            <div className="text-sm text-slate-400">@{user.username}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/upload" className="px-3 py-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-sky-400">Add Profile Pic</Link>
          <button onClick={logout} className="px-3 py-2 rounded-md bg-red-600 text-white hover:brightness-95">Logout</button>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="w-full flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-4 bg-slate-700">
              <img src={`/public/images/uploads/${user.profilepic}`} alt="profile" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium">{user.name}</h3>
              <p className="text-sm text-slate-300">@{user.username}</p>
              <p className="text-sm text-slate-400 mt-2">Age: {user.age}</p>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-2">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
            <h4 className="text-zinc-950 text-lg font-medium mb-2">Create a post</h4>
            <form onSubmit={createPost} className="space-y-3">
              <textarea value={content} onChange={e => setContent(e.target.value)} name="content" rows="3" placeholder="What's on your mind?"
                className="w-full rounded-md px-4 py-3 bg-transparent border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              <div className="flex justify-end">
                <button type="submit" className="rounded-md bg-cyan-500 px-5 py-2 text-slate-900 font-semibold">Create Post</button>
              </div>
            </form>
          </div>

          <div>
            <h3 className="text-slate-300 mb-4">Your Posts</h3>
            <div className="space-y-4">
              {user.posts && user.posts.length === 0 && <div className="text-slate-400">No posts yet</div>}
              {user.posts && user.posts.map(post => (
                <article key={post._id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-slate-400">@{user.username}</div>
                      <p className="mt-2 text-white">{post.content}</p>
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      <div>{post.likes?.length ?? 0} likes</div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-4">
                    <button onClick={() => toggleLike(post._id)} className="text-primary hover:underline">
                      {post.likes && post.likes.find(l => l.toString() === user._id.toString()) ? 'Unlike' : 'Like'}
                    </button>
                    <Link to={`/edit/${post._id}`} className="text-slate-300 hover:underline">Edit</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}
