import { useEffect } from "react";
import { useToast } from "../common/Toast";

export default function ChatNotifications() {

  const { showToast } = useToast();

  useEffect(() => {

    const handleNewMessage = (event) => {

      const { message } = event.detail;

      if (!message) return;

      const senderName = message.senderName || "New Message";
      const content = message.content || "";

      console.log("🔥 Showing toast:", senderName, content);

      showToast(`${senderName}: ${content}`, "info");

    };

    window.addEventListener("chat:toast", handleNewMessage);

    return () => {
      window.removeEventListener("chat:toast", handleNewMessage);
    };

  }, [showToast]);

  return null;

}
