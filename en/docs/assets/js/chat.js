document.addEventListener('DOMContentLoaded', function() {
  console.log('=== Chat script DOMContentLoaded ===');
  
  // --- DOM Element Selectors ---
  const chatToggle = document.getElementById('site-chat-toggle');
  const chatPanel = document.getElementById('site-chat');
  const closeChatBtn = document.getElementById('close-chat');
  
  const openSplitViewBtn = document.getElementById('open-split-view');
  const clearChatBtn = document.getElementById('clear-chat-history');
  const clearChatSplitBtn = document.getElementById('clear-chat-history-split');
  const splitViewContainer = document.getElementById('split-view-container');
  const closeSplitViewBtn = document.getElementById('close-split-view');
  
  const splitPageIframe = document.getElementById('split-page-iframe');
  const splitPanel = document.getElementById('split-view-panel');
  const resizeHandle = document.getElementById('resize-handle');
  
  const footerEl = document.querySelector('footer.md-footer') || document.querySelector('footer');

  // Log what we found
  console.log('Elements found:', {
    chatToggle: !!chatToggle,
    chatPanel: !!chatPanel,
    closeChatBtn: !!closeChatBtn,
    openSplitViewBtn: !!openSplitViewBtn,
    clearChatBtn: !!clearChatBtn,
    clearChatSplitBtn: !!clearChatSplitBtn,
    splitViewContainer: !!splitViewContainer,
    closeSplitViewBtn: !!closeSplitViewBtn
  });

  // --- Chat iframe management ---
  let chatIframe = null;
  const chatBodyContainer = document.querySelector('#site-chat .site-chat__body');
  const splitChatContainer = document.querySelector('#split-view-panel .split-view-content-wrapper');

  // Initialize chat iframe
  function initializeChatIframe() {
    if (!chatIframe) {
      chatIframe = document.querySelector('#site-chat iframe');
    }
  }

  // --- State ---
  let isResizing = false;
  let startX = 0, startY = 0, startWidth = 0, startHeight = 0;
  let isSplitViewMode = false;
  let isTogglingChat = false; // Prevent immediate close after open

  // --- Utility Functions ---
  function debounce(fn, wait) {
    let t;
    return function() {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  // Add a class to the body if it's inside an iframe
  if (window.self !== window.top) {
    document.body.classList.add('in-iframe');
  }
  function openChat() {
    if (chatPanel && !isSplitViewMode) {
      console.log('Opening chat panel');
      
      // First, ensure we start from a clean state
      chatPanel.classList.remove('open');
      
      // Force a reflow to ensure the removal is processed
      void chatPanel.offsetWidth;
      
      // Now add the open class
      requestAnimationFrame(() => {
        chatPanel.classList.add('open');
        chatPanel.setAttribute('aria-hidden', 'false');
        console.log('Chat panel classes:', chatPanel.className);
        console.log('Chat panel has open class:', chatPanel.classList.contains('open'));
        
        // Debug: Check computed styles after a brief delay
        setTimeout(() => {
          const computed = window.getComputedStyle(chatPanel);
          console.log('After open - visibility:', computed.visibility, 'opacity:', computed.opacity, 'display:', computed.display);
        }, 100);
      });
    }
  }

  function closeChat() {
    if (chatPanel && !isSplitViewMode) {
      console.log('Closing chat panel');
      chatPanel.classList.remove('open');
      chatPanel.setAttribute('aria-hidden', 'true');
      console.log('Chat panel classes after close:', chatPanel.className);
      console.log('Chat panel has open class:', chatPanel.classList.contains('open'));
    }
  }

  // --- Split View Logic ---
  function moveChatToSplitView() {
    initializeChatIframe();
    if (chatIframe && splitChatContainer) {
      splitChatContainer.appendChild(chatIframe);
      isSplitViewMode = true;
    }
  }

  function moveChatBackToPanel() {
    if (chatIframe && chatBodyContainer) {
      chatBodyContainer.appendChild(chatIframe);
      isSplitViewMode = false;
    }
  }

  function openSplitView() {
    if (splitPageIframe) {
      splitPageIframe.src = window.location.href;
    }
    if (splitViewContainer) {
      splitViewContainer.classList.add('active');
    }
    document.documentElement.classList.add('split-view-is-active');
    document.body.classList.add('split-view-is-active');
    closeChat();
    moveChatToSplitView();
  }

  function closeSplitView() {
    if (splitViewContainer) {
      splitViewContainer.classList.remove('active');
    }
    if (splitPageIframe) {
      splitPageIframe.src = 'about:blank'; // Clear the iframe
    }
    document.documentElement.classList.remove('split-view-is-active');
    document.body.classList.remove('split-view-is-active');
    moveChatBackToPanel();
  }

  // --- Footer Overlap Adjustment ---
  function adjustPositionForFooter() {
    if (!footerEl || !chatToggle || !chatPanel) return;

    const defaultToggleBottom = 16; // 1rem
    const defaultPanelBottom = 88;  // ~5.5rem
    const rect = footerEl.getBoundingClientRect();
    const overlap = Math.max(0, window.innerHeight - rect.top);

    if (overlap > 0) {
  // Clamp so we don't push elements off-screen
  const maxToggleBottom = Math.max(defaultToggleBottom, window.innerHeight - 96);
  const toggleBottom = Math.min(overlap + defaultToggleBottom, maxToggleBottom);
  chatToggle.style.bottom = `${toggleBottom}px`;

  const toggleHeight = chatToggle.offsetHeight || 56;
  const desiredPanelBottom = toggleBottom + toggleHeight + 8;
  const maxPanelBottom = Math.max(defaultPanelBottom, window.innerHeight - 160);
  const panelBottom = Math.min(desiredPanelBottom, maxPanelBottom);
  chatPanel.style.bottom = `${panelBottom}px`;
    } else {
      chatToggle.style.bottom = `${defaultToggleBottom}px`;
      chatPanel.style.bottom = `${defaultPanelBottom}px`;
    }
  }

  // --- Resizable Panel Logic ---
  function startResize(e) {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    
    if (window.innerWidth > 768) {
      startWidth = splitPanel.offsetWidth;
    } else {
      startHeight = splitPanel.offsetHeight;
    }
    
    splitViewContainer.classList.add('resizing');
    resizeHandle.classList.add('active');
    e.preventDefault();
  }

  function doResize(e) {
    if (!isResizing) return;

    const newX = e.clientX;
    const newY = e.clientY;

    requestAnimationFrame(() => {
      if (window.innerWidth > 768) { // Horizontal
        const deltaX = startX - newX;
        const newWidth = Math.max(200, Math.min(startWidth + deltaX, splitViewContainer.offsetWidth - 200));
        splitPanel.style.width = `${newWidth}px`;
      } else { // Vertical
        const deltaY = startY - newY;
        const newHeight = Math.max(200, Math.min(startHeight + deltaY, splitViewContainer.offsetHeight - 200));
        splitPanel.style.height = `${newHeight}px`;
      }
    });
  }

  function stopResize() {
    if (isResizing) {
      isResizing = false;
      splitViewContainer.classList.remove('resizing');
      resizeHandle.classList.remove('active');
    }
  }

  // --- Event Listeners ---
  if (chatToggle) {
    chatToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Chat toggle clicked!');
      console.log('chatPanel element:', chatPanel);
      console.log('isSplitViewMode:', isSplitViewMode);
      
      isTogglingChat = true; // Set flag to prevent immediate close
      
      if (isSplitViewMode) {
        // If in split view, close split view and open regular chat
        closeSplitView();
        setTimeout(() => {
          openChat();
          setTimeout(() => { isTogglingChat = false; }, 300);
        }, 100);
      } else if (chatPanel?.classList.contains('open')) {
        closeChat();
        setTimeout(() => { isTogglingChat = false; }, 300);
      } else {
        openChat();
        setTimeout(() => { isTogglingChat = false; }, 300);
      }
    });
  } else {
    console.error('chatToggle element not found!');
  }

  if (closeChatBtn) {
    console.log('Close chat button found:', closeChatBtn);
    
    // Add multiple event handlers to ensure it works
    closeChatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('Close chat button clicked - closeChat() called');
      closeChat();
    }, true); // Use capture phase
    
    // Also add a mousedown handler as backup
    closeChatBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      console.log('Close button mousedown detected');
    });
    
    // Test if button is clickable by adding a visual indicator
    closeChatBtn.style.border = '1px solid rgba(255,255,255,0.3)';
  } else {
    console.error('Close chat button not found!');
  }
  
  // Add delegation handler on the chat header as well
  if (chatPanel) {
    const chatHeader = chatPanel.querySelector('.site-chat__header');
    if (chatHeader) {
      chatHeader.addEventListener('click', (e) => {
        // Check if close button or its children were clicked
        const closeBtn = e.target.closest('#close-chat');
        if (closeBtn) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Close button clicked via delegation');
          closeChat();
        }
      });
    }
  }

  document.addEventListener('click', (e) => {
    // Don't close if we're in the middle of toggling or if click is on toggle button
    if (isTogglingChat) {
      console.log('Ignoring click - chat is toggling');
      return;
    }
    
    // Check if the click is on a theme toggle button or palette switcher
    const isThemeToggle = e.target.closest('.md-header__button.md-icon') || 
                         e.target.closest('[data-md-component="palette"]') ||
                         e.target.closest('label[for^="__palette"]') ||
                         e.target.closest('input[name="__palette"]');
    
    if (chatPanel?.classList.contains('open') && 
        !chatPanel.contains(e.target) && 
        !chatToggle.contains(e.target) &&
        !isThemeToggle) {
      console.log('Closing chat - clicked outside');
      closeChat();
    }
  });

  if (openSplitViewBtn) {
    openSplitViewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Open split view button clicked');
      openSplitView();
    });
  } else {
    console.error('Open split view button not found!');
  }

  if (closeSplitViewBtn) {
    closeSplitViewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Close split view button clicked');
      closeSplitView();
    });
  } else {
    console.error('Close split view button not found!');
  }

  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Clear chat button clicked');
      
      // This sends the "clear" signal to the iframe by changing the URL hash.
      // The code inside the iframe is expected to listen for this signal.
      initializeChatIframe();
      if (chatIframe) {
        chatIframe.src = chatIframe.src.split('#')[0] + '#clearHistory_' + Date.now();
      } else {
        console.error('Chat iframe not found when trying to clear history');
      }
    });
  } else {
    console.error('Clear chat button not found!');
  }

  if (clearChatSplitBtn) {
    clearChatSplitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Clear chat split button clicked');
      
      // This sends the "clear" signal to the iframe by changing the URL hash.
      // The code inside the iframe is expected to listen for this signal.
      initializeChatIframe();
      if (chatIframe) {
        chatIframe.src = chatIframe.src.split('#')[0] + '#clearHistory_' + Date.now();
      } else {
        console.error('Chat iframe not found when trying to clear history');
      }
    });
  } else {
    console.error('Clear chat split button not found!');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && splitViewContainer?.classList.contains('active')) {
      closeSplitView();
    }
  });

  if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('mouseleave', stopResize); // Also stop if mouse leaves window
  }

  const debouncedAdjust = debounce(adjustPositionForFooter, 50);
  window.addEventListener('scroll', debouncedAdjust, { passive: true });
  window.addEventListener('resize', debouncedAdjust);
  window.addEventListener('load', adjustPositionForFooter);
  adjustPositionForFooter(); // Initial call
  
  // Initialize chat iframe reference
  initializeChatIframe();
  
  // Add iframe load listener to debug
  if (chatIframe) {
    chatIframe.addEventListener('load', () => {
      console.log('Chat iframe loaded successfully');
      console.log('Iframe src:', chatIframe.src);
      console.log('Iframe contentWindow:', chatIframe.contentWindow);
      
      // Try to access iframe document (will fail if cross-origin)
      try {
        console.log('Iframe document:', chatIframe.contentDocument);
      } catch (e) {
        console.error('Cannot access iframe document (cross-origin):', e);
      }
    });
    
    chatIframe.addEventListener('error', (e) => {
      console.error('Chat iframe load error:', e);
    });
  }
  
  // Debug: Log initialization status
  console.log('=== Chat initialization complete ===');
  console.log('chatToggle:', chatToggle);
  console.log('chatPanel:', chatPanel);
  console.log('closeChatBtn:', closeChatBtn);
  if (chatPanel) {
    console.log('Chat panel initial styles:', {
      display: window.getComputedStyle(chatPanel).display,
      visibility: window.getComputedStyle(chatPanel).visibility,
      opacity: window.getComputedStyle(chatPanel).opacity,
      zIndex: window.getComputedStyle(chatPanel).zIndex,
      position: window.getComputedStyle(chatPanel).position
    });
  }
});