# Requirements Document

## Introduction

Fitur light/dark mode menambahkan kemampuan pergantian tema visual pada aplikasi To-Do List Life Dashboard. Pengguna dapat beralih antara mode terang dan gelap melalui satu tombol toggle di header global yang tampil di atas semua panel. Tema default ditentukan oleh preferensi sistem pengguna (`prefers-color-scheme`), dengan fallback ke light mode. Pilihan tema disimpan ke `localStorage` sehingga persisten antar sesi. Implementasi menggunakan CSS custom properties (variabel) sehingga semua warna dapat dikendalikan secara terpusat.

## Glossary

- **Dashboard**: Halaman utama aplikasi yang memuat empat panel dalam grid 2×2.
- **ThemeToggle**: Tombol tunggal di header global yang digunakan pengguna untuk berpindah antara light mode dan dark mode.
- **ThemeManager**: Modul JavaScript yang bertanggung jawab membaca, menerapkan, dan menyimpan preferensi tema.
- **Light Mode**: Tema visual dengan latar belakang terang dan teks gelap.
- **Dark Mode**: Tema visual dengan latar belakang gelap dan teks terang.
- **CSS Custom Property**: Variabel CSS yang didefinisikan pada selektor `:root` dan direferensikan di seluruh stylesheet.
- **Active Theme**: Tema yang sedang diterapkan pada Dashboard; bernilai `"light"` atau `"dark"`.
- **System Preference**: Nilai media query `prefers-color-scheme` yang dilaporkan oleh browser.
- **Persisted Preference**: Nilai tema yang tersimpan di `localStorage` dengan kunci `tld_theme`.
- **Header**: Elemen HTML baru bertipe `<header>` yang ditempatkan di atas elemen `.dashboard` dan berisi ThemeToggle.

## Requirements

### Requirement 1: Header Global dengan ThemeToggle

**User Story:** Sebagai pengguna, saya ingin melihat tombol toggle tema di bagian atas halaman, di atas semua panel, sehingga saya dapat mengakses kontrol tema kapan pun tanpa perlu mencari di dalam panel.

#### Acceptance Criteria

1. THE Dashboard SHALL menampilkan elemen `<header>` di atas elemen `.dashboard` sebagai sibling langsung dalam `<body>`.
2. THE Header SHALL memuat tepat satu elemen ThemeToggle bertipe `<button>` dengan atribut `id="theme-toggle"`.
3. THE ThemeToggle SHALL selalu terlihat (visible) di semua lebar viewport yang didukung aplikasi.
4. WHEN Active Theme adalah `"light"`, THE ThemeToggle SHALL menampilkan ikon ☀️ dan teks tersembunyi (screen-reader-only) `"Switch to dark mode"`.
5. WHEN Active Theme adalah `"dark"`, THE ThemeToggle SHALL menampilkan ikon 🌙 dan teks tersembunyi (screen-reader-only) `"Switch to light mode"`.

---

### Requirement 2: CSS Custom Properties untuk Semua Warna

**User Story:** Sebagai pengembang, saya ingin semua warna aplikasi didefinisikan sebagai CSS custom properties pada `:root`, sehingga pergantian tema cukup dilakukan dengan satu mekanisme tanpa mengubah nilai warna secara individual di setiap selector.

#### Acceptance Criteria

1. THE Dashboard SHALL mendefinisikan seluruh nilai warna yang digunakan oleh aplikasi sebagai CSS custom properties pada selektor `:root[data-theme="light"]` dan `:root[data-theme="dark"]`.
2. THE Dashboard SHALL mengganti setiap nilai warna hardcoded yang ada di `style.css` dengan referensi ke CSS custom property yang bersesuaian.
3. THE Dashboard SHALL mendefinisikan paling sedikit variabel berikut pada kedua nilai tema: `--color-bg-page`, `--color-bg-panel`, `--color-text-primary`, `--color-text-secondary`, `--color-border`, `--color-accent`, `--color-accent-hover`, `--color-error-text`, `--color-error-bg`, `--color-error-border`.
4. WHEN `data-theme="dark"` diterapkan pada elemen `<html>`, THE Dashboard SHALL menampilkan warna latar belakang halaman lebih gelap dari warna latar belakang light mode.

---

### Requirement 3: Inisialisasi Tema saat Halaman Dimuat

**User Story:** Sebagai pengguna, saya ingin halaman langsung tampil dengan tema yang sesuai preferensi saya saat pertama kali dibuka, sehingga tidak terjadi kilatan (flash) warna yang salah.

