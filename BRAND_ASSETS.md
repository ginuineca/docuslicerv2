# DocuSlicer Brand Assets

## 🎨 Logo Usage Guide

### Primary Logo
The primary DocuSlicer logo consists of an icon and wordmark. Use this version whenever possible for maximum brand recognition.

**Component**: `<Logo />`
**Files**: 
- `apps/web/src/components/Logo.tsx`
- `apps/web/public/favicon.svg`

### Logo Variations

#### 1. **Full Logo with Text** (Default)
```tsx
<Logo />
<Logo size="lg" />
<Logo linkTo="/dashboard" />
```

#### 2. **Icon Only**
```tsx
<LogoIcon />
<LogoIcon size="xl" />
<LogoIcon className="text-white" />
```

#### 3. **Different Sizes**
- `sm`: Small (h-6 w-6) - For compact spaces
- `md`: Medium (h-8 w-8) - Default size
- `lg`: Large (h-12 w-12) - For headers and hero sections

### Color Variations

#### Primary Blue
- **Color**: `#2563eb` (blue-600)
- **Usage**: Default logo color, primary brand color
- **Background**: White or light backgrounds

#### White Version
- **File**: `apps/web/public/logo-white.svg`
- **Usage**: Dark backgrounds, overlays
- **Background**: Dark colors, images

## 🎯 Brand Colors

### Primary Palette
```css
--blue-600: #2563eb;  /* Primary brand color */
--blue-700: #1d4ed8;  /* Hover states */
--blue-50:  #eff6ff;  /* Light backgrounds */
```

### Neutral Palette
```css
--gray-900: #111827;  /* Primary text */
--gray-600: #4b5563;  /* Secondary text */
--gray-100: #f3f4f6;  /* Light backgrounds */
--white:    #ffffff;  /* Backgrounds */
```

## 📐 Logo Construction

The DocuSlicer logo is built with these key elements:

1. **Document Shape**: Rounded rectangle representing PDF documents
2. **Content Lines**: Horizontal lines suggesting document content
3. **Folded Corner**: Paper fold detail for document authenticity
4. **Slice Lines**: Diagonal cuts representing the "slicing" functionality
5. **Typography**: Bold, modern sans-serif wordmark

## ✅ Logo Do's

- ✅ Use on white or light backgrounds
- ✅ Maintain minimum clear space around logo
- ✅ Use provided color variations
- ✅ Scale proportionally
- ✅ Use high-resolution versions for print

## ❌ Logo Don'ts

- ❌ Don't stretch or distort the logo
- ❌ Don't use on busy backgrounds without proper contrast
- ❌ Don't change colors outside brand palette
- ❌ Don't add effects, shadows, or outlines
- ❌ Don't use low-resolution versions

## 📱 Implementation Examples

### Navigation Header
```tsx
<header className="bg-white shadow-sm">
  <div className="flex items-center">
    <Logo linkTo="/" />
  </div>
</header>
```

### Authentication Pages
```tsx
<div className="text-center">
  <div className="flex justify-center mb-8">
    <Logo />
  </div>
</div>
```

### Dashboard
```tsx
<Logo linkTo="/dashboard" size="md" />
```

### Favicon
The favicon uses the icon-only version in SVG format for crisp display at all sizes.

## 🔧 Technical Specifications

### SVG Viewbox
- **Dimensions**: 100x100 units
- **Format**: SVG (scalable)
- **Optimization**: Minimal paths for fast loading

### Component Props
```typescript
interface LogoProps {
  className?: string     // Additional CSS classes
  showText?: boolean    // Show/hide text (default: true)
  linkTo?: string       // Navigation link (default: '/')
  size?: 'sm'|'md'|'lg' // Size variant (default: 'md')
}
```

## 📂 File Structure
```
apps/web/
├── public/
│   ├── favicon.svg          # Favicon
│   └── logo-white.svg       # White version
└── src/components/
    ├── Logo.tsx             # Main logo component
    ├── LogoIcon.tsx         # Icon-only component
    └── index.ts             # Component exports
```

## 🚀 Future Considerations

- **Animated Logo**: Consider subtle animation for loading states
- **Dark Mode**: Automatic color switching based on theme
- **Print Versions**: High-resolution PNG/PDF for print materials
- **Social Media**: Square versions for profile pictures
- **Merchandise**: Simplified versions for embroidery/printing
