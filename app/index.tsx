import { Redirect } from 'expo-router';
import { useStore } from '@/store';

export default function Index() {
  const { isAuthenticated } = useStore();
  
  if (isAuthenticated) {
    return <Redirect href="/(drawer)" />;
  }
  
  return <Redirect href="/(auth)/login" />;
}
