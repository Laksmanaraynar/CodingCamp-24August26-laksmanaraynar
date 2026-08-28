# Implementation Plan: Light/Dark Mode

## Overview

Implementasi fitur light/dark mode pada To-Do List Life Dashboard menggunakan vanilla HTML, CSS, dan JavaScript. Perubahan mencakup tiga file: `index.html` (tambah `<header>` dengan tombol toggle), `css/style.css` (ganti semua hardcoded colors dengan CSS custom properties), dan `js/app.js` (tambah modul `ThemeManager`).

## Tasks

- [x] 1. Tambah elemen `<header>` dan tombol ThemeToggle ke `index.html`
  - Sisipkan elemen `<header class="app-header">` sebagai sibling langsung sebelum `<main class="dashboard">` di dalam `<body>`
  - Buat `<button id="theme-toggle" type="button" aria-label="Switch to dark mode">` di dalam header
  - Tambahkan `<span aria-hidden="true">☀️</span>` dan `<span class="sr-only">Switch to dark mode</span>` di dalam button
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2_

- [ ] 2. Definisikan CSS custom properties dan migrasi warna hardcoded di `css/style.css`
  - [-] 2.1 Tambahkan blok `:root[data-theme="light"]` dan `:root[data-theme="dark"]` dengan 10 variabel wajib: `--color-bg-page`, `--color-bg-panel`, `--color-text-primary`, `--color-text-secondary`, `--color-border`, `--color-accent`, `--color-accent-hover`, `--color-error-text`, `--color-error-bg`, `--color-error-border`
    - Gunakan nilai light: `#f3f4f6`, `#ffffff`, `#1a1a2e`, `#6b7280`, `#e5e7eb`, `#4f46e5`, `#4338ca`, `#dc2626`, `#fef2f2`, `#fecaca`
    - Gunakan nilai dark: `#111827`, `#1f2937`, `#f9fafb`, `#9ca3af`, `#374151`, `#818cf8`, `#a5b4fc`, `#fca5a5`, `#450a0a`, `#7f1d1d`
    - _Requirements: 2.1, 2.3, 2.4_

  - [~] 2.2 Ganti semua nilai warna hardcoded di `style.css` dengan referensi `var(--color-*)` yang sesuai
    - `body` background `#56647a` → `var(--color-bg-page)`, color `#1a1a2e` → `var(--color-text-primary)`
    - `.panel` background `#ffffff` → `var(--color-bg-panel)`
    - `button` background `#4f46e5` → `var(--color-accent)`, hover `#4338ca` → `var(--color-accent-hover)`
    - `#greeting-message` color `#4f46e5` → `var(--color-accent)`
    - `#greeting-date` color `#6b7280` → `var(--color-text-secondary)`
    - `#timer-status` color `#059669` → `var(--color-accent)`
    - `.todo-item`, `.link-item` background `#f9fafb` → `var(--color-bg-page)`, border `#e5e7eb` → `var(--color-border)`
    - `.error-message` color, background, border → `var(--color-error-text)`, `var(--color-error-bg)`, `var(--color-error-border)`
    - `input` border `#d1d5db` → `var(--color-border)`
    - _Requirements: 2.2_

  - [~] 2.3 Tambahkan `transition: background-color 200ms ease, color 200ms ease` pada `body`, dan styling `.app-header` serta `#theme-toggle`
    - `.app-header`: `display: flex; justify-content: flex-end; padding: 0.75rem 1.5rem; max-width: 1200px; margin: 0 auto`
    - `#theme-toggle`: background `var(--color-bg-panel)`, color `var(--color-text-primary)`, border `1px solid var(--color-border)`, `font-size: 1.25rem`, `border-radius: 8px`
    - `#theme-toggle:hover:not(:disabled)`: background `var(--color-border)`
    - _Requirements: 6.1, 7.3_

- [ ] 3. Implementasikan modul `ThemeManager` di `js/app.js`
  - [-] 3.1 Tambahkan objek `ThemeManager` di dalam IIFE yang sudah ada, dengan property `_VALID = new Set(['light', 'dark'])` dan `_KEY = 'tld_theme'`
    - Implementasikan `apply(theme)`: panggil `document.documentElement.setAttribute('data-theme', theme)`
    - Implementasikan `getCurrent()`: baca `getAttribute('data-theme')`, return nilai jika valid, fallback ke `'light'`
    - Implementasikan `persist(theme)`: panggil `Storage.save(this._KEY, theme)` di dalam try/catch yang silent (tidak throw ke pengguna)
    - _Requirements: 3.4, 4.3, 5.1, 5.2, 5.3_

  - [~] 3.2 Implementasikan `ThemeManager.updateToggleUI(theme)` dan `ThemeManager.init()`
    - `updateToggleUI(theme)`: ambil `#theme-toggle`, update `[aria-hidden]` span dengan ikon (☀️ atau 🌙), update `aria-label` dan `.sr-only` span dengan label aksi yang akan dilakukan
    - `init()`: baca `Storage.load(this._KEY)`, validasi nilainya; jika valid gunakan; jika tidak, deteksi `window.matchMedia?.('(prefers-color-scheme: dark)').matches`; fallback ke `'light'`; panggil `apply()` lalu `updateToggleUI()`; pasang event listener `click` pada `#theme-toggle` yang memanggil `this.toggle()`
    - `toggle()`: flip `getCurrent()`, panggil `apply()`, `persist()`, `updateToggleUI()`
    - _Requirements: 1.4, 1.5, 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.4, 7.1, 7.4_

  - [~] 3.3 Daftarkan `ThemeManager.init()` sebagai pemanggilan pertama dalam fungsi `init()` di bootstrap, sebelum `checkBrowserSupport()`
    - Tambahkan `ThemeManager` ke `globalThis.__TLD_TEST_EXPORTS__`
    - _Requirements: 3.1_

