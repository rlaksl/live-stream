"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Mascot } from "@/features/mascot/mascot";
import { pickNewDonations } from "./new-donations";
import type { DonationItem, DonationSummary } from "./queries";

const POLL_MS = 4000;
const SHOW_MS = 5000;
const VOICE_KEY = "brdcst:donation-voice";

/**
 * 후원 알림 배너 (DESIGN.md 후원 알림). 플레이어를 감싼 relative 상자 안에 둔다.
 * 페이지를 연 뒤 들어온 확정 후원만 차례로 5초씩 보여주고, 효과음 → 음성("닉네임님 금액 원 후원")을 낸다.
 * 메시지는 배너에 넣지 않는다(댓글창에 표시). 브라우저는 화면을 한 번 누르기 전까지 소리를 막을 수 있다.
 */
export function DonationAlert({ broadcastId }: { broadcastId: string }) {
  const [current, setCurrent] = useState<DonationItem | null>(null);
  const queueRef = useRef<DonationItem[]>([]);
  const seenRef = useRef<Set<string> | null>(null);
  const voice = useVoiceSetting();
  // 대기열 타이머 안에서 최신 설정을 읽기 위해 ref에 옮겨 둔다
  const voiceRef = useRef(voice.on);
  useEffect(() => {
    voiceRef.current = voice.on;
  }, [voice.on]);

  // 후원 목록을 폴링해 새 후원을 대기열에 넣는다. 첫 응답은 "이미 본 것"으로만 기록한다.
  useEffect(() => {
    async function poll() {
      const res = await fetch(`/api/broadcasts/${broadcastId}/donations`, { cache: "no-store" });
      if (!res.ok) return;
      const { items }: DonationSummary = await res.json();
      if (!seenRef.current) {
        seenRef.current = new Set(items.map((d) => d.id));
        return;
      }
      const fresh = pickNewDonations(seenRef.current, items);
      fresh.forEach((d) => seenRef.current!.add(d.id));
      queueRef.current.push(...fresh);
    }
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [broadcastId]);

  // 보여주는 알림이 없으면 대기열에서 하나 꺼내 5초 동안 보여준다
  useEffect(() => {
    if (current) {
      const timer = setTimeout(() => setCurrent(null), SHOW_MS);
      return () => clearTimeout(timer);
    }
    const timer = setInterval(() => {
      const next = queueRef.current.shift();
      if (!next) return;
      setCurrent(next);
      if (voiceRef.current) announce(next);
    }, 500);
    return () => clearInterval(timer);
  }, [current]);

  return (
    <>
      {current && (
        <div
          role="status"
          className="absolute inset-x-2 bottom-2 z-20 flex items-center justify-center gap-4 rounded-sm border border-primary bg-white/10 px-3.5 py-3 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] backdrop-blur-md sm:inset-x-auto sm:top-6 sm:bottom-auto sm:left-1/2 sm:min-w-[400px] sm:-translate-x-1/2 sm:px-6 sm:py-4"
        >
          <Mascot face="surprised" size={60} className="hidden sm:block" />
          <span className="flex flex-wrap items-center justify-center gap-1 text-center sm:gap-1.5">
            <span className="highlight text-[15px] font-bold [text-shadow:none] sm:text-[19px]">
              {current.donor.nickname}
            </span>
            <span className="text-xs text-[#d4d4d8] sm:text-[13px]">님이</span>
            <span className="text-[15px] font-bold sm:text-[19px]">{current.amount.toLocaleString("ko-KR")}</span>
            <span className="text-xs text-[#d4d4d8] sm:text-[13px]">원 후원</span>
          </span>
        </div>
      )}
      <button
        type="button"
        aria-pressed={voice.on}
        onClick={voice.toggle}
        className="absolute top-14 right-4 z-20 flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-sm bg-black/60 text-sm sm:px-3.5"
      >
        {voice.on ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
        {/* 좁은 화면에서는 아이콘만 보여 화면을 덜 가린다 */}
        <span className="sr-only sm:not-sr-only">후원 음성 {voice.on ? "켜짐" : "꺼짐"}</span>
      </button>
    </>
  );
}

/** "후원 음성" 켜짐/꺼짐. 이 브라우저에만 기억한다(저장이 막혀 있으면 켜짐으로 시작). */
function useVoiceSetting() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    try {
      // 저장된 값은 마운트 뒤에만 읽을 수 있다(서버 렌더링과 첫 화면을 맞추기 위해)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(VOICE_KEY) === "off") setOn(false);
    } catch {}
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(VOICE_KEY, next ? "on" : "off");
    } catch {}
    if (!next) window.speechSynthesis?.cancel();
  }

  return { on, toggle };
}

/** 효과음 "띠링" 뒤에 브라우저 내장 음성으로 읽는다. 한국어 음성이 없으면 효과음만 난다. */
function announce(donation: DonationItem) {
  const ding = playDing();
  const speech = window.speechSynthesis;
  if (!speech) return;
  const koVoice = speech.getVoices().find((v) => v.lang.startsWith("ko"));
  if (speech.getVoices().length > 0 && !koVoice) return;
  const utterance = new SpeechSynthesisUtterance(`${donation.donor.nickname}님 ${donation.amount}원 후원`);
  utterance.lang = "ko-KR";
  if (koVoice) utterance.voice = koVoice;
  setTimeout(() => speech.speak(utterance), ding);
}

/** 두 음으로 된 짧은 효과음을 코드로 만든다. 걸리는 시간(ms)을 돌려준다. */
function playDing() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.15;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    setTimeout(() => ctx.close(), 1000);
    return 600;
  } catch {
    return 0;
  }
}
