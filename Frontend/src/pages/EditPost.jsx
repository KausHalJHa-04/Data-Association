// src/pages/EditPost.jsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom';

export default function EditPost() {
  const { id } = useParams();
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/post/${id}`);
        if (res.data.success) {
          setContent(res.data.data.post.content);
        } else {
          navigate('/profile');
        }
      } catch (err) {
        navigate('/profile');
      }
    }
    load();
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.put(`/update/${id}`, { content });
      if (res.data.success) navigate('/profile');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-6">
      <div className="container mx-auto max-w-2xl">
        <section className="bg-white/5 rounded-xl p-6 border border-white/10 shadow-lg">
          <h1 className="text-xl font-semibold mb-4">Edit Post</h1>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm text-slate-300">Post content</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              rows="6" required
              className="w-full rounded-md px-4 py-3 bg-transparent border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => navigate('/profile')} className="text-sm text-slate-300 hover:underline">Cancel</button>
              <div className="flex gap-3">
                <button type="submit" className="rounded-md bg-yellow-400 px-4 py-2 font-semibold text-slate-900">Update Post</button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
