import { describe, it, expect } from 'vitest';
import { validateWriteKudo } from '@/lib/kudos/validation';

describe('validateWriteKudo', () => {
  it('returns null for a fully valid form', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      title: 'Người truyền cảm hứng',
      body: 'Cảm ơn vì đã luôn lắng nghe.',
      hashtags: ['teamwork', 'kindness'],
      imagesCount: 2,
      anonymous: false,
    });
    expect(errors).toBeNull();
  });

  it('flags a missing recipient with "recipientRequired"', () => {
    const errors = validateWriteKudo({
      recipientId: '',
      body: 'Cảm ơn nhiều!',
      hashtags: ['teamwork'],
      imagesCount: 0,
      anonymous: false,
    });
    expect(errors?.recipientId).toBe('recipientRequired');
  });

  it('flags an empty body with "bodyRequired"', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: '   ',
      hashtags: ['teamwork'],
      imagesCount: 0,
      anonymous: false,
    });
    expect(errors?.body).toBe('bodyRequired');
  });

  it('flags a missing hashtag with "hashtagRequired"', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: 'OK',
      hashtags: [],
      imagesCount: 0,
      anonymous: false,
    });
    expect(errors?.hashtags).toBe('hashtagRequired');
  });

  it('flags > 5 hashtags as "hashtagTooMany"', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: 'OK',
      hashtags: ['a', 'b', 'c', 'd', 'e', 'f'],
      imagesCount: 0,
      anonymous: false,
    });
    expect(errors?.hashtags).toBe('hashtagTooMany');
  });

  it('flags > 5 images as "imagesTooMany"', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: 'OK',
      hashtags: ['teamwork'],
      imagesCount: 6,
      anonymous: false,
    });
    expect(errors?.images).toBe('imagesTooMany');
  });

  it('accepts an optional title omitted', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: 'OK',
      hashtags: ['teamwork'],
      imagesCount: 0,
      anonymous: false,
    });
    expect(errors).toBeNull();
  });
});
