'use client';

/**
 * UI screens for different interview states
 */
import React from 'react';

interface InterviewNameFormProps {
  nameInput: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}

export function InterviewNameForm({ nameInput, onNameChange, onSubmit }: InterviewNameFormProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full mx-4 rounded-xl bg-white p-8 shadow-xl border border-gray-100">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-gray-900 text-center">
          Welcome to Your Interview
        </h2>
        <p className="mb-8 text-gray-600 text-center">
          Please confirm your name before starting the interview.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <label htmlFor="candidateName" className="block mb-2 text-sm font-semibold text-gray-700">
            Your Full Name
          </label>
          <input
            type="text"
            id="candidateName"
            value={nameInput}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-4 py-3 mb-6 text-gray-900 font-medium bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white placeholder:text-gray-400 transition-all"
            placeholder="Enter your full name"
            required
            autoFocus
          />
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            Start Interview
          </button>
        </form>
      </div>
    </div>
  );
}

export function InterviewLoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center max-w-md px-6">
        {/* Animated Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
            <div className="absolute inset-0 h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-75"></div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="mb-3 text-2xl font-bold text-gray-800">
          Starting your interview
        </h2>
        <p className="mb-6 text-gray-600">
          The AI interviewer will join shortly
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            💡 <span className="font-medium">Tip:</span> Make sure your microphone and camera are ready
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
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-md rounded-lg bg-white p-8 shadow-xl border border-red-100">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <h2 className="mb-3 text-2xl font-bold text-gray-900 text-center">
          Connection Error
        </h2>
        <p className="mb-6 text-gray-600 text-center">{errorMessage}</p>

        <button
          onClick={onRetry}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md"
          type="button"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

interface InterviewEndedScreenProps {
  onRejoin: () => void;
}

export function InterviewEndedScreen({ onRejoin }: InterviewEndedScreenProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-md rounded-lg bg-white p-8 shadow-xl border border-green-100 text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          Interview Complete
        </h2>
        <p className="mb-8 text-gray-600">
          Thank you for completing your interview! We'll review your responses and get back to you soon.
        </p>

        <div className="space-y-3">
          <button
            onClick={onRejoin}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md"
            type="button"
          >
            Start New Interview
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full rounded-lg bg-white border-2 border-gray-300 px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            type="button"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
