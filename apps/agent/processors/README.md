# SyncHire Custom Processors

Custom Vision-Agents processors for intelligent interview management.

## Interview Completion Processor

**File**: `interview_completion_processor.py`

### Purpose
Intelligently detects when an interview is complete based on multiple signals, not just simple keyword matching.

### How It Works

The processor analyzes the conversation in real-time and uses multiple signals to determine completion:

#### Detection Signals

1. **Closing Phrases** - Agent uses farewell language:
   - "goodbye", "bye", "good bye"
   - "luck", "best wishes", "best of luck"
   - "thank you for your time", "thanks for sharing"
   - "we'll be in touch", "be in touch"
   - "that concludes", "wraps up"

2. **Question Count** - Tracks questions asked vs expected:
   - Counts questions using indicators: "tell me about", "can you explain", "?", etc.
   - Allows 1 question variance (asked 7 of 8 = OK)

3. **Interview Duration** - Minimum time threshold:
   - Default: 8 minutes minimum
   - Ensures interview isn't cut short accidentally

4. **User Goodbye** - Candidate also says goodbye:
   - Immediate completion trigger
   - Respects user's desire to end

#### Completion Logic

Interview completes when:
```
(Agent said goodbye) AND (Enough questions asked OR Enough time passed)
```

Or:
```
User said goodbye
```

### Usage

```python
from processors.interview_completion_processor import InterviewCompletionProcessor

# Create processor
async def on_complete():
    await call.leave()

processor = InterviewCompletionProcessor(
    expected_questions=8,
    minimum_duration_minutes=8,
    completion_callback=on_complete
)

# Add to agent
agent.processors.append(processor)
await processor.setup(agent)

# Wait for completion
await processor.wait_for_completion(timeout=900)  # 15 min max
```

### Benefits Over Simple Keyword Matching

**Simple Approach** (previous):
- ❌ Transcript chunks break multi-word phrases
- ❌ Single "luck" in wrong context could end interview
- ❌ No awareness of interview progress
- ❌ Could end too early

**Smart Processor** (current):
- ✅ Handles chunked transcripts naturally
- ✅ Multiple confirmation signals
- ✅ Tracks interview progress (questions, time)
- ✅ Context-aware decisions
- ✅ Prevents premature endings

### Debugging

Enable debug logging to see completion checks:

```bash
# Set log level to DEBUG
export LOG_LEVEL=DEBUG
```

Look for logs like:
```
📊 Interview completion check:
  - Closing phrases: 2 (need: 1+)
  - Questions asked: 8/8
  - Duration: 9.2/8 min

✅ Interview marked complete: agent said goodbye, asked 8 questions, 9.2 min duration
```

### Configuration

Adjust processor behavior:

```python
processor = InterviewCompletionProcessor(
    expected_questions=10,           # Number of questions in interview
    minimum_duration_minutes=5,      # Shorter interviews
    completion_callback=on_complete  # Custom completion handler
)
```

### Future Enhancements

Potential improvements:
- **Sentiment analysis** - Detect frustration or confusion
- **Silence detection** - Long pauses indicate completion
- **LLM-based analysis** - Use AI to judge conversation state
- **Adaptive timing** - Learn optimal duration per role type
