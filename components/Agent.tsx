"use client";

import { PhoneIcon, PhoneOffIcon } from "lucide-react";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
        },
      });
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden flex flex-col items-center justify-between">
        {/* AI Interviewer View with Speaking Animation */}
        <div className="absolute left-4 w-[280px] h-[220px] bg-white/10 rounded-xl shadow-md p-3 flex flex-col items-center">
          <div className="relative w-full h-[180px] overflow-hidden rounded-md">
            {/* Speaking Animation Effect */}
            {isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-32 h-32 bg-blue-400/30 rounded-full animate-ping-slow" />
                <div className="absolute w-24 h-24 bg-blue-400/20 rounded-full animate-ping-slow-delayed" />
              </div>
            )}
            <Image
              src="/ai-avatar.png"
              alt="AI Interviewer"
              width={280}
              height={180}
              className="relative z-10 object-cover w-full h-full"
            />
          </div>
          <h3 className="text-white mt-1 text-base font-semibold flex items-center gap-2">
            AI Interviewer
            {isSpeaking && (
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </h3>
        </div>

        {/* Enhanced Transcript Box */}
        {/* Simplified Transcript Box */}
        {(messages.length > 0 || isSpeaking) && (
          <div className="absolute top-[32%] left-[27%] w-[47%] py-5 px-6 bg-gradient-to-br from-gray-900 to-blue-900/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-50">
            {/* Header Section */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-blue-400/10">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-blue-400 text-lg font-semibold">
                Live Conversation
              </h3>
            </div>

            {/* Message Container */}
            <div className="relative min-h-[100px] p-4 bg-black/30 rounded-lg">
              {/* Message Content */}
              {messages.length > 0 && (
                <p
                  key={`msg-${messages.length}`}
                  className="text-gray-100 text-center text-md leading-relaxed animate-fadeIn"
                >
                  {messages[messages.length - 1].content}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Candidate View (unchanged) */}
        <div className="absolute bottom-24 right-4 w-[280px] h-[220px] bg-white/10 rounded-xl shadow-md p-3 flex flex-col items-center">
          <div className="w-full h-[180px] overflow-hidden rounded-md">
            <Image
              src="/user-avatar.png"
              alt="Candidate"
              width={280}
              height={180}
              className="object-cover w-full h-full"
            />
          </div>
          <h3 className="text-white mt-1 text-base font-semibold">
            {userName}
          </h3>
        </div>

        {/* Call Button (unchanged) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          {callStatus !== "ACTIVE" ? (
            <button
              className="relative w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center shadow-lg transition"
              onClick={handleCall}
            >
              {callStatus === "CONNECTING" && (
                <span className="absolute w-full h-full rounded-full bg-green-400 animate-ping opacity-75" />
              )}
              <PhoneIcon className="text-white w-6 h-6 relative z-10" />
            </button>
          ) : (
            <button
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition"
              onClick={handleDisconnect}
            >
              <PhoneOffIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Add custom animation keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes ping-slow {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-ping-slow-delayed {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          animation-delay: 0.5s;
        }

        @keyframes quickFadeIn {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-quickFadeIn {
          animation: quickFadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Agent;
