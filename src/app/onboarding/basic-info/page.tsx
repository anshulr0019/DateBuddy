'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BasicInfoPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    lookingFor: '',
  });

  useEffect(() => {
    try {
      const savedBasic = localStorage.getItem('onboarding_basic');
      const googleUser = localStorage.getItem('google_user');
      if (savedBasic) {
        setFormData(prev => ({ ...prev, ...JSON.parse(savedBasic) }));
      } else if (googleUser) {
        const parsed = JSON.parse(googleUser);
        if (parsed.name) {
          setFormData(prev => ({ ...prev, name: parsed.name }));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleNext = () => {
    setError('');
    if (!formData.name || !formData.dateOfBirth || !formData.gender || !formData.lookingFor) {
      setError('Please fill all fields to continue');
      return;
    }

    // Calculate age
    const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
    if (age < 18) {
      setError('You must be at least 18 years old');
      return;
    }

    localStorage.setItem('onboarding_basic', JSON.stringify(formData));
    router.push('/onboarding/location');
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        {/* Progress Bar Header */}
        <div className="flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-2">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 border border-[#1A1A2E]/10 text-[#1A1A2E] shadow-sm backdrop-blur-md hover:bg-white transition-all cursor-pointer"
            >
              ←
            </button>
            <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden p-0.5 border border-white/60">
              <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] rounded-full transition-all duration-500" style={{ width: '14%' }} />
            </div>
            <span className="text-[12px] font-bold text-[#1A1A2E]/50">1/7</span>
          </div>
        </div>

        {/* Main Form Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-[13px] font-semibold text-center leading-snug animate-[fade-slide-up_0.3s_ease-out]">
              {error}
            </div>
          )}
          <div className="mb-6">
            <h1 className="text-[26px] font-black text-[#1A1A2E] tracking-tight">Let&apos;s get to know you</h1>
            <p className="text-[14px] text-[#1A1A2E]/60 mt-1">This info appears on your profile for others to discover</p>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.06)] backdrop-blur-md">
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2 uppercase tracking-wider">Your First Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                className="w-full h-12 px-4 rounded-xl border border-[#1A1A2E]/10 bg-white/90 text-[#1A1A2E] text-[16px] font-medium focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/20 transition-all placeholder:text-[#1A1A2E]/35"
              />
            </div>

            {/* Date of Birth */}
            <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.06)] backdrop-blur-md overflow-hidden">
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2 uppercase tracking-wider">Date of Birth</label>
              <div className="relative w-full overflow-hidden min-w-0">
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full min-w-0 max-w-full h-12 px-4 rounded-xl border border-[#1A1A2E]/10 bg-white/90 text-[#1A1A2E] text-[16px] font-medium focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/20 transition-all cursor-pointer appearance-none"
                />
              </div>
              <p className="text-[11px] text-[#1A1A2E]/45 mt-1.5">You must be at least 18 years old</p>
            </div>

            {/* Gender */}
            <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.06)] backdrop-blur-md">
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-3 uppercase tracking-wider">I am a</label>
              <div className="grid grid-cols-2 gap-2.5">
                {['Male', 'Female', 'Non-binary', 'Other'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: gender.toLowerCase() })}
                    className={`h-11 px-4 rounded-xl border text-[14px] font-semibold transition-all cursor-pointer ${
                      formData.gender === gender.toLowerCase()
                        ? 'border-[#FF6B9D] bg-gradient-to-r from-[#FF6B9D]/15 to-[#7B68EE]/15 text-[#FF6B9D] shadow-sm'
                        : 'border-[#1A1A2E]/10 bg-white/90 text-[#1A1A2E]/70 hover:border-[#1A1A2E]/20'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Looking For */}
            <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.06)] backdrop-blur-md">
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-3 uppercase tracking-wider">Looking to match with</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'men', label: 'Men' },
                  { value: 'women', label: 'Women' },
                  { value: 'everyone', label: 'Everyone' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, lookingFor: option.value })}
                    className={`h-11 px-3 rounded-xl border text-[13px] font-semibold transition-all cursor-pointer ${
                      formData.lookingFor === option.value
                        ? 'border-[#FF6B9D] bg-gradient-to-r from-[#FF6B9D]/15 to-[#7B68EE]/15 text-[#FF6B9D] shadow-sm'
                        : 'border-[#1A1A2E]/10 bg-white/90 text-[#1A1A2E]/70 hover:border-[#1A1A2E]/20'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation Button */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/5">
          <button
            onClick={handleNext}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_10px_25px_-5px_rgba(255,107,157,0.5)] active:scale-[0.985] transition-all cursor-pointer"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
