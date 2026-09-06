import { describe, expect, it } from 'vitest';
import { parseSseFrame, takeSseFrames } from '../features/kiro-rag/rag-client.ts';

describe('RAG SSE parsing', () => {
  it('parses named events with JSON data', () => {
    expect(parseSseFrame('event: token\ndata: {"text":"hello"}')).toEqual({
      event: 'token',
      data: '{"text":"hello"}',
    });
  });

  it('joins multi-line data and ignores comments', () => {
    expect(parseSseFrame(': keepalive\nevent: context\ndata: {"a":1,\ndata: "b":2}')).toEqual({
      event: 'context',
      data: '{"a":1,\n"b":2}',
    });
  });

  it('uses the default message event when event is omitted', () => {
    expect(parseSseFrame('data: {"ok":true}')).toEqual({
      event: 'message',
      data: '{"ok":true}',
    });
  });

  it('extracts complete frames while preserving an incomplete tail', () => {
    const input = 'event: token\ndata: {"text":"A"}\n\nevent: token\ndata: {"text":"B"}\r\n\r\nevent: done';
    expect(takeSseFrames(input)).toEqual({
      frames: [
        'event: token\ndata: {"text":"A"}',
        'event: token\ndata: {"text":"B"}',
      ],
      rest: 'event: done',
    });
  });
});
