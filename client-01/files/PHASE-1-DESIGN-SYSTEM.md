# Hotel Management System — Phase 1 Design System

**Product:** Hotel Management System (HMS)  
**Scope:** Hotel-side operations only  
**Phase:** 1 — Foundation / Authentication  
**Version:** 1.0  
**Status:** Working design specification

---

## 1. Product Direction

The HMS is an internal operating system for hotel staff. It is not an online customer booking marketplace.

Primary users:

- Hotel Owner
- Manager
- Receptionist
- Accountant
- Housekeeping
- Restaurant / Bar staff
- Other authorized hotel staff

Phase 1 establishes the visual language and authentication foundation that later phases will extend.

### Design goal

The interface should feel:

- Professional
- Calm
- Operational
- Trustworthy
- Minimal
- Fast to scan
- Appropriate for a business used for many hours per day

Avoid making the product feel like a travel-booking website. The hotel imagery can communicate the domain, but the UI should feel like serious business software.

---

# 2. Phase 1 Screen Map

## Core screens

| ID | Screen | Route suggestion | Priority |
|---|---|---|---|
| AUTH-01 | Login | `/login` | Critical |
| AUTH-02 | Forgot Password | `/forgot-password` | Critical |
| AUTH-03 | Reset Password | `/reset-password` | Critical |
| AUTH-04 | Reset Success | `/reset-password/success` or state | High |
| AUTH-05 | Account Setup | `/setup-account` | Critical |
| AUTH-06 | Account Setup Success | state | High |
| AUTH-07 | Access Denied | `/access-denied` | High |

## System states

| ID | State | Presentation |
|---|---|---|
| SYS-01 | Authentication loading | Full-page loading state |
| SYS-02 | Session expired | Modal or dedicated state |
| SYS-03 | Logout confirmation | Modal |
| SYS-04 | Invalid reset token | Reset-page error state |
| SYS-05 | Expired reset token | Reset-page error state |
| SYS-06 | Invalid credentials | Login form error |
| SYS-07 | Network/API failure | Inline/form alert |

These should not automatically become separate pages. Prefer reusable states and components.

---

# 3. Visual Identity

## Primary visual character

The current interface has a strong blue/white foundation. Keep that direction, but reduce unnecessary visual noise.

### Core principles

1. White space over decoration.
2. One primary action per screen.
3. Strong typography hierarchy.
4. Consistent 12px-radius controls.
5. Thin borders instead of heavy shadows.
6. Blue is reserved for actions, focus, links, and selected states.
7. Error states use red only when something is actually wrong.
8. Hotel photography should support the brand, not dominate the form.
9. Avoid gradients.
10. Avoid excessive rounded cards and floating effects.

---

# 4. Color Tokens

## Brand

| Token | Value | Usage |
|---|---|---|
| `brand-600` | `#1900FF` | Primary action, links, focus |
| `brand-700` | `#1500CC` | Hover/pressed primary action |
| `brand-50` | `#F1F0FF` | Selected/subtle brand background |
| `brand-100` | `#E7E5FF` | Soft emphasis |

The existing `#1900FF` should remain the primary brand color.

## Text

| Token | Value | Usage |
|---|---|---|
| `text-primary` | `#0C0332` | Headings and important labels |
| `text-body` | `#1F1F1F` | Normal content |
| `text-secondary` | `#6B6B6B` | Supporting text |
| `text-muted` | `#969696` | Placeholder/helper text |
| `text-disabled` | `#B5B5B5` | Disabled content |

## Surfaces

| Token | Value | Usage |
|---|---|---|
| `surface-page` | `#F6F6F6` | Application/auth background |
| `surface-card` | `#FFFFFF` | Cards and forms |
| `surface-subtle` | `#FAFAFA` | Secondary areas |
| `surface-hover` | `#F5F5F5` | Hover states |

## Borders

| Token | Value |
|---|---|
| `border-default` | `#E5E5E5` |
| `border-subtle` | `#EEEEEE` |
| `border-hover` | `#D4D4D4` |
| `border-focus` | `#1900FF` |

## Semantic

| Token | Value | Usage |
|---|---|---|
| `success` | `#16803C` | Successful operations |
| `success-bg` | `#ECFDF3` | Success messages |
| `warning` | `#A15C00` | Warnings |
| `warning-bg` | `#FFF8E7` | Warning messages |
| `error` | `#D92D20` | Validation/errors |
| `error-bg` | `#FEF3F2` | Error messages |
| `info` | `#175CD3` | Informational states |
| `info-bg` | `#EFF8FF` | Info messages |

