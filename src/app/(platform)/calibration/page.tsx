import { redirect } from 'next/navigation';

export default function CalibrationRedirect() {
  redirect('/dashboard/decision-quality?tab=calibration');
}
