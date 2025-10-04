import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { Rocket, Hammer, GraduationCap, FileText } from 'lucide-react';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions()}
      sidebar={{
        tabs: [
          {
            title: 'Startups',
            description: 'Launch your startup from idea to production',
            url: '/docs',
            icon: <Rocket />,
          },
          {
            title: 'Building with Kaizen',
            description: 'Guides and best practices',
            url: '/docs/building-with-kaizen',
            icon: <Hammer />,
          },
          {
            title: 'Learn AI',
            description: 'Master AI engineering from foundations to production',
            url: '/docs/ai',
            icon: <GraduationCap />,
          },
          {
            title: 'Project Documentation',
            description: 'Document your Idea, Decisions, and Technical Architecture',
            url: '/docs/project-documentation',
            icon: <FileText />,
          }
        ],
      }}
    >
      {children}
    </DocsLayout>
  );
}
