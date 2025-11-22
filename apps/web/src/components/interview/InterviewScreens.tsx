'use client';

/**
 * UI screens for different interview states
 * Updated to match dark theme design system
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { User, Loader2, AlertTriangle, CheckCircle2, Sparkles, Video } from 'lucide-react';

interface InterviewNameFormProps {
  nameInput: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}

export function InterviewNameForm({ nameInput, onNameChange, onSubmit }: InterviewNameFormProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)] pointer-events-none opacity-50" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <Card className="relative max-w-md w-full mx-4 bg-card/80 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardContent className="pt-8 pb-8 px-8">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Video className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <h2 className="mb-2 text-2xl font-semibold text-foreground text-center tracking-tight">
            Welcome to Your Interview
          </h2>
          <p className="mb-8 text-muted-foreground text-center text-sm">
            Please confirm your name before starting the AI interview session.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <label htmlFor="candidateName" className="block mb-2 text-sm font-medium text-foreground">
              Your Full Name
            </label>
            <Input
              type="text"
              id="candidateName"
              value={nameInput}
              onChange={(e) => onNameChange(e.target.value)}
              className="mb-6 h-11 bg-secondary/50 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20"
              placeholder="Enter your full name"
              required
              autoFocus
            />
            <Button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Start AI Interview
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Make sure your camera and microphone are enabled
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function InterviewLoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)] pointer-events-none opacity-50" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative text-center max-w-md px-6">
        {/* Animated Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl animate-pulse" />
          </div>
        </div>

        <h2 className="mb-3 text-2xl font-semibold text-foreground tracking-tight">
          Starting your interview
        </h2>
        <p className="mb-6 text-muted-foreground">
          The AI interviewer will join shortly...
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Tips */}
        <div className="p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-white/5">
          <p className="text-sm text-muted-foreground">
            <span className="text-blue-400 font-medium">Tip:</span> Speak clearly and take your time with each answer
          </p>
        </div>
      </div>
    </div>
  );
}

interface InterviewErrorScreenProps {
  errorMessage: string;
  onRetry: () => void;
}

export function InterviewErrorScreen({ errorMessage, onRetry }: InterviewErrorScreenProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)] pointer-events-none opacity-50" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />

      <Card className="relative max-w-md w-full mx-4 bg-card/80 backdrop-blur-xl border-red-500/20 shadow-2xl">
        <CardContent className="pt-8 pb-8 px-8 text-center">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <h2 className="mb-3 text-2xl font-semibold text-foreground tracking-tight">
            Connection Error
          </h2>
          <p className="mb-6 text-muted-foreground text-sm">{errorMessage}</p>

          <Button
            onClick={onRetry}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/20"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface InterviewEndedScreenProps {
  onRejoin: () => void;
}

export function InterviewEndedScreen({ onRejoin }: InterviewEndedScreenProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)] pointer-events-none opacity-50" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-green-500/10 blur-[100px] rounded-full pointer-events-none" />

      <Card className="relative max-w-md w-full mx-4 bg-card/80 backdrop-blur-xl border-green-500/20 shadow-2xl">
        <CardContent className="pt-8 pb-8 px-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <h2 className="mb-3 text-2xl font-semibold text-foreground tracking-tight">
            Interview Complete
          </h2>
          <p className="mb-8 text-muted-foreground text-sm">
            Thank you for completing your interview! We&apos;ll review your responses and get back to you soon.
          </p>

          <div className="space-y-3">
            <Button
              onClick={onRejoin}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/20"
            >
              Start New Interview
            </Button>
            <Button
              onClick={() => window.location.href = '/candidate/jobs'}
              variant="outline"
              className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10"
            >
              Browse More Jobs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
