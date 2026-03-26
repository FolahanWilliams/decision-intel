import { redirect } from 'next/navigation';

export default function CopilotRedirect() {
  redirect('/dashboard/ai-assistant?mode=copilot');
}