#### Acceptance Criteria

1. WHEN halaman dimuat dan Persisted Preference tersedia di `localStorage`, THE ThemeManager SHALL menerapkan nilai Persisted Preference sebagai Active Theme sebelum rendering konten terlihat pengguna.
2. WHEN halaman dimuat dan Persisted Preference tidak tersedia, WHILE System Preference adalah `"dark"`, THE ThemeManager SHALL menerapkan `"dark"` sebagai Active Theme.
3. WHEN halaman dimuat dan Persisted Preference tidak tersedia, WHILE System Preference adalah `"light"` atau tidak dapat dibaca, THE ThemeManager SHALL menerapkan `"light"` sebagai Active Theme.
4. THE ThemeManager SHALL menerapkan Active Theme dengan menetapkan atribut `data-theme` pada elemen `<html>` dengan nilai `"light"` atau `"dark"`.
5. IF nilai Persisted Preference yang tersimpan bukan `"light"` atau `"dark"`, THEN THE ThemeManager SHALL mengabaikan nilai tersebut dan menjalankan logika deteksi System Preference.

---

### Requirement 4: Toggle Tema oleh Pengguna

**User Story:** Sebagai pengguna, saya ingin menekan tombol toggle untuk berpindah tema, sehingga saya dapat menyesuaikan tampilan sesuai preferensi saya.

#### Acceptance Criteria

1. WHEN pengguna menekan ThemeToggle dan Active Theme adalah `"light"`, THE ThemeManager SHALL mengubah Active Theme menjadi `"dark"`.
2. WHEN pengguna menekan ThemeToggle dan Active Theme adalah `"dark"`, THE ThemeManager SHALL mengubah Active Theme menjadi `"light"`.
3. WHEN Active Theme berubah, THE ThemeManager SHALL memperbarui atribut `data-theme` pada elemen `<html>` secara sinkron.
4. WHEN Active Theme berubah, THE ThemeManager SHALL memperbarui ikon dan atribut `aria-label` ThemeToggle agar mencerminkan tema baru.

---

### Requirement 5: Persistensi Preferensi Tema

**User Story:** Sebagai pengguna, saya ingin pilihan tema saya tersimpan, sehingga saya tidak perlu mengatur ulang tema setiap kali membuka halaman.

#### Acceptance Criteria

1. WHEN Active Theme berubah akibat aksi pengguna pada ThemeToggle, THE ThemeManager SHALL menyimpan nilai Active Theme ke `localStorage` dengan kunci `tld_theme`.
2. THE ThemeManager SHALL menyimpan nilai tema sebagai string `"light"` atau `"dark"`.
3. IF operasi tulis ke `localStorage` gagal, THEN THE ThemeManager SHALL tetap menerapkan Active Theme secara in-memory tanpa menampilkan pesan error kepada pengguna.

---

### Requirement 6: Transisi Visual saat Pergantian Tema

**User Story:** Sebagai pengguna, saya ingin pergantian tema terasa halus, sehingga perubahan warna tidak terasa tiba-tiba atau mengagetkan.

#### Acceptance Criteria

1. THE Dashboard SHALL menerapkan CSS `transition` pada properti `background-color` dan `color` di elemen `body` dengan durasi antara 150ms dan 300ms.
2. WHEN Active Theme berubah, THE Dashboard SHALL menyelesaikan transisi warna tanpa memuat ulang halaman (no page reload).

---

### Requirement 7: Aksesibilitas ThemeToggle

**User Story:** Sebagai pengguna yang mengandalkan teknologi asistif, saya ingin tombol toggle tema dapat digunakan dengan keyboard dan screen reader, sehingga saya tetap dapat mengontrol tema tanpa hambatan.

#### Acceptance Criteria

1. THE ThemeToggle SHALL memiliki atribut `aria-label` yang mendeskripsikan aksi yang akan dilakukan saat tombol ditekan (bukan keadaan saat ini).
2. THE ThemeToggle SHALL dapat difokus dan diaktifkan menggunakan tombol `Enter` dan `Space` pada keyboard.
3. THE ThemeToggle SHALL memiliki rasio kontras warna antara ikon/teks dan latar belakang tombol minimal 4.5:1 di kedua tema, sesuai WCAG 2.1 Level AA.
4. WHEN Active Theme berubah, THE ThemeToggle SHALL memperbarui `aria-label` secara sinkron sehingga screen reader mengumumkan perubahan yang tepat.
