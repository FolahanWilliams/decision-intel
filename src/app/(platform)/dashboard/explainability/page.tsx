import { redirect } from 'next/navigation';

export default function ExplainabilityRedirect() {
  redirect('/dashboard/analytics?view=explainability');
}
