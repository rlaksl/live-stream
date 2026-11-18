/**
 * 마스코트(90년대 뚱뚱한 브라운관 TV) 도트 그림.
 * 40×34 칸의 격자에 몸체·안테나·노이즈·얼굴을 색으로 채운다. 아이보리 몸체, 은색 가는 안테나, 몸체 검정 외곽선 없음. 이미지 파일 없이 전부 코드로 만든다.
 * 캔버스 애니메이션(mascot.tsx)과 정지 SVG(app/mascot/[face])가 같은 함수를 쓴다.
 */

export type MascotFace = "happy" | "sleepy" | "dead" | "surprised";
export type Grid = (string | null)[][];

export const WIDTH = 40;
export const HEIGHT = 34;

const COLOR = {
  body: "#ede6d6",
  bodyLight: "#f8f4ea",
  bodyDark: "#cfc6b2",
  bezel: "#111111",
  knob: "#8a8478",
  knobDark: "#5f5a50",
  antenna: "#c9ccd1",
  face: "#ff8a1f",
  faceOutline: "#0b0908",
  magenta: "#ff2bd6",
  cyan: "#22e6ff",
};

/** 노이즈 밝기 단계. 얼굴이 꺼진(졸림·X) 상태는 어두운 단계만 쓴다. */
const NOISE = ["#141414", "#3c3c3c", "#7a7a7a", "#c8c8c8"];

/** 노이즈가 채워지는 화면 영역 */
const SCREEN = { x: 5, y: 12, w: 23, h: 17 };

// 얼굴 픽셀 좌표 [x, y]. 화면 가운데(x 16, y 20) 기준으로 그렸다.
const FACES: Record<MascotFace, [number, number][]> = {
  // 웃는 눈 ^ ^ 과 활짝 웃는 입
  happy: [
    [9, 18], [10, 17], [11, 16], [12, 17], [13, 18],
    [19, 18], [20, 17], [21, 16], [22, 17], [23, 18],
    [12, 22], [13, 23], [14, 24], [15, 24], [16, 24], [17, 24], [18, 24], [19, 23], [20, 22],
  ],
  // 감은 눈 - - , 작은 입, 구석의 z
  sleepy: [
    [9, 18], [10, 18], [11, 18], [12, 18], [13, 18],
    [19, 18], [20, 18], [21, 18], [22, 18], [23, 18],
    [15, 23], [16, 23], [17, 23],
    [22, 13], [23, 13], [24, 13], [25, 13], [24, 14], [23, 15], [22, 16], [23, 16], [24, 16], [25, 16],
  ],
  // X 눈과 물결 입
  dead: [
    [9, 15], [13, 15], [10, 16], [12, 16], [11, 17], [10, 18], [12, 18], [9, 19], [13, 19],
    [19, 15], [23, 15], [20, 16], [22, 16], [21, 17], [20, 18], [22, 18], [19, 19], [23, 19],
    [13, 23], [14, 22], [15, 23], [16, 22], [17, 23], [18, 22], [19, 23],
  ],
  // 놀란 눈 ㅇ0ㅇ: 동그란 두 눈과 동그랗게 벌린 입
  surprised: [
    [10, 15], [11, 15], [12, 15], [9, 16], [13, 16], [9, 17], [13, 17], [9, 18], [13, 18], [10, 19], [11, 19], [12, 19],
    [20, 15], [21, 15], [22, 15], [19, 16], [23, 16], [19, 17], [23, 17], [19, 18], [23, 18], [20, 19], [21, 19], [22, 19],
    [15, 22], [16, 22], [17, 22], [14, 23], [18, 23], [14, 24], [18, 24], [15, 25], [16, 25], [17, 25],
  ],
};

/** 노이즈·얼굴을 제외한 TV 몸체. 매 프레임 같으므로 한 번만 만든다. */
const BODY: Grid = drawBody();

/**
 * 한 프레임을 그린다.
 * @param random 0~1 난수 함수 (애니메이션은 Math.random, 파비콘은 고정 시드)
 * @param frame 프레임 번호. 화면을 천천히 내려가는 밝은 줄(아날로그 롤링)에 쓴다.
 */
