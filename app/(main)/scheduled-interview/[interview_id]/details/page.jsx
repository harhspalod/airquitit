"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import InterviewDetailContainer from "./_components/InteviewDetailContainer";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

function InterviewDetail() {
  const { interview_id } = useParams();

  // Dummy Interview data (replace or fetch from API if needed)
  const [interviewDetail, setInterviewDetail] = useState({
    jobPosition: "Frontend Developer",
    jobDescription: "Build scalable UI components using React.",
    type: "Technical",
    questionList: ["What is React?", "Explain useEffect.", "Difference between state and props."],
    duration: "30 mins",
    interview_id: interview_id,
    created_at: new Date().toISOString(),
  });

  const [chatMessages, setChatMessages] = useState([
    { role: "bot", content: "Hi! I’m your interview assistant. Ask anything about this interview." }
  ]);
  const [chatInput, setChatInput] = useState("");

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
    setChatMessages([
      ...updatedMessages,
      { role: "bot", content: data.reply || "Sorry, I couldn't understand that." }
    ]);
  };

  return (
    <div className="mt-5 space-y-6">
      <h2 className="font-bold text-2xl">Interview Details</h2>
      <InterviewDetailContainer interviewDetail={interviewDetail} />

      {/* Gemini-style Chat UI */}
      <div className="w-full max-w-4xl mx-auto h-[75vh] bg-white shadow-xl rounded-xl flex flex-col border border-gray-200">
        <div className="flex justify-between items-center p-4 bg-primary text-white rounded-t-xl">
          <h3 className="font-semibold text-xl">Gemini Assistant</h3>
          <X className="cursor-pointer" onClick={() => setChatMessages([])} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm bg-gray-50">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg max-w-[80%] ${
                msg.role === "user"
                  ? "bg-gray-100 self-end ml-auto"
                  : "bg-blue-100 self-start mr-auto"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask anything about this interview..."
            className="flex-1 p-3 border rounded"
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
}

export default InterviewDetail;
