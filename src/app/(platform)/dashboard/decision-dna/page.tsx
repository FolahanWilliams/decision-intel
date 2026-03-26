import { redirect } from 'next/navigation';

export default function DecisionDNARedirect() {
  redirect('/dashboard/analytics?view=dna');
}
