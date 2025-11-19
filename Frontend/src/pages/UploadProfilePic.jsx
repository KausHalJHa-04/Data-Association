// src/pages/UploadProfilePic.jsx
import React, { useRef, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function UploadProfilePic() {
  const [preview, setPreview] = useState('/public/images/default-avatar.png');
  const fileRef = useRef(null);
  const navigate = useNavigate();

  function onChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) navigate('/profile');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-6">
      <div className="container mx-auto max-w-xl">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Upload Profile Picture</h1>
          <button onClick={() => navigate('/profile')} className="px-3 py-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10">Back to Profile</button>
        </header>

        <section className="bg-white/5 rounded-xl p-6 border border-white/10 shadow-lg text-center">
          <p className="text-sm text-slate-300 mb-4">Choose an image to set as your profile picture. Recommended: square image, under 2MB.</p>

          <form onSubmit={onSubmit} className="space-y-4" encType="multipart/form-data">
            <div className="flex flex-col items-center gap-3">
              <label htmlFor="image" className="w-full flex items-center justify-center px-4 py-2 bg-white/5 border border-white/10 rounded-md cursor-pointer hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-200 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0016.586 6L13 2.414A2 2 0 0011.586 2H4z" />
                </svg>
                <span className="text-sm">Select an image</span>
              </label>
              <input id="image" ref={fileRef} type="file" name="image" accept="image/*" className="hidden" onChange={onChange} />

              <div id="preview" className="w-40 h-40 rounded-full overflow-hidden bg-slate-700 mx-auto">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button type="button" onClick={() => navigate('/profile')} className="text-sm text-slate-300 hover:underline">Cancel</button>
              <button type="submit" className="rounded-md bg-cyan-500 px-5 py-2 text-slate-900 font-semibold">Upload Picture</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
