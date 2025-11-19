// src/pages/Login.jsx
import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function onChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.post('/login', form);
      if (res.data.success) {
        navigate('/profile');
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-6">
      <main className="w-full max-w-md">
        <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-900 font-bold">DA</div>
            <h1 className="text-2xl font-semibold text-white">Welcome Back</h1>
          </div>

          {error && <div className="mb-4 text-red-400">{error}</div>}

          <p className="text-sm text-slate-300 mb-6">Sign in to your account to continue to DataAssociation.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-200 mb-1 block">Email</label>
              <input name="email" value={form.email} onChange={onChange} type="email" required className="w-full rounded-md px-4 py-2 bg-white/5 border border-white/10 text-white" />
            </div>

            <div>
              <label className="text-sm text-slate-200 mb-1 block">Password</label>
              <input name="password" value={form.password} onChange={onChange} type="password" required className="w-full rounded-md px-4 py-2 bg-white/5 border border-white/10 text-white" />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">Don't have an account? <button type="button" onClick={() => navigate('/')} className="text-primary font-medium">Register</button></div>
              <button type="submit" className="ml-4 inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-slate-900 font-semibold">Sign in</button>
            </div>
          </form>

          <hr className="my-6 border-white/5" />
          <p className="text-xs text-slate-400">By signing in you agree to our <a className="text-primary">terms</a> and <a className="text-primary">privacy policy</a>.</p>
        </section>
      </main>
    </div>
  );
}
