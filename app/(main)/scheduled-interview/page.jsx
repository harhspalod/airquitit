"use client";
import { useUser } from "@/app/provider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { Video, Bot, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import InterviewCard from "../dashboard/_components/interviewcard";
import { useRouter } from "next/navigation";

function ScheduledInterview() {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([{ role: "bot", content: "Hi! Ask anything about your interviews." }]);

  const router = useRouter();

  useEffect(() => {
    user && GetInterviewList();
  }, [user]);

  const GetInterviewList = async () => {
    const result = await supabase
      .from("Interviews")
      .select("jobPosition,duration,interview_id,userEmail")
      .eq("userEmail", user?.email)
      .order("id", { ascending: false });
      console.log("All interviews:", result.data);

    setInterviewList(result.data || []);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const updatedMessages = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(updatedMessages);
    setChatInput("");

    const res = await fetch("/api/gemini-chat", {
      method: "POST",
      body: JSON.stringify({ messages: updatedMessages }),
    });

    const data = await res.json();
    setChatMessages([...updatedMessages, { role: "bot", content: data.reply || "I couldn't understand that." }]);
  };

  return (
    <div className="mt-5 relative">
      <h2 className="font-bold text-2xl mb-4">Interview List with feedback is</h2>

      {interviewList?.length === 0 ? (
        <div className="p-5 flex flex-col items-center gap-3 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
          <Video className="text-primary h-10 w-10" />
          <h2 className="text-base">You don't have any interview created</h2>
          <Button onClick={() => router.push("/dashboard/create-interview")}>+ Create New Interview</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
          {interviewList.map((interview, index) => (
            <InterviewCard interview={interview} key={index} viewDetail={true} />
          ))}
        </div>
      )}

      {/* Chatbot Floating Button */}
      <Button
        className="fixed bottom-5 right-5 rounded-full p-3 shadow-lg bg-primary text-white hover:bg-primary/90 z-50"
        onClick={() => setShowChat(true)}
      >
        <Bot className="w-6 h-6" />
      </Button>

      {/* Chatbot Window */}
      {showChat && (
        <div className="fixed bottom-20 right-5 w-[350px] max-h-[500px] bg-white shadow-2xl rounded-xl flex flex-col z-50">
          <div className="flex justify-between items-center p-3 bg-primary text-white rounded-t-xl">
            <h3 className="font-semibold">Interview Chatbot</h3>
            <X className="cursor-pointer" onClick={() => setShowChat(false)} />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`p-2 rounded-lg max-w-[90%] ${msg.role === "user" ? "bg-gray-100 self-end ml-auto" : "bg-blue-100 self-start mr-auto"}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask something..."
              className="flex-1 p-2 border rounded"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduledInterview;
