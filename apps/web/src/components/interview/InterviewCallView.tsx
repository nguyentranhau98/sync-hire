'use client';

/**
 * Active interview call view with video
 */
import { useEffect, useState } from 'react';
import {
  Call,
  CallControls,
  SpeakerLayout,
  StreamCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

interface InterviewCallViewProps {
  call: Call;
  interviewId: string;
}

/**
 * Agent Status Banner Component
 * Shows real-time status of AI interviewer
 */
function AgentStatusBanner({ status }: { status: 'waiting' | 'connected' }) {
  if (status === 'connected') {
    return (
      <div className="bg-green-600 px-6 py-3">
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
          <p className="text-sm font-medium text-white">
            AI Interviewer Connected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-600 px-6 py-3">
      <div className="flex items-center justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
        <p className="text-sm font-medium text-white">
          Waiting for AI Interviewer to join...
        </p>
      </div>
    </div>
  );
}

/**
 * Agent Monitor Component
 * Monitors call participants to detect when AI agent joins
 * Must be used inside StreamCall context
 */
function AgentMonitor() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [agentStatus, setAgentStatus] = useState<'waiting' | 'connected'>('waiting');

  useEffect(() => {
    // Check if AI Interviewer is in participants
    const hasAgent = participants.some((p) => {
      const nameMatch = p.name?.toLowerCase().includes('interviewer') ||
                        p.name?.toLowerCase().includes('ai');
      const userIdMatch = p.userId?.startsWith('agent-');
      const notCandidate = !p.userId?.includes('candidate');
      const notSelf = !p.isLocalParticipant;

      return (nameMatch || userIdMatch || (notCandidate && notSelf)) && notSelf;
    });

    setAgentStatus(hasAgent ? 'connected' : 'waiting');
  }, [participants]);

  return <AgentStatusBanner status={agentStatus} />;
}

export function InterviewCallView({ call, interviewId }: InterviewCallViewProps) {
  return (
    <StreamCall call={call}>
      <div className="str-video flex h-screen w-full flex-col bg-gray-900">
        {/* Header */}
        <div className="flex-shrink-0 bg-gray-800 px-6 py-4">
          <h1 className="text-xl font-bold text-white">AI Interview Session</h1>
          <p className="text-sm text-gray-400">
            Interview ID: {interviewId}
          </p>
        </div>

        {/* Agent Status Indicator */}
        <AgentMonitor />

        {/* Video/Audio Area */}
        <div className="relative flex-1 min-h-0">
          <SpeakerLayout participantsBarPosition="bottom" />
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 bg-gray-800 px-6 py-6">
          <div className="flex items-center justify-center">
            <CallControls />
          </div>
        </div>
      </div>
    </StreamCall>
  );
}
