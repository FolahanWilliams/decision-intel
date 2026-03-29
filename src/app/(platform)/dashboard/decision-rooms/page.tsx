import { redirect } from 'next/navigation';

export default function DecisionRoomsRedirect() {
  redirect('/dashboard/meetings?tab=rooms');
}
