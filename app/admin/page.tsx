import { getTranslations } from 'next-intl/server';
import { ComingSoon } from '@/components/organisms/ComingSoon';

export default async function AdminPlaceholderPage() {
  const t = await getTranslations('placeholders');
  return <ComingSoon screenName={t('adminOverview')} />;
}
