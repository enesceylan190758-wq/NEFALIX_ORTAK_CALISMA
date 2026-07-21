# Nefalix CRM (Kurum / Klinik)

Bu repo, **Nefalix kurum/klinik B2B CRM** sürümünü barındırır.

Canlı referans: [nefalix.com/crm](https://nefalix.com/crm) (Saha CRM).  
Buradaki sürüm, zip ile gelen **kurum CRM**’dir — lead → demo → teklif → sözleşme → aktif müşteri hattı.

## Hızlı açılış

```bash
# statik sunucu
npx --yes serve .
# sonra http://localhost:3000/crm/
```

veya `crm/Nefalix-CRM.bundle.html` dosyasını tarayıcıda çift tıklayın (tek dosya, çevrimdışı).

## Giriş

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| admin | 1234 | Yönetici |
| enes | 1234 | Saha Satış Temsilcisi |
| demo | demo | Temsilci |

## Yapı

```
crm/
  index.html                 # açılmış (unpacked) uygulama
  Nefalix-CRM.bundle.html    # orijinal tek dosya paket
  assets/
    store.js                 # veri katmanı (localStorage)
    seed.js                  # örnek 30 kurum + ilişkili veri
    dc-runtime.js            # UI runtime
    *.dc.html                # ekranlar (Dashboard, KurumKartı, …)
docs/
  Nefalix-Kurum-CRM-Kilavuz.md
```

## Veri

Değişiklikler tarayıcı `localStorage` içinde tutulur. Ortak/çok kullanıcılı kullanım için `crm/assets/store.js` API’ye bağlanır (kılavuza bakın).

Ayrıntılar: [docs/Nefalix-Kurum-CRM-Kilavuz.md](docs/Nefalix-Kurum-CRM-Kilavuz.md)
