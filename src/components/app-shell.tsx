import { GlassProvider } from '@/components/ui/glass/glass-provider';

type Props = {
  children: React.ReactNode;
};

export function AppShell({ children }: Props) {
  return <GlassProvider>{children}</GlassProvider>;
}
