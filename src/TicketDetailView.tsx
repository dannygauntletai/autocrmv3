import { QueuePreview } from "./QueuePreview";
import { InternalNotesPanel } from "./InternalNotesPanel";
import { TicketDetailCenterSection } from "./TicketDetailCenterSection";

interface Props {
  ticketId: string;
  onClose: () => void;
}

export const TicketDetailView = ({
  ticketId,
  onClose
}: Props) => {
  return (
    <div className="w-full h-full flex gap-4">
      <div className="w-64 flex-shrink-0">
        <QueuePreview currentTicketId={ticketId} onTicketSelect={id => console.log("Selected ticket:", id)} />
      </div>
      <TicketDetailCenterSection ticketId={ticketId} onClose={onClose} />
      <div className="w-80 flex-shrink-0">
        <InternalNotesPanel ticketId={ticketId} />
      </div>
    </div>
  );
};