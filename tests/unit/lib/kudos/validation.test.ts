import { describe, it, expect } from 'vitest';
import { validateWriteKudo } from '@/lib/kudos/validation';

describe('validateWriteKudo', () => {
  it('returns null for a fully valid form', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      title: 'Người truyền cảm hứng',
      body: 'Cảm ơn vì đã luôn lắng nghe.',
      hashtags: ['teamwork', 'kindness'],
      imageUrls: ['https://example.com/a.png', 'https://example.com/b.png'],
      anonymous: false,
    });
    expect(errors).toBeNull();
  });

  it('flags a missing recipient with "recipientRequired"', () => {
    const errors = validateWriteKudo({
      recipientId: '',
      body: 'Cảm ơn nhiều!',
      hashtags: ['teamwork'],
      imageUrls: [],
      anonymous: false,
    });
    expect(errors?.recipientId).toBe('recipientRequired');
  });

  it('flags an empty body with "bodyRequired"', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: '   ',
      hashtags: ['teamwork'],
      imageUrls: [],
      anonymous: false,
    });
    expect(errors?.body).toBe('bodyRequired');
  });

  it('flags a missing hashtag with "hashtagRequired"', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: 'OK',
      hashtags: [],
      imageUrls: [],
      anonymous: false,
    });
    expect(errors?.hashtags).toBe('hashtagRequired');
  });

  it('flags > 5 hashtags as "hashtagTooMany"', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: 'OK',
      hashtags: ['a', 'b', 'c', 'd', 'e', 'f'],
      imageUrls: [],
      anonymous: false,
    });
    expect(errors?.hashtags).toBe('hashtagTooMany');
  });

  it('flags > 5 images as "imagesTooMany"', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: 'OK',
      hashtags: ['teamwork'],
      imageUrls: [
        'https://example.com/1.png',
        'https://example.com/2.png',
        'https://example.com/3.png',
        'https://example.com/4.png',
        'https://example.com/5.png',
        'https://example.com/6.png',
      ],
      anonymous: false,
    });
    expect(errors?.images).toBe('imagesTooMany');
  });

  it('flags an invalid image URL as "imagesInvalid"', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: 'OK',
      hashtags: ['teamwork'],
      imageUrls: ['not-a-url'],
      anonymous: false,
    });
    expect(errors?.images).toBe('imagesInvalid');
  });

  it('accepts an optional title omitted', () => {
    const errors = validateWriteKudo({
      recipientId: 'u-nhat',
      body: 'OK',
      hashtags: ['teamwork'],
      imageUrls: [],
      anonymous: false,
    });
    expect(errors).toBeNull();
  });
});
