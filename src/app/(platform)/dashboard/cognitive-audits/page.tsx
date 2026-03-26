import { redirect } from 'next/navigation';

export default function CognitiveAuditsRedirect() {
  redirect('/dashboard/decision-quality?tab=audits');
}
