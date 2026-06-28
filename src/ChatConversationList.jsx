import { useState } from "react";
import { resolveMediaUrl } from "./utils/mediaUrl";

export default function ChatConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
}) {
  const [isOpen, setIsOpen] = useState(true);

  const getInitial = (name) => String(name || "U").trim().charAt(0).toUpperCase() || "U";

  return (
    <section className={`chat-sidebar ${isOpen ? "open" : "collapsed"}`}>
      <button className="chat-sidebar-toggle" onClick={() => setIsOpen((prev) => !prev)}>
        <span>Chats</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isOpen ? "toggle-icon open" : "toggle-icon"}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="chat-conversation-list">
          {conversations.length > 0 ? (
            conversations.map((chat) => (
              <button
                key={chat.conversation_id}
                className={`chat-conversation-item ${Number(chat.conversation_id) === Number(activeConversationId) ? "active" : ""}`}
                onClick={() => onSelectConversation(chat.conversation_id)}
              >
                <div className="chat-avatar">
                  {chat.other_profile_picture_url ? (
                    <img
                      src={resolveMediaUrl(chat.other_profile_picture_url)}
                      alt={chat.other_username}
                    />
                  ) : (
                    <div className="chat-avatar-fallback" aria-hidden="true">
                      {getInitial(chat.other_username)}
                    </div>
                  )}
                </div>
                <div className="chat-meta">
                  <span className="chat-username">{chat.other_username}</span>
                  <span className="chat-preview">{chat.last_message || "Sin mensajes"}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="chat-empty-list">No tienes chats todavia.</div>
          )}
        </div>
      )}
    </section>
  );
}
