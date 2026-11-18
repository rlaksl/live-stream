import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Mascot } from "@/features/mascot/mascot";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <Mascot face="dead" size={140} />
      <p className="font-pixel text-2xl text-primary">404 NO SIGNAL</p>
      <p className="text-muted-foreground">찾는 페이지나 방송이 없습니다.</p>
      <Link href="/" className={buttonVariants()}>
        홈으로
      </Link>
    </div>
  );
}
