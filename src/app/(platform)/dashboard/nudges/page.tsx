import { redirect } from 'next/navigation';

export default function NudgesRedirect() {
  redirect('/dashboard/decision-quality?tab=nudges');
}
