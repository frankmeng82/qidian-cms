import flvjs from 'flv.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import videojs from 'video.js';

import type { PlayEpisode, PlayLine } from '../types/play';
import 'video.js/dist/video-js.css';

type Props = {
  videoId: string;
  lines: PlayLine[];
  initialEpisodeId?: string;
  onProgress?: (payload: { episodeId?: string; progressSecond: number }) => void;
};

export function VideoPlayer({ videoId, lines, initialEpisodeId, onProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const flvRef = useRef<flvjs.Player | null>(null);
  const progressSyncAtRef = useRef<number>(0);

  const [selectedLineId, setSelectedLineId] = useState(lines[0]?.id ?? '');
  const currentLine = useMemo(
    () => lines.find((line) => line.id === selectedLineId) ?? lines[0],
    [lines, selectedLineId],
  );
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(
    initialEpisodeId ?? currentLine?.episodes[0]?.id ?? '',
  );
  const currentEpisode = useMemo(
    () => currentLine?.episodes.find((episode) => episode.id === selectedEpisodeId) ?? currentLine?.episodes[0],
    [currentLine, selectedEpisodeId],
  );

  useEffect(() => {
    setSelectedLineId(lines[0]?.id ?? '');
  }, [lines]);

  useEffect(() => {
    if (!currentLine?.episodes.length) return;
    setSelectedEpisodeId((prev) => {
      if (currentLine.episodes.some((item) => item.id === prev)) return prev;
      return currentLine.episodes[0].id;
    });
  }, [currentLine]);

  useEffect(() => {
    const videoElement = videoRef.current;
    const episode = currentEpisode;
    if (!videoElement || !episode) return;

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    if (flvRef.current) {
      flvRef.current.destroy();
      flvRef.current = null;
    }

    if (episode.sourceType === 'flv') {
      if (flvjs.isSupported()) {
        const flvPlayer = flvjs.createPlayer({
          type: 'flv',
          url: episode.url,
        });
        flvPlayer.attachMediaElement(videoElement);
        flvPlayer.load();
        flvRef.current = flvPlayer;
      } else {
        videoElement.src = episode.url;
      }
    } else {
      const options = {
        controls: true,
        responsive: true,
        fluid: true,
        preload: 'auto',
        sources: [{ src: episode.url, type: sourceMimeType(episode) }],
      };
      playerRef.current = videojs(videoElement, options);
    }

    const progressKey = getProgressKey(videoId, currentLine?.id, episode.id);
    const savedProgress = Number(localStorage.getItem(progressKey) ?? '0');
    const safeCurrentTime = Number.isFinite(savedProgress) ? savedProgress : 0;

    const setInitialProgress = () => {
      if (safeCurrentTime > 0 && videoElement) {
        videoElement.currentTime = safeCurrentTime;
      }
    };
    videoElement.addEventListener('loadedmetadata', setInitialProgress);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    function handleTimeUpdate() {
      if (!videoElement) return;
      localStorage.setItem(progressKey, String(Math.floor(videoElement.currentTime)));
      const now = Date.now();
      if (onProgress && now - progressSyncAtRef.current > 5000) {
        progressSyncAtRef.current = now;
        onProgress({
          episodeId: episode.id,
          progressSecond: Math.floor(videoElement.currentTime),
        });
      }
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.code !== 'Space') return;
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }
      event.preventDefault();
      if (!videoElement) return;
      if (videoElement.paused) {
        void videoElement.play();
      } else {
        videoElement.pause();
      }
    }
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      videoElement.removeEventListener('loadedmetadata', setInitialProgress);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      if (flvRef.current) {
        flvRef.current.destroy();
        flvRef.current = null;
      }
    };
  }, [currentEpisode, currentLine?.id, onProgress, videoId]);

  if (!currentLine || !currentEpisode) {
    return <div>暂无可播放资源</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={selectedLineId} onChange={(event) => setSelectedLineId(event.target.value)}>
          {lines.map((line) => (
            <option key={line.id} value={line.id}>
              {line.name}
            </option>
          ))}
        </select>
        <select value={selectedEpisodeId} onChange={(event) => setSelectedEpisodeId(event.target.value)}>
          {currentLine.episodes.map((episode) => (
            <option key={episode.id} value={episode.id}>
              {episode.quality} - 第{episode.episodeNo}集
            </option>
          ))}
        </select>
      </div>
      <div data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline controls />
      </div>
    </div>
  );
}

function sourceMimeType(episode: PlayEpisode): string {
  if (episode.sourceType === 'm3u8') return 'application/x-mpegURL';
  if (episode.sourceType === 'flv') return 'video/x-flv';
  return 'video/mp4';
}

function getProgressKey(videoId: string, lineId?: string, episodeId?: string) {
  return `qidian-progress:${videoId}:${lineId ?? 'line'}:${episodeId ?? 'episode'}`;
}
