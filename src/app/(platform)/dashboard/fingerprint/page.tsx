import { redirect } from 'next/navigation';

export default function FingerprintRedirect() {
  redirect('/dashboard/analytics?view=fingerprint');
}
