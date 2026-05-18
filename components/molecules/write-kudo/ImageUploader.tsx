'use client';

import { useEffect, useId, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { CloseIcon, PlusIcon } from '@/components/atoms/KudoIcons';
import { FieldError } from './FieldError';
import { FieldLabel } from './FieldLabel';
import { KUDO_MAX_IMAGES, type KudoImage } from '@/lib/kudos/types';

interface ImageUploaderProps {
  images: KudoImage[];
  onChange: (next: KudoImage[]) => void;
  error?: string | null;
}

const ACCEPTED = 'image/png,image/jpeg,image/webp,image/gif';

/**
 * Image attachment field. Images stay in memory as `File` objects + object
 * URLs for the form lifetime. Object URLs are revoked on unmount + on
 * removal so the browser doesn't leak blob memory.
 */
export function ImageUploader({ images, onChange, error }: ImageUploaderProps) {
  const t = useTranslations('kudos.write.image');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  const isFull = images.length >= KUDO_MAX_IMAGES;

  useEffect(() => {
    // Revoke object URLs on unmount.
    const urls = images.map((i) => i.previewUrl);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    const slots = KUDO_MAX_IMAGES - images.length;
    const accepted = Array.from(files)
      .slice(0, slots)
      .map<KudoImage>((file) => ({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    onChange([...images, ...accepted]);
    event.target.value = '';
  }

  function remove(id: string) {
    const target = images.find((i) => i.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(images.filter((i) => i.id !== id));
  }

  return (
    <div className="flex w-full flex-col gap-2 md:flex-row md:items-start md:gap-4">
      <FieldLabel inline className="md:w-40 md:pt-3">
        {t('label')}
      </FieldLabel>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative h-20 w-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt=""
                className="h-full w-full rounded-(--radius-md) object-cover ring-1 ring-foreground/10"
              />
              <button
                type="button"
                aria-label={t('removeAriaLabel')}
                onClick={() => remove(img.id)}
                className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E53935] text-white shadow-sm hover:opacity-90"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          ))}

          {!isFull && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-(--radius-md) border border-[#998C5F] bg-white px-3 py-2 text-sm font-bold text-foreground hover:bg-foreground/5"
            >
              <PlusIcon className="h-4 w-4" />
              <span>{t('add')}</span>
              <span className="text-[#999999]">{t('maxHint', { max: KUDO_MAX_IMAGES })}</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="sr-only"
            onChange={onFileSelected}
          />
        </div>

        <FieldError id={errorId} message={error ?? null} />
      </div>
    </div>
  );
}
