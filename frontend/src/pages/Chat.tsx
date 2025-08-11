import React from 'react';
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";
import "./Chat.css";

interface Instance {
  value: string;
}
interface Contact {
  id: string;
  remote_jid: string;
  push_name?: string;
}
interface Message {
  id: string;
  message_content: string;
  from_me: boolean;
  message_timestamp: string;
}

export default function Chat() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Scroll automático para a última mensagem

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Buscar instâncias distintas da tabela webhook_messages

  useEffect(() => {
    async function fetchInstances() {
      const { data, error } = await supabase
        .from("webhook_messages")
        .select("instance");
      if (!error && data) {
        const uniqueInstances = Array.from(
          new Set(data.map((msg: any) => msg.instance))
        )
          .filter((v) => v && v !== "")
          .map((v) => ({ value: v }));
        setInstances(uniqueInstances);
        if (uniqueInstances.length > 0)
          setSelectedInstance(uniqueInstances[0].value);
      }
    }
    fetchInstances();
  }, []); // Buscar contatos da instância a partir da tabela webhook_messages

  useEffect(() => {
    if (!selectedInstance) return;
    async function fetchContacts() {
      setLoadingContacts(true);
      const { data, error } = await supabase
        .from("webhook_messages")
        .select("remote_jid, push_name")
        .eq("instance", selectedInstance);
      if (!error && data) {
        // Extrair contatos únicos
        const uniqueMap = new Map();
        data.forEach((msg: any) => {
          if (!uniqueMap.has(msg.remote_jid)) {
            uniqueMap.set(msg.remote_jid, {
              remote_jid: msg.remote_jid,
              id: msg.remote_jid,
              push_name: msg.push_name,
            });
          }
        });
        const uniqueContacts = Array.from(uniqueMap.values()).filter(
          (c) => c.remote_jid && c.remote_jid !== ""
        );
        setContacts(uniqueContacts);
        if (uniqueContacts.length > 0)
          setSelectedContact(uniqueContacts[0].remote_jid);
      } else {
        setContacts([]);
        setSelectedContact("");
      }
      setLoadingContacts(false);
    }
    fetchContacts();
  }, [selectedInstance]); // Buscar mensagens do contato

  useEffect(() => {
    if (!selectedContact || !selectedInstance) return;
    async function fetchMessages() {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("webhook_messages")
        .select("id, message_content, from_me, message_timestamp")
        .eq("remote_jid", selectedContact)
        .eq("instance", selectedInstance)
        .order("message_timestamp", { ascending: true })
        .limit(100);
      if (!error && data) {
        setMessages(data);
      } else {
        setMessages([]);
      }
      setLoadingMessages(false);
    }
    fetchMessages();
  }, [selectedContact, selectedInstance]); // Troca de instância

  const handleInstanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInstance(e.target.value);
    setContacts([]);
    setMessages([]);
  }; // Troca de contato

  const handleContactChange = (jid: string) => {
    setSelectedContact(jid);
    setMessages([]);
  }; // Envio de mensagem (mock)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([
      ...messages,
      {
        id: Math.random().toString(),
        message_content: input,
        from_me: true,
        message_timestamp: new Date().toISOString(),
      },
    ]);
    setInput(""); // Aqui você pode integrar o envio real para Evolution
  };

  return (
    <div className="chat-whatsapp-root">
           {" "}
      <aside className="chat-whatsapp-sidebar">
               {" "}
        <div className="chat-whatsapp-sidebar-header">
                   {" "}
          <select value={selectedInstance} onChange={handleInstanceChange}>
                       {" "}
            {instances.map((inst) => (
              <option key={inst.value} value={inst.value}>
                {inst.value}
              </option>
            ))}
                     {" "}
          </select>
                 {" "}
        </div>
               {" "}
        <div className="chat-whatsapp-contacts">
                   {" "}
          {loadingContacts ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ul>
                           {" "}
              {contacts.map((contact) => (
                <li
                  key={contact.remote_jid}
                  className={
                    selectedContact === contact.remote_jid ? "selected" : ""
                  }
                  onClick={() => handleContactChange(contact.remote_jid)}
                >
                                   {" "}
                  <span className="contact-avatar">
                    {contact.push_name && !contact.remote_jid.endsWith("@g.us")
                      ? contact.push_name[0]
                      : contact.remote_jid[0]}
                  </span>
                                   {" "}
                  <span className="contact-name">
                    {contact.push_name && !contact.remote_jid.endsWith("@g.us")
                      ? contact.push_name
                      : contact.remote_jid}
                  </span>
                                 {" "}
                </li>
              ))}
                         {" "}
            </ul>
          )}
                 {" "}
        </div>
             {" "}
      </aside>
           {" "}
      <main className="chat-whatsapp-main">
               {" "}
        <header className="chat-whatsapp-main-header">
                    <h2>{selectedContact || "Selecione um contato"}</h2>       
            <span className="chat-main-instance">{selectedInstance}</span>     
           {" "}
        </header>
               {" "}
        <section className="chat-whatsapp-messages">
                   {" "}
          {loadingMessages ? (
            <Loader2 className="animate-spin" />
          ) : messages.length === 0 ? (
            <div
              style={{ color: "#b8c1ec", textAlign: "center", marginTop: 40 }}
            >
              Nenhuma mensagem
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`chat-message ${msg.from_me ? "me" : "them"}`}
              >
                                 {" "}
                <div className="chat-message-bubble">
                                      {msg.message_content}                   {" "}
                  <span className="chat-message-time">
                    {new Date(msg.message_timestamp).toLocaleString()}
                  </span>
                                   {" "}
                </div>
                               {" "}
              </div>
            ))
          )}
                    <div ref={messagesEndRef} />       {" "}
        </section>
               {" "}
        <form className="chat-whatsapp-input-bar" onSubmit={handleSend}>
                   {" "}
          <input
            type="text"
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!selectedContact}
          />
                   {" "}
          <button type="submit" disabled={!input.trim() || !selectedContact}>
            Enviar
          </button>
                 {" "}
        </form>
             {" "}
      </main>
      {" "}
    </div>
  );
}
