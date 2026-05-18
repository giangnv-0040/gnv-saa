'use client';

import { useCallback, useId, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Toast } from '@/components/molecules/Toast';
import { AnonymousCheckbox } from '@/components/molecules/write-kudo/AnonymousCheckbox';
import { ContentEditor } from '@/components/molecules/write-kudo/ContentEditor';
import { FormActions } from '@/components/molecules/write-kudo/FormActions';
import { HashtagPicker } from '@/components/molecules/write-kudo/HashtagPicker';
import { ImageUploader } from '@/components/molecules/write-kudo/ImageUploader';
import { RecipientCombobox } from '@/components/molecules/write-kudo/RecipientCombobox';
import { TitleField } from '@/components/molecules/write-kudo/TitleField';
import { submitKudoAction } from '@/lib/kudos/actions';
import { track } from '@/lib/analytics/track';
import { HASHTAG_SUGGESTIONS, MOCK_RECIPIENTS } from '@/lib/kudos/mock';
import { ROUTES } from '@/lib/routes';
import type { KudoImage } from '@/lib/kudos/types';
import { validateWriteKudo, type WriteKudoFieldErrors } from '@/lib/kudos/validation';

/**
 * Composition panel that hosts every field of the Viết Kudo form. Holds the
 * client-side form state, runs validation on submit, calls the stub server
 * action, and surfaces success / failure via the existing `Toast` molecule.
 *
 * The submit button stays disabled until the three required fields
 * (recipient, body, ≥1 hashtag) are present, per spec FR-003.
 */
export function WriteKudoPanel() {
  const t = useTranslations('kudos.write');
  const tError = useTranslations('kudos.write.errors');
  const router = useRouter();
  const headingId = useId();

  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [images, setImages] = useState<KudoImage[]>([]);
  const [anonymous, setAnonymous] = useState(false);

  const [errors, setErrors] = useState<WriteKudoFieldErrors>({});
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit = useMemo(
    () => Boolean(recipientId) && body.trim().length > 0 && hashtags.length > 0,
    [recipientId, body, hashtags],
  );

  const handleCancel = useCallback(() => {
    router.push(ROUTES.HOME);
  }, [router]);

  const handleSubmit = useCallback(() => {
    const fieldErrors = validateWriteKudo({
      recipientId: recipientId ?? '',
      title: title.trim() || undefined,
      body,
      hashtags,
      imagesCount: images.length,
      anonymous,
    });

    if (fieldErrors) {
      setErrors(fieldErrors);
      setToast({ message: tError('formInvalid'), tone: 'error' });
      return;
    }

    setErrors({});

    startTransition(async () => {
      const result = await submitKudoAction({
        recipientId: recipientId!,
        title: title.trim(),
        body: body.trim(),
        hashtags,
        anonymous,
        imagesCount: images.length,
      });

      if (!result.ok && 'errors' in result) {
        setErrors(result.errors);
        setToast({ message: tError('formInvalid'), tone: 'error' });
        return;
      }
      if (!result.ok) {
        setToast({ message: tError('server'), tone: 'error' });
        return;
      }

      track('kudo_submitted', {
        anonymous,
        hashtags: hashtags.length,
        images: images.length,
      });

      setToast({ message: t('success'), tone: 'success' });
      // Reset form state, then navigate home after a short delay so the
      // toast is visible long enough to read.
      setRecipientId(null);
      setTitle('');
      setBody('');
      setHashtags([]);
      setImages([]);
      setAnonymous(false);
      setTimeout(() => router.push(ROUTES.HOME), 1200);
    });
  }, [anonymous, body, hashtags, images.length, recipientId, router, t, tError, title]);

  return (
    <section
      aria-labelledby={headingId}
      className="relative mx-auto my-10 flex w-full max-w-[752px] flex-col gap-8 rounded-(--radius-lg) bg-[#FFF8E1] p-6 shadow-2xl md:p-10"
    >
      <h1
        id={headingId}
        className="text-center text-2xl font-bold leading-tight text-foreground md:text-[32px] md:leading-[40px]"
      >
        {t('title')}
      </h1>

      <RecipientCombobox
        recipients={MOCK_RECIPIENTS}
        value={recipientId}
        onChange={setRecipientId}
        error={errors.recipientId ? tError(errors.recipientId) : null}
      />

      <TitleField
        value={title}
        onChange={setTitle}
        error={errors.title ? tError(errors.title) : null}
      />

      <ContentEditor
        value={body}
        onChange={setBody}
        error={errors.body ? tError(errors.body) : null}
      />

      <HashtagPicker
        suggestions={HASHTAG_SUGGESTIONS}
        value={hashtags}
        onChange={setHashtags}
        error={errors.hashtags ? tError(errors.hashtags) : null}
      />

      <ImageUploader
        images={images}
        onChange={setImages}
        error={errors.images ? tError(errors.images) : null}
      />

      <AnonymousCheckbox checked={anonymous} onChange={setAnonymous} />

      <FormActions
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        submitting={pending}
        submitDisabled={!canSubmit}
      />

      {toast ? (
        <Toast message={toast.message} durationMs={3000} onDismiss={() => setToast(null)} />
      ) : null}
    </section>
  );
}
