import { getTranslations } from 'next-intl/server';
import { ComingSoon } from '@/components/organisms/ComingSoon';

export default async function RulesPlaceholderPage() {
  const t = await getTranslations('placeholders');
  return <ComingSoon screenName={t('rules')} />;
}
