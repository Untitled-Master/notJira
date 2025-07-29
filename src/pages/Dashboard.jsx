import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Clock, User as UserIcon, AlertCircle, Check, Mail, X, Briefcase, BookOpen, Loader2 } from 'lucide-react';
import { getDatabase, ref, push, set, onValue, off, update, increment, get } from 'firebase/database';
import { formatDistanceToNow } from 'date-fns';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// --- Reusable Components ---

const statusConfig = {
  future: { title: 'Future', icon: <Clock size={16} className="text-blue-400" />, bg: 'bg-blue-500/10', text: 'text-blue-400' },
  working: { title: 'Working On It', icon: <AlertCircle size={16} className="text-yellow-400" />, bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  done: { title: 'Done', icon: <Check size={16} className="text-green-400" />, bg: 'bg-green-500/10', text: 'text-green-400' },
  canceled: { title: 'Canceled', icon: <X size={16} className="text-red-400" />, bg: 'bg-red-500/10', text: 'text-red-400' },
  emailSent: { title: 'Email Sent', icon: <Mail size={16} className="text-purple-400" />, bg: 'bg-purple-500/10', text: 'text-purple-400' }
};

// Enhanced User Profile Modal
const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-sm text-left p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {user.isLoading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="mt-4 text-slate-400">Loading Profile...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.name || 'A'}&background=0284c7&color=fff&size=128`}
                alt={user.name || 'User'}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-500 object-cover"
              />
              <h2 className="text-xl font-bold text-white">{user.name || 'Unknown User'}</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-1">
                  <Briefcase size={16} /> Company
                </h3>
                <p className="bg-slate-700/50 rounded-lg px-3 py-2 text-slate-300">
                  {user.company || 'Not specified'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-1">
                  <BookOpen size={16} /> Bio
                </h3>
                <p className="bg-slate-700/50 rounded-lg px-3 py-2 text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
                  {user.bio || 'No bio provided.'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="mt-6 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Draggable Ticket Component
const DraggableTicket = ({ ticket, handleDeleteTicket, onViewUser }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ticket.id,
    data: { status: ticket.status, createdBy: ticket.createdBy }
  });

  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div ref={setNodeRef} style={style} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden touch-none">
      <div {...listeners} {...attributes} className="p-3 cursor-grab hover:bg-slate-700/50 transition-colors">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-medium text-slate-100 flex-1">{ticket.title}</h4>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : ''}
          </span>
        </div>
      </div>
      
      <div className="p-3 pt-2 bg-slate-800/80">
        <p className="text-sm text-slate-300 whitespace-pre-wrap mb-3">{ticket.description || 'No description provided'}</p>
        <div className="flex items-center justify-between text-sm border-t border-slate-700/50 pt-2">
          <button onClick={() => onViewUser(ticket.createdBy)} className="flex items-center gap-2 group">
            <img src={ticket.createdBy?.photoURL || `https://ui-avatars.com/api/?name=${ticket.createdBy?.name || 'A'}&background=0284c7&color=fff&size=32`} alt={ticket.createdBy?.name || 'User'} className="w-6 h-6 rounded-full transition-transform group-hover:scale-110"/>
            <span className="text-slate-400 group-hover:text-blue-400 transition-colors">{ticket.createdBy?.name || 'Unknown User'}</span>
          </button>
          <button onClick={() => handleDeleteTicket(ticket.id)} className="text-slate-400 hover:text-red-400 transition-colors"><X size={16} /></button>
        </div>
      </div>
    </div>
  );
};

// Droppable Column Component
const TicketColumn = ({ status, tickets, ...props }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = statusConfig[status];

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col">
      <div className={`p-3 border-b border-slate-700 flex items-center justify-between ${config.bg}`}>
        <div className="flex items-center gap-2">
          {config.icon}
          <h3 className={`font-medium ${config.text}`}>{config.title}</h3>
        </div>
        <span className="text-sm bg-slate-700/50 px-2 py-1 rounded">{tickets.length}</span>
      </div>
      <div ref={setNodeRef} className={`p-2 space-y-2 min-h-[200px] flex-grow transition-colors ${isOver ? 'bg-blue-500/10' : ''}`}>
        {tickets.length > 0 ? (
          tickets.map(ticket => <DraggableTicket key={ticket.id} ticket={ticket} {...props} />)
        ) : (
          <div className="flex items-center justify-center h-full text-center text-slate-500 p-4 text-sm">Drop tickets here</div>
        )}
      </div>
    </div>
  );
};


// --- Main Dashboard Page Component ---

