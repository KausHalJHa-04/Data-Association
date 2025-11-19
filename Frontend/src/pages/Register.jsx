// src/pages/Register.jsx
import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({
    username: '', name: '', age: '', email: '', password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function onChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.post('/register', {
        username: form.username,
        name: form.name,
        age: Number(form.age),
        email: form.email,
        password: form.password
      });
      if (res.data.success) {
        navigate('/login');
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-white">Create your account</h1>
          <p className="text-sm text-slate-300 mb-6">Join DataAssociation — share posts and connect with others.</p>

          {error && <div className="mb-4 text-red-400">{error}</div>}

          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" value={form.name} onChange={onChange} placeholder="Full name" className="col-span-1 w-full rounded-md px-4 py-2 bg-white/5 border border-white/10 text-white" />
            <input name="username" value={form.username} onChange={onChange} placeholder="Username" className="col-span-1 w-full rounded-md px-4 py-2 bg-white/5 border border-white/10 text-white" />
            <input name="email" value={form.email} onChange={onChange} placeholder="Email" type="email" className="w-full rounded-md px-4 py-2 bg-white/5 border border-white/10 text-white" />
            <input name="age" value={form.age} onChange={onChange} placeholder="Age" type="number" className="w-full rounded-md px-4 py-2 bg-white/5 border border-white/10 text-white" />
            <input name="password" value={form.password} onChange={onChange} placeholder="Password" type="password" className="md:col-span-2 w-full rounded-md px-4 py-2 bg-white/5 border border-white/10 text-white" />
            <div className="col-span-1 md:col-span-2 flex items-center justify-between mt-2">
              <div className="text-sm text-slate-300">Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-primary font-medium">Login</button></div>
              <button type="submit" className="rounded-md bg-cyan-500 px-6 py-2 text-slate-900 font-semibold">Create Account</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
