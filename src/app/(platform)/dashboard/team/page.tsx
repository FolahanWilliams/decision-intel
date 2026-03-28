import { ErrorBoundary } from '@/components/ErrorBoundary';
import TeamPage from './TeamPage';

export default function Page() {
  return (
    <ErrorBoundary sectionName="Team Settings">
      <TeamPage />
    </ErrorBoundary>
  );
}
