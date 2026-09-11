import { redirect } from 'next/navigation';

export default function TutorialPage() {
  // Keep old links safe while removing the tutorial from the onboarding flow.
  redirect('/discover');
}
