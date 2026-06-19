import { InfoPage } from '@/components/workspace/info-page';

export default function ContactPage() {
  return (
    <InfoPage title="Contact Us">
      <p>
        Questions about Sweep, enterprise access, or partnerships? We&apos;d like to hear from you.
      </p>
      <p>
        Email{' '}
        <a href="mailto:sushantkat@gmail.com" className="text-[var(--v-fg)] underline underline-offset-2">
          sushantkat@gmail.com
        </a>{' '}
        and we&apos;ll get back within one business day.
      </p>
    </InfoPage>
  );
}