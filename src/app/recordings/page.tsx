import { CategoryChips } from "@/features/broadcasts/category-chips";
import { CATEGORY_LABEL, isCategory } from "@/features/broadcasts/types";
import { Mascot } from "@/features/mascot/mascot";
import { RecordingCard } from "@/features/recordings/recording-card";
import { listRecordings } from "@/features/recordings/queries";

/** 다시보기 목록: 저장이 끝난 녹화 최신순. ?category=game 처럼 카테고리로 거른다. */
export default async function RecordingsPage({ searchParams }: PageProps<"/recordings">) {
  const { category: param } = await searchParams;
  const category = isCategory(param) ? param : undefined;
  const recordings = await listRecordings(60, category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold">다시보기</h1>
        <p className="text-[15px] text-muted-foreground">녹화를 켜고 진행한 방송이 끝나면 여기에 올라와요.</p>
      </div>
      <CategoryChips basePath="/recordings" active={category} />
      {recordings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Mascot face="surprised" size={120} />
          <p className="text-muted-foreground">
            {category ? `'${CATEGORY_LABEL[category]}' 카테고리에 다시보기가 없어요.` : "아직 다시보기가 없어요."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-6">
          {recordings.map((r) => (
            <RecordingCard key={r.id} recording={r} />
          ))}
        </div>
      )}
    </div>
  );
}
