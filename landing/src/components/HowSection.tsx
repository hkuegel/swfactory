import { SECTIONS } from '../content.ts';
import { Pipeline } from './Pipeline.tsx';
import { Section } from './Section.tsx';

/** How it works: the pipeline with its roles and the two human gates. */
export function HowSection() {
  return (
    <Section
      section={SECTIONS.how}
      lead="Two human gates, marked as diamonds. Every other step is owned by agent roles. Agents hand over through files, not chat."
    >
      <Pipeline />
    </Section>
  );
}
