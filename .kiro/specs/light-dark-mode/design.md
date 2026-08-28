# Design Document — Light/Dark Mode

## Overview

Fitur ini menambahkan kemampuan pergantian tema visual (light/dark) pada To-Do List Life Dashboard. Implementasi sepenuhnya client-side menggunakan vanilla HTML, CSS, dan JavaScript — tanpa framework atau build tool. Perubahan meliputi:

1. **HTML** — menambah `<header>` baru di atas `.dashboard` berisi tombol toggle.
2. **CSS** — mengganti semua warna hardcoded dengan CSS custom properties pada `:root[data-theme]`.
3. **JavaScript** — menambah modul `ThemeManager` di dalam IIFE yang sudah ada di `app.js`.

---

## Architecture

### Perubahan File

```
index.html        ← tambah <header> dengan #theme-toggle
css/
  style.css       ← tambah :root[data-theme] variables; ganti semua hardcoded colors
js/
  app.js          ← tambah ThemeManager module; panggil ThemeManager.init() di bootstrap
```

### Mekanisme Tema

Tema dikontrol melalui satu atribut pada elemen `<html>`:

```
document.documentElement.setAttribute('data-theme', 'light' | 'dark')
```

CSS merespons atribut ini melalui dua set custom properties:

```css
:root[data-theme="light"] { --color-bg-page: #f3f4f6; /* ... */ }
:root[data-theme="dark"]  { --color-bg-page: #111827; /* ... */ }
```

Semua selector di stylesheet mereferensikan `var(--color-*)` — tidak ada hardcoded color. Satu attribute flip pada `<html>` langsung mengubah semua warna tanpa JavaScript DOM walking.

### Alur Data

```
Halaman Dimuat
      │
      ▼
ThemeManager.init()
      │
      ├─ localStorage['tld_theme'] ada & valid? → apply(savedTheme)
      ├─ System prefers dark?                   → apply('dark')
      └─ fallback                               → apply('light')
                                                       │
                                                       ▼
                                          document.documentElement
                                          .setAttribute('data-theme', theme)
                                                       │
                                                       ▼
                                          updateToggleUI(theme)

User menekan #theme-toggle
      │
      ▼
ThemeManager.toggle()
      │
      ├─ flip getCurrent()
      ├─ apply(newTheme)         → setAttribute data-theme
      ├─ persist(newTheme)       → localStorage['tld_theme'] = newTheme
      └─ updateToggleUI(newTheme)
```

### Inisialisasi Tanpa Flash

`ThemeManager.init()` dipanggil **pertama** dalam fungsi `init()`, sebelum panel lain dirender. Dengan demikian `data-theme` sudah terpasang di `<html>` sebelum browser merender konten yang terlihat pengguna, mencegah flash of wrong theme (FOWT).

---

## Components and Interfaces

### HTML — Struktur Baru

Elemen `<header>` ditempatkan sebagai sibling langsung sebelum `<main class="dashboard">` di dalam `<body>`:

```html
<body>
  <!-- banner tetap di posisinya -->
  <div id="unsupported-browser-banner" class="unsupported-banner" hidden>…</div>

  <!-- BARU: header global dengan tombol toggle -->
  <header class="app-header">
    <button id="theme-toggle" type="button" aria-label="Switch to dark mode">
      <span aria-hidden="true">☀️</span>
      <span class="sr-only">Switch to dark mode</span>
    </button>
  </header>

  <!-- existing dashboard tetap tidak berubah -->
  <main class="dashboard">…</main>

  <script src="js/app.js"></script>
</body>
```

Catatan:
- `aria-label` pada button mendeskripsikan **aksi** yang akan terjadi, bukan keadaan saat ini.
- `.sr-only` span sudah ada di stylesheet — tidak perlu CSS baru.
- `aria-hidden="true"` pada span ikon mencegah screen reader membaca emoji.

---

### CSS — Custom Properties

#### Struktur Variabel

Semua variabel warna dideklarasikan di dua blok `:root[data-theme]`:

```css
:root[data-theme="light"] {
  --color-bg-page:         #f3f4f6;
  --color-bg-panel:        #ffffff;
  --color-text-primary:    #1a1a2e;
  --color-text-secondary:  #6b7280;
  --color-border:          #e5e7eb;
  --color-accent:          #4f46e5;
  --color-accent-hover:    #4338ca;
  --color-error-text:      #dc2626;
  --color-error-bg:        #fef2f2;
  --color-error-border:    #fecaca;
}

:root[data-theme="dark"] {
  --color-bg-page:         #111827;
  --color-bg-panel:        #1f2937;
  --color-text-primary:    #f9fafb;
  --color-text-secondary:  #9ca3af;
  --color-border:          #374151;
  --color-accent:          #818cf8;
  --color-accent-hover:    #a5b4fc;
  --color-error-text:      #fca5a5;
  --color-error-bg:        #450a0a;
  --color-error-border:    #7f1d1d;
}
```

