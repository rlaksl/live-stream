import "server-only";
import {
  EgressStatus,
  MediaSource,
  SegmentedFileOutput,
  StartEgressRequest,
  TrackSource,
  type EgressInfo,
} from "livekit-server-sdk";
import { createAdminClient } from "@/lib/supabase";
import { egressClient, roomService } from "@/lib/livekit";
import { publisherIdentity } from "@/features/live/identity";

const BUCKET = process.env.RECORDING_S3_BUCKET ?? "recordings";

/**
 * 방송자의 송출을 HLS 조각으로 녹화해 Supabase Storage(S3 호환)에 올린다. (docs/adr/0002)
 * 영상은 방송자의 화면 공유 또는 카메라, 오디오는 방송자의 모든 오디오 트랙(탭 소리 + 마이크)을 섞는다.
 */
export async function startRecording(broadcastId: string, ownerId: string) {
  const identity = publisherIdentity(ownerId);
  const folder = `${broadcastId}/${Date.now()}`;
  // preferScreenShare를 켜 둔 채 카메라만 송출하면 녹화 영상이 검게 저장됐다(소리만 정상).
  // 그래서 실제로 화면 공유 트랙을 송출 중일 때만 켠다.
  const publisher = await roomService().getParticipant(broadcastId, identity);
  const sharingScreen = publisher.tracks.some((t) => t.source === TrackSource.SCREEN_SHARE);

  const info = await egressClient().startEgress(
    new StartEgressRequest({
      roomName: broadcastId,
      source: {
        case: "media",
        value: new MediaSource({
          video: { case: "participantVideo", value: { identity, preferScreenShare: sharingScreen } },
          // 이 참가자의 오디오를 모두 같은 채널(기본값: 양쪽)로 섞는다
          audio: { routes: [{ match: { case: "participantIdentity", value: identity } }] },
        }),
      },
      outputs: [
        {
          config: {
            case: "segments",
            value: new SegmentedFileOutput({
              filenamePrefix: `${folder}/segment`,
              playlistName: `${folder}/index.m3u8`,
              segmentDuration: 4,
            }),
          },
        },
      ],
      storage: {
        provider: {
          case: "s3",
          value: {
            accessKey: process.env.RECORDING_S3_ACCESS_KEY!,
            secret: process.env.RECORDING_S3_SECRET!,
            region: process.env.RECORDING_S3_REGION!,
            endpoint: process.env.RECORDING_S3_ENDPOINT!,
            bucket: BUCKET,
            forcePathStyle: true,
          },
        },
      },
    }),
  );

  const { error } = await createAdminClient().from("recordings").insert({
    broadcast_id: broadcastId,
    egress_id: info.egressId,
    playlist_path: `${folder}/index.m3u8`,
  });
  if (error) throw error;
}

/** 진행 중인 녹화를 멈춘다. 결과(완료·실패)는 egress_ended 웹훅이 기록한다. */
export async function stopRecording(broadcastId: string) {
  const { data } = await createAdminClient()
    .from("recordings")
    .select("egress_id")
    .eq("broadcast_id", broadcastId)
    .eq("status", "recording");

  for (const { egress_id } of data ?? []) {
    // 이미 끝난 egress(방이 닫혀 자동 종료된 경우 등)는 에러를 주므로 무시한다
    await egressClient()
      .stopEgress(egress_id)
      .catch(() => {});
  }
}

/** egress_ended 웹훅: 녹화 상태와 실제 목록 파일 경로를 기록한다. */
export async function finishRecording(info: EgressInfo) {
  // 3시간 제한 등으로 멈춘 경우(LIMIT_REACHED)도 그때까지의 파일은 올라가 있다
  const ok = info.status === EgressStatus.EGRESS_COMPLETE || info.status === EgressStatus.EGRESS_LIMIT_REACHED;
  // StartEgress(새 API)는 결과를 result.segments에 담는다
  const playlist = info.result.case === "segments" ? info.result.value.playlistName : undefined;

  const { error } = await createAdminClient()
    .from("recordings")
    .update({
      status: ok && playlist ? "ready" : "failed",
      // 처리 시각이 아니라 LiveKit이 기록한 실제 종료 시각 (나노초 bigint)
      ended_at: new Date(Number(info.endedAt) / 1e6).toISOString(),
      ...(playlist && { playlist_path: playlist }),
    })
    .eq("egress_id", info.egressId);
  if (error) throw error;
}

/**
 * 웹훅이 오지 않았을 때(웹훅 등록 전·전송 실패)를 대비해, 저장 중으로 남은 녹화의 결과를 LiveKit에 직접 묻는다.
 * 녹화를 화면에 보여주기 직전에 호출한다. 아직 진행 중이면 아무것도 하지 않는다.
 */
export async function syncRecording(egressId: string) {
  const [info] = await egressClient().listEgress({ egressId });
  if (info && info.status >= EgressStatus.EGRESS_COMPLETE) await finishRecording(info);
}

/** 방송 삭제 시 그 방송의 녹화 파일을 모두 지운다. */
export async function deleteRecordingFiles(broadcastId: string) {
  const storage = createAdminClient().storage.from(BUCKET);
  const { data: folders } = await storage.list(broadcastId);
  for (const folder of folders ?? []) {
    const { data: files } = await storage.list(`${broadcastId}/${folder.name}`, { limit: 1000 });
    const paths = (files ?? []).map((f) => `${broadcastId}/${folder.name}/${f.name}`);
    if (paths.length) await storage.remove(paths);
  }
}

/** 공개 버킷의 재생 주소 */
export function playlistUrl(playlistPath: string) {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${playlistPath}`;
}
