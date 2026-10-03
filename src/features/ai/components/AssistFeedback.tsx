import React, { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { aiService } from '../services/aiService';

type Reason = 'wrong' | 'unclear' | 'not_helpful' | 'other';
const REASONS: Array<{ value: Reason; label: string }> = [
  { value: 'wrong', label: 'Wrong' },
  { value: 'unclear', label: 'Unclear' },
  { value: 'not_helpful', label: "Didn't help" },
  { value: 'other', label: 'Other' },
];

/**
 * Thumbs up or down on one AI Assistance answer. A thumbs down asks why, with
 * an optional comment. Feedback goes to the Trussen team (anonymized) to
 * improve the help articles.
 */
export const AssistFeedback: React.FC<{ answerId: string }> = ({ answerId }) => {
  const [state, setState] = useState<'idle' | 'asking' | 'sending' | 'done' | 'failed'>('idle');
  const [reason, setReason] = useState<Reason | null>(null);
  const [comment, setComment] = useState('');

  const send = async (rating: 'up' | 'down', withReason?: Reason) => {
    setState('sending');
    try {
      await aiService.rateAssistAnswer(answerId, {
        rating,
        ...(withReason ? { reason: withReason } : {}),
        ...(comment.trim() ? { comment: comment.trim().slice(0, 500) } : {}),
      });
      setState('done');
    } catch {
      setState('failed');
    }
  };

  if (state === 'done') return <p className="text-[10px] text-gray-400">Thanks for the feedback.</p>;

  if (state === 'asking' || (state === 'sending' && reason) || (state === 'failed' && reason)) {
    return (
      <div className="space-y-1.5 rounded-lg border border-gray-100 p-2 dark:border-border-dark">
        <p className="text-[10px] font-medium text-gray-500">What was wrong?</p>
        <div className="flex flex-wrap gap-1">
          {REASONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setReason(item.value)}
              aria-pressed={reason === item.value}
              className={`rounded-full border px-2 py-0.5 text-[10px] ${
                reason === item.value ? 'border-primary/40 bg-primary/10 text-primary' : 'border-gray-200 text-gray-500 hover:border-primary/30 dark:border-border-dark'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Anything to add? (optional)"
          aria-label="Feedback comment"
          className="w-full resize-none rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!reason || state === 'sending'}
            onClick={() => void send('down', reason!)}
            className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
          >
            {state === 'sending' ? 'Sending…' : 'Send'}
          </button>
          <button type="button" onClick={() => { setState('idle'); setReason(null); }} className="text-[10px] text-gray-400 hover:text-gray-600">
            Cancel
          </button>
          {state === 'failed' && <span className="text-[10px] text-red-500">Couldn't send. Try again.</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-gray-400">Helpful?</span>
      <button
        type="button"
        disabled={state === 'sending'}
        onClick={() => void send('up')}
        aria-label="Helpful"
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-white/5"
      >
        <ThumbsUp size={11} />
      </button>
      <button
        type="button"
        disabled={state === 'sending'}
        onClick={() => setState('asking')}
        aria-label="Not helpful"
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-white/5"
      >
        <ThumbsDown size={11} />
      </button>
      {state === 'failed' && <span className="text-[10px] text-red-500">Couldn't send.</span>}
    </div>
  );
};
