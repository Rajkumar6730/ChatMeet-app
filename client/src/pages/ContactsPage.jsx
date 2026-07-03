// client/src/pages/ContactsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { chatService } from '../services/chatService';
import { FiUserPlus, FiUserMinus, FiCheck, FiX, FiSearch, FiUser } from 'react-icons/fi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ConfirmationModal from '../components/common/ConfirmationModal';

const ContactsPage = () => {
  const { user } = useAuth();
  const { isConnected, on, off } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!isConnected) return;

    const handleNewRequest = (data) => {
      setRequests(prev => ({
        ...prev,
        received: [...prev.received, data]
      }));
    };

    const handleRequestAccepted = (data) => {
      setRequests(prev => ({
        ...prev,
        received: prev.received.filter(r => r._id !== data.requestId),
        sent: prev.sent.filter(r => r._id !== data.requestId)
      }));
      fetchContacts();
    };

    const handleRequestRejected = (data) => {
      setRequests(prev => ({
        ...prev,
        received: prev.received.filter(r => r._id !== data.requestId),
        sent: prev.sent.filter(r => r._id !== data.requestId)
      }));
    };

    const handleContactRemoved = (data) => {
      if (data.removedBy === user._id || data.userId === user._id) {
        fetchContacts();
      }
    };

    on('newContactRequest', handleNewRequest);
    on('contactRequestAccepted', handleRequestAccepted);
    on('contactRequestRejected', handleRequestRejected);
    on('contactRemoved', handleContactRemoved);

    return () => {
      off('newContactRequest', handleNewRequest);
      off('contactRequestAccepted', handleRequestAccepted);
      off('contactRequestRejected', handleRequestRejected);
      off('contactRemoved', handleContactRemoved);
    };
  }, [isConnected, on, off, user._id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsData, requestsData] = await Promise.all([
        chatService.getContacts(),
        chatService.getContactRequests()
      ]);
      setContacts(contactsData);
      setRequests(requestsData);
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const data = await chatService.getContacts();
      setContacts(data);
    } catch (err) {
      console.error('Fetch contacts error:', err);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await chatService.searchUsers(query);
      // Filter out existing contacts and current user
      const filtered = results.filter(u => 
        u._id !== user._id && 
        !contacts.some(c => c.user._id === u._id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const sendRequest = async (userId, username) => {
    setModalState({
      isOpen: true,
      title: `Send Request to ${username}?`,
      message: 'They will receive a contact request.',
      onConfirm: async () => {
        try {
          await chatService.sendContactRequest(userId);
          setSearchResults(prev => prev.filter(u => u._id !== userId));
          setShowAddContact(false);
          setSearchQuery('');
          setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
        } catch (err) {
          console.error('Send request error:', err);
        }
      }
    });
  };

  const acceptRequest = async (requestId) => {
    try {
      await chatService.acceptContactRequest(requestId);
      await fetchContacts();
    } catch (err) {
      console.error('Accept request error:', err);
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await chatService.rejectContactRequest(requestId);
      setRequests(prev => ({
        ...prev,
        received: prev.received.filter(r => r._id !== requestId)
      }));
    } catch (err) {
      console.error('Reject request error:', err);
    }
  };

  const removeContact = async (userId, username) => {
    setModalState({
      isOpen: true,
      title: `Remove ${username} from contacts?`,
      message: 'They will be removed from your contacts.',
      onConfirm: async () => {
        try {
          await chatService.removeContact(userId);
          await fetchContacts();
          setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
        } catch (err) {
          console.error('Remove contact error:', err);
        }
      }
    });
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text">Contacts</h1>
          <button
            onClick={() => setShowAddContact(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-12 transition"
          >
            <FiUserPlus size={20} /> Add Contact
          </button>
        </div>

        {/* Add Contact Modal */}
        {showAddContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-12 p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-text font-semibold text-lg">Add Contact</h3>
                <button onClick={() => setShowAddContact(false)} className="text-text-secondary hover:text-text">
                  <FiX size={20} />
                </button>
              </div>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search by username or email..."
                  className="w-full bg-background border border-border-color rounded-12 py-2 pl-10 pr-4 text-text focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-2 hover:bg-background rounded-12">
                    <div className="flex items-center gap-3">
                      <img src={u.profilePicture || '/default-avatar.png'} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-text">{u.username}</p>
                        <p className="text-text-secondary text-sm">{u.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendRequest(u._id, u.username)}
                      className="px-3 py-1 bg-primary text-white rounded-8 text-sm hover:bg-secondary transition"
                    >
                      Add
                    </button>
                  </div>
                ))}
                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p className="text-text-secondary text-center py-4">No users found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {requests.received.length > 0 && (
          <div className="bg-card rounded-12 p-4 mb-6">
            <h3 className="text-text font-semibold mb-3">Pending Requests</h3>
            {requests.received.map(req => (
              <div key={req._id} className="flex items-center justify-between p-2 hover:bg-background rounded-12">
                <div className="flex items-center gap-3">
                  <img src={req.from?.profilePicture || '/default-avatar.png'} alt={req.from?.username} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-text">{req.from?.username}</p>
                    <p className="text-text-secondary text-sm">{req.message || 'Wants to connect'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptRequest(req._id)} className="p-2 bg-primary text-white rounded-full hover:bg-secondary transition">
                    <FiCheck size={16} />
                  </button>
                  <button onClick={() => rejectRequest(req._id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <EmptyState
            icon={FiUser}
            title="No Contacts Yet"
            description="Add contacts to start chatting!"
          />
        ) : (
          <div className="space-y-2">
            {contacts.map(contact => (
              <div key={contact.user._id} className="bg-card rounded-12 p-3 flex items-center justify-between hover:bg-card/70 transition">
                <div className="flex items-center gap-3">
                  <img src={contact.user.profilePicture || '/default-avatar.png'} alt={contact.user.username} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="text-text font-medium">{contact.user.username}</p>
                    <p className="text-text-secondary text-sm">{contact.user.status === 'online' ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => removeContact(contact.user._id, contact.user.username)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition"
                    title="Remove Contact"
                  >
                    <FiUserMinus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
      />
    </div>
  );
};

export default ContactsPage;