export function renderFrame(face: MascotFace, random: () => number, frame = 0): Grid {
  const grid = BODY.map((row) => [...row]);
  const dim = face === "sleepy" || face === "dead";

  // 1) 굵은 픽셀 아날로그 노이즈 + 홀수 줄은 어둡게(주사선) + 천천히 내려가는 밝은 줄
  const rollY = SCREEN.y + (frame % (SCREEN.h * 3)) / 3;
  forScreen((x, y) => {
    let level = Math.floor(random() * (dim ? 2.6 : 4));
    if ((y - SCREEN.y) % 2 === 1) level = Math.max(0, level - 1);
    if (Math.abs(y - rollY) < 1) level = Math.min(NOISE.length - 1, level + 1);
    grid[y][x] = NOISE[level];
  });

  // 2) 가끔 색 글리치: 가로 띠 하나에 마젠타·시안이 섞인다
  if (random() < 0.12) {
    const bandY = SCREEN.y + Math.floor(random() * (SCREEN.h - 2));
    const bandH = 1 + Math.floor(random() * 2);
    const tint = random() < 0.5 ? COLOR.magenta : COLOR.cyan;
    forScreen((x, y) => {
      if (y >= bandY && y < bandY + bandH && random() < 0.6) grid[y][x] = tint;
    });
  }

  // 3) 얼굴은 항상 노이즈 앞에: 테두리를 먼저 칠하고 그 위에 얼굴색을 칠한다
  const pixels = FACES[face];
  for (const [x, y] of pixels) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      if (isScreen(x + dx, y + dy)) grid[y + dy][x + dx] = COLOR.faceOutline;
    }
  }
  for (const [x, y] of pixels) grid[y][x] = COLOR.face;

  return grid;
}

function drawBody(): Grid {
  const grid: Grid = Array.from({ length: HEIGHT }, () => Array<string | null>(WIDTH).fill(null));
  const set = (x: number, y: number, color: string) => {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) grid[y][x] = color;
  };

  // 안테나: 몸체 위로 가늘게 뻗은 은색 두 갈래
  line(18, 7, 11, 1, (x, y) => set(x, y, COLOR.antenna));
  line(21, 7, 28, 1, (x, y) => set(x, y, COLOR.antenna));
  roundRect(17, 7, 6, 2, 0, (x, y) => set(x, y, COLOR.bodyDark));

  // 뚱뚱한 몸체(외곽선 없음): 몸통 → 위쪽 하이라이트, 아래쪽 그림자
  roundRect(1, 8, 38, 25, 3, (x, y) => set(x, y, COLOR.body));
  for (let x = 4; x <= 35; x++) {
    set(x, 9, COLOR.bodyLight);
    set(x, 31, COLOR.bodyDark);
  }

  // 화면 테두리(베젤)
  roundRect(4, 11, 25, 19, 2, (x, y) => set(x, y, COLOR.bezel));

  // 오른쪽 패널: 다이얼 두 개와 스피커 구멍
  for (const [cx, cy] of [[33, 15], [33, 21]]) {
    for (let y = cy - 2; y <= cy + 2; y++) {
      for (let x = cx - 2; x <= cx + 2; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= 2.3) set(x, y, d <= 0.5 ? COLOR.knobDark : COLOR.knob);
      }
    }
    set(cx, cy - 2, COLOR.knobDark);
  }
  for (const y of [25, 27, 29]) for (let x = 31; x <= 35; x++) set(x, y, COLOR.bodyDark);

  // 짧은 다리
  for (let x = 5; x <= 9; x++) set(x, 33, COLOR.knob);
  for (let x = 30; x <= 34; x++) set(x, 33, COLOR.knob);

  return grid;
}

function forScreen(fn: (x: number, y: number) => void) {
  for (let y = SCREEN.y; y < SCREEN.y + SCREEN.h; y++) {
    for (let x = SCREEN.x; x < SCREEN.x + SCREEN.w; x++) {
      if (isScreen(x, y)) fn(x, y);
    }
  }
}

/** 화면 영역(모서리 1칸은 둥글게 잘림) */
function isScreen(x: number, y: number) {
  const right = SCREEN.x + SCREEN.w - 1;
  const bottom = SCREEN.y + SCREEN.h - 1;
  if (x < SCREEN.x || x > right || y < SCREEN.y || y > bottom) return false;
  const corner = (x === SCREEN.x || x === right) && (y === SCREEN.y || y === bottom);
  return !corner;
}

/** 모서리가 r칸만큼 둥근 사각형의 각 칸을 방문한다 */
function roundRect(x0: number, y0: number, w: number, h: number, r: number, fn: (x: number, y: number) => void) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const dx = Math.max(x0 + r - x, x - (x0 + w - 1 - r), 0);
      const dy = Math.max(y0 + r - y, y - (y0 + h - 1 - r), 0);
      if (dx * dx + dy * dy <= r * r) fn(x, y);
    }
  }
}

/** 두 점을 잇는 도트 직선 (Bresenham) */
function line(x0: number, y0: number, x1: number, y1: number, fn: (x: number, y: number) => void) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    fn(x0, y0);
    if (x0 === x1 && y0 === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/** 고정 시드 난수 (파비콘처럼 매번 같은 그림이 필요할 때) */
export function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 격자를 SVG 문자열로 (파비콘·헤더 로고용) */
export function toSvg(grid: Grid) {
  const rects: string[] = [];
  grid.forEach((row, y) =>
    row.forEach((color, x) => {
      if (color) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`);
    }),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
}