#### Migrasi Warna Hardcoded

Setiap nilai warna hardcoded di `style.css` yang ada diganti referensi ke custom property:

| Hardcoded sebelumnya | Custom property |
|---|---|
| `background-color: #56647a` (body) | `var(--color-bg-page)` |
| `color: #1a1a2e` (body) | `var(--color-text-primary)` |
| `background-color: #ffffff` (.panel) | `var(--color-bg-panel)` |
| `background-color: #4f46e5` (button) | `var(--color-accent)` |
| `background-color: #4338ca` (button:hover) | `var(--color-accent-hover)` |
| `color: #4f46e5` (#greeting-message) | `var(--color-accent)` |
| `color: #6b7280` (#greeting-date) | `var(--color-text-secondary)` |
| `color: #059669` (#timer-status) | `var(--color-accent)` |
| `background-color: #f9fafb` (.todo-item, .link-item) | `var(--color-bg-page)` |
| `border: 1px solid #e5e7eb` (.todo-item, .link-item) | `var(--color-border)` |
| `color: #dc2626` (.error-message) | `var(--color-error-text)` |
| `background-color: #fef2f2` (.error-message) | `var(--color-error-bg)` |
| `border: 1px solid #fecaca` (.error-message) | `var(--color-error-border)` |
| `border: 1px solid #d1d5db` (input) | `var(--color-border)` |

#### Transisi Visual

Ditambahkan ke `body` untuk transisi halus saat tema berubah:

```css
body {
  /* ... existing properties ... */
  transition: background-color 200ms ease, color 200ms ease;
}
```

Durasi 200ms memenuhi requirement 150ms–300ms dan terasa natural.

#### Header Styling

```css
.app-header {
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

#theme-toggle {
  background: var(--color-bg-panel);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  font-size: 1.25rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

#theme-toggle:hover:not(:disabled) {
  background: var(--color-border);
}
```

---

### JavaScript — ThemeManager

`ThemeManager` ditambahkan sebagai modul baru di dalam IIFE yang sudah ada, mengikuti pola yang sama dengan `GreetingPanel`, `FocusTimer`, dll.

#### Interface

```js
const ThemeManager = {
  /**
   * Membaca tld_theme dari localStorage. Jika ada dan valid, terapkan.
   * Jika tidak ada atau tidak valid, gunakan system preference.
   * Fallback ke "light" jika system preference tidak dapat dibaca.
   * Dipanggil pertama kali di init() sebelum panel lain dirender.
   */
  init(): void,

  /**
   * Membaca getCurrent(), flip ke nilai lawannya,
   * panggil apply() dan persist(), kemudian updateToggleUI().
   * Dipasang sebagai event listener pada #theme-toggle click.
   */
  toggle(): void,

  /**
   * Menetapkan document.documentElement.setAttribute('data-theme', theme).
   * @param {'light'|'dark'} theme
   */
  apply(theme: 'light' | 'dark'): void,

  /**
   * Membaca document.documentElement.getAttribute('data-theme').
   * Mengembalikan 'light' sebagai fallback jika atribut tidak ada.
   * @returns {'light'|'dark'}
   */
  getCurrent(): 'light' | 'dark',

  /**
   * Menulis theme ke localStorage['tld_theme'].
   * Jika write gagal, tetap berlanjut tanpa error ke pengguna.
   * @param {'light'|'dark'} theme
   */
  persist(theme: 'light' | 'dark'): void,

  /**
   * Memperbarui ikon dan aria-label #theme-toggle sesuai tema baru.
   * light → ikon ☀️, aria-label "Switch to dark mode"
   * dark  → ikon 🌙, aria-label "Switch to light mode"
   * @param {'light'|'dark'} theme
   */
  updateToggleUI(theme: 'light' | 'dark'): void,
};
```

#### Implementasi Pseudocode

```js
const ThemeManager = {
  _VALID: new Set(['light', 'dark']),
  _KEY:   'tld_theme',

  init() {
    const saved = Storage.load(this._KEY);
    let theme;
    if (typeof saved === 'string' && this._VALID.has(saved)) {
      theme = saved;
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    } else {
      theme = 'light';
    }
    this.apply(theme);
    this.updateToggleUI(theme);
    document.getElementById('theme-toggle')
      ?.addEventListener('click', () => this.toggle());
  },

  toggle() {
    const next = this.getCurrent() === 'light' ? 'dark' : 'light';
    this.apply(next);
    this.persist(next);
    this.updateToggleUI(next);
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },

  getCurrent() {
    const val = document.documentElement.getAttribute('data-theme');
    return this._VALID.has(val) ? val : 'light';
  },

  persist(theme) {
    try {
      Storage.save(this._KEY, theme);
    } catch (_) {
      // Gagal tulis — tema tetap berlaku secara in-memory, tidak ada pesan error
    }
  },

  updateToggleUI(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isLight = theme === 'light';
    const icon    = isLight ? '☀️' : '🌙';
    const label   = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    btn.querySelector('[aria-hidden]').textContent = icon;
    btn.setAttribute('aria-label', label);
    // Update sr-only span juga
    const srSpan = btn.querySelector('.sr-only');
    if (srSpan) srSpan.textContent = label;
  },
};
```

#### Integrasi dengan Bootstrap

```js
function init() {
  ThemeManager.init();   // ← pertama, sebelum panel lain
  checkBrowserSupport();
  GreetingPanel.init();
  FocusTimer.init();
  TodoList.init();
  QuickLinks.init();
}
```

#### Penambahan ke Test Exports

```js
globalThis.__TLD_TEST_EXPORTS__ = {
  // ... existing exports ...
  ThemeManager,  // ← tambahkan
};
```

---

## Data Models

### localStorage Keys (tambahan)

| Key | Value | Type |
|---|---|---|
| `tld_theme` | `"light"` atau `"dark"` | `string` |

Key ini sudah ada di design dokumen todo-life-dashboard; tidak ada perubahan pada keys lain.

### Nilai Tema Valid

Hanya dua nilai yang diakui: `"light"` dan `"dark"`. Nilai lain yang tersimpan di localStorage (misalnya dari storage corruption) diabaikan dan dianggap tidak ada.

---

## Error Handling

### localStorage Write Failure

Jika `Storage.save()` melempar `StorageError` saat `persist()` dipanggil, `ThemeManager.persist()` menangkap error tersebut secara silent. Tema tetap diterapkan secara in-memory via atribut `data-theme` — pengguna melihat tampilan yang benar, hanya tidak persisten antar sesi. Tidak ada pesan error ditampilkan ke pengguna (sesuai Requirement 5.3).

### Nilai Tersimpan Tidak Valid

Jika `Storage.load('tld_theme')` mengembalikan nilai yang bukan `"light"` atau `"dark"` (termasuk null, number, object, atau string lain), `ThemeManager.init()` mengabaikannya dan jatuh ke logika deteksi system preference (sesuai Requirement 3.5).

### Elemen DOM Tidak Ditemukan

Semua akses DOM (`getElementById`, `querySelector`) dilindungi dengan optional chaining atau null-check. Jika elemen tidak ditemukan, operasi dilewati tanpa error.

### window.matchMedia Tidak Tersedia

`window.matchMedia?.('...')` menggunakan optional chaining — jika API tidak tersedia (browser lama), ekspresi mengembalikan `undefined` yang dievaluasi sebagai falsy, sehingga fallback ke `"light"` berjalan dengan benar.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Toggle rendering mencerminkan tema aktif

*For any* nilai tema yang valid (`"light"` atau `"dark"`), setelah `ThemeManager.apply(theme)` dan `ThemeManager.updateToggleUI(theme)` dipanggil, atribut `aria-label` pada `#theme-toggle` dan konten ikon-nya harus secara tepat mencerminkan aksi yang akan dilakukan jika tombol ditekan: `"light"` menghasilkan ikon ☀️ dan label `"Switch to dark mode"`, sedangkan `"dark"` menghasilkan ikon 🌙 dan label `"Switch to light mode"`.

**Validates: Requirements 1.4, 1.5, 7.1, 7.4**

---

### Property 2: Toggle adalah strict involution

*For any* tema awal yang valid (`"light"` atau `"dark"`), memanggil `ThemeManager.toggle()` dua kali berturut-turut harus mengembalikan nilai `ThemeManager.getCurrent()` ke nilai semula — double toggle adalah no-op pada tema yang dapat diamati.

**Validates: Requirements 4.1, 4.2**

---

### Property 3: apply() selalu menetapkan data-theme

*For any* nilai tema yang valid (`"light"` atau `"dark"`), memanggil `ThemeManager.apply(theme)` harus menetapkan `document.documentElement.getAttribute('data-theme')` sama dengan nilai `theme` tersebut.

**Validates: Requirements 3.4, 4.3**

---

### Property 4: init() membaca preferensi yang tersimpan

*For any* nilai `tld_theme` yang tersimpan di localStorage (`"light"` atau `"dark"`), memanggil `ThemeManager.init()` harus menghasilkan `ThemeManager.getCurrent()` mengembalikan nilai tersimpan tersebut. Ketika `tld_theme` tidak ada, `ThemeManager.init()` harus menerapkan `"dark"` jika `prefers-color-scheme: dark` cocok, dan `"light"` pada semua kasus lain.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 5: Nilai tersimpan yang tidak valid diabaikan

*For any* string yang bukan `"light"` atau `"dark"` (termasuk string kosong, angka yang di-stringify, atau nilai acak lainnya) yang tersimpan di `tld_theme`, `ThemeManager.init()` harus mengabaikan nilai tersebut dan jatuh ke logika deteksi system preference — seolah-olah tidak ada nilai tersimpan.

**Validates: Requirements 3.5**

---

### Property 6: Persistensi tema setelah toggle

*For any* tema awal yang valid, setelah `ThemeManager.toggle()` dipanggil, nilai yang tersimpan di `localStorage['tld_theme']` harus sama dengan nilai yang dikembalikan `ThemeManager.getCurrent()` — tema yang diterapkan dan tema yang dipersistensikan selalu sinkron.

**Validates: Requirements 5.1, 5.2**

---

## Testing Strategy

### Constraints

Proyek menggunakan **Vitest** dengan **jsdom** dan **fast-check** yang sudah terkonfigurasi (sesuai `vitest.config.js` yang ada). Test baru mengikuti pola yang sama dengan test yang ada di `tests/` directory. `ThemeManager` diekspor melalui `globalThis.__TLD_TEST_EXPORTS__` yang sudah ada, sehingga dapat ditest dalam isolasi.

---

### Unit Tests (example-based)

Kasus spesifik yang tidak membutuhkan input bervariasi luas:

- **Struktur DOM**: `index.html` memiliki `<header>` sebagai sibling sebelum `<main class="dashboard">` dalam `<body>`
- **Tombol toggle**: `#theme-toggle` ada, bertipe `<button>`, memiliki `aria-label`
- **Variabel CSS wajib**: 10 variabel (`--color-bg-page`, `--color-bg-panel`, dst.) terdefinisi di kedua `data-theme`
- **Kontras dark > light**: nilai luminance `--color-bg-page` di dark mode lebih rendah dari light mode
- **Storage failure**: ketika `localStorage.setItem` throw, `ThemeManager.persist()` tidak melempar error dan tema tetap diterapkan in-memory
- **No page reload**: setelah `ThemeManager.toggle()`, `window.location.reload` tidak terpanggil
- **Keyboard accessible**: elemen `#theme-toggle` adalah `<button>` native (dapat difokus dan diaktifkan dengan Enter/Space secara default)

---

### Property-Based Tests

Menggunakan **fast-check** dengan minimum **100 iterasi** per property. Setiap test ditagging:

```js
// Feature: light-dark-mode, Property N: <property_text>
```

| Property | Generator | Yang Diverifikasi |
|---|---|---|
| P1: Toggle rendering mencerminkan tema aktif | `fc.constantFrom('light', 'dark')` | Setelah `apply(theme)` + `updateToggleUI(theme)`: aria-label dan ikon sesuai tema |
| P2: Toggle adalah strict involution | `fc.constantFrom('light', 'dark')` sebagai tema awal | `getCurrent()` sama dengan awal setelah dua kali `toggle()` |
| P3: apply() selalu menetapkan data-theme | `fc.constantFrom('light', 'dark')` | `documentElement.getAttribute('data-theme') === theme` setelah `apply(theme)` |
| P4: init() membaca preferensi yang tersimpan | `fc.constantFrom('light', 'dark', null)` untuk stored value + `fc.boolean()` untuk system dark pref | `getCurrent()` setelah `init()` sesuai stored value; jika null, sesuai system pref atau fallback 'light' |
| P5: Nilai tersimpan tidak valid diabaikan | `fc.string()` difilter ke yang bukan 'light'/'dark' | Setelah `init()` dengan nilai invalid, sistem jatuh ke system preference logic |
| P6: Persistensi tema setelah toggle | `fc.constantFrom('light', 'dark')` sebagai tema awal | Setelah `toggle()`, `localStorage['tld_theme'] === getCurrent()` |

---

### Smoke Tests (Manual / Browser)

- Buka `index.html` dari filesystem — tema default muncul sesuai system preference tanpa flash
- Klik `#theme-toggle` — semua warna beralih mulus tanpa page reload
- Reload halaman — tema yang terakhir dipilih kembali diterapkan
- Uji di Chrome, Firefox, Edge, Safari — perilaku konsisten
- Pada viewport sempit (<640px) — tombol toggle tetap terlihat