- [~] 4. Checkpoint — pastikan semua perubahan terintegrasi
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Tulis property-based tests dan unit tests untuk `ThemeManager`
  - [~] 5.1 Buat atau update file test untuk ThemeManager dengan unit tests (example-based)
    - Test bahwa setelah `init()` dengan stored value `'light'`, `getCurrent()` mengembalikan `'light'`
    - Test bahwa setelah `init()` dengan stored value `'dark'`, `getCurrent()` mengembalikan `'dark'`
    - Test bahwa `persist()` tidak melempar error ketika `localStorage.setItem` throw
    - Test bahwa setelah `toggle()`, `window.location.reload` tidak dipanggil
    - _Requirements: 3.1, 3.2, 5.3_

  - [ ]* 5.2 Tulis property test untuk Property 1: Toggle rendering mencerminkan tema aktif
    - **Property 1: Toggle rendering mencerminkan tema aktif**
    - Generator: `fc.constantFrom('light', 'dark')`
    - Verifikasi: setelah `apply(theme)` + `updateToggleUI(theme)`, `aria-label` dan ikon pada `#theme-toggle` sesuai tema
    - **Validates: Requirements 1.4, 1.5, 7.1, 7.4**

  - [ ]* 5.3 Tulis property test untuk Property 2: Toggle adalah strict involution
    - **Property 2: Toggle adalah strict involution**
    - Generator: `fc.constantFrom('light', 'dark')` sebagai tema awal
    - Verifikasi: `getCurrent()` sama dengan nilai awal setelah dua kali `toggle()`
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 5.4 Tulis property test untuk Property 3: `apply()` selalu menetapkan `data-theme`
    - **Property 3: apply() selalu menetapkan data-theme**
    - Generator: `fc.constantFrom('light', 'dark')`
    - Verifikasi: `documentElement.getAttribute('data-theme') === theme` setelah `apply(theme)`
    - **Validates: Requirements 3.4, 4.3**

  - [ ]* 5.5 Tulis property test untuk Property 4: `init()` membaca preferensi yang tersimpan
    - **Property 4: init() membaca preferensi yang tersimpan**
    - Generator: `fc.constantFrom('light', 'dark', null)` untuk stored value + `fc.boolean()` untuk system dark pref
    - Verifikasi: `getCurrent()` setelah `init()` sesuai stored value; jika `null`, sesuai system pref atau fallback `'light'`
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 5.6 Tulis property test untuk Property 5: Nilai tersimpan tidak valid diabaikan
    - **Property 5: Nilai tersimpan tidak valid diabaikan**
    - Generator: `fc.string()` difilter ke yang bukan `'light'` atau `'dark'`
    - Verifikasi: setelah `init()`, sistem jatuh ke logika system preference
    - **Validates: Requirements 3.5**

  - [ ]* 5.7 Tulis property test untuk Property 6: Persistensi tema setelah toggle
    - **Property 6: Persistensi tema setelah toggle**
    - Generator: `fc.constantFrom('light', 'dark')` sebagai tema awal
    - Verifikasi: setelah `toggle()`, `localStorage['tld_theme'] === getCurrent()`
    - **Validates: Requirements 5.1, 5.2**

- [~] 6. Final checkpoint — pastikan semua tests lulus
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- `ThemeManager.init()` **harus** dipanggil pertama dalam `init()` untuk mencegah flash of wrong theme (FOWT)
- Design menggunakan vanilla JS — tidak ada framework atau build tool baru yang perlu ditambahkan
- Semua 10 CSS custom property wajib harus terdefinisi di kedua nilai `data-theme`
- `ThemeManager` diekspor melalui `globalThis.__TLD_TEST_EXPORTS__` agar dapat ditest secara terisolasi
- Property tests menggunakan **fast-check** dengan minimum 100 iterasi per property (sudah terkonfigurasi di `vitest.config.js`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2"] },
    { "id": 3, "tasks": ["3.3"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7"] }
  ]
}
```
