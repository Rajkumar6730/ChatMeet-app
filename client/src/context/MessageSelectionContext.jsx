/* eslint-disable react-refresh/only-export-components */
// client/src/context/MessageSelectionContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'; // ✅ Added useMemo

const MessageSelectionContext = createContext();

export const useMessageSelection = () => {
  const context = useContext(MessageSelectionContext);
  if (!context) {
    throw new Error('useMessageSelection must be used within MessageSelectionProvider');
  }
  return context;
};

export const MessageSelectionProvider = ({ children }) => {
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastSelectedId, setLastSelectedId] = useState(null);
  const [selectionHistory, setSelectionHistory] = useState([]);
  const [isSelectAllActive, setIsSelectAllActive] = useState(false);

  // Select a single message
  const selectMessage = useCallback((messageId) => {
    setSelectedMessages(prev => {
      if (prev.includes(messageId)) {
        return prev.filter(id => id !== messageId);
      }
      return [...prev, messageId];
    });
    setLastSelectedId(messageId);
  }, []);

  // Select range (Shift + Click)
  const selectRange = useCallback((messageId, allMessageIds) => {
    if (!lastSelectedId) {
      setSelectedMessages([messageId]);
      setLastSelectedId(messageId);
      return;
    }

    const startIndex = allMessageIds.indexOf(lastSelectedId);
    const endIndex = allMessageIds.indexOf(messageId);
    
    if (startIndex === -1 || endIndex === -1) return;

    const min = Math.min(startIndex, endIndex);
    const max = Math.max(startIndex, endIndex);
    const range = allMessageIds.slice(min, max + 1);
    
    setSelectedMessages(prev => {
      const newSelection = [...prev];
      range.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
    setLastSelectedId(messageId);
  }, [lastSelectedId]);

  // Select all messages
  const selectAll = useCallback((messageIds) => {
    setSelectedMessages(messageIds);
    setIsSelectionMode(true);
    setIsSelectAllActive(true);
    setSelectionHistory(prev => [...prev, { type: 'selectAll', messageIds }]);
  }, []);

  // Deselect all messages
  const deselectAll = useCallback(() => {
    setSelectedMessages([]);
    setIsSelectAllActive(false);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedMessages([]);
    setIsSelectionMode(false);
    setLastSelectedId(null);
    setIsSelectAllActive(false);
    setSelectionHistory([]);
  }, []);

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedMessages([]);
      setIsSelectAllActive(false);
    }
  }, [isSelectionMode]);

  // Check if a message is selected
  const isSelected = useCallback((messageId) => {
    return selectedMessages.includes(messageId);
  }, [selectedMessages]);

  // Get selected count
  const getSelectedCount = useCallback(() => {
    return selectedMessages.length;
  }, [selectedMessages]);

  // Check if all messages are selected
  const isAllSelected = useCallback((totalMessages) => {
    return totalMessages > 0 && selectedMessages.length === totalMessages;
  }, [selectedMessages]);

  // Toggle selection of a single message
  const toggleMessageSelection = useCallback((messageId) => {
    setSelectedMessages(prev => {
      const isSelected = prev.includes(messageId);
      if (isSelected) {
        return prev.filter(id => id !== messageId);
      }
      return [...prev, messageId];
    });
    setLastSelectedId(messageId);
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
  }, [isSelectionMode]);

  // Select multiple messages
  const selectMultiple = useCallback((messageIds) => {
    setSelectedMessages(prev => {
      const newSelection = [...prev];
      messageIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
    setIsSelectionMode(true);
  }, []);

  // Deselect multiple messages
  const deselectMultiple = useCallback((messageIds) => {
    setSelectedMessages(prev => 
      prev.filter(id => !messageIds.includes(id))
    );
  }, []);

  // Invert selection
  const invertSelection = useCallback((allMessageIds) => {
    const currentSelection = new Set(selectedMessages);
    const newSelection = allMessageIds.filter(id => !currentSelection.has(id));
    setSelectedMessages(newSelection);
    setIsSelectionMode(true);
    if (newSelection.length > 0) {
      setLastSelectedId(newSelection[newSelection.length - 1]);
    }
  }, [selectedMessages]);

  // Get selected message IDs as a Set for faster lookups
  const selectedSet = useMemo(() => new Set(selectedMessages), [selectedMessages]);

  // Check if selection is empty
  const isEmpty = useCallback(() => {
    return selectedMessages.length === 0;
  }, [selectedMessages]);

  // Get selection statistics
  const getSelectionStats = useCallback(() => {
    return {
      total: selectedMessages.length,
      isSelectAllActive: isSelectAllActive,
      lastSelectedId: lastSelectedId,
      hasSelection: selectedMessages.length > 0,
    };
  }, [selectedMessages.length, isSelectAllActive, lastSelectedId]);

  // Undo last selection action
  const undoSelection = useCallback(() => {
    if (selectionHistory.length === 0) return;
    
    const lastAction = selectionHistory[selectionHistory.length - 1];
    if (lastAction.type === 'selectAll') {
      setSelectedMessages([]);
      setIsSelectAllActive(false);
    }
    setSelectionHistory(prev => prev.slice(0, -1));
  }, [selectionHistory]);

  // Bulk select by type
  const selectByType = useCallback((messages, type) => {
    const filteredIds = messages
      .filter(msg => msg.type === type)
      .map(msg => msg._id);
    
    setSelectedMessages(prev => {
      const newSelection = [...prev];
      filteredIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
    setIsSelectionMode(true);
  }, []);

  // Bulk select by sender
  const selectBySender = useCallback((messages, senderId) => {
    const filteredIds = messages
      .filter(msg => msg.sender?._id === senderId)
      .map(msg => msg._id);
    
    setSelectedMessages(prev => {
      const newSelection = [...prev];
      filteredIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
    setIsSelectionMode(true);
  }, []);

  // Clear selection mode but keep selections
  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
  }, []);

  const value = {
    // State
    selectedMessages,
    isSelectionMode,
    lastSelectedId,
    selectionHistory,
    isSelectAllActive,
    selectedSet,
    
    // Methods
    selectMessage,
    selectRange,
    selectAll,
    deselectAll,
    clearSelection,
    toggleSelectionMode,
    isSelected,
    getSelectedCount,
    setLastSelectedId,
    setSelectedMessages,
    setIsSelectionMode,
    isAllSelected,
    toggleMessageSelection,
    selectMultiple,
    deselectMultiple,
    invertSelection,
    isEmpty,
    getSelectionStats,
    undoSelection,
    selectByType,
    selectBySender,
    exitSelectionMode,
  };

  return (
    <MessageSelectionContext.Provider value={value}>
      {children}
    </MessageSelectionContext.Provider>
  );
};