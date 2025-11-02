# Vision-Agents Patches

Historical patches for Vision-Agents library issues.

## Audio Queue Overflow Patch (OBSOLETE - Fixed in v0.2.0+)

> **⚠️ NOTE**: This patch is **no longer needed** for vision-agents >= 0.2.0. The issue has been fixed upstream.

**Problem** (versions < 0.2.0): Vision-Agents had a small audio buffer (100 chunks = 4 seconds) which caused audio queue overflow warnings when the AI generated speech faster than real-time playback.

**Symptom**:
```
WARNING | Audio queue overflow, dropped items max is 100. pcm duration 40.0 ms
```

**Fix in v0.2.0**: Vision-Agents refactored the audio architecture and now uses a time-based buffer (`audio_buffer_size_ms`) with a default of **30 seconds** (30000ms) in the `getstream` package's `AudioStreamTrack` class. This is even larger than our previous patch's 20-second buffer.

### For Historical Reference

The old patch files have been removed as they:
1. Target code patterns that no longer exist in v0.2.0+
2. Used a different parameter name (`max_queue_size`) that doesn't exist in the new architecture
3. Are incompatible with the refactored plugin structure

### If You Still See Overflow Warnings

If you see audio buffer overflow warnings in v0.2.0+, they will now appear as:
```
WARNING | Audio buffer overflow, dropping X.Xms of audio. Buffer max is 30000ms
```

This would indicate the 30-second buffer is being exceeded, which suggests a different underlying issue that should be investigated.

## Notes

- The audio queue overflow issue is **fixed upstream** as of vision-agents 0.2.0
- No patches are currently needed for vision-agents
- This file is kept for historical reference
