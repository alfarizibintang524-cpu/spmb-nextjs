import StatusBadge from "@/app/ui/StatusBadge";

export default function StatusTag({ nilai }: { nilai: string }) {
  return <StatusBadge value={nilai} />;
}