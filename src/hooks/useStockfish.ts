'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface StockfishLine {
  depth: number;
  score: {
    type: 'cp' | 'mate';
    value: number; // Centipawns or moves to mate (positive = white advantage, negative = black advantage)
  };
  bestMove: string; // UCI format e.g. "e2e4"
  continuation: string[]; // Array of UCI moves e.g. ["e2e4", "e7e5", "g1f3"]
  evaluationText: string; // Human readable string e.g. "+3.50" or "Mate in 2"
}

export interface UseStockfishReturn {
  isReady: boolean;
  isEvaluating: boolean;
  evaluatePosition: (fen: string, depth?: number) => Promise<StockfishLine>;
  stopEvaluation: () => void;
  lastResult: StockfishLine | null;
  error: string | null;
}

export function useStockfish(): UseStockfishReturn {
  const [isReady, setIsReady] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastResult, setLastResult] = useState<StockfishLine | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const resolvePromiseRef = useRef<((line: StockfishLine) => void) | null>(null);
  const rejectPromiseRef = useRef<((reason: string) => void) | null>(null);
  const bestLineRef = useRef<StockfishLine | null>(null);
  const fenTurnRef = useRef<'w' | 'b'>('w');

  useEffect(() => {
    // Dynamically create a Web Worker that loads stockfish.js from CDN
    try {
      const workerCode = `
        try {
          importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
        } catch (e) {
          postMessage('ERROR: Failed to load Stockfish script');
        }
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.onmessage = (event) => {
        const line = typeof event.data === 'string' ? event.data : '';

        if (line.startsWith('ERROR:')) {
          setError(line);
          return;
        }

        if (line === 'uciok' || line === 'readyok') {
          setIsReady(true);
          return;
        }

        // Parse info line for score and PV (principal variation)
        if (line.startsWith('info') && line.includes('score')) {
          const depthMatch = line.match(/\bdepth (\d+)\b/);
          const cpMatch = line.match(/\bscore cp (-?\d+)\b/);
          const mateMatch = line.match(/\bscore mate (-?\d+)\b/);
          const pvMatch = line.match(/\bpv (.+)$/);

          const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;
          let scoreType: 'cp' | 'mate' = 'cp';
          let scoreValue = 0;

          if (mateMatch) {
            scoreType = 'mate';
            scoreValue = parseInt(mateMatch[1], 10);
          } else if (cpMatch) {
            scoreType = 'cp';
            scoreValue = parseInt(cpMatch[1], 10);
          }

          // Adjust score sign based on whose turn it is in FEN so positive always = white advantage
          const signedValue = fenTurnRef.current === 'b' ? -scoreValue : scoreValue;

          let evaluationText = '';
          if (scoreType === 'mate') {
            evaluationText = `Mate in ${Math.abs(signedValue)}`;
          } else {
            const pawns = (signedValue / 100).toFixed(2);
            evaluationText = signedValue > 0 ? `+${pawns}` : `${pawns}`;
          }

          const continuation = pvMatch ? pvMatch[1].trim().split(/\s+/) : [];
          const bestMove = continuation.length > 0 ? continuation[0] : '';

          if (bestMove) {
            bestLineRef.current = {
              depth,
              score: { type: scoreType, value: signedValue },
              bestMove,
              continuation,
              evaluationText,
            };
          }
        }

        // Bestmove line signals end of evaluation
        if (line.startsWith('bestmove')) {
          const parts = line.split(' ');
          const bestMove = parts[1] || '';

          const finalLine: StockfishLine = bestLineRef.current || {
            depth: 15,
            score: { type: 'cp', value: 0 },
            bestMove,
            continuation: [bestMove],
            evaluationText: '0.00',
          };

          setLastResult(finalLine);
          setIsEvaluating(false);

          if (resolvePromiseRef.current) {
            resolvePromiseRef.current(finalLine);
            resolvePromiseRef.current = null;
            rejectPromiseRef.current = null;
          }
        }
      };

      worker.onerror = () => {
        setError('Engine worker error');
        setIsReady(false);
      };

      worker.postMessage('uci');
      worker.postMessage('isready');
      workerRef.current = worker;

      return () => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not initialize Stockfish';
      setTimeout(() => setError(msg), 0);
    }
  }, []);

  const stopEvaluation = useCallback(() => {
    if (workerRef.current && isEvaluating) {
      workerRef.current.postMessage('stop');
      setIsEvaluating(false);
      if (rejectPromiseRef.current) {
        rejectPromiseRef.current('Evaluation stopped by user');
        resolvePromiseRef.current = null;
        rejectPromiseRef.current = null;
      }
    }
  }, [isEvaluating]);

  const evaluatePosition = useCallback(
    (fen: string, depth = 15): Promise<StockfishLine> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Engine worker is not initialized'));
          return;
        }

        // Determine active color from FEN ('w' or 'b')
        const parts = fen.split(' ');
        fenTurnRef.current = parts[1] === 'b' ? 'b' : 'w';
        bestLineRef.current = null;

        resolvePromiseRef.current = resolve;
        rejectPromiseRef.current = (msg) => reject(new Error(msg));

        setIsEvaluating(true);
        setError(null);

        workerRef.current.postMessage('stop');
        workerRef.current.postMessage(`position fen ${fen}`);
        workerRef.current.postMessage(`go depth ${depth}`);
      });
    },
    []
  );

  return {
    isReady,
    isEvaluating,
    evaluatePosition,
    stopEvaluation,
    lastResult,
    error,
  };
}
