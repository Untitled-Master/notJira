export default function LoadingScreen() {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-semibold text-white">Loading notJira</h2>
          <p className="text-slate-400">Checking authentication status...</p>
        </div>
      </div>
    );
  }