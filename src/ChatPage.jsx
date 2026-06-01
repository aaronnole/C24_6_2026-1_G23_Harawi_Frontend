import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import Header from "./Header";
import ChatConversationList from "./ChatConversationList";
import "./ChatPage.css";

const socket = io("http://localhost:3001", { autoConnect: true });

export default function ChatPage() {
  const location = useLocation();
  const savedUser = localStorage.getItem("user");
  const currentUser = useMemo(() => (savedUser ? JSON.parse(savedUser) : null), [savedUser]);

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showConversation, setShowConversation] = useState(false);

  useEffect(() => {
    if (!currentUser?.user_id) return;

    fetch(`http://localhost:3001/api/chat/conversations/${currentUser.user_id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando conversaciones");
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setConversations(list);
      })
      .catch((err) => {
        console.error("Error conversaciones:", err);
        setConversations([]);
      });
  }, [currentUser?.user_id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationFromQuery = params.get("conversation");
    if (conversationFromQuery) {
      setActiveConversationId(Number(conversationFromQuery));
      setShowConversation(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!activeConversationId) return;

    fetch(`http://localhost:3001/api/chat/messages/${activeConversationId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando mensajes");
        return res.json();
      })
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error mensajes:", err);
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

  const activeConversation = conversations.find(
    (c) => Number(c.conversation_id) === Number(activeConversationId)
  );

  const openConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    setShowConversation(true);
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
    <div className="chat-page">
      <Header />
      <main className="chat-layout">
        <div className={`${showConversation ? "hide-mobile" : ""}`}>
          <ChatConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={openConversation}
          />
        </div>

        <section className={`chat-thread ${showConversation ? "" : "hide-mobile"}`}>
          {activeConversation ? (
            <>
              <div className="chat-thread-header">
                <button className="chat-back-btn" onClick={() => setShowConversation(false)}>
                  Volver
                </button>
                <span>{activeConversation.other_username}</span>
              </div>
              <div className="chat-thread-body">
                {messages.map((msg) => (
                  <div
                    key={msg.message_id}
                    className={`chat-bubble ${Number(msg.sender_id) === Number(currentUser?.user_id) ? "mine" : "theirs"}`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className="chat-thread-compose">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Escribe un mensaje..."
                />
                <button onClick={handleSendMessage}>Enviar</button>
              </div>
            </>
          ) : (
            <div className="chat-empty">Selecciona un chat para comenzar</div>
          )}
        </section>
      </main>
    </div>
  );
}
