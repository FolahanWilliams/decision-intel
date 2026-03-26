import { redirect } from 'next/navigation';

export default function InsightsRedirect() {
  redirect('/dashboard/analytics?view=trends');
}
