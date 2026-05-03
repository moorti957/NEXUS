import ChatScreen from "../../pages/ChatScreen";

export default function Chatmood({ onClose }) {

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">

      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative w-[95vw] max-w-[1400px] h-[92vh] bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden border border-white/10">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Chat Screen */}
        <div className="w-full h-full">
          <ChatScreen />
        </div>

      </div>

    </div>
  );
}