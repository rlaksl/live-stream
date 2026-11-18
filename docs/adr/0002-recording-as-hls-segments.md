# 녹화는 MP4 한 파일이 아니라 HLS 조각으로 저장한다

녹화는 LiveKit `StartEgress`(MediaSource: 방송자 영상 + 방송자의 모든 오디오를 섞음)로 만들고 Supabase Storage(S3 호환 업로드)에 저장하는데, Supabase 무료 요금제는 파일 하나당 50MB 한도가 있어 MP4 한 파일은 저화질로도 10분이면 업로드가 실패한다. 그래서 몇 초 단위의 작은 조각과 목록 파일(HLS)로 저장하고 브라우저에서는 `hls.js`로 재생한다. 녹화 변환은 LiveKit 무료 한도(월 60분, 초과 시 실패)를 개발·시연·심사가 함께 쓰므로, 녹화는 방송자가 방송 시작 때 켤 때만 하고 방송당 최대 10분으로 제한하며, 녹화가 실패해도 송출은 계속된다.

## Considered Options

- MP4 한 파일: 파일당 50MB 한도 초과.
- Cloudflare R2: 파일 크기 걱정이 없지만 서비스가 하나 늘어난다. Supabase 무료 요금제에서도 S3 업로드가 가능함을 확인해 쓰지 않는다.
- Participant egress: 화면 공유 녹화 시 화면 공유 오디오(탭 소리)만 담고 마이크는 빠진다(`screenShare: true`면 screenshare + screenshare_audio). 송출은 탭 소리와 마이크를 별도 트랙으로 보내므로, 녹화에서만 MediaSource의 `AudioConfig`로 두 트랙을 섞는다. 1000Hz(탭)·440Hz(마이크) 테스트 음으로 둘 다 녹화됨을 확인했다(2026-11-18).
