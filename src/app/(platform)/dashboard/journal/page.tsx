import { redirect } from 'next/navigation';

export default function JournalRedirectPage() {
  redirect('/dashboard/decision-log?view=journal');
}
