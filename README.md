# NEFALIX_ORTAK_CALISMA

Dron çekim hizmetleri için hazırlanmış, tek sayfalık, mobil uyumlu tanıtım sitesi.

## Önizleme

Herhangi bir kurulum veya build adımı gerektirmez, saf HTML/CSS/JS ile yazılmıştır.

```bash
# Proje klasöründe basit bir yerel sunucu başlatın
python3 -m http.server 8080
# Tarayıcıda açın
http://localhost:8080
```

Doğrudan `index.html` dosyasını çift tıklayarak tarayıcıda da açabilirsiniz.

## Dosya Yapısı

```
index.html          -> Ana sayfa (tüm bölümler burada)
assets/css/style.css -> Site stilleri (renkler, düzen, animasyonlar)
assets/js/main.js    -> Menü, galeri filtresi, SSS akordeonu, form vb. etkileşimler
assets/img/          -> Kendi fotoğraf/video görsellerinizi buraya ekleyebilirsiniz
```

## Kendinize Göre Düzenleme

Aşağıdaki yer tutucuları kendi bilgilerinizle değiştirin (hepsi `index.html` içinde):

- **Marka adı**: "NEFALIX DRON" (header ve footer'daki `.logo`)
- **İletişim bilgileri**: `#iletisim` bölümündeki telefon, e-posta, Instagram bağlantıları
- **Hakkımızda metni ve tecrübe yılı**: `#hakkimizda` bölümü
- **Fiyat paketleri**: `#paketler` bölümündeki üç kart. Buradaki tutarlar (₺4.000 / ₺7.500) gerçek bir piyasa araştırmasına dayanmayan, düzeni göstermek için konmuş örnek rakamlardır — kendi maliyetlerinize (ekipman, sigorta, düzenleme süresi, ulaşım) ve bölgenizdeki rakip fiyatlarına göre mutlaka güncelleyin
- **Portfolyo görselleri**: `#portfolyo` bölümündeki `.gallery-ph` kutularının yerine kendi fotoğraf/video önizlemelerinizi (`<img>` veya `<video>`) koyabilirsiniz

İletişim formu şu an demo amaçlı yalnızca istemci tarafında çalışır (bir e-posta göndermez). Gerçek gönderim için Formspree, EmailJS gibi bir servis ya da kendi backend'inizi bağlamanız gerekir.

## Yayınlama

Statik bir site olduğu için GitHub Pages, Netlify, Vercel veya Cloudflare Pages gibi herhangi bir statik barındırma servisinde ücretsiz yayınlanabilir.
