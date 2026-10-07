import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors } from './theme';

// Equipment silhouettes share one grid and stroke weight; category labels remain the accessible names.
const shapes: Record<string, React.ReactNode> = {
  'Малярные столики': <><Path d="M7 21h50v7H7zM14 28l5 27M50 28l-5 27M16 43h32M19 30l26 21M45 30L19 51" /></>,
  'Леса': <>
    <Path d="M10 10v44M32 10v44M54 10v44M7 54h50M8 17h48M8 35h48M10 18l22 16M32 18L10 34M32 36l22 17M54 36L32 53M32 18l22 16M54 18L32 34M10 36l22 17M32 36L10 53" />
  </>,
  'Вышки-туры': <>
    <Path d="M17 8v44M47 8v44M17 10h30M14 22h36M14 39h36M17 23l30 15M47 23L17 38M17 40l30 12M47 40L17 52M13 52h38M25 10v12M39 10v12" />
    <Circle cx="18" cy="56" r="3" /><Circle cx="46" cy="56" r="3" />
  </>,
  'Подмости строительные': <>
    <Path d="M9 28h46v7H9zM16 35l-5 19M48 35l5 19M17 35l28 15M47 35L19 50M12 45h9M10 51h9M11 20v8M53 20v8M11 20h42" />
  </>,
  'Сетка, тенты, брезенты': <>
    <Path d="M11 12h42v31L42 54H11zM42 54V43h11M18 21h28M18 29h28M18 37h20M18 45h16M22 18v28M30 18v28M38 18v20M46 18v20" />
    <Circle cx="15" cy="16" r="1" /><Circle cx="49" cy="16" r="1" /><Circle cx="15" cy="50" r="1" />
  </>,
  'Строительные подъемники': <>
    <Path d="M14 8v47M25 8v47M14 9h11M14 20l11-10M14 21l11 10M14 42l11-10M14 43l11 11M8 55h47M25 36h29v13H25M34 36v13M45 36v13M42 10v18M36 16l6-6 6 6" />
  </>,
  'Грузоподъемное оборудование': <>
    <Path d="M9 12h46v6H9zM14 18L8 54M50 18l6 36M5 54h10M49 54h10M25 18v8h14v-8M32 26v9c0 5 8 3 8 10a8 8 0 0 1-16 0M22 8h20" />
  </>,
  'Мусоропровод строительный': <>
    <Path d="M18 8h28l-3 12H21zM20 24h24l-3 12H23zM22 40h20l-3 14H25zM16 11l-3 7 5 9-3 7 7 10M48 11l3 7-5 9 3 7-7 10M27 20v4M37 20v4M28 36v4M36 36v4" />
  </>,
  'Фанера ламинированная': <>
    <Path d="M7 23l27-13 23 12-27 14zM7 31l23 13 27-14M7 39l23 14 27-15M7 23v7M57 22v8M7 31v8M57 30v8M30 36v8M30 44v9M18 23l16-7M29 29l16-8" />
  </>,
  'Опалубка': <>
    <Rect x="11" y="9" width="42" height="46" rx="2" />
    <Path d="M17 9v46M32 9v46M47 9v46M11 24h42M11 40h42M22 14h5v5h-5zM37 29h5v6h-5zM22 45h5v5h-5z" />
  </>,
  'Вибротехника для строительства': <>
    <Rect x="9" y="25" width="25" height="20" rx="4" />
    <Path d="M14 25v-7h15v7M15 31h13M15 37h8M34 35h6c12 0-1-20 10-20h4v26M50 43h8v13h-8zM44 47l-3 4 3 4M61 47l2 4-2 4" />
  </>,
  'Оборудование для работы с арматурой': <>
    <Path d="M9 31h46v23H9zM9 40h46M17 54v3M47 54v3M12 25h25a9 9 0 0 0 9-9V8M12 19h22a5 5 0 0 0 5-5V8M17 17v10M24 17v10M31 17v10M38 13l8 4" />
    <Circle cx="43" cy="46" r="2" /><Circle cx="18" cy="46" r="2" />
  </>,
  'Оборудование для бетонных работ': <>
    <Path d="M16 23l8-12 20 7 5 14-9 11-19-6zM16 23l23 9 10 0M24 11l-3 11M44 18l-5 14M25 40l-6 14M37 42l9 12M14 54h38M31 44v10M49 24h6v18" />
    <Circle cx="18" cy="55" r="4" /><Circle cx="47" cy="55" r="4" />
  </>,
  'Техника для склада': <>
    <Path d="M12 45h13l11 8h20M25 45l26-12h8M20 45V17M20 17l-6-6H8M18 26h8v17M29 41l20 8M35 34V18h20v13M45 18v9" />
    <Circle cx="20" cy="51" r="5" /><Circle cx="52" cy="54" r="2" />
  </>,
  'Тачки строительные и садовые': <>
    <Path d="M10 21h37l-7 20H20zM10 21l-4-6H3M19 41l-7 12M19 41h26l7 8M26 42l10 10M40 41l7-20h9" />
    <Circle cx="44" cy="53" r="7" /><Circle cx="44" cy="53" r="2" />
  </>,
  'Лестницы и стремянки': <>
    <Path d="M13 56L28 8h8L22 56M36 8l16 48M27 15h7M24 25h7M21 35h7M18 45h7M25 37h20M36 25l10 30M10 56h15M47 56h8" />
  </>,
  'Штукатурные комплекты': <>
    <Path d="M9 33h28l-3 23H12zM12 32v-7a11 11 0 0 1 22 0v7M13 39h20M40 29L49 8l9 23zM49 31v16" />
    <Rect x="46" y="44" width="6" height="13" rx="2" />
  </>,
  'Компрессоры воздушные': <>
    <Rect x="8" y="31" width="45" height="18" rx="9" />
    <Path d="M17 31V19h18v12M20 19v-5h12v5M23 23v5M29 23v5M40 31V20h9M53 39h5V23M49 16v9" />
    <Circle cx="18" cy="53" r="4" /><Circle cx="44" cy="53" r="4" />
  </>,
  'Сварочные аппараты': <>
    <Rect x="8" y="20" width="30" height="28" rx="3" />
    <Path d="M16 20v-7h14v7M14 31h9M14 36h9M14 41h9M38 40c20-7 1 21 16 14M51 44l7-13M46 16l-4 4M54 17v6M61 24l-6 2" />
    <Circle cx="30" cy="29" r="3" />
  </>,
  'Тепловые пушки': <>
    <Ellipse cx="41" cy="29" rx="15" ry="18" /><Ellipse cx="41" cy="29" rx="10" ry="13" />
    <Path d="M41 11H20C1 11 1 47 20 47h21M19 47l-4 9M42 47l5 9M12 56h38M41 16v26M32 24h18M32 34h18M15 10V6h19v5" />
  </>,
  'Металл и металлообработка': <>
    <Path d="M9 15h29v7H28v22h10v7H9v-7h10V22H9zM38 15l18-7v7l-9 4v22l9-4v7l-18 7M28 22l19-8M28 44l19-8M38 44l9-3M9 15l18-7h29" />
  </>,
};

export function CategoryPictogram({ name, size = 48 }: { name: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={colors.brand} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" accessible={false}>
    {shapes[name] ?? shapes[/подмост|помост/i.test(name) ? 'Подмости строительные' : /лес[ао]|леса/i.test(name) ? 'Леса' : /столик/i.test(name) ? 'Малярные столики' : /лестниц|стремян/i.test(name) ? 'Лестницы и стремянки' : /вышк/i.test(name) ? 'Вышки-туры' : /опалуб/i.test(name) ? 'Опалубка' : /сетк|тент|брезент/i.test(name) ? 'Сетка, тенты, брезенты' : ''] ?? <><Rect x="10" y="10" width="17" height="17" rx="2" /><Rect x="37" y="10" width="17" height="17" rx="2" /><Rect x="10" y="37" width="17" height="17" rx="2" /><Rect x="37" y="37" width="17" height="17" rx="2" /></>}
  </Svg>;
}