---

# 5. Typography

Use one clean sans-serif family consistently.

Recommended:

- Inter
- Geist Sans
- DM Sans

If the existing project already has a font configured, keep it unless it creates a clear visual problem.

## Scale

| Element | Size | Weight | Line height |
|---|---:|---:|---:|
| Display | 40px | 700 | 1.05 |
| Page heading | 32px | 700 | 1.15 |
| Section heading | 24px | 700 | 1.2 |
| Card heading | 20px | 700 | 1.25 |
| Body large | 16px | 400/500 | 1.5 |
| Body | 14px | 400/500 | 1.5 |
| Label | 14px | 600/700 | 1.4 |
| Caption | 12px | 500 | 1.4 |
| Micro | 10px | 500 | 1.4 |

### Authentication headings

Primary heading:

> Welcome back

Supporting text:

> Sign in to continue to your hotel workspace.

Avoid awkward copy such as:

> Welcome back to Hotel, Please Sign-in to continue

The product should sound like software, not a generic booking site.

---

# 6. Spacing

Use a 4px base spacing system.

Preferred values:

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`

### Form spacing

- Label → input: `6px`
- Input → input: `16px`
- Form section → form section: `24px`
- Heading → supporting text: `8px`
- Supporting text → form: `32px`
- Form → primary action: `24px`

---

# 7. Radius

Keep the current rounded visual language, but standardize it.

| Token | Radius | Usage |
|---|---:|---|
| `radius-sm` | 8px | Small controls |
| `radius-md` | 10px | Inputs |
| `radius-lg` | 12px | Buttons/cards |
| `radius-xl` | 16px | Large auth cards |
| `radius-full` | 9999px | Pills/avatars |

Primary inputs and buttons should use **12px**.

---

# 8. Shadows

Use shadows sparingly.

### Card

```text
0 8px 30px rgba(0, 0, 0, 0.06)
```

### Dropdown

```text
0 8px 24px rgba(0, 0, 0, 0.08)
```

Avoid very heavy shadows such as `shadow-2xl` for normal authentication cards.

---

# 9. Buttons

## Primary

Use for the main action.

Example:

`Sign in`

Characteristics:

- Brand blue background
- White text
- 14px semibold/bold
- 44–48px minimum height
- 12px radius
- Clear disabled state
- Loading indicator replaces text or appears alongside it

## Secondary

Use for secondary actions.

Example:

`Use demo account`

Characteristics:

- White background
- Neutral/brand border
- Dark text
- Same height as primary

## Ghost

Use for low-priority navigation.

Example:

`← Back to login`

No border.

## Destructive

Not required heavily in Phase 1, but reserve the semantic error color for destructive actions.

---

# 10. Inputs

All inputs should share one component API and visual language.

### Default

- Height: 48px
- Radius: 12px
- White background
- `#E5E5E5` border
- 14px text

### Focus

- Brand border
- 1px brand focus ring
- No browser default outline

### Error

- Red border
- Red helper text
- Focus remains red while invalid

### Disabled

- Muted background
- Reduced text contrast
- `cursor-not-allowed`

### Placeholder

Use `#969696`.

---

# 11. Dropdowns

Custom dropdowns should behave like proper accessible listboxes.

Required behavior:

- Keyboard navigation
- Enter/Space to open
- Arrow navigation
- Escape to close
- Selected state
- Focus state
- Click outside closes
- Clear selected option styling

The dropdown trigger should visually match normal inputs.

---

# 12. Password Input

Password fields should include:

- Show/hide control
- Accessible button label
- Error state
- Focus state
- Optional password requirements on account setup/reset

Do not use an eye icon as decorative-only UI. It must be an interactive button.

---

# 13. OTP Input

The current six-box OTP pattern is appropriate.

Rules:

- Exactly 6 digits
- Numeric keyboard on mobile
- Auto-focus next box
- Backspace moves backward
- Paste six digits
- Clear visual focus
- Invalid OTP state
- Resend OTP action
- Countdown if rate limiting is introduced

Recommended dimensions:

- 48–52px square
- 10–12px radius
- 12px gap

---

# 14. Authentication Layout

The existing split-screen `Wrapper` is a good foundation.

## Desktop

```text
┌─────────────────────────┬─────────────────────────┐
│                         │                         │
│       BRAND / HERO      │       AUTH FORM        │
│                         │                         │
│        Logo             │      Heading            │
│                         │      Description        │
│     Hotel imagery       │                         │
│                         │      Form               │
│     Supporting copy     │      Primary action     │
│                         │                         │
│                         │      Footer             │
└─────────────────────────┴─────────────────────────┘
```

