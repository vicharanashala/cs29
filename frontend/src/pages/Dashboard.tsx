
export default function DashboardLayout() {
 return (
 <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-white font-sans">

 {/* 1. FIXED LEFT SIDEBAR / MENU BAR */}
 <aside className="w-64 h-full flex flex-col border-r border-gray-800 bg-gray-900 flex-shrink-0 z-20">
 <div className="p-4 border-b border-gray-800 flex items-center justify-between">
 <span className="font-bold text-lg tracking-wider text-indigo-400">YAKSHA MINI</span>
 </div>

 {/* Navigation Links */}
 <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
 <a href="#dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-indigo-600 text-white font-medium transition-all">
 <span>📊</span>
 <span>Dashboard</span>
 </a>
 <a href="#projects" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
 <span>📁</span>
 <span>Projects</span>
 </a>
 <a href="#team" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
 <span>👥</span>
 <span>Team Members</span>
 </a>
 <a href="#settings" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
 <span>⚙️</span>
 <span>Settings</span>
 </a>
 </nav>

 {/* Footer/User Profile pinned at the bottom of sidebar */}
 <div className="p-4 border-t border-gray-800 bg-gray-900/50">
 <div className="flex items-center space-x-3">
 <div className="w-8 h-8 rounded-full bg-gradient-to-r align-middle from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
 U
 </div>
 <div className="truncate">
 <p className="text-sm font-medium truncate">User Workspace</p>
 <p className="text-xs text-gray-500 truncate">vled-lab@iitr.ac.in</p>
 </div>
 </div>
 </div>
 </aside>

 {/* 2. MAIN CONTENT AREA (Takes up 100% of the remaining screen space) */}
 <div className="flex-1 flex flex-col h-full overflow-hidden">

 {/* Top Header/Status Bar */}
 <header className="h-16 border-b border-gray-800 bg-gray-900/40 flex items-center justify-between px-8 flex-shrink-0">
 <h1 className="text-xl font-semibold text-gray-200">Crowd-sourced FAQ Panel</h1>
 <div className="flex items-center space-x-4">
 <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
 System Active
 </span>
 </div>
 </header>

 {/* 3. FULL-SPACE WORKSPACE GRID */}
 <main className="flex-1 p-8 overflow-y-auto bg-gray-950">
 <div className="max-w-full mx-auto space-y-6">

 {/* Statistics/Status Blocks spanning full width */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-sm">
 <p className="text-sm text-gray-400 font-medium">Required Team Size</p>
 <p className="text-3xl font-bold mt-2 text-indigo-400">10 Interns</p>
 </div>
 <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-sm">
 <p className="text-sm text-gray-400 font-medium">Registered Members</p>
 <p className="text-3xl font-bold mt-2 text-amber-400">In Progress</p>
 </div>
 <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-sm">
 <p className="text-sm text-gray-400 font-medium">Submission Deadline</p>
 <p className="text-3xl font-bold mt-2 text-rose-400">Urgent</p>
 </div>
 </div>

 {/* Main Interactive Work Area (Utilizes all available width) */}
 <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
 <div className="p-5 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
 <h2 className="font-semibold text-gray-200">Data Visualization & Workspace Configuration</h2>
 </div>
 <div className="p-6 min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-800 m-6 rounded-lg bg-gray-950/40">
 <p className="text-gray-500 text-center text-sm">
 [ Main Interactive Canvas View / FAQ Generation Interface Panel ] <br />
 <span className="text-xs text-gray-600 mt-1 block">Full width container bounds active</span>
 </p>
 </div>
 </div>

 </div>
 </main>
 </div>

 </div>
 );
}
