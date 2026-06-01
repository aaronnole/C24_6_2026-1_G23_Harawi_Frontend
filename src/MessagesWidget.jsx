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

  return (
    <div className="messages-wrapper">
      <button className="messages-btn" onClick={() => setIsOpen((prev) => !prev)}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span>Mensajes</span>
        </div>
        <span style={{ display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </span>
      </button>

      {isOpen && (
        <div className="messages-popover">
          <div className="messages-popover-header">
            <span>Chats</span>
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
                      <img
                        src={chat.other_profile_picture_url ? `http://localhost:3001${chat.other_profile_picture_url}` : ""}
                        alt={chat.other_username}
                      />
                    </div>
                    <div className="messages-popover-meta">
                      <span className="messages-popover-name">{chat.other_username}</span>
                      <span className="messages-popover-preview">{chat.last_message || "Sin mensajes"}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="messages-popover-empty">No tienes chats todavia.</div>
              )}
            </div>
          ) : (
            <div className="messages-popover-thread">
              <button className="messages-popover-back" onClick={() => setActiveConversationId(null)}>
                Volver a chats
              </button>
              <div className="messages-popover-thread-body">
                {messages.map((msg) => (
                  <div
                    key={msg.message_id}
                    className={`messages-popover-bubble ${Number(msg.sender_id) === Number(currentUser?.user_id) ? "mine" : "theirs"}`}
                  >
                    {msg.content}
                  </div>
                ))}
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
