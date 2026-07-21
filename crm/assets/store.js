/* Nefalix CRM - veri katmanı. Seed JSON'ları yükler, localStorage ile kalıcı değişiklik saklar. */
(function () {
  // Tek instance güvencesi: NavHeader gibi birden fazla DC store.js'i yüklese de
  // window.Nefalix bir kez oluşturulur; aksi halde _seed sıfırlanıp veriler kaybolur.
  if (window.Nefalix) {
    try {
      if (!window.__NFX_SEED) {
        var _f0 = (location.pathname.split('/').pop() || '').toLowerCase();
        if (_f0.indexOf('login') !== 0 && !window.Nefalix.currentUser()) location.href = 'Login.dc.html';
      }
    } catch (e) {}
    return;
  }
  const LS = window.localStorage;
  const K = {
    over: 'nfx_danisan_over', add: 'nfx_danisan_add', notes: 'nfx_notes',
    dinamik: 'nfx_dinamik', kasaAdd: 'nfx_kasa_add', teklif: 'nfx_teklif',
    randevu: 'nfx_randevu', auth: 'nfx_auth', seq: 'nfx_seq'
  };
  function lsGet(k, d) { try { const v = JSON.parse(LS.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { LS.setItem(k, JSON.stringify(v)); }
  function nextSeq() { const n = (lsGet(K.seq, 1000) | 0) + 1; lsSet(K.seq, n); return n; }

  /* ---------- Kullanıcılar / Yetki ---------- */
  const USERS = [
    { id: 'admin', pw: '1234', name: 'Abdülkadir Yaşar', initials: 'AY', role: 'Yönetici', email: 'admin@nefalix.com' },
    { id: 'enes', pw: '1234', name: 'Enes Ceylan', initials: 'EC', role: 'Satış Temsilcisi', email: 'enes@nefalix.com' },
    { id: 'demo', pw: 'demo', name: 'Demo Kullanıcı', initials: 'DK', role: 'Temsilci', email: 'demo@nefalix.com' }
  ];
  function login(id, pw) {
    const u = USERS.find(x => x.id.toLowerCase() === String(id || '').toLowerCase().trim() && x.pw === pw);
    if (!u) return null;
    const sess = { id: u.id, name: u.name, initials: u.initials, role: u.role, email: u.email, ts: Date.now() };
    lsSet(K.auth, sess); return sess;
  }
  function currentUser() { return lsGet(K.auth, null); }
  function logout() { LS.removeItem(K.auth); }
  function requireAuth() { if (!currentUser()) { nav('Login.dc.html'); return false; } return true; }

  /* ---------- Tek dosya (offline) yönlendirme yardımcıları ----------
     isSingle()=true iken (veri sayfaya gömülüyse) tüm gezinme hash rotasına çevrilir:
     'Dashboard.dc.html' -> '#Dashboard', 'HastaKarti.dc.html?id=x' -> '#HastaKarti?id=x'.
     Sunucuda çalışan çok-dosyalı sürümde ise klasik dosya gezinmesi korunur.
     NOT: __NFX_SEED store.js'den sonra yüklenebileceği için CANLI kontrol edilir (sabitlenmez). */
  function isSingle() { return !!window.__NFX_SEED; }
  function _hashRoute() {
    var h = (location.hash || '').replace(/^#/, '');
    var qi = h.indexOf('?');
    return { page: qi >= 0 ? h.slice(0, qi) : h, query: qi >= 0 ? h.slice(qi + 1) : '' };
  }
  function nav(target) {
    var t = String(target || '').trim();
    if (!isSingle()) { location.href = t; return; }
    if (t.charAt(0) === '#') { location.hash = t; return; }
    var m = /^([^?#]*)(\?[^#]*)?/.exec(t);
    var name = ((m && m[1]) || t).replace(/\.dc\.html$/i, '').replace(/\.html$/i, '');
    location.hash = '#' + name + ((m && m[2]) ? m[2] : '');
  }
  function param(name) {
    var q = isSingle() ? _hashRoute().query : location.search.replace(/^\?/, '');
    return new URLSearchParams(q).get(name);
  }
  function currentPage(fallback) {
    if (isSingle()) return _hashRoute().page || fallback || 'Dashboard';
    return (location.pathname.split('/').pop() || '').replace(/\.dc\.html$/i, '') || fallback || 'Dashboard';
  }

  /* ---------- Seed yükleme ---------- */
  let _seed = null, _seedPromise = null;
  // Tek bir JSON'u getirir; geçici hata (ağ/sunucu) durumunda artan beklemeyle birkaç kez dener.
  function fetchJSON(url, tries) {
    tries = (tries == null) ? 5 : tries;
    return fetch(url, { cache: 'default' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + url); return r.json(); })
      .catch(function (err) {
        if (tries <= 1) throw err;
        var wait = 350 * (6 - tries); // 350, 700, 1050, 1400 ms
        return new Promise(function (res) { setTimeout(res, wait); }).then(function () { return fetchJSON(url, tries - 1); });
      });
  }
  function loadSeed() {
    if (_seed) return Promise.resolve(_seed);
    if (_seedPromise) return _seedPromise;
    // Tek dosya (offline) modu: veri sayfaya gömülüyse fetch etme, doğrudan kullan.
    function _prep(s) {
      var kurum = s.kurum || [], dinamik = s.dinamik || [], kasa = s.kasa || [], bakiye = s.bakiye || [], gorusme = s.gorusme || [], sozlesme = s.sozlesme || [];
      kurum.forEach(function (d, i) { d._id = d['ID'] || ('seed-' + i); });
      dinamik.forEach(function (d, i) { d._id = 'di-' + i; });
      kasa.forEach(function (d, i) { d._id = 'ks-' + i; });
      bakiye.forEach(function (d, i) { d._id = 'bk-' + i; });
      return { kurum: kurum, dinamik: dinamik, kasa: kasa, bakiye: bakiye, gorusme: gorusme, sozlesme: sozlesme };
    }
    if (window.__NFX_SEED) {
      _seedPromise = Promise.resolve().then(function () { _seed = _prep(window.__NFX_SEED); return _seed; });
      return _seedPromise;
    }
    _seedPromise = Promise.all([
      fetchJSON('data/kurum.json'), fetchJSON('data/dinamik.json'), fetchJSON('data/kasa.json'),
      fetchJSON('data/bakiye.json'), fetchJSON('data/gorusme.json'), fetchJSON('data/sozlesme.json')
    ]).then(function (a) {
      _seed = _prep({ kurum: a[0], dinamik: a[1], kasa: a[2], bakiye: a[3], gorusme: a[4], sozlesme: a[5] });
      return _seed;
    }).catch(function (e) {
      // Tüm denemeler başarısız: sayfalar sonsuza kadar "yükleniyor"da kalmasın diye
      // boş veriyle çözümle; UI boş-durum mesajlarını gösterir, hata/askıda kalma olmaz.
      console.error('[Nefalix] Veri yüklenemedi, boş veriyle devam ediliyor:', e);
      _seed = { kurum: [], dinamik: [], kasa: [], bakiye: [], gorusme: [], sozlesme: [], _loadError: true };
      return _seed;
    });
    return _seedPromise;
  }

  /* ---------- Kurum / Klinik (müşteriler) ---------- */
  const STAGES = ['Yeni Lead', 'İlk Görüşme', 'Demo', 'Teklif', 'Sözleşme', 'Aktif Müşteri'];
  const KURUM_TIPLERI = ['Diş Kliniği', 'Estetik / Güzellik Merkezi', 'Saç Ekim Merkezi', 'Hastane', 'Göz Merkezi', 'Poliklinik', 'Fizik Tedavi / Rehabilitasyon', 'Diğer'];
  function allKurum() {
    const over = lsGet(K.over, {}), added = lsGet(K.add, []);
    const base = _seed.kurum.map(d => over[d._id] ? Object.assign({}, d, over[d._id]) : d);
    return added.concat(base);
  }
  function getKurum(opts) {
    opts = opts || {};
    let list = allKurum();
    const q = (opts.q || '').toLowerCase().trim();
    if (q) list = list.filter(d =>
      String(d['Ad'] || '').toLowerCase().includes(q) ||
      String(d['Telefon'] || '').toLowerCase().includes(q) ||
      String(d['Kurum ID'] || '').toLowerCase().includes(q) ||
      String(d['Yetkili'] || '').toLowerCase().includes(q) ||
      String(d['Şehir'] || '').toLowerCase().includes(q) ||
      String(d['Satış temsilcisi'] || '').toLowerCase().includes(q) ||
      String(d['Kurum tipi'] || '').toLowerCase().includes(q) ||
      String(d['Segment'] || '').toLowerCase().includes(q));
    if (opts.tip) list = list.filter(d => (d['Kurum tipi'] || '') === opts.tip);
    if (opts.temsilci) list = list.filter(d => (d['Satış temsilcisi'] || '') === opts.temsilci);
    if (opts.segment) list = list.filter(d => (d['Segment'] || '') === opts.segment);
    const total = list.length;
    const page = opts.page || 1, size = opts.size || 30;
    const rows = list.slice((page - 1) * size, page * size);
    return { rows, total, page, size, pages: Math.max(1, Math.ceil(total / size)) };
  }
  function getKurumById(id) { return allKurum().find(d => d._id === id) || null; }
  function _nameIndex() {
    const idx = {}; allKurum().forEach(d => { const n = (d['Ad'] || '').trim().toLowerCase(); if (n && !idx[n]) idx[n] = d._id; });
    return idx;
  }
  function findIdByName(name) { if (!name) return null; return _nameIndex()[String(name).trim().toLowerCase()] || null; }
  function hrefForName(name) { const id = findIdByName(name); return id ? 'KurumKarti.dc.html?id=' + encodeURIComponent(id) : null; }
  function updateKurum(id, patch) {
    const added = lsGet(K.add, []); const ai = added.findIndex(d => d._id === id);
    if (ai >= 0) { Object.assign(added[ai], patch); lsSet(K.add, added); return added[ai]; }
    const over = lsGet(K.over, {}); over[id] = Object.assign({}, over[id], patch); lsSet(K.over, over);
    return getKurumById(id);
  }
  function addKurum(obj) {
    const added = lsGet(K.add, []); const seq = nextSeq();
    const u = currentUser();
    const rec = Object.assign({
      _id: 'new-' + seq, 'Kurum ID': String(200 + seq - 1000),
      'Segment': 'Yeni Lead', 'Kayıt tarihi': todayStr(true),
      'Oluşturan': u ? u.name : 'Sistem'
    }, obj);
    added.unshift(rec); lsSet(K.add, added); return rec;
  }
  // Geriye dönük adlar (eski çağrılar için)
  const allDanisan = allKurum, getDanisan = getKurum, getDanisanById = getKurumById, updateDanisan = updateKurum, addDanisan = addKurum;

  /* ---------- Lead (potansiyel kurumlar) ---------- */
  function getLeads(opts) {
    opts = opts || {};
    let list = allKurum().filter(d => (d['Segment'] || 'Yeni Lead') !== 'Aktif Müşteri');
    const q = (opts.q || '').toLowerCase().trim();
    if (q) list = list.filter(d => String(d['Ad'] || '').toLowerCase().includes(q) || String(d['Telefon'] || '').toLowerCase().includes(q) || String(d['Şehir'] || '').toLowerCase().includes(q));
    const total = list.length; const page = opts.page || 1, size = opts.size || 30;
    return { rows: list.slice((page - 1) * size, page * size), total, page, size, pages: Math.max(1, Math.ceil(total / size)) };
  }
  function convertLead(id, temsilci) {
    const u = currentUser();
    return updateKurum(id, { 'Segment': 'Aktif Müşteri', 'Satış temsilcisi': temsilci || (u ? u.name : ''), 'Dönüşüm tarihi': todayStr(true) });
  }
  function salesSegments() {
    const list = allKurum();
    const m = {};
    list.forEach(d => { const s = (d['Segment'] || 'Yeni Lead').trim() || 'Yeni Lead'; (m[s] = m[s] || []).push(d); });
    const keys = Object.keys(m).sort((a, b) => { const ia = STAGES.indexOf(a), ib = STAGES.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    const grand = list.length || 1;
    return keys.map(k => ({ key: k, count: m[k].length, pct: (m[k].length / grand * 100), items: m[k] }));
  }

  /* ---------- Notlar ---------- */
  function getNotes(danisanId) { const all = lsGet(K.notes, {}); return all[danisanId] || []; }
  function addNote(danisanId, text) {
    const all = lsGet(K.notes, {}); const u = currentUser();
    (all[danisanId] = all[danisanId] || []).unshift({ text: text, user: u ? u.name : 'Sistem', ts: todayStr(true) });
    lsSet(K.notes, all); return all[danisanId];
  }

  /* ---------- Dinamik Arama ---------- */
  function getDinamik() {
    const st = lsGet(K.dinamik, {});
    return _seed.dinamik.map(d => Object.assign({}, d, st[d._id] || {}));
  }
  function getDinamikDue() {
    const today = new Date(); today.setHours(23, 59, 59, 0);
    return getDinamik().filter(d => {
      if (d.done) return false;
      if (!d.nextCallDate) return true;
      const dt = parseDate(d.nextCallDate); return !dt || dt <= today;
    });
  }
  function setDinamikResult(id, result, notlar, gun) {
    const st = lsGet(K.dinamik, {}); const u = currentUser();
    let next = '';
    if (gun != null && gun !== '') { const d = new Date(); d.setDate(d.getDate() + (parseInt(gun) || 0)); next = fmt(d, false); }
    st[id] = { Segment: result, Notlar: notlar, nextCallDate: next, 'Değişiklik tarihi': todayStr(true), 'Satış temsilcisi': u ? u.name : (st[id] && st[id]['Satış temsilcisi']) };
    lsSet(K.dinamik, st); return getDinamik().find(x => x._id === id);
  }

  /* ---------- Kasa / Gelir-Gider ---------- */
  function getKasa() { const add = lsGet(K.kasaAdd, []); return add.concat(_seed.kasa); }
  function addKasa(obj) {
    const add = lsGet(K.kasaAdd, []); const u = currentUser(); const seq = nextSeq();
    const rec = Object.assign({ _id: 'ksn-' + seq, 'Ödeme tarihi': todayStr(false), 'Oluşturan': u ? u.name : 'Sistem', 'Kayıt tarihi': todayStr(true) }, obj);
    add.unshift(rec); lsSet(K.kasaAdd, add); return rec;
  }
  function kasaTotals() {
    const list = getKasa(); const t = { girisEUR: 0, cikisEUR: 0, girisTRY: 0, cikisTRY: 0 };
    list.forEach(k => { const v = parseFloat(k['Tutar']) || 0; const kur = k['Kur'] || 'TRY';
      if (v >= 0) { if (kur === 'EUR') t.girisEUR += v; else t.girisTRY += v; }
      else { if (kur === 'EUR') t.cikisEUR += -v; else t.cikisTRY += -v; } });
    t.netEUR = t.girisEUR - t.cikisEUR; t.netTRY = t.girisTRY - t.cikisTRY; return t;
  }
  function getBakiye() { return _seed.bakiye.slice(); }
  function getGelir() { return getKasa().filter(k => (parseFloat(k['Tutar']) || 0) >= 0); }
  function getGider() { return getKasa().filter(k => (parseFloat(k['Tutar']) || 0) < 0); }

  /* ---------- Randevu ---------- */
  const RND_STATUS = [
    { key: 'bekliyor', label: 'Bekliyor', color: '#f59e0b' },
    { key: 'onayli', label: 'Onaylandı', color: '#2563eb' },
    { key: 'geldi', label: 'Geldi', color: '#16a34a' },
    { key: 'gelmedi', label: 'Gelmedi', color: '#ef4444' },
    { key: 'iptal', label: 'İptal', color: '#9ca3af' }
  ];
  const RND_TYPES = ['Online Demo', 'Yüz yüze Toplantı', 'Kurulum', 'Eğitim'];
  function _seedRandevu() {
    const rooms = ['Online (Zoom)', 'Ofis', 'Klinikte'];
    const src = _seed.kurum.filter(k => STAGES.indexOf(k['Segment']) >= 1);
    const out = []; const base = new Date(); base.setHours(0, 0, 0, 0);
    const n = Math.min(24, src.length);
    for (let i = 0; i < n; i++) {
      const d = src[i % src.length];
      const day = new Date(base); day.setDate(base.getDate() + (i % 7) - 1);
      const hour = 10 + (i % 7); const st = RND_STATUS[i % RND_STATUS.length];
      out.push({ _id: 'rs-' + i, danisanId: d._id, ad: d['Ad'] || '(İsimsiz)', tel: d['Telefon'] || '',
        tarih: fmt(day, false), saat: String(hour).padStart(2, '0') + ':00', tip: RND_TYPES[i % RND_TYPES.length],
        oda: rooms[i % rooms.length], doktor: d['Satış temsilcisi'] || 'Enes Ceylan', durum: st.key, notlar: '' });
    }
    return out;
  }
  function getRandevu() {
    if (!_seed._rnd) _seed._rnd = _seedRandevu();
    const add = lsGet(K.randevu, []); const over = lsGet('nfx_randevu_over', {});
    const base = _seed._rnd.map(r => over[r._id] ? Object.assign({}, r, over[r._id]) : r);
    return add.concat(base);
  }
  function addRandevu(obj) {
    const add = lsGet(K.randevu, []); const seq = nextSeq();
    const rec = Object.assign({ _id: 'rn-' + seq, durum: 'bekliyor' }, obj);
    add.unshift(rec); lsSet(K.randevu, add); return rec;
  }
  function setRandevuStatus(id, durum) {
    const add = lsGet(K.randevu, []); const ai = add.findIndex(r => r._id === id);
    if (ai >= 0) { add[ai].durum = durum; lsSet(K.randevu, add); return; }
    const over = lsGet('nfx_randevu_over', {}); over[id] = Object.assign({}, over[id], { durum }); lsSet('nfx_randevu_over', over);
  }

  /* ---------- Teklif ---------- */
  const TEKLIF_STATUS = [
    { key: 'beklemede', label: 'Beklemede', color: '#f59e0b' },
    { key: 'gonderildi', label: 'Gönderildi', color: '#2563eb' },
    { key: 'kabul', label: 'Kabul Edildi', color: '#16a34a' },
    { key: 'red', label: 'Reddedildi', color: '#ef4444' }
  ];
  const HIZMETLER = ['CRM Başlangıç Paketi', 'CRM Profesyonel Paket', 'CRM Kurumsal Paket', 'WhatsApp Entegrasyonu', 'Online Randevu Modülü', 'Hasta Takip Modülü', 'Raporlama & Analitik', 'Kurulum & Eğitim'];
  function _seedTeklif() {
    const src = _seed.kurum.filter(d => ['Teklif', 'Demo', 'İlk Görüşme', 'Sözleşme'].indexOf(d['Segment']) >= 0);
    const out = [];
    const n = Math.min(20, src.length);
    for (let i = 0; i < n; i++) {
      const d = src[i % src.length]; const st = TEKLIF_STATUS[i % TEKLIF_STATUS.length];
      const day = new Date(); day.setDate(day.getDate() - (i * 3));
      const tutar = [2500, 4500, 7500, 12000, 3500, 6000][i % 6];
      out.push({ _id: 'tk-' + i, danisanId: d._id, ad: d['Ad'] || '(İsimsiz)', tel: d['Telefon'] || '',
        ref: 'TKF-' + (33000 + i), hizmet: HIZMETLER[i % HIZMETLER.length], tutar, kur: 'TRY',
        tarih: fmt(day, false), gecerlilik: fmt(new Date(day.getTime() + 15 * 864e5), false), durum: st.key,
        temsilci: d['Satış temsilcisi'] || 'Enes Ceylan' });
    }
    return out;
  }
  function getTeklif() {
    if (!_seed._tk) _seed._tk = _seedTeklif();
    const add = lsGet(K.teklif, []); const over = lsGet('nfx_teklif_over', {});
    const base = _seed._tk.map(t => over[t._id] ? Object.assign({}, t, over[t._id]) : t);
    return add.concat(base);
  }
  function addTeklif(obj) {
    const add = lsGet(K.teklif, []); const seq = nextSeq();
    const rec = Object.assign({ _id: 'tkn-' + seq, ref: 'TKF-' + (40000 + seq), durum: 'beklemede', kur: 'TRY', tarih: todayStr(false) }, obj);
    add.unshift(rec); lsSet(K.teklif, add); return rec;
  }
  function setTeklifStatus(id, durum) {
    const add = lsGet(K.teklif, []); const ai = add.findIndex(t => t._id === id);
    if (ai >= 0) { add[ai].durum = durum; lsSet(K.teklif, add); return; }
    const over = lsGet('nfx_teklif_over', {}); over[id] = Object.assign({}, over[id], { durum }); lsSet('nfx_teklif_over', over);
  }
  function teklifStatusMeta() { return TEKLIF_STATUS; }

  /* ---------- Sistem tanımları (Personel, Hizmet, Paket, Ürün) ---------- */
  const DEFS = {
    personel: [
      { ad: 'Abdülkadir Yaşar', rol: 'Yönetici', tel: '+90 532 111 22 33', email: 'admin@nefalix.com', durum: 'Aktif' },
      { ad: 'Enes Ceylan', rol: 'Saha Satış Temsilcisi', tel: '+90 533 222 33 44', email: 'enes@nefalix.com', durum: 'Aktif' },
      { ad: 'Zeynep Aksoy', rol: 'Saha Satış Temsilcisi', tel: '+90 534 333 44 55', email: 'zeynep@nefalix.com', durum: 'Aktif' },
      { ad: 'Burak Demir', rol: 'Satış Temsilcisi', tel: '+90 535 444 55 66', email: 'burak@nefalix.com', durum: 'Aktif' },
      { ad: 'Ayşe Demir', rol: 'Müşteri Başarı / Destek', tel: '+90 536 555 66 77', email: 'ayse@nefalix.com', durum: 'Aktif' },
      { ad: 'Can Öztürk', rol: 'Kurulum & Eğitim Uzmanı', tel: '+90 537 666 77 88', email: 'can@nefalix.com', durum: 'Aktif' }
    ],
    hizmet: [
      { ad: 'CRM Kurulumu', kategori: 'Kurulum', sure: '1 gün', fiyat: 'Tek sefer' },
      { ad: 'WhatsApp Entegrasyonu', kategori: 'Entegrasyon', sure: '2 saat', fiyat: '750 ₺/ay' },
      { ad: 'Online Randevu Modülü', kategori: 'Modül', sure: '-', fiyat: '500 ₺/ay' },
      { ad: 'Raporlama & Analitik', kategori: 'Modül', sure: '-', fiyat: '600 ₺/ay' },
      { ad: 'SMS Gönderim Entegrasyonu', kategori: 'Entegrasyon', sure: '1 saat', fiyat: 'Kullanıma göre' },
      { ad: 'Personel Eğitimi', kategori: 'Eğitim', sure: '3 saat', fiyat: '1.500 ₺' },
      { ad: 'Veri Aktarım / Migrasyon', kategori: 'Kurulum', sure: '1-2 gün', fiyat: 'Projeye göre' }
    ],
    paket: [
      { ad: 'Başlangıç', icerik: 'Çekirdek CRM + 3 kullanıcı', fiyat: '2.500 ₺/ay', durum: 'Aktif' },
      { ad: 'Profesyonel', icerik: 'Tüm modüller + WhatsApp + 10 kullanıcı', fiyat: '4.500 ₺/ay', durum: 'Aktif' },
      { ad: 'Kurumsal', icerik: 'Sınırsız kullanıcı + API + öncelikli destek', fiyat: '7.500 ₺/ay', durum: 'Aktif' },
      { ad: 'Yıllık Kurumsal', icerik: 'Kurumsal plan, yıllık ödeme (2 ay hediye)', fiyat: '75.000 ₺/yıl', durum: 'Aktif' }
    ],
    urun: [
      { ad: 'SMS Kredisi (1.000 adet)', kod: 'SMS-1K', stok: '∞', birim: 'Paket' },
      { ad: 'Ek Kullanıcı Lisansı', kod: 'USR-1', stok: '∞', birim: 'Kullanıcı' },
      { ad: 'WhatsApp API Kurulumu', kod: 'WA-SETUP', stok: '∞', birim: 'Adet' },
      { ad: 'Özel Rapor Tasarımı', kod: 'RPT-CUS', stok: '∞', birim: 'Adet' },
      { ad: 'Veri Migrasyon Projesi', kod: 'MIG-01', stok: '∞', birim: 'Proje' }
    ]
  };
  function getDefs(kind) { const add = lsGet('nfx_defs_' + kind, []); return add.concat(DEFS[kind] || []); }
  function addDef(kind, obj) { const add = lsGet('nfx_defs_' + kind, []); add.unshift(obj); lsSet('nfx_defs_' + kind, add); return obj; }

  function getDestek() {
    const add = lsGet('nfx_destek', []);
    const seed = [
      { _id: 'dst-1', konu: 'Fatura yazdırma sorunu', kategori: 'Teknik', durum: 'Çözüldü', tarih: '12.07.2026', oncelik: 'Orta' },
      { _id: 'dst-2', konu: 'WhatsApp şablon onayı bekleniyor (Estetika)', kategori: 'Entegrasyon', durum: 'İşlemde', tarih: '14.07.2026', oncelik: 'Yüksek' },
      { _id: 'dst-3', konu: 'Yeni kullanıcı yetkilendirme talebi', kategori: 'Hesap', durum: 'Açık', tarih: '15.07.2026', oncelik: 'Düşük' }
    ];
    return add.concat(seed);
  }
  function addDestek(obj) { const add = lsGet('nfx_destek', []); const seq = nextSeq(); const rec = Object.assign({ _id: 'dstn-' + seq, durum: 'Açık', tarih: todayStr(false) }, obj); add.unshift(rec); lsSet('nfx_destek', add); return rec; }

  /* ---------- Firma (tedarikçi) ---------- */
  function getFirma() {
    const add = lsGet('nfx_firma', []);
    const seed = [
      { _id: 'fm-1', ad: 'AWS / Sunucu Altyapısı', kategori: 'Altyapı', tel: '-', bakiye: 1800, kur: 'TRY' },
      { _id: 'fm-2', ad: 'Meta (WhatsApp Business API)', kategori: 'Entegrasyon', tel: '-', bakiye: 0, kur: 'TRY' },
      { _id: 'fm-3', ad: 'Netgsm SMS Sağlayıcı', kategori: 'SMS Sağlayıcı', tel: '+90 850 000 00 00', bakiye: 1250, kur: 'TRY' },
      { _id: 'fm-4', ad: 'Beyaz Reklam Ajansı', kategori: 'Pazarlama', tel: '+90 532 111 44 55', bakiye: 42000, kur: 'TRY' },
      { _id: 'fm-5', ad: 'Yıldız Mali Müşavirlik', kategori: 'Muhasebe', tel: '+90 212 777 88 99', bakiye: 3500, kur: 'TRY' }
    ];
    return add.concat(seed);
  }
  function addFirma(obj) { const add = lsGet('nfx_firma', []); const seq = nextSeq(); const rec = Object.assign({ _id: 'fmn-' + seq, bakiye: 0, kur: 'TRY' }, obj); add.unshift(rec); lsSet('nfx_firma', add); return rec; }

  /* ---------- Görevler ---------- */
  function getGorevler() {
    const st = lsGet('nfx_gorev_done', {});
    const add = lsGet('nfx_gorev', []);
    const seed = [
      { _id: 'gr-1', baslik: 'Dentakla Diş Kliniği teklifini takip et', tip: 'Görüşme', tarih: todayStr(false), oncelik: 'Yüksek' },
      { _id: 'gr-2', baslik: 'Estetika için demo sunumu hazırla', tip: 'Demo', tarih: todayStr(false), oncelik: 'Orta' },
      { _id: 'gr-3', baslik: 'Yeni gelen leadleri temsilcilere dağıt', tip: 'Görev', tarih: todayStr(false), oncelik: 'Yüksek' },
      { _id: 'gr-4', baslik: 'Aylık abonelik tahsilatlarını kontrol et', tip: 'Finans', tarih: todayStr(false), oncelik: 'Düşük' }
    ];
    return add.concat(seed).map(g => Object.assign({}, g, { done: !!st[g._id] }));
  }
  function toggleGorev(id) { const st = lsGet('nfx_gorev_done', {}); st[id] = !st[id]; lsSet('nfx_gorev_done', st); }
  function addGorev(obj) { const add = lsGet('nfx_gorev', []); const seq = nextSeq(); const rec = Object.assign({ _id: 'grn-' + seq, tip: 'Görev', tarih: todayStr(false), oncelik: 'Orta' }, obj); add.unshift(rec); lsSet('nfx_gorev', add); return rec; }

  /* ---------- Görüşmeler / Ziyaretler (saha) ---------- */
  const GORUSME_TIPLERI = ['Telefon', 'Yüz yüze', 'Online demo', 'Saha ziyareti', 'WhatsApp'];
  const GORUSME_SONUC = ['İlgilendi', 'Teklif istendi', 'Düşünecek', 'Ulaşılamadı', 'Demo planlandı', 'Sözleşme aşamasına geçti', 'Tekrar aranacak', 'Olumsuz'];
  function getGorusmeler(kurumId) {
    const add = lsGet('nfx_gorusme', {});
    const userList = (add[kurumId] || []);
    const seedList = (_seed.gorusme || []).filter(g => g.kurumId === kurumId);
    return userList.concat(seedList);
  }
  function addGorusme(kurumId, obj) {
    const add = lsGet('nfx_gorusme', {}); const u = currentUser(); const seq = nextSeq();
    const rec = Object.assign({ _id: 'grn-' + seq, kurumId: kurumId, tarih: todayStr(true), temsilci: u ? u.name : 'Sistem' }, obj);
    (add[kurumId] = add[kurumId] || []).unshift(rec); lsSet('nfx_gorusme', add); return rec;
  }
  function allGorusme() {
    const add = lsGet('nfx_gorusme', {}); let out = [];
    Object.keys(add).forEach(k => { out = out.concat(add[k]); });
    return out.concat(_seed.gorusme || []);
  }
  function getSozlesme(kurumId) { return (_seed.sozlesme || []).find(s => s.kurumId === kurumId) || null; }
  function getSozlesmeler() { return (_seed.sozlesme || []).slice(); }

  /* ---------- Kurum geçmişi (ilişkili kayıtlar) ---------- */
  function kurumHistory(id, name) {
    const nm = (name || '').trim().toLowerCase();
    const matchName = (v) => v && String(v).trim().toLowerCase() === nm;
    const gorusmeler = getGorusmeler(id);
    const randevular = getRandevu().filter(r => r.danisanId === id || matchName(r.ad));
    const teklifler = getTeklif().filter(t => t.danisanId === id || matchName(t.ad));
    const satislar = getKasa().filter(k => (parseFloat(k['Tutar']) || 0) >= 0 && matchName(k['Danışan / Firma'] || k['Danışan']));
    const bakiyeler = getBakiye().filter(b => matchName(b['Danışan']));
    const sozlesme = getSozlesme(id);
    let bakiyeTop = 0, bakiyeKur = 'TRY';
    bakiyeler.forEach(b => { bakiyeTop += parseFloat(b['Tutar']) || 0; if (b['Kur']) bakiyeKur = b['Kur']; });
    let satisTop = 0, satisKur = 'TRY';
    satislar.forEach(s => { satisTop += parseFloat(s['Tutar']) || 0; if (s['Kur']) satisKur = s['Kur']; });
    return { gorusmeler, randevular, teklifler, satislar, bakiyeler, sozlesme, bakiyeTop, bakiyeKur, satisTop, satisKur };
  }
  const patientHistory = kurumHistory;

  /* ---------- Raporlar (aggregate) ---------- */
  function groupCount(list, field) {
    const m = {}; list.forEach(d => { const k = (d[field] || '(Boş)').trim() || '(Boş)'; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).map(([k, v]) => ({ key: k, value: v })).sort((a, b) => b.value - a.value);
  }
  function reports() {
    const d = allKurum();
    return {
      total: d.length,
      bySegment: groupCount(d, 'Segment'),
      byTemsilci: groupCount(d, 'Satış temsilcisi'),
      byReferans: groupCount(d, 'Referans kaynağı'),
      byTip: groupCount(d, 'Kurum tipi'),
      byUlke: groupCount(d, 'Şehir'),
      byMonth: monthTrend(d, 'Kayıt tarihi')
    };
  }
  function monthTrend(list, field) {
    const m = {};
    list.forEach(d => { const dt = parseDate(d[field]); if (!dt) return; const key = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); m[key] = (m[key] || 0) + 1; });
    return Object.entries(m).map(([k, v]) => ({ key: k, value: v })).sort((a, b) => a.key < b.key ? -1 : 1);
  }

  /* ---------- Tarih yardımcıları ---------- */
  function parseDate(s) { if (!s) return null; const m = /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/.exec(s); if (!m) return null; return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)); }
  function fmt(d, withTime) { const p = x => String(x).padStart(2, '0'); let s = p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); if (withTime) s += ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); return s; }
  function todayStr(withTime) { return fmt(new Date(), withTime); }

  const API = {
    ready: loadSeed, USERS, login, currentUser, logout, requireAuth, nav, param, currentPage,
    getDanisan, getDanisanById, updateDanisan, addDanisan,
    getKurum, getKurumById, updateKurum, addKurum, STAGES, KURUM_TIPLERI,
    getGorusmeler, addGorusme, allGorusme, GORUSME_TIPLERI, GORUSME_SONUC,
    getSozlesme, getSozlesmeler,
    findIdByName, hrefForName,
    getLeads, convertLead, salesSegments,
    getNotes, addNote,
    getDinamik, getDinamikDue, setDinamikResult,
    getKasa, addKasa, kasaTotals, getBakiye, getGelir, getGider,
    getRandevu, addRandevu, setRandevuStatus, RND_STATUS, RND_TYPES,
    getTeklif, addTeklif, setTeklifStatus, teklifStatusMeta, HIZMETLER,
    getDefs, addDef, getDestek, addDestek,
    getFirma, addFirma, getGorevler, toggleGorev, addGorev,
    patientHistory, kurumHistory,
    reports, parseDate, fmt, todayStr,
    exportExcel, exportPDF,
    resetAll: function () { Object.values(K).forEach(k => LS.removeItem(k)); }
  };
  /* ---------- Dışa aktarma (Excel / PDF) ---------- */
  function _esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function _downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }
  function exportExcel(filename, headers, rows) {
    let h = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">';
    h += '<tr>' + headers.map(x => '<th style="background:#241854;color:#fff;font-family:Arial">' + _esc(x) + '</th>').join('') + '</tr>';
    rows.forEach(r => { h += '<tr>' + r.map(c => '<td style="font-family:Arial;mso-number-format:\'@\'">' + _esc(c) + '</td>').join('') + '</tr>'; });
    h += '</table></body></html>';
    _downloadBlob(new Blob(['\ufeff' + h], { type: 'application/vnd.ms-excel' }), (filename || 'nefalix') + '.xls');
  }
  function exportPDF(title, headers, rows) {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    let h = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + _esc(title) + '</title><style>';
    h += 'body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#241854;}';
    h += '.hd{display:flex;align-items:center;gap:12px;border-bottom:3px solid #4338ca;padding-bottom:12px;margin-bottom:16px;}';
    h += '.hd .b{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#22d3ee);}';
    h += 'h1{font-size:20px;margin:0;} .sub{font-size:11px;color:#8b87a8;margin-top:2px;}';
    h += 'table{width:100%;border-collapse:collapse;font-size:11px;} th{background:#241854;color:#fff;text-align:left;padding:7px 9px;}';
    h += 'td{padding:6px 9px;border-bottom:1px solid #eee;} tr:nth-child(even) td{background:#f7f6fc;}';
    h += '@page{size:landscape;margin:12mm;}</style></head><body>';
    h += '<div class="hd"><div class="b"></div><div><h1>Nefalix — ' + _esc(title) + '</h1><div class="sub">' + rows.length + ' kayıt · ' + todayStr(true) + '</div></div></div>';
    h += '<table><thead><tr>' + headers.map(x => '<th>' + _esc(x) + '</th>').join('') + '</tr></thead><tbody>';
    rows.forEach(r => { h += '<tr>' + r.map(c => '<td>' + _esc(c) + '</td>').join('') + '</tr>'; });
    h += '</tbody></table></body></html>';
    doc.open(); doc.write(h); doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => { try { iframe.contentWindow.print(); } catch (e) {} setTimeout(() => { try { document.body.removeChild(iframe); } catch (e) {} }, 1500); }, 350);
  }

  window.Nefalix = API;

  /* ---------- Otomatik giriş koruması / gezinme ---------- */
  // Tıklama yakalayıcı HER ZAMAN eklenir; sadece tek dosya modunda iş görür.
  document.addEventListener('click', function (e) {
    if (!isSingle()) return;
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/\.dc\.html(\?|#|$)/i.test(href)) { e.preventDefault(); nav(href); }
  }, true);
  // Giriş yönlendirmesi bir tik ertelenir: bu ana kadar (varsa) __NFX_SEED yüklenmiş olur,
  // böylece tek dosya modunda yanlışlıkla Login.dc.html'e gidilmez.
  setTimeout(function () {
    if (isSingle()) return; // tek dosya: yönlendirmeyi shell yönetir
    try {
      var _f = (location.pathname.split('/').pop() || '').toLowerCase();
      var _isLogin = _f.indexOf('login') === 0;
      if (!_isLogin && !currentUser()) { location.href = 'Login.dc.html'; }
    } catch (e) { /* yoksay */ }
  }, 0);
})();
