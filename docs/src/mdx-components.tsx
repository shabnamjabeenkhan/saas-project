import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { Mermaid } from '@/components/mdx/mermaid';
import { YouTube } from '@/components/mdx/youtube';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Card,
    Cards,
    Step,
    Steps,
    Mermaid,
    YouTube,
    Warning: (p: any) => <Callout type="warn" {...p} />,
    Note: (p: any) => <Callout type="info" {...p} />,
    ...components,
  };
}
