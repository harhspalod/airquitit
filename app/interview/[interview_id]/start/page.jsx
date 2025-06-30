"use client";

import { InterviewDataContext } from "@/context/InterviewDataContext";
import { Mic, Phone, Timer } from "lucide-react";
import Image from "next/image";
import React, { useContext, useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import AlertConfirmation from "./_components/AlertConfirmation";
import axios from "axios";
import { FEEDBACK_PROMPT } from "@/services/Constants";
import TimmerComponent from "./_components/TimmerComponent";
import { getVapiClient } from "@/lib/vapiconfig";
import { supabase } from "@/services/supabaseClient";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function StartInterview() {
  const interviewInfo = {
    candidate_name: 'Harsh Palod',
    jobPosition: 'Frontend Developer',
    jobDescription: 'We are hiring a React developer with experience in building dynamic UIs.',
    duration: '30 mins',
    userEmail: 'harsh@domain.com',
    type: 'Technical Round',
    interview_id: '93733188-7e53-4107-999f-bbbef588e50a',
    questionList: {
      interviewQuestions: [
        { question: "What are React hooks and how do you use them?" },
        { question: "Explain the virtual DOM in React." },
        { question: "What is the useEffect hook used for?" },
        { question: "What is the difference between state and props in React?" },
        { question: "How does React handle component re-renders?" }
      ]
    }
  };
  
  
  const vapi = getVapiClient();
  const [activeUser, setActiveUser] = useState(false);
  const [start, setStart] = useState(false);
  const [subtitles, setSubtitles] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const conversation = useRef(null);
  const { interview_id } = useParams();
  
  // const { interviews } = useContext(InterviewDataContext);
  const router = useRouter();
  const [userProfile, setUserProfile] = useState({
    picture: null,
    name: interviewInfo?.candidate_name || "Candidate"
  });
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);



  useEffect(() => {
    // Load Google profile if available and userProfile is not already set
    if (
      typeof window !== 'undefined' &&
      !userProfile.name // Prevent override if already set
    ) {
      const googleProfile = localStorage.getItem('googleProfile');
      if (googleProfile) {
        const { picture, name } = JSON.parse(googleProfile);
        setUserProfile({ picture, name });
      }
    }

    // Start the interview if conditions are met
    if (interviewInfo?.jobPosition && vapi && !start) {
      setStart(true); // Mark the interview as started
      startCall(); // Trigger the startCall function
    }
  }, [interviewInfo, vapi]); // Dependencies: re-run if interviewInfo or vapi changes

  useEffect(() => {
    console.log("interviewInfo:", interviewInfo);
    if (
      interviewInfo &&
      interviewInfo?.jobPosition &&
      vapi &&
      !start
    ) {
      setStart(true);
      startCall();
    }
  }, [interviewInfo, vapi]);

  const startCall = async () => {
    const jobPosition = interviewInfo?.jobPosition || "Unknown Position";
    const questionList = interviewInfo?.questionList?.interviewQuestions.map((question) => question?.question);
    console.log("jobPosition:", jobPosition);
    console.log("questionList:' ", questionList);

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: `Hi ${interviewInfo?.candidate_name}, how are you? Ready for your interview on ${interviewInfo?.jobPosition}?`,
      transcriber: {
        provider: "deepgram",
        model: "nova-3",
        language: "en-US",
      },
      voice: {
        provider: "vapi",
        voiceId: "Neha",
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
"Hey ${interviewInfo?.candidate_name}! Welcome to your ${interviewInfo?.jobPosition} interview. Let’s get started with a few questions!"
Ask one question at a time and wait for the candidate’s response before proceeding. Keep the questions clear and concise. Below Are the questions ask one by one:
Questions: ${questionList}
If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That’s a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversation natural and engaging—use casual phrases like "Alright, next up..." or "Let’s tackle a tricky one!"
After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note:
"Thanks for chatting! Hope to see you crushing projects soon!"
Key Guidelines:
✅ Be friendly, engaging, and witty 🎤
✅ Keep responses short and natural, like a real conversation
✅ Adapt based on the candidate’s confidence level
✅ Ensure the interview remains focused on React
`.trim(),
          },
        ],
      },
    };

    vapi.start(assistantOptions);
  };

  useEffect(() => {
    if (!vapi) return;
    // Set up event listeners for Vapi events
    const handleMessage = (message) => {
      if (message?.role === "assistant" && message?.content) {
        setSubtitles(message.content);
      }
      
      if (message && message?.conversation) {
        const filteredConversation = message.conversation.filter((msg) => msg.role !== "system") || "";
        const conversationString = JSON.stringify(filteredConversation, null, 2);
        conversation.current = conversationString;
      }
    };

    const handleSpeechStart = () => {
      setIsSpeaking(true);
      setActiveUser(false);
      toast('AI is speaking...');
    };

    const handleSpeechEnd = () => {
      setIsSpeaking(false);
      setActiveUser(true);
    };

    vapi.on("message", handleMessage);
    vapi.on("call-start", () => {
      toast('Call started...');
      setStart(true);
    });
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("call-end", () => {
      toast('Call has ended. Generating feedback...');
      setIsGeneratingFeedback(true);
      GenerateFeedback();
    });

    return () => {
      vapi.off("message", handleMessage);
      vapi.off("call-start", () => {});
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("call-end", () => {});
    };
  },[vapi]);

  const GenerateFeedback = async () => {
    try {
      // Send conversation data to the AI feedback API
      const result = await axios.post("/api/ai-feedback", {
        conversation: conversation.current,
      });

      // Extract and clean the feedback content
      const Content = result?.data?.content
        ?.replace("```json", "")
        ?.replace("```", "");

      if (!Content) {
        throw new Error("Feedback content is empty");
      }

      // Insert feedback into the Supabase database
      await supabase.from("interview-feedback").insert([
        {
          userName: interviewInfo?.candidate_name,
          userEmail: interviewInfo?.userEmail,
          interview_id: interview_id,
          feedback: JSON.parse(Content),
          recommended: false,
        },
      ]);

      // Redirect to the completed interview page
      router.replace("/interview/" + interviewInfo?.interview_id + "/completed");
      toast.success("Feedback generated successfully!");
    } catch (error) {
      console.error("Feedback generation failed:", error);
      toast.error("Failed to generate feedback");
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const stopInterview = () => {
    vapi.stop();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Professional Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {interviewInfo?.jobPosition || "AI"} Interview Session
            </h1>
            <p className="text-gray-600">
              Powered by AI Interview Assistant
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <Timer className="text-blue-600" />
            <span className="font-mono text-lg font-semibold text-gray-700">
              <TimmerComponent start={start} />
            </span>
          </div>
        </header>

        {/* Interview Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* AI Recruiter Panel */}
          <div className={`bg-white rounded-xl p-6 shadow-md border transition-all duration-300 ${isSpeaking ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200"}`}>
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="relative">
                {isSpeaking && (
                  <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-75"></div>
                )}
                <div className="relative z-10 w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-blue-100">
                  <Image
                    src="/AIR.png" // Your AI recruiter image path
                    alt="AI Recruiter"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full" // Ensures full coverage of the circle
                    priority
                  />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-800">AI Recruiter</h2>
                <p className="text-sm text-gray-500">Interview HR</p>
              </div>
            </div>
          </div>

          {/* Candidate Panel */}
          <div className={`bg-white rounded-xl p-6 shadow-md border transition-all duration-300 ${activeUser ? "border-purple-300 ring-2 ring-purple-100" : "border-gray-200"}`}>
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="relative">
                {activeUser && (
                  <div className="absolute inset-0 rounded-full bg-purple-100 animate-ping opacity-75"></div>
                )}
                <div className="relative z-10 w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center">
                  {userProfile.picture ? (
                    <Image
                      src={userProfile.picture}
                      alt={userProfile.name}
                      width={80}
                      height={80}
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-600">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  {userProfile.name}
                </h2>
                <p className="text-sm text-gray-500">Candidate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subtitles Panel */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
          <div className="min-h-16 flex items-center justify-center">
            {subtitles ? (
              <p className="text-center text-gray-700 animate-fadeIn">
                "{subtitles}"
              </p>
            ) : (
              <p className="text-center text-gray-400">
                {isSpeaking ? "AI is speaking..." : "Waiting for response..."}
              </p>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <div className="flex flex-col items-center">
            <div className="flex gap-4 mb-4">
              <AlertConfirmation stopInterview={stopInterview}>
                <button 
                  className="p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200 shadow-sm transition-all flex items-center gap-2"
                  aria-label="End call"
                >
                  <Phone size={20} />
                  <span>End Interview</span>
                </button>
              </AlertConfirmation>
            </div>
            
            <p className="text-sm text-gray-500">
              {activeUser ? "Please respond..." : "AI is speaking..."}
            </p>
          </div>
        </div>
      </div>
      {isGeneratingFeedback && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Generating Feedback</h2>
            <p className="text-gray-600">Please wait while we analyze your interview...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StartInterview;