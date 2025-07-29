import React, { useState, useEffect } from 'react';
import { User, Edit, Image as ImageIcon, Briefcase, BookOpen, Save, X, Link2 } from 'lucide-react';
import { getDatabase, ref, update, onValue } from 'firebase/database';
import { getAuth, updateProfile } from 'firebase/auth';

export default function ProfilePage({ user }) {
  const [editMode, setEditMode] = useState(false);
  
  // State for form fields
  const [name, setName] = useState(user.displayName || '');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [photoURLInput, setPhotoURLInput] = useState(''); // For the URL input field
  
  // State for ticket stats
  const [stats, setStats] =useState({ created: 0, working: 0, done: 0, canceled: 0, emailSent: 0 });

  // State for UI feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Store initial state to revert on cancel
  const [initialState, setInitialState] = useState(null);

  const db = getDatabase();
  const auth = getAuth();

  // Load user profile data and stats
  useEffect(() => {
    if (!user) return;

    const userRef = ref(db, `users/${user.uid}`);
    const onProfileValue = onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      const profileData = {
        name: user.displayName || '',
        bio: data.bio || '',
        company: data.company || '',
        photoURL: data.photoURL || user.photoURL || ''
      };
      
      setName(profileData.name);
      setBio(profileData.bio);
      setCompany(profileData.company);
      setPhotoURL(profileData.photoURL);
      
      // Store the initial state for the cancel functionality
      if (!editMode) {
        setInitialState(profileData);
        setPhotoURLInput(profileData.photoURL.startsWith('data:') ? '' : profileData.photoURL);
      }
    });

    const statsRef = ref(db, `stats/${user.uid}`);
    const onStatsValue = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStats({
          created: data.created || 0,
          working: data.working || 0,
          done: data.done || 0,
          canceled: data.canceled || 0,
          emailSent: data.emailSent || 0
        });
      }
    });

    return () => {
      onProfileValue();
      onStatsValue();
    };
  }, [user, db, editMode]); // Rerun if editMode changes to capture initial state

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile(auth.currentUser, { displayName: name, photoURL });
      
      const updates = {
        [`users/${user.uid}/bio`]: bio,
        [`users/${user.uid}/company`]: company,
        [`users/${user.uid}/photoURL`]: photoURL,
        [`users/${user.uid}/name`]: name, // Also save name to DB for consistency
      };
      await update(ref(db), updates);

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setEditMode(false);
    setError('');
    // Revert form fields to their initial state
    if (initialState) {
      setName(initialState.name);
      setBio(initialState.bio);
      setCompany(initialState.company);
      setPhotoURL(initialState.photoURL);
      setPhotoURLInput(initialState.photoURL.startsWith('data:') ? '' : initialState.photoURL);
    }
  };

  const handleImageChangeFromFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoURL(event.target.result);
      setPhotoURLInput(''); // Clear URL input if a file is chosen
    };
    reader.readAsDataURL(file);
  };

  const handleImageChangeFromUrl = () => {
    if (photoURLInput.trim() && (photoURLInput.startsWith('http://') || photoURLInput.startsWith('https://'))) {
      setPhotoURL(photoURLInput);
      setError('');
    } else {
      setError('Please enter a valid URL starting with http:// or https://');
    }
  };
  
  const totalTickets = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="text-blue-400">Profile</span> Settings
          </h1>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                  <X size={18} /> Cancel
                </button>
                <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50">
                  <Save size={18} /> {loading ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
                <Edit size={18} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">{error}</div>}
        {success && <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Details Column */}
          <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><User size={20} /> Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center md:items-start">
                <div className="relative mb-2">
                  <img src={photoURL || `https://ui-avatars.com/api/?name=${name || 'U'}&background=0284c7&color=fff&size=128`} alt="Profile" className="w-32 h-32 rounded-full object-cover border-2 border-blue-500" />
                  {editMode && (
                    <label className="absolute bottom-0 right-0 bg-slate-700 p-2 rounded-full cursor-pointer hover:bg-slate-600 transition-colors" title="Upload from computer">
                      <input type="file" accept="image/*" onChange={handleImageChangeFromFile} className="hidden" />
                      <ImageIcon size={16} />
                    </label>
                  )}
                </div>
                {editMode ? (
                  <div className='w-full text-center md:text-left'>
                     <p className="text-xs text-slate-400 mb-2">Upload or paste a URL below.</p>
                     <div className="relative">
                        <input
                            type="text"
                            value={photoURLInput}
                            onChange={(e) => setPhotoURLInput(e.target.value)}
                            placeholder="Image URL"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Link2 className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     </div>
                     <button onClick={handleImageChangeFromUrl} className="w-full mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors">Set Image</button>
                  </div>
                ) : null}
              </div>
              
              {/* Info Fields */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                  {editMode ? <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="bg-slate-700/50 rounded-lg px-3 py-2">{name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <p className="bg-slate-700/50 rounded-lg px-3 py-2 text-slate-300">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-1"><Briefcase size={16} /> Company</label>
                  {editMode ? <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Where do you work?"/> : <p className="bg-slate-700/50 rounded-lg px-3 py-2 min-h-[40px]">{company || 'No company specified'}</p>}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-1"><BookOpen size={16} /> Bio</label>
              {editMode ? <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tell us about yourself..." /> : <p className="bg-slate-700/50 rounded-lg px-3 py-2 min-h-[96px] whitespace-pre-wrap">{bio || 'No bio provided'}</p>}
            </div>
          </div>

          {/* Stats and Account Info Column */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-6">Your Ticket Stats</h2>
              <div className="space-y-3">
                {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium text-white">{value}</span>
                    </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Tickets</span>
                  <span className="font-bold text-lg text-blue-400">{totalTickets}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">User ID:</span><span className="font-mono text-slate-300 text-xs">{user.uid}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Account Created:</span><span>{new Date(user.metadata.creationTime).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Last Login:</span><span>{new Date(user.metadata.lastSignInTime).toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}