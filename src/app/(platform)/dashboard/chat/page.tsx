import { redirect } from 'next/navigation';

export default function ChatRedirect() {
  redirect('/dashboard/ai-assistant?mode=chat');
}
