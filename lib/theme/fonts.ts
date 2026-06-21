import { Text, TextInput, type TextStyle } from 'react-native';

export const FONT_REGULAR = 'Poppins_400Regular';
export const FONT_MEDIUM = 'Poppins_500Medium';
export const FONT_SEMIBOLD = 'Poppins_600SemiBold';
export const FONT_BOLD = 'Poppins_700Bold';
export const FONT_EXTRABOLD = 'Poppins_800ExtraBold';

export function fontForWeight(weight?: TextStyle['fontWeight']): string {
  const w = String(weight ?? '');
  if (w === '800' || w === '900' || w === 'black') return FONT_EXTRABOLD;
  if (w === '700' || w === 'bold') return FONT_BOLD;
  if (w === '600') return FONT_SEMIBOLD;
  if (w === '500') return FONT_MEDIUM;
  return FONT_REGULAR;
}

function flatten(style: unknown): TextStyle {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<TextStyle>((acc, item) => ({ ...acc, ...flatten(item) }), {});
  }
  if (typeof style === 'object') return style as TextStyle;
  return {};
}

function withFontFamily(style: unknown): TextStyle {
  const flat = flatten(style);
  const fontFamily = flat.fontFamily ?? fontForWeight(flat.fontWeight);
  return { ...flat, fontFamily };
}

let patched = false;

export function patchTextDefaults() {
  if (patched) return;
  patched = true;

  const OriginalText = Text as unknown as { render: (props: unknown, ref: unknown) => unknown };
  const originalTextRender = OriginalText.render?.bind(OriginalText);
  if (originalTextRender) {
    OriginalText.render = function patchedTextRender(
      props: Record<string, unknown>,
      ref: unknown,
    ) {
      return originalTextRender({ ...props, style: withFontFamily(props.style) }, ref);
    };
  }

  const OriginalInput = TextInput as unknown as {
    render: (props: unknown, ref: unknown) => unknown;
  };
  const originalInputRender = OriginalInput.render?.bind(OriginalInput);
  if (originalInputRender) {
    OriginalInput.render = function patchedInputRender(
      props: Record<string, unknown>,
      ref: unknown,
    ) {
      return originalInputRender({ ...props, style: withFontFamily(props.style) }, ref);
    };
  }
}
