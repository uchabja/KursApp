# Kurs Yönetim Sistemi

Bu proje, kurslar, öğrenciler, kayıtlar ve ödemeleri yönetmek için geliştirilmiş modern bir web uygulamasıdır.

## Özellikler

- **Öğrenci Yönetimi**:
  - Öğrenci ekleme, düzenleme, silme.
  - Öğrenci detaylarını görüntüleme (İletişim, Veli bilgileri, Notlar).
  - Öğrenci durumu takibi (Aktif, Pasif, Ön Kayıt).
  - Gelişmiş filtreleme ve sıralama.
- **Ders Yönetimi**:
  - Ders oluşturma, programlama (Gün/Saat).
  - Ücret ve ödeme periyodu belirleme.
  - Derse kayıtlı öğrencileri görüntüleme.
- **Kayıt İşlemleri**:
  - Öğrencileri derslere kaydetme.
  - Dersler arası transfer yapma.
- **Ödeme Takibi**:
  - Bekleyen, Gecikmiş ve Ödenmiş ödemelerin takibi.
  - Ödeme durumu güncelleme.
  - Aylık ve yıllık finansal özetler.

## Teknolojiler

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.
- **Veritabanı**: PostgreSQL (Prisma ORM).

## Kurulum

1. **Depoyu Klonlayın**:
   ```bash
   git clone <repo-url>
   cd kursyonetim
   ```

2. **Bağımlılıkları Yükleyin**:
   ```bash
   # Ana dizinde (Frontend için)
   npm install

   # Server dizininde (Backend için)
   cd server
   npm install
   ```

3. **Çevresel Değişkenler (.env)**:
   `server/.env` dosyasını oluşturun ve veritabanı bağlantı adresinizi ekleyin:
   ```env
   DATABASE_URL="postgresql://kullanici:sifre@host:port/veritabani?schema=public"
   ```

4. **Veritabanını Hazırlayın**:
   ```bash
   cd server
   npx prisma db push
   ```

5. **Uygulamayı Çalıştırın**:
   İki ayrı terminalde aşağıdaki komutları çalıştırın:

   **Terminal 1 (Backend):**
   ```bash
   cd server
   node index.js
   ```

   **Terminal 2 (Frontend):**
   ```bash
   # Ana dizinde
   npm run dev
   ```

6. **Tarayıcıda Açın**:
   `http://localhost:5173` adresine gidin.

## Kullanım İpuçları

- **Öğrenci Arama**: İsim veya soyisim ile hızlı arama yapabilirsiniz.
- **Filtreleme**: Öğrenci listesini duruma veya derse göre filtreleyebilirsiniz.
- **Sıralama**: Tablo başlıklarına tıklayarak (İsim, Yaş vb.) sıralama yapabilirsiniz.
- **Ödemeler**: Gecikmiş ödemeler kırmızı ile işaretlenir. Ödeme alındığında yeşil tik butonuna basarak "Ödendi" olarak işaretleyebilirsiniz.