Recommended split:

- Left: 50%
- Right: 50%

On large screens, the form content itself should have a maximum width around `420–480px`.

## Mobile

Do not retain the two-column layout.

Use:

```text
Logo
Heading
Form
Action
Footer
```

The image collage can be hidden or reduced substantially on small screens.

---

# 15. Authentication Hero

The existing hotel image collage should remain, but its message must reflect the actual product.

Current copy:

> Find your perfect stay and book with confidence

This sounds like a customer booking product and conflicts with the hotel-side HMS positioning.

Replace it with something closer to:

> Everything your hotel needs to run the day.

Alternative:

> Manage guests, rooms, payments and operations in one place.

Preferred:

> Run your hotel with clarity.

The hero should communicate **hotel operations**, not customer bookings.

---

# 16. Logo

The current logo is:

- Bed icon
- `otel`
- Blue brand color

This creates the word **Hotel** visually.

Keep the concept if it is part of the client's identity, but the implementation should be made responsive.

Avoid a fixed `99px` text size.

Recommended:

- Desktop: 64–72px
- Tablet: 52–60px
- Mobile: 44–52px

The logo component should expose a size variant.

Example:

```tsx
<Logo size="sm" />
<Logo size="md" />
<Logo size="lg" />
```

---

# 17. Footer

The current footer contains:

- Policies
- Support
- Help Center
- Copyright
- Version

Keep this structure.

Recommended hierarchy:

```text
Policies   Support   Help Center

© 2026 AltBit Softwares
Hotel Management System · v1.0
```

The footer should be subtle and never compete with the form.

---

# 18. Login Screen Specification

## Heading

**Welcome back**

Supporting text:

**Sign in to continue to your hotel workspace.**

## Fields

1. Login method
2. Role
3. Email / phone
4. Password

### Important UX change

The current login flow has both:

- Login Mode
- Role

This can be simplified later.

Preferred approach:

- Let the user enter email/phone.
- Determine the account and available role server-side when possible.
- If multiple roles exist, ask the user to select one.

If role selection is required by the backend, keep it.

## Actions

Primary:

`Sign in`

Secondary:

`Forgot password?`

Demo access can remain during development but should be removed or protected in production.

---

# 19. Forgot Password Specification

Heading:

**Forgot your password?**

Supporting text:

**Enter your email or phone number and we'll help you reset your password.**

Fields:

- Reset method
- Email / phone

Primary:

`Send reset instructions`

Secondary:

`← Back to login`

Success state:

**Check your email**

or

**Check your phone**

Do not reveal whether an account exists in production. This prevents account enumeration.

---

# 20. OTP Verification Specification

Heading:

**Enter verification code**

Supporting text:

**Enter the 6-digit code we sent to your registered contact.**

Elements:

- 6 OTP inputs
- Verify button
- Resend code
- Countdown
- Back to login

Error:

**That code isn't correct. Try again.**

Expired:

**This code has expired. Request a new one.**

---

# 21. Reset Password Specification

Heading:

**Create a new password**

Supporting text:

**Choose a strong password for your hotel account.**

Fields:

- New password
- Confirm password

Password checklist:

- At least 8 characters
- Uppercase letter
- Number
- Special character

Primary:

`Update password`

Success:

**Password updated**

Supporting text:

**Your password has been changed successfully.**

Action:

`Continue to login`

---

# 22. Account Setup Specification

This should be invitation-based rather than public registration.

Heading:

**Set up your account**

Supporting text:

**Complete your account setup to access the hotel workspace.**

Display:

- Staff name
- Email
- Assigned role

Fields:

- Password
- Confirm password

Primary:

`Complete setup`

After success:

**Your account is ready**

`Continue to login`

---

# 23. Registration Strategy

The existing `Register` component should not behave like a public sign-up page.

For the actual HMS:

```text
Admin/Manager
      ↓
Creates staff account
      ↓
System sends invitation
      ↓
Staff opens invitation
      ↓
Account Setup
      ↓
Password creation
      ↓
Login
```

Therefore the public `/register` route should either be removed or restricted.

---

# 24. Access Denied

Heading:

**Access restricted**

Supporting text:

**You don't have permission to access this area.**

Actions:

- `Go back`
- `Return to dashboard`

Keep this page minimal.

---

# 25. Session Expired

Heading:

**Your session has expired**

Supporting text:

**For your security, please sign in again to continue.**

Primary:

`Sign in again`

