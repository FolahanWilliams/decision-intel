import { redirect } from 'next/navigation';

export default function ExperimentsRedirect() {
  redirect('/dashboard/decision-quality?tab=experiments');
}
