import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", { autoConnect: true });

export default function MessagesWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const savedUser = localStorage.getItem("user");
  const currentUser = useMemo(() => (savedUser ? JSON.parse(savedUser) : null), [savedUser]);
  const getInitial = (name) => String(name || "U").trim().charAt(0).toUpperCase() || "U";
  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatRelativeDate = (value) => {
    if (!value) return "Sin actividad reciente";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin actividad reciente";

    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (sameDay) {
      return `Hoy a las ${formatTime(value)}`;
    }

    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "short",
    }).format(date);
  };

  useEffect(() => {
    if (!isOpen || !currentUser?.user_id) return;

    fetch(`http://localhost:3001/api/chat/conversations/${currentUser.user_id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando conversaciones");
        return res.json();
      })
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error conversaciones widget:", err);
        setConversations([]);
      });
  }, [isOpen, currentUser?.user_id]);

  useEffect(() => {
    if (!activeConversationId) return;

    fetch(`http://localhost:3001/api/chat/messages/${activeConversationId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando mensajes");
        return res.json();
      })
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error mensajes widget:", err);
        setMessages([]);
      });

    socket.emit("join_conversation", activeConversationId);

    const onNewMessage = (msg) => {
      if (Number(msg.conversation_id) === Number(activeConversationId)) {
        setMessages((prev) => [...prev, msg]);
      }

      if (currentUser?.user_id) {
        fetch(`http://localhost:3001/api/chat/conversations/${currentUser.user_id}`)
          .then((res) => res.json())
          .then((data) => setConversations(Array.isArray(data) ? data : []))
          .catch(() => {});
      }
    };

    socket.on("new_message", onNewMessage);

    return () => {
      socket.emit("leave_conversation", activeConversationId);
      socket.off("new_message", onNewMessage);
    };
  }, [activeConversationId, currentUser?.user_id]);

  const openConversation = async (conversationId) => {
    setActiveConversationId(conversationId);
  };

  const goToFullChat = () => {
    if (!activeConversationId) {
      navigate("/messages");
      return;
    }
    navigate(`/messages?conversation=${activeConversationId}`);
  };

  const handleSendMessage = () => {
    if (!activeConversationId || !currentUser?.user_id) return;
    const content = newMessage.trim();
    if (!content) return;

    socket.emit("send_message", {
      conversation_id: activeConversationId,
      sender_id: currentUser.user_id,
      content,
    });

    setNewMessage("");
  };

  const BackIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5"></path>
      <path d="M12 19l-7-7 7-7"></path>
    </svg>
  );

  const ExpandIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H3v5"></path>
      <path d="M16 3h5v5"></path>
      <path d="M21 16v5h-5"></path>
      <path d="M3 16v5h5"></path>
      <path d="M8 8L3 3"></path>
      <path d="M16 8l5-5"></path>
      <path d="M16 16l5 5"></path>
      <path d="M8 16l-5 5"></path>
    </svg>
  );

  return (
    <div className="messages-wrapper">
      <button className="messages-btn" onClick={() => setIsOpen((prev) => !prev)} aria-expanded={isOpen}>
        <div className="messages-btn-copy">
          <span className="messages-btn-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </span>
          <span>
            <strong>Mensajes</strong>
            <small>{conversations.length > 0 ? `${conversations.length} chats` : "Sin chats"}</small>
          </span>
        </div>
        <span className={`messages-btn-chevron ${isOpen ? "open" : ""}`} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </span>
      </button>

      {isOpen && (
        <div className="messages-popover">
          <div className="messages-popover-header">
            <div>
              <p className="messages-popover-eyebrow">Conversaciones</p>
              <span className="messages-popover-title">Chats recientes</span>
            </div>
            <button className="messages-popover-all" onClick={goToFullChat}>
              Ver todos
            </button>
          </div>

          {!activeConversationId ? (
            <div className="messages-popover-list">
              {conversations.length > 0 ? (
                conversations.map((chat) => (
                  <button
                    key={chat.conversation_id}
                    className="messages-popover-item"
                    onClick={() => openConversation(chat.conversation_id)}
                  >
                    <div className="messages-popover-avatar">
                      {chat.other_profile_picture_url ? (
                        <img
                          src={`http://localhost:3001${chat.other_profile_picture_url}`}
                          alt={chat.other_username}
                        />
                      ) : (
                        <span aria-hidden="true">{getInitial(chat.other_username)}</span>
                      )}
                    </div>
                    <div className="messages-popover-meta">
                      <span className="messages-popover-name">{chat.other_username}</span>
                      <span className="messages-popover-preview">{chat.last_message || "Sin mensajes"}</span>
                      <span className="messages-popover-date">
                        {formatRelativeDate(chat.last_message_at)}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="messages-popover-empty">No tienes chats todavia.</div>
              )}
            </div>
          ) : (
            <div className="messages-popover-thread">
              <div className="messages-popover-thread-header">
                <button
                  className="messages-popover-icon-btn"
                  onClick={() => setActiveConversationId(null)}
                  aria-label="Volver a chats"
                  title="Volver a chats"
                >
                  <BackIcon />
                </button>
                <button
                  className="messages-popover-icon-btn secondary"
                  onClick={goToFullChat}
                  aria-label="Abrir chat completo"
                  title="Abrir chat completo"
                >
                  <ExpandIcon />
                </button>
              </div>
              {(() => {
                const activeChat = conversations.find(
                  (chat) => Number(chat.conversation_id) === Number(activeConversationId)
                );

                return (
                  <div className="messages-popover-thread-profile">
                    <div className="messages-popover-avatar large">
                      {activeChat?.other_profile_picture_url ? (
                        <img
                          src={`http://localhost:3001${activeChat.other_profile_picture_url}`}
                          alt={activeChat.other_username}
                        />
                      ) : (
                        <span aria-hidden="true">{getInitial(activeChat?.other_username)}</span>
                      )}
                    </div>
                    <div className="messages-popover-thread-copy">
                      <strong>{activeChat?.other_username || "Conversación"}</strong>
                      <span>{formatRelativeDate(activeChat?.last_message_at)}</span>
                    </div>
                  </div>
                );
              })()}
              <div className="messages-popover-thread-body">
                {messages.map((msg) => (
                  <div
                    key={msg.message_id}
                    className={`messages-popover-bubble-row ${Number(msg.sender_id) === Number(currentUser?.user_id) ? "mine" : "theirs"}`}
                  >
                    <div
                      className={`messages-popover-bubble ${Number(msg.sender_id) === Number(currentUser?.user_id) ? "mine" : "theirs"}`}
                    >
                      {msg.content}
                    </div>
                    <span className="messages-popover-time">{formatTime(msg.created_at)}</span>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="messages-popover-empty-thread">
                    <strong>Aún no hay mensajes</strong>
                    <span>Escribe algo para iniciar la conversación.</span>
                  </div>
                )}
              </div>
              <div className="messages-popover-compose">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Escribe un mensaje..."
                />
                <button onClick={handleSendMessage}>Enviar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