Do not show sensitive application data behind this state.

---

# 26. Loading States

Every authentication action that calls the backend must have a loading state.

Examples:

- Signing in...
- Sending reset instructions...
- Verifying code...
- Updating password...
- Setting up account...

Buttons should become disabled during submission.

Never allow duplicate submissions.

---

# 27. Toasts

Use toasts for transient feedback, not critical validation.

Good:

- Network error
- Successful password update
- Signed out successfully

Bad:

- Required field
- Invalid email
- Password mismatch

Those should appear next to the relevant field.

---

# 28. Accessibility

Phase 1 requirements:

- Every input has a label.
- Every interactive control is keyboard accessible.
- Focus states are visible.
- Do not rely on color alone.
- Error messages are associated with their fields.
- Buttons have clear accessible names.
- OTP inputs have appropriate input modes.
- Modal focus should be managed.
- Escape closes dismissible modals.
- Color contrast should meet WCAG AA where applicable.

---

# 29. Component Architecture

Recommended structure:

```text
components/
└── auth/
    ├── auth-layout.tsx
    ├── auth-footer.tsx
    ├── login.tsx
    ├── forgot-password.tsx
    ├── otp-verification.tsx
    ├── reset-password.tsx
    ├── account-setup.tsx
    ├── access-denied.tsx
    ├── session-expired.tsx
    └── reset-confirmation.tsx

components/
├── button.tsx
├── input.tsx
├── logo.tsx
├── modal.tsx
└── ...

hooks/
└── useClickOutside.ts

store/
└── auth-store.ts
```

---

# 30. State Management

Avoid creating separate global Zustand stores for every small piece of authentication UI.

Prefer:

- React Hook Form for form state
- Zod for validation
- Local React state for ephemeral UI
- Zustand only for genuinely shared application state

Example:

```text
React Hook Form
      ↓
Form values + validation
      ↓
API request
      ↓
Auth/session store
      ↓
Protected application
```

---

# 31. Important Technical Corrections From Current Code

### 1. Custom dropdown + React Hook Form

The current code manually casts the dropdown event:

```tsx
setValue("loginMode", (val as any)?.target?.value || val)
```

Avoid `any`.

The `Input` component should expose a predictable event/value contract.

### 2. Reset mode type

Current:

```ts
mode: string | "email" | "phone";
```

This effectively becomes `string`.

Use:

```ts
type ResetMode = "email" | "phone";
```

Then:

```ts
mode: ResetMode;
setMode: (mode: ResetMode) => void;
```

### 3. Form schema

The login schema currently always requires `email`, even though the interface supports phone login.

The schema should use conditional validation based on the selected login mode.

### 4. Password reset security

The UI should never reveal whether a submitted email/phone exists.

### 5. Demo access

Keep it for development only. Hide it behind a development flag or remove it in production.

### 6. Modal state

The reset confirmation modal should ideally have explicit actions:

```ts
open()
close()
```

rather than only:

```ts
toggleOpen()
```

Explicit actions prevent accidental state inversion.

---

# 32. Phase 1 Definition of Done

Phase 1 is complete when:

- [ ] Login works
- [ ] Login validation works
- [ ] Login loading state works
- [ ] Invalid credentials state works
- [ ] Forgot password works
- [ ] Email/phone reset method works
- [ ] OTP verification works
- [ ] OTP resend works
- [ ] Reset password works
- [ ] Password requirements work
- [ ] Password confirmation works
- [ ] Account invitation/setup works
- [ ] Account setup validation works
- [ ] Roles are represented correctly
- [ ] Protected routes exist
- [ ] Unauthorized users receive Access Denied
- [ ] Session expiration is handled
- [ ] Logout works
- [ ] Authentication layout is responsive
- [ ] All states follow the same design system
- [ ] Demo access is disabled outside development
- [ ] No sensitive authentication information leaks through error messages

---

# 33. Phase 1 → Phase 2 Boundary

Do not start building hotel operations until the following foundation exists:

```text
                 AUTHENTICATION
                       │
                       ▼
                    SESSION
                       │
                       ▼
                AUTHORIZATION
                       │
                       ▼
              ROLE + PERMISSIONS
                       │
                       ▼
              PROTECTED APP SHELL
                       │
                       ▼
              ┌────────────────┐
              │    PHASE 2     │
              │                │
              │ Dashboard      │
              │ Front Desk     │
              │ Rooms          │
              │ Guests         │
              │ Reservations   │
              │ Check-in/out   │
              └────────────────┘
```

This is the foundation we will extend throughout the entire HMS.
