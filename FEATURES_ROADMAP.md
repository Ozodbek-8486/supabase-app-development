# Supabase Chat Features Roadmap

## Implemented Features ✓

### 1. Toast Notifications System
- Success notifications (copy, edit, delete)
- Error notifications
- Auto-dismiss after 2.5 seconds
- Responsive positioning (mobile/desktop)

### 2. Copy Action Feedback
- Copy button changes to checkmark (✓) on success
- Green background highlight
- Auto-reverts after 2 seconds
- Toast notification "Nusxalandi"

### 3. Delete & Edit Confirmations
- "Xabar o'chirildi" toast on deletion
- "Xabar tahrirlandi" toast on edit
- Error notifications if operations fail

## Planned Features (Next Phase)

### Real-Time Online Status Tracking
- [ ] Track user presence with session timestamps
- [ ] Show green dot next to username in header
- [ ] Display user online/offline status in user list
- [ ] User presence indicator next to profile avatar
- [ ] Count updates in real-time (currently counts unique usernames)

### User Activity Indicators
- [ ] "User is typing..." indicator
- [ ] "Message edited" timestamp
- [ ] "Deleted" badge for removed messages
- [ ] User join/leave notifications

### Enhanced Message Actions
- [ ] Share message functionality
- [ ] Message reactions/emoji reactions
- [ ] Message threading/replies
- [ ] Message search functionality

### User Experience
- [ ] User presence panel (who's online)
- [ ] Last seen timestamp
- [ ] User status (away, busy, online)
- [ ] Voice/video call indicators
- [ ] Message delivery status indicator

### Admin Features
- [ ] User management panel
- [ ] Message moderation with reasons
- [ ] User ban/mute functionality
- [ ] Activity logs/audit trail
- [ ] Server statistics dashboard

## Technical Implementation Notes

- Using Supabase Realtime subscriptions for live updates
- Toast notifications use React state + auto-dismiss timers
- Copy button state tracked with `copiedMessageId` state
- All notifications are bilingual-ready (Uzbek text)
