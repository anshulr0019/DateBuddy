'use client';

import { useRouter } from 'next/navigation';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: {
    id: number;
    name: string;
    age: number;
    photo: string;
  };
  currentUserPhoto: string;
}

export default function MatchModal({ isOpen, onClose, match, currentUserPhoto }: MatchModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSendMessage = () => {
    onClose();
    router.push(`/chat/${match.id}`);
  };

  const handleKeepSwiping = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 psychedelic-bg opacity-95" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl font-bold text-white mb-8 pulse">
          It's a Match! 💕
        </h1>

        {/* Photos */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div
            className="w-32 h-32 rounded-full bg-cover bg-center border-4 border-white shadow-lg"
            style={{ backgroundImage: `url(${currentUserPhoto})` }}
          />
          <div className="text-4xl text-white">💕</div>
          <div
            className="w-32 h-32 rounded-full bg-cover bg-center border-4 border-white shadow-lg"
            style={{ backgroundImage: `url(${match.photo})` }}
          />
        </div>

        <p className="text-white text-lg mb-8">
          You and {match.name} liked each other!
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSendMessage}
            className="btn-primary w-full bg-white text-[#FF6B9D] font-bold"
          >
            Send Message
          </button>
          <button
            onClick={handleKeepSwiping}
            className="btn-secondary w-full border-white text-white"
          >
            Keep Swiping
          </button>
          <button
            onClick={onClose}
            className="text-white text-sm opacity-75 w-full py-2"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}
