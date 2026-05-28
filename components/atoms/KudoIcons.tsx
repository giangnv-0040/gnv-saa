import type { SVGProps } from 'react';

/**
 * Inline SVG icons used by the Viết Kudo form. Inlining keeps the bundle
 * small (each icon is a few hundred bytes) and avoids round-trip requests
 * for the toolbar render path. All icons inherit `currentColor` so the
 * surrounding text color is respected (high-contrast / theming friendly).
 */

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  className?: string;
  title?: string;
}

function baseProps({ className, title, ...rest }: IconProps) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': title ? undefined : (true as const),
    role: title ? ('img' as const) : undefined,
    className: ['h-6 w-6', className].filter(Boolean).join(' '),
    ...rest,
  };
}

function filledBaseProps({ className, title, ...rest }: IconProps) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': title ? undefined : (true as const),
    role: title ? ('img' as const) : undefined,
    className: ['h-6 w-6', className].filter(Boolean).join(' '),
    ...rest,
  };
}

export function BoldIcon(props: IconProps) {
  return (
    <svg {...filledBaseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <path
        d="M13.5 15.5H10V12.5H13.5C13.8978 12.5 14.2794 12.658 14.5607 12.9393C14.842 13.2206 15 13.6022 15 14C15 14.3978 14.842 14.7794 14.5607 15.0607C14.2794 15.342 13.8978 15.5 13.5 15.5ZM10 6.5H13C13.3978 6.5 13.7794 6.65804 14.0607 6.93934C14.342 7.22064 14.5 7.60218 14.5 8C14.5 8.39782 14.342 8.77936 14.0607 9.06066C13.7794 9.34196 13.3978 9.5 13 9.5H10M15.6 10.79C16.57 10.11 17.25 9 17.25 8C17.25 5.74 15.5 4 13.25 4H7V18H14.04C16.14 18 17.75 16.3 17.75 14.21C17.75 12.69 16.89 11.39 15.6 10.79Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ItalicIcon(props: IconProps) {
  return (
    <svg {...filledBaseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M10 4V7H12.21L8.79 15H6V18H14V15H11.79L15.21 7H18V4H10Z" fill="currentColor" />
    </svg>
  );
}

export function StrikethroughIcon(props: IconProps) {
  return (
    <svg {...filledBaseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <path
        d="M7.62432 9.37769C6.42432 7.07769 8.12432 4.37769 10.5243 3.87769C13.6243 2.87769 18.1243 4.27769 18.0243 8.07769H15.0243C15.0243 7.77769 14.9243 7.47769 14.9243 7.27769C14.7243 6.67769 14.3243 6.37769 13.7243 6.17769C12.9243 5.87769 11.6243 5.97769 10.9243 6.47769C9.42432 7.77769 10.8243 9.07769 12.4243 9.57769H7.82432C7.72432 9.47769 7.72432 9.37769 7.62432 9.37769ZM21.4243 12.5777V10.5777H3.42432V12.5777H13.0243C13.2243 12.6777 13.4243 12.6777 13.6243 12.7777C14.2243 13.0777 14.7243 13.2777 14.9243 13.8777C15.0243 14.2777 15.1243 14.7777 14.9243 15.1777C14.7243 15.6777 14.3243 15.8777 13.8243 16.0777C12.0243 16.5777 9.82432 15.8777 9.92432 13.6777H6.92432C6.82432 16.2777 9.02432 18.0777 11.4243 18.3777C15.2243 19.1777 19.7243 16.7777 17.7243 12.4777L21.4243 12.5777Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function NumberListIcon(props: IconProps) {
  return (
    <svg {...filledBaseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <path
        d="M7 13V11H21V13H7ZM7 19V17H21V19H7ZM7 7V5H21V7H7ZM3 8V5H2V4H4V8H3ZM2 17V16H5V20H2V19H4V18.5H3V17.5H4V17H2ZM4.25 10C4.44891 10 4.63968 10.079 4.78033 10.2197C4.92098 10.3603 5 10.5511 5 10.75C5 10.95 4.92 11.14 4.79 11.27L3.12 13H5V14H2V13.08L4 11H2V10H4.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...filledBaseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <path
        d="M10.9619 13.1547C11.3719 13.5447 11.3719 14.1847 10.9619 14.5747C10.5719 14.9647 9.93189 14.9647 9.54189 14.5747C7.5919 12.6247 7.5919 9.4547 9.54189 7.5047L13.0819 3.9647C15.0319 2.0147 18.2019 2.0147 20.1519 3.9647C22.1019 5.9147 22.1019 9.0847 20.1519 11.0347L18.6619 12.5247C18.6719 11.7047 18.5419 10.8847 18.2619 10.1047L18.7319 9.6247C19.9119 8.4547 19.9119 6.5547 18.7319 5.3847C17.5619 4.2047 15.6619 4.2047 14.4919 5.3847L10.9619 8.9147C9.7819 10.0847 9.7819 11.9847 10.9619 13.1547ZM13.7819 8.9147C14.1719 8.5247 14.8119 8.5247 15.2019 8.9147C17.1519 10.8647 17.1519 14.0347 15.2019 15.9847L11.6619 19.5247C9.71189 21.4747 6.54189 21.4747 4.59189 19.5247C2.64189 17.5747 2.64189 14.4047 4.59189 12.4547L6.08189 10.9647C6.07189 11.7847 6.20189 12.6047 6.48189 13.3947L6.01189 13.8647C4.83189 15.0347 4.83189 16.9347 6.01189 18.1047C7.18189 19.2847 9.08189 19.2847 10.2519 18.1047L13.7819 14.5747C14.9619 13.4047 14.9619 11.5047 13.7819 10.3347C13.3719 9.9447 13.3719 9.3047 13.7819 8.9147Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <svg {...filledBaseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <path
        d="M12.9999 6V14H14.8799L12.8799 18H18.6199L20.9999 13.24V6M14.9999 8H18.9999V12.76L17.3799 16H16.1199L18.1199 12H14.9999M2.99988 6V14H4.87988L2.87988 18H8.61988L10.9999 13.24V6M4.99988 8H8.99988V12.76L7.37988 16H6.11988L8.11988 12H4.99988V8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function HeartIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg {...filledBaseProps(props)}>
        {props.title ? <title>{props.title}</title> : null}
        <path
          d="M12 21s-7.5-4.5-9.5-9.5C1.4 8.6 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.1 3.6 4 6.5C19.5 16.5 12 21 12 21z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M12 21s-7.5-4.5-9.5-9.5C1.4 8.6 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.1 3.6 4 6.5C19.5 16.5 12 21 12 21z" />
    </svg>
  );
}

export function PanZoomIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <polyline points="3 9 3 3 9 3" />
      <polyline points="15 3 21 3 21 9" />
      <polyline points="21 15 21 21 15 21" />
      <polyline points="9 21 3 21 3 15" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {props.title ? <title>{props.title}</title> : null}
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
