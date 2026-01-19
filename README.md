# FriendsPomodoro (Focus Timer) 🎯

Gerçek zamanlı, fizik tabanlı ve sosyal etkileşimli bir Pomodoro / Odaklanma uygulaması. Arkadaşlarınızla aynı odada toplanın, çalışma sürelerinizi basketbol topu arayüzüyle belirleyin ve birlikte odaklanın.

## 📸 Galeri

### Ekran Görüntüleri
| Çalışma Modu (Turuncu) | Mola Modu (Mavi) |
|:---:|:---:|
| ![Çalışma Modu](<img width="1913" height="892" alt="Ekran Resmi 2026-01-19 14 20 27" src="https://github.com/user-attachments/assets/4df1aec1-92f4-4db6-9398-8757a1c6d134" />) | ![Mola Modu](<img width="1913" height="892" alt="Ekran Resmi 2026-01-19 14 20 31" src="https://github.com/user-attachments/assets/c3d86f3b-6e75-4a52-9482-fd4815bbe7b8" />) |

## ✨ Özellikler

- **🏀 Fizik Tabanlı UI**: `Matter.js` ile güçlendirilmiş, yerçekimi ve çarpışma efektlerine sahip interaktif zaman seçici. Topları potaya atarak süreyi başlatın!
- **🤝 Gerçek Zamanlı Odalar**: Arkadaşlarınızla aynı odaya katılın (Socket.io), kimlerin aktif olduğunu ve hangi modda (çalışma/mola) olduklarını anlık görün.
- **⏱️ Çalışma & Mola Modları**: 
  - Özel çalışma süreleri belirleyin (Renkli toplar: Turuncu).
  - Mola süreleri belirleyin (Renkli toplar: Mavi).
  - Modlar arası geçiş yapıldığında arayüz ve fizik motoru anında tepki verir.
- **📊 Canlı İstatistikler**: Toplam çalışma ve mola sürelerinizi anlık olarak takip edin.
- **🔔 Sesli Bildirimler**: Zamanlayıcı tamamlandığında veya duraklatıldığında özel ses efektleri.
- **🔗 Kolay Paylaşım**: Tek tıkla oda linkini kopyalayıp arkadaşlarınızı davet edin.

## 🛠️ Teknolojiler

### Frontend (Client)
- **React 19**: Modern UI geliştirme.
- **Vite**: Hızlı geliştirme sunucusu ve build aracı.
- **Matter.js**: 2D fizik motoru (Toplar, pota ve yerçekimi efektleri için).
- **Socket.io-client**: Sunucu ile gerçek zamanlı iletişim.
- **React Router**: Sayfa yönlendirmeleri.
- **CSS3**: Modern ve responsive tasarım.

### Backend (Server)
- **Node.js & Express**: Sunucu altyapısı.
- **Socket.io**: WebSocket tabanlı gerçek zamanlı event yönetimi (Oda yönetimi, timer senkronizasyonu).
- **In-Memory State**: Odalar ve kullanıcı verileri sunucu hafızasında tutulur (Hızlı ve geçici).

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Ön Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn

### 1. Repoyu Klonlayın
```bash
git clone https://github.com/kullaniciadi/FriendsPomodoro.git
cd FriendsPomodoro
```

### 2. Backend (Server) Kurulumu
```bash
cd server
npm install
npm run dev
```
Server `http://localhost:3001` portunda çalışacaktır.

### 3. Frontend (Client) Kurulumu
Yeni bir terminal açın ve client klasörüne gidin:
```bash
cd client
npm install
npm run dev
```
Client genellikle `http://localhost:5173` (veya uygun bir portta, örn: 5174, 5175) çalışacaktır.

## 📁 Proje Yapısı

```
Focus/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # PhysicsWorld, TimeSelector vb.
│   │   ├── hooks/          # Custom hooks (useRoom)
│   │   ├── pages/          # Room, Home sayfaları
│   │   └── utils/          # Socket, sesler vb.
│   └── ...
├── server/                 # Node.js Backend
│   ├── index.js           # Server giriş noktası
│   ├── roomManager.js     # Oda durum yönetimi
│   └── timerEngine.js     # Zamanlayıcı motoru
└── README.md
```

## 🤝 Katkıda Bulunma

1. Bu repoyu fork'layın.
2. Yeni bir feature branch oluşturun (`git checkout -b feature/AmazingFeature`).
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`).
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`).
5. Bir Pull Request oluşturun.

## 📝 Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakabilirsiniz.
