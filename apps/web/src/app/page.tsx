/**
 * Home Page - Pending Interviews
 * Shows all pending interviews and allows starting any of them
 */
import Link from 'next/link';
import { mockInterviews, mockJobs, mockUsers } from '@/lib/mock-data';

export default function Home() {
  // Get all pending interviews
  const pendingInterviews = Object.entries(mockInterviews)
    .filter(([_, interview]) => interview.status === 'PENDING')
    .map(([id, interview]) => ({
      id,
      interview,
      job: mockJobs[interview.jobId],
      candidate: mockUsers[interview.candidateId],
    }));

  const hasMultiple = pendingInterviews.length > 3;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            SyncHire AI Interview
          </h1>
          <p className="text-lg text-gray-600">
            Powered by Vision-Agents & Stream
          </p>
        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            Pending Interviews ({pendingInterviews.length})
          </h2>

          {/* Compact scrollable list for 4+ interviews */}
          <div className={hasMultiple ? 'max-h-96 overflow-y-auto pr-2' : ''}>
            <div className="space-y-3">
              {pendingInterviews.map(({ id, interview, job, candidate }) => (
                <Link
                  key={id}
                  href={`/interview/${id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Interview details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {candidate.name}
                        </h3>
                        <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                          {interview.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Position:</span> {job.title}
                        </div>
                        <div>
                          <span className="font-medium">Company:</span> {job.company}
                        </div>
                        <div>
                          <span className="font-medium">Questions:</span> {job.questions.length}
                        </div>
                      </div>

                      {!hasMultiple && (
                        <p className="text-sm text-gray-500">
                          ID: {id}
                        </p>
                      )}
                    </div>

                    {/* Right: Start button */}
                    <div className="flex items-center">
                      <button className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700">
                        Start
                      </button>
                    </div>
                  </div>
                </Link>
              ))}

              {pendingInterviews.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <p className="text-gray-600">No pending interviews</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-2 font-semibold text-gray-800">
            What happens next:
          </h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Select an interview to start</li>
            <li>• You'll join a Stream video call</li>
            <li>• The AI interviewer will automatically join and greet you</li>
            <li>• Answer questions naturally via audio</li>
            <li>• The AI adapts based on your responses</li>
          </ul>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Make sure your microphone and camera are enabled</p>
        </div>
      </div>
    </div>
  );
}