export default function DashboardPage({ user }) {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', status: 'future', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewingUser, setViewingUser] = useState(null);

  const db = getDatabase();

  useEffect(() => {
    const ticketsRef = ref(db, 'tickets');
    const unsubscribe = onValue(ticketsRef, (snapshot) => {
      const ticketsData = snapshot.val();
      setTickets(ticketsData ? Object.entries(ticketsData).map(([id, ticket]) => ({ id, ...ticket })) : []);
    });
    return () => off(ticketsRef);
  }, [db]);

  const filteredTickets = tickets.filter(ticket => 
    (filter === 'all' || ticket.status === filter) &&
    (ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (ticket.description && ticket.description.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const groupedTickets = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = filteredTickets.filter(t => t.status === status);
    return acc;
  }, {});

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const newTicketData = {
        ...newTicket,
        createdAt: new Date().toISOString(),
        createdBy: {
          uid: user.uid,
          name: user.displayName,
          photoURL: user.photoURL
        },
        updatedAt: new Date().toISOString()
      };
      
      const ticketRef = push(ref(db, 'tickets'));
      await set(ticketRef, newTicketData);
      
      const statsRef = ref(db, `stats/${user.uid}`);
      await update(statsRef, { [newTicket.status]: increment(1) });

      setNewTicket({ title: '', description: '', status: 'future', priority: 'medium' });
      setNewTicketOpen(false);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    const oldStatus = ticket.status;
    const creatorUid = ticket.createdBy.uid;

    try {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      
      const ticketRef = ref(db, `tickets/${ticketId}`);
      await update(ticketRef, { status: newStatus, updatedAt: new Date().toISOString() });
      
      const statsRef = ref(db, `stats/${creatorUid}`);
      await update(statsRef, { [oldStatus]: increment(-1), [newStatus]: increment(1) });
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setError('Failed to update ticket status.');
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: oldStatus } : t));
    }
  };
  
  const handleDeleteTicket = async (ticketId) => {
    const ticketToDelete = tickets.find(t => t.id === ticketId);
    if (!ticketToDelete) return;
    if (!window.confirm(`Are you sure you want to delete "${ticketToDelete.title}"?`)) return;
    
    try {
      const statsRef = ref(db, `stats/${ticketToDelete.createdBy.uid}`);
      await update(statsRef, { [ticketToDelete.status]: increment(-1) });
      await set(ref(db, `tickets/${ticketId}`), null);
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError('Failed to delete ticket.');
    }
  };

  const handleViewUser = async (userInfo) => {
    if (!userInfo || !userInfo.uid) return;
    setViewingUser({ ...userInfo, isLoading: true });
    try {
      // *** UPDATED: Now fetches from the /profiles path ***
      const userProfileRef = ref(db, `profiles/${userInfo.uid}`);
      const snapshot = await get(userProfileRef);
      const fullProfile = snapshot.exists()
        ? { ...userInfo, ...snapshot.val(), isLoading: false }
        : { ...userInfo, isLoading: false }; // Fallback if no profile exists
      setViewingUser(fullProfile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setViewingUser({ ...userInfo, isLoading: false });
    }
  };
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      handleStatusChange(active.id, over.id);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-slate-900 text-slate-100 p-4 animate-fade-in">
        <UserProfileModal user={viewingUser} onClose={() => setViewingUser(null)} />
        
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold"><span className="text-blue-400">not</span>Jira Dashboard</h1>
              <p className="text-slate-400">Manage your Maximo project tickets</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64" />
              </div>
              <button onClick={() => setNewTicketOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors">
                <Plus size={18} /> New Ticket
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>All Tickets</button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${filter === status ? `${config.bg} ${config.text}` : 'bg-slate-800 hover:bg-slate-700'}`}>
                {config.icon} {config.title}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="max-w-7xl mx-auto mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400" />
            <span className="text-red-400">{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-200"><X size={18}/></button>
          </div>
        )}

        {newTicketOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Create New Ticket</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                    <input type="text" value={newTicket.title} onChange={(e) => setNewTicket({...newTicket, title: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Fix login button" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                    <textarea value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description: e.target.value})} rows={4} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add more details..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                      <select value={newTicket.status} onChange={(e) => setNewTicket({...newTicket, status: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {Object.entries(statusConfig).map(([status, config]) => <option key={status} value={status}>{config.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Priority</label>
                      <select value={newTicket.priority} onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setNewTicketOpen(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleCreateTicket} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                    {loading ? 'Creating...' : 'Create Ticket'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
            {Object.entries(groupedTickets).map(([status, ticketsInStatus]) => (
              <TicketColumn key={status} status={status} tickets={ticketsInStatus} handleDeleteTicket={handleDeleteTicket} onViewUser={handleViewUser} />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